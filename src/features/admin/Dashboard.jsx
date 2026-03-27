import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClientes: 0,
    clientesActivos: 0,
    clientesVencidos: 0,
    totalEntrenadores: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarStats()
  }, [])

async function cargarStats() {
  try {
    const hoy = new Date().toISOString().split('T')[0]

    const { data: clientes, error: errorClientes } = await supabase.from('clientes').select('id, estado, fecha_vencimiento')
    const { data: entrenadores, error: errorEntrenadores } = await supabase.from('entrenadores').select('id')

    const totalClientes = clientes?.length ?? 0
    const clientesActivos = clientes?.filter(c => c.estado === true).length ?? 0
    const clientesVencidos = clientes?.filter(c => c.fecha_vencimiento && c.fecha_vencimiento < hoy).length ?? 0
    const totalEntrenadores = entrenadores?.length ?? 0

    setStats({ totalClientes, clientesActivos, clientesVencidos, totalEntrenadores })
  } catch (error) {
    console.error('Error cargando stats:', error)
  } finally {
    setLoading(false)
  }
}

  if (loading) return <p>Cargando...</p>

  return (
    <div>
      <h1>Dashboard</h1>
      <div>
        <div>
          <h3>Total clientes</h3>
          <p>{stats.totalClientes}</p>
        </div>
        <div>
          <h3>Clientes activos</h3>
          <p>{stats.clientesActivos}</p>
        </div>
        <div>
          <h3>Clientes vencidos</h3>
          <p>{stats.clientesVencidos}</p>
        </div>
        <div>
          <h3>Entrenadores</h3>
          <p>{stats.totalEntrenadores}</p>
        </div>
      </div>
    </div>
  )
}