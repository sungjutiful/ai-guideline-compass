from pydantic import BaseModel


class AdminStats(BaseModel):
    user_counts: dict[str, int]
    policy_level_counts: dict[str, int]
    compliance_status_counts: dict[str, int]
    total_assignments: int
    total_consents: int
    total_guideline_documents: int
    total_pii_flags: int
    total_quiz_attempts: int
    quiz_pass_rate: float
