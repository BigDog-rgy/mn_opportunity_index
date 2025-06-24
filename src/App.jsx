import { BrowserRouter, Routes, Route } from "react-router-dom";
import MapMN from "./MapMN";
import CompareCities from "./CompareCities"; // no curly braces here, it's a default export

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapMN />} />
        <Route path="/compare/:city1/:city2" element={<CompareCities />} />
      </Routes>
    </BrowserRouter>
  );
}
