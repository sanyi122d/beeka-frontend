import sqlite3
import logging
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).parent / "study_buddy.db"

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                user_id TEXT NOT NULL
            )
        """)
        
        conn.execute("""
            CREATE TABLE IF NOT EXISTS spaces (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                name TEXT NOT NULL,
                folder_id TEXT NOT NULL,
                notes TEXT,
                FOREIGN KEY (folder_id) REFERENCES folders (id)
            )
        """)
        
        conn.execute("""
            CREATE TABLE IF NOT EXISTS resources (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                folder_id TEXT NOT NULL,
                content TEXT,
                FOREIGN KEY (folder_id) REFERENCES folders (id)
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY,
                space_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp DATETIME NOT NULL,
                FOREIGN KEY (space_id) REFERENCES spaces (id)
            )
        """)
        
        conn.commit()

@contextmanager
def get_db():   
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close() 