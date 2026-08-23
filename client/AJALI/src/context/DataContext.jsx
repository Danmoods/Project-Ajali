import React, { createContext, useContext, useEffect, useState } from 'react'
import { seedIncidents, seedCommunityPosts } from '../data/seed.js'

const DataContext = createContext(null)

const INCIDENTS_KEY = 'ajali_incidents'
const POSTS_KEY = 'ajali_posts'

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function DataProvider({ children }) {
  const [incidents, setIncidents] = useState(() => load(INCIDENTS_KEY, seedIncidents))
  const [posts, setPosts] = useState(() => load(POSTS_KEY, seedCommunityPosts))

  useEffect(() => localStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents)), [incidents])
  useEffect(() => localStorage.setItem(POSTS_KEY, JSON.stringify(posts)), [posts])

  const addIncident = (incident) => {
    const id = `AJ-${Math.floor(9000 + Math.random() * 999)}`
    const now = new Date()
    const record = {
      id,
      status: 'Pending Review',
      severity: incident.severity || 'Warning',
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      evidence: [],
      hasVideo: false,
      ...incident,
    }
    setIncidents((prev) => [record, ...prev])
    return record
  }

  const updateIncident = (id, patch) => {
    setIncidents((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }

  const removeIncident = (id) => {
    setIncidents((prev) => prev.filter((i) => i.id !== id))
  }

  const addPost = (post) => {
    setPosts((prev) => [{ id: crypto.randomUUID(), time: 'Just now', ...post }, ...prev])
  }

  return (
    <DataContext.Provider
      value={{ incidents, posts, addIncident, updateIncident, removeIncident, addPost }}
    >
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)

