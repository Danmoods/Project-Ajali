"""Citizen-facing incident reporting: browse, submit, edit, and delete
reports, and manage the evidence attached to them.

Follows the same conventions as ``admin_controller`` and ``auth_controller``:
module-level constants, small serializer/validation helpers, a JWT-protected
base resource, and controller classes that return ``(payload, status)`` pairs.
"""

from functools import wraps

from flask import request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from flask_jwt_extended.exceptions import NoAuthorizationError
from flask_restful import Resource
from sqlalchemy import or_
from sqlalchemy.exc import SQLAlchemyError

from extensions import db
from models.incident import Incident
from models.media import Media
from models.users import User


ADMIN_ROLE = "admin"
DEFAULT_PER_PAGE = 10
MAX_PER_PAGE = 100
MAX_SEARCH_LENGTH = 100

MAX_TITLE_LENGTH = 100        # matches ``Incident.title``
MAX_DESCRIPTION_LENGTH = 300  # matches ``Incident.description``
MAX_FILE_URL_LENGTH = 255     # matches ``Media.file_url``
MAX_MEDIA_TYPE_LENGTH = 100   # matches ``Media.media_type``

MIN_LATITUDE = -90.0
MAX_LATITUDE = 90.0
MIN_LONGITUDE = -180.0
MAX_LONGITUDE = 180.0

MAX_MEDIA_PER_REQUEST = 10

INCIDENT_STATUSES = (
    "under investigation",
    "verified",
    "resolved",
    "rejected",
)
INCIDENT_TYPES = ("red-flag", "intervention")

# New reports always enter the administrator review queue with this status.
DEFAULT_INCIDENT_STATUS = "under investigation"

# Only administrators move a report out of "under investigation", and once
# reviewed its contents are frozen for everyone.
REVIEWED_STATUSES = ("verified", "resolved", "rejected")

EDITABLE_INCIDENT_FIELDS = {
    "title",
    "description",
    "incident_type",
    "latitude",
    "longitude",
}
MEDIA_ITEM_FIELDS = {"file_url", "media_type"}


def _timestamp(value):
    return value.isoformat() if value else None


def serialize_public_user(user):
    """Serialize a user for display next to their report.

    Contact details (email, phone) are intentionally hidden from other
    members; use ``admin_controller.serialize_user`` where admins work.
    """
    if not user:
        return None

    return {
        "id": user.id,
        "username": user.username,
        "profile_photo": user.profile_photo,
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
        "reporter": serialize_public_user(incident.user),
        "created_at": _timestamp(incident.created_at),
        "updated_at": _timestamp(incident.updated_at),
    }

    if include_media:
        payload["media"] = [serialize_media(item) for item in incident.media]

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


def coordinate(data, field_name, minimum, maximum):
    """Return a bounded floating-point coordinate or a client-error.

    Numeric strings are accepted because HTML inputs hand over strings.
    """
    value = data.get(field_name)

    # ``bool`` is a subclass of ``int``, but booleans are never coordinates.
    if isinstance(value, bool):
        value = None

    if value is None or (isinstance(value, str) and not value.strip()):
        return None, ({"message": f"'{field_name}' is required"}, 400)

    bounds_message = (
        f"'{field_name}' must be a number between "
        f"{minimum:g} and {maximum:g}"
    )

    if isinstance(value, (int, float)):
        number = float(value)
    elif isinstance(value, str):
        try:
            number = float(value.strip())
        except ValueError:
            return None, ({"message": bounds_message}, 400)
    else:
        return None, ({"message": bounds_message}, 400)

    if number < minimum or number > maximum:
        return None, ({"message": bounds_message}, 400)

    return number, None


def incident_type_value(data, field_name="incident_type"):
    incident_type, error = required_text(data, field_name, 20)
    if error:
        return None, error

    incident_type = incident_type.lower()
    if incident_type not in INCIDENT_TYPES:
        return None, (
            {
                "message": f"'{field_name}' must be one of: "
                + ", ".join(INCIDENT_TYPES)
            },
            400,
        )

    return incident_type, None


def review_lock_error(incident):
    """Reject writes once an administrator has reviewed the report."""
    if incident.status in REVIEWED_STATUSES:
        return (
            {
                "message": "This report has been reviewed "
                f"('{incident.status}') and can no longer be modified"
            },
            403,
        )
    return None


def ownership_error(user, incident, action):
    """Reject writes from users who neither own the report nor administer."""
    if user.id != incident.user_id and user.role.lower() != ADMIN_ROLE:
        return ({"message": f"You can only {action} your own reports"}, 403)
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


class IncidentResource(Resource):
    """Base resource: every incident endpoint requires a valid JWT."""

    method_decorators = [auth_required]


class IncidentsController(IncidentResource):
    """Browse incident reports or submit a new one."""

    def get(self):
        user, error = current_identity()
        if error:
            return error

        query = Incident.query

        status = request.args.get("status")
        if status is not None:
            status = status.strip().lower()
            if status not in INCIDENT_STATUSES:
                return {
                    "message": "'status' must be one of: "
                    + ", ".join(INCIDENT_STATUSES)
                }, 400
            query = query.filter(Incident.status == status)

        incident_type = request.args.get("incident_type")
        if incident_type is not None:
            incident_type = incident_type.strip().lower()
            if incident_type not in INCIDENT_TYPES:
                return {
                    "message": "'incident_type' must be one of: "
                    + ", ".join(INCIDENT_TYPES)
                }, 400
            query = query.filter(Incident.incident_type == incident_type)

        mine = request.args.get("mine")
        if mine is not None:
            mine = mine.strip().lower()
            if mine not in ("true", "false"):
                return {"message": "'mine' must be 'true' or 'false'"}, 400
            if mine == "true":
                query = query.filter(Incident.user_id == user.id)

        search_query = request.args.get("q", "").strip()
        if search_query:
            if len(search_query) > MAX_SEARCH_LENGTH:
                return {
                    "message": f"'q' cannot exceed "
                    f"{MAX_SEARCH_LENGTH} characters"
                }, 400
            pattern = f"%{search_query}%"
            query = query.filter(
                or_(
                    Incident.title.ilike(pattern),
                    Incident.description.ilike(pattern),
                )
            )

        query = query.order_by(Incident.created_at.desc(), Incident.id.desc())
        return paginate(query, serialize_incident), 200

    def post(self):
        user, error = current_identity()
        if error:
            return error

        data, error = json_object()
        if error:
            return error

        error = unsupported_fields(data, EDITABLE_INCIDENT_FIELDS)
        if error:
            return error

        title, error = required_text(data, "title", MAX_TITLE_LENGTH)
        if error:
            return error

        description, error = required_text(
            data, "description", MAX_DESCRIPTION_LENGTH
        )
        if error:
            return error

        incident_type, error = incident_type_value(data)
        if error:
            return error

        latitude, error = coordinate(
            data, "latitude", MIN_LATITUDE, MAX_LATITUDE
        )
        if error:
            return error

        longitude, error = coordinate(
            data, "longitude", MIN_LONGITUDE, MAX_LONGITUDE
        )
        if error:
            return error

        incident = Incident(
            user_id=user.id,
            title=title,
            description=description,
            incident_type=incident_type,
            latitude=latitude,
            longitude=longitude,
            status=DEFAULT_INCIDENT_STATUS,
        )

        try:
            db.session.add(incident)
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            return {"message": "The report could not be submitted"}, 500

        return {
            "message": "Report submitted successfully",
            "incident": serialize_incident(incident),
        }, 201


class IncidentController(IncidentResource):
    """View a single report; owners may edit or delete it before review."""

    def get(self, incident_id):
        _, error = current_identity()
        if error:
            return error

        incident = db.session.get(Incident, incident_id)
        if not incident:
            return {"message": "Incident not found"}, 404

        return {
            "incident": serialize_incident(incident, include_media=True),
        }, 200

    def patch(self, incident_id):
        user, error = current_identity()
        if error:
            return error

        incident = db.session.get(Incident, incident_id)
        if not incident:
            return {"message": "Incident not found"}, 404

        error = ownership_error(user, incident, "modify")
        if error:
            return error

        error = review_lock_error(incident)
        if error:
            return error

        data, error = json_object()
        if error:
            return error

        if not data:
            return {"message": "At least one field is required"}, 400

        if "status" in data:
            return {
                "message": "Only administrators can change incident status"
            }, 400

        error = unsupported_fields(data, EDITABLE_INCIDENT_FIELDS)
        if error:
            return error

        if "title" in data:
            title, error = required_text(data, "title", MAX_TITLE_LENGTH)
            if error:
                return error
            incident.title = title

        if "description" in data:
            description, error = required_text(
                data, "description", MAX_DESCRIPTION_LENGTH
            )
            if error:
                return error
            incident.description = description

        if "incident_type" in data:
            incident_type, error = incident_type_value(data)
            if error:
                return error
            incident.incident_type = incident_type

        if "latitude" in data:
            latitude, error = coordinate(
                data, "latitude", MIN_LATITUDE, MAX_LATITUDE
            )
            if error:
                return error
            incident.latitude = latitude

        if "longitude" in data:
            longitude, error = coordinate(
                data, "longitude", MIN_LONGITUDE, MAX_LONGITUDE
            )
            if error:
                return error
            incident.longitude = longitude

        try:
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            return {"message": "The report could not be updated"}, 500

        return {
            "message": "Report updated successfully",
            "incident": serialize_incident(incident, include_media=True),
        }, 200

    def put(self, incident_id):
        """Support PUT as an alias while the frontend is being integrated."""
        return self.patch(incident_id)

    def delete(self, incident_id):
        user, error = current_identity()
        if error:
            return error

        incident = db.session.get(Incident, incident_id)
        if not incident:
            return {"message": "Incident not found"}, 404

        error = ownership_error(user, incident, "delete")
        if error:
            return error

        error = review_lock_error(incident)
        if error:
            return error

        try:
            # The ``media`` relationship cascades, removing evidence too.
            db.session.delete(incident)
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            return {"message": "The report could not be deleted"}, 500

        return {"message": "Report deleted successfully"}, 200


class IncidentMediaController(IncidentResource):
    """List or attach evidence (photos and videos) for a report."""

    def get(self, incident_id):
        _, error = current_identity()
        if error:
            return error

        incident = db.session.get(Incident, incident_id)
        if not incident:
            return {"message": "Incident not found"}, 404

        return {
            "media": [serialize_media(item) for item in incident.media],
        }, 200

    def post(self, incident_id):
        user, error = current_identity()
        if error:
            return error

        incident = db.session.get(Incident, incident_id)
        if not incident:
            return {"message": "Incident not found"}, 404

        error = ownership_error(user, incident, "attach evidence to")
        if error:
            return error

        error = review_lock_error(incident)
        if error:
            return error

        data, error = json_object()
        if error:
            return error

        records = []
        if "media" in data:
            error = unsupported_fields(data, {"media"})
            if error:
                return error

            items = data["media"]
            if not isinstance(items, list):
                return {"message": "'media' must be a list of objects"}, 400
            if not items:
                return {"message": "'media' cannot be empty"}, 400
            if len(items) > MAX_MEDIA_PER_REQUEST:
                return {
                    "message": f"A maximum of {MAX_MEDIA_PER_REQUEST} items "
                    "can be attached at once"
                }, 400

            for index, item in enumerate(items):
                if not isinstance(item, dict):
                    return {
                        "message": f"'media[{index}]' must be an object"
                    }, 400

                error = unsupported_fields(item, MEDIA_ITEM_FIELDS)
                if error:
                    return error

                file_url, error = required_text(
                    item, "file_url", MAX_FILE_URL_LENGTH
                )
                if error:
                    return error

                media_type, error = required_text(
                    item, "media_type", MAX_MEDIA_TYPE_LENGTH
                )
                if error:
                    return error

                records.append(
                    {"file_url": file_url, "media_type": media_type}
                )
        else:
            error = unsupported_fields(data, MEDIA_ITEM_FIELDS)
            if error:
                return error

            file_url, error = required_text(
                data, "file_url", MAX_FILE_URL_LENGTH
            )
            if error:
                return error

            media_type, error = required_text(
                data, "media_type", MAX_MEDIA_TYPE_LENGTH
            )
            if error:
                return error

            records.append({"file_url": file_url, "media_type": media_type})

        media_items = [
            Media(
                incident_id=incident.id,
                file_url=record["file_url"],
                media_type=record["media_type"],
            )
            for record in records
        ]

        try:
            db.session.add_all(media_items)
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            return {"message": "The evidence could not be saved"}, 500

        return {
            "message": "Evidence added successfully",
            "media": [serialize_media(item) for item in media_items],
        }, 201


class IncidentMediaDetailController(IncidentResource):
    """Remove a single piece of evidence from a report."""

    def delete(self, incident_id, media_id):
        user, error = current_identity()
        if error:
            return error

        incident = db.session.get(Incident, incident_id)
        if not incident:
            return {"message": "Incident not found"}, 404

        media = Media.query.filter(
            Media.id == media_id,
            Media.incident_id == incident.id,
        ).first()
        if not media:
            return {"message": "Media not found"}, 404

        error = ownership_error(user, incident, "remove evidence from")
        if error:
            return error

        error = review_lock_error(incident)
        if error:
            return error

        try:
            db.session.delete(media)
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            return {"message": "The evidence could not be removed"}, 500

        return {"message": "Evidence removed successfully"}, 200
