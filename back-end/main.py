from flask import Flask
from flask_cors import CORS
from flask_restful import Api

from config import Config
from controller import register_resources
from extensions import db, migrate, jwt, ma

def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    ma.init_app(app)

    CORS(app)

    api = Api(app)
    register_resources(api)

    @app.route("/")
    def home():
        return {
            "message": "Welcome to Ajali API"
        }

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)

