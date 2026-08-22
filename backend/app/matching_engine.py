"""
StudyMatch - Peer-Matched Study Group Finder
Matching Engine (Core Graph & Louvain Community Detection Algorithm)

This module is completely standalone and unit-testable. It models students as nodes
in a weighted compatibility graph, evaluates multidimensional alignment:
1. Course overlap (Jaccard similarity)
2. Availability overlap (Interval intersection of weekly free time)
3. Complementary skill ratings (Peer-teaching incentives)
4. Louvain community detection with group size bounding (3-5 members)
5. Natural-language explanation generation with specific peer-teaching pairings
6. Re-matching logic for dynamic group reconfiguration
"""

import math
from typing import Any, Dict, List, Optional, Set, Tuple
import networkx as nx

try:
    import community as community_louvain
    HAS_PYTHON_LOUVAIN = True
except ImportError:
    HAS_PYTHON_LOUVAIN = False


# Default weight configuration
DEFAULT_WEIGHTS = {
    "w_course": 0.40,        # w1: Course overlap (Jaccard)
    "w_availability": 0.35,  # w2: Availability overlap
    "w_skill": 0.25          # w3: Complementary skill score
}

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def compute_course_overlap(courses_a: Set[str], courses_b: Set[str]) -> Tuple[float, List[str]]:
    """
    Computes Jaccard similarity between two sets of courses.
    J(A, B) = |A ∩ B| / |A ∪ B|
    Returns (similarity_score [0.0 - 1.0], shared_courses_list)
    """
    set_a = set(courses_a)
    set_b = set(courses_b)
    
    if not set_a and not set_b:
        return 0.0, []
    
    intersection = set_a.intersection(set_b)
    union = set_a.union(set_b)
    
    if not union:
        return 0.0, []
    
    jaccard = len(intersection) / len(union)
    return float(jaccard), sorted(list(intersection))


def _normalize_slots(slots_input: Any) -> List[Dict[str, Any]]:
    """
    Normalizes availability input into standard list of dicts:
    [{'day': 0..6, 'start': 9.0, 'end': 12.0}, ...]
    Accepts:
    - List of dicts with 'day'/'day_of_week', 'start_hour'/'start', 'end_hour'/'end'
    - List of tuple pairs: (day_int, hour_float) or (day_int, start, end)
    """
    normalized = []
    if not slots_input:
        return normalized

    for item in slots_input:
        if isinstance(item, dict):
            day = item.get("day", item.get("day_of_week", 0))
            start = float(item.get("start", item.get("start_hour", 0.0)))
            end = float(item.get("end", item.get("end_hour", start + 1.0)))
            if end > start:
                normalized.append({"day": int(day), "start": start, "end": end})
        elif isinstance(item, (list, tuple)):
            if len(item) == 2:
                # (day, hour) 1-hour slot
                normalized.append({"day": int(item[0]), "start": float(item[1]), "end": float(item[1]) + 1.0})
            elif len(item) >= 3:
                # (day, start, end)
                normalized.append({"day": int(item[0]), "start": float(item[1]), "end": float(item[2])})
    return normalized


def compute_availability_overlap(slots_a_raw: Any, slots_b_raw: Any, target_benchmark_hours: float = 8.0) -> Dict[str, Any]:
    """
    Computes total overlapping hours between two weekly availability schedules.
    Uses interval intersection logic per day:
      Overlap([s1, e1], [s2, e2]) = max(0, min(e1, e2) - max(s1, s2))
    
    Returns:
      {
        "availability_overlap_score": float (0.0 - 1.0),
        "total_shared_hours": float,
        "overlapping_slots_by_day": {0: [[s, e], ...], ...},
        "readable_times": List[str]
      }
    """
    slots_a = _normalize_slots(slots_a_raw)
    slots_b = _normalize_slots(slots_b_raw)
    
    # Group intervals by day (0 to 6)
    day_intervals_a: Dict[int, List[Tuple[float, float]]] = {d: [] for d in range(7)}
    day_intervals_b: Dict[int, List[Tuple[float, float]]] = {d: [] for d in range(7)}
    
    for s in slots_a:
        day_intervals_a[s["day"] % 7].append((s["start"], s["end"]))
    for s in slots_b:
        day_intervals_b[s["day"] % 7].append((s["start"], s["end"]))
        
    total_shared_hours = 0.0
    overlapping_slots_by_day: Dict[int, List[Tuple[float, float]]] = {}
    readable_times = []
    
    for day in range(7):
        intervals_a = day_intervals_a[day]
        intervals_b = day_intervals_b[day]
        
        day_overlaps = []
        for (sa, ea) in intervals_a:
            for (sb, eb) in intervals_b:
                start_overlap = max(sa, sb)
                end_overlap = min(ea, eb)
                if end_overlap > start_overlap:
                    overlap_len = end_overlap - start_overlap
                    total_shared_hours += overlap_len
                    day_overlaps.append((start_overlap, end_overlap))
        
        if day_overlaps:
            # Merge contiguous or overlapping intervals for clean representation
            day_overlaps.sort(key=lambda x: x[0])
            merged = []
            for cur in day_overlaps:
                if not merged:
                    merged.append(cur)
                else:
                    prev = merged[-1]
                    if cur[0] <= prev[1]:
                        merged[-1] = (prev[0], max(prev[1], cur[1]))
                    else:
                        merged.append(cur)
            overlapping_slots_by_day[day] = merged
            
            for (s, e) in merged:
                s_fmt = f"{int(s)}:00" if s == int(s) else f"{int(s)}:{int((s % 1)*60):02d}"
                e_fmt = f"{int(e)}:00" if e == int(e) else f"{int(e)}:{int((e % 1)*60):02d}"
                readable_times.append(f"{DAY_SHORT[day]} {s_fmt}-{e_fmt}")
                
    # Normalize score against target benchmark hours (e.g. 8 shared hours is considered full 1.0)
    overlap_score = min(1.0, total_shared_hours / max(1.0, target_benchmark_hours))
    
    return {
        "availability_overlap_score": float(round(overlap_score, 4)),
        "total_shared_hours": float(round(total_shared_hours, 2)),
        "overlapping_slots_by_day": overlapping_slots_by_day,
        "readable_times": readable_times
    }


def compute_complementary_skill_score(
    topics_a: Dict[str, Dict[str, float]], 
    topics_b: Dict[str, Dict[str, float]], 
    shared_courses: List[str]
) -> Dict[str, Any]:
    """
    Evaluates self-rated topic strengths (1-5 scale) within shared courses.
    Rewards pairs where one student is strong (>= 4) and the other has room for growth (<= 2),
    which fosters peer teaching. Also rewards bidirectional synergy where both can mentor each other.
    
    topics_a / topics_b structure:
      {
        "CS106B": {"Recursion": 5, "Dynamic Programming": 2, "Binary Trees": 4},
        "MATH51": {"Matrices": 4, "Eigenvalues": 1}
      }
    Or flat structure:
      {
        ("CS106B", "Recursion"): 5, ...
      }
    """
    # Normalize topic rating structures
    ratings_a: Dict[Tuple[str, str], float] = {}
    ratings_b: Dict[Tuple[str, str], float] = {}

    def _extract_ratings(src, target_dict):
        if not src:
            return
        for k, v in src.items():
            if isinstance(k, tuple):
                target_dict[k] = float(v)
            elif isinstance(v, dict):
                course_code = str(k)
                for topic, rating in v.items():
                    target_dict[(course_code, str(topic))] = float(rating)
            elif isinstance(v, (int, float)):
                # Flat format if key is "course:topic" or just topic
                if ":" in str(k):
                    c, t = str(k).split(":", 1)
                    target_dict[(c, t)] = float(v)
                else:
                    # Generic course
                    for sc in shared_courses:
                        target_dict[(sc, str(k))] = float(v)

    _extract_ratings(topics_a, ratings_a)
    _extract_ratings(topics_b, ratings_b)
    
    if not shared_courses:
        return {
            "complementary_skill_score": 0.0,
            "synergies": [],
            "teaching_a_to_b": [],
            "teaching_b_to_a": []
        }

    shared_topics = []
    divergence_sum = 0.0
    teaching_a_to_b = []
    teaching_b_to_a = []
    
    for (course, topic), r_a in ratings_a.items():
        if course in shared_courses and (course, topic) in ratings_b:
            r_b = ratings_b[(course, topic)]
            shared_topics.append((course, topic, r_a, r_b))
            
            # Base divergence normalized to [0, 1] on 1-5 scale (max difference is 4)
            diff = abs(r_a - r_b) / 4.0
            divergence_sum += diff
            
            # Check high-value mentorship asymmetry
            if r_a >= 4 and r_b <= 2:
                teaching_a_to_b.append({
                    "course": course,
                    "topic": topic,
                    "mentor_rating": r_a,
                    "learner_rating": r_b
                })
            elif r_b >= 4 and r_a <= 2:
                teaching_b_to_a.append({
                    "course": course,
                    "topic": topic,
                    "mentor_rating": r_b,
                    "learner_rating": r_a
                })
                
    if not shared_topics:
        # Default neutral baseline if courses match but no topic-level ratings
        return {
            "complementary_skill_score": 0.20,
            "synergies": [],
            "teaching_a_to_b": [],
            "teaching_b_to_a": []
        }

    base_divergence_score = divergence_sum / len(shared_topics)
    
    # Synergies bonus: If bidirectional peer teaching exists, give up to +0.25 bonus
    synergy_bonus = 0.0
    if teaching_a_to_b and teaching_b_to_a:
        synergy_bonus = 0.25
    elif teaching_a_to_b or teaching_b_to_a:
        synergy_bonus = 0.12
        
    final_skill_score = min(1.0, base_divergence_score + synergy_bonus)
    
    all_synergies = []
    for item in teaching_a_to_b:
        all_synergies.append(f"A can mentor B in {item['course']} ({item['topic']})")
    for item in teaching_b_to_a:
        all_synergies.append(f"B can mentor A in {item['course']} ({item['topic']})")
        
    return {
        "complementary_skill_score": float(round(final_skill_score, 4)),
        "synergies": all_synergies,
        "teaching_a_to_b": teaching_a_to_b,
        "teaching_b_to_a": teaching_b_to_a
    }


def compute_compatibility_score(
    student_a: Dict[str, Any], 
    student_b: Dict[str, Any], 
    weights: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Computes overall weighted compatibility score between two students:
      score = w1*course_overlap + w2*availability_overlap + w3*complementary_skill_score
    
    Returns full score breakdown and metadata.
    """
    w = DEFAULT_WEIGHTS.copy()
    if weights:
        w.update(weights)
        
    # Normalize weights so sum is 1.0
    w_sum = w["w_course"] + w["w_availability"] + w["w_skill"]
    if w_sum > 0:
        w1 = w["w_course"] / w_sum
        w2 = w["w_availability"] / w_sum
        w3 = w["w_skill"] / w_sum
    else:
        w1, w2, w3 = 0.40, 0.35, 0.25

    courses_a = set(student_a.get("courses", []))
    courses_b = set(student_b.get("courses", []))
    
    course_score, shared_courses = compute_course_overlap(courses_a, courses_b)
    
    avail_res = compute_availability_overlap(
        student_a.get("availability", []), 
        student_b.get("availability", [])
    )
    avail_score = avail_res["availability_overlap_score"]
    
    skill_res = compute_complementary_skill_score(
        student_a.get("topic_ratings", {}),
        student_b.get("topic_ratings", {}),
        shared_courses
    )
    skill_score = skill_res["complementary_skill_score"]
    
    # If no shared courses at all, heavily dampen overall compatibility
    if not shared_courses:
        total_score = (w2 * avail_score * 0.5)
    else:
        total_score = (w1 * course_score) + (w2 * avail_score) + (w3 * skill_score)
        
    total_score = float(max(0.0, min(1.0, round(total_score, 4))))
    
    return {
        "total_score": total_score,
        "course_overlap": float(round(course_score, 4)),
        "availability_overlap": float(round(avail_score, 4)),
        "complementary_skill_score": float(round(skill_score, 4)),
        "shared_hours": avail_res["total_shared_hours"],
        "shared_courses": shared_courses,
        "readable_overlapping_times": avail_res["readable_times"],
        "teaching_a_to_b": skill_res["teaching_a_to_b"],
        "teaching_b_to_a": skill_res["teaching_b_to_a"],
        "synergies": skill_res["synergies"]
    }


def build_graph(
    students: List[Dict[str, Any]], 
    weights: Optional[Dict[str, float]] = None, 
    min_threshold: float = 0.15
) -> nx.Graph:
    """
    Builds a weighted NetworkX graph where:
      - Nodes represent students
      - Edges represent compatibility above min_threshold
      - Edge weights represent total compatibility score
    """
    G = nx.Graph()
    
    # Add nodes with student metadata
    for student in students:
        s_id = str(student.get("id", student.get("name", "")))
        G.add_node(
            s_id,
            id=s_id,
            name=student.get("name", f"Student {s_id}"),
            major=student.get("major", "Undeclared"),
            year=student.get("year", "Undergraduate"),
            courses=list(student.get("courses", [])),
            avatar=student.get("avatar", ""),
            bio=student.get("bio", ""),
            raw_data=student
        )
        
    n = len(students)
    if n < 2:
        return G
        
    # Compute all pairwise scores
    for i in range(n):
        for j in range(i + 1, n):
            s_a = students[i]
            s_b = students[j]
            id_a = str(s_a.get("id", s_a.get("name", "")))
            id_b = str(s_b.get("id", s_b.get("name", "")))
            
            comp = compute_compatibility_score(s_a, s_b, weights)
            score = comp["total_score"]
            
            if score >= min_threshold:
                G.add_edge(
                    id_a, 
                    id_b, 
                    weight=score,
                    course_overlap=comp["course_overlap"],
                    availability_overlap=comp["availability_overlap"],
                    complementary_skill_score=comp["complementary_skill_score"],
                    shared_courses=comp["shared_courses"],
                    shared_hours=comp["shared_hours"],
                    teaching_a_to_b=comp["teaching_a_to_b"],
                    teaching_b_to_a=comp["teaching_b_to_a"]
                )
                
    # If the graph has isolated nodes or is disconnected due to high threshold,
    # add best available edge for isolates with shared courses
    for s_id in list(G.nodes()):
        if G.degree(s_id) == 0 and n > 1:
            best_partner = None
            best_score = -1.0
            best_comp = None
            s_data = G.nodes[s_id].get("raw_data", {})
            for other_id in G.nodes():
                if other_id == s_id:
                    continue
                o_data = G.nodes[other_id].get("raw_data", {})
                comp = compute_compatibility_score(s_data, o_data, weights)
                if comp["total_score"] > best_score and comp["shared_courses"]:
                    best_score = comp["total_score"]
                    best_partner = other_id
                    best_comp = comp
            if best_partner and best_score > 0.05:
                G.add_edge(
                    s_id, 
                    best_partner, 
                    weight=best_score,
                    course_overlap=best_comp["course_overlap"],
                    availability_overlap=best_comp["availability_overlap"],
                    complementary_skill_score=best_comp["complementary_skill_score"],
                    shared_courses=best_comp["shared_courses"],
                    shared_hours=best_comp["shared_hours"]
                )
                
    return G


def _split_oversized_community(
    graph: nx.Graph, 
    member_ids: List[str], 
    target_min: int = 3, 
    target_max: int = 5
) -> List[List[str]]:
    """
    Sub-partitions a community that exceeds target_max (e.g. 6+ members)
    into smaller cohesive groups of 3-5 students.
    """
    if len(member_ids) <= target_max:
        return [member_ids]
        
    subgraph = graph.subgraph(member_ids).copy()
    
    # Try sub-Louvain or greedy modularity partition
    try:
        if HAS_PYTHON_LOUVAIN and len(subgraph.edges) > 0:
            sub_part = community_louvain.best_partition(subgraph, weight='weight', resolution=1.3)
            sub_groups: Dict[int, List[str]] = {}
            for node, cid in sub_part.items():
                sub_groups.setdefault(cid, []).append(node)
            result = list(sub_groups.values())
            # If sub-louvain succeeded in breaking it down
            if len(result) > 1 and all(len(g) <= target_max for g in result):
                return result
    except Exception:
        pass
        
    # Fallback: Partition by k-means style edge greedy clustering or chunking
    # Sort nodes by degree within subgraph
    sorted_nodes = sorted(member_ids, key=lambda n: subgraph.degree(n, weight='weight'), reverse=True)
    num_groups = math.ceil(len(member_ids) / target_max)
    chunk_size = math.ceil(len(member_ids) / num_groups)
    
    groups = []
    for i in range(0, len(sorted_nodes), chunk_size):
        chunk = sorted_nodes[i:i + chunk_size]
        if len(chunk) < target_min and groups:
            # Append small remainder to previous group if capacity permits, or balance
            groups[-1].extend(chunk)
        else:
            groups.append(chunk)
            
    # Balance groups so none exceeds target_max
    balanced = []
    for g in groups:
        if len(g) > target_max:
            mid = len(g) // 2
            balanced.append(g[:mid])
            balanced.append(g[mid:])
        else:
            balanced.append(g)
    return balanced


def detect_communities(
    graph: nx.Graph, 
    target_min_size: int = 3, 
    target_max_size: int = 5, 
    resolution: float = 1.0
) -> List[List[str]]:
    """
    Runs Louvain Community Detection algorithm on the compatibility graph.
    Applies post-processing to balance group sizes into target range (3-5 members).
    
    Returns: List of groups, where each group is a List of student IDs.
    """
    if len(graph.nodes) == 0:
        return []
    if len(graph.nodes) <= target_max_size:
        return [list(graph.nodes)]

    # 1. Run Louvain Community Detection
    partition_map: Dict[str, int] = {}
    
    if HAS_PYTHON_LOUVAIN and len(graph.edges) > 0:
        try:
            partition_map = community_louvain.best_partition(
                graph, 
                weight='weight', 
                resolution=resolution,
                random_state=42
            )
        except Exception:
            partition_map = {}

    if not partition_map:
        # Fallback to networkx louvain or connected components
        try:
            communities = list(nx.algorithms.community.louvain_communities(graph, weight='weight', resolution=resolution, seed=42))
            for cid, comm in enumerate(communities):
                for node in comm:
                    partition_map[node] = cid
        except Exception:
            for cid, comp in enumerate(nx.connected_components(graph)):
                for node in comp:
                    partition_map[node] = cid
                    
    # Group nodes by initial community ID
    raw_communities: Dict[int, List[str]] = {}
    for node in graph.nodes():
        cid = partition_map.get(node, 0)
        raw_communities.setdefault(cid, []).append(node)
        
    initial_groups = list(raw_communities.values())
    
    # 2. Split any groups that are too large (> target_max_size)
    refined_groups: List[List[str]] = []
    for grp in initial_groups:
        if len(grp) > target_max_size:
            splits = _split_oversized_community(graph, grp, target_min_size, target_max_size)
            refined_groups.extend(splits)
        else:
            refined_groups.append(grp)
            
    # 3. Merge undersized groups (< target_min_size) into most compatible neighboring groups
    final_groups: List[List[str]] = []
    undersized: List[List[str]] = []
    
    for grp in refined_groups:
        if len(grp) >= target_min_size:
            final_groups.append(grp)
        else:
            undersized.append(grp)
            
    for small_grp in undersized:
        for student_id in small_grp:
            # Find the best existing group in final_groups that has capacity
            best_group_idx = -1
            best_avg_weight = -1.0
            
            for idx, candidate_grp in enumerate(final_groups):
                if len(candidate_grp) < target_max_size:
                    # Calculate average edge weight between student_id and candidate_grp
                    weights = [
                        graph[student_id][member]["weight"] 
                        for member in candidate_grp 
                        if graph.has_edge(student_id, member)
                    ]
                    avg_w = sum(weights) / len(candidate_grp) if weights else 0.0
                    if avg_w > best_avg_weight:
                        best_avg_weight = avg_w
                        best_group_idx = idx
                        
            if best_group_idx != -1:
                final_groups[best_group_idx].append(student_id)
            else:
                # If no existing group can take them, bundle remaining undersized students together
                # or create a new 2-person group
                if final_groups and len(final_groups[-1]) < target_max_size:
                    final_groups[-1].append(student_id)
                else:
                    final_groups.append([student_id])
                    
    # Clean up single isolates if possible by appending to smallest group
    cleaned_groups: List[List[str]] = []
    singletons = []
    for g in final_groups:
        if len(g) == 1 and len(final_groups) > 1:
            singletons.extend(g)
        else:
            cleaned_groups.append(g)
            
    if not cleaned_groups and singletons:
        cleaned_groups = [singletons]
    else:
        for s in singletons:
            if cleaned_groups:
                # Add to smallest group
                smallest = min(cleaned_groups, key=len)
                smallest.append(s)
            else:
                cleaned_groups.append([s])
                
    return cleaned_groups


def generate_group_availability_heatmap(students: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes a 7-day x 24-hour overlap heatmap matrix for a group of students.
    Returns:
      {
        "matrix": [[count_for_hour_0_to_23 for day in 0..6]], # 7 x 24 array
        "peak_slots": [{"day": "Tue", "hour": 14, "available_students": ["Alice", "Bob"]}],
        "shared_free_hours_count": int
      }
    """
    # 7 days x 24 hours grid
    matrix = [[0 for _ in range(24)] for _ in range(7)]
    student_slot_map = [[[] for _ in range(24)] for _ in range(7)]
    
    for s in students:
        s_name = s.get("name", "Student")
        slots = _normalize_slots(s.get("availability", []))
        for slot in slots:
            day = slot["day"] % 7
            st = int(math.floor(slot["start"]))
            et = int(math.ceil(slot["end"]))
            for h in range(max(0, st), min(24, et)):
                matrix[day][h] += 1
                student_slot_map[day][h].append(s_name)
                
    num_students = len(students)
    peak_slots = []
    shared_free_hours_count = 0
    
    for day in range(7):
        for h in range(24):
            count = matrix[day][h]
            if count >= max(2, num_students - 1):
                shared_free_hours_count += 1
                peak_slots.append({
                    "day_idx": day,
                    "day_name": DAY_NAMES[day],
                    "day_short": DAY_SHORT[day],
                    "hour": h,
                    "time_label": f"{h:02d}:00 - {h+1:02d}:00",
                    "available_count": count,
                    "available_names": student_slot_map[day][h]
                })
                
    return {
        "matrix": matrix,
        "total_members": num_students,
        "peak_slots": peak_slots[:10],
        "shared_free_hours_count": shared_free_hours_count
    }


def generate_explanation(
    group_member_ids: List[str], 
    students_dict: Dict[str, Dict[str, Any]], 
    focus_student_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates a natural-language "Why you were matched" explanation for a group,
    including shared courses, overlapping free hours, and specific complementary peer-teaching opportunities.
    
    Can generate both a group-wide summary and a personalized focus explanation for a specific student.
    """
    members = [students_dict[m_id] for m_id in group_member_ids if m_id in students_dict]
    if not members:
        return {
            "summary": "No active group members found.",
            "shared_courses": [],
            "shared_hours_text": "No overlapping time recorded.",
            "peer_teaching_synergies": [],
            "personalized_explanation": ""
        }
        
    names = [m.get("name", "Student") for m in members]
    num_m = len(members)
    
    # 1. Shared Courses Analysis
    all_course_sets = [set(m.get("courses", [])) for m in members]
    group_shared_courses = list(set.intersection(*all_course_sets)) if all_course_sets else []
    
    # Pairwise shared courses
    pairwise_courses: Dict[str, int] = {}
    for i in range(num_m):
        for j in range(i + 1, num_m):
            pair_shared = set(members[i].get("courses", [])).intersection(set(members[j].get("courses", [])))
            for c in pair_shared:
                pairwise_courses[c] = pairwise_courses.get(c, 0) + 1
                
    prominent_courses = sorted(pairwise_courses.keys(), key=lambda c: pairwise_courses[c], reverse=True)
    if not group_shared_courses and prominent_courses:
        group_shared_courses = prominent_courses[:2]
        
    courses_text = ", ".join(group_shared_courses) if group_shared_courses else "aligned STEM & Computing courses"
    
    # 2. Availability Heatmap & Shared Free Hours
    heatmap_data = generate_group_availability_heatmap(members)
    peak_slots = heatmap_data["peak_slots"]
    shared_hours_total = heatmap_data["shared_free_hours_count"]
    
    if peak_slots:
        top_time_strs = []
        for slot in peak_slots[:3]:
            top_time_strs.append(f"{slot['day_short']} {slot['time_label']}")
        avail_summary_text = f"You share approximately {shared_hours_total} peak overlapping hours weekly, especially during {', '.join(top_time_strs)}."
    else:
        avail_summary_text = f"You share approximately {shared_hours_total} flexible overlapping hours during the week."
        
    # 3. Peer-Teaching & Skill Synergies Breakdown
    synergies = []
    detailed_synergies = []
    
    for i in range(num_m):
        for j in range(i + 1, num_m):
            s_a = members[i]
            s_b = members[j]
            comp = compute_compatibility_score(s_a, s_b)
            
            for item in comp["teaching_a_to_b"]:
                synergy_msg = f"{s_a.get('name')} (Strength: {item['mentor_rating']}/5) can mentor {s_b.get('name')} in {item['topic']} ({item['course']})"
                synergies.append(synergy_msg)
                detailed_synergies.append({
                    "mentor_id": s_a.get("id"),
                    "mentor_name": s_a.get("name"),
                    "learner_id": s_b.get("id"),
                    "learner_name": s_b.get("name"),
                    "topic": item["topic"],
                    "course": item["course"],
                    "mentor_rating": item["mentor_rating"],
                    "learner_rating": item["learner_rating"]
                })
                
            for item in comp["teaching_b_to_a"]:
                synergy_msg = f"{s_b.get('name')} (Strength: {item['mentor_rating']}/5) can mentor {s_a.get('name')} in {item['topic']} ({item['course']})"
                synergies.append(synergy_msg)
                detailed_synergies.append({
                    "mentor_id": s_b.get("id"),
                    "mentor_name": s_b.get("name"),
                    "learner_id": s_a.get("id"),
                    "learner_name": s_a.get("name"),
                    "topic": item["topic"],
                    "course": item["course"],
                    "mentor_rating": item["mentor_rating"],
                    "learner_rating": item["learner_rating"]
                })

    # 4. Synthesize Natural-Language Group Overview
    group_summary = (
        f"Group formed for {', '.join(names)}. "
        f"You share core enrollment in {courses_text}. "
        f"{avail_summary_text} "
    )
    if synergies:
        group_summary += f"Great peer-teaching synergy: {synergies[0]}."
        
    # 5. Personalized Explanation for focus student
    personalized_text = ""
    if focus_student_id and str(focus_student_id) in students_dict:
        me = students_dict[str(focus_student_id)]
        my_name = me.get("name", "You")
        peers = [m for m in members if str(m.get("id")) != str(focus_student_id)]
        peer_names = ", ".join([p.get("name", "Peer") for p in peers])
        
        my_mentoring = [s for s in detailed_synergies if str(s["mentor_id"]) == str(focus_student_id)]
        my_learning = [s for s in detailed_synergies if str(s["learner_id"]) == str(focus_student_id)]
        
        synergy_parts = []
        if my_mentoring:
            m = my_mentoring[0]
            synergy_parts.append(f"you can help {m['learner_name']} with {m['topic']}")
        if my_learning:
            l = my_learning[0]
            synergy_parts.append(f"{l['mentor_name']} can assist you in {l['topic']}")
            
        synergy_clause = f" where {', and '.join(synergy_parts)}" if synergy_parts else ""
        
        personalized_text = (
            f"You were matched with {peer_names} because you share key courses ({courses_text}) "
            f"and have strong availability alignment ({avail_summary_text.lower()}){synergy_clause}."
        )
    else:
        personalized_text = group_summary
        
    return {
        "summary": group_summary,
        "personalized_explanation": personalized_text,
        "shared_courses": group_shared_courses,
        "shared_hours_text": avail_summary_text,
        "shared_free_hours_count": shared_hours_total,
        "peer_teaching_synergies": synergies,
        "detailed_synergies": detailed_synergies,
        "heatmap": heatmap_data
    }


def rematch_student(
    student_id: str, 
    current_groups: List[List[str]], 
    all_students: List[Dict[str, Any]], 
    weights: Optional[Dict[str, float]] = None,
    min_threshold: float = 0.15
) -> Dict[str, Any]:
    """
    Recomputes group assignment when a student requests a rematch or leaves a group.
    1. Removes the student from their current group.
    2. Searches all existing groups with space (< 5 members) to find highest average compatibility.
    3. If no suitable existing group has space, runs graph-level re-clustering.
    """
    students_dict = {str(s.get("id", s.get("name"))): s for s in all_students}
    target_id = str(student_id)
    
    if target_id not in students_dict:
        return {"success": False, "message": f"Student {student_id} not found."}
        
    student_data = students_dict[target_id]
    
    # Locate and remove student from their current group
    updated_groups: List[List[str]] = []
    old_group_idx = -1
    for idx, grp in enumerate(current_groups):
        filtered = [m for m in grp if m != target_id]
        if len(filtered) < len(grp):
            old_group_idx = idx
        if filtered:
            updated_groups.append(filtered)
            
    # Calculate best alternate group with capacity < 5
    best_alt_idx = -1
    best_score = -1.0
    
    for idx, grp in enumerate(updated_groups):
        if len(grp) < 5 and idx != old_group_idx:
            # Average score with members of this group
            scores = []
            for member_id in grp:
                if member_id in students_dict:
                    comp = compute_compatibility_score(student_data, students_dict[member_id], weights)
                    scores.append(comp["total_score"])
            if scores:
                avg_score = sum(scores) / len(scores)
                if avg_score > best_score and avg_score >= min_threshold:
                    best_score = avg_score
                    best_alt_idx = idx
                    
    if best_alt_idx != -1:
        updated_groups[best_alt_idx].append(target_id)
        return {
            "success": True,
            "action": "reassigned_to_best_alternate_group",
            "new_group_index": best_alt_idx,
            "compatibility_score": round(best_score, 4),
            "groups": updated_groups
        }
        
    # If no alternate group with space matches well, re-run full community detection
    G = build_graph(all_students, weights, min_threshold)
    recalculated_groups = detect_communities(G, target_min_size=3, target_max_size=5)
    
    return {
        "success": True,
        "action": "global_recluster",
        "groups": recalculated_groups
    }
