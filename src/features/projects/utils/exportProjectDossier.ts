import * as XLSX from 'xlsx';
import { ActivityRecord, ProjectRecord, TaskRecord, ProjectReportRecord } from '../types/project';

/**
 * Downloads a blob as a file in browser
 */
function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Export a Single Field Activity Report to Microsoft Word (.doc) with integrated tables
 */
export function exportSingleActivityToWord(activity: ActivityRecord, projectName?: string): void {
  const safeTitle = activity.title.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Field_Activity_${safeTitle}_${activity.activityDate}.doc`;

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${activity.title}</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1e293b; margin: 40px; }
        h1 { color: #D68904; font-size: 20pt; border-bottom: 2pt solid #F2A507; padding-bottom: 6px; margin-bottom: 12px; }
        h2 { color: #0f172a; font-size: 14pt; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
        h3 { color: #334155; font-size: 12pt; margin-top: 14px; margin-bottom: 6px; }
        p { margin-bottom: 10px; text-align: justify; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .meta-table td { padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 10pt; }
        .meta-label { font-weight: bold; background-color: #f8fafc; width: 25%; color: #475569; }
        .quote-box { background-color: #fefce8; border-left: 4px solid #F2A507; padding: 12px 16px; margin: 14px 0; font-style: italic; }
        .quote-speaker { font-weight: bold; font-style: normal; color: #b45309; margin-top: 6px; font-size: 10pt; }
        .data-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .data-table th { background-color: #0f172a; color: #ffffff; padding: 8px; border: 1px solid #334155; font-size: 10pt; text-align: left; }
        .data-table td { padding: 8px; border: 1px solid #cbd5e1; font-size: 10pt; }
        .data-table tr:nth-child(even) { background-color: #f8fafc; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 9pt; }
        .badge-approved { background-color: #dcfce7; color: #15803d; }
        .badge-pending { background-color: #fef3c7; color: #b45309; }
        .badge-rejected { background-color: #fee2e2; color: #b91c1c; }
        .footer { margin-top: 40px; font-size: 9pt; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; }
      </style>
    </head>
    <body>
      <h1>BABAWATOTO ORGANIZATION - FIELD ACTIVITY REPORT</h1>
      <p style="color: #64748b; font-size: 10pt;">Project: <strong>${projectName || 'Community Interventions'}</strong> | Generated: ${new Date().toLocaleDateString()}</p>

      <table class="meta-table">
        <tr>
          <td class="meta-label">Activity Title:</td>
          <td><strong>${activity.title}</strong></td>
          <td class="meta-label">Activity Date:</td>
          <td>${activity.activityDate}</td>
        </tr>
        <tr>
          <td class="meta-label">Location / Ward:</td>
          <td>${activity.location || 'Not Specified'}</td>
          <td class="meta-label">Submission Status:</td>
          <td><span class="badge ${activity.submissionStatus === 'approved' ? 'badge-approved' : 'badge-pending'}">${activity.submissionStatus.toUpperCase()}</span></td>
        </tr>
        <tr>
          <td class="meta-label">Reporting Officer:</td>
          <td>${activity.submittedByName || activity.submittedBy}</td>
          <td class="meta-label">Participants Count:</td>
          <td><strong>${activity.participantsCount}</strong> registered</td>
        </tr>
        <tr>
          <td class="meta-label">Budget Allocated:</td>
          <td>${activity.budgetAllocated ? `TZS ${activity.budgetAllocated.toLocaleString()}` : 'N/A'}</td>
          <td class="meta-label">Budget Spent:</td>
          <td>${activity.budgetSpent ? `TZS ${activity.budgetSpent.toLocaleString()}` : 'N/A'}</td>
        </tr>
      </table>

      <h2>1. Background & Institutional Context</h2>
      <p>${activity.backgroundContext || activity.description || 'No detailed background recorded.'}</p>

      <h2>2. Methodology & Facilitation Protocol</h2>
      <p>${activity.methodology || 'Facilitated according to standard participatory community engagement standards.'}</p>

      <h2>3. Comprehensive Field Narrative & Analysis</h2>
      ${
        activity.sessionNarrative
          ? activity.sessionNarrative
              .split('\n\n')
              .map((para) => `<p>${para.replace(/\n/g, '<br/>')}</p>`)
              .join('')
          : `<p>${activity.progress || 'Activity execution carried out successfully.'}</p>`
      }

      ${
        activity.keyFindings && activity.keyFindings.length > 0
          ? `
            <h3>Key Discoveries & Analytical Findings</h3>
            <ul>
              ${activity.keyFindings.map((finding) => `<li>${finding}</li>`).join('')}
            </ul>
          `
          : ''
      }

      <h2>4. Demographic & Participant Breakdown (Integrated Spreadsheet Table)</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Demographic Cluster</th>
            <th>Count</th>
            <th>Share (%)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Female Participants</td>
            <td>${activity.demographicBreakdown?.female ?? '-'}</td>
            <td>${activity.participantsCount > 0 && activity.demographicBreakdown?.female ? `${Math.round(((activity.demographicBreakdown.female || 0) / activity.participantsCount) * 100)}%` : '-'}</td>
          </tr>
          <tr>
            <td>Male Participants</td>
            <td>${activity.demographicBreakdown?.male ?? '-'}</td>
            <td>${activity.participantsCount > 0 && activity.demographicBreakdown?.male ? `${Math.round(((activity.demographicBreakdown.male || 0) / activity.participantsCount) * 100)}%` : '-'}</td>
          </tr>
          <tr>
            <td>Youth (Ages 10-24)</td>
            <td>${activity.demographicBreakdown?.youth ?? '-'}</td>
            <td>${activity.participantsCount > 0 && activity.demographicBreakdown?.youth ? `${Math.round(((activity.demographicBreakdown.youth || 0) / activity.participantsCount) * 100)}%` : '-'}</td>
          </tr>
          <tr>
            <td>Adults & Caregivers</td>
            <td>${activity.demographicBreakdown?.adults ?? '-'}</td>
            <td>${activity.participantsCount > 0 && activity.demographicBreakdown?.adults ? `${Math.round(((activity.demographicBreakdown.adults || 0) / activity.participantsCount) * 100)}%` : '-'}</td>
          </tr>
          <tr>
            <td>Persons with Special Needs / Disabilities</td>
            <td>${activity.demographicBreakdown?.specialNeeds ?? '-'}</td>
            <td>${activity.participantsCount > 0 && activity.demographicBreakdown?.specialNeeds ? `${Math.round(((activity.demographicBreakdown.specialNeeds || 0) / activity.participantsCount) * 100)}%` : '-'}</td>
          </tr>
          <tr style="font-weight: bold; background-color: #f1f5f9;">
            <td>Total Verified Attendance</td>
            <td>${activity.participantsCount}</td>
            <td>100.0%</td>
          </tr>
        </tbody>
      </table>

      ${
        activity.participantQuotes && activity.participantQuotes.length > 0
          ? `
            <h2>5. Participant & Stakeholder Voices</h2>
            ${activity.participantQuotes
              .map(
                (q) => `
              <div class="quote-box">
                "${q.quote}"
                <div class="quote-speaker">- ${q.speaker}${q.affiliation ? ` (${q.affiliation})` : ''}</div>
              </div>
            `
              )
              .join('')}
          `
          : ''
      }

      <h2>6. Operational Challenges & Tactical Mitigation</h2>
      <p><strong>Challenges Encountered:</strong> ${activity.challenges || 'No operational impediments encountered.'}</p>
      <p><strong>Follow-Up Action Items:</strong> ${activity.followUpActions || 'Routine cycle ongoing.'}</p>

      ${
        activity.evidenceDocuments && activity.evidenceDocuments.length > 0
          ? `
            <h2>7. Attached Evidence & Verified Documents</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Document Reference</th>
                  <th>Document Title</th>
                  <th>File Type</th>
                  <th>Attached Date</th>
                </tr>
              </thead>
              <tbody>
                ${activity.evidenceDocuments
                  .map(
                    (doc) => `
                  <tr>
                    <td>${doc.documentReference}</td>
                    <td>${doc.documentTitle}</td>
                    <td>${doc.fileType || 'Document'}</td>
                    <td>${new Date(doc.attachedAt).toLocaleDateString()}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          `
          : ''
      }

      <div class="footer">
        BAOMS Institutional Intelligence • Babawatoto Organization Management System • Confidential & Proprietary
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
  downloadBlob(blob, fileName);
}

/**
 * Export a Single Field Activity to Excel (.xlsx)
 */
export function exportSingleActivityToExcel(activity: ActivityRecord, projectName?: string): void {
  const safeTitle = activity.title.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Field_Activity_${safeTitle}_${activity.activityDate}.xlsx`;

  const wb = XLSX.utils.book_new();

  // Overview Sheet
  const overviewData = [
    ['BABAWATOTO ORGANIZATION - FIELD ACTIVITY EXPORT'],
    ['Project Name', projectName || 'Community Program'],
    ['Activity Title', activity.title],
    ['Date', activity.activityDate],
    ['Location', activity.location || 'N/A'],
    ['Status', activity.submissionStatus],
    ['Reporting Officer', activity.submittedByName || activity.submittedBy],
    ['Total Participants', activity.participantsCount],
    ['Budget Allocated (TZS)', activity.budgetAllocated || 0],
    ['Budget Spent (TZS)', activity.budgetSpent || 0],
    ['Beneficiary Satisfaction Score (%)', activity.beneficiarySatisfactionScore || 'N/A'],
    [],
    ['Background Context', activity.backgroundContext || activity.description || ''],
    ['Methodology', activity.methodology || ''],
    ['Progress / Summary', activity.progress || ''],
    ['Challenges', activity.challenges || ''],
    ['Follow-up Actions', activity.followUpActions || ''],
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Activity Summary');

  // Demographics Sheet
  const demoData = [
    ['Cluster / Segment', 'Headcount', 'Percentage'],
    ['Female', activity.demographicBreakdown?.female || 0, activity.participantsCount ? ((activity.demographicBreakdown?.female || 0) / activity.participantsCount) : 0],
    ['Male', activity.demographicBreakdown?.male || 0, activity.participantsCount ? ((activity.demographicBreakdown?.male || 0) / activity.participantsCount) : 0],
    ['Youth (10-24)', activity.demographicBreakdown?.youth || 0, activity.participantsCount ? ((activity.demographicBreakdown?.youth || 0) / activity.participantsCount) : 0],
    ['Adults', activity.demographicBreakdown?.adults || 0, activity.participantsCount ? ((activity.demographicBreakdown?.adults || 0) / activity.participantsCount) : 0],
    ['Persons with Disabilities / Special Needs', activity.demographicBreakdown?.specialNeeds || 0, activity.participantsCount ? ((activity.demographicBreakdown?.specialNeeds || 0) / activity.participantsCount) : 0],
    ['Total Attendance', activity.participantsCount, 1],
  ];
  const wsDemo = XLSX.utils.aoa_to_sheet(demoData);
  XLSX.utils.book_append_sheet(wb, wsDemo, 'Participant Demographics');

  // Quotes Sheet
  if (activity.participantQuotes && activity.participantQuotes.length > 0) {
    const quotesData = [
      ['Speaker', 'Affiliation / Role', 'Participant Statement / Feedback'],
      ...activity.participantQuotes.map((q) => [q.speaker, q.affiliation || '', q.quote]),
    ];
    const wsQuotes = XLSX.utils.aoa_to_sheet(quotesData);
    XLSX.utils.book_append_sheet(wb, wsQuotes, 'Participant Responses');
  }

  XLSX.writeFile(wb, fileName);
}

/**
 * Export Entire Project Dossier to Comprehensive Microsoft Word (.doc) with integrated tables
 */
export function exportProjectDossierToWord(
  project: ProjectRecord,
  activities: ActivityRecord[],
  tasks: TaskRecord[],
  reports: ProjectReportRecord[],
  procurementItems: any[] = []
): void {
  const fileName = `Project_Dossier_${project.projectCode}_${new Date().toISOString().slice(0, 10)}.doc`;

  const totalParticipants = activities.reduce((sum, a) => sum + (a.participantsCount || 0), 0);
  const totalActBudget = activities.reduce((sum, a) => sum + (a.budgetAllocated || 0), 0);
  const totalActSpent = activities.reduce((sum, a) => sum + (a.budgetSpent || 0), 0);
  const effectiveTotalSpent = project.budgetSummary?.totalSpent ?? totalActSpent;
  const burnRate = project.budgetSummary
    ? `${project.budgetSummary.burnRatePercent}%`
    : `${Math.round((effectiveTotalSpent / (project.totalBudget || 1)) * 100)}%`;

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>Project Dossier - ${project.name}</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1e293b; margin: 40px; }
        h1 { color: #D68904; font-size: 22pt; border-bottom: 2pt solid #F2A507; padding-bottom: 8px; margin-bottom: 12px; }
        h2 { color: #0f172a; font-size: 15pt; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
        h3 { color: #334155; font-size: 12pt; margin-top: 16px; margin-bottom: 6px; }
        p { margin-bottom: 10px; text-align: justify; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .meta-table td { padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 10pt; }
        .meta-label { font-weight: bold; background-color: #f8fafc; width: 25%; color: #475569; }
        .quote-box { background-color: #fefce8; border-left: 4px solid #F2A507; padding: 10px 14px; margin: 10px 0; font-style: italic; }
        .quote-speaker { font-weight: bold; font-style: normal; color: #b45309; margin-top: 4px; font-size: 9.5pt; }
        .data-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .data-table th { background-color: #0f172a; color: #ffffff; padding: 8px; border: 1px solid #334155; font-size: 9.5pt; text-align: left; }
        .data-table td { padding: 7px 8px; border: 1px solid #cbd5e1; font-size: 9.5pt; }
        .data-table tr:nth-child(even) { background-color: #f8fafc; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 8.5pt; }
        .badge-active { background-color: #dcfce7; color: #15803d; }
        .footer { margin-top: 40px; font-size: 9pt; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; }
      </style>
    </head>
    <body>
      <h1>BABAWATOTO COMPREHENSIVE PROJECT DOSSIER</h1>
      <p style="color: #64748b; font-size: 10.5pt;">Institutional Monitoring & Analytical Dossier • Generated on: ${new Date().toLocaleDateString()}</p>

      <h2>1. Project Profile & Strategic Framework</h2>
      <table class="meta-table">
        <tr>
          <td class="meta-label">Project Code:</td>
          <td><strong>${project.projectCode}</strong></td>
          <td class="meta-label">Status:</td>
          <td><span class="badge badge-active">${project.status.toUpperCase()}</span></td>
        </tr>
        <tr>
          <td class="meta-label">Project Name:</td>
          <td colspan="3"><strong>${project.name}</strong></td>
        </tr>
        <tr>
          <td class="meta-label">Funding Partner:</td>
          <td>${project.funder}</td>
          <td class="meta-label">Department:</td>
          <td>${project.departmentName || 'Programs'}</td>
        </tr>
        <tr>
          <td class="meta-label">Duration:</td>
          <td>${project.startDate} to ${project.endDate}</td>
          <td class="meta-label">Total Allocated Budget:</td>
          <td><strong>${project.currency} ${project.totalBudget.toLocaleString()}</strong></td>
        </tr>
      </table>

      <p><strong>Executive Abstract:</strong> ${project.description || 'Comprehensive community transformation initiative.'}</p>

      <h2>2. Financial Utilization & Budget Realization</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Budget Category / Line</th>
            <th>Allocated (${project.currency})</th>
            <th>Disbursed / Spent (${project.currency})</th>
            <th>Remaining Balance</th>
            <th>Burn Rate (%)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Total Approved Grant</td>
            <td>${project.totalBudget.toLocaleString()}</td>
            <td>${effectiveTotalSpent.toLocaleString()}</td>
            <td>${(project.totalBudget - effectiveTotalSpent).toLocaleString()}</td>
            <td>${burnRate}</td>
          </tr>
          <tr>
            <td>Field Activities Operational Subtotal</td>
            <td>${totalActBudget.toLocaleString()}</td>
            <td>${totalActSpent.toLocaleString()}</td>
            <td>${(totalActBudget - totalActSpent).toLocaleString()}</td>
            <td>${totalActBudget > 0 ? `${Math.round((totalActSpent / totalActBudget) * 100)}%` : '0%'}</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Field Activities & Narrative Analytics (${activities.length} Recorded Interventions)</h2>
      <p>Across the reporting timeframe, project officers executed ${activities.length} major interventions reaching <strong>${totalParticipants}</strong> community participants.</p>

      ${activities
        .map(
          (act, idx) => `
        <div style="margin-top: 18px; border: 1px solid #cbd5e1; padding: 14px; background-color: #ffffff; border-radius: 4px;">
          <h3 style="color: #D68904; margin-top: 0;">3.${idx + 1}. ${act.title} (${act.activityDate})</h3>
          <p><strong>Location:</strong> ${act.location || 'N/A'} | <strong>Participants:</strong> ${act.participantsCount} | <strong>Status:</strong> ${act.submissionStatus.toUpperCase()}</p>
          
          <p><strong>Context & Approach:</strong> ${act.backgroundContext || act.description || 'Standard intervention protocol.'}</p>
          
          <p><strong>Comprehensive Narrative:</strong></p>
          ${
            act.sessionNarrative
              ? act.sessionNarrative
                  .split('\n\n')
                  .map((p) => `<p style="font-size: 10pt;">${p.replace(/\n/g, '<br/>')}</p>`)
                  .join('')
              : `<p style="font-size: 10pt;">${act.progress}</p>`
          }

          ${
            act.participantQuotes && act.participantQuotes.length > 0
              ? `
                <div style="margin-top: 8px;">
                  <strong style="font-size: 10pt; color: #b45309;">Participant Voices:</strong>
                  ${act.participantQuotes
                    .map(
                      (q) => `
                    <div class="quote-box" style="font-size: 9.5pt;">
                      "${q.quote}"
                      <div class="quote-speaker">- ${q.speaker}${q.affiliation ? ` (${q.affiliation})` : ''}</div>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              `
              : ''
          }
        </div>
      `
        )
        .join('')}

      <h2>4. Consolidated Participant Demographics (Spreadsheet Format)</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Activity Title</th>
            <th>Date</th>
            <th>Female</th>
            <th>Male</th>
            <th>Youth</th>
            <th>Adults</th>
            <th>Special Needs</th>
            <th>Total Reach</th>
          </tr>
        </thead>
        <tbody>
          ${activities
            .map(
              (act) => `
            <tr>
              <td>${act.title}</td>
              <td>${act.activityDate}</td>
              <td>${act.demographicBreakdown?.female || '-'}</td>
              <td>${act.demographicBreakdown?.male || '-'}</td>
              <td>${act.demographicBreakdown?.youth || '-'}</td>
              <td>${act.demographicBreakdown?.adults || '-'}</td>
              <td>${act.demographicBreakdown?.specialNeeds || '-'}</td>
              <td><strong>${act.participantsCount}</strong></td>
            </tr>
          `
            )
            .join('')}
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <td colspan="7">Total Aggregate Community Footprint</td>
            <td>${totalParticipants}</td>
          </tr>
        </tbody>
      </table>

      <h2>5. Action Milestones & Task Tracking</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Task Description</th>
            <th>Assigned Officer</th>
            <th>Due Date</th>
            <th>Priority</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${tasks
            .map(
              (t) => `
            <tr>
              <td>${t.title}</td>
              <td>${t.assignedToName || 'Unassigned'}</td>
              <td>${t.dueDate || 'Open'}</td>
              <td>${t.priority.toUpperCase()}</td>
              <td>${t.status.toUpperCase()}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      ${
        procurementItems.length > 0
          ? `
            <h2>6. Procurement & Supplies Register</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>PO / Item Reference</th>
                  <th>Vendor / Supplier</th>
                  <th>Quantity & Description</th>
                  <th>Total Cost (${project.currency})</th>
                  <th>Delivery Status</th>
                </tr>
              </thead>
              <tbody>
                ${procurementItems
                  .map(
                    (p) => `
                  <tr>
                    <td>${p.orderNumber || p.id}</td>
                    <td>${p.vendorName || 'Vendor'}</td>
                    <td>${p.description || p.itemName}</td>
                    <td>${(p.totalAmount || p.estimatedCost || 0).toLocaleString()}</td>
                    <td>${(p.status || 'Received').toUpperCase()}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          `
          : ''
      }

      <h2>6. Operational Reports & Document Reviews (${reports.length} Verified Documents)</h2>
      ${
        reports.length > 0
          ? `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Report Title</th>
                  <th>Document Type</th>
                  <th>Submitted By</th>
                  <th>Date</th>
                  <th>Key Highlights / Observations</th>
                </tr>
              </thead>
              <tbody>
                ${reports
                  .map(
                    (r) => `
                  <tr>
                    <td><strong>${r.title}</strong></td>
                    <td>${r.reportType}</td>
                    <td>${r.submittedByName || 'Institutional Officer'}</td>
                    <td>${r.submittedAt || ''}</td>
                    <td>${r.summary || 'Operational documentation and evidence verified.'}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          `
          : '<p>No operational reports filed yet.</p>'
      }

      <h2>7. Governance, Document Reviews & Approvals</h2>
      <p>All activities, financial requisitions, and operational reports contained in this dossier have been verified in compliance with Babawatoto Organization internal controls and donor agreements.</p>

      <div class="footer">
        BAOMS Institutional Intelligence • Babawatoto Organization Management System • Confidential & Proprietary
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
  downloadBlob(blob, fileName);
}

/**
 * Export Entire Project Dossier to Multi-Sheet Excel Workbook (.xlsx)
 */
export function exportProjectDossierToExcel(
  project: ProjectRecord,
  activities: ActivityRecord[],
  tasks: TaskRecord[],
  reports: ProjectReportRecord[],
  procurementItems: any[] = []
): void {
  const fileName = `Project_Data_${project.projectCode}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const wb = XLSX.utils.book_new();

  // 1. Project Profile Sheet
  const profileData = [
    ['BABAWATOTO ORGANIZATION - PROJECT DOSSIER EXPORT'],
    ['Generated On', new Date().toISOString()],
    [],
    ['Project Code', project.projectCode],
    ['Project Name', project.name],
    ['Funder / Donor', project.funder],
    ['Status', project.status],
    ['Start Date', project.startDate],
    ['End Date', project.endDate],
    ['Currency', project.currency],
    ['Total Approved Budget', project.totalBudget],
    ['Total Activities Logged', activities.length],
    ['Total Tasks', tasks.length],
    ['Total Participants Reached', activities.reduce((sum, a) => sum + (a.participantsCount || 0), 0)],
  ];
  const wsProfile = XLSX.utils.aoa_to_sheet(profileData);
  XLSX.utils.book_append_sheet(wb, wsProfile, 'Project Profile');

  // 2. Field Activities Sheet
  const activitiesHeader = [
    'Activity ID',
    'Date',
    'Title',
    'Location',
    'Participants Count',
    'Submission Status',
    'Reporting Officer',
    'Budget Allocated (TZS)',
    'Budget Spent (TZS)',
    'Satisfaction Score (%)',
    'Background',
    'Methodology',
    'Narrative',
    'Challenges',
    'Follow-up Actions',
  ];
  const activitiesRows = activities.map((a) => [
    a.id,
    a.activityDate,
    a.title,
    a.location || '',
    a.participantsCount,
    a.submissionStatus,
    a.submittedByName || a.submittedBy,
    a.budgetAllocated || 0,
    a.budgetSpent || 0,
    a.beneficiarySatisfactionScore || '',
    a.backgroundContext || '',
    a.methodology || '',
    a.sessionNarrative || a.progress,
    a.challenges || '',
    a.followUpActions || '',
  ]);
  const wsActivities = XLSX.utils.aoa_to_sheet([activitiesHeader, ...activitiesRows]);
  XLSX.utils.book_append_sheet(wb, wsActivities, 'Field Activities');

  // 3. Demographics Sheet
  const demoHeader = ['Activity Title', 'Date', 'Female', 'Male', 'Youth', 'Adults', 'Special Needs', 'Total'];
  const demoRows = activities.map((a) => [
    a.title,
    a.activityDate,
    a.demographicBreakdown?.female || 0,
    a.demographicBreakdown?.male || 0,
    a.demographicBreakdown?.youth || 0,
    a.demographicBreakdown?.adults || 0,
    a.demographicBreakdown?.specialNeeds || 0,
    a.participantsCount,
  ]);
  const wsDemo = XLSX.utils.aoa_to_sheet([demoHeader, ...demoRows]);
  XLSX.utils.book_append_sheet(wb, wsDemo, 'Demographics');

  // 4. Participant Voices / Quotes Sheet
  const quotesHeader = ['Activity Title', 'Speaker', 'Affiliation / Role', 'Direct Quote / Participant Response'];
  const quotesRows: any[] = [];
  activities.forEach((a) => {
    if (a.participantQuotes && a.participantQuotes.length > 0) {
      a.participantQuotes.forEach((q) => {
        quotesRows.push([a.title, q.speaker, q.affiliation || '', q.quote]);
      });
    }
  });
  const wsQuotes = XLSX.utils.aoa_to_sheet([quotesHeader, ...quotesRows]);
  XLSX.utils.book_append_sheet(wb, wsQuotes, 'Participant Responses');

  // 5. Tasks Sheet
  const tasksHeader = ['Task Title', 'Assigned To', 'Due Date', 'Priority', 'Status'];
  const tasksRows = tasks.map((t) => [t.title, t.assignedToName || '', t.dueDate || '', t.priority, t.status]);
  const wsTasks = XLSX.utils.aoa_to_sheet([tasksHeader, ...tasksRows]);
  XLSX.utils.book_append_sheet(wb, wsTasks, 'Tasks & Milestones');

  // 6. Procurement & Supplies Sheet
  if (procurementItems.length > 0) {
    const procHeader = ['PO Number', 'Vendor', 'Item / Service', 'Amount', 'Status'];
    const procRows = procurementItems.map((p) => [
      p.orderNumber || p.id,
      p.vendorName || '',
      p.description || p.itemName || '',
      p.totalAmount || p.estimatedCost || 0,
      p.status || '',
    ]);
    const wsProc = XLSX.utils.aoa_to_sheet([procHeader, ...procRows]);
    XLSX.utils.book_append_sheet(wb, wsProc, 'Procurement & Supplies');
  }

  // 7. Operational Reports Sheet
  if (reports.length > 0) {
    const repHeader = ['Report Title', 'Document Type', 'Submitted By', 'Submission Date', 'Summary'];
    const repRows = reports.map((r) => [
      r.title,
      r.reportType,
      r.submittedByName || 'Institutional Officer',
      r.submittedAt || '',
      r.summary || '',
    ]);
    const wsRep = XLSX.utils.aoa_to_sheet([repHeader, ...repRows]);
    XLSX.utils.book_append_sheet(wb, wsRep, 'Operational Reports');
  }

  XLSX.writeFile(wb, fileName);
}
