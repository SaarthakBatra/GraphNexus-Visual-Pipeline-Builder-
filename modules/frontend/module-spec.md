# Frontend Module Specification

## 1. Overview
The `frontend` module provides the React Flow canvas for pipeline construction.

## 2. Components
- **BaseNode:** Abstraction for dynamic handles and styles. Uses a Render Prop pattern (`children(connectionMode)`) to pass active connection states down, and features an explicit connection (+) button for launching modal overlays.
- **TextNode:** Features robust Binary Sizing (40px unselected -> 200px selected/targeted) and `{{ variable }}` regex parsing for dynamic handle generation.
- **Store:** Zustand store with structural history tracking (Undo/Redo), orphaned edge cleanup (including atomic edge cleanup during TextNode variable deletions), and `localStorage` persistence logic.
- **UI Canvas:** Implements explicit connection architecture via modal overlays, and features selectable edges with custom Red "X" deletion buttons.
- **Modal:** Custom UI for pipeline parsing results using a safe version of Axios for API requests.
- **Dynamic Nodes:** Allows users to define custom nodes via the UI wizard. Generated configurations are stored in `store.js` and rendered via `DynamicNode.js`.
- **Top Bar:** A dedicated header component managing the Project Name and the dropdown menu for JSON Export/Import functionality.
- **Toolbar:** A single-line horizontally scrolling tray featuring custom ❮ and ❯ navigation buttons, housing the 4 base nodes and user-defined dynamic nodes.

## 3. Styling & Design System
- **Dark Theme & Glassmorphism:** Uses a global dark theme (`#0f172a` app background, `#1e293b` top bar).
- **Node Stability:** Nodes leverage a global `.base-node` class for glassmorphic properties. Hover states use perfectly smooth `box-shadow` and `border-color` transitions. Text nodes and overlays utilize custom transparent Webkit scrollbars (`#cbd5e1` thumbs) to handle massive variable lists seamlessly.
- **Active Elements:** Active elements utilize a primary accent color (`#6366f1` indigo). Connection Overlays dynamically map CSS offset padding to skip headers safely.

## 4. Workflow Examples & Edge Cases
### Normal Flow: Explicit Connection Overlay (Phase 5.5)
- **Scenario:** User clicks the (+) button on a heavily populated Text Node.
- **Behavior:** The `connectionMode` switches to 'source'. A scrollable modal overlay renders across the node displaying all output handles (title-cased, right-aligned) without bleeding into the title bar.

### Normal Flow: Creating a Dynamic Node Template
- **Scenario:** User clicks the `+` wizard in the toolbar.
- **Behavior:** User builds a custom "Email" node using the 9-color swatch selector and field generators. The new template renders dynamically in the horizontal scrolling toolbar.

### Edge Case: Click-to-Connect Stabilization
- **Scenario:** User clicks a node to initiate a connection, setting `pendingConnection`.
- **Behavior:** To prevent jumpiness, the node actively suppresses its selection-based resize trigger while `pendingConnection` is active, keeping the node perfectly stable while wiring.

### Edge Case: Sanitized Edge Injection (Phase 5.6)
- **Scenario:** React Flow natively fires `onConnect` but occasionally omits explicit `sourceHandle` or `targetHandle` definitions depending on handle clicks.
- **Behavior:** `ui.js` sanitizes the incoming payload to fallback to `null` instead of `undefined`, completely neutralizing silent edge rendering bugs in React Flow.

### Edge Case: Workspace Auto-Recovery
- **Scenario:** A user accidentally closes their browser tab mid-session.
- **Behavior:** The `App.js` `localStorage` subscription automatically restores the `nodes`, `edges`, `dynamicNodeTypes`, and `projectName` upon the next render, ensuring zero data loss.

### Edge Case: Orchestrating Node Deletions
- **Scenario:** User clicks the top-right 'X' on a deeply connected `llmNode`.
- **Behavior:** `store.js` executes `removeNode`, successfully unmounting the node, and immediately iterates through the edges state to purge any dangling source or target connections that were tied to that node.

### Edge Case: Stale Closures on Canvas Drop
- **Scenario:** User drops a dynamically created node onto the canvas.
- **Behavior:** Due to the `useCallback` fix in Phase 4, the drop handler correctly queries the most recent `dynamicNodeTypes` from the Zustand store instead of capturing stale initial state, rendering the node flawlessly.

### Edge Case: Hybrid Auto-Shifting Routing (Phase 6)
- **Scenario:** A power user builds a massive 20-node RAG pipeline and clicks submit.
- **Behavior:** `submit.js` strips the complex React Flow objects down to pure `{id}` and `{source, target}` payloads. It detects `nodes.length > 15` and transparently routes the payload via a stateful WebSocket (`ws://localhost:8000/pipelines/run/ws`) to bypass traditional HTTP timeouts for heavy processing.

### Edge Case: Cycle Node UI Highlighting (Phase 6)
- **Scenario:** A user accidentally feeds their LLM output back into their Prompt input, creating a cycle.
- **Behavior:** The backend Kahn's algorithm halts and returns `is_dag: false` alongside `cycle_nodes: ["llm-1", "prompt-1"]`. The `<SubmitModal>` component gracefully intercepts this payload, rendering a dark-themed overlay that explicitly lists the precise node IDs causing the loop under a red warning badge.

## 5. Sync Requirements (Hybrid Auto-Shifting Strategy) (Completed Phase 6)
- The frontend `submit.js` logic dynamically routes the pipeline submission via HTTP POST (for small graphs <= 15 nodes) or WebSocket (for complex graphs >15 nodes) by analyzing the Zustand store state. The payload is aggressively stripped before transmission to optimize network bandwidth.

## 6. Dependencies
- UI Libraries allowed: `lucide-react`, `react-icons`.
- API Client: Safe version of `axios` (e.g., `^1.7.2`).
