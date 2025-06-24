import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";

// Helper for slugs
const slugify = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function CityPage() {
  const { slug } = useParams();
  const [city, setCity] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  // Fetch city info
  useEffect(() => {
    fetch("/cities_full.json")
      .then((r) => r.json())
      .then((data) => {
        const match = data.cities.find((c) => slugify(c.city) === slug);
        setCity(match || false);
      });
  }, [slug]);

  // Fetch city image
  useEffect(() => {
    fetch("/city_images.json")
      .then((r) => r.json())
      .then((arr) => {
        if (!city) return;
        const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, "");
        const img = arr.find((rec) => normalize(rec.city) === normalize(city.city));
        setImageUrl(img?.image_url || null);
      });
  }, [city]);

   const [cityNews, setCityNews] = useState([]);

  // --- Add this useEffect after you load city:
  useEffect(() => {
    if (!city) return;
    fetch("/city_news_fixed.json")
      .then((r) => r.json())
      .then((newsData) => {
        // Normalize names to handle things like "Minneapolis †"
        const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, "");
        // Try exact match, then fallback to partials (in case your JSON keys are off by special chars)
        const news = newsData[Object.keys(newsData).find(
          k => normalize(k) === normalize(city.city)
        )] || [];
        setCityNews(news);
      });
  }, [city]);

  // Early returns for loading/error
  if (city === null)
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div>Loading…</div>
      </div>
    );

  if (city === false)
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light">
        <div>City not found.</div>
        <Link to="/" className="mt-4 text-primary text-decoration-underline">
          ← Back to map
        </Link>
      </div>
    );

  // Stats for left panel
  const stats = [
    { icon: "👥", label: "Population", value: city.population_2020?.toLocaleString() || "—" },
    { icon: "💰", label: "Median Income", value: city.median_income ? `$${city.median_income.toLocaleString()}` : "—" },
    { icon: "🧓", label: "Median Age", value: city.median_age ?? "—" },
    { icon: "🏘️", label: "Density / mi²", value: city.density_sq_mi },
    { icon: "🏛️", label: "Incorporated", value: city.incorporated_year },
    { icon: "📍", label: "County", value: city.county_website ? (
  <a
    href={city.county_website}
    target="_blank"
    rel="noopener noreferrer"
    className="text-decoration-underline text-primary"
  >
    {city.county}
  </a>
) : city.county },
    {
      icon: "🌐",
      label: "Website",
      value: city.website ? (
        <a href={city.website} target="_blank" rel="noreferrer" className="text-decoration-underline text-primary">
          {city.website}
        </a>
      ) : "—"
    },
  ];

  const biz = city.businesses || [];
  const grouped = biz.reduce(
    (acc, b) => {
      acc[b.employee_category].push(b);
      return acc;
    },
    { "500+": [], "100-499": [] }
  );

  // 📰 DUMMY news for layout test (replace with your news later!)
  const fakeNews = [
    {
      title: "Red Wing breaks ground on new riverfront park",
      desc: "A $4M revitalization project promises more green space for locals and tourists.",
      url: "https://example.com/news/red-wing-park"
    },
    {
      title: "Major employer announces 200 new jobs",
      desc: "Cargill is expanding operations with a state grant and local incentives.",
      url: "https://example.com/news/cargill"
    },
    {
      title: "Startup scene heats up in Wayzata",
      desc: "Tech founders say Minnesota's lake towns are the new place to launch.",
      url: "https://example.com/news/wayzata-tech"
    }
  ];

  return (
    <div
      className="d-flex min-vh-100 bg-light"
      style={{
        alignItems: "flex-start",
        width: "100vw",
        overflowX: "hidden",
      }}
    >
      {/* LEFT: Info Panel */}
      <div
        className="p-4 bg-white rounded-3 shadow text-center"
        style={{
          minWidth: 320,
          maxWidth: 520,
          width: "100%",
          margin: "2.5rem 0 2.5rem 2.5rem",
        }}
      >
        <Link to="/" className="text-primary text-decoration-underline d-block mb-4">
          ← Back to map
        </Link>

        {imageUrl && (
          <img
            src={imageUrl}
            alt={`Skyline of ${city.city}`}
            style={{
              maxWidth: "100%",
              borderRadius: "1rem",
              marginBottom: "1.2rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)"
            }}
          />
        )}

        <h1 className="display-4 mb-4">{city.city}</h1>

        <div className="mb-4">
          {stats.map((s) => (
            <div key={s.label} className="d-flex align-items-center justify-content-center mb-2">
              <span className="fs-3 me-2">{s.icon}</span>
              <span className="fw-medium me-2">{s.label}:</span>
              <span className="fw-bold">{s.value}</span>
            </div>
          ))}
        </div>

        {city.race_breakdown && (
          <div className="mb-4">
            <h2 className="h6 mb-2">Race &amp; Ethnicity</h2>
            <ul className="list-unstyled">
              {Object.entries(city.race_breakdown).map(([race, pct]) => (
                <li key={race}>
                  <span className="fw-normal">{race}:</span>{" "}
                  <span className="fw-semibold">{pct}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Universities */}
        {city.universities?.length > 0 && (
          <details className="mb-4">
            <summary className="fw-semibold cursor-pointer">
              🎓 Universities ({city.universities.length})
            </summary>
            <ul className="list-unstyled mt-2">
              {city.universities.map((u, i) => (
                <li key={i} className="mb-1">
                  {u.website ? (
                    <a
                      href={u.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fw-medium text-primary text-decoration-underline"
                    >
                      {u.name}
                    </a>
                  ) : (
                    <span className="fw-medium">{u.name}</span>
                  )}
                  {typeof u.enrollment === "number" && (
                    <span className="ms-2 text-muted">
                      ({u.enrollment.toLocaleString()} students)
                    </span>
                  )}
                  {" "}
                  {u.tuition !== undefined && u.tuition !== null ? (
                    <span className="ms-2 text-info">
                      tuition: <span className="fw-semibold">${u.tuition.toLocaleString()}</span>
                    </span>
                  ) : (
                    <span className="ms-2 text-muted">tuition: n/a</span>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}

        {/* Businesses */}
        {biz.length > 0 && (
          <details className="mb-4">
            <summary className="fw-semibold cursor-pointer">
              🏢 Mid & Large Employers ({biz.length})
            </summary>
            {grouped["500+"].length > 0 && (
              <>
                <h3 className="h6 mt-3 mb-1">500+ Employees ({grouped["500+"].length})</h3>
                <ul className="list-unstyled">
                  {grouped["500+"].map((b, i) => (
                    <li key={`big-${i}`} className="mb-1">
                      {b.website ? (
                        <a
                          href={b.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="fw-medium text-primary text-decoration-underline"
                        >
                          {b.name}
                        </a>
                      ) : (
                        <span className="fw-medium">{b.name}</span>
                      )}
                      <span className="text-muted"> — {b.industry}</span>
                      {b.description && <> ({b.description})</>}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {grouped["100-499"].length > 0 && (
              <>
                <h3 className="h6 mt-3 mb-1">100-499 Employees ({grouped["100-499"].length})</h3>
                <ul className="list-unstyled">
                  {grouped["100-499"].map((b, i) => (
                    <li key={`mid-${i}`} className="mb-1">
                      {b.website ? (
                        <a
                          href={b.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="fw-medium text-primary text-decoration-underline"
                        >
                          {b.name}
                        </a>
                      ) : (
                        <span className="fw-medium">{b.name}</span>
                      )}
                      <span className="text-muted"> — {b.industry}</span>
                      {b.description && <> ({b.description})</>}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </details>
        )}

        {/* Long wiki overview */}
        {city.overview && (
          <details className="mb-4">
            <summary className="fw-semibold cursor-pointer">
              📝 Wikipedia Overview
            </summary>
            <p className="mt-2 small text-center">{city.overview}</p>
          </details>
        )}
      </div>

      {/* RIGHT: News Panel (fills all available space) */}
      <div
        className="flex-grow-1"
        style={{
          margin: "2.5rem 2.5rem 2.5rem 1.5rem",
          minWidth: 0,
          overflowY: "auto",
          background: "#fff",
          borderRadius: "1.5rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          padding: "2.5rem 2rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2 className="mb-4 text-primary">Local News</h2>
        {cityNews.length > 0 ? (
          cityNews.map((story, i) => (
            <a
              key={i}
              href={
                story.link.startsWith("http")
                  ? story.link
                  : `https://www.fox9.com${story.link.replace(/^\//, "")}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="mb-4 d-block text-decoration-none"
              style={{
                borderBottom: "1px solid #eee",
                paddingBottom: "1.1rem"
              }}
            >
              <div className="fw-bold fs-5 mb-1">{story.title}</div>
              <div className="text-muted small">{story.description}</div>
            </a>
          ))
        ) : (
          <div className="text-muted">No recent news found for this city.</div>
        )}
      </div>
    </div>
  );
}
