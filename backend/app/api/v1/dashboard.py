from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.assignment import Assignment
from app.models.consent import Consent
from app.models.user import User, UserRole
from app.schemas.assignment import AssignmentRead

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/current-assignment", response_model=AssignmentRead | None)
def get_current_assignment(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """로그인 시 상단 배너에 표시할, 학생이 아직 동의하지 않은 가장 임박한 과제를 반환합니다."""
    if current_user.role != UserRole.student:
        return None

    consented_ids = [
        c.assignment_id
        for c in db.query(Consent).filter(Consent.student_id == current_user.id).all()
    ]

    query = db.query(Assignment)
    if consented_ids:
        query = query.filter(~Assignment.id.in_(consented_ids))

    assignment = (
        query.filter(Assignment.due_date.isnot(None))
        .order_by(Assignment.due_date.asc())
        .first()
    )
    if not assignment:
        assignment = query.order_by(Assignment.created_at.desc()).first()
    return assignment
