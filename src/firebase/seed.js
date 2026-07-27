// One-off script to seed initial demo users and projects into Firestore/Auth.
// Run with: npm run seed
//
// This is a Node script (not part of the Vite app bundle), so it reads
// config from process.env rather than import.meta.env. Pass --env-file
// (see the "seed" script in package.json) so .env.local is loaded.
import crypto from "crypto";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

if (!firebaseConfig.projectId) {
  console.error("Missing Firebase config. Run via `npm run seed` so .env.local is loaded.");
  process.exit(1);
}

// This script uses createUserWithEmailAndPassword + client-side Firestore
// writes, which only succeed if Firestore rules currently allow it (they
// don't, by default - see firestore.rules). Seeding a fresh project means
// temporarily relaxing rules; RESTORE THEM IMMEDIATELY after this finishes.
// Never leave "allow read, write: if true" deployed, even briefly, against
// a project already carrying real data.
if (process.env.SEED_CONFIRM !== "yes") {
  console.error(
    "Refusing to run: this writes directly to the LIVE project " +
    `"${firebaseConfig.projectId}". If you're sure, re-run with SEED_CONFIRM=yes.`
  );
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function generatePassword() {
  // 12 random bytes -> 16-char base64url string, printed once below.
  return crypto.randomBytes(12).toString("base64url");
}

const MOCK_USER_DEFS = [
  { id: "admin_uid", email: "admin@oms.com", name: "Alice Administrator", role: "System Administrator",
    personalDetails: { phone: "+255 711 000 111", gender: "Female", location: "Dar es Salaam HQ" },
    officeDetails: { position: "Chief Systems Administrator", department: "Executive", hireDate: "2022-01-10", status: "Active" },
    supportingDocuments: { contract: "Employment_Contract_Alice.pdf", nssf: "NSSF-99887766A", nhif: "NHIF-55443322" },
    permissions: ["manage_users", "role_builder", "system_health", "audit_logs", "view_dashboard"] },
  { id: "director_uid", email: "director@oms.com", name: "David Executive", role: "Executive Director",
    personalDetails: { phone: "+255 722 000 222", gender: "Male", location: "Dar es Salaam HQ" },
    officeDetails: { position: "Executive Director & Secretary to Board", department: "Executive", hireDate: "2020-05-01", status: "Active" },
    supportingDocuments: { contract: "ED_Agreement_David.pdf", nssf: "NSSF-88776655B", nhif: "NHIF-44332211" },
    permissions: ["exec_dashboard", "strategic_approvals", "board_reports", "view_dashboard"] },
  { id: "hr_uid", email: "hr@oms.com", name: "Helen Officer", role: "HR Officer",
    personalDetails: { phone: "+255 733 000 333", gender: "Female", location: "Dar es Salaam HQ" },
    officeDetails: { position: "Senior Talent Acquisition Lead", department: "HR", hireDate: "2023-09-15", status: "Active" },
    supportingDocuments: { contract: "HR_Officer_Contract.pdf", nssf: "NSSF-77665544C", nhif: "NHIF-33221100" },
    permissions: ["staff_onboarding", "staff_status", "leave_pipeline", "manage_users", "view_dashboard"] },
  { id: "pm_uid", email: "pm@oms.com", name: "Paul Manager", role: "Project Manager",
    personalDetails: { phone: "+255 744 000 444", gender: "Male", location: "Mwanza Hub" },
    officeDetails: { position: "Senior Program Manager", department: "Program Management", hireDate: "2024-02-18", status: "Active" },
    supportingDocuments: { contract: "PM_Agreement_Paul.pdf", nssf: "NSSF-66554433D", nhif: "NHIF-22110099" },
    permissions: ["create_project", "manage_project_files", "task_board", "partner_reports", "view_dashboard"] },
  { id: "finance_uid", email: "finance@oms.com", name: "Fiona Ledger", role: "Finance Officer",
    personalDetails: { phone: "+255 755 000 555", gender: "Female", location: "Dar es Salaam HQ" },
    officeDetails: { position: "Chief Financial Accountant", department: "Finance", hireDate: "2021-11-01", status: "Active" },
    supportingDocuments: { contract: "Finance_Contract_Fiona.pdf", nssf: "NSSF-55443322E", nhif: "NHIF-11009988" },
    permissions: ["spreadsheet_ledger", "expense_router", "financial_exporter", "view_dashboard"] },
  { id: "procurement_uid", email: "procurement@oms.com", name: "Peter Logistics", role: "Procurement & Logistics Officer",
    personalDetails: { phone: "+255 766 000 666", gender: "Male", location: "Dar es Salaam Warehouse" },
    officeDetails: { position: "Procurement Specialist", department: "Procurement", hireDate: "2024-06-10", status: "Active" },
    supportingDocuments: { contract: "Logistics_Contract_Peter.pdf", nssf: "NSSF-44332211F", nhif: "NHIF-00998877" },
    permissions: ["asset_register", "order_workflows", "view_dashboard"] },
  { id: "dephead_uid", email: "dephead@oms.com", name: "Diana Head", role: "Department Head",
    personalDetails: { phone: "+255 777 000 777", gender: "Female", location: "Dar es Salaam HQ" },
    officeDetails: { position: "Head of Engineering & Tech Operations", department: "Engineering", hireDate: "2023-01-20", status: "Active" },
    supportingDocuments: { contract: "Dept_Head_Diana.pdf", nssf: "NSSF-33221100G", nhif: "NHIF-99887766" },
    permissions: ["dept_dashboard", "approval_inbox", "view_dashboard", "task_board"] },
  { id: "program_uid", email: "program@oms.com", name: "Philip Officer", role: "Program Officer",
    personalDetails: { phone: "+255 788 000 888", gender: "Male", location: "Dodoma Outpost" },
    officeDetails: { position: "Field Programs Coordinator", department: "Program Management", hireDate: "2022-08-01", status: "Active" },
    supportingDocuments: { contract: "Program_Contract_Philip.pdf", nssf: "NSSF-22110099H", nhif: "NHIF-88776655" },
    permissions: ["task_board", "partner_reports", "view_dashboard"] },
  { id: "comms_uid", email: "comms@oms.com", name: "Clara Media", role: "Communications Officer",
    personalDetails: { phone: "+255 799 000 999", gender: "Female", location: "Dar es Salaam HQ" },
    officeDetails: { position: "Media Liaison & PR Manager", department: "Communications", hireDate: "2025-05-15", status: "Active" },
    supportingDocuments: { contract: "Comms_Contract_Clara.pdf", nssf: "NSSF-11009988I", nhif: "NHIF-77665544" },
    permissions: ["media_uploader", "announcement_portal", "view_dashboard"] },
  { id: "field_uid", email: "field@oms.com", name: "Fred Tracker", role: "Field Officer",
    personalDetails: { phone: "+255 700 111 222", gender: "Male", location: "Zanzibar Field Office" },
    officeDetails: { position: "Field Operations Surveyor", department: "Field Operations", hireDate: "2024-10-01", status: "Active" },
    supportingDocuments: { contract: "Surveyor_Contract_Fred.pdf", nssf: "NSSF-00998877J", nhif: "NHIF-66554433" },
    permissions: ["offline_surveys", "gps_submissions", "view_dashboard"] },
  { id: "volunteer_uid", email: "volunteer@oms.com", name: "Victor Helper", role: "Volunteer",
    personalDetails: { phone: "+255 711 222 333", gender: "Male", location: "Mwanza Hub" },
    officeDetails: { position: "Community Support Volunteer", department: "Program Management", hireDate: "2026-05-10", status: "Active" },
    supportingDocuments: { contract: "Volunteer_Agreement.pdf", nssf: "N/A", nhif: "N/A" },
    permissions: ["simplified_logger", "view_dashboard"] },
  { id: "intern_uid", email: "intern@oms.com", name: "Iris Learner", role: "Intern",
    personalDetails: { phone: "+255 722 333 444", gender: "Female", location: "Dar es Salaam HQ" },
    officeDetails: { position: "Engineering Graduate Intern", department: "Engineering", hireDate: "2026-06-01", status: "Active" },
    supportingDocuments: { contract: "Internship_Agreement_Iris.pdf", nssf: "N/A", nhif: "N/A" },
    permissions: ["simplified_logger", "view_dashboard", "task_board"] }
];

const INITIAL_PROJECTS = [
  {
    name: "Website Redesign",
    description: "Overhaul corporate website design and build single page application layout.",
    status: "In Progress",
    startDate: "2026-06-01",
    endDate: "2026-08-30",
    progress: 60,
    budget: 8500
  },
  {
    name: "ERP Integration",
    description: "Integrate global enterprise resource planning tools with the main system dashboard.",
    status: "Planning",
    startDate: "2026-08-01",
    endDate: "2026-12-15",
    progress: 15,
    budget: 15000
  },
  {
    name: "Security Audit 2026",
    description: "Conduct external penetration testing and internal vulnerability scan.",
    status: "Completed",
    startDate: "2026-05-10",
    endDate: "2026-06-20",
    progress: 100,
    budget: 4200
  }
];

async function seed() {
  const generatedCredentials = [];

  try {
    console.log(`Starting Firebase seeding against project "${firebaseConfig.projectId}"...`);

    for (const u of MOCK_USER_DEFS) {
      const password = generatePassword();
      console.log(`Creating user: ${u.email}...`);
      try {
        const userCred = await createUserWithEmailAndPassword(auth, u.email, password);
        const uid = userCred.user.uid;

        await setDoc(doc(db, "users", uid), {
          email: u.email,
          role: u.role,
          personalDetails: u.personalDetails,
          officeDetails: u.officeDetails,
          supportingDocuments: u.supportingDocuments,
          permissions: u.permissions
        });
        generatedCredentials.push({ email: u.email, password });
        console.log(`Created user & Firestore profile for ${u.name} (UID: ${uid})`);
      } catch (err) {
        if (err.code === "auth/email-already-in-use") {
          console.log(`User ${u.email} already exists in Auth - skipping (password not changed).`);
        } else {
          console.error(`Error creating ${u.email}:`, err.message);
        }
      }
    }

    for (const proj of INITIAL_PROJECTS) {
      const projRef = doc(collection(db, "projects"));
      await setDoc(projRef, proj);
      console.log(`Seeded project: ${proj.name}`);
    }

    console.log("\nFirebase seeding completed.");
    if (generatedCredentials.length > 0) {
      console.log("\n=== GENERATED PASSWORDS (shown once, not stored anywhere) ===");
      for (const { email, password } of generatedCredentials) {
        console.log(`${email}  ${password}`);
      }
      console.log("Save these now and share them securely. Each account should change its password on first login.");
    }
    console.log("\nReminder: restore firestore.rules to their real (non-test-mode) values now if you relaxed them to seed.");
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
