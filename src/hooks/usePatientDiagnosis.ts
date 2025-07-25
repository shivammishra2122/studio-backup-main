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

  useEffect(() => {
    if (!patientSSN) {
      setDiagnosis({});
      setError(new Error('No patient SSN provided.'));
      setLoading(false);
      return;
    }
    const fetchDiagnosis = async () => {
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
            "PatientSSN": patientSSN,
            "DUZ": "80",
            "ihtLocation": "67",
            "rcpAdmDateL": " "
          })
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDiagnosis(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch diagnosis data'));
      } finally {
        setLoading(false);
      }
    };
    fetchDiagnosis();
  }, [patientSSN]);

  return {
    diagnosis,
    loading,
    error,
    refresh: () => {} // Optionally implement refresh logic
  };
}

export default usePatientDiagnosis;
