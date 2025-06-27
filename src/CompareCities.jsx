import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import CityInfoPanel from "./CityInfoPanel";

export default function CompareCities() {
  /* slugs come straight from the URL: /compare/:slug1/:slug2 */
  const { slug1, slug2 } = useParams();

  const [c1, setC1]   = useState(null);   // null = loading, false = 404
  const [c2, setC2]   = useState(null);

  /* ───────── fetch both cities in parallel ───────── */
  useEffect(() => {
    setC1(null); setC2(null);                         // show loading

    Promise.all([
      fetch(`/api/city/${slug1}`).then(r=>r.ok?r.json():false),
      fetch(`/api/city/${slug2}`).then(r=>r.ok?r.json():false)
    ]).then(([cityA, cityB]) => {
      setC1(cityA); setC2(cityB);
    });
  }, [slug1, slug2]);

  /* ───────── loading state ───────── */
  if (c1 === null || c2 === null) {
    return <div style={{ margin: 60 }}>Loading…</div>;
  }

  /* ───────── any slug not found ───────── */
  if (!c1 || !c2) {
    return (
      <div style={{ margin: 80 }}>
        Couldn’t find one of these cities.<br/>
        <Link to="/" style={{ textDecoration:"underline" }}>Back to map</Link>
      </div>
    );
  }

  /* ───────── render side-by-side compare ───────── */
  return (
  <div
    className="mobile-stack"
    style={{
      display: "flex",
      minHeight: "100vh",
      background: "#f8fafb",
      alignItems: "flex-start",
      justifyContent: "center",
      gap: "36px",
      padding: "54px 0 0 0"
    }}
  >
    <div
      className="mobile-hide"
      style={{ position: "absolute", left: 28, top: 22 }}
    >
      <Link to="/" style={{ color: "#0070f3", textDecoration: "underline" }}>
        ← Back to map
      </Link>
    </div>

    <CityInfoPanel city={c1} />
    <div className="mobile-vs" style={{ fontSize: 44, color: "#bbb", alignSelf: "center" }}>
      VS
    </div>
    <CityInfoPanel city={c2} />
  </div>
);
}
