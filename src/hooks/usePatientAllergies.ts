import { useState, useEffect, useCallback } from 'react';

export interface Allergy {
  Allergies: string;
  Cancel: string;
  Date: string;
  "Nature of Reaction": string;
  "Observed/Historical": string;
  "Order IEN": number;
  Originator: string;
  Symptoms: string;
  View: string;
}

export interface UsePatientAllergiesResult {
  allergies: Record<string, Allergy>;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function usePatientAllergies(patientSSN: string): UsePatientAllergiesResult {
  const [allergies, setAllergies] = useState<Record<string, Allergy>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    if (!patientSSN) {
      setAllergies({});
      setError(new Error('No patient SSN provided.'));
      setLoading(false);
      return;
    }
    const fetchAllergies = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('http://192.168.1.53/cgi-bin/apiAllergyList.sh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            UserName: 'CPRS-UAT',
            Password: 'UAT@123',
            PatientSSN: patientSSN,
            DUZ: '80',
            ihtLocation: '67'
          })
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (isMounted) {
          setAllergies(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch allergies'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchAllergies();
    return () => {
      setIsMounted(false);
    };
  }, [patientSSN, isMounted]);

  return { allergies, loading, error, refresh: () => {} };
}
