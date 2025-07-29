import axios from 'axios';
import { getSession } from '@/lib/auth-utils';

// Base URLs
export const AUTH_BASE_URL = 'http://192.168.1.53/cgi-bin';
export const API_BASE_URL = 'http://192.168.1.53/cgi-bin';

// Helper function to get auth params
const getAuthParams = () => {
  const session = getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }
  return {
    UserName: session.userName,
    Password: session.password,
    DUZ: session.duz,
    htLocation: session.htLocation
  };
};

// Helper function to get current patient SSN
const getCurrentPatientSSN = (): string | null => {
  if (typeof window === 'undefined') return null;
  const saved = sessionStorage.getItem('currentPatient');
  if (!saved) return null;
  try {
    const patient = JSON.parse(saved);
    return patient.SSN || patient['SSN No'] || null;
  } catch (e) {
    console.error('Error parsing current patient:', e);
    return null;
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${AUTH_BASE_URL}/apiLogin.sh`,
  LOCATIONS: `${AUTH_BASE_URL}/apiLogLoc.sh`,
  
  // Patient Data
  PATIENTS: `${API_BASE_URL}/apiPatDetail.sh`,
  CLINICAL_NOTES: `${API_BASE_URL}/apiCLNoteList.sh`,
  CLINICAL_NOTES_IV: `${API_BASE_URL}/apiCLNoteIV.sh`,
  PROBLEMS: `${API_BASE_URL}/apiProbCatSrh.sh`,
  PROBLEMS_SAVE: `${API_BASE_URL}/apiProbSave.sh`,
  PROBLEMS_LIST: `${API_BASE_URL}/apiProbList.sh`,
  ALLERGIES: `${API_BASE_URL}/apiAllergyList.sh`,
  ALLERGIES_SAVE: `${API_BASE_URL}/apiAllergySave.sh`,
  ALLERGIES_SEARCH: `${API_BASE_URL}/apiAllergySrh.sh`,
  DIAGNOSIS: `${API_BASE_URL}/apiDiagList.sh`,
  COMPLAINTS: `${API_BASE_URL}/apiComplaintsList.sh`,
  MEDICATIONS: `${API_BASE_URL}/apiOrdMedList.sh`,
  LAB_ORDERS: `${API_BASE_URL}/apiOrdLabList.sh`,
  RADIOLOGY_ORDERS: `${API_BASE_URL}/apiOrdRadListNew.sh`,
  PROCEDURES: `${API_BASE_URL}/apiOrdProcList.sh`,
  VITALS: `${API_BASE_URL}/apiVitalView.sh`,
  VITALS_ENTRY: `${API_BASE_URL}/apiVitalEntry.sh`,
  NOTE_DELETE: `${API_BASE_URL}/apiNotDel.sh`,
  NOTE_SIGN: `${API_BASE_URL}/apiNotSign.sh`,
  CPOE_LIST: `${API_BASE_URL}/apiOrdCPOEList.sh`,
  
  // Orders
  ORDERS_LIST: `${API_BASE_URL}/apiOrderList.sh`,
  ORDERS_SAVE: `${API_BASE_URL}/apiOrderSave.sh`,
  
  // Lab Orders
  LAB_ORDERS_NEW: `${API_BASE_URL}/apiLabCPOEList.sh`,
  
  // Radiology Orders
  RADIOLOGY_ORDERS_NEW: `${API_BASE_URL}/apiRadiologyOrders.sh`,
  
  // IP Medications
  IP_MEDICATIONS: `${API_BASE_URL}/apiIPMedications.sh`,
  
  // Visit/ADT
  VISIT_ADT: `${API_BASE_URL}/apiVisitADT.sh`,
} as const;

// API Service Instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Patient {
  id: string;
  name: string;
  gender: string;
  dob: string;
  age: string | number;
  aadhaarNo?: string;
  mobile?: string | number;
  phone?: string;
  email?: string;
  address?: string;
  permanentAddress?: string;
  permanentPhone?: string;
  permanentMobile?: string;
  fatherName?: string;
  motherName?: string;
  passport?: string;
  registrationDate?: string;
  localGuardian?: string;
  relationship?: string;
  
  // IPD Details
  status?: string;
  admissionDate?: string;
  ward?: string;
  roomBed?: string;
  primaryConsultant1?: string;
  primaryConsultant2?: string;
  admissionType?: string;
  ipNo?: string | number;
  transferred?: string;
  specialty?: string;
  chiefComplaints?: string;
  finalDiagnosis?: string;
  comorbidity?: string;
  referredBy?: string;
  specialPrecautions?: string;
  remarks?: string;
  
  // Insurance Details
  payerCategory?: string;
  
  // eMLC Details
  emlcId?: string;
  emlcStatus?: string;
  facilityIncharge?: string;
  modeOfInjury?: string;
  faculty?: string;
  copdVisit?: string;
  criticality?: string;
  attendedBy?: string;
  broughtBy?: string;
  refBy?: string;
  emlcReportLink?: string;
  
  // Autopsy Details
  dateOfDeath?: string;
  deathCertificate?: string;
  deathCard?: string;
  sourceOfNotification?: string;
  deathReport?: string;
  policeApplication?: string;
  
  // Additional Fields
  encounterProvider?: string;
  lengthOfStay?: string;
  bedDetails?: string;
  wardNo?: string;
  
  // SSN fields (added for consistency)
  ssn?: string;
  'SSN No'?: string;
  PatientSSN?: string;
  
  // Additional fields found in usage
  'IP No'?: number;
  'Admission Date'?: string;
  'Mobile No'?: number;
  'Primary Consultant'?: string;
  'Secondary Consultant'?: string;
  'Treating Consultant'?: string;
  LOS?: string;
  Specialty?: string;
  Ward?: string;
  Bed?: string;
  DFN?: string | number;
  posting?: string;
}

interface PatientSearchParams {
    UserName: string;
    Password: string;
    DUZ: string;
    PatientSSN: string;
    lname: string;
    cpDOB: string;
    mno: string;
    cpIPNo: string;
    SearchType: string;
}

export const apiService = {
    async getPatients(searchParams: Record<string, any> = {}) {
        try {
            // Get auth params from session
            const authParams = getAuthParams();
            
            const params = {
                UserName: 'CPRS-UAT',
                Password: 'UAT@123',
                DUZ: authParams.DUZ,
                htLocation: authParams.htLocation,
                PatientSSN: searchParams.searchSSN || "",
                lname: searchParams.lname || "",
                cpDOB: searchParams.cpDOB || "",
                mno: searchParams.mno || "",
                cpIPNo: searchParams.cpIPNo || "",
                SearchType: searchParams.SearchType || "2"
            };

            console.log('Fetching patients with params:', { ...params, Password: '***' });
            const response = await api.post(API_ENDPOINTS.PATIENTS, params);
            console.log('Patients API response:', response.data);

            if (!response.data) {
                console.warn('Empty response from patients API');
                return [];
            }

            // Handle case where response is already an array
            if (Array.isArray(response.data)) {
                return response.data;
            }

            // Handle case where response is an object with patient data
            if (typeof response.data === 'object') {
                // Convert the object of patients to an array
                const patients = Object.values(response.data);
                
                // If searching by SSN, filter the results
                if (searchParams.searchSSN) {
                    return patients.filter((p: any) => {
                        const ssn = p.SSN || p['SSN No'] || '';
                        return String(ssn) === String(searchParams.searchSSN);
                    });
                }
                return patients;
            }

            console.warn('Unexpected response format from patients API:', response.data);
            return [];
        } catch (error) {
            console.error('Error in getPatients:', error);
            // Return empty array instead of throwing to prevent unhandled promise rejections
            return [];
        }
    },

    async getPatientDetails(patientSSN?: string) {
        try {
            // Use provided SSN or get from current patient
            const ssn = patientSSN || getCurrentPatientSSN();
            if (!ssn) {
                throw new Error('No patient selected');
            }

            const authParams = getAuthParams();
            const response = await api.post(API_ENDPOINTS.PATIENTS, {
                UserName: 'CPRS-UAT',
                Password: 'UAT@123',
                DUZ: authParams.DUZ,
                htLocation: authParams.htLocation,
                PatientSSN: ssn
            });

            return response.data;
        } catch (error) {
            console.error('Error in getPatientDetails:', error);
            throw error;
        }
    },
    
    async fetchClinicalNotes({
        patientSSN = '800000035',
        fromDate = '',
        toDate = '',
        status = '5',
        ihtLocation = 67,
        ewd_sessid = '36608394',
        DUZ = '80'
    }: {
        patientSSN?: string;
        fromDate?: string;
        toDate?: string;
        status?: string;
        ihtLocation?: number;
        ewd_sessid?: string;
        DUZ?: string;
    }) {
        // Format dates to YYYY-MM-DD or use empty strings if not set
        const formatDate = (dateStr: string): string => {
            if (!dateStr) return '';
            try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return '';
                
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            } catch (e) {
                console.error('Error formatting date:', e);
                return '';
            }
        };

        // Only format dates if they are provided
        const formattedFromDate = fromDate ? formatDate(fromDate) : '';
        const formattedToDate = toDate ? formatDate(toDate) : '';

        const body = {
            UserName: 'CPRS-UAT',
            Password: 'UAT@123',
            PatientSSN: patientSSN,
            FromDate: formattedFromDate,
            ToDate: formattedToDate,
            DUZ,
            ihtLocation,
            ewd_sessid,
            status
        };

        console.log('Sending request to clinical notes API:', {
            url: API_ENDPOINTS.CLINICAL_NOTES,
            body: JSON.stringify(body, null, 2)
        });

        try {
            const response = await api.post(API_ENDPOINTS.CLINICAL_NOTES, body, {
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 10000, // 10 second timeout
            });

            console.log('Clinical notes API response status:', response.status);
            
            if (!response.data) {
                console.error('Empty response from clinical notes API');
                return [];
            }


            if (response.data.errors) {
                console.error('API Error:', response.data.errors);
                return [];
            }


            if (Array.isArray(response.data)) {
                return response.data;
            }


            if (typeof response.data === 'object') {
                return Object.values(response.data);
            }

            console.warn('Unexpected response format from API:', response.data);
            return [];
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Axios error fetching clinical notes:', {
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    responseData: error.response?.data,
                    request: {
                        url: error.config?.url,
                        method: error.config?.method,
                        data: error.config?.data,
                        headers: error.config?.headers,
                    },
                });
            } else {
                console.error('Error in fetchClinicalNotes:', error);
            }
            return [];
        }
    },
    
    async getIPMedications(patientSSN: string, params: Record<string, any> = {}) {
        try {
            const response = await axios.post(API_ENDPOINTS.IP_MEDICATIONS, {
                ...getAuthParams(),
                PatientSSN: patientSSN,
                ...params
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching IP medications:', error);
            throw error;
        }
    },
    
    async getRadiologyOrders(patientSSN: string, params: Record<string, any> = {}) {
        try {
            const response = await axios.post(API_ENDPOINTS.RADIOLOGY_ORDERS_NEW, {
                ...getAuthParams(),
                PatientSSN: patientSSN,
                ...params
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching radiology orders:', error);
            throw error;
        }
    },
    
    async getLabOrders(patientSSN: string, params: Record<string, any> = {}) {
        try {
            const response = await axios.post(API_ENDPOINTS.LAB_ORDERS_NEW, {
                ...getAuthParams(),
                PatientSSN: patientSSN,
                ...params
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching lab orders:', error);
            throw error;
        }
    },
    
    async getVisitADT(patientSSN: string, params: Record<string, any> = {}) {
        try {
            const response = await axios.post(API_ENDPOINTS.VISIT_ADT, {
                ...getAuthParams(),
                PatientSSN: patientSSN,
                ...params
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching visit/ADT data:', error);
            throw error;
        }
    },
};

export interface ProblemSearchParams {
    UserName: string;
    Password: string;
    PatientSSN: string;
    DUZ: string;
    cdpProbCat?: string;
    other?: string;
  }
  
  export interface Problem {
    id: string;
    problem: string;
    dateOfOnset: string;
    status: string;
    immediacy: string;
    orderIen: number;
    editUrl: string;
    removeUrl: string;
    viewUrl: string;
  }
  
  export const problemService = {
    searchProblems: async (params: {
      UserName?: string;
      Password?: string;
      PatientSSN?: string;
      DUZ?: string;
      ihtLocation?: string | number;
      cdpProbCat?: string;
      other?: string;
    }): Promise<Problem[]> => {
      try {
        // For problem view (when no search query is provided)
        if (!params.other) {
          const viewParams = {
            UserName: params.UserName || 'CPRS-UAT',
            Password: params.Password || 'UAT@123',
            PatientSSN: params.PatientSSN || '800000035',
            DUZ: params.DUZ || '80',
            ihtLocation: params.ihtLocation || '67'
          };
          const response = await api.post(API_ENDPOINTS.PROBLEMS, viewParams);
          return response.data.map(transformProblem);
        }
        
        // For problem search (when there is a search query)
        const searchParams = {
          UserName: params.UserName || 'CPRS-UAT',
          Password: params.Password || 'UAT@123',
          PatientSSN: params.PatientSSN || '800000035',
          DUZ: params.DUZ || '80',
          cdpProbCat: params.cdpProbCat || '',
          other: params.other
        };
        const response = await api.post(API_ENDPOINTS.PROBLEMS, searchParams);
        return Array.isArray(response.data) ? response.data.map(transformProblem) : [];
      } catch (error) {
        console.error('Error in problem service:', error);
        throw error;
      }
    },
  };

  // Helper function to transform problem data
  const transformProblem = (item: any): Problem => ({
    id: item.id || '',
    problem: item.problem || '',
    dateOfOnset: item.dateOfOnset || '',
    status: item.status || '',
    immediacy: item.immediacy || '',
    orderIen: item.orderIen || 0,
    editUrl: item.editUrl || '',
    removeUrl: item.removeUrl || '',
    viewUrl: item.viewUrl || '',
  });

export const authApi = {
  login: async (credentials: { access: string; verify: string; htLocation?: string }) => {
    const response = await axios.post(API_ENDPOINTS.LOGIN, {
      ...credentials,
      UserName: 'CPRS-UAT',  // Keep these for initial login only
      Password: 'UAT@123'     // These will be replaced after first successful login
    });
    return response.data;
  },
  
  getLocations: async (accessCode: string) => {
    const response = await axios.post(API_ENDPOINTS.LOCATIONS, {
      access: accessCode,
      UserName: 'CPRS-UAT',  // Keep these for initial location fetch
      Password: 'UAT@123'
    });
    return response.data;
  }
};

// Export the configured axios instance
export default api;