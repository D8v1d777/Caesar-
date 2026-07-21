#!/usr/bin/env python
"""
Test script for the llm_client module.
"""

import sys
import os

# Add the current directory to the path so we can import caesar
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from caesar.llm_client import parse_intent, generate_slide_spec

def test_parse_intent():
    print("Testing parse_intent...")
    test_cases = [
        "show me Q3 revenue",
        "customer count in the North region",
        "average feedback score for Electronics in 2024",
        "what is the total sales for 2023?",
        "show all customers",
    ]

    for text in test_cases:
        print(f"\nInput: {text}")
        result = parse_intent(text)
        print(f"Output: {json.dumps(result, indent=2)}")

def test_generate_slide_spec():
    print("\n\nTesting generate_slide_spec...")
    # Sample grounded data
    test_cases = [
        {
            "query_type": "show_sales",
            "results": [
                {"quarter": "Q1", "amount": 10000},
                {"quarter": "Q2", "amount": 15000},
                {"quarter": "Q3", "amount": 12000},
                {"quarter": "Q4", "amount": 18000}
            ],
            "time_range": "2023",
            "filters": {}
        },
        {
            "query_type": "show_customers",
            "results": [
                {"region": "North", "count": 50},
                {"region": "South", "count": 30},
                {"region": "East", "count": 40},
                {"region": "West", "count": 35}
            ],
            "time_range": "2024",
            "filters": {}
        },
        {
            "query_type": "show_feedback",
            "results": [
                {"rating": 5, "comment": "Excellent"},
                {"rating": 4, "comment": "Good"},
                {"rating": 3, "comment": "Average"},
                {"rating": 2, "comment": "Poor"},
                {"rating": 1, "comment": "Very Poor"}
            ],
            "time_range": "Q1 2024",
            "filters": {"category": "Electronics"}
        }
    ]

    for data in test_cases:
        print(f"\nInput: {json.dumps(data, indent=2)}")
        result = generate_slide_spec(data)
        print(f"Output: {json.dumps(result, indent=2)}")

if __name__ == "__main__":
    import json
    test_parse_intent()
    test_generate_slide_spec()
    print("\n\nTests completed.")