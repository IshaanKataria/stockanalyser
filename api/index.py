import os
import json
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from openai import AsyncOpenAI

app = FastAPI()

SYSTEM_PROMPT = """You are a senior financial analyst. Analyse the provided text and return a structured JSON response.

Your response MUST be valid JSON with exactly these fields:
{
  "summary": "2-3 sentence executive summary of the text",
  "sentiment": {
    "score": <float from -1.0 (very bearish) to 1.0 (very bullish)>,
    "label": "<Strongly Bearish | Bearish | Slightly Bearish | Neutral | Slightly Bullish | Bullish | Strongly Bullish>"
  },
  "insights": ["key insight 1", "key insight 2", ...],
  "risks": ["risk factor 1", "risk factor 2", ...],
  "catalysts": ["potential catalyst 1", "potential catalyst 2", ...],
  "action": "suggested action or consideration (NOT financial advice, frame as informational)",
  "confidence": <float from 0.0 to 1.0 indicating how confident you are in this analysis>
}

Guidelines:
- Be specific and actionable in insights
- Identify both explicit and implicit risks
- Look for forward-looking statements and catalysts
- Score sentiment based on the overall tone and implications
- If the text is not financial in nature, still analyse it for sentiment and key takeaways
- Keep insights concise but substantive (1-2 sentences each)
- Aim for 3-6 insights, 2-4 risks, and 2-4 catalysts
- Return ONLY the JSON object, no markdown formatting"""

ANALYSIS_TYPE_PROMPTS = {
    "general": "Analyse this text for investment-relevant insights:",
    "earnings": "This is an earnings call transcript or report. Focus on revenue, margins, guidance, and management commentary:",
    "news": "This is a news article. Focus on market impact, affected sectors, and potential price catalysts:",
}


def get_client():
    return AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])


class AnalyseRequest(BaseModel):
    text: str
    analysis_type: str = "general"


@app.post("/api/analyse")
async def analyse(req: AnalyseRequest):
    if not req.text.strip():
        raise HTTPException(400, "Text cannot be empty")
    if len(req.text) > 100_000:
        raise HTTPException(400, "Text too long (max ~100k characters)")
    if req.analysis_type not in ("general", "earnings", "news"):
        raise HTTPException(400, "Invalid analysis_type")

    type_prompt = ANALYSIS_TYPE_PROMPTS.get(req.analysis_type, ANALYSIS_TYPE_PROMPTS["general"])
    word_count = len(req.text.split())

    try:
        client = get_client()
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"{type_prompt}\n\n{req.text}"},
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        result = json.loads(response.choices[0].message.content)
        result["word_count"] = word_count
        result["timestamp"] = datetime.now(timezone.utc).isoformat()
        result["analysis_type"] = req.analysis_type
        return result
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {e}")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
