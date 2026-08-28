"""Database seeder for Ajali — sample users, incidents, media and posts.

Adapted from the team's standard seeder architecture (class ``Seed``, one
idempotent ``seed_<table>`` method per table, app-context pushed at module
level, script executed top-to-bottom).

Password note
-------------
Ajali's ``User.set_password()`` hashes with werkzeug (matching what
``User.check_password()`` and therefore ``POST /auth/login`` validate),
so this seeder relies on the model helper instead of writing raw
Flask-Bcrypt hashes. Seeded accounts log in through the normal endpoint.

Usage
-----
Tables must exist first (Alembic migrations in production, or
``db.create_all()`` in a scratch environment), then simply:

    cd back-end && python seed.py
"""

from datetime import datetime, timedelta, timezone

from main import create_app, db
from models import *

app = create_app()
app.app_context().push()


class Seed:
    @staticmethod
    def seed_users():
        """Create sample accounts across roles.

        Checks for existing emails to avoid duplicate entries.
        """
        user_dict1 = {
            "username": "admin",
            "email": "admin@ajali.com",
            "phone": "+254700000001",
            "bio": "Ajali administrator monitoring city-wide reports.",
            "profile_photo": None,
            "role": "admin",
            "password": "admin123",
        }
        user_dict2 = {
            "username": "wanjiku",
            "email": "wanjiku@ajali.com",
            "phone": "+254700000002",
            "bio": "Commuter documenting road hazards around Nairobi.",
            "profile_photo": None,
            "role": "user",
            "password": "wanjiku123",
        }
        user_dict3 = {
            "username": "otieno",
            "email": "otieno@ajali.com",
            "phone": "+254700000003",
            "bio": None,
            "profile_photo": None,
            "role": "user",
            "password": "otieno123",
        }
        user_dict4 = {
            "username": "akinyi",
            "email": "akinyi@ajali.com",
            "phone": "+254700000004",
            "bio": "Road safety advocate in the CBD.",
            "profile_photo": "https://images.ajali.dev/people/akinyi.png",
            "role": "user",
            "password": "akinyi123",
        }

        user_list = [user_dict1, user_dict2, user_dict3, user_dict4]
        for user_dict in user_list:
            existing_user = User.query.filter_by(
                email=user_dict["email"]
            ).first()
            if existing_user:
                print(
                    f"User with email {user_dict['email']} already exists. "
                    "Skipping seeding."
                )
                continue

            user = User(
                username=user_dict["username"],
                email=user_dict["email"],
                phone=user_dict["phone"],
                bio=user_dict["bio"],
                profile_photo=user_dict["profile_photo"],
                role=user_dict["role"],
            )
            # Same hashing path the login endpoint verifies against.
            user.set_password(user_dict["password"])

            db.session.add(user)
            db.session.commit()
            print(f"Seeded user {user_dict['username']} ({user.email}).")

    def _get_user(self, email):
        """Resolve a seeded user, warning instead of crashing if absent."""
        user = User.query.filter_by(email=email).first()
        if not user:
            print(
                f"WARNING: '{email}' not found — run seed_users() first. "
                "Skipping related rows."
            )
        return user

    def seed_incidents(self):
        """Create sample incident reports tied to the seeded users.

        Reports cover a mix of statuses (mostly "under investigation") so
        both the citizen feed and the admin review queue have data.
        """
        wanjiku = self._get_user("wanjiku@ajali.com")
        otieno = self._get_user("otieno@ajali.com")
        akinyi = self._get_user("akinyi@ajali.com")
        if not (wanjiku and otieno and akinyi):
            return

        now = datetime.now(timezone.utc)

        incident_list = [
            {
                "owner": wanjiku,
                "title": "Multi-vehicle collision on Mombasa Road",
                "description": (
                    "Three-vehicle pile-up blocking the right lane near "
                    "the airport turnoff. Emergency services on scene."
                ),
                "incident_type": "red-flag",
                "latitude": -1.3001,
                "longitude": 36.8215,
                "status": "under investigation",
                "created_at": now - timedelta(hours=1),
            },
            {
                "owner": otieno,
                "title": "Fallen tree blocking left lane",
                "description": (
                    "A large eucalyptus tree came down across the "
                    "northbound lane during last night's storm."
                ),
                "incident_type": "intervention",
                "latitude": -1.2945,
                "longitude": 36.8090,
                "status": "under investigation",
                "created_at": now - timedelta(hours=5),
            },
            {
                "owner": otieno,
                "title": "Damaged street light at city square",
                "description": (
                    "Traffic light dark at the 4th & Main junction after "
                    "the outage. Treat as a 4-way stop."
                ),
                "incident_type": "intervention",
                "latitude": -1.2833,
                "longitude": 36.8211,
                "status": "resolved",
                "created_at": now - timedelta(days=1),
            },
            {
                "owner": akinyi,
                "title": "Flooded underpass after heavy rain",
                "description": (
                    "Water rising fast in the Thika Road underpass; cars "
                    "stalled. Road closed by the county."
                ),
                "incident_type": "red-flag",
                "latitude": -1.2864,
                "longitude": 36.8172,
                "status": "under investigation",
                "created_at": now - timedelta(hours=3),
            },
        ]

        for data in incident_list:
            existing_incident = Incident.query.filter_by(
                user_id=data["owner"].id,
                title=data["title"],
            ).first()
            if existing_incident:
                print(
                    f"Incident '{data['title']}' for "
                    f"{data['owner'].username} already exists. "
                    "Skipping seeding."
                )
                continue

            incident = Incident(
                user_id=data["owner"].id,
                title=data["title"],
                description=data["description"],
                incident_type=data["incident_type"],
                latitude=data["latitude"],
                longitude=data["longitude"],
                status=data["status"],
                created_at=data["created_at"],
            )
            db.session.add(incident)
            db.session.commit()
            print(f"Seeded incident '{incident.title}' (id={incident.id}).")

    @staticmethod
    def _ensure_incident_media(incident):
        """Attach default evidence to an incident if it has none yet."""
        if incident.media:
            return False
        media = [
            Media(
                incident_id=incident.id,
                file_url="https://images.ajali.dev/evidence/scene.jpg",
                media_type="image",
            ),
            Media(
                incident_id=incident.id,
                file_url="https://images.ajali.dev/evidence/clip.mp4",
                media_type="video",
            ),
        ]
        db.session.add_all(media)
        db.session.commit()
        return True

    def seed_media(self):
        """Attach sample evidence to any seeded incidents lacking it."""
        incidents = Incident.query.all()
        if not incidents:
            print("No incidents found — run seed_incidents() first.")
            return

        for incident in incidents:
            created = self._ensure_incident_media(incident)
            if created:
                print(
                    f"Attached media to incident {incident.id} "
                    f"('{incident.title}')."
                )
            else:
                print(
                    f"Incident {incident.id} ('{incident.title}') "
                    "already has media. Skipping."
                )

    def seed_community_posts(self):
        """Create sample community wall posts from the seeded users."""
        wanjiku = self._get_user("wanjiku@ajali.com")
        otieno = self._get_user("otieno@ajali.com")
        akinyi = self._get_user("akinyi@ajali.com")
        if not (wanjiku and otieno and akinyi):
            return

        now = datetime.now(timezone.utc)

        post_list = [
            {
                "author": akinyi,
                "content": (
                    "Heavy rain expected from 4 PM. Roads will get slick — "
                    "keep your distance and check your wipers. Stay safe."
                ),
                "created_at": now - timedelta(minutes=20),
            },
            {
                "author": otieno,
                "content": (
                    "Major delay on Thika Road near exit 12. Multi-vehicle "
                    "incident blocking two lanes. Emergency services on "
                    "scene — expect 30+ min delays."
                ),
                "created_at": now - timedelta(hours=1),
            },
            {
                "author": wanjiku,
                "content": (
                    "Power outage in the Downtown district affecting the "
                    "traffic lights at 4th & Main. Treat all dark "
                    "intersections as 4-way stops!"
                ),
                "created_at": now - timedelta(hours=3),
            },
        ]

        for data in post_list:
            existing_post = CommunityPost.query.filter_by(
                user_id=data["author"].id,
                content=data["content"],
            ).first()
            if existing_post:
                print(
                    f"Post by {data['author'].username} matching an "
                    "existing one — skipping seeding."
                )
                continue

            post = CommunityPost(
                user_id=data["author"].id,
                content=data["content"],
                created_at=data["created_at"],
            )
            db.session.add(post)
            db.session.commit()
            print(f"Seeded community post by {post.user.username} (id={post.id}).")


users = Seed()
users.seed_users()
users.seed_incidents()
users.seed_media()
users.seed_community_posts()

print("Sample data seeded successfully.")
