'use client';

import * as React from 'react';
import { Patient } from '@/services/api';
import { apiService } from '@/services/api';

const { createContext, useContext, useState, useCallback } = React;
type ReactNode = React.ReactNode;

interface PatientContextType {
  patients: Patient[];
  currentPatient: Patient | null;
  loading: boolean;
  error: string | null;
  fetchPatients: (searchParams?: Record<string, any>) => Promise<void>;
  setCurrentPatient: (patient: Patient | null) => void;
  clearError: () => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentPatient, setCurrentPatientState] = useState<Patient | null>(() => {
    // Initialize from session storage if available
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('currentPatient');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update session storage when currentPatient changes
  const setCurrentPatient = useCallback((patient: Patient | null) => {
    setCurrentPatientState(patient);
    if (patient) {
      sessionStorage.setItem('currentPatient', JSON.stringify(patient));
    } else {
      sessionStorage.removeItem('currentPatient');
    }
  }, []);

  const fetchPatients = useCallback(async (searchParams: Record<string, any> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getPatients(searchParams) as unknown as any;
      
      let patientsData = [];
      if (Array.isArray(data)) {
        patientsData = data;
      } else if (data && typeof data === 'object') {
        patientsData = Object.values(data);
      }
      
      const mappedPatients = patientsData.map((patient: any) => ({
        ...patient,
        SSN: patient.PatientSSN || patient['SSN No'] || ''
      }));
      
      setPatients(mappedPatients);
      
      // Update current patient with fresh data without adding a dependency cycle
      setCurrentPatientState(prevPatient => {
        if (!prevPatient) return null;
        const updatedPatient = mappedPatients.find((p: any) => p.id === prevPatient.id);
        if (updatedPatient) {
          sessionStorage.setItem('currentPatient', JSON.stringify(updatedPatient));
          return updatedPatient;
        }
        return prevPatient;
      });
      
      return mappedPatients;
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to fetch patients. Please try again.');
      console.error('Error fetching patients:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [setCurrentPatientState]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    patients,
    currentPatient,
    loading,
    error,
    fetchPatients,
    setCurrentPatient,
    clearError,
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
};

export const usePatients = () => {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
};

export default PatientContext;
