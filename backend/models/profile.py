from models.database import db
from datetime import datetime

class Profile(db.Model):
    __tablename__ = 'profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    full_name = db.Column(db.String(120), default='')
    college = db.Column(db.String(200), default='')
    branch = db.Column(db.String(100), default='')
    year = db.Column(db.String(20), default='')
    skills = db.Column(db.Text, default='')  # JSON string
    preferred_language = db.Column(db.String(50), default='English')
    target_role = db.Column(db.String(100), default='')
    target_company = db.Column(db.String(100), default='')
    bio = db.Column(db.Text, default='')
    profile_picture = db.Column(db.Text, default='')  # Base64 or URL
    resume_filename = db.Column(db.String(200), default='')
    linkedin = db.Column(db.String(200), default='')
    github = db.Column(db.String(200), default='')
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        import json
        skills = []
        try:
            skills = json.loads(self.skills) if self.skills else []
        except Exception:
            skills = []
        return {
            'id': self.id,
            'user_id': self.user_id,
            'full_name': self.full_name,
            'college': self.college,
            'branch': self.branch,
            'year': self.year,
            'skills': skills,
            'preferred_language': self.preferred_language,
            'target_role': self.target_role,
            'target_company': self.target_company,
            'bio': self.bio,
            'profile_picture': self.profile_picture,
            'linkedin': self.linkedin,
            'github': self.github,
        }
