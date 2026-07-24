import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, isFirebaseConfigured } from '../firebase/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc, collection, onSnapshot } from 'firebase/firestore';

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
              // Create default doc if none exists
              const defaultProfile = {
                role: 'Intern',
                personalDetails: { name: firebaseUser.email.split('@')[0], phone: '', avatarUrl: '' },
                officeDetails: { position: 'Intern', department: 'Engineering', hireDate: new Date().toISOString().split('T')[0], status: 'Active' },
                supportingDocuments: { contract: 'N/A', nssf: 'N/A', nhif: 'N/A' },
                permissions: ['simplified_logger', 'view_dashboard']
              };
              await setDoc(doc(db, 'users', firebaseUser.uid), defaultProfile);
              setUser({
                uid: firebaseUser.uid,
                id: firebaseUser.uid,
                email: firebaseUser.email,
                ...defaultProfile
              });
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
