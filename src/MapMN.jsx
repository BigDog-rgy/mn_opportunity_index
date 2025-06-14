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

/* --- config --------------------------------------------------------------- */
const scoreColor = (s) => `hsl(${120 - s}, 90%, 45%)`;

/* Minnesota extreme corners */
const mnBounds = [
  [43.499356, -97.239209], // SW
  [49.384358, -89.489539] // NE
];

const pad = 0.1;
const paddedBounds = [
  [mnBounds[0][0] - pad, mnBounds[0][1] - pad],
  [mnBounds[1][0] + pad, mnBounds[1][1] + pad]
];

/* --- helper: fit & lock zoom once ---------------------------------------- */
function FitToBorder({ geojson }) {
  const map = useMap();
  useEffect(() => {
    const layer = L.geoJSON(geojson);
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });

    // zoom out one step for breathing room
    map.setZoom(map.getZoom() - 1);

    // lock further zoom‑out
    map.setMinZoom(map.getZoom());
  }, [map, geojson]);
  return null;
}

/* --- Modal --------------------------------------------------------------- */
function CityModal({ city, onClose }) {
  if (!city) return null;
  const m = city.meta;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[92vw] max-w-lg relative overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-xl font-bold hover:text-red-600"
        >
          ×
        </button>
        <h2 className="text-2xl font-semibold mb-3 text-center">
          {city.n}
        </h2>
        {m ? (
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Population (2020):</span>{" "}
              {m.population_2020?.toLocaleString?.()}
            </p>
            <p>
              <span className="font-medium">County:</span> {m.county}
            </p>
            <p>
              <span className="font-medium">Incorporated:</span> {m.incorporated_year}
            </p>
            <p>
              <span className="font-medium">Density /mi²:</span> {m.density_sq_mi}
            </p>
            <p>
              <span className="font-medium">Website:</span>{" "}
              <a href={m.website} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                {m.website}
              </a>
            </p>
            <p>
              <span className="font-medium">FIPS:</span> {m.fips_code}
            </p>
            <p>
              <span className="font-medium">GNIS ID:</span> {m.gnis_id}
            </p>
            {m.overview && (
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">Overview</summary>
                <p className="mt-1 whitespace-pre-line text-justify">{m.overview}</p>
              </details>
            )}
            {m.universities?.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">Universities ({m.universities.length})</summary>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {m.universities.map((u, i) => (
                    <li key={i}>{`${u.name} – ${u.enrollment.toLocaleString?.()}`}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ) : (
          <p>No extra metadata found.</p>
        )}
      </div>
    </div>
  );
}

/* --- main component ------------------------------------------------------- */
export default function MapMN() {
  const [border, setBorder] = useState(null);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);

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

      const merged = cityData.map((c) => ({
        ...c,
        meta: metaLookup[c.n.toLowerCase()] ?? null
      }));

      setBorder(borderData);
      setCities(merged);
    };
    load();
  }, []);

  if (!border) return null;

  return (
    <>
      <MapContainer
        style={{ height: "100vh", width: "100vw", background: "#E7E9EC" }}
      >
        <FitToBorder geojson={border} />

        <Rectangle
          bounds={paddedBounds}
          pathOptions={{ fillOpacity: 0.85, fillColor: "#000", stroke: false }}
          interactive={false}
        />

        <GeoJSON
          data={border}
          style={() => ({
            color: "#0057B7",
            weight: 2,
            fillColor: "#F5F5DC",
            fillOpacity: 1
          })}
        />

        {cities.map((c) => (
          <CircleMarker
            key={c.id}
            center={[c.lat, c.lon]}
            radius={4}
            stroke={false}
            pathOptions={{ color: scoreColor(c.s) }}
            fillOpacity={0.95}
            eventHandlers={{ click: () => setSelectedCity(c) }}
          >
            <Tooltip direction="top" offset={[0, -2]} opacity={0.9} permanent={false}>
              <div style={{ textAlign: "center", lineHeight: 1.2 }}>
                <strong>{c.n}</strong>
                {c.meta && (
                  <>
                    <br />
                    <small>pop: {c.meta.population_2020?.toLocaleString?.()}</small>
                  </>
                )}
                <br />
                <small>score {c.s}</small>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      <CityModal city={selectedCity} onClose={() => setSelectedCity(null)} />
    </>
  );
}
