import pytest

from main import app
from extensions import db


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


def create_authenticated_user(
    client,
    username="TestUser",
    email="test@example.com",
):
    register_response = register_user(
        client,
        username=username,
        email=email,
    )

    assert register_response.status_code == 201

    return get_token(register_response)


def create_incident(client, token):
    return client.post(
        "/incidents",
        headers=auth_headers(token),
        json={
            "title": "Broken street light",
            "description": "The street light near the gate is not working.",
            "incident_type": "intervention",
            "latitude": -1.2921,
            "longitude": 36.8219,
        },
    )


# =========================================================
# AUTHENTICATION
# =========================================================

def test_get_incidents_requires_authentication(client):
    response = client.get("/incidents")

    assert response.status_code == 401


def test_create_incident_requires_authentication(client):
    response = client.post(
        "/incidents",
        json={
            "title": "Broken street light",
            "description": "The street light near the gate is not working.",
            "incident_type": "intervention",
            "latitude": -1.2921,
            "longitude": 36.8219,
        },
    )

    assert response.status_code == 401


# =========================================================
# CREATE INCIDENT
# =========================================================

def test_create_incident_success(client):
    token = create_authenticated_user(client)

    response = create_incident(client, token)

    assert response.status_code == 201

    data = response.get_json()

    assert data["message"] == "Report submitted successfully"

    incident = data["incident"]

    assert incident["title"] == "Broken street light"
    assert incident["description"] == (
        "The street light near the gate is not working."
    )
    assert incident["incident_type"] == "intervention"
    assert incident["latitude"] == -1.2921
    assert incident["longitude"] == 36.8219
    assert incident["status"] == "under investigation"

    assert "id" in incident
    assert "reporter" in incident


def test_create_red_flag_incident(client):
    token = create_authenticated_user(client)

    response = client.post(
        "/incidents",
        headers=auth_headers(token),
        json={
            "title": "Dangerous road",
            "description": "A dangerous road condition needs immediate attention.",
            "incident_type": "red-flag",
            "latitude": -1.3000,
            "longitude": 36.8000,
        },
    )

    assert response.status_code == 201
    assert response.get_json()["incident"]["incident_type"] == "red-flag"


def test_create_incident_missing_title(client):
    token = create_authenticated_user(client)

    response = client.post(
        "/incidents",
        headers=auth_headers(token),
        json={
            "description": "The street light near the gate is not working.",
            "incident_type": "intervention",
            "latitude": -1.2921,
            "longitude": 36.8219,
        },
    )

    assert response.status_code == 400


def test_create_incident_invalid_type(client):
    token = create_authenticated_user(client)

    response = client.post(
        "/incidents",
        headers=auth_headers(token),
        json={
            "title": "Broken street light",
            "description": "The street light near the gate is not working.",
            "incident_type": "something-invalid",
            "latitude": -1.2921,
            "longitude": 36.8219,
        },
    )

    assert response.status_code == 400


def test_create_incident_invalid_latitude(client):
    token = create_authenticated_user(client)

    response = client.post(
        "/incidents",
        headers=auth_headers(token),
        json={
            "title": "Broken street light",
            "description": "The street light near the gate is not working.",
            "incident_type": "intervention",
            "latitude": 100,
            "longitude": 36.8219,
        },
    )

    assert response.status_code == 400


def test_create_incident_invalid_longitude(client):
    token = create_authenticated_user(client)

    response = client.post(
        "/incidents",
        headers=auth_headers(token),
        json={
            "title": "Broken street light",
            "description": "The street light near the gate is not working.",
            "incident_type": "intervention",
            "latitude": -1.2921,
            "longitude": 200,
        },
    )

    assert response.status_code == 400


def test_create_incident_rejects_unsupported_fields(client):
    token = create_authenticated_user(client)

    response = client.post(
        "/incidents",
        headers=auth_headers(token),
        json={
            "title": "Broken street light",
            "description": "The street light near the gate is not working.",
            "incident_type": "intervention",
            "latitude": -1.2921,
            "longitude": 36.8219,
            "status": "verified",
        },
    )

    assert response.status_code == 400


# =========================================================
# GET INCIDENTS
# =========================================================

def test_get_incidents(client):
    token = create_authenticated_user(client)

    create_incident(client, token)

    response = client.get(
        "/incidents",
        headers=auth_headers(token),
    )

    assert response.status_code == 200

    data = response.get_json()

    assert "items" in data
    assert "pagination" in data
    assert data["pagination"]["total"] == 1
    assert len(data["items"]) == 1


def test_get_single_incident(client):
    token = create_authenticated_user(client)

    create_response = create_incident(client, token)

    incident_id = create_response.get_json()["incident"]["id"]

    response = client.get(
        f"/incidents/{incident_id}",
        headers=auth_headers(token),
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["incident"]["id"] == incident_id
    assert data["incident"]["title"] == "Broken street light"


def test_get_nonexistent_incident(client):
    token = create_authenticated_user(client)

    response = client.get(
        "/incidents/9999",
        headers=auth_headers(token),
    )

    assert response.status_code == 404
    assert response.get_json()["message"] == "Incident not found"


# =========================================================
# FILTERING
# =========================================================

def test_filter_by_incident_type(client):
    token = create_authenticated_user(client)

    create_incident(client, token)

    client.post(
        "/incidents",
        headers=auth_headers(token),
        json={
            "title": "Serious danger",
            "description": "This dangerous situation needs immediate attention.",
            "incident_type": "red-flag",
            "latitude": -1.2900,
            "longitude": 36.8200,
        },
    )

    response = client.get(
        "/incidents?incident_type=red-flag",
        headers=auth_headers(token),
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["pagination"]["total"] == 1
    assert data["items"][0]["incident_type"] == "red-flag"


def test_filter_my_incidents(client):
    token = create_authenticated_user(client)

    create_incident(client, token)

    response = client.get(
        "/incidents?mine=true",
        headers=auth_headers(token),
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["pagination"]["total"] == 1


# =========================================================
# UPDATE INCIDENT
# =========================================================

def test_update_own_incident(client):
    token = create_authenticated_user(client)

    create_response = create_incident(client, token)

    incident_id = create_response.get_json()["incident"]["id"]

    response = client.patch(
        f"/incidents/{incident_id}",
        headers=auth_headers(token),
        json={
            "title": "Updated street light",
            "description": "The street light has still not been repaired.",
        },
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["message"] == "Report updated successfully"
    assert data["incident"]["title"] == "Updated street light"


def test_update_incident_cannot_change_status(client):
    token = create_authenticated_user(client)

    create_response = create_incident(client, token)

    incident_id = create_response.get_json()["incident"]["id"]

    response = client.patch(
        f"/incidents/{incident_id}",
        headers=auth_headers(token),
        json={
            "status": "verified",
        },
    )

    assert response.status_code == 400


# =========================================================
# DELETE INCIDENT
# =========================================================

def test_delete_own_incident(client):
    token = create_authenticated_user(client)

    create_response = create_incident(client, token)

    incident_id = create_response.get_json()["incident"]["id"]

    response = client.delete(
        f"/incidents/{incident_id}",
        headers=auth_headers(token),
    )

    assert response.status_code == 200

    assert response.get_json()["message"] == "Report deleted successfully"

    get_response = client.get(
        f"/incidents/{incident_id}",
        headers=auth_headers(token),
    )

    assert get_response.status_code == 404