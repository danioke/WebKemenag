/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'motion/react';
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';

import BeritaDetail from './pages/BeritaDetail';
import AgendaDetail from './pages/AgendaDetail';
import PengumumanDetail from './pages/PengumumanDetail';
import GaleriFoto from './pages/GaleriFoto';
import GaleriVideo from './pages/GaleriVideo';
import AllNews from './pages/AllNews';
import AllPengumuman from './pages/AllPengumuman';
import AllAgenda from './pages/AllAgenda';
import Loader from './components/Loader';
import LayananDetail from './pages/LayananDetail';
import NotFound from './pages/NotFound';

export default function App() {
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const hasLoadedBefore = sessionStorage.getItem('kemenag_has_loaded');
    if (!hasLoadedBefore) {
      setShowLoader(true);
    }
  }, []);

  return (
    <HelmetProvider>
      <AnimatePresence mode="wait">
        {showLoader && (
          <Loader onComplete={() => {
            sessionStorage.setItem('kemenag_has_loaded', 'true');
            setShowLoader(false);
          }} />
        )}
      </AnimatePresence>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/berita" element={<AllNews />} />
          <Route path="/berita/:id" element={<BeritaDetail />} />
          <Route path="/agenda" element={<AllAgenda />} />
          <Route path="/agenda/:id" element={<AgendaDetail />} />
          <Route path="/pengumuman" element={<AllPengumuman />} />
          <Route path="/pengumuman/:id" element={<PengumumanDetail />} />
          <Route path="/galeri-foto" element={<GaleriFoto />} />
          <Route path="/galeri-video" element={<GaleriVideo />} />
          <Route path="/layanan/:id" element={<LayananDetail />} />
          <Route path="/hmsoke" element={<Login />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}
