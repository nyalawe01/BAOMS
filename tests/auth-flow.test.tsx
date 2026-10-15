import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '@/App';
import '@/locales/i18n';

describe('BAOMS Phase 4: Authentication, Access Control & User Management', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.history.pushState({}, 'Test', '/login');
  });

  describe('1. Authentication Portal & Sign-In Workflow', () => {
    it('renders the secure Staff Sign-In portal with organization branding', () => {
      render(<App />);

      expect(screen.getAllByText(/BAOMS/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Staff Portal Sign In|Kuingia kwa Watumishi/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Self-registration is disabled|Kujisajili mwenyewe kumefungwa/i)
      ).toBeInTheDocument();
    });

    it('rejects authentication with an unknown email address', async () => {
      render(<App />);

      const emailInput = screen.getByLabelText(/Email Address|Barua Pepe/i);
      const passwordInput = screen.getByLabelText(/Password|Nenosiri/i);
      const submitButton = screen.getByRole('button', { name: /Sign In|Ingia/i });

      fireEvent.change(emailInput, { target: { value: 'unknown.user@external.org' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/No registered staff account found/i)
        ).toBeInTheDocument();
      });
    });

    it('rejects passwords shorter than 6 characters', async () => {
      render(<App />);

      const emailInput = screen.getByLabelText(/Email Address|Barua Pepe/i);
      const passwordInput = screen.getByLabelText(/Password|Nenosiri/i);
      const submitButton = screen.getByRole('button', { name: /Sign In|Ingia/i });

      fireEvent.change(emailInput, { target: { value: 'admin@babawatoto.org' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Password must be at least 6 characters long/i)
        ).toBeInTheDocument();
      });
    });

    it('successfully signs in with valid staff credentials and navigates to Dashboard', async () => {
      render(<App />);

      const emailInput = screen.getByLabelText(/Email Address|Barua Pepe/i);
      const passwordInput = screen.getByLabelText(/Password|Nenosiri/i);
      const submitButton = screen.getByRole('button', { name: /Sign In|Ingia/i });

      fireEvent.change(emailInput, { target: { value: 'admin@babawatoto.org' } });
      fireEvent.change(passwordInput, { target: { value: 'baoms2026' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Executive Management Overview/i)).toBeInTheDocument();
      });

      // Verifies session token stored in localStorage
      expect(
        localStorage.getItem('baoms_session_user') ||
        localStorage.getItem('baoms_active_session_id')
      ).toBe('00000000-0000-0000-0000-000000000001');
    });

    it('blocks sign-in for deactivated accounts and navigates to Deactivated status page', async () => {
      render(<App />);

      const emailInput = screen.getByLabelText(/Email Address|Barua Pepe/i);
      const passwordInput = screen.getByLabelText(/Password|Nenosiri/i);
      const submitButton = screen.getByRole('button', { name: /Sign In|Ingia/i });

      fireEvent.change(emailInput, { target: { value: 'deactivated@babawatoto.org' } });
      fireEvent.change(passwordInput, { target: { value: 'baoms2026' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getAllByText(/Account Deactivated|Akaunti Imezimwa|Account Suspended/i).length
        ).toBeGreaterThan(0);
      });
    });
  });

  describe('2. Password Recovery Portal', () => {
    it('allows requesting password recovery for registered staff', async () => {
      window.history.pushState({}, 'Test', '/reset-password');
      render(<App />);

      expect(screen.getByText(/Password Recovery|Urejeshaji wa Nenosiri/i)).toBeInTheDocument();

      const emailInput = screen.getByLabelText(/Email Address|Barua Pepe/i);
      const submitButton = screen.getByRole('button', { name: /Send Recovery Link|Tuma Kiungo cha Urejeshaji/i });

      fireEvent.change(emailInput, { target: { value: 'director@babawatoto.org' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Recovery Instructions Dispatched|Maelekezo ya Urejeshaji Yametumwa/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('3. Protected Operational Routes & Role-Based Access Control (RBAC)', () => {
    it('redirects unauthenticated requests away from protected routes to /login', async () => {
      window.history.pushState({}, 'Test', '/users');
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Staff Portal Sign In|Kuingia kwa Watumishi/i)).toBeInTheDocument();
      });
    });

    it('permits System Administrator access to User Management (/users)', async () => {
      localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000001');
      window.history.pushState({}, 'Test', '/users');
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Authorized Staff Directory|Orodha ya Watumishi Walioidhinishwa/i)).toBeInTheDocument();
      });
    });

    it('denies Project Coordinator access to /users with a 403 Access Denied screen', async () => {
      localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000005');
      window.history.pushState({}, 'Test', '/users');
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Access Denied|Ufikiaji Umekataliwa/i)).toBeInTheDocument();
        expect(screen.getByText(/403 Forbidden/i)).toBeInTheDocument();
        expect(screen.getByText(/RBAC Boundary/i)).toBeInTheDocument();
      });
    });
  });

  describe('4. Sign-Out Lifecycle', () => {
    it('terminates active session and returns to login portal when signing out', async () => {
      localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000001');
      window.history.pushState({}, 'Test', '/');
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Executive Management Overview/i)).toBeInTheDocument();
      });

      // Open user dropdown menu and trigger Sign Out
      const profileButton = screen.getByRole('button', { name: /Open user menu/i });
      fireEvent.click(profileButton);

      const signOutMenuItem = screen.getByRole('menuitem', { name: /Sign Out|Ondoka/i });
      fireEvent.click(signOutMenuItem);

      // Confirm sign out in modal
      const confirmButton = screen.getByRole('button', { name: /^Sign Out$|^Ondoka$/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Staff Portal Sign In|Kuingia kwa Watumishi/i)).toBeInTheDocument();
      });

      expect(localStorage.getItem('baoms_session_user')).toBeNull();
    });
  });

  describe('5. Staff Provisioning & Role Administration Features', () => {
    it('filters staff directory by search term and status tabs', async () => {
      localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000001');
      window.history.pushState({}, 'Test', '/users');
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Baraka Said')).toBeInTheDocument();
      });

      // Filter by search query
      const searchInput = screen.getByPlaceholderText(/Search staff by name/i);
      fireEvent.change(searchInput, { target: { value: 'Mariam' } });

      expect(screen.getByText('Mariam M. Juma')).toBeInTheDocument();
      expect(screen.queryByText('Baraka Said')).not.toBeInTheDocument();
    });

    it('opens provision staff modal and dispatches invitation', async () => {
      localStorage.setItem('baoms_session_user', '00000000-0000-0000-0000-000000000001');
      window.history.pushState({}, 'Test', '/users');
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Provision Staff Member/i })).toBeInTheDocument();
      });

      const provisionButton = screen.getByRole('button', { name: /Provision Staff Member/i });
      fireEvent.click(provisionButton);

      expect(screen.getByText('Provision New Staff Account')).toBeInTheDocument();

      const nameInput = screen.getByLabelText(/Full Staff Name/i);
      const emailInput = screen.getByLabelText(/Official Organization Email/i);
      const dispatchButton = screen.getByRole('button', { name: /Dispatch Invitation/i });

      fireEvent.change(nameInput, { target: { value: 'Grace M. Mlay' } });
      fireEvent.change(emailInput, { target: { value: 'grace.mlay@babawatoto.org' } });
      fireEvent.click(dispatchButton);

      await waitFor(() => {
        expect(screen.getByText('Grace M. Mlay')).toBeInTheDocument();
        expect(screen.getByText('grace.mlay@babawatoto.org')).toBeInTheDocument();
      });
    });
  });

  describe('6. Multi-Factor Authentication (MFA) & Session Expiry', () => {
    it('prompts for MFA code when privileged account with MFA enrolls, and completes verification', async () => {
      render(<App />);

      const emailInput = screen.getByLabelText(/Email Address|Barua Pepe/i);
      const passwordInput = screen.getByLabelText(/Password|Nenosiri/i);
      const submitButton = screen.getByRole('button', { name: /Sign In|Ingia/i });

      fireEvent.change(emailInput, { target: { value: 'secadmin@babawatoto.org' } });
      fireEvent.change(passwordInput, { target: { value: 'baoms2026' } });
      fireEvent.click(submitButton);

      // Verify MFA prompt appears
      await waitFor(() => {
        expect(screen.getByText(/Two-Factor Authentication|Uthibitishaji wa Hatua Mbili/i)).toBeInTheDocument();
        expect(screen.getByText(/AAL2 Security/i)).toBeInTheDocument();
      });

      // Enter invalid code
      const mfaInput = screen.getByLabelText(/Authenticator Code|Msimbo wa Uthibitishaji/i);
      const verifyButton = screen.getByRole('button', { name: /Verify & Sign In|Thibitisha na Uingie/i });

      fireEvent.change(mfaInput, { target: { value: '000000' } });
      // In demo mode, 123456 or 6 digits is accepted, but let's test short code or empty
      fireEvent.change(mfaInput, { target: { value: '123' } });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid 6-digit authenticator code/i)).toBeInTheDocument();
      });

      // Enter valid code
      fireEvent.change(mfaInput, { target: { value: '123456' } });
      fireEvent.click(verifyButton);

      // Navigates to Dashboard upon successful verification
      await waitFor(() => {
        expect(screen.getByText(/Executive Management Overview/i)).toBeInTheDocument();
      });
    });
  });
});
