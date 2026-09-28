def test_register_and_login(client):
    resp = client.post("/auth/register", json={
        "email": "alice@example.com", "full_name": "Alice", "password": "password123",
    })
    assert resp.status_code == 200
    assert resp.json()["user"]["email"] == "alice@example.com"

    resp = client.post("/auth/login", json={"email": "alice@example.com", "password": "password123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client):
    client.post("/auth/register", json={
        "email": "bob@example.com", "full_name": "Bob", "password": "password123",
    })
    resp = client.post("/auth/login", json={"email": "bob@example.com", "password": "wrongpass"})
    assert resp.status_code == 401


def test_me_requires_token(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 401


def test_duplicate_registration_rejected(client):
    client.post("/auth/register", json={
        "email": "dup@example.com", "full_name": "Dup", "password": "password123",
    })
    resp = client.post("/auth/register", json={
        "email": "dup@example.com", "full_name": "Dup2", "password": "password123",
    })
    assert resp.status_code == 400
