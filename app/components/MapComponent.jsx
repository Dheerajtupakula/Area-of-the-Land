import { MapContainer, TileLayer, Marker, Popup, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState, useEffect, useRef } from "react";
import * as turf from "@turf/turf";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const redDotIcon = L.divIcon({
  className: "size-10 bg-red-600",
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const LeafletMap = ({ data }) => {
  // const data = [
  //   { name: "point1", lat: 17.433975, lon: 78.378552 },
  //   { name: "point2", lat: 17.434772, lon: 78.379304 },
  //   { name: "point3", lat: 17.434383, lon: 78.379777 },
  //   { name: "point4", lat: 17.433574, lon:  78.379014 },
  // ];
  const [location, setLocation] = useState({
    lat: data[0].lat,
    lon: data[0].lon,
  });
  const [mapCenter, setMapCenter] = useState([location.lat, location.lon]);
  const [mapZoom, setMapZoom] = useState(13);
  const mapRef = useRef(null);
  console.log(data);

  useEffect(() => {
    if (typeof window !== "undefined") {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
    }
  }, []);

  const handleMarkerClick = (lat, lon) => {
    if (location.lat === lat && location.lon === lon) {
      return;
    }
    setLocation({ lat, lon });
    setMapCenter([lat, lon]);
    setMapZoom(14);
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lon], 18, {
        duration: 1.2,
      });
    }
  };

  const calculateArea = (coordinates) => {
    const polygon = turf.polygon([coordinates]);
    const area = turf.area(polygon);
    return area;
  };

  const polygonCoordinates = data.map((item) => [item.lat, item.lon]);
  polygonCoordinates.push([data[0].lat, data[0].lon]);
  // const polygonCoordinates = [
  //   [51.505, -0.09],
  //   [51.51, -0.1],
  //   [51.51, -0.12],
  //   [51.505, -0.09],
  // ];

  const calculateFeetArea = (squares) => {
    return squares * 10.7639;
  };
  const polygonArea = calculateArea(polygonCoordinates);
  const polygonFeetArea = calculateFeetArea(polygonArea);

  return (
    <div className="flex flex-col justify-start px-2 gap-3 border">
      <div className="p-2">
        <p>Calculated Area: {polygonArea.toFixed(2)} square meters</p>
        <p>Calculated Area: {polygonFeetArea.toFixed(2)} square foot</p>
      </div>
      <MapContainer
        ref={mapRef}
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "75vh", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {data.map((item) => (
          <Marker
            key={item.name}
            position={[item.lat, item.lon]}
            icon={redDotIcon}
            eventHandlers={{
              click: () => handleMarkerClick(item.lat, item.lon),
            }}
          >
            <Popup>{item.name}</Popup>
          </Marker>
        ))}
        <Polygon positions={polygonCoordinates} color="blue" />
      </MapContainer>
      <div className=" border grid grid-cols-2 w-full  justify-start  items-start gap-2">
        {data.map((item) => (
          <div
            key={item.id}
            className="border p-2 w-full bg-slate-300 cursor-pointer"
            onClick={() => handleMarkerClick(item.lat, item.lon)}
          >
            <p>{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeafletMap;
