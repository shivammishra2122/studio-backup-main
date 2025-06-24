import { useState, useCallback, useEffect } from 'react';

interface Complaint {
  CmpType: string;
  CompName: string;
  DateTime: string;
  FLEDID: string;
  "Order IEN": string;
  Remark: string;
  Status: string;
}

export function usePatientComplaints(patientSSN: string) {
  const [complaints, setComplaints] = useState<Record<string, Complaint>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Use fallback SSN if patientSSN is empty
  const effectiveSSN = patientSSN || '800000035';

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://192.168.1.53/cgi-bin/apiComplaintsList.sh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          UserName: "CPRS-UAT",
          Password: "UAT@123",
          PatientSSN: effectiveSSN,
          DUZ: "80",
          ihtLocation: 67,
          rcpAdmDateL: ""
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Complaints API Response for SSN:', effectiveSSN, 'Data:', data);
      setComplaints(data);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch complaints'));
    } finally {
      setLoading(false);
    }
  }, [effectiveSSN]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  return { complaints, loading, error, refresh: fetchComplaints };
}