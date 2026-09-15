import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class UserRole(str, enum.Enum):
    teacher = "teacher"
    student = "student"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.student)
    hashed_password = Column(String(255), nullable=False)
    student_number = Column(String(50), nullable=True)
    school_name = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    assignments = relationship(
        "Assignment", back_populates="teacher", cascade="all, delete-orphan"
    )
    consents = relationship(
        "Consent", back_populates="student", cascade="all, delete-orphan"
    )
    chat_messages = relationship(
        "ChatMessage", back_populates="user", cascade="all, delete-orphan"
    )
