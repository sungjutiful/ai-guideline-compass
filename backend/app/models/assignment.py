import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class AiPolicyLevel(str, enum.Enum):
    prohibited = "prohibited"  # 금지
    limited = "limited"  # 제한적 허용
    full = "full"  # 전면 허용


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    ai_policy_level = Column(Enum(AiPolicyLevel), nullable=False)
    policy_detail = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    teacher = relationship("User", back_populates="assignments")
    consents = relationship(
        "Consent", back_populates="assignment", cascade="all, delete-orphan"
    )
    compliance_checks = relationship(
        "PolicyComplianceCheck",
        back_populates="assignment",
        cascade="all, delete-orphan",
    )
    usage_logs = relationship(
        "AiUsageLog", back_populates="assignment", cascade="all, delete-orphan"
    )
