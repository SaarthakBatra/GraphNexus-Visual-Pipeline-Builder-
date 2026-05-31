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

import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useStore } from '../store';

export const ApiRequestNode = ({ id, data, selected }) => {
  const updateNodeField = useStore((state) => state.updateNodeField);

  const url = data?.url || 'https://api.example.com';
  const method = data?.method || 'GET';
  const headers = data?.headers || '{"Content-Type": "application/json"}';

  const handles = [
    { type: 'target', position: Position.Left, id: `${id}-input` },
    { type: 'source', position: Position.Right, id: `${id}-response`, style: { top: '30%' } },
    { type: 'source', position: Position.Right, id: `${id}-error`, style: { top: '70%' } },
  ];

  return (
    <BaseNode id={id} selected={selected} title="API Request" color="#0ea5e9" handles={handles}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>
          URL:
          <input 
            type="text" 
            value={url} 
            onChange={(e) => updateNodeField(id, 'url', e.target.value)} 
          />
        </label>
        <label>
          Method:
          <select value={method} onChange={(e) => updateNodeField(id, 'method', e.target.value)}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </label>
        <label>
          Headers:
          <textarea 
            value={headers} 
            onChange={(e) => updateNodeField(id, 'headers', e.target.value)} 
            rows={3} 
          />
        </label>
      </div>
    </BaseNode>
  );
};
