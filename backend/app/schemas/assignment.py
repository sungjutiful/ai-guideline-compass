from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.assignment import AiPolicyLevel
from app.models.guideline import ComplianceStatus


class AssignmentBase(BaseModel):
    subject: str
    title: str
    description: str | None = None
    ai_policy_level: AiPolicyLevel
    policy_detail: str | None = None
    due_date: datetime | None = None


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    subject: str | None = None
    title: str | None = None
    description: str | None = None
    ai_policy_level: AiPolicyLevel | None = None
    policy_detail: str | None = None
    due_date: datetime | None = None


class ComplianceCheckRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: ComplianceStatus
    similarity_score: float | None = None
    note: str | None = None
    matched_clause_id: int | None = None


class AssignmentRead(AssignmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    teacher_id: int
    created_at: datetime


class AssignmentDetail(AssignmentRead):
    compliance_checks: list[ComplianceCheckRead] = []
    student_has_consented: bool | None = None
