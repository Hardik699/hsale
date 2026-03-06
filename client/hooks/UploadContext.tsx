import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface UploadJob {
  id: string;
  type: string;
  year: number;
  month: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

interface UploadContextType {
  currentJob: UploadJob | null;
  setCurrentJob: (job: UploadJob | null | ((prev: UploadJob | null) => UploadJob | null)) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [currentJob, setCurrentJobState] = useState<UploadJob | null>(null);

  const setCurrentJob = (job: UploadJob | null | ((prev: UploadJob | null) => UploadJob | null)) => {
    if (typeof job === 'function') {
      setCurrentJobState(job);
    } else {
      setCurrentJobState(job);
    }
  };

  return (
    <UploadContext.Provider value={{ currentJob, setCurrentJob }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUploadContext() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUploadContext must be used within UploadProvider');
  }
  return context;
}
