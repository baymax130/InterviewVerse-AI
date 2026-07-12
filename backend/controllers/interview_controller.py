"""
Interview session controller – start, submit answer, end, history.
"""
import json
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.database import db
from models.user import User
from models.interview import InterviewSession
from models.question import Question, Answer
from models.score import Score
from models.streak import Streak
from models.achievement import Achievement
from services.watsonx_service import generate_question, evaluate_answer, generate_final_report
from datetime import datetime, date

QUESTION_TYPES_BY_MODE = {
    'practice': ['conceptual', 'behavioral', 'coding', 'scenario'],
    'mock': ['conceptual', 'coding', 'system_design', 'scenario', 'debugging'],
    'hr': ['behavioral', 'scenario', 'communication'],
    'technical': ['conceptual', 'coding', 'system_design', 'debugging', 'scenario'],
    'rapid_fire': ['conceptual', 'behavioral'],
    'dream_company': ['conceptual', 'coding', 'system_design', 'scenario', 'behavioral'],
}

TOTAL_QUESTIONS_BY_MODE = {
    'practice': 10,
    'mock': 10,
    'hr': 8,
    'technical': 10,
    'rapid_fire': 15,
    'dream_company': 12,
}

XP_PER_SCORE_POINT = 10  # XP per score point


def _get_question_type(mode, index):
    types = QUESTION_TYPES_BY_MODE.get(mode, ['conceptual'])
    return types[index % len(types)]


def _adapt_difficulty(current_difficulty, recent_scores):
    """Adaptive difficulty based on last 3 scores."""
    if not recent_scores:
        return current_difficulty
    avg = sum(recent_scores[-3:]) / len(recent_scores[-3:])
    if avg >= 8 and current_difficulty == 'easy':
        return 'medium'
    if avg >= 8 and current_difficulty == 'medium':
        return 'hard'
    if avg <= 4 and current_difficulty == 'hard':
        return 'medium'
    if avg <= 4 and current_difficulty == 'medium':
        return 'easy'
    return current_difficulty


@jwt_required()
def start_interview():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    mode = data.get('mode', 'practice')
    role = data.get('role', 'Software Engineer')
    difficulty = data.get('difficulty', 'medium')
    language = data.get('language', 'English')
    technology = data.get('technology', '')
    company = data.get('company', '')

    total_questions = TOTAL_QUESTIONS_BY_MODE.get(mode, 10)

    session = InterviewSession(
        user_id=user_id,
        mode=mode,
        role=role,
        difficulty=difficulty,
        language=language,
        technology=technology,
        company=company,
        total_questions=total_questions,
    )
    db.session.add(session)
    db.session.commit()

    # Generate first question
    question_type = _get_question_type(mode, 0)
    q_data = generate_question(
        role=role,
        difficulty=difficulty,
        mode=mode,
        question_type=question_type,
        previous_questions=[],
        company=company if company else None,
        technology=technology if technology else None,
    )

    question = Question(
        session_id=session.id,
        question_text=q_data['question_text'],
        question_type=q_data['question_type'],
        difficulty_level=q_data['difficulty_level'],
        index_in_session=0,
    )
    db.session.add(question)
    db.session.commit()

    return jsonify({
        'session': session.to_dict(),
        'question': question.to_dict(),
        'progress': {'current': 1, 'total': total_questions},
    }), 201


@jwt_required()
def submit_answer(session_id):
    user_id = int(get_jwt_identity())
    session = InterviewSession.query.filter_by(id=session_id, user_id=user_id).first()

    if not session:
        return jsonify({'error': 'Session not found.'}), 404
    if session.status != 'in_progress':
        return jsonify({'error': 'Interview already completed.'}), 400

    data = request.get_json()
    answer_text = data.get('answer', '').strip()
    question_id = data.get('question_id')

    question = Question.query.filter_by(id=question_id, session_id=session.id).first()
    if not question:
        return jsonify({'error': 'Question not found.'}), 404

    # Evaluate answer with IBM Granite
    eval_result = evaluate_answer(
        question=question.question_text,
        answer=answer_text,
        role=session.role,
        difficulty=question.difficulty_level,
        mode=session.mode,
    )

    # Save answer
    answer = Answer(
        question_id=question.id,
        session_id=session.id,
        answer_text=answer_text,
        score=eval_result['score'],
        technical_accuracy=eval_result['technical_accuracy'],
        communication_rating=eval_result['communication_rating'],
        confidence_level=eval_result['confidence_level'],
        strengths=json.dumps(eval_result['strengths']),
        weaknesses=json.dumps(eval_result['weaknesses']),
        better_answer=eval_result['better_answer'],
        improvement_tips=json.dumps(eval_result['improvement_tips']),
        feedback_summary=eval_result['feedback_summary'],
    )
    db.session.add(answer)

    session.current_question_index += 1
    next_question = None
    is_complete = session.current_question_index >= session.total_questions

    if not is_complete:
        # Gather scores for adaptive difficulty
        existing_answers = Answer.query.filter_by(session_id=session.id).all()
        recent_scores = [a.score for a in existing_answers]

        effective_difficulty = session.difficulty
        if session.difficulty == 'adaptive':
            effective_difficulty = _adapt_difficulty('medium', recent_scores)

        question_type = _get_question_type(session.mode, session.current_question_index)
        # Pass ALL previously asked question texts to guarantee no duplicates
        prev_questions = [
            q.question_text
            for q in Question.query.filter_by(session_id=session.id)
                                   .order_by(Question.index_in_session).all()
        ]

        q_data = generate_question(
            role=session.role,
            difficulty=effective_difficulty,
            mode=session.mode,
            question_type=question_type,
            previous_questions=prev_questions,
            company=session.company if session.company else None,
            technology=session.technology if session.technology else None,
        )

        next_question = Question(
            session_id=session.id,
            question_text=q_data['question_text'],
            question_type=q_data['question_type'],
            difficulty_level=q_data['difficulty_level'],
            index_in_session=session.current_question_index,
        )
        db.session.add(next_question)
    else:
        # Complete session
        session.status = 'completed'
        session.completed_at = datetime.utcnow()
        _finalize_session(session, user_id)

    db.session.commit()

    response = {
        'evaluation': eval_result,
        'progress': {
            'current': session.current_question_index,
            'total': session.total_questions,
            'is_complete': is_complete,
        },
        'next_question': next_question.to_dict() if next_question else None,
    }
    return jsonify(response), 200


def _finalize_session(session, user_id):
    """Compute final scores, award XP, update streak."""
    answers = Answer.query.filter_by(session_id=session.id).all()
    if not answers:
        return

    avg_score = sum(a.score for a in answers) / len(answers)
    avg_tech = sum(a.technical_accuracy for a in answers) / len(answers)
    avg_comm = sum(a.communication_rating for a in answers) / len(answers)
    avg_conf = sum(a.confidence_level for a in answers) / len(answers)
    consistency = 10 - (max(a.score for a in answers) - min(a.score for a in answers))

    session.overall_score = avg_score
    session.technical_score = avg_tech
    session.communication_score = avg_comm
    session.confidence_score = avg_conf
    session.problem_solving_score = avg_tech * 0.7 + avg_score * 0.3

    xp_earned = int(avg_score * XP_PER_SCORE_POINT)
    session.xp_earned = xp_earned

    # Update duration
    if session.started_at:
        delta = datetime.utcnow() - session.started_at
        session.duration_seconds = int(delta.total_seconds())

    # Save score record
    readiness = min(95, int(avg_score * 10 + avg_comm * 5))
    score_record = Score(
        session_id=session.id,
        user_id=user_id,
        overall=avg_score,
        technical=avg_tech,
        communication=avg_comm,
        confidence=avg_conf,
        problem_solving=session.problem_solving_score,
        knowledge=avg_tech,
        consistency=max(0, consistency),
        readiness_percent=readiness,
    )
    db.session.add(score_record)

    # Update user XP and stats
    user = User.query.get(user_id)
    if user:
        user.add_xp(xp_earned)
        user.total_interviews += 1
        all_scores = Score.query.filter_by(user_id=user_id).all()
        user.average_score = sum(s.overall for s in all_scores) / len(all_scores)

    # Update streak
    streak = Streak.query.filter_by(user_id=user_id).first()
    if streak:
        today = date.today()
        if streak.last_active_date is None or streak.last_active_date < today:
            if streak.last_active_date and (today - streak.last_active_date).days == 1:
                streak.current_streak += 1
            elif streak.last_active_date and (today - streak.last_active_date).days > 1:
                streak.current_streak = 1
            else:
                streak.current_streak = 1
            streak.last_active_date = today
            streak.total_practice_days += 1
            streak.longest_streak = max(streak.longest_streak, streak.current_streak)

    # Check achievements
    _check_achievements(user_id, session, user)


def _check_achievements(user_id, session, user):
    """Award badges based on performance."""
    existing = {a.badge_id for a in Achievement.query.filter_by(user_id=user_id).all()}
    new_badges = []

    if 'first_interview' not in existing:
        new_badges.append(Achievement(
            user_id=user_id, badge_id='first_interview',
            badge_name='First Steps', badge_description='Completed your first interview!',
            badge_icon='star'
        ))

    if user and user.total_interviews >= 10 and 'ten_interviews' not in existing:
        new_badges.append(Achievement(
            user_id=user_id, badge_id='ten_interviews',
            badge_name='Dedicated Learner', badge_description='Completed 10 interviews!',
            badge_icon='award'
        ))

    if session.overall_score >= 9 and 'perfect_score' not in existing:
        new_badges.append(Achievement(
            user_id=user_id, badge_id='perfect_score',
            badge_name='Near Perfect', badge_description='Scored 9+ in an interview!',
            badge_icon='trophy'
        ))

    if session.mode == 'rapid_fire' and 'speed_demon' not in existing:
        new_badges.append(Achievement(
            user_id=user_id, badge_id='speed_demon',
            badge_name='Speed Demon', badge_description='Completed a Rapid Fire session!',
            badge_icon='zap'
        ))

    streak = Streak.query.filter_by(user_id=user_id).first()
    if streak and streak.current_streak >= 7 and 'week_streak' not in existing:
        new_badges.append(Achievement(
            user_id=user_id, badge_id='week_streak',
            badge_name='On Fire', badge_description='7-day practice streak!',
            badge_icon='flame'
        ))

    if new_badges:
        db.session.add_all(new_badges)


@jwt_required()
def get_session(session_id):
    user_id = int(get_jwt_identity())
    session = InterviewSession.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({'error': 'Session not found.'}), 404

    questions = Question.query.filter_by(session_id=session.id).order_by(Question.index_in_session).all()
    q_list = []
    for q in questions:
        q_dict = q.to_dict()
        if q.answer:
            q_dict['answer'] = q.answer.to_dict()
        q_list.append(q_dict)

    return jsonify({
        'session': session.to_dict(),
        'questions': q_list,
    }), 200


@jwt_required()
def get_report(session_id):
    user_id = int(get_jwt_identity())
    session = InterviewSession.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({'error': 'Session not found.'}), 404
    if session.status != 'completed':
        return jsonify({'error': 'Interview not yet completed.'}), 400

    answers = Answer.query.filter_by(session_id=session.id).all()
    answers_data = [a.to_dict() for a in answers]
    score = Score.query.filter_by(session_id=session.id).first()

    # Generate AI report if not cached
    ai_report = {}
    if session.report_data:
        try:
            ai_report = json.loads(session.report_data)
        except Exception:
            pass

    if not ai_report:
        ai_report = generate_final_report(
            session_data=session.to_dict(),
            answers_data=answers_data,
            role=session.role,
            mode=session.mode,
        )
        session.report_data = json.dumps(ai_report)
        db.session.commit()

    return jsonify({
        'session': session.to_dict(),
        'score': score.to_dict() if score else None,
        'answers': answers_data,
        'ai_report': ai_report,
    }), 200


@jwt_required()
def get_history():
    user_id = int(get_jwt_identity())
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    query = InterviewSession.query.filter_by(
        user_id=user_id, status='completed'
    ).order_by(InterviewSession.completed_at.desc())

    total = query.count()
    sessions = query.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        'sessions': [s.to_dict() for s in sessions],
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': (total + per_page - 1) // per_page,
    }), 200
