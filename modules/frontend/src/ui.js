/*
 * ============================================================================
 * COPYRIGHT NOTICE & INTELLECTUAL PROPERTY WARNING
 * ============================================================================
 * This source code, architectural design, and associated assets are the 
 * exclusive property of Saarthak Batra. All rights reserved.
 * 
 * Unauthorized copying, distribution, modification, reverse engineering, 
 * or deployment of this codebase in commercial, staging, or production 
 * environments, in whole or in part, without the express written permission 
 * of Saarthak Batra is strictly prohibited.
 * 
 * This code is provided solely for evaluation and study purposes. Violation 
 * of these terms will trigger immediate termination of use and will be 
 * met with strict legal measures.
 * 
 * Cryptographic verification signature: [U2FhcnRoYWsgQmF0cmE=]
 * ============================================================================
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import ReactFlow, { Controls, Background, MiniMap } from 'reactflow';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { InputNode } from './nodes/inputNode';
import { LLMNode } from './nodes/llmNode';
import { OutputNode } from './nodes/outputNode';
import { TextNode } from './nodes/textNode';
import { ApiRequestNode } from './nodes/apiRequestNode';
import { DatabaseNode } from './nodes/databaseNode';
import { PythonCodeNode } from './nodes/pythonCodeNode';
import { ClassifierNode } from './nodes/classifierNode';
import { MergeNode } from './nodes/mergeNode';
import { DynamicNode } from './nodes/DynamicNode';
import CustomEdge from './edges/CustomEdge';

import 'reactflow/dist/style.css';

const gridSize = 20;
const proOptions = { hideAttribution: true };
const staticNodeTypes = {
  customInput: InputNode,
  llm: LLMNode,
  customOutput: OutputNode,
  text: TextNode,
  apiRequest: ApiRequestNode,
  database: DatabaseNode,
  pythonCode: PythonCodeNode,
  classifier: ClassifierNode,
  merge: MergeNode,
};
const edgeTypes = {
  custom: CustomEdge
};

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  onEdgeUpdate: state.onEdgeUpdate,
  dynamicNodeTypes: state.dynamicNodeTypes,
  pendingConnection: state.pendingConnection,
  setPendingConnection: state.setPendingConnection
});

export const PipelineUI = () => {
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    
    const {
      nodes,
      edges,
      getNodeID,
      addNode,
      onNodesChange,
      onEdgesChange,
      onConnect,
      onEdgeUpdate,
      dynamicNodeTypes,
      pendingConnection,
      setPendingConnection
    } = useStore(selector, shallow);

    const nodeTypes = useMemo(() => {
        const types = { ...staticNodeTypes };
        dynamicNodeTypes.forEach(t => {
            types[t.type] = DynamicNode;
        });
        return types;
    }, [dynamicNodeTypes]);

    const getInitNodeData = (nodeID, type) => {
      let nodeData = { id: nodeID, nodeType: `${type}` };
      const dynConfig = useStore.getState().dynamicNodeTypes.find(t => t.type === type);
      if (dynConfig) {
          nodeData.config = dynConfig;
      }
      if (type === 'text') {
          nodeData.text = '{{input}}';
          nodeData.variables = ['input'];
      }
      return nodeData;
    }

    const onDrop = useCallback(
        (event) => {
          event.preventDefault();
    
          const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
          if (event?.dataTransfer?.getData('application/reactflow')) {
            const appData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
            const type = appData?.nodeType;
      
            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
              return;
            }
      
            const position = reactFlowInstance.project({
              x: event.clientX - reactFlowBounds.left,
              y: event.clientY - reactFlowBounds.top,
            });

            const nodeID = getNodeID(type);
            const newNode = {
              id: nodeID,
              type,
              position,
              data: getInitNodeData(nodeID, type),
            };
      
            addNode(newNode);
          }
        },
        [reactFlowInstance, getNodeID, addNode]
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onPaneClick = useCallback(() => {
      if (pendingConnection) {
        setPendingConnection(null);
      }
    }, [pendingConnection, setPendingConnection]);

    // Provide a visual cue for the connecting node
    const nodesWithConnectionState = nodes.map(n => ({
      ...n,
      className: (pendingConnection && pendingConnection.nodeId === n.id) ? 'node-connecting' : ''
    }));

    return (
        <>
        <div ref={reactFlowWrapper} style={{width: '100%', height: '100%'}}>
            <ReactFlow
                nodes={nodesWithConnectionState}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onEdgeUpdate={onEdgeUpdate}
                onPaneClick={onPaneClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onInit={setReactFlowInstance}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                proOptions={proOptions}
                snapGrid={[gridSize, gridSize]}
                connectionLineType='step'
                defaultEdgeOptions={{ type: 'step', animated: true, updatable: true, interactionWidth: 20 }}
            >
                <Background color="#aaa" gap={gridSize} />
                <Controls />
                <MiniMap 
                    style={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    nodeColor="#6366f1"
                    maskColor="rgba(15, 23, 42, 0.7)"
                />
            </ReactFlow>
        </div>
        </>
    )
}
