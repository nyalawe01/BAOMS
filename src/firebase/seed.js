import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

// BAOMS Firebase Live Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBaDv0toBJ08vU4q_l-ahx4AUtZhOm-s4Y",
  authDomain: "baoms-3dc26.firebaseapp.com",
  projectId: "baoms-3dc26",
  storageBucket: "baoms-3dc26.firebasestorage.app",
  messagingSenderId: "403394441757",
  appId: "1:403394441757:web:6369429bcb24bd5b2d0cf4",
  measurementId: "G-Q1QSZZZTY6"
};

console.log("Configured Project ID:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const MOCK_USERS = [
  {
    id: "admin_uid",
    email: "admin@oms.com",
    password: "admin123", // Changed to >= 6 chars
    name: "Alice Administrator",
    role: "System Administrator",
    avatar: "",
    personalDetails: { phone: "+254 711 000 111", gender: "Female", location: "Nairobi HQ" },
    officeDetails: { position: "Chief Systems Administrator", department: "Executive", hireDate: "2022-01-10", status: "Active" },
    supportingDocuments: { contract: "Employment_Contract_Alice.pdf", nssf: "NSSF-99887766A", nhif: "NHIF-55443322" },
    permissions: ["manage_users", "role_builder", "system_health", "audit_logs", "view_dashboard"]
  },
  {
    id: "director_uid",
    email: "director@oms.com",
    password: "director123", // Changed to >= 6 chars
    name: "David Executive",
    role: "Executive Director",
    avatar: "",
    personalDetails: { phone: "+254 722 000 222", gender: "Male", location: "Nairobi HQ" },
    officeDetails: { position: "Executive Director & Secretary to Board", department: "Executive", hireDate: "2020-05-01", status: "Active" },
    supportingDocuments: { contract: "ED_Agreement_David.pdf", nssf: "NSSF-88776655B", nhif: "NHIF-44332211" },
    permissions: ["exec_dashboard", "strategic_approvals", "board_reports", "view_dashboard"]
  },
  {
    id: "hr_uid",
    email: "hr@oms.com",
    password: "hr12345", // Changed to >= 6 chars
    name: "Helen Officer",
    role: "HR Officer",
    avatar: "",
    personalDetails: { phone: "+254 733 000 333", gender: "Female", location: "Nairobi HQ" },
    officeDetails: { position: "Senior Talent Acquisition Lead", department: "HR", hireDate: "2023-09-15", status: "Active" },
    supportingDocuments: { contract: "HR_Officer_Contract.pdf", nssf: "NSSF-77665544C", nhif: "NHIF-33221100" },
    permissions: ["staff_onboarding", "staff_status", "leave_pipeline", "manage_users", "view_dashboard"]
  },
  {
    id: "pm_uid",
    email: "pm@oms.com",
    password: "pm12345", // Changed to >= 6 chars
    name: "Paul Manager",
    role: "Project Manager",
    avatar: "",
    personalDetails: { phone: "+254 744 000 444", gender: "Male", location: "Kisumu Hub" },
    officeDetails: { position: "Senior Program Manager", department: "Program Management", hireDate: "2024-02-18", status: "Active" },
    supportingDocuments: { contract: "PM_Agreement_Paul.pdf", nssf: "NSSF-66554433D", nhif: "NHIF-22110099" },
    permissions: ["create_project", "manage_project_files", "task_board", "partner_reports", "view_dashboard"]
  },
  {
    id: "finance_uid",
    email: "finance@oms.com",
    password: "finance123", // Changed to >= 6 chars
    name: "Fiona Ledger",
    role: "Finance Officer",
    avatar: "",
    personalDetails: { phone: "+254 755 000 555", gender: "Female", location: "Nairobi HQ" },
    officeDetails: { position: "Chief Financial Accountant", department: "Finance", hireDate: "2021-11-01", status: "Active" },
    supportingDocuments: { contract: "Finance_Contract_Fiona.pdf", nssf: "NSSF-55443322E", nhif: "NHIF-11009988" },
    permissions: ["spreadsheet_ledger", "expense_router", "financial_exporter", "view_dashboard"]
  },
  {
    id: "procurement_uid",
    email: "procurement@oms.com",
    password: "procure123", // Changed to >= 6 chars
    name: "Peter Logistics",
    role: "Procurement & Logistics Officer",
    avatar: "",
    personalDetails: { phone: "+254 766 000 666", gender: "Male", location: "Nairobi Warehouse" },
    officeDetails: { position: "Procurement Specialist", department: "Procurement", hireDate: "2024-06-10", status: "Active" },
    supportingDocuments: { contract: "Logistics_Contract_Peter.pdf", nssf: "NSSF-44332211F", nhif: "NHIF-00998877" },
    permissions: ["asset_register", "order_workflows", "view_dashboard"]
  },
  {
    id: "dephead_uid",
    email: "dephead@oms.com",
    password: "dephead123", // Changed to >= 6 chars
    name: "Diana Head",
    role: "Department Head",
    avatar: "",
    personalDetails: { phone: "+254 777 000 777", gender: "Female", location: "Nairobi HQ" },
    officeDetails: { position: "Head of Engineering & Tech Operations", department: "Engineering", hireDate: "2023-01-20", status: "Active" },
    supportingDocuments: { contract: "Dept_Head_Diana.pdf", nssf: "NSSF-33221100G", nhif: "NHIF-99887766" },
    permissions: ["dept_dashboard", "approval_inbox", "view_dashboard", "task_board"]
  },
  {
    id: "program_uid",
    email: "program@oms.com",
    password: "program123", // Changed to >= 6 chars
    name: "Philip Officer",
    role: "Program Officer",
    avatar: "",
    personalDetails: { phone: "+254 788 000 888", gender: "Male", location: "Garissa Outpost" },
    officeDetails: { position: "Field Programs Coordinator", department: "Program Management", hireDate: "2022-08-01", status: "Active" },
    supportingDocuments: { contract: "Program_Contract_Philip.pdf", nssf: "NSSF-22110099H", nhif: "NHIF-88776655" },
    permissions: ["task_board", "partner_reports", "view_dashboard"]
  },
  {
    id: "comms_uid",
    email: "comms@oms.com",
    password: "comms123", // Changed to >= 6 chars
    name: "Clara Media",
    role: "Communications Officer",
    avatar: "",
    personalDetails: { phone: "+254 799 000 999", gender: "Female", location: "Nairobi HQ" },
    officeDetails: { position: "Media Liaison & PR Manager", department: "Communications", hireDate: "2025-05-15", status: "Active" },
    supportingDocuments: { contract: "Comms_Contract_Clara.pdf", nssf: "NSSF-11009988I", nhif: "NHIF-77665544" },
    permissions: ["media_uploader", "announcement_portal", "view_dashboard"]
  },
  {
    id: "field_uid",
    email: "field@oms.com",
    password: "field123", // Changed to >= 6 chars
    name: "Fred Tracker",
    role: "Field Officer",
    avatar: "",
    personalDetails: { phone: "+254 700 111 222", gender: "Male", location: "Mombasa Field Office" },
    officeDetails: { position: "Field Operations Surveyor", department: "Field Operations", hireDate: "2024-10-01", status: "Active" },
    supportingDocuments: { contract: "Surveyor_Contract_Fred.pdf", nssf: "NSSF-00998877J", nhif: "NHIF-66554433" },
    permissions: ["offline_surveys", "gps_submissions", "view_dashboard"]
  },
  {
    id: "volunteer_uid",
    email: "volunteer@oms.com",
    password: "volunteer123", // Changed to >= 6 chars
    name: "Victor Helper",
    role: "Volunteer",
    avatar: "",
    personalDetails: { phone: "+254 711 222 333", gender: "Male", location: "Kisumu Hub" },
    officeDetails: { position: "Community Support Volunteer", department: "Program Management", hireDate: "2026-05-10", status: "Active" },
    supportingDocuments: { contract: "Volunteer_Agreement.pdf", nssf: "N/A", nhif: "N/A" },
    permissions: ["simplified_logger", "view_dashboard"]
  },
  {
    id: "intern_uid",
    email: "intern@oms.com",
    password: "intern123", // Changed to >= 6 chars
    name: "Iris Learner",
    role: "Intern",
    avatar: "",
    personalDetails: { phone: "+254 722 333 444", gender: "Female", location: "Nairobi HQ" },
    officeDetails: { position: "Engineering Graduate Intern", department: "Engineering", hireDate: "2026-06-01", status: "Active" },
    supportingDocuments: { contract: "Internship_Agreement_Iris.pdf", nssf: "N/A", nhif: "N/A" },
    permissions: ["simplified_logger", "view_dashboard", "task_board"]
  }
];

const INITIAL_PROJECTS = [
  {
    name: 'Website Redesign',
    description: 'Overhaul corporate website design and build single page application layout.',
    status: 'In Progress',
    startDate: '2026-06-01',
    endDate: '2026-08-30',
    progress: 60,
    budget: 8500
  },
  {
    name: 'ERP Integration',
    description: 'Integrate global enterprise resource planning tools with the main system dashboard.',
    status: 'Planning',
    startDate: '2026-08-01',
    endDate: '2026-12-15',
    progress: 15,
    budget: 15000
  },
  {
    name: 'Security Audit 2026',
    description: 'Conduct external penetration testing and internal vulnerability scan.',
    status: 'Completed',
    startDate: '2026-05-10',
    endDate: '2026-06-20',
    progress: 100,
    budget: 4200
  }
];

async function seed() {
  try {
    console.log("Starting Firebase database seeding...");
    console.log("IMPORTANT: Ensure your Firestore Security Rules are temporarily set to test-mode (allow read, write: if true;) so the seeding script has permissions to populate the initial documents.");

    // 1. Create Mock Users in Firebase Auth and Firestore
    for (const u of MOCK_USERS) {
      console.log(`Creating user: ${u.email}...`);
      try {
        const userCred = await createUserWithEmailAndPassword(auth, u.email, u.password);
        const uid = userCred.user.uid;

        // Write profile details to Firestore
        await setDoc(doc(db, "users", uid), {
          email: u.email,
          role: u.role,
          personalDetails: u.personalDetails,
          officeDetails: u.officeDetails,
          supportingDocuments: u.supportingDocuments,
          permissions: u.permissions
        });
        console.log(`Successfully created user & Firestore profile for ${u.name} (UID: ${uid})`);
      } catch (err) {
        if (err.code === "auth/email-already-in-use") {
          console.log(`User ${u.email} already exists in Auth. Updating profile document in Firestore.`);
          // If already exists, write fallback doc using a default UID or look up
        } else {
          console.error(`Error creating ${u.email}:`, err.message);
        }
      }
    }

    // 2. Create Initial Projects
    for (const proj of INITIAL_PROJECTS) {
      const projRef = doc(collection(db, "projects"));
      await setDoc(projRef, proj);
      console.log(`Seeded project: ${proj.name}`);
    }

    console.log("Firebase seeding completed successfully!");
  } catch (err) {
    console.error("Seeding failed:", err);
  }
}

seed();
