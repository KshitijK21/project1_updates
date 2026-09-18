from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from services.audit_service import log_action
from services.rate_limit import rate_limit
import re, random, uuid

from database.db import get_db
from models.user import User
from services.auth_service import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')


def _validate_password(password: str) -> str | None:
    if len(password) < 8:
        return "Password must be at least 8 characters"
    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return "Password must contain at least one lowercase letter"
    if not re.search(r"\d", password):
        return "Password must contain at least one digit"
    return None


def _generate_code() -> str:
    return f"{random.randint(0, 999999):06d}"


def _user_verified(user: User) -> bool:
    # NULL on the DB column means the account predates verification and is
    # treated as already verified so existing users aren't locked behind a banner.
    return user.is_verified is not False


class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class PasswordResetRequestModel(BaseModel):
    email: str


class PasswordResetModel(BaseModel):
    email: str
    code: str
    new_password: str


class VerifyEmailRequest(BaseModel):
    email: str
    code: str


@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db),
             _rl=Depends(rate_limit(3))):
    if not EMAIL_RE.match(payload.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    password_error = _validate_password(payload.password)
    if password_error:
        raise HTTPException(status_code=400, detail=password_error)

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    verification_code = _generate_code()
    print(f"[VERIFY] {payload.email}: {verification_code}", flush=True)

    user = User(
        id=uuid.uuid4(),
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role="user",
        is_verified=False,
        verification_code_hash=hash_password(verification_code),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    log_action(db, user.id, user.email, "REGISTER", "/auth/register")
    return {"message": "User registered successfully", "user_id": str(user.id), "email": user.email,
            "access_token": token, "token_type": "bearer", "role": user.role,
            "is_verified": _user_verified(user)}


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db),
          _rl=Depends(rate_limit(5))):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    log_action(db, user.id, user.email, "LOGIN", "/auth/login")
    return {"access_token": token, "token_type": "bearer", "role": user.role,
            "is_verified": _user_verified(user)}


@router.post("/password-reset-request")
def password_reset_request(payload: PasswordResetRequestModel, db: Session = Depends(get_db),
                           _rl=Depends(rate_limit(3))):
    # Silently succeed whether or not the account exists to prevent enumeration.
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        code = _generate_code()
        user.reset_token_hash = hash_password(code)
        db.commit()
        print(f"[PASSWORD RESET] {payload.email}: {code}", flush=True)
    return {"message": "If an account exists with that email, a reset code has been sent."}


@router.post("/password-reset")
def password_reset(payload: PasswordResetModel, db: Session = Depends(get_db),
                   _rl=Depends(rate_limit(5))):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.reset_token_hash or not verify_password(payload.code, user.reset_token_hash):
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    password_error = _validate_password(payload.new_password)
    if password_error:
        raise HTTPException(status_code=400, detail=password_error)

    user.hashed_password = hash_password(payload.new_password)
    user.reset_token_hash = None
    db.commit()
    return {"message": "Password reset successful"}


@router.post("/verify-email")
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db),
                 _rl=Depends(rate_limit(5))):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.verification_code_hash or not verify_password(payload.code, user.verification_code_hash):
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    user.is_verified = True
    user.verification_code_hash = None
    db.commit()
    return {"message": "Email verified successfully", "email": user.email, "is_verified": True}