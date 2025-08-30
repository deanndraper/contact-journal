import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import Privacy from './Privacy';

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Privacy page route */}
        <Route path="/privacy" element={<Privacy />} />
        
        {/* Multi-app routes */}
        <Route path="/:appId/:userKey" element={<App />} />
        
        {/* Legacy/fallback routes */}
        <Route path="/:userKey" element={<App />} />
        <Route path="/" element={<App />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;