"""Community wall: members share real-time updates as short posts.

Follows the same conventions as ``admin_controller`` and ``auth_controller``:
module-level constants, small serializer/validation helpers, a JWT-protected
base resource, and controller classes that return ``(payload, status)`` pairs.
"""

from functools import wraps

from flask import request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from flask_jwt_extended.exceptions import NoAuthorizationError
from flask_restful import Resource
from sqlalchemy.exc import SQLAlchemyError

from extensions import db
from models.community_post import CommunityPost
from models.users import User


ADMIN_ROLE = "admin"
DEFAULT_PER_PAGE = 10
MAX_PER_PAGE = 100
MAX_SEARCH_LENGTH = 100

# ``CommunityPost.content`` is an unbounded Text column; this keeps posts
# short and readable on the wall.
MAX_CONTENT_LENGTH = 1000

ALLOWED_POST_FIELDS = {"content"}


def _timestamp(value):
    return value.isoformat() if value else None


def serialize_author(user):
    """Minimal author card shown beside a post.

    Contact details (email, phone) are intentionally hidden from other
    members.
    """
    if not user:
        return None

    return {
        "id": user.id,
        "username": user.username,
        "profile_photo": user.profile_photo,
    }


def serialize_post(post):
    return {
        "id": post.id,
        "content": post.content,
        "author": serialize_author(post.user),
        "created_at": _timestamp(post.created_at),
        "updated_at": _timestamp(post.updated_at),
    }


def current_identity():
    """Return the authenticated user after ``jwt_required`` has run."""
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return None, ({"message": "Invalid authentication token"}, 401)

    user = db.session.get(User, user_id)
    if not user:
        return None, ({"message": "Authenticated user was not found"}, 401)

    return user, None


def json_object():
    """Return a JSON object or a client-error response."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None, ({"message": "A JSON object is required"}, 400)
    return data, None


def paginate(query, serializer):
    """Return a bounded, metadata-rich page from a SQLAlchemy query."""
    page = max(request.args.get("page", 1, type=int) or 1, 1)
    per_page = min(
        max(request.args.get("per_page", DEFAULT_PER_PAGE, type=int) or 1, 1),
        MAX_PER_PAGE,
    )
    result = query.paginate(page=page, per_page=per_page, error_out=False)

    return {
        "items": [serializer(item) for item in result.items],
        "pagination": {
            "page": result.page,
            "per_page": result.per_page,
            "total": result.total,
            "pages": result.pages,
            "has_next": result.has_next,
            "has_prev": result.has_prev,
        },
    }


def required_text(data, field_name, maximum_length):
    value = data.get(field_name)
    if not isinstance(value, str):
        return None, ({"message": f"'{field_name}' is required"}, 400)

    value = value.strip()
    if not value:
        return None, ({"message": f"'{field_name}' cannot be empty"}, 400)

    if len(value) > maximum_length:
        return None, (
            {
                "message": f"'{field_name}' cannot exceed "
                f"{maximum_length} characters"
            },
            400,
        )

    return value, None


def unsupported_fields(data, allowed_fields):
    fields = sorted(set(data) - allowed_fields)
    if fields:
        return (
            {
                "message": "Unsupported field(s): " + ", ".join(fields),
                "allowed_fields": sorted(allowed_fields),
            },
            400,
        )
    return None


def auth_required(function):
    """Require a valid JWT and turn token failures into clean 401s.

    Flask-RESTful intercepts exceptions raised inside resources before
    Flask's ``errorhandler`` layer runs, so ``jwt_required()`` alone would
    surface missing/expired tokens as HTTP 500. This decorator verifies the
    token up front and returns a friendly 401 payload instead.
    """

    @wraps(function)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except NoAuthorizationError:
            return {"message": "Authentication is required"}, 401
        except Exception:
            return {"message": "The access token is invalid or expired"}, 401

        return function(*args, **kwargs)

    return decorated


class CommunityResource(Resource):
    """Base resource: every community endpoint requires a valid JWT."""

    method_decorators = [auth_required]


class CommunityPostsController(CommunityResource):
    """Browse the community feed or publish a new post."""

    def get(self):
        _, error = current_identity()
        if error:
            return error

        query = CommunityPost.query

        search_query = request.args.get("q", "").strip()
        if search_query:
            if len(search_query) > MAX_SEARCH_LENGTH:
                return {
                    "message": f"'q' cannot exceed "
                    f"{MAX_SEARCH_LENGTH} characters"
                }, 400
            query = query.filter(
                CommunityPost.content.ilike(f"%{search_query}%")
            )

        query = query.order_by(
            CommunityPost.created_at.desc(), CommunityPost.id.desc()
        )
        return paginate(query, serialize_post), 200

    def post(self):
        user, error = current_identity()
        if error:
            return error

        data, error = json_object()
        if error:
            return error

        error = unsupported_fields(data, ALLOWED_POST_FIELDS)
        if error:
            return error

        content, error = required_text(data, "content", MAX_CONTENT_LENGTH)
        if error:
            return error

        post = CommunityPost(user_id=user.id, content=content)

        try:
            db.session.add(post)
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            return {"message": "The post could not be published"}, 500

        return {
            "message": "Post published successfully",
            "post": serialize_post(post),
        }, 201


class CommunityPostController(CommunityResource):
    """View, edit, or remove a single community post."""

    def get(self, post_id):
        _, error = current_identity()
        if error:
            return error

        post = db.session.get(CommunityPost, post_id)
        if not post:
            return {"message": "Post not found"}, 404

        return {"post": serialize_post(post)}, 200

    def patch(self, post_id):
        user, error = current_identity()
        if error:
            return error

        post = db.session.get(CommunityPost, post_id)
        if not post:
            return {"message": "Post not found"}, 404

        if post.user_id != user.id:
            return {"message": "You can only edit your own posts"}, 403

        data, error = json_object()
        if error:
            return error

        if not data:
            return {"message": "At least one field is required"}, 400

        error = unsupported_fields(data, ALLOWED_POST_FIELDS)
        if error:
            return error

        content, error = required_text(data, "content", MAX_CONTENT_LENGTH)
        if error:
            return error
        post.content = content

        try:
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            return {"message": "The post could not be updated"}, 500

        return {
            "message": "Post updated successfully",
            "post": serialize_post(post),
        }, 200

    def put(self, post_id):
        """Support PUT as an alias while the frontend is being integrated."""
        return self.patch(post_id)

    def delete(self, post_id):
        user, error = current_identity()
        if error:
            return error

        post = db.session.get(CommunityPost, post_id)
        if not post:
            return {"message": "Post not found"}, 404

        # Administrators may moderate (remove) any post.
        if post.user_id != user.id and user.role.lower() != ADMIN_ROLE:
            return {
                "message": "Only the author or an administrator "
                "can delete this post"
            }, 403

        try:
            db.session.delete(post)
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            return {"message": "The post could not be deleted"}, 500

        return {"message": "Post deleted successfully"}, 200
