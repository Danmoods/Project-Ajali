from extensions import db
from datetime import datetime


class Incident(db.Model):
    __tablename__ = "incidents"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    title = db.Column(
        db.String(100),
        nullable=False
    )

    description = db.Column(
        db.String(300),
        nullable=False
    )

    incident_type = db.Column(
        db.Enum(
            "red-flag",
            "intervention",
            name="incident_type"
        ),
        nullable=False
    )

    latitude = db.Column(
        db.Float,
        nullable=False
    )

    longitude = db.Column(
        db.Float,
        nullable=False
    )

    status = db.Column(
        db.Enum(
            "under investigation",
            "verified",
            "resolved",
            "rejected",
            name="incident_status"
        ),
        default="under investigation",
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = db.Column(
    db.DateTime,
    default=datetime.utcnow,
    onupdate=datetime.utcnow,
    nullable=False
    )

    user = db.relationship(
        "User",
        back_populates="incidents"
    )

    media = db.relationship(
        "Media",
        back_populates="incident",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Incident {self.id} - {self.title}>"