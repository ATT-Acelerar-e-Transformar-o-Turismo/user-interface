const listeners = new Set();
let nextId = 0;

export function subscribeToasts(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(variant, message, duration = 5000) {
  if (!message) return;
  const toast = { id: ++nextId, variant, message, duration };
  listeners.forEach(fn => fn(toast));
}

export const showError = (message, duration) => emit('error', message, duration);
export const showSuccess = (message, duration) => emit('success', message, duration);
export const showInfo = (message, duration) => emit('info', message, duration);
