import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MapMN from "./MapMN";
import CityPage from "./CityPage";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapMN />} />       {/* home map */}
        <Route path="/city/:slug" element={<CityPage />} />  {/* city page */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
