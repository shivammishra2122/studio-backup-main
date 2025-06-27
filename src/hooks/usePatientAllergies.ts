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

  const fetchAllergies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Use fallback SSN if patientSSN is empty
      const effectiveSSN = patientSSN || '800000035';
      
      const response = await fetch('http://192.168.1.53/cgi-bin/apiAllergyList.sh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          UserName: 'CPRS-UAT',
          Password: 'UAT@123',
          PatientSSN: effectiveSSN,
          DUZ: '80',
          ihtLocation: '67'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Allergies API Response for SSN:', effectiveSSN, 'Data:', data);
      
      // Only update state if component is still mounted
      if (isMounted) {
        setAllergies(data);
      }
    } catch (err) {
      console.error('Error fetching allergies:', err);
      if (isMounted) {
        setError(err instanceof Error ? err : new Error('Failed to fetch allergies'));
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, [patientSSN, isMounted]);

  useEffect(() => {
    setIsMounted(true);
    fetchAllergies();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      setIsMounted(false);
    };
  }, [fetchAllergies]);

  return { allergies, loading, error, refresh: fetchAllergies };
}
