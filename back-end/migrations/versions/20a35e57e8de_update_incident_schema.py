"""update incident schema

Revision ID: 20a35e57e8de
Revises: 29b0840b8649
Create Date: 2026-08-27 10:47:41.490615

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20a35e57e8de"
# This migration modifies the `incidents` table which is created in
# revision 33ef8be2c5ea, so make that the down revision to ensure correct
# ordering: baseline -> 33ef8be2c5ea -> 20a35e57e8de
down_revision = "33ef8be2c5ea"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()

    # Create incident_type enum
    incident_type_enum = sa.Enum(
        "red-flag",
        "intervention",
        name="incident_type"
    )

    # Create incident_status enum
    incident_status_enum = sa.Enum(
        "under investigation",
        "verified",
        "resolved",
        "rejected",
        name="incident_status"
    )

    incident_type_enum.create(bind, checkfirst=True)
    incident_status_enum.create(bind, checkfirst=True)

    # Add incident_type temporarily as nullable if it does not already exist
    cols = bind.exec_driver_sql(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name='incidents' AND column_name='incident_type'"
    ).fetchone()
    if not cols:
        op.add_column(
            "incidents",
            sa.Column(
                "incident_type",
                incident_type_enum,
                nullable=True
            )
        )

    # Convert existing VARCHAR status to PostgreSQL enum.
    # Drop any text default first so the type conversion can proceed,
    # then restore an appropriate enum default.
    op.execute("ALTER TABLE incidents ALTER COLUMN status DROP DEFAULT")
    op.execute("""
        ALTER TABLE incidents
        ALTER COLUMN status TYPE incident_status
        USING status::incident_status
    """)
    op.execute("ALTER TABLE incidents ALTER COLUMN status SET DEFAULT 'under investigation'::incident_status")

    # Change title from VARCHAR(150) to VARCHAR(100)
    op.alter_column(
        "incidents",
        "title",
        existing_type=sa.VARCHAR(length=150),
        type_=sa.String(length=100),
        existing_nullable=False
    )

    # Change description from TEXT to VARCHAR(300)
    op.alter_column(
        "incidents",
        "description",
        existing_type=sa.TEXT(),
        type_=sa.String(length=300),
        existing_nullable=False
    )

    # Remove old category column if it exists
    cat_col = bind.exec_driver_sql(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name='incidents' AND column_name='category'"
    ).fetchone()
    if cat_col:
        op.drop_column(
            "incidents",
            "category"
        )

    # Make incident_type required
    op.alter_column(
        "incidents",
        "incident_type",
        nullable=False
    )


def downgrade():
    bind = op.get_bind()

    # Add category back
    op.add_column(
        "incidents",
        sa.Column(
            "category",
            sa.VARCHAR(length=100),
            nullable=True
        )
    )

    # Convert status enum back to VARCHAR
    op.execute("""
        ALTER TABLE incidents
        ALTER COLUMN status TYPE VARCHAR(50)
        USING status::text
    """)

    # Restore description
    op.alter_column(
        "incidents",
        "description",
        existing_type=sa.String(length=300),
        type_=sa.TEXT(),
        existing_nullable=False
    )

    # Restore title
    op.alter_column(
        "incidents",
        "title",
        existing_type=sa.String(length=100),
        type_=sa.VARCHAR(length=150),
        existing_nullable=False
    )

    # Remove incident_type
    op.drop_column(
        "incidents",
        "incident_type"
    )

    # Remove PostgreSQL enum types
    sa.Enum(
        "red-flag",
        "intervention",
        name="incident_type"
    ).drop(bind, checkfirst=True)

    sa.Enum(
        "under investigation",
        "verified",
        "resolved",
        "rejected",
        name="incident_status"
    ).drop(bind, checkfirst=True)