from extensions import db
from datetime import datetime, timezone


class Media(db.Model):
    __tablename__ = "media"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    incident_id = db.Column(
        db.Integer,
        db.ForeignKey("incidents.id"),
        nullable=False
    )

    file_url = db.Column(
        db.String(255),
        nullable=False
    )

    media_type = db.Column(
        db.String(100),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    incident = db.relationship(
        "Incident",
        back_populates="media"
    )

    def __repr__(self):
        return f"<Media {self.id}>"