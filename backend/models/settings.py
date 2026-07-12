from models.database import db
from datetime import datetime

class UserSettings(db.Model):
    __tablename__ = 'user_settings'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    theme = db.Column(db.String(20), default='dark')
    notifications_enabled = db.Column(db.Boolean, default=True)
    sound_enabled = db.Column(db.Boolean, default=True)
    default_difficulty = db.Column(db.String(20), default='medium')
    default_mode = db.Column(db.String(50), default='practice')
    default_role = db.Column(db.String(100), default='')
    questions_per_session = db.Column(db.Integer, default=10)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'theme': self.theme,
            'notifications_enabled': self.notifications_enabled,
            'sound_enabled': self.sound_enabled,
            'default_difficulty': self.default_difficulty,
            'default_mode': self.default_mode,
            'default_role': self.default_role,
            'questions_per_session': self.questions_per_session,
        }
