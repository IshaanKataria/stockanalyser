StockAnalyser

AI-powered text analysis tool that generates structured financial insights from any text input using OpenAI.

Paste in earnings reports, news articles, financial transcripts, or any text -- get back sentiment analysis, key insights, risk factors, catalysts, and actionable summaries.

Setup

```bash
cp .env.example .env
# Add your OpenAI API key to .env

uv sync
```

Run

```bash
cd src && uv run python3 main.py
```

Then open http://localhost:8000

Features

- Sentiment analysis with visual gauge (-1.0 bearish to +1.0 bullish)
- Executive summaries, key insights, risks, and catalysts
- Three analysis modes: General, Earnings, News
- Analysis history stored in browser (localStorage)
- Export history as JSON
- Copy results to clipboard
- Dark theme UI
- Cmd/Ctrl+Enter to submit

Tech Stack

- Python + FastAPI (backend)
- Vanilla HTML/CSS/JS (frontend)
- OpenAI GPT-4o-mini (analysis engine)

Not financial advice. Always do your own research.
