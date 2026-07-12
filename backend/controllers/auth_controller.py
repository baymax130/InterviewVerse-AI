"""
Authentication controller – register, login, logout, refresh.
"""
from flask import request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from models.database import db
from models.user import User
from models.profile import Profile
from models.streak import Streak
from models.settings import UserSettings
from datetime import datetime, timedelta


def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({'error': 'Username, email and password are required.'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters.'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered.'}), 409

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken.'}), 409

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()  # get user.id

    # Create default profile, streak, settings
    profile = Profile(user_id=user.id, full_name=username)
    streak = Streak(user_id=user.id)
    settings = UserSettings(user_id=user.id)
    db.session.add_all([profile, streak, settings])
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        'message': 'Account created successfully!',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict(),
    }), 201


def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password.'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is deactivated.'}), 403

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        'message': 'Login successful!',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict(),
    }), 200


@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify({'access_token': access_token}), 200


@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404
    return jsonify({'user': user.to_dict()}), 200


def forgot_password():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    user = User.query.filter_by(email=email).first()
    # Mock implementation – in production send real email
    if user:
        return jsonify({'message': 'Password reset link sent to your email (mock).'}), 200
    return jsonify({'message': 'If that email exists, a reset link has been sent.'}), 200
