import './MapPicker.css'
import 'leaflet/dist/leaflet.css'
import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet'
import L from 'leaflet'

// --- Configuración del icono de Leaflet ---
delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})
// ------------------------------------------

const DEFAULT_CENTER = [11.226141, -74.185782]

const MapPicker = (props) => {
    let { coordinates, onChange } = props

    // 1. Lógica de normalización de coordinates (solo para la inicialización)
    if (typeof coordinates === 'string') {
        const parts = coordinates.split(',')
        coordinates = [
            parseFloat(parts[0]),
            parseFloat(parts[1])
        ]
    } else if (Array.isArray(coordinates) && coordinates.length === 2) {
        coordinates = [
            parseFloat(coordinates[0]),
            parseFloat(coordinates[1])
        ]
    }
    
    // Verificación de seguridad
    if (!Array.isArray(coordinates) || coordinates.some(isNaN) || coordinates.length !== 2) {
        coordinates = null
    }

    // 2. Sentencia final para el valor inicial
    const initialCenter = coordinates || DEFAULT_CENTER
    
    // 3. El estado 'position' se inicializa con initialCenter y NUNCA más se actualiza por props.
    const [position, setPosition] = useState(initialCenter) 

    // *** SE HA ELIMINADO EL useEffect([coordinates]) QUE CAUSABA EL CAMBIO ***

    const eventHandlers = useMemo(
        () => ({
            dragend(e) {
                const marker = e.target
                const newCoords = [marker.getLatLng().lat, marker.getLatLng().lng]
                setPosition(newCoords)
                onChange(newCoords)
            },
        }),
        [onChange]
    )

    const MapClickEvents = () => {
        useMapEvents({
            click(e) {
                const newCoords = [e.latlng.lat, e.latlng.lng]
                setPosition(newCoords)
                onChange(newCoords)
            },
        })
        return null
    }

    return (
        <div className="location-picker-container">
            <div className='leaflet-container'>
                <MapContainer
                    // Se usa 'position' (estado interno) para el centro
                    center={position} 
                    zoom={6}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Marker
                        draggable={true}
                        eventHandlers={eventHandlers}
                        position={position}
                    >
                        <Popup>Arrastra el marcador para seleccionar la ubicación de la finca.</Popup>
                    </Marker>
                    <MapClickEvents />
                </MapContainer>
            </div>
        </div>
    )
}

export default MapPicker