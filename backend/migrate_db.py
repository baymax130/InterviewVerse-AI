"""
One-time migration: add missing 'technology' column to interview_sessions.
"""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'instance', 'interviewverse.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check if column already exists
cursor.execute("PRAGMA table_info(interview_sessions)")
cols = [row[1] for row in cursor.fetchall()]
print("Existing columns:", cols)

if 'technology' not in cols:
    cursor.execute("ALTER TABLE interview_sessions ADD COLUMN technology VARCHAR(100) NOT NULL DEFAULT ''")
    conn.commit()
    print("SUCCESS: Added 'technology' column to interview_sessions")
else:
    print("Column 'technology' already exists — nothing to do.")

conn.close()
