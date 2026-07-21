fcc-# Caesar Code Review — Fix Plan

## High Priority Fixes

### 1. BLOCKER: Fix broken download button (frontend/index.html)
- **Problem**: `window.btoa(fetch(...))` passes a Promise, not binary data
- **Fix**: Add a `/download/{filename}` endpoint to the API that serves the generated PPTX file, then update the frontend to fetch from that URL

### 2. HIGH: Fix `query_type` key mismatch (caesar/llm_client.py)
- **Problem**: `grounded_data.get("query_type", "unknown")` — key is `"intent"` not `"query_type"`
- **Fix**: Change to `grounded_data.get("intent", "unknown")`

### 3. HIGH: Feedback table — non-existent `category` column (data_access.py + seed_db.py)
- **Problem**: Code filters feedback by `category` but the feedback table has no such column
- **Fix**: Add `category` column to feedback table in seed_db.py

## Medium Priority Fixes

### 4. Remove duplicate API files
- Remove `api.py` (root level) — orphaned, `main.py` imports from `caesar.api`
- Remove `desktop_app.py` — contains Flask reference, dead code

### 5. Remove orphan Tauri artifacts
- Remove `caesar/src-tauri/` directory (from rejected Rust stack)

### 6. Lazy-load Whisper model (caesar/stt.py)
- **Problem**: ~1GB model loads at import time
- **Fix**: Use lazy loading with a module-level cache

## Low Priority Fixes

### 7. Fix "Electics" typo (caesar/llm_client.py)
- Change `"Electics"` to `"Electronics"` in LLM prompt example

### 8. Fix "test_generate_sleep_spec" typo (test_llm_client.py)
- Change function name to `test_generate_slide_spec`

