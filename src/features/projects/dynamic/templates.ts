/**
 * BAOMS Organizational Starter Templates & Indicator Library
 * Babawatoto Organization Management System
 * 
 * Standardized blueprints for fast project onboarding and cross-project comparability.
 */

import type { DynamicFormField, DynamicIndicator, IndicatorCalculation } from './types';

export interface ProjectTemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  indicators: Array<{
    code: string;
    name: string;
    description: string;
    unit: string;
    defaultTarget: number;
    calculationType: IndicatorCalculation;
    sourceFieldKey: string;
    aggregation: 'sum' | 'average' | 'latest';
  }>;
  form: {
    name: string;
    description: string;
    fields: DynamicFormField[];
  };
  checklists: string[];
}

export const ORGANIZATIONAL_TEMPLATES: ProjectTemplateDefinition[] = [
  {
    id: 'youth_empowerment',
    name: 'Youth Vocational Skills & Economic Empowerment',
    description: 'Tracks youth vocational skills training, toolkits disbursement, post-training assessment scores, and business startup viability.',
    category: 'Youth Empowerment & Education',
    indicators: [
      {
        code: 'YOUTH_TRAINED',
        name: 'Vulnerable Youth Graduating from Vocational Training',
        description: 'Total number of adolescent youth completing certified vocational courses.',
        unit: 'youth',
        defaultTarget: 500,
        calculationType: 'sum',
        sourceFieldKey: 'graduates_count',
        aggregation: 'sum',
      },
      {
        code: 'TOOLKITS_ISSUED',
        name: 'Startup Toolkits Distributed to Graduates',
        description: 'Number of vocational toolkits provided to support immediate self-employment.',
        unit: 'toolkits',
        defaultTarget: 250,
        calculationType: 'sum',
        sourceFieldKey: 'toolkits_count',
        aggregation: 'sum',
      },
      {
        code: 'AVG_ASSESSMENT_SCORE',
        name: 'Average Post-Training Competency Assessment Score',
        description: 'Mean proficiency score (0-100) recorded in end-of-course evaluations.',
        unit: 'score',
        defaultTarget: 80,
        calculationType: 'average',
        sourceFieldKey: 'assessment_score',
        aggregation: 'average',
      },
      {
        code: 'TARGET_COMPLETION_RATE',
        name: 'Cohort Completion Rate Against Target',
        description: 'Percentage of targeted youth successfully completing training.',
        unit: '%',
        defaultTarget: 500,
        calculationType: 'percentage_of_target',
        sourceFieldKey: 'graduates_count',
        aggregation: 'sum',
      },
    ],
    form: {
      name: 'Youth Training Session & Attendance Log',
      description: 'Record vocational training session attendance, graduate counts, and toolkits distributed.',
      fields: [
        { key: 'session_title', label: 'Session / Cohort Title', type: 'text', required: true, helpText: 'e.g. Electrical Installation Cohort 4' },
        { key: 'session_date', label: 'Date of Session / Graduation', type: 'date', required: true },
        { key: 'facilitator_name', label: 'Lead Instructor / Facilitator', type: 'text', required: true },
        { key: 'graduates_count', label: 'Graduates / Completers in Session', type: 'integer', required: true, min: 0 },
        { key: 'toolkits_count', label: 'Toolkits Issued in Session', type: 'integer', required: true, min: 0 },
        { key: 'assessment_score', label: 'Cohort Average Score (0-100)', type: 'decimal', required: false, min: 0, max: 100 },
        { key: 'safeguarding_briefed', label: 'Child Safeguarding Code Signed by Learners', type: 'boolean', required: true },
        { key: 'field_notes', label: 'Facilitator Notes & Challenges', type: 'textarea', required: false },
      ],
    },
    checklists: [
      'Pre-training workshop site safety and tools inspection completed',
      'Learner admission agreements and parental consents filed',
      'Startup toolkits procured and audited by procurement team',
      'End-of-training certified competency certificates printed',
    ],
  },
  {
    id: 'ecd_community',
    name: 'Early Childhood Development (ECD) & Nutrition Outreach',
    description: 'Tracks children reached in community ECD safe spaces, caregiver counseling sessions, and nutritional supplement distribution.',
    category: 'Early Childhood Development (ECD)',
    indicators: [
      {
        code: 'CHILDREN_ENROLLED',
        name: 'Children Active in ECD Spaces',
        description: 'Cumulative count of children aged 2-6 enrolled in community ECD centers.',
        unit: 'children',
        defaultTarget: 1200,
        calculationType: 'sum',
        sourceFieldKey: 'children_attending',
        aggregation: 'sum',
      },
      {
        code: 'CAREGIVERS_ENGAGED',
        name: 'Caregivers Reached with Positive Parenting Education',
        description: 'Parents and guardians completing positive parenting and hygiene workshops.',
        unit: 'caregivers',
        defaultTarget: 450,
        calculationType: 'sum',
        sourceFieldKey: 'caregivers_count',
        aggregation: 'sum',
      },
      {
        code: 'NUTRITION_PACKS',
        name: 'Nutritional Food Packages Distributed',
        description: 'Supplementary nutrition kits provided to vulnerable households.',
        unit: 'packs',
        defaultTarget: 3000,
        calculationType: 'sum',
        sourceFieldKey: 'packs_distributed',
        aggregation: 'sum',
      },
    ],
    form: {
      name: 'ECD Center Monthly Attendance & Outreach Log',
      description: 'Monthly monitoring log for ECD center attendance and nutrition support.',
      fields: [
        { key: 'center_name', label: 'ECD Center / Ward Location', type: 'text', required: true },
        { key: 'log_date', label: 'Reporting Date', type: 'date', required: true },
        { key: 'children_attending', label: 'Active Children Attending', type: 'integer', required: true, min: 0 },
        { key: 'caregivers_count', label: 'Caregivers Attending Parenting Session', type: 'integer', required: true, min: 0 },
        { key: 'packs_distributed', label: 'Nutrition Packs Distributed', type: 'integer', required: true, min: 0 },
        { key: 'water_sanitation_verified', label: 'Clean Water & Handwashing Available', type: 'boolean', required: true },
        { key: 'monitoring_remarks', label: 'Center Supervisor Remarks', type: 'textarea', required: false },
      ],
    },
    checklists: [
      'Sanitation and child safe-space inspection verified',
      'Caregiver register and dietary needs recorded',
      'Nutrition inventory stored in compliant dry storage',
    ],
  },
  {
    id: 'child_safeguarding',
    name: 'Child Safeguarding, Community Advocacy & Protection',
    description: 'Tracks community child protection forums, village sensitization reach, and timely case referral response rates.',
    category: 'Child Safeguarding & Rights',
    indicators: [
      {
        code: 'FORUMS_HELD',
        name: 'Community Safeguarding & Protection Forums Conducted',
        description: 'Total multi-stakeholder dialogue sessions held in project wards.',
        unit: 'forums',
        defaultTarget: 30,
        calculationType: 'sum',
        sourceFieldKey: 'forums_held',
        aggregation: 'sum',
      },
      {
        code: 'STAKEHOLDERS_REACHED',
        name: 'Community Members Sensitized on Child Protection Rights',
        description: 'Total community members, local leaders, and youth attending awareness sessions.',
        unit: 'people',
        defaultTarget: 2000,
        calculationType: 'sum',
        sourceFieldKey: 'participants_count',
        aggregation: 'sum',
      },
      {
        code: 'CASES_MANAGED',
        name: 'Protection Referrals Formally Escalated',
        description: 'Total safeguarding or abuse reports referred to Social Welfare or Police Gender Desk.',
        unit: 'cases',
        defaultTarget: 50,
        calculationType: 'sum',
        sourceFieldKey: 'cases_referred',
        aggregation: 'sum',
      },
    ],
    form: {
      name: 'Community Safeguarding Forum Activity Log',
      description: 'Record community forum reach, stakeholder presence, and child protection referrals.',
      fields: [
        { key: 'ward_name', label: 'Ward / Community Venue', type: 'text', required: true },
        { key: 'activity_date', label: 'Activity Date', type: 'date', required: true },
        { key: 'forums_held', label: 'Forums / Dialogue Sessions Held Today', type: 'integer', required: true, min: 1 },
        { key: 'participants_count', label: 'Total Participants Count', type: 'integer', required: true, min: 0 },
        { key: 'gender_desk_present', label: 'Police Gender Desk / Social Welfare Officer Present', type: 'boolean', required: true },
        { key: 'cases_referred', label: 'Protection Cases Formally Referred', type: 'integer', required: false, min: 0 },
        { key: 'key_deliberations', label: 'Key Forum Deliberations & Resolutions', type: 'textarea', required: false },
      ],
    },
    checklists: [
      'Ward leadership and local authority clearances secured',
      'Police Gender Desk and Social Welfare officers invited and confirmed',
      'Participant registration and consent forms prepared',
      'Confidential case referral reporting channel established',
    ],
  },
];
