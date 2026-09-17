import re

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette_csrf.middleware import CSRFMiddleware

from quant_platform.api.routers.user import router as user_router
from quant_platform.auth.router import router as auth_router
from quant_platform.settings import settings

app = FastAPI()

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
    ],
)

app.include_router(user_router)
app.include_router(auth_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
