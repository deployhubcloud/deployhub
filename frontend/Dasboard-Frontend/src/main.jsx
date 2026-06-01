import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import AuthGate from "./components/AuthGate";
import RateLimitNotice from "./components/RateLimitNotice";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <AuthGate>
        <App />
      </AuthGate>
      <RateLimitNotice />
    </AuthProvider>
  </BrowserRouter>
);
