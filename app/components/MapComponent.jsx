import { MapContainer, TileLayer, Marker, Popup, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import "leaflet-draw";
import { useState, useEffect, useRef } from "react";
import * as turf from "@turf/turf";

const LeafletMap = ({ data, setData }) => {
  const order = {
    north: 1,
    "north-east": 2,
    east: 3,
    "south-east": 4,
    south: 5,
    "south-west": 6,
    west: 7,
    "north-west": 8,
  };

  data.sort((a, b) => order[a.name] - order[b.name]);

  const [location, setLocation] = useState({
    lat: data[0].lat,
    lon: data[0].lon,
  });
  const [mapCenter, setMapCenter] = useState([location.lat, location.lon]);
  const [mapZoom, setMapZoom] = useState(13);
  const [polygonCoordinates, setPolygonCoordinates] = useState(
    data.map((item) => [item.lat, item.lon])
  );
  const mapRef = useRef(null);

  const redDotIcon = L.divIcon({
    className:
      "size-40 rotate-45  rounded-br-lg rounded-tr-lg rounded-tl-lg bg-red-600 ",
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      const drawControl = new L.Control.Draw({
        edit: {
          featureGroup: drawnItems,
        },
        draw: {
          polygon: true,
          marker: true,
          rectangle: false,
          circle: false,
          circlemarker: false,
          polyline: false,
        },
      });
      map.addControl(drawControl);

      map.on(L.Draw.Event.CREATED, function (event) {
        const layer = event.layer;
        drawnItems.addLayer(layer);
        handleCreated(event);
      });

      map.on(L.Draw.Event.EDITED, function (event) {
        handleEdited(event);
      });

      map.on(L.Draw.Event.DELETED, function (event) {
        handleDeleted(event);
      });
    }
  }, [mapRef.current]);

  const handleMarkerClick = (lat, lon) => {
    if (location.lat === lat && location.lon === lon) {
      setMapZoom(16);
      return;
    }
    setLocation({ lat, lon });
    setMapCenter([lat, lon]);
    setMapZoom(16);
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lon], 18, {
        duration: 1,
      });
    }
  };

  const calculateArea = (coordinates) => {
    // Ensure the polygon is closed
    if (
      coordinates.length > 0 &&
      coordinates[0] !== coordinates[coordinates.length - 1]
    ) {
      coordinates.push(coordinates[0]);
    }
    if (coordinates.length > 2) {
      const polygon = turf.polygon([coordinates]);
      const area = turf.area(polygon);
      return area;
    }
    return 0;
  };

  const calculateFeetArea = (squares) => {
    return squares * 10.7639;
  };

  const polygonArea = calculateArea(polygonCoordinates);
  const polygonFeetArea = calculateFeetArea(polygonArea);

  const handleCreated = (e) => {
    const layer = e.layer;
    if (layer instanceof L.Marker) {
      const { lat, lng } = layer.getLatLng();
      const newMarker = { name: `point${data.length + 1}`, lat, lon: lng };
      const newData = [...data, newMarker];
      setData(newData);
      setPolygonCoordinates(newData.map((item) => [item.lat, item.lon]));
    } else if (layer instanceof L.Polygon) {
      const latlngs = layer
        .getLatLngs()[0]
        .map((latlng) => [latlng.lat, latlng.lng]);
      setPolygonCoordinates(latlngs);
    }
  };

  const handleEdited = (e) => {
    const layers = e.layers;
    const newData = [...data];
    layers.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        const { lat, lng } = layer.getLatLng();
        const index = newData.findIndex(
          (point) =>
            point.lat === layer._latlng.lat && point.lon === layer._latlng.lng
        );
        newData[index] = { ...newData[index], lat, lon: lng };
      } else if (layer instanceof L.Polygon) {
        const latlngs = layer
          .getLatLngs()[0]
          .map((latlng) => [latlng.lat, latlng.lng]);
        setPolygonCoordinates(latlngs);
      }
    });
    setData(newData);
    setPolygonCoordinates(newData.map((item) => [item.lat, item.lon]));
  };

  const handleDeleted = (e) => {
    const layers = e.layers;
    const newData = [...data];
    layers.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        const { lat, lng } = layer.getLatLng();
        const index = newData.findIndex(
          (point) => point.lat === lat && point.lon === lng
        );
        newData.splice(index, 1);
      } else if (layer instanceof L.Polygon) {
        setPolygonCoordinates([]);
      }
    });
    setData(newData);
    setPolygonCoordinates(newData.map((item) => [item.lat, item.lon]));
  };

  console.log(data);

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
        whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
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
      <div className="border grid grid-cols-2 w-full justify-start items-start gap-2">
        {data.map((item) => (
          <div
            key={item.name}
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
