import toast from 'react-hot-toast';

const defaultOptions = {
  duration: 4000,
};

export const showSuccessToast = (message, options = {}) =>
  toast.success(message, { ...defaultOptions, ...options });

export const showErrorToast = (message, options = {}) =>
  toast.error(message, { ...defaultOptions, ...options });

export const showInfoToast = (message, options = {}) =>
  toast(message, { ...defaultOptions, ...options });

export const showLoadingToast = (message, options = {}) =>
  toast.loading(message, { duration: Infinity, ...options });

export const showPromiseToast = (promise, messages, options = {}) =>
  toast.promise(
    promise,
    {
      loading: messages?.loading || 'Loading...',
      success: messages?.success || 'Done!',
      error: messages?.error || 'Something went wrong',
    },
    { ...defaultOptions, ...options }
  );

export const dismissToast = (toastId) => toast.dismiss(toastId);

export default toast;
