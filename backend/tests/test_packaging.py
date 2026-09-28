def test_list_packaging_seeded(client):
    resp = client.get("/packaging")
    assert resp.status_code == 200
    codes = [p["code"] for p in resp.json()]
    assert "BOPP_PE" in codes
    assert len(codes) == 12


def test_get_single_packaging(client):
    resp = client.get("/packaging")
    first_id = resp.json()[0]["id"]
    detail = client.get(f"/packaging/{first_id}")
    assert detail.status_code == 200


def test_get_missing_packaging_404(client):
    resp = client.get("/packaging/999999")
    assert resp.status_code == 404
