"""create complete application tables

Revision ID: 33ef8be2c5ea
Revises: 20a35e57e8de
"""

from alembic import op
import sqlalchemy as sa


revision = "33ef8be2c5ea"
# The baseline migration is 29b0840b8649; make this initial-create revision
# depend on that baseline so migrations run: baseline -> 33ef8be2c5ea -> 20a35e57e8de
down_revision = "29b0840b8649"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()

    # Note: use plain text columns for incident_type and status here to avoid
    # attempting to create Postgres enum types during table creation. Some
    # environments may already have those enum types present which causes
    # DuplicateObject errors when SQLAlchemy emits CREATE TYPE.


    # -------------------------------------------------
    # USERS
    # -------------------------------------------------

    op.create_table(
        "users",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "username",
            sa.String(length=100),
            nullable=False,
            unique=True,
        ),

        sa.Column(
            "email",
            sa.String(length=120),
            nullable=False,
            unique=True,
        ),

        sa.Column(
            "password_hash",
            sa.String(length=255),
            nullable=False,
        ),

        sa.Column(
            "phone",
            sa.String(length=20),
            nullable=True,
        ),

        sa.Column(
            "bio",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "profile_photo",
            sa.String(length=255),
            nullable=True,
        ),

        sa.Column(
            "role",
            sa.String(length=20),
            nullable=False,
            server_default="user",
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
        ),
    )


    # -------------------------------------------------
    # INCIDENTS
    # -------------------------------------------------

    op.create_table(
        "incidents",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),

        sa.Column(
            "title",
            sa.String(length=100),
            nullable=False,
        ),

        sa.Column(
            "description",
            sa.String(length=300),
            nullable=False,
        ),

        sa.Column(
            "incident_type",
            sa.String(length=50),
            nullable=False,
        ),

        sa.Column(
            "latitude",
            sa.Float(),
            nullable=False,
        ),

        sa.Column(
            "longitude",
            sa.Float(),
            nullable=False,
        ),

        sa.Column(
            "status",
            sa.String(length=50),
            nullable=False,
            server_default="under investigation",
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
        ),
    )


    # -------------------------------------------------
    # COMMUNITY POSTS
    # -------------------------------------------------

    op.create_table(
        "posts",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),

        sa.Column(
            "content",
            sa.Text(),
            nullable=False,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
        ),
    )


    # -------------------------------------------------
    # MEDIA
    # -------------------------------------------------

    op.create_table(
        "media",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),

        sa.Column(
            "incident_id",
            sa.Integer(),
            sa.ForeignKey("incidents.id"),
            nullable=False,
        ),

        sa.Column(
            "file_url",
            sa.String(length=255),
            nullable=False,
        ),

        sa.Column(
            "media_type",
            sa.String(length=100),
            nullable=False,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),
    )


def downgrade():

    op.drop_table("media")
    op.drop_table("posts")
    op.drop_table("incidents")
    op.drop_table("users")

    sa.Enum(
        "red-flag",
        "intervention",
        name="incident_type",
    ).drop(op.get_bind(), checkfirst=True)

    sa.Enum(
        "under investigation",
        "verified",
        "resolved",
        "rejected",
        name="incident_status",
    ).drop(op.get_bind(), checkfirst=True)