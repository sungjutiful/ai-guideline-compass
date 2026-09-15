from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class GuidelineDocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    source: str
    version: str | None = None
    effective_date: date | None = None
    uploaded_at: datetime


class GuidelineClauseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_id: int
    clause_number: str | None = None
    content: str
    category: str | None = None


class GuidelineUploadResponse(BaseModel):
    document: GuidelineDocumentRead
    clause_count: int
