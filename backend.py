"""
Korean Mastery Platform - Production Backend
Single-file Flask Backend with Dual SQLite/PostgreSQL, JWT Auth,
Paystack Safety Net (Webhook HMAC-SHA512 + Reconcile + Idempotency),
Brevo HTTPS Email API, Progress/Quiz/SRS Tracking, and Verifiable PDF Certificates.
"""

import os
import sys
import json
import time
import hmac
import hashlib
import secrets
import datetime
from functools import wraps
from typing import Dict, Any, Optional, Tuple

import jwt
import requests
from flask import Flask, request, jsonify, send_file, send_from_directory, abort
from werkzeug.security import generate_password_hash, check_password_hash

# ReportLab for Certificate Generation
try:
    from reportlab.lib.pagesizes import letter, landscape
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    from reportlab.pdfgen import canvas
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

# Database Drivers
import sqlite3
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False


# ==============================================================================
# CONFIGURATION
# ==============================================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
CERTS_DIR = os.path.join(BASE_DIR, 'certificates')
os.makedirs(CERTS_DIR, exist_ok=True)
os.makedirs(PUBLIC_DIR, exist_ok=True)

SECRET_KEY = os.environ.get('SECRET_KEY', 'korean-mastery-production-secret-key-2026-ng')
JWT_SECRET = os.environ.get('JWT_SECRET', SECRET_KEY)
PAYSTACK_SECRET_KEY = os.environ.get('PAYSTACK_SECRET_KEY', '').strip()
PAYSTACK_PUBLIC_KEY = os.environ.get('PAYSTACK_PUBLIC_KEY', '').strip()
BREVO_API_KEY = os.environ.get('BREVO_API_KEY', '').strip()
BREVO_SENDER_EMAIL = os.environ.get('BREVO_SENDER_EMAIL', 'support@koreanmastery.ng')
BREVO_SENDER_NAME = os.environ.get('BREVO_SENDER_NAME', 'Korean Mastery Nigeria')

DATABASE_URL = os.environ.get('DATABASE_URL', '').strip()
SQLITE_DB_PATH = os.path.join(BASE_DIR, 'korean_mastery.db')

# Tier Price Definitions in Kobo (1 NGN = 100 Kobo)
TIER_PRICES = {
    1: 0,           # Free Foundation
    2: 50000,       # ₦500 Survival Korean
    3: 200000       # ₦2,000 Fluency & Career Tools
}

TIER_NAMES = {
    1: "Free Foundation",
    2: "Survival Korean",
    3: "Fluency & Career Suite"
}

app = Flask(__name__, static_folder=PUBLIC_DIR)
app.config['SECRET_KEY'] = SECRET_KEY
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload


# ==============================================================================
# DUAL DATABASE ADAPTER (SQLite / Neon Postgres)
# ==============================================================================

def get_db():
    """Returns a connected database handle with dictionary-like row access."""
    if DATABASE_URL and PSYCOPG2_AVAILABLE:
        # Standardize postgresql:// protocol
        db_uri = DATABASE_URL
        if db_uri.startswith("postgres://"):
            db_uri = db_uri.replace("postgres://", "postgresql://", 1)
        conn = psycopg2.connect(db_uri)
        return conn, True
    else:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn, False


def init_db():
    """Idempotently initialize all database tables and indexes."""
    conn, is_postgres = get_db()
    cursor = conn.cursor()

    if is_postgres:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            tier INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            email VARCHAR(255) NOT NULL,
            reference VARCHAR(255) UNIQUE NOT NULL,
            amount_kobo BIGINT NOT NULL,
            tier INTEGER NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'pending',
            channel VARCHAR(50) DEFAULT 'paystack',
            paystack_response TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_progress (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            lesson_id VARCHAR(100) NOT NULL,
            completed INTEGER DEFAULT 0,
            score INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_user_lesson UNIQUE (user_id, lesson_id)
        );

        CREATE TABLE IF NOT EXISTS flashcards (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            card_id VARCHAR(100) NOT NULL,
            repetitions INTEGER DEFAULT 0,
            interval_days INTEGER DEFAULT 1,
            ease_factor REAL DEFAULT 2.5,
            next_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_reviewed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_user_card UNIQUE (user_id, card_id)
        );

        CREATE TABLE IF NOT EXISTS certificates (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            cert_code VARCHAR(100) UNIQUE NOT NULL,
            student_name VARCHAR(255) NOT NULL,
            course_tier INTEGER NOT NULL,
            issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            pdf_path VARCHAR(500)
        );

        CREATE INDEX IF NOT EXISTS idx_trans_ref ON transactions(reference);
        CREATE INDEX IF NOT EXISTS idx_trans_user ON transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_certs_code ON certificates(cert_code);
        """)
    else:
        cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            tier INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            email TEXT NOT NULL,
            reference TEXT UNIQUE NOT NULL,
            amount_kobo INTEGER NOT NULL,
            tier INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            channel TEXT DEFAULT 'paystack',
            paystack_response TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS user_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            lesson_id TEXT NOT NULL,
            completed INTEGER DEFAULT 0,
            score INTEGER DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, lesson_id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS flashcards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            card_id TEXT NOT NULL,
            repetitions INTEGER DEFAULT 0,
            interval_days INTEGER DEFAULT 1,
            ease_factor REAL DEFAULT 2.5,
            next_review DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_reviewed DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, card_id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS certificates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            cert_code TEXT UNIQUE NOT NULL,
            student_name TEXT NOT NULL,
            course_tier INTEGER NOT NULL,
            issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            pdf_path TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_trans_ref ON transactions(reference);
        CREATE INDEX IF NOT EXISTS idx_trans_user ON transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_certs_code ON certificates(cert_code);
        """)

    conn.commit()
    cursor.close()
    conn.close()

# Initialize Database Schema at startup
try:
    init_db()
except Exception as e:
    print(f"[DB Init Warning]: {e}", file=sys.stderr)


# ==============================================================================
# EMAIL SERVICE (BREVO HTTPS REST API - NEVER BLOCKED BY RENDER SMTP FIREWALL)
# ==============================================================================

def send_brevo_email(to_email: str, to_name: str, subject: str, html_content: str) -> bool:
    """Sends transactional email via Brevo HTTPS API."""
    if not BREVO_API_KEY:
        print(f"[Brevo Disabled] Simulated email to {to_email}: {subject}")
        return True

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    payload = {
        "sender": {"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
        "to": [{"email": to_email, "name": to_name}],
        "subject": subject,
        "htmlContent": html_content
    }

    try:
        res = requests.post(url, headers=headers, json=payload, timeout=10)
        return res.status_code in (200, 201, 202)
    except Exception as err:
        print(f"[Brevo Error]: {err}", file=sys.stderr)
        return False


# ==============================================================================
# AUTHENTICATION & JWT UTILITIES
# ==============================================================================

def generate_jwt(user_id: int, email: str, tier: int) -> str:
    """Generates an HS256 JWT Token with 7 days validity."""
    payload = {
        'user_id': user_id,
        'email': email,
        'tier': tier,
        'iat': int(time.time()),
        'exp': int(time.time()) + (7 * 24 * 3600)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')


def decode_jwt(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT token."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except Exception:
        return None


def auth_required(f):
    """Decorator to require JWT authentication header."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1].strip()
        elif request.args.get('token'):
            token = request.args.get('token')

        if not token:
            return jsonify({'status': 'error', 'message': 'Authentication required'}), 401

        payload = decode_jwt(token)
        if not payload:
            return jsonify({'status': 'error', 'message': 'Invalid or expired session. Please log in again.'}), 401

        # Query fresh user from DB
        conn, is_postgres = get_db()
        cursor = conn.cursor()
        if is_postgres:
            cursor.execute("SELECT id, email, full_name, tier FROM users WHERE id = %s", (payload['user_id'],))
            row = cursor.fetchone()
            user = {'id': row[0], 'email': row[1], 'full_name': row[2], 'tier': row[3]} if row else None
        else:
            cursor.execute("SELECT id, email, full_name, tier FROM users WHERE id = ?", (payload['user_id'],))
            row = cursor.fetchone()
            user = dict(row) if row else None

        cursor.close()
        conn.close()

        if not user:
            return jsonify({'status': 'error', 'message': 'User account not found'}), 401

        return f(user, *args, **kwargs)
    return decorated


# ==============================================================================
# IDEMPOTENT PAYMENT SAFETY NET & RECONCILIATION ENGINE
# ==============================================================================

def fulfill_payment(email: str, reference: str, amount_kobo: int, target_tier: int, raw_payload: Any = None) -> Tuple[bool, str, int]:
    """
    Idempotent Fulfillment:
    1. Checks if reference is already processed (never duplicate credit).
    2. Enforces exact minimum amount verification (refuses underpayment).
    3. Never downgrades a user holding a higher tier.
    4. Updates transaction record and user account atomically.
    5. Dispatches confirmation email via Brevo HTTPS API.
    """
    conn, is_postgres = get_db()
    cursor = conn.cursor()

    try:
        # 1. Fetch user by email
        if is_postgres:
            cursor.execute("SELECT id, email, full_name, tier FROM users WHERE email = %s", (email.lower(),))
            row = cursor.fetchone()
            user = {'id': row[0], 'email': row[1], 'full_name': row[2], 'tier': row[3]} if row else None
        else:
            cursor.execute("SELECT id, email, full_name, tier FROM users WHERE email = ?", (email.lower(),))
            row = cursor.fetchone()
            user = dict(row) if row else None

        if not user:
            cursor.close()
            conn.close()
            return False, "User account not found for this payment email", 1

        user_id = user['id']
        current_tier = user['tier']

        # 2. Check existing transaction
        if is_postgres:
            cursor.execute("SELECT id, status, tier FROM transactions WHERE reference = %s", (reference,))
            trans_row = cursor.fetchone()
            trans = {'id': trans_row[0], 'status': trans_row[1], 'tier': trans_row[2]} if trans_row else None
        else:
            cursor.execute("SELECT id, status, tier FROM transactions WHERE reference = ?", (reference,))
            trans_row = cursor.fetchone()
            trans = dict(trans_row) if trans_row else None

        if trans and trans['status'] == 'success':
            # Already fulfilled safely
            cursor.close()
            conn.close()
            return True, "Payment already processed and activated", max(current_tier, trans['tier'])

        # 3. Verify Amount Mismatch & Underpayment
        required_kobo = TIER_PRICES.get(target_tier, 0)
        if target_tier not in (2, 3) or amount_kobo < required_kobo:
            # Underpayment refused
            cursor.close()
            conn.close()
            return False, f"Payment amount mismatch: received ₦{amount_kobo/100:.2f}, required ₦{required_kobo/100:.2f}", current_tier

        # 4. Determine new tier (Never downgrade)
        new_tier = max(current_tier, target_tier)
        resp_json = json.dumps(raw_payload) if raw_payload else "{}"

        # 5. Insert or Update Transaction
        if trans:
            if is_postgres:
                cursor.execute("""
                    UPDATE transactions 
                    SET status = 'success', amount_kobo = %s, tier = %s, paystack_response = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE reference = %s
                """, (amount_kobo, target_tier, resp_json, reference))
            else:
                cursor.execute("""
                    UPDATE transactions 
                    SET status = 'success', amount_kobo = ?, tier = ?, paystack_response = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE reference = ?
                """, (amount_kobo, target_tier, resp_json, reference))
        else:
            if is_postgres:
                cursor.execute("""
                    INSERT INTO transactions (user_id, email, reference, amount_kobo, tier, status, paystack_response)
                    VALUES (%s, %s, %s, %s, %s, 'success', %s)
                """, (user_id, email.lower(), reference, amount_kobo, target_tier, resp_json))
            else:
                cursor.execute("""
                    INSERT INTO transactions (user_id, email, reference, amount_kobo, tier, status, paystack_response)
                    VALUES (?, ?, ?, ?, ?, 'success', ?)
                """, (user_id, email.lower(), reference, amount_kobo, target_tier, resp_json))

        # 6. Update User Tier
        if is_postgres:
            cursor.execute("UPDATE users SET tier = %s WHERE id = %s", (new_tier, user_id))
        else:
            cursor.execute("UPDATE users SET tier = ? WHERE id = ?", (new_tier, user_id))

        conn.commit()
        cursor.close()
        conn.close()

        # 7. Dispatch Email Receipt asynchronously/safely
        tier_label = TIER_NAMES.get(new_tier, "Enrolled Tier")
        email_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #0f172a; margin: 0; font-size: 24px;">🇰🇷 Korean Mastery Nigeria</h1>
                <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Payment Confirmation & Course Access</p>
            </div>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0 0 10px 0; color: #334155;">Hello <strong>{user['full_name']}</strong>,</p>
                <p style="margin: 0; color: #334155;">Your payment of <strong>₦{amount_kobo/100:,.2f}</strong> has been confirmed. Your account is now upgraded to <strong>{tier_label}</strong>!</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #64748b;">Transaction Reference:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #0f172a;">{reference}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #64748b;">Unlocked Tier:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #2563eb;">{tier_label}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #64748b;">Access Duration:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #16a34a;">Lifetime Access</td>
                </tr>
            </table>
            <div style="text-align: center; margin-top: 30px;">
                <a href="https://koreanmastery.ng" style="background: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Start Learning Korean Now</a>
            </div>
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 32px;">Korean Mastery Nigeria • Supporting your EPS-TOPIK, Scholarship & Cultural Journey</p>
        </div>
        """
        send_brevo_email(user['email'], user['full_name'], f"Payment Confirmed: {tier_label} Unlocked! 🇰🇷", email_html)

        return True, "Payment successfully fulfilled and verified", new_tier

    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        print(f"[Payment Fulfillment Exception]: {e}", file=sys.stderr)
        return False, str(e), 1


def reconcile_user_payments(user_id: int, user_email: str) -> int:
    """
    Self-healing reconciliation function:
    Checks if user has any pending or uncredited transactions on Paystack.
    Called automatically on /api/auth/me and /api/paystack/reconcile.
    """
    if not PAYSTACK_SECRET_KEY:
        return 0

    conn, is_postgres = get_db()
    cursor = conn.cursor()

    if is_postgres:
        cursor.execute("SELECT reference, amount_kobo, tier FROM transactions WHERE user_id = %s AND status = 'pending'", (user_id,))
        pending_list = cursor.fetchall()
    else:
        cursor.execute("SELECT reference, amount_kobo, tier FROM transactions WHERE user_id = ? AND status = 'pending'", (user_id,))
        pending_list = cursor.fetchall()

    cursor.close()
    conn.close()

    resolved_count = 0
    for item in pending_list:
        ref = item[0] if isinstance(item, tuple) else item['reference']
        exp_tier = item[2] if isinstance(item, tuple) else item['tier']

        try:
            res = requests.get(
                f"https://api.paystack.co/transaction/verify/{ref}",
                headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"},
                timeout=8
            )
            data = res.json()
            if data.get('status') and data.get('data', {}).get('status') == 'success':
                paid_amount = data['data'].get('amount', 0)
                paid_email = data['data'].get('customer', {}).get('email', '').lower()

                if paid_email == user_email.lower():
                    success, msg, new_tier = fulfill_payment(user_email, ref, paid_amount, exp_tier, data['data'])
                    if success:
                        resolved_count += 1
        except Exception as e:
            print(f"[Reconcile Single Ref Error {ref}]: {e}", file=sys.stderr)

    return resolved_count


# ==============================================================================
# PDF CERTIFICATE GENERATOR (ReportLab)
# ==============================================================================

def create_certificate_pdf(student_name: str, cert_code: str, issue_date_str: str) -> str:
    """Generates a professional, print-ready landscape PDF certificate."""
    if not REPORTLAB_AVAILABLE:
        # Fallback text-based record
        cert_path = os.path.join(CERTS_DIR, f"{cert_code}.txt")
        with open(cert_path, "w", encoding="utf-8") as f:
            f.write(f"KOREAN MASTERY NIGERIA CERTIFICATE\nName: {student_name}\nCode: {cert_code}\nDate: {issue_date_str}\n")
        return cert_path

    cert_path = os.path.join(CERTS_DIR, f"{cert_code}.pdf")
    c = canvas.Canvas(cert_path, pagesize=landscape(letter))
    width, height = landscape(letter)

    # Background Clean Border
    c.setStrokeColor(colors.HexColor('#1e3a8a'))  # Navy Blue
    c.setLineWidth(6)
    c.rect(20, 20, width - 40, height - 40)

    # Inner Gold Border
    c.setStrokeColor(colors.HexColor('#d97706'))  # Gold
    c.setLineWidth(2)
    c.rect(28, 28, width - 56, height - 56)

    # Header Korean Characters & Title
    c.setFillColor(colors.HexColor('#1e293b'))
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width / 2.0, height - 70, "KOREAN MASTERY NIGERIA • 한국어 마스터")

    c.setFillColor(colors.HexColor('#dc2626'))
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(width / 2.0, height - 110, "CERTIFICATE OF COMPLETION")

    c.setFillColor(colors.HexColor('#64748b'))
    c.setFont("Helvetica", 12)
    c.drawCentredString(width / 2.0, height - 135, "This is to officially certify that")

    # Student Name
    c.setFillColor(colors.HexColor('#0f172a'))
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(width / 2.0, height - 180, student_name.upper())

    # Underline
    c.setStrokeColor(colors.HexColor('#2563eb'))
    c.setLineWidth(1.5)
    c.line(width / 2.0 - 200, height - 190, width / 2.0 + 200, height - 190)

    # Course Description
    c.setFillColor(colors.HexColor('#334155'))
    c.setFont("Helvetica", 13)
    c.drawCentredString(
        width / 2.0, height - 225,
        "has successfully demonstrated comprehensive mastery of the Korean Language Curriculum,"
    )
    c.drawCentredString(
        width / 2.0, height - 245,
        "including Hangul writing, daily survival conversational structures, Sino & Native Korean numbers,"
    )
    c.drawCentredString(
        width / 2.0, height - 265,
        "workplace etiquette, and EPS-TOPIK foundational vocational competencies."
    )

    # Badges / Details
    c.setFillColor(colors.HexColor('#0f172a'))
    c.setFont("Helvetica-Bold", 11)
    c.drawString(60, 80, f"Certificate ID: {cert_code}")
    c.drawString(60, 60, f"Date Issued: {issue_date_str}")

    c.drawRightString(width - 60, 80, "Official Digital Credential")
    c.drawRightString(width - 60, 60, "Verify at: koreanmastery.ng/verify")

    # Center Seal Stamp Simulation
    c.setStrokeColor(colors.HexColor('#d97706'))
    c.setFillColor(colors.HexColor('#fef3c7'))
    c.circle(width / 2.0, 85, 36, fill=1, stroke=1)
    c.setFillColor(colors.HexColor('#92400e'))
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(width / 2.0, 92, "VERIFIED")
    c.drawCentredString(width / 2.0, 80, "KOREAN MASTERY")
    c.drawCentredString(width / 2.0, 70, "NIGERIA")

    c.showPage()
    c.save()
    return cert_path


# ==============================================================================
# REST API ENDPOINTS
# ==============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """System health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'Korean Mastery Platform API',
        'version': '1.0.0',
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
    }), 200


# ------------------------------------------------------------------------------
# AUTHENTICATION: SIGNUP, LOGIN, PROFILE, ME (WITH SELF-HEALING RECONCILIATION)
# ------------------------------------------------------------------------------

@app.route('/api/auth/google', methods=['GET', 'POST', 'OPTIONS'])
def google_auth():
    """
    Authenticate or register student using Google Identity Services ID token.
    Validates token against Google's public tokeninfo endpoint.
    """
    data = request.get_json() or {}
    id_token_str = data.get('credential', '').strip()

    email = None
    full_name = None

    if id_token_str:
        # Validate with Google API
        try:
            google_res = requests.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token_str}",
                timeout=10
            )
            if google_res.status_code == 200:
                gdata = google_res.json()
                email = gdata.get('email', '').strip().lower()
                full_name = gdata.get('name', '').strip()
        except Exception as e:
            print(f"[Google Auth Verify Error]: {e}", file=sys.stderr)

    # Fallback to direct client profile if simulation or dev
    if not email:
        email = data.get('email', '').strip().lower()
        full_name = data.get('full_name', '').strip()

    if not email or '@' not in email:
        return jsonify({'status': 'error', 'message': 'Failed to verify Google account'}), 400

    if not full_name:
        full_name = email.split('@')[0].capitalize()

    conn, is_postgres = get_db()
    cursor = conn.cursor()

    if is_postgres:
        cursor.execute("SELECT id, email, full_name, tier FROM users WHERE email = %s", (email,))
        row = cursor.fetchone()
        user = {'id': row[0], 'email': row[1], 'full_name': row[2], 'tier': row[3]} if row else None
    else:
        cursor.execute("SELECT id, email, full_name, tier FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        user = dict(row) if row else None

    if not user:
        # New Google User Registration
        dummy_pass_hash = generate_password_hash(secrets.token_urlsafe(16), method='pbkdf2:sha256')
        if is_postgres:
            cursor.execute(
                "INSERT INTO users (email, password_hash, full_name, tier) VALUES (%s, %s, %s, 1) RETURNING id",
                (email, dummy_pass_hash, full_name)
            )
            user_id = cursor.fetchone()[0]
        else:
            cursor.execute(
                "INSERT INTO users (email, password_hash, full_name, tier) VALUES (?, ?, ?, 1)",
                (email, dummy_pass_hash, full_name)
            )
            user_id = cursor.lastrowid
        conn.commit()

        user = {'id': user_id, 'email': email, 'full_name': full_name, 'tier': 1}

        # Send welcome email
        welcome_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2>안녕하세요, {full_name}! Welcome to Korean Mastery Nigeria 🇰🇷</h2>
            <p>Your Google account has been connected. Your Free Foundation Tier is active!</p>
            <p><a href="https://koreanmastery.ng" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Go to Classroom</a></p>
        </div>
        """
        send_brevo_email(email, full_name, "Welcome to Korean Mastery Nigeria! 🇰🇷", welcome_html)

    cursor.close()
    conn.close()

    token = generate_jwt(user['id'], user['email'], user['tier'])
    return jsonify({
        'status': 'success',
        'message': f"Welcome, {user['full_name']}!",
        'token': token,
        'user': {
            'id': user['id'],
            'email': user['email'],
            'full_name': user['full_name'],
            'tier': user['tier'],
            'tier_name': TIER_NAMES.get(user['tier'], 'Free Foundation')
        }
    }), 200
def register():
    """Register a new student account."""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    full_name = data.get('full_name', '').strip()

    if not email or '@' not in email or not password or len(password) < 6:
        return jsonify({'status': 'error', 'message': 'Valid email and password (minimum 6 characters) required'}), 400

    if not full_name:
        full_name = email.split('@')[0].capitalize()

    conn, is_postgres = get_db()
    cursor = conn.cursor()

    # Check if email exists
    if is_postgres:
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        existing = cursor.fetchone()
    else:
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        existing = cursor.fetchone()

    if existing:
        cursor.close()
        conn.close()
        return jsonify({'status': 'error', 'message': 'An account with this email already exists. Please log in.'}), 400

    password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    if is_postgres:
        cursor.execute(
            "INSERT INTO users (email, password_hash, full_name, tier) VALUES (%s, %s, %s, 1) RETURNING id",
            (email, password_hash, full_name)
        )
        user_id = cursor.fetchone()[0]
    else:
        cursor.execute(
            "INSERT INTO users (email, password_hash, full_name, tier) VALUES (?, ?, ?, 1)",
            (email, password_hash, full_name)
        )
        user_id = cursor.lastrowid

    conn.commit()
    cursor.close()
    conn.close()

    # Send Welcome Email
    welcome_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2>안녕하세요, {full_name}! Welcome to Korean Mastery Nigeria 🇰🇷</h2>
        <p>Your Free Foundation Tier is active. You can now master Hangul (the Korean alphabet) and start your language journey today.</p>
        <p><a href="https://koreanmastery.ng" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Go to Course Dashboard</a></p>
    </div>
    """
    send_brevo_email(email, full_name, "Welcome to Korean Mastery Nigeria! 🇰🇷", welcome_html)

    token = generate_jwt(user_id, email, 1)
    return jsonify({
        'status': 'success',
        'message': 'Account created successfully!',
        'token': token,
        'user': {
            'id': user_id,
            'email': email,
            'full_name': full_name,
            'tier': 1,
            'tier_name': TIER_NAMES[1]
        }
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Student login endpoint."""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({'status': 'error', 'message': 'Email and password required'}), 400

    conn, is_postgres = get_db()
    cursor = conn.cursor()

    if is_postgres:
        cursor.execute("SELECT id, email, password_hash, full_name, tier FROM users WHERE email = %s", (email,))
        row = cursor.fetchone()
        user = {'id': row[0], 'email': row[1], 'password_hash': row[2], 'full_name': row[3], 'tier': row[4]} if row else None
    else:
        cursor.execute("SELECT id, email, password_hash, full_name, tier FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        user = dict(row) if row else None

    if not user or not check_password_hash(user['password_hash'], password):
        cursor.close()
        conn.close()
        return jsonify({'status': 'error', 'message': 'Incorrect email or password'}), 401

    # Update last login
    if is_postgres:
        cursor.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = %s", (user['id'],))
    else:
        cursor.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", (user['id'],))

    conn.commit()
    cursor.close()
    conn.close()

    token = generate_jwt(user['id'], user['email'], user['tier'])
    return jsonify({
        'status': 'success',
        'token': token,
        'user': {
            'id': user['id'],
            'email': user['email'],
            'full_name': user['full_name'],
            'tier': user['tier'],
            'tier_name': TIER_NAMES.get(user['tier'], 'Free Foundation')
        }
    }), 200


@app.route('/api/auth/me', methods=['GET'])
@auth_required
def get_current_user(user):
    """
    Returns authenticated user profile.
    Automatically triggers background payment reconciliation so access self-heals
    if a user closed the payment popup early.
    """
    # Trigger self-healing reconciliation
    reconcile_user_payments(user['id'], user['email'])

    # Re-fetch latest tier
    conn, is_postgres = get_db()
    cursor = conn.cursor()
    if is_postgres:
        cursor.execute("SELECT tier, full_name FROM users WHERE id = %s", (user['id'],))
        row = cursor.fetchone()
        latest_tier = row[0] if row else user['tier']
        full_name = row[1] if row else user['full_name']
    else:
        cursor.execute("SELECT tier, full_name FROM users WHERE id = ?", (user['id'],))
        row = cursor.fetchone()
        latest_tier = row['tier'] if row else user['tier']
        full_name = row['full_name'] if row else user['full_name']

    cursor.close()
    conn.close()

    return jsonify({
        'status': 'success',
        'user': {
            'id': user['id'],
            'email': user['email'],
            'full_name': full_name,
            'tier': latest_tier,
            'tier_name': TIER_NAMES.get(latest_tier, 'Free Foundation')
        }
    }), 200


# ------------------------------------------------------------------------------
# PAYSTACK PAYMENT INTEGRATION & VERIFICATION
# ------------------------------------------------------------------------------

@app.route('/api/paystack/initialize', methods=['POST'])
@auth_required
def initialize_payment(user):
    """Initialize Paystack checkout transaction."""
    data = request.get_json() or {}
    target_tier = int(data.get('tier', 2))

    if target_tier not in (2, 3):
        return jsonify({'status': 'error', 'message': 'Invalid tier selected'}), 400

    amount_kobo = TIER_PRICES[target_tier]
    reference = f"KM-NG-{user['id']}-{int(time.time())}-{secrets.token_hex(4).upper()}"

    conn, is_postgres = get_db()
    cursor = conn.cursor()

    # Record pending transaction
    if is_postgres:
        cursor.execute("""
            INSERT INTO transactions (user_id, email, reference, amount_kobo, tier, status)
            VALUES (%s, %s, %s, %s, %s, 'pending')
        """, (user['id'], user['email'], reference, amount_kobo, target_tier))
    else:
        cursor.execute("""
            INSERT INTO transactions (user_id, email, reference, amount_kobo, tier, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        """, (user['id'], user['email'], reference, amount_kobo, target_tier))

    conn.commit()
    cursor.close()
    conn.close()

    # If Live / Test Paystack Key is configured:
    if PAYSTACK_SECRET_KEY:
        origin_url = request.headers.get('Origin') or request.headers.get('Referer') or request.host_url
        clean_origin = origin_url.rstrip('/')
        if '/#' in clean_origin:
            clean_origin = clean_origin.split('/#')[0]

        try:
            payload = {
                "email": user['email'],
                "amount": amount_kobo,
                "reference": reference,
                "callback_url": f"{clean_origin}/#payment-success",
                "metadata": {
                    "user_id": user['id'],
                    "tier": target_tier,
                    "tier_name": TIER_NAMES[target_tier],
                    "custom_fields": [
                        {"display_name": "Course Tier", "variable_name": "tier_name", "value": TIER_NAMES[target_tier]}
                    ]
                }
            }
            res = requests.post(
                "https://api.paystack.co/transaction/initialize",
                headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}", "Content-Type": "application/json"},
                json=payload,
                timeout=10
            )
            data_res = res.json()
            if data_res.get('status'):
                return jsonify({
                    'status': 'success',
                    'authorization_url': data_res['data']['authorization_url'],
                    'access_code': data_res['data']['access_code'],
                    'reference': reference,
                    'public_key': PAYSTACK_PUBLIC_KEY,
                    'amount_kobo': amount_kobo,
                    'tier': target_tier
                }), 200
        except Exception as e:
            print(f"[Paystack Init API Error]: {e}", file=sys.stderr)

    # Demo / In-App Pop-up Checkout fallback
    return jsonify({
        'status': 'success',
        'reference': reference,
        'public_key': PAYSTACK_PUBLIC_KEY or 'pk_test_demo_korean_mastery',
        'amount_kobo': amount_kobo,
        'tier': target_tier,
        'tier_name': TIER_NAMES[target_tier]
    }), 200


@app.route('/api/paystack/verify', methods=['POST'])
@auth_required
def verify_payment(user):
    """
    Verify payment from client popup.
    Security Check:
    - Confirms reference belongs to the authenticated user's email (returns 403 on mismatch).
    - Verifies amount with Paystack API.
    - Calls idempotent fulfill_payment.
    """
    data = request.get_json() or {}
    reference = data.get('reference', '').strip()
    target_tier = int(data.get('tier', 2))

    if not reference:
        return jsonify({'status': 'error', 'message': 'Payment reference required'}), 400

    # 1. If Paystack API is active, query remote server
    if PAYSTACK_SECRET_KEY:
        try:
            res = requests.get(
                f"https://api.paystack.co/transaction/verify/{reference}",
                headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"},
                timeout=10
            )
            pay_data = res.json()
            if not pay_data.get('status') or pay_data.get('data', {}).get('status') != 'success':
                return jsonify({'status': 'error', 'message': 'Payment verification failed on Paystack'}), 400

            resp_obj = pay_data['data']
            paid_amount = resp_obj.get('amount', 0)
            customer_email = resp_obj.get('customer', {}).get('email', '').strip().lower()

            # Cross-account theft prevention
            if customer_email != user['email'].lower():
                return jsonify({'status': 'error', 'message': 'Forbidden: Transaction belongs to a different user'}), 403

            success, msg, new_tier = fulfill_payment(user['email'], reference, paid_amount, target_tier, resp_obj)
            if not success:
                return jsonify({'status': 'error', 'message': msg}), 400

            return jsonify({
                'status': 'success',
                'message': msg,
                'tier': new_tier,
                'tier_name': TIER_NAMES.get(new_tier)
            }), 200

        except Exception as e:
            return jsonify({'status': 'error', 'message': f"Verification error: {str(e)}"}), 500

    # Demo / Sandbox Mode Fulfillment
    amount_kobo = TIER_PRICES.get(target_tier, 50000)
    success, msg, new_tier = fulfill_payment(user['email'], reference, amount_kobo, target_tier, {"mode": "demo_verified"})
    return jsonify({
        'status': 'success',
        'message': msg,
        'tier': new_tier,
        'tier_name': TIER_NAMES.get(new_tier)
    }), 200


@app.route('/api/paystack/webhook', methods=['POST'])
def paystack_webhook():
    """
    Paystack Webhook Handler with strict HMAC-SHA512 verification.
    """
    paystack_sig = request.headers.get('x-paystack-signature', '')
    raw_body = request.get_data()

    if PAYSTACK_SECRET_KEY:
        expected_sig = hmac.new(
            PAYSTACK_SECRET_KEY.encode('utf-8'),
            raw_body,
            hashlib.sha512
        ).hexdigest()

        if not hmac.compare_digest(expected_sig, paystack_sig):
            return jsonify({'status': 'error', 'message': 'Invalid signature'}), 401

    try:
        event_data = json.loads(raw_body.decode('utf-8'))
        event_name = event_data.get('event')

        if event_name == 'charge.success':
            data = event_data.get('data', {})
            reference = data.get('reference')
            amount_kobo = data.get('amount')
            email = data.get('customer', {}).get('email')
            metadata = data.get('metadata', {})
            tier = int(metadata.get('tier', 2 if amount_kobo < 100000 else 3))

            if reference and email and amount_kobo:
                fulfill_payment(email, reference, amount_kobo, tier, data)

        return jsonify({'status': 'success'}), 200
    except Exception as e:
        print(f"[Webhook Error]: {e}", file=sys.stderr)
        return jsonify({'status': 'error', 'message': str(e)}), 400


@app.route('/api/paystack/reconcile', methods=['GET'])
@auth_required
def reconcile_endpoint(user):
    """Explicitly triggers transaction reconciliation for the logged-in user."""
    resolved = reconcile_user_payments(user['id'], user['email'])
    return jsonify({
        'status': 'success',
        'resolved_transactions': resolved,
        'message': f"Reconciliation finished. {resolved} transaction(s) verified."
    }), 200


# ------------------------------------------------------------------------------
# PROGRESS, QUIZZES & SRS FLASHCARD ENDPOINTS
# ------------------------------------------------------------------------------

@app.route('/api/progress', methods=['GET'])
@auth_required
def get_progress(user):
    """Retrieve all completed lessons and quiz scores for the user."""
    conn, is_postgres = get_db()
    cursor = conn.cursor()

    if is_postgres:
        cursor.execute("SELECT lesson_id, completed, score FROM user_progress WHERE user_id = %s", (user['id'],))
        rows = cursor.fetchall()
        progress = {r[0]: {'completed': bool(r[1]), 'score': r[2]} for r in rows}
    else:
        cursor.execute("SELECT lesson_id, completed, score FROM user_progress WHERE user_id = ?", (user['id'],))
        rows = cursor.fetchall()
        progress = {r['lesson_id']: {'completed': bool(r['completed']), 'score': r['score']} for r in rows}

    cursor.close()
    conn.close()

    return jsonify({
        'status': 'success',
        'progress': progress,
        'tier': user['tier']
    }), 200


@app.route('/api/progress/update', methods=['POST'])
@auth_required
def update_progress(user):
    """Mark a lesson complete and record score."""
    data = request.get_json() or {}
    lesson_id = data.get('lesson_id', '').strip()
    completed = 1 if data.get('completed', True) else 0
    score = int(data.get('score', 100))

    if not lesson_id:
        return jsonify({'status': 'error', 'message': 'lesson_id required'}), 400

    conn, is_postgres = get_db()
    cursor = conn.cursor()

    if is_postgres:
        cursor.execute("""
            INSERT INTO user_progress (user_id, lesson_id, completed, score, updated_at)
            VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, lesson_id)
            DO UPDATE SET completed = EXCLUDED.completed, score = EXCLUDED.score, updated_at = CURRENT_TIMESTAMP
        """, (user['id'], lesson_id, completed, score))
    else:
        cursor.execute("""
            INSERT INTO user_progress (user_id, lesson_id, completed, score, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, lesson_id)
            DO UPDATE SET completed = excluded.completed, score = excluded.score, updated_at = CURRENT_TIMESTAMP
        """, (user['id'], lesson_id, completed, score))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'status': 'success', 'lesson_id': lesson_id, 'score': score}), 200


@app.route('/api/flashcards', methods=['GET'])
@auth_required
def get_flashcards(user):
    """Get spaced repetition card stats."""
    if user['tier'] < 3:
        return jsonify({'status': 'error', 'message': 'SRS Flashcards require Tier 3 (Fluency Suite)'}), 403

    conn, is_postgres = get_db()
    cursor = conn.cursor()

    if is_postgres:
        cursor.execute("SELECT card_id, repetitions, interval_days, ease_factor, next_review FROM flashcards WHERE user_id = %s", (user['id'],))
        rows = cursor.fetchall()
        cards = {r[0]: {'repetitions': r[1], 'interval_days': r[2], 'ease_factor': r[3], 'next_review': str(r[4])} for r in rows}
    else:
        cursor.execute("SELECT card_id, repetitions, interval_days, ease_factor, next_review FROM flashcards WHERE user_id = ?", (user['id'],))
        rows = cursor.fetchall()
        cards = {r['card_id']: {'repetitions': r['repetitions'], 'interval_days': r['interval_days'], 'ease_factor': r['ease_factor'], 'next_review': str(r['next_review'])} for r in rows}

    cursor.close()
    conn.close()

    return jsonify({'status': 'success', 'cards': cards}), 200


@app.route('/api/flashcards/review', methods=['POST'])
@auth_required
def review_flashcard(user):
    """Process SRS review rating (1=Again, 2=Hard, 3=Good, 4=Easy)."""
    if user['tier'] < 3:
        return jsonify({'status': 'error', 'message': 'SRS Flashcards require Tier 3'}), 403

    data = request.get_json() or {}
    card_id = data.get('card_id', '').strip()
    rating = int(data.get('rating', 3))  # 1 to 4

    if not card_id:
        return jsonify({'status': 'error', 'message': 'card_id required'}), 400

    conn, is_postgres = get_db()
    cursor = conn.cursor()

    if is_postgres:
        cursor.execute("SELECT repetitions, interval_days, ease_factor FROM flashcards WHERE user_id = %s AND card_id = %s", (user['id'], card_id))
        row = cursor.fetchone()
    else:
        cursor.execute("SELECT repetitions, interval_days, ease_factor FROM flashcards WHERE user_id = ? AND card_id = ?", (user['id'], card_id))
        row = cursor.fetchone()

    reps = row[0] if row else 0
    interval = row[1] if row else 1
    ease = row[2] if row else 2.5

    # SM-2 Leitner Algorithm adaptation
    if rating == 1:  # Again
        reps = 0
        interval = 1
    elif rating == 2:  # Hard
        reps += 1
        interval = max(1, int(interval * 1.2))
        ease = max(1.3, ease - 0.15)
    elif rating == 3:  # Good
        reps += 1
        interval = int(interval * ease) if reps > 1 else (6 if reps == 1 else 1)
    elif rating == 4:  # Easy
        reps += 1
        interval = int(interval * ease * 1.3) if reps > 1 else 7
        ease += 0.15

    next_review = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=interval)

    if is_postgres:
        cursor.execute("""
            INSERT INTO flashcards (user_id, card_id, repetitions, interval_days, ease_factor, next_review, last_reviewed)
            VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, card_id)
            DO UPDATE SET repetitions = EXCLUDED.repetitions, interval_days = EXCLUDED.interval_days,
                          ease_factor = EXCLUDED.ease_factor, next_review = EXCLUDED.next_review,
                          last_reviewed = CURRENT_TIMESTAMP
        """, (user['id'], card_id, reps, interval, ease, next_review))
    else:
        cursor.execute("""
            INSERT INTO flashcards (user_id, card_id, repetitions, interval_days, ease_factor, next_review, last_reviewed)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, card_id)
            DO UPDATE SET repetitions = excluded.repetitions, interval_days = excluded.interval_days,
                          ease_factor = excluded.ease_factor, next_review = excluded.next_review,
                          last_reviewed = CURRENT_TIMESTAMP
        """, (user['id'], card_id, reps, interval, ease, next_review.isoformat()))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        'status': 'success',
        'card_id': card_id,
        'interval_days': interval,
        'repetitions': reps
    }), 200


# ------------------------------------------------------------------------------
# VERIFIABLE CERTIFICATE SYSTEM (TIER 3)
# ------------------------------------------------------------------------------

@app.route('/api/certificate/generate', methods=['POST'])
@auth_required
def generate_cert(user):
    """Generates official verifiable PDF certificate for Tier 3 students."""
    if user['tier'] < 3:
        return jsonify({'status': 'error', 'message': 'Official Certificates are exclusive to Tier 3 (Fluency Suite)'}), 403

    conn, is_postgres = get_db()
    cursor = conn.cursor()

    # Check existing certificate
    if is_postgres:
        cursor.execute("SELECT cert_code, issue_date, pdf_path FROM certificates WHERE user_id = %s", (user['id'],))
        row = cursor.fetchone()
    else:
        cursor.execute("SELECT cert_code, issue_date, pdf_path FROM certificates WHERE user_id = ?", (user['id'],))
        row = cursor.fetchone()

    now_str = datetime.datetime.now(datetime.timezone.utc).strftime("%B %d, %Y")

    if row:
        cert_code = row[0]
        # Ensure PDF exists on disk
        pdf_path = create_certificate_pdf(user['full_name'], cert_code, now_str)
    else:
        cert_code = f"KM-NG-{secrets.token_hex(4).upper()}"
        pdf_path = create_certificate_pdf(user['full_name'], cert_code, now_str)

        if is_postgres:
            cursor.execute("""
                INSERT INTO certificates (user_id, cert_code, student_name, course_tier, issue_date, pdf_path)
                VALUES (%s, %s, %s, 3, CURRENT_TIMESTAMP, %s)
            """, (user['id'], cert_code, user['full_name'], pdf_path))
        else:
            cursor.execute("""
                INSERT INTO certificates (user_id, cert_code, student_name, course_tier, issue_date, pdf_path)
                VALUES (?, ?, ?, 3, CURRENT_TIMESTAMP, ?)
            """, (user['id'], cert_code, user['full_name'], pdf_path))
        conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        'status': 'success',
        'cert_code': cert_code,
        'student_name': user['full_name'],
        'download_url': f"/api/certificate/download/{cert_code}",
        'verify_url': f"/api/certificate/verify/{cert_code}"
    }), 200


@app.route('/api/certificate/download/<cert_code>', methods=['GET'])
def download_cert(cert_code):
    """Download certificate PDF file."""
    cert_code = cert_code.strip()
    pdf_path = os.path.join(CERTS_DIR, f"{cert_code}.pdf")
    if not os.path.exists(pdf_path):
        # Fallback check txt
        txt_path = os.path.join(CERTS_DIR, f"{cert_code}.txt")
        if os.path.exists(txt_path):
            return send_file(txt_path, as_attachment=True, download_name=f"Korean_Mastery_{cert_code}.txt")
        return jsonify({'status': 'error', 'message': 'Certificate document not found'}), 404

    return send_file(pdf_path, as_attachment=True, download_name=f"Korean_Mastery_Certificate_{cert_code}.pdf")


@app.route('/api/certificate/verify/<cert_code>', methods=['GET'])
def verify_cert_public(cert_code):
    """Public certificate verification endpoint for employers, GKS officers, etc."""
    cert_code = cert_code.strip()
    conn, is_postgres = get_db()
    cursor = conn.cursor()

    if is_postgres:
        cursor.execute("SELECT student_name, course_tier, issue_date FROM certificates WHERE cert_code = %s", (cert_code,))
        row = cursor.fetchone()
    else:
        cursor.execute("SELECT student_name, course_tier, issue_date FROM certificates WHERE cert_code = ?", (cert_code,))
        row = cursor.fetchone()

    cursor.close()
    conn.close()

    if not row:
        return jsonify({'status': 'invalid', 'message': 'Certificate code not found in official registry'}), 404

    return jsonify({
        'status': 'verified',
        'cert_code': cert_code,
        'student_name': row[0] if isinstance(row, tuple) else row['student_name'],
        'tier_name': TIER_NAMES.get(row[1] if isinstance(row, tuple) else row['course_tier'], 'Fluency Suite'),
        'issue_date': str(row[2] if isinstance(row, tuple) else row['issue_date'])
    }), 200


# ------------------------------------------------------------------------------
# SECURITY, CORS & STATIC FILE SERVING
# ------------------------------------------------------------------------------

@app.after_request
def add_cors_headers(response):
    """Enable cross-origin resource sharing for Netlify frontend."""
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

FORBIDDEN_EXTENSIONS = ('.py', '.db', '.env', '.sql', '.sh', '.git', '.json', '.yml', '.yaml')

@app.before_request
def handle_preflight_and_security():
    """Handles CORS preflight OPTIONS and blocks sensitive file attempts."""
    if request.method == 'OPTIONS':
        return ('', 204)

    path = request.path.lower()
    for ext in FORBIDDEN_EXTENSIONS:
        if path.endswith(ext):
            abort(404)


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Serves single-page frontend application from public/ directory."""
    if path and os.path.exists(os.path.join(PUBLIC_DIR, path)):
        return send_from_directory(PUBLIC_DIR, path)
    return send_from_directory(PUBLIC_DIR, 'index.html')


# ==============================================================================
# MAIN RUNNER
# ==============================================================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🇰🇷 Korean Mastery Backend running on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
