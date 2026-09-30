import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import Users from './Users'
import MembershipsPanel from '../components/dashboard/MembershipsPanel'
import { getUsersForAdmin } from '../services/authService'
import {
  getMemberships,
} from '../services/membresiaService'
import '../styles/dashboard/Dashboard.css'
import Plans from './Plans'

function Dashboard() {
  const [activeTab, setActiveTab] =
    useState('inicio')

  const [totalUsers, setTotalUsers] =
    useState(0)

  const [activeMemberships, setActiveMemberships] =
    useState(0)

  const [totalMemberships, setTotalMemberships] =
    useState(0)

  const [membershipValue, setMembershipValue] =
    useState(0)

  useEffect(() => {
    // Carga y calcula el resumen del dashboard.
    async function loadSummary() {
      const users = getUsersForAdmin()
      const memberships =
        await getMemberships()

      setTotalUsers(users.length)

      setTotalMemberships(
        memberships.length,
      )

      setActiveMemberships(
        memberships.filter(
          (membership) =>
            membership.status === 'activa',
        ).length,
      )

      const total = memberships.reduce(
        (accumulated, membership) =>
          accumulated +
          Number(membership.price),
        0,
      )

      setMembershipValue(total)
    }

    loadSummary()
  }, [])

  // Renderiza el contenido correspondiente a la pestaña seleccionada.
  const renderContent = () => {
    switch (activeTab) {
      case 'usuarios':
        return <Users />

      case 'membresias':
        return <MembershipsPanel />

      case 'planes':
        return <Plans />

      case 'pagos':
        return (
          <div>
            <h2>Pagos</h2>

            <p>
              Aquí se gestionarán los pagos de
              Mundo Fitness.
            </p>
          </div>
        )

      case 'reportes':
        return (
          <div>
            <h2>Reportes</h2>

            <p>
              Aquí se mostrarán los reportes del
              gimnasio.
            </p>
          </div>
        )

      default:
        return (
          <>
            <h2>Resumen general</h2>

            <div className="dashboard-cards">
              <div className="dashboard-card">
                <span>
                  Usuarios registrados
                </span>

                <strong>
                  {totalUsers}
                </strong>
              </div>

              <div className="dashboard-card">
                <span>
                  Membresías activas
                </span>

                <strong>
                  {activeMemberships}
                </strong>
              </div>

              <div className="dashboard-card">
                <span>
                  Membresías totales
                </span>

                <strong>
                  {totalMemberships}
                </strong>
              </div>

              <div className="dashboard-card">
                <span>
                  Valor de membresías
                </span>

                <strong>
                  S/ {membershipValue.toFixed(2)}
                </strong>
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