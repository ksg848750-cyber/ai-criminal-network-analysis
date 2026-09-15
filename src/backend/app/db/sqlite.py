import sqlite3
import os
from passlib.context import CryptContext
from datetime import datetime

# MVP Storage for Operational Layer
DB_FILE = os.path.join(os.path.dirname(__file__), "../../../data/operational.db")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_db():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    conn = get_db()
    cursor = conn.cursor()
    
    # Users Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        role TEXT NOT NULL
    )
    ''')

    # Audit Logs Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        role TEXT NOT NULL,
        action TEXT NOT NULL,
        target_resource TEXT,
        status TEXT NOT NULL,
        evidence_hash TEXT,
        details TEXT
    )
    ''')

    conn.commit()

    # Seed initial users if they don't exist
    seed_users(cursor, conn)
    conn.close()

def seed_users(cursor, conn):
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        admin_pass = os.getenv("ADMIN_PASSWORD", "admin123")
        investigator_pass = os.getenv("INVESTIGATOR_PASSWORD", "investigator123")
        
        users = [
            ("U-ADMIN", "admin", pwd_context.hash(admin_pass), "ADMIN"),
            ("U-INV1", "investigator", pwd_context.hash(investigator_pass), "INVESTIGATOR")
        ]
        
        cursor.executemany("INSERT INTO users (user_id, username, hashed_password, role) VALUES (?, ?, ?, ?)", users)
        conn.commit()

def log_audit(user_id: str, username: str, role: str, action: str, target_resource: str, status: str, evidence_hash: str = None, details: str = None):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO audit_logs (timestamp, user_id, username, role, action, target_resource, status, evidence_hash, details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        datetime.utcnow().isoformat(),
        user_id,
        username,
        role,
        action,
        target_resource,
        status,
        evidence_hash,
        details
    ))
    conn.commit()
    conn.close()

def get_user_by_username(username: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    return user
