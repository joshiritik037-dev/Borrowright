# BorrowRight — Product Requirements Document

**Product**: BorrowRight by Splendid Consultants
**Tagline**: India's Transparent Retail Loan Advisory Platform
**Version**: v1.0 (MVP)

## Vision
A modern FinTech mobile app that simplifies retail finance by making loans transparent, affordable, ethical, and hassle-free. Users get the right loan at the lowest cost — without brokers, hidden charges, or unnecessary paperwork.

## V1 Scope (Shipped)

### Authentication
- Mobile OTP login (Dev mode — any 6-digit code accepted; swap to Twilio/MSG91 later by replacing the `otp_verify` endpoint logic).
- Emergent-managed Google Login (one-tap via `auth.emergentagent.com`).

### Core Flows
1. **Splash → Welcome → Login → OTP / Google → Onboarding (KYC) → Tabs**.
2. **Apply**: Select Loan Type → Requirement (loan amount, purpose, property, contact, location) → Documents (upload + WhatsApp share) → Review → Submit → Success.
3. **Dashboard**: Home (greeting, 15% cash refund hero, quick actions, active app tracker, RM card), Loans (8 categories + tools), Status (8-stage vertical tracker), Profile (FAQs, RM, sign out).

### Standout Features
- **15% Cash Refund** promise — featured on Home + Promise page.
- **Loan Status Tracker** — 8-stage vertical stepper (Submitted → Documents Received → Bank Login → Legal → Valuation → Approval → Sanction Letter → Disbursement).
- **EMI Calculator** — live updates as you change amount/rate/tenure.
- **Bank Comparison** — 6 banks with rate, EMI estimate, processing fee; one marked BEST VALUE.
- **WhatsApp Document Sharing** — single tap → `wa.me/919826739349` with pre-filled message.
- **Our Promise page** — problem cards, solution cards, differentiators, cost-comparison (2% vs 1%).
- **Push Notifications** — Emergent-managed (placeholder key; activated on build).

### Tech Stack
- **Frontend**: Expo SDK 54, Expo Router, React Native, expo-notifications, expo-secure-store, @expo/vector-icons.
- **Backend**: FastAPI (Python), Motor (MongoDB async), httpx for push relay, JSON token sessions stored in `user_sessions` with TTL.
- **Storage**: MongoDB collections — `users`, `user_sessions`, `applications`, `documents`.
- **Theme**: Modern Premium FinTech — deep forest green (#0A3B2A) + gold (#D4AF37) on warm off-white surfaces.

## Out of Scope (V1)
- Admin panel (deferred per user choice).
- SMS OTP via Twilio/MSG91 (currently dev mode).
- Google Maps integration (manual address entry only).
- Native document picker (uses placeholder upload in preview; native picker can be added with `expo-document-picker` + `expo-image-picker`).

## Test Coverage
- 22/22 backend pytest pass.
- E2E frontend flow validated by testing agent: auth → onboarding → apply (with empty optional fields) → submit → status → sign out.

## Future Roadmap
- Real OTP gateway (Twilio Verify / MSG91).
- Document OCR + auto-categorization.
- Admin panel for RMs (assign leads, update status, export Excel).
- Live chat with RM in-app.
- Refer & Earn with unique referral codes + payout tracking.
