import copy

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


client = TestClient(app_module.app)


@pytest.fixture(autouse=True)
def reset_activities():
    # Make a deep copy of the in-memory activities and restore after each test
    original = copy.deepcopy(app_module.activities)
    yield
    app_module.activities = original


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_prevent_duplicate():
    email = "tester@mergington.edu"
    # sign up
    resp = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # duplicate signup should fail
    resp2 = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert resp2.status_code == 400
    assert resp2.json().get("detail")


def test_delete_participant():
    email = "delete_me@mergington.edu"
    # ensure participant exists by signing up
    client.post(f"/activities/Programming%20Class/signup?email={email}")

    # delete participant
    del_resp = client.delete(f"/activities/Programming%20Class/participants?email={email}")
    assert del_resp.status_code == 200
    assert "Removed" in del_resp.json().get("message", "")

    # verify participant is gone
    activities = client.get("/activities").json()
    participants = activities["Programming Class"]["participants"]
    assert email not in participants


def test_delete_nonexistent_participant():
    resp = client.delete("/activities/Gym%20Class/participants?email=ghost@mergington.edu")
    assert resp.status_code == 404
    assert resp.json().get("detail")
