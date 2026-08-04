import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, isFirebaseConfigured } from '../firebase/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  deleteUser as deleteAuthUser,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

const FALLBACK_USERS = [];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [policyVault, setPolicyVault] = useState([]);

  useEffect(() => {
    if (isFirebaseConfigured) {
      console.log("BAOMS: Firebase database mode active.");
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              setUser({
                uid: firebaseUser.uid,
                id: firebaseUser.uid,
                email: firebaseUser.email,
                ...userDoc.data()
              });
            } else {
              // No Firestore profile exists for this authenticated account.
              // Legitimate accounts always get their profile doc created
              // atomically with the Auth account (see addUser in
              // ProjectContext), so a missing doc means this account was
              // deprovisioned via deleteUser. Do not silently re-provision
              // a default profile - that would let a deleted user regain
              // access. Sign them out instead.
              console.warn(`No Firestore profile found for uid ${firebaseUser.uid} - signing out.`);
              await signOut(auth);
              setUser(null);
              setError('This account has been deactivated or has no active profile. Contact your administrator.');
            }
          } catch (err) {
            console.error("Firebase auth profile load error:", err);
            setError("Could not load user profile from Firestore.");
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    } else {
      console.log("BAOMS: Simulated local storage mode active.");
      // Fallback local storage auth
      const savedUser = localStorage.getItem('baoms_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          localStorage.removeItem('baoms_user');
        }
      }
      setLoading(false);
    }
  }, [isFirebaseConfigured]);

  // Load Policy Vault from Firestore
  useEffect(() => {
    if (isFirebaseConfigured) {
      return onSnapshot(collection(db, 'policyVault'), (snap) => {
        setPolicyVault(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => console.warn("Firestore policyVault read permission denied:", err));
    } else {
      const DEFAULT_VAULT = [
        { id: 'v1', title: 'Global Code of Conduct', size: '1.2 MB', category: 'Policy', updated: '2026-01-15' },
        { id: 'v2', title: 'Travel & Expense Reimbursement Guideline', size: '840 KB', category: 'Guideline', updated: '2026-03-22' }
      ];
      setPolicyVault(DEFAULT_VAULT);
    }
  }, [isFirebaseConfigured]);

  const login = async (email, password) => {
    setError('');
    if (isFirebaseConfigured) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        return true;
      } catch (err) {
        setError(err.message || 'Invalid credentials.');
        return false;
      }
    } else {
      // Local check
      const foundUser = FALLBACK_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('baoms_user', JSON.stringify(foundUser));
        return true;
      } else {
        setError('Invalid simulated email or password.');
        return false;
      }
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Sign out error:", err);
      }
    } else {
      setUser(null);
      localStorage.removeItem('baoms_user');
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    return user.permissions?.includes(permission) || false;
  };

  const updateProfileDetails = async (newDetails) => {
    if (!user) return;

    const updatedProfile = {
      ...user,
      avatar: newDetails.avatar || user.avatar,
      personalDetails: {
        ...user.personalDetails,
        ...newDetails
      }
    };

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          avatar: newDetails.avatar || user.avatar || '',
          'personalDetails.phone': newDetails.phone || user.personalDetails?.phone || '',
          'personalDetails.avatarUrl': newDetails.avatar || user.personalDetails?.avatarUrl || ''
        });
        setUser(updatedProfile);
      } catch (err) {
        console.error("Firestore update error:", err);
      }
    } else {
      setUser(updatedProfile);
      localStorage.setItem('baoms_user', JSON.stringify(updatedProfile));
    }
  };

  // Re-authenticates with the user's current password before a sensitive
  // action (password change, account deletion) - Firebase requires a
  // recent sign-in for both, and asking for the current password is also
  // just correct UX for either action.
  const reauthenticate = async (currentPassword) => {
    const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, cred);
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!isFirebaseConfigured || !auth.currentUser) {
      throw new Error('Password changes require a live Firebase session.');
    }
    await reauthenticate(currentPassword);
    await updatePassword(auth.currentUser, newPassword);
  };

  const deleteMyAccount = async (currentPassword) => {
    if (!isFirebaseConfigured || !auth.currentUser) {
      throw new Error('Account deletion requires a live Firebase session.');
    }
    await reauthenticate(currentPassword);
    const uid = auth.currentUser.uid;
    await deleteDoc(doc(db, 'users', uid));
    await deleteAuthUser(auth.currentUser);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        loading,
        error,
        login,
        logout,
        hasPermission,
        updateProfileDetails,
        policyVault,
        isFirebaseConfigured
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
