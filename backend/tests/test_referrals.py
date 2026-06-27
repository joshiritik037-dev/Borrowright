"""Refer & Earn end-to-end tests.

Covers:
- /me/referrals returns referral_code (NAME-XXXX), share_text, stats, referrals[]
- New-user signup with referral_code at OTP verify creates a referral record
- POST /me/referrals/apply (success, self-referral, invalid code, duplicate)
- Application submit moves referral signed_up -> applied
- mark-disbursed pays 0.10% to referrer (status -> disbursed, total_earned set)
"""
import re
import pytest
import requests


def _verify_otp(api_client, base_url, mobile, name=None, referral_code=None):
    api_client.post(f"{base_url}/api/auth/otp/request", json={"mobile": mobile})
    body = {"mobile": mobile, "code": "123456"}
    if name:
        body["name"] = name
    if referral_code:
        body["referral_code"] = referral_code
    r = api_client.post(f"{base_url}/api/auth/otp/verify", json=body)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="module")
def referrer(api_client, base_url):
    """A user who will refer others. Returns dict with token, user, headers, code."""
    data = _verify_otp(api_client, base_url, "9555500111", name="TEST_Ravi_Kumar")
    token = data["session_token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    # fetch code
    r = api_client.get(f"{base_url}/api/me/referrals", headers=headers)
    assert r.status_code == 200, r.text
    payload = r.json()
    return {
        "token": token,
        "user": data["user"],
        "headers": headers,
        "code": payload["referral_code"],
    }


class TestReferralCode:
    def test_referral_code_is_name_based(self, referrer):
        code = referrer["code"]
        # Format: NAME-XXXX where NAME is letters (uppercase) and XXXX is 4 hex chars
        assert re.match(r"^[A-Z]+-[0-9A-F]{4}$", code), f"Bad code format: {code}"
        # Prefix from name 'TEST_Ravi_Kumar' (letters only) -> 'TESTRA' (6 chars max)
        prefix = code.split("-")[0]
        assert prefix == "TESTRA", f"Expected TESTRA prefix, got {prefix}"

    def test_my_referrals_initial_shape(self, api_client, base_url, referrer):
        r = api_client.get(f"{base_url}/api/me/referrals", headers=referrer["headers"])
        assert r.status_code == 200
        data = r.json()
        assert "referral_code" in data
        assert "share_text" in data and referrer["code"] in data["share_text"]
        stats = data["stats"]
        for k in ("total_invites", "signed_up", "applied", "disbursed",
                  "total_earned", "pending_earned", "reward_pct"):
            assert k in stats
        assert stats["reward_pct"] == pytest.approx(0.10)
        assert isinstance(data["referrals"], list)


class TestReferralOnSignup:
    """Verifies referral_code passed at OTP verify creates a referral."""

    def test_signup_with_referral_code_creates_record(self, api_client, base_url, referrer):
        # Brand new user with referrer's code
        new_data = _verify_otp(
            api_client, base_url,
            "9555500222", name="TEST_Pooja_Sharma", referral_code=referrer["code"],
        )
        new_token = new_data["session_token"]
        new_user = new_data["user"]
        assert new_user.get("referred_by_code") == referrer["code"]

        # Verify referrer sees this new invite
        r = api_client.get(f"{base_url}/api/me/referrals", headers=referrer["headers"])
        assert r.status_code == 200
        data = r.json()
        assert data["stats"]["total_invites"] >= 1
        assert data["stats"]["signed_up"] >= 1
        refs = [x for x in data["referrals"] if x["referred_user_id"] == new_user["user_id"]]
        assert len(refs) == 1
        rec = refs[0]
        assert rec["status"] == "signed_up"
        assert rec["referred_name"] == "TEST_Pooja_Sharma"


class TestApplyReferralEndpoint:
    """POST /me/referrals/apply for users who didn't enter code at signup."""

    def test_self_referral_rejected(self, api_client, base_url, referrer):
        r = api_client.post(
            f"{base_url}/api/me/referrals/apply",
            json={"referral_code": referrer["code"]},
            headers=referrer["headers"],
        )
        assert r.status_code == 400
        assert "own code" in r.json().get("detail", "").lower()

    def test_invalid_code_404(self, api_client, base_url):
        # Fresh user without referral
        data = _verify_otp(api_client, base_url, "9555500333", name="TEST_Invalid")
        headers = {"Authorization": f"Bearer {data['session_token']}",
                   "Content-Type": "application/json"}
        r = api_client.post(
            f"{base_url}/api/me/referrals/apply",
            json={"referral_code": "NOPE-9999"},
            headers=headers,
        )
        assert r.status_code == 404

    def test_apply_success_and_duplicate_rejected(self, api_client, base_url, referrer):
        # Fresh user — apply referrer code post-signup
        data = _verify_otp(api_client, base_url, "9555500444", name="TEST_Apply_User")
        headers = {"Authorization": f"Bearer {data['session_token']}",
                   "Content-Type": "application/json"}
        r = api_client.post(
            f"{base_url}/api/me/referrals/apply",
            json={"referral_code": referrer["code"]},
            headers=headers,
        )
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "applied"
        # Re-apply should now be rejected
        r2 = api_client.post(
            f"{base_url}/api/me/referrals/apply",
            json={"referral_code": referrer["code"]},
            headers=headers,
        )
        assert r2.status_code == 400


class TestReferralLifecycle:
    """End-to-end: signup with code → apply loan → submit → mark-disbursed → reward paid."""

    def test_lifecycle_signed_up_applied_disbursed(self, api_client, base_url, referrer):
        # 1. Brand new referred user
        data = _verify_otp(
            api_client, base_url,
            "9555500555", name="TEST_Lifecycle_User", referral_code=referrer["code"],
        )
        token = data["session_token"]
        new_user_id = data["user"]["user_id"]
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # 2. Create + submit application
        create = api_client.post(
            f"{base_url}/api/applications",
            json={"loan_type": "home", "loan_amount": 5000000, "city": "Indore"},
            headers=headers,
        )
        assert create.status_code == 200, create.text
        app_id = create.json()["application_id"]

        submit = api_client.post(
            f"{base_url}/api/applications/{app_id}/submit", headers=headers,
        )
        assert submit.status_code == 200, submit.text

        # 3. Referrer should now see status='applied' for this referral
        r = api_client.get(f"{base_url}/api/me/referrals", headers=referrer["headers"])
        rec = next((x for x in r.json()["referrals"]
                    if x["referred_user_id"] == new_user_id), None)
        assert rec is not None, "referral record missing"
        assert rec["status"] == "applied", f"expected applied, got {rec['status']}"

        # 4. Mark disbursed with ₹50,00,000
        disb = api_client.post(
            f"{base_url}/api/applications/{app_id}/mark-disbursed",
            json={"disbursed_amount": 5000000},
            headers=headers,
        )
        assert disb.status_code == 200, disb.text
        d = disb.json()
        assert d["status"] == "disbursed"
        assert d["stage"] == "disbursement"
        assert len(d.get("stages_completed", [])) == 8

        # 5. Referrer earned 0.10% of 50L = ₹5000
        r2 = api_client.get(f"{base_url}/api/me/referrals", headers=referrer["headers"])
        data2 = r2.json()
        rec2 = next((x for x in data2["referrals"]
                     if x["referred_user_id"] == new_user_id), None)
        assert rec2["status"] == "disbursed"
        assert rec2["reward_amount"] == 5000
        # total_earned should include this reward (could be cumulative)
        assert data2["stats"]["total_earned"] >= 5000
        assert data2["stats"]["disbursed"] >= 1
