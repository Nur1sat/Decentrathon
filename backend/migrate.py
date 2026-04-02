"""One-off migration: add columns added in stage 2."""
from database import engine

MIGRATIONS = [
    # candidates table
    "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS source VARCHAR(50) NOT NULL DEFAULT 'direct'",
    # scores table
    "ALTER TABLE scores ADD COLUMN IF NOT EXISTS reality_grounding FLOAT NOT NULL DEFAULT 50.0",
    "ALTER TABLE scores ADD COLUMN IF NOT EXISTS personal_experience FLOAT NOT NULL DEFAULT 50.0",
    "ALTER TABLE scores ADD COLUMN IF NOT EXISTS originality FLOAT NOT NULL DEFAULT 50.0",
    "ALTER TABLE scores ADD COLUMN IF NOT EXISTS authenticity_fragments JSON NOT NULL DEFAULT '[]'",
    "ALTER TABLE scores ADD COLUMN IF NOT EXISTS potential_triggers JSON NOT NULL DEFAULT '[]'",
]

with engine.connect() as conn:
    for sql in MIGRATIONS:
        print(f"Running: {sql[:60]}...")
        conn.execute(__import__("sqlalchemy").text(sql))
    conn.commit()

print("Done.")
