import '../../styles/membresias/Membresias.css'

interface MembershipTableRow {
  id: number
  client_id: number
  plan: string
  start_date: string
  end_date: string
  price: number
  status: string
}

interface MembershipTableProps {
  memberships: MembershipTableRow[]
}

// Vista alternativa en formato tabla (útil para reportes o pantallas grandes)
function VMembershipTable({
  memberships,
}: MembershipTableProps) {
  return (
    <table className="tabla-membresias">
      <thead>
        <tr>
          <th>ID</th>
          <th>Cliente</th>
          <th>Plan</th>
          <th>Inicio</th>
          <th>Fin</th>
          <th>Precio</th>
          <th>Estado</th>
        </tr>
      </thead>

      <tbody>
          {memberships.map((membership) => (
        <tr key={membership.id}>
          <td>{membership.id}</td>
          <td>#{membership.client_id}</td>
          <td>{membership.plan}</td>
          <td>{membership.start_date}</td>
          <td>{membership.end_date}</td>
          <td>S/ {membership.price}</td>
          <td>{membership.status}</td>
        </tr>
        ))}
      </tbody>
    </table>
  )
}

export default VMembershipTable
