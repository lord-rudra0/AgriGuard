import React, { createContext, useContext, useState } from 'react';

const ScanContext = createContext(null);

export const ScanProvider = ({ children }) => {
  const [scannedFile, setScannedFile] = useState(null);

  const clearScan = () => setScannedFile(null);

  return (
    <ScanContext.Provider value={{ scannedFile, setScannedFile, clearScan }}>
      {children}
    </ScanContext.Provider>
  );
};

export const useScan = () => {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error('useScan must be used within ScanProvider');
  return ctx;
};

export default ScanContext;
