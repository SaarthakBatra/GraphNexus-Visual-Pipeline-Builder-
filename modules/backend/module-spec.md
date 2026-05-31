# Backend Module Specification

## 1. Overview
The `backend` module handles pipeline validation, checking for node counts, edge counts, and Directed Acyclic Graph (DAG) integrity.

## 2. Endpoints
### `POST /pipelines/parse` (REST)
- **CORS:** Restricted to `http://localhost:3000` and `http://127.0.0.1:3000`.
- **Payload:** `pipeline` (Form Data stringified JSON).
- **Logic:** Parses JSON, builds adjacency lists, runs Kahn's Algorithm. Returns HTTP 400 on bad JSON.
- **Response:** `{ "num_nodes": int, "num_edges": int, "is_dag": bool, "cycle_nodes": list[str] }`

### `WS /pipelines/run/ws` (WebSocket)
- **Payload:** Text data (stringified JSON).
- **Logic:** 
  - Parses JSON. If malformed, sends `{"type": "error"}` and closes with standard `1003` code.
  - Pushes a real-time `{"type": "progress"}` payload.
  - Implements a simulated async latency (`asyncio.sleep(0.5)`) for small graphs in debug mode to mimic LLM/API long-running processing.
  - Executes the DRY `validate_pipeline()` function.
  - Pushes the final `{"type": "result"}` payload formatted identically to the REST response.
  - Gracefully handles `WebSocketDisconnect`.

## 3. Real World Examples & Edge Cases
### Normal Flow: Valid Pipeline
- **Scenario:** Frontend POSTs a DAG (Input -> Prompt -> LLM -> Output).
- **Behavior:** Backend processes all nodes. Returns `{"num_nodes": 4, "num_edges": 3, "is_dag": true}`. `cycle_nodes` is gracefully omitted or empty.

### Edge Case: Cyclic Pipeline
- **Scenario:** Frontend POSTs nodes connected in an endless loop (A -> B -> C -> A).
- **Behavior:** Kahn's algorithm halts prematurely due to non-zero in-degrees. The backend sweeps the map to collect trapped nodes. Returns `{"num_nodes": 3, "num_edges": 3, "is_dag": false, "cycle_nodes": ["A", "B", "C"]}`.

### Edge Case: Disjoint Graphs
- **Scenario:** Frontend POSTs a pipeline with multiple disconnected components on the same canvas, where one component is acyclic but another has a cycle.
- **Behavior:** Kahn's algorithm processes the acyclic component successfully but halts when the cycle is encountered. `is_dag` evaluates to `false`.

### Edge Case: Client Disconnection
- **Scenario:** A user refreshes their browser window while a long-running pipeline is streaming over the WebSocket.
- **Behavior:** The backend explicitly catches the `WebSocketDisconnect` exception, logs a graceful info message (`"Client disconnected abruptly."`), and prevents unhandled server errors.

## 4. Architectural Decision: Kahn's Algorithm vs 3-State DFS
While 3-State DFS is computationally identical in Big-O time complexity to Kahn's Algorithm ($O(V + E)$), Kahn's Algorithm was chosen to eliminate Python's recursion limit vulnerability (`RecursionError`), which crashes DFS implementations for deep linear graphs. Kahn's is iterative, queue-based, and serves as an industry standard for workflow orchestrators because it implicitly validates graph schedulability.

## 5. Sync Requirements (Hybrid Auto-Shifting Strategy) - IMPLEMENTED
- **Status:** Fully implemented in Phase 2.
- **Architecture:** The backend successfully exposes both REST and WebSocket endpoints. Both interfaces strictly delegate to the same shared service function (`validate_pipeline()`) to maintain DRY principles.
- **Orchestration Layer:** The Frontend client (React/Zustand) evaluates the graph state and makes the routing decision dynamically. 
- **Trigger Criteria:** Node threshold exceeded (e.g., >15 nodes) or the presence of complex nodes (LLMs, API, Python Code) shifts the transport to the WebSocket endpoint for real-time progress rendering.
