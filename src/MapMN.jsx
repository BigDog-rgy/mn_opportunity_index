import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  Rectangle,
  GeoJSON,
  CircleMarker,
  Tooltip,
  useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ---------- helpers ---------- */
const slugify = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const DOT_COLOR = "#d91e18"; // solid red

/* Minnesota extreme corners */
const mnBounds = [
  [43.499356, -97.239209], // SW
  [49.384358, -89.489539]  // NE
];

const pad = 0.1;
const paddedBounds = [
  [mnBounds[0][0] - pad, mnBounds[0][1] - pad],
  [mnBounds[1][0] + pad, mnBounds[1][1] + pad]
];

/* Fit map once */
function FitToBorder({ geojson }) {
  const map = useMap();
  useEffect(() => {
    const layer = L.geoJSON(geojson);
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    map.setZoom(map.getZoom() - 1); // slight zoom-out
    map.setMinZoom(map.getZoom());  // lock further out
  }, [map, geojson]);
  return null;
}

/* ---------- main ---------- */
export default function MapMN() {
  const [border, setBorder] = useState(null);
  const [cities, setCities] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const [borderData, cityData, metaData] = await Promise.all([
        fetch("/mn_border.geojson").then((r) => r.json()),
        fetch("/mn_cities_dec.json").then((r) => r.json()),
        fetch("/basic_cities_with_uni.json").then((r) => r.json())
      ]);

      const metaLookup = Object.fromEntries(
        metaData.cities.map((c) => [c.city.toLowerCase(), c])
      );

      setBorder(borderData);
      setCities(
        cityData.map((c) => ({
          ...c,
          meta: metaLookup[c.n.toLowerCase()] ?? null
        }))
      );
    };
    load();
  }, []);

  if (!border) return null;

  return (
    <MapContainer
      style={{ height: "100vh", width: "100vw", background: "#E7E9EC" }}
    >
      <FitToBorder geojson={border} />

      {/* blackout collar */}
      <Rectangle
        bounds={paddedBounds}
        pathOptions={{ fillOpacity: 0.85, fillColor: "#000", stroke: false }}
        interactive={false}
      />

      {/* MN outline */}
      <GeoJSON
        data={border}
        style={() => ({
          color: "#0057B7",
          weight: 2,
          fillColor: "#F5F5DC",
          fillOpacity: 1
        })}
      />

      {/* city dots */}
      {cities.map((c) => (
        <CircleMarker
          key={c.id}
          center={[c.lat, c.lon]}
          radius={4}
          stroke={false}
          pathOptions={{ color: DOT_COLOR }}
          fillOpacity={0.95}
          eventHandlers={{
            click: () => navigate(`/city/${slugify(c.n)}`)
          }}
        >
          <Tooltip direction="top" offset={[0, -2]} opacity={0.9}>
            <div style={{ textAlign: "center", lineHeight: 1.2 }}>
              <strong>{c.n}</strong>
              {c.meta && (
                <>
                  <br />
                  <small>
                    pop: {c.meta.population_2020.toLocaleString()}
                  </small>
                </>
              )}
              <br />
              <small>score {c.s}</small>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
