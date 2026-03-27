import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { EMAIL_DOMAIN, ROLES, ROUTES } from '../lib/constants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [rol, setRol] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay sesión activa al cargar la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) cargarPerfil(session.user)
      else setLoading(false)
    })

    // Escuchar cambios de sesión (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) cargarPerfil(session.user)
      else {
        setUser(null)
        setPerfil(null)
        setRol(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function cargarPerfil(authUser) {
    try {
      // Obtener rol desde la tabla users
      const { data: userData, error } = await supabase
        .from('users')
        .select('rol, activo')
        .eq('id', authUser.id)
        .single()

      if (error || !userData) throw new Error('Usuario no encontrado')
      if (!userData.activo) throw new Error('Usuario desactivado')

      setUser(authUser)
      setRol(userData.rol)

      // Cargar perfil según rol
      if (userData.rol === ROLES.CLIENTE) {
        const { data } = await supabase
          .from('clientes')
          .select('*')
          .eq('user_id', authUser.id)
          .single()
        setPerfil(data)
      } else if (userData.rol === ROLES.ENTRENADOR) {
        const { data } = await supabase
          .from('entrenadores')
          .select('*')
          .eq('user_id', authUser.id)
          .single()
        setPerfil(data)
      } else if (userData.rol === ROLES.ADMIN) {
        const { data } = await supabase
          .from('recepcion')
          .select('*')
          .eq('user_id', authUser.id)
          .single()
        setPerfil(data)
      }
    } catch (error) {
      console.error('Error cargando perfil:', error.message)
      await supabase.auth.signOut()
    } finally {
      setLoading(false)
    }
  }

  async function login(dni, pin) {
    const email = `${dni}${EMAIL_DOMAIN}`
    const { error } = await supabase.auth.signInWithPassword({ email, password: pin })
    if (error) throw new Error('DNI o PIN incorrecto')
      // Esperar a que onAuthStateChange cargue el perfil
  await new Promise(resolve => setTimeout(resolve, 500))
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
    <AuthContext.Provider value={{ user, perfil, rol, loading, login, logout, getRutaInicial }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}