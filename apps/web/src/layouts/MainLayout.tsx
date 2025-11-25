import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="w-full min-h-screen bg-[#E8EFF7]">
      <Navbar />
      <main>
        {/* The Outlet renders the child route (e.g., Home, About) */}
        <Outlet />
      </main>
      {!isHomePage && <Footer />}
    </div>
  );
};