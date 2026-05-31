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

import React, { useState, useEffect, createContext } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';

export const NodeConnectionModeContext = createContext(null);

export const BaseNode = ({ id, data, selected, title, color = '#6366f1', children, handles = [] }) => {
  const { removeNode, pendingConnection, setPendingConnection, onConnect } = useStore(state => ({
    removeNode: state.removeNode,
    pendingConnection: state.pendingConnection,
    setPendingConnection: state.setPendingConnection,
    onConnect: state.onConnect
  }), shallow);

  const [connectionMode, setConnectionMode] = useState(null); // 'source' or 'target'

  // If a connection is initiated elsewhere and finishes, reset connection mode.
  useEffect(() => {
    if (!pendingConnection) {
      setConnectionMode(null);
    }
  }, [pendingConnection]);

  const handleAddConnectionClick = (e) => {
    e.stopPropagation();
    setConnectionMode('source');
  };

  const handleOverlayBtnClick = (e, handleId, type) => {
    e.stopPropagation();
    if (type === 'source') {
      setPendingConnection({ nodeId: id, handleId, type: 'source' });
    } else {
      // Complete connection
      if (pendingConnection && pendingConnection.nodeId !== id) {
        onConnect({
          source: pendingConnection.nodeId,
          sourceHandle: pendingConnection.handleId,
          target: id,
          targetHandle: handleId
        });
        setPendingConnection(null);
      }
    }
    setConnectionMode(null);
  };

  const handleMouseEnter = () => {
    if (pendingConnection && pendingConnection.nodeId !== id) {
      setConnectionMode('target');
    }
  };

  const handleMouseLeave = () => {
    if (pendingConnection && pendingConnection.nodeId !== id) {
      setConnectionMode(null);
    }
  };

  const visibleHandles = connectionMode === 'source' 
    ? handles.filter(h => h.position === Position.Right || h.type === 'source')
    : handles.filter(h => h.position === Position.Left || h.type === 'target');

  return (
    <div 
      className={`base-node ${selected ? 'selected' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-designer="Saarthak Batra"
    >
      {connectionMode && (
        <div 
          className="connection-mode-overlay"
          onMouseDown={(e) => e.stopPropagation()}
          onWheelCapture={(e) => e.stopPropagation()}
        >
          <div style={{ color: '#cbd5e1', fontSize: '12px', marginBottom: '4px' }}>
            Select {connectionMode} handle:
          </div>
          <div className="connection-overlay-scroll-container">
            {visibleHandles.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>No handles</div>
            ) : (
              visibleHandles.map(h => {
                const rawLabel = h.id.split('-').pop();
                const formattedLabel = rawLabel.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                return (
                  <button 
                    key={h.id} 
                    className="connection-handle-btn"
                    onClick={(e) => handleOverlayBtnClick(e, h.id, connectionMode)}
                    style={{ textAlign: connectionMode === 'target' ? 'left' : 'right' }}
                  >
                    {formattedLabel}
                  </button>
                );
              })
            )}
          </div>
          <button 
            className="connection-handle-btn" 
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', marginTop: 'auto' }}
            onClick={(e) => { 
              e.stopPropagation(); 
              setConnectionMode(null); 
              if (connectionMode === 'source') setPendingConnection(null); 
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <div style={{ 
        opacity: connectionMode ? 0 : 1, 
        pointerEvents: connectionMode ? 'none' : 'auto',
        transition: 'opacity 0.2s'
      }}>
        <div className="base-node-header" style={{ borderTop: `4px solid ${color}` }}>
          <div className="base-node-title">
            <span style={{ color: color }}>•</span>
            <span>{title}</span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {selected && !pendingConnection && !connectionMode && (
              <button 
                className="base-node-close" 
                title="Add connection" 
                aria-label="Add connection" 
                onClick={handleAddConnectionClick}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
              </button>
            )}
            <button className="base-node-close" title="Delete Node" aria-label="Delete Node" onClick={() => removeNode(id)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="base-node-content">
          {typeof children === 'function' ? children(connectionMode) : children}
        </div>
      </div>

      {handles.map((handle, index) => {
        const label = handle.id.split('-').pop();
        return (
          <Handle
            key={`${id}-handle-${index}`}
            type={handle.type}
            position={handle.position}
            id={handle.id}
            style={handle.style || {}}
            className="group"
          >
            <div className="handle-tooltip">
              {label}
            </div>
          </Handle>
        );
      })}
    </div>
  );
};
