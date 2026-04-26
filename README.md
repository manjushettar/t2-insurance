# t2-insurance

Insurance Readiness Score engine for SMBs. Plug and Play SMB Innovation Sprint, Track 2.

Takes raw business data (financials, claims, property, ZIP, safety/cyber) and outputs a 0–100 readiness score with a per-feature contribution table and ranked recommendations.

## Prerequisites

- **Node.js** (v18+)
- **Python 3.10+**
- **PostgreSQL** (running locally or via Docker)

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/t2_insurance"
```

Replace `USER` and `PASSWORD` with your Postgres credentials.

## Setup

### 1. Install dependencies

```bash
# Node / Next.js
npm install

# Python
pip install pyyaml
```

### 2. Set up the database

```bash
npx prisma generate
npx prisma db push        # creates tables from the schema
npx prisma db seed         # optional: seed demo data
```

## Running the App

### Frontend (Next.js web app)

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000). The web app includes:

- **Onboarding** (`/onboarding`) — guided business intake form
- **Dashboard** (`/dashboard`) — readiness score overview
- **Underwriter View** (`/underwriter-view`) — detailed underwriting perspective

### Backend (Python scoring engine)

```bash
python demo.py
```

Runs the scoring pipeline against a sample business (Mission Coffee Roasters) and prints the composite score, pillar breakdown, contribution table, and recommendations.

## Project Structure

| Path | Description |
|---|---|
| `engine.py` | Scoring pipeline — normalization, pillar scoring, knockouts, recommendations |
| `weights.yaml` | Tunable weights, normalization curves, knockouts, action templates |
| `context_engine.py` | Lightweight keyword-based RAG over `knowledge_base/` markdown files |
| `demo.py` | Example run of the scoring engine |
| `app/` | Next.js frontend — pages, API routes, layouts |
| `lib/` | Shared TypeScript utilities (onboarding logic, AI context, Prisma client) |
| `prisma/` | Database schema and migrations |
| `knowledge_base/` | Domain knowledge markdown files used by the context engine |
| `scoring_categories_and_weights.md` | Pillars, weights, and how the math works |

## Python API Usage

```python
from engine import compute_score
result = compute_score(raw_features_dict)
```

`result` exposes `composite_score`, `pillars`, `contribution_table`, `knockouts`, `recommendations`, `completeness`.
