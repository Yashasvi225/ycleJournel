import os
import csv
import io
import json
from datetime import datetime, timedelta, date
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required,
    get_jwt_identity, get_jwt
)
from werkzeug.security import generate_password_hash, check_password_hash
from estimator import estimate_next_period

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///cyclejournal.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-only-change-this-secret")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=8)

db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app, origins=["http://localhost:5173"], allow_headers=["Content-Type","Authorization"])

revoked_tokens = set()
ALLOWED_SYMPTOMS = {"Cramps","Headache","Bloating","Fatigue","Mood changes","Back pain","Acne","Other"}

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(160), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

class Cycle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class Symptom(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False)
    symptom_type = db.Column(db.String(40), nullable=False)
    severity = db.Column(db.Integer, nullable=False)
    optional_note = db.Column(db.String(500))

class JournalNote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False)
    note = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

class Settings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), unique=True, nullable=False)
    reminder_enabled = db.Column(db.Boolean, default=False, nullable=False)
    preferred_reminder_time = db.Column(db.String(5))
    theme = db.Column(db.String(30), default="system", nullable=False)

def parse_date(value):
    try: return date.fromisoformat(value)
    except (TypeError, ValueError): return None

def current_user_id():
    return int(get_jwt_identity())

def cycle_json(x):
    return {"id":x.id,"start_date":x.start_date.isoformat(),"end_date":x.end_date.isoformat() if x.end_date else None,
            "created_at":x.created_at.isoformat(),"updated_at":x.updated_at.isoformat()}

def symptom_json(x):
    return {"id":x.id,"date":x.date.isoformat(),"symptom_type":x.symptom_type,
            "severity":x.severity,"optional_note":x.optional_note}

def note_json(x):
    return {"id":x.id,"date":x.date.isoformat(),"note":x.note,"created_at":x.created_at.isoformat()}

@jwt.token_in_blocklist_loader
def is_revoked(jwt_header, jwt_payload):
    return jwt_payload["jti"] in revoked_tokens

@app.get("/")
def home():
    return jsonify(name="CycleJournal API", status="running", phase=2, backend="Python Flask")

@app.get("/api/health")
def health():
    return jsonify(status="ok", database="SQLite", authentication="JWT")

@app.post("/api/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name","")).strip()
    email = str(data.get("email","")).strip().lower()
    password = str(data.get("password",""))
    if len(name) < 2: return jsonify(error="Name must be at least 2 characters."), 400
    if "@" not in email: return jsonify(error="Enter a valid email address."), 400
    if len(password) < 8: return jsonify(error="Password must be at least 8 characters."), 400
    if User.query.filter_by(email=email).first(): return jsonify(error="An account with this email already exists."), 409
    user = User(name=name,email=email,password_hash=generate_password_hash(password))
    db.session.add(user); db.session.flush()
    db.session.add(Settings(user_id=user.id))
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return jsonify(message="Account created.", token=token, user={"id":user.id,"name":user.name,"email":user.email}), 201

@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email","")).strip().lower()
    password = str(data.get("password",""))
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash,password):
        return jsonify(error="Invalid email or password."), 401
    return jsonify(message="Login successful.", token=create_access_token(identity=str(user.id)),
                   user={"id":user.id,"name":user.name,"email":user.email})

@app.post("/api/auth/logout")
@jwt_required()
def logout():
    revoked_tokens.add(get_jwt()["jti"])
    return jsonify(message="Logged out.")

@app.get("/api/me")
@jwt_required()
def me():
    user = db.session.get(User,current_user_id())
    return jsonify(id=user.id,name=user.name,email=user.email,created_at=user.created_at.isoformat())

@app.route("/api/cycles", methods=["GET","POST"])
@jwt_required()
def cycles():
    uid=current_user_id()
    if request.method=="GET":
        rows=Cycle.query.filter_by(user_id=uid).order_by(Cycle.start_date.desc()).all()
        return jsonify([cycle_json(x) for x in rows])
    data=request.get_json(silent=True) or {}
    start,end=parse_date(data.get("start_date")),parse_date(data.get("end_date")) if data.get("end_date") else None
    if not start: return jsonify(error="A valid start date is required."),400
    if end and end < start: return jsonify(error="End date cannot be before start date."),400
    row=Cycle(user_id=uid,start_date=start,end_date=end)
    db.session.add(row); db.session.commit()
    return jsonify(message="Period entry saved.",cycle=cycle_json(row)),201

@app.route("/api/cycles/<int:item_id>", methods=["GET","PUT","DELETE"])
@jwt_required()
def cycle_item(item_id):
    row=Cycle.query.filter_by(id=item_id,user_id=current_user_id()).first_or_404()
    if request.method=="GET": return jsonify(cycle_json(row))
    if request.method=="DELETE":
        db.session.delete(row); db.session.commit(); return jsonify(message="Cycle deleted.")
    data=request.get_json(silent=True) or {}
    start=parse_date(data.get("start_date")) if "start_date" in data else row.start_date
    end=parse_date(data.get("end_date")) if data.get("end_date") else (None if "end_date" in data else row.end_date)
    if not start: return jsonify(error="Valid start date required."),400
    if end and end < start: return jsonify(error="End date cannot be before start date."),400
    row.start_date,row.end_date=start,end; db.session.commit()
    return jsonify(message="Cycle updated.",cycle=cycle_json(row))

@app.route("/api/symptoms", methods=["GET","POST"])
@jwt_required()
def symptoms():
    uid=current_user_id()
    if request.method=="GET":
        return jsonify([symptom_json(x) for x in Symptom.query.filter_by(user_id=uid).order_by(Symptom.date.desc()).all()])
    data=request.get_json(silent=True) or {}
    d=parse_date(data.get("date")); typ=data.get("symptom_type"); sev=data.get("severity")
    try: sev=int(sev)
    except (TypeError,ValueError): sev=0
    if not d: return jsonify(error="Valid date required."),400
    if typ not in ALLOWED_SYMPTOMS: return jsonify(error="Invalid symptom type."),400
    if sev not in range(1,6): return jsonify(error="Severity must be 1-5."),400
    row=Symptom(user_id=uid,date=d,symptom_type=typ,severity=sev,optional_note=str(data.get("optional_note","")).strip()[:500] or None)
    db.session.add(row); db.session.commit()
    return jsonify(message="Symptom saved.",symptom=symptom_json(row)),201

@app.route("/api/symptoms/<int:item_id>", methods=["GET","PUT","DELETE"])
@jwt_required()
def symptom_item(item_id):
    row=Symptom.query.filter_by(id=item_id,user_id=current_user_id()).first_or_404()
    if request.method=="GET": return jsonify(symptom_json(row))
    if request.method=="DELETE":
        db.session.delete(row); db.session.commit(); return jsonify(message="Symptom deleted.")
    data=request.get_json(silent=True) or {}
    d=parse_date(data.get("date")) if "date" in data else row.date
    typ=data.get("symptom_type",row.symptom_type)
    try: sev=int(data.get("severity",row.severity))
    except (TypeError,ValueError): sev=0
    if not d or typ not in ALLOWED_SYMPTOMS or sev not in range(1,6): return jsonify(error="Invalid symptom data."),400
    row.date,row.symptom_type,row.severity=d,typ,sev
    if "optional_note" in data: row.optional_note=str(data["optional_note"]).strip()[:500] or None
    db.session.commit(); return jsonify(message="Symptom updated.",symptom=symptom_json(row))

@app.route("/api/notes", methods=["GET","POST"])
@jwt_required()
def notes():
    uid=current_user_id()
    if request.method=="GET":
        return jsonify([note_json(x) for x in JournalNote.query.filter_by(user_id=uid).order_by(JournalNote.date.desc()).all()])
    data=request.get_json(silent=True) or {}; d=parse_date(data.get("date")); note=str(data.get("note","")).strip()
    if not d: return jsonify(error="Valid date required."),400
    if not note: return jsonify(error="Note cannot be empty."),400
    if len(note)>5000: return jsonify(error="Note is too long."),400
    row=JournalNote(user_id=uid,date=d,note=note); db.session.add(row); db.session.commit()
    return jsonify(message="Private note saved.",note=note_json(row)),201

@app.route("/api/notes/<int:item_id>", methods=["GET","PUT","DELETE"])
@jwt_required()
def note_item(item_id):
    row=JournalNote.query.filter_by(id=item_id,user_id=current_user_id()).first_or_404()
    if request.method=="GET": return jsonify(note_json(row))
    if request.method=="DELETE":
        db.session.delete(row); db.session.commit(); return jsonify(message="Note deleted.")
    data=request.get_json(silent=True) or {}
    d=parse_date(data.get("date")) if "date" in data else row.date
    note=str(data.get("note",row.note)).strip()
    if not d or not note or len(note)>5000: return jsonify(error="Invalid note data."),400
    row.date,row.note=d,note; db.session.commit()
    return jsonify(message="Note updated.",note=note_json(row))


@app.get("/api/estimate")
@jwt_required()
def estimate():
    """Build the estimate only from the authenticated user's cycle starts."""
    rows = Cycle.query.filter_by(user_id=current_user_id()).order_by(Cycle.start_date.asc()).all()
    return jsonify(estimate_next_period([row.start_date for row in rows]))

@app.route("/api/settings", methods=["GET","PUT"])
@jwt_required()
def settings():
    row=Settings.query.filter_by(user_id=current_user_id()).first()
    if request.method=="GET":
        return jsonify(reminder_enabled=row.reminder_enabled,preferred_reminder_time=row.preferred_reminder_time,theme=row.theme)
    data=request.get_json(silent=True) or {}
    if "reminder_enabled" in data: row.reminder_enabled=bool(data["reminder_enabled"])
    if "preferred_reminder_time" in data: row.preferred_reminder_time=data["preferred_reminder_time"]
    if "theme" in data: row.theme=str(data["theme"])[:30]
    db.session.commit(); return jsonify(message="Settings updated.")

def seed_demo():
    if os.getenv("CYCLEJOURNAL_DEMO") != "1" or User.query.filter_by(email="demo@cyclejournal.local").first():
        return
    user=User(name="Demo User",email="demo@cyclejournal.local",password_hash=generate_password_hash("DemoPass123"))
    db.session.add(user); db.session.flush(); db.session.add(Settings(user_id=user.id))
    db.session.add(Cycle(user_id=user.id,start_date=date(2026,9,5),end_date=date(2026,9,9)))
    db.session.add(Symptom(user_id=user.id,date=date(2026,9,6),symptom_type="Cramps",severity=2))
    db.session.add(JournalNote(user_id=user.id,date=date(2026,9,6),note="Demo-only journal entry."))
    db.session.commit()

with app.app_context():
    db.create_all()
    seed_demo()

@app.get("/api/privacy/summary")
@jwt_required()
def privacy_summary():
    try:
        user_id = int(get_jwt_identity())

        user = db.session.get(User, user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "cycle_records": Cycle.query.filter_by(
                user_id=user_id
            ).count(),

            "symptoms": Symptom.query.filter_by(
                user_id=user_id
            ).count(),

            "journal_notes": JournalNote.query.filter_by(
                user_id=user_id
            ).count(),

            "account_information": {
                "name": user.name,
                "email": user.email,
                "created_at": (
                    user.created_at.isoformat()
                    if user.created_at else None
                )
            }
        }), 200

    except Exception:
        return jsonify({
            "error": "Unable to load privacy information."
        }), 500

@app.get("/api/privacy/export/json")
@jwt_required()
def export_json():
    try:
        user_id = int(get_jwt_identity())

        cycles = Cycle.query.filter_by(user_id=user_id).all()
        symptoms = Symptom.query.filter_by(user_id=user_id).all()
        notes = JournalNote.query.filter_by(user_id=user_id).all()
        settings = Settings.query.filter_by(user_id=user_id).first()

        data = {
            "cycles": [
                {
                    "id": c.id,
                    "start_date": str(c.start_date),
                    "end_date": str(c.end_date) if c.end_date else None
                }
                for c in cycles
            ],

            "symptoms": [
                {
                    "id": s.id,
                    "date": str(s.date),
                    "symptom_type": s.symptom_type,
                    "severity": s.severity,
                    "optional_note": s.optional_note
                }
                for s in symptoms
            ],

            "journal_notes": [
                {
                    "id": n.id,
                    "date": str(n.date),
                    "note": n.note
                }
                for n in notes
            ],

            "settings": {
                "reminder_enabled": settings.reminder_enabled,
                "preferred_reminder_time":
                    settings.preferred_reminder_time,
                "theme": settings.theme
            } if settings else None
        }

        return Response(
            json.dumps(data, indent=2),
            mimetype="application/json",
            headers={
                "Content-Disposition":
                "attachment; filename=cyclejournal-data.json"
            }
        )

    except Exception:
        return jsonify({
            "error": "Unable to export data."
        }), 500
    
@app.get("/api/privacy/export/cycles.csv")
@jwt_required()
def export_cycles_csv():
    try:
        user_id = int(get_jwt_identity())

        cycles = (
            Cycle.query
            .filter_by(user_id=user_id)
            .order_by(Cycle.start_date.asc())
            .all()
        )

        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([
            "Start Date",
            "End Date"
        ])

        for cycle in cycles:
            writer.writerow([
                cycle.start_date,
                cycle.end_date or ""
            ])

        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={
                "Content-Disposition":
                "attachment; filename=cycle-history.csv"
            }
        )

    except Exception:
        return jsonify({
            "error": "Unable to export cycle history."
        }), 500

@app.delete("/api/privacy/cycles")
@jwt_required()
def delete_cycle_history():
    try:
        user_id = int(get_jwt_identity())

        Cycle.query.filter_by(
            user_id=user_id
        ).delete(synchronize_session=False)

        db.session.commit()

        return jsonify({
            "message": "Cycle history deleted."
        }), 200

    except Exception:
        db.session.rollback()

        return jsonify({
            "error": "Unable to delete cycle history."
        }), 500
@app.delete("/api/privacy/symptoms")
@jwt_required()
def delete_symptom_history():
    try:
        user_id = int(get_jwt_identity())

        Symptom.query.filter_by(
            user_id=user_id
        ).delete(synchronize_session=False)

        db.session.commit()

        return jsonify({
            "message": "Symptom history deleted."
        }), 200

    except Exception:
        db.session.rollback()

        return jsonify({
            "error": "Unable to delete symptom history."
        }), 500

@app.delete("/api/privacy/notes")
@jwt_required()
def delete_notes():
    try:
        user_id = int(get_jwt_identity())

        JournalNote.query.filter_by(
            user_id=user_id
        ).delete(synchronize_session=False)

        db.session.commit()

        return jsonify({
            "message": "Journal notes deleted."
        }), 200

    except Exception:
        db.session.rollback()

        return jsonify({
            "error": "Unable to delete journal notes."
        }), 500
@app.delete("/api/privacy/all-data")
@jwt_required()
def delete_all_personal_data():
    try:
        user_id = int(get_jwt_identity())

        Cycle.query.filter_by(
            user_id=user_id
        ).delete(synchronize_session=False)

        Symptom.query.filter_by(
            user_id=user_id
        ).delete(synchronize_session=False)

        JournalNote.query.filter_by(
            user_id=user_id
        ).delete(synchronize_session=False)

        Settings.query.filter_by(
            user_id=user_id
        ).delete(synchronize_session=False)

        db.session.commit()

        return jsonify({
            "message": "All personal journal data deleted."
        }), 200

    except Exception:
        db.session.rollback()

        return jsonify({
            "error": "Unable to delete personal data."
        }), 500
@app.delete("/api/privacy/account")
@jwt_required()
def delete_account():
    try:
        user_id = int(get_jwt_identity())

        user = db.session.get(User, user_id)

        if not user:
            return jsonify({
                "error": "Account not found."
            }), 404

        Cycle.query.filter_by(
            user_id=user_id
        ).delete(synchronize_session=False)

        Symptom.query.filter_by(
            user_id=user_id
        ).delete(synchronize_session=False)

        JournalNote.query.filter_by(
            user_id=user_id
        ).delete(synchronize_session=False)

        Settings.query.filter_by(
            user_id=user_id
        ).delete(synchronize_session=False)

        db.session.delete(user)

        db.session.commit()

        return jsonify({
            "message": "Account permanently deleted."
        }), 200

    except Exception:
        db.session.rollback()

        return jsonify({
            "error": "Unable to delete account."
        }), 500
    


if __name__=="__main__":
    app.run(debug=True,port=5000)
