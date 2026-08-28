import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

const USERS_KEY = 'ajali_users'
const SESSION_KEY = 'ajali_session'

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || []
  } catch {
    return []
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY))
      if (session) setUser(session)
    } catch {
      /* noop */
    }

    setReady(true)
  }, [])

  const register = ({ username, email, password }) => {
    const users = readUsers()

    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with that email already exists.')
    }

    const newUser = {
      id: crypto.randomUUID(),
      username,
      email,
      password,
      role: 'citizen',
      responderId: `#${Math.floor(10000 + Math.random() * 89999)}-AJ`,
      joined: new Date().getFullYear(),
      phone: '',
      bio: 'Committed to community safety and rapid response tracking.',
      avatar: null,
    }

    writeUsers([...users, newUser])

    const session = { ...newUser }
    delete session.password

    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(session)

    return session
  }

  const login = ({ email, password }) => {
    const users = readUsers()

    // Demo/admin shortcut so reviewers can access the admin dashboard.
    if (email.toLowerCase() === 'admin@ajali.app' && password === 'admin123') {
      const adminSession = {
        id: 'admin',
        username: 'Control Room Admin',
        email,
        role: 'admin',
        responderId: '#00001-AJ',
        joined: 2022,
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify(adminSession))
      setUser(adminSession)

      return adminSession
    }

    const found = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
    )

    if (!found) {
      throw new Error('Incorrect email or password.')
    }

    const session = { ...found }
    delete session.password

    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(session)

    return session
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  const updateProfile = (patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch }

      localStorage.setItem(SESSION_KEY, JSON.stringify(next))

      const users = readUsers().map((u) =>
        u.id === next.id ? { ...u, ...patch } : u
      )

      writeUsers(users)

      return next
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
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

export const useAuth = () => useContext(AuthContext)
