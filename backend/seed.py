"""
Seed script for demo data.
"""
import asyncio
from app.core.database import async_engine, AsyncSessionLocal
from app.models import (
    Student, Exam, Question, ExamRegistration, ExamSession,
    ExamStatus, SessionStatus, RegistrationStatus, QuestionType
)


async def seed():
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        
        # Check if data exists
        result = await db.execute(select(Student).limit(1))
        if result.scalar_one_or_none():
            print('Data already seeded')
            return
        
        # Create demo student
        student = Student(
            student_id='NGCS264107',
            name='Demo Student',
            email='demo@northgate.edu',
            department='CSBS',
            year=3,
            section='S26',
            seat_number='4X7Q-12',
        )
        db.add(student)
        
        # Create demo exam
        exam = Exam(
            exam_code='ADV-PROG-001',
            title='Advanced Programming Assessment',
            description='Advanced programming concepts and systems',
            duration_minutes=90,
            status=ExamStatus.ACTIVE,
        )
        db.add(exam)
        await db.flush()
        
        # Create questions
        questions = [
            Question(
                exam_id=exam.id,
                question_number=1,
                question_type=QuestionType.MCQ,
                question_text='In a language with strict evaluation order for function arguments, which of the following is guaranteed by the specification rather than by convention?',
                marks=4,
                options='[{"id": "a", "text": "Arguments are evaluated left to right"}, {"id": "b", "text": "Arguments are evaluated in an unspecified but fixed order"}, {"id": "c", "text": "Arguments are evaluated right to left for tail positions"}, {"id": "d", "text": "Arguments are evaluated in parallel where the runtime permits"}]',
                correct_answer='b',
                expected_seconds=90,
                section='A. Language semantics',
            ),
            Question(
                exam_id=exam.id,
                question_number=2,
                question_type=QuestionType.CODE,
                question_text='Implement a function that returns the length of the longest run of consecutive equal characters in a string. An empty string returns 0.',
                marks=8,
                starter_code='function longestRun(input: string): number {\n  // your implementation\n}',
                expected_seconds=240,
                section='A. Language semantics',
            ),
        ]
        
        for q in questions:
            db.add(q)
        
        await db.flush()
        
        # Register student for exam
        registration = ExamRegistration(
            student_id=student.id,
            exam_id=exam.id,
            registration_status=RegistrationStatus.CONFIRMED,
            seat_number='4X7Q-12',
        )
        db.add(registration)
        await db.flush()
        
        # Create exam session
        session = ExamSession(
            session_id='S-1025',
            student_id=student.id,
            exam_id=exam.id,
            registration_id=registration.id,
            status=SessionStatus.READY,
            duration_minutes=90,
            remaining_seconds=5400,
            total_seconds=5400,
            current_question=1,
        )
        db.add(session)
        
        await db.commit()
        print('Seed data created successfully!')


if __name__ == "__main__":
    asyncio.run(seed())