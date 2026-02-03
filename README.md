# GRID Scouting Analytics

A web application that ingests raw **GRID series telemetry** and turns large JSONL event streams into **player and team scouting insights**, with a focus on games like **VALORANT**.

The app parses series files once, aggregates meaningful stats, and presents both **raw statistics** and **human-readable analysis** (playstyle, tendencies, strengths, and risks) through a clean web interface.

---

## What It Does

* Downloads and parses GRID series event files (ZIP → JSONL)
* Normalizes events into games and rounds
* Aggregates player- and team-level metrics
* Generates scouting-style analysis (not just stat tables)
* Caches processed series for fast UI performance

---

## Tech Stack

* **Frontend:** Next.js (App Router), React, TypeScript
* **Backend:** Next.js API routes / background workers
* **Data Processing:** Streaming JSONL parsing, incremental aggregation
* **Caching & Storage:** Persistent per-series ingest cache
* **Deployment:** Cloud-ready (designed for background ingest jobs)
