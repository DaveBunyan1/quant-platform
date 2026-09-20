import re
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
from starlette.middleware.cors import CORSMiddleware
from starlette_csrf.middleware import CSRFMiddleware

from quant_platform.api.routes.user import router as user_router
from quant_platform.auth.router import router as auth_router
from quant_platform.features.transactions.exceptions import TransactionNotFound
from quant_platform.features.transactions.router import router as transaction_router
from quant_platform.logging import get_logger, setup_logging
from quant_platform.settings import settings

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("starting_application", environment=settings.environment)
    yield
    logger.info("shutting_down_application")


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app = FastAPI(lifespan=lifespan)


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(auth_router)
app.include_router(transaction_router)


@app.exception_handler(TransactionNotFound)
async def transaction_not_found_handler(
    request: Request,
    exc: TransactionNotFound,
) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={"detail": str(exc)},
    )


Instrumentator(
    should_group_status_codes=True,
    should_ignore_untemplated=True,
    excluded_handlers=["/metrics", "/api/health"],
).instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)


@app.get("/api/health")
def health():
    return {"status": "ok"}
