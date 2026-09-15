from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.auth.security import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.db.sqlite import get_user_by_username, log_audit

router = APIRouter()

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user_by_username(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        # Log failed login attempt
        log_audit(
            user_id="UNKNOWN",
            username=form_data.username,
            role="UNKNOWN",
            action="LOGIN_FAILED",
            target_resource="SYSTEM",
            status="FAILURE",
            details="Invalid credentials"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Log successful login
    log_audit(
        user_id=user["user_id"],
        username=user["username"],
        role=user["role"],
        action="LOGIN_SUCCESS",
        target_resource="SYSTEM",
        status="SUCCESS"
    )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "user_id": user["user_id"], "role": user["role"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user_id": user["user_id"], "role": user["role"]}
