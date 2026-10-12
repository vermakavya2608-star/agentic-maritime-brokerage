import sqlite3
db = sqlite3.connect("maritime.db")
try:
    columns = {row[1] for row in db.execute("PRAGMA table_info(users)").fetchall()}
    if not columns:
        raise RuntimeError("No users table found; database unchanged.")
    additions = {
        "totp_secret": "VARCHAR(32)",
        "is_2fa_enabled": "BOOLEAN NOT NULL DEFAULT 0",
        "subscription_tier": "VARCHAR(50) NOT NULL DEFAULT 'Agentic Platform Pro'",
        "api_usage": "INTEGER NOT NULL DEFAULT 1240",
        "api_limit": "INTEGER NOT NULL DEFAULT 5000",
        "card_last4": "VARCHAR(4) NOT NULL DEFAULT '4242'",
        "card_exp": "VARCHAR(7) NOT NULL DEFAULT '12/2028'",
        "next_billing_date": "VARCHAR(50) NOT NULL DEFAULT 'November 1, 2026'",
        "is_email_verified": "BOOLEAN NOT NULL DEFAULT 0",
        "is_active": "BOOLEAN NOT NULL DEFAULT 1",
    }
    for name, definition in additions.items():
        if name not in columns:
            db.execute(f'ALTER TABLE users ADD COLUMN "{name}" {definition}')
            print("Added:", name)
        else:
            print("Already exists:", name)
    db.commit()
    print("Database column check completed.")
finally:
    db.close()
