from models.database import db
from datetime import datetime
import bcrypt

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    xp = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    total_interviews = db.Column(db.Integer, default=0)
    average_score = db.Column(db.Float, default=0.0)

    # Relationships
    profile = db.relationship('Profile', backref='user', uselist=False, cascade='all, delete-orphan')
    interviews = db.relationship('InterviewSession', backref='user', lazy=True, cascade='all, delete-orphan')
    achievements = db.relationship('Achievement', backref='user', lazy=True, cascade='all, delete-orphan')
    streak = db.relationship('Streak', backref='user', uselist=False, cascade='all, delete-orphan')
    settings = db.relationship('UserSettings', backref='user', uselist=False, cascade='all, delete-orphan')

    def set_password(self, password):
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def add_xp(self, amount):
        self.xp += amount
        # Level up every 500 XP
        self.level = (self.xp // 500) + 1

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'xp': self.xp,
            'level': self.level,
            'total_interviews': self.total_interviews,
            'average_score': round(self.average_score, 2),
            'created_at': self.created_at.isoformat(),
        }
