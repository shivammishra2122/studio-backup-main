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

  useEffect(() => {
    if (!patientSSN) {
      setComplaints({});
      setError(new Error('No patient SSN provided.'));
      setLoading(false);
      return;
    }
    const fetchComplaints = async () => {
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
            PatientSSN: patientSSN,
            DUZ: "80",
            ihtLocation: 67,
            rcpAdmDateL: ""
          }),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setComplaints(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch complaints'));
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, [patientSSN]);

  return { complaints, loading, error, refresh: () => {} };
}