from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.session import get_db
from app.models.usage_log import QuizAttempt
from app.models.user import User, UserRole
from app.schemas.quiz import (
    QuizQuestionPublic,
    QuizStatus,
    QuizSubmitRequest,
    QuizSubmitResponse,
)
from app.services import quiz as quiz_service

router = APIRouter(prefix="/quiz", tags=["quiz"])


@router.get("/questions", response_model=list[QuizQuestionPublic])
def get_questions(current_user: User = Depends(require_roles(UserRole.student))):
    return quiz_service.get_public_questions()


@router.post("/submit", response_model=QuizSubmitResponse)
def submit_quiz(
    payload: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.student)),
):
    score, total, correct_answers = quiz_service.grade(payload.answers)
    passed = quiz_service.is_passing(score, total)

    attempt = QuizAttempt(
        student_id=current_user.id, score=score, total=total, passed=passed
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return QuizSubmitResponse(
        score=score,
        total=total,
        passed=passed,
        correct_answers=correct_answers,
        attempted_at=attempt.attempted_at,
    )


@router.get("/status", response_model=QuizStatus)
def get_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.student)),
):
    latest_passed = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.student_id == current_user.id, QuizAttempt.passed.is_(True))
        .order_by(QuizAttempt.attempted_at.desc())
        .first()
    )
    return QuizStatus(
        has_passed=latest_passed is not None,
        latest_attempt=latest_passed.attempted_at if latest_passed else None,
    )
