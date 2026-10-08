"""Uncertainty-aware cycle estimator for CycleJournal.

This module deliberately returns a DATE RANGE, not a guaranteed date.
It uses only recorded cycle start dates. It is a journaling estimate and
must not be interpreted as diagnosis, fertility, pregnancy, or contraception advice.
"""
import math
from datetime import date, timedelta
from statistics import mean, median, pstdev

MIN_VALID_CYCLE = 15
MAX_VALID_CYCLE = 60
MAX_RECENT_CYCLES = 6

def _parse(value):
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value))
    except (TypeError, ValueError):
        return None

def estimate_next_period(start_dates):
    """Return a transparent range estimate from personal cycle history.

    Math used:
    1. Sort unique, valid start dates.
    2. Cycle length = days between two consecutive starts.
    3. Ignore implausible intervals (<15 or >60 days) as likely bad/demo input.
    4. Use at most the six most recent valid cycle lengths so the estimate reflects
       recent personal history rather than very old patterns.
    5. Center = last recorded start + rounded mean cycle length.
    6. Uncertainty half-width is based on population standard deviation, rounded up.
       A minimum width is used because even consistent historical data cannot justify
       pretending an exact future date is certain.
    """
    dates=sorted(set(d for d in (_parse(x) for x in start_dates) if d))
    if len(dates) < 3:
        return {
            "status":"insufficient",
            "message":"Not enough cycle history yet.",
            "required":"At least 3 recorded cycle starts are needed to form 2 cycle lengths."
        }

    all_lengths=[(dates[i]-dates[i-1]).days for i in range(1,len(dates))]
    valid=[x for x in all_lengths if MIN_VALID_CYCLE <= x <= MAX_VALID_CYCLE]
    recent=valid[-MAX_RECENT_CYCLES:]

    # Two valid intervals are the minimum for measuring any variability.
    if len(recent) < 2:
        return {
            "status":"insufficient",
            "message":"Not enough cycle history yet.",
            "required":"At least 2 valid cycle lengths are needed after checking the recorded dates.",
            "excluded_cycle_lengths":[x for x in all_lengths if x not in valid]
        }

    avg=mean(recent)
    med=median(recent)
    sd=pstdev(recent) if len(recent)>1 else 0.0
    min_len,max_len=min(recent),max(recent)
    spread=max_len-min_len

    # Confidence is a readability label about DATA CONSISTENCY only.
    # It is never medical confidence/certainty.
    if len(recent)>=4 and sd<=1.5 and spread<=4:
        confidence="High"
        half=max(2, math.ceil(sd*1.5))
        explanation="Your recent recorded cycle lengths are relatively consistent, so the displayed range can be narrower."
    elif sd<=3.5 and spread<=8:
        confidence="Moderate"
        half=max(3, math.ceil(sd*1.5))
        explanation="Your recent cycles have varied slightly, so CycleJournal displays a wider range rather than one exact date."
    else:
        confidence="Low"
        half=max(5, math.ceil(sd*1.5))
        explanation="Your recent recorded cycle lengths vary substantially, so CycleJournal uses a wider estimation range."

    # More limited history should never look overly precise.
    if len(recent)==2:
        confidence="Low"
        half=max(5,half)
        explanation="Only two valid cycle lengths are available, so CycleJournal uses a wider range and labels the estimate as low confidence."

    center=dates[-1]+timedelta(days=round(avg))
    start=center-timedelta(days=half)
    end=center+timedelta(days=half)

    return {
        "status":"ok",
        "recent_cycle_lengths":recent,
        "average_cycle_length":round(avg,1),
        "median_cycle_length":round(float(med),1),
        "minimum_cycle_length":min_len,
        "maximum_cycle_length":max_len,
        "typical_variation":round(sd,1),
        "estimated_center":center.isoformat(),
        "estimated_start":start.isoformat(),
        "estimated_end":end.isoformat(),
        "range_half_width_days":half,
        "confidence":confidence,
        "confidence_note":"Confidence describes consistency in your recorded history, not medical certainty.",
        "explanation":explanation,
        "excluded_cycle_lengths":[x for x in all_lengths if x not in valid],
        "disclaimer":"This is a history-based journaling estimate, not a diagnosis, fertility prediction, pregnancy prediction, contraception method, or guaranteed period date."
    }
