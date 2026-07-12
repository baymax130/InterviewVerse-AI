from models.database import db
from datetime import datetime

class Question(db.Model):
    __tablename__ = 'questions'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50), default='conceptual')  # conceptual, coding, behavioral, scenario, debugging, system_design
    difficulty_level = db.Column(db.String(20), default='medium')
    index_in_session = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    answer = db.relationship('Answer', backref='question', uselist=False, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'question_text': self.question_text,
            'question_type': self.question_type,
            'difficulty_level': self.difficulty_level,
            'index_in_session': self.index_in_session,
        }

class Answer(db.Model):
    __tablename__ = 'answers'

    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.id'), nullable=False)
    answer_text = db.Column(db.Text, nullable=False)
    score = db.Column(db.Float, default=0.0)
    technical_accuracy = db.Column(db.Float, default=0.0)
    communication_rating = db.Column(db.Float, default=0.0)
    confidence_level = db.Column(db.Float, default=0.0)
    strengths = db.Column(db.Text, default='')       # JSON array
    weaknesses = db.Column(db.Text, default='')      # JSON array
    better_answer = db.Column(db.Text, default='')
    improvement_tips = db.Column(db.Text, default='')  # JSON array
    feedback_summary = db.Column(db.Text, default='')
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        def safe_json(s):
            try:
                return json.loads(s) if s else []
            except Exception:
                return []
        return {
            'id': self.id,
            'question_id': self.question_id,
            'session_id': self.session_id,
            'answer_text': self.answer_text,
            'score': round(self.score, 2),
            'technical_accuracy': round(self.technical_accuracy, 2),
            'communication_rating': round(self.communication_rating, 2),
            'confidence_level': round(self.confidence_level, 2),
            'strengths': safe_json(self.strengths),
            'weaknesses': safe_json(self.weaknesses),
            'better_answer': self.better_answer,
            'improvement_tips': safe_json(self.improvement_tips),
            'feedback_summary': self.feedback_summary,
            'submitted_at': self.submitted_at.isoformat(),
        }
