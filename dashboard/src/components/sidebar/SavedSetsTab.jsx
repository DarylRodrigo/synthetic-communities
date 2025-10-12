import { useState, useEffect } from 'react';
import { Save, Download, Upload, Trash2 } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { exportToJSON } from '../../utils/filterUtils';

export default function SavedSetsTab() {
  const { filters, distribution, mode, resultPersonas, setFilters, setDistribution, setMode } = useFilters();
  const [savedSets, setSavedSets] = useState([]);
  const [setName, setSetName] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('persona_saved_sets');
    if (saved) {
      setSavedSets(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage whenever savedSets changes
  useEffect(() => {
    localStorage.setItem('persona_saved_sets', JSON.stringify(savedSets));
  }, [savedSets]);

  const handleSave = () => {
    if (!setName.trim()) {
      alert('Please enter a name for this set');
      return;
    }

    const newSet = {
      id: Date.now().toString(),
      name: setName,
      mode,
      filters,
      distribution,
      resultCount: resultPersonas.length,
      savedAt: new Date().toISOString()
    };

    setSavedSets([newSet, ...savedSets]);
    setSetName('');
  };

  const handleLoad = (set) => {
    setMode(set.mode);
    setFilters(set.filters);
    setDistribution(set.distribution);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this saved set?')) {
      setSavedSets(savedSets.filter(s => s.id !== id));
    }
  };

  const handleExportSet = (set) => {
    const dataStr = JSON.stringify(set, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${set.name.replace(/\s+/g, '_')}_${set.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedSet = JSON.parse(event.target?.result);
        // Validate structure
        if (importedSet.mode && importedSet.filters && importedSet.distribution) {
          importedSet.id = Date.now().toString(); // New ID
          importedSet.savedAt = new Date().toISOString();
          setSavedSets([importedSet, ...savedSets]);
        } else {
          alert('Invalid saved set file');
        }
      } catch (error) {
        alert('Error reading file: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  const handleExportResults = () => {
    exportToJSON(resultPersonas);
  };

  return (
    <div className='saved-sets-tab'>
      <div className='filter-control' style={{ marginBottom: '20px' }}>
        <label className='filter-label'>Save Current Configuration</label>
        <input
          type='text'
          placeholder='Enter name...'
          value={setName}
          onChange={(e) => setSetName(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            marginBottom: '8px'
          }}
        />
        <button className='action-button' onClick={handleSave}>
          <Save size={16} />
          Save Current
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button 
          className='action-button secondary' 
          onClick={handleExportResults}
          style={{ flex: 1, fontSize: '13px' }}
        >
          <Download size={14} />
          Export Results
        </button>
        <label style={{ flex: 1 }}>
          <input
            type='file'
            accept='.json'
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <div className='action-button secondary' style={{ fontSize: '13px', cursor: 'pointer' }}>
            <Upload size={14} />
            Import Set
          </div>
        </label>
      </div>

      <div className='filter-section'>
        <h4>Saved Sets ({savedSets.length})</h4>
        
        {savedSets.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '20px 0' }}>
            No saved sets yet
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {savedSets.map(set => (
              <div
                key={set.id}
                style={{
                  padding: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              >
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#0f172a',
                    marginBottom: '4px'
                  }}>
                    {set.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {set.mode === 'filter' ? 'Filter mode' : 'Distribution mode'} • {set.resultCount} personas
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    {new Date(set.savedAt).toLocaleString()}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleLoad(set)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleExportSet(set)}
                    style={{
                      padding: '6px 10px',
                      background: '#ffffff',
                      color: '#475569',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(set.id)}
                    style={{
                      padding: '6px 10px',
                      background: '#ffffff',
                      color: '#ef4444',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

