from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.base import Base


class Consent(Base):
    __tablename__ = "consents"
    __table_args__ = (
        UniqueConstraint(
            "assignment_id", "student_id", name="uq_consent_assignment_student"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    agreed_at = Column(DateTime, default=datetime.utcnow)

    assignment = relationship("Assignment", back_populates="consents")
    student = relationship("User", back_populates="consents")
