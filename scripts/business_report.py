#!/usr/bin/env python3
import json
from collections import defaultdict
from pathlib import Path

SOURCE = Path("public/city_businesses_2.json")
DEST   = Path("public/business_report_2.json")

# ---------- load ----------
data = json.loads(SOURCE.read_text())

# running tallies
totals_by_size = {"500+": 0, "100-499": 0, "10-99": 0}
industry_counts = defaultdict(int)

small_only_city_count = 0
small_only_firm_total = 0
total_ten_ninety_nine = 0

# new KPIs
cities_10plus_500   = 0   # ≥10 firms in 500+ bucket
cities_25plus_500   = 0   # ≥25 firms in 500+ bucket
cities_10plus_midlg = 0   # ≥10 combined firms in (500+ ∪ 100-499)

cities = data.get("cities", {})
for city_name, buckets in cities.items():
    cnt_500   = len(buckets.get("500+", []))
    cnt_100_499 = len(buckets.get("100-499", []))
    cnt_10_99 = len(buckets.get("10-99", []))

    # ---- size bucket tallies ----
    totals_by_size["500+"]   += cnt_500
    totals_by_size["100-499"] += cnt_100_499
    totals_by_size["10-99"]   += cnt_10_99
    total_ten_ninety_nine    += cnt_10_99

    # ---- industry roll-up ----
    for size in ("500+", "100-499", "10-99"):
        for biz in buckets.get(size, []):
            industry_counts[biz["industry"]] += 1

    # ---- “10-99-only” cohort ----
    present_buckets = [s for s in ("500+", "100-499", "10-99") if buckets.get(s)]
    if present_buckets == ["10-99"]:
        small_only_city_count += 1
        small_only_firm_total += cnt_10_99

    # ---- new KPI logic ----
    if cnt_500 >= 10:
        cities_10plus_500 += 1
    if cnt_500 >= 25:
        cities_25plus_500 += 1
    if (cnt_500 + cnt_100_499) >= 10:
        cities_10plus_midlg += 1

# avoid divide-by-zero
pct_share = round(100 * small_only_firm_total / total_ten_ninety_nine, 2) if total_ten_ninety_nine else 0.0

# ---------- spit it out ----------
report = {
    "totals_by_size": totals_by_size,
    "industry_counts": sorted(
        [{"industry": k, "count": v} for k, v in industry_counts.items()],
        key=lambda x: x["count"],
        reverse=True,
    ),
    "small_only_city_count": small_only_city_count,
    "small_only_cities_share_of_10_99": pct_share,  # %
    # ---- new KPI outputs ----
    "cities_with_10plus_500": cities_10plus_500,
    "cities_with_25plus_500": cities_25plus_500,
    "cities_with_10plus_500_or_100_499": cities_10plus_midlg,
}

DEST.write_text(json.dumps(report, indent=2))
print(f"✅  Wrote {DEST} — done.")