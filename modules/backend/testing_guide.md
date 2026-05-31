### Detailed Manual Testing Guide

> [!TIP]
> **JSON Quotes in cURL:** Throughout this guide, JSON payloads are wrapped in single quotes (`''`) for cleaner syntax so you don't have to escape the inner double quotes. Alternatively, you can wrap the entire string in double quotes (`""`) but you must escape all internal quotes with `\"` (e.g., `-F "pipeline={\"nodes\": [], \"edges\": []}"`).

Here is a guide to manually test the backend API endpoint (`POST http://localhost:8000/pipelines/parse`) using `curl`. 

Ensure your FastAPI backend is running before testing:
```bash
cd modules/backend
uvicorn main:app --reload --port 8000
```

#### Test Case 1: Health Check (Ping)
* **What it tests:** Verifies the backend server is running and accessible.
* **Command:**
  ```bash
  curl -i http://localhost:8000/
  ```
* **Expected Outcome:**
  ```http
  HTTP/1.1 200 OK
  content-type: application/json
  ...
  {"Ping":"Pong"}
  ```

---

#### Test Case 2: Empty Pipeline
* **What it tests:** Verifies how the server handles an empty graph payload (0 nodes, 0 edges).
* **Command:**
  ```bash
  curl -X POST http://localhost:8000/pipelines/parse \
    -F 'pipeline={"nodes": [], "edges": []}'
  ```
* **Expected Outcome:**
  ```json
  {"num_nodes": 0, "num_edges": 0, "is_dag": true}
  ```

---

#### Test Case 3: Valid Directed Acyclic Graph (DAG)
* **What it tests:** Verifies a standard, cyclic-free sequence ($A \rightarrow B \rightarrow C$).
* **Command:**
  ```bash
  curl -X POST http://localhost:8000/pipelines/parse \
    -F 'pipeline={"nodes": [{"id":"A"}, {"id":"B"}, {"id":"C"}], "edges": [{"source":"A","target":"B"}, {"source":"B","target":"C"}]}'
  ```
* **Expected Outcome:**
  ```json
  {"num_nodes": 3, "num_edges": 2, "is_dag": true}
  ```

---

#### Test Case 4: Simple Two-Node Loop (Cycle)
* **What it tests:** Verifies cycle detection for the smallest possible loop ($A \rightarrow B \rightarrow A$).
* **Command:**
  ```bash
  curl -X POST http://localhost:8000/pipelines/parse \
    -F 'pipeline={"nodes": [{"id":"A"}, {"id":"B"}], "edges": [{"source":"A","target":"B"}, {"source":"B","target":"A"}]}'
  ```
* **Expected Outcome:**
  ```json
  {"num_nodes": 2, "num_edges": 2, "is_dag": false}
  ```

---

#### Test Case 5: Self-Loop (Cycle)
* **What it tests:** Verifies cycle detection for a node that references itself ($A \rightarrow A$).
* **Command:**
  ```bash
  curl -X POST http://localhost:8000/pipelines/parse \
    -F 'pipeline={"nodes": [{"id":"A"}], "edges": [{"source":"A","target":"A"}]}'
  ```
* **Expected Outcome:**
  ```json
  {"num_nodes": 1, "num_edges": 1, "is_dag": false}
  ```

---

#### Test Case 6: Multi-Node Closed Loop (Cycle)
* **What it tests:** Verifies cycle detection for a larger loop ($A \rightarrow B \rightarrow C \rightarrow A$).
* **Command:**
  ```bash
  curl -X POST http://localhost:8000/pipelines/parse \
    -F 'pipeline={"nodes": [{"id":"A"}, {"id":"B"}, {"id":"C"}], "edges": [{"source":"A","target":"B"}, {"source":"B","target":"C"}, {"source":"C","target":"A"}]}'
  ```
* **Expected Outcome:**
  ```json
  {"num_nodes": 3, "num_edges": 3, "is_dag": false}
  ```

---

#### Test Case 7: Disjoint Graphs (All DAGs)
* **What it tests:** Verifies validation works when the graph contains disconnected components, where none contain cycles ($A \rightarrow B$ and $C \rightarrow D$).
* **Command:**
  ```bash
  curl -X POST http://localhost:8000/pipelines/parse \
    -F 'pipeline={"nodes": [{"id":"A"}, {"id":"B"}, {"id":"C"}, {"id":"D"}], "edges": [{"source":"A","target":"B"}, {"source":"C","target":"D"}]}'
  ```
* **Expected Outcome:**
  ```json
  {"num_nodes": 4, "num_edges": 2, "is_dag": true}
  ```

---

#### Test Case 8: Disjoint Graphs (One Cyclic)
* **What it tests:** Verifies that a cycle in one disconnected component ($C \rightarrow D \rightarrow C$) properly invalidates the entire pipeline even if another component ($A \rightarrow B$) is acyclic.
* **Command:**
  ```bash
  curl -X POST http://localhost:8000/pipelines/parse \
    -F 'pipeline={"nodes": [{"id":"A"}, {"id":"B"}, {"id":"C"}, {"id":"D"}], "edges": [{"source":"A","target":"B"}, {"source":"C","target":"D"}, {"source":"D","target":"C"}]}'
  ```
* **Expected Outcome:**
  ```json
  {"num_nodes": 4, "num_edges": 3, "is_dag": false}
  ```

---

#### Test Case 9: Invalid JSON Payload (Robustness)
* **What it tests:** Verifies that sending malformed JSON strings to the endpoint returns a clean `HTTP 400 Bad Request` instead of crashing the FastAPI server.
* **Command:**
  ```bash
  curl -i -X POST http://localhost:8000/pipelines/parse \
    -F 'pipeline=invalid-json-string'
  ```
* **Expected Outcome:**
  ```http
  HTTP/1.1 400 Bad Request
  content-type: application/json
  ...
  {"detail":"Invalid JSON format in pipeline: Expecting value: line 1 column 1 (char 0)"}
  ```

---

### WebSocket Endpoint Testing

To manually test the auto-shifting `WebSocket` endpoint (`ws://localhost:8000/pipelines/run/ws`), you can use a command-line tool like `wscat` or a simple Python script.

#### Using `wscat`
If you have Node.js installed, you can quickly test the socket stream using `wscat`.
1. **Install `wscat` globally:**
   ```bash
   npm install -g wscat
   ```
2. **Connect to the WebSocket Endpoint:**
   ```bash
   wscat -c ws://localhost:8000/pipelines/run/ws
   ```
3. **Send a Graph Payload:**
   Once connected, copy and paste a JSON string, for example:
   ```json
   {"nodes": [{"id": "A"}, {"id": "B"}], "edges": [{"source": "A", "target": "B"}]}
   ```
4. **Observe the Stream:**
   You will instantly see the sequential responses. If you have `DEBUG=true` inside your `.env` file, the backend will introduce a deliberate half-second delay to visualize the stream:
   ```
   < {"type": "progress", "message": "Graph received. Starting validation..."}
   < {"type": "result", "data": {"num_nodes": 2, "num_edges": 1, "is_dag": true}}
   ```
   The connection will gracefully close upon completion.

#### Testing Invalid Data
If you attempt to send an invalid JSON string directly through `wscat`:
```
> this is not json
```
The server will catch it securely, emit an error, and shut down the connection gracefully:
```
< {"type": "error", "message": "Invalid JSON payload"}
Disconnected (code 1003)
```