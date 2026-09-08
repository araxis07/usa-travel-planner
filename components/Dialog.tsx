import { useEffect, useRef, type ReactNode } from 'react';
import Icon from './Icon';

export default function Dialog({
  children,
  title,
  onClose,
  wide = false,
  closeLabel = 'Close',
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
  wide?: boolean;
  closeLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`dialog ${wide ? 'dialog-wide' : ''}`}
      aria-label={title}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            onClose();
        }
      }}
    >
      <button
        className="icon-button dialog-close"
        aria-label={closeLabel}
        onClick={onClose}
        autoFocus
      >
        <Icon name="close" />
      </button>
      {children}
    </dialog>
  );
}
