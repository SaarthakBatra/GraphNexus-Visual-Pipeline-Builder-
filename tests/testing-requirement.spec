# VectorShift Testing Specification (Agent-Facing)

## 1. Overview
This specification governs the automated testing pipeline for all VectorShift agents. Every agent tasked with building features, initializing modules, or patching bugs MUST adhere to this specification.

- **Universal Orchestrator:** The absolute source of truth for test discovery and verification is `tests/run_all.sh`.
- **Single Scoping Exception:** While agents are strictly scoped to editing their respective `modules/<module_name>/` directories, they are granted explicit authorization to write and edit test files under the central `tests/` directory within their module's test path.

---

## 2. Frameworks & Requirements

### A. Backend Testing (modules/backend)
- **Framework:** `pytest`
- **Integration Tooling:** FastAPI `TestClient` (`httpx`)
- **Requirements:** 
  - Unit tests for DFS cycle detection and DAG evaluation.
  - Integration tests for `POST /pipelines/parse` endpoint.
  - Must mock external states if any exist.

### B. Frontend Testing (modules/frontend)
- **Framework:** `Jest` with `@testing-library/react`
- **Requirements:**
  - Verify drag-and-drop mechanics of node abstractions.
  - Test dynamic resizing of text nodes.
  - Ensure variable handles `{{ variable }}` correctly render and clean up upon deletion.
  - Must mock any network calls (e.g. Axios `POST`) during tests.

---

## 3. Test File Placement & Namespaces
To maintain isolation between product logic and test setups, all test suites are **centrally aggregated** in the root `tests/` directory.

### A. Backend Modules
- **Path:** `tests/backend/`
- **Naming Pattern:** `test_*.py` (e.g., `tests/backend/test_main.py`)

### B. Frontend Modules
- **Path:** `tests/frontend/`
- **Naming Pattern:** `*.test.js` or `*.test.jsx` (e.g., `tests/frontend/submit.test.js`)

---

## 4. Recursive Discovery Protocol
The master orchestrator `tests/run_all.sh` operates via recursive directory scanning. 

- **Backend Scan:** `pytest` is executed from the `modules/backend/` directory but pointed to scan `../../tests/backend/` for `test_*.py` files.
- **Frontend Scan:** `npm test` is configured to scan all matching test files in `tests/frontend/` by overriding the Jest test roots.

---

## 5. Agent Checklist: Creating a New Test Suite
1. **Locate Target Path:** Identify the exact test directory (`tests/backend/` or `tests/frontend/`).
2. **Create Test File:** Generate a test file following standard naming patterns. Do not create tests inside `modules/`.
3. **Implement Suite:** Write isolated, deterministic assertions using the mandated frameworks.
4. **Local Verification:** Execute tests locally to confirm they pass.
5. **Orchestrator Run:** Execute the master orchestrator to verify automatic recursive discovery:
   ```bash
   ./tests/run_all.sh
   ```
