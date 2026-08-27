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


def get_token(response):
    return response.get_json()["access_token"]


def auth_headers(token):
    return {
        "Authorization": f"Bearer {token}"
    }


def setup_user_and_incident(client):
    register_response = register_user(client)

    assert register_response.status_code == 201

    token = get_token(register_response)

    incident_response = client.post(
        "/incidents",
        headers=auth_headers(token),
        json={
            "title": "Broken street light",
            "description": "Street light is not working.",
            "incident_type": "intervention",
            "latitude": -1.2921,
            "longitude": 36.8219,
        },
    )

    assert incident_response.status_code == 201

    incident_id = incident_response.get_json()["incident"]["id"]

    return token, incident_id


# =========================================================
# AUTHENTICATION
# =========================================================

def test_list_media_requires_authentication(client):
    response = client.get("/incidents/1/media")

    assert response.status_code == 401


def test_add_media_requires_authentication(client):
    response = client.post(
        "/incidents/1/media",
        json={
            "file_url": "https://example.com/photo.jpg",
            "media_type": "image",
        },
    )

    assert response.status_code == 401


# =========================================================
# ADD MEDIA
# =========================================================

def test_add_single_media(client):
    token, incident_id = setup_user_and_incident(client)

    response = client.post(
        f"/incidents/{incident_id}/media",
        headers=auth_headers(token),
        json={
            "file_url": "https://example.com/photo.jpg",
            "media_type": "image",
        },
    )

    assert response.status_code == 201

    data = response.get_json()

    assert data["message"] == "Evidence added successfully"
    assert "media" in data

    media = data["media"]

    assert len(media) == 1
    assert media[0]["file_url"] == "https://example.com/photo.jpg"
    assert media[0]["media_type"] == "image"
    


def test_add_multiple_media(client):
    token, incident_id = setup_user_and_incident(client)

    response = client.post(
        f"/incidents/{incident_id}/media",
        headers=auth_headers(token),
        json={
            "media": [
                {
                    "file_url": "https://example.com/photo1.jpg",
                    "media_type": "image",
                },
                {
                    "file_url": "https://example.com/video.mp4",
                    "media_type": "video",
                },
            ]
        },
    )

    assert response.status_code == 201

    data = response.get_json()

    assert len(data["media"]) == 2
    assert data["media"][0]["file_url"] == (
        "https://example.com/photo1.jpg"
    )
    assert data["media"][1]["file_url"] == (
        "https://example.com/video.mp4"
    )


def test_add_media_missing_file_url(client):
    token, incident_id = setup_user_and_incident(client)

    response = client.post(
        f"/incidents/{incident_id}/media",
        headers=auth_headers(token),
        json={
            "media_type": "image",
        },
    )

    assert response.status_code == 400


def test_add_media_missing_media_type(client):
    token, incident_id = setup_user_and_incident(client)

    response = client.post(
        f"/incidents/{incident_id}/media",
        headers=auth_headers(token),
        json={
            "file_url": "https://example.com/photo.jpg",
        },
    )

    assert response.status_code == 400


def test_add_media_empty_file_url(client):
    token, incident_id = setup_user_and_incident(client)

    response = client.post(
        f"/incidents/{incident_id}/media",
        headers=auth_headers(token),
        json={
            "file_url": "",
            "media_type": "image",
        },
    )

    assert response.status_code == 400


def test_add_media_invalid_payload(client):
    token, incident_id = setup_user_and_incident(client)

    response = client.post(
        f"/incidents/{incident_id}/media",
        headers=auth_headers(token),
        json={
            "something": "invalid",
        },
    )

    assert response.status_code == 400


# =========================================================
# LIST MEDIA
# =========================================================

def test_list_media(client):
    token, incident_id = setup_user_and_incident(client)

    client.post(
        f"/incidents/{incident_id}/media",
        headers=auth_headers(token),
        json={
            "file_url": "https://example.com/photo.jpg",
            "media_type": "image",
        },
    )

    response = client.get(
        f"/incidents/{incident_id}/media",
        headers=auth_headers(token),
    )

    assert response.status_code == 200

    data = response.get_json()

    
    assert len(data["media"]) == 1
    assert data["media"][0]["media_type"] == "image"


def test_list_media_for_nonexistent_incident(client):
    token = get_token(register_user(client))

    response = client.get(
        "/incidents/9999/media",
        headers=auth_headers(token),
    )

    assert response.status_code == 404


# =========================================================
# DELETE MEDIA
# =========================================================

def test_delete_media(client):
    token, incident_id = setup_user_and_incident(client)

    add_response = client.post(
        f"/incidents/{incident_id}/media",
        headers=auth_headers(token),
        json={
            "file_url": "https://example.com/photo.jpg",
            "media_type": "image",
        },
    )

    media_id = add_response.get_json()["media"][0]["id"]

    response = client.delete(
        f"/incidents/{incident_id}/media/{media_id}",
        headers=auth_headers(token),
    )

    assert response.status_code == 200

    assert response.get_json()["message"] == "Evidence removed successfully"

    list_response = client.get(
        f"/incidents/{incident_id}/media",
        headers=auth_headers(token),
    )

    assert list_response.status_code == 200
    assert list_response.get_json()["media"] == []


def test_delete_nonexistent_media(client):
    token, incident_id = setup_user_and_incident(client)

    response = client.delete(
        f"/incidents/{incident_id}/media/9999",
        headers=auth_headers(token),
    )

    assert response.status_code == 404