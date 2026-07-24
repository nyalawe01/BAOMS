import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db, firebaseConfig } from '../firebase/firebase';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const { user, isFirebaseConfigured } = useAuth();

  // Database States
  const [projects, setProjects] = useState([]);
  const [projectFiles, setProjectFiles] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [assetsAndVendors, setAssetsAndVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [mediaLibrary, setMediaLibrary] = useState([]);
  const [offlineSubmissions, setOfflineSubmissions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activePreviewDoc, setActivePreviewDoc] = useState(null);

  // 1. Firebase Mode: Real-time sync with Firestore snapshots
  useEffect(() => {
    if (!isFirebaseConfigured || !user) return;

    console.log("BAOMS: Fetching real-time records from Firestore database...");
    
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore projects read permission denied:", err));
    const unsubFiles = onSnapshot(collection(db, 'projectFiles'), (snap) => {
      setProjectFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore projectFiles read permission denied:", err));
    const unsubBudgets = onSnapshot(collection(db, 'budgets'), (snap) => {
      setBudgets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore budgets read permission denied:", err));
    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snap) => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore expenses read permission denied:", err));
    const unsubAssets = onSnapshot(collection(db, 'assetsAndVendors'), (snap) => {
      setAssetsAndVendors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore assetsAndVendors read permission denied:", err));
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore orders read permission denied:", err));
    const unsubAnnouncements = onSnapshot(collection(db, 'announcements'), (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore announcements read permission denied:", err));
    const unsubMedia = onSnapshot(collection(db, 'mediaLibrary'), (snap) => {
      setMediaLibrary(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore mediaLibrary read permission denied:", err));
    const unsubOffline = onSnapshot(collection(db, 'offlineSubmissions'), (snap) => {
      setOfflineSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore offlineSubmissions read permission denied:", err));
    const unsubRequests = onSnapshot(collection(db, 'requests'), (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore requests read permission denied:", err));
    const unsubAudits = onSnapshot(collection(db, 'auditLogs'), (snap) => {
      const sorted = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setAuditLogs(sorted);
    }, (err) => console.warn("Firestore auditLogs read permission denied:", err));
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore users read permission denied:", err));
    const unsubReports = onSnapshot(collection(db, 'reports'), (snap) => {
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore reports read permission denied:", err));
    const unsubTx = onSnapshot(collection(db, 'transactions'), (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore transactions read permission denied:", err));

    return () => {
      unsubProjects();
      unsubFiles();
      unsubBudgets();
      unsubExpenses();
      unsubAssets();
      unsubOrders();
      unsubAnnouncements();
      unsubMedia();
      unsubOffline();
      unsubRequests();
      unsubAudits();
      unsubUsers();
      unsubReports();
      unsubTx();
    };
  }, [isFirebaseConfigured, user]);

  // 2. Local Storage Mode: Load fallbacks
  useEffect(() => {
    if (isFirebaseConfigured) return;

    setProjects(JSON.parse(localStorage.getItem('baoms_projects') || '[]'));
    setProjectFiles(JSON.parse(localStorage.getItem('baoms_project_files') || '[]'));
    setBudgets(JSON.parse(localStorage.getItem('baoms_budgets') || '[]'));
    setExpenses(JSON.parse(localStorage.getItem('baoms_expenses') || '[]'));
    setAssetsAndVendors(JSON.parse(localStorage.getItem('baoms_assets_vendors') || '[]'));
    setOrders(JSON.parse(localStorage.getItem('baoms_orders') || '[]'));
    setAnnouncements(JSON.parse(localStorage.getItem('baoms_announcements') || '[]'));
    setMediaLibrary(JSON.parse(localStorage.getItem('baoms_media_library') || '[]'));
    setOfflineSubmissions(JSON.parse(localStorage.getItem('baoms_offline_submissions') || '[]'));
    setRequests(JSON.parse(localStorage.getItem('baoms_requests') || '[]'));
    setAuditLogs(JSON.parse(localStorage.getItem('baoms_audit_logs') || '[]'));
    setUsers(JSON.parse(localStorage.getItem('baoms_users') || '[]'));
    setReports(JSON.parse(localStorage.getItem('baoms_reports') || '[]'));
    setTransactions(JSON.parse(localStorage.getItem('baoms_transactions') || '[]'));
  }, [isFirebaseConfigured]);

  // Sync back to local storage in fallback mode
  const syncLocal = (key, val) => {
    if (!isFirebaseConfigured) {
      localStorage.setItem(key, JSON.stringify(val));
    }
  };

  // Seeding simulation method
  const seedLocalSimulation = () => {
    const defaultProjects = [
      { id: 'p1', name: 'Website Redesign', description: 'Overhaul corporate website design and build single page application layout.', status: 'In Progress', startDate: '2026-06-01', endDate: '2026-08-30', progress: 60, tasks: [], budget: 8500 },
      { id: 'p2', name: 'ERP Integration', description: 'Integrate global enterprise resource planning tools with the main system dashboard.', status: 'Planning', startDate: '2026-08-01', endDate: '2026-12-15', progress: 15, tasks: [], budget: 15000 }
    ];
    const defaultBudgets = [
      { id: 'b1', projectId: 'p1', projectName: 'Website Redesign', allocatedBudget: 8500, fiscalYear: 'FY26', items: [{ id: 'bi1', description: 'Design Contractor UI/UX', category: 'Consultancies', allocatedAmount: 5000, spent: 4000 }] }
    ];
    const defaultUsers = [
      { id: 'u1', name: 'Alice Administrator', email: 'admin@oms.com', role: 'System Administrator', department: 'Executive', status: 'Active' },
      { id: 'u2', name: 'David Executive', email: 'director@oms.com', role: 'Executive Director', department: 'Executive', status: 'Active' },
      { id: 'u3', name: 'Helen Officer', email: 'hr@oms.com', role: 'HR Officer', department: 'HR', status: 'Active' },
      { id: 'u4', name: 'Paul Manager', email: 'pm@oms.com', role: 'Project Manager', department: 'Program Management', status: 'Active' }
    ];

    setProjects(defaultProjects);
    setBudgets(defaultBudgets);
    setUsers(defaultUsers);

    localStorage.setItem('baoms_projects', JSON.stringify(defaultProjects));
    localStorage.setItem('baoms_budgets', JSON.stringify(defaultBudgets));
    localStorage.setItem('baoms_users', JSON.stringify(defaultUsers));
  };

  const clearDatabase = () => {
    setProjects([]);
    setProjectFiles([]);
    setBudgets([]);
    setExpenses([]);
    setAssetsAndVendors([]);
    setOrders([]);
    setAnnouncements([]);
    setMediaLibrary([]);
    setOfflineSubmissions([]);
    setRequests([]);
    setAuditLogs([]);
    setUsers([]);
    setReports([]);
    setTransactions([]);

    localStorage.setItem('baoms_projects', '[]');
    localStorage.setItem('baoms_project_files', '[]');
    localStorage.setItem('baoms_budgets', '[]');
    localStorage.setItem('baoms_expenses', '[]');
    localStorage.setItem('baoms_assets_vendors', '[]');
    localStorage.setItem('baoms_orders', '[]');
    localStorage.setItem('baoms_announcements', '[]');
    localStorage.setItem('baoms_media_library', '[]');
    localStorage.setItem('baoms_offline_submissions', '[]');
    localStorage.setItem('baoms_requests', '[]');
    localStorage.setItem('baoms_audit_logs', '[]');
    localStorage.setItem('baoms_users', '[]');
    localStorage.setItem('baoms_reports', '[]');
    localStorage.setItem('baoms_transactions', '[]');
  };

  // Helper to log audit actions
  const logAudit = async (actionType, description) => {
    const newLog = {
      userName: user ? user.personalDetails?.name || user.email : 'System',
      userRole: user ? user.role : 'System',
      actionType,
      description,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'auditLogs'), newLog);
      } catch (err) {
        console.error("Firestore audit log error:", err);
      }
    } else {
      const updated = [{ id: 'aud_' + Date.now(), ...newLog }, ...auditLogs];
      setAuditLogs(updated);
      syncLocal('baoms_audit_logs', updated);
    }
  };

  // HR actions
  const addUser = async (userData) => {
    const newUser = {
      firstName: userData.firstName || '',
      middleName: userData.middleName || '',
      surname: userData.surname || '',
      name: `${userData.firstName} ${userData.surname}`.trim(),
      email: userData.email || '',
      organizationEmail: userData.organizationEmail || '',
      phone: userData.phone || '',
      personalId: userData.personalId || '',
      nhif: userData.nhif || '',
      nssf: userData.nssf || '',
      role: userData.role || 'Intern',
      department: userData.department || 'Engineering',
      status: 'Active',
      avatar: userData.avatar || '',
      personalDetails: {
        dob: userData.dob || '',
        placeOfBirth: userData.placeOfBirth || '',
        placeOfLiving: userData.placeOfLiving || '',
        gender: userData.gender || '',
        disability: userData.disability || 'No',
        disabilityDescription: userData.disabilityDescription || '',
        nationality: userData.nationality || '',
        phone: userData.phone || '',
      },
      officeDetails: {
        officeLocation: userData.officeLocation || '',
        department: userData.department || 'Engineering',
        position: userData.position || userData.role || 'Intern',
        status: 'Active',
        hireDate: userData.hireDate || new Date().toISOString().substring(0, 10)
      },
      supportingDocuments: {
        cv: userData.supportingDocuments?.cv || null,
        certificates: userData.supportingDocuments?.certificates || null,
        contract: userData.supportingDocuments?.contract || null,
        insurance: userData.supportingDocuments?.insurance || null,
        others: userData.supportingDocuments?.others || null
      },
      tempPassword: userData.tempPassword || ''
    };

    if (isFirebaseConfigured) {
      try {
        // Initialize secondary App Auth so current HR Officer's session is not disrupted
        const secApp = initializeApp(firebaseConfig, `SecApp_${Date.now()}`);
        const secAuth = getAuth(secApp);
        
        // 1. Create User in Firebase Auth
        const credential = await createUserWithEmailAndPassword(
          secAuth,
          userData.email,
          userData.tempPassword
        );
        const uid = credential.user.uid;
        
        // Clean up secondary auth session
        await signOut(secAuth);
        
        // 2. Set Firestore record with matching generated Auth UID
        const finalUser = {
          ...newUser,
          id: uid,
          uid: uid
        };
        await setDoc(doc(db, 'users', uid), finalUser);
      } catch (err) {
        console.error("Firestore/Auth add user error:", err);
        throw new Error("Authentication registration failed: " + err.message);
      }
    } else {
      const updated = [...users, { id: 'u_' + Date.now(), ...newUser }];
      setUsers(updated);
      syncLocal('baoms_users', updated);
    }
    logAudit('USER_MANAGEMENT', `Onboarded staff member "${newUser.name}" as "${newUser.role}".`);
  };

  const updateUser = async (userId, updatedData) => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'users', userId), updatedData);
      } catch (err) {
        console.error("Firestore update user error:", err);
      }
    } else {
      const updated = users.map(u => u.id === userId ? { ...u, ...updatedData } : u);
      setUsers(updated);
      syncLocal('baoms_users', updated);
    }
    const targetUser = users.find(u => u.id === userId);
    logAudit('USER_MANAGEMENT', `Updated directory profile status/dept for "${targetUser ? targetUser.name : userId}".`);
  };

  // Project Actions
  const addProject = async (projectData) => {
    const newProj = {
      name: projectData.name,
      description: projectData.description,
      status: projectData.status || 'Planning',
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      progress: 0,
      tasks: [],
      budget: projectData.budget || 5000
    };

    if (isFirebaseConfigured) {
      try {
        const docRef = await addDoc(collection(db, 'projects'), newProj);
        const newLedger = {
          projectId: docRef.id,
          projectName: newProj.name,
          allocatedBudget: newProj.budget,
          fiscalYear: 'FY26',
          items: []
        };
        await addDoc(collection(db, 'budgets'), newLedger);
      } catch (err) {
        console.error("Firestore add project error:", err);
      }
    } else {
      const tempId = 'p_' + Date.now();
      const updatedProjs = [{ id: tempId, ...newProj }, ...projects];
      setProjects(updatedProjs);
      syncLocal('baoms_projects', updatedProjs);

      const newLedger = {
        id: 'b_' + Date.now(),
        projectId: tempId,
        projectName: newProj.name,
        allocatedBudget: newProj.budget,
        fiscalYear: 'FY26',
        items: []
      };
      const updatedBudgets = [...budgets, newLedger];
      setBudgets(updatedBudgets);
      syncLocal('baoms_budgets', updatedBudgets);
    }

    logAudit('PROJECT_CREATION', `Initialized project portfolio: "${newProj.name}" with budget limit KES ${newProj.budget}.`);
  };

  const deleteProject = async (projectId) => {
    const proj = projects.find(p => p.id === projectId);
    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'projects', projectId));
      } catch (err) {
        console.error("Firestore delete project error:", err);
      }
    } else {
      const updatedProjs = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjs);
      syncLocal('baoms_projects', updatedProjs);

      const updatedBudgets = budgets.filter(b => b.projectId !== projectId);
      setBudgets(updatedBudgets);
      syncLocal('baoms_budgets', updatedBudgets);
    }
    logAudit('PROJECT_DELETION', `Removed project: "${proj ? proj.name : projectId}".`);
  };

  const updateProject = async (projectId, updatedData) => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'projects', projectId), updatedData);
      } catch (err) {
        console.error("Firestore update project error:", err);
      }
    } else {
      const updated = projects.map(p => p.id === projectId ? { ...p, ...updatedData } : p);
      setProjects(updated);
      syncLocal('baoms_projects', updated);
    }
    const targetProj = projects.find(p => p.id === projectId);
    logAudit('PROJECT_UPDATE', `Updated project "${targetProj ? targetProj.name : projectId}".`);
  };


  const addTask = async (projectId, taskData) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    const newTask = {
      id: 't_' + Date.now(),
      title: taskData.title,
      assignedTo: taskData.assignedTo,
      assignedToId: taskData.assignedToId,
      status: 'Pending',
      loggedTime: []
    };

    const updatedTasks = [...(proj.tasks || []), newTask];

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'projects', projectId), { tasks: updatedTasks });
      } catch (err) {
        console.error("Firestore add task error:", err);
      }
    } else {
      const updatedProjs = projects.map(p => p.id === projectId ? { ...p, tasks: updatedTasks } : p);
      setProjects(updatedProjs);
      syncLocal('baoms_projects', updatedProjs);
    }
    logAudit('TASK_BOARD', `Assigned task "${taskData.title}" to assigned resource in project.`);
  };

  const updateTaskStatus = async (projectId, taskId, status) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    const updatedTasks = proj.tasks.map(t => t.id === taskId ? { ...t, status } : t);
    const completedCount = updatedTasks.filter(t => t.status === 'Completed').length;
    const progress = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : proj.progress;

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'projects', projectId), { tasks: updatedTasks, progress });
      } catch (err) {
        console.error("Firestore update task status error:", err);
      }
    } else {
      const updatedProjs = projects.map(p => p.id === projectId ? { ...p, tasks: updatedTasks, progress } : p);
      setProjects(updatedProjs);
      syncLocal('baoms_projects', updatedProjs);
    }
  };

  const logTaskHours = async (projectId, taskId, hours, notes) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    const updatedTasks = proj.tasks.map(t => {
      if (t.id === taskId) {
        const newLog = {
          date: new Date().toISOString().substring(0, 10),
          hours: parseFloat(hours),
          notes,
          loggedBy: user ? user.personalDetails?.name || user.email : 'Volunteer'
        };
        return { ...t, loggedTime: [...(t.loggedTime || []), newLog] };
      }
      return t;
    });

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'projects', projectId), { tasks: updatedTasks });
      } catch (err) {
        console.error("Firestore log hours error:", err);
      }
    } else {
      const updatedProjs = projects.map(p => p.id === projectId ? { ...p, tasks: updatedTasks } : p);
      setProjects(updatedProjs);
      syncLocal('baoms_projects', updatedProjs);
    }
    logAudit('TASK_BOARD', `Logged ${hours} hours on task under project.`);
  };

  // Project File Actions
  const addProjectFile = async (projectId, fileName, folderPath, size = '1.2 MB') => {
    const newFile = {
      projectId,
      fileName,
      folderPath,
      senderName: user ? user.personalDetails?.name || user.email : 'System',
      senderOriginId: user ? user.id || user.uid : 'System',
      uploadedAt: new Date().toISOString(),
      size
    };

    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'projectFiles'), newFile);
      } catch (err) {
        console.error("Firestore add file error:", err);
      }
    } else {
      const updated = [{ id: 'f_' + Date.now(), ...newFile }, ...projectFiles];
      setProjectFiles(updated);
      syncLocal('baoms_project_files', updated);
    }
    logAudit('PROJECT_CREATION', `Uploaded file "${fileName}" to structured folder "/${folderPath}".`);
  };

  // Finance Actions
  const addBudgetLedgerItem = async (projectId, description, category, amount) => {
    const b = budgets.find(bu => bu.projectId === projectId);
    if (!b) return;

    const newItem = {
      id: 'bi_' + Date.now(),
      description,
      category,
      allocatedAmount: parseFloat(amount),
      spent: 0
    };

    const updatedItems = [...(b.items || []), newItem];
    const newAllocated = b.allocatedBudget + parseFloat(amount);

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'budgets', b.id), {
          allocatedBudget: newAllocated,
          items: updatedItems
        });
      } catch (err) {
        console.error("Firestore add ledger item error:", err);
      }
    } else {
      const updated = budgets.map(bu => bu.projectId === projectId ? { ...bu, allocatedBudget: newAllocated, items: updatedItems } : bu);
      setBudgets(updated);
      syncLocal('baoms_budgets', updated);
    }
    logAudit('BUDGET_ENTRY', `Allocated ledger item "${description}" under category "${category}" (KES ${amount}).`);
  };

  const addExpense = async (projectId, amount, description, category = 'Office', receiptName = 'receipt_upload.jpg', bankAccount = 'CRDB') => {
    const proj = projects.find(p => p.id === projectId);
    const newExpense = {
      projectId,
      projectName: proj ? proj.name : 'Unknown Project',
      amount: parseFloat(amount),
      description,
      category,
      bankAccount,
      receiptUrl: receiptName || 'receipt_upload.jpg',
      submittedBy: user ? user.id || user.uid : 'System',
      submittedByName: user ? user.personalDetails?.name || user.email : 'System',
      department: user?.officeDetails?.department || 'Operations',
      status: 'Pending',
      createdAt: new Date().toISOString().substring(0, 10)
    };

    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'expenses'), newExpense);
      } catch (err) {
        console.error("Firestore add expense error:", err);
      }
    } else {
      const updated = [{ id: 'ex_' + Date.now(), ...newExpense }, ...expenses];
      setExpenses(updated);
      syncLocal('baoms_expenses', updated);
    }
    logAudit('EXPENSE_ROUTING', `Submitted expense claim of KES ${amount} for project "${newExpense.projectName}".`);
  };

  const addTransaction = async (txData) => {
    const newTx = {
      date: txData.date || new Date().toISOString().substring(0, 10),
      ref: txData.ref || `TRX-${Date.now().toString().slice(-6)}`,
      description: txData.description,
      type: txData.type,
      category: txData.category || 'Operations',
      projectId: txData.projectId || '',
      projectName: txData.projectName || 'General',
      amount: parseFloat(txData.amount),
      status: txData.status || 'Pending',
      bankAccount: txData.bankAccount || 'CRDB'
    };

    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'transactions'), newTx);
      } catch (err) {
        console.error("Firestore add transaction error:", err);
      }
    } else {
      const updated = [{ id: 'tx_' + Date.now(), ...newTx }, ...transactions];
      setTransactions(updated);
      syncLocal('baoms_transactions', updated);
    }
    logAudit('TRANSACTION_LOG', `Logged ${newTx.type} transaction of KES ${newTx.amount} (Ref: ${newTx.ref}).`);
  };

  const updateExpenseStatus = async (expenseId, status, approverNotes = '') => {
    const ex = expenses.find(e => e.id === expenseId);
    if (!ex) return;

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'expenses', expenseId), { status });
        
        // If approved, update corresponding project budget spent caches and log transaction
        if (status === 'Approved') {
          const b = budgets.find(bu => bu.projectId === ex.projectId);
          if (b) {
            const updatedItems = (b.items || []).map((item, index) => {
              if (index === 0 || item.description.toLowerCase().includes(ex.description.toLowerCase())) {
                return { ...item, spent: item.spent + ex.amount };
              }
              return item;
            });
            await updateDoc(doc(db, 'budgets', b.id), { items: updatedItems });
          }

          await addTransaction({
            date: ex.createdAt || new Date().toISOString().substring(0, 10),
            ref: `EXP-${ex.id ? ex.id.substring(0, 4).toUpperCase() : Date.now().toString().slice(-4)}`,
            description: ex.description,
            type: 'Expense',
            category: ex.category || 'Office',
            projectId: ex.projectId,
            projectName: ex.projectName,
            amount: ex.amount,
            status: 'Approved',
            bankAccount: ex.bankAccount || 'CRDB'
          });
        }
      } catch (err) {
        console.error("Firestore update expense status error:", err);
      }
    } else {
      const updatedExpenses = expenses.map(e => e.id === expenseId ? { ...e, status } : e);
      setExpenses(updatedExpenses);
      syncLocal('baoms_expenses', updatedExpenses);

      if (status === 'Approved') {
        const updatedBudgets = budgets.map(b => {
          if (b.projectId === ex.projectId) {
            const updatedItems = (b.items || []).map((item, index) => {
              if (index === 0 || item.description.toLowerCase().includes(ex.description.toLowerCase())) {
                return { ...item, spent: item.spent + ex.amount };
              }
              return item;
            });
            return { ...b, items: updatedItems };
          }
          return b;
        });
        setBudgets(updatedBudgets);
        syncLocal('baoms_budgets', updatedBudgets);

        addTransaction({
          date: ex.createdAt || new Date().toISOString().substring(0, 10),
          ref: `EXP-${ex.id ? ex.id.substring(0, 4).toUpperCase() : Date.now().toString().slice(-4)}`,
          description: ex.description,
          type: 'Expense',
          category: ex.category || 'Office',
          projectId: ex.projectId,
          projectName: ex.projectName,
          amount: ex.amount,
          status: 'Approved',
          bankAccount: ex.bankAccount || 'CRDB'
        });
      }
    }
    logAudit('EXPENSE_APPROVAL', `Expense claim "${expenseId}" updated to status: "${status}" by ${user ? user.personalDetails?.name || user.email : 'System'}.`);
  };

  // Procurement & Logistics Actions
  const addAssetOrVendor = async (type, data) => {
    const newItem = {
      type,
      details: data,
      lastUpdatedBy: user ? user.personalDetails?.name || user.email : 'System',
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'assetsAndVendors'), newItem);
      } catch (err) {
        console.error("Firestore add asset/vendor error:", err);
      }
    } else {
      const updated = [{ id: 'av_' + Date.now(), ...newItem }, ...assetsAndVendors];
      setAssetsAndVendors(updated);
      syncLocal('baoms_assets_vendors', updated);
    }
    logAudit('ASSET_VENDOR_REGISTER', `Added new ${type} register: "${data.name || data.vendorName}".`);
  };

  const createOrder = async (orderType, vendorName, items, totalAmount) => {
    const newOrder = {
      orderType,
      vendorName,
      items,
      totalAmount,
      status: 'Draft',
      createdBy: user ? user.id || user.uid : 'System',
      createdAt: new Date().toISOString().substring(0, 10)
    };

    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'orders'), newOrder);
      } catch (err) {
        console.error("Firestore create order error:", err);
      }
    } else {
      const updated = [{ id: 'ord_' + Date.now(), ...newOrder }, ...orders];
      setOrders(updated);
      syncLocal('baoms_orders', updated);
    }
    logAudit('ORDER_WORKFLOWS', `Drafted ${orderType} order for vendor "${vendorName}" (KES ${totalAmount}).`);
  };

  const updateOrderStatus = async (orderId, status) => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'orders', orderId), { status });
      } catch (err) {
        console.error("Firestore update order status error:", err);
      }
    } else {
      const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
      setOrders(updated);
      syncLocal('baoms_orders', updated);
    }
    logAudit('ORDER_WORKFLOWS', `Updated order "${orderId}" status to "${status}".`);
  };

  // Communications Actions
  const addAnnouncement = async (title, content) => {
    const newAnn = {
      title,
      content,
      authorName: user ? user.personalDetails?.name || user.email : 'System',
      publishedAt: new Date().toISOString().substring(0, 10)
    };

    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'announcements'), newAnn);
      } catch (err) {
        console.error("Firestore add announcement error:", err);
      }
    } else {
      const updated = [{ id: 'an_' + Date.now(), ...newAnn }, ...announcements];
      setAnnouncements(updated);
      syncLocal('baoms_announcements', updated);
    }
    logAudit('ANNOUNCEMENT_PUBLISHER', `Published announcement: "${title}".`);
  };

  const addMediaAsset = async (fileName, url, projectTagId) => {
    const proj = projects.find(p => p.id === projectTagId);
    const newMedia = {
      fileName,
      url,
      projectTagId,
      projectName: proj ? proj.name : 'General',
      uploadedBy: user ? user.personalDetails?.name || user.email : 'System',
      uploadedAt: new Date().toISOString().substring(0, 10)
    };

    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'mediaLibrary'), newMedia);
      } catch (err) {
        console.error("Firestore add media error:", err);
      }
    } else {
      const updated = [{ id: 'med_' + Date.now(), ...newMedia }, ...mediaLibrary];
      setMediaLibrary(updated);
      syncLocal('baoms_media_library', updated);
    }
    logAudit('MEDIA_LIBRARY', `Uploaded media asset "${fileName}" tagged to project "${newMedia.projectName}".`);
  };

  // Field Officer Offline Submission
  const submitOfflineForm = async (gpsLocation, notes, photoName) => {
    const newSub = {
      userName: user ? user.personalDetails?.name || user.email : 'Field Officer',
      gpsLocation,
      photoUrl: photoName || 'offline_capture.jpg',
      activityNotes: notes,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'offlineSubmissions'), newSub);
      } catch (err) {
        console.error("Firestore add offline submission error:", err);
      }
    } else {
      const updated = [{ id: 'off_' + Date.now(), ...newSub }, ...offlineSubmissions];
      setOfflineSubmissions(updated);
      syncLocal('baoms_offline_submissions', updated);
    }
    logAudit('OFFLINE_SUBMISSION', `Synced offline field surveyor report (GPS: ${gpsLocation.latitude}, ${gpsLocation.longitude}).`);
  };

  // Baseline Request Submissions
  const addRequest = async (requestType, reason, extraDetails = {}) => {
    const newReq = {
      userId: user ? user.id || user.uid : 'System',
      userName: user ? user.personalDetails?.name || user.email : 'System',
      department: user?.officeDetails?.department || 'Operations',
      requestType,
      details: { reason, ...extraDetails },
      status: 'pending',
      createdAt: new Date().toISOString().substring(0, 10)
    };

    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'requests'), newReq);
      } catch (err) {
        console.error("Firestore add request error:", err);
      }
    } else {
      const updated = [{ id: 'req_' + Date.now(), ...newReq }, ...requests];
      setRequests(updated);
      syncLocal('baoms_requests', updated);
    }
    logAudit('REQUEST_CENTER', `Submitted request for "${requestType}": "${reason}".`);
  };

  const updateRequestStatus = async (requestId, status) => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'requests', requestId), { status });
      } catch (err) {
        console.error("Firestore update request status error:", err);
      }
    } else {
      const updated = requests.map(r => r.id === requestId ? { ...r, status } : r);
      setRequests(updated);
      syncLocal('baoms_requests', updated);
    }
    logAudit('REQUEST_CENTER', `Request "${requestId}" status updated to "${status}" by HR/Admin.`);
  };

  const addReport = async (reportData) => {
    const newReport = {
      author: reportData.author || user?.name || user?.email || 'Staff Member',
      type: reportData.type || 'Weekly Status Report',
      date: new Date().toISOString().substring(0, 10),
      status: 'Pending Review',
      preview: reportData.preview || ''
    };
    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'reports'), newReport);
      } catch (err) {
        console.error("Firestore add report error:", err);
      }
    } else {
      const updated = [...reports, { id: 'rep_' + Date.now(), ...newReport }];
      setReports(updated);
      syncLocal('baoms_reports', updated);
    }
    logAudit('REPORT_SUBMISSION', `New report "${newReport.type}" submitted by ${newReport.author}.`);
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        projectFiles,
        budgets,
        expenses,
        assetsAndVendors,
        orders,
        announcements,
        mediaLibrary,
        offlineSubmissions,
        requests,
        auditLogs,
        users,
        reports,
        transactions,
        activePreviewDoc,
        setActivePreviewDoc,
        addUser,
        updateUser,
        addProject,
        updateProject,
        deleteProject,
        addTask,
        updateTaskStatus,
        logTaskHours,
        addProjectFile,
        addBudgetLedgerItem,
        addExpense,
        addTransaction,
        updateExpenseStatus,
        addAssetOrVendor,
        createOrder,
        updateOrderStatus,
        addAnnouncement,
        addMediaAsset,
        submitOfflineForm,
        addRequest,
        updateRequestStatus,
        addReport,
        seedLocalSimulation,
        clearDatabase
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
