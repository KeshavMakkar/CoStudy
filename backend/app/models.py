from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Table
from sqlalchemy.orm import relationship
from app.database import Base

class StudentCourse(Base):
    __tablename__ = "student_courses"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"))
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    major = Column(String(100), default="Computer Science")
    year = Column(String(50), default="Sophomore")
    avatar = Column(String(255), default="")
    bio = Column(Text, default="")
    preferred_group_size = Column(Integer, default=4)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    courses = relationship("Course", secondary="student_courses", back_populates="students")
    availability_slots = relationship("AvailabilitySlot", back_populates="student", cascade="all, delete-orphan")
    topic_ratings = relationship("TopicRating", back_populates="student", cascade="all, delete-orphan")
    group_memberships = relationship("GroupMember", back_populates="student", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="student")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    department = Column(String(100), default="Engineering")
    topics_json = Column(Text, default="[]")  # JSON list of topic strings

    # Relationships
    students = relationship("Student", secondary="student_courses", back_populates="courses")


class AvailabilitySlot(Base):
    __tablename__ = "availability_slots"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_hour = Column(Float, nullable=False)     # e.g., 9.0
    end_hour = Column(Float, nullable=False)       # e.g., 12.0

    student = relationship("Student", back_populates="availability_slots")


class TopicRating(Base):
    __tablename__ = "topic_ratings"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    course_code = Column(String(50), nullable=False)
    topic_name = Column(String(100), nullable=False)
    rating = Column(Integer, nullable=False)  # 1 (Needs Help) to 5 (Expert)

    student = relationship("Student", back_populates="topic_ratings")


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    avg_compatibility = Column(Float, default=0.0)
    shared_courses_json = Column(Text, default="[]")
    shared_hours = Column(Float, default=0.0)
    explanation = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="group", cascade="all, delete-orphan")


class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), default="Member")
    joined_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group", back_populates="members")
    student = relationship("Student", back_populates="group_memberships")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="SET NULL"), nullable=True)
    student_name = Column(String(100), nullable=False)
    avatar = Column(String(255), default="")
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group", back_populates="messages")
    student = relationship("Student", back_populates="messages")
