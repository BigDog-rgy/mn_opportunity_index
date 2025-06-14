import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";

const slugify = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function CityPage() {
  const { slug } = useParams();
  const [city, setCity] = useState(null); // null = loading, false = not found

  useEffect(() => {
    fetch("/basic_cities_with_uni.json")
      .then((r) => r.json())
      .then((data) => {
        const match = data.cities.find((c) => slugify(c.city) === slug);
        setCity(match || false);
      });
  }, [slug]);

  if (city === null) return <p className="p-6">Loading…</p>;

  if (city === false)
    return (
      <div className="p-6 text-center space-y-3">
        <p>City not found.</p>
        <Link to="/" className="underline text-blue-600">
          ← Back to map
        </Link>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <Link to="/" className="underline text-blue-600">
        ← Back to map
      </Link>

      <h1 className="text-3xl font-bold">{city.city}</h1>

      <p>
        <b>Population (2020):</b> {city.population_2020.toLocaleString()}
      </p>
      <p>
        <b>County:</b> {city.county}
      </p>
      <p>
        <b>Incorporated:</b> {city.incorporated_year}
      </p>
      <p>
        <b>Density / mi²:</b> {city.density_sq_mi}
      </p>
      <p>
        <b>Website:</b>{" "}
        <a
          className="text-blue-600 underline"
          href={city.website}
          target="_blank"
          rel="noreferrer"
        >
          {city.website}
        </a>
      </p>

      {city.overview && (
        <details>
          <summary className="font-medium cursor-pointer">
            Wikipedia Overview
          </summary>
          <p className="mt-2 whitespace-pre-line text-justify">
            {city.overview}
          </p>
        </details>
      )}

      {city.universities?.length > 0 && (
        <details>
          <summary className="font-medium cursor-pointer">
            Universities ({city.universities.length})
          </summary>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {city.universities.map((u, i) => (
              <li key={i}>
                {u.name} — {u.enrollment.toLocaleString()}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
