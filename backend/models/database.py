from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

def init_db(app):
    db.init_app(app)
    with app.app_context():
        from models.user import User
        from models.profile import Profile
        from models.interview import InterviewSession
        from models.question import Question, Answer
        from models.score import Score
        from models.achievement import Achievement
        from models.streak import Streak
        from models.settings import UserSettings
        db.create_all()
