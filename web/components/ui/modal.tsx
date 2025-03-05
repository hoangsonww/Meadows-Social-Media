import React, { ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Interface for the modal component props
 */
type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
};

/**
 * The modal component - very simple and straightforward
 * to render the modal on the screen
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  emptyMessage,
  isEmpty = false,
}: ModalProps) {
  // If the modal is not open, return null to not render anything
  if (!open) {
    return null;
  }

  // Results will just be a list of items, so we can render them
  // in a list format. Example usage: In profile page, we can render
  // the list of followers/following profiles.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
      />
      {/* Modal container */}
      <div
        className="relative z-10 w-full max-w-lg rounded-lg bg-card text-card-foreground 
        shadow-xl transform transition-all duration-300 sm:my-8 sm:w-full hover:shadow-2xl"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b
           border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 
            dark:hover:text-gray-100 transition-colors duration-200 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {isEmpty ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-center text-gray-500 dark:text-gray-400">
                {emptyMessage || "No data available."}
              </p>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
