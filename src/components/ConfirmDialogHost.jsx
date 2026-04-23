import { useEffect, useState, useRef } from 'react';
import ConfirmModal from './ConfirmModal';
import { registerConfirmHost } from '../utils/confirm';

/**
 * Mounted once at the app root. Listens to `confirmAction()` calls and
 * resolves the returned promise with the user's choice.
 */
export default function ConfirmDialogHost() {
  const [state, setState] = useState(null); // { title, message, resolve }
  const pendingRef = useRef(null);

  useEffect(() => {
    return registerConfirmHost((opts) => new Promise((resolve) => {
      // Only one dialog at a time. If a new call comes in while an older one
      // is still open, auto-cancel the older one so nothing leaks.
      if (pendingRef.current) {
        pendingRef.current(false);
      }
      pendingRef.current = resolve;
      setState({
        title: opts.title,
        message: opts.message,
      });
    }));
  }, []);

  const finish = (ok) => {
    const resolve = pendingRef.current;
    pendingRef.current = null;
    setState(null);
    if (resolve) resolve(ok);
  };

  return (
    <ConfirmModal
      isOpen={!!state}
      title={state?.title}
      message={state?.message}
      onConfirm={() => finish(true)}
      onCancel={() => finish(false)}
    />
  );
}
