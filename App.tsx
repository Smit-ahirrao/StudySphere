import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Notes from './pages/Notes';
import Planner from './pages/Planner';
import Focus from './pages/Focus';
import Files from './pages/Files';
import StudyLab from './pages/StudyLab';
import SplashScreen from './components/SplashScreen';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);

  return (
    <DataProvider>
      {loading && <SplashScreen onComplete={() => setLoading(false)} />}
      <HashRouter>
        <Routes>
          {/* Landing page is now outside the main app layout */}
          <Route path="/" element={<Landing />} />
          
          {/* App routes wrapped in Layout */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/focus" element={<Focus />} />
            <Route path="/study-lab" element={<StudyLab />} />
            <Route path="/files" element={<Files />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </DataProvider>
  );
};

export default App;