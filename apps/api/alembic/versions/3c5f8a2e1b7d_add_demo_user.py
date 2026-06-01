"""add is_demo and created_at to user table

Revision ID: 3c5f8a2e1b7d
Revises: 2b4e7c1a9f3d
Create Date: 2026-06-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = '3c5f8a2e1b7d'
down_revision: Union[str, Sequence[str], None] = '2b4e7c1a9f3d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE "user"
            ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE "user"
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE "user" DROP COLUMN IF EXISTS is_demo;
        ALTER TABLE "user" DROP COLUMN IF EXISTS created_at;
    """)
