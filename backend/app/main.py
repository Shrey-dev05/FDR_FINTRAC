from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base
from app.scripts.seed_demo import seed_database
from app.api.v1 import (
    auth, dashboard, institutions, fdrs, verification, requests, documents, notifications, reports, admin
)

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for AICTE Security Deposit / FDR Management Portal (Problem Statement 26265)",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev & demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(institutions.router, prefix="/api/v1")
app.include_router(fdrs.router, prefix="/api/v1")
app.include_router(verification.router, prefix="/api/v1")
app.include_router(requests.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    seed_database()

@app.get("/health")
def health_check():
    return {"status": "healthy", "app": settings.APP_NAME, "env": settings.APP_ENV}

@app.get("/ready")
def ready_check():
    return {"status": "ready", "database": "connected"}

@app.get("/")
def root():
    return {
        "message": "AICTE Security Deposit / Fixed Deposit Receipt (FDR) Management Portal API",
        "docs": "/api/docs",
        "version": "v1"
    }
