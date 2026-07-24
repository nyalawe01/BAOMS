import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../firebase/firebase', () => ({
  auth: {},
  db: {},
  isFirebaseConfigured: false,
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn(),
  onSnapshot: vi.fn(),
}));

function Probe() {
  const { user, role, error, login, logout, hasPermission } = useAuth();
  return (
    <div>
      <div data-testid="user">{user ? user.email : 'none'}</div>
      <div data-testid="role">{role ?? 'none'}</div>
      <div data-testid="error">{error}</div>
      <div data-testid="can-manage-users">{hasPermission('manage_users') ? 'yes' : 'no'}</div>
      <button onClick={() => login('nobody@example.com', 'wrongpass')}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

describe('AuthContext (local fallback mode, isFirebaseConfigured=false)', () => {
  it('starts with no user and no permissions', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));
    expect(screen.getByTestId('role')).toHaveTextContent('none');
    expect(screen.getByTestId('can-manage-users')).toHaveTextContent('no');
  });

  it('rejects login when no fallback users are configured', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));

    await user.click(screen.getByText('login'));

    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid simulated email or password.')
    );
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('useAuth throws when used outside an AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });
});
