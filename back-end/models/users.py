from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class User(db.model):
    __tablename__="users"
    id = db.Column(db.Integer, primary_key=True)
    username=db.Column(db.String(100), unique=True, nullable=False)
    email=db.Column(db.String(100), unique=True, nullable=False)
    passsword=db.Column(db.String, nullable=False)
    role=db.Column(db.String, default="user", nullable=False)
    created_at=db.Column(db.Datetime, default=datetime.utcnow)

#To return an object into a string.
    def __repr__(self):
        return f"<User{self.username}>"

# Method to set a users password
    def set_password(self,password):
        self.password = generate_password_hash(password)

# Method to check a users password
    def check_password(self, password):
        # check the raw password and compares it with the stored hash password.
        return check_password_hash(self.password, password)

    