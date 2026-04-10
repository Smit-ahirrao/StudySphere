import React from 'react';
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

const App: React.FC = () => {
  return (
    <DataProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="notes" element={<Notes />} />
            <Route path="planner" element={<Planner />} />
            <Route path="focus" element={<Focus />} />
            <Route path="files" element={<Files />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </DataProvider>
  );
};

export default App;