import { useCallback, useEffect, useState } from 'react';

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

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const requestClose = useCallback(() => {
    setVisible(false);
    const id = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(id);
  }, [onClose, duration]);

  const backdropClass = `absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`;
  const panelClass = `transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`;

  return { visible, requestClose, backdropClass, panelClass };
}
