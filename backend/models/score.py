from models.database import db
from datetime import datetime

class Score(db.Model):
    __tablename__ = 'scores'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    overall = db.Column(db.Float, default=0.0)
    technical = db.Column(db.Float, default=0.0)
    communication = db.Column(db.Float, default=0.0)
    confidence = db.Column(db.Float, default=0.0)
    problem_solving = db.Column(db.Float, default=0.0)
    knowledge = db.Column(db.Float, default=0.0)
    consistency = db.Column(db.Float, default=0.0)
    readiness_percent = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'overall': round(self.overall, 2),
            'technical': round(self.technical, 2),
            'communication': round(self.communication, 2),
            'confidence': round(self.confidence, 2),
            'problem_solving': round(self.problem_solving, 2),
            'knowledge': round(self.knowledge, 2),
            'consistency': round(self.consistency, 2),
            'readiness_percent': round(self.readiness_percent, 2),
            'created_at': self.created_at.isoformat(),
        }
