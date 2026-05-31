import json
import sys
import os
from fastapi.testclient import TestClient

# Add modules/backend to sys.path so we can import main
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../modules/backend')))
from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"Ping": "Pong"}

def test_empty_pipeline():
    pipeline = json.dumps({"nodes": [], "edges": []})
    response = client.post("/pipelines/parse", data={"pipeline": pipeline})
    assert response.status_code == 200
    data = response.json()
    assert data["num_nodes"] == 0
    assert data["num_edges"] == 0
    assert data["is_dag"] == True
    assert "cycle_nodes" not in data

def test_valid_dag_simple_chain():
    pipeline = json.dumps({
        "nodes": [{"id": "A"}, {"id": "B"}, {"id": "C"}],
        "edges": [{"source": "A", "target": "B"}, {"source": "B", "target": "C"}]
    })
    response = client.post("/pipelines/parse", data={"pipeline": pipeline})
    assert response.status_code == 200
    data = response.json()
    assert data["num_nodes"] == 3
    assert data["num_edges"] == 2
    assert data["is_dag"] == True
    assert "cycle_nodes" not in data

def test_cyclic_pipeline_loop():
    pipeline = json.dumps({
        "nodes": [{"id": "A"}, {"id": "B"}],
        "edges": [{"source": "A", "target": "B"}, {"source": "B", "target": "A"}]
    })
    response = client.post("/pipelines/parse", data={"pipeline": pipeline})
    assert response.status_code == 200
    data = response.json()
    assert data["num_nodes"] == 2
    assert data["num_edges"] == 2
    assert data["is_dag"] == False
    assert set(data["cycle_nodes"]) == {"A", "B"}

def test_cyclic_pipeline_self_loop():
    pipeline = json.dumps({
        "nodes": [{"id": "A"}],
        "edges": [{"source": "A", "target": "A"}]
    })
    response = client.post("/pipelines/parse", data={"pipeline": pipeline})
    assert response.status_code == 200
    data = response.json()
    assert data["num_nodes"] == 1
    assert data["num_edges"] == 1
    assert data["is_dag"] == False
    assert data["cycle_nodes"] == ["A"]

def test_multinode_cycle():
    pipeline = json.dumps({
        "nodes": [{"id": "A"}, {"id": "B"}, {"id": "C"}],
        "edges": [
            {"source": "A", "target": "B"},
            {"source": "B", "target": "C"},
            {"source": "C", "target": "A"}
        ]
    })
    response = client.post("/pipelines/parse", data={"pipeline": pipeline})
    assert response.status_code == 200
    data = response.json()
    assert data["num_nodes"] == 3
    assert data["num_edges"] == 3
    assert data["is_dag"] == False
    assert set(data["cycle_nodes"]) == {"A", "B", "C"}

def test_disjoint_graphs_all_dags():
    pipeline = json.dumps({
        "nodes": [{"id": "A"}, {"id": "B"}, {"id": "C"}, {"id": "D"}],
        "edges": [
            {"source": "A", "target": "B"},
            {"source": "C", "target": "D"}
        ]
    })
    response = client.post("/pipelines/parse", data={"pipeline": pipeline})
    assert response.status_code == 200
    data = response.json()
    assert data["num_nodes"] == 4
    assert data["num_edges"] == 2
    assert data["is_dag"] == True
    assert "cycle_nodes" not in data

def test_disjoint_graphs_one_cyclic():
    pipeline = json.dumps({
        "nodes": [{"id": "A"}, {"id": "B"}, {"id": "C"}, {"id": "D"}],
        "edges": [
            {"source": "A", "target": "B"},
            {"source": "C", "target": "D"},
            {"source": "D", "target": "C"}
        ]
    })
    response = client.post("/pipelines/parse", data={"pipeline": pipeline})
    assert response.status_code == 200
    data = response.json()
    assert data["num_nodes"] == 4
    assert data["num_edges"] == 3
    assert data["is_dag"] == False
    assert set(data["cycle_nodes"]) == {"C", "D"}

def test_missing_node_ids_in_nodes_payload():
    # Edges define nodes X and Y that are not in nodes list
    pipeline = json.dumps({
        "nodes": [],
        "edges": [{"source": "X", "target": "Y"}]
    })
    response = client.post("/pipelines/parse", data={"pipeline": pipeline})
    assert response.status_code == 200
    data = response.json()
    # The num_nodes represents the length of the nodes payload, which is 0
    assert data["num_nodes"] == 0
    assert data["num_edges"] == 1
    assert data["is_dag"] == True
    assert "cycle_nodes" not in data

def test_invalid_json_format():
    pipeline = "not a json string"
    response = client.post("/pipelines/parse", data={"pipeline": pipeline})
    assert response.status_code == 400
    assert "Invalid JSON format" in response.json()["detail"]

# --- WebSocket Tests ---

def test_websocket_valid_dag():
    with client.websocket_connect("/pipelines/run/ws") as websocket:
        payload = json.dumps({
            "nodes": [{"id": "A"}, {"id": "B"}],
            "edges": [{"source": "A", "target": "B"}]
        })
        websocket.send_text(payload)
        
        # Should receive progress
        progress = websocket.receive_json()
        assert progress["type"] == "progress"
        
        # Should receive result
        result = websocket.receive_json()
        assert result["type"] == "result"
        assert result["data"]["num_nodes"] == 2
        assert result["data"]["num_edges"] == 1
        assert result["data"]["is_dag"] == True
        assert "cycle_nodes" not in result["data"]

def test_websocket_cyclic_dag():
    with client.websocket_connect("/pipelines/run/ws") as websocket:
        payload = json.dumps({
            "nodes": [{"id": "A"}, {"id": "B"}],
            "edges": [{"source": "A", "target": "B"}, {"source": "B", "target": "A"}]
        })
        websocket.send_text(payload)
        
        progress = websocket.receive_json()
        assert progress["type"] == "progress"
        
        result = websocket.receive_json()
        assert result["type"] == "result"
        assert result["data"]["num_nodes"] == 2
        assert result["data"]["num_edges"] == 2
        assert result["data"]["is_dag"] == False
        assert set(result["data"]["cycle_nodes"]) == {"A", "B"}

def test_websocket_invalid_json():
    from fastapi import WebSocketDisconnect
    try:
        with client.websocket_connect("/pipelines/run/ws") as websocket:
            websocket.send_text("invalid json")
            error = websocket.receive_json()
            assert error["type"] == "error"
            
            # The next receive should raise WebSocketDisconnect because we closed with 1003
            websocket.receive_text()
            assert False, "WebSocket should have disconnected"
    except WebSocketDisconnect as e:
        assert e.code == 1003

# --- Tricky Topology Tests ---

def test_figure_8_cycle():
    # A figure-8 where node C is the choke point for two separate cycles:
    # A -> B -> C -> A
    # C -> D -> E -> C
    pipeline = json.dumps({
        "nodes": [{"id": "A"}, {"id": "B"}, {"id": "C"}, {"id": "D"}, {"id": "E"}],
        "edges": [
            {"source": "A", "target": "B"},
            {"source": "B", "target": "C"},
            {"source": "C", "target": "A"},
            {"source": "C", "target": "D"},
            {"source": "D", "target": "E"},
            {"source": "E", "target": "C"}
        ]
    })
    response = client.post("/pipelines/parse", data={"pipeline": pipeline})
    assert response.status_code == 200
    data = response.json()
    assert data["is_dag"] == False
    assert set(data["cycle_nodes"]) == {"A", "B", "C", "D", "E"}

def test_disconnected_dual_cycles():
    # Two entirely separate cycles in the same graph
    # Cycle 1: A -> B -> A
    # Cycle 2: X -> Y -> X
    pipeline = json.dumps({
        "nodes": [{"id": "A"}, {"id": "B"}, {"id": "X"}, {"id": "Y"}],
        "edges": [
            {"source": "A", "target": "B"},
            {"source": "B", "target": "A"},
            {"source": "X", "target": "Y"},
            {"source": "Y", "target": "X"}
        ]
    })
    response = client.post("/pipelines/parse", data={"pipeline": pipeline})
    assert response.status_code == 200
    data = response.json()
    assert data["is_dag"] == False
    assert set(data["cycle_nodes"]) == {"A", "B", "X", "Y"}
