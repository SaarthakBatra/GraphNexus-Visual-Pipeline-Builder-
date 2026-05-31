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

export const MergeNode = ({ id, data, selected }) => {
  const updateNodeField = useStore((state) => state.updateNodeField);

  const strategy = data?.strategy || 'Concat';

  const handles = [
    { type: 'target', position: Position.Left, id: `${id}-input1`, style: { top: '30%' } },
    { type: 'target', position: Position.Left, id: `${id}-input2`, style: { top: '70%' } },
    { type: 'source', position: Position.Right, id: `${id}-output` }
  ];

  return (
    <BaseNode id={id} selected={selected} title="Merge" color="#14b8a6" handles={handles}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>
          Strategy:
          <select value={strategy} onChange={(e) => updateNodeField(id, 'strategy', e.target.value)}>
            <option value="Concat">Concat Array/String</option>
            <option value="Object Assign">Object Assign</option>
          </select>
        </label>
      </div>
    </BaseNode>
  );
};
