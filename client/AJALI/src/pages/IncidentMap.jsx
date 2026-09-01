import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl, useMap } from 'react-leaflet'
import { Search, SlidersHorizontal, LocateFixed } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'

const NAIROBI = [-1.286389, 36.817223]

const STATUS_COLORS = {
  'under investigation': '#f59e0b',
  verified: '#22c55e',
  resolved: '#34d399',
  rejected: '#ef4444',
}

function MapCenter({ center }) {
  const map = useMap()

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom())
    }
  }, [center, map])

  return null
}

export default function IncidentMap() {
  const { incidents } = useData()
  const mapRef = useRef(null)
  const [active, setActive] = useState(null)
  const [query, setQuery] = useState('')
  const [userLocation, setUserLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('')
  const [mapCenter, setMapCenter] = useState(NAIROBI)

  const filteredIncidents = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase()

    if (!trimmedQuery) {
      return incidents
    }

    return incidents.filter((incident) => {
      const searchableText = [
        incident.title,
        incident.description,
        incident.location,
        incident.status,
        incident.category,
        incident.reporter,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(trimmedQuery)
    })
  }, [incidents, query])

  useEffect(() => {
    if (!filteredIncidents.length) {
      setActive(null)
      return
    }

    const firstMatch = filteredIncidents[0]
    if (firstMatch && firstMatch.lat != null && firstMatch.lng != null) {
      setActive(String(firstMatch.id))
    }
  }, [filteredIncidents])

  const markerIncidents = filteredIncidents.filter(
    (incident) =>
      incident.lat != null &&
      incident.lng != null &&
      Number.isFinite(Number(incident.lat)) &&
      Number.isFinite(Number(incident.lng))
  )

  const activeIncident =
    markerIncidents.find((incident) => String(incident.id) === String(active)) ||
    markerIncidents[0] ||
    null

  useEffect(() => {
    if (activeIncident && mapRef.current) {
      mapRef.current.flyTo([Number(activeIncident.lat), Number(activeIncident.lng)], 12, {
        animate: true,
        duration: 1,
      })
    }
  }, [activeIncident])

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported in this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = [position.coords.latitude, position.coords.longitude]
        setUserLocation(nextLocation)
        setMapCenter(nextLocation)
        setLocationStatus('')
        if (mapRef.current) {
          mapRef.current.flyTo(nextLocation, 14, {
            animate: true,
            duration: 1,
          })
        }
      },
      () => {
        setLocationStatus('Location permission denied. Showing Nairobi, Kenya.')
        setUserLocation(null)
        setMapCenter(NAIROBI)
        if (mapRef.current) {
          mapRef.current.flyTo(NAIROBI, 12, { animate: true, duration: 1 })
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }

  return (
    <div className="animate-fadeUp">
      <div className="relative h-[70vh] min-h-[480px] overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-950">
        <div className="absolute left-3 right-3 top-3 z-[500] sm:left-4 sm:right-auto sm:w-96">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900/90 px-3 py-2.5 shadow-card backdrop-blur">
            <Search size={16} className="text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search incidents or locations…"
              className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
            />
            <button className="rounded-lg p-1 text-slate-400 hover:text-white" aria-label="Filters">
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>

        <MapContainer
          center={mapCenter}
          zoom={12}
          minZoom={2}
          zoomControl={false}
          scrollWheelZoom
          className="h-full w-full"
          whenCreated={(map) => {
            mapRef.current = map
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ZoomControl position="topright" />
          <MapCenter center={mapCenter} />

          {userLocation && (
            <CircleMarker center={userLocation} radius={10} pathOptions={{ color: '#60a5fa', fillColor: '#60a5fa', fillOpacity: 0.8 }}>
              <Popup>
                <div className="space-y-1 text-sm text-slate-800">
                  <p className="font-semibold">Your location</p>
                </div>
              </Popup>
            </CircleMarker>
          )}

          {markerIncidents.map((incident) => {
            const statusColor = STATUS_COLORS[incident.status] || '#f97316'

            return (
              <CircleMarker
                key={incident.id}
                center={[Number(incident.lat), Number(incident.lng)]}
                radius={8}
                pathOptions={{
                  color: statusColor,
                  fillColor: statusColor,
                  fillOpacity: 0.9,
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => setActive(String(incident.id)),
                }}
              >
                <Popup>
                  <div className="min-w-[180px] space-y-2 text-slate-800">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">#{incident.id}</p>
                      <h3 className="font-semibold text-slate-900">{incident.title}</h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-700">
                        {incident.status}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-700">
                        {incident.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{incident.location || 'Location unavailable'}</p>

                    <Link
                      to={`/app/reports/${incident.id}`}
                      className="inline-flex w-full items-center justify-center rounded-lg bg-crimson-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-crimson-400"
                    >
                      View details
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>

        <button
          onClick={handleLocateMe}
          className="absolute bottom-4 right-4 z-[500] flex h-11 w-11 items-center justify-center rounded-full bg-ink-800 text-slate-200 shadow-card transition hover:bg-ink-700"
          aria-label="Locate me"
        >
          <LocateFixed size={18} />
        </button>
      </div>

      {locationStatus && (
        <p className="mt-3 text-center text-xs text-amber-300">{locationStatus}</p>
      )}
    </div>
  )
}
