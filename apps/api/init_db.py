import sys
from dotenv import load_dotenv

load_dotenv()

from alembic.config import Config
from alembic import command


def main():
    try:
        cfg = Config("alembic.ini")
        command.upgrade(cfg, "head")
        print("DB schema ready")
    except Exception as e:
        print(f"DB init failed: {e}", file=sys.stderr)
        sys.exit(1)


main()
