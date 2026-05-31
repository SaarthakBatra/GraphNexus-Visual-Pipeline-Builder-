import React, { useState } from 'react';
import { useStore } from '../store';

const PRESET_COLORS = [
  '#10b981', // Green
  '#a855f7', // Purple
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#6366f1', // Indigo
];

export const DynamicNodeCreator = ({ onClose }) => {
  const addDynamicNodeType = useStore((state) => state.addDynamicNodeType);
  
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[8]);
  const [handles, setHandles] = useState([{ type: 'target', id: 'input' }, { type: 'source', id: 'output' }]);
  const [fields, setFields] = useState([]);

  const addHandle = () => setHandles([...handles, { type: 'source', id: `handle-${handles.length + 1}` }]);
  const updateHandle = (index, key, val) => {
    const newHandles = [...handles];
    newHandles[index][key] = val;
    setHandles(newHandles);
  };
  const removeHandle = (index) => setHandles(handles.filter((_, i) => i !== index));

  const addField = () => setFields([...fields, { name: `field_${fields.length + 1}`, type: 'text' }]);
  const updateField = (index, key, val) => {
    const newFields = [...fields];
    newFields[index][key] = val;
    setFields(newFields);
  };
  const removeField = (index) => setFields(fields.filter((_, i) => i !== index));

  const handleSave = () => {
    if (!title.trim()) return alert("Title is required");
    
    const config = {
      type: `custom_${title.replace(/\\s+/g, '_').toLowerCase()}_${Date.now()}`,
      title,
      color,
      handles,
      fields
    };
    
    addDynamicNodeType(config);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
    }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.85)', padding: '24px', borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)', width: '500px', maxHeight: '90vh', overflowY: 'auto',
        color: '#fff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <h2 style={{ marginTop: 0 }}>Create Custom Node</h2>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%' }} />
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Header Color</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            {PRESET_COLORS.map(c => (
              <div 
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: '24px', height: '24px', borderRadius: '50%', background: c, cursor: 'pointer',
                  border: color === c ? '2px solid #fff' : '2px solid transparent',
                  boxShadow: color === c ? `0 0 8px ${c}` : 'none'
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#cbd5e1' }}>Custom Hex:</span>
            <input 
              type="text" 
              value={color} 
              onChange={(e) => setColor(e.target.value)} 
              style={{ width: '100px', fontFamily: 'monospace' }} 
            />
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)}
              style={{ width: '32px', height: '32px', padding: '0', border: 'none', background: 'transparent', cursor: 'pointer' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label>Handles</label>
            <button onClick={addHandle} style={{ background: '#334155', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px' }}>+ Add</button>
          </div>
          {handles.map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <select value={h.type} onChange={(e) => updateHandle(i, 'type', e.target.value)} style={{ flex: 1 }}>
                <option value="target">Target (Input)</option>
                <option value="source">Source (Output)</option>
              </select>
              <input type="text" value={h.id} onChange={(e) => updateHandle(i, 'id', e.target.value)} placeholder="Handle ID" style={{ flex: 2 }} />
              <button onClick={() => removeHandle(i)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px' }}>X</button>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label>Custom Fields</label>
            <button onClick={addField} style={{ background: '#334155', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px' }}>+ Add</button>
          </div>
          {fields.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexDirection: 'column', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="text" value={f.name} onChange={(e) => updateField(i, 'name', e.target.value)} placeholder="Field Name" style={{ flex: 2 }} />
                <select value={f.type} onChange={(e) => updateField(i, 'type', e.target.value)} style={{ flex: 1.5 }}>
                  <option value="text">Text Input</option>
                  <option value="textarea">Textarea</option>
                  <option value="select">Select Dropdown</option>
                </select>
                <button onClick={() => removeField(i)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px' }}>X</button>
              </div>
              {f.type === 'select' && (
                <input 
                  type="text" 
                  placeholder="Options (comma separated)" 
                  value={(f.options || []).join(',')}
                  onChange={(e) => updateField(i, 'options', e.target.value.split(',').map(o => o.trim()))}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
          <button onClick={onClose} style={{ background: 'transparent', color: '#cbd5e1', border: '1px solid #475569', padding: '8px 16px', borderRadius: '6px' }}>Cancel</button>
          <button onClick={handleSave} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px' }}>Save Custom Node</button>
        </div>
      </div>
    </div>
  );
};
