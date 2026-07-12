"""
User profile controller.
"""
import json
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.database import db
from models.user import User
from models.profile import Profile
from models.achievement import Achievement
from models.streak import Streak


@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    streak = Streak.query.filter_by(user_id=user_id).first()
    achievements = Achievement.query.filter_by(user_id=user_id).order_by(Achievement.earned_at.desc()).all()

    return jsonify({
        'user': user.to_dict(),
        'profile': user.profile.to_dict() if user.profile else {},
        'streak': streak.to_dict() if streak else {},
        'achievements': [a.to_dict() for a in achievements],
    }), 200


@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    data = request.get_json()
    profile = user.profile or Profile(user_id=user_id)

    # Update profile fields
    fields = ['full_name', 'college', 'branch', 'year', 'preferred_language',
              'target_role', 'target_company', 'bio', 'linkedin', 'github', 'profile_picture']
    for field in fields:
        if field in data:
            setattr(profile, field, data[field])

    if 'skills' in data:
        profile.skills = json.dumps(data['skills']) if isinstance(data['skills'], list) else data['skills']

    # Update username if provided
    if 'username' in data and data['username']:
        existing = User.query.filter_by(username=data['username']).first()
        if existing and existing.id != user_id:
            return jsonify({'error': 'Username already taken.'}), 409
        user.username = data['username']

    if not user.profile:
        db.session.add(profile)
        user.profile = profile

    db.session.commit()

    return jsonify({
        'message': 'Profile updated successfully!',
        'profile': user.profile.to_dict(),
        'user': user.to_dict(),
    }), 200


@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    data = request.get_json()

    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')

    if not user.check_password(current_password):
        return jsonify({'error': 'Current password is incorrect.'}), 401

    if len(new_password) < 6:
        return jsonify({'error': 'New password must be at least 6 characters.'}), 400

    user.set_password(new_password)
    db.session.commit()

    return jsonify({'message': 'Password changed successfully!'}), 200


@jwt_required()
def get_leaderboard():
    """Local leaderboard of top users by XP."""
    users = User.query.order_by(User.xp.desc()).limit(20).all()
    return jsonify({
        'leaderboard': [
            {
                'rank': i + 1,
                'username': u.username,
                'xp': u.xp,
                'level': u.level,
                'total_interviews': u.total_interviews,
                'average_score': round(u.average_score, 2),
            }
            for i, u in enumerate(users)
        ]
    }), 200
