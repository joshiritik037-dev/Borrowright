import os
import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

# Load frontend .env to get the public backend URL (matches what user/frontend uses)
load_dotenv(Path("/app/frontend/.env"))

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    raise RuntimeError("EXPO_PUBLIC_BACKEND_URL not set")


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth_session(api_client):
    """Create a verified-OTP session and return (token, user)."""
    mobile = "9876500001"  # TEST_ prefix not applicable for mobile; using a test number
    r = api_client.post(f"{BASE_URL}/api/auth/otp/request", json={"mobile": mobile})
    assert r.status_code == 200, r.text
    r = api_client.post(
        f"{BASE_URL}/api/auth/otp/verify",
        json={"mobile": mobile, "code": "123456", "name": "TEST_User"},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    return data["session_token"], data["user"]


@pytest.fixture(scope="session")
def auth_headers(auth_session):
    token, _ = auth_session
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
