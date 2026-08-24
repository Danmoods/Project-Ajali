from extensions import db
from datetime import datetime

class Media(db.Model):
    __tablename__="medias"
    id=db.Column(db.Integer, primary_key=True)
    incident_id=db.Column(db.Integer, db.ForeignKey('incidents.id'), nullable=False)
    media_URL=db.Column(db.String(200))
    media_type=db.Column(db.String(100), nullable=False)
    created_at=db.Column(db.Datetime, default=datetime.utcnow, nullable=False)

