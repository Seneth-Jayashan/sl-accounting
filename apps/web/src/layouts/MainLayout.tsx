import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const MainLayout: React.FC = () => {

  return (
    <div className="w-full min-h-screen bg-[#E8EFF7]">
      <Navbar />
      <main>
        {/* The Outlet renders the child route (e.g., Home, About) */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};