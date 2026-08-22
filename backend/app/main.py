"""
StudyMatch - Peer-Matched Study Group Finder API
FastAPI Backend Application
"""

import json
from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
from app.models import Student, Course, StudentCourse, AvailabilitySlot, TopicRating, Group, GroupMember, Message
from app.schemas import (
    StudentCreate, StudentUpdate, StudentOut, StudentDetailOut,
    CourseOut,
    GroupOut, GroupDetailOut, GroupMemberOut,
    MessageCreate, MessageOut,
    MatchRequest, MatchResponse, RematchRequest,
    GraphDataOut, GraphNode, GraphEdge
)
from app.matching_engine import (
    compute_compatibility_score,
    build_graph,
    detect_communities,
    generate_explanation,
    generate_group_availability_heatmap,
    rematch_student,
    DEFAULT_WEIGHTS
)
from app.seed_data import seed_database

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="StudyMatch API",
    description="Peer-Matched Study Group Finder for College Students using Graph Community Detection",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Startup event to auto-seed if empty
@app.on_event("startup")
def startup_event():
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        if db.query(Student).count() == 0:
            print("[INFO] Initializing StudyMatch database with mock college students and courses...")
            seed_database(db)
    except Exception as e:
        print(f"[WARN] Startup seed exception: {e}")
    finally:
        db.close()


# Helper function to serialize student model to dict for matching engine
def _student_to_engine_dict(student: Student) -> Dict[str, Any]:
    courses = [c.code for c in student.courses]
    availability = [
        {"day": slot.day_of_week, "start": slot.start_hour, "end": slot.end_hour}
        for slot in student.availability_slots
    ]
    topic_ratings: Dict[str, Dict[str, float]] = {}
    for tr in student.topic_ratings:
        if tr.course_code not in topic_ratings:
            topic_ratings[tr.course_code] = {}
        topic_ratings[tr.course_code][tr.topic_name] = float(tr.rating)

    return {
        "id": str(student.id),
        "name": student.name,
        "email": student.email,
        "major": student.major,
        "year": student.year,
        "avatar": student.avatar,
        "bio": student.bio,
        "courses": courses,
        "availability": availability,
        "topic_ratings": topic_ratings
    }


def _get_student_current_group_id(student_id: int, db: Session) -> Optional[int]:
    membership = db.query(GroupMember).filter(GroupMember.student_id == student_id).first()
    return membership.group_id if membership else None


@app.get("/")
def root():
    return {
        "message": "Welcome to StudyMatch API",
        "docs_url": "/docs",
        "status": "online"
    }


@app.get("/api/health")
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    student_count = db.query(Student).count()
    course_count = db.query(Course).count()
    group_count = db.query(Group).count()
    return {
        "status": "healthy",
        "total_students": student_count,
        "total_courses": course_count,
        "total_groups": group_count
    }


@app.post("/api/seed")
@app.post("/seed")
def trigger_seed(db: Session = Depends(get_db)):
    seed_database(db)
    return {"message": "Database successfully re-seeded with realistic mock college students and courses."}


# --- Course Endpoints ---
@app.get("/api/courses", response_model=List[CourseOut])
@app.get("/courses", response_model=List[CourseOut])
def get_courses(db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    results = []
    for c in courses:
        topics = json.loads(c.topics_json) if c.topics_json else []
        results.append(CourseOut(
            id=c.id,
            code=c.code,
            name=c.name,
            department=c.department,
            topics_json=c.topics_json,
            topics=topics
        ))
    return results


# --- Student Endpoints ---
@app.get("/api/students", response_model=List[StudentOut])
@app.get("/students", response_model=List[StudentOut])
def get_students(db: Session = Depends(get_db)):
    students = db.query(Student).all()
    results = []
    for s in students:
        c_list = [
            CourseOut(
                id=c.id,
                code=c.code,
                name=c.name,
                department=c.department,
                topics_json=c.topics_json,
                topics=json.loads(c.topics_json) if c.topics_json else []
            )
            for c in s.courses
        ]
        results.append(StudentOut(
            id=s.id,
            name=s.name,
            email=s.email,
            major=s.major,
            year=s.year,
            avatar=s.avatar or "",
            bio=s.bio or "",
            preferred_group_size=s.preferred_group_size,
            created_at=s.created_at,
            courses=c_list,
            current_group_id=_get_student_current_group_id(s.id, db)
        ))
    return results


@app.get("/api/students/{student_id}", response_model=StudentDetailOut)
@app.get("/students/{student_id}", response_model=StudentDetailOut)
def get_student(student_id: int, db: Session = Depends(get_db)):
    s = db.query(Student).filter(Student.id == student_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")

    c_list = [
        CourseOut(
            id=c.id,
            code=c.code,
            name=c.name,
            department=c.department,
            topics_json=c.topics_json,
            topics=json.loads(c.topics_json) if c.topics_json else []
        )
        for c in s.courses
    ]

    return StudentDetailOut(
        id=s.id,
        name=s.name,
        email=s.email,
        major=s.major,
        year=s.year,
        avatar=s.avatar or "",
        bio=s.bio or "",
        preferred_group_size=s.preferred_group_size,
        created_at=s.created_at,
        courses=c_list,
        current_group_id=_get_student_current_group_id(s.id, db),
        availability_slots=s.availability_slots,
        topic_ratings=s.topic_ratings
    )


@app.post("/api/students", response_model=StudentDetailOut, status_code=status.HTTP_201_CREATED)
@app.post("/students", response_model=StudentDetailOut, status_code=status.HTTP_201_CREATED)
def create_student(student_in: StudentCreate, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(Student).filter(Student.email == student_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student with this email already exists")

    new_student = Student(
        name=student_in.name,
        email=student_in.email,
        major=student_in.major,
        year=student_in.year,
        avatar=student_in.avatar or f"https://api.dicebear.com/7.x/avataaars/svg?seed={student_in.name}",
        bio=student_in.bio or "",
        preferred_group_size=student_in.preferred_group_size
    )
    db.add(new_student)
    db.flush()

    # Link courses
    for code in student_in.course_codes:
        course = db.query(Course).filter(Course.code == code).first()
        if course:
            db.add(StudentCourse(student_id=new_student.id, course_id=course.id))

    # Add availability slots
    for slot in student_in.availability:
        db.add(AvailabilitySlot(
            student_id=new_student.id,
            day_of_week=slot.day_of_week,
            start_hour=slot.start_hour,
            end_hour=slot.end_hour
        ))

    # Add topic ratings
    for tr in student_in.topic_ratings:
        db.add(TopicRating(
            student_id=new_student.id,
            course_code=tr.course_code,
            topic_name=tr.topic_name,
            rating=tr.rating
        ))

    db.commit()
    db.refresh(new_student)
    return get_student(new_student.id, db)


# --- Matching Engine Endpoints ---
@app.post("/api/match", response_model=MatchResponse)
@app.post("/match", response_model=MatchResponse)
def trigger_matching(req: MatchRequest = MatchRequest(), db: Session = Depends(get_db)):
    """
    Executes the full graph-based Louvain community matching algorithm across all registered students.
    Creates and persists balanced study groups (3-5 members), calculates synergy explanations,
    and generates availability heatmaps.
    """
    students = db.query(Student).all()
    if len(students) < 2:
        raise HTTPException(status_code=400, detail="At least 2 students are required to run matching.")

    # Convert students to engine input format
    engine_students = [_student_to_engine_dict(s) for s in students]
    students_dict = {s["id"]: s for s in engine_students}

    # 1. Build weighted NetworkX compatibility graph
    weights = req.weights or DEFAULT_WEIGHTS
    min_threshold = req.min_threshold if req.min_threshold is not None else 0.15
    G = build_graph(engine_students, weights=weights, min_threshold=min_threshold)

    # 2. Run Louvain community detection with size bounding (3-5 members)
    target_min = req.target_min_size or 3
    target_max = req.target_max_size or 5
    community_groups = detect_communities(
        G, 
        target_min_size=target_min, 
        target_max_size=target_max
    )

    # 3. Clean existing groups and recreate
    db.query(Message).delete()
    db.query(GroupMember).delete()
    db.query(Group).delete()
    db.commit()

    saved_groups = []
    group_counter = 1

    for member_ids in community_groups:
        if not member_ids:
            continue
            
        group_members_data = [students_dict[m_id] for m_id in member_ids if m_id in students_dict]
        if not group_members_data:
            continue

        # Compute group explanation and heatmap
        exp_data = generate_explanation(member_ids, students_dict)
        heatmap_data = exp_data.get("heatmap", generate_group_availability_heatmap(group_members_data))
        
        # Calculate average pairwise compatibility within group
        pairwise_scores = []
        n_m = len(group_members_data)
        for i in range(n_m):
            for j in range(i + 1, n_m):
                comp = compute_compatibility_score(group_members_data[i], group_members_data[j], weights)
                pairwise_scores.append(comp["total_score"])
        avg_comp = float(round(sum(pairwise_scores) / len(pairwise_scores), 4)) if pairwise_scores else 0.85

        shared_courses = exp_data.get("shared_courses", [])
        c_label = " & ".join(shared_courses[:2]) if shared_courses else "Academic Synergy"
        group_name = f"Study Cohort {group_counter}: {c_label}"

        db_group = Group(
            name=group_name,
            avg_compatibility=avg_comp,
            shared_courses_json=json.dumps(shared_courses),
            shared_hours=float(exp_data.get("shared_free_hours_count", 0.0)),
            explanation=exp_data.get("summary", "")
        )
        db.add(db_group)
        db.flush()

        # Add Group Members
        for m_id in member_ids:
            member_entry = GroupMember(
                group_id=db_group.id,
                student_id=int(m_id),
                role="Member"
            )
            db.add(member_entry)

        # Add initial welcome message
        welcome_msg = Message(
            group_id=db_group.id,
            student_id=int(member_ids[0]),
            student_name=group_members_data[0]["name"],
            avatar=group_members_data[0]["avatar"],
            content=f"Hey team! StudyMatch formed our group around {c_label}. Looking forward to studying together!"
        )
        db.add(welcome_msg)
        
        group_counter += 1

    db.commit()

    # Query and return formatted group details
    all_groups = db.query(Group).all()
    out_groups = [_format_group_detail(g, db) for g in all_groups]

    return MatchResponse(
        message="Matching algorithm executed successfully with Louvain Community Detection.",
        total_students_matched=len(students),
        total_groups_formed=len(out_groups),
        groups=out_groups
    )


def _format_group_detail(group: Group, db: Session) -> GroupDetailOut:
    members = []
    engine_members = []
    
    for gm in group.members:
        s = gm.student
        if s:
            s_courses = [c.code for c in s.courses]
            members.append(GroupMemberOut(
                student_id=s.id,
                name=s.name,
                email=s.email,
                major=s.major,
                year=s.year,
                avatar=s.avatar or "",
                role=gm.role,
                joined_at=gm.joined_at,
                courses=s_courses
            ))
            engine_members.append(_student_to_engine_dict(s))

    students_dict = {m["id"]: m for m in engine_members}
    member_ids = [m["id"] for m in engine_members]
    
    exp_data = generate_explanation(member_ids, students_dict)
    heatmap_data = exp_data.get("heatmap", generate_group_availability_heatmap(engine_members))
    shared_courses = json.loads(group.shared_courses_json) if group.shared_courses_json else []

    return GroupDetailOut(
        id=group.id,
        name=group.name,
        avg_compatibility=group.avg_compatibility,
        shared_courses=shared_courses,
        shared_hours=group.shared_hours,
        member_count=len(members),
        created_at=group.created_at,
        members=members,
        explanation_data=exp_data,
        heatmap_data=heatmap_data
    )


@app.get("/api/groups", response_model=List[GroupDetailOut])
@app.get("/groups", response_model=List[GroupDetailOut])
def get_groups(db: Session = Depends(get_db)):
    groups = db.query(Group).all()
    return [_format_group_detail(g, db) for g in groups]


@app.get("/api/groups/{group_id}", response_model=GroupDetailOut)
@app.get("/groups/{group_id}", response_model=GroupDetailOut)
def get_group(group_id: int, db: Session = Depends(get_db)):
    g = db.query(Group).filter(Group.id == group_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    return _format_group_detail(g, db)


# --- Rematch Endpoints ---
@app.post("/api/groups/{group_id}/rematch")
@app.post("/groups/{group_id}/rematch")
def rematch_group(group_id: int, req: RematchRequest = RematchRequest(), db: Session = Depends(get_db)):
    """
    Reconfigures a specific study group by evaluating alternative assignments
    for its members or running full community re-balancing.
    """
    target_group = db.query(Group).filter(Group.id == group_id).first()
    if not target_group:
        raise HTTPException(status_code=404, detail="Group not found")

    members = [m.student_id for m in target_group.members]
    if not members:
        return {"success": True, "message": "Group is already empty."}

    # Use first member to initiate dynamic re-assignment across cohorts
    first_member_id = members[0]
    return rematch_single_student(student_id=first_member_id, req=req, db=db)


@app.post("/api/students/{student_id}/rematch")
@app.post("/students/{student_id}/rematch")
def rematch_single_student(student_id: int, req: RematchRequest = RematchRequest(), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    all_students = db.query(Student).all()
    engine_students = [_student_to_engine_dict(s) for s in all_students]
    
    current_groups = db.query(Group).all()
    current_group_lists = [
        [str(m.student_id) for m in g.members]
        for g in current_groups
    ]

    rematch_res = rematch_student(
        student_id=str(student_id),
        current_groups=current_group_lists,
        all_students=engine_students,
        weights=req.weights,
        min_threshold=req.min_threshold or 0.15
    )

    # Apply re-assignment to database
    if rematch_res.get("success"):
        # Clear existing memberships and update with new groupings
        db.query(GroupMember).delete()
        for idx, grp_list in enumerate(rematch_res.get("groups", [])):
            if idx < len(current_groups):
                target_g = current_groups[idx]
            else:
                target_g = Group(name=f"Study Cohort {idx+1}")
                db.add(target_g)
                db.flush()
                
            for m_id in grp_list:
                db.add(GroupMember(group_id=target_g.id, student_id=int(m_id)))
        db.commit()

    return {
        "success": True,
        "message": f"Rematch successfully reconfigured for {student.name}",
        "action": rematch_res.get("action", "reassigned"),
        "new_group_id": _get_student_current_group_id(student_id, db)
    }


# --- Discussion Board Endpoints ---
@app.get("/api/groups/{group_id}/messages", response_model=List[MessageOut])
@app.get("/groups/{group_id}/messages", response_model=List[MessageOut])
def get_group_messages(group_id: int, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    messages = db.query(Message).filter(Message.group_id == group_id).order_by(Message.created_at.asc()).all()
    return messages


@app.post("/api/groups/{group_id}/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
@app.post("/groups/{group_id}/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def post_group_message(group_id: int, msg_in: MessageCreate, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    new_msg = Message(
        group_id=group_id,
        student_id=msg_in.student_id,
        student_name=msg_in.student_name,
        avatar=msg_in.avatar or f"https://api.dicebear.com/7.x/avataaars/svg?seed={msg_in.student_name}",
        content=msg_in.content
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg


# --- Graph Visualization Endpoint ---
@app.get("/api/graph", response_model=GraphDataOut)
@app.get("/graph", response_model=GraphDataOut)
def get_compatibility_graph(
    min_threshold: float = Query(0.15, description="Edge cutoff threshold"),
    w_course: float = Query(0.40),
    w_availability: float = Query(0.35),
    w_skill: float = Query(0.25),
    db: Session = Depends(get_db)
):
    """
    Returns the network graph of students and compatibility edges,
    including current Louvain community grouping for visual rendering.
    """
    students = db.query(Student).all()
    engine_students = [_student_to_engine_dict(s) for s in students]
    
    weights = {"w_course": w_course, "w_availability": w_availability, "w_skill": w_skill}
    G = build_graph(engine_students, weights=weights, min_threshold=min_threshold)

    # Nodes
    nodes = []
    for s in students:
        c_codes = [c.code for c in s.courses]
        nodes.append(GraphNode(
            id=str(s.id),
            name=s.name,
            major=s.major,
            courses=c_codes,
            group_id=_get_student_current_group_id(s.id, db),
            avatar=s.avatar or ""
        ))

    # Edges
    edges = []
    for u, v, data in G.edges(data=True):
        edges.append(GraphEdge(
            source=str(u),
            target=str(v),
            weight=float(round(data.get("weight", 0.0), 3)),
            shared_courses=data.get("shared_courses", []),
            shared_hours=float(round(data.get("shared_hours", 0.0), 1))
        ))

    # Groups
    groups = db.query(Group).all()
    groups_data = [
        {"id": g.id, "name": g.name, "avg_compatibility": g.avg_compatibility, "member_ids": [m.student_id for m in g.members]}
        for g in groups
    ]

    return GraphDataOut(
        nodes=nodes,
        edges=edges,
        groups=groups_data
    )
