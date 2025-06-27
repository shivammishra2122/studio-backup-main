interface NursingOrder {
  id: string;
  order: string;
  orderDate: string;
  orderTime: string;
  startDate: string;
  startTime: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED' | 'PENDING';
  orderedBy: string;
  location: string;
  frequency?: string;
  instructions?: string;
}

export const fetchNursingOrders = async (patientSSN: string): Promise<NursingOrder[]> => {
  try {
    // Use hardcoded SSN for testing if not provided
    const effectiveSSN = patientSSN || '800000035';
    console.log('Fetching nursing orders for SSN:', `***-**-${effectiveSSN.slice(-4)}`);
    
    const apiUrl = 'http://192.168.1.53/cgi-bin/apiNurOrd.sh';
    
    const requestBody = {
      UserName: 'CPRS-UAT',
      Password: 'UAT@123',
      PatientSSN: effectiveSSN,
      DUZ: '80',
      ihtLocation: 67
    };

    console.log('Request body (sensitive data redacted):', {
      ...requestBody,
      PatientSSN: '***-**-****',
      Password: '******'
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform the API response to match our NursingOrder interface
    return Object.entries(data).map(([key, value]: [string, any]) => ({
      id: key,
      order: value.Order || 'N/A',
      orderDate: value['Order Date'] || '',
      orderTime: value['Order Time'] || '',
      startDate: value['Start Date'] || '',
      startTime: value['Start Time'] || '',
      status: (value.Status || 'PENDING').toUpperCase(),
      orderedBy: value.Provider || 'Unknown',
      location: value.Location || 'N/A',
      frequency: value.Frequency,
      instructions: value.Instructions
    }));
  } catch (error) {
    console.error('Error in fetchNursingOrders:', error);
    throw error;
  }
};
