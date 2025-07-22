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

export function useMedications() {
  const [data, setData] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const hardcodedPatientId = '800000035';
      console.log('Fetching medications for hardcoded patient ID:', hardcodedPatientId);
      
      try {
        const requestBody = {
          UserName: 'CPRS-UAT',
          Password: 'UAT@123',
          PatientSSN: hardcodedPatientId,
          DUZ: '80',
          rcpoeOrdIP: 99,
          rordFrmDtPha: '',
          rordToDtPha: ''
        };

        console.log('Sending request to API with body:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch('http://192.168.1.53/cgi-bin/apiOrdMedList.sh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        console.log('API response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          throw new Error(`Failed to fetch medications: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Raw API response data:', result);
        
        // Convert the object of medications to an array
        let medications: Medication[] = [];
        
        if (result && typeof result === 'object') {
          // If the response is an object with numeric keys
          if (Object.keys(result).every(key => !isNaN(Number(key)))) {
            medications = Object.values(result);
          } 
          // Handle other possible response formats if needed
          else if (Array.isArray(result.data)) {
            medications = result.data;
          } else if (Array.isArray(result.medications)) {
            medications = result.medications;
          } else if (result.medicationList && Array.isArray(result.medicationList)) {
            medications = result.medicationList;
          } else if (result.medication) {
            medications = [result.medication];
          } else if (Object.keys(result).length > 0) {
            medications = [result];
          }
        } else if (Array.isArray(result)) {
          // If the response is already an array
          medications = result;
        }
        
        console.log('Processed medications:', medications);
        setData(medications);
      } catch (err) {
        console.error('Error in useMedications:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}