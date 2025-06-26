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

// ----------------- HELPERS --------------------
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

// ----------------- CHECKERS --------------------
const hasUniversities = (c) =>
  Array.isArray(c?.universities) && c.universities.length > 0;

const hasEmployers = (c, group) => {
  const biz = c?.businesses;
  if (!biz) return false;
  if (group === "500") return Array.isArray(biz["500+"]) && biz["500+"].length > 0;
  if (group === "100") return Array.isArray(biz["100-499"]) && biz["100-499"].length > 0;
  return false;
};

export default function MapMN() {
  // Compare picker state
  const [showCompare, setShowCompare] = useState(false);
  const [city1, setCity1] = useState("");
  const [city2, setCity2] = useState("");

  // Data state
  const [border, setBorder] = useState(null);
  const [cities, setCities]   = useState([]);

  // UI state
  const [view, setView]   = useState("map"); // 'map' | 'list'
  const [sort, setSort]   = useState({ field: "population", dir: "desc" });
  const [filters, setFilters] = useState({
    popMin: "", popMax: "", incomeMin: "", incomeMax: "",
    ageMin: "", ageMax: "", universities: "any", employer: "any"
  });
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  // ----------------- FETCH DATA --------------------
  useEffect(() => {
    (async () => {
      try {
        const [borderData, cityPos, apiCities] = await Promise.all([
          fetch("/mn_border.geojson").then((r) => safeJSON(r, "mn_border")),
          fetch("/mn_cities_dec.json").then((r) => safeJSON(r, "city_coords")),
          fetch("/api/cities").then((r) => safeJSON(r, "api_cities"))
        ]);

        const metaLookup = Object.fromEntries(
          apiCities.map((c) => [c.name.toLowerCase(), c])
        );

        // Deduplicate lat/lon keys and merge meta
        const dedup = {};
        const enriched = cityPos.map((c) => {
          const key = `${c.lat},${c.lon}`;
          dedup[key] = (dedup[key] || 0) + 1;
          return {
            ...c,
            id: key + (dedup[key] > 1 ? `-${dedup[key]}` : ""),
            meta: metaLookup[c.n.toLowerCase()] ?? {} // fallback empty obj
          };
        });

        setBorder(borderData);
        setCities(enriched);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  if (!border) return null; // still loading

  // ----------------- FILTER --------------------
  let filtered = cities.filter((c) => c.meta?.population_2020);

  const applyNumeric = (key, cmp) => {
    if (!filters[key]) return;
    const val = Number(filters[key]);
    filtered = filtered.filter((c) => cmp(c.meta, val));
  };

  applyNumeric("popMin", (m, v) => m.population_2020 >= v);
  applyNumeric("popMax", (m, v) => m.population_2020 <= v);
  applyNumeric("incomeMin", (m, v) => m.median_income >= v);
  applyNumeric("incomeMax", (m, v) => m.median_income <= v);
  applyNumeric("ageMin", (m, v) => m.median_age >= v);
  applyNumeric("ageMax", (m, v) => m.median_age <= v);

  if (filters.universities === "yes")  filtered = filtered.filter(hasUniversities);
  if (filters.universities === "no")   filtered = filtered.filter((c) => !hasUniversities(c));
  if (filters.employer === "500")      filtered = filtered.filter((c) => hasEmployers(c, "500"));
  if (filters.employer === "100")      filtered = filtered.filter((c) => hasEmployers(c, "100"));
  if (search) filtered = filtered.filter((c) => c.n.toLowerCase().includes(search.toLowerCase()));

  // ----------------- SORT --------------------
  const sorters = {
    population: (a, b) => (a.meta.population_2020 || 0) - (b.meta.population_2020 || 0),
    alpha:      (a, b) => a.n.localeCompare(b.n),
    income:     (a, b) => (a.meta.median_income || 0) - (b.meta.median_income || 0),
    age:        (a, b) => (a.meta.median_age || 0)   - (b.meta.median_age   || 0)
  };
  filtered.sort(sorters[sort.field]);
  if (sort.dir === "desc") filtered.reverse();

  // ----------------- HANDLERS --------------------
  const updateFilter = (name, value) => setFilters((f) => ({ ...f, [name]: value }));
  const resetFilters  = () => {
    setFilters({ popMin:"",popMax:"",incomeMin:"",incomeMax:"",ageMin:"",ageMax:"",universities:"any",employer:"any" });
    setSearch("");
    setSort({ field:"population", dir:"desc" });
  };

  // ----------------- INLINE STYLES --------------------
  const controlBoxStyle = { maxWidth:850, margin:"0 auto 2rem", padding:"1rem 1rem 0.3rem", background:"#f6f6fb", borderRadius:10, boxShadow:"0 3px 16px rgba(60,60,60,0.07)", display:"flex", flexWrap:"wrap", gap:16, alignItems:"center", zIndex:1200, position:"relative" };
  const labelStyle   = { fontWeight:500, fontSize:"1rem", marginRight:4, whiteSpace:"nowrap" };
  const inputStyle   = { width:72, marginRight:8, borderRadius:4, border:"1px solid #ddd", padding:"0.2em 0.5em" };
  const topRightBtnStyle = { position:"absolute", top:20, right:30, zIndex:2000, background:"#fff", border:"1px solid #ccc", padding:"0.5em 1.3em", borderRadius:6, fontWeight:500, cursor:"pointer", boxShadow:"0 2px 12px 0 rgba(60,60,60,0.04)", fontSize:"1rem" };

  // ----------------- RENDER --------------------
  return (
    <div style={{ position:"relative", height:"100vh", width:"100vw", background:"#E7E9EC" }}>
      <button style={topRightBtnStyle} onClick={() => setView(view === "map" ? "list" : "map")}>{view === "map" ? "List View" : "Map View"}</button>

      {/* FILTER BAR */}
      <div style={controlBoxStyle}>
        <input type="text" value={search} placeholder="Search city name" style={{ ...inputStyle, width:130 }} onChange={(e) => setSearch(e.target.value)} />
        <label style={labelStyle}>Sort by:</label>
        ... {/* *keep rest of existing UI unchanged* */}
      </div>

      {/* MAP OR LIST VIEW */}
      {view === "map" ? (
        <MapContainer style={{ height:"100vh", width:"100vw", background:"#E7E9EC", position:"absolute", inset:0, zIndex:0 }}>
          <FitToBorder geojson={border} />
          <Rectangle bounds={paddedBounds} pathOptions={{ fillOpacity:0.85, fillColor:"#000", stroke:false }} interactive={false} />
          <GeoJSON data={border} style={() => ({ color:"#0057B7", weight:2, fillColor:"#F5F5DC", fillOpacity:1 })} />
          {filtered.map((c) => (
            <CircleMarker key={c.id} center={[c.lat, c.lon]} radius={4} stroke={false} pathOptions={{ color:DOT_COLOR }} fillOpacity={0.95} eventHandlers={{ click: () => navigate(`/city/${slugify(c.n)}`) }}>
              <Tooltip direction="top" offset={[0,-2]} opacity={0.9}>
                <div style={{ textAlign:"center", lineHeight:1.2 }}>
                  <strong>{c.n}</strong>
                  {c.meta && (
                    <>
                      <br />
                      <small>pop: {c.meta.population_2020.toLocaleString()}</small>
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
        /* LIST VIEW (unchanged) */
        <div style={{ height:"100vh", width:"100vw", overflowY:"auto", background:"#fff", padding:"6.3rem 0 0" }}>
          ...
        </div>
      )}
    </div>
  );
}
