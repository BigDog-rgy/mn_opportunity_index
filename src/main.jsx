import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MapMN from "./MapMN";
import CityPage from "./CityPage";
import CompareCities from "./CompareCities"; 
import "./index.css";
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapMN />} />       {/* home map */}
        <Route path="/city/:slug" element={<CityPage />} />  {/* city page */}
        <Route path="/compare/:city1/:city2" element={<CompareCities />} /> {/* compare page */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
