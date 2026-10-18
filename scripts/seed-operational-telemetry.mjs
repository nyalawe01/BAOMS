import { createClient } from '@supabase/supabase-js';

const url = 'https://sqleehfbooigtthzmvbd.supabase.co';
const anonKey = 'sb_publishable_L2QYbVnAa3XTfImkz99AEg_SOT_zES4';
const supabase = createClient(url, anonKey);

async function seedOperationalData() {
  console.log('=== SEEDING OPERATIONAL TELEMETRY FOR ALL DASHBOARDS ===');

  // 1. Authenticate as Admin
  const auth = await supabase.auth.signInWithPassword({
    email: 'admin@babawatoto.or.tz',
    password: 'Admin@BabaWatoto2026!',
  });

  if (auth.error) {
    console.error('Failed to log in as admin:', auth.error.message);
    process.exit(1);
  }

  const adminId = auth.data.user.id;
  console.log('Logged in as Admin:', adminId);

  // 2. Fetch profiles
  const { data: profiles } = await supabase.from('profiles').select('id, official_email, display_name');
  const lugano = profiles.find((p) => p.official_email?.includes('lugano')) || profiles[0];
  const mgunga = profiles.find((p) => p.official_email?.includes('mgunga')) || profiles[0];
  const hussein = profiles.find((p) => p.official_email?.includes('hussein')) || profiles[0];
  const elinami = profiles.find((p) => p.official_email?.includes('elinami')) || profiles[0];

  console.log('Key staff resolved:');
  console.log('  Lugano Maclean (PM):', lugano.id);
  console.log('  Mgunga (ED):', mgunga.id);
  console.log('  Hussein (Finance):', hussein.id);
  console.log('  Elinami (HR):', elinami.id);

  // 3. Resolve Project IDs
  const { data: projects } = await supabase.from('projects').select('id, project_code, name');
  console.log('Found projects:', projects.map((p) => `${p.project_code} (${p.id})`));

  const p1 = projects.find((p) => p.project_code === 'PRJ-2026-001') || projects[0];
  const p2 = projects.find((p) => p.project_code === 'PRJ-2026-002') || projects[1] || p1;
  const p3 = projects.find((p) => p.project_code === 'PRJ-2026-003') || projects[2] || p1;

  // 4. Seed Project Members (Ensure PM, Coordinator, Finance belong to projects)
  console.log('\n--- Seeding project_members ---');
  const membersToInsert = [
    // Lugano as Manager on all projects
    {
      project_id: p1.id,
      user_id: lugano.id,
      project_role: 'manager',
      assigned_by: adminId,
    },
    {
      project_id: p2.id,
      user_id: lugano.id,
      project_role: 'manager',
      assigned_by: adminId,
    },
    {
      project_id: p3.id,
      user_id: lugano.id,
      project_role: 'manager',
      assigned_by: adminId,
    },
    // Hussein as Finance on all projects
    {
      project_id: p1.id,
      user_id: hussein.id,
      project_role: 'finance',
      assigned_by: adminId,
    },
    {
      project_id: p2.id,
      user_id: hussein.id,
      project_role: 'finance',
      assigned_by: adminId,
    },
  ];

  for (const m of membersToInsert) {
    const { data: existing } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', m.project_id)
      .eq('user_id', m.user_id)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from('project_members').insert(m);
      if (error) console.warn('Member insert warning:', error.message);
      else console.log(`Assigned user ${m.user_id.slice(0, 8)} to project ${m.project_id.slice(0, 8)}`);
    } else {
      console.log(`User ${m.user_id.slice(0, 8)} already assigned to project ${m.project_id.slice(0, 8)}`);
    }
  }

  // 5. Seed Activities
  console.log('\n--- Seeding activities ---');
  const activitiesData = [
    {
      project_id: p1.id,
      title: 'Temeke Youth Theater & Cultural Arts Workshop',
      description: 'Community-based youth rehearsals and creative expression dialogues on child rights.',
      activity_date: '2026-03-05',
      location: 'Mwenge Community Arts Centre, Temeke',
      participants_count: 85,
      progress: 'Completed 3-day intensive workshop series. Rehearsal recordings archived.',
      challenges: 'Rainfall caused slight delay in morning transport on Day 2.',
      follow_up_actions: 'Distribute costume allowances and prepare weekend public staging.',
      submission_status: 'approved',
      submitted_by: lugano.id,
      submitted_at: '2026-03-06T10:00:00Z',
      reviewed_by: mgunga.id,
      reviewed_at: '2026-03-07T14:30:00Z',
      reviewComments: 'Outstanding community turnout. Excellent adherence to child safeguarding guidelines.',
    },
    {
      project_id: p1.id,
      title: 'Kigamboni Child Protection Community Outreach',
      description: 'Convened community child protection committees, school teachers, and local ward leaders.',
      activity_date: '2026-03-12',
      location: 'Kigamboni Ward Council Hall',
      participants_count: 120,
      progress: 'Full quorum achieved. 8 ward committees reviewed referral mechanisms.',
      challenges: 'Need more printed leaflets in Swahili for parents.',
      follow_up_actions: 'Procure additional 500 information leaflets for next session.',
      submission_status: 'submitted',
      submitted_by: lugano.id,
      submitted_at: '2026-03-13T09:15:00Z',
    },
    {
      project_id: p1.id,
      title: 'Bagamoyo Life Skills & Talent Empowerment Forum',
      description: 'Field coaching session for teenage out-of-school girls on entrepreneurship.',
      activity_date: '2026-03-18',
      location: 'Bagamoyo Youth Ground',
      participants_count: 95,
      progress: 'Mentorship circles formed with 6 local artisan role models.',
      challenges: 'Venue sound system had technical glitches.',
      follow_up_actions: 'Rent dedicated generator and PA system for follow-up session.',
      submission_status: 'submitted',
      submitted_by: lugano.id,
      submitted_at: '2026-03-19T11:00:00Z',
    },
    {
      project_id: p2.id,
      title: 'Kinondoni Assistive Devices Assessment & Fitting Clinic',
      description: 'Screening and measurement clinic for children with physical mobility challenges.',
      activity_date: '2026-03-10',
      location: 'Kinondoni Special Needs Unit',
      participants_count: 42,
      progress: '28 custom wheelchair specifications finalized; 14 canes fitted.',
      challenges: 'High demand exceeding current allocated supply batches.',
      follow_up_actions: 'Forward proforma requisitions to procurement officer for next shipment.',
      submission_status: 'approved',
      submitted_by: lugano.id,
      submitted_at: '2026-03-11T12:00:00Z',
      reviewed_by: mgunga.id,
      reviewed_at: '2026-03-12T08:45:00Z',
    },
    {
      project_id: p2.id,
      title: 'Inclusive Education Teachers Capacity Building',
      description: 'Pedagogical training for primary teachers on integrating children with sensory disabilities.',
      activity_date: '2026-03-22',
      location: 'Ilala Teacher Resource Centre',
      participants_count: 35,
      progress: 'Module 1 and 2 delivered with practical Braille and sign language basics.',
      challenges: 'Limited Braille slates available during classroom simulation.',
      follow_up_actions: 'Request procurement of 25 additional student Braille frames.',
      submission_status: 'submitted',
      submitted_by: lugano.id,
      submitted_at: '2026-03-23T15:20:00Z',
    },
    {
      project_id: p3.id,
      title: 'Early Childhood Nutrition Screenings & Growth Monitoring',
      description: 'Anthropometric measurements (MUAC) and pediatric consultations for infants.',
      activity_date: '2026-03-08',
      location: 'Mwenge Dispensary Clinic',
      participants_count: 160,
      progress: '160 children screened; 14 acute cases referred for targeted therapeutic feeding.',
      challenges: 'Cold chain storage required backup battery for vaccines.',
      follow_up_actions: 'Arrange monthly monitoring visit with district medical officer.',
      submission_status: 'approved',
      submitted_by: lugano.id,
      submitted_at: '2026-03-09T14:00:00Z',
      reviewed_by: mgunga.id,
      reviewed_at: '2026-03-10T09:30:00Z',
    },
    {
      project_id: p3.id,
      title: 'Parental Caregivers Infant Hygiene & Diet Workshop',
      description: 'Practical cooking demonstrations using locally sourced fortified porridge flour.',
      activity_date: '2026-03-25',
      location: 'Ubungo Community Hall',
      participants_count: 75,
      progress: 'Live cooking demo completed; 75 nutrition care packages distributed.',
      challenges: 'Hall capacity reached full limit early in the morning.',
      follow_up_actions: 'Secure larger open shade tent for next quarterly session.',
      submission_status: 'draft',
      submitted_by: lugano.id,
    },
  ];

  for (const act of activitiesData) {
    const { data: existing } = await supabase
      .from('activities')
      .select('id')
      .eq('project_id', act.project_id)
      .eq('title', act.title)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from('activities').insert(act);
      if (error) console.warn(`Activity "${act.title}" error:`, error.message);
      else console.log(`Inserted activity: ${act.title}`);
    } else {
      console.log(`Activity "${act.title}" already exists`);
    }
  }

  // 6. Seed Tasks
  console.log('\n--- Seeding tasks ---');
  const tasksData = [
    {
      project_id: p1.id,
      title: 'Finalize Temeke Workshop Attendance & Voucher Reconciliations',
      description: 'Cross-check participant sign-in registers with CRDB petty cash disbursals.',
      assigned_to: lugano.id,
      due_date: '2026-04-05',
      priority: 'high',
      status: 'in_progress',
      created_by: lugano.id,
    },
    {
      project_id: p1.id,
      title: 'Compile Bagamoyo Community Feedback Questionnaires',
      description: 'Enter paper survey responses into the digital M&E results framework.',
      assigned_to: lugano.id,
      due_date: '2026-04-12',
      priority: 'medium',
      status: 'todo',
      created_by: lugano.id,
    },
    {
      project_id: p2.id,
      title: 'Submit LPO Requisition for 25 Assistive Canes & Braille Slates',
      description: 'Coordinate with Procurement and Finance for vendor purchase order release.',
      assigned_to: lugano.id,
      due_date: '2026-03-30',
      priority: 'urgent',
      status: 'in_progress',
      created_by: lugano.id,
    },
    {
      project_id: p3.id,
      title: 'Distribute Micronutrient Supplements to Mwenge Clinic',
      description: 'Arrange delivery confirmation and obtain clinic in-charge verification stamp.',
      assigned_to: lugano.id,
      due_date: '2026-04-02',
      priority: 'high',
      status: 'in_progress',
      created_by: lugano.id,
    },
    {
      project_id: p1.id,
      title: 'Draft Q1 Donor Narrative Report for Foundation for Civil Society',
      description: 'Consolidate output indicators, participant reach, and photographic evidence.',
      assigned_to: lugano.id,
      due_date: '2026-04-15',
      priority: 'urgent',
      status: 'todo',
      created_by: lugano.id,
    },
    {
      project_id: p1.id,
      title: 'Submit Monthly Field Vehicle Fuel & Mileage Logsheet',
      description: 'Monthly reconciliation for project pickup truck fuel receipts.',
      assigned_to: lugano.id,
      due_date: '2026-03-28',
      priority: 'low',
      status: 'completed',
      completed_at: '2026-03-28T16:00:00Z',
      created_by: lugano.id,
    },
  ];

  for (const t of tasksData) {
    const { data: existing } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', t.project_id)
      .eq('title', t.title)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from('tasks').insert(t);
      if (error) console.warn(`Task "${t.title}" error:`, error.message);
      else console.log(`Inserted task: ${t.title}`);
    } else {
      console.log(`Task "${t.title}" already exists`);
    }
  }

  // 7. Seed Project Reports
  console.log('\n--- Seeding project_reports ---');
  const reportsData = [
    {
      project_id: p1.id,
      report_type: 'quarterly',
      period_start: '2026-01-01',
      period_end: '2026-03-31',
      title: 'Quarter 1 Progress & Implementation Report 2026',
      summary: 'Rehearsals and workshops completed across Temeke, Kigamboni, and Bagamoyo. Reached over 300 vulnerable youth.',
      status: 'submitted',
      submitted_by: lugano.id,
      submitted_at: '2026-04-01T10:00:00Z',
    },
    {
      project_id: p2.id,
      report_type: 'monthly',
      period_start: '2026-03-01',
      period_end: '2026-03-31',
      title: 'Disability Inclusion Screening & Devices Brief',
      summary: 'Conducted screening clinics in Kinondoni and trained 35 primary school teachers.',
      status: 'approved',
      submitted_by: lugano.id,
      submitted_at: '2026-03-28T11:00:00Z',
      reviewed_by: mgunga.id,
      reviewed_at: '2026-03-29T16:00:00Z',
    },
    {
      project_id: p3.id,
      report_type: 'midterm',
      period_start: '2026-01-01',
      period_end: '2026-03-31',
      title: 'Mid-Term Nutrition & Growth Monitoring Evaluation',
      summary: 'Evaluation of infant feeding interventions across Mwenge and Ubungo wards.',
      status: 'draft',
      submitted_by: lugano.id,
    },
  ];

  for (const rep of reportsData) {
    const { data: existing } = await supabase
      .from('project_reports')
      .select('id')
      .eq('project_id', rep.project_id)
      .eq('title', rep.title)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from('project_reports').insert(rep);
      if (error) console.warn(`Report "${rep.title}" error:`, error.message);
      else console.log(`Inserted report: ${rep.title}`);
    } else {
      console.log(`Report "${rep.title}" already exists`);
    }
  }

  // 8. Seed Inventory Items
  console.log('\n--- Seeding inventory_items ---');
  const inventoryData = [
    {
      sku: 'INV-ART-001',
      name: 'Youth Creative Arts & Paint Workshop Kits',
      category: 'Training Materials',
      quantity_on_hand: 150,
      reorder_point: 40,
      unit_of_measure: 'Sets',
      unit_cost: 25000,
      location: 'Mwenge Central Store, Bay A-1',
      status: 'in_stock',
    },
    {
      sku: 'INV-AST-002',
      name: 'Adjustable Mobility Canes (Youth Size)',
      category: 'Assistive Devices',
      quantity_on_hand: 8,
      reorder_point: 20,
      unit_of_measure: 'Pieces',
      unit_cost: 45000,
      location: 'Kinondoni Special Storage, Shelf 3',
      status: 'low_stock',
    },
    {
      sku: 'INV-SUP-003',
      name: 'Heavy-Duty A4 Printing Paper Reams',
      category: 'Office Supplies',
      quantity_on_hand: 6,
      reorder_point: 25,
      unit_of_measure: 'Reams',
      unit_cost: 18000,
      location: 'HQ Stationery Cupboard',
      status: 'low_stock',
    },
    {
      sku: 'INV-NUT-004',
      name: 'Micronutrient Fortified Porridge Cartons',
      category: 'Health & Nutrition',
      quantity_on_hand: 220,
      reorder_point: 75,
      unit_of_measure: 'Cartons',
      unit_cost: 65000,
      location: 'Mwenge Clinic Pantry B',
      status: 'in_stock',
    },
  ];

  for (const inv of inventoryData) {
    const { data: existing } = await supabase
      .from('inventory_items')
      .select('id')
      .eq('sku', inv.sku)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from('inventory_items').insert(inv);
      if (error) console.warn(`Inventory "${inv.sku}" error:`, error.message);
      else console.log(`Inserted inventory: ${inv.sku} - ${inv.name}`);
    } else {
      console.log(`Inventory "${inv.sku}" already exists`);
    }
  }

  console.log('\n=== OPERATIONAL SEEDING COMPLETED SUCCESSFULLY ===');
}

seedOperationalData().catch(console.error);
