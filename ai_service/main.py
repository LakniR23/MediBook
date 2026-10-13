"""
FastAPI application for MediBook AI Search Service with Interactive Swagger / OpenAPI Documentation.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import SearchQueryRequest, SearchQueryResponse
from parser import parse_query

tags_metadata = [
    {
        "name": "Health",
        "description": "Liveness and service status monitoring.",
    },
    {
        "name": "Natural Language Query Parsing",
        "description": "Transforms plain-English requests into validated JSON appointment filters via Groq LLaMA 3.3 or deterministic NLP.",
    },
]

app = FastAPI(
    title="MediBook AI Query Parser Service API",
    description="""
### MediBook AI Search Microservice

This microservice enables natural language clinical appointment searching.
- **Interactive Swagger UI**: `/docs`
- **ReDoc Documentation**: `/redoc`
- **OpenAPI Schema**: `/openapi.json`

#### Key Capabilities:
- Parses complex queries like *"cancelled appointments with Dr. Perera next week"*
- Extracts doctor names, appointment statuses, appointment types, and ISO 8601 UTC date bounds
- Backed by Groq Cloud (LLaMA 3.3 70B) with automatic fallback to local deterministic NLP
    """,
    version="1.0.0",
    openapi_tags=tags_metadata,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Allow Next.js frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"], summary="Root service discovery")
def root():
    return {
        "service": "MediBook AI Search Parser",
        "status": "healthy",
        "version": "1.0.0",
        "swagger_docs": "/docs",
        "redoc": "/redoc",
        "openapi_json": "/openapi.json",
    }


@app.get("/health", tags=["Health"], summary="Health check endpoint")
def health_check():
    return {"status": "ok", "service": "medibook-ai-service"}


@app.post(
    "/parse-search",
    response_model=SearchQueryResponse,
    tags=["Natural Language Query Parsing"],
    summary="Parse natural language search query",
    description="Accepts a plain English query and an optional reference timestamp, returning structured Pydantic-validated search filters.",
)
def parse_search(request: SearchQueryRequest):
    """
    Parses a natural language query into validated appointment search filters.
    Example: 'cancelled appointments with Dr. Perera next week'
    """
    try:
        if not request.query.strip():
            raise HTTPException(status_code=400, detail="Search query cannot be empty")
        return parse_query(request.query, request.referenceDate)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse query: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
