from fastapi import APIRouter, HTTPException

from app.database import supabase, supabase_admin
from app.schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    UserProfile,
    AuthResponse,
    MessageResponse,
)

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
async def register(body: UserRegisterRequest):
    """Register a new user with email + password.

    1. Creates the user in Supabase Auth
    2. Inserts a row into the `users` table with their profile info
    3. Returns tokens + profile
    """
    try:
        # Step 1: Create user in Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": body.email,
            "password": body.password,
        })

        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Registration failed")

        user_id = auth_response.user.id

        # Step 2: Insert profile into `users` table
        supabase_admin.table("users").insert({
            "id": user_id,
            "email": body.email,
            "full_name": body.full_name,
            "plan": "free",
        }).execute()

        # Session may be None if email confirmation is enabled
        session = auth_response.session

        return AuthResponse(
            user=UserProfile(
                id=user_id,
                email=body.email,
                full_name=body.full_name,
                plan="free",
            ),
            access_token=session.access_token if session else None,
            refresh_token=session.refresh_token if session else None,
            message="Check your email to confirm your account" if not session else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=AuthResponse)
async def login(body: UserLoginRequest):
    """Log in with email + password. Returns tokens + profile."""
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })

        if not auth_response.user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user_id = auth_response.user.id

        # Fetch profile from `users` table
        result = supabase_admin.table("users").select("*").eq("id", user_id).single().execute()
        profile = result.data

        return AuthResponse(
            user=UserProfile(
                id=profile["id"],
                email=profile["email"],
                full_name=profile["full_name"],
                plan=profile.get("plan", "free"),
                created_at=profile.get("created_at"),
            ),
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
        )

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid email or password")


@router.post("/logout", response_model=MessageResponse)
async def logout():
    """Log out the current user (invalidates their session)."""
    try:
        supabase.auth.sign_out()
        return MessageResponse(message="Logged out successfully")
    except Exception:
        raise HTTPException(status_code=500, detail="Logout failed")


@router.get("/me", response_model=UserProfile)
async def get_current_user():
    """Get the currently authenticated user's profile."""
    user = supabase.auth.get_user()

    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_id = user.user.id
    result = supabase_admin.table("users").select("*").eq("id", user_id).single().execute()
    profile = result.data

    return UserProfile(
        id=profile["id"],
        email=profile["email"],
        full_name=profile["full_name"],
        plan=profile.get("plan", "free"),
        created_at=profile.get("created_at"),
    )
