# Frontend Module

React Flow workflow editor for GraphNexus.

## Architectural Decisions & UX Refinements
1. **Core Abstraction (BaseNode):** A core wrapper component for all pipeline nodes, enforcing a unified structure, glassmorphic styling, and standardized dynamic handle generation.
2. **State History (Undo/Redo):** A lightweight history stack (`past`, `future`) is implemented in `store.js` that tracks *structural* changes (node/edge additions and removals) while explicitly ignoring noisy coordinate drag events to prevent stack bloat.
3. **Explicit Connection Architecture (Phase 5.5):** Eliminated jittery hover-based "cross-hatch" connection zones. Introduced an explicit "Add Connection" (+) button that triggers a modal overlay showing all output handles. Hovering over a target node while connecting switches it to `connectionMode = 'target'`, displaying input handles in a scrollable list.
4. **Edge Editability:** Transitioned from Bezier curves to orthogonal "step" lines (`connectionLineType="step"`). Enabled full `onEdgeUpdate` logic allowing users to click and drag existing edge arrow tips to reconnect them seamlessly.
5. **UI Stability & Aesthetics:** Replaced jittery `transform: translateY` hover effects on nodes and connector dots with perfectly smooth `box-shadow` and `border-color` transitions. Applied a strict Slate/Indigo palette over glassmorphic backgrounds.
6. **Workspace Persistence (Phase 4):** The workspace state (nodes, edges, custom nodes, project name) is automatically persisted to `localStorage` via a robust subscription in `App.js`. Additionally, an import/export mechanism is exposed via a sleek top-bar dropdown menu for downloading/loading JSON backups.
7. **Modular UI Reorganization (Phase 4):** Abstracted top-level controls into a dedicated Top Bar (`#1e293b`). The toolbar is constrained to a single-line horizontal scrolling layout with custom ❮ and ❯ buttons. Hardcoded custom nodes were purged from the default UI, leaving only the 4 core primitives and the dynamic node wizard to ensure a pristine UI.
8. **Dynamic Node Polish (Phase 4):** Upgraded the wizard with a 9-color swatch palette and hex-input. Fixed `useCallback` stale closures in `ui.js` drop handlers. Handled layout scaling via flexbox ratios.
9. **Interaction Hardening (Phase 4):** Node deletion (clicking the X) now correctly triggers `store.js` to purge orphaned edges. Toolbar templates support hover-to-delete. LLM handles utilize pixel-perfect alignments (68px/98px offsets) mapping perfectly to explicit labels.
10. **Advanced Sizing & Render Props (Phase 5):** Replaced the "Ghost Div" logic with a robust Binary Sizing model (40px unselected, 200px selected). `BaseNode` implements a `typeof children === 'function'` render prop pattern to pass down connection states (`connectionMode`), enabling nodes like `TextNode` to detect target hovers and auto-expand to reveal massive handle lists.
11. **CSS Overlays & Scrollbars (Phase 5.5):** Implemented mathematically calculated CSS offsets to push handles perfectly past the node header. Introduced `.connection-mode-overlay` and transparent custom Webkit scrollbars (6px, `#cbd5e1`) to handle infinite dynamic handles gracefully without breaking bounds.
12. **Edge Injection & UI (Phase 5.6):** Synchronized edge injection back to native `addEdge()` while sanitizing payloads to fallback to `null` (fixing silent React Flow crashes). Engineered a custom `EdgeLabelRenderer` (via `CustomEdge.js`) to display an interactive red "X" deletion button directly on bezier/step curves upon selection.
13. **API Dispatcher & Modal (Phase 6):** Implemented a hybrid auto-shifting dispatcher in `submit.js` that routes small pipelines (<= 15 nodes) via Axios POST and large pipelines via WebSockets. Included an aggressive payload stripping strategy to optimize network traffic. Built a custom dark-themed `SubmitModal` to elegantly display execution results and pinpoint `cycle_nodes`.

## Dependencies & Constraints
- **Styling**: Uses standard CSS (`index.css`) establishing a global dark-themed, glassmorphic UI. A global `.base-node` class dictates the aesthetic for all nodes. Toolbar nodes use dedicated classes for clean states.
- **HTTP Client**: `axios` is approved for backend integration. We explicitly pin a known safe version (e.g., `axios@1.7.2` or later) due to recent malware concerns in the broader axios ecosystem.
- **State Management**: `zustand` is used for global state management and history tracking.

## Running
`npm install`
`npm start`
