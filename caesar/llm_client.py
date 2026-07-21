import os
import json
from typing import Dict, Any
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

# Get configuration from environment
provider = os.getenv("LLM_PROVIDER", "openrouter")
api_key = os.getenv("LLM_API_KEY", "")
model = os.getenv("LLM_MODEL", "meta-llama/llama-3.3-70b-instruct:free")

# Set base URL based on provider
if provider == "openrouter":
    base_url = "https://openrouter.ai/api/v1"
elif provider == "grok":
    base_url = "https://api.x.ai/v1"
elif provider == "nvidia":
    base_url = "https://integrate.api.nvidia.com/v1"
else:
    # Default to OpenRouter if unknown
    base_url = "https://openrouter.ai/api/v1"

# Initialize the OpenAI client (works with any OpenAI-compatible API)
client = OpenAI(
    api_key=api_key,
    base_url=base_url,
) if api_key else None

def parse_intent(text: str) -> Dict[str, Any]:
    """
    Parse user intent from natural language text.

    Args:
        text: User's spoken or typed input

    Returns:
        Dictionary with keys: intent, metric, time_range, filters
        If LLM is not configured or fails, returns a fallback response.
    """
    if not client:
        # Fallback when no LLM configured
        return {
            "intent": "unknown",
            "metric": None,
            "time_range": None,
            "filters": {},
            "confidence": "low",
            "error": "LLM not configured"
        }

    prompt = f"""
    Extract the intent, metric, time range, and filters from the following user request.
    Return ONLY a JSON object with the following keys:
    - intent: string (e.g., "show_sales", "show_customers", "show_feedback")
    - metric: string or null (e.g., "revenue", "count", "average_rating")
    - time_range: string or null (e.g., "Q3 2023", "2024", "January 2024")
    - filters: object with optional keys like "region", "category", etc.

    User request: "{text}"

    Examples:
    - "show me Q3 revenue" -> {{"intent": "show_sales", "metric": "revenue", "time_range": "Q3 2023", "filters": {{}}}}
    - "customer count in the North region" -> {{"intent": "show_customers", "metric": "count", "time_range": null, "filters": {{"region": "North"}}}}
    - "average feedback score for Electronics in 2024" -> {{"intent": "show_feedback", "metric": "average_rating", "time_range": "2024", "filters": {{"category": "Electronics"}}}}

    If you cannot determine the intent, set intent to "unknown" and confidence to "low".
    """

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an assistant that extracts structured intent from user queries about business data. Respond only with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=200
        )

        result = response.choices[0].message.content.strip()
        # Try to parse the JSON response
        parsed = json.loads(result)
        # Ensure all expected keys are present
        expected_keys = ["intent", "metric", "time_range", "filters"]
        for key in expected_keys:
            if key not in parsed:
                parsed[key] = None if key != "filters" else {}
        # Add confidence if not present
        if "confidence" not in parsed:
            parsed["confidence"] = "high" if parsed.get("intent") != "unknown" else "low"
        return parsed
    except Exception as e:
        # Fallback in case of error
        return {
            "intent": "unknown",
            "metric": None,
            "time_range": None,
            "filters": {},
            "confidence": "low",
            "error": str(e)
        }

def generate_slide_spec(grounded_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a slide specification based on grounded data from the database.

    Args:
        grounded_data: Dictionary containing the data retrieved from the database
                      and any metadata about the query.

    Returns:
        Dictionary representing the slide spec with keys:
        - title: string
        - chart_type: string (e.g., "bar", "line", "pie", "table")
        - data: dict or list suitable for the chart type
        - source_label: string (e.g., "Sales DB · Q3 2023")
        - notes: optional string for additional context
    """
    if not client:
        # Fallback when no LLM configured - return a simple spec
        return {
            "title": "Data Unavailable",
            "chart_type": "text",
            "data": {"message": "LLM not configured to generate slide specifications"},
            "source_label": "System",
            "notes": "Configure LLM provider in .env file to enable slide generation."
        }

    # Extract relevant information from grounded_data
    # The grounded_data should contain the query results and metadata
    # For now, we assume it has at least:
    # - 'query_type': from intent
    # - 'results': the data rows
    # - 'time_range': from intent
    # - 'filters': from intent

    query_type = grounded_data.get("intent", "unknown")
    results = grounded_data.get("results", [])
    time_range = grounded_data.get("time_range", "")
    filters = grounded_data.get("filters", {})

    prompt = f"""
    Based on the following query results, generate a specification for a PowerPoint slide.
    Return ONLY a JSON object with the following keys:
    - title: string (title for the slide)
    - chart_type: string (one of: "bar", "line", "pie", "table", "text")
    - data: object or array suitable for the chart_type
        - For "bar"/"line": {{"labels": [...], "datasets": [{{"label": "...", "data": [...}}]}}
        - For "pie": {{"labels": [...], "data": [...]}}
        - For "table": {{"headers": [...], "rows": [[...], ...]}}
        - For "text": {{"content": "..."}}
    - source_label: string indicating the data source (e.g., "Sales DB · Q3 2023")
    - notes: optional string for additional context

    Query type: {query_type}
    Time range: {time_range}
    Filters: {json.dumps(filters)}
    Results: {json.dumps(results[:10])}  // showing first 10 rows for brevity

    Guidelines:
    - Choose chart type appropriate for the data and query intent.
    - For revenue/sales over time, use line or bar chart.
    - For category breakdowns, use bar or pie chart.
    - For raw data listing, use table.
    - For single values or text insights, use text.
    - Make sure the data format matches the chart_type.
    """

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an assistant that converts data query results into slide specifications. Respond only with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=500
        )

        result = response.choices[0].message.content.strip()
        parsed = json.loads(result)
        # Validate that we have the required keys
        required_keys = ["title", "chart_type", "data", "source_label"]
        for key in required_keys:
            if key not in parsed:
                raise ValueError(f"Missing key in LLM response: {key}")
        return parsed
    except Exception as e:
        # Fallback: create a simple table or text slide
        return {
            "title": f"Results for {query_type}",
            "chart_type": "table" if results and isinstance(results, list) else "text",
            "data": {
                "headers": ["Result"] if not (results and isinstance(results, list)) else (list(results[0].keys()) if results and isinstance(results[0], dict) else ["Column"]),
                "rows": [[str(v) for v in r.values()] if isinstance(r, dict) else [str(r)] for r in (results if isinstance(results, list) else [{"value": str(results)}])]
            } if results and isinstance(results, list) else {"content": str(results)},
            "source_label": "Database Query",
            "notes": f"Fallback due to LLM error: {str(e)}"
        }