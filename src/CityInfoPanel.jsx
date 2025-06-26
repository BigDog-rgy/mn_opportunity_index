import { useEffect, useState } from "react";
import { Link }             from "react-router-dom";

/* small helpers */
const slugify  = str => str.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
const normalize= str => str.toLowerCase().replace(/[^a-z0-9]/g,"");

export default function CityInfoPanel({ city })
{
  /* ───────── local state ───────── */
  const [images, setImages]   = useState([]);   // array from /images
  const [imgIdx, setImgIdx]   = useState(0);    // simple click-to-cycle

  /* ───────── fetch hero images once we have the city ───────── */
  useEffect(()=>{
    if(!city) return;
    fetch(`/api/city/${slugify(city.city)}/images`)
      .then(r=>r.json())
      .then(setImages)
      .catch(()=>setImages([]));
  },[city]);

  if(!city) return <div>Loading…</div>;

  /* ───────── stats (no .meta indirection) ───────── */
  const stats=[
    { icon:"👥", label:"Population", value: city.population_2020?.toLocaleString() || "—" },
    { icon:"💰", label:"Median Income", value: city.median_income ? `$${city.median_income.toLocaleString()}` : "—" },
    { icon:"🧓", label:"Median Age", value: city.median_age ?? "—" },
    { icon:"🏘️", label:"Density / mi²", value: city.density_sq_mi },
    { icon:"🏛️", label:"Incorporated", value: city.incorporated_year },
    {
      icon:"📍", label:"County",
      value: city.county_website ? (
        <a href={city.county_website} target="_blank" rel="noopener noreferrer"
           className="text-decoration-underline text-primary">{city.county}</a>
      ) : city.county
    },
    {
      icon:"🌐", label:"Website",
      value: city.website ? (
        <a href={city.website} target="_blank" rel="noreferrer"
           className="text-decoration-underline text-primary">{city.website}</a>
      ) : "—"
    }
  ];

  /* ───────── business grouping (unchanged) ───────── */
  const biz      = city.businesses || [];
  const grouped  = biz.reduce(
    (acc,b)=>{ (acc[b.employee_category] ||= []).push(b); return acc; },
    { "500+":[], "100-499":[] }
  );

  const heroUrl  = images[imgIdx]?.image_url ?? null;

  return (
    <div className="p-4 bg-white rounded-3 shadow text-center"
         style={{minWidth:320,maxWidth:520,width:"100%",margin:"2.5rem 0 2.5rem 2.5rem"}}>

      <Link to="/" className="text-primary text-decoration-underline d-block mb-4">
        ← Back to map
      </Link>

      <h1 className="display-4 mb-4">{city.city}</h1>

      {heroUrl && (
        <img src={heroUrl} alt={`Skyline of ${city.city}`}
             style={{maxWidth:"100%",borderRadius:"1rem",marginBottom:"1.2rem",
                     boxShadow:"0 2px 8px rgba(0,0,0,0.07)"}}
             onClick={()=> setImgIdx((imgIdx+1)%images.length)} />
      )}

      {/* stats */}
      <div className="mb-4">
        {stats.map(s=>(
          <div key={s.label} className="d-flex align-items-center justify-content-center mb-2">
            <span className="fs-3 me-2">{s.icon}</span>
            <span className="fw-medium me-2">{s.label}:</span>
            <span className="fw-bold">{s.value}</span>
          </div>
        ))}
      </div>

      {/* race */}
      {city.race_breakdown && (
        <div className="mb-4">
          <h2 className="h6 mb-2">Race &amp; Ethnicity</h2>
          <ul className="list-unstyled">
            {Object.entries(city.race_breakdown).map(([race,pct])=>(
              <li key={race}>
                <span className="fw-normal">{race}:</span>{" "}
                <span className="fw-semibold">{pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* universities */}
      {city.universities?.length>0 && (
        <details className="mb-4">
          <summary className="fw-semibold cursor-pointer">
            🎓 Universities ({city.universities.length})
          </summary>
          <ul className="list-unstyled mt-2">
            {city.universities.map((u,i)=>(
              <li key={i} className="mb-1">
                {u.website ? <a href={u.website} target="_blank" rel="noopener noreferrer"
                                className="fw-medium text-primary text-decoration-underline">{u.name}</a>
                            : <span className="fw-medium">{u.name}</span>}
                {typeof u.enrollment==="number" && (
                  <span className="ms-2 text-muted">
                    ({u.enrollment.toLocaleString()} students)
                  </span>
                )}
                {" "}
                {u.tuition!=null ?
                  <span className="ms-2 text-info">tuition:
                    <span className="fw-semibold">${u.tuition.toLocaleString()}</span></span>
                  : <span className="ms-2 text-muted">tuition: n/a</span>}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* businesses */}
      {biz.length>0 && (
        <details className="mb-4">
          <summary className="fw-semibold cursor-pointer">
            🏢 Mid & Large Employers ({biz.length})
          </summary>

          {["500+","100-499"].map(cat=> grouped[cat].length>0 && (
            <div key={cat}>
              <h3 className="h6 mt-3 mb-1">{cat} Employees ({grouped[cat].length})</h3>
              <ul className="list-unstyled">
                {grouped[cat].map((b,i)=>(
                  <li key={`${cat}-${i}`} className="mb-1">
                    {b.website ? <a href={b.website} target="_blank" rel="noopener noreferrer"
                                    className="fw-medium text-primary text-decoration-underline">{b.name}</a>
                                : <span className="fw-medium">{b.name}</span>}
                    <span className="text-muted"> — {b.industry}</span>
                    {b.description && <> ({b.description})</>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </details>
      )}

      {/* overview */}
      {city.overview && (
        <details className="mb-4">
          <summary className="fw-semibold cursor-pointer">📝 Wikipedia Overview</summary>
          <p className="mt-2 small text-center">{city.overview}</p>
        </details>
      )}
    </div>
  );
}
