# CAESAR — Data-Grounded Live Presentation Generator
### v0.1 Prototype Spec — Python-only, zero-budget, Windows desktop app

---

## ⚠️ READ THIS FIRST — AGENT OPERATING RULES

You (the AI agent — Claude Code or equivalent) are rebuilding this project. A prior
attempt (by a different AI, on a different stack — Tauri/Rust/Go/TypeScript/PostgreSQL)
may exist in this repo. **That stack is rejected.** Your job includes tearing down
anything that doesn't match Section 3 below, not just adding new code on top of it.

These rules govern how you work for the entire duration of this build:

1. **Single source of truth.** This file is the spec. If something you find in the
   existing repo conflicts with this file, this file wins — delete or rewrite the
   conflicting code. Do not preserve old-stack code "just in case."
2. **Closed scope.** Build only what Section 5 (Build Phases) lists. If a feature,
   integration, or output format isn't named in this document, it does not exist in
   v0.1. Do not add it, even if it seems like an obvious improvement.
3. **No invented facts.** Never state that a package, API, or method exists/behaves
   a certain way unless you've verified it (installed docs, `pip show`, official
   docs, or a successful local test). If you're not sure, say so in a code comment
   and implement the simplest version that satisfies the acceptance criteria —
   don't guess at an API signature.
4. **No fabricated data, ever.** Every number that ends up on a slide must trace back
   to a row in the SQLite database. If a query returns nothing, the slide must show
   `[DATA UNAVAILABLE]`, never a plausible-looking placeholder number.
5. **One language.** Python only, end to end, per Section 3. If you're about to
   reach for Node.js, Go, Rust, or a JS build step, stop — that means you're
   drifting from spec.
6. **Work the loop in Section 4 exactly.** Don't reorder phases, don't skip
   "Verify" steps, don't batch multiple phases into one pass without checking
   acceptance criteria first.
7. **When genuinely blocked** (missing credential, ambiguous requirement with no
   safe default, a listed package that doesn't exist) — stop and report the exact
   blocker in plain terms. Don't silently substitute something else.

This is a prototype meant to prove one thing: **speech or text → real database
query → accurate, well-designed slide, packaged as a Windows app.** Everything
else is secondary. Keep the core loop bulletproof before touching polish.

---

## 0.1 Decisions Finalized (do not re-ask the user these)

- **Input:** both voice (faster-whisper) and text, from day one.
- **LLM provider:** OpenRouter, default model `meta-llama/llama-3.3-70b-instruct:free`
  in `.env`. Keep the code provider-swappable per Section 3.1 — don't hardcode
  OpenRouter-only logic.
- **Mock data domain:** generic SaaS (MRR, churn, subscriptions, customer
  feedback) — this is what Phase 1's seed data must model.
- **AI behavior on ambiguity:** best-guess + one-sentence explanation ("I
  assumed you meant revenue — here's the slide"), never a blocking clarifying
  question, never silent unexplained guessing.
- **Platform:** Windows `.exe` only for v0.1. Do not build cross-platform
  packaging now.
- **Ownership:** one agent (you) builds this end to end, following this file
  and `PROJECT_BRIEFING.md`. Do not split scaffolding and detail work across
  tools — that reintroduces the drift this document exists to prevent.

## 0.2 Frontend Bar — this is a requirement, not a suggestion

The person building this has explicitly asked for a frontend on par with the
best Claude-built UIs other developers are showing off — not a "good enough for
a prototype" placeholder. Section 6's design brief (palette, type system, the
"grounding pulse" signature moment) is not optional polish to cut if time is
short. Before writing any frontend code:

- Actually follow the brainstorm → plan → critique → build → critique-again
  process for the UI, the same way you would for a paid design client. Don't
  jump straight to code from the palette/type table in Section 6 — those are
  ingredients, not the finished plan.
- The "grounding pulse" (a value glowing gold with its source tag fading in as
  it's placed on the slide) is the one moment worth spending real craft on.
  Everything else in the UI should be quiet and disciplined around it, not
  competing with it.
- Do not default to a generic dark-mode SaaS dashboard look. If what you're
  about to build would look at home as a generic AI-startup landing page
  template, stop and revise — the palette and signature element in Section 6
  exist specifically to avoid that.
- Typography, spacing, and motion all need the same intentionality as the
  backend logic. A technically-correct UI that looks templated does not meet
  this bar.

## 1. What This Is

Caesar takes a spoken or typed business update ("show me Q3 revenue and customer
sentiment") and turns it into a real, data-grounded slide — pulling actual numbers
from a local database instead of letting a model invent them. Output is a `.pptx`
file. The whole thing runs as one Windows desktop app, built entirely in Python.

**Core principle:** the user speaks or types → the database answers → a template
renders it → nothing is invented.

---

## 2. Rework Directive (for the existing repo)

If a previous build exists in this workspace:

- [ ] Inventory what's there first — list every file/folder before deleting anything.
- [ ] Anything under a Rust/Go/TypeScript/Tauri/PostgreSQL/Metabase/Deepgram/Keynote
      surface is **out of scope** for v0.1 — remove it or clearly quarantine it in an
      `/archive` folder, don't leave it wired into the running app.
- [ ] Salvage-worthy concepts to carry forward (re-implement in Python, don't copy
      code across languages): the "no synthetic data" rule, the `[DATA UNAVAILABLE]`
      placeholder behavior, and source-tagging every number on a slide with where it
      came from. These are good ideas — reimplement them in this stack.
- [ ] Do not attempt to keep both stacks running side by side "for compatibility."
      Pick this one. Fully.

---

## 3. Tech Stack (Python-only, all free or free-tier)

| Layer | Tool | Install | Notes |
|---|---|---|---|
| Backend/API | FastAPI + uvicorn | `pip install fastapi uvicorn --break-system-packages` | local HTTP server, no cloud |
| Speech-to-text | faster-whisper | `pip install faster-whisper --break-system-packages` | fully local, offline, free forever |
| Database | SQLite (stdlib `sqlite3`) | none needed | single file, zero setup |
| LLM client | `openai` SDK, pointed at a swappable provider | `pip install openai python-dotenv --break-system-packages` | see Section 3.1 |
| Slide rendering | python-pptx | `pip install python-pptx --break-system-packages` | generates the actual .pptx |
| Desktop window | pywebview | `pip install pywebview --break-system-packages` | wraps local HTML/JS as a native window, no Electron/Node needed |
| Windows packaging | PyInstaller | `pip install pyinstaller --break-system-packages` | bundles everything into one `.exe` |
| Frontend | plain HTML/CSS/JS (no framework, no build step) | none needed | rendered inside pywebview |

No Node.js, no Rust, no Go, no Docker, no cloud account required for the core build.

### 3.1 LLM Provider — swappable, OpenAI-SDK-compatible

All three providers you asked about expose OpenAI-compatible chat completion
endpoints, so the code only needs **one** client with the base URL and key read
from `.env`. Pick any one to start; switching later is a one-line config change.

```
# .env
LLM_PROVIDER=openrouter        # openrouter | grok | nvidia
LLM_API_KEY=your_key_here
LLM_MODEL=meta-llama/llama-3.3-70b-instruct:free
```

| Provider | Base URL | Free-tier notes (verify live before relying on it) |
|---|---|---|
| OpenRouter | `https://openrouter.ai/api/v1` | Several models end in `:free` (e.g. `meta-llama/llama-3.3-70b-instruct:free`), no card required. Rate-limited (roughly 20 req/min; daily cap depends on account history — check `openrouter.ai/models` and your dashboard, the free lineup rotates). |
| Grok (x.ai) | `https://api.x.ai/v1` | New accounts get a small one-time signup credit; xAI's free-credit programs have changed multiple times in the past year — check `console.x.ai` billing before assuming a specific amount. |
| NVIDIA (build.nvidia.com) | `https://integrate.api.nvidia.com/v1` | API catalog offers trial credits for hosted open models — check current terms at build.nvidia.com before relying on it. |

**Rule for the agent:** don't hardcode a specific free-tier limit or dollar amount
into the app's logic or UI copy — those change. Read the provider name/key/model
from `.env` and let API errors (429, quota) surface as a clear on-screen message,
not a crash.

If no key is configured at all, the app must still run using the mock-data path
and a "no LLM configured" banner — never fail silently.

---

## 4. Agentic Build Loop

Work through Section 5's phases using this loop, every phase, no exceptions:

```
FOR each phase in Section 5:
    1. READ the phase's tasks and acceptance criteria fully before writing code.
    2. IMPLEMENT only what that phase lists.
    3. RUN the phase's verification step yourself (execute it, don't assume it passes).
    4. IF verification fails:
           fix it within this phase — do not move to the next phase with a known failure.
    5. IF you hit a genuine blocker (missing key, ambiguous spec, contradiction):
           STOP, write the blocker plainly in the terminal/output, wait for input.
    6. MARK the phase's checkboxes complete only after verification passes.
    7. MOVE to the next phase.
```

Do not parallelize phases. Do not "come back and fix it later" — later never comes
in a prototype build.

---

## 5. Build Phases

### Phase 0 — Cleanup (only if reworking an existing repo)
- [ ] Inventory existing files
- [ ] Remove/archive non-Python-stack code per Section 2
- [ ] Confirm `python --version` is 3.10+

**Verify:** repo contains no `.rs`, `.go`, `Cargo.toml`, `go.mod`, or `package.json`
tied to the old stack.

### Phase 1 — Mock Database
- [ ] Create `data/caesar.db` (SQLite)
- [ ] Tables: `sales(id, amount, quarter, year, month, region, category)`,
      `customers(id, status, signup_date, region, plan_type)`,
      `feedback(id, customer_id, rating, comment, created_at)`
- [ ] Seed with ~2 years of clearly synthetic but internally consistent data
      (label it as synthetic in a `README` inside `data/`, so no one mistakes it
      for real figures later)

**Verify:** a script prints row counts per table and one sample row each.

### Phase 2 — LLM Client
- [ ] `llm_client.py`: reads `.env`, builds one `openai.OpenAI(base_url=..., api_key=...)`
      client per Section 3.1
- [ ] Function `parse_intent(text) -> dict` returns `{intent, metric, time_range, filters}`
      as JSON (prompt the model to return JSON only)
- [ ] Function `generate_slide_spec(grounded_data) -> dict` returns a structured
      slide schema (title, chart type, values, source labels) — never raw prose

**Verify:** feed 5 sample sentences, confirm valid JSON back each time; feed one
gibberish sentence, confirm it returns a low-confidence/fallback response instead
of a crash.

### Phase 3 — Data Grounding
- [ ] Fixed, whitelisted SQL query templates per intent (no free-form LLM-written
      SQL against the live DB — map intent → one of a small set of parameterized
      queries)
- [ ] If a query returns zero rows: return a marked `{status: "unavailable"}`,
      never fabricate a number

**Verify:** run each intent template directly against `data/caesar.db` and confirm
correct results; run one intent for a quarter with no data and confirm it returns
`unavailable`, not zero-as-a-guess.

### Phase 4 — Slide Rendering
- [ ] `render.py`: takes a slide spec (Phase 2 output) + grounded data (Phase 3
      output) → `.pptx` via python-pptx
- [ ] 3–4 reusable templates only: title, KPI summary, chart, feedback highlights
- [ ] Every number on the slide carries a small source label (e.g. "Sales DB · Q3")

**Verify:** open the generated `.pptx` in PowerPoint or LibreOffice Impress and
confirm it isn't corrupted and text/charts render correctly.

### Phase 5 — Voice + Text Input
- [ ] `stt.py`: faster-whisper wrapper, batch mode (record → stop → transcribe),
      not true streaming
- [ ] Text input path: a simple text box, feeding the same pipeline as voice
- [ ] Both paths converge on the same `parse_intent()` call from Phase 2

**Verify:** speak one test sentence and type the same sentence — confirm both
produce the same slide.

### Phase 6 — Backend Wiring
- [ ] FastAPI app exposing: `POST /generate` (text or audio in, slide spec + file
      path out), `GET /health`
- [ ] Runs on `localhost` only, no external network exposure needed

**Verify:** `curl localhost:8000/health` returns 200; `POST /generate` with a
sample sentence returns a valid file path.

### Phase 7 — Desktop UI (see Section 6 for design brief)
- [ ] Plain HTML/CSS/JS frontend: record button, text input, live status, slide
      preview area, download/open button
- [ ] Wrapped in `pywebview.create_window(...)`, talking to the FastAPI backend
      over `localhost`

**Verify:** launching the app opens one native-feeling window (no browser chrome,
no visible terminal flash if avoidable), full flow works end to end inside it.

### Phase 8 — Windows Packaging
- [ ] PyInstaller spec bundling backend + webview shell + templates + `data/`
- [ ] `--onefile --windowed` build produces a single `.exe`

**Verify:** the `.exe` runs on a clean-ish Windows environment without requiring
the user to separately install Python.

### Phase 9 — Polish & Demo Readiness
- [ ] Confirm error states are visible and calm, not a raw stack trace
- [ ] Confirm "no LLM key configured" and "query returned nothing" states both
      show clear, honest on-screen messages
- [ ] Record a 60-90 second demo script: speak an update → watch slide build →
      open the `.pptx`

---

## 6. Design Brief — "2026 indie" Windows app

Avoid the current AI-generated-design clichés: no cream-background-plus-serif-plus-
terracotta, no near-black-plus-neon-green, no newspaper/broadsheet hairline-rule
layout. Ground the look in the actual subject (Caesar / grounded data / authority),
not generic "modern SaaS."

- **Palette:** ink navy base `#12141C`, card surface `#1B1F2A`, warm imperial gold
  accent `#C9A24B` (primary), muted Tyrian purple `#6B4E8E` (secondary/data), slate
  blue `#4C6B8A` (chart utility color), warm off-white `#ECE7DC` for high-contrast
  text only — never as a background.
- **Type:** a characterful serif with classical bones (e.g. Fraunces) for the
  title/headline, a clean modern sans (e.g. Inter or Manrope) for body/UI text,
  a monospace (e.g. JetBrains Mono) for numbers and source labels — reinforces
  "this is precise, sourced data," not decoration.
- **Signature element — "grounding pulse":** when a value gets pulled from the
  database and placed on a slide, it briefly glows gold and a small source tag
  (e.g. "Sales DB · Q3") fades in beneath it. This *is* the trust story, made
  visible, not just a stylistic flourish — don't cut it for time.
- **Layout:** split view while generating — transcript/text on one side (calm,
  monospace-ish), the slide canvas assembling on the other. Keep it quiet
  everywhere except the grounding pulse; that's the one place to spend visual
  boldness.
- **Motion:** one deliberate moment (the grounding pulse) beats scattered
  animation everywhere. Respect reduced-motion settings if feasible.

---

## 6.1 Reference Implementation — port this exactly, don't reinterpret

`caesar_ui_reference.html` (in this repo) is not a mood board — it's the literal
target. It uses the real palette/type system from Section 6 and demonstrates the
"grounding pulse" as working CSS/JS, not a description of one. Open it in a
browser to see it live. When building Phase 7:

- Copy its color variables, typography, layout structure, and pulse/chart
  animations directly into the pywebview frontend.
- The whole window — sidebar *and* canvas — uses the ink-navy/surface palette.
  A plain white content pane or a flat unstyled footer bar means the reference
  wasn't followed; go back and match it.
- Load Fraunces / Inter / JetBrains Mono via Google Fonts `<link>` tags (the
  desktop app has normal internet access, unlike a sandboxed preview) — don't
  fall back to system fonts if the real ones are reachable.

## 6.2 Known Bug to Fix (current build)

The current build shows "Results for unknown" and an empty, broken content box
when asked for "profits" — this is a metric-resolution bug, not a display
issue:

- [ ] Expand the intent parser's metric vocabulary so `profit` / `profits` /
      `earnings` all resolve to `net_profit` in the `financials` table, and
      `this year` / `current year` resolves to the current calendar year, not
      a hardcoded quarter.
- [ ] Never render a slide (or the word "unknown") when the metric truly
      couldn't be resolved. Instead, show an explicit message: *"I couldn't
      match that to a known metric — try revenue, profit, churn, or
      feedback."* Success and silent failure must never look the same.
- [ ] Find and fix whatever produced the empty bordered box with a stray
      glyph — check the browser dev console for the actual error (most likely
      an unhandled empty-data state trying to render a chart with no data, or
      a broken icon reference). Any "no data" state needs a clear message, not
      a blank box.
- [ ] Add a unit test using the exact phrase "prepare presentation for profits
      earned during current year" and confirm it resolves correctly before
      moving on.

## 7. What This Explicitly Does Not Include (v0.1)

Do not add: PostgreSQL, Metabase, Google Slides/Keynote export, OAuth/SSO, user
accounts, billing, multi-user support, cloud sync, true real-time streaming
generation, or natural-language-to-arbitrary-SQL. All of these are legitimate
future directions, not this build.

---

## 7.1 Renderer Interface — future-proofing, not a v0.1 feature

The person building this wants plugin-style export to other presentation tools
(PowerBI, Google Slides, etc.) eventually. Don't build those integrations now —
they cost money, OAuth setup, and time this prototype doesn't have. Instead,
structure the code so adding one later is small:

- `renderers/base.py`: an abstract `SlideRenderer` class with one method,
  `render(slide_spec) -> file_path`.
- `renderers/pptx_renderer.py`: implements it. This is the only renderer wired
  into the UI for v0.1 — the "Generate" button always produces a `.pptx`.
- Do not expose a format picker in the UI yet, and do not start any other
  renderer file. The goal is that adding Google Slides later is "write one new
  class," not "rearchitect the app" — nothing more than that for now.

## 8. Environment Setup

```bash
git clone <repo-url> caesar && cd caesar
python -m venv venv
# Windows: venv\Scripts\activate   |   Mac/Linux: source venv/bin/activate
pip install fastapi uvicorn faster-whisper openai python-dotenv python-pptx pywebview pyinstaller --break-system-packages
cp .env.example .env   # fill in LLM_PROVIDER / LLM_API_KEY / LLM_MODEL
python scripts/seed_db.py
python app.py
```

To build the Windows executable once everything works:

```bash
pyinstaller --onefile --windowed --name Caesar app.py
```