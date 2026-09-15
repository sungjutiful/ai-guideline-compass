from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.session import get_db
from app.models.assignment import Assignment
from app.models.consent import Consent
from app.models.usage_log import QuizAttempt
from app.models.user import User, UserRole
from app.schemas.consent import ConsentRead

router = APIRouter(prefix="/assignments", tags=["consents"])


@router.post(
    "/{assignment_id}/consent",
    response_model=ConsentRead,
    status_code=status.HTTP_201_CREATED,
)
def agree_to_assignment_policy(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.student)),
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="과제를 찾을 수 없습니다."
        )

    existing = (
        db.query(Consent)
        .filter(
            Consent.assignment_id == assignment_id,
            Consent.student_id == current_user.id,
        )
        .first()
    )
    if existing:
        return existing

    has_passed_quiz = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.student_id == current_user.id, QuizAttempt.passed.is_(True))
        .first()
    )
    if not has_passed_quiz:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="사전교육 퀴즈를 먼저 통과해야 동의할 수 있습니다.",
        )

    consent = Consent(assignment_id=assignment_id, student_id=current_user.id)
    db.add(consent)
    db.commit()
    db.refresh(consent)
    return consent
