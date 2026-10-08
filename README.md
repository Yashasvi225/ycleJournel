# CycleJournal — Phase 3

Phase 3 keeps all Phase 2 authentication, SQLite persistence and privacy isolation, and adds a real calendar + cycle-history visualization.

## New in Phase 3
- Responsive monthly calendar connected to `/api/cycles`, `/api/symptoms`, `/api/notes`
- Coral recorded period days
- Lavender approximate future period range
- Teal symptom/note indicators
- Navy selected date
- Date side panel with period status, symptoms, severity and notes
- Add symptom/note/period day directly from calendar
- Edit symptom notes and journal notes from calendar
- Delete symptoms and notes from calendar
- Previous/current/next month navigation
- Cycle history cards
- Average/shortest/longest cycle statistics
- Average period duration
- Recorded-cycle count
- Recharts cycle-length trend chart
- Empty states when history is insufficient

The lavender estimate is intentionally simple in Phase 3: it uses the average and variability of recent valid cycle lengths. It is an approximate journal aid, not a medical, fertility, pregnancy, or contraception prediction. A more explicit uncertainty/explanation engine belongs in the next estimation phase.

## Run backend
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

## Run frontend
Open a second terminal:
```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## How Phase 3 is linked
CalendarPage.jsx and History.jsx call `frontend/src/api.js`.
That helper attaches the logged-in JWT to requests.
Flask validates the JWT and returns only rows whose `user_id` matches the authenticated user.
The frontend transforms those private records into calendar markers, summary statistics and the trend chart.

## Upgrade note
If you already have useful Phase 2 data, keep your Phase 2 `backend/instance/cyclejournal.db` and copy it into the Phase 3 `backend/instance/` folder before starting Phase 3. The Phase 3 database schema is unchanged.


# Phase 4 — Uncertainty-Aware Range-Based Estimation

New backend module: `backend/estimator.py`
New protected API: `GET /api/estimate`
New tests: `backend/test_estimator.py`

The estimator uses consecutive cycle start dates, recent valid cycle lengths, mean, median, min/max and population standard deviation. It never returns an estimate until there are at least three recorded starts and at least two valid intervals.

Run estimator tests from `backend`:
```powershell
python -m unittest test_estimator.py
```

Phase 4 palette:
- Sage green: #7A9278 / #A8B7A0
- Dusty rose: #D9B2B0
- Warm cream: #F7F2E8
- Soft ivory: #FFFFF8
- Black text: #000000

The confidence label describes consistency of recorded data only. It is not medical confidence or certainty.
