"""
Flask application entry point for InterviewVerse AI backend.
"""
import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()


def create_app():
    app = Flask(__name__)

    # Configuration
    app.config['SECRET_KEY'] = os.getenv('JWT_SECRET', 'dev-secret-change-in-production')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET', 'dev-secret-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///interviewverse.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB

    # Initialize extensions
    CORS(app, origins=['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
         supports_credentials=True)
    JWTManager(app)

    # Initialize database
    from models.database import init_db
    init_db(app)

    # Register blueprints
    from routes.routes import auth_bp, interview_bp, dashboard_bp, profile_bp, settings_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(interview_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(settings_bp)

    # Health check
    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({'status': 'healthy', 'app': 'InterviewVerse AI', 'version': '1.0.0'}), 200

    # Global error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found.'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error.'}), 500

    @app.errorhandler(413)
    def too_large(e):
        return jsonify({'error': 'File too large.'}), 413

    return app


if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 5000))
    app.run(debug=os.getenv('FLASK_DEBUG', '1') == '1', host='0.0.0.0', port=port)
