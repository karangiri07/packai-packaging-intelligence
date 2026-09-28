# Scoring Methodology

## Step 1 — Requirements Mapping

Food and environmental inputs are converted into packaging requirement
targets (0-10 scale) using explicit rules. Examples:

| Food input | Rule | Packaging requirement |
|---|---|---|
| Oxygen sensitivity: high | base score 9, +1.5 if target shelf life ≥ 9 months | Oxygen barrier ≥ 9-10 |
| Moisture ≤ 5% | base score 9 | Moisture barrier ≥ 9 (low-moisture foods absorb humidity easily) |
| Relative humidity ≥ 70% | +1.5 to moisture requirement | Higher moisture barrier needed |
| Fat ≥ 20% | oil resistance requirement = 8 | Strong oil/grease resistance |
| Fragility: high | mechanical requirement = 9 | High mechanical strength |
| Transport: frozen | temperature range widened to -25°C to 40°C, +1 mechanical | Freeze-thaw tolerant, tougher packaging |
| Oxygen sensitivity: high AND pH ≥ 4.6 (low-acid) | MAP flag = true | MAP-compatible packaging recommended |

Every rule that fires is recorded in a trace list so the "Why This
Packaging?" screen can show the food requirement → packaging requirement
chain verbatim.

## Step 2 — Candidate Scoring (7 dimensions)

For each of the 12 packaging candidates, the engine computes a 0-1 "fit
ratio" per dimension:

1. **Oxygen Protection** — candidate's oxygen barrier vs. required oxygen barrier
2. **Moisture Protection** — candidate's moisture barrier vs. required moisture barrier
3. **Mechanical Protection** — 70% mechanical strength fit + 30% oil resistance fit
4. **Shelf Life** — 50% light barrier fit + 50% estimated-shelf-life-vs-target ratio
5. **Cost** — inverse of the candidate's 0-10 cost index
6. **Sustainability** — average of sustainability score and recyclability score
7. **Compatibility** — temperature range coverage + MAP compatibility (if required)

A fit ratio of 1.0 means the candidate meets the requirement; a fit below
1.0 is a proportional shortfall (`available / required`).

**Right-sizing (over-specification penalty).** Meeting the need with up to
2 points of headroom scores 1.0. Beyond that, each extra point of
unneeded barrier/strength costs 0.05 (floor 0.7). Without this, the
strongest, most expensive material (foil, glass) would win every analysis
simply by being the strongest.

**Crush sensitivity.** Highly fragile foods (e.g. biscuits) set a
`crush_sensitive` flag; vacuum-based packaging then loses 0.6 of its
compatibility fit, since vacuum packing can crush the product.

## Step 3 — Weighting by Priority

Each dimension's fit ratio is multiplied by a weight (points out of 100)
that depends on the selected optimization priority:

| Priority | Oxygen | Moisture | Mechanical | Shelf Life | Cost | Sustainability | Compatibility |
|---|---|---|---|---|---|---|---|
| Balanced | 18 | 18 | 12 | 17 | 15 | 10 | 10 |
| Lowest Cost | 13 | 13 | 9 | 12 | 35 | 8 | 10 |
| Maximum Shelf Life | 24 | 24 | 10 | 24 | 6 | 4 | 8 |
| Maximum Sustainability | 14 | 14 | 8 | 12 | 10 | 34 | 8 |
| Maximum Protection | 25 | 25 | 18 | 14 | 5 | 4 | 9 |

The seven weighted contributions sum to the final 0-100 score. This is the
exact breakdown shown in the "Score Breakdown" panel.

## Step 4 — Optimization Guard Rails

Under **Lowest Cost** and **Maximum Sustainability** priorities, a minimum
protection floor is enforced before ranking: the *weakest* of the oxygen,
moisture and mechanical fit ratios must be ≥ 0.6. Using the minimum (not
the average) means an excellent barrier cannot mask a badly inadequate
strength — e.g. glass is excluded for frozen food even though its barrier
is perfect. If no candidate clears the floor, the full ranking is returned
rather than an empty result.

## Shelf-Life Estimation

The estimate is a transparent heuristic, not a validated predictive model:

```
avg_barrier_delta = ((candidate.oxygen_barrier - required_oxygen_barrier)
                    + (candidate.moisture_barrier - required_moisture_barrier)) / 2
factor = 1 + (avg_barrier_delta / 10) * 0.6   # capped at a 60% swing
estimated_months = target_shelf_life_months * max(0.4, factor)
```

This is intentionally simple and disclosed as approximate in every report.

## Observed behaviour on the demo datasets

Running the engine over all 8 seeded foods x 5 priorities (see
`backend/tests/test_scoring.py` for the unit tests) gives, for example:
foil/metallized laminates for oxygen- and light-sensitive foods (spices,
milk), aluminium trays for frozen meals, and cheap PP/PE-based films under
"Lowest Cost". For **potato chips** the engine ranks Aluminium
(can/foil container), Vacuum Pouch and PET/MetPET/PE at the top; BOPP/PE
does not win because its oxygen barrier (4/10) cannot meet the "high oxygen
sensitivity" requirement (9/10) — consistent with industry use of
metallized films for snacks. The ranking is data-driven; edit
`data/packaging.json` or the food inputs and it recomputes.
