import hashlib
import hmac
from typing import Annotated, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import settings

_scheme = HTTPBearer(auto_error=False)


def _derive_token() -> str:
    """Deterministically derive a token from credentials using GROQ key as signing secret."""
    msg = f"{settings.auth_username}:{settings.auth_password}".encode()
    return hmac.new(settings.groq_api_key.encode(), msg, hashlib.sha256).hexdigest()


def create_access_token() -> str:
    return _derive_token()


def require_auth(
    creds: Annotated[Optional[HTTPAuthorizationCredentials], Depends(_scheme)],
) -> str:
    if not creds or not hmac.compare_digest(creds.credentials, _derive_token()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return settings.auth_username


def optional_auth(
    creds: Annotated[Optional[HTTPAuthorizationCredentials], Depends(_scheme)],
) -> Optional[str]:
    """Returns username if authenticated, None for guests. Never raises 401."""
    if creds and hmac.compare_digest(creds.credentials, _derive_token()):
        return settings.auth_username
    return None
