import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";

const slugify = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function CityPage() {
  const { slug } = useParams();
  const [city, setCity] = useState(null); // null = loading, false = not found

  useEffect(() => {
    fetch("/cities_with_demo.json")
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

  const InfoRow = ({ label, value }) => (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link to="/" className="underline text-blue-600">
        ← Back to map
      </Link>

      {/* header card */}
      <div className="bg-white shadow-xl rounded-2xl p-6 flex flex-col gap-4">
        <h1 className="text-4xl font-extrabold text-center">{city.city}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow label="Population (2020)" value={city.population_2020?.toLocaleString()} />
          <InfoRow label="County" value={city.county} />
          <InfoRow label="Median Age" value={city.median_age ?? "—"} />
          <InfoRow label="Median Income" value={city.median_income ? "$" + city.median_income.toLocaleString() : "—"} />
          <InfoRow label="Density / mi²" value={city.density_sq_mi} />
          <InfoRow label="Incorporated" value={city.incorporated_year} />
        </div>
        {city.website && (
          <p className="text-center">
            <a href={city.website} target="_blank" rel="noreferrer" className="text-blue-600 underline">
              Official website ↗
            </a>
          </p>
        )}
      </div>

      {/* race breakdown */}
      {city.race_breakdown && (
        <div className="bg-white shadow-lg rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-3">Race & Ethnicity</h2>
          <ul className="space-y-1">
            {Object.entries(city.race_breakdown).map(([race, pct]) => (
              <li key={race} className="flex justify-between">
                <span>{race}</span>
                <span className="font-medium">{pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* universities */}
      {city.universities?.length > 0 && (
        <div className="bg-white shadow-lg rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-3">Universities ({city.universities.length})</h2>
          <ul className="space-y-1 list-disc list-inside">
            {city.universities.map((u, i) => (
              <li key={i} className="flex justify-between">
                <span>{u.name}</span>
                <span className="font-medium">{u.enrollment.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* overview toggle */}
      {city.overview && (
        <details className="bg-white shadow-lg rounded-2xl p-6">
          <summary className="font-semibold cursor-pointer">Wikipedia Overview</summary>
          <p className="mt-3 whitespace-pre-line text-justify text-sm leading-relaxed">
            {city.overview}
          </p>
        </details>
      )}
    </div>
  );
}