from models.database import db
from datetime import datetime

class InterviewSession(db.Model):
    __tablename__ = 'interview_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    mode = db.Column(db.String(50), nullable=False)           # practice, mock, hr, technical, rapid_fire, dream_company
    role = db.Column(db.String(100), nullable=False)
    difficulty = db.Column(db.String(20), default='medium')   # easy, medium, hard, adaptive
    language = db.Column(db.String(50), default='English')
    technology = db.Column(db.String(100), default='')        # selected technology/topic
    company = db.Column(db.String(100), default='')           # for dream_company mode
    status = db.Column(db.String(20), default='in_progress')  # in_progress, completed, abandoned
    current_question_index = db.Column(db.Integer, default=0)
    total_questions = db.Column(db.Integer, default=10)
    overall_score = db.Column(db.Float, default=0.0)
    technical_score = db.Column(db.Float, default=0.0)
    communication_score = db.Column(db.Float, default=0.0)
    confidence_score = db.Column(db.Float, default=0.0)
    problem_solving_score = db.Column(db.Float, default=0.0)
    xp_earned = db.Column(db.Integer, default=0)
    duration_seconds = db.Column(db.Integer, default=0)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    report_data = db.Column(db.Text, default='')  # JSON string of final report

    # Relationships
    questions = db.relationship('Question', backref='session', lazy=True, cascade='all, delete-orphan')
    scores = db.relationship('Score', backref='session', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'mode': self.mode,
            'role': self.role,
            'difficulty': self.difficulty,
            'language': self.language,
            'technology': self.technology,
            'company': self.company,
            'status': self.status,
            'current_question_index': self.current_question_index,
            'total_questions': self.total_questions,
            'overall_score': round(self.overall_score, 2),
            'technical_score': round(self.technical_score, 2),
            'communication_score': round(self.communication_score, 2),
            'confidence_score': round(self.confidence_score, 2),
            'problem_solving_score': round(self.problem_solving_score, 2),
            'xp_earned': self.xp_earned,
            'duration_seconds': self.duration_seconds,
            'started_at': self.started_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }
