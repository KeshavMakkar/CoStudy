"""
Unit tests for StudyMatch Matching Engine
"""
import pytest
from app.matching_engine import (
    compute_course_overlap,
    compute_availability_overlap,
    compute_complementary_skill_score,
    compute_compatibility_score,
    build_graph,
    detect_communities,
    generate_explanation,
    generate_group_availability_heatmap,
    rematch_student
)

def test_course_overlap():
    # Identical courses: Jaccard = 1.0
    score, shared = compute_course_overlap({"CS106B", "MATH51"}, {"CS106B", "MATH51"})
    assert score == 1.0
    assert set(shared) == {"CS106B", "MATH51"}

    # Partial overlap: 1 shared out of 3 total -> Jaccard = 1/3 = 0.3333
    score, shared = compute_course_overlap({"CS106B", "PHYS41"}, {"CS106B", "MATH51"})
    assert round(score, 4) == 0.3333
    assert shared == ["CS106B"]

    # Disjoint courses
    score, shared = compute_course_overlap({"CS106B"}, {"MATH51"})
    assert score == 0.0
    assert shared == []


def test_availability_overlap():
    # Alice free Mon 9-12 (3 hrs) and Tue 14-16 (2 hrs)
    slots_a = [
        {"day": 0, "start": 9.0, "end": 12.0},
        {"day": 1, "start": 14.0, "end": 16.0}
    ]
    # Bob free Mon 10-14 (Mon 10-12 overlaps -> 2 hrs) and Tue 15-18 (Tue 15-16 overlaps -> 1 hr)
    slots_b = [
        {"day": 0, "start": 10.0, "end": 14.0},
        {"day": 1, "start": 15.0, "end": 18.0}
    ]
    res = compute_availability_overlap(slots_a, slots_b, target_benchmark_hours=8.0)
    assert res["total_shared_hours"] == 3.0
    assert round(res["availability_overlap_score"], 4) == round(3.0 / 8.0, 4)
    assert len(res["overlapping_slots_by_day"][0]) == 1  # Monday overlap
    assert len(res["overlapping_slots_by_day"][1]) == 1  # Tuesday overlap


def test_complementary_skill_score():
    # Alice strong in Recursion (5) weak in DP (1)
    # Bob weak in Recursion (2) strong in DP (5)
    topics_a = {
        "CS106B": {"Recursion": 5, "Dynamic Programming": 1}
    }
    topics_b = {
        "CS106B": {"Recursion": 2, "Dynamic Programming": 5}
    }
    res = compute_complementary_skill_score(topics_a, topics_b, ["CS106B"])
    # Divergence: |5-2|/4 = 0.75; |1-5|/4 = 1.0; avg = 0.875 + bidirectional bonus (0.25) -> capped at 1.0
    assert res["complementary_skill_score"] >= 0.8
    assert len(res["teaching_a_to_b"]) == 1  # Alice mentors Bob in Recursion
    assert len(res["teaching_b_to_a"]) == 1  # Bob mentors Alice in DP


def test_compute_compatibility_score():
    student_a = {
        "id": "1",
        "name": "Alice",
        "courses": ["CS106B", "MATH51"],
        "availability": [{"day": 0, "start": 9.0, "end": 12.0}],
        "topic_ratings": {"CS106B": {"Recursion": 5, "Graphs": 1}}
    }
    student_b = {
        "id": "2",
        "name": "Bob",
        "courses": ["CS106B", "CS161"],
        "availability": [{"day": 0, "start": 9.0, "end": 12.0}],
        "topic_ratings": {"CS106B": {"Recursion": 2, "Graphs": 5}}
    }
    score_data = compute_compatibility_score(student_a, student_b)
    assert score_data["total_score"] > 0.4
    assert "CS106B" in score_data["shared_courses"]
    assert score_data["shared_hours"] == 3.0


def test_louvain_communities_and_explanation():
    # Create 8 mock students
    students = [
        {
            "id": f"s_{i}",
            "name": f"Student_{i}",
            "courses": ["CS106B", "MATH51"] if i < 4 else ["PHYS41", "CHEM20"],
            "availability": [{"day": 0, "start": 10.0, "end": 14.0}],
            "topic_ratings": {
                "CS106B": {"Recursion": 5 if i % 2 == 0 else 1, "Graphs": 1 if i % 2 == 0 else 5},
                "PHYS41": {"Mechanics": 5 if i % 2 == 0 else 2}
            }
        }
        for i in range(8)
    ]
    
    G = build_graph(students, min_threshold=0.10)
    assert len(G.nodes) == 8
    
    groups = detect_communities(G, target_min_size=3, target_max_size=5)
    assert len(groups) >= 2
    # All students should be assigned to a group
    assigned_count = sum(len(g) for g in groups)
    assert assigned_count == 8
    
    # Check explanation generation
    students_dict = {s["id"]: s for s in students}
    exp = generate_explanation(groups[0], students_dict, focus_student_id=groups[0][0])
    assert len(exp["summary"]) > 0
    assert len(exp["personalized_explanation"]) > 0
    assert "heatmap" in exp
    
    # Check rematch
    rematch_res = rematch_student("s_0", groups, students)
    assert rematch_res["success"] is True


if __name__ == "__main__":
    print("Running standalone demo of StudyMatch Matching Engine...")
    test_course_overlap()
    test_availability_overlap()
    test_complementary_skill_score()
    test_compute_compatibility_score()
    test_louvain_communities_and_explanation()
    print("All matching engine tests PASSED in isolation!")
