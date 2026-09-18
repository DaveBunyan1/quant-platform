import re
from contextlib import asynccontextmanager

from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from starlette.middleware.cors import CORSMiddleware
from starlette_csrf.middleware import CSRFMiddleware

from quant_platform.api.routers.user import router as user_router
from quant_platform.auth.router import router as auth_router
from quant_platform.logging import get_logger, setup_logging
from quant_platform.settings import settings

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("starting_application", environment=settings.environment)
    yield
    logger.info("shutting_down_application")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    CSRFMiddleware,
    secret=settings.csrf_secret_token,
    sensitive_cookies={settings.refresh_token_cookie_name},
    cookie_domain="localhost",
    exempt_urls=[
        re.compile(r"^/auth/login$"),
        re.compile(r"^/auth/register$"),
        re.compile(r"^/auth/refresh$"),
        re.compile(r"^/auth/logout$"),
    ],
)

app.include_router(user_router)
app.include_router(auth_router)

Instrumentator(
    should_group_status_codes=True,
    should_ignore_untemplated=True,
    excluded_handlers=["/metrics", "/api/health"],
).instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)


@app.get("/api/health")
def health():
    return {"status": "ok"}
