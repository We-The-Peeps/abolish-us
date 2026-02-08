import { useMutation, useQuery } from 'convex/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useInterval } from 'ahooks'
import { api } from '../../convex/_generated/api'

const GRID_SIZE = 0.5
const HEARTBEAT_INTERVAL = 30000

const approximateCoordinates = (lat: number, lng: number) => ({
  lat: Math.round(lat / GRID_SIZE) * GRID_SIZE,
  lng: Math.round(lng / GRID_SIZE) * GRID_SIZE,
})

const isInUS = (lat: number, lng: number): boolean => {
  // Continental US
  if (lat >= 24.396 && lat <= 49.384 && lng >= -125.0 && lng <= -66.934)
    return true
  // Alaska
  if (lat >= 51 && lat <= 72 && lng >= -170 && lng <= -130) return true
  // Hawaii
  if (lat >= 18 && lat <= 23 && lng >= -161 && lng <= -154) return true
  return false
}

const getSessionId = (): string => {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem('abolish-session-id')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('abolish-session-id', id)
  }
  return id
}

export function usePresence() {
  const heartbeat = useMutation(api.presence.heartbeat)
  const activePresence = useQuery(api.presence.getActive)
  const [location, setLocation] = useState<{
    lat: number
    lng: number
    isInternational: boolean
  } | null>(null)
  const sessionIdRef = useRef('')

  useEffect(() => {
    sessionIdRef.current = getSessionId()

    if (typeof window === 'undefined' || !navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const approx = approximateCoordinates(
          position.coords.latitude,
          position.coords.longitude,
        )
        const international = !isInUS(
          position.coords.latitude,
          position.coords.longitude,
        )
        setLocation({ ...approx, isInternational: international })
      },
      () => {
        // Geolocation denied or unavailable - silently skip tracking
      },
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }, [])

  const sendHeartbeat = useCallback(() => {
    if (!location || !sessionIdRef.current) return
    heartbeat({
      sessionId: sessionIdRef.current,
      lat: location.lat,
      lng: location.lng,
      isInternational: location.isInternational,
    })
  }, [location, heartbeat])

  // Initial heartbeat when location becomes available
  useEffect(() => {
    sendHeartbeat()
  }, [sendHeartbeat])

  // Periodic heartbeat every 30s
  useInterval(sendHeartbeat, location ? HEARTBEAT_INTERVAL : undefined)

  const domesticPresence =
    activePresence?.filter((p) => !p.isInternational) ?? []
  const internationalCount =
    activePresence?.filter((p) => p.isInternational).length ?? 0
  const totalCount = activePresence?.length ?? 0

  return {
    domesticPresence,
    internationalCount,
    totalCount,
    isTracking: location !== null,
  }
}
