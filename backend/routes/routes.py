"""
Route definitions for all API endpoints.
"""
from flask import Blueprint
from controllers.auth_controller import register, login, refresh, get_me, forgot_password
from controllers.interview_controller import (
    start_interview, submit_answer, get_session, get_report, get_history
)
from controllers.dashboard_controller import get_dashboard, get_analytics
from controllers.profile_controller import get_profile, update_profile, change_password, get_leaderboard
from flask_jwt_extended import jwt_required, get_jwt_identity

# Auth routes
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
auth_bp.route('/register', methods=['POST'])(register)
auth_bp.route('/login', methods=['POST'])(login)
auth_bp.route('/refresh', methods=['POST'])(refresh)
auth_bp.route('/me', methods=['GET'])(get_me)
auth_bp.route('/forgot-password', methods=['POST'])(forgot_password)

# Interview routes
interview_bp = Blueprint('interview', __name__, url_prefix='/api/interview')
interview_bp.route('/start', methods=['POST'])(start_interview)
interview_bp.route('/<int:session_id>/submit', methods=['POST'])(submit_answer)
interview_bp.route('/<int:session_id>', methods=['GET'])(get_session)
interview_bp.route('/<int:session_id>/report', methods=['GET'])(get_report)
interview_bp.route('/history', methods=['GET'])(get_history)

# Report PDF download
from flask import send_file, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

@interview_bp.route('/<int:session_id>/report/pdf', methods=['GET'])
@jwt_required()
def download_report_pdf(session_id):
    from models.interview import InterviewSession
    from models.score import Score
    from models.question import Answer
    from models.user import User
    from services.report_service import generate_pdf_report
    import json

    user_id = int(get_jwt_identity())
    session = InterviewSession.query.filter_by(id=session_id, user_id=user_id).first()
    if not session or session.status != 'completed':
        return jsonify({'error': 'Report not available.'}), 404

    score = Score.query.filter_by(session_id=session_id).first()
    answers = Answer.query.filter_by(session_id=session_id).all()
    user = User.query.get(user_id)
    ai_report = json.loads(session.report_data) if session.report_data else {}

    pdf_buffer = generate_pdf_report(
        session_data=session.to_dict(),
        score_data=score.to_dict() if score else None,
        answers_data=[a.to_dict() for a in answers],
        ai_report=ai_report,
        user_data=user.to_dict() if user else {},
    )

    if pdf_buffer is None:
        return jsonify({'error': 'PDF generation failed.'}), 500

    return send_file(
        pdf_buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'interview_report_{session_id}.pdf',
    )

# Dashboard & Analytics routes
dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')
dashboard_bp.route('/', methods=['GET'])(get_dashboard)
dashboard_bp.route('/analytics', methods=['GET'])(get_analytics)

# Profile routes
profile_bp = Blueprint('profile', __name__, url_prefix='/api/profile')
profile_bp.route('/', methods=['GET'])(get_profile)
profile_bp.route('/', methods=['PUT'])(update_profile)
profile_bp.route('/change-password', methods=['POST'])(change_password)
profile_bp.route('/leaderboard', methods=['GET'])(get_leaderboard)

# Settings route
from flask import request as flask_request
from flask_jwt_extended import jwt_required as jwt_req

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

@settings_bp.route('/', methods=['GET'])
@jwt_required()
def get_settings():
    user_id = int(get_jwt_identity())
    from models.settings import UserSettings
    settings = UserSettings.query.filter_by(user_id=user_id).first()
    if not settings:
        return jsonify({'settings': {}})
    return jsonify({'settings': settings.to_dict()})

@settings_bp.route('/', methods=['PUT'])
@jwt_required()
def update_settings():
    user_id = int(get_jwt_identity())
    from models.settings import UserSettings
    from models.database import db
    data = flask_request.get_json()
    settings = UserSettings.query.filter_by(user_id=user_id).first()
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.session.add(settings)
    fields = ['theme', 'notifications_enabled', 'sound_enabled', 'default_difficulty',
              'default_mode', 'default_role', 'questions_per_session']
    for f in fields:
        if f in data:
            setattr(settings, f, data[f])
    db.session.commit()
    return jsonify({'settings': settings.to_dict()})
