import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useSocket } from './hooks/useSocket';
import { useStore } from './store/useStore';
import { connectSocket } from './lib/socket';
import { IPL_TEAMS } from './data/teams';

import HomePage     from './pages/HomePage';
import LobbyPage    from './pages/LobbyPage';
import AuctionPage  from './pages/AuctionPage';
import MyTeamPage   from './pages/MyTeamPage';
import AllTeamsPage from './pages/AllTeamsPage';
import ResultsPage  from './pages/ResultsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const location = useLocation();
  const { setConnected, setIplTeams, connected } = useStore();

  // Boot: connect socket + seed teams
  useEffect(() => {
    setIplTeams(IPL_TEAMS as any);
    connectSocket();
  }, []);

  // Listen to socket connection state globally
  useSocket();

  return (
    <div className="min-h-screen bg-stadium-dark text-white">
      {/* Global connection indicator */}
      {!connected && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600/90 text-white text-xs text-center py-1 font-semibold">
          ⚡ Connecting to server…
        </div>
      )}

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"                   element={<HomePage />} />
          <Route path="/lobby/:code"        element={<LobbyPage />} />
          <Route path="/auction/:code"      element={<AuctionPage />} />
          <Route path="/myteam/:code"       element={<MyTeamPage />} />
          <Route path="/teams/:code"        element={<AllTeamsPage />} />
          <Route path="/results/:code"      element={<ResultsPage />} />
          <Route path="/settings"           element={<SettingsPage />} />
          <Route path="*"                   element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
