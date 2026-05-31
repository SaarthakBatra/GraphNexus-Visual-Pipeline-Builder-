# Module Dependency Graph: Frontend

```mermaid
graph TD
    App --> TopBar
    App --> Toolbar
    App --> UI_Canvas
    App --> SubmitModal
    
    TopBar --> Persistence[Save/Load JSON Backup]
    TopBar --> ProjectName[Project Titling]
    
    Toolbar --> BaseNodes[Input, Output, LLM, Text]
    Toolbar --> DynamicWizard[+ Custom Node Creator]
    Toolbar --> ScrollNav[❮ ❯ Scrolling Navigation]
    
    UI_Canvas --> BaseNode
    UI_Canvas --> CustomEdge[CustomEdge w/ Deletion UI]
    
    BaseNode --> RenderProp[Render Prop: connectionMode]
    RenderProp --> HandleOverlay[Scrollable Handle Overlay]
    RenderProp --> DynamicNode[Generic Dynamic Renderer]
    RenderProp --> TextNode[Smart Binary Sizing Node]
    
    App --> Store[Zustand Store]
    
    subgraph State Management
        Store --> History[Undo/Redo Stack]
        Store --> EdgeCleanup[Orphaned Edge Cleanup]
        Store --> LocalStorage[Auto-Save Subscriptions]
    end
    
    subgraph Advanced Interactions
        UI_Canvas --> ExplicitConnection[(+) Button Connection Overlay]
        UI_Canvas --> CustomEdge
    end

    SubmitModal --> Axios[Axios HTTP Client]
    SubmitModal --> APIOrchestrator[Hybrid HTTP/WS Orchestrator]
```
