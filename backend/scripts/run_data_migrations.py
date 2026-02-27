"""CLI para executar data migrations versionadas."""

from pathlib import Path
import sys

# Garante import de `app` quando executado via `python scripts/run_data_migrations.py`
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.database.database import SessionLocal
from app.database.data_migrations import apply_pending_data_migrations


def main() -> None:
    db = SessionLocal()

    try:
        executed = apply_pending_data_migrations(db)
        if not executed:
            print("✅ Nenhuma data migration pendente.")
            return

        print("✅ Data migrations aplicadas:")
        for version, name, affected_rows in executed:
            print(f"  - {version} | {name} | registros afetados: {affected_rows}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
