import enum
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class UsageEntryType(str, enum.Enum):
    ai_prompt = "ai_prompt"  # AI에게 보낸 질문/프롬프트
    ai_response = "ai_response"  # AI로부터 받은 응답/참고 자료
    self_written = "self_written"  # 학생이 직접 작성한 구간 기록


class AiUsageLog(Base):
    __tablename__ = "ai_usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    entry_type = Column(Enum(UsageEntryType), nullable=False)
    content = Column(Text, nullable=False)  # 저장 전 개인정보 마스킹 처리됨
    source_tool = Column(String(100), nullable=True)
    pii_detected = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    assignment = relationship("Assignment", back_populates="usage_logs")
    student = relationship("User", back_populates="usage_logs")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Integer, nullable=False)
    total = Column(Integer, nullable=False)
    passed = Column(Boolean, nullable=False)
    attempted_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", back_populates="quiz_attempts")
