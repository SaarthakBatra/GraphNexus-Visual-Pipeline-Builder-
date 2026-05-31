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

export const ClassifierNode = ({ id, data, selected }) => {
  const updateNodeField = useStore((state) => state.updateNodeField);

  const modelType = data?.modelType || 'Sentiment Analysis';
  const threshold = data?.threshold || 0.8;

  const handles = [
    { type: 'target', position: Position.Left, id: `${id}-input` },
    { type: 'source', position: Position.Right, id: `${id}-classA`, style: { top: '30%' } },
    { type: 'source', position: Position.Right, id: `${id}-classB`, style: { top: '70%' } },
  ];

  return (
    <BaseNode id={id} selected={selected} title="Classifier" color="#ec4899" handles={handles}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>
          Model:
          <select value={modelType} onChange={(e) => updateNodeField(id, 'modelType', e.target.value)}>
            <option value="Sentiment Analysis">Sentiment Analysis</option>
            <option value="Spam Detection">Spam Detection</option>
            <option value="Intent Recognition">Intent Recognition</option>
          </select>
        </label>
        <label>
          Threshold:
          <input 
            type="number" 
            min="0" 
            max="1" 
            step="0.1" 
            value={threshold} 
            onChange={(e) => updateNodeField(id, 'threshold', parseFloat(e.target.value))} 
          />
        </label>
      </div>
    </BaseNode>
  );
};
