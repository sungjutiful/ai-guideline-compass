from datetime import datetime

from pydantic import BaseModel


class QuizQuestionPublic(BaseModel):
    id: int
    question: str


class QuizSubmitRequest(BaseModel):
    answers: dict[int, bool]  # 문항 id -> 참(True)/거짓(False) 응답


class QuizSubmitResponse(BaseModel):
    score: int
    total: int
    passed: bool
    correct_answers: dict[int, bool]
    attempted_at: datetime


class QuizStatus(BaseModel):
    has_passed: bool
    latest_attempt: datetime | None = None
