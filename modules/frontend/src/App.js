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

import { useEffect, useRef, useState } from 'react';
import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';
import { SubmitModal } from './SubmitModal';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';

const TopBar = () => {
  const { projectName, setProjectName, loadProject, nodes, edges, dynamicNodeTypes } = useStore(state => ({
    projectName: state.projectName,
    setProjectName: state.setProjectName,
    loadProject: state.loadProject,
    nodes: state.nodes,
    edges: state.edges,
    dynamicNodeTypes: state.dynamicNodeTypes
  }), shallow);

  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleSave = () => {
      setMenuOpen(false);
      let nameToSave = projectName;
      if (!nameToSave || nameToSave === 'Untitled Project') {
          nameToSave = prompt("Please enter a project name before saving:", "My VectorShift Project");
          if (!nameToSave) return;
          setProjectName(nameToSave);
      }

      const payload = {
          projectName: nameToSave,
          nodes,
          edges,
          dynamicNodeTypes
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${nameToSave}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      alert(`Project exported successfully to your system's Downloads folder as ${nameToSave}.json`);
  };

  const handleOpenClick = () => {
      setMenuOpen(false);
      fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const payload = JSON.parse(event.target.result);
              if (payload.nodes && payload.edges) {
                  loadProject(payload);
              } else {
                  alert("Invalid project file.");
              }
          } catch (err) {
              alert("Failed to parse project file.");
          }
      };
      reader.readAsText(file);
      e.target.value = null; // Reset input
  };

  return (
    <div style={{
      background: '#1e293b',
      padding: '8px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(255,255,255,0.05)'
    }}>
      <input 
          type="text" 
          value={projectName} 
          onChange={(e) => setProjectName(e.target.value)}
          style={{
              background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)',
              color: '#fff', padding: '4px 8px', borderRadius: '4px', width: '250px',
              fontWeight: 'bold', outline: 'none', fontSize: '16px'
          }}
      />
      <div style={{ position: 'relative' }}>
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '20px'
          }}
          title="Project Options"
        >
          &#8942;
        </button>
        {menuOpen && (
          <div style={{
            position: 'absolute', right: 0, top: '100%', background: '#1e293b', 
            border: '1px solid #334155', borderRadius: '6px', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', minWidth: '150px', zIndex: 100,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
          }}>
            <button onClick={handleSave} style={{ background: 'transparent', border: 'none', color: '#fff', padding: '10px 16px', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #334155' }}>
              Save Project
            </button>
            <button onClick={handleOpenClick} style={{ background: 'transparent', border: 'none', color: '#fff', padding: '10px 16px', textAlign: 'left', cursor: 'pointer' }}>
              Open Project
            </button>
          </div>
        )}
      </div>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleFileChange} />
    </div>
  );
};

const TextEnlargeModal = () => {
  const { enlargedTextNodeId, setEnlargedTextNodeId, nodes, updateTextNode } = useStore(state => ({
    enlargedTextNodeId: state.enlargedTextNodeId,
    setEnlargedTextNodeId: state.setEnlargedTextNodeId,
    nodes: state.nodes,
    updateTextNode: state.updateTextNode
  }), shallow);

  if (!enlargedTextNodeId) return null;

  const node = nodes.find(n => n.id === enlargedTextNodeId);
  if (!node) return null;

  return (
    <div className="modal-overlay" onClick={() => setEnlargedTextNodeId(null)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>Editing Text</h2>
          <button 
            className="base-node-close" 
            onClick={() => setEnlargedTextNodeId(null)}
            style={{ width: '30px', height: '30px' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column' }}>
          <textarea
            value={node.data?.text || ''}
            onChange={(e) => updateTextNode(enlargedTextNodeId, e.target.value)}
            style={{ flex: 1, resize: 'none', padding: '16px', fontSize: '16px' }}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};

function App() {
  const [submitResult, setSubmitResult] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('vectorshift_project');
    if (saved) {
      try {
        const payload = JSON.parse(saved);
        useStore.getState().loadProject(payload);
      } catch (err) {
        console.error("Failed to load project from localStorage", err);
      }
    }

    // Subscribe to all state changes to auto-save
    const unsubscribe = useStore.subscribe((state) => {
      const payload = {
        nodes: state.nodes,
        edges: state.edges,
        projectName: state.projectName,
        dynamicNodeTypes: state.dynamicNodeTypes
      };
      localStorage.setItem('vectorshift_project', JSON.stringify(payload));
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <TopBar />
      <header className="app-header">
        <PipelineToolbar />
        <SubmitButton onResult={setSubmitResult} />
      </header>
      <main style={{ flex: 1, position: 'relative' }}>
        <PipelineUI />
        <TextEnlargeModal />
        <SubmitModal result={submitResult} onClose={() => setSubmitResult(null)} />
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          color: '#94a3b8',
          zIndex: 1000,
          pointerEvents: 'none',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
        }}>
          Copyright &copy; 2026 Saarthak Batra. All rights reserved. Evaluation copy. Production use strictly prohibited.
        </div>
      </main>
    </div>
  );
}

export default App;
