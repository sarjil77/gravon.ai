import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "clavio-ai"


def test_list_bots(client):
    response = client.get("/api/bots/")
    assert response.status_code == 200


def test_whatsapp_status(client):
    response = client.get("/api/whatsapp/status")
    assert response.status_code == 200
    assert response.json()["connected"] is False
