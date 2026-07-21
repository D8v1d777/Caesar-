import sqlite3
import json
from typing import Dict, Any, List, Tuple, Optional

def get_db_connection():
    """Get a connection to the SQLite database."""
    conn = sqlite3.connect('data/caesar.db')
    # Return rows as dictionaries for easier handling
    conn.row_factory = sqlite3.Row
    return conn

def build_query(intent_dict: Dict[str, Any]) -> Tuple[str, List[Any]]:
    """
    Build a parameterized SQL query based on the intent dictionary.

    Args:
        intent_dict: Output from parse_intent containing intent, metric, time_range, filters

    Returns:
        Tuple of (SQL query string, list of parameters)
    """
    intent = intent_dict.get("intent")
    metric = intent_dict.get("metric")
    time_range = intent_dict.get("time_range")
    filters = intent_dict.get("filters", {})

    # Default values
    select_clause = "*"
    from_clause = ""
    where_conditions = []
    params = []

    # Determine table and base query based on intent
    if intent == "show_sales":
        from_clause = "FROM sales"
        # Default to sum of amount if metric is revenue or not specified
        if metric == "revenue" or metric is None:
            select_clause = "SUM(amount) as value"
        elif metric == "count":
            select_clause = "COUNT(*) as value"
        elif metric == "average":
            select_clause = "AVG(amount) as value"
        else:
            # Default to sum
            select_clause = "SUM(amount) as value"

        # Handle time_range: could be quarter, year, month
        if time_range:
            # Expected format: "Q1 2023" or "2023" or "January 2023"
            # We'll parse simply: if contains Q, split by space
            if "Q" in time_range.upper():
                parts = time_range.split()
                if len(parts) == 2:
                    quarter = parts[0].upper()  # Q1, Q2, etc.
                    year = parts[1]
                    where_conditions.append("quarter = ? AND year = ?")
                    params.extend([quarter, year])
            else:
                # Assume it's a year
                try:
                    year = int(time_range)
                    where_conditions.append("year = ?")
                    params.append(year)
                except ValueError:
                    pass  # ignore if not a valid year

    elif intent == "show_customers":
        from_clause = "FROM customers"
        if metric == "count" or metric is None:
            select_clause = "COUNT(*) as value"
        else:
            # For other metrics, we might need to join or count distinct
            # For simplicity, default to count
            select_clause = "COUNT(*) as value"

        # Time range: customers don't have a direct time field, but we have signup_date
        if time_range:
            # We'll interpret time_range as a year for signup_date
            try:
                year = int(time_range)
                where_conditions.append("strftime('%Y', signup_date) = ?")
                params.append(str(year))
            except ValueError:
                pass

    elif intent == "show_feedback":
        from_clause = "FROM feedback"
        if metric == "average_rating" or metric is None:
            select_clause = "AVG(rating) as value"
        elif metric == "count":
            select_clause = "COUNT(*) as value"
        else:
            # Default to average rating
            select_clause = "AVG(rating) as value"

        # Time range: feedback has created_at
        if time_range:
            # Try to extract year
            try:
                year = int(time_range)
                where_conditions.append("strftime('%Y', created_at) = ?")
                params.append(str(year))
            except ValueError:
                # Maybe it's a quarter like "Q1 2024"
                if "Q" in time_range.upper():
                    parts = time_range.split()
                    if len(parts) == 2:
                        quarter = parts[0].upper()
                        year = parts[1]
                        # We need to check quarter from a date; we'll approximate by month
                        # For simplicity, we'll ignore quarter for now and just use year
                        where_conditions.append("strftime('%Y', created_at) = ?")
                        params.append(year)
            except:
                pass
    else:
        # Unknown intent: return a query that will return no rows
        return "SELECT 0 as value WHERE 1=0", []

    # Add filters from the intent_dict
    # Filters are additional constraints like region, category, etc.
    for key, value in filters.items():
        if key == "region":
            # Check which table we are querying from to see if it has region column
            if "sales" in from_clause or "customers" in from_clause:
                where_conditions.append(f"{key} = ?")
                params.append(value)
        elif key == "category":
            if "sales" in from_clause or "feedback" in from_clause:
                where_conditions.append(f"{key} = ?")
                params.append(value)
        elif key == "plan_type":
            if "customers" in from_clause:
                where_conditions.append(f"{key} = ?")
                params.append(value)
        elif key == "status":
            if "customers" in from_clause:
                where_conditions.append(f"{key} = ?")
                params.append(value)
        elif key == "rating":
            if "feedback" in from_clause:
                # rating is integer
                try:
                    val = int(value)
                    where_conditions.append(f"{key} = ?")
                    params.append(val)
                except ValueError:
                    pass
        # Add more filters as needed

    # Build the final query
    where_clause = "WHERE " + " AND ".join(where_conditions) if where_conditions else ""
    query = f"SELECT {select_clause} {from_clause} {where_clause}"

    return query, params

def execute_query(query: str, params: List[Any]) -> List[Dict[str, Any]]:
    """
    Execute a parameterized query and return results as a list of dicts.

    Args:
        query: SQL query string with placeholders
        params: List of parameters for the query

    Returns:
        List of dictionaries representing the rows
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        # Convert rows to list of dicts
        result = [dict(row) for row in rows]
        return result
    except Exception as e:
        print(f"Database error: {e}")
        return []
    finally:
        if conn:
            conn.close()

def get_grounded_data(intent_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get grounded data from the database based on the intent.

    Args:
        intent_dict: Output from parse_intent

    Returns:
        Dictionary containing the query results and metadata.
        If no data is available, returns {"status": "unavailable"}.
    """
    query, params = build_query(intent_dict)
    results = execute_query(query, params)

    if not results:
        # No data found
        return {
            "status": "unavailable",
            "query": query,
            "parameters": params,
            "intent": intent_dict.get("intent"),
            "message": "No data available for the given query."
        }

    # If we have data, return it along with the original intent info
    return {
        "status": "available",
        "query": query,
        "parameters": params,
        "intent": intent_dict.get("intent"),
        "metric": intent_dict.get("metric"),
        "time_range": intent_dict.get("time_range"),
        "filters": intent_dict.get("filters", {}),
        "results": results
    }

# For testing
if __name__ == "__main__":
    # Test the functions
    test_intents = [
        {"intent": "show_sales", "metric": "revenue", "time_range": "Q1 2023", "filters": {}},
        {"intent": "show_sales", "metric": "count", "time_range": "2023", "filters": {"region": "North"}},
        {"intent": "show_customers", "metric": "count", "time_range": "2022", "filters": {}},
        {"intent": "show_feedback", "metric": "average_rating", "time_range": "2024", "filters": {"category": "Electronics"}},
        {"intent": "unknown", "metric": None, "time_range": None, "filters": {}},
    ]

    for intent in test_intents:
        print(f"\nTesting intent: {intent}")
        data = get_grounded_data(intent)
        print(f"Result: {json.dumps(data, indent=2, default=str)}")