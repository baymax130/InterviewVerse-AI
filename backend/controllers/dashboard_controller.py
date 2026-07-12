"""
Dashboard and analytics controller.
"""
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.database import db
from models.user import User
from models.interview import InterviewSession
from models.score import Score
from models.streak import Streak
from models.achievement import Achievement
from sqlalchemy import func
from datetime import datetime, timedelta, date
import json


@jwt_required()
def get_dashboard():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    streak = Streak.query.filter_by(user_id=user_id).first()
    achievements = Achievement.query.filter_by(user_id=user_id).order_by(Achievement.earned_at.desc()).limit(5).all()

    # Recent interviews
    recent = InterviewSession.query.filter_by(
        user_id=user_id, status='completed'
    ).order_by(InterviewSession.completed_at.desc()).limit(5).all()

    # Score trends (last 10 sessions)
    score_records = Score.query.filter_by(user_id=user_id).order_by(Score.created_at.asc()).limit(10).all()
    score_trend = [{'date': s.created_at.strftime('%m/%d'), 'score': round(s.overall, 1)} for s in score_records]

    # Role-wise performance
    role_perf = db.session.query(
        InterviewSession.role,
        func.avg(InterviewSession.overall_score).label('avg_score'),
        func.count(InterviewSession.id).label('count')
    ).filter(
        InterviewSession.user_id == user_id,
        InterviewSession.status == 'completed'
    ).group_by(InterviewSession.role).all()
    role_data = [{'role': r.role, 'avg_score': round(r.avg_score, 1), 'count': r.count} for r in role_perf]

    # Identify weak/strong skills from recent answers
    from models.question import Answer
    all_weaknesses = []
    all_strengths = []
    for sess in recent[:3]:
        for ans in Answer.query.filter_by(session_id=sess.id).all():
            try:
                all_weaknesses.extend(json.loads(ans.weaknesses or '[]'))
                all_strengths.extend(json.loads(ans.strengths or '[]'))
            except Exception:
                pass

    # Deduplicate
    weak_skills = list(dict.fromkeys(all_weaknesses))[:5]
    strong_skills = list(dict.fromkeys(all_strengths))[:5]

    # Mode distribution
    mode_counts = db.session.query(
        InterviewSession.mode,
        func.count(InterviewSession.id).label('count')
    ).filter(
        InterviewSession.user_id == user_id,
        InterviewSession.status == 'completed'
    ).group_by(InterviewSession.mode).all()
    mode_data = [{'mode': m.mode, 'count': m.count} for m in mode_counts]

    return jsonify({
        'user': user.to_dict(),
        'profile': user.profile.to_dict() if user.profile else {},
        'streak': streak.to_dict() if streak else {},
        'achievements': [a.to_dict() for a in achievements],
        'recent_interviews': [s.to_dict() for s in recent],
        'score_trend': score_trend,
        'role_performance': role_data,
        'mode_distribution': mode_data,
        'weak_skills': weak_skills,
        'strong_skills': strong_skills,
        'stats': {
            'total_interviews': user.total_interviews,
            'average_score': round(user.average_score, 2),
            'xp': user.xp,
            'level': user.level,
            'current_streak': streak.current_streak if streak else 0,
        },
    }), 200


@jwt_required()
def get_analytics():
    user_id = int(get_jwt_identity())
    period = request.args.get('period', 'weekly')  # daily, weekly, monthly

    now = datetime.utcnow()
    if period == 'daily':
        start = now - timedelta(days=7)
        fmt = '%m/%d'
    elif period == 'monthly':
        start = now - timedelta(days=365)
        fmt = '%Y/%m'
    else:
        start = now - timedelta(weeks=12)
        fmt = '%m/%d'

    sessions = InterviewSession.query.filter(
        InterviewSession.user_id == user_id,
        InterviewSession.status == 'completed',
        InterviewSession.completed_at >= start,
    ).order_by(InterviewSession.completed_at.asc()).all()

    # Group by date
    daily_map = {}
    for s in sessions:
        key = s.completed_at.strftime(fmt)
        if key not in daily_map:
            daily_map[key] = {'count': 0, 'total_score': 0}
        daily_map[key]['count'] += 1
        daily_map[key]['total_score'] += s.overall_score

    activity_data = [
        {'date': k, 'count': v['count'], 'avg_score': round(v['total_score'] / v['count'], 1) if v['count'] else 0}
        for k, v in sorted(daily_map.items())
    ]

    # Difficulty breakdown
    diff_data = db.session.query(
        InterviewSession.difficulty,
        func.count(InterviewSession.id).label('count'),
        func.avg(InterviewSession.overall_score).label('avg_score'),
    ).filter(
        InterviewSession.user_id == user_id,
        InterviewSession.status == 'completed'
    ).group_by(InterviewSession.difficulty).all()

    return jsonify({
        'activity': activity_data,
        'difficulty_breakdown': [
            {'difficulty': d.difficulty, 'count': d.count, 'avg_score': round(d.avg_score, 1)}
            for d in diff_data
        ],
        'total_sessions': len(sessions),
        'avg_score_period': round(sum(s.overall_score for s in sessions) / len(sessions), 2) if sessions else 0,
    }), 200
