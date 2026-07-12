from models.database import db
from datetime import datetime

class Streak(db.Model):
    __tablename__ = 'streaks'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    current_streak = db.Column(db.Integer, default=0)
    longest_streak = db.Column(db.Integer, default=0)
    last_active_date = db.Column(db.Date, nullable=True)
    total_practice_days = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'current_streak': self.current_streak,
            'longest_streak': self.longest_streak,
            'last_active_date': self.last_active_date.isoformat() if self.last_active_date else None,
            'total_practice_days': self.total_practice_days,
        }
