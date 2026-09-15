import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.chat import ChatMessage
from app.models.user import User
from app.schemas.chat import ChatAskRequest, ChatAskResponse, ChatSourceClause
from app.services.rag.chatbot import answer_question

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/ask", response_model=ChatAskResponse)
def ask_chatbot(
    payload: ChatAskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = answer_question(payload.question)

    chat_message = ChatMessage(
        user_id=current_user.id,
        question=payload.question,
        answer=result["answer"],
        matched_clause_ids=json.dumps(
            [s["clause_id"] for s in result["sources"]]
        ),
        confidence=result["confidence"],
        needs_teacher_check=1 if result["needs_teacher_check"] else 0,
    )
    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)

    return ChatAskResponse(
        answer=result["answer"],
        sources=[
            ChatSourceClause(
                clause_id=s["clause_id"],
                clause_number=s["clause_number"],
                document_title=s["document_title"],
                content=s["content"],
                similarity=s["similarity"],
            )
            for s in result["sources"]
        ],
        confidence=result["confidence"],
        needs_teacher_check=result["needs_teacher_check"],
        created_at=chat_message.created_at,
    )
