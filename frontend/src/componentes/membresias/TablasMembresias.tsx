import '../../styles/membresias/Membresias.css'

interface Membresia {
  id: number
  client_id: number
  plan: string
  start_date: string
  end_date: string
  price: number
  status: string
}

interface TablasMembresiasProps {
  membresias: Membresia[]
}

// Vista alternativa en formato tabla (útil para reportes o pantallas grandes)
function TablasMembresias({ membresias }: TablasMembresiasProps) {
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
        {membresias.map((m) => (
          <tr key={m.id}>
            <td>{m.id}</td>
            <td>#{m.client_id}</td>
            <td>{m.plan}</td>
            <td>{m.start_date}</td>
            <td>{m.end_date}</td>
            <td>S/ {m.price}</td>
            <td>{m.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default TablasMembresias
