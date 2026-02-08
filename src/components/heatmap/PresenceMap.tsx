import { useEffect, useId, useMemo, useState } from 'react'

const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

type MapModule = typeof import('react-map-gl/maplibre')

interface PresencePoint {
  lat: number
  lng: number
}

interface PresenceMapProps {
  points: PresencePoint[]
}

export default function PresenceMap({ points }: PresenceMapProps) {
  const [mapModule, setMapModule] = useState<MapModule | null>(null)
  const sourceId = useId()
  const layerId = useId()

  useEffect(() => {
    import('react-map-gl/maplibre').then((mod) => {
      setMapModule(mod)
    })
  }, [])

  const geojsonData = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: points.map((p) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [p.lng, p.lat] as [number, number],
        },
        properties: {},
      })),
    }),
    [points],
  )

  if (!mapModule) {
    return (
      <div className="w-full h-full bg-[#0d1117] flex items-center justify-center">
        <div className="text-xs text-white/30 uppercase tracking-widest">
          Loading map...
        </div>
      </div>
    )
  }

  const MapGL = mapModule.Map
  const Source = mapModule.Source
  const Layer = mapModule.Layer

  return (
    <MapGL
      initialViewState={{
        latitude: 39.8283,
        longitude: -98.5795,
        zoom: 3.5,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={MAP_STYLE}
      interactive={false}
      attributionControl={false}
    >
      {points.length > 0 && (
        <Source id={sourceId} type="geojson" data={geojsonData}>
          <Layer
            id={layerId}
            type="heatmap"
            paint={{
              'heatmap-weight': 1,
              'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0,
                1,
                9,
                3,
              ],
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0,
                'rgba(0,0,0,0)',
                0.2,
                'rgba(103,0,183,0.4)',
                0.4,
                'rgba(124,58,237,0.6)',
                0.6,
                'rgba(139,92,246,0.7)',
                0.8,
                'rgba(167,139,250,0.85)',
                1,
                'rgba(196,181,253,1)',
              ],
              'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0,
                20,
                9,
                40,
              ],
              'heatmap-opacity': 0.8,
            }}
          />
        </Source>
      )}
    </MapGL>
  )
}
