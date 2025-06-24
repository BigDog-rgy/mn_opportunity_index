import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import CityInfoPanel from "./CityInfoPanel";

// Helper for slugs
const slugify = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function CompareCities() {
  const { city1, city2 } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all city data ONCE
  useEffect(() => {
    fetch("/cities_full.json")
      .then((r) => r.json())
      .then((data) => {
        setData(data.cities);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ margin: 60 }}>Loading…</div>;
  }

  const c1 = data.find((c) => slugify(c.city) === city1);
  const c2 = data.find((c) => slugify(c.city) === city2);

  if (!c1 || !c2) {
    return (
      <div style={{ margin: 80 }}>
        Couldn’t find one of these cities. <br />
        <Link to="/" style={{ textDecoration: "underline" }}>Back to map</Link>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f8fafb",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: "36px",
        padding: "54px 0 0 0",
      }}
    >
      <div style={{ position: "absolute", left: 28, top: 22 }}>
        <Link to="/" style={{ color: "#0070f3", textDecoration: "underline" }}>
          ← Back to map
        </Link>
      </div>
      <CityInfoPanel city={c1} />
      <div style={{ fontSize: 44, color: "#bbb", alignSelf: "center" }}>VS</div>
      <CityInfoPanel city={c2} />
    </div>
  );
}
