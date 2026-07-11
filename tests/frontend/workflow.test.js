const React = require('react');
const { render, screen, fireEvent, act } = require('@testing-library/react');
const { useStore } = require('../../modules/frontend/src/store');
const { TextNode } = require('../../modules/frontend/src/nodes/textNode');
const { SubmitButton } = require('../../modules/frontend/src/submit');
const axios = require('axios');

// Mock axios
jest.mock('axios');

// Mock reactflow
jest.mock('reactflow', () => {
  const React = require('react');
  const Handle = ({ type, position, id, style }) => (
    React.createElement('div', {
      'data-testid': `handle-${type}-${position}`,
      id,
      style,
      className: 'mock-handle'
    })
  );
  return {
    __esModule: true,
    default: ({ children }) => React.createElement('div', { className: 'react-flow-mock' }, children),
    Handle,
    Position: {
      Left: 'left',
      Right: 'right',
      Top: 'top',
      Bottom: 'bottom',
    },
    Controls: () => React.createElement('div', { className: 'react-flow-controls' }),
    Background: () => React.createElement('div', { className: 'react-flow-background' }),
    MiniMap: () => React.createElement('div', { className: 'react-flow-minimap' }),
    MarkerType: {
      Arrow: 'arrow',
    },
    addEdge: (conn, edges) => [...edges, conn],
    applyNodeChanges: (changes, nodes) => nodes,
    applyEdgeChanges: (changes, edges) => edges,
    updateEdge: (oldEdge, newConnection, edges) => edges,
  };
});

describe('GraphNexus Frontend Workflow Tests', () => {
  beforeEach(() => {
    // Reset store state
    act(() => {
      useStore.setState({
        nodes: [],
        edges: [],
        past: [],
        future: [],
        projectName: 'Untitled Project',
        dynamicNodeTypes: [],
        pendingConnection: null,
        enlargedTextNodeId: null,
      });
    });
    jest.clearAllMocks();
  });

  // 1. Verify drag-and-drop mechanics of node abstractions.
  test('Store handles node addition, drag/drop state, and deletion', () => {
    const store = useStore.getState();
    expect(store.nodes.length).toBe(0);

    // Add a node (simulating dropped node creation)
    act(() => {
      useStore.getState().addNode({
        id: 'input-1',
        type: 'customInput',
        position: { x: 100, y: 150 },
        data: { id: 'input-1', nodeType: 'customInput' }
      });
    });

    expect(useStore.getState().nodes.length).toBe(1);
    expect(useStore.getState().nodes[0].id).toBe('input-1');
    expect(useStore.getState().nodes[0].type).toBe('customInput');

    // Add another node
    act(() => {
      useStore.getState().addNode({
        id: 'output-1',
        type: 'customOutput',
        position: { x: 400, y: 150 },
        data: { id: 'output-1', nodeType: 'customOutput' }
      });
    });

    // Connect them
    act(() => {
      useStore.getState().onConnect({
        source: 'input-1',
        sourceHandle: 'input-1-value',
        target: 'output-1',
        targetHandle: 'output-1-value'
      });
    });

    expect(useStore.getState().edges.length).toBe(1);

    // Remove node
    act(() => {
      useStore.getState().removeNode('input-1');
    });

    // Node count should be 1, and connection should be cleaned up (no dangling edges)
    expect(useStore.getState().nodes.length).toBe(1);
    expect(useStore.getState().edges.length).toBe(0);
  });

  // 2. Test dynamic resizing of text nodes.
  test('TextNode changes its size/styles based on text length and selection', () => {
    const textNodeData = { id: 'text-1', text: 'short text', variables: [] };

    // Unselected TextNode
    const { container, rerender } = render(
      React.createElement(TextNode, { id: 'text-1', data: textNodeData, selected: false })
    );

    // Unselected TextNode is not expanded, isExpanded should evaluate to false
    // Inside TextNode.js, height: isExpanded ? '200px' : '40px'
    let textareaContainer = container.querySelector('div[style*="height"]');
    expect(textareaContainer.style.height).toBe('40px');

    // Selected and filled TextNode (text length > 25 characters)
    const filledData = { id: 'text-1', text: 'This is a very long text that exceeds twenty-five characters', variables: [] };
    rerender(
      React.createElement(TextNode, { id: 'text-1', data: filledData, selected: true })
    );
    
    textareaContainer = container.querySelector('div[style*="height"]');
    expect(textareaContainer.style.height).toBe('200px');
  });

  // 3. Ensure variable handles {{ variable }} correctly render and clean up upon deletion.
  test('TextNode parses variables, renders handles, and cleans up orphaned edges upon deletion', () => {
    // Initial state with {{input}}
    act(() => {
      useStore.getState().addNode({
        id: 'text-1',
        type: 'text',
        position: { x: 100, y: 100 },
        data: { id: 'text-1', nodeType: 'text', text: 'Hello {{name}}', variables: ['name'] }
      });
      // Add a dummy node to connect to the target variable handle 'name'
      useStore.getState().addNode({
        id: 'input-1',
        type: 'customInput',
        position: { x: 10, y: 100 },
        data: { id: 'input-1', nodeType: 'customInput' }
      });
      // Connect input-1 to target handle 'name' on text-1
      useStore.getState().onConnect({
        source: 'input-1',
        sourceHandle: 'input-1-val',
        target: 'text-1',
        targetHandle: 'name'
      });
    });

    expect(useStore.getState().edges.length).toBe(1);
    expect(useStore.getState().nodes[0].data.variables).toEqual(['name']);

    // Render TextNode to check handle creation
    const { container, rerender } = render(
      React.createElement(TextNode, { id: 'text-1', data: useStore.getState().nodes[0].data, selected: true })
    );

    // There should be a handle mock with id="name"
    const handleElement = container.querySelector('#name');
    expect(handleElement).not.toBeNull();

    // Now update text to remove {{name}} and add {{age}}
    act(() => {
      useStore.getState().updateTextNode('text-1', 'Hello {{age}}');
    });

    expect(useStore.getState().nodes[0].data.variables).toEqual(['age']);
    // The connection to 'name' handle should be removed (cleaned up)
    expect(useStore.getState().edges.length).toBe(0);

    // Rerender TextNode to see new handle
    rerender(
      React.createElement(TextNode, { id: 'text-1', data: useStore.getState().nodes[0].data, selected: true })
    );
    expect(container.querySelector('#name')).toBeNull();
    expect(container.querySelector('#age')).not.toBeNull();
  });

  // 4. Must mock any network calls (e.g. Axios POST) during tests.
  test('SubmitButton triggers Axios POST for <=15 nodes and WebSocket for >15 nodes', async () => {
    // Mock Axios POST response
    const mockPostResult = { data: { num_nodes: 3, num_edges: 2, is_dag: true } };
    axios.post.mockResolvedValueOnce(mockPostResult);

    const onResultMock = jest.fn();

    // Setup <= 15 nodes state
    act(() => {
      useStore.setState({
        nodes: [
          { id: '1' }, { id: '2' }, { id: '3' }
        ],
        edges: [
          { source: '1', target: '2' }, { source: '2', target: '3' }
        ],
        past: []
      });
    });

    render(
      React.createElement(SubmitButton, { onResult: onResultMock })
    );

    // Click submit
    const submitBtn = screen.getByText('Submit');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Verify Axios was called
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:8000/pipelines/parse',
      expect.any(FormData)
    );
    expect(onResultMock).toHaveBeenCalledWith(mockPostResult.data);

    // Now test > 15 nodes (WebSocket flow)
    const mockWsInstance = {
      send: jest.fn(),
      close: jest.fn(),
    };
    
    // Mock global WebSocket class
    const OriginalWebSocket = global.WebSocket;
    global.WebSocket = jest.fn().mockImplementation(() => mockWsInstance);

    // Setup >15 nodes state (16 nodes)
    const sixteenNodes = Array.from({ length: 16 }, (_, i) => ({ id: `node-${i}` }));
    act(() => {
      useStore.setState({
        nodes: sixteenNodes,
        edges: [],
        past: []
      });
    });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // WebSocket should be instantiated with correct URL
    expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:8000/pipelines/run/ws');
    
    // Simulate connection open
    act(() => {
      mockWsInstance.onopen();
    });

    // WebSocket should send the message
    expect(mockWsInstance.send).toHaveBeenCalledWith(
      JSON.stringify({ nodes: sixteenNodes, edges: [] })
    );

    // Simulate message event from WebSocket
    const wsResultPayload = { type: 'result', data: { num_nodes: 16, num_edges: 0, is_dag: true } };
    act(() => {
      mockWsInstance.onmessage({ data: JSON.stringify(wsResultPayload) });
    });

    expect(onResultMock).toHaveBeenCalledWith(wsResultPayload.data);
    expect(mockWsInstance.close).toHaveBeenCalled();

    // Restore original WebSocket
    global.WebSocket = OriginalWebSocket;
  });
});
