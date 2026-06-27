from fastapi import FastAPI, APIRouter, Header, HTTPException, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

PUSH_BASE_URL = "https://integrations.emergentagent.com"
PUSH_KEY = os.environ.get("EMERGENT_PUSH_KEY", "placeholder")
EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

app = FastAPI(title="BorrowRight API")
api = APIRouter(prefix="/api")

push_client = httpx.AsyncClient(
    base_url=PUSH_BASE_URL,
    headers={"X-Push-Key": PUSH_KEY},
    timeout=10.0,
)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ----------------------------- Models -----------------------------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def new_id(prefix: str = "id") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


class UserPublic(BaseModel):
    user_id: str
    email: Optional[str] = None
    name: Optional[str] = None
    picture: Optional[str] = None
    mobile: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    occupation: Optional[str] = None
    employment_type: Optional[str] = None
    # KYC
    dob: Optional[str] = None
    gender: Optional[str] = None
    pan: Optional[str] = None
    aadhaar: Optional[str] = None
    monthly_income: Optional[float] = None
    company_name: Optional[str] = None
    business_name: Optional[str] = None
    preferred_language: Optional[str] = None
    marital_status: Optional[str] = None
    existing_loan: Optional[bool] = None
    cibil_score: Optional[int] = None
    onboarded: bool = False
    created_at: datetime = Field(default_factory=now_utc)


class OtpRequest(BaseModel):
    mobile: str
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class OtpVerify(BaseModel):
    mobile: str
    code: str
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class GoogleSessionBody(BaseModel):
    session_id: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    city: Optional[str] = None
    state: Optional[str] = None
    occupation: Optional[str] = None
    employment_type: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    pan: Optional[str] = None
    aadhaar: Optional[str] = None
    monthly_income: Optional[float] = None
    company_name: Optional[str] = None
    business_name: Optional[str] = None
    preferred_language: Optional[str] = None
    marital_status: Optional[str] = None
    existing_loan: Optional[bool] = None
    cibil_score: Optional[int] = None
    onboarded: Optional[bool] = None


class ApplicationCreate(BaseModel):
    loan_type: str  # e.g., 'home', 'personal'
    loan_amount: Optional[float] = None
    purpose: Optional[str] = None
    property_value: Optional[float] = None
    property_address: Optional[str] = None
    property_type: Optional[str] = None
    existing_loan: Optional[bool] = None
    current_emi: Optional[float] = None
    preferred_bank: Optional[str] = None
    loan_required_by: Optional[str] = None  # '7d','15d','30d','60d'
    remarks: Optional[str] = None
    # Contact
    full_address: Optional[str] = None
    pin_code: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    whatsapp_number: Optional[str] = None
    alternate_mobile: Optional[str] = None
    email: Optional[EmailStr] = None
    preferred_contact_time: Optional[str] = None
    preferred_communication: Optional[str] = None


class ApplicationUpdate(ApplicationCreate):
    loan_type: Optional[str] = None  # allow partial


class DocumentUpload(BaseModel):
    doc_type: str  # 'pan','aadhaar','income','bank','itr','salary','property','sale','electricity','photo','other'
    filename: str
    mime_type: Optional[str] = "application/octet-stream"
    base64_data: str  # data URL or raw base64


class RegisterPushBody(BaseModel):
    user_id: str
    platform: str
    device_token: str


# Status pipeline
STAGES = [
    "submitted",
    "documents_received",
    "bank_login",
    "legal_verification",
    "valuation",
    "approval",
    "sanction_letter",
    "disbursement",
]


# ----------------------------- Auth helpers -----------------------------
async def get_user_by_token(token: str) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None
    exp = session.get("expires_at")
    if isinstance(exp, datetime):
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < now_utc():
            return None
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    return user


async def current_user(authorization: Optional[str]) -> Dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ", 1)[1].strip()
    user = await get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return user


async def create_session(user_id: str) -> str:
    token = uuid.uuid4().hex + uuid.uuid4().hex
    await db.user_sessions.insert_one({
        "session_token": token,
        "user_id": user_id,
        "created_at": now_utc(),
        "expires_at": now_utc() + timedelta(days=7),
    })
    return token


# ----------------------------- Routes -----------------------------
@api.get("/")
async def root():
    return {"message": "BorrowRight API", "status": "ok"}


@api.post("/auth/otp/request")
async def otp_request(body: OtpRequest):
    # Dev OTP — always succeeds. Any 6-digit code accepted on verify.
    return {"status": "sent", "mobile": body.mobile, "dev_hint": "Enter any 6-digit code"}


@api.post("/auth/otp/verify")
async def otp_verify(body: OtpVerify):
    if not body.code or len(body.code) != 6 or not body.code.isdigit():
        raise HTTPException(400, "Enter a 6-digit code")
    mobile = body.mobile.strip()
    user = await db.users.find_one({"mobile": mobile}, {"_id": 0})
    if not user:
        user_id = new_id("usr")
        user = {
            "user_id": user_id,
            "mobile": mobile,
            "email": body.email,
            "name": body.name,
            "onboarded": False,
            "created_at": now_utc(),
        }
        await db.users.insert_one(dict(user))
        user.pop("_id", None)
    token = await create_session(user["user_id"])
    return {"session_token": token, "user": _clean(user)}


@api.post("/auth/google/session")
async def google_session(body: GoogleSessionBody):
    async with httpx.AsyncClient(timeout=10.0) as cx:
        r = await cx.get(EMERGENT_SESSION_URL, headers={"X-Session-ID": body.session_id})
    if r.status_code != 200:
        raise HTTPException(401, "Invalid session id")
    data = r.json()
    email = data.get("email")
    if not email:
        raise HTTPException(400, "Missing email from Google")
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user_id = new_id("usr")
        user = {
            "user_id": user_id,
            "email": email,
            "name": data.get("name"),
            "picture": data.get("picture"),
            "onboarded": False,
            "created_at": now_utc(),
        }
        await db.users.insert_one(dict(user))
    token = await create_session(user["user_id"])
    user_clean = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {"session_token": token, "user": _clean(user_clean)}


@api.get("/auth/me")
async def auth_me(authorization: Optional[str] = Header(default=None)):
    user = await current_user(authorization)
    return _clean(user)


@api.post("/auth/logout")
async def auth_logout(authorization: Optional[str] = Header(default=None)):
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        await db.user_sessions.delete_one({"session_token": token})
    return {"status": "ok"}


@api.put("/me/profile")
async def update_profile(body: ProfileUpdate, authorization: Optional[str] = Header(default=None)):
    user = await current_user(authorization)
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if update:
        update["updated_at"] = now_utc()
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update})
    fresh = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return _clean(fresh)


# Loan types
@api.get("/loan-types")
async def loan_types():
    return [
        {"id": "home", "name": "Home Loan", "icon": "house", "desc": "For buying or building your home"},
        {"id": "lap", "name": "Loan Against Property", "icon": "building-office", "desc": "Unlock the value of your property"},
        {"id": "car", "name": "Car Loan", "icon": "car", "desc": "Drive home your dream car"},
        {"id": "personal", "name": "Personal Loan", "icon": "wallet", "desc": "Quick funds for any need"},
        {"id": "business", "name": "Business Loan", "icon": "briefcase", "desc": "Grow and scale your business"},
        {"id": "construction", "name": "Construction Loan", "icon": "hammer", "desc": "Build your dream property"},
        {"id": "working_capital", "name": "Working Capital", "icon": "chart-line", "desc": "Smooth cash flow for ops"},
        {"id": "other", "name": "Others", "icon": "ellipsis-horizontal", "desc": "Custom loan needs"},
    ]


@api.get("/banks")
async def banks_list(loan_type: Optional[str] = None, amount: Optional[float] = None, tenure: Optional[int] = None):
    rows = [
        {"id": "hdfc", "name": "HDFC Bank", "initials": "HDFC", "color": "#0A3B2A",
         "interest_rate": 8.5, "processing_fee_pct": 0.5, "max_tenure": 30, "best_value": True},
        {"id": "sbi", "name": "State Bank of India", "initials": "SBI", "color": "#155D44",
         "interest_rate": 8.65, "processing_fee_pct": 0.35, "max_tenure": 30, "best_value": False},
        {"id": "icici", "name": "ICICI Bank", "initials": "ICICI", "color": "#0A3B2A",
         "interest_rate": 8.75, "processing_fee_pct": 0.5, "max_tenure": 25, "best_value": False},
        {"id": "axis", "name": "Axis Bank", "initials": "AXIS", "color": "#155D44",
         "interest_rate": 8.85, "processing_fee_pct": 0.5, "max_tenure": 25, "best_value": False},
        {"id": "kotak", "name": "Kotak Mahindra", "initials": "KOTAK", "color": "#0A3B2A",
         "interest_rate": 8.95, "processing_fee_pct": 0.6, "max_tenure": 25, "best_value": False},
        {"id": "pnb", "name": "Punjab National Bank", "initials": "PNB", "color": "#155D44",
         "interest_rate": 8.7, "processing_fee_pct": 0.4, "max_tenure": 30, "best_value": False},
    ]
    # Add EMI estimate for given amount & tenure
    p = amount or 5000000
    n_years = tenure or 20
    n = n_years * 12
    for row in rows:
        r = row["interest_rate"] / 12 / 100
        emi = (p * r * (1 + r) ** n) / ((1 + r) ** n - 1) if r else p / n
        row["estimated_emi"] = round(emi)
        row["processing_fee"] = round(p * row["processing_fee_pct"] / 100)
    return rows


@api.get("/faqs")
async def faqs():
    return [
        {"q": "How is BorrowRight different from a broker?", "a": "We are an independent advisory — zero cash, fully documented, and we work for you, not the bank."},
        {"q": "What is the 15% cash refund?", "a": "We commit to returning at least 15% of the total cost involved in your loan, making your borrowing more rewarding."},
        {"q": "How long does loan approval take?", "a": "Sanction and disbursement typically complete in 10 working days for ready cases."},
        {"q": "Is my data safe?", "a": "Yes — all documents are encrypted and stored in secure cloud. Access is role-based and audited."},
        {"q": "Do I need to visit any office?", "a": "No physical visit required. You can also share documents over WhatsApp with your dedicated Relationship Manager."},
        {"q": "Can I track my application status?", "a": "Yes — track all 8 stages live from your dashboard, from submission to disbursement."},
    ]


@api.get("/promise")
async def promise():
    return {
        "problems": [
            "Lack of understanding of interest rates",
            "Confusing bank products",
            "Hidden borrowing costs",
            "Dependence on brokers",
            "Cash payments to agents",
            "No transparency",
            "No accountability",
        ],
        "solutions": [
            "Transparent Loan Advisory",
            "Compare Banks",
            "Ethical Process",
            "Lower Total Cost",
            "Complete Documentation Support",
            "End-to-End Coordination",
        ],
        "differentiators": [
            {"icon": "check-circle", "title": "Easy & Transparent", "desc": "No hidden fees, no surprises."},
            {"icon": "lightning-bolt", "title": "10 Day Disbursement", "desc": "Sanction & disbursement in 10 working days."},
            {"icon": "user", "title": "Dedicated RM", "desc": "One expert from start to finish."},
            {"icon": "shield-check", "title": "Zero Cash Policy", "desc": "100% documented & ethical."},
            {"icon": "currency-rupee", "title": "Min 15% Cash Refund", "desc": "We share savings back with you."},
        ],
        "cost_comparison": {"market": "2-2.5%", "ours": "0.75-1%"},
    }


# ---------------- Applications ----------------
@api.post("/applications")
async def create_application(body: ApplicationCreate, authorization: Optional[str] = Header(default=None)):
    user = await current_user(authorization)
    app_id = new_id("app")
    doc = {
        "application_id": app_id,
        "user_id": user["user_id"],
        **body.model_dump(),
        "status": "draft",
        "stage": "submitted",
        "stages_completed": [],
        "rm": _default_rm(),
        "created_at": now_utc(),
        "updated_at": now_utc(),
    }
    await db.applications.insert_one(dict(doc))
    return _clean(doc)


@api.get("/applications")
async def list_applications(authorization: Optional[str] = Header(default=None)):
    user = await current_user(authorization)
    cursor = db.applications.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(100)
    return [_clean(x) for x in items]


@api.get("/applications/{app_id}")
async def get_application(app_id: str, authorization: Optional[str] = Header(default=None)):
    user = await current_user(authorization)
    app_doc = await db.applications.find_one({"application_id": app_id, "user_id": user["user_id"]}, {"_id": 0})
    if not app_doc:
        raise HTTPException(404, "Application not found")
    return _clean(app_doc)


@api.put("/applications/{app_id}")
async def update_application(app_id: str, body: ApplicationUpdate, authorization: Optional[str] = Header(default=None)):
    user = await current_user(authorization)
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    update["updated_at"] = now_utc()
    res = await db.applications.update_one({"application_id": app_id, "user_id": user["user_id"]}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(404, "Application not found")
    fresh = await db.applications.find_one({"application_id": app_id}, {"_id": 0})
    return _clean(fresh)


@api.post("/applications/{app_id}/documents")
async def upload_document(app_id: str, body: DocumentUpload, authorization: Optional[str] = Header(default=None)):
    user = await current_user(authorization)
    app_doc = await db.applications.find_one({"application_id": app_id, "user_id": user["user_id"]}, {"_id": 0})
    if not app_doc:
        raise HTTPException(404, "Application not found")
    doc_id = new_id("doc")
    rec = {
        "document_id": doc_id,
        "application_id": app_id,
        "user_id": user["user_id"],
        "doc_type": body.doc_type,
        "filename": body.filename,
        "mime_type": body.mime_type,
        "base64_data": body.base64_data,
        "uploaded_at": now_utc(),
    }
    await db.documents.insert_one(dict(rec))
    return {"document_id": doc_id, "doc_type": body.doc_type, "filename": body.filename}


@api.get("/applications/{app_id}/documents")
async def list_documents(app_id: str, authorization: Optional[str] = Header(default=None)):
    user = await current_user(authorization)
    cursor = db.documents.find(
        {"application_id": app_id, "user_id": user["user_id"]},
        {"_id": 0, "base64_data": 0},
    )
    items = await cursor.to_list(200)
    return items


@api.post("/applications/{app_id}/submit")
async def submit_application(app_id: str, authorization: Optional[str] = Header(default=None)):
    user = await current_user(authorization)
    app_doc = await db.applications.find_one({"application_id": app_id, "user_id": user["user_id"]}, {"_id": 0})
    if not app_doc:
        raise HTTPException(404, "Application not found")
    await db.applications.update_one(
        {"application_id": app_id},
        {"$set": {
            "status": "submitted",
            "stage": "submitted",
            "stages_completed": ["submitted"],
            "submitted_at": now_utc(),
            "updated_at": now_utc(),
        }},
    )
    # Fire-and-forget push
    try:
        await send_push(
            recipients=[user["user_id"]],
            data={
                "title": "Application Submitted ✅",
                "message": f"Your {app_doc.get('loan_type','loan').replace('_',' ').title()} application is received. Your RM will reach out shortly.",
                "action_url": f"/status",
            },
        )
    except Exception as e:
        logger.warning(f"push failed (non-blocking): {e}")
    fresh = await db.applications.find_one({"application_id": app_id}, {"_id": 0})
    return _clean(fresh)


@api.get("/applications/{app_id}/timeline")
async def application_timeline(app_id: str, authorization: Optional[str] = Header(default=None)):
    user = await current_user(authorization)
    app_doc = await db.applications.find_one({"application_id": app_id, "user_id": user["user_id"]}, {"_id": 0})
    if not app_doc:
        raise HTTPException(404, "Application not found")
    done = set(app_doc.get("stages_completed", []) or [])
    return [
        {"key": s, "label": s.replace("_", " ").title(), "completed": s in done, "active": s == app_doc.get("stage")}
        for s in STAGES
    ]


# Push registration relay
@api.post("/register-push", status_code=201)
async def register_push(body: RegisterPushBody):
    try:
        resp = await push_client.post("/api/v1/push/users/register", json=body.model_dump())
        if resp.status_code == 401:
            logger.warning("EMERGENT_PUSH_KEY missing or invalid")
            return {"status": "queued"}
        if resp.status_code >= 500:
            return {"status": "queued"}
        # tolerate any 2xx/4xx
        return {"status": "registered"}
    except Exception as e:
        logger.warning(f"register-push failed: {e}")
        return {"status": "queued"}


async def send_push(recipients: List[str], data: Dict[str, Any], idempotency_key: Optional[str] = None) -> None:
    if not recipients:
        return
    if "title" not in data or "message" not in data:
        raise ValueError("data must include title and message")
    payload: Dict[str, Any] = {"recipients": recipients, "data": data}
    if idempotency_key:
        payload["$idempotency_key"] = idempotency_key
    try:
        resp = await push_client.post("/api/v1/push/trigger", json=payload)
        if resp.status_code >= 500:
            logger.warning(f"Push provider 5xx: {resp.status_code}")
    except Exception as e:
        logger.warning(f"send_push exception: {e}")


# ---------------- Helpers ----------------
def _default_rm() -> Dict[str, Any]:
    return {
        "name": "Priya Sharma",
        "title": "Senior Relationship Manager",
        "phone": "+919826739349",
        "whatsapp": "+919826739349",
        "email": "priya@splendidconsultants.in",
        "photo": "https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwcHJvZmVzc2lvbmFsJTIwYnVzaW5lc3MlMjB3b21hbiUyMGhlYWRzaG90JTIwc21pbGluZyUyMGNsZWFyJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3ODI1NzcxMTF8MA&ixlib=rb-4.1.0&q=85",
    }


def _clean(d: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if d is None:
        return None
    d = dict(d)
    d.pop("_id", None)
    for k, v in list(d.items()):
        if isinstance(v, datetime):
            d[k] = v.astimezone(timezone.utc).isoformat() if v.tzinfo else v.replace(tzinfo=timezone.utc).isoformat()
    return d


# ---------------- Startup ----------------
@app.on_event("startup")
async def startup():
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("email", sparse=True)
    await db.users.create_index("mobile", sparse=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
    await db.applications.create_index("application_id", unique=True)
    await db.applications.create_index("user_id")
    await db.documents.create_index("document_id", unique=True)
    await db.documents.create_index("application_id")
    logger.info("DB indexes ready")


@app.on_event("shutdown")
async def shutdown():
    client.close()
    await push_client.aclose()


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
