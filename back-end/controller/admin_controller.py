from flask import request
from flask_restful import Resource
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from extensions import db
from models.users import User


# ============================================================
# ADMIN CONTROLLER
# ============================================================

class AdminController(Resource):

    @jwt_required()
    def get(self):
        """
        Get all administrators.

        Only users with role='admin' are returned.
        """

        admins = User.query.filter_by(role="admin").all()

        return {
            "message": "Administrators retrieved successfully",
            "count": len(admins),
            "admins": [
                {
                    "id": admin.id,
                    "username": admin.username,
                    "email": admin.email,
                    "role": admin.role,
                    "created_at": (
                        admin.created_at.isoformat()
                        if admin.created_at
                        else None
                    )
                }
                for admin in admins
            ]
        }, 200

    @jwt_required()
    def post(self):
        """
        Create a new administrator.
        """

        data = request.get_json()

        if not data:
            return {
                "message": "Request body is required"
            }, 400

        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        # Validate required fields
        if not username:
            return {
                "message": "Username is required"
            }, 400

        if not email:
            return {
                "message": "Email is required"
            }, 400

        if not password:
            return {
                "message": "Password is required"
            }, 400

        # Basic password validation
        if len(password) < 8:
            return {
                "message": "Password must be at least 8 characters long"
            }, 400

        # Check username
        existing_username = User.query.filter_by(
            username=username
        ).first()

        if existing_username:
            return {
                "message": "Username already exists"
            }, 409

        # Check email
        existing_email = User.query.filter_by(
            email=email
        ).first()

        if existing_email:
            return {
                "message": "Email already exists"
            }, 409

        # Create administrator
        admin = User(
            username=username,
            email=email,
            role="admin"
        )

        # Hash password using the model method
        admin.set_password(password)

        db.session.add(admin)
        db.session.commit()

        return {
            "message": "Administrator created successfully",
            "admin": {
                "id": admin.id,
                "username": admin.username,
                "email": admin.email,
                "role": admin.role,
                "created_at": (
                    admin.created_at.isoformat()
                    if admin.created_at
                    else None
                )
            }
        }, 201


# ============================================================
# SINGLE ADMINISTRATOR
# ============================================================

class SingleAdminController(Resource):

    @jwt_required()
    def get(self, admin_id):
        """
        Get a specific administrator.
        """

        admin = User.query.filter_by(
            id=admin_id,
            role="admin"
        ).first()

        if not admin:
            return {
                "message": "Administrator not found"
            }, 404

        return {
            "message": "Administrator retrieved successfully",
            "admin": {
                "id": admin.id,
                "username": admin.username,
                "email": admin.email,
                "role": admin.role,
                "created_at": (
                    admin.created_at.isoformat()
                    if admin.created_at
                    else None
                )
            }
        }, 200

    @jwt_required()
    def put(self, admin_id):
        """
        Update an administrator.
        """

        admin = User.query.filter_by(
            id=admin_id,
            role="admin"
        ).first()

        if not admin:
            return {
                "message": "Administrator not found"
            }, 404

        data = request.get_json()

        if not data:
            return {
                "message": "Request body is required"
            }, 400

        # Update username
        if "username" in data:

            username = data["username"]

            existing_username = User.query.filter(
                User.username == username,
                User.id != admin_id
            ).first()

            if existing_username:
                return {
                    "message": "Username already exists"
                }, 409

            admin.username = username

        # Update email
        if "email" in data:

            email = data["email"]

            existing_email = User.query.filter(
                User.email == email,
                User.id != admin_id
            ).first()

            if existing_email:
                return {
                    "message": "Email already exists"
                }, 409

            admin.email = email

        # Update password
        if "password" in data:

            password = data["password"]

            if len(password) < 8:
                return {
                    "message": "Password must be at least 8 characters long"
                }, 400

            admin.set_password(password)

        db.session.commit()

        return {
            "message": "Administrator updated successfully",
            "admin": {
                "id": admin.id,
                "username": admin.username,
                "email": admin.email,
                "role": admin.role,
                "created_at": (
                    admin.created_at.isoformat()
                    if admin.created_at
                    else None
                )
            }
        }, 200

    @jwt_required()
    def delete(self, admin_id):
        """
        Delete an administrator.
        """

        admin = User.query.filter_by(
            id=admin_id,
            role="admin"
        ).first()

        if not admin:
            return {
                "message": "Administrator not found"
            }, 404

        db.session.delete(admin)
        db.session.commit()

        return {
            "message": "Administrator deleted successfully"
        }, 200