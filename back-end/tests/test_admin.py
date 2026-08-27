import pytest

from main import app
from extensions import db
from models.users import User


@pytest.fixture
def client():
    app.config.update(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
        JWT_SECRET_KEY="test-secret-key-that-is-long-enough",
    )

    with app.app_context():
        db.drop_all()
        db.create_all()

        yield app.test_client()

        db.session.remove()
        db.drop_all()


def register_user(
    client,
    username="TestUser",
    email="test@example.com",
    password="password123",
):
    return client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "password": password,
            "confirm_password": password,
        },
    )


def login_user(
    client,
    email="test@example.com",
    password="password123",
):
    return client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )


def get_token(response):
    return response.get_json()["access_token"]


def auth_headers(token):
    return {
        "Authorization": f"Bearer {token}"
    }


def create_admin(client):
    register_user(
        client,
        username="AdminUser",
        email="admin@example.com",
    )

    with app.app_context():
        admin = User.query.filter_by(
            email="admin@example.com"
        ).first()

        admin.role = "admin"
        db.session.commit()

    response = login_user(
        client,
        email="admin@example.com",
    )

    return get_token(response)


def create_user(client):
    register_user(
        client,
        username="Reporter",
        email="reporter@example.com",
    )

    response = login_user(
        client,
        email="reporter@example.com",
    )

    return get_token(response)


def create_incident(client, token, **overrides):
    payload = {
        "title": "Broken street light",
        "description": "Street light near the gate is not working.",
        "incident_type": "intervention",
        "latitude": -1.2921,
        "longitude": 36.8219,
    }

    payload.update(overrides)

    response = client.post(
        "/incidents",
        headers=auth_headers(token),
        json=payload,
    )

    return response


# =========================================================
# AUTHORIZATION
# =========================================================

def test_admin_dashboard_requires_authentication(client):
    response = client.get("/admin/dashboard")

    assert response.status_code == 401


def test_normal_user_cannot_access_admin_dashboard(client):
    token = create_user(client)

    response = client.get(
        "/admin/dashboard",
        headers=auth_headers(token),
    )

    assert response.status_code == 403
    assert response.get_json()["message"] == (
        "Administrator privileges are required"
    )


def test_admin_can_access_dashboard(client):
    token = create_admin(client)

    response = client.get(
        "/admin/dashboard",
        headers=auth_headers(token),
    )

    assert response.status_code == 200


# =========================================================
# DASHBOARD
# =========================================================

def test_admin_dashboard_summary(client):
    admin_token = create_admin(client)
    reporter_token = create_user(client)

    create_incident(client, reporter_token)
    create_incident(
        client,
        reporter_token,
        title="Water leak",
        incident_type="red-flag",
    )

    response = client.get(
        "/admin/dashboard",
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 200

    data = response.get_json()

    assert "summary" in data
    assert "total_reports" in data["summary"]
    assert "status_counts" in data["summary"]

    assert data["summary"]["total_reports"] == 2


def test_admin_dashboard_recent_incidents(client):
    admin_token = create_admin(client)
    reporter_token = create_user(client)

    create_incident(client, reporter_token)

    response = client.get(
        "/admin/dashboard?recent_limit=1",
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 200

    data = response.get_json()

    assert len(data["recent_incidents"]) == 1


# =========================================================
# INCIDENT LISTING
# =========================================================

def test_admin_can_list_incidents(client):
    admin_token = create_admin(client)
    reporter_token = create_user(client)

    create_incident(client, reporter_token)

    response = client.get(
        "/admin/incidents",
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 200

    data = response.get_json()

    assert "items" in data
    assert "pagination" in data
    assert len(data["items"]) == 1


def test_admin_can_filter_by_status(client):
    admin_token = create_admin(client)
    reporter_token = create_user(client)

    create_incident(client, reporter_token)

    response = client.get(
        "/admin/incidents?status=under%20investigation",
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 200

    data = response.get_json()

    assert len(data["items"]) == 1
    assert data["items"][0]["status"] == "under investigation"


def test_admin_can_filter_by_incident_type(client):
    admin_token = create_admin(client)
    reporter_token = create_user(client)

    create_incident(
        client,
        reporter_token,
        incident_type="red-flag",
    )

    response = client.get(
        "/admin/incidents?incident_type=red-flag",
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 200

    data = response.get_json()

    assert len(data["items"]) == 1
    assert data["items"][0]["incident_type"] == "red-flag"


def test_admin_can_search_incidents(client):
    admin_token = create_admin(client)
    reporter_token = create_user(client)

    create_incident(
        client,
        reporter_token,
        title="Broken street light",
        description="Street light near the gate is not working.",
    )

    create_incident(
        client,
        reporter_token,
        title="Water pipe burst",
        description="A water pipe has burst near the parking area.",
    )

    response = client.get(
        "/admin/incidents?q=street%20light",
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 200

    data = response.get_json()

    assert len(data["items"]) == 1
    assert data["items"][0]["title"] == "Broken street light"


def test_admin_incident_listing_pagination(client):
    admin_token = create_admin(client)
    reporter_token = create_user(client)

    for i in range(3):
        create_incident(
            client,
            reporter_token,
            title=f"Incident {i}",
        )

    response = client.get(
        "/admin/incidents?page=1&per_page=2",
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 200

    data = response.get_json()

    assert len(data["items"]) == 2
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["per_page"] == 2
    assert data["pagination"]["total"] == 3


# =========================================================
# SINGLE INCIDENT
# =========================================================

def test_admin_can_view_single_incident(client):
    admin_token = create_admin(client)
    reporter_token = create_user(client)

    incident_response = create_incident(
        client,
        reporter_token,
    )

    incident_id = incident_response.get_json()["incident"]["id"]

    response = client.get(
        f"/admin/incidents/{incident_id}",
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 200

    data = response.get_json()

    assert "incident" in data
    assert data["incident"]["id"] == incident_id
    assert "media" in data["incident"]


def test_admin_view_nonexistent_incident(client):
    admin_token = create_admin(client)

    response = client.get(
        "/admin/incidents/9999",
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 404
    assert response.get_json()["message"] == "Incident not found"


# =========================================================
# INCIDENT STATUS UPDATE
# =========================================================

def test_admin_can_update_incident_status(client):
    admin_token = create_admin(client)
    reporter_token = create_user(client)

    incident_response = create_incident(
        client,
        reporter_token,
    )

    incident_id = incident_response.get_json()["incident"]["id"]

    response = client.patch(
        f"/admin/incidents/{incident_id}",
        headers=auth_headers(admin_token),
        json={
            "status": "verified",
        },
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["message"] == "Incident status updated successfully"
    assert data["incident"]["status"] == "verified"


def test_normal_user_cannot_update_incident_status(client):
    reporter_token = create_user(client)

    incident_response = create_incident(
        client,
        reporter_token,
    )

    incident_id = incident_response.get_json()["incident"]["id"]

    response = client.patch(
        f"/admin/incidents/{incident_id}",
        headers=auth_headers(reporter_token),
        json={
            "status": "verified",
        },
    )

    assert response.status_code == 403
    assert response.get_json()["message"] == (
        "Administrator privileges are required"
    )


def test_admin_rejects_invalid_status(client):
    admin_token = create_admin(client)
    reporter_token = create_user(client)

    incident_response = create_incident(
        client,
        reporter_token,
    )

    incident_id = incident_response.get_json()["incident"]["id"]

    response = client.patch(
        f"/admin/incidents/{incident_id}",
        headers=auth_headers(admin_token),
        json={
            "status": "something-invalid",
        },
    )

    assert response.status_code == 400


def test_admin_rejects_unsupported_update_fields(client):
    admin_token = create_admin(client)
    reporter_token = create_user(client)

    incident_response = create_incident(
        client,
        reporter_token,
    )

    incident_id = incident_response.get_json()["incident"]["id"]

    response = client.patch(
        f"/admin/incidents/{incident_id}",
        headers=auth_headers(admin_token),
        json={
            "title": "Trying to change title",
        },
    )

    assert response.status_code == 400


def test_admin_update_nonexistent_incident(client):
    admin_token = create_admin(client)

    response = client.patch(
        "/admin/incidents/9999",
        headers=auth_headers(admin_token),
        json={
            "status": "verified",
        },
    )

    assert response.status_code == 404
    assert response.get_json()["message"] == "Incident not found"