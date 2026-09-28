from fastapi import HTTPException, status


def validate_analysis_inputs(*, ph: float, moisture_pct: float, fat_pct: float,
                              target_shelf_life_months: int, storage_temperature_c: float,
                              relative_humidity_pct: float) -> None:
    errors = []
    if not (0 <= ph <= 14):
        errors.append("pH must be between 0 and 14.")
    if moisture_pct < 0:
        errors.append("Moisture percentage cannot be negative.")
    if fat_pct < 0:
        errors.append("Fat percentage cannot be negative.")
    if target_shelf_life_months <= 0:
        errors.append("Target shelf life must be a positive number of months.")
    if not (-30 <= storage_temperature_c <= 60):
        errors.append("Storage temperature must be between -30C and 60C.")
    if not (0 <= relative_humidity_pct <= 100):
        errors.append("Relative humidity must be between 0 and 100 percent.")
    if errors:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=errors)
