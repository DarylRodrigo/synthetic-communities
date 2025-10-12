import { useState, useEffect } from 'react';
import { Users, Map, Brain, Globe, Users as People, RefreshCw, Database } from 'lucide-react';
import './App.css';
import { loadPersonas, DATA_SOURCES } from './utils/dataLoader';
import { FilterProvider, useFilters } from './context/FilterContext';
import FilterSidebar from './components/FilterSidebar';
import DemographicsTab from './components/DemographicsTab';
import GeographicTab from './components/GeographicTab';
import PsychologicalTab from './components/PsychologicalTab';
import CulturalTab from './components/CulturalTab';
import PeopleTab from './components/PeopleTab';

function AppContent({ personas, dataSource, setDataSource }) {
  const { resultPersonas, allPersonas, sidebarOpen } = useFilters();
  const [activeTab, setActiveTab] = useState('demographics');

  const tabs = [
    { id: 'demographics', label: 'Demographics', icon: Users },
    { id: 'geographic', label: 'Geographic', icon: Map },
    { id: 'psychological', label: 'Psychological', icon: Brain },
    { id: 'cultural', label: 'Cultural', icon: Globe },
    { id: 'people', label: 'People', icon: People }
  ];

  return (
    <>
      <FilterSidebar />

      <div className={`app-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Top Navigation */}
        <header className='top-nav'>
          <div className='nav-left'>
            <h1 className='app-title'>Persona Analytics</h1>
            <div className='data-source-selector'>
              <Database size={16} />
              <select
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value)}
                className='data-source-dropdown'
              >
                {Object.entries(DATA_SOURCES).map(([key, source]) => (
                  <option key={key} value={key}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>
            <div className='persona-count'>
              <span className='count-label'>Showing:</span>
              <span className='count-value'>{resultPersonas.length.toLocaleString()} of {allPersonas.length.toLocaleString()}</span>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className='tab-nav'>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Main Content */}
        <main className='main-content'>
          {activeTab === 'demographics' && <DemographicsTab personas={resultPersonas} />}
          {activeTab === 'geographic' && <GeographicTab personas={resultPersonas} />}
          {activeTab === 'psychological' && <PsychologicalTab personas={resultPersonas} />}
          {activeTab === 'cultural' && <CulturalTab personas={resultPersonas} />}
          {activeTab === 'people' && <PeopleTab personas={resultPersonas} allPersonas={allPersonas} />}
        </main>
      </div>
    </>
  );
}

function App() {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('swiss_population');

  useEffect(() => {
    loadData();
  }, [dataSource]);

  async function loadData() {
    setLoading(true);
    const data = await loadPersonas(dataSource);
    setPersonas(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className='app-container'>
        <div className='loading-container'>
          <div className='skeleton-header'></div>
          <div className='skeleton-grid'>
            <div className='skeleton-card'></div>
            <div className='skeleton-card'></div>
            <div className='skeleton-card'></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FilterProvider allPersonas={personas}>
      <div className='app-container'>
        <AppContent
          personas={personas}
          dataSource={dataSource}
          setDataSource={setDataSource}
        />
      </div>
    </FilterProvider>
  );
}

export default App;
