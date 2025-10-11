import { useState, useMemo } from 'react';
import { Search, Plus, Users, Edit, Trash2, Download, UserPlus, X } from 'lucide-react';
import PersonaCard from './people/PersonaCard';
import EditPersonaModal from './people/EditPersonaModal';
import AddPersonaModal from './people/AddPersonaModal';
import ProcreateModal from './people/ProcreateModal';
import { useFilters } from '../context/FilterContext';
import { exportToJSON } from '../utils/filterUtils';
import './PeopleTab.css';

export default function PeopleTab({ personas, allPersonas }) {
  const { resultPersonas } = useFilters();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Show 50 personas per page
  const [editingPersona, setEditingPersona] = useState(null);
  const [addingPersona, setAddingPersona] = useState(false);
  const [procreating, setProcreating] = useState(false);
  const [selectedPersonas, setSelectedPersonas] = useState(new Set());
  const [maleParent, setMaleParent] = useState(null);
  const [femaleParent, setFemaleParent] = useState(null);
  const [procreateMode, setProcreateMode] = useState(null); // 'male', 'female', or null

  // Use filtered personas from context
  const displayPersonas = personas || resultPersonas || [];

  // Filter by search query and procreate mode
  const filteredPersonas = useMemo(() => {
    let filtered = displayPersonas;


    // Filter by gender if in procreate mode
    if (procreateMode === 'male') {
      filtered = filtered.filter(p => p.gender === 'M');
    } else if (procreateMode === 'female') {
      filtered = filtered.filter(p => p.gender === 'F');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(persona => {
        return (
          persona.name?.toLowerCase().includes(query) ||
          persona.city?.toLowerCase().includes(query) ||
          persona.sector?.toLowerCase().includes(query) ||
          persona.ethnicity?.toLowerCase().includes(query) ||
          persona.backstory?.toLowerCase().includes(query) ||
          persona.interests?.some(interest => interest.toLowerCase().includes(query))
        );
      });
    }

    return filtered;
  }, [displayPersonas, searchQuery, procreateMode]);

  // Pagination
  const totalPages = Math.ceil(filteredPersonas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPersonas = filteredPersonas.slice(startIndex, startIndex + itemsPerPage);

  // Selection handlers
  const toggleSelect = (personaId) => {
    const newSelected = new Set(selectedPersonas);
    if (newSelected.has(personaId)) {
      newSelected.delete(personaId);
    } else {
      newSelected.add(personaId);
    }
    setSelectedPersonas(newSelected);
  };

  const selectAll = () => {
    if (selectedPersonas.size === paginatedPersonas.length) {
      setSelectedPersonas(new Set());
    } else {
      setSelectedPersonas(new Set(paginatedPersonas.map(p => p.id)));
    }
  };

  // Action handlers
  const handleEdit = (persona) => {
    setEditingPersona(persona);
  };

  const handleDelete = async () => {
    if (selectedPersonas.size === 0) {
      alert('Please select personas to delete');
      return;
    }

    if (confirm(`Delete ${selectedPersonas.size} selected persona(s)?`)) {
      // TODO: Implement actual deletion from JSONL file
      console.log('Would delete personas:', Array.from(selectedPersonas));
      setSelectedPersonas(new Set());
    }
  };

  const handleExportSelected = () => {
    if (selectedPersonas.size === 0) {
      alert('Please select personas to export');
      return;
    }

    const selectedData = filteredPersonas.filter(p => selectedPersonas.has(p.id));
    exportToJSON(selectedData);
  };

  const handleExportAll = () => {
    exportToJSON(filteredPersonas);
  };

  const handleProcreateClick = (persona) => {
    if (!procreateMode) return;

    if (procreateMode === 'male') {
      setMaleParent(persona);
      setProcreateMode('female');
    } else if (procreateMode === 'female') {
      setFemaleParent(persona);
      setProcreateMode(null);
      // Both parents selected, now show in modal
      setProcreating(true);
    }
  };

  const startProcreate = () => {
    setMaleParent(null);
    setFemaleParent(null);
    setSearchQuery(''); // Clear search first
    setCurrentPage(1); // Reset to first page
    setProcreateMode('male');
  };

  const cancelProcreate = () => {
    setMaleParent(null);
    setFemaleParent(null);
    setProcreateMode(null);
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className='people-tab'>
      {/* Header */}
      <div className='people-header'>
        <div className='people-title'>
          <Users size={24} />
          <h2>People Management</h2>
          <span className='persona-count'>
            {filteredPersonas.length.toLocaleString()} persona{filteredPersonas.length !== 1 ? 's' : ''}
            {searchQuery && ` (filtered)`}
          </span>
        </div>

        <div className='people-actions'>
          <div className='search-container'>
            <Search size={18} />
            <input
              type='text'
              placeholder='Search personas...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='search-input'
            />
          </div>

          <div className='action-buttons'>
            {!procreateMode ? (
              <>
                <button
                  className='action-btn secondary'
                  onClick={() => setAddingPersona(true)}
                  title='Add new persona'
                >
                  <Plus size={16} />
                  Add Person
                </button>

                <button
                  className='action-btn secondary'
                  onClick={startProcreate}
                  title='Create child from two parents'
                >
                  <UserPlus size={16} />
                  Procreate
                </button>
              </>
            ) : (
              <button
                className='action-btn danger'
                onClick={cancelProcreate}
                title='Cancel procreate mode'
              >
                <X size={16} />
                Cancel
              </button>
            )}

            {selectedPersonas.size > 0 && (
              <>
                <button
                  className='action-btn secondary'
                  onClick={handleExportSelected}
                  title='Export selected personas'
                >
                  <Download size={16} />
                  Export ({selectedPersonas.size})
                </button>

                <button
                  className='action-btn danger'
                  onClick={handleDelete}
                  title='Delete selected personas'
                >
                  <Trash2 size={16} />
                  Delete ({selectedPersonas.size})
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Procreate Mode Banner */}
      {procreateMode && (
        <div className='procreate-banner'>
          <div className='procreate-info'>
            {procreateMode === 'male' ? (
              <>
                <UserPlus size={20} />
                <div>
                  <strong>Step 1 of 2:</strong> Select the <strong>Male Parent</strong>
                  <p>Click on any male persona card below to select as father</p>
                </div>
              </>
            ) : (
              <>
                <UserPlus size={20} />
                <div>
                  <strong>Step 2 of 2:</strong> Select the <strong>Female Parent</strong>
                  <p>Selected Male: <strong>{maleParent?.name}</strong> • Click on any female persona card below</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Selection Controls */}
      {filteredPersonas.length > 0 && !procreateMode && (
        <div className='selection-controls'>
          <label className='select-all'>
            <input
              type='checkbox'
              checked={selectedPersonas.size === paginatedPersonas.length && paginatedPersonas.length > 0}
              onChange={selectAll}
            />
            Select All on Page ({paginatedPersonas.length})
          </label>
          <span className='selection-info'>
            {selectedPersonas.size > 0 && `${selectedPersonas.size} selected`}
          </span>
        </div>
      )}

      {/* Personas Grid */}
      {filteredPersonas.length === 0 ? (
        <div className='empty-state'>
          <Users size={48} />
          <h3>No personas found</h3>
          <p>
            {searchQuery ? 'Try adjusting your search terms' : 'No personas match the current filters'}
          </p>
        </div>
      ) : (
        <>
          <div className='personas-grid'>
            {paginatedPersonas.map(persona => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                isSelected={selectedPersonas.has(persona.id)}
                onSelect={() => toggleSelect(persona.id)}
                onEdit={() => handleEdit(persona)}
                procreateMode={procreateMode}
                onProcreateClick={() => handleProcreateClick(persona)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='pagination'>
              <button
                className='pagination-btn'
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                ← Previous
              </button>

              <span className='pagination-info'>
                Page {currentPage} of {totalPages}
                ({startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredPersonas.length)} of {filteredPersonas.length})
              </span>

              <button
                className='pagination-btn'
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {editingPersona && (
        <EditPersonaModal
          persona={editingPersona}
          onClose={() => setEditingPersona(null)}
          onSave={(updatedPersona) => {
            console.log('Saving persona:', updatedPersona);
            setEditingPersona(null);
          }}
        />
      )}

      {addingPersona && (
        <AddPersonaModal
          onClose={() => setAddingPersona(false)}
          onSave={(newPersona) => {
            console.log('Adding persona:', newPersona);
            setAddingPersona(false);
          }}
        />
      )}

      {procreating && maleParent && femaleParent && (
        <ProcreateModal
          maleParent={maleParent}
          femaleParent={femaleParent}
          onClose={() => {
            setProcreating(false);
            setMaleParent(null);
            setFemaleParent(null);
            setProcreateMode(null);
          }}
          onCreate={(childPersona) => {
            console.log('Creating child:', childPersona);
            setProcreating(false);
            setMaleParent(null);
            setFemaleParent(null);
            setProcreateMode(null);
          }}
        />
      )}
    </div>
  );
}

