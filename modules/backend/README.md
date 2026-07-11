# Backend Module

FastAPI Python server for the GraphNexus pipeline application.

## Architectural Decisions
1. **Cycle Detection (Kahn's Algorithm):** We transitioned from 3-State DFS to Kahn's Algorithm. Kahn's queue-based topological sort fundamentally avoids Python's recursion depth vulnerability (`RecursionError` on deep linear pipelines) and implicitly validates task schedulability. In Phase 6, we extended this to evaluate the residual `in_degree` map, allowing us to explicitly isolate and return `cycle_nodes` to the frontend for precise error mapping.
2. **Hybrid Auto-Shifting Strategy:** The backend is designed with dual-interface support to handle diverse workloads:
   - **REST (`POST /pipelines/parse`):** A stateless, fast endpoint for small pipelines.
   - **WebSocket (`WS /pipelines/run/ws`):** A stateful streaming endpoint for complex pipelines (e.g., LLMs, API calls). Both endpoints invoke the identical underlying `validate_pipeline()` function to uphold DRY principles.
3. **Resilient Error Handling:** The WebSocket implementation proactively catches `json.JSONDecodeError` (yielding HTTP 1003) and gracefully handles `WebSocketDisconnect` exceptions to prevent noisy server crash logs when a client refreshes their browser mid-execution.

## Logging Subsystem
Controlled by a `.env` `DEBUG=true` flag with a customized formatter designed to support external log aggregators (e.g., DataDog, Fluentd).

## Workflows, Pipelines & Real World Examples
- **Normal Flow (Standard DAG):** A user submits a pipeline with an Input node, an LLM node, and an Output node. Kahn's algorithm iterates through all nodes perfectly. The JSON response returns `num_nodes: 3, num_edges: 2, is_dag: true`.
- **Edge Case (Cyclic Pipeline):** A user creates a feedback loop (e.g., Output feeds back into Input). Kahn's algorithm halts prematurely because the in-degrees never reach 0. By analyzing the residual in-degree map, the backend identifies the exact nodes forming the loop. Response yields `is_dag: false` alongside `cycle_nodes: ["output-1", "input-1"]`.
- **Edge Case (Disjoint Graphs):** A pipeline contains two completely disconnected workflows on the same canvas. One is acyclic, the other has a cycle. Kahn's processes the acyclic one, halts on the cyclic one, correctly evaluating `is_dag: false` and mapping the offending nodes.
- **Edge Case (Malformed Payload):** The frontend sends a broken JSON string. The REST endpoint returns `400 Bad Request`, while the WebSocket endpoint sends `{"type": "error", "message": "Invalid JSON payload"}` and gracefully closes with standard code `1003 (Unsupported Data)`.

## Running
`pip install -r requirements.txt`
`uvicorn main:app --reload`

## Testing
Run backend tests via the orchestrator script from the root directory:
`../../tests/run_all.sh`

For explicit execution details (cURL payloads and commands), refer to [testing_guide.md](./testing_guide.md).
