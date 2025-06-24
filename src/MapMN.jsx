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

const slugify = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const DOT_COLOR = "#d91e18";
const mnBounds = [
  [43.499356, -97.239209],
  [49.384358, -89.489539]
];
const pad = 0.1;
const paddedBounds = [
  [mnBounds[0][0] - pad, mnBounds[0][1] - pad],
  [mnBounds[1][0] + pad, mnBounds[1][1] + pad]
];

function FitToBorder({ geojson }) {
  const map = useMap();
  useEffect(() => {
    const layer = L.geoJSON(geojson);
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    map.setZoom(map.getZoom() - 1);
    map.setMinZoom(map.getZoom());
    setTimeout(() => map.invalidateSize(), 100);
  }, [map, geojson]);
  return null;
}

const safeJSON = (r, url) =>
  r.ok ? r.json() : Promise.reject(new Error(`Fetch failed → ${url}`));

// Helper: check if city has at least one uni
const hasUniversities = (city) =>
  Array.isArray(city.meta?.universities) && city.meta.universities.length > 0;
// Helper: check if city has at least one 500+ or 100-499 employer
const hasEmployers = (city, group) => {
  const biz = city.meta?.businesses;
  if (!biz) return false;
  if (group === "500") return Array.isArray(biz["500+"]) && biz["500+"].length > 0;
  if (group === "100") return Array.isArray(biz["100-499"]) && biz["100-499"].length > 0;
  return false;
};

export default function MapMN() {
  const [showCompare, setShowCompare] = useState(false);
  const [city1, setCity1] = useState("");
  const [city2, setCity2] = useState("");
  const [border, setBorder] = useState(null);
  const [cities, setCities] = useState([]);
  const [view, setView] = useState("map"); // 'map' or 'list'
  const [sort, setSort] = useState({ field: "population", dir: "desc" });
  const [filters, setFilters] = useState({
    popMin: "",
    popMax: "",
    incomeMin: "",
    incomeMax: "",
    ageMin: "",
    ageMax: "",
    universities: "any", // any | yes | no
    employer: "any", // any | 500 | 100
  });
  const [search, setSearch] = useState(""); // For filtering by name
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const [borderData, cityPos, meta] = await Promise.all([
          fetch("/mn_border.geojson").then((r) => safeJSON(r, "mn_border")),
          fetch("/mn_cities_dec.json").then((r) => safeJSON(r, "city_coords")),
          fetch("/cities_with_businesses.json").then((r) =>
            safeJSON(r, "cities_with_businesses")
          ),
        ]);

        const metaLookup = Object.fromEntries(
          meta.cities.map((c) => [c.city.toLowerCase(), c])
        );

        // Create unique keys from lat/lon
        const dedup = {};
        const enriched = cityPos.map((c, idx) => {
          const key = `${c.lat},${c.lon}`;
          dedup[key] = (dedup[key] || 0) + 1;
          return {
            ...c,
            id: key + (dedup[key] > 1 ? `-${dedup[key]}` : ""),
            meta: metaLookup[c.n.toLowerCase()] ?? null,
          };
        });

        setBorder(borderData);
        setCities(enriched);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  if (!border) return null;

  // ----------------- FILTERING AND SORTING LOGIC --------------------
  let filtered = cities.filter((c) => c.meta?.population_2020);

  if (filters.popMin)
    filtered = filtered.filter((c) => c.meta.population_2020 >= Number(filters.popMin));
  if (filters.popMax)
    filtered = filtered.filter((c) => c.meta.population_2020 <= Number(filters.popMax));
  if (filters.incomeMin)
    filtered = filtered.filter((c) => c.meta.median_income >= Number(filters.incomeMin));
  if (filters.incomeMax)
    filtered = filtered.filter((c) => c.meta.median_income <= Number(filters.incomeMax));
  if (filters.ageMin)
    filtered = filtered.filter((c) => c.meta.median_age >= Number(filters.ageMin));
  if (filters.ageMax)
    filtered = filtered.filter((c) => c.meta.median_age <= Number(filters.ageMax));
  if (filters.universities === "yes")
    filtered = filtered.filter(hasUniversities);
  if (filters.universities === "no")
    filtered = filtered.filter((c) => !hasUniversities(c));
  if (filters.employer === "500")
    filtered = filtered.filter((c) => hasEmployers(c, "500"));
  if (filters.employer === "100")
    filtered = filtered.filter((c) => hasEmployers(c, "100"));
  if (search)
    filtered = filtered.filter((c) =>
      c.n.toLowerCase().includes(search.toLowerCase())
    );

  // Sorting
  const sorters = {
    population: (a, b) =>
      (a.meta.population_2020 || 0) - (b.meta.population_2020 || 0),
    alpha: (a, b) => a.n.localeCompare(b.n),
    income: (a, b) => (a.meta.median_income || 0) - (b.meta.median_income || 0),
    age: (a, b) => (a.meta.median_age || 0) - (b.meta.median_age || 0),
  };
  filtered.sort(sorters[sort.field]);
  if (sort.dir === "desc") filtered.reverse();

  // ----------------- UI: SORT/FILTER CONTROLS --------------------
  function updateFilter(name, value) {
    setFilters((f) => ({ ...f, [name]: value }));
  }
  function resetFilters() {
    setFilters({
      popMin: "",
      popMax: "",
      incomeMin: "",
      incomeMax: "",
      ageMin: "",
      ageMax: "",
      universities: "any",
      employer: "any",
    });
    setSearch("");
    setSort({ field: "population", dir: "desc" });
  }

  const controlBoxStyle = {
    maxWidth: 850,
    margin: "0 auto 2rem auto",
    padding: "1rem 1rem 0.3rem 1rem",
    background: "#f6f6fb",
    borderRadius: 10,
    boxShadow: "0 3px 16px rgba(60,60,60,0.07)",
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    alignItems: "center",
    zIndex: 1200,
    position: "relative"
  };

  const labelStyle = { fontWeight: 500, fontSize: "1rem", marginRight: 4, whiteSpace: "nowrap" };
  const inputStyle = { width: 72, marginRight: 8, borderRadius: 4, border: "1px solid #ddd", padding: "0.2em 0.5em" };

  // Button for toggling view
  const topRightBtnStyle = {
    position: "absolute",
    top: 20,
    right: 30,
    zIndex: 2000,
    background: "#fff",
    border: "1px solid #ccc",
    padding: "0.5em 1.3em",
    borderRadius: 6,
    fontWeight: 500,
    cursor: "pointer",
    boxShadow: "0 2px 12px 0 rgba(60,60,60,0.04)",
    fontSize: "1rem"
  };

  // ----------------- RENDER --------------------
  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw", background: "#E7E9EC" }}>
      <button
        style={topRightBtnStyle}
        onClick={() => setView(view === "map" ? "list" : "map")}
      >
        {view === "map" ? "List View" : "Map View"}
      </button>

      {/* FILTER/SORT CONTROLS - show on both views */}
      <div style={controlBoxStyle}>
        {/* Search by name */}
        <input
          type="text"
          value={search}
          placeholder="Search city name"
          style={{ ...inputStyle, width: 130 }}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Sort by dropdown */}
        <label style={labelStyle}>Sort by:</label>
        <select
          value={sort.field}
          style={inputStyle}
          onChange={(e) => setSort((s) => ({ ...s, field: e.target.value }))}
        >
          <option value="population">Population</option>
          <option value="alpha">A–Z</option>
          <option value="income">Median Income</option>
          <option value="age">Median Age</option>
        </select>
        <select
          value={sort.dir}
          style={inputStyle}
          onChange={(e) => setSort((s) => ({ ...s, dir: e.target.value }))}
        >
          <option value="desc">⬇ Desc</option>
          <option value="asc">⬆ Asc</option>
        </select>

        {/* Population min/max */}
        <label style={labelStyle}>Pop.</label>
        <input
          type="number"
          placeholder="Min"
          value={filters.popMin}
          style={inputStyle}
          min={0}
          onChange={(e) => updateFilter("popMin", e.target.value)}
        />
        <input
          type="number"
          placeholder="Max"
          value={filters.popMax}
          style={inputStyle}
          min={0}
          onChange={(e) => updateFilter("popMax", e.target.value)}
        />

        {/* Median Income min/max */}
        <label style={labelStyle}>Income</label>
        <input
          type="number"
          placeholder="Min"
          value={filters.incomeMin}
          style={inputStyle}
          min={0}
          onChange={(e) => updateFilter("incomeMin", e.target.value)}
        />
        <input
          type="number"
          placeholder="Max"
          value={filters.incomeMax}
          style={inputStyle}
          min={0}
          onChange={(e) => updateFilter("incomeMax", e.target.value)}
        />

        {/* Age min/max */}
        <label style={labelStyle}>Age</label>
        <input
          type="number"
          placeholder="Min"
          value={filters.ageMin}
          style={inputStyle}
          min={0}
          onChange={(e) => updateFilter("ageMin", e.target.value)}
        />
        <input
          type="number"
          placeholder="Max"
          value={filters.ageMax}
          style={inputStyle}
          min={0}
          onChange={(e) => updateFilter("ageMax", e.target.value)}
        />

        {/* Universities dropdown */}
        <label style={labelStyle}>Universities</label>
        <select
          value={filters.universities}
          style={inputStyle}
          onChange={(e) => updateFilter("universities", e.target.value)}
        >
          <option value="any">Any</option>
          <option value="yes">Has Uni</option>
          <option value="no">No Uni</option>
        </select>

        {/* Compare Cities Button */}
        <button
          style={{
            fontWeight: 600,
            background: showCompare ? "#d0e4fd" : "#fff",
            border: "1px solid #888",
            borderRadius: 4,
            padding: "0.2em 0.6em",
            marginLeft: 16,
            cursor: "pointer"
          }}
          onClick={() => setShowCompare(!showCompare)}
        >
          {showCompare ? "Hide Compare" : "Compare Cities"}
        </button>

        {/* Compare Picker */}
        {showCompare && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#fff",
            padding: "8px 14px",
            borderRadius: 7,
            boxShadow: "0 1px 6px rgba(30,50,80,0.09)",
            marginLeft: 16
          }}>
            <label style={{ marginRight: 6 }}>City 1:</label>
            <select value={city1} onChange={e => setCity1(e.target.value)}>
              <option value="">Select...</option>
              {filtered.map((c) => (
                <option key={c.id} value={c.n}>{c.n}</option>
              ))}
            </select>
            <label style={{ marginRight: 6 }}>City 2:</label>
            <select value={city2} onChange={e => setCity2(e.target.value)}>
              <option value="">Select...</option>
              {filtered
                .filter(c => c.n !== city1)
                .map((c) => (
                  <option key={c.id} value={c.n}>{c.n}</option>
                ))}
            </select>
            <button
              style={{
                fontWeight: 700,
                background: "#0057b7",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "0.2em 0.8em",
                marginLeft: 10,
                cursor: city1 && city2 ? "pointer" : "not-allowed",
                opacity: city1 && city2 ? 1 : 0.6,
              }}
              disabled={!city1 || !city2}
              onClick={() => {
                // Navigate to compare route (slugify both)
                navigate(`/compare/${slugify(city1)}/${slugify(city2)}`);
                setShowCompare(false);
                setCity1("");
                setCity2("");
              }}
            >
              Compare
            </button>
          </div>
        )}

        {/* Reset button */}
        <button
          style={{
            ...inputStyle,
            fontWeight: 600,
            background: "#fff",
            border: "1px solid #888",
            marginLeft: 12,
            cursor: "pointer",
          }}
          onClick={resetFilters}
        >
          Reset
        </button>
      </div>

      {/* MAP OR LIST VIEW */}
      {view === "map" ? (
        <MapContainer
          style={{
            height: "100vh",
            width: "100vw",
            background: "#E7E9EC",
            position: "absolute",
            inset: 0,
            zIndex: 0,
          }}
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
              fillOpacity: 1,
            })}
          />
          {filtered.map((c) => (
            <CircleMarker
              key={c.id}
              center={[c.lat, c.lon]}
              radius={4}
              stroke={false}
              pathOptions={{ color: DOT_COLOR }}
              fillOpacity={0.95}
              eventHandlers={{
                click: () => navigate(`/city/${slugify(c.n)}`),
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
      ) : (
        <div
          style={{
            height: "100vh",
            width: "100vw",
            overflowY: "auto",
            background: "#fff",
            padding: "6.3rem 0 0 0", // to clear filter bar and button
          }}
        >
          <h3 className="mb-3 text-center" style={{ marginTop: 0 }}>Minnesota Cities</h3>
          <div className="list-group list-group-flush" style={{ maxWidth: 540, margin: "0 auto" }}>
            {filtered.map((c, i) => (
              <button
                key={c.id}
                className="list-group-item list-group-item-action border-0 px-2 py-2"
                onClick={() => navigate(`/city/${slugify(c.n)}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-medium">{i + 1}. {c.n}</div>
                    <small className="text-muted">Score: {c.s}</small>
                  </div>
                  <div className="text-end">
                    <div className="fw-semibold text-primary">
                      {c.meta.population_2020.toLocaleString()}
                    </div>
                    <small className="text-muted">population</small>
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-center text-muted py-5">No cities match these filters.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
