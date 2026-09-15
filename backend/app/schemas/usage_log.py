from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.usage_log import UsageEntryType


class UsageLogCreate(BaseModel):
    entry_type: UsageEntryType
    content: str
    source_tool: str | None = None


class UsageLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    assignment_id: int
    student_id: int
    student_name: str | None = None
    entry_type: UsageEntryType
    content: str
    source_tool: str | None = None
    pii_detected: bool
    pii_warnings: list[str] = []
    created_at: datetime


class UsageSummary(BaseModel):
    total_entries: int
    ai_entries: int
    self_written_entries: int
    ai_usage_ratio: float
    entries: list[UsageLogRead]
