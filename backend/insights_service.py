from collections import Counter
from statistics import mean, pstdev
from datetime import datetime


def to_date(value):
    if value is None:
        return None

    if hasattr(value, "year"):
        return value

    return datetime.strptime(str(value)[:10], "%Y-%m-%d").date()


def build_insights(cycles, symptoms):

    # Sort cycles by starting date
    cycles = sorted(cycles, key=lambda c: to_date(c.start_date))

    # ---------------------------------
    # 1. CALCULATE CYCLE LENGTHS
    # ---------------------------------

    cycle_lengths = []

    for i in range(1, len(cycles)):

        previous_date = to_date(cycles[i - 1].start_date)
        current_date = to_date(cycles[i].start_date)

        length = (current_date - previous_date).days

        # Ignore incorrect/unrealistic data
        if 15 <= length <= 60:
            cycle_lengths.append({
                "date": previous_date.isoformat(),
                "length": length
            })

    lengths = [item["length"] for item in cycle_lengths]

    # ---------------------------------
    # 2. PERIOD DURATIONS
    # ---------------------------------

    period_durations = []

    for cycle in cycles:

        if cycle.start_date and cycle.end_date:

            start = to_date(cycle.start_date)
            end = to_date(cycle.end_date)

            duration = (end - start).days + 1

            if 1 <= duration <= 15:
                period_durations.append({
                    "date": start.isoformat(),
                    "duration": duration
                })

    durations = [
        item["duration"]
        for item in period_durations
    ]

    # ---------------------------------
    # 3. CYCLE OVERVIEW
    # ---------------------------------

    overview = {
        "average_cycle_length":
            round(mean(lengths), 1) if lengths else None,

        "average_period_duration":
            round(mean(durations), 1) if durations else None,

        "shortest_cycle":
            min(lengths) if lengths else None,

        "longest_cycle":
            max(lengths) if lengths else None,

        "cycle_variation":
            round(pstdev(lengths), 1)
            if len(lengths) >= 2 else None
    }

    # ---------------------------------
    # 4. WHAT CHANGED?
    # ---------------------------------

    changes = []

    if len(lengths) >= 2:

        difference = lengths[-1] - lengths[-2]

        if difference > 0:
            changes.append(
                f"Your latest cycle was {difference} days longer "
                "than your previous cycle."
            )

        elif difference < 0:
            changes.append(
                f"Your latest cycle was {abs(difference)} days shorter "
                "than your previous cycle."
            )

        else:
            changes.append(
                "Your latest cycle was the same length "
                "as your previous cycle."
            )

    if len(durations) >= 2:

        latest = durations[-1]
        previous_average = round(mean(durations[:-1]), 1)

        changes.append(
            f"Your latest period lasted {latest} days compared "
            f"with your previous average of {previous_average} days."
        )

    # ---------------------------------
    # 5. SYMPTOM FREQUENCY
    # ---------------------------------

    symptom_counter = Counter()

    severity_data = {}

    for symptom in symptoms:

        name = symptom.symptom_type

        if not name:
            continue

        symptom_counter[name] += 1

        if name not in severity_data:
            severity_data[name] = []

        if symptom.severity:
            severity_data[name].append(symptom.severity)

    symptom_frequency = [
        {
            "name": name,
            "count": count
        }
        for name, count in symptom_counter.most_common()
    ]

    symptom_severity = []

    for name, values in severity_data.items():

        if values:
            symptom_severity.append({
                "name": name,
                "severity": round(mean(values), 1)
            })

    # ---------------------------------
    # 6. ESTIMATE STABILITY
    # ---------------------------------

    if len(lengths) < 2:

        stability = {
            "level": "Not enough data",
            "variation": None,
            "message":
                "More cycle history is needed to calculate this insight."
        }

    else:

        variation = round(pstdev(lengths), 1)

        if variation <= 2:
            level = "HIGH"

        elif variation <= 5:
            level = "MODERATE"

        else:
            level = "LOW"

        stability = {
            "level": level,
            "variation": variation,
            "message":
                f"Your recent recorded cycle lengths vary by "
                f"approximately {variation} days. More consistent "
                "history generally produces narrower estimate ranges."
        }

    # ---------------------------------
    # RETURN EVERYTHING
    # ---------------------------------

    return {
        "overview": overview,
        "changes": changes,
        "cycle_length_trend": cycle_lengths,
        "period_duration_trend": period_durations,
        "symptom_frequency": symptom_frequency,
        "symptom_severity": symptom_severity,
        "estimate_stability": stability
    }
