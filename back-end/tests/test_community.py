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


def create_user_and_get_token(
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

    login_response = login_user(
        client,
        email=email,
    )

    assert login_response.status_code == 200

    return get_token(login_response)


def create_post(client, token, content="This is a community post"):
    return client.post(
        "/community/posts",
        headers=auth_headers(token),
        json={
            "content": content,
        },
    )


# =========================================================
# AUTHENTICATION
# =========================================================

def test_list_posts_requires_authentication(client):
    response = client.get("/community/posts")

    assert response.status_code == 401


def test_create_post_requires_authentication(client):
    response = client.post(
        "/community/posts",
        json={
            "content": "Hello community",
        },
    )

    assert response.status_code == 401


def test_get_post_requires_authentication(client):
    response = client.get("/community/posts/1")

    assert response.status_code == 401


# =========================================================
# CREATE POSTS
# =========================================================

def test_create_post_success(client):
    token = create_user_and_get_token(client)

    response = create_post(
        client,
        token,
        "There is a water outage near the gate.",
    )

    assert response.status_code == 201

    data = response.get_json()

    assert data["message"] == "Post published successfully"
    assert "post" in data

    post = data["post"]

    assert post["content"] == "There is a water outage near the gate."
    assert "id" in post
    assert "author" in post
    assert post["author"]["username"] == "TestUser"


def test_create_post_missing_content(client):
    token = create_user_and_get_token(client)

    response = client.post(
        "/community/posts",
        headers=auth_headers(token),
        json={},
    )

    assert response.status_code == 400
    assert response.get_json()["message"] == "'content' is required"


def test_create_post_empty_content(client):
    token = create_user_and_get_token(client)

    response = client.post(
        "/community/posts",
        headers=auth_headers(token),
        json={
            "content": "   ",
        },
    )

    assert response.status_code == 400
    assert response.get_json()["message"] == "'content' cannot be empty"


def test_create_post_too_long(client):
    token = create_user_and_get_token(client)

    response = client.post(
        "/community/posts",
        headers=auth_headers(token),
        json={
            "content": "x" * 1001,
        },
    )

    assert response.status_code == 400


def test_create_post_rejects_unsupported_fields(client):
    token = create_user_and_get_token(client)

    response = client.post(
        "/community/posts",
        headers=auth_headers(token),
        json={
            "content": "Valid post",
            "user_id": 999,
        },
    )

    assert response.status_code == 400


# =========================================================
# READ POSTS
# =========================================================

def test_list_posts(client):
    token = create_user_and_get_token(client)

    create_post(client, token, "First post")
    create_post(client, token, "Second post")

    response = client.get(
        "/community/posts",
        headers=auth_headers(token),
    )

    assert response.status_code == 200

    data = response.get_json()

    assert "items" in data
    assert "pagination" in data

    assert data["pagination"]["total"] == 2
    assert len(data["items"]) == 2


def test_get_single_post(client):
    token = create_user_and_get_token(client)

    create_response = create_post(
        client,
        token,
        "A post to retrieve",
    )

    post_id = create_response.get_json()["post"]["id"]

    response = client.get(
        f"/community/posts/{post_id}",
        headers=auth_headers(token),
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["post"]["id"] == post_id
    assert data["post"]["content"] == "A post to retrieve"


def test_get_nonexistent_post(client):
    token = create_user_and_get_token(client)

    response = client.get(
        "/community/posts/9999",
        headers=auth_headers(token),
    )

    assert response.status_code == 404
    assert response.get_json()["message"] == "Post not found"


def test_search_posts(client):
    token = create_user_and_get_token(client)

    create_post(
        client,
        token,
        "There is a broken street light",
    )

    create_post(
        client,
        token,
        "Water is available today",
    )

    response = client.get(
        "/community/posts?q=street",
        headers=auth_headers(token),
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["pagination"]["total"] == 1
    assert data["items"][0]["content"] == (
        "There is a broken street light"
    )


def test_pagination(client):
    token = create_user_and_get_token(client)

    for number in range(5):
        create_post(
            client,
            token,
            f"Community post {number}",
        )

    response = client.get(
        "/community/posts?page=1&per_page=2",
        headers=auth_headers(token),
    )

    assert response.status_code == 200

    data = response.get_json()

    assert len(data["items"]) == 2
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["per_page"] == 2
    assert data["pagination"]["total"] == 5
    assert data["pagination"]["pages"] == 3
    assert data["pagination"]["has_next"] is True


# =========================================================
# UPDATE POSTS
# =========================================================

def test_update_own_post(client):
    token = create_user_and_get_token(client)

    create_response = create_post(
        client,
        token,
        "Original content",
    )

    post_id = create_response.get_json()["post"]["id"]

    response = client.patch(
        f"/community/posts/{post_id}",
        headers=auth_headers(token),
        json={
            "content": "Updated content",
        },
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["message"] == "Post updated successfully"
    assert data["post"]["content"] == "Updated content"


def test_update_post_using_put(client):
    token = create_user_and_get_token(client)

    create_response = create_post(
        client,
        token,
        "Original content",
    )

    post_id = create_response.get_json()["post"]["id"]

    response = client.put(
        f"/community/posts/{post_id}",
        headers=auth_headers(token),
        json={
            "content": "Updated using PUT",
        },
    )

    assert response.status_code == 200
    assert response.get_json()["post"]["content"] == "Updated using PUT"


def test_user_cannot_update_another_users_post(client):
    first_token = create_user_and_get_token(
        client,
        username="FirstUser",
        email="first@example.com",
    )

    create_response = create_post(
        client,
        first_token,
        "First user's post",
    )

    post_id = create_response.get_json()["post"]["id"]

    second_token = create_user_and_get_token(
        client,
        username="SecondUser",
        email="second@example.com",
    )

    response = client.patch(
        f"/community/posts/{post_id}",
        headers=auth_headers(second_token),
        json={
            "content": "Trying to edit someone else's post",
        },
    )

    assert response.status_code == 403
    assert response.get_json()["message"] == (
        "You can only edit your own posts"
    )


def test_update_post_empty_body(client):
    token = create_user_and_get_token(client)

    create_response = create_post(
        client,
        token,
        "Original content",
    )

    post_id = create_response.get_json()["post"]["id"]

    response = client.patch(
        f"/community/posts/{post_id}",
        headers=auth_headers(token),
        json={},
    )

    assert response.status_code == 400
    assert response.get_json()["message"] == (
        "At least one field is required"
    )


# =========================================================
# DELETE POSTS
# =========================================================

def test_delete_own_post(client):
    token = create_user_and_get_token(client)

    create_response = create_post(
        client,
        token,
        "Post to delete",
    )

    post_id = create_response.get_json()["post"]["id"]

    response = client.delete(
        f"/community/posts/{post_id}",
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    assert response.get_json()["message"] == "Post deleted successfully"

    get_response = client.get(
        f"/community/posts/{post_id}",
        headers=auth_headers(token),
    )

    assert get_response.status_code == 404


def test_user_cannot_delete_another_users_post(client):
    first_token = create_user_and_get_token(
        client,
        username="FirstUser",
        email="first@example.com",
    )

    create_response = create_post(
        client,
        first_token,
        "First user's post",
    )

    post_id = create_response.get_json()["post"]["id"]

    second_token = create_user_and_get_token(
        client,
        username="SecondUser",
        email="second@example.com",
    )

    response = client.delete(
        f"/community/posts/{post_id}",
        headers=auth_headers(second_token),
    )

    assert response.status_code == 403
    assert response.get_json()["message"] == (
        "Only the author or an administrator "
        "can delete this post"
    )


def test_admin_can_delete_another_users_post(client):
    user_token = create_user_and_get_token(
        client,
        username="NormalUser",
        email="normal@example.com",
    )

    create_response = create_post(
        client,
        user_token,
        "Post created by normal user",
    )

    post_id = create_response.get_json()["post"]["id"]

    admin_token = create_user_and_get_token(
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

    response = client.delete(
        f"/community/posts/{post_id}",
        headers=auth_headers(admin_token),
    )

    assert response.status_code == 200
    assert response.get_json()["message"] == "Post deleted successfully"


def test_delete_nonexistent_post(client):
    token = create_user_and_get_token(client)

    response = client.delete(
        "/community/posts/9999",
        headers=auth_headers(token),
    )

    assert response.status_code == 404
    assert response.get_json()["message"] == "Post not found"