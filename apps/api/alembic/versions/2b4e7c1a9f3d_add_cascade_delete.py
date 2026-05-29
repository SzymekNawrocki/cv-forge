"""add ondelete cascade to user-owned tables

Revision ID: 2b4e7c1a9f3d
Revises: 1a9d911d4cbe
Create Date: 2026-05-29 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = '2b4e7c1a9f3d'
down_revision: Union[str, Sequence[str], None] = '1a9d911d4cbe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add ON DELETE CASCADE to all user-owned FK columns so that deleting a
    # User row cascades cleanly without needing explicit ORM delete calls.
    # DROP IF EXISTS + ADD avoids failures when constraint names differ.
    op.execute("""
        DO $$
        DECLARE
            r RECORD;
        BEGIN
            -- user_profile
            FOR r IN (
                SELECT constraint_name FROM information_schema.table_constraints
                WHERE table_name = 'user_profile' AND constraint_type = 'FOREIGN KEY'
                  AND constraint_name LIKE '%user_id%'
            ) LOOP
                EXECUTE 'ALTER TABLE user_profile DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '"';
            END LOOP;
            ALTER TABLE user_profile ADD CONSTRAINT user_profile_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

            -- master_cvs
            FOR r IN (
                SELECT constraint_name FROM information_schema.table_constraints
                WHERE table_name = 'master_cvs' AND constraint_type = 'FOREIGN KEY'
                  AND constraint_name LIKE '%user_id%'
            ) LOOP
                EXECUTE 'ALTER TABLE master_cvs DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '"';
            END LOOP;
            ALTER TABLE master_cvs ADD CONSTRAINT master_cvs_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

            -- skills
            FOR r IN (
                SELECT constraint_name FROM information_schema.table_constraints
                WHERE table_name = 'skills' AND constraint_type = 'FOREIGN KEY'
                  AND constraint_name LIKE '%user_id%'
            ) LOOP
                EXECUTE 'ALTER TABLE skills DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '"';
            END LOOP;
            ALTER TABLE skills ADD CONSTRAINT skills_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

            -- job_descriptions
            FOR r IN (
                SELECT constraint_name FROM information_schema.table_constraints
                WHERE table_name = 'job_descriptions' AND constraint_type = 'FOREIGN KEY'
                  AND constraint_name LIKE '%user_id%'
            ) LOOP
                EXECUTE 'ALTER TABLE job_descriptions DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '"';
            END LOOP;
            ALTER TABLE job_descriptions ADD CONSTRAINT job_descriptions_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

            -- tailored_cvs.master_cv_id
            FOR r IN (
                SELECT constraint_name FROM information_schema.table_constraints
                WHERE table_name = 'tailored_cvs' AND constraint_type = 'FOREIGN KEY'
                  AND constraint_name LIKE '%master_cv_id%'
            ) LOOP
                EXECUTE 'ALTER TABLE tailored_cvs DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '"';
            END LOOP;
            ALTER TABLE tailored_cvs ADD CONSTRAINT tailored_cvs_master_cv_id_fkey
                FOREIGN KEY (master_cv_id) REFERENCES master_cvs(id) ON DELETE CASCADE;

            -- tailored_cvs.job_desc_id
            FOR r IN (
                SELECT constraint_name FROM information_schema.table_constraints
                WHERE table_name = 'tailored_cvs' AND constraint_type = 'FOREIGN KEY'
                  AND constraint_name LIKE '%job_desc_id%'
            ) LOOP
                EXECUTE 'ALTER TABLE tailored_cvs DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '"';
            END LOOP;
            ALTER TABLE tailored_cvs ADD CONSTRAINT tailored_cvs_job_desc_id_fkey
                FOREIGN KEY (job_desc_id) REFERENCES job_descriptions(id) ON DELETE CASCADE;
        END $$;
    """)


def downgrade() -> None:
    # Remove cascade — restore plain FK constraints (no action on delete)
    op.execute("""
        ALTER TABLE user_profile DROP CONSTRAINT IF EXISTS user_profile_user_id_fkey;
        ALTER TABLE master_cvs DROP CONSTRAINT IF EXISTS master_cvs_user_id_fkey;
        ALTER TABLE skills DROP CONSTRAINT IF EXISTS skills_user_id_fkey;
        ALTER TABLE job_descriptions DROP CONSTRAINT IF EXISTS job_descriptions_user_id_fkey;
        ALTER TABLE tailored_cvs DROP CONSTRAINT IF EXISTS tailored_cvs_master_cv_id_fkey;
        ALTER TABLE tailored_cvs DROP CONSTRAINT IF EXISTS tailored_cvs_job_desc_id_fkey;
    """)
