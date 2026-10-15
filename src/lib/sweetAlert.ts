import Swal, { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

/**
 * BAOMS Institutional SweetAlert2 Helpers
 * Consistent confirmation, success, and error alerts matching BAOMS institutional design.
 */

const baseSwalOptions: SweetAlertOptions = {
  customClass: {
    popup: 'rounded-lg border border-slate-200 shadow-xl font-sans text-slate-900',
    title: 'text-base font-bold text-slate-900 tracking-tight',
    htmlContainer: 'text-xs sm:text-sm text-slate-600 leading-relaxed',
    confirmButton: 'inline-flex items-center justify-center font-semibold text-xs px-4 py-2 rounded-md shadow-sm transition-colors text-white',
    cancelButton: 'inline-flex items-center justify-center font-medium text-xs px-4 py-2 rounded-md shadow-sm transition-colors bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 ml-2',
  },
  buttonsStyling: false,
};

export async function confirmAction(options: {
  title: string;
  text: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isDangerous?: boolean;
  icon?: 'warning' | 'question' | 'info';
}): Promise<boolean> {
  const {
    title,
    text,
    confirmButtonText = 'Confirm',
    cancelButtonText = 'Cancel',
    isDangerous = false,
    icon = 'warning',
  } = options;

  const result: SweetAlertResult = await Swal.fire({
    ...baseSwalOptions,
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    customClass: {
      ...baseSwalOptions.customClass,
      confirmButton: isDangerous
        ? 'inline-flex items-center justify-center font-semibold text-xs px-4 py-2 rounded-md shadow-sm transition-colors bg-red-600 hover:bg-red-700 text-white border border-red-700'
        : 'inline-flex items-center justify-center font-semibold text-xs px-4 py-2 rounded-md shadow-sm transition-colors bg-forest-700 hover:bg-forest-800 text-white border border-forest-800',
    },
  });

  return Boolean(result.isConfirmed);
}

export function showSuccess(title: string, text?: string): Promise<SweetAlertResult> {
  return Swal.fire({
    ...baseSwalOptions,
    icon: 'success',
    title,
    text,
    timer: 2500,
    showConfirmButton: false,
  });
}

export function showError(title: string, text?: string): Promise<SweetAlertResult> {
  return Swal.fire({
    ...baseSwalOptions,
    icon: 'error',
    title,
    text,
    confirmButtonText: 'Dismiss',
    customClass: {
      ...baseSwalOptions.customClass,
      confirmButton: 'inline-flex items-center justify-center font-semibold text-xs px-4 py-2 rounded-md shadow-sm transition-colors bg-slate-800 hover:bg-slate-900 text-white',
    },
  });
}

export function showWarning(title: string, text?: string): Promise<SweetAlertResult> {
  return Swal.fire({
    ...baseSwalOptions,
    icon: 'warning',
    title,
    text,
    confirmButtonText: 'Understood',
    customClass: {
      ...baseSwalOptions.customClass,
      confirmButton: 'inline-flex items-center justify-center font-semibold text-xs px-4 py-2 rounded-md shadow-sm transition-colors bg-amber-600 hover:bg-amber-700 text-white',
    },
  });
}

export default Swal;
