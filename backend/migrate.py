"""One-off migration: add columns added in stage 2 and 3."""
from database import engine
from sqlalchemy import text

MIGRATIONS = [
    # candidates table
    "ALTER TABLE candidates ADD COLUMN source VARCHAR(50) NOT NULL DEFAULT 'direct'",
    "ALTER TABLE candidates ADD COLUMN email VARCHAR(255)",
    "ALTER TABLE candidates ADD COLUMN tg_chat_id VARCHAR(50)",
    "ALTER TABLE candidates ADD COLUMN biometrics_data JSON",
    "ALTER TABLE candidates ADD COLUMN validation_question TEXT",
    "ALTER TABLE candidates ADD COLUMN validation_answer TEXT",
    "ALTER TABLE candidates ADD COLUMN has_passed_verification BOOLEAN",
    # scores table
    "ALTER TABLE scores ADD COLUMN reality_grounding FLOAT NOT NULL DEFAULT 50.0",
    "ALTER TABLE scores ADD COLUMN personal_experience FLOAT NOT NULL DEFAULT 50.0",
    "ALTER TABLE scores ADD COLUMN originality FLOAT NOT NULL DEFAULT 50.0",
    "ALTER TABLE scores ADD COLUMN authenticity_fragments JSON NOT NULL DEFAULT '[]'",
    "ALTER TABLE scores ADD COLUMN potential_triggers JSON NOT NULL DEFAULT '[]'",
]

with engine.connect() as conn:
    for sql in MIGRATIONS:
        try:
            print(f"Running: {sql[:60]}...")
            conn.execute(text(sql))
            conn.commit()
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print("  Column already exists, skipping.")
            else:
                print(f"  Error: {e}")

print("Done.")
