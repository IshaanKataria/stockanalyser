StockAnalyser - AI-Powered Text Analysis Tool

Overview
StockAnalyser is a web-based tool that takes user-provided text (financial reports, news articles, earnings calls, market commentary) and uses OpenAI's GPT models to generate structured investment insights, sentiment analysis, and actionable summaries.

Problem
Manually reading and synthesising financial text (10-Ks, earnings transcripts, analyst notes, news) is time-consuming. Investors and analysts need a fast way to extract key signals, sentiment, and actionable takeaways from raw text.

Target Users
- Retail investors analysing company news
- Finance students studying market dynamics
- Quant-curious developers building analysis workflows
- Anyone who wants quick AI-powered insights from financial text

Core Features

1. Text Input
   - Large textarea for pasting text (articles, reports, transcripts)
   - Support for long-form text (up to ~15,000 words / GPT context limit)
   - Clear/reset functionality

2. AI Analysis Engine
   - Powered by OpenAI GPT-4o-mini (cost-effective, fast)
   - Structured output with:
     a. Executive Summary (2-3 sentences)
     b. Sentiment Score (-1.0 to +1.0 with label: Bearish/Neutral/Bullish)
     c. Key Insights (bullet points)
     d. Risk Factors identified
     e. Potential Catalysts identified
     f. Suggested Action (informational only, not financial advice)

3. Visual Dashboard
   - Sentiment gauge/meter visualisation
   - Key metrics cards (sentiment, word count, analysis confidence)
   - Clean, professional dark-theme UI

4. Analysis History
   - Store past analyses in browser localStorage
   - View/compare previous analyses
   - Export analysis as JSON

Tech Stack
- Backend: Python + FastAPI
- Frontend: Vanilla HTML/CSS/JS (no framework overhead)
- AI: OpenAI API (gpt-4o-mini)
- Charts: Native CSS/SVG (no chart library needed for gauge)
- Deployment: Local-first, single command startup

Architecture
- Single FastAPI server serving both API and static frontend
- POST /api/analyse endpoint accepts text, returns structured JSON
- GET /api/health for status checks
- Static files served from /static directory
- .env file for API key management

Non-Goals (v1)
- Real-time market data feeds
- Stock price charts or historical data
- User authentication
- Database persistence (localStorage is sufficient)
- File upload (PDF parsing etc.) - text paste only for v1

Success Metrics
- Analysis returned in under 10 seconds
- Clean, readable output formatting
- Works reliably with texts from 100 to 15,000 words

API Contract

POST /api/analyse
Request: { "text": "string", "analysis_type": "general" | "earnings" | "news" }
Response:
{
  "summary": "string",
  "sentiment": { "score": float, "label": "string" },
  "insights": ["string"],
  "risks": ["string"],
  "catalysts": ["string"],
  "action": "string",
  "confidence": float,
  "word_count": int,
  "timestamp": "ISO 8601"
}

File Structure
stockanalyser/
  .env                  (OPENAI_API_KEY - gitignored)
  .gitignore
  pyproject.toml
  README.md
  src/
    main.py             (FastAPI app + routes)
    analyser.py         (OpenAI integration + prompt engineering)
  static/
    index.html          (Single page app)
    style.css           (Dark theme styling)
    app.js              (Frontend logic)
