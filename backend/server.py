from fastapi import FastAPI, APIRouter, Header, HTTPException, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import re
import secrets
import hashlib
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MockCursor:
    def __init__(self, data):
        self.data = data

    def sort(self, key, direction=-1):
        try:
            self.data.sort(key=lambda x: x.get(key) or datetime.min, reverse=(direction == -1))
        except Exception:
            pass
        return self

    async def to_list(self, length=100):
        return self.data[:length]

class MockCollection:
    def __init__(self, name):
        self.name = name
        self.data = []

    async def find_one(self, query, projection=None):
        for doc in self.data:
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                return dict(doc)
        return None

    async def insert_one(self, doc):
        self.data.append(dict(doc))
        return self

    async def update_one(self, query, update, upsert=False):
        doc = await self.find_one(query)
        if not doc:
            if upsert:
                new_doc = dict(query)
                if "$set" in update:
                    new_doc.update(update["$set"])
                self.data.append(new_doc)
            return self
        
        if "$set" in update:
            for k, v in update["$set"].items():
                doc[k] = v
        if "$inc" in update:
            for k, v in update["$inc"].items():
                doc[k] = doc.get(k, 0) + v
        
        for i, item in enumerate(self.data):
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                self.data[i] = doc
                break
        return self

    async def delete_one(self, query):
        for i, item in enumerate(self.data):
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                self.data.pop(i)
                break
        return self

    def find(self, query, projection=None):
        matched = []
        for doc in self.data:
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                matched.append(dict(doc))
        return MockCursor(matched)

    async def create_index(self, *args, **kwargs):
        pass

class MockDB:
    def __init__(self):
        self.collections = {}

    def __getattr__(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection(name)
        return self.collections[name]

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'borrowright')

db_online = False
if mongo_url:
    try:
        from pymongo import MongoClient
        sync_client = MongoClient(mongo_url, serverSelectionTimeoutMS=1000)
        sync_client.admin.command('ping')
        db_online = True
        sync_client.close()
    except Exception as e:
        logger.warning(f"MongoDB ping failed: {e}. Swapping to MockDB.")
        db_online = False

if db_online:
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
else:
    db = MockDB()
    logger.info("Using Mock In-Memory Database fallback.")

PUSH_BASE_URL = "https://integrations.emergentagent.com"
PUSH_KEY = os.environ.get("EMERGENT_PUSH_KEY", "placeholder")
EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

# OTP provider switch: dev | msg91
OTP_PROVIDER = os.environ.get("OTP_PROVIDER", "dev").lower()
MSG91_AUTH_KEY = os.environ.get("MSG91_AUTH_KEY", "")
MSG91_SENDER_ID = os.environ.get("MSG91_SENDER_ID", "SPLNDC")
MSG91_TEMPLATE_ID = os.environ.get("MSG91_TEMPLATE_ID", "")

# Refer & Earn — payout = REFERRAL_PCT * disbursed_amount
REFERRAL_PCT = float(os.environ.get("REFERRAL_PCT", "0.001"))  # 0.10%

app = FastAPI(title="TrueBorrow API")
api = APIRouter(prefix="/api")

push_client = httpx.AsyncClient(
    base_url=PUSH_BASE_URL,
    headers={"X-Push-Key": PUSH_KEY},
    timeout=10.0,
)


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


class StartSessionBody(BaseModel):
    name: Optional[str] = None
    mobile: str
    referral_code: Optional[str] = None


class ApplyReferralBody(BaseModel):
    referral_code: str


class MarkDisbursedBody(BaseModel):
    disbursed_amount: Optional[float] = None  # if not provided, uses loan_amount


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
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
    email: Optional[str] = None
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


# Status pipeline (2 stages: processing & approved)
STAGES = [
    "processing",
    "approved",
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


# ---------------- OTP provider abstraction ----------------
# Removed OTP logic as per new requirements



# ---------------- Referral helpers ----------------
def _make_referral_code(name: Optional[str]) -> str:
    base = re.sub(r"[^A-Za-z]", "", (name or "USER")).upper()[:6] or "USER"
    suffix = secrets.token_hex(2).upper()  # 4 hex chars
    return f"{base}-{suffix}"


async def _ensure_referral_code(user: Dict[str, Any]) -> str:
    code = user.get("referral_code")
    if code:
        return code
    # Generate unique code
    for _ in range(8):
        candidate = _make_referral_code(user.get("name"))
        exists = await db.users.find_one({"referral_code": candidate}, {"_id": 0, "user_id": 1})
        if not exists:
            await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"referral_code": candidate}})
            return candidate
    # Fallback
    candidate = f"BR-{secrets.token_hex(3).upper()}"
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"referral_code": candidate}})
    return candidate


async def _apply_referral(new_user_id: str, referral_code: Optional[str]) -> None:
    if not referral_code:
        return
    code = referral_code.strip().upper()
    referrer = await db.users.find_one({"referral_code": code}, {"_id": 0})
    if not referrer or referrer["user_id"] == new_user_id:
        return
    # idempotent — only once per referred user
    existing = await db.referrals.find_one({"referred_user_id": new_user_id}, {"_id": 0})
    if existing:
        return
    await db.referrals.insert_one({
        "referral_id": new_id("ref"),
        "referrer_user_id": referrer["user_id"],
        "referred_user_id": new_user_id,
        "status": "signed_up",  # signed_up | applied | disbursed
        "reward_amount": 0,
        "disbursed_amount": 0,
        "created_at": now_utc(),
        "updated_at": now_utc(),
    })
    await db.users.update_one({"user_id": new_user_id}, {"$set": {"referred_by_code": code}})


# ----------------------------- Routes -----------------------------
@api.get("/")
async def root():
    return {"message": "TrueBorrow API", "status": "ok"}


@api.post("/auth/start")
async def start_session(body: StartSessionBody):
    mobile = body.mobile.strip()
    name = (body.name or "").strip()
    if not mobile:
        raise HTTPException(400, "Mobile number is required")

    # Find existing user by mobile
    user = await db.users.find_one({"mobile": mobile}, {"_id": 0})
    is_new = False
    if not user:
        is_new = True
        user_id = new_id("usr")
        user = {
            "user_id": user_id,
            "mobile": mobile,
            "name": name or "User",
            "onboarded": False,
            "created_at": now_utc(),
        }
        await db.users.insert_one(dict(user))
        await _ensure_referral_code(user)
        await _apply_referral(user_id, body.referral_code)
    else:
        user_id = user["user_id"]
        if name and name != "User" and user.get("name") != name:
            await db.users.update_one({"user_id": user_id}, {"$set": {"name": name}})
    
    token = await create_session(user_id)
    fresh = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"session_token": token, "user": _clean(fresh), "is_new": is_new}


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
        {"q": "How is TrueBorrow different from a broker?", "a": "We are an independent advisory — zero cash, fully documented, and we work for you, not the bank."},
        {"q": "What is the 15% cash refund?", "a": "We commit to returning at least 15% of the processing fees involved in your loan, making your borrowing more rewarding."},
        {"q": "Is my data safe?", "a": "Yes — all documents are encrypted and stored in secure cloud. Access is role-based and audited."},
        {"q": "Do I need to visit any office?", "a": "No physical visit required. You can also share documents over WhatsApp with your dedicated Contact Person."},
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
        "status": "processing",
        "stage": "processing",
        "stages_completed": ["processing"],
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
            "status": "processing",
            "stage": "processing",
            "stages_completed": ["processing"],
            "submitted_at": now_utc(),
            "updated_at": now_utc(),
        }},
    )
    # Update referral: mark the user as 'applied' so referrer can see progress
    try:
        await db.referrals.update_one(
            {"referred_user_id": user["user_id"], "status": "signed_up"},
            {"$set": {"status": "applied", "applied_application_id": app_id, "updated_at": now_utc()}},
        )
    except Exception as e:
        logger.warning(f"referral applied update failed: {e}")
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


# ---------------- Refer & Earn ----------------
@api.get("/me/referrals")
async def my_referrals(authorization: Optional[str] = Header(default=None)):
    user = await current_user(authorization)
    code = await _ensure_referral_code(user)
    cursor = db.referrals.find({"referrer_user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(200)
    # Enrich with referred user names
    enriched = []
    total_earned = 0.0
    pending_earned = 0.0
    for r in items:
        ru = await db.users.find_one({"user_id": r["referred_user_id"]}, {"_id": 0, "name": 1, "mobile": 1, "created_at": 1})
        reward = float(r.get("reward_amount") or 0)
        if r.get("status") == "disbursed":
            total_earned += reward
        else:
            pending_earned += reward
        enriched.append({
            **_clean(r),
            "referred_name": (ru or {}).get("name") or "Pending",
            "referred_mobile_mask": _mask_mobile((ru or {}).get("mobile")),
        })
    return {
        "referral_code": code,
        "share_text": _share_text(user.get("name"), code),
        "stats": {
            "total_invites": len(items),
            "signed_up": sum(1 for r in items if r.get("status") in ("signed_up", "applied", "disbursed")),
            "applied": sum(1 for r in items if r.get("status") in ("applied", "disbursed")),
            "disbursed": sum(1 for r in items if r.get("status") == "disbursed"),
            "total_earned": round(total_earned),
            "pending_earned": round(pending_earned),
            "reward_pct": REFERRAL_PCT * 100,
        },
        "referrals": enriched,
    }


@api.post("/me/referrals/apply")
async def apply_referral_post(body: ApplyReferralBody, authorization: Optional[str] = Header(default=None)):
    user = await current_user(authorization)
    if user.get("referred_by_code"):
        raise HTTPException(400, "Referral code already applied")
    # Don't allow self-referral
    code = body.referral_code.strip().upper()
    if user.get("referral_code") == code:
        raise HTTPException(400, "Cannot use your own code")
    referrer = await db.users.find_one({"referral_code": code}, {"_id": 0})
    if not referrer:
        raise HTTPException(404, "Invalid referral code")
    await _apply_referral(user["user_id"], code)
    return {"status": "applied", "referrer_name": referrer.get("name") or "Friend"}


@api.post("/applications/{app_id}/mark-disbursed")
async def mark_disbursed(app_id: str, body: MarkDisbursedBody, authorization: Optional[str] = Header(default=None)):
    """Simulate disbursement (in production this would be admin-gated).
    Moves application to 'disbursed' stage and computes referral reward."""
    user = await current_user(authorization)
    app_doc = await db.applications.find_one({"application_id": app_id, "user_id": user["user_id"]}, {"_id": 0})
    if not app_doc:
        raise HTTPException(404, "Application not found")
    disbursed = float(body.disbursed_amount or app_doc.get("loan_amount") or 0)
    if disbursed <= 0:
        raise HTTPException(400, "Disbursed amount required")
    all_stages = STAGES  # full pipeline
    await db.applications.update_one(
        {"application_id": app_id},
        {"$set": {
            "status": "approved",
            "stage": "approved",
            "stages_completed": ["processing", "approved"],
            "disbursed_amount": disbursed,
            "disbursed_at": now_utc(),
            "updated_at": now_utc(),
        }},
    )
    # Award referral
    ref = await db.referrals.find_one({"referred_user_id": user["user_id"]}, {"_id": 0})
    if ref and ref.get("status") != "disbursed":
        reward = round(disbursed * REFERRAL_PCT)
        await db.referrals.update_one(
            {"referral_id": ref["referral_id"]},
            {"$set": {
                "status": "disbursed",
                "reward_amount": reward,
                "disbursed_amount": disbursed,
                "disbursed_application_id": app_id,
                "updated_at": now_utc(),
            }},
        )
        # Notify the referrer
        try:
            referrer_name = (await db.users.find_one({"user_id": ref["referrer_user_id"]}, {"_id": 0, "name": 1}) or {}).get("name") or "there"
            await send_push(
                recipients=[ref["referrer_user_id"]],
                data={
                    "title": f"You earned ₹{reward:,}! 🎉",
                    "message": f"Your friend's loan was disbursed. Your reward has been credited.",
                    "action_url": "/refer",
                },
                idempotency_key=f"reward-{ref['referral_id']}",
            )
        except Exception as e:
            logger.warning(f"reward push failed: {e}")
    fresh = await db.applications.find_one({"application_id": app_id}, {"_id": 0})
    return _clean(fresh)


@api.post("/applications/{app_id}/approve")
async def approve_application(app_id: str, authorization: Optional[str] = Header(default=None)):
    user = await current_user(authorization)
    app_doc = await db.applications.find_one({"application_id": app_id}, {"_id": 0})
    if not app_doc:
        raise HTTPException(404, "Application not found")
    amount = float(app_doc.get("loan_amount") or 500000)
    await db.applications.update_one(
        {"application_id": app_id},
        {"$set": {
            "status": "approved",
            "stage": "approved",
            "stages_completed": ["processing", "approved"],
            "approved_at": now_utc(),
            "updated_at": now_utc(),
        }},
    )
    # Award referral
    try:
        ref = await db.referrals.find_one({"referred_user_id": app_doc["user_id"]}, {"_id": 0})
        if ref and ref.get("status") != "disbursed":
            reward = round(amount * REFERRAL_PCT)
            await db.referrals.update_one(
                {"referral_id": ref["referral_id"]},
                {"$set": {
                    "status": "disbursed",
                    "reward_amount": reward,
                    "disbursed_amount": amount,
                    "disbursed_application_id": app_id,
                    "updated_at": now_utc(),
                }},
            )
    except Exception as e:
        logger.warning(f"referral award failed: {e}")
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
        "name": "Ritik Joshi",
        "title": "Contact Person",
        "phone": "+919826739349",
        "whatsapp": "+919826739349",
        "email": "ritik@splendidconsultants.in",
    }


def _default_rms() -> List[Dict[str, Any]]:
    return [
        {
            "name": "Ritik Joshi",
            "title": "Contact Person",
            "phone": "+919826739349",
            "whatsapp": "+919826739349",
            "email": "ritik@splendidconsultants.in",
        },
        {
            "name": "Koushiki Khandelwal",
            "title": "Contact Person",
            "phone": "+919301931777",
            "whatsapp": "+919301931777",
            "email": "koushiki@splendidconsultants.in",
        },
    ]


@api.get("/rms")
async def get_rms():
    return _default_rms()



def _clean(d: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if d is None:
        return None
    d = dict(d)
    d.pop("_id", None)
    for k, v in list(d.items()):
        if isinstance(v, datetime):
            d[k] = v.astimezone(timezone.utc).isoformat() if v.tzinfo else v.replace(tzinfo=timezone.utc).isoformat()
    return d


def _mask_mobile(m: Optional[str]) -> Optional[str]:
    if not m:
        return None
    digits = re.sub(r"\D", "", m)
    if len(digits) < 4:
        return "•••"
    return f"•••••{digits[-4:]}"


def _share_text(name: Optional[str], code: str) -> str:
    n = (name or "I").strip().split(" ")[0]
    return (
        f"Hi! I'm using TrueBorrow by Splendid Consultants to get loans at the lowest possible cost — "
        f"transparent, no brokers, no hidden charges. Use my code *{code}* to get a dedicated RM and "
        f"share in the savings (min 15% cash refund). Download now."
    )


# ---------------- Startup ----------------
@app.on_event("startup")
async def startup():
    try:
        import asyncio
        async def create_indexes():
            await db.users.create_index("user_id", unique=True)
            await db.users.create_index("email", sparse=True)
            await db.users.create_index("mobile", sparse=True)
            await db.users.create_index("referral_code", sparse=True, unique=True)
            await db.user_sessions.create_index("session_token", unique=True)
            await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
            await db.applications.create_index("application_id", unique=True)
            await db.applications.create_index("user_id")
            await db.documents.create_index("document_id", unique=True)
            await db.documents.create_index("application_id")
            await db.referrals.create_index("referral_id", unique=True)
            await db.referrals.create_index("referrer_user_id")
            await db.referrals.create_index("referred_user_id", unique=True)
            await db.otp_codes.create_index("mobile", unique=True)
            await db.otp_codes.create_index("expires_at", expireAfterSeconds=0)
        
        await asyncio.wait_for(create_indexes(), timeout=3.0)
        logger.info("DB indexes ready")
    except Exception as e:
        logger.warning(f"Could not connect to MongoDB or index creation timed out: {e}. Switching to Mock In-Memory Database.")
        global db
        db = MockDB()


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
