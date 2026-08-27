import re

from flask import request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from flask_restful import Resource
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from extensions import db
from models.users import User


DEFAULT_USER_ROLE = "user"
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _timestamp(value):
    return value.isoformat() if value else None


def serialize_user(user):
    """Serialize a user without exposing their password hash."""
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "phone": user.phone,
        "bio": user.bio,
        "profile_photo": user.profile_photo,
        "role": user.role,
        "created_at": _timestamp(user.created_at),
        "updated_at": _timestamp(user.updated_at),
    }


def json_object():
    """Return a JSON object or a client-error response."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None, ({"message": "A JSON object is required"}, 400)
    return data, None


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


def required_text(data, field_name, maximum_length):
    value = data.get(field_name)
    if not isinstance(value, str):
        return None, ({"message": f"'{field_name}' is required"}, 400)

    value = value.strip()
    if not value:
        return None, ({"message": f"'{field_name}' cannot be empty"}, 400)

    if len(value) > maximum_length:
        return None, (
            {"message": f"'{field_name}' cannot exceed {maximum_length} characters"},
            400,
        )

    return value, None


def optional_text(value, field_name, maximum_length):
    if value is None:
        return None, None

    if not isinstance(value, str):
        return None, ({"message": f"'{field_name}' must be a string"}, 400)

    value = value.strip()
    if len(value) > maximum_length:
        return None, (
            {"message": f"'{field_name}' cannot exceed {maximum_length} characters"},
            400,
        )

    return value or None, None


def validate_email(data):
    email, error = required_text(data, "email", 120)
    if error:
        return None, error

    email = email.lower()
    if not EMAIL_PATTERN.fullmatch(email):
        return None, ({"message": "'email' must be a valid email address"}, 400)

    return email, None


def validate_password_pair(data, password_field, confirmation_field):
    password = data.get(password_field)
    confirmation = data.get(confirmation_field)

    if not isinstance(password, str):
        return None, ({"message": f"'{password_field}' is required"}, 400)
    if len(password) < 8:
        return None, ({"message": "Password must be at least 8 characters long"}, 400)
    if len(password) > 128:
        return None, ({"message": "Password cannot exceed 128 characters"}, 400)
    if password != confirmation:
        return None, ({"message": "Passwords do not match"}, 400)

    return password, None


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


class RegisterController(Resource):
    """Create a standard citizen account from the create-account screen."""

    def post(self):
        data, error = json_object()
        if error:
            return error

        error = unsupported_fields(
            data,
            {"username", "email", "password", "confirm_password", "phone"},
        )
        if error:
            return error

        username, error = required_text(data, "username", 100)
        if error:
            return error
        if len(username) < 3:
            return {"message": "'username' must be at least 3 characters long"}, 400

        email, error = validate_email(data)
        if error:
            return error

        password, error = validate_password_pair(
            data, "password", "confirm_password"
        )
        if error:
            return error

        phone, error = optional_text(data.get("phone"), "phone", 20)
        if error:
            return error

        if User.query.filter_by(username=username).first():
            return {"message": "Username already exists"}, 409

        if User.query.filter(func.lower(User.email) == email).first():
            return {"message": "Email already exists"}, 409

        user = User(
            username=username,
            email=email,
            phone=phone,
            role=DEFAULT_USER_ROLE,
        )
        user.set_password(password)

        try:
            db.session.add(user)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return {"message": "Username or email already exists"}, 409

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={"role": user.role},
        )
        return {
            "message": "Account created successfully",
            "access_token": access_token,
            "user": serialize_user(user),
        }, 201


class LoginController(Resource):
    """Authenticate with email and password and issue a JWT access token."""

    def post(self):
        data, error = json_object()
        if error:
            return error

        error = unsupported_fields(data, {"email", "password"})
        if error:
            return error

        email, error = validate_email(data)
        if error:
            return error

        password = data.get("password")
        if not isinstance(password, str) or not password:
            return {"message": "'password' is required"}, 400

        user = User.query.filter(func.lower(User.email) == email).first()
        if not user or not user.check_password(password):
            return {"message": "Invalid email or password"}, 401

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={"role": user.role},
        )
        return {
            "message": "Login successful",
            "access_token": access_token,
            "user": serialize_user(user),
        }, 200


class AuthenticatedResource(Resource):
    """Base resource for endpoints that require a valid access token."""

    method_decorators = [jwt_required()]


class CurrentUserController(AuthenticatedResource):
    """Get or edit the signed-in user's profile."""

    def get(self):
        user, error = current_identity()
        if error:
            return error

        return {"user": serialize_user(user)}, 200

    def patch(self):
        user, error = current_identity()
        if error:
            return error

        data, error = json_object()
        if error:
            return error
        if not data:
            return {"message": "At least one field is required"}, 400

        error = unsupported_fields(
            data,
            {"username", "email", "phone", "bio", "profile_photo"},
        )
        if error:
            return error

        if "username" in data:
            username, error = required_text(data, "username", 100)
            if error:
                return error
            if len(username) < 3:
                return {"message": "'username' must be at least 3 characters long"}, 400

            existing_user = User.query.filter(
                User.username == username,
                User.id != user.id,
            ).first()
            if existing_user:
                return {"message": "Username already exists"}, 409
            user.username = username

        if "email" in data:
            email, error = validate_email(data)
            if error:
                return error

            existing_user = User.query.filter(
                func.lower(User.email) == email,
                User.id != user.id,
            ).first()
            if existing_user:
                return {"message": "Email already exists"}, 409
            user.email = email

        for field_name, maximum_length in (
            ("phone", 20),
            ("bio", 1000),
            ("profile_photo", 255),
        ):
            if field_name in data:
                value, error = optional_text(
                    data[field_name], field_name, maximum_length
                )
                if error:
                    return error
                setattr(user, field_name, value)

        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return {"message": "Username or email already exists"}, 409
        except SQLAlchemyError:
            db.session.rollback()
            return {"message": "Profile could not be updated"}, 500

        return {
            "message": "Profile updated successfully",
            "user": serialize_user(user),
        }, 200

    def put(self):
        """Support PUT as an alias while the frontend is being integrated."""
        return self.patch()


class ChangePasswordController(AuthenticatedResource):
    """Change the signed-in user's password after verifying the old password."""

    def put(self):
        user, error = current_identity()
        if error:
            return error

        data, error = json_object()
        if error:
            return error

        error = unsupported_fields(
            data,
            {"current_password", "new_password", "confirm_password"},
        )
        if error:
            return error

        current_password = data.get("current_password")
        if not isinstance(current_password, str) or not current_password:
            return {"message": "'current_password' is required"}, 400
        if not user.check_password(current_password):
            return {"message": "Current password is incorrect"}, 401

        new_password, error = validate_password_pair(
            data, "new_password", "confirm_password"
        )
        if error:
            return error
        if user.check_password(new_password):
            return {"message": "New password must be different"}, 400

        user.set_password(new_password)
        try:
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            return {"message": "Password could not be updated"}, 500

        return {"message": "Password updated successfully"}, 200
