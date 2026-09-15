from datetime import datetime

from pydantic import BaseModel


class ChatAskRequest(BaseModel):
    question: str


class ChatSourceClause(BaseModel):
    clause_id: int
    clause_number: str | None = None
    document_title: str
    content: str
    similarity: float


class ChatAskResponse(BaseModel):
    answer: str
    sources: list[ChatSourceClause]
    confidence: float
    needs_teacher_check: bool
    created_at: datetime
