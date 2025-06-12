import { useEffect, useState } from "react";
import {
  MapContainer,
  Rectangle,
  GeoJSON,
  CircleMarker,
  Tooltip,
  useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

/* --- config ---------------------------------------------------------------- */

const scoreColor = s => `hsl(${120 - s}, 90%, 45%)`;

/* Minnesota extreme corners */
const mnBounds = [
  [43.499356, -97.239209],   // SW
  [49.384358, -89.489539]    // NE
];

const pad = 0.1;
const paddedBounds = [
  [mnBounds[0][0] - pad, mnBounds[0][1] - pad],
  [mnBounds[1][0] + pad, mnBounds[1][1] + pad]
];

/* --- helper: fit & lock zoom once ----------------------------------------- */
function FitToBorder({ geojson }) {
  const map = useMap();
  useEffect(() => {
    const layer = L.geoJSON(geojson);
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });

    //  ➜ Immediately zoom out one step (~50 % wider view)
    const startZoom = map.getZoom();
    map.setZoom(startZoom - 1);

    //  ➜ Lock minZoom to this zoom-out level so users can’t pull further back
    map.setMinZoom(map.getZoom());
  }, [map, geojson]);
  return null;
}

/* --- main component ------------------------------------------------------- */
export default function MapMN() {
  const [border, setBorder] = useState(null);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    fetch("/mn_border.geojson").then(r => r.json()).then(setBorder);
    fetch("/mn_cities.json").then(r => r.json()).then(setCities);
  }, []);

  /* guard until border is loaded */
  if (!border) return null;

  return (
    <MapContainer
      style={{ height: "100vh", width: "100vw", background: "#E7E9EC" }}
    >
      <FitToBorder geojson={border} />

      {/* blackout collar around MN */}
      <Rectangle
        bounds={paddedBounds}
        pathOptions={{ fillOpacity: 0.85, fillColor: "#000", stroke: false }}
        interactive={false}
      />

      {/* blue outline */}
      <GeoJSON
        data={border}
        /*   🔽  new style  🔽 */
        style={() => ({
          color: "#0057B7",     // blue outline
          weight: 2,
          fillColor: "#F5F5DC", // beige interior  (any hex you like)
          fillOpacity: 1        // fully cover the black
        })}
      />

      {/* city dots */}
      {cities.map(c => (
        <CircleMarker
          key={c.id}
          center={[c.lat, c.lon]}
          radius={5}
          pathOptions={{ color: scoreColor(c.s) }}
          fillOpacity={0.8}
        >
          <Tooltip>{`${c.n} (score ${c.s})`}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
