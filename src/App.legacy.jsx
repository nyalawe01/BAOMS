import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import AppShell from './components/AppShell';

function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <AppShell />
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;
