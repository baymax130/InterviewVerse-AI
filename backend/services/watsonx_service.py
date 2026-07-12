"""
IBM watsonx.ai integration service.
Handles question generation and answer evaluation.
"""
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

IBM_API_KEY    = os.getenv('IBM_API_KEY', '')
IBM_PROJECT_ID = os.getenv('IBM_PROJECT_ID', '')
IBM_URL        = os.getenv('IBM_URL', 'https://au-syd.ml.cloud.ibm.com')
IBM_MODEL_ID   = os.getenv('IBM_MODEL_ID', 'meta-llama/llama-3-3-70b-instruct')

_model = None
_init_error = None   # stores the last SDK exception so callers can inspect it


def get_model():
    """
    Initialise and cache a ModelInference instance.

    Uses the ibm-watsonx-ai SDK v1.1+ pattern for IBM Cloud (SaaS):
      - Credentials(url=..., api_key=...)          – IBM Cloud IAM auth
      - APIClient(credentials=..., project_id=...) – binds project at client level
      - ModelInference(model_id=..., api_client=...) – no need to repeat project_id

    Performs a lightweight warm-up call to verify the model is reachable.
    On failure the exception is stored in _init_error and re-raised so the
    caller can decide whether to fall back or surface the error.
    """
    global _model, _init_error
    if _model is not None:
        return _model
    if _init_error is not None:
        raise _init_error

    from ibm_watsonx_ai import APIClient, Credentials
    from ibm_watsonx_ai.foundation_models import ModelInference
    print("IBM_URL =", IBM_URL)
    print("IBM_PROJECT_ID =", IBM_PROJECT_ID)
    print("IBM_MODEL_ID =", IBM_MODEL_ID)   
    try:
        credentials = Credentials(url=IBM_URL, api_key=IBM_API_KEY)

        # v1.1+ requires project_id at APIClient construction time for Cloud
        client = APIClient(credentials=credentials, project_id=IBM_PROJECT_ID)

        model = ModelInference(
            model_id=IBM_MODEL_ID,
            api_client=client,
            params={
                'max_new_tokens': 1024,
                'temperature': 0.7,
                'top_p': 0.95,
                'repetition_penalty': 1.1,
            }
        )

        # Warm-up: verify connectivity before caching
        model.generate_text(prompt='ping')

        _model = model
        _init_error = None
        print(f"[watsonx] Model ready: {IBM_MODEL_ID} @ {IBM_URL}")
        return _model

    except Exception as e:
        _init_error = e
        print(f"[watsonx] Model init failed: {type(e).__name__}: {e}")
        raise


def generate_question(role, difficulty, mode, question_type, previous_questions=None, company=None, technology=None):
    """
    Generate a single interview question using IBM Granite.
    Returns a dict with: question_text, question_type, difficulty_level
    """
    previous_questions = previous_questions or []
    # Send ALL previous questions so the model never repeats any of them
    prev_text = "\n".join(f"- {q}" for q in previous_questions) if previous_questions else "None"
    company_context = f" for a {company} interview" if company else ""
    tech_context = f"\nFocus technology / topic: {technology}" if technology else ""

    prompt = f"""You are an experienced senior interviewer conducting a {mode} interview{company_context} for a {role} position.

Difficulty level: {difficulty}
Question type needed: {question_type}{tech_context}

Previously asked questions in this session — DO NOT ask any of these again, not even paraphrased:
{prev_text}

Generate exactly ONE NEW interview question. The question must:
- Be highly relevant to the {role} role{f' and specifically about {technology}' if technology else ''}
- Match the {difficulty} difficulty level
- Be of type: {question_type}
- Sound like a real interviewer asking it, not a textbook
- Be completely different from every question listed above

Respond ONLY with a JSON object in this exact format:
{{"question": "your question here", "type": "{question_type}", "difficulty": "{difficulty}"}}"""

    try:
        model = get_model()
        response = model.generate_text(prompt=prompt)
        # Parse JSON from response
        match = re.search(r'\{.*?\}', response, re.DOTALL)
        if match:
            data = json.loads(match.group())
            question_text = data.get('question', '').strip()
            # Guard: if the model returned a duplicate, fall back
            if question_text and question_text not in previous_questions:
                return {
                    'question_text': question_text,
                    'question_type': data.get('type', question_type),
                    'difficulty_level': data.get('difficulty', difficulty),
                }
    except Exception as e:
        print(f"[watsonx] generate_question error: {type(e).__name__}: {e}")

    return _fallback_question(role, difficulty, question_type, previous_questions, technology)


def evaluate_answer(question, answer, role, difficulty, mode):
    """
    Evaluate a user's answer using IBM Granite.
    Returns structured feedback dict.
    """
    prompt = f"""You are an expert interviewer evaluating a candidate's answer for a {role} position.

Interview mode: {mode}
Difficulty: {difficulty}

QUESTION:
{question}

CANDIDATE'S ANSWER:
{answer}

Evaluate the answer thoroughly and respond ONLY with a valid JSON object in this exact format:
{{
  "score": <number 0-10>,
  "technical_accuracy": <number 0-10>,
  "communication_rating": <number 0-10>,
  "confidence_level": <number 0-10>,
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "better_answer": "A comprehensive ideal answer to this question",
  "improvement_tips": ["tip 1", "tip 2", "tip 3"],
  "feedback_summary": "2-3 sentence overall feedback",
  "missing_concepts": ["concept 1", "concept 2"],
  "industry_expectation": "What top companies expect for this question"
}}

Be honest, constructive, and specific. If the answer is blank or very short, give a low score."""

    try:
        model = get_model()
        response = model.generate_text(prompt=prompt)
        match = re.search(r'\{.*?\}', response, re.DOTALL)
        if match:
            data = json.loads(match.group())
            # Ensure all required keys exist with defaults
            return {
                'score': float(data.get('score', 5)),
                'technical_accuracy': float(data.get('technical_accuracy', 5)),
                'communication_rating': float(data.get('communication_rating', 5)),
                'confidence_level': float(data.get('confidence_level', 5)),
                'strengths': data.get('strengths', []),
                'weaknesses': data.get('weaknesses', []),
                'better_answer': data.get('better_answer', ''),
                'improvement_tips': data.get('improvement_tips', []),
                'feedback_summary': data.get('feedback_summary', ''),
                'missing_concepts': data.get('missing_concepts', []),
                'industry_expectation': data.get('industry_expectation', ''),
            }
    except Exception as e:
        print(f"[watsonx] evaluate_answer error: {type(e).__name__}: {e}")

    return _fallback_evaluation(answer, question=question, role=role)


def generate_final_report(session_data, answers_data, role, mode):
    """
    Generate a comprehensive final interview report.
    """
    avg_score = sum(a['score'] for a in answers_data) / len(answers_data) if answers_data else 0
    weaknesses_all = []
    strengths_all = []
    for a in answers_data:
        weaknesses_all.extend(a.get('weaknesses', []))
        strengths_all.extend(a.get('strengths', []))

    prompt = f"""You are a career coach analyzing a completed interview session.

Role: {role}
Mode: {mode}
Number of questions: {len(answers_data)}
Average score: {avg_score:.1f}/10
Top strengths identified: {', '.join(strengths_all[:5]) if strengths_all else 'None'}
Key weaknesses: {', '.join(weaknesses_all[:5]) if weaknesses_all else 'None'}

Generate a comprehensive interview performance report as a JSON object:
{{
  "overall_assessment": "2-3 paragraph overall assessment",
  "readiness_percent": <0-100>,
  "strong_areas": ["area 1", "area 2", "area 3"],
  "weak_areas": ["area 1", "area 2", "area 3"],
  "recommended_topics": ["topic 1", "topic 2", "topic 3", "topic 4"],
  "learning_roadmap": [
    {{"week": 1, "focus": "topic", "resources": ["resource 1"]}},
    {{"week": 2, "focus": "topic", "resources": ["resource 1"]}},
    {{"week": 3, "focus": "topic", "resources": ["resource 1"]}}
  ],
  "motivational_message": "personalized motivational message",
  "next_steps": ["step 1", "step 2", "step 3"]
}}"""

    try:
        model = get_model()
        response = model.generate_text(prompt=prompt)
        match = re.search(r'\{.*?\}', response, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception as e:
        print(f"[watsonx] generate_final_report error: {e}")

    return _fallback_report(avg_score, role)


# ── Fallback helpers (used when IBM API is unavailable) ──────────────────────

# Extended bank of fallback questions per type (50+ total to avoid repeats in a session)
_FALLBACK_BANK = {
    'conceptual': [
        "Explain the difference between stack and heap memory.",
        "What is the difference between process and thread?",
        "Explain polymorphism with a real-world example.",
        "What is the CAP theorem?",
        "Describe what happens when you type a URL in a browser.",
        "What is memoization and when would you use it?",
        "Explain the concept of database normalization.",
        "What is the difference between TCP and UDP?",
        "Explain SOLID principles with examples.",
        "What is the difference between REST and GraphQL?",
        "Explain Big O notation and why it matters.",
        "What is garbage collection and how does it work?",
        "Describe the MVC design pattern.",
        "What are microservices and their trade-offs vs monoliths?",
        "Explain eventual consistency in distributed systems.",
    ],
    'behavioral': [
        "Tell me about a time you faced a challenging technical problem and how you solved it.",
        "Describe a situation where you had to work under tight deadlines.",
        "Give an example of when you demonstrated leadership in a team project.",
        "Tell me about a time you disagreed with a team member. How did you handle it?",
        "Describe a project where you had to learn a new technology quickly.",
        "Tell me about a mistake you made and what you learned from it.",
        "Describe a time when you improved a process in your team.",
        "How do you prioritize tasks when everything seems urgent?",
        "Tell me about a time you received difficult feedback and how you responded.",
        "Describe a situation where you had to deal with an ambiguous requirement.",
    ],
    'coding': [
        "Write a function to reverse a linked list.",
        "Implement a binary search algorithm.",
        "Write code to find all duplicates in an array.",
        "Implement a function to check if a string is a palindrome.",
        "Write a function to find the nth Fibonacci number using dynamic programming.",
        "Implement a stack using two queues.",
        "Write a function to detect a cycle in a linked list.",
        "Implement merge sort and explain its time complexity.",
        "Write a function to find the longest common subsequence of two strings.",
        "Implement a basic LRU cache.",
    ],
    'system_design': [
        "How would you design a URL shortener like bit.ly?",
        "Design the architecture for a scalable chat application.",
        "How would you design a recommendation system?",
        "Design a distributed rate limiter.",
        "How would you design a notification service for millions of users?",
        "Design a distributed key-value store.",
        "How would you design Instagram's feed generation?",
        "Design a search autocomplete system.",
    ],
    'scenario': [
        "If your production server goes down at 3am, walk me through your response.",
        "A client reports a critical bug right before launch. How do you handle it?",
        "You discover a major security vulnerability in the codebase. What do you do?",
        "Your team is 2 weeks behind schedule. How do you communicate this to stakeholders?",
        "A junior developer on your team is consistently missing deadlines. How do you address it?",
    ],
    'debugging': [
        "Walk me through how you would debug a memory leak in a production application.",
        "A function works in testing but fails in production. What are your first steps?",
        "How would you approach debugging a race condition in a multi-threaded application?",
        "Describe your process for investigating a sudden performance degradation.",
    ],
    'communication': [
        "How do you explain a complex technical concept to a non-technical stakeholder?",
        "Describe how you document your code and why it matters.",
        "How do you conduct a code review? What do you look for?",
        "How do you onboard a new team member to an existing codebase?",
    ],
}

# Technology-specific question banks (used when technology is selected)
_TECH_FALLBACK_BANK = {
    'Python': [
        "Explain the difference between a list and a tuple in Python.",
        "What are Python decorators and how do they work?",
        "Explain the Global Interpreter Lock (GIL) in Python.",
        "What is the difference between @staticmethod and @classmethod?",
        "How does Python's garbage collection work?",
        "Explain generators and the yield keyword.",
        "What is the difference between deepcopy and copy?",
        "How would you optimize a slow Python script?",
        "Explain list comprehensions vs generator expressions.",
        "What are context managers and how do you create one?",
    ],
    'JavaScript': [
        "Explain the event loop in JavaScript.",
        "What is the difference between var, let, and const?",
        "Explain closures in JavaScript with an example.",
        "What is hoisting and how does it affect your code?",
        "Explain Promise vs async/await.",
        "What is the difference between == and === in JavaScript?",
        "Explain prototype-based inheritance in JavaScript.",
        "What is the difference between null and undefined?",
        "How does the this keyword work in JavaScript?",
        "What are JavaScript modules and how do they work?",
    ],
    'Java': [
        "Explain the difference between abstract class and interface in Java.",
        "What is the Java Collections Framework? Name key interfaces.",
        "Explain Java's memory model: heap vs stack.",
        "What is the difference between checked and unchecked exceptions?",
        "Explain Java generics and type erasure.",
        "What is synchronized in Java and when would you use it?",
        "Explain the difference between HashMap and Hashtable.",
        "What is the Java Stream API and how is it used?",
        "Explain the concept of immutability in Java.",
        "What is the difference between String, StringBuilder, and StringBuffer?",
    ],
    'C++': [
        "Explain the difference between new/delete and malloc/free.",
        "What are smart pointers in C++? Explain unique_ptr and shared_ptr.",
        "Explain virtual functions and the vtable mechanism.",
        "What is RAII in C++ and why is it important?",
        "Explain move semantics and rvalue references.",
        "What is the difference between struct and class in C++?",
        "Explain templates in C++ with an example.",
        "What is the Rule of Three / Five in C++?",
        "Explain the difference between stack and heap allocation.",
        "What are lambda expressions in C++11 and later?",
    ],
    'React': [
        "Explain the Virtual DOM and how React uses it.",
        "What is the difference between functional and class components?",
        "Explain React hooks: useState, useEffect, useContext.",
        "What is the Context API and when would you use it over Redux?",
        "Explain React's reconciliation algorithm.",
        "What is prop drilling and how do you avoid it?",
        "Explain the useCallback and useMemo hooks.",
        "What are React keys and why are they important in lists?",
        "Explain the component lifecycle in React.",
        "What is code splitting in React and how do you implement it?",
    ],
    'Node.js': [
        "Explain the event-driven, non-blocking I/O model in Node.js.",
        "What is the difference between require and import in Node.js?",
        "Explain the Node.js cluster module.",
        "What is middleware in Express.js?",
        "How does Node.js handle asynchronous operations?",
        "Explain streams in Node.js and their types.",
        "What is the difference between process.nextTick and setImmediate?",
        "How would you prevent callback hell in Node.js?",
        "Explain how to handle errors in async/await in Node.js.",
        "What is the purpose of package.json and package-lock.json?",
    ],
    'SQL': [
        "Explain the difference between INNER JOIN, LEFT JOIN, and FULL JOIN.",
        "What is a database index and how does it improve query performance?",
        "Explain the difference between WHERE and HAVING clauses.",
        "What are SQL transactions and the ACID properties?",
        "Explain database normalization — 1NF, 2NF, 3NF.",
        "What is a primary key vs foreign key?",
        "Explain the difference between UNION and UNION ALL.",
        "What are stored procedures and their advantages?",
        "How would you optimize a slow SQL query?",
        "Explain window functions (ROW_NUMBER, RANK, PARTITION BY).",
    ],
    'TypeScript': [
        "What is the difference between TypeScript and JavaScript?",
        "Explain TypeScript generics with an example.",
        "What is the difference between interface and type in TypeScript?",
        "Explain TypeScript union and intersection types.",
        "What is the never type in TypeScript?",
        "Explain TypeScript decorators.",
        "What is strict mode in TypeScript and why should you use it?",
        "Explain the keyof and typeof operators in TypeScript.",
        "What are mapped types in TypeScript?",
        "How does TypeScript handle null and undefined differently from JavaScript?",
    ],
    'Data Structures & Algorithms': [
        "Explain the time and space complexity of quicksort vs mergesort.",
        "What is a balanced binary search tree? Name examples.",
        "Explain Dijkstra's algorithm and its time complexity.",
        "What is dynamic programming? Give an example problem.",
        "Explain the difference between BFS and DFS and their use cases.",
        "What is a hash table and how do you handle collisions?",
        "Explain the concept of amortized time complexity.",
        "What is a trie and what problems is it suited for?",
        "Explain the knapsack problem and its solutions.",
        "What is a segment tree and when would you use it?",
    ],
    'Machine Learning': [
        "Explain the difference between supervised and unsupervised learning.",
        "What is overfitting and how do you prevent it?",
        "Explain gradient descent and its variants.",
        "What is the bias-variance tradeoff?",
        "Explain cross-validation and why it is used.",
        "What is the difference between precision and recall?",
        "Explain how a random forest works.",
        "What is a convolutional neural network (CNN) and where is it used?",
        "Explain the transformer architecture in deep learning.",
        "What is transfer learning and when would you use it?",
    ],
    'Operating Systems': [
        "Explain the difference between a process and a thread.",
        "What is a deadlock and what are the four conditions for it?",
        "Explain the different CPU scheduling algorithms.",
        "What is virtual memory and how does paging work?",
        "Explain the difference between mutex and semaphore.",
        "What is a context switch and why is it expensive?",
        "Explain the concept of thrashing in operating systems.",
        "What is the difference between internal and external fragmentation?",
        "Explain system calls and how they work.",
        "What is the role of the OS kernel?",
    ],
    'Computer Networks': [
        "Explain the OSI model and the role of each layer.",
        "What is the difference between TCP and UDP?",
        "Explain the TLS/SSL handshake process.",
        "What is DNS and how does domain resolution work?",
        "Explain HTTP vs HTTPS.",
        "What is a subnet mask and CIDR notation?",
        "Explain the difference between symmetric and asymmetric encryption.",
        "What is ARP and how does it work?",
        "Explain the three-way TCP handshake.",
        "What is the difference between a hub, switch, and router?",
    ],
    'DBMS': [
        "Explain ACID properties in database transactions.",
        "What is the difference between a clustered and non-clustered index?",
        "Explain the difference between OLTP and OLAP systems.",
        "What is database sharding and when would you use it?",
        "Explain eventual consistency vs strong consistency.",
        "What is a B-tree index and why is it used in databases?",
        "Explain the concept of a transaction isolation level.",
        "What is the difference between row-level and table-level locking?",
        "Explain the CAP theorem.",
        "What is database replication and its types?",
    ],
    'Artificial Intelligence': [
        "Explain the difference between AI, ML, and deep learning.",
        "What is reinforcement learning and how does it work?",
        "Explain the concept of a knowledge graph.",
        "What is natural language processing (NLP)?",
        "Explain the attention mechanism in transformers.",
        "What is prompt engineering in large language models?",
        "Explain the difference between generative and discriminative models.",
        "What are GANs and how do they work?",
        "What is the Turing test and its limitations?",
        "Explain the concept of embeddings in AI.",
    ],
    'HR': [
        "Tell me about yourself and your career journey.",
        "Where do you see yourself in 5 years?",
        "What is your greatest professional achievement?",
        "Describe your ideal work environment.",
        "How do you handle workplace conflict?",
        "What motivates you in your work?",
        "Tell me about a time you went above and beyond for a project.",
        "How do you handle constructive criticism?",
        "Describe your leadership style.",
        "Why do you want to work at this company?",
    ],
}


def _fallback_question(role, difficulty, question_type, previous_questions=None, technology=None):
    import random
    previous_questions = previous_questions or []

    # Use technology-specific bank if a technology is selected
    if technology and technology in _TECH_FALLBACK_BANK:
        candidates = _TECH_FALLBACK_BANK[technology]
    else:
        candidates = _FALLBACK_BANK.get(question_type, _FALLBACK_BANK['conceptual'])

    # Filter out already-asked questions
    available = [q for q in candidates if q not in previous_questions]

    # If all specific questions exhausted, fall back to generic pool
    if not available:
        generic = _FALLBACK_BANK.get(question_type, _FALLBACK_BANK['conceptual'])
        available = [q for q in generic if q not in previous_questions]

    # Last resort: pick any unseen question from any category
    if not available:
        all_qs = [q for pool in _FALLBACK_BANK.values() for q in pool]
        available = [q for q in all_qs if q not in previous_questions]

    # Absolute fallback: generate a unique role-based question
    if not available:
        idx = len(previous_questions) + 1
        return {
            'question_text': f"Question {idx}: Explain an advanced concept in {technology or role} that you have used in a real project.",
            'question_type': question_type,
            'difficulty_level': difficulty,
        }

    return {
        'question_text': random.choice(available),
        'question_type': question_type,
        'difficulty_level': difficulty,
    }


def _fallback_evaluation(answer, question='', role=''):
    """
    Produce contextual fallback feedback based on the actual answer content.
    Varies scores, strengths, weaknesses, and tips so each evaluation feels unique.
    """
    import random

    words = answer.strip().split() if answer.strip() else []
    word_count = len(words)

    # Base score driven by answer length (proxy for effort when AI is offline)
    if word_count == 0:
        base_score = 1.0
    elif word_count < 20:
        base_score = round(random.uniform(2.5, 4.5), 1)
    elif word_count < 60:
        base_score = round(random.uniform(4.5, 6.5), 1)
    elif word_count < 120:
        base_score = round(random.uniform(6.0, 7.8), 1)
    else:
        base_score = round(random.uniform(7.0, 9.0), 1)

    base_score = min(10.0, max(1.0, base_score))

    # Vary sub-scores slightly so bars look different per question
    tech   = round(min(10, max(1, base_score + random.uniform(-0.8, 0.8))), 1)
    comm   = round(min(10, max(1, base_score + random.uniform(-0.5, 0.5))), 1)
    conf   = round(min(10, max(1, base_score + random.uniform(-1.0, 0.6))), 1)

    # Strength pool — randomly select 1-2 that match observed answer qualities
    strength_pool = []
    if word_count >= 40:
        strength_pool.append("Provided a reasonably detailed response")
    if word_count >= 80:
        strength_pool.append("Demonstrated willingness to explain thoroughly")
    if any(kw in answer.lower() for kw in ['example', 'instance', 'such as', 'for example', 'e.g.']):
        strength_pool.append("Used concrete examples to support the answer")
    if any(kw in answer.lower() for kw in ['because', 'therefore', 'since', 'so that', 'reason']):
        strength_pool.append("Showed logical reasoning and cause-effect thinking")
    if any(kw in answer.lower() for kw in ['first', 'second', 'third', 'finally', 'step']):
        strength_pool.append("Structured the answer in a clear, sequential manner")
    if any(kw in answer.lower() for kw in ['trade-off', 'tradeoff', 'advantage', 'disadvantage', 'pros', 'cons']):
        strength_pool.append("Acknowledged trade-offs, showing mature technical thinking")
    if word_count > 0:
        strength_pool.append("Attempted to address the question directly")
    strengths = random.sample(strength_pool, min(2, len(strength_pool))) if strength_pool else ["Attempted to answer the question"]

    # Weakness pool — pick what is actually missing
    weakness_pool = []
    if word_count < 40:
        weakness_pool.append("Answer is too brief — interviewers expect more depth")
    if not any(kw in answer.lower() for kw in ['example', 'instance', 'such as', 'for example', 'e.g.']):
        weakness_pool.append("No concrete examples provided to back up the explanation")
    if not any(kw in answer.lower() for kw in ['because', 'therefore', 'since', 'so that']):
        weakness_pool.append("Reasoning behind statements could be explained more clearly")
    if word_count > 0 and not any(kw in answer.lower() for kw in ['first', 'second', 'step', 'finally', 'in conclusion']):
        weakness_pool.append("Structure could be improved — try using a numbered or step-by-step approach")
    weakness_pool.append("Could demonstrate deeper domain knowledge with technical terminology")
    weaknesses = random.sample(weakness_pool, min(2, len(weakness_pool)))

    # Improvement tips — pick 3 varied ones
    all_tips = [
        "Use the STAR method (Situation, Task, Action, Result) for behavioral questions",
        "Always back up claims with a specific real-world example",
        "Start with a one-sentence summary answer, then elaborate",
        "Include relevant technical terms to show domain expertise",
        "Practice answering out loud — fluency matters in live interviews",
        "Mention trade-offs or limitations to show balanced thinking",
        "Conclude your answer with a brief summary or takeaway",
        "Quantify your achievements where possible (e.g., 'reduced latency by 30%')",
        "Break complex answers into numbered points for clarity",
    ]
    improvement_tips = random.sample(all_tips, 3)

    # Feedback summary — vary based on score band
    if base_score >= 7.5:
        summary = (
            f"Good response overall — you covered the key aspects and communicated clearly. "
            f"Adding a concrete example and mentioning edge cases would push this to an excellent answer."
        )
    elif base_score >= 5.0:
        summary = (
            f"Decent attempt that shows basic familiarity with the topic. "
            f"The answer needs more depth and specific examples to meet interviewer expectations at a {role or 'professional'} level."
        )
    else:
        summary = (
            f"The answer is too short or lacks sufficient detail for this question. "
            f"Interviewers expect structured, example-backed responses — aim for at least 3-4 sentences per answer."
        )

    # Expected answer hint — generic but question-aware
    if question:
        expected = (
            f"A strong answer to this question would: (1) define or explain the core concept clearly, "
            f"(2) provide a concrete real-world example or use case, "
            f"(3) discuss trade-offs or edge cases, and "
            f"(4) relate it back to the {role or 'role'} context where relevant."
        )
    else:
        expected = (
            "A strong answer includes a clear definition, a real-world example, any trade-offs or limitations, "
            "and concludes with how you have applied this in practice."
        )

    return {
        'score': base_score,
        'technical_accuracy': tech,
        'communication_rating': comm,
        'confidence_level': conf,
        'strengths': strengths,
        'weaknesses': weaknesses,
        'better_answer': expected,
        'improvement_tips': improvement_tips,
        'feedback_summary': summary,
        'missing_concepts': [],
        'industry_expectation': (
            "Top companies expect candidates to explain concepts clearly, support answers with examples, "
            "and demonstrate awareness of trade-offs and real-world implications."
        ),
    }


def _fallback_report(avg_score, role):
    readiness = min(95, max(20, int(avg_score * 10)))
    return {
        'overall_assessment': f"Your performance shows {'strong' if avg_score >= 7 else 'developing'} competency for the {role} role. Keep practicing to improve your scores.",
        'readiness_percent': readiness,
        'strong_areas': ["Communication", "Basic concepts", "Problem-solving approach"],
        'weak_areas': ["Advanced topics", "Technical depth", "Speed under pressure"],
        'recommended_topics': ["Data structures", "System design", "Algorithms", "Behavioral interview prep"],
        'learning_roadmap': [
            {"week": 1, "focus": "Core technical concepts", "resources": ["LeetCode", "GeeksforGeeks"]},
            {"week": 2, "focus": "System design", "resources": ["System Design Primer", "YouTube"]},
            {"week": 3, "focus": "Behavioral questions", "resources": ["STAR method guide", "Mock interviews"]},
        ],
        'motivational_message': f"You're on the right track! Keep practicing and you'll be ready for your dream {role} role.",
        'next_steps': ["Practice 3 questions daily", "Review weak topics", "Do mock interviews"],
    }
