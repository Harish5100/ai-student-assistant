import os
import json
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai
from google.genai import types
import os
from google import genai
api_key = os.getenv("GEMINI_API_KEY")

load_dotenv()

app = Flask(__name__)

MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")


def ask_gemini(prompt: str, json_mode: bool = False) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured. Please set it in your environment or .env file.")

    client = genai.Client(api_key=api_key)

    config = None
    if json_mode:
        config = types.GenerateContentConfig(
            response_mime_type="application/json"
        )

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=config
    )
    return response.text or ""


@app.route("/")
def index():
    return render_template("index.html")


@app.post("/api/ask")
def ask():
    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()

    if not question:
        return jsonify({"error": "Please enter a question."}), 400

    prompt = f"""
You are an AI Student Assistant for college students.
Answer the student's question accurately, clearly, and concisely.

Rules:
- Use simple language.
- Explain difficult concepts step by step.
- If the question is academic, include a clear example or code snippet when useful.
- Use clear Markdown formatting with headings, bullet points, bold text, and code blocks.
- Do not invent sources or facts.
- If the request is unsafe or inappropriate, politely refuse.

Student question:
{question}
"""
    try:
        answer = ask_gemini(prompt)
        return jsonify({"answer": answer})
    except ValueError as val_err:
        return jsonify({"error": str(val_err)}), 400
    except Exception:
        app.logger.exception("Gemini request failed")
        return jsonify({"error": "AI request failed. Check your API key and server configuration."}), 500


@app.post("/api/quiz")
def quiz():
    data = request.get_json(silent=True) or {}
    topic = (data.get("topic") or "").strip()

    if not topic:
        return jsonify({"error": "Please enter a topic."}), 400

    prompt = f"""
Create a short practice quiz for a college student about: {topic}

Create exactly 5 multiple-choice questions in strict JSON format.
The JSON object must have this exact structure:
{{
  "title": "{topic} Quiz",
  "questions": [
    {{
      "id": 1,
      "question": "Question text here?",
      "options": [
        "A) Option 1",
        "B) Option 2",
        "C) Option 3",
        "D) Option 4"
      ],
      "correct_answer": "A",
      "explanation": "One-sentence explanation of why A is correct."
    }}
  ]
}}

Provide exactly 5 questions. Make sure options are labeled starting with A), B), C), D).
Ensure correct_answer is strictly one of "A", "B", "C", or "D".
"""
    try:
        raw_json = ask_gemini(prompt, json_mode=True)
        quiz_data = json.loads(raw_json)
        return jsonify({"quiz": quiz_data})
    except ValueError as val_err:
        return jsonify({"error": str(val_err)}), 400
    except json.JSONDecodeError:
        app.logger.exception("Quiz JSON parsing failed")
        return jsonify({"error": "Failed to parse quiz response. Please try again."}), 500
    except Exception:
        app.logger.exception("Quiz generation failed")
        return jsonify({"error": "Quiz generation failed. Check your API key and server configuration."}), 500


@app.post("/api/study-plan")
def study_plan():
    data = request.get_json(silent=True) or {}
    topic = (data.get("topic") or "").strip()

    raw_days = data.get("days")
    try:
        days = int(raw_days) if raw_days is not None else 7
    except (ValueError, TypeError):
        days = 7

    days = max(1, min(days, 30))

    if not topic:
        return jsonify({"error": "Please enter a topic."}), 400

    prompt = f"""
Create a practical {days}-day study plan for a college student learning:
{topic}

For each day include:
- **Learning Goal**
- **Core Topics**
- **Practical Task / Exercise**
- **Estimated Study Time**

Keep it realistic, well-organized, and concise. Return clean Markdown with header tags (e.g. ### Day 1: ...).
"""
    try:
        answer = ask_gemini(prompt)
        return jsonify({"answer": answer})
    except ValueError as val_err:
        return jsonify({"error": str(val_err)}), 400
    except Exception:
        app.logger.exception("Study plan generation failed")
        return jsonify({"error": "Study plan generation failed. Check your API key and server configuration."}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8080"))
    app.run(host="0.0.0.0", port=port)

