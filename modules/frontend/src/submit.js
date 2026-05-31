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

import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import axios from 'axios';

const selector = (state) => ({
    reset: state.reset,
    undo: state.undo,
    redo: state.redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    nodes: state.nodes,
    edges: state.edges
});

export const SubmitButton = ({ onResult }) => {
    const { reset, undo, redo, canUndo, canRedo, nodes, edges } = useStore(selector, shallow);

    const handleSubmit = async () => {
        // Payload stripping
        const strippedNodes = nodes.map(n => ({ id: n.id }));
        const strippedEdges = edges.map(e => ({ source: e.source, target: e.target }));
        const payload = { nodes: strippedNodes, edges: strippedEdges };

        if (nodes.length > 15) {
            // WebSocket flow
            const ws = new WebSocket('ws://localhost:8000/pipelines/run/ws');
            ws.onopen = () => {
                ws.send(JSON.stringify(payload));
            };
            ws.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    if (payload.type === 'result') {
                        if (onResult) onResult(payload.data);
                        ws.close();
                    } else if (payload.type === 'error') {
                        console.error("Backend error:", payload.message);
                        ws.close();
                    }
                } catch (err) {
                    console.error("Failed to parse websocket response", err);
                    ws.close();
                }
            };
            ws.onerror = (error) => {
                console.error("WebSocket error", error);
                ws.close();
            };
        } else {
            // HTTP POST flow
            try {
                const formData = new FormData();
                formData.append('pipeline', JSON.stringify(payload));
                const response = await axios.post('http://localhost:8000/pipelines/parse', formData);
                if (onResult) onResult(response.data);
            } catch (error) {
                console.error("Failed to parse pipeline via HTTP", error);
                if (onResult) {
                    onResult({
                        num_nodes: strippedNodes.length,
                        num_edges: strippedEdges.length,
                        is_dag: false,
                        cycle_nodes: [] // fallback
                    });
                }
            }
        }
    };

    return (
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
            <button className="icon-button secondary-button" onClick={undo} disabled={!canUndo} title="Undo">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7v6h6" />
                    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
            </button>
            <button className="icon-button secondary-button" onClick={redo} disabled={!canRedo} title="Redo">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 7v6h-6" />
                    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
                </svg>
            </button>
            <button className="action-button reset-button" onClick={reset}>Reset</button>
            <button className="action-button submit-button" onClick={handleSubmit}>Submit</button>
        </div>
    );
}
