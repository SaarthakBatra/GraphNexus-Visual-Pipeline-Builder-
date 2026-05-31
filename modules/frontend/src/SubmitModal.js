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

import React from 'react';
import { useStore } from './store';

export const SubmitModal = ({ result, onClose }) => {
    const nodes = useStore(state => state.nodes);

    if (!result) return null;

    const { num_nodes, num_edges, is_dag, cycle_nodes } = result;

    return (
        <div 
            className="modal-overlay" 
            style={{ 
                backdropFilter: 'blur(4px)', 
                background: 'rgba(15, 23, 42, 0.7)',
                zIndex: 1000
            }}
            onClick={onClose}
        >
            <div 
                className="modal-content" 
                style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#fff',
                    maxWidth: '500px',
                    width: 'auto',
                    height: 'auto',
                    minWidth: '350px',
                    padding: '0'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header" style={{ borderBottom: '1px solid #334155', padding: '16px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px' }}>Pipeline Parsing Results</h2>
                    <button 
                        className="base-node-close" 
                        onClick={onClose}
                        style={{ width: '30px', height: '30px' }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-around', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px' }}>
                        <div><strong>Nodes:</strong> {num_nodes}</div>
                        <div><strong>Edges:</strong> {num_edges}</div>
                    </div>
                    
                    {is_dag ? (
                        <div style={{ color: '#4ade80', fontWeight: 'bold', textAlign: 'center', padding: '10px' }}>
                            ✅ Pipeline Valid: No cycles detected.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ color: '#f87171', fontWeight: 'bold', textAlign: 'center', padding: '10px' }}>
                                ❌ Infinite Cycles Detected: Your pipeline contains a loop and cannot be safely executed.
                            </div>
                            {cycle_nodes && cycle_nodes.length > 0 && (
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#cbd5e1' }}>Cycle Nodes:</h3>
                                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#f87171', fontFamily: 'monospace' }}>
                                        {cycle_nodes.map(id => {
                                            const node = nodes.find(n => n.id === id);
                                            let name = id;
                                            if (node) {
                                                const title = node.data?.config?.title || node.type;
                                                // Convert title case or just use title
                                                name = `${title} (${id})`;
                                            }
                                            return <li key={id}>{name}</li>
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #334155' }}>
                    <button className="action-button reset-button" onClick={onClose} style={{ width: 'auto', padding: '8px 16px' }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
