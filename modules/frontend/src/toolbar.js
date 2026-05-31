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

import React, { useState, useRef } from 'react';
import { DraggableNode } from './draggableNode';
import { useStore } from './store';
import { DynamicNodeCreator } from './components/DynamicNodeCreator';

const DynamicNodeWrapper = ({ node, onRemove }) => {
    const [hover, setHover] = useState(false);
    return (
        <div 
            style={{ position: 'relative' }} 
            onMouseEnter={() => setHover(true)} 
            onMouseLeave={() => setHover(false)}
        >
            <DraggableNode type={node.type} label={node.title} color={node.color} />
            {hover && (
                <button 
                    onClick={() => onRemove(node.type)}
                    style={{ 
                        position: 'absolute', top: 4, right: 4, background: 'transparent', 
                        color: '#94a3b8', border: 'none', cursor: 'pointer', 
                        padding: 2, fontSize: '12px', lineHeight: 1 
                    }}
                    title="Remove Node Type"
                >
                    ✕
                </button>
            )}
        </div>
    );
};

export const PipelineToolbar = () => {
    const dynamicNodeTypes = useStore((state) => state.dynamicNodeTypes);
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);
    const scrollRef = useRef(null);

    const scroll = (offset) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
        }
    };

    return (
        <>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '60vw' }}>
            <button 
                onClick={() => scroll(-150)} 
                style={{ background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '20px' }}
            >
                &#10094;
            </button>
            
            <div 
                ref={scrollRef}
                style={{ 
                    display: 'flex', flexWrap: 'nowrap', gap: '10px', alignItems: 'center',
                    overflowX: 'hidden', scrollBehavior: 'smooth', flex: 1
                }}
            >
                <DraggableNode type='customInput' label='Input' color='#10b981' />
                <DraggableNode type='llm' label='LLM' color='#a855f7' />
                <DraggableNode type='customOutput' label='Output' color='#ef4444' />
                <DraggableNode type='text' label='Text' color='#3b82f6' />
                
                {dynamicNodeTypes.map((node) => (
                    <DynamicNodeWrapper 
                        key={node.type} 
                        node={node} 
                        onRemove={(type) => useStore.getState().removeDynamicNodeType(type)} 
                    />
                ))}

                <div 
                    onClick={() => setIsCreatorOpen(true)}
                    style={{ 
                        cursor: 'pointer', minWidth: '40px', minHeight: '40px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,255,255,0.1)', border: '1px dashed rgba(255,255,255,0.4)',
                        borderRadius: '8px', color: '#fff', fontWeight: 'bold'
                    }}
                    title="Create Custom Node"
                >
                    +
                </div>
            </div>

            <button 
                onClick={() => scroll(150)} 
                style={{ background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '20px' }}
            >
                &#10095;
            </button>
        </div>
        
        {isCreatorOpen && <DynamicNodeCreator onClose={() => setIsCreatorOpen(false)} />}
        </>
    );
};
