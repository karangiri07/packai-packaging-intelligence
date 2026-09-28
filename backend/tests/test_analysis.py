def test_full_workflow_register_to_report(client, auth_headers):
    # Select a seeded food (Potato Chips)
    foods = client.get("/foods").json()
    potato_chips = next(f for f in foods if f["name"] == "Potato Chips")

    # Analyze
    resp = client.post("/analysis", json={
        "food_product_id": potato_chips["id"],
        "priority": "balanced",
    }, headers=auth_headers)
    assert resp.status_code == 200
    analysis_id = resp.json()["id"]

    # food_product_id must round-trip so the frontend Optimization page can
    # re-submit an analysis with the same food under a different priority
    detail = client.get(f"/analysis/{analysis_id}", headers=auth_headers)
    assert detail.json()["food_product_id"] == potato_chips["id"]

    # Recommendation
    resp = client.get(f"/analysis/{analysis_id}/recommendation", headers=auth_headers)
    assert resp.status_code == 200
    rec = resp.json()
    assert rec["packaging_name"]
    assert 0 <= rec["overall_suitability_pct"] <= 100
    assert len(rec["explanation_trace"]) == 7

    # Comparison
    resp = client.get(f"/analysis/{analysis_id}/comparison", headers=auth_headers)
    assert resp.status_code == 200
    candidates = resp.json()["candidates"]
    assert len(candidates) <= 5
    scores = [c["final_score"] for c in candidates]
    assert scores == sorted(scores, reverse=True)

    # AI explanation (falls back to template since no LLM key is configured in tests)
    resp = client.post(f"/analysis/{analysis_id}/explanation", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["explanation"]

    # Report
    resp = client.get(f"/analysis/{analysis_id}/report", headers=auth_headers)
    assert resp.status_code == 200
    report = resp.json()
    assert report["disclaimer"]
    assert report["packaging_recommendation"]["material"] == rec["packaging_name"]

    # PDF download
    resp = client.get(f"/analysis/{analysis_id}/report/pdf", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content[:4] == b"%PDF"


def test_different_priority_can_change_ranking(client, auth_headers):
    foods = client.get("/foods").json()
    biscuits = next(f for f in foods if f["name"] == "Biscuits")

    resp_cost = client.post("/analysis", json={
        "food_product_id": biscuits["id"], "priority": "cost",
    }, headers=auth_headers)
    resp_protection = client.post("/analysis", json={
        "food_product_id": biscuits["id"], "priority": "protection",
    }, headers=auth_headers)

    top_cost = client.get(f"/analysis/{resp_cost.json()['id']}/recommendation", headers=auth_headers).json()
    top_protection = client.get(f"/analysis/{resp_protection.json()['id']}/recommendation", headers=auth_headers).json()

    # Not asserting they must differ (data-dependent) but both must be valid
    assert top_cost["packaging_name"]
    assert top_protection["packaging_name"]


def test_analysis_requires_auth(client):
    resp = client.post("/analysis", json={"food_product_id": 1, "priority": "balanced"})
    assert resp.status_code == 401


def test_analysis_invalid_food_id(client, auth_headers):
    resp = client.post("/analysis", json={"food_product_id": 999999, "priority": "balanced"}, headers=auth_headers)
    assert resp.status_code == 404


def test_dashboard_summary(client, auth_headers):
    foods = client.get("/foods").json()
    rice = next(f for f in foods if f["name"] == "Rice")
    client.post("/analysis", json={"food_product_id": rice["id"], "priority": "balanced"}, headers=auth_headers)

    resp = client.get("/dashboard/summary", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_analyses"] >= 1
    assert data["total_food_products"] == 8
    assert data["total_packaging_materials"] == 12
