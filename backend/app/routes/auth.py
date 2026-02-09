from fastapi import APIRouter

router = APIRouter()


@router.post("/login")
async def login():
    """Placeholder for user authentication."""
    return {"message": "Auth endpoint - not yet implemented"}


@router.post("/register")
async def register():
    """Placeholder for user registration."""
    return {"message": "Register endpoint - not yet implemented"}
