import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auth, products, orders, pre_orders, ai, notifications, users, admin

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🚀 {settings.APP_NAME} started")
    logger.info(f"Gemini AI: {'✅ aktif' if settings.gemini_available else '⚠️ tidak dikonfigurasi (fallback mode)'}")
    logger.info(f"Firebase FCM: {'✅ aktif' if settings.firebase_available else '⚠️ tidak dikonfigurasi'}")
    yield
    logger.info("Server shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    description="API untuk AI Smart Sales & Buyer Hub",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(pre_orders.router)
app.include_router(ai.router)
app.include_router(notifications.router)
app.include_router(users.router)
app.include_router(admin.router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "gemini": settings.gemini_available,
        "firebase": settings.firebase_available,
    }


@app.get("/")
def root():
    return {"message": f"Selamat datang di {settings.APP_NAME} API"}
