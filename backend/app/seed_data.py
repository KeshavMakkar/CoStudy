"""
StudyMatch Database Seeder
Populates 25+ realistic college students with authentic course enrollments,
topic skill ratings (for peer-teaching evaluation), and weekly availability slots.
"""

import json
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import Student, Course, StudentCourse, AvailabilitySlot, TopicRating, Group, GroupMember, Message

COURSES_CATALOG = [
    {
        "code": "CS106B",
        "name": "Programming Abstractions & Data Structures",
        "department": "Computer Science",
        "topics": ["Recursion", "Binary Trees", "Graph Theory", "Dynamic Programming"]
    },
    {
        "code": "CS161",
        "name": "Design & Analysis of Algorithms",
        "department": "Computer Science",
        "topics": ["Greedy Algorithms", "Divide & Conquer", "Graph Algorithms", "NP-Completeness"]
    },
    {
        "code": "MATH51",
        "name": "Linear Algebra & Multivariable Calculus",
        "department": "Mathematics",
        "topics": ["Matrix Operations", "Eigenvalues & Eigenvectors", "Vector Calculus", "Partial Derivatives"]
    },
    {
        "code": "CS229",
        "name": "Machine Learning",
        "department": "Data Science / AI",
        "topics": ["Linear Regression", "Logistic Regression", "Neural Networks", "Decision Trees"]
    },
    {
        "code": "CS110",
        "name": "Principles of Computer Systems",
        "department": "Computer Science",
        "topics": ["Multithreading", "Sockets & Networking", "Virtual Memory", "Concurrency"]
    },
    {
        "code": "PHYS41",
        "name": "Mechanics & Dynamics",
        "department": "Physics",
        "topics": ["Kinematics", "Newton's Laws", "Work & Energy", "Rotational Dynamics"]
    }
]

MOCK_STUDENTS = [
    {
        "name": "Maya Lin",
        "email": "maya.lin@stanford.edu",
        "major": "Computer Science",
        "year": "Sophomore",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        "bio": "Passionate about algorithms and visual computing. Love drawing recursive trees and whiteboard brainstorming.",
        "courses": ["CS106B", "MATH51"],
        "availability": [
            {"day": 0, "start": 14.0, "end": 18.0}, # Mon 2-6pm
            {"day": 1, "start": 10.0, "end": 13.0}, # Tue 10am-1pm
            {"day": 2, "start": 14.0, "end": 18.0}, # Wed 2-6pm
            {"day": 3, "start": 10.0, "end": 13.0}, # Thu 10am-1pm
            {"day": 5, "start": 13.0, "end": 17.0}  # Sat 1-5pm
        ],
        "ratings": {
            "CS106B": {"Recursion": 5, "Binary Trees": 4, "Graph Theory": 2, "Dynamic Programming": 1},
            "MATH51": {"Matrix Operations": 4, "Eigenvalues & Eigenvectors": 2, "Vector Calculus": 3, "Partial Derivatives": 2}
        }
    },
    {
        "name": "Liam Chen",
        "email": "liam.chen@stanford.edu",
        "major": "Computer Science",
        "year": "Sophomore",
        "avatar": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
        "bio": "Competitive programmer transitioning to systems. Strong in DP and graphs, seeking study buddy for recursion proofs.",
        "courses": ["CS106B", "MATH51"],
        "availability": [
            {"day": 0, "start": 14.0, "end": 17.0},
            {"day": 1, "start": 11.0, "end": 14.0},
            {"day": 2, "start": 14.0, "end": 17.0},
            {"day": 3, "start": 11.0, "end": 14.0},
            {"day": 5, "start": 14.0, "end": 18.0}
        ],
        "ratings": {
            "CS106B": {"Recursion": 2, "Binary Trees": 3, "Graph Theory": 5, "Dynamic Programming": 5},
            "MATH51": {"Matrix Operations": 2, "Eigenvalues & Eigenvectors": 5, "Vector Calculus": 4, "Partial Derivatives": 3}
        }
    },
    {
        "name": "Priya Patel",
        "email": "priya.patel@stanford.edu",
        "major": "Data Science & Math",
        "year": "Junior",
        "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
        "bio": "Math enthusiast interested in graph theory applications in machine learning. Enjoy group study sessions over coffee.",
        "courses": ["CS106B", "MATH51", "CS229"],
        "availability": [
            {"day": 0, "start": 13.0, "end": 16.0},
            {"day": 1, "start": 10.0, "end": 13.0},
            {"day": 2, "start": 13.0, "end": 16.0},
            {"day": 3, "start": 10.0, "end": 13.0},
            {"day": 6, "start": 11.0, "end": 15.0}
        ],
        "ratings": {
            "CS106B": {"Recursion": 4, "Binary Trees": 5, "Graph Theory": 5, "Dynamic Programming": 2},
            "MATH51": {"Matrix Operations": 5, "Eigenvalues & Eigenvectors": 5, "Vector Calculus": 4, "Partial Derivatives": 4},
            "CS229": {"Linear Regression": 5, "Logistic Regression": 4, "Neural Networks": 3, "Decision Trees": 4}
        }
    },
    {
        "name": "Alex Rivera",
        "email": "alex.rivera@stanford.edu",
        "major": "Computer Science",
        "year": "Sophomore",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        "bio": "Building side projects in web dev. Want a regular peer group to keep accountable on p-sets.",
        "courses": ["CS106B", "CS110"],
        "availability": [
            {"day": 0, "start": 15.0, "end": 19.0},
            {"day": 1, "start": 10.0, "end": 14.0},
            {"day": 2, "start": 15.0, "end": 19.0},
            {"day": 3, "start": 10.0, "end": 14.0},
            {"day": 5, "start": 12.0, "end": 16.0}
        ],
        "ratings": {
            "CS106B": {"Recursion": 2, "Binary Trees": 2, "Graph Theory": 4, "Dynamic Programming": 4},
            "CS110": {"Multithreading": 4, "Sockets & Networking": 5, "Virtual Memory": 2, "Concurrency": 3}
        }
    },
    {
        "name": "Sophia Taylor",
        "email": "sophia.taylor@stanford.edu",
        "major": "Data Science",
        "year": "Junior",
        "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        "bio": "Working on NLP and vision research. Excited to team up with people who love intuitive linear algebra.",
        "courses": ["MATH51", "CS229"],
        "availability": [
            {"day": 1, "start": 14.0, "end": 18.0},
            {"day": 3, "start": 14.0, "end": 18.0},
            {"day": 4, "start": 13.0, "end": 17.0},
            {"day": 5, "start": 10.0, "end": 14.0}
        ],
        "ratings": {
            "MATH51": {"Matrix Operations": 4, "Eigenvalues & Eigenvectors": 2, "Vector Calculus": 2, "Partial Derivatives": 3},
            "CS229": {"Linear Regression": 5, "Logistic Regression": 5, "Neural Networks": 5, "Decision Trees": 4}
        }
    },
    {
        "name": "Ethan Walker",
        "email": "ethan.walker@stanford.edu",
        "major": "Mathematics",
        "year": "Junior",
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        "bio": "Pure math major taking applied ML. Strong at multivariable theory and proofs, need intuition on neural net loss landscapes.",
        "courses": ["MATH51", "CS229"],
        "availability": [
            {"day": 1, "start": 14.0, "end": 18.0},
            {"day": 3, "start": 14.0, "end": 18.0},
            {"day": 4, "start": 12.0, "end": 16.0},
            {"day": 5, "start": 10.0, "end": 14.0}
        ],
        "ratings": {
            "MATH51": {"Matrix Operations": 5, "Eigenvalues & Eigenvectors": 5, "Vector Calculus": 5, "Partial Derivatives": 5},
            "CS229": {"Linear Regression": 3, "Logistic Regression": 3, "Neural Networks": 1, "Decision Trees": 2}
        }
    },
    {
        "name": "Noah Kim",
        "email": "noah.kim@stanford.edu",
        "major": "Electrical Engineering",
        "year": "Junior",
        "avatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
        "bio": "Embedded systems and low-level kernels. Love race conditions and synchronization challenges.",
        "courses": ["CS110", "PHYS41"],
        "availability": [
            {"day": 0, "start": 9.0, "end": 13.0},
            {"day": 2, "start": 9.0, "end": 13.0},
            {"day": 4, "start": 9.0, "end": 13.0},
            {"day": 6, "start": 14.0, "end": 18.0}
        ],
        "ratings": {
            "CS110": {"Multithreading": 5, "Sockets & Networking": 2, "Virtual Memory": 4, "Concurrency": 5},
            "PHYS41": {"Kinematics": 4, "Newton's Laws": 5, "Work & Energy": 4, "Rotational Dynamics": 2}
        }
    },
    {
        "name": "Emma Rodriguez",
        "email": "emma.rodriguez@stanford.edu",
        "major": "Computer Systems",
        "year": "Junior",
        "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
        "bio": "Distributed systems fan. Great at networking protocols and sockets, looking for guidance on complex concurrency locks.",
        "courses": ["CS110", "CS161"],
        "availability": [
            {"day": 0, "start": 10.0, "end": 14.0},
            {"day": 2, "start": 10.0, "end": 14.0},
            {"day": 4, "start": 10.0, "end": 14.0},
            {"day": 6, "start": 13.0, "end": 17.0}
        ],
        "ratings": {
            "CS110": {"Multithreading": 2, "Sockets & Networking": 5, "Virtual Memory": 5, "Concurrency": 2},
            "CS161": {"Greedy Algorithms": 4, "Divide & Conquer": 4, "Graph Algorithms": 3, "NP-Completeness": 2}
        }
    },
    {
        "name": "Lucas Martinez",
        "email": "lucas.martinez@stanford.edu",
        "major": "Physics",
        "year": "Sophomore",
        "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
        "bio": "Astrophysics track. Strong in basic Newtonian mechanics, looking for partners for rotational dynamics torque problems.",
        "courses": ["PHYS41", "MATH51"],
        "availability": [
            {"day": 0, "start": 14.0, "end": 18.0},
            {"day": 2, "start": 14.0, "end": 18.0},
            {"day": 4, "start": 14.0, "end": 18.0},
            {"day": 5, "start": 11.0, "end": 15.0}
        ],
        "ratings": {
            "PHYS41": {"Kinematics": 5, "Newton's Laws": 5, "Work & Energy": 3, "Rotational Dynamics": 1},
            "MATH51": {"Matrix Operations": 4, "Eigenvalues & Eigenvectors": 2, "Vector Calculus": 4, "Partial Derivatives": 3}
        }
    },
    {
        "name": "Olivia Davis",
        "email": "olivia.davis@stanford.edu",
        "major": "Mechanical Engineering",
        "year": "Sophomore",
        "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
        "bio": "Robotics and dynamics enthusiast. Love rotational moments of inertia and energy methods.",
        "courses": ["PHYS41", "MATH51"],
        "availability": [
            {"day": 0, "start": 14.0, "end": 18.0},
            {"day": 2, "start": 14.0, "end": 18.0},
            {"day": 4, "start": 14.0, "end": 18.0},
            {"day": 5, "start": 11.0, "end": 15.0}
        ],
        "ratings": {
            "PHYS41": {"Kinematics": 2, "Newton's Laws": 3, "Work & Energy": 5, "Rotational Dynamics": 5},
            "MATH51": {"Matrix Operations": 3, "Eigenvalues & Eigenvectors": 4, "Vector Calculus": 3, "Partial Derivatives": 4}
        }
    },
    {
        "name": "Daniel Zhao",
        "email": "daniel.zhao@stanford.edu",
        "major": "Computer Science",
        "year": "Junior",
        "avatar": "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80",
        "bio": "Algorithms TA aspirant. Love breaking down NP-completeness reductions.",
        "courses": ["CS161", "CS106B"],
        "availability": [
            {"day": 1, "start": 9.0, "end": 13.0},
            {"day": 3, "start": 9.0, "end": 13.0},
            {"day": 5, "start": 10.0, "end": 14.0}
        ],
        "ratings": {
            "CS161": {"Greedy Algorithms": 5, "Divide & Conquer": 5, "Graph Algorithms": 5, "NP-Completeness": 5},
            "CS106B": {"Recursion": 5, "Binary Trees": 5, "Graph Theory": 4, "Dynamic Programming": 4}
        }
    },
    {
        "name": "Aisha Khan",
        "email": "aisha.khan@stanford.edu",
        "major": "Computer Science",
        "year": "Junior",
        "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        "bio": "Preparing for technical interviews. Need support on NP-reductions and complex flow graphs.",
        "courses": ["CS161", "CS106B"],
        "availability": [
            {"day": 1, "start": 10.0, "end": 14.0},
            {"day": 3, "start": 10.0, "end": 14.0},
            {"day": 5, "start": 10.0, "end": 14.0}
        ],
        "ratings": {
            "CS161": {"Greedy Algorithms": 4, "Divide & Conquer": 4, "Graph Algorithms": 2, "NP-Completeness": 1},
            "CS106B": {"Recursion": 4, "Binary Trees": 4, "Graph Theory": 3, "Dynamic Programming": 2}
        }
    },
    {
        "name": "Marcus Vance",
        "email": "marcus.vance@stanford.edu",
        "major": "Data Science",
        "year": "Senior",
        "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
        "bio": "Stats and ML modeling. Always ready for interactive coding reviews and problem set prep.",
        "courses": ["CS229", "CS161"],
        "availability": [
            {"day": 1, "start": 15.0, "end": 19.0},
            {"day": 3, "start": 15.0, "end": 19.0},
            {"day": 6, "start": 12.0, "end": 16.0}
        ],
        "ratings": {
            "CS229": {"Linear Regression": 4, "Logistic Regression": 5, "Neural Networks": 4, "Decision Trees": 5},
            "CS161": {"Greedy Algorithms": 2, "Divide & Conquer": 3, "Graph Algorithms": 4, "NP-Completeness": 2}
        }
    },
    {
        "name": "Chloe Bennett",
        "email": "chloe.bennett@stanford.edu",
        "major": "Computer Science",
        "year": "Sophomore",
        "avatar": "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&auto=format&fit=crop&q=80",
        "bio": "Interested in graphics and game design. Excited to practice recursive ray tracing.",
        "courses": ["CS106B", "PHYS41"],
        "availability": [
            {"day": 0, "start": 14.0, "end": 17.0},
            {"day": 2, "start": 14.0, "end": 17.0},
            {"day": 4, "start": 14.0, "end": 17.0},
            {"day": 5, "start": 13.0, "end": 17.0}
        ],
        "ratings": {
            "CS106B": {"Recursion": 3, "Binary Trees": 4, "Graph Theory": 3, "Dynamic Programming": 1},
            "PHYS41": {"Kinematics": 4, "Newton's Laws": 4, "Work & Energy": 4, "Rotational Dynamics": 2}
        }
    },
    {
        "name": "Devin Brooks",
        "email": "devin.brooks@stanford.edu",
        "major": "Systems Engineering",
        "year": "Junior",
        "avatar": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
        "bio": "Low-level hacker. Love exploring POSIX threads and assembly memory layout.",
        "courses": ["CS110", "CS106B"],
        "availability": [
            {"day": 0, "start": 16.0, "end": 20.0},
            {"day": 1, "start": 10.0, "end": 14.0},
            {"day": 2, "start": 16.0, "end": 20.0},
            {"day": 3, "start": 10.0, "end": 14.0}
        ],
        "ratings": {
            "CS110": {"Multithreading": 5, "Sockets & Networking": 4, "Virtual Memory": 5, "Concurrency": 4},
            "CS106B": {"Recursion": 2, "Binary Trees": 3, "Graph Theory": 4, "Dynamic Programming": 3}
        }
    },
    {
        "name": "Zoe Takahashi",
        "email": "zoe.takahashi@stanford.edu",
        "major": "Symbolic Systems",
        "year": "Sophomore",
        "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
        "bio": "Cognitive science and logic. Enjoys diagramming state machines and search trees.",
        "courses": ["CS106B", "MATH51"],
        "availability": [
            {"day": 0, "start": 14.0, "end": 18.0},
            {"day": 1, "start": 11.0, "end": 14.0},
            {"day": 2, "start": 14.0, "end": 18.0},
            {"day": 3, "start": 11.0, "end": 14.0}
        ],
        "ratings": {
            "CS106B": {"Recursion": 4, "Binary Trees": 5, "Graph Theory": 2, "Dynamic Programming": 2},
            "MATH51": {"Matrix Operations": 4, "Eigenvalues & Eigenvectors": 3, "Vector Calculus": 4, "Partial Derivatives": 3}
        }
    },
    {
        "name": "Kai Nakamura",
        "email": "kai.nakamura@stanford.edu",
        "major": "Computer Science",
        "year": "Junior",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        "bio": "Passionate about graph neural networks and combinatorics.",
        "courses": ["CS161", "MATH51", "CS229"],
        "availability": [
            {"day": 1, "start": 13.0, "end": 17.0},
            {"day": 3, "start": 13.0, "end": 17.0},
            {"day": 5, "start": 11.0, "end": 15.0}
        ],
        "ratings": {
            "CS161": {"Greedy Algorithms": 4, "Divide & Conquer": 4, "Graph Algorithms": 5, "NP-Completeness": 3},
            "MATH51": {"Matrix Operations": 5, "Eigenvalues & Eigenvectors": 4, "Vector Calculus": 4, "Partial Derivatives": 4},
            "CS229": {"Linear Regression": 4, "Logistic Regression": 4, "Neural Networks": 4, "Decision Trees": 3}
        }
    },
    {
        "name": "Isabella Rossi",
        "email": "isabella.rossi@stanford.edu",
        "major": "Physics",
        "year": "Senior",
        "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
        "bio": "Theoretical physics background. Happy to assist with Lagrange mechanics and coordinate transformations.",
        "courses": ["PHYS41", "MATH51"],
        "availability": [
            {"day": 0, "start": 13.0, "end": 17.0},
            {"day": 2, "start": 13.0, "end": 17.0},
            {"day": 4, "start": 13.0, "end": 17.0},
            {"day": 6, "start": 10.0, "end": 14.0}
        ],
        "ratings": {
            "PHYS41": {"Kinematics": 5, "Newton's Laws": 5, "Work & Energy": 5, "Rotational Dynamics": 5},
            "MATH51": {"Matrix Operations": 5, "Eigenvalues & Eigenvectors": 4, "Vector Calculus": 5, "Partial Derivatives": 5}
        }
    },
    {
        "name": "Ryan Murphy",
        "email": "ryan.murphy@stanford.edu",
        "major": "Computer Science",
        "year": "Sophomore",
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        "bio": "Fast learner, visual thinker. Love solving practice midterms in small interactive groups.",
        "courses": ["CS106B", "CS110"],
        "availability": [
            {"day": 0, "start": 15.0, "end": 19.0},
            {"day": 1, "start": 10.0, "end": 14.0},
            {"day": 2, "start": 15.0, "end": 19.0},
            {"day": 3, "start": 10.0, "end": 14.0}
        ],
        "ratings": {
            "CS106B": {"Recursion": 4, "Binary Trees": 3, "Graph Theory": 4, "Dynamic Programming": 2},
            "CS110": {"Multithreading": 3, "Sockets & Networking": 4, "Virtual Memory": 3, "Concurrency": 2}
        }
    },
    {
        "name": "Leila Al-Mansoor",
        "email": "leila.mansoor@stanford.edu",
        "major": "Data Science",
        "year": "Junior",
        "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        "bio": "Passionate about medical imaging AI. Looking for peers to study deep neural network backprop calculus.",
        "courses": ["CS229", "MATH51"],
        "availability": [
            {"day": 1, "start": 14.0, "end": 18.0},
            {"day": 3, "start": 14.0, "end": 18.0},
            {"day": 4, "start": 13.0, "end": 17.0}
        ],
        "ratings": {
            "CS229": {"Linear Regression": 5, "Logistic Regression": 4, "Neural Networks": 4, "Decision Trees": 3},
            "MATH51": {"Matrix Operations": 4, "Eigenvalues & Eigenvectors": 3, "Vector Calculus": 2, "Partial Derivatives": 3}
        }
    },
    {
        "name": "Gabriel Santos",
        "email": "gabriel.santos@stanford.edu",
        "major": "Computer Science",
        "year": "Junior",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        "bio": "Backend infrastructure and cloud systems. High focus on clear explanations and active listening.",
        "courses": ["CS110", "CS161"],
        "availability": [
            {"day": 0, "start": 11.0, "end": 15.0},
            {"day": 2, "start": 11.0, "end": 15.0},
            {"day": 4, "start": 11.0, "end": 15.0},
            {"day": 6, "start": 14.0, "end": 18.0}
        ],
        "ratings": {
            "CS110": {"Multithreading": 4, "Sockets & Networking": 4, "Virtual Memory": 4, "Concurrency": 4},
            "CS161": {"Greedy Algorithms": 4, "Divide & Conquer": 3, "Graph Algorithms": 4, "NP-Completeness": 3}
        }
    },
    {
        "name": "Hannah Abbott",
        "email": "hannah.abbott@stanford.edu",
        "major": "Applied Physics",
        "year": "Junior",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        "bio": "Experimental physics and quantum optics. Enjoy whiteboarding forces and energy potentials.",
        "courses": ["PHYS41", "MATH51"],
        "availability": [
            {"day": 0, "start": 13.0, "end": 17.0},
            {"day": 2, "start": 13.0, "end": 17.0},
            {"day": 4, "start": 13.0, "end": 17.0}
        ],
        "ratings": {
            "PHYS41": {"Kinematics": 4, "Newton's Laws": 4, "Work & Energy": 5, "Rotational Dynamics": 3},
            "MATH51": {"Matrix Operations": 4, "Eigenvalues & Eigenvectors": 3, "Vector Calculus": 4, "Partial Derivatives": 4}
        }
    }
]

def seed_database(db: Session):
    """
    Clears and seeds all courses, students, availability slots, and topic ratings.
    """
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Clean existing data
    db.query(Message).delete()
    db.query(GroupMember).delete()
    db.query(Group).delete()
    db.query(TopicRating).delete()
    db.query(AvailabilitySlot).delete()
    db.query(StudentCourse).delete()
    db.query(Student).delete()
    db.query(Course).delete()
    db.commit()

    # 1. Insert Courses
    course_map = {}
    for c_data in COURSES_CATALOG:
        course = Course(
            code=c_data["code"],
            name=c_data["name"],
            department=c_data["department"],
            topics_json=json.dumps(c_data["topics"])
        )
        db.add(course)
        db.flush()
        course_map[c_data["code"]] = course

    # 2. Insert Students, Enrollments, Availability, Topic Ratings
    for s_data in MOCK_STUDENTS:
        student = Student(
            name=s_data["name"],
            email=s_data["email"],
            major=s_data["major"],
            year=s_data["year"],
            avatar=s_data.get("avatar", ""),
            bio=s_data.get("bio", ""),
            preferred_group_size=4
        )
        db.add(student)
        db.flush()

        # Enrollments
        for c_code in s_data.get("courses", []):
            if c_code in course_map:
                student_course = StudentCourse(
                    student_id=student.id,
                    course_id=course_map[c_code].id
                )
                db.add(student_course)

        # Availability Slots
        for slot in s_data.get("availability", []):
            avail = AvailabilitySlot(
                student_id=student.id,
                day_of_week=slot["day"],
                start_hour=slot["start"],
                end_hour=slot["end"]
            )
            db.add(avail)

        # Topic Ratings
        for c_code, topics in s_data.get("ratings", {}).items():
            for t_name, rating in topics.items():
                tr = TopicRating(
                    student_id=student.id,
                    course_code=c_code,
                    topic_name=t_name,
                    rating=rating
                )
                db.add(tr)

    db.commit()
    print(f"Successfully seeded {len(COURSES_CATALOG)} courses and {len(MOCK_STUDENTS)} students!")

if __name__ == "__main__":
    db = SessionLocal()
    seed_database(db)
    db.close()
