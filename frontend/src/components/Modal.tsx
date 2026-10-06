import type { ReactNode } from "react";
import { useEffect, useCallback, useRef, useId } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useIsPresent,
} from "motion/react";
import { useFocusScope } from "../hooks/useFocusScope";
import Button from "./Button";
import "@/styles/components/Modal.css";

function ModalOverlay({
  children,
  onClick,
  reducedMotion,
}: {
  children: ReactNode;
  onClick?: () => void;
  reducedMotion: boolean | null;
}) {
  const present = useIsPresent();
  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.15 }}
      style={{ pointerEvents: present ? "auto" : "none" }}
      inert={!present}
      aria-hidden={!present || undefined}
      onClick={onClick}
      data-testid="modal-overlay"
    >
      {children}
    </motion.div>
  );
}

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
  /** Si el modal está abierto */
  open: boolean;
  /** Callback al cerrar */
  onClose: () => void;
  /** Título del modal */
  title: string;
  /** Contenido del modal */
  children: ReactNode;
  /** Tamaño del modal */
  size?: ModalSize;
  /** Mostrar botón de cerrar en header */
  showCloseButton?: boolean;
  /** Texto del botón de cerrar (aria-label) */
  closeLabel?: string;
  /** Contenido del footer (botones de acción) */
  footer?: ReactNode;
  /** Si se puede cerrar con Escape */
  closeOnEscape?: boolean;
  /** Si se puede cerrar clickeando el overlay */
  closeOnOverlayClick?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * Modal — Componente de modal accesible con focus trap, Escape, overlay click.
 * Usa portal nativo (se renderiza al final de body).
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeLabel = "Cerrar",
  footer,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  className = "",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const reducedMotion = useReducedMotion();
  useFocusScope({ active: open, container: modalRef });
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!closeOnEscape) return;
      if (e.key === "Escape") onClose();
    },
    [closeOnEscape, onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, closeOnEscape, handleKeyDown]);

  const modalClasses = ["modal", `modal-${size}`, className]
    .filter(Boolean)
    .join(" ");

  return createPortal(
    <AnimatePresence>
      {open && (
        <ModalOverlay
          reducedMotion={reducedMotion}
          onClick={closeOnOverlayClick ? onClose : undefined}
        >
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            initial={{
              opacity: 0,
              transform: reducedMotion ? "none" : "translateY(16px) scale(.98)",
            }}
            animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
            exit={{
              opacity: 0,
              transform: reducedMotion ? "none" : "translateY(16px) scale(.98)",
            }}
            transition={{
              type: "spring",
              bounce: 0,
              duration: reducedMotion ? 0 : 0.3,
            }}
            className={modalClasses}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id={titleId} className="modal-title">
                {title}
              </h2>
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  aria-label={closeLabel}
                  className="modal-close"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </Button>
              )}
            </div>

            <div className="modal-body">{children}</div>

            {footer && <div className="modal-footer">{footer}</div>}
          </motion.div>
        </ModalOverlay>
      )}
    </AnimatePresence>,
    document.body,
  );
}
