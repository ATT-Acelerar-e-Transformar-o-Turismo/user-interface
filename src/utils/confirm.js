// Imperative confirm dialog — usage:
//
//   import { confirmAction } from '../utils/confirm';
//   if (await confirmAction({ title: '...', message: '...' })) {
//     await doThing();
//   }
//
// A single <ConfirmDialogHost /> must be mounted at the app root for the
// promise to resolve (it's wired up in main.jsx alongside <ToastContainer />).
// Same pull-based pattern as utils/toast.js so there's no React Context to
// thread through every page.

let host = null;

export function registerConfirmHost(fn) {
  host = fn;
  return () => { if (host === fn) host = null; };
}

export function confirmAction(options = {}) {
  if (typeof host !== 'function') {
    // Fallback so a missing host doesn't silently swallow the action.
    return Promise.resolve(window.confirm(options.message || options.title || 'Confirm?'));
  }
  return host(options);
}
