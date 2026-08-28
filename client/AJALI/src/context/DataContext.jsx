import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiFetch } from '../lib/api.js'

const DataContext = createContext(null)

function mapIncident(incident) {
  const statusMap = {
    'under investigation': 'Pending Review',
    verified: 'Verified',
    resolved: 'Resolved',
    rejected: 'Rejected',
  }

  return {
    ...incident,

    // Keep the names expected by the existing frontend.
    location:
      incident.location ||
      (incident.latitude != null && incident.longitude != null
        ? `${incident.latitude}, ${incident.longitude}`
        : 'Location not provided'),

    lat: incident.lat ?? incident.latitude ?? '',
    lng: incident.lng ?? incident.longitude ?? '',

    category:
      incident.category ||
      incident.incident_type ||
      'Incident',

    severity:
      incident.severity ||
      (incident.status === 'resolved' ? 'Resolved' : 'Warning'),

    time:
      incident.time ||
      (incident.created_at
        ? new Date(incident.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : ''),

    date:
      incident.date ||
      (incident.created_at
        ? new Date(incident.created_at).toLocaleDateString()
        : ''),

    displayStatus:
      statusMap[incident.status] || incident.status || 'Pending Review',

    reporter:
      incident.reporter?.username ||
      incident.reporter ||
      'Unknown',

    evidence: incident.media || incident.evidence || [],
    hasVideo: Boolean(
      incident.hasVideo ||
      (incident.media || []).some(
        (media) => media.media_type === 'video'
      )
    ),
  }
}

function mapPost(post) {
  return {
    ...post,

    // Keep the names expected by CommunityPost.jsx.
    author:
      post.author?.username ||
      post.author ||
      'Ajali User',

    body:
      post.body ||
      post.content ||
      '',

    time:
      post.time ||
      (post.created_at
        ? new Date(post.created_at).toLocaleString()
        : ''),
  }
}

export function DataProvider({ children }) {
  const [incidents, setIncidents] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchIncidents = async () => {
    setLoading(true)

    try {
      const data = await apiFetch('/incidents')
      setIncidents((data.items || []).map(mapIncident))
    } catch (error) {
      console.error('Error fetching incidents:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCommunityPosts = async () => {
    try {
      const data = await apiFetch('/community/posts')
      setPosts((data.items || []).map(mapPost))
    } catch (error) {
      console.error('Error fetching community posts:', error)
    }
  }

  const addIncident = async (incident) => {
    const payload = {
      title: incident.title,
      description: incident.description,
      incident_type:
        incident.incident_type ||
        incident.category ||
        'intervention',
      latitude:
        incident.latitude ??
        (incident.lat !== '' ? Number(incident.lat) : null),
      longitude:
        incident.longitude ??
        (incident.lng !== '' ? Number(incident.lng) : null),
    }

    const data = await apiFetch('/incidents', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const created = mapIncident(data.incident || data)

    setIncidents((prev) => [created, ...prev])

    return created
  }

  const updateIncident = async (id, patch) => {
    const data = await apiFetch(`/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })

    const updated = mapIncident(data.incident || data)

    setIncidents((prev) =>
      prev.map((incident) =>
        String(incident.id) === String(id)
          ? updated
          : incident
      )
    )

    return updated
  }

  const removeIncident = async (id) => {
    await apiFetch(`/incidents/${id}`, {
      method: 'DELETE',
    })

    setIncidents((prev) =>
      prev.filter(
        (incident) => String(incident.id) !== String(id)
      )
    )
  }

  const addPost = async (post) => {
    const content = post.content || post.body || ''

    const data = await apiFetch('/community/posts', {
      method: 'POST',
      body: JSON.stringify({
        content,
      }),
    })

    const created = mapPost(data.post || data)

    setPosts((prev) => [created, ...prev])

    return created
  }

  useEffect(() => {
    const token = localStorage.getItem('ajali_token')

    if (!token) return

    fetchIncidents()
    fetchCommunityPosts()
  }, [])

  return (
    <DataContext.Provider
      value={{
        incidents,
        posts,
        loading,
        fetchIncidents,
        fetchCommunityPosts,
        addIncident,
        updateIncident,
        removeIncident,
        addPost,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  const context = useContext(DataContext)

  if (!context) {
    throw new Error('useData must be used inside a DataProvider')
  }

  return context
}