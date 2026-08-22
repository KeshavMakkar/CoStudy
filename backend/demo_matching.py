"""
StudyMatch - Standalone Matching Algorithm Demo Runner
Runs the full compatibility pipeline on sample student data and prints readable reports.
"""

import sys
import os

# Set standard UTF-8 output if supported
if sys.platform == "win32":
    os.system("")

from app.matching_engine import (
    compute_compatibility_score,
    build_graph,
    detect_communities,
    generate_explanation
)
from app.seed_data import MOCK_STUDENTS

def run_demo():
    print("=" * 70)
    print("[*] STUDYMATCH - PEER-MATCHED STUDY GROUP FINDER (ALGORITHM DEMO)")
    print("=" * 70)
    print(f"Loaded {len(MOCK_STUDENTS)} mock student profiles.")
    
    # Format students
    formatted_students = []
    for idx, s in enumerate(MOCK_STUDENTS):
        formatted_students.append({
            "id": str(idx + 1),
            "name": s["name"],
            "major": s["major"],
            "courses": s["courses"],
            "availability": s["availability"],
            "topic_ratings": s["ratings"]
        })

    # 1. Pairwise compatibility sample
    print("\n[1] SAMPLE PAIRWISE COMPATIBILITY CALCULATION:")
    s1, s2 = formatted_students[0], formatted_students[1]
    comp = compute_compatibility_score(s1, s2)
    print(f"Comparing {s1['name']} & {s2['name']}:")
    print(f"  - Shared Courses: {comp['shared_courses']} (Jaccard: {comp['course_overlap']:.3f})")
    print(f"  - Overlapping Free Hours: {comp['shared_hours']} hrs/week (Avail Score: {comp['availability_overlap']:.3f})")
    print(f"  - Skill Complementarity Score: {comp['complementary_skill_score']:.3f}")
    print(f"  - Weighted Compatibility Score: {comp['total_score']:.3f}")
    if comp["synergies"]:
        print(f"  - Peer-Teaching Synergies:")
        for syn in comp["synergies"]:
            print(f"     -> {syn}")

    # 2. Build NetworkX Graph
    print("\n[2] BUILDING WEIGHTED NETWORKX GRAPH:")
    G = build_graph(formatted_students, min_threshold=0.15)
    print(f"  - Nodes (Students): {len(G.nodes)}")
    print(f"  - Edges (Viable Compatibility Pairs >= 0.15): {len(G.edges)}")

    # 3. Louvain Community Detection
    print("\n[3] RUNNING LOUVAIN COMMUNITY DETECTION (Target Size: 3-5):")
    groups = detect_communities(G, target_min_size=3, target_max_size=5)
    print(f"  - Formed {len(groups)} distinct balanced study groups.")

    # 4. Group Explanations & Synergies
    students_dict = {s["id"]: s for s in formatted_students}
    print("\n[4] GENERATED GROUP EXPLANATIONS & PEER-TEACHING BREAKDOWNS:")
    for idx, group_ids in enumerate(groups, 1):
        group_names = [students_dict[gid]["name"] for gid in group_ids]
        exp = generate_explanation(group_ids, students_dict)
        print(f"\n--- [COHORT #{idx}] ({len(group_ids)} members): {', '.join(group_names)} ---")
        print(f"  Shared Focus: {', '.join(exp['shared_courses'])}")
        print(f"  Schedule: {exp['shared_hours_text']}")
        print(f"  Match Rationale: {exp['summary']}")
        if exp["peer_teaching_synergies"]:
            print(f"  Mentorship Opportunities:")
            for syn in exp["peer_teaching_synergies"][:2]:
                print(f"    * {syn}")
                
    print("\n" + "=" * 70)
    print("[SUCCESS] Algorithm execution complete!")
    print("=" * 70)

if __name__ == "__main__":
    run_demo()
