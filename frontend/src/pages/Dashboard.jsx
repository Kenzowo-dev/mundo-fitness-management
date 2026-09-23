import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import '../styles/dashboard/Dashboard.css'

function Dashboard() {
  const [activeTab, setActiveTab] = useState('inicio')

  const renderContent = () => {
    switch (activeTab) {
      case 'usuarios':
        return <h2>Usuarios</h2>

      case 'membresias':
        return <h2>Membresías</h2>

      case 'planes':
        return <h2>Planes</h2>

      case 'pagos':
        return <h2>Pagos</h2>

      case 'reportes':
        return <h2>Reportes</h2>

      default:
        return (
          <>
            <h2>Resumen general</h2>

            <div className="dashboard-cards">
              <div className="dashboard-card">
                <span>Usuarios</span>
                <strong>0</strong>
              </div>

              <div className="dashboard-card">
                <span>Membresías activas</span>
                <strong>0</strong>
              </div>

              <div className="dashboard-card">
                <span>Planes</span>
                <strong>0</strong>
              </div>

              <div className="dashboard-card">
                <span>Pagos</span>
                <strong>S/ 0.00</strong>
              </div>
            </div>
          </>
        )
    }
  }

  return (
    <div className="dashboard-layout">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="dashboard-main">
        <Navbar />

        <main className="dashboard-content">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default Dashboard