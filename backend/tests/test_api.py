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
    assert data["service"] == "Gravon-ai"


def test_list_bots(client):
    response = client.get("/api/bots/")
    assert response.status_code == 200


def test_list_telegram_requires_user_id(client):
    response = client.get("/api/telegram/")
    assert response.status_code == 422
