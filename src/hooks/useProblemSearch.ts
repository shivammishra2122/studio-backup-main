import { useState, useCallback } from 'react';

interface ProblemSearchResult {
  code: string;
  description: string;
  // Add other fields from the API response as needed
}

const useProblemSearch = () => {
  const [searchResults, setSearchResults] = useState<ProblemSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchProblems = useCallback(async (searchTerm: string, patientSSN: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    console.log('Searching for:', searchTerm);
    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch('/api/search-problems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchTerm,
          patientSSN
        }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('API response data:', data);
      
      // Log the actual response structure for debugging
      console.log('Raw API response structure:', JSON.stringify(data, null, 2));
      
      // Adjust this mapping based on the actual API response structure
      let results: ProblemSearchResult[] = [];
      
      // Check different possible response structures
      if (Array.isArray(data)) {
        // If response is an array, map each item
        results = data.map((item: any) => ({
          code: item.code || item.id || '',
          description: item.description || item.name || item.problem || item.other || ''
        }));
      } else if (data && typeof data === 'object') {
        // If response is an object, check for results array or other structures
        if (Array.isArray(data.results)) {
          results = data.results.map((item: any) => ({
            code: item.code || item.id || '',
            description: item.description || item.name || item.problem || item.other || ''
          }));
        } else if (data.data && Array.isArray(data.data)) {
          results = data.data.map((item: any) => ({
            code: item.code || item.id || '',
            description: item.description || item.name || item.problem || item.other || ''
          }));
        } else {
          // If no array found, try to use the object directly
          results = Object.entries(data).map(([key, value]) => ({
            code: key,
            description: typeof value === 'string' ? value : JSON.stringify(value)
          }));
        }
      }
      
      console.log('Mapped results:', results);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching problems:', error);
      setSearchError(error instanceof Error ? error.message : 'Failed to search for problems');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    console.log('Clearing search');
    setSearchResults([]);
    setSearchError(null);
  }, []);

  return {
    searchProblems,
    searchResults,
    isSearching,
    searchError,
    clearSearch
  };
};

export default useProblemSearch;
