import { useState } from 'react';
import { Filter, PieChart, Bookmark, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import FiltersTab from './sidebar/FiltersTab';
import DistributionTab from './sidebar/DistributionTab';
import PresetsTab from './sidebar/PresetsTab';
import SavedSetsTab from './sidebar/SavedSetsTab';
import './FilterSidebar.css';

export default function FilterSidebar() {
  const { sidebarOpen, setSidebarOpen, mode, resultPersonas, allPersonas } = useFilters();
  const [activeTab, setActiveTab] = useState('filters');

  const tabs = [
    { id: 'filters', label: 'Filters', icon: Filter },
    { id: 'distribution', label: 'Distribution', icon: PieChart },
    { id: 'presets', label: 'Presets', icon: Bookmark },
    { id: 'saved', label: 'Saved Sets', icon: Save }
  ];

  return (
    <>
      {/* Sidebar */}
      <aside className={`filter-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Toggle Button */}
        <button 
          className='sidebar-toggle'
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>

        {sidebarOpen && (
          <>
            {/* Sidebar Header */}
            <div className='sidebar-header'>
              <h3>Sample Selection</h3>
              <div className='persona-summary'>
                <span className='summary-highlight'>{resultPersonas.length.toLocaleString()}</span>
                <span className='summary-text'>of {allPersonas.length.toLocaleString()} personas</span>
              </div>
            </div>

            {/* Vertical Tabs */}
            <nav className='vertical-tabs'>
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`vertical-tab-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Tab Content */}
            <div className='tab-content-area'>
              {activeTab === 'filters' && <FiltersTab />}
              {activeTab === 'distribution' && <DistributionTab />}
              {activeTab === 'presets' && <PresetsTab />}
              {activeTab === 'saved' && <SavedSetsTab />}
            </div>
          </>
        )}
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className='sidebar-overlay'
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}

