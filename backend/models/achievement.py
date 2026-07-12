from models.database import db
from datetime import datetime

class Achievement(db.Model):
    __tablename__ = 'achievements'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    badge_id = db.Column(db.String(50), nullable=False)
    badge_name = db.Column(db.String(100), nullable=False)
    badge_description = db.Column(db.Text, default='')
    badge_icon = db.Column(db.String(50), default='trophy')
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'badge_id': self.badge_id,
            'badge_name': self.badge_name,
            'badge_description': self.badge_description,
            'badge_icon': self.badge_icon,
            'earned_at': self.earned_at.isoformat(),
        }
