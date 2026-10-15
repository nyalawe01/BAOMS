import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App';
import i18n from './locales/i18n';

describe('BAOMS Phase 2 & Phase 4 Application Shell and Authentication Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    i18n.changeLanguage('en');
    window.history.pushState({}, 'Test', '/');
  });

  it('redirects unauthenticated user to Staff Sign In portal', () => {
    render(<App />);
    expect(screen.getAllByText(/BAOMS/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Staff Portal Sign In|Kuingia kwa Watumishi/i)).toBeInTheDocument();
    expect(screen.getByText(/Self-registration is disabled|Kujisajili mwenyewe kumefungwa/i)).toBeInTheDocument();
  });

  it('renders the sample NGO administrative dashboard when authenticated session is restored', async () => {
    localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000002');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Executive Management Overview/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText(/Active Field Projects/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending Document Reviews/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending Administrative Actions/i)).toBeInTheDocument();
    expect(screen.getByText(/Recent Activity Log/i)).toBeInTheDocument();
  });

  it('renders English administrative dashboard and institutional metrics', async () => {
    localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000002');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Executive Management Overview/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText(/Active Field Projects/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Babawatoto Organization/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Dashboard/i).length).toBeGreaterThan(0);
  });
});
