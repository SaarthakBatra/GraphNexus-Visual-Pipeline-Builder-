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

export const DynamicNode = ({ id, data, selected }) => {
  const updateNodeField = useStore((state) => state.updateNodeField);
  const config = data?.config || {};
  
  const title = config.title || 'Custom Node';
  const color = config.color || '#6366f1';
  const handles = (config.handles || []).map((h, i) => ({
    ...h,
    position: h.type === 'target' ? Position.Left : Position.Right,
    style: { top: `${((i + 1) / ((config.handles?.length || 1) + 1)) * 100}%` }
  }));

  const fields = config.fields || [];

  return (
    <BaseNode id={id} selected={selected} title={title} color={color} handles={handles}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {fields.map((field) => {
          const value = data[field.name] || '';
          
          return (
            <label key={field.name}>
              {field.name}:
              {field.type === 'textarea' ? (
                <textarea 
                  value={value} 
                  onChange={(e) => updateNodeField(id, field.name, e.target.value)} 
                  rows={3} 
                />
              ) : field.type === 'select' ? (
                <select 
                  value={value} 
                  onChange={(e) => updateNodeField(id, field.name, e.target.value)}
                >
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text" 
                  value={value} 
                  onChange={(e) => updateNodeField(id, field.name, e.target.value)} 
                />
              )}
            </label>
          );
        })}
      </div>
    </BaseNode>
  );
};
