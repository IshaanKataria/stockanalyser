import os
from pathlib import Path
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from openai import AsyncOpenAI
from pydantic import BaseModel

from analyser import analyse_text

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


@asynccontextmanager
async def lifespan(app: FastAPI):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set in .env")
    app.state.openai_client = AsyncOpenAI(api_key=api_key)
    yield


app = FastAPI(title="StockAnalyser", lifespan=lifespan)


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

    try:
        result = await analyse_text(app.state.openai_client, req.text, req.analysis_type)
        return result
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {e}")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


static_dir = Path(__file__).resolve().parent.parent / "static"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/")
async def root():
    return FileResponse(str(static_dir / "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
