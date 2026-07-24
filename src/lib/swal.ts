import Swal from 'sweetalert2';

// Custom SweetAlert2 Toast configuration for lightweight notifications
export const SwalToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

// Toast helpers
export const showToast = {
  success: (title: string, text?: string) => {
    SwalToast.fire({
      icon: 'success',
      title,
      text,
    });
  },
  error: (title: string, text?: string) => {
    SwalToast.fire({
      icon: 'error',
      title,
      text,
    });
  },
  info: (title: string, text?: string) => {
    SwalToast.fire({
      icon: 'info',
      title,
      text,
    });
  },
  warning: (title: string, text?: string) => {
    SwalToast.fire({
      icon: 'warning',
      title,
      text,
    });
  }
};

// Alert Modal helpers
export const showAlert = {
  success: (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'success',
      confirmButtonColor: '#15803d', // green-700
      confirmButtonText: 'OK',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm'
      }
    });
  },
  error: (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonColor: '#dc2626', // red-600
      confirmButtonText: 'Tutup',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm'
      }
    });
  },
  info: (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'info',
      confirmButtonColor: '#0284c7', // sky-600
      confirmButtonText: 'Mengerti',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm'
      }
    });
  },
  warning: (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      confirmButtonColor: '#d97706', // amber-600
      confirmButtonText: 'OK',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm'
      }
    });
  },
  confirm: async (title: string, text: string, confirmButtonText = 'Ya, Hapus'): Promise<boolean> => {
    const result = await Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText,
      cancelButtonText: 'Batal',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm',
        cancelButton: 'px-5 py-2.5 rounded-xl font-bold text-sm'
      }
    });
    return result.isConfirmed;
  }
};

export default Swal;
