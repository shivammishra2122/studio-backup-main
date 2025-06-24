import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

export interface ClinicalNote {
  id: string;
  notesTitle: string;
  dateOfEntry: string;
  status: string;
  author: string;
}

export function useClinicalNotes(patientSSN: string) {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadNotes = async () => {
      if (!patientSSN) {
        console.log('No patient SSN provided, skipping clinical notes fetch');
        setNotes([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await apiService.fetchClinicalNotes({ patientSSN });
        
        // Transform the API response to match the ClinicalNote interface
        const formattedNotes = data.map((note: any) => ({
          id: note.NoteIEN || note.id,
          notesTitle: note["Notes Title"] || note.notesTitle || 'Untitled Note',
          dateOfEntry: note["Date of Entry"] || note.dateOfEntry || '',
          status: note.Status || note.status || 'UNKNOWN',
          author: note.Author || note.author || 'Unknown',
        }));

        setNotes(formattedNotes);
        setError(null);
      } catch (err) {
        console.error('Error fetching clinical notes:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch clinical notes'));
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [patientSSN]);

  return { notes, loading, error };
}