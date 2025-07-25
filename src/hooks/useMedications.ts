import { useState, useEffect } from 'react';

export interface Medication {
  OrderIEN: any;
  Schedule: string | undefined;
  id?: string | number;
  name?: string;
  medication?: string;
  medicationName?: string;
  status?: string;
  reason?: string;
  amount?: string;
  timing?: string;
  dosage?: string;
  route?: string;
  schedule?: string;
  // Fields from the API response
  Actions?: number;
  Change?: string;
  Copy?: string;
  Discontinue?: string;
  Flag?: string;
  Hold?: string;
  "Medication Day"?: string;
  "Medication Name"?: string;
  "Order Flag"?: string | number;
  "Order IEN"?: number;
  OrderURL?: string;
  "Ordered By"?: string;
  Release?: string;
  Renew?: string;
  Services?: string;
  Sign?: string;
  "Start Date"?: string;
  Status?: string;
  "Stop Date"?: string;
  Unflag?: string;
  "View Order"?: string;
}

export function useMedications(patientSSN?: string) {
  const [data, setData] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!patientSSN) {
        setData([]);
        setError('No patient SSN provided.');
        setLoading(false);
        return;
      }
      try {
        const requestBody = {
          UserName: 'CPRS-UAT',
          Password: 'UAT@123',
          PatientSSN: patientSSN,
          DUZ: '80',
          rcpoeOrdIP: 99,
          rordFrmDtPha: '',
          rordToDtPha: ''
        };
        const response = await fetch('http://192.168.1.53/cgi-bin/apiOrdMedList.sh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch medications: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const result = await response.json();
        let medications: Medication[] = [];
        if (Array.isArray(result)) {
          medications = result;
        } else if (typeof result === 'object' && result !== null) {
          medications = Object.values(result);
        }
        setData(medications);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch medications');
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [patientSSN]);

  return { data, loading, error };
}