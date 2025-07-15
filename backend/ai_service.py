import os
import httpx
from openai import OpenAI
from fastapi import HTTPException
from typing import Optional
from dotenv import load_dotenv
import logging
import traceback
from pathlib import Path

# Load .env variables
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Get API keys
groq_api_key = os.getenv("GROQ_API_KEY") or os.getenv("GROQAPIKEY") or os.getenv("GROQ_APIKEY")
openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
openrouter_api_key_gemma = os.getenv("OPENROUTER_API_KEY_GEMMA")
if not openrouter_api_key:
    raise ValueError("OPENROUTER_API_KEY environment variable is not set")

# Initialize clients
groq_client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=groq_api_key,
    http_client=httpx.Client(timeout=60.0)
)

openrouter_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=openrouter_api_key,
    http_client=httpx.Client(timeout=60.0)
)


# 📘 Ask AI Function
async def ask_ai(question: str, context: Optional[str] = None) -> str:
    try:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are Study Buddy AI. Answer ONLY using the provided context. "
                    "If a user asks a basic conversational question (e.g., hello, good morning, who are you?, "
                    "what do you do?, how are you?, thank you, bye, etc.), respond politely and naturally like a human assistant would. "
                    "If the answer isn't in the context, say 'Not in the document.'"
                )
            }
        ]

  

        if context:
            messages.append({
                "role": "system",
                "content": f"Relevant context from user's documents:\n{context}"
            })

        messages.append({"role": "user", "content": question})

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=4096,
            temperature=0.7,
        )
        if not response.choices:
            print(HTTPEcepton(status_code=500, detail = "User Input"))

        if not response.choices:
            raise HTTPException(status_code=500, detail="Empty response from AI")

        return response.choices[0].message.content.strip()

    except Exception as e:
        logging.error(f"Error in ask_ai: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


# 📝 Note Generator
async def generate_notes(context: str) -> str:
    try:
        notes_prompt = """You are a professional note-generator assistant. Based on the input provided, generate clean, well-structured, and easy-to-understand notes. Include key ideas, examples (if any), and simplify complex terms. Make the notes suitable for studying or future reference. Ignore filler words or off-topic information. Keep it concise but informative.

Your goal is to produce **structured, complete, and readable notes** that capture all key content — regardless of file type, subject, or format.
Use the Format Guideline provided below for generating the note.
Format Guidelines
1. Use A clean and understandable Headings/Topics
2. Use Emojis Where it is important (example:- sections headers)
3. Use a clean bullet points.
4. Use a code blocks if there is code provided in the context.
5. Use Bold for Important terms/text.
6. Make sure to cover all the imporatant content.

Content to generate notes from:
{context}"""

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at creating comprehensive, detailed study notes that cover ALL aspects of a topic thoroughly."
                },
                {
                    "role": "user",
                    "content": notes_prompt.format(context=context)
                }
            ],
            max_tokens=4000,
            temperature=0.7,
            top_p=0.9,
            frequency_penalty=0.3,
            presence_penalty=0.3,
            extra_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Study Buddy",
            },
            extra_body={}
        )

        if not response.choices:
            raise HTTPException(status_code=500, detail="Empty response from AI")

        notes = response.choices[0].message.content.strip()
        return notes

    except Exception as e:
        logging.error(f"Notes generation failed: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Notes generation failed: {str(e)}")


# ❓ Quiz Generator
async def generate_quiz(context: str, options: dict) -> str:
    try:
        question_types = []
        if options.get('question_types', {}).get('trueFalse'):
            question_types.append("True or False")
        if options.get('question_types', {}).get('multipleChoice'):
            question_types.append("Multiple Choice")
        if options.get('question_types', {}).get('fillInBlank'):
            question_types.append("Fill in the Blank")
        if options.get('question_types', {}).get('shortAnswer'):
            question_types.append("Short Answer")

        if not question_types:
            raise ValueError("At least one question type must be selected")

        prompt = f"""You are a Quiz Generator AI. Create a quiz based on the following content:

{context}

The quiz should include a mix of the following question types:
{', '.join(question_types)}

Format each question EXACTLY like this:

Question Type: [True/False | Multiple Choice | Fill in the Blank | Short Answer]
Question: [The actual question]
Options (if applicable):
A. [Option A]
B. [Option B]
C. [Option C]
D. [Option D]
Answer: [Correct Answer or Sample Answer]

Important formatting rules:
1. Each question MUST start with "Question Type:" on its own line
2. The question MUST start with "Question:" on its own line
3. For multiple choice questions, list options with "A.", "B.", "C.", "D." on separate lines
4. Each answer MUST start with "Answer:" on its own line
5. Leave a blank line between questions
6. Do not include any other text or formatting

Generate a total of {options.get('num_questions', 5)} questions, mixing all the types equally."""

        response = groq_client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at creating educational quizzes that test understanding and knowledge."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            extra_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Study Buddy",
            },
            extra_body={}
        )

        if not response.choices:
            raise HTTPException(status_code=500, detail="Empty response from AI")

        quiz_content = response.choices[0].message.content.strip()
        return format_markdown(quiz_content)

    except Exception as e:
        logging.error(f"Quiz generation failed: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")


# ✅ Helper: Format Markdown (Placeholder for now, expand as needed)
def format_markdown(text: str) -> str:
    """
    Simple markdown formatting fixer, you can improve this further.
    """
    text = text.strip()
    text = text.replace('\n\n\n', '\n\n')
    return text


async def generate_flashcards(context: str, num_flashcards: int = 5) -> str:
    try:
        prompt = f"""You are a Flashcard Generator AI. Create flashcards based on the following content:

{context}

Format each flashcard EXACTLY like this:

Front: [Question or term]
Back: [Answer or definition]

Important formatting rules:
1. Each flashcard MUST start with "Front:" on its own line
2. The back of the card MUST start with "Back:" on its own line
3. Leave a blank line between flashcards
4. Do not include any other text or formatting
5. Generate exactly {num_flashcards} flashcards covering the most important concepts

Make sure the flashcards are:
- Clear and concise
- Focus on key concepts and definitions
- Easy to understand
- Suitable for memorization"""

        response = groq_client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at creating educational flashcards that help with memorization and understanding."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=2000,
            temperature=0.7,
            top_p=0.9,
            frequency_penalty=0.3,
            presence_penalty=0.3,
            extra_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Study Buddy",
            },
            extra_body={}
        )

        if not response.choices:
            raise HTTPException(status_code=500, detail="Empty response from AI")

        flashcards = response.choices[0].message.content.strip()
        return flashcards

    except Exception as e:
        logging.error(f"Flashcard generation failed: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Flashcard generation failed: {str(e)}")
