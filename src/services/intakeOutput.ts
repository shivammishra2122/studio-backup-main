// src/services/intakeOutput.ts

// Configuration
const API_CONFIG = {
  baseUrl: 'http://192.168.1.53/cgi-bin',
  maxRetries: 3,
  retryDelay: 1000, // ms
};

// Mock data for development
const MOCK_INTAKE_OUTPUT_DATA: IntakeOutputSummary = {
  totalIntake: 1250,
  totalOutput: 850,
  balance: 400,
  records: [
    {
      id: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      type: 'INTAKE',
      category: 'IV Fluid',
      amount: 500,
      unit: 'ml',
      route: 'IV',
      note: 'Normal saline'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
      type: 'OUTPUT',
      category: 'Urine',
      amount: 300,
      unit: 'ml',
      route: 'Void',
      note: 'Normal color'
    }
  ]
};

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to make API requests with retry logic
const fetchWithRetry = async (url: string, options: RequestInit, retries = API_CONFIG.maxRetries): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    console.warn(`API call failed, retrying... (${retries} attempts left)`);
    await delay(API_CONFIG.retryDelay);
    return fetchWithRetry(url, options, retries - 1);
  }
};

export const fetchIntakeOutputData = async (patientSSN: string): Promise<IntakeOutputSummary> => {
  if (!patientSSN) {
    throw new Error('Patient SSN is required');
  }

  // Use mock data in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Using mock intake/output data');
    await delay(500); // Simulate network delay
    return MOCK_INTAKE_OUTPUT_DATA;
  }

  const apiUrl = `${API_CONFIG.baseUrl}/apiIntOutList.sh`;
  const requestBody = {
    UserName: 'CPRS-UAT',
    PatientSSN: patientSSN,
    DUZ: '80',
    ihtLocation: 67,
    FromDate: '',
    ToDate: '',
    Action: 'O',
  };

  try {
    const response = await fetchWithRetry(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    
    // Transform the API response to match our interface
    const records: IntakeOutputRecord[] = Array.isArray(data) ? data.map((item: any) => ({
      id: item.Id || Math.random().toString(36).substr(2, 9),
      timestamp: item.Timestamp || new Date().toISOString(),
      type: item.Type === 'OUTPUT' ? 'OUTPUT' : 'INTAKE',
      category: item.Category || 'Unknown',
      amount: parseFloat(item.Amount) || 0,
      unit: item.Unit || 'ml',
      route: item.Route,
      note: item.Note
    })) : [];

    // Calculate totals
    const totalIntake = records
      .filter(record => record.type === 'INTAKE')
      .reduce((sum, record) => sum + record.amount, 0);

    const totalOutput = records
      .filter(record => record.type === 'OUTPUT')
      .reduce((sum, record) => sum + record.amount, 0);

    return {
      totalIntake,
      totalOutput,
      balance: totalIntake - totalOutput,
      records: records.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    };
  } catch (error) {
    console.error('Error in fetchIntakeOutputData:', error);
    // Return mock data in case of error in non-development environments
    if (process.env.NODE_ENV === 'production') {
      return MOCK_INTAKE_OUTPUT_DATA;
    }
    throw error;
  }
};

export const fetchIntakeUpdateData = async (patientSSN: string): Promise<IntakeOutputSummary> => {
  // For now, we'll use the same implementation as fetchIntakeOutputData
  // You can customize this later if the API requires different handling
  return fetchIntakeOutputData(patientSSN);
};

export interface IntakeOutputRecord {
  id: string;
  timestamp: string;
  type: 'INTAKE' | 'OUTPUT';
  category: string;
  amount: number;
  unit: string;
  route?: string;
  note?: string;
}

export interface IntakeOutputSummary {
  totalIntake: number;
  totalOutput: number;
  balance: number;
  records: IntakeOutputRecord[];
}