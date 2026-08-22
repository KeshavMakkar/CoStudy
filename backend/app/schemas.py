from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field


# --- Availability Schemas ---
class AvailabilitySlotBase(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
    start_hour: float = Field(..., ge=0, le=24)
    end_hour: float = Field(..., ge=0, le=24)

class AvailabilitySlotCreate(AvailabilitySlotBase):
    pass

class AvailabilitySlotOut(AvailabilitySlotBase):
    id: int
    student_id: int

    class Config:
        from_attributes = True


# --- Topic Rating Schemas ---
class TopicRatingBase(BaseModel):
    course_code: str
    topic_name: str
    rating: int = Field(..., ge=1, le=5)

class TopicRatingCreate(TopicRatingBase):
    pass

class TopicRatingOut(TopicRatingBase):
    id: int
    student_id: int

    class Config:
        from_attributes = True


# --- Course Schemas ---
class CourseBase(BaseModel):
    code: str
    name: str
    department: str
    topics_json: Optional[str] = "[]"

class CourseCreate(CourseBase):
    pass

class CourseOut(CourseBase):
    id: int
    topics: List[str] = []

    class Config:
        from_attributes = True


# --- Student Schemas ---
class StudentBase(BaseModel):
    name: str
    email: str
    major: str = "Computer Science"
    year: str = "Sophomore"
    avatar: Optional[str] = ""
    bio: Optional[str] = ""
    preferred_group_size: int = 4

class StudentCreate(StudentBase):
    course_codes: List[str] = []
    availability: List[AvailabilitySlotCreate] = []
    topic_ratings: List[TopicRatingCreate] = []

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    major: Optional[str] = None
    year: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    preferred_group_size: Optional[int] = None
    course_codes: Optional[List[str]] = None
    availability: Optional[List[AvailabilitySlotCreate]] = None
    topic_ratings: Optional[List[TopicRatingCreate]] = None

class StudentOut(StudentBase):
    id: int
    created_at: datetime
    courses: List[CourseOut] = []
    current_group_id: Optional[int] = None

    class Config:
        from_attributes = True

class StudentDetailOut(StudentOut):
    availability_slots: List[AvailabilitySlotOut] = []
    topic_ratings: List[TopicRatingOut] = []


# --- Group Schemas ---
class GroupMemberOut(BaseModel):
    student_id: int
    name: str
    email: str
    major: str
    year: str
    avatar: str
    role: str
    joined_at: datetime
    courses: List[str] = []

    class Config:
        from_attributes = True

class GroupOut(BaseModel):
    id: int
    name: str
    avg_compatibility: float
    shared_courses: List[str] = []
    shared_hours: float
    member_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class GroupDetailOut(GroupOut):
    members: List[GroupMemberOut] = []
    explanation_data: Dict[str, Any] = {}
    heatmap_data: Dict[str, Any] = {}


# --- Message Schemas ---
class MessageCreate(BaseModel):
    student_id: Optional[int] = None
    student_name: str
    avatar: Optional[str] = ""
    content: str

class MessageOut(BaseModel):
    id: int
    group_id: int
    student_id: Optional[int] = None
    student_name: str
    avatar: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Matching & Algorithm Schemas ---
class MatchRequest(BaseModel):
    weights: Optional[Dict[str, float]] = None
    min_threshold: Optional[float] = 0.15
    target_min_size: Optional[int] = 3
    target_max_size: Optional[int] = 5

class MatchResponse(BaseModel):
    message: str
    total_students_matched: int
    total_groups_formed: int
    groups: List[GroupDetailOut]

class RematchRequest(BaseModel):
    student_id: Optional[int] = None
    weights: Optional[Dict[str, float]] = None
    min_threshold: Optional[float] = 0.15

class GraphNode(BaseModel):
    id: str
    name: str
    major: str
    courses: List[str]
    group_id: Optional[int] = None
    avatar: str

class GraphEdge(BaseModel):
    source: str
    target: str
    weight: float
    shared_courses: List[str]
    shared_hours: float

class GraphDataOut(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    groups: List[Dict[str, Any]]
