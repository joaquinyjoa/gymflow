import { createContext, useContext, useEffect, useRef, useState } from 'react'
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
  const initialized = useRef(false)

  useEffect(() => {
    // onAuthStateChange maneja TODO — no llamar getSession por separado
    // para evitar doble carga y condiciones de carrera
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Solo limpiar estado en logout explícito
        setUser(null)
        setPerfil(null)
        setRol(null)
        setLoading(false)
        setPerfilListo(false)
        setClienteVencido(false)
        initialized.current = false
        return
      }

      if (session?.user) {
        // SIGNED_IN, TOKEN_REFRESHED, INITIAL_SESSION con sesión activa
        if (!initialized.current || event === 'SIGNED_IN') {
          initialized.current = true
          cargarPerfil(session.user)
        }
        return
      }

      // INITIAL_SESSION sin sesión (usuario no logueado)
      if (event === 'INITIAL_SESSION') {
        setLoading(false)
      }
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
      const esErrorDeAuth = error.message === 'Usuario no encontrado' || error.message === 'Usuario desactivado'
      if (esErrorDeAuth) {
        initialized.current = false
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
