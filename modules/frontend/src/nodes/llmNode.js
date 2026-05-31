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

export const LLMNode = ({ id, data, selected }) => {
  const handles = [
    { type: 'target', position: Position.Left, id: `${id}-system`, style: { top: '68px' } },
    { type: 'target', position: Position.Left, id: `${id}-prompt`, style: { top: '98px' } },
    { type: 'source', position: Position.Right, id: `${id}-response`, style: { top: '68px' } }
  ];

  return (
    <BaseNode id={id} selected={selected} title="LLM" color="#a855f7" handles={handles}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0', fontSize: '12px', color: '#cbd5e1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '14px' }}>
          <span>System</span>
          <span>Response</span>
        </div>
        <div style={{ height: '14px', display: 'flex', alignItems: 'center' }}>
          <span>Prompt</span>
        </div>
      </div>
    </BaseNode>
  );
}
