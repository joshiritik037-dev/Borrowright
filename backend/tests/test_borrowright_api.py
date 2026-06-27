"""BorrowRight backend API tests covering auth, applications, documents, banks, faqs, promise."""
import pytest


# ----- Health -----
class TestHealth:
    def test_healthcheck(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "ok"
        assert "BorrowRight" in data.get("message", "")


# ----- Loan types -----
class TestLoanTypes:
    def test_loan_types_returns_8(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/loan-types")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 8
        ids = {x["id"] for x in data}
        expected = {"home", "lap", "car", "personal", "business",
                    "construction", "working_capital", "other"}
        assert ids == expected
        for x in data:
            assert {"id", "name", "icon", "desc"} <= set(x.keys())


# ----- Banks -----
class TestBanks:
    def test_banks_emi_and_best_value(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/banks", params={"amount": 5000000, "tenure": 20})
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 6
        for b in data:
            assert "estimated_emi" in b and b["estimated_emi"] > 0
            assert "processing_fee" in b and b["processing_fee"] > 0
        assert sum(1 for b in data if b.get("best_value")) == 1
        # Make sure no _id leaks
        for b in data:
            assert "_id" not in b


# ----- FAQs / Promise -----
class TestContent:
    def test_faqs_returns_6(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/faqs")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 6
        for f in data:
            assert f.get("q") and f.get("a")

    def test_promise_structure(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/promise")
        assert r.status_code == 200
        data = r.json()
        for k in ["problems", "solutions", "differentiators", "cost_comparison"]:
            assert k in data
        assert isinstance(data["problems"], list) and len(data["problems"]) >= 5
        assert isinstance(data["solutions"], list) and len(data["solutions"]) >= 5
        assert isinstance(data["differentiators"], list) and len(data["differentiators"]) >= 3
        assert "market" in data["cost_comparison"] and "ours" in data["cost_comparison"]


# ----- Auth: OTP -----
class TestOtpAuth:
    def test_otp_request_returns_sent(self, api_client, base_url):
        r = api_client.post(f"{base_url}/api/auth/otp/request", json={"mobile": "9999900001"})
        assert r.status_code == 200
        assert r.json().get("status") == "sent"

    def test_otp_verify_valid_6_digit(self, api_client, base_url):
        r = api_client.post(
            f"{base_url}/api/auth/otp/verify",
            json={"mobile": "9999900002", "code": "123456", "name": "TEST_Otp"},
        )
        assert r.status_code == 200
        data = r.json()
        assert data.get("session_token")
        assert data.get("user", {}).get("user_id")
        assert "_id" not in data["user"]

    def test_otp_verify_short_code_rejected(self, api_client, base_url):
        r = api_client.post(
            f"{base_url}/api/auth/otp/verify",
            json={"mobile": "9999900003", "code": "1234"},
        )
        assert r.status_code == 400

    def test_otp_verify_non_numeric_rejected(self, api_client, base_url):
        r = api_client.post(
            f"{base_url}/api/auth/otp/verify",
            json={"mobile": "9999900004", "code": "abcdef"},
        )
        assert r.status_code == 400

    def test_auth_me_returns_user(self, api_client, base_url, auth_headers, auth_session):
        _, user = auth_session
        r = api_client.get(f"{base_url}/api/auth/me", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["user_id"] == user["user_id"]
        assert "_id" not in data

    def test_auth_me_unauthorized(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/auth/me")
        assert r.status_code == 401

    def test_auth_me_invalid_token(self, api_client, base_url):
        r = api_client.get(
            f"{base_url}/api/auth/me",
            headers={"Authorization": "Bearer invalidtoken123"},
        )
        assert r.status_code == 401


# ----- Profile update -----
class TestProfile:
    def test_profile_update_onboarded(self, api_client, base_url, auth_headers):
        payload = {
            "name": "TEST_User",
            "city": "Indore",
            "state": "MP",
            "dob": "1990-01-01",
            "pan": "ABCDE1234F",
            "onboarded": True,
        }
        r = api_client.put(f"{base_url}/api/me/profile", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("onboarded") is True
        assert data.get("city") == "Indore"
        assert data.get("pan") == "ABCDE1234F"
        assert "_id" not in data


# ----- Applications -----
class TestApplications:
    @pytest.fixture(scope="class")
    def app_id(self, api_client, base_url, auth_headers):
        payload = {
            "loan_type": "home",
            "loan_amount": 5000000,
            "purpose": "TEST_purchase",
            "full_address": "123 Test St",
            "pin_code": "452001",
            "city": "Indore",
            "state": "MP",
        }
        r = api_client.post(f"{base_url}/api/applications", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["loan_type"] == "home"
        assert data["status"] == "draft"
        assert data["stage"] == "submitted"
        assert "_id" not in data
        return data["application_id"]

    def test_list_applications(self, api_client, base_url, auth_headers, app_id):
        r = api_client.get(f"{base_url}/api/applications", headers=auth_headers)
        assert r.status_code == 200
        items = r.json()
        assert any(a["application_id"] == app_id for a in items)
        for a in items:
            assert "_id" not in a

    def test_get_application_detail(self, api_client, base_url, auth_headers, app_id):
        r = api_client.get(f"{base_url}/api/applications/{app_id}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["application_id"] == app_id

    def test_update_application_partial(self, api_client, base_url, auth_headers, app_id):
        r = api_client.put(
            f"{base_url}/api/applications/{app_id}",
            json={"loan_amount": 6000000, "remarks": "TEST_updated"},
            headers=auth_headers,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["loan_amount"] == 6000000
        assert data["remarks"] == "TEST_updated"
        # Verify persistence
        r2 = api_client.get(f"{base_url}/api/applications/{app_id}", headers=auth_headers)
        assert r2.json()["loan_amount"] == 6000000

    def test_upload_document(self, api_client, base_url, auth_headers, app_id):
        payload = {
            "doc_type": "pan",
            "filename": "TEST_pan.png",
            "mime_type": "image/png",
            "base64_data": "data:image/png;base64,AAAA",
        }
        r = api_client.post(
            f"{base_url}/api/applications/{app_id}/documents",
            json=payload,
            headers=auth_headers,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["doc_type"] == "pan"
        assert data["filename"] == "TEST_pan.png"

    def test_list_documents_excludes_base64(self, api_client, base_url, auth_headers, app_id):
        r = api_client.get(
            f"{base_url}/api/applications/{app_id}/documents",
            headers=auth_headers,
        )
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 1
        for d in items:
            assert "base64_data" not in d
            assert "_id" not in d

    def test_submit_application(self, api_client, base_url, auth_headers, app_id):
        r = api_client.post(
            f"{base_url}/api/applications/{app_id}/submit",
            headers=auth_headers,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "submitted"
        assert data["stage"] == "submitted"
        assert "submitted" in data.get("stages_completed", [])

    def test_timeline_8_stages(self, api_client, base_url, auth_headers, app_id):
        r = api_client.get(
            f"{base_url}/api/applications/{app_id}/timeline",
            headers=auth_headers,
        )
        assert r.status_code == 200
        stages = r.json()
        assert len(stages) == 8
        expected_keys = ["submitted", "documents_received", "bank_login", "legal_verification",
                        "valuation", "approval", "sanction_letter", "disbursement"]
        assert [s["key"] for s in stages] == expected_keys
        submitted = next(s for s in stages if s["key"] == "submitted")
        assert submitted["completed"] is True
        assert submitted["active"] is True

    def test_applications_unauthorized(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/applications")
        assert r.status_code == 401

    def test_get_application_not_found(self, api_client, base_url, auth_headers):
        r = api_client.get(f"{base_url}/api/applications/app_nonexistent", headers=auth_headers)
        assert r.status_code == 404
