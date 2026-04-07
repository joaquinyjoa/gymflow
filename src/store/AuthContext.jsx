import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { EMAIL_DOMAIN, ROLES, ROUTES } from '../lib/constants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [rol, setRol] = useState(null)
  const [loading, setLoading] = useState(true)
  const [perfilListo, setPerfilListo] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [clienteVencido, setClienteVencido] = useState(false)

  useEffect(() => {
    // 1. Restaurar sesión guardada en localStorage al cargar la página
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        cargarPerfil(session.user)
      } else {
        setLoading(false)
      }
    })

    // 2. Escuchar solo eventos activos: nuevo login y logout explícito
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        // Login nuevo — cargar perfil
        cargarPerfil(session.user)
      } else if (event === 'SIGNED_OUT') {
        // Logout explícito — limpiar todo
        setUser(null)
        setPerfil(null)
        setRol(null)
        setPerfilListo(false)
        setClienteVencido(false)
        setLoading(false)
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Token renovado automáticamente — solo actualizar el objeto user silenciosamente
        setUser(session.user)
      }
      // INITIAL_SESSION: ignorado — ya lo manejamos con getSession() arriba
    })

    return () => subscription.unsubscribe()
  }, [])

  async function cargarPerfil(authUser) {
    setPerfilListo(false)
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('rol, activo')
        .eq('id', authUser.id)
        .single()

      if (error || !userData) throw new Error('Usuario no encontrado')
      if (!userData.activo) throw new Error('Usuario desactivado')

      setUser(authUser)
      setRol(userData.rol)

      if (userData.rol === ROLES.CLIENTE) {
        const { data } = await supabase
          .from('clientes')
          .select('*')
          .eq('user_id', authUser.id)
          .single()
        setPerfil(data)
        if (data?.fecha_vencimiento) {
          const hoy = new Date().toISOString().split('T')[0]
          setClienteVencido(data.fecha_vencimiento < hoy)
        } else {
          setClienteVencido(false)
        }
      } else if (userData.rol === ROLES.ENTRENADOR) {
        const { data } = await supabase
          .from('entrenadores')
          .select('*')
          .eq('user_id', authUser.id)
          .single()
        setPerfil(data)
      } else if (userData.rol === ROLES.ADMIN) {
        setPerfil({ correo: authUser.email })
      }

      setPerfilListo(true)
    } catch (error) {
      setAuthError(error.message)
      setPerfilListo(false)
      // Solo cerrar sesión si el usuario realmente no existe o está desactivado
      if (error.message === 'Usuario no encontrado' || error.message === 'Usuario desactivado') {
        await supabase.auth.signOut()
      }
    } finally {
      setLoading(false)
    }
  }

  async function login(dni, pin) {
    setPerfilListo(false)
    setAuthError(null)
    const email = `${dni}${EMAIL_DOMAIN}`
    const { error } = await supabase.auth.signInWithPassword({ email, password: pin })
    if (error) throw new Error('DNI o PIN incorrecto')
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  function getRutaInicial() {
    if (rol === ROLES.ADMIN) return ROUTES.ADMIN
    if (rol === ROLES.ENTRENADOR) return ROUTES.ENTRENADOR
    if (rol === ROLES.CLIENTE) return ROUTES.CLIENTE
    return ROUTES.LOGIN
  }

  return (
    <AuthContext.Provider value={{
      user, perfil, rol, loading,
      perfilListo, authError, setAuthError,
      clienteVencido,
      login, logout, getRutaInicial
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
