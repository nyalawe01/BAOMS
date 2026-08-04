import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { ThemeProvider } from './context/ThemeContext';
import AppShell from './components/AppShell';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProjectProvider>
          <AppShell />
        </ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
