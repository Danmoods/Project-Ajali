from flask import Flask
from flask_cors import CORS

from config import Config
from extensions import db, migrate, jwt, ma

from models.users import Users
from models.incident import Incident
from models.media import Media
from models.community_post import CommunityPost

def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    ma.init_app(app)

    CORS(app)

    @app.route("/")
    def home():
        return {
            "message": "Welcome to Ajali API"
        }

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)