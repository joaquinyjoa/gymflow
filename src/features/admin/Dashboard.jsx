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
      const [{ count: totalClientes }, { count: clientesActivos }, { count: clientesVencidos }, { count: totalEntrenadores }] =
        await Promise.all([
          supabase.from('clientes').select('*', { count: 'exact', head: true }),
          supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('estado', true),
          supabase.from('clientes').select('*', { count: 'exact', head: true }).lt('fecha_vencimiento', new Date().toISOString().split('T')[0]),
          supabase.from('entrenadores').select('*', { count: 'exact', head: true }),
        ])

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