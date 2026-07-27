/**
 * OMS Database Schema & Firestore Document Structures
 * 
 * This module defines the schemas, subcollections, relations, and index optimization 
 * patterns for the Firebase Firestore backend matching the 12 strict user roles.
 */

export const DATABASE_SCHEMA = {
  /**
   * 1. USERS COLLECTION
   * Document ID: User UID (Firebase Auth UID)
   */
  users: {
    uid: "string (Document ID)",
    email: "string",
    role: "System Administrator | Executive Director | HR Officer | Project Manager | Finance Officer | Procurement & Logistics Officer | Department Head | Program Officer | Communications Officer | Field Officer | Volunteer | Intern",
    personalDetails: {
      name: "string",
      phone: "string",
      avatarUrl: "string"
    },
    // Locked office details: Read-only for the user, write-restricted to HR/Admin
    officeDetails: {
      position: "string",
      department: "string", // 'Executive' | 'Finance' | 'Operations' | 'Communications' | 'Field Operations' | 'Program Management' | 'HR' | 'Procurement'
      hireDate: "timestamp",
      status: "active | expired | suspended"
    },
    // Locked supporting docs: Read-only for the user, write-restricted to HR/Admin
    supportingDocuments: {
      contractUrl: "string (Firebase Storage path)",
      nssfNumber: "string",
      nhifNumber: "string"
    },
    // Placement details for Interns (automatic countdown and Supervisor link)
    internPlacement: {
      supervisorId: "string (User UID)",
      startDate: "timestamp",
      endDate: "timestamp", // Used for countdown logic
      isExpired: "boolean"
    }
  },

  /**
   * 2. PROJECTS COLLECTION
   * Document ID: Auto-generated Project ID
   */
  projects: {
    projectId: "string (Document ID)",
    name: "string",
    description: "string",
    status: "Planning | In Progress | Completed | On Hold",
    startDate: "timestamp",
    endDate: "timestamp",
    assignedStaff: [
      "string (User UID)" // Relational connection: array of assigned User UIDs for security & querying
    ],
    // Budget cached field for rapid reading in dashboard KPIs (Executive Director & Finance)
    budgetSummary: {
      totalBudget: "number",
      allocated: "number",
      spent: "number"
    }
  },

  /**
   * 3. PROJECT FILES SUBCOLLECTION (Structured File Manager)
   * Collection Path: /projects/{projectId}/files/{fileId}
   */
  projectFiles: {
    fileId: "string (Document ID)",
    fileName: "string",
    fileUrl: "string (Firebase Storage URL)",
    folderPath: "string (e.g. 'Budgets/Q3' or 'Contracts/Engineering')",
    senderOriginId: "string (User UID)",
    senderName: "string (cached for single-read optimization)",
    uploadedAt: "timestamp"
  },

  /**
   * 4. BUDGETS & LEDGERS
   * Document ID: Auto-generated Ledger ID
   * Relationship: Links Project and Finance allocations
   */
  budgets: {
    budgetId: "string (Document ID)",
    projectId: "string (Project ID)",
    projectName: "string (cached)",
    allocatedBudget: "number",
    fiscalYear: "string",
    allocatedBy: "string (User UID)",
    lineItems: [
      {
        description: "string",
        category: "Operations | Travel | Equipment | Consultancies | Media",
        allocatedAmount: "number",
        remainingAmount: "number"
      }
    ],
    updatedAt: "timestamp"
  },

  /**
   * 5. EXPENSES & ROUTING
   * Document ID: Auto-generated Expense ID
   * Relationship: Links project, budget, and approval matrix
   */
  expenses: {
    expenseId: "string (Document ID)",
    projectId: "string (Project ID)",
    budgetId: "string (Budget ID)",
    amount: "number",
    description: "string",
    receiptUrl: "string (Firebase Storage path)",
    submittedBy: "string (User UID)",
    submittedByName: "string",
    createdAt: "timestamp",
    status: "pending | department_approved | approved | rejected",
    department: "string", // Used by Department Head approval workflow
    approvalLogs: [
      {
        role: "string",
        approverId: "string (User UID)",
        decision: "approved | rejected",
        notes: "string",
        timestamp: "timestamp"
      }
    ]
  },

  /**
   * 6. ASSETS & VENDORS REGISTER
   * Document ID: Auto-generated Register ID
   */
  assetsAndVendors: {
    registerId: "string (Document ID)",
    type: "asset | vendor",
    details: {
      // For Assets
      assetCode: "string (optional)",
      name: "string",
      purchaseDate: "timestamp (optional)",
      status: "Operational | In Repair | Retired (optional)",
      // For Vendors
      vendorName: "string (optional)",
      contactPerson: "string (optional)",
      email: "string (optional)",
      category: "IT Support | Logistics | Printing | Catering (optional)"
    },
    lastUpdatedBy: "string (User UID)",
    updatedAt: "timestamp"
  },

  /**
   * 7. ORDER WORKFLOWS
   * Document ID: Auto-generated Order ID
   */
  orders: {
    orderId: "string (Document ID)",
    orderType: "Purchase | Buy | Return",
    vendorId: "string (Vendor RegisterId)",
    vendorName: "string (cached)",
    items: [
      {
        description: "string",
        quantity: "number",
        unitPrice: "number"
      }
    ],
    totalAmount: "number",
    status: "Draft | Approved | Ordered | Received | Returned",
    createdBy: "string (User UID)",
    createdAt: "timestamp"
  },

  /**
   * 8. DOCUMENT VAULT (Organization Policies)
   * Document ID: Auto-generated ID
   */
  documentVault: {
    docId: "string (Document ID)",
    title: "string",
    description: "string",
    fileUrl: "string",
    category: "Policy | Template | Guideline",
    uploadedBy: "string (User UID)",
    uploadedAt: "timestamp"
  },

  /**
   * 9. REQUESTS / REPORTING CENTER
   * Document ID: Auto-generated ID
   */
  requests: {
    requestId: "string (Document ID)",
    userId: "string (User UID)",
    userName: "string",
    department: "string",
    requestType: "Leave | Support Document Access | Grievance | IT Support",
    details: {
      startDate: "string (optional)",
      endDate: "string (optional)",
      reason: "string",
      subject: "string"
    },
    status: "pending | approved | rejected",
    createdAt: "timestamp"
  },

  /**
   * 10. COMMUNICATIONS (Announcements & Media Library)
   * Document ID: Auto-generated ID
   */
  announcements: {
    announcementId: "string (Document ID)",
    title: "string",
    content: "string",
    authorId: "string (User UID)",
    authorName: "string",
    publishedAt: "timestamp"
  },
  
  mediaLibrary: {
    mediaId: "string (Document ID)",
    fileName: "string",
    url: "string (Firebase Storage URL)",
    projectTagId: "string (Project ID - tags assets to specific projects)",
    projectName: "string",
    uploadedBy: "string (User UID)",
    uploadedAt: "timestamp"
  },

  /**
   * 11. OFFLINE SUBMISSIONS (Field Officer)
   * Document ID: Auto-generated Submission ID
   */
  offlineSubmissions: {
    submissionId: "string (Document ID)",
    userId: "string (User UID)",
    userName: "string",
    gpsLocation: {
      latitude: "number",
      longitude: "number",
      cachedAt: "timestamp"
    },
    photoUrl: "string (Firebase Storage URL)",
    activityNotes: "string",
    submittedAt: "timestamp"
  },

  /**
   * 12. AUDIT LOGS
   * Document ID: Auto-generated ID
   */
  auditLogs: {
    logId: "string (Document ID)",
    userId: "string (User UID)",
    userName: "string",
    userEmail: "string",
    userRole: "string",
    actionType: "USER_MANAGEMENT | PROJECT_CREATION | BUDGET_ENTRY | EXPENSE_APPROVAL | POLICY_UPLOAD",
    description: "string",
    ipAddress: "string",
    timestamp: "timestamp"
  },

  /**
   * 13. M&E INDICATORS (also used for indicator targets)
   * Document ID: Auto-generated ID
   */
  indicators: {
    indicatorId: "string (Document ID)",
    name: "string",
    description: "string",
    target: "number",
    achieved: "number",
    unit: "string",
    projectId: "string (Project ID, optional)"
  },

  /**
   * 14. BENEFICIARIES (shared by M&E and Admin beneficiary views)
   * Document ID: Auto-generated ID
   */
  beneficiaries: {
    beneficiaryId: "string (Document ID)",
    name: "string",
    gender: "string",
    age: "string",
    location: "string",
    category: "string",
    projectId: "string (Project ID, optional)",
    enrollmentDate: "timestamp",
    consentGiven: "boolean",
    consentDate: "timestamp"
  },

  /**
   * 15. FIELD VISITS (data collection logs, field visit records, GIS points; quality review via status)
   * Document ID: Auto-generated ID
   */
  fieldVisits: {
    visitId: "string (Document ID)",
    gpsLocation: { latitude: "number", longitude: "number" },
    notes: "string",
    visitDate: "timestamp",
    projectId: "string (Project ID, optional)",
    officerName: "string",
    officerId: "string (User UID)",
    status: "Pending Review | Verified | Flagged"
  },

  /**
   * 16. SURVEYS
   * Document ID: Auto-generated ID
   */
  surveys: {
    surveyId: "string (Document ID)",
    title: "string",
    questions: [
      { id: "string", text: "string", type: "string" }
    ],
    projectId: "string (Project ID, optional)",
    createdBy: "string",
    createdAt: "timestamp"
  },

  /**
   * 17. ORGANIZATION EVENTS
   * Document ID: Auto-generated ID
   */
  events: {
    eventId: "string (Document ID)",
    title: "string",
    date: "timestamp",
    location: "string",
    description: "string"
  },

  /**
   * 18. INVOICES
   * Document ID: Auto-generated ID
   */
  invoices: {
    invoiceId: "string (Document ID)",
    invoiceNumber: "string",
    clientName: "string",
    projectId: "string (Project ID, optional)",
    amount: "number",
    issuedDate: "timestamp",
    dueDate: "timestamp",
    status: "Unpaid | Paid | Overdue"
  }
};

/**
 * ==========================================
 * FIRESTORE RELATIONSHIPS & INDEX OPTIMIZATIONS
 * ==========================================
 * 
 * 1. Project -> User Relationship
 *    - Query: Retrieve all projects assigned to a user.
 *    - Pattern: Array-contains search on `assignedStaff` field in the `/projects` collection.
 *    - Index Required: `/projects` -> `assignedStaff` (Array-contains index).
 * 
 * 2. Projects -> Budgets Relationship
 *    - Query: Get the budget allocation for a project.
 *    - Pattern: Direct query on `/budgets` where `projectId == projectId`.
 *    - Optimization: Cached budget details (`budgetSummary`) inside the project document avoids extra document reads for dashboard aggregations.
 * 
 * 3. User -> Supervisor Relationship (Intern placement)
 *    - Query: Get all interns assigned to a supervisor.
 *    - Pattern: Query on `/users` where `role == 'Intern'` and `internPlacement.supervisorId == supervisorId`.
 *    - Index Required: Composite index `/users` -> `role` ASC, `internPlacement.supervisorId` ASC.
 * 
 * 4. Audit Log Chronology
 *    - Query: Retrieve system audits sorted chronologically.
 *    - Pattern: Query on `/auditLogs` order by `timestamp` DESC.
 *    - Index Required: `/auditLogs` -> `timestamp` DESC.
 * 
 * 5. Media Assets by Project
 *    - Query: Get all media assets associated with a project.
 *    - Pattern: Query on `/mediaLibrary` where `projectTagId == projectId` order by `uploadedAt` DESC.
 *    - Index Required: Composite index `/mediaLibrary` -> `projectTagId` ASC, `uploadedAt` DESC.
 */
