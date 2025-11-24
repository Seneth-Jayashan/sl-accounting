// app.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StudentDashboardPage from "./pages/student/Dashboard";
import AdminDashboardPage from "./pages/admin/Dashboard";
import "./index.css"; // Tailwind should be imported here

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/student/dashboard" element={<StudentDashboardPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        {/* add other routes (classes, materials, payments) */}
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);

export default App;

