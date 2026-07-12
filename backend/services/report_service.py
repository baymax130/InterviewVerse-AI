"""
PDF report generation service using ReportLab.
"""
import io
import json
from datetime import datetime


def generate_pdf_report(session_data, score_data, answers_data, ai_report, user_data):
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib.colors import HexColor, white, black
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.enums import TA_CENTER, TA_LEFT

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=50, bottomMargin=40)

        styles = getSampleStyleSheet()
        purple = HexColor('#7c3aed')
        dark = HexColor('#1e1b4b')
        gray = HexColor('#6b7280')
        light_bg = HexColor('#f5f3ff')
        green = HexColor('#10b981')
        red = HexColor('#ef4444')

        title_style = ParagraphStyle('Title', parent=styles['Title'], fontSize=24, textColor=purple, alignment=TA_CENTER, spaceAfter=6)
        subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=12, textColor=gray, alignment=TA_CENTER, spaceAfter=20)
        heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], fontSize=14, textColor=dark, spaceBefore=16, spaceAfter=6)
        body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, textColor=HexColor('#374151'), spaceAfter=4)
        score_style = ParagraphStyle('Score', parent=styles['Normal'], fontSize=28, textColor=purple, alignment=TA_CENTER)

        story = []

        # Header
        story.append(Paragraph("InterviewVerse AI", title_style))
        story.append(Paragraph("Interview Performance Report", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=2, color=purple))
        story.append(Spacer(1, 16))

        # Meta info
        meta_data = [
            ['Candidate', user_data.get('username', 'N/A'), 'Role', session_data.get('role', 'N/A')],
            ['Mode', session_data.get('mode', 'N/A').replace('_', ' ').title(), 'Difficulty', session_data.get('difficulty', 'N/A').title()],
            ['Date', session_data.get('completed_at', '')[:10] if session_data.get('completed_at') else datetime.now().strftime('%Y-%m-%d'), 'Questions', str(session_data.get('total_questions', 0))],
        ]
        meta_table = Table(meta_data, colWidths=[80, 160, 80, 160])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), light_bg),
            ('TEXTCOLOR', (0, 0), (0, -1), purple),
            ('TEXTCOLOR', (2, 0), (2, -1), purple),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [light_bg, white]),
            ('BOX', (0, 0), (-1, -1), 1, purple),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 20))

        # Overall Score
        story.append(Paragraph("Overall Performance", heading_style))
        overall = session_data.get('overall_score', 0)
        readiness = score_data.get('readiness_percent', 0) if score_data else 0
        story.append(Paragraph(f"{overall:.1f}/10", score_style))
        story.append(Paragraph(f"Interview Readiness: {readiness:.0f}%", subtitle_style))
        story.append(Spacer(1, 8))

        # Score breakdown
        if score_data:
            scores = [
                ['Metric', 'Score', 'Rating'],
                ['Technical Accuracy', f"{score_data.get('technical', 0):.1f}/10", _rating(score_data.get('technical', 0))],
                ['Communication', f"{score_data.get('communication', 0):.1f}/10", _rating(score_data.get('communication', 0))],
                ['Confidence', f"{score_data.get('confidence', 0):.1f}/10", _rating(score_data.get('confidence', 0))],
                ['Problem Solving', f"{score_data.get('problem_solving', 0):.1f}/10", _rating(score_data.get('problem_solving', 0))],
                ['Consistency', f"{score_data.get('consistency', 0):.1f}/10", _rating(score_data.get('consistency', 0))],
                ['Knowledge', f"{score_data.get('knowledge', 0):.1f}/10", _rating(score_data.get('knowledge', 0))],
            ]
            score_table = Table(scores, colWidths=[200, 100, 180])
            score_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), purple),
                ('TEXTCOLOR', (0, 0), (-1, 0), white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, light_bg]),
                ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
                ('PADDING', (0, 0), (-1, -1), 8),
                ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ]))
            story.append(score_table)
            story.append(Spacer(1, 16))

        # AI Assessment
        if ai_report:
            story.append(Paragraph("AI Assessment", heading_style))
            assessment = ai_report.get('overall_assessment', '')
            if assessment:
                story.append(Paragraph(assessment, body_style))
            story.append(Spacer(1, 8))

            # Strong/Weak areas
            if ai_report.get('strong_areas') or ai_report.get('weak_areas'):
                areas_data = [['Strengths ✓', 'Areas to Improve ✗']]
                strong = ai_report.get('strong_areas', [])
                weak = ai_report.get('weak_areas', [])
                for i in range(max(len(strong), len(weak))):
                    areas_data.append([
                        strong[i] if i < len(strong) else '',
                        weak[i] if i < len(weak) else ''
                    ])
                areas_table = Table(areas_data, colWidths=[240, 240])
                areas_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (0, 0), green),
                    ('BACKGROUND', (1, 0), (1, 0), red),
                    ('TEXTCOLOR', (0, 0), (-1, 0), white),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, light_bg]),
                    ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
                    ('PADDING', (0, 0), (-1, -1), 8),
                ]))
                story.append(areas_table)
                story.append(Spacer(1, 12))

            # Recommended topics
            if ai_report.get('recommended_topics'):
                story.append(Paragraph("Recommended Study Topics", heading_style))
                for topic in ai_report['recommended_topics']:
                    story.append(Paragraph(f"• {topic}", body_style))
                story.append(Spacer(1, 8))

            # Motivational message
            if ai_report.get('motivational_message'):
                story.append(Paragraph("Message from AI Coach", heading_style))
                msg_style = ParagraphStyle('Msg', parent=body_style, textColor=purple, fontSize=11, leftIndent=10)
                story.append(Paragraph(f'"{ai_report["motivational_message"]}"', msg_style))
                story.append(Spacer(1, 12))

        # Question-by-question breakdown
        if answers_data:
            story.append(HRFlowable(width="100%", thickness=1, color=HexColor('#e5e7eb')))
            story.append(Paragraph("Question-by-Question Analysis", heading_style))
            for i, ans in enumerate(answers_data, 1):
                q = ans.get('question', {}) if isinstance(ans.get('question'), dict) else {}
                story.append(Paragraph(f"Q{i}: Score {ans.get('score', 0):.1f}/10", 
                    ParagraphStyle('QHead', parent=body_style, fontName='Helvetica-Bold', textColor=dark)))
                story.append(Paragraph(f"Feedback: {ans.get('feedback_summary', 'N/A')}", body_style))
                story.append(Spacer(1, 4))

        # Footer
        story.append(Spacer(1, 20))
        story.append(HRFlowable(width="100%", thickness=1, color=HexColor('#e5e7eb')))
        footer_style = ParagraphStyle('Footer', parent=body_style, textColor=gray, alignment=TA_CENTER, fontSize=9)
        story.append(Paragraph(f"Generated by InterviewVerse AI • {datetime.now().strftime('%B %d, %Y')}", footer_style))

        doc.build(story)
        buffer.seek(0)
        return buffer
    except Exception as e:
        print(f"[PDF] Error: {e}")
        return None


def _rating(score):
    if score >= 9: return 'Excellent'
    if score >= 7: return 'Good'
    if score >= 5: return 'Average'
    if score >= 3: return 'Below Average'
    return 'Needs Improvement'
