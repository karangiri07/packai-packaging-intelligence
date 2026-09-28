"""
Weight profiles per optimization priority.

Each profile allocates the 100 total points across the seven scoring
dimensions used in the "WHY THIS PACKAGING?" breakdown. Changing the
priority changes the weighting only - the underlying sub-scores (0-1
normalized fit) are computed identically regardless of priority, which is
what makes the recommendation dynamically recalculable and explainable.
"""

WEIGHT_PROFILES = {
    "balanced": {
        "oxygen_protection": 18,
        "moisture_protection": 18,
        "mechanical_protection": 12,
        "shelf_life": 17,
        "cost": 15,
        "sustainability": 10,
        "compatibility": 10,
    },
    "cost": {
        "oxygen_protection": 13,
        "moisture_protection": 13,
        "mechanical_protection": 9,
        "shelf_life": 12,
        "cost": 35,
        "sustainability": 8,
        "compatibility": 10,
    },
    "shelf_life": {
        "oxygen_protection": 24,
        "moisture_protection": 24,
        "mechanical_protection": 10,
        "shelf_life": 24,
        "cost": 6,
        "sustainability": 4,
        "compatibility": 8,
    },
    "sustainability": {
        "oxygen_protection": 14,
        "moisture_protection": 14,
        "mechanical_protection": 8,
        "shelf_life": 12,
        "cost": 10,
        "sustainability": 34,
        "compatibility": 8,
    },
    "protection": {
        "oxygen_protection": 25,
        "moisture_protection": 25,
        "mechanical_protection": 18,
        "shelf_life": 14,
        "cost": 5,
        "sustainability": 4,
        "compatibility": 9,
    },
}


def get_weights(priority: str) -> dict:
    return WEIGHT_PROFILES.get((priority or "balanced").lower(), WEIGHT_PROFILES["balanced"])
