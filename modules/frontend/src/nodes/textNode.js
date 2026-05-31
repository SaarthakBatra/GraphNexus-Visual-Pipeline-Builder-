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
import { useRef } from 'react';
import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useStore } from '../store';

export const TextNode = ({ id, data, selected }) => {
  const updateTextNode = useStore((state) => state.updateTextNode);
  const setEnlargedTextNodeId = useStore((state) => state.setEnlargedTextNodeId);
  const pendingConnection = useStore((state) => state.pendingConnection);
  const textAreaRef = useRef(null);
  
  // Calculate if the text needs more than 1 line (approx 40px)
  const isFilled = (data?.text || '').length > 25 || (data?.text || '').includes('\n');
  const variables = data?.variables || [];

  const handleTextChange = (e) => {
    updateTextNode(id, e.target.value);
  };

  const handles = [
    { type: 'source', position: Position.Right, id: `${id}-output`, style: { top: '50%' } },
    ...variables.map((variable, index) => ({
      type: 'target',
      position: Position.Left,
      id: variable,
      style: { top: `calc(40px + (100% - 40px) * ${(index + 1) / (variables.length + 1)})` }
    }))
  ];

  return (
    <BaseNode id={id} selected={selected} title="Text" color="#3b82f6" handles={handles}>
      {(connectionMode) => {
        // Expand if:
        // 1. It's selected, filled, and NOT initiating a connection.
        // 2. OR it is being hovered as a connection target (connectionMode active) AND it has variables.
        const isExpanded = (selected && isFilled && (!pendingConnection || pendingConnection.nodeId === id))
                        || (connectionMode === 'target' && variables.length > 1);

        return (
          <div style={{ padding: '8px', position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '4px', color: '#cbd5e1', fontSize: '12px' }}>
              Text:
            </label>
            {isFilled && (
              <button 
                className="text-enlarge-btn"
                onClick={() => setEnlargedTextNodeId(id)}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                }}
                title="Enlarge Text"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <polyline points="9 21 3 21 3 15"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              </button>
            )}
            <div style={{ 
              position: 'relative', 
              height: isExpanded ? '200px' : '40px',
              transition: 'height 0.2s' 
            }}>
              <textarea
                ref={textAreaRef}
                value={data?.text !== undefined ? data.text : '{{input}}'}
                onChange={handleTextChange}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  resize: 'none',
                  overflowY: isExpanded ? 'auto' : 'hidden',
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  color: 'white',
                  border: '1px solid #475569',
                  borderRadius: '4px',
                  padding: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  lineHeight: '1.5',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        );
      }}
    </BaseNode>
  );
}
