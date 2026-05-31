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

export const DatabaseNode = ({ id, data, selected }) => {
  const updateNodeField = useStore((state) => state.updateNodeField);

  const dbType = data?.dbType || 'PostgreSQL';
  const query = data?.query || 'SELECT * FROM users;';

  const handles = [
    { type: 'target', position: Position.Left, id: `${id}-input` },
    { type: 'source', position: Position.Right, id: `${id}-output` }
  ];

  return (
    <BaseNode id={id} selected={selected} title="Database" color="#f59e0b" handles={handles}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>
          Type:
          <select value={dbType} onChange={(e) => updateNodeField(id, 'dbType', e.target.value)}>
            <option value="PostgreSQL">PostgreSQL</option>
            <option value="MongoDB">MongoDB</option>
            <option value="Redis">Redis</option>
            <option value="Pinecone">Pinecone</option>
          </select>
        </label>
        <label>
          Query:
          <textarea 
            value={query} 
            onChange={(e) => updateNodeField(id, 'query', e.target.value)} 
            rows={4} 
          />
        </label>
      </div>
    </BaseNode>
  );
};
