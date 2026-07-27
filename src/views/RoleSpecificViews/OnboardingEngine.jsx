import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  UserCheck
} from 'lucide-react';
import Swal from 'sweetalert2';
import { BadgeGroup } from "@/components/base/badges/badge-groups";
import { Select } from "@/components/base/select/select";

export function OnboardingEngine() {
  const { addUser } = useProject();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [personalId, setPersonalId] = useState('');
  const [cvName, setCvName] = useState('');
  const [nhif, setNhif] = useState('');
  const [nssf, setNssf] = useState('');
  const [role, setRole] = useState('Volunteer');
  const [department, setDepartment] = useState('Engineering');
  const [generatedUser, setGeneratedUser] = useState(null);

  const roleItems = [
    { label: "Volunteer", id: "Volunteer" },
    { label: "Intern", id: "Intern" },
    { label: "Program Officer", id: "Program Officer" },
    { label: "Finance Officer", id: "Finance Officer" },
    { label: "Project Manager", id: "Project Manager" },
    { label: "Procurement & Logistics Officer", id: "Procurement & Logistics Officer" },
    { label: "Department Head", id: "Department Head" },
    { label: "Communications Officer", id: "Communications Officer" },
    { label: "Field Officer", id: "Field Officer" }
  ];

  const deptItems = [
    { label: "Engineering", id: "Engineering" },
    { label: "Program Management", id: "Program Management" },
    { label: "HR", id: "HR" },
    { label: "Communications", id: "Communications" },
    { label: "Finance", id: "Finance" },
    { label: "Procurement", id: "Procurement" },
    { label: "Field Operations", id: "Field Operations" }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) return;

    Swal.fire({
      title: 'Confirm Onboarding',
      text: `Are you sure you want to onboard ${name} as a ${role} in the ${department} department?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Onboard Resource'
    }).then((result) => {
      if (result.isConfirmed) {
        const tempPassword = 'OMS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const onboardedUser = {
          name,
          email,
          phone,
          personalId,
          cvName,
          nhif,
          nssf,
          role,
          department,
          tempPassword
        };

        addUser(onboardedUser);
        setGeneratedUser(onboardedUser);

        // Reset Form
        setName('');
        setEmail('');
        setPhone('');
        setPersonalId('');
        setCvName('');
        setNhif('');
        setNssf('');

        Swal.fire({
          title: 'Success!',
          text: `Security profile has been successfully initialized and generated for ${onboardedUser.name}.`,
          icon: 'success',
          confirmButtonColor: '#4f46e5'
        });
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <UserCheck className="text-indigo-650" size={18} />
          <span>Staff Onboarding Engine</span>
        </h3>
        <p className="text-[11px] text-slate-400">Onboard new organizational talent, record mandatory support files, and auto-initialize security profiles.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Samuel Kimani" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-805 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              placeholder="e.g. samuel@oms.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-850 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number</label>
            <input 
              type="text" 
              placeholder="e.g. +255 700 123 456" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-850 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">National ID Number</label>
            <input 
              type="text" 
              required
              placeholder="e.g. 34567890" 
              value={personalId}
              onChange={(e) => setPersonalId(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-850 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CV Document Name</label>
            <input 
              type="text" 
              placeholder="e.g. CV_Kimani.pdf" 
              value={cvName}
              onChange={(e) => setCvName(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-850 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">NHIF Identifier</label>
            <input 
              type="text" 
              required
              placeholder="NHIF Number" 
              value={nhif}
              onChange={(e) => setNhif(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-850 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">PSSF / NSSF Code</label>
            <input 
              type="text" 
              required
              placeholder="NSSF Number" 
              value={nssf}
              onChange={(e) => setNssf(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-850 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Select
              isRequired
              label="Assigned Security Role"
              placeholder="Select security role"
              value={role}
              onChange={setRole}
              items={roleItems}
            >
              {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
            </Select>
          </div>
          <div>
            <Select
              isRequired
              label="Operational Department"
              placeholder="Select department"
              value={department}
              onChange={setDepartment}
              items={deptItems}
            >
              {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
            </Select>
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-650/10"
        >
          <UserCheck size={14} />
          <span>Execute Onboarding and Credentials Auto-Gen</span>
        </button>
      </form>

      {generatedUser && (
        <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-4 space-y-2.5 animate-fadeIn">
          <BadgeGroup addonText="Success" color="success" theme="light" align="leading" size="md">
            You've successfully created a new staff profile
          </BadgeGroup>
          <div className="text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-650 font-mono bg-white p-3 rounded-lg border border-indigo-100">
            <div><strong>Name:</strong> {generatedUser.name}</div>
            <div><strong>Email:</strong> {generatedUser.email}</div>
            <div><strong>Role:</strong> {generatedUser.role}</div>
            <div><strong>Dept:</strong> {generatedUser.department}</div>
            <div><strong>NHIF:</strong> {generatedUser.nhif}</div>
            <div><strong>NSSF/PSSF:</strong> {generatedUser.nssf}</div>
            <div className="col-span-1 sm:col-span-2 text-indigo-700 font-semibold border-t border-indigo-50 pt-1.5 mt-1 truncate">
              <strong>Temporary Password:</strong> {generatedUser.tempPassword}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
