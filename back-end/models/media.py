from extensions import db
from datetime import datetime, timezone


class Media(db.Model):
<<<<<<< HEAD
    __tablename__ = "media"
=======
    __tablename__="medias"
    id=db.Column(db.Integer, primary_key=True)
    incident_id=db.Column(db.Integer, db.ForeignKey('incidents.id'), nullable=False)
    media_URL=db.Column(db.String(200))
    media_type=db.Column(db.String(100), nullable=False)
    created_at=db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
>>>>>>> 7a4c969 (I have made the community_posts models and made changes on incident, media, users)

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