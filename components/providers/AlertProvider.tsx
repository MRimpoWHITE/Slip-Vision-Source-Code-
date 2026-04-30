// components/providers/AlertProvider.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import AlertModal, { AlertType } from "@/components/AlertModal";

interface AlertContextType {
  // ✅ แก้ตรง onConfirm ให้รับ val? ได้
  showAlert: (type: AlertType, title: string, message: string, onConfirm?: (val?: string) => void) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    isOpen: boolean;
    type: AlertType;
    title: string;
    message: string;
    onConfirm?: (val?: string) => void;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const showAlert = (type: AlertType, title: string, message: string, onConfirm?: (val?: string) => void) => {
    setState({ isOpen: true, type, title, message, onConfirm });
  };

  const closeAlert = () => {
    setState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {state.isOpen && (
      <AlertModal 
        isOpen={state.isOpen}
        onClose={closeAlert}
        type={state.type}
        title={state.title}
        message={state.message}
        onConfirm={state.onConfirm}
      />
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert must be used within AlertProvider");
  return context;
}