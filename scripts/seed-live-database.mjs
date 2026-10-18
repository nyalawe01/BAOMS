import { createClient } from '@supabase/supabase-js';

const url = 'https://sqleehfbooigtthzmvbd.supabase.co';
const anonKey = 'sb_publishable_L2QYbVnAa3XTfImkz99AEg_SOT_zES4';
const supabase = createClient(url, anonKey);

async function seed() {
  console.log('=== SEEDING REALISTIC OPERATIONAL DATA INTO SUPABASE DATABASE ===');

  // 1. Authenticate as Admin with retry
  let auth = null;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      console.log(`Login attempt ${attempt}...`);
      const res = await supabase.auth.signInWithPassword({
        email: 'admin@babawatoto.or.tz',
        password: 'Admin@BabaWatoto2026!',
      });
      if (res.data?.session) {
        auth = res.data;
        break;
      }
      console.log('Login failed:', res.error?.message);
    } catch (err) {
      console.log(`Attempt ${attempt} network error:`, err.message);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (!auth?.session) {
    console.error('Failed to log in as admin after retries.');
    process.exit(1);
  }

  const authed = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${auth.session.access_token}` } },
  });

  const adminId = auth.user.id;
  console.log('Authenticated as Admin ID:', adminId);

  // 2. Resolve Profiles
  const { data: profiles } = await authed.from('profiles').select('id, official_email, display_name');
  const elinami = profiles.find((p) => p.official_email?.includes('elinami')) || profiles[0];
  const mgunga = profiles.find((p) => p.official_email?.includes('mgunga')) || profiles[0];
  const lugano = profiles.find((p) => p.official_email?.includes('lugano')) || profiles[0];
  const hussein = profiles.find((p) => p.official_email?.includes('hussein')) || profiles[0];

  console.log('Profiles verified:');
  console.log('  Admin:', adminId);
  console.log('  Elinami:', elinami.id);
  console.log('  Mgunga:', mgunga.id);
  console.log('  Lugano:', lugano.id);
  console.log('  Hussein:', hussein.id);

  // 3. Projects
  console.log('\n--- Seeding Projects ---');
  const projectsData = [
    {
      id: 'e1a00000-0000-0000-0000-000000000001',
      project_code: 'PRJ-2026-001',
      name: 'Youth Empowerment & Community Arts Program',
      description: 'Community-based cultural training, life skills, and talent empowerment.',
      funder: 'Foundation for Civil Society (FCS)',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      status: 'active',
      total_budget: 120000000,
      currency: 'TZS',
      created_by: adminId,
    },
    {
      id: 'e1a00000-0000-0000-0000-000000000002',
      project_code: 'PRJ-2026-002',
      name: 'Children With Disabilities Inclusion Initiative',
      description: 'Inclusive education, physical rehabilitation aids, and psychosocial care.',
      funder: 'UNICEF Tanzania',
      start_date: '2026-02-01',
      end_date: '2026-11-30',
      status: 'active',
      total_budget: 85000000,
      currency: 'TZS',
      created_by: adminId,
    },
    {
      id: 'e1a00000-0000-0000-0000-000000000003',
      project_code: 'PRJ-2026-003',
      name: 'Early Childhood Development & Nutrition Centre',
      description: 'Preschool child development, daily nutritious meals, and health monitoring.',
      funder: 'Aga Khan Foundation (AKF)',
      start_date: '2026-03-01',
      end_date: '2026-12-31',
      status: 'planning',
      total_budget: 65000000,
      currency: 'TZS',
      created_by: adminId,
    },
  ];

  for (const prj of projectsData) {
    const { error } = await authed.from('projects').upsert(prj);
    if (error) console.log(`  Project ${prj.project_code} upsert error:`, error.message);
    else console.log(`  Project ${prj.project_code} (${prj.name}) OK`);
  }

  // 4. Budgets
  console.log('\n--- Seeding Budgets ---');
  const budgetsData = [
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      project_id: 'e1a00000-0000-0000-0000-000000000001',
      fiscal_year: '2026',
      code: 'BUD-BYA-ACT',
      name: 'Youth Arts & Theatre Workshops',
      category: 'programmatic',
      allocated_amount: 55000000,
      currency: 'TZS',
      status: 'active',
      notes: 'Workshops, per diems, stage productions, and student materials.',
      created_by: adminId,
    },
    {
      id: 'c0000000-0000-0000-0000-000000000002',
      project_id: 'e1a00000-0000-0000-0000-000000000001',
      fiscal_year: '2026',
      code: 'BUD-BYA-CAP',
      name: 'Equipment, Production & Costumes',
      category: 'capital',
      allocated_amount: 35000000,
      currency: 'TZS',
      status: 'active',
      notes: 'Sound equipment, traditional attire, and audio recording kits.',
      created_by: adminId,
    },
    {
      id: 'c0000000-0000-0000-0000-000000000003',
      project_id: null,
      fiscal_year: '2026',
      code: 'BUD-OPS-GEN',
      name: 'General Institutional Operations',
      category: 'operational',
      allocated_amount: 45000000,
      currency: 'TZS',
      status: 'active',
      notes: 'Office utilities, communications, statutory compliance, audit, and rent.',
      created_by: adminId,
    },
    {
      id: 'c0000000-0000-0000-0000-000000000004',
      project_id: 'e1a00000-0000-0000-0000-000000000002',
      fiscal_year: '2026',
      code: 'BUD-CWD-AIDS',
      name: 'Inclusive Assistive Devices & Therapies',
      category: 'programmatic',
      allocated_amount: 40000000,
      currency: 'TZS',
      status: 'active',
      notes: 'Wheelchairs, hearing devices, and medical assessment clinic visits.',
      created_by: adminId,
    },
  ];

  for (const b of budgetsData) {
    const { error } = await authed.from('budgets').upsert(b);
    if (error) console.log(`  Budget ${b.code} upsert error:`, error.message);
    else console.log(`  Budget ${b.code} (${b.name}) OK`);
  }

  // 5. Financial Requests (Requisitions)
  console.log('\n--- Seeding Financial Requisitions ---');
  const requestsData = [
    {
      id: 'f1000000-0000-0000-0000-000000000001',
      request_number: 'REQ-2026-001',
      project_id: 'e1a00000-0000-0000-0000-000000000001',
      budget_id: 'c0000000-0000-0000-0000-000000000001',
      requester_id: adminId,
      request_type: 'activity_expense',
      title: 'Youth Community Arts Workshop Facilitation & Materials',
      purpose: 'Printing participant guides, stationery, water, and lunch for 45 youth leaders.',
      total_amount: 3200000,
      currency: 'TZS',
      status: 'submitted',
      priority: 'normal',
      due_date: '2026-04-10',
      submitted_at: '2026-03-20T10:00:00Z',
    },
    {
      id: 'f1000000-0000-0000-0000-000000000002',
      request_number: 'REQ-2026-002',
      project_id: 'e1a00000-0000-0000-0000-000000000001',
      budget_id: 'c0000000-0000-0000-0000-000000000002',
      requester_id: adminId,
      request_type: 'procurement',
      title: 'Acoustic Sound Monitors & Stage Lighting Rental',
      purpose: 'Sound reinforcement system for Bagamoyo youth talent festival.',
      total_amount: 1850000,
      currency: 'TZS',
      status: 'under_review',
      priority: 'urgent',
      due_date: '2026-04-05',
      submitted_at: '2026-03-22T08:30:00Z',
    },
    {
      id: 'f1000000-0000-0000-0000-000000000003',
      request_number: 'REQ-2026-003',
      project_id: null,
      budget_id: 'c0000000-0000-0000-0000-000000000003',
      requester_id: adminId,
      request_type: 'operational',
      title: 'Dedicated HQ Fiber Internet & Cloud Services (Q1 2026)',
      purpose: 'Settling quarterly high-speed Internet link invoice with Liquid Telecom.',
      total_amount: 5200000,
      approved_amount: 5200000,
      paid_amount: 5200000,
      currency: 'TZS',
      status: 'paid',
      priority: 'normal',
      due_date: '2026-03-15',
      submitted_at: '2026-03-01T09:00:00Z',
      approved_at: '2026-03-05T14:00:00Z',
      approved_by: mgunga.id,
    },
    {
      id: 'f1000000-0000-0000-0000-000000000004',
      request_number: 'REQ-2026-004',
      project_id: 'e1a00000-0000-0000-0000-000000000001',
      budget_id: 'c0000000-0000-0000-0000-000000000001',
      requester_id: adminId,
      request_type: 'activity_expense',
      title: 'Field Visit Coaster Bus Transport & Refreshments',
      purpose: 'Transportation for 35 drama students visiting Bagamoyo historical sites.',
      total_amount: 2800000,
      approved_amount: 2800000,
      paid_amount: 1400000,
      currency: 'TZS',
      status: 'partially_paid',
      priority: 'normal',
      due_date: '2026-03-28',
      submitted_at: '2026-03-10T11:00:00Z',
      approved_at: '2026-03-12T16:00:00Z',
      approved_by: adminId,
    },
    {
      id: 'f1000000-0000-0000-0000-000000000005',
      request_number: 'REQ-2026-005',
      project_id: null,
      budget_id: 'c0000000-0000-0000-0000-000000000003',
      requester_id: adminId,
      request_type: 'operational',
      title: 'Printing of BAOMS Safeguarding & Child Protection Handbooks',
      purpose: 'Publishing 500 copies of the revised child protection policy for schools.',
      total_amount: 4500000,
      approved_amount: 4500000,
      paid_amount: 0,
      currency: 'TZS',
      status: 'approved',
      priority: 'normal',
      due_date: '2026-04-15',
      submitted_at: '2026-03-18T10:00:00Z',
      approved_at: '2026-03-24T12:00:00Z',
      approved_by: mgunga.id,
    },
  ];

  for (const r of requestsData) {
    const { error } = await authed.from('financial_requests').upsert(r);
    if (error) console.log(`  Request ${r.request_number} upsert error:`, error.message);
    else console.log(`  Request ${r.request_number} (${r.title}) OK`);
  }

  // 6. Financial Request Lines
  console.log('\n--- Seeding Financial Request Lines ---');
  const linesData = [
    {
      request_id: 'f1000000-0000-0000-0000-000000000001',
      line_number: 1,
      description: 'Training Workbooks & Resource Binders (45 copies)',
      quantity: 45,
      unit_cost: 30000,
      total_cost: 1350000,
      budget_category: 'Printing & Materials',
    },
    {
      request_id: 'f1000000-0000-0000-0000-000000000001',
      line_number: 2,
      description: 'Catering: Lunch & Tea for 45 students over 2 workshop days',
      quantity: 90,
      unit_cost: 15000,
      total_cost: 1350000,
      budget_category: 'Meals & Catering',
    },
    {
      request_id: 'f1000000-0000-0000-0000-000000000001',
      line_number: 3,
      description: 'Facilitator Local Transport & Communication Allowance',
      quantity: 2,
      unit_cost: 250000,
      total_cost: 500000,
      budget_category: 'Honoraria & Transport',
    },
    {
      request_id: 'f1000000-0000-0000-0000-000000000003',
      line_number: 1,
      description: 'Liquid Telecom Dedicated Internet (30 Mbps Fiber - 3 Months)',
      quantity: 3,
      unit_cost: 1733333.33,
      total_cost: 5200000,
      budget_category: 'Utilities & Internet',
    },
    {
      request_id: 'f1000000-0000-0000-0000-000000000004',
      line_number: 1,
      description: 'Coaster Bus Hire (2 Days)',
      quantity: 2,
      unit_cost: 1000000,
      total_cost: 2000000,
      budget_category: 'Transport',
    },
    {
      request_id: 'f1000000-0000-0000-0000-000000000004',
      line_number: 2,
      description: 'Snacks & Drinking Water for 35 participants',
      quantity: 35,
      unit_cost: 22857.14,
      total_cost: 800000,
      budget_category: 'Refreshments',
    },
  ];

  for (const l of linesData) {
    const { error } = await authed.from('financial_request_lines').upsert(l, { onConflict: 'request_id, line_number' });
    if (error) console.log(`  Line error for req ${l.request_id}:`, error.message);
    else console.log(`  Line ${l.line_number} (${l.description}) OK`);
  }

  // 7. Payment Transactions
  console.log('\n--- Seeding Payment Disbursements ---');
  const transactionsData = [
    {
      id: 'd1000000-0000-0000-0000-000000000001',
      transaction_number: 'TXN-2026-001',
      request_id: 'f1000000-0000-0000-0000-000000000003',
      payment_method: 'bank_transfer',
      payment_reference: 'VCH-CRDB-2026-0081',
      amount: 5200000,
      currency: 'TZS',
      payment_date: '2026-03-08',
      payee_name: 'Liquid Telecom Tanzania Ltd',
      payee_contact: '+255 22 211 4455',
      bank_name: 'CRDB Bank Plc',
      bank_account_number: '0150284719200',
      disbursed_by: adminId,
      notes: 'Quarterly payment for dedicated fiber link at Mwenge Arts Centre.',
      status: 'completed',
    },
    {
      id: 'd1000000-0000-0000-0000-000000000002',
      transaction_number: 'TXN-2026-002',
      request_id: 'f1000000-0000-0000-0000-000000000004',
      payment_method: 'mobile_money',
      payment_reference: 'VCH-MPESA-2026-0142',
      amount: 1400000,
      currency: 'TZS',
      payment_date: '2026-03-14',
      payee_name: 'Bagamoyo Express Transport Services',
      payee_contact: '+255 754 889 123',
      bank_name: 'Vodacom M-Pesa',
      bank_account_number: '0754889123',
      disbursed_by: adminId,
      notes: '50% advance bus booking deposit for youth cultural outing.',
      status: 'completed',
    },
  ];

  for (const t of transactionsData) {
    const { error } = await authed.from('transactions').upsert(t);
    if (error) console.log(`  Transaction ${t.transaction_number} upsert error:`, error.message);
    else console.log(`  Transaction ${t.transaction_number} (${t.payment_reference}) OK`);
  }

  // 8. Vendors & Purchase Orders
  console.log('\n--- Seeding Vendors & Purchase Orders ---');
  const vendorId = 'ba000000-0000-0000-0000-000000000001';
  const vendorData = {
    id: vendorId,
    vendor_code: 'VND-2026-01',
    business_name: 'AfriTech Supplies & Printing Ltd',
    category: 'office_supplies',
    contact_person: 'Grace Malecela',
    email: 'sales@afritech.co.tz',
    phone: '+255 765 443 221',
    physical_address: 'Plot 45, Ali Hassan Mwinyi Rd, Dar es Salaam',
    tin_number: '128-492-019',
    vrn_number: '40-029182-A',
    bank_name: 'CRDB Bank Plc',
    bank_account_number: '0150293847100',
    is_compliant: true,
  };

  const { error: vErr } = await authed.from('vendors').upsert(vendorData);
  if (vErr) console.log('  Vendor error:', vErr.message);
  else console.log('  Vendor AfriTech Supplies OK');

  const poData = {
    id: 'ba000000-0000-0000-0000-000000000002',
    order_number: 'PO-2026-001',
    project_id: 'e1a00000-0000-0000-0000-000000000001',
    vendor_id: vendorId,
    title: '500x Revised Child Protection Handbooks & Workshop Kits',
    total_amount: 4500000,
    currency: 'TZS',
    status: 'delivered',
    requested_by: adminId,
    order_date: '2026-03-12',
    expected_delivery_date: '2026-03-24',
    notes: 'Printed books inspected and approved at headquarters.',
  };

  const { error: poErr } = await authed.from('purchase_orders').upsert(poData);
  if (poErr) console.log('  Purchase order error:', poErr.message);
  else console.log('  Purchase Order PO-2026-001 OK');

  console.log('\n=== SEEDING COMPLETED SUCCESSFULLY! ===');
}

seed().catch(console.error);
