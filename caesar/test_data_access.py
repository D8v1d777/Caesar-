#!/usr/bin/env python
"""
Test script for the data_access module.
"""

import sys
import os

# Add the project root to the path so we can import caesar as a package
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from caesar.data_access import get_grounded_data, build_query

def test_build_query():
    print("Testing build_query...")
    test_cases = [
        {"intent": "show_sales", "metric": "revenue", "time_range": "Q1 2023", "filters": {}},
        {"intent": "show_sales", "metric": "count", "time_range": "2023", "filters": {"region": "North"}},
        {"intent": "show_customers", "metric": "count", "time_range": "2022", "filters": {}},
        {"intent": "show_feedback", "metric": "average_rating", "time_range": "2024", "filters": {"category": "Electronics"}},
        {"intent": "unknown", "metric": None, "time_range": None, "filters": {}},
    ]

    for intent in test_cases:
        print(f"\nInput: {json.dumps(intent, indent=2)}")
        query, params = build_query(intent)
        print(f"Query: {query}")
        print(f"Params: {params}")

def test_get_grounded_data():
    print("\n\nTesting get_grounded_data...")
    test_cases = [
        {"intent": "show_sales", "metric": "revenue", "time_range": "Q1 2023", "filters": {}},
        {"intent": "show_sales", "metric": "count", "time_range": "2023", "filters": {"region": "North"}},
        {"intent": "show_customers", "metric": "count", "time_range": "2022", "filters": {}},
        {"intent": "show_feedback", "metric": "average_rating", "time_range": "2024", "filters": {"category": "Electronics"}},
        {"intent": "unknown", "metric": None, "time_range": None, "filters": {}},
    ]

    for intent in test_cases:
        print(f"\nInput: {json.dumps(intent, indent=2)}")
        data = get_grounded_data(intent)
        print(f"Result: {json.dumps(data, indent=2, default=str)}")

if __name__ == "__main__":
    import json
    test_build_query()
    test_get_grounded_data()
    print("\n\nTests completed.")