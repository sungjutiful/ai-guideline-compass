import enum
from datetime import date, datetime

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.db.base import Base


class GuidelineDocument(Base):
    __tablename__ = "guideline_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    source = Column(String(200), nullable=False)  # 예: 교육부, OO교육청
    version = Column(String(50), nullable=True)
    effective_date = Column(Date, nullable=True)
    file_path = Column(String(500), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    clauses = relationship(
        "GuidelineClause", back_populates="document", cascade="all, delete-orphan"
    )


class GuidelineClause(Base):
    __tablename__ = "guideline_clauses"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("guideline_documents.id"), nullable=False)
    clause_number = Column(String(50), nullable=True)
    content = Column(Text, nullable=False)
    category = Column(String(50), nullable=True)
    vector_id = Column(String(100), unique=True, nullable=True)

    document = relationship("GuidelineDocument", back_populates="clauses")


class ComplianceStatus(str, enum.Enum):
    compliant = "compliant"  # 준수
    violation = "violation"  # 위반 가능성
    ambiguous = "ambiguous"  # 애매(확인 필요)


class PolicyComplianceCheck(Base):
    __tablename__ = "policy_compliance_checks"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    matched_clause_id = Column(
        Integer, ForeignKey("guideline_clauses.id"), nullable=True
    )
    status = Column(Enum(ComplianceStatus), nullable=False)
    similarity_score = Column(Float, nullable=True)
    note = Column(Text, nullable=True)
    checked_at = Column(DateTime, default=datetime.utcnow)

    assignment = relationship("Assignment", back_populates="compliance_checks")
    matched_clause = relationship("GuidelineClause")
