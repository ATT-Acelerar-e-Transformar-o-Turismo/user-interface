import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Drives the open/close transition for a right-side slide-over panel.
 *
 * The panel is mounted by the parent (conditionally). On mount it animates in;
 * call `requestClose()` to animate out and then invoke the parent's `onClose`
 * after the transition finishes (so the exit animation is visible before the
 * component unmounts).
 *
 * Usage:
 *   const { requestClose, backdropClass, panelClass } = useSlideOver(onClose);
 *   <div className={backdropClass} onClick={requestClose} />
 *   <aside className={`... ${panelClass}`}> ... </aside>
 */
export default function useSlideOver(onClose, duration = 300) {
  const [visible, setVisible] = useState(false);
  // Ref instead of state — we only need to track the pending close timer so we
  // can clear it on unmount or on a repeat click. Mutating a ref doesn't
  // trigger re-renders, which is what we want.
  const closeTimerRef = useRef(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => {
      cancelAnimationFrame(raf);
      // Always clear a pending close timer on unmount so its callback can't
      // fire onClose against a stale parent after the panel has gone away.
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  const requestClose = useCallback(() => {
    // Coalesce repeat clicks: a second click during the exit animation must
    // not stack another timeout that would invoke onClose a second time.
    if (closeTimerRef.current) return;
    setVisible(false);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      onClose?.();
    }, duration);
  }, [onClose, duration]);

  const backdropClass = `absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`;
  const panelClass = `transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`;

  return { visible, requestClose, backdropClass, panelClass };
}
