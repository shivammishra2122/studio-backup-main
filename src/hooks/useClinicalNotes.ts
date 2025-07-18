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
    const loadNotes = async () => {
      // Use the provided SSN or fall back to the default SSN if not available
      const effectiveSSN = patientSSN || FALLBACK_SSN;
      
      if (!effectiveSSN) {
        console.error('No patient SSN provided and no fallback SSN available');
        setNotes([]);
        setLoading(false);
        return;
      }

      console.log(`Fetching clinical notes for SSN: ${effectiveSSN}`);
      
      try {
        setLoading(true);
        const data = await apiService.fetchClinicalNotes({ patientSSN: effectiveSSN });
        
        console.log('Raw clinical notes data:', data); // Log the raw data
        
        // Transform the API response to match the ClinicalNote interface
        const formattedNotes = data.map((note: any) => {
          // Log each note to see its structure
          console.log('Processing note:', note);
          
          // Try different possible field names for the title
          const title = note["Notes Title"] || 
                       note.notesTitle || 
                       note.title || 
                       note.NoteTitle || 
                       'Untitled Note';
          
          console.log(`Note ID: ${note.NoteIEN || note.id}, Title: ${title}`);
          
          return {
            id: note.NoteIEN || note.id,
            notesTitle: title,
            dateOfEntry: note["Date of Entry"] || note.dateOfEntry || note.DateOfEntry || '',
            status: note.Status || note.status || 'UNKNOWN',
            author: note.Author || note.author || 'Unknown',
            // Include the raw note for debugging
            _raw: note
          };
        });

        console.log('Formatted notes:', formattedNotes);
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
  }, [patientSSN]); // Re-run when patientSSN changes

  return { notes, loading, error };
}