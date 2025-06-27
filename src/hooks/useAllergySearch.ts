import { useState, useCallback } from 'react';

interface AllergySearchResult {
  code: string;
  description: string;
}

export const useAllergySearch = () => {
  const [searchResults, setSearchResults] = useState<AllergySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchAllergies = useCallback(async (searchTerm: string, patientSSN: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch('/api/search-allergies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          UserName: 'CPRS-UAT',
          Password: 'UAT@123',
          PatientSSN: patientSSN || '800000035',
          cpProvDiag: searchTerm,
          iAllrgy: searchTerm,
          DUZ: '80'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const results = Array.isArray(data) 
        ? data.map(item => ({
            code: item.code || '',
            description: item.description || item.allergen || '',
          }))
        : [];
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching allergies:', error);
      setSearchError(error instanceof Error ? error.message : 'Failed to search for allergies');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
  }, []);

  return {
    searchAllergies,
    searchResults,
    isSearching,
    searchError,
    clearSearch
  };
};
