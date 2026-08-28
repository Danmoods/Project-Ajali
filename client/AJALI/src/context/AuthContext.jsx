import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiFetch } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() =>
    localStorage.getItem('ajali_token')
  )
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('ajali_token')

      if (!savedToken) {
        setReady(true)
        return
      }

      try {
        const data = await apiFetch('/auth/me')

        setUser(data.user)
        setToken(savedToken)
      } catch (error) {
        console.error('Session restore failed:', error)

        localStorage.removeItem('ajali_token')
        localStorage.removeItem('ajali_user')

        setToken(null)
        setUser(null)
      } finally {
        setReady(true)
      }
    }

    restoreSession()
  }, [])

  const register = async (form) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: form.username,
        email: form.email,
        password: form.password,
        confirm_password:
          form.confirm_password || form.confirm,
        ...(form.phone ? { phone: form.phone } : {}),
      }),
    })

    localStorage.setItem('ajali_token', data.access_token)
    localStorage.setItem('ajali_user', JSON.stringify(data.user))

    setToken(data.access_token)
    setUser(data.user)

    return data.user
  }

  const login = async (form) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: form.email,
        password: form.password,
      }),
    })

    localStorage.setItem('ajali_token', data.access_token)
    localStorage.setItem('ajali_user', JSON.stringify(data.user))

    setToken(data.access_token)
    setUser(data.user)

    return data.user
  }

  const logout = () => {
    localStorage.removeItem('ajali_token')
    localStorage.removeItem('ajali_user')

    setToken(null)
    setUser(null)
  }

  const updateProfile = async (form) => {
    if (!token) {
      throw new Error('You must be logged in')
    }

    const data = await apiFetch('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({
        username: form.username,
        email: form.email,
        phone: form.phone,
        bio: form.bio,
        profile_photo: form.profile_photo,
      }),
    })

    setUser(data.user)
    localStorage.setItem('ajali_user', JSON.stringify(data.user))

    return data.user
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        ready,
        loading: !ready,
        register,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }

  return context
}