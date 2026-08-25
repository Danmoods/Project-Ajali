from extensions import db
from datetime import datetime

class Community_Post(db.Model):
    __talename__="Community_Posts"
    id=db.Column(db.Integer, nullable=False)
    user_id=db.Column(db.Integer, db.ForeingKey('users.id'), nullable=False)
    content=db.Column(db.String(100), nullable=False)
    cretated_at=db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at=db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)