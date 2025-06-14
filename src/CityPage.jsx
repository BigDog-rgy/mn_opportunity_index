import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";

const slugify = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function CityPage() {
  const { slug } = useParams();
  const [city, setCity] = useState(null);

  useEffect(() => {
    fetch("/cities_with_demo.json")
      .then((r) => r.json())
      .then((data) => {
        const match = data.cities.find((c) => slugify(c.city) === slug);
        setCity(match || false);
      });
  }, [slug]);

  if (city === null)
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div>Loading…</div>
      </div>
    );

  if (city === false)
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100">
        <div>City not found.</div>
        <Link to="/" className="mt-4 text-primary text-decoration-underline">
          ← Back to map
        </Link>
      </div>
    );

  const stats = [
    { icon: "👥", label: "Population", value: city.population_2020?.toLocaleString() || "—" },
    { icon: "💰", label: "Median Income", value: city.median_income ? `$${city.median_income.toLocaleString()}` : "—" },
    { icon: "🧓", label: "Median Age", value: city.median_age ?? "—" },
    { icon: "🏘️", label: "Density / mi²", value: city.density_sq_mi },
    { icon: "🏛️", label: "Incorporated", value: city.incorporated_year },
    { icon: "📍", label: "County", value: city.county },
    { icon: "🌐", label: "Website", value: city.website ? (
      <a href={city.website} target="_blank" rel="noreferrer" className="text-decoration-underline text-primary">
        {city.website}
      </a>
    ) : "—" },
  ];

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className="container-sm p-4 bg-white rounded-3 shadow text-center">
        <Link to="/" className="text-primary text-decoration-underline d-block mb-4">
          ← Back to map
        </Link>
        <h1 className="display-4 mb-4">{city.city}</h1>
        <div className="mb-4">
          {stats.map((stat) => (
            <div key={stat.label} className="d-flex align-items-center justify-content-center mb-2">
              <span className="fs-3 me-2">{stat.icon}</span>
              <span className="fw-medium me-2">{stat.label}:</span>
              <span className="fw-bold">{stat.value}</span>
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

        {city.universities?.length > 0 && (
          <details className="mb-4">
            <summary className="fw-semibold cursor-pointer">
              🎓 Universities ({city.universities.length})
            </summary>
            <ul className="list-unstyled mt-2">
              {city.universities.map((u, i) => (
                <li key={i}>
                  <span className="fw-medium">{u.name}</span>{" "}
                  <span className="text-muted">({u.enrollment.toLocaleString()} students)</span>
                </li>
              ))}
            </ul>
          </details>
        )}

        {city.overview && (
          <details className="mb-4">
            <summary className="fw-semibold cursor-pointer">
              📝 Wikipedia Overview
            </summary>
            <p className="mt-2 small text-center">{city.overview}</p>
          </details>
        )}
      </div>
    </div>
  );
}
