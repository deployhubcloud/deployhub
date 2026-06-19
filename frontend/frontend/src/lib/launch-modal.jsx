import { createContext, useContext, useState, useCallback } from "react";

const LaunchModalContext = createContext({ open: false, openLaunch: () => {}, closeLaunch: () => {} });

export function LaunchModalProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openLaunch = useCallback(() => setOpen(true), []);
  const closeLaunch = useCallback(() => setOpen(false), []);
  return (
    <LaunchModalContext.Provider value={{ open, openLaunch, closeLaunch }}>
      {children}
    </LaunchModalContext.Provider>
  );
}

export function useLaunchModal() {
  return useContext(LaunchModalContext);
}
