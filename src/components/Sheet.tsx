import { ReactNode } from "react";
import { Drawer } from "vaul";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, children }: Props) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      shouldScaleBackground
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-foreground/35 backdrop-blur-sm" />
        <Drawer.Content
          className="glass-strong fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92vh] w-full max-w-md flex-col rounded-t-4xl pb-[env(safe-area-inset-bottom)] outline-none"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-center pb-2 pt-3">
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          </div>
          {title && (
            <div className="flex items-center justify-between px-5 pb-3">
              <Drawer.Title className="text-lg font-semibold">
                {title}
              </Drawer.Title>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1.5 text-muted-foreground transition active:scale-90 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {!title && (
            <Drawer.Title className="sr-only">Bottom sheet</Drawer.Title>
          )}
          <div className="overflow-y-auto overscroll-contain px-5 pb-6">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
