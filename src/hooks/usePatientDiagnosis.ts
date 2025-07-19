import { useState, useEffect, useCallback } from 'react';

export interface Diagnosis {
  Add: string;
  Comment: string;
  "Diagnosis Description": string;
  DigArrValue: string;
  "Entered Date": string;
  "Order IEN": number;
  Primary: string;
  Provider: string;
  Remove: string;
  Type: string;
}

interface UsePatientDiagnosisResult {
  diagnosis: Record<string, Diagnosis>;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function usePatientDiagnosis(patientSSN: string): UsePatientDiagnosisResult {
  const [diagnosis, setDiagnosis] = useState<Record<string, Diagnosis>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Use fallback SSN if patientSSN is empty
  const effectiveSSN = patientSSN || '800000035';

  const fetchDiagnosis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://192.168.1.53/cgi-bin/apiDiagList.sh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "UserName": "CPRS-UAT",
          "Password": "UAT@123",
          "PatientSSN": effectiveSSN,
          "DUZ": "80",
          "ihtLocation": "67",
          "rcpAdmDateL": " "
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Diagnosis API Response for SSN:', effectiveSSN, 'Data:', data);
      setDiagnosis(data);
    } catch (err) {
      console.error('Error fetching diagnosis data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch diagnosis data'));
    } finally {
      setLoading(false);
    }
  }, [effectiveSSN]);

  useEffect(() => {
    fetchDiagnosis();
  }, [fetchDiagnosis]);

  return {
    diagnosis,
    loading,
    error,
    refresh: fetchDiagnosis
  };
}

export default usePatientDiagnosis;
