# AI Student Assistant

A modern, educational AI web application built with Flask and Google Gemini 2.5.

## Features

- 🤖 **Ask AI Tutor**: Get step-by-step academic explanations and code examples formatted with Markdown.
- 🎯 **Interactive Quizzes**: Generate 5 multiple-choice practice questions with option selection, real-time score tracking, and instant explanations.
- 📅 **Study Plan Generator**: Create custom 1–30 day study blueprints tailored to any subject.
- 🌙 **Dark & Light Themes**: Modern responsive UI with theme switcher and accent styling.
- 📋 **Copy to Clipboard**: Quick one-click copy button for AI answers and study plans.
- ⚡ **Preset Quick Chips**: Tap prompt suggestions to quickly fill input fields.
- 🔒 **Secure Config**: Automatic `.env` file loading and key validation to protect your API key.

## Local Setup

1. Install Python 3.12+.
2. Create a virtual environment:
   ```bash
   python -m venv .venv
   ```
3. Activate the virtual environment:
   - Linux/macOS: `source .venv/bin/activate`
   - Windows PowerShell: `.\.venv\Scripts\Activate.ps1`
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Configure your Gemini API Key:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Set your API key inside `.env`:
     `GEMINI_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY`
6. Start the app:
   ```bash
   python app.py
   ```
7. Open in browser:
   `http://127.0.0.1:8080`

## Google Cloud Run Deployment

Build and deploy the container with Google Cloud. Store the Gemini API key as a Secret Manager secret or another secure runtime secret; do not expose it in frontend JavaScript or commit it to Git.

```bash
gcloud run deploy ai-student-assistant --source . --set-env-vars GEMINI_API_KEY="YOUR_KEY"
```

