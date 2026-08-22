import urllib.request
import json

base = "http://127.0.0.1:8000"

def get(path):
    req = urllib.request.urlopen(base + path)
    return json.loads(req.read().decode())

def post(path, data):
    req = urllib.request.Request(
        base + path, 
        data=json.dumps(data).encode(), 
        headers={"Content-Type": "application/json"}
    )
    res = urllib.request.urlopen(req)
    return json.loads(res.read().decode())

print("1. Health check:", get("/health"))
print("2. Courses count:", len(get("/courses")))
print("3. Students count:", len(get("/students")))

# Trigger matching
match_res = post("/match", {})
print("4. Match response: total_groups =", match_res["total_groups_formed"])

groups = get("/groups")
print("5. Groups count:", len(groups))
g1 = groups[0]
print(f"   Cohort 1 name: {g1['name']}, members: {len(g1['members'])}")
print(f"   Explanation summary: {g1['explanation_data']['summary'][:90]}...")

# Post message
msg = post(f"/groups/{g1['id']}/messages", {
    "student_id": g1["members"][0]["student_id"],
    "student_name": g1["members"][0]["name"],
    "content": "Hey everyone, let us meet on Tuesday to review recursion!"
})
print("6. Posted discussion message:", msg["content"])

# Rematch
rematch_res = post(f"/students/{g1['members'][0]['student_id']}/rematch", {})
print("7. Student rematch result:", rematch_res["action"], "new group id:", rematch_res["new_group_id"])

# Graph
graph_data = get("/graph")
print(f"8. Graph nodes: {len(graph_data['nodes'])}, edges: {len(graph_data['edges'])}")

# Create student test
import random
rand_email = f"jordan.lee.{random.randint(100, 9999)}@stanford.edu"
new_s = post("/students", {
    "name": "Jordan Lee",
    "email": rand_email,
    "major": "Computer Science",
    "year": "Junior",
    "course_codes": ["CS106B", "MATH51"],
    "availability": [
        {"day_of_week": 0, "start_hour": 14.0, "end_hour": 18.0},
        {"day_of_week": 2, "start_hour": 14.0, "end_hour": 18.0}
    ],
    "topic_ratings": [
        {"course_code": "CS106B", "topic_name": "Recursion", "rating": 5},
        {"course_code": "CS106B", "topic_name": "Dynamic Programming", "rating": 2}
    ],
    "preferred_group_size": 4
})
print(f"9. Successfully registered new student: {new_s['name']} (ID: {new_s['id']})")

print("\n[SUCCESS] ALL REST API ENDPOINTS VERIFIED 100% OPERATIONAL!")
