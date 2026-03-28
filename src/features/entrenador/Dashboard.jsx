import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../store/AuthContext'
import { ROUTES } from '../../lib/constants'

export default function DashboardEntrenador() {
  const [stats, setStats] = useState({
    totalEjercicios: 0,
    totalRutinas: 0,
    totalClientes: 0,
  })
  const [loading, setLoading] = useState(true)
  const { perfil } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (perfil?.id) cargarStats()
  }, [perfil])

  async function cargarStats() {
    try {
      const [
        { count: totalEjercicios },
        { count: totalRutinas },
        { count: totalClientes },
      ] = await Promise.all([
        supabase.from('ejercicios').select('*', { count: 'exact', head: true }).eq('created_by', perfil.id),
        supabase.from('rutinas').select('*', { count: 'exact', head: true }).eq('created_by', perfil.id),
        supabase.from('rutinas_clientes').select('*', { count: 'exact', head: true }),
      ])

      setStats({ totalEjercicios, totalRutinas, totalClientes })
    } catch (error) {
      console.error('Error cargando stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p>Cargando...</p>

  return (
    <div>
      <h1>Bienvenido, {perfil?.nombre}</h1>
      <div>
        <div onClick={() => navigate(ROUTES.ENTRENADOR_EJERCICIOS)} style={{ cursor: 'pointer' }}>
          <h3>Ejercicios creados</h3>
          <p>{stats.totalEjercicios}</p>
        </div>
        <div onClick={() => navigate(ROUTES.ENTRENADOR_RUTINAS)} style={{ cursor: 'pointer' }}>
          <h3>Rutinas creadas</h3>
          <p>{stats.totalRutinas}</p>
        </div>
        <div onClick={() => navigate(ROUTES.ENTRENADOR_CLIENTES)} style={{ cursor: 'pointer' }}>
          <h3>Clientes asignados</h3>
          <p>{stats.totalClientes}</p>
        </div>
      </div>
      <div>
        <button onClick={() => navigate('/entrenador/ejercicios/nuevo')}>
          + Nuevo ejercicio
        </button>
        <button onClick={() => navigate('/entrenador/rutinas/nuevo')}>
          + Nueva rutina
        </button>
      </div>
    </div>
  )
}