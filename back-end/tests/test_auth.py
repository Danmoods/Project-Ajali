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


def register_user(client, username="TestUser", email="test@example.com",
                  password="password123"):
    return client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "password": password,
            "confirm_password": password,
        },
    )


def login_user(client, email="test@example.com", password="password123"):
    return client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )


def get_token(response):
    return response.get_json()["access_token"]


# ---------------------------------------------------------
# REGISTRATION
# ---------------------------------------------------------

def test_register_success(client):
    response = register_user(client)

    assert response.status_code == 201

    data = response.get_json()

    assert data["message"] == "Account created successfully"
    assert "access_token" in data
    assert data["user"]["username"] == "TestUser"
    assert data["user"]["email"] == "test@example.com"

    # Password must never be returned
    assert "password" not in data["user"]
    assert "password_hash" not in data["user"]


def test_register_password_mismatch(client):
    response = client.post(
        "/auth/register",
        json={
            "username": "TestUser",
            "email": "test@example.com",
            "password": "password123",
            "confirm_password": "different123",
        },
    )

    assert response.status_code == 400
    assert response.get_json()["message"] == "Passwords do not match"


def test_register_short_password(client):
    response = client.post(
        "/auth/register",
        json={
            "username": "TestUser",
            "email": "test@example.com",
            "password": "123",
            "confirm_password": "123",
        },
    )

    assert response.status_code == 400


def test_register_duplicate_username(client):
    register_user(client)

    response = register_user(
        client,
        username="TestUser",
        email="another@example.com",
    )

    assert response.status_code == 409
    assert response.get_json()["message"] == "Username already exists"


def test_register_duplicate_email(client):
    register_user(client)

    response = register_user(
        client,
        username="AnotherUser",
        email="test@example.com",
    )

    assert response.status_code == 409
    assert response.get_json()["message"] == "Email already exists"


def test_register_invalid_email(client):
    response = register_user(
        client,
        email="not-an-email",
    )

    assert response.status_code == 400


# ---------------------------------------------------------
# LOGIN
# ---------------------------------------------------------

def test_login_success(client):
    register_user(client)

    response = login_user(client)

    assert response.status_code == 200

    data = response.get_json()

    assert data["message"] == "Login successful"
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"


def test_login_wrong_password(client):
    register_user(client)

    response = login_user(
        client,
        password="wrongpassword",
    )

    assert response.status_code == 401
    assert response.get_json()["message"] == "Invalid email or password"


def test_login_nonexistent_user(client):
    response = login_user(
        client,
        email="doesnotexist@example.com",
    )

    assert response.status_code == 401
    assert response.get_json()["message"] == "Invalid email or password"


# ---------------------------------------------------------
# CURRENT USER
# ---------------------------------------------------------

def test_get_current_user(client):
    register_response = register_user(client)
    token = get_token(register_response)

    response = client.get(
        "/auth/me",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["user"]["username"] == "TestUser"
    assert data["user"]["email"] == "test@example.com"


def test_current_user_without_token(client):
    response = client.get("/auth/me")

    assert response.status_code in (401, 422)


# ---------------------------------------------------------
# PROFILE UPDATE
# ---------------------------------------------------------

def test_update_profile(client):
    register_response = register_user(client)
    token = get_token(register_response)

    response = client.patch(
        "/auth/me",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "username": "UpdatedUser",
            "phone": "0712345678",
            "bio": "Ajali user",
        },
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["message"] == "Profile updated successfully"
    assert data["user"]["username"] == "UpdatedUser"
    assert data["user"]["phone"] == "0712345678"
    assert data["user"]["bio"] == "Ajali user"


# ---------------------------------------------------------
# CHANGE PASSWORD
# ---------------------------------------------------------

def test_change_password(client):
    register_response = register_user(client)
    token = get_token(register_response)

    response = client.put(
        "/auth/change-password",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "current_password": "password123",
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        },
    )

    assert response.status_code == 200
    assert response.get_json()["message"] == "Password updated successfully"

    # Confirm the new password works
    login_response = login_user(
        client,
        password="newpassword123",
    )

    assert login_response.status_code == 200


def test_change_password_wrong_current_password(client):
    register_response = register_user(client)
    token = get_token(register_response)

    response = client.put(
        "/auth/change-password",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "current_password": "wrongpassword",
            "new_password": "newpassword123",
            "confirm_password": "newpassword123",
        },
    )

    assert response.status_code == 401


def test_change_password_same_password(client):
    register_response = register_user(client)
    token = get_token(register_response)

    response = client.put(
        "/auth/change-password",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "current_password": "password123",
            "new_password": "password123",
            "confirm_password": "password123",
        },
    )

    assert response.status_code == 400
    assert response.get_json()["message"] == "New password must be different"