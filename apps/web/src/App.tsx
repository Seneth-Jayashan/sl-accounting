import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StudentDashboardPage from "./pages/student/Dashboard";
import AdminDashboardPage from "./pages/admin/Dashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { MainLayout } from "./layouts/MainLayout";
import "./index.css"; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES (Wrapped in MainLayout) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />
          {/* Add other public pages here */}
        </Route>

        {/* DASHBOARD ROUTES (Standalone) */}
        <Route path="/student/dashboard" element={<StudentDashboardPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;