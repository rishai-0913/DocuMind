from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from auth import create_access_token
from config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    if body.username != settings.auth_username or body.password != settings.auth_password:
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    return LoginResponse(
        access_token=create_access_token(),
        username=settings.auth_username,
    )
