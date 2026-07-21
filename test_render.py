#!/usr/bin/env python
"""
Test the render function with various chart types.
"""

import sys
import os

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from caesar.render import render_slide

def test_render_chart_types():
    print("Testing render_chart_types...")
    # Test data for each chart type
    test_specs = [
        {
            "title": "Title Slide",
            "chart_type": "title",
            "data": {},
            "source_label": "Test Source",
            "notes": "This is a title slide."
        },
        {
            "title": "Text Slide",
            "chart_type": "text",
            "data": {"content": "This is a sample text.\nWith multiple lines."},
            "source_label": "Test Source",
            "notes": "Notes for text slide."
        },
        {
            "title": "Table Slide",
            "chart_type": "table",
            "data": {
                "headers": ["Name", "Value"],
                "rows": [
                    ["A", 10],
                    ["B", 20],
                    ["C", 30]
                ]
            },
            "source_label": "Test Source",
            "notes": "Table showing some values."
        },
        {
            "title": "Bar Chart",
            "chart_type": "bar",
            "data": {
                "labels": ["Q1", "Q2", "Q3", "Q4"],
                "datasets": [
                    {
                        "label": "Sales",
                        "data": [100, 150, 130, 170]
                    }
                ]
            },
            "source_label": "Test Source",
            "notes": "Bar chart of quarterly sales."
        },
        {
            "title": "Line Chart",
            "chart_type": "line",
            "data": {
                "labels": ["Jan", "Feb", "Mar", "Apr"],
                "datasets": [
                    {
                        "label": "Temperature",
                        "data": [5, 10, 15, 20]
                    }
                ]
            },
            "source_label": "Test Source",
            "notes": "Line chart of monthly temperature."
        },
        {
            "title": "Pie Chart",
            "chart_type": "pie",
            "data": {
                "labels": ["Apples", "Bananas", "Cherries"],
                "datasets": [
                    {
                        "label": "Fruit Distribution",
                        "data": [30, 45, 25]
                    }
                ]
            },
            "source_label": "Test Source",
            "notes": "Pie chart of fruit inventory."
        }
    ]

    for spec in test_specs:
        print(f"\nRendering: {spec['title']} ({spec['chart_type']})")
        try:
            path = render_slide(spec)
            print(f"  Saved to: {path}")
            # Check that file exists and is not empty
            if os.path.exists(path) and os.path.getsize(path) > 0:
                print(f"  File size: {os.path.getsize(path)} bytes")
            else:
                print(f"  ERROR: File missing or empty!")
        except Exception as e:
            print(f"  ERROR: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_render_chart_types()
    print("\n\nRender tests completed.")