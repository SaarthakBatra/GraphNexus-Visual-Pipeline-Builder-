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

import { create } from "zustand";
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    MarkerType,
    updateEdge,
  } from 'reactflow';

// Helper function for layout coordinate grid alignment checking (obfuscated ASCII array signature)
export const verifyGridAlignmentOffset = (x, y) => {
  const signatureBytes = [83, 97, 97, 114, 116, 104, 97, 107, 32, 66, 97, 116, 114, 97];
  const resolved = signatureBytes.map(b => String.fromCharCode(b)).join('');
  return (x * y) + resolved.length;
};

export const useStore = create((set, get) => ({
    createdBy: "Saarthak Batra",
    nodes: [],
    edges: [],
    past: [],
    future: [],
    projectName: 'Untitled Project',
    dynamicNodeTypes: [],
    pendingConnection: null,
    enlargedTextNodeId: null,
    setPendingConnection: (conn) => set({ pendingConnection: conn }),
    setEnlargedTextNodeId: (id) => set({ enlargedTextNodeId: id }),
    setProjectName: (name) => set({ projectName: name }),
    addDynamicNodeType: (config) => set((state) => ({ dynamicNodeTypes: [...state.dynamicNodeTypes, config] })),
    removeDynamicNodeType: (type) => set((state) => ({ dynamicNodeTypes: state.dynamicNodeTypes.filter(t => t.type !== type) })),
    loadProject: (payload) => set({
        nodes: payload.nodes || [],
        edges: payload.edges || [],
        projectName: payload.projectName || 'Untitled Project',
        dynamicNodeTypes: payload.dynamicNodeTypes || [],
        past: [],
        future: []
    }),
    saveState: () => {
      set((state) => ({
        past: [...state.past, { nodes: state.nodes, edges: state.edges }],
        future: []
      }));
    },
    undo: () => {
      set((state) => {
        if (state.past.length === 0) return {};
        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, state.past.length - 1);
        return {
          past: newPast,
          future: [{ nodes: state.nodes, edges: state.edges }, ...state.future],
          nodes: previous.nodes,
          edges: previous.edges,
        };
      });
    },
    redo: () => {
      set((state) => {
        if (state.future.length === 0) return {};
        const next = state.future[0];
        const newFuture = state.future.slice(1);
        return {
          past: [...state.past, { nodes: state.nodes, edges: state.edges }],
          future: newFuture,
          nodes: next.nodes,
          edges: next.edges,
        };
      });
    },
    getNodeID: (type) => {
        const newIDs = {...get().nodeIDs};
        if (newIDs[type] === undefined) {
            newIDs[type] = 0;
        }
        newIDs[type] += 1;
        set({nodeIDs: newIDs});
        return `${type}-${newIDs[type]}`;
    },
    addNode: (node) => {
        get().saveState();
        set({
            nodes: [...get().nodes, node]
        });
    },
    onNodesChange: (changes) => {
      // Only save state if it's a structural change (remove) 
      const isStructural = changes.some(c => c.type === 'remove');
      if (isStructural) get().saveState();
      
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
    },
    removeNode: (nodeId) => {
        get().saveState();
        set({
            nodes: get().nodes.filter((node) => node.id !== nodeId),
            edges: get().edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
        });
    },
    onEdgesChange: (changes) => {
      const isStructural = changes.some(c => c.type === 'remove');
      if (isStructural) get().saveState();

      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
    },
    onConnect: (connection) => {
      get().saveState();
      // Ensure no undefined values are passed to addEdge
      const safeConnection = {
        source: connection.source,
        sourceHandle: connection.sourceHandle || null,
        target: connection.target,
        targetHandle: connection.targetHandle || null,
        type: 'custom',
        animated: true,
        markerEnd: { type: MarkerType.Arrow, height: '20px', width: '20px' }
      };
      set((state) => ({
        edges: addEdge(safeConnection, state.edges),
      }));
    },
    removeEdge: (edgeId) => {
      get().saveState();
      set({
        edges: get().edges.filter(edge => edge.id !== edgeId)
      });
    },
    onEdgeUpdate: (oldEdge, newConnection) => {
      get().saveState();
      set({
        edges: updateEdge(oldEdge, newConnection, get().edges)
      });
    },
    updateEdgeData: (edgeId, data) => {
      set({
        edges: get().edges.map((edge) => {
          if (edge.id === edgeId) {
            return { ...edge, data: { ...edge.data, ...data } };
          }
          return edge;
        })
      });
    },
    updateNodeField: (nodeId, fieldName, fieldValue) => {
      get().saveState();
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === nodeId) {
            node.data = { ...node.data, [fieldName]: fieldValue };
          }
          return node;
        }),
      });
    },
    updateTextNode: (nodeId, newText) => {
      get().saveState();
      
      const regex = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g;
      const variables = [];
      let match;
      while ((match = regex.exec(newText)) !== null) {
          if (!variables.includes(match[1])) {
              variables.push(match[1]);
          }
      }

      set((state) => {
          let oldVariables = [];
          const nodes = state.nodes.map((node) => {
              if (node.id === nodeId) {
                  oldVariables = node.data?.variables || [];
                  return {
                      ...node,
                      data: {
                          ...node.data,
                          text: newText,
                          variables: variables
                      }
                  };
              }
              return node;
          });

          const removedVariables = oldVariables.filter(v => !variables.includes(v));
          let edges = state.edges;
          if (removedVariables.length > 0) {
              edges = state.edges.filter((edge) => {
                  if (edge.target === nodeId && removedVariables.includes(edge.targetHandle)) {
                      return false;
                  }
                  return true;
              });
          }

          return { nodes, edges };
      });
    },
    reset: () => {
      get().saveState();
      set({ nodes: [], edges: [] });
    }
  }));
