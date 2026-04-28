import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
  onClose,
  children,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="glass-strong pointer-events-auto w-full max-w-sm rounded-3xl p-6 text-center"
            >
              <h3 className="text-lg font-semibold">{title}</h3>
              {description && (
                <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
              )}
              {children}
              <div className="mt-5 flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold transition active:scale-[0.97] hover:bg-muted"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 rounded-2xl py-3 text-sm font-semibold text-primary-foreground shadow-glow transition active:scale-[0.97] ${
                    destructive ? "bg-destructive" : "bg-gradient-brand"
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
