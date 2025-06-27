import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export interface ProblemSavePayload {
  PatientSSN: string;
  DUZ: string;
  ihtLocation: string;
  cdpProbL: string;
  cpClinic: string;
  cdpDOSet: string;
  cdpStts: string;
  cdpServ: string;
  cdpImmed: string;
  cdpCMT: string;
  cpWard: string;
  DUZIP: string;
}

const useProblemSave = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const saveProblem = useCallback(async (payload: Omit<ProblemSavePayload, 'UserName' | 'Password'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const requestBody = {
        ...payload,
        DUZ: '80', // Updated to 80 as per requirements
        ihtLocation: '67', // Updated to 67 as per requirements
        UserName: 'CPRS-UAT',
        Password: 'UAT@123',
      };

      const response = await fetch('/api/apiProbSave.sh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save problem: ${errorText}`);
      }

      const data = await response.json();
      toast.success('Problem saved successfully');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save problem';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    saveProblem,
    isLoading,
    error,
  };
};

export default useProblemSave;
