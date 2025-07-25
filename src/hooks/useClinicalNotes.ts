import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

export interface ClinicalNote {
  id: string;
  notesTitle: string;
  dateOfEntry: string;
  status: string;
  author: string;
}
// Fallback SSN to use when patient SSN is not available
const FALLBACK_SSN = '800000035';

export function useClinicalNotes(patientSSN?: string) {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientSSN) {
      setNotes([]);
      setError(new Error('No patient SSN provided.'));
      setLoading(false);
      return;
    }
    const loadNotes = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('http://192.168.1.53/cgi-bin/apiCLNoteList.sh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            UserName: 'CPRS-UAT',
            Password: 'UAT@123',
            PatientSSN: patientSSN,
            DUZ: '80',
            ihtLocation: '67',
            status: '5',
            fromDate: '',
            toDate: ''
          })
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setNotes(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch clinical notes'));
      } finally {
        setLoading(false);
      }
    };
    loadNotes();
  }, [patientSSN]);

  return { notes, loading, error };
}