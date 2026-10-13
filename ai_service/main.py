"""
FastAPI application for MediBook AI Search Service.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import SearchQueryRequest, SearchQueryResponse
from parser import parse_query

app = FastAPI(
    title="MediBook AI Query Parser Service",
    description="Microservice for extracting structured medical appointment filters from natural language queries.",
    version="1.0.0",
)

# Allow Next.js frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "service": "MediBook AI Search Parser",
        "status": "healthy",
        "version": "1.0.0",
        "endpoints": ["/health", "/parse-search"],
    }


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "medibook-ai-service"}


@app.post("/parse-search", response_model=SearchQueryResponse)
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
