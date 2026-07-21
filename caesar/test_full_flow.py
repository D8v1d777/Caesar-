#!/usr/bin/env python
"""
Test the full flow: parse intent -> ground data -> generate spec -> render slide.
"""

import sys
import os
import json

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from caesar.llm_client import parse_intent
from caesar.data_access import get_grounded_data
from caesar.llm_client import generate_slide_spec
from caesar.render import render_slide

def test_full_flow():
    print("Testing full flow with sample queries...")
    test_queries = [
        "show me Q3 revenue",
        "customer count in the North region",
        "average feedback score for Electronics in 2024",
        "what is the total sales for 2023?",
        "show all customers",
    ]

    for query in test_queries:
        print(f"\n=== Query: {query} ===")
        # Step 1: Parse intent
        intent = parse_intent(query)
        print(f"Parsed intent: {json.dumps(intent, indent=2)}")

        # Step 2: Ground data
        grounded = get_grounded_data(intent)
        print(f"Grounded data status: {grounded.get('status')}")
        if grounded.get("status") == "available":
            print(f"Number of results: {len(grounded.get('results', []))}")
        else:
            print(f"Message: {grounded.get('message')}")

        # Step 3: Generate slide spec
        spec = generate_slide_spec(grounded)
        print(f"Generated spec: {json.dumps(spec, indent=2)}")

        # Step 4: Render slide (only if we have data, otherwise we can still render a placeholder)
        try:
            output_path = render_slide(spec, grounded)
            print(f"Slide saved to: {output_path}")
        except Exception as e:
            print(f"Error rendering slide: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_full_flow()
    print("\n\nAll tests completed.")