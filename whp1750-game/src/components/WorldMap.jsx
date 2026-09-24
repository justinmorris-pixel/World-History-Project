import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// pins: [{ location_id, name, lat, lng, status }] where status is
// 'active' | 'mastered' | 'wrong' (transient flash) | 'dim'
export default function WorldMap({ pins, onPinClick }) {
  const colorFor = (status) => {
    switch (status) {
      case 'mastered': return '#2f4a3c'
      case 'wrong': return '#a4462b'
      case 'dim': return '#c9bfa8'
      default: return '#b08d57'
    }
  }

  return (
    <div className="w-full rounded-xl border border-brass/30 bg-white/60 overflow-hidden shadow-inner">
      <ComposableMap projection="geoEqualEarth" projectionConfig={{ scale: 155 }}>
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#efe6d3"
                stroke="#d8c9a3"
                strokeWidth={0.5}
                style={{
                  default: { outline: 'none' },
                  hover: { outline: 'none', fill: '#e4d6b4' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>
        {pins.map((pin) => (
          <Marker
            key={pin.location_id}
            coordinates={[pin.lng, pin.lat]}
            onClick={() => onPinClick && onPinClick(pin)}
          >
            <circle
              r={7}
              fill={colorFor(pin.status)}
              stroke="#1b1f2a"
              strokeWidth={1}
              className="map-pin cursor-pointer"
            />
          </Marker>
        ))}
      </ComposableMap>
    </div>
  )
}
