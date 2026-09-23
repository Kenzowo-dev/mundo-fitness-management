import './Sidebar.css'

function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'usuarios', label: 'Usuarios' },
    { id: 'membresias', label: 'Membresías' },
    { id: 'planes', label: 'Planes' },
    { id: 'pagos', label: 'Pagos' },
    { id: 'reportes', label: 'Reportes' },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>Mundo Fitness</h2>
        <span>Panel administrativo</span>
      </div>

      <nav className="sidebar-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`sidebar-item ${
              activeTab === tab.id ? 'active' : ''
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar