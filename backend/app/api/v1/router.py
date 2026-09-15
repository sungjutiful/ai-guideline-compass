from fastapi import APIRouter

from app.api.v1 import assignments, auth, chatbot, consents, dashboard, guidelines

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(assignments.router)
api_router.include_router(consents.router)
api_router.include_router(guidelines.router)
api_router.include_router(chatbot.router)
api_router.include_router(dashboard.router)
