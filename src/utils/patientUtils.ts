import { Patient } from '@/services/api';

/**
 * Safely extracts the SSN from a Patient object
 * @param patient The patient object which may contain SSN in different formats
 * @returns The patient's SSN or an empty string if not available
 */
export const getPatientSSN = (patient?: Patient | null): string => {
  if (!patient) return '';
  
  // Only check for SSN fields that might be present in the API response
  if ('SSN' in patient && patient.SSN) return String(patient.SSN);
  if ('SSN No' in patient && patient['SSN No']) return String(patient['SSN No']);
  
  return '';
};

// Re-export any other patient-related utilities here
export * from './patientUtils';
