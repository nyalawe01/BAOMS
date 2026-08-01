import { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Upload, UserCheck } from 'lucide-react';
import Swal from 'sweetalert2';
import { FileUpload } from '@/components/application/file-upload/file-upload-base';
import { usePageLoader } from './_shared';

// ==========================================
// 3. HR ADD STAFF VIEW (SLIDING MULTI-STEP WIZARD)
// ==========================================
export function HrAddStaffView() {
  const { addUser } = useProject();
  const loading = usePageLoader([]);
  const [step, setStep] = useState(1);
  // Files must land in Storage before the new user's Auth UID exists, so
  // uploads for this onboarding session share one temporary folder id.
  const [uploadSessionId] = useState(() => crypto.randomUUID());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingPhase, setSubmittingPhase] = useState('');
  const [formData, setFormData] = useState({
    firstName: '', middleName: '', surname: '', email: '', organizationEmail: '', phone: '',
    personalId: '', nhif: '', nssf: '', dob: '', placeOfBirth: '', placeOfLiving: '',
    gender: 'Male', disability: 'No', disabilityDescription: '', nationality: '',
    officeLocation: '', department: 'Engineering', position: '',
    role: 'Intern', hireDate: new Date().toISOString().substring(0, 10),
    avatarFile: null,
    supportingDocuments: {
      cv: null,
      certificates: null,
      contract: null,
      insurance: null,
      others: null
    }
  });

  const [generatedAccount, setGeneratedAccount] = useState(null);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-slate-250 rounded w-1/3"></div>
        <div className="h-32 bg-slate-200 rounded"></div>
        <div className="h-10 bg-slate-200 rounded"></div>
      </div>
    );
  }

  const nextStep = () => {
    // Basic step validation
    if (step === 1) {
      if (!formData.firstName || !formData.surname || !formData.email) {
        Swal.fire('Error', 'First Name, Surname, and Personal Email are mandatory.', 'error');
        return;
      }
    } else if (step === 2) {
      if (!formData.officeLocation || !formData.position) {
        Swal.fire('Error', 'Office Location and Position Designation are mandatory.', 'error');
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, 4));
  };
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleFormChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleDocUpload = (docKey, fileData) => {
    setFormData(prev => ({
      ...prev,
      supportingDocuments: {
        ...prev.supportingDocuments,
        [docKey]: fileData
      }
    }));
  };

  const handleCreateStaff = async () => {
    // Check files validation
    const { cv, certificates, contract, insurance } = formData.supportingDocuments;
    if (!cv || !certificates || !contract || !insurance) {
      Swal.fire('Error', 'Please upload all mandatory documents (CV, Certificates, Contract, Insurance) before creating the account.', 'error');
      return;
    }

    setIsSubmitting(true);
    setSubmittingPhase('Verifying document profiles...');

    // Simulate steps delay to show progress illustrations
    setTimeout(async () => {
      setSubmittingPhase('Encoding and bundling document payloads...');
      setTimeout(async () => {
        setSubmittingPhase('Writing registry keys to database...');
        setTimeout(async () => {
          setSubmittingPhase('Generating credentials keys...');

          // Auto-generate password
          const tempPassword = 'Pass_' + Math.random().toString(36).slice(-6) + '!';

          const staffData = {
            ...formData,
            avatar: formData.avatarFile?.downloadUrl || '',
            tempPassword
          };

          try {
            await addUser(staffData);
            setGeneratedAccount({
              email: formData.email,
              password: tempPassword,
              name: `${formData.firstName} ${formData.surname}`.trim()
            });
            setIsSubmitting(false);
            setStep(4);
            Swal.fire('Success!', 'Staff member registered successfully.', 'success');
          } catch (e) {
            setIsSubmitting(false);
            Swal.fire('Creation Error', e.message, 'error');
          }
        }, 800);
      }, 800);
    }, 800);
  };

  const handleCopyCredentials = () => {
    navigator.clipboard.writeText(`Email: ${generatedAccount.email}\nPassword: ${generatedAccount.password}`);
    Swal.fire('Copied!', 'Credentials copied to clipboard.', 'success');
  };

  if (isSubmitting) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center space-y-6 animate-fadeIn">
        {/* Pulsing, spinning complex premium progress illustration */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Inner pulse */}
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-ping"></div>
          {/* Middle spin */}
          <div className="absolute inset-2 rounded-full border-4 border-t-indigo-650 border-indigo-200 animate-spin"></div>
          {/* Center icon */}
          <div className="absolute w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-slate-700">
            <Upload className="animate-bounce" size={20} />
          </div>
        </div>

        <div className="text-center space-y-2 max-w-sm">
          <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">Onboarding Staff Member...</h4>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed animate-pulse">{submittingPhase}</p>
        </div>

        {/* Multi-step progress bar visual indicator */}
        <div className="w-48 bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div className={`bg-indigo-600 h-full rounded-full transition-all duration-500 ${
            submittingPhase.startsWith('Verifying') ? 'w-[25%]' :
            submittingPhase.startsWith('Encoding') ? 'w-[50%]' :
            submittingPhase.startsWith('Writing') ? 'w-[75%]' : 'w-[95%]'
          }`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
      {/* Wizard Steps indicator */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Onboard New Team Member</h3>
          <p className="text-[11px] text-slate-400">Step {step} of 4: Fill out the details below.</p>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`w-3.5 h-1.5 rounded-full transition-all ${
                s === step ? 'bg-indigo-600 w-6' : s < step ? 'bg-indigo-300' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Form Steps Panels */}
      <div className="p-6 min-h-[360px] max-h-[60vh] overflow-y-auto no-scrollbar">
        {/* STEP 1: Personal Details */}
        {step === 1 && (
          <div className="space-y-4 animate-slideRight">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Step 1: Personal Information</h4>

            {/* Profile Photo upload */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 block">Profile Picture (Manually Uploaded)</label>
              <FileUpload.Root value={formData.avatarFile} onChange={(file) => handleFormChange('avatarFile', file)}>
                <FileUpload.DropZone label="Attach Profile Picture Photo" accept="image/*" storagePath={`supportingDocuments/${uploadSessionId}`} />
              </FileUpload.Root>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleFormChange('firstName', e.target.value)}
                  placeholder="Olivia"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Middle Name</label>
                <input
                  type="text"
                  value={formData.middleName}
                  onChange={(e) => handleFormChange('middleName', e.target.value)}
                  placeholder="Lana"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Surname *</label>
                <input
                  type="text"
                  value={formData.surname}
                  onChange={(e) => handleFormChange('surname', e.target.value)}
                  placeholder="Rhye"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Personal Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  placeholder="olivia@personal.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Organization Email</label>
                <input
                  type="email"
                  value={formData.organizationEmail}
                  onChange={(e) => handleFormChange('organizationEmail', e.target.value)}
                  placeholder="olivia@oms.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Phone number/s</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  placeholder="+255 711 000 222"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">National Identity No (ID)</label>
                <input
                  type="text"
                  value={formData.personalId}
                  onChange={(e) => handleFormChange('personalId', e.target.value)}
                  placeholder="ID-88776655"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">NHIF Number</label>
                <input
                  type="text"
                  value={formData.nhif}
                  onChange={(e) => handleFormChange('nhif', e.target.value)}
                  placeholder="NHIF-998811"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">NSSF Number</label>
                <input
                  type="text"
                  value={formData.nssf}
                  onChange={(e) => handleFormChange('nssf', e.target.value)}
                  placeholder="NSSF-332211"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Date of Birth (DOB)</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleFormChange('dob', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Place of Birth</label>
                <input
                  type="text"
                  value={formData.placeOfBirth}
                  onChange={(e) => handleFormChange('placeOfBirth', e.target.value)}
                  placeholder="Zanzibar"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Place of Living</label>
                <input
                  type="text"
                  value={formData.placeOfLiving}
                  onChange={(e) => handleFormChange('placeOfLiving', e.target.value)}
                  placeholder="Masaki, Dar es Salaam"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Nationality</label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => handleFormChange('nationality', e.target.value)}
                  placeholder="Kenyan"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleFormChange('gender', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Any Disability</label>
                <select
                  value={formData.disability}
                  onChange={(e) => handleFormChange('disability', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {formData.disability === 'Yes' && (
              <div className="space-y-1 animate-fadeIn">
                <label className="text-[11px] font-bold text-slate-500 block">Disability Description</label>
                <input
                  type="text"
                  value={formData.disabilityDescription}
                  onChange={(e) => handleFormChange('disabilityDescription', e.target.value)}
                  placeholder="Specify details..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Job/Office Description */}
        {step === 2 && (
          <div className="space-y-4 animate-slideRight">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Step 2: Office Location & Description</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <label className="text-[11px] font-bold text-slate-500 block">Office Location *</label>
                <input
                  type="text"
                  value={formData.officeLocation}
                  onChange={(e) => handleFormChange('officeLocation', e.target.value)}
                  placeholder="e.g. HQ Annex, Dar es Salaam"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Department Unit *</label>
                <select
                  value={formData.department}
                  onChange={(e) => handleFormChange('department', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Operations">Operations</option>
                  <option value="Finance">Finance</option>
                  <option value="HR">HR</option>
                  <option value="Program Management">Program Management</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Specific Designation / Title *</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleFormChange('position', e.target.value)}
                  placeholder="Junior Software Engineer"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Hire/Start Date</label>
                <input
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => handleFormChange('hireDate', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Authorization Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => handleFormChange('role', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="System Administrator">System Administrator</option>
                  <option value="Executive Director">Executive Director</option>
                  <option value="HR Officer">HR Officer</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Finance Officer">Finance Officer</option>
                  <option value="Procurement & Logistics Officer">Procurement & Logistics Officer</option>
                  <option value="Department Head">Department Head</option>
                  <option value="Program Officer">Program Officer</option>
                  <option value="Communications Officer">Communications Officer</option>
                  <option value="Field Officer">Field Officer</option>
                  <option value="Volunteer">Volunteer</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Attach Supporting Documents */}
        {step === 3 && (
          <div className="space-y-5 animate-slideRight">
            <div className="border-b border-slate-100 pb-1.5">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Step 3: Attach Mandatory Documents</h4>
              <p className="text-[11px] text-slate-400">All supporting documents are required to complete onboarding registration.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11.5px] font-bold text-slate-655 block">Curriculum Vitae (CV) *</label>
                <FileUpload.Root value={formData.supportingDocuments.cv} onChange={(file) => handleDocUpload('cv', file)}>
                  <FileUpload.DropZone label="Attach Curriculum Vitae (CV) PDF" accept=".pdf,.doc,.docx" storagePath={`supportingDocuments/${uploadSessionId}`} />
                </FileUpload.Root>
              </div>

              <div className="space-y-1">
                <label className="text-[11.5px] font-bold text-slate-655 block">Academic Certificates *</label>
                <FileUpload.Root value={formData.supportingDocuments.certificates} onChange={(file) => handleDocUpload('certificates', file)}>
                  <FileUpload.DropZone label="Attach Academic Credentials / Certificates" accept=".pdf,.png,.jpg,.jpeg" storagePath={`supportingDocuments/${uploadSessionId}`} />
                </FileUpload.Root>
              </div>

              <div className="space-y-1">
                <label className="text-[11.5px] font-bold text-slate-655 block">Employment Agreement Contract *</label>
                <FileUpload.Root value={formData.supportingDocuments.contract} onChange={(file) => handleDocUpload('contract', file)}>
                  <FileUpload.DropZone label="Attach Signed Employment Agreement" accept=".pdf" storagePath={`supportingDocuments/${uploadSessionId}`} />
                </FileUpload.Root>
              </div>

              <div className="space-y-1">
                <label className="text-[11.5px] font-bold text-slate-655 block">National Insurance Card (NHIF) *</label>
                <FileUpload.Root value={formData.supportingDocuments.insurance} onChange={(file) => handleDocUpload('insurance', file)}>
                  <FileUpload.DropZone label="Attach NHIF / Insurance Scan" accept=".pdf,.png,.jpg,.jpeg" storagePath={`supportingDocuments/${uploadSessionId}`} />
                </FileUpload.Root>
              </div>

              <div className="space-y-1">
                <label className="text-[11.5px] font-bold text-slate-655 block">Other Supporting Documents (Others) *</label>
                <FileUpload.Root value={formData.supportingDocuments.others} onChange={(file) => handleDocUpload('others', file)}>
                  <FileUpload.DropZone label="Attach Extra Identifications / Police Clearance" accept=".pdf,.png,.jpg,.jpeg" storagePath={`supportingDocuments/${uploadSessionId}`} />
                </FileUpload.Root>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Account Creation Result */}
        {step === 4 && generatedAccount && (
          <div className="space-y-5 text-center py-6 animate-fadeIn">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100">
              <UserCheck size={28} />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800 text-base">Staff Account Created Successfully</h4>
              <p className="text-xs text-slate-400">Share these login details with {generatedAccount.name} immediately.</p>
            </div>

            {/* Credentials Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-sm mx-auto text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Email Address:</span>
                <span className="font-bold text-slate-700">{generatedAccount.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Temp Password:</span>
                <span className="font-bold text-slate-850">{generatedAccount.password}</span>
              </div>
              <button
                onClick={handleCopyCredentials}
                className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-350 rounded text-center text-xs font-semibold font-sans mt-2"
              >
                Copy Credentials Card
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Buttons bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between shrink-0">
        {step > 1 && step < 4 ? (
          <button
            onClick={prevStep}
            className="px-4 py-2 border border-slate-250 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition-all"
          >
            Previous
          </button>
        ) : <div />}

        {step < 3 ? (
          <button
            onClick={nextStep}
            className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            Next Step
          </button>
        ) : step === 3 ? (
          <button
            onClick={handleCreateStaff}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            Create Staff & Generate Account
          </button>
        ) : (
          <button
            onClick={() => { setStep(1); setGeneratedAccount(null); setFormData({ firstName: '', middleName: '', surname: '', email: '', organizationEmail: '', phone: '', personalId: '', nhif: '', nssf: '', dob: '', placeOfBirth: '', placeOfLiving: '', gender: 'Male', disability: 'No', disabilityDescription: '', nationality: '', officeLocation: '', department: 'Engineering', position: '', role: 'Intern', hireDate: new Date().toISOString().substring(0, 10), avatarFile: null, supportingDocuments: { cv: null, certificates: null, contract: null, insurance: null, others: null } }); }}
            className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            Onboard Another User
          </button>
        )}
      </div>
    </div>
  );
}
