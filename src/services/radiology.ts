interface RadiologyApiOrder {
  "Change": string;
  "Copy": string;
  "Discontinue": string;
  "Exam Date/Time": string;
  "Flag": string;
  "Imaging Procedure": string;
  "Imaging Type": string;
  "Location": string;
  "Order Flag": string;
  "Order IEN": number;
  "Provider": string;
  "Result": string;
  "Sign": string;
  "Status": string;
  "Unflag": string;
  "View": string;
}

export interface RadiologyApiResponse {
  [key: string]: RadiologyApiOrder;
}

export interface RadiologyEntry {
  id: string;
  sNo: string;
  imagingProcedure: string;
  imagingType: string;
  orderDateTime: string;
  status: 'ACTIVE' | 'COMPLETE' | 'UNRELEASED' | 'PENDING';
  provider: string;
  location: string;
  result: string;
  viewUrl: string;
  signUrl: string;
  changeUrl: string;
  copyUrl: string;
  discontinueUrl: string;
  flagUrl: string;
  unflagUrl: string;
}

interface FetchRadiologyOrdersOptions {
  fromDate?: string;
  toDate?: string;
  status?: string;
}

export const fetchRadiologyOrders = async (
  patientIdentifier: string,
  options: FetchRadiologyOrdersOptions = {}
): Promise<RadiologyEntry[]> => {
  try {
    // Use hardcoded SSN for testing
    const testSSN = '800000035';
    console.log('Using test SSN for radiology orders:', `***-**-${testSSN.slice(-4)}`);
    
    // Use the new API endpoint
    const apiUrl = 'http://192.168.1.53/cgi-bin/apiOrdRadListNew.sh';
    
    // Prepare request body with default and provided options
    const requestBody = {
      UserName: 'CPRS-UAT',
      Password: 'UAT@123',
      PatientSSN: testSSN, // Using hardcoded SSN
      DUZ: '80',
      ihtLocation: 67,
      FromDate: options.fromDate || '',
      ToDate: options.toDate || '',
      rcpoeOrdSt: options.status || '11' // Default to active orders
    };
    
    console.log('Request body (sensitive data redacted):', JSON.stringify({
      ...requestBody,
      PatientSSN: '***-**-****',
      Password: '******'
    }, null, 2));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
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
    
    console.log('API response status:', response.status, response.statusText);
    
    if (!response.ok) {
      let errorMessage = `HTTP error! Status: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // If we can't parse the error response, use the default error message
        console.error('Failed to parse error response:', e);
      }
      throw new Error(errorMessage);
    }

    const data: RadiologyApiResponse = await response.json();
    console.log('API response data:', data);
    
    // Check if the response is empty or not in the expected format
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format from server');
    }
    
    // Transform the API response to match our interface
    const entries: RadiologyEntry[] = Object.entries(data).map(([sNo, value]) => {
      // Ensure we have a valid status with fallback to PENDING
      const status = (
        value.Status === 'COMPLETE' ? 'COMPLETE' :
        value.Status === 'UNRELEASED' ? 'UNRELEASED' :
        value.Status === 'PENDING' ? 'PENDING' :
        'ACTIVE'
      ) as 'ACTIVE' | 'COMPLETE' | 'UNRELEASED' | 'PENDING';

      return {
        id: value['Order IEN']?.toString() || sNo,
        sNo,
        imagingProcedure: value['Imaging Procedure'] || 'Unknown Procedure',
        imagingType: value['Imaging Type'] || 'N/A',
        orderDateTime: value['Exam Date/Time'] || '',
        status,
        provider: value.Provider || 'Unknown',
        location: value.Location || 'N/A',
        result: value.Result || 'N/A',
        viewUrl: value.View || '#',
        signUrl: value.Sign || '',
        changeUrl: value.Change || '',
        copyUrl: value.Copy || '',
        discontinueUrl: value.Discontinue || '',
        flagUrl: value.Flag || '',
        unflagUrl: value.Unflag || ''
      };
    });
    
    return entries;
  } catch (error) {
    console.error('Error in fetchRadiologyOrders:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to the server. Please check your internet connection.');
      }
    }
    
    throw new Error(`Failed to fetch radiology orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
