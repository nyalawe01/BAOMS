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
  onSnapshot,
  runTransaction,
  query,
  orderBy,
  limit,
  where
} from 'firebase/firestore';

// Safety cap for collections with no pagination UI yet - without this, a
// collection that grows into the tens of thousands of documents would sync
// its entire history to every client on every load. This is a stopgap, not
// real pagination (no "load more" / page controls exist yet).
const RECENT_DOCS_LIMIT = 500;

// Default permission set per role, applied when a new user is onboarded and
// no explicit permissions are supplied. Without this, addUser left
// `permissions` unset entirely, so hasPermission() (used to gate Add
// Project/Add Task/etc. in ProjectManagement.jsx) was always false for
// every onboarded user regardless of role.
const ROLE_PERMISSIONS = {
  'System Administrator': ['manage_users', 'role_builder', 'system_health', 'audit_logs', 'view_dashboard'],
  'Executive Director': ['exec_dashboard', 'strategic_approvals', 'board_reports', 'view_dashboard'],
  'HR Officer': ['staff_onboarding', 'staff_status', 'leave_pipeline', 'manage_users', 'view_dashboard'],
  'Project Manager': ['create_project', 'manage_projects', 'manage_project_files', 'assign_tasks', 'update_task_status', 'task_board', 'partner_reports', 'view_dashboard'],
  'Finance Officer': ['spreadsheet_ledger', 'expense_router', 'financial_exporter', 'view_dashboard'],
  'Procurement & Logistics Officer': ['asset_register', 'order_workflows', 'view_dashboard'],
  'Department Head': ['dept_dashboard', 'approval_inbox', 'view_dashboard', 'task_board'],
  'Program Officer': ['task_board', 'partner_reports', 'update_task_status', 'view_dashboard'],
  'Communications Officer': ['media_uploader', 'announcement_portal', 'view_dashboard'],
  'Field Officer': ['offline_surveys', 'gps_submissions', 'view_dashboard'],
  'Volunteer': ['simplified_logger', 'view_dashboard'],
  'Intern': ['simplified_logger', 'view_dashboard', 'task_board'],
  'M&E Officer': ['view_dashboard'],
  'Monitoring & Evaluation Officer': ['view_dashboard']
};

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
  const [indicators, setIndicators] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [fieldVisits, setFieldVisits] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [events, setEvents] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [orgSettings, setOrgSettings] = useState({
    expenseApprovalThreshold: 500000,
    procurementApprovalThreshold: 500000,
    budgetApprovalThreshold: 1000000
  });
  const [activePreviewDoc, setActivePreviewDoc] = useState(null);
  const [clientIp, setClientIp] = useState('');

  // Best-effort client IP for audit logs - fetched once per session via a
  // public lookup (there's no backend here to read the request IP directly).
  useEffect(() => {
    let cancelled = false;
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => { if (!cancelled && data?.ip) setClientIp(data.ip); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // 1. Firebase Mode: Real-time sync with Firestore snapshots
  useEffect(() => {
    if (!isFirebaseConfigured || !user) return;

    console.log("BAOMS: Fetching real-time records from Firestore database...");
    
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => !d.deletedAt));
    }, (err) => console.warn("Firestore projects read permission denied:", err));
    const unsubFiles = onSnapshot(query(collection(db, 'projectFiles'), orderBy('uploadedAt', 'desc'), limit(RECENT_DOCS_LIMIT)), (snap) => {
      setProjectFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore projectFiles read permission denied:", err));
    const unsubBudgets = onSnapshot(collection(db, 'budgets'), (snap) => {
      setBudgets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore budgets read permission denied:", err));
    const unsubExpenses = onSnapshot(query(collection(db, 'expenses'), orderBy('createdAt', 'desc'), limit(RECENT_DOCS_LIMIT)), (snap) => {
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
    const unsubOffline = onSnapshot(query(collection(db, 'offlineSubmissions'), orderBy('submittedAt', 'desc'), limit(RECENT_DOCS_LIMIT)), (snap) => {
      setOfflineSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore offlineSubmissions read permission denied:", err));
    const unsubRequests = onSnapshot(collection(db, 'requests'), (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore requests read permission denied:", err));
    const unsubAudits = onSnapshot(query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(RECENT_DOCS_LIMIT)), (snap) => {
      setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore auditLogs read permission denied:", err));
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => !d.deletedAt));
    }, (err) => console.warn("Firestore users read permission denied:", err));
    const unsubReports = onSnapshot(collection(db, 'reports'), (snap) => {
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore reports read permission denied:", err));
    const unsubTx = onSnapshot(query(collection(db, 'transactions'), orderBy('date', 'desc'), limit(RECENT_DOCS_LIMIT)), (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore transactions read permission denied:", err));
    const unsubIndicators = onSnapshot(collection(db, 'indicators'), (snap) => {
      setIndicators(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => !d.deletedAt));
    }, (err) => console.warn("Firestore indicators read permission denied:", err));
    const unsubBeneficiaries = onSnapshot(collection(db, 'beneficiaries'), (snap) => {
      setBeneficiaries(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => !d.deletedAt));
    }, (err) => console.warn("Firestore beneficiaries read permission denied:", err));
    const unsubFieldVisits = onSnapshot(query(collection(db, 'fieldVisits'), orderBy('visitDate', 'desc'), limit(RECENT_DOCS_LIMIT)), (snap) => {
      setFieldVisits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("Firestore fieldVisits read permission denied:", err));
    const unsubSurveys = onSnapshot(collection(db, 'surveys'), (snap) => {
      setSurveys(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => !d.deletedAt));
    }, (err) => console.warn("Firestore surveys read permission denied:", err));
    const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => !d.deletedAt));
    }, (err) => console.warn("Firestore events read permission denied:", err));
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => !d.deletedAt));
    }, (err) => console.warn("Firestore invoices read permission denied:", err));
    const unsubNotifications = onSnapshot(
      query(collection(db, 'notifications'), where('userId', '==', user.id || user.uid), orderBy('createdAt', 'desc'), limit(100)),
      (snap) => {
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => console.warn("Firestore notifications read permission denied:", err)
    );
    const unsubOrgSettings = onSnapshot(doc(db, 'orgSettings', 'general'), (snap) => {
      if (snap.exists()) setOrgSettings(prev => ({ ...prev, ...snap.data() }));
    }, (err) => console.warn("Firestore orgSettings read permission denied:", err));

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
      unsubIndicators();
      unsubBeneficiaries();
      unsubFieldVisits();
      unsubSurveys();
      unsubEvents();
      unsubInvoices();
      unsubNotifications();
      unsubOrgSettings();
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
    setIndicators(JSON.parse(localStorage.getItem('baoms_indicators') || '[]'));
    setBeneficiaries(JSON.parse(localStorage.getItem('baoms_beneficiaries') || '[]'));
    setFieldVisits(JSON.parse(localStorage.getItem('baoms_field_visits') || '[]'));
    setSurveys(JSON.parse(localStorage.getItem('baoms_surveys') || '[]'));
    setEvents(JSON.parse(localStorage.getItem('baoms_events') || '[]'));
    setInvoices(JSON.parse(localStorage.getItem('baoms_invoices') || '[]'));
    setNotifications(JSON.parse(localStorage.getItem('baoms_notifications') || '[]'));
    const savedSettings = localStorage.getItem('baoms_org_settings');
    if (savedSettings) setOrgSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
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
    setIndicators([]);
    setBeneficiaries([]);
    setFieldVisits([]);
    setSurveys([]);
    setEvents([]);
    setInvoices([]);
    setNotifications([]);

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
    localStorage.setItem('baoms_indicators', '[]');
    localStorage.setItem('baoms_beneficiaries', '[]');
    localStorage.setItem('baoms_field_visits', '[]');
    localStorage.setItem('baoms_surveys', '[]');
    localStorage.setItem('baoms_events', '[]');
    localStorage.setItem('baoms_invoices', '[]');
    localStorage.setItem('baoms_notifications', '[]');
  };

  // Helper to log audit actions
  const logAudit = async (actionType, description) => {
    const newLog = {
      userName: user ? user.personalDetails?.name || user.email : 'System',
      userRole: user ? user.role : 'System',
      actionType,
      description,
      ipAddress: clientIp || 'unknown',
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
      permissions: userData.permissions || ROLE_PERMISSIONS[userData.role] || ['view_dashboard'],
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

  const deleteUser = async (userId) => {
    const targetUser = users.find(u => u.id === userId);
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'users', userId), { deletedAt: new Date().toISOString() });
      } catch (err) {
        console.error("Firestore delete user error:", err);
      }
    } else {
      const updated = users.filter(u => u.id !== userId);
      setUsers(updated);
      syncLocal('baoms_users', updated);
    }
    logAudit('USER_MANAGEMENT', `Removed directory profile for "${targetUser ? targetUser.name : userId}".`);
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

    logAudit('PROJECT_CREATION', `Initialized project portfolio: "${newProj.name}" with budget limit TZS ${newProj.budget}.`);
  };

  const deleteProject = async (projectId) => {
    const proj = projects.find(p => p.id === projectId);
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'projects', projectId), { deletedAt: new Date().toISOString() });
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
    logAudit('BUDGET_ENTRY', `Allocated ledger item "${description}" under category "${category}" (TZS ${amount}).`);
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
    logAudit('EXPENSE_ROUTING', `Submitted expense claim of TZS ${amount} for project "${newExpense.projectName}".`);
    notifyRoles(
      ['Department Head', 'Finance Officer', 'Executive Director'],
      `New expense claim of TZS ${Number(amount).toLocaleString()} submitted by ${newExpense.submittedByName} for "${newExpense.projectName}".`,
      'expense_pending',
      'fin_approvals'
    );
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
    logAudit('TRANSACTION_LOG', `Logged ${newTx.type} transaction of TZS ${newTx.amount} (Ref: ${newTx.ref}).`);
  };

  const updateExpenseStatus = async (expenseId, status, approverNotes = '') => {
    const ex = expenses.find(e => e.id === expenseId);
    if (!ex) return;

    if (isFirebaseConfigured) {
      try {
        // Runs as a single atomic transaction so the expense status, the
        // budget's spent total, and the resulting ledger transaction can't
        // drift out of sync under concurrent approvals - previously these
        // were three separate writes. Also guards against double-counting
        // if the same expense is approved twice (e.g. a duplicate click).
        await runTransaction(db, async (transaction) => {
          const expenseRef = doc(db, 'expenses', expenseId);
          const expenseSnap = await transaction.get(expenseRef);
          if (!expenseSnap.exists()) return;
          const alreadyApplied = expenseSnap.data().status === 'Approved';

          transaction.update(expenseRef, { status });

          if (status === 'Approved' && !alreadyApplied) {
            const b = budgets.find(bu => bu.projectId === ex.projectId);
            if (b) {
              const budgetRef = doc(db, 'budgets', b.id);
              const budgetSnap = await transaction.get(budgetRef);
              if (budgetSnap.exists()) {
                const updatedItems = (budgetSnap.data().items || []).map((item, index) => {
                  if (index === 0 || item.description.toLowerCase().includes(ex.description.toLowerCase())) {
                    return { ...item, spent: item.spent + ex.amount };
                  }
                  return item;
                });
                transaction.update(budgetRef, { items: updatedItems });
              }
            }

            const txRef = doc(collection(db, 'transactions'));
            transaction.set(txRef, {
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
        });
      } catch (err) {
        console.error("Firestore update expense status error:", err);
      }
    } else {
      const alreadyApplied = ex.status === 'Approved';
      const updatedExpenses = expenses.map(e => e.id === expenseId ? { ...e, status } : e);
      setExpenses(updatedExpenses);
      syncLocal('baoms_expenses', updatedExpenses);

      if (status === 'Approved' && !alreadyApplied) {
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
    if (ex.submittedBy) {
      addNotification(
        ex.submittedBy,
        `Your expense claim "${ex.description}" (TZS ${ex.amount?.toLocaleString()}) was ${status.toLowerCase()}.`,
        status === 'Approved' ? 'expense_approved' : 'expense_rejected',
        'fin_expenses'
      );
    }
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

  const updateAssetOrVendor = async (registerId, updatedDetails) => {
    const item = assetsAndVendors.find(a => a.id === registerId);
    const mergedDetails = { ...(item ? item.details : {}), ...updatedDetails };

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'assetsAndVendors', registerId), {
          details: mergedDetails,
          lastUpdatedBy: user ? user.personalDetails?.name || user.email : 'System',
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Firestore update asset/vendor error:", err);
      }
    } else {
      const updated = assetsAndVendors.map(a => a.id === registerId ? {
        ...a,
        details: mergedDetails,
        lastUpdatedBy: user ? user.personalDetails?.name || user.email : 'System',
        updatedAt: new Date().toISOString()
      } : a);
      setAssetsAndVendors(updated);
      syncLocal('baoms_assets_vendors', updated);
    }
    logAudit('ASSET_VENDOR_REGISTER', `Updated register "${item ? (item.details.name || item.details.vendorName) : registerId}".`);
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
    logAudit('ORDER_WORKFLOWS', `Drafted ${orderType} order for vendor "${vendorName}" (TZS ${totalAmount}).`);
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
  const addAnnouncement = async (title, content, targetDepartment = 'All') => {
    const newAnn = {
      title,
      content,
      targetDepartment,
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
    const recipients = targetDepartment && targetDepartment !== 'All'
      ? users.filter(u => u.officeDetails?.department === targetDepartment || u.department === targetDepartment)
      : users;
    recipients.forEach(u => addNotification(u.id, `New announcement: "${title}"`, 'announcement', 'overview'));
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
    const approverRoles = requestType === 'Asset Request'
      ? ['Procurement & Logistics Officer', 'System Administrator']
      : ['HR Officer', 'System Administrator'];
    notifyRoles(
      approverRoles,
      `New ${requestType} request from ${newReq.userName}.`,
      'request_pending',
      'hr_requests'
    );
  };

  const updateRequestStatus = async (requestId, status) => {
    const req = requests.find(r => r.id === requestId);
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
    if (req?.userId) {
      addNotification(
        req.userId,
        `Your ${req.requestType} request was ${status}.`,
        status === 'approved' ? 'request_approved' : 'request_rejected',
        'request'
      );
    }
  };

  const addReport = async (reportData) => {
    const newReport = {
      authorId: user ? (user.id || user.uid) : '',
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

  // M&E Indicators (also used for targets)
  const addIndicator = async (data) => {
    const newIndicator = {
      name: data.name,
      description: data.description || '',
      target: parseFloat(data.target) || 0,
      achieved: parseFloat(data.achieved) || 0,
      unit: data.unit || '',
      projectId: data.projectId || ''
    };
    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'indicators'), newIndicator);
      } catch (err) {
        console.error("Firestore add indicator error:", err);
      }
    } else {
      const updated = [{ id: 'ind_' + Date.now(), ...newIndicator }, ...indicators];
      setIndicators(updated);
      syncLocal('baoms_indicators', updated);
    }
    logAudit('ME_INDICATORS', `Registered indicator "${newIndicator.name}" (target: ${newIndicator.target} ${newIndicator.unit}).`);
  };

  const updateIndicator = async (indicatorId, updatedData) => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'indicators', indicatorId), updatedData);
      } catch (err) {
        console.error("Firestore update indicator error:", err);
      }
    } else {
      const updated = indicators.map(i => i.id === indicatorId ? { ...i, ...updatedData } : i);
      setIndicators(updated);
      syncLocal('baoms_indicators', updated);
    }
    logAudit('ME_INDICATORS', `Updated indicator "${indicatorId}".`);
  };

  const deleteIndicator = async (indicatorId) => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'indicators', indicatorId), { deletedAt: new Date().toISOString() });
      } catch (err) {
        console.error("Firestore delete indicator error:", err);
      }
    } else {
      const updated = indicators.filter(i => i.id !== indicatorId);
      setIndicators(updated);
      syncLocal('baoms_indicators', updated);
    }
    logAudit('ME_INDICATORS', `Removed indicator "${indicatorId}".`);
  };

  // Beneficiaries (shared by M&E and Admin views)
  const addBeneficiary = async (data) => {
    const newBeneficiary = {
      name: data.name,
      gender: data.gender || '',
      age: data.age || '',
      location: data.location || '',
      category: data.category || '',
      projectId: data.projectId || '',
      enrollmentDate: data.enrollmentDate || new Date().toISOString().substring(0, 10),
      consentGiven: data.consentGiven || false,
      consentDate: data.consentDate || '',
      status: 'Pending Verification'
    };
    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'beneficiaries'), newBeneficiary);
      } catch (err) {
        console.error("Firestore add beneficiary error:", err);
      }
    } else {
      const updated = [{ id: 'ben_' + Date.now(), ...newBeneficiary }, ...beneficiaries];
      setBeneficiaries(updated);
      syncLocal('baoms_beneficiaries', updated);
    }
    logAudit('BENEFICIARY_ENROLLMENT', `Enrolled beneficiary "${newBeneficiary.name}" (pending M&E verification).`);
    notifyRoles(
      ['M&E Officer', 'Monitoring & Evaluation Officer'],
      `New beneficiary "${newBeneficiary.name}" awaiting verification.`,
      'beneficiary_pending',
      'me_beneficiaries'
    );
  };

  const updateBeneficiary = async (beneficiaryId, updatedData) => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'beneficiaries', beneficiaryId), updatedData);
      } catch (err) {
        console.error("Firestore update beneficiary error:", err);
      }
    } else {
      const updated = beneficiaries.map(b => b.id === beneficiaryId ? { ...b, ...updatedData } : b);
      setBeneficiaries(updated);
      syncLocal('baoms_beneficiaries', updated);
    }
    logAudit('BENEFICIARY_ENROLLMENT', `Updated beneficiary record "${beneficiaryId}".`);
  };

  const deleteBeneficiary = async (beneficiaryId) => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'beneficiaries', beneficiaryId), { deletedAt: new Date().toISOString() });
      } catch (err) {
        console.error("Firestore delete beneficiary error:", err);
      }
    } else {
      const updated = beneficiaries.filter(b => b.id !== beneficiaryId);
      setBeneficiaries(updated);
      syncLocal('baoms_beneficiaries', updated);
    }
    logAudit('BENEFICIARY_ENROLLMENT', `Removed beneficiary record "${beneficiaryId}".`);
  };

  // Field Visits (data collection logs, field visit records, GIS points; quality review via status)
  const addFieldVisit = async (data) => {
    const newVisit = {
      gpsLocation: data.gpsLocation || { latitude: 0, longitude: 0 },
      notes: data.notes || '',
      visitDate: data.visitDate || new Date().toISOString().substring(0, 10),
      projectId: data.projectId || '',
      officerName: user ? user.personalDetails?.name || user.email : 'Field Officer',
      officerId: user ? user.id || user.uid : 'System',
      status: 'Pending Review'
    };
    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'fieldVisits'), newVisit);
      } catch (err) {
        console.error("Firestore add field visit error:", err);
      }
    } else {
      const updated = [{ id: 'fv_' + Date.now(), ...newVisit }, ...fieldVisits];
      setFieldVisits(updated);
      syncLocal('baoms_field_visits', updated);
    }
    logAudit('FIELD_DATA_COLLECTION', `Logged field visit (GPS: ${newVisit.gpsLocation.latitude}, ${newVisit.gpsLocation.longitude}).`);
  };

  const updateFieldVisit = async (visitId, updatedData) => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'fieldVisits', visitId), updatedData);
      } catch (err) {
        console.error("Firestore update field visit error:", err);
      }
    } else {
      const updated = fieldVisits.map(v => v.id === visitId ? { ...v, ...updatedData } : v);
      setFieldVisits(updated);
      syncLocal('baoms_field_visits', updated);
    }
    logAudit('FIELD_DATA_COLLECTION', `Updated field visit record "${visitId}".`);
  };

  // Surveys
  const addSurvey = async (data) => {
    const newSurvey = {
      title: data.title,
      questions: data.questions || [],
      projectId: data.projectId || '',
      createdBy: user ? user.personalDetails?.name || user.email : 'System',
      createdAt: new Date().toISOString().substring(0, 10)
    };
    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'surveys'), newSurvey);
      } catch (err) {
        console.error("Firestore add survey error:", err);
      }
    } else {
      const updated = [{ id: 'srv_' + Date.now(), ...newSurvey }, ...surveys];
      setSurveys(updated);
      syncLocal('baoms_surveys', updated);
    }
    logAudit('ME_SURVEYS', `Created survey "${newSurvey.title}".`);
  };

  const updateSurvey = async (surveyId, updatedData) => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'surveys', surveyId), updatedData);
      } catch (err) {
        console.error("Firestore update survey error:", err);
      }
    } else {
      const updated = surveys.map(s => s.id === surveyId ? { ...s, ...updatedData } : s);
      setSurveys(updated);
      syncLocal('baoms_surveys', updated);
    }
    logAudit('ME_SURVEYS', `Updated survey "${surveyId}".`);
  };

  const deleteSurvey = async (surveyId) => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'surveys', surveyId), { deletedAt: new Date().toISOString() });
      } catch (err) {
        console.error("Firestore delete survey error:", err);
      }
    } else {
      const updated = surveys.filter(s => s.id !== surveyId);
      setSurveys(updated);
      syncLocal('baoms_surveys', updated);
    }
    logAudit('ME_SURVEYS', `Removed survey "${surveyId}".`);
  };

  // Organization Events
  const addEvent = async (data) => {
    const newEvent = {
      title: data.title,
      date: data.date,
      location: data.location || '',
      description: data.description || ''
    };
    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'events'), newEvent);
      } catch (err) {
        console.error("Firestore add event error:", err);
      }
    } else {
      const updated = [{ id: 'evt_' + Date.now(), ...newEvent }, ...events];
      setEvents(updated);
      syncLocal('baoms_events', updated);
    }
    logAudit('ORG_EVENTS', `Scheduled event "${newEvent.title}" on ${newEvent.date}.`);
  };

  const updateEvent = async (eventId, updatedData) => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'events', eventId), updatedData);
      } catch (err) {
        console.error("Firestore update event error:", err);
      }
    } else {
      const updated = events.map(e => e.id === eventId ? { ...e, ...updatedData } : e);
      setEvents(updated);
      syncLocal('baoms_events', updated);
    }
    logAudit('ORG_EVENTS', `Updated event "${eventId}".`);
  };

  const deleteEvent = async (eventId) => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'events', eventId), { deletedAt: new Date().toISOString() });
      } catch (err) {
        console.error("Firestore delete event error:", err);
      }
    } else {
      const updated = events.filter(e => e.id !== eventId);
      setEvents(updated);
      syncLocal('baoms_events', updated);
    }
    logAudit('ORG_EVENTS', `Removed event "${eventId}".`);
  };

  // Invoices
  const addInvoice = async (data) => {
    const newInvoice = {
      invoiceNumber: data.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      clientName: data.clientName,
      projectId: data.projectId || '',
      amount: parseFloat(data.amount) || 0,
      issuedDate: data.issuedDate || new Date().toISOString().substring(0, 10),
      dueDate: data.dueDate || '',
      status: 'Unpaid'
    };
    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'invoices'), newInvoice);
      } catch (err) {
        console.error("Firestore add invoice error:", err);
      }
    } else {
      const updated = [{ id: 'inv_' + Date.now(), ...newInvoice }, ...invoices];
      setInvoices(updated);
      syncLocal('baoms_invoices', updated);
    }
    logAudit('FINANCE_INVOICES', `Issued invoice "${newInvoice.invoiceNumber}" to "${newInvoice.clientName}" (TZS ${newInvoice.amount}).`);
  };

  const updateInvoiceStatus = async (invoiceId, status) => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'invoices', invoiceId), { status });
      } catch (err) {
        console.error("Firestore update invoice status error:", err);
      }
    } else {
      const updated = invoices.map(i => i.id === invoiceId ? { ...i, status } : i);
      setInvoices(updated);
      syncLocal('baoms_invoices', updated);
    }
    logAudit('FINANCE_INVOICES', `Invoice "${invoiceId}" marked as "${status}".`);
  };

  const deleteInvoice = async (invoiceId) => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'invoices', invoiceId), { deletedAt: new Date().toISOString() });
      } catch (err) {
        console.error("Firestore delete invoice error:", err);
      }
    } else {
      const updated = invoices.filter(i => i.id !== invoiceId);
      setInvoices(updated);
      syncLocal('baoms_invoices', updated);
    }
    logAudit('FINANCE_INVOICES', `Voided invoice "${invoiceId}".`);
  };

  // Notifications
  const addNotification = async (targetUserId, message, type = 'general', link = '') => {
    if (!targetUserId) return;
    const newNotification = {
      userId: targetUserId,
      message,
      type,
      link,
      read: false,
      createdAt: new Date().toISOString()
    };
    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'notifications'), newNotification);
      } catch (err) {
        console.error("Firestore add notification error:", err);
      }
    } else if (user && (user.id || user.uid) === targetUserId) {
      // Local fallback mode only has visibility into the current user's own
      // notifications (there's no cross-user storage without a real backend).
      const updated = [{ id: 'notif_' + Date.now() + Math.random().toString(36).slice(2), ...newNotification }, ...notifications];
      setNotifications(updated);
      syncLocal('baoms_notifications', updated);
    }
  };

  // Notify every user holding one of the given roles (used for "who should
  // hear about this" fan-out, e.g. a new expense claim notifying approvers).
  const notifyRoles = (roles, message, type = 'general', link = '') => {
    const roleList = Array.isArray(roles) ? roles : [roles];
    users
      .filter(u => roleList.includes(u.role))
      .forEach(u => addNotification(u.id, message, type, link));
  };

  const markNotificationRead = async (notificationId) => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'notifications', notificationId), { read: true });
      } catch (err) {
        console.error("Firestore mark notification read error:", err);
      }
    } else {
      const updated = notifications.map(n => n.id === notificationId ? { ...n, read: true } : n);
      setNotifications(updated);
      syncLocal('baoms_notifications', updated);
    }
  };

  const markAllNotificationsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (isFirebaseConfigured) {
      await Promise.all(unread.map(n =>
        updateDoc(doc(db, 'notifications', n.id), { read: true }).catch(err =>
          console.error("Firestore mark notification read error:", err))
      ));
    } else {
      const updated = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updated);
      syncLocal('baoms_notifications', updated);
    }
  };

  // Org Settings (approval thresholds, etc.)
  const updateOrgSettings = async (data) => {
    const updated = { ...orgSettings, ...data };
    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'orgSettings', 'general'), updated, { merge: true });
      } catch (err) {
        console.error("Firestore update org settings error:", err);
      }
    } else {
      setOrgSettings(updated);
      localStorage.setItem('baoms_org_settings', JSON.stringify(updated));
    }
    logAudit('ORG_SETTINGS', `Updated organization settings.`);
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
        indicators,
        beneficiaries,
        fieldVisits,
        surveys,
        events,
        invoices,
        notifications,
        orgSettings,
        activePreviewDoc,
        setActivePreviewDoc,
        addUser,
        updateUser,
        deleteUser,
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
        updateAssetOrVendor,
        createOrder,
        updateOrderStatus,
        addAnnouncement,
        addMediaAsset,
        submitOfflineForm,
        addRequest,
        updateRequestStatus,
        addReport,
        addIndicator,
        updateIndicator,
        deleteIndicator,
        addBeneficiary,
        updateBeneficiary,
        deleteBeneficiary,
        addFieldVisit,
        updateFieldVisit,
        addSurvey,
        updateSurvey,
        deleteSurvey,
        addEvent,
        updateEvent,
        deleteEvent,
        addInvoice,
        updateInvoiceStatus,
        deleteInvoice,
        addNotification,
        notifyRoles,
        markNotificationRead,
        markAllNotificationsRead,
        updateOrgSettings,
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
