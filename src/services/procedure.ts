import axios from 'axios';

export interface ProcedureOrder {
  id: string;
  order: string;
  instructions?: string;
  startDate: string;
  startTime: string;
  status: string;
  orderedBy: string;
  location: string;
  provider: string;
  procedureDate?: string;
  procedureTime?: string;
}

export const fetchProcedureOrders = async (ssn: string): Promise<ProcedureOrder[]> => {
  const API_URL = 'http://192.168.1.53/cgi-bin/apiProcOrd.sh';
  const USERNAME = 'CPRS-UAT';
  const PASSWORD = 'UAT@123';
  
  try {
    const response = await axios.post(
      API_URL,
      {
        SSN: ssn,
        UserName: USERNAME,
        Password: PASSWORD,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response format from procedure orders API');
    }

    // Transform API response to our interface
    return response.data.map((item: any, index: number) => ({
      id: item.id || `proc-order-${index}`,
      order: item.orderDescription || 'Procedure Order',
      instructions: item.instructions,
      startDate: item.orderDate || new Date().toISOString().split('T')[0],
      startTime: item.orderTime || new Date().toTimeString().substring(0, 5),
      status: item.status || 'Pending',
      orderedBy: item.orderedBy || 'Provider',
      location: item.location || 'N/A',
      provider: item.provider || 'N/A',
      procedureDate: item.procedureDate,
      procedureTime: item.procedureTime,
    }));
  } catch (error) {
    console.error('Error fetching procedure orders:', error);
    throw new Error('Failed to fetch procedure orders. Please try again later.');
  }
};
