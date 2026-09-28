def test_list_foods_seeded(client):
    resp = client.get("/foods")
    assert resp.status_code == 200
    names = [f["name"] for f in resp.json()]
    assert "Potato Chips" in names
    assert len(names) == 8


def test_create_food_requires_auth(client):
    resp = client.post("/foods", json={
        "name": "Test Food", "category": "Test", "moisture_pct": 10, "fat_pct": 5, "ph": 6.0,
        "oxygen_sensitivity": "medium", "light_sensitivity": "low", "moisture_sensitivity": "medium",
        "typical_shelf_life_months": 6, "storage_temperature_c": 25, "humidity_sensitivity": "medium",
    })
    assert resp.status_code == 401


def test_create_food_authed(client, auth_headers):
    resp = client.post("/foods", json={
        "name": "Test Food", "category": "Test", "moisture_pct": 10, "fat_pct": 5, "ph": 6.0,
        "oxygen_sensitivity": "medium", "light_sensitivity": "low", "moisture_sensitivity": "medium",
        "typical_shelf_life_months": 6, "storage_temperature_c": 25, "humidity_sensitivity": "medium",
    }, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["is_custom"] is True


def test_invalid_ph_rejected(client, auth_headers):
    resp = client.post("/foods", json={
        "name": "Bad Food", "category": "Test", "moisture_pct": 10, "fat_pct": 5, "ph": 20,
        "oxygen_sensitivity": "medium", "light_sensitivity": "low", "moisture_sensitivity": "medium",
        "typical_shelf_life_months": 6, "storage_temperature_c": 25, "humidity_sensitivity": "medium",
    }, headers=auth_headers)
    assert resp.status_code == 422


def test_negative_moisture_rejected(client, auth_headers):
    resp = client.post("/foods", json={
        "name": "Bad Food 2", "category": "Test", "moisture_pct": -5, "fat_pct": 5, "ph": 6.0,
        "oxygen_sensitivity": "medium", "light_sensitivity": "low", "moisture_sensitivity": "medium",
        "typical_shelf_life_months": 6, "storage_temperature_c": 25, "humidity_sensitivity": "medium",
    }, headers=auth_headers)
    assert resp.status_code == 422
