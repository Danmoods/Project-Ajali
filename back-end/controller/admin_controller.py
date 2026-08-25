from datetime import datetime

from flask import request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restful import Resource
from sqlalchemy import func, or_
from sqlalchemy.exc import SQLAlchemyError

from extensions import db
from models.incident import Incident
from models.users import User


ADMIN_ROLE = "admin"
DEFAULT_PER_PAGE = 10
MAX_PER_PAGE = 100
MAX_RECENT_INCIDENTS = 20
INCIDENT_STATUSES = (
    "under investigation",
    "verified",
    "resolved",
    "rejected",
)
INCIDENT_TYPES = ("red-flag", "intervention")


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


def _timestamp(value):
    return value.isoformat() if value else None


def serialize_user(user):
    """Serialize a user without exposing their password hash."""
    if not user:
        return None

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "created_at": _timestamp(user.created_at),
        "updated_at": _timestamp(user.updated_at),
    }


def serialize_media(media):
    return {
        "id": media.id,
        "file_url": media.file_url,
        "media_type": media.media_type,
        "created_at": _timestamp(media.created_at),
    }


def serialize_incident(incident, include_media=False):
    payload = {
        "id": incident.id,
        "title": incident.title,
        "description": incident.description,
        "incident_type": incident.incident_type,
        "latitude": incident.latitude,
        "longitude": incident.longitude,
        "status": incident.status,
        "reporter": serialize_user(incident.user),
        "created_at": _timestamp(incident.created_at),
        "updated_at": _timestamp(incident.updated_at),
    }

    if include_media:
        payload["media"] = [serialize_media(media) for media in incident.media]

    return payload


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


def admin_identity():
    """Return the current user only when they have the admin role."""
    user, error = current_identity()
    if error:
        return None, error

    if user.role.lower() != ADMIN_ROLE:
        return None, ({"message": "Administrator privileges are required"}, 403)

    return user, None


def json_object():
    """Return a JSON object or a client-error response."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None, ({"message": "A JSON object is required"}, 400)
    return data, None


class AdminResource(Resource):
    """Base resource: every admin endpoint requires a valid JWT."""

    method_decorators = [jwt_required()]


class AdminController(AdminResource):
    """Return the metrics and recent reports for the admin dashboard."""

    def get(self):
        _, error = admin_identity()
        if error:
            return error

        recent_limit = min(
            max(request.args.get("recent_limit", 5, type=int) or 1, 1),
            MAX_RECENT_INCIDENTS,
        )

        status_counts = {status: 0 for status in INCIDENT_STATUSES}
        rows = (
            db.session.query(Incident.status, func.count(Incident.id))
            .group_by(Incident.status)
            .all()
        )
        for status, count in rows:
            status_counts[status] = count

        recent_incidents = (
            Incident.query.order_by(Incident.created_at.desc(), Incident.id.desc())
            .limit(recent_limit)
            .all()
        )

        return {
            "summary": {
                "total_reports": Incident.query.count(),
                "status_counts": status_counts,
            },
            "recent_incidents": [
                serialize_incident(incident) for incident in recent_incidents
            ],
        }, 200


class AdminIncidentsController(AdminResource):
    """List incidents for the admin review table."""

    def get(self):
        _, error = admin_identity()
        if error:
            return error

        query = Incident.query

        status = request.args.get("status")
        if status:
            status = status.strip().lower()
            if status not in INCIDENT_STATUSES:
                return {
                    "message": "'status' must be one of: "
                    + ", ".join(INCIDENT_STATUSES)
                }, 400
            query = query.filter(Incident.status == status)

        incident_type = request.args.get("incident_type")
        if incident_type:
            incident_type = incident_type.strip().lower()
            if incident_type not in INCIDENT_TYPES:
                return {
                    "message": "'incident_type' must be one of: "
                    + ", ".join(INCIDENT_TYPES)
                }, 400
            query = query.filter(Incident.incident_type == incident_type)

        raw_reporter_id = request.args.get("reporter_id")
        if raw_reporter_id is not None:
            try:
                reporter_id = int(raw_reporter_id)
            except ValueError:
                return {"message": "'reporter_id' must be an integer"}, 400
            if reporter_id < 1:
                return {"message": "'reporter_id' must be at least 1"}, 400
            query = query.filter(Incident.user_id == reporter_id)

        search_query = request.args.get("q", "").strip()
        if search_query:
            if len(search_query) > 100:
                return {"message": "'q' cannot exceed 100 characters"}, 400
            pattern = f"%{search_query}%"
            query = query.filter(
                or_(
                    Incident.title.ilike(pattern),
                    Incident.description.ilike(pattern),
                )
            )

        query = query.order_by(Incident.created_at.desc(), Incident.id.desc())
        return paginate(query, serialize_incident), 200


class AdminIncidentController(AdminResource):
    """View an incident in full and update its review status."""

    def get(self, incident_id):
        _, error = admin_identity()
        if error:
            return error

        incident = db.session.get(Incident, incident_id)
        if not incident:
            return {"message": "Incident not found"}, 404

        return {"incident": serialize_incident(incident, include_media=True)}, 200

    def patch(self, incident_id):
        _, error = admin_identity()
        if error:
            return error

        incident = db.session.get(Incident, incident_id)
        if not incident:
            return {"message": "Incident not found"}, 404

        data, error = json_object()
        if error:
            return error

        unsupported_fields = sorted(set(data) - {"status"})
        if unsupported_fields:
            return {
                "message": "Only 'status' can be updated here",
                "unsupported_fields": unsupported_fields,
            }, 400

        status = data.get("status")
        if not isinstance(status, str):
            return {"message": "'status' is required"}, 400

        status = status.strip().lower()
        if status not in INCIDENT_STATUSES:
            return {
                "message": "'status' must be one of: "
                + ", ".join(INCIDENT_STATUSES)
            }, 400

        incident.status = status
        # ``Incident.updated_at`` has no model-level ``onupdate`` yet.
        incident.updated_at = datetime.utcnow()

        try:
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            return {"message": "Incident status could not be updated"}, 500

        return {
            "message": "Incident status updated successfully",
            "incident": serialize_incident(incident, include_media=True),
        }, 200

    def put(self, incident_id):
        """Support PUT as an alias while the frontend is being integrated."""
        return self.patch(incident_id)
