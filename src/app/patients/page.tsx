"use client";

import * as React from "react";
import { useMemo, useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Calendar as CalendarIcon,
  Calendar,
  Clock, 
  Home, 
  Bed, 
  Stethoscope, 
  UserCog, 
  CreditCard, 
  FileText,
  ChevronDown, 
  ChevronUp,
  Loader2,
  AlertTriangle,
  RefreshCw as RefreshCwIcon,
  Search as SearchIcon,
  Bell,
  X,
  Fingerprint
 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatients } from "@/context/patient-context";
import { usePatientActions } from "@/hooks/use-patient-actions";
import { format } from "date-fns";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LogoutButton } from '@/components/auth/logout-button';
import { debounce } from 'lodash';

type SortDirection = 'asc' | 'desc';

type TableFieldKey = 'DFN' | 'Name' | 'Age' | 'Admission Date' | 'LOS' | 'Ward' | 'Bed' | 'Specialty' | 'Primary Consultant' | 'Payer Category' | 'Type of Admission' | 'MLC';

interface TableField {
  key: TableFieldKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABLE_FIELDS: TableField[] = [
  { key: 'DFN', label: 'Patient ID', icon: FileText },
  { key: 'Name', label: 'Patient Name', icon: User },
  { key: 'Age', label: 'Age/Gender', icon: UserCog },
  { key: 'Admission Date', label: 'Admission', icon: Calendar },
  { key: 'LOS', label: 'LOS', icon: Clock },
  { key: 'Ward', label: 'Ward', icon: Home },
  { key: 'Bed', label: 'Bed', icon: Bed },
  { key: 'Specialty', label: 'Specialty', icon: Stethoscope },
  { key: 'Primary Consultant', label: 'Consultant', icon: UserCog },
  { key: 'Payer Category', label: 'Payer', icon: CreditCard },
  { key: 'Type of Admission', label: 'Admission Type', icon: FileText },
  { key: 'MLC', label: 'MLC', icon: AlertTriangle },
];

function getStringValue(val: any, key?: string): string {
  if (val == null) return '-';
  
  // Format LOS as "[number] days"
  if (key === 'LOS' && val) {
    const days = String(val).match(/^(\d+)/)?.[0] || '0';
    return `${days} day${days === '1' ? '' : 's'}`;
  }
  
  return String(val);
}

// Mapping function for API patient -> table patient
const mapApiPatientToTablePatient = (apiPatient: any) => ({
  DFN: apiPatient.DFN,
  Name: apiPatient.Name,
  Age: apiPatient.Age,
  "Admission Date": apiPatient["Admission Date"],
  LOS: apiPatient.LOS,
  Ward: apiPatient.Ward,
  Bed: apiPatient.Bed,
  Specialty: apiPatient.Specialty,
  "Primary Consultant": apiPatient["Primary Consultant"],
  "Payer Category": apiPatient["Payer Category"],
  "Type of Admission": apiPatient["Admission Type"],
  MLC: apiPatient.MLC,
  SSN: apiPatient.PatientSSN || apiPatient["SSN No"] || "",
});

export default function PatientsPage() {
  const { patients, loading, error, fetchPatients, setCurrentPatient } = usePatients();
  const [sortKey, setSortKey] = useState<TableFieldKey>('Name');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Default');

  // SSN search state
  const [ssnSearch, setSSNSearch] = useState('');
  const [ssnSearchResults, setSSNSearchResults] = useState<any[]>([]);
  const [isSearchingSSN, setIsSearchingSSN] = useState(false);
  const [duz, setDuz] = useState('');
  const [ihtLocation, setIhtLocation] = useState('');
  const [isSSNSearch, setIsSSNSearch] = useState(false);

  // Advanced search dialog state
  const [isAdvOpen, setIsAdvOpen] = useState(false);
  const [advName, setAdvName] = useState('');
  const [advDob, setAdvDob] = useState('');
  const [advPhone, setAdvPhone] = useState('');
  const [advIp, setAdvIp] = useState('');

  // Advanced search state
  const [isAdvSearchActive, setIsAdvSearchActive] = useState(false);
  const [currentAdvSearch, setCurrentAdvSearch] = useState({
    name: '',
    dob: '',
    phone: '',
    ip: ''
  });

  // Get DUZ and ihtLocation from context or session
  useEffect(() => {
    // You'll need to implement this based on your authentication context
    // This is just a placeholder
    const storedDuz = localStorage.getItem('user_duz') || '115'; // Default value
    const storedLocation = localStorage.getItem('user_location') || '102'; // Default value
    setDuz(storedDuz);
    setIhtLocation(storedLocation);
  }, []);

  // Debounced SSN search function
  const searchSSN = useCallback(debounce(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSSNSearchResults([]);
      return;
    }

    setIsSearchingSSN(true);
    try {
      const response = await fetch('http://192.168.1.53/cgi-bin/apiPatDetail.sh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          UserName: 'CPRS-UAT',
          Password: 'UAT@123',
          DUZ: duz,
          ihtLocation: ihtLocation,
          PatientSSN: searchTerm,
          SearchType: ""
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      let data;
      
      try {
        data = responseText ? JSON.parse(responseText) : [];
      } catch (e) {
        console.warn('Response is not valid JSON, treating as text:', responseText);
        data = responseText.split('\n').filter(Boolean).map((item, index) => ({
          id: index,
          name: item.trim()
        }));
      }

      // Map API fields to table fields before setting results
      let mappedResults = [];
      if (Array.isArray(data)) {
        mappedResults = data.map(mapApiPatientToTablePatient);
      } else if (data && typeof data === 'object') {
        mappedResults = [mapApiPatientToTablePatient(data)];
      }
      setSSNSearchResults(mappedResults);
    } catch (error) {
      console.error('Error searching SSN:', error);
      setSSNSearchResults([]);
    } finally {
      setIsSearchingSSN(false);
    }
  }, 300), [duz, ihtLocation]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (isSSNSearch) {
      setSSNSearch(value);
      // Automatically search when 4+ digits are entered
      if (value.trim().length >= 4) {
        searchSSN(value);
      } else {
        // Clear results if less than 4 digits
        setSSNSearchResults([]);
      }
    } else {
      setSearchQuery(value);
    }
  };

  // Handle search submission (for Enter key)
  const handleSearchSubmit = () => {
    if (isSSNSearch) {
      if (ssnSearch.trim()) {
        searchSSN(ssnSearch);
      }
    } else if (searchQuery.trim()) {
      fetchPatients({ search: searchQuery.trim() });
    }
  };

  // Fetch patients on initial load
  useEffect(() => {
    const loadPatients = async () => {
      try {
        await fetchPatients({});
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Failed to load patients:', err);
      }
    };

    loadPatients();
  }, []);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchPatients({});
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to refresh patients:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAdvancedSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentAdvSearch({
      name: advName.trim(),
      dob: advDob.trim(),
      phone: advPhone.trim(),
      ip: advIp.trim()
    });
    setIsAdvSearchActive(true);
    setIsAdvOpen(false);
  };

  const clearAdvancedSearch = () => {
    setAdvName('');
    setAdvDob('');
    setAdvPhone('');
    setAdvIp('');
    setCurrentAdvSearch({ name: '', dob: '', phone: '', ip: '' });
    setIsAdvSearchActive(false);
  };

  const handleSort = useCallback((key: TableFieldKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey]);

  // Apply search filters
  const filteredPatients = useMemo(() => {
    let result = [...patients];
    
    // Apply normal search if active
    if (searchQuery && !isSSNSearch) {
      const query = searchQuery.toLowerCase();
      result = result.filter(patient => 
        Object.values(patient).some(
          val => val && String(val).toLowerCase().includes(query)
        )
      );
    }
    
    // Apply advanced search filters if active
    if (isAdvSearchActive) {
      const { name, dob, phone, ip } = currentAdvSearch;
      
      if (name) {
        result = result.filter(patient => 
          patient.Name?.toLowerCase().includes(name.toLowerCase())
        );
      }
      
      if (dob) {
        result = result.filter(patient => 
          patient.DOB?.toLowerCase().includes(dob.toLowerCase())
        );
      }
      
      if (phone) {
        result = result.filter(patient => 
          patient.Phone?.includes(phone) || 
          patient.Mobile?.includes(phone)
        );
      }
      
      if (ip) {
        result = result.filter(patient => 
          patient.IPNo?.includes(ip) || 
          patient.AdmissionNo?.includes(ip)
        );
      }
    }
    
    return result;
  }, [patients, searchQuery, isAdvSearchActive, currentAdvSearch, isSSNSearch]);

  // Determine which patients to display
  const patientsToDisplay = useMemo(() => {
    return isSSNSearch && ssnSearchResults.length > 0
      ? ssnSearchResults
      : filteredPatients;
  }, [isSSNSearch, ssnSearchResults, filteredPatients]);

  const sortedPatients = useMemo(() => {
    if (!sortKey) return patientsToDisplay;

    return [...patientsToDisplay].sort((a, b) => {
      // Use type assertion to access dynamic properties
      const aValue = (a as any)[sortKey] || '';
      const bValue = (b as any)[sortKey] || '';
      
      if (aValue < bValue) return sortDir === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [patientsToDisplay, sortKey, sortDir]);

  const handleRowClick = useCallback((e: React.MouseEvent, patient: any) => {
    e.preventDefault();
    
    // Set the current patient in context
    setCurrentPatient(patient);
    
    // Navigate to the patient detail page
    router.push(`/patients/${patient.DFN}`);
  }, [router, setCurrentPatient]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Patients</h2>
        <p className="text-gray-600 mb-6">Failed to load patient data. Please try again.</p>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCwIcon className="h-4 w-4" />
          )}
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-2 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#2d3748]">Patient List</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              className="h-8 w-8 p-0"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-xs h-8"
            >
              {isRefreshing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCwIcon className="h-3.5 w-3.5" />
              )}
              Refresh
            </Button>
            <LogoutButton variant="outline" size="sm" className="h-8" />
          </div>
        </div>
        
        {/* Category filter and Search Bar Row */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Category filter - Left side */}
          <div className="flex-1 w-full">
            <RadioGroup
              value={filterCategory}
              onValueChange={setFilterCategory}
              className="w-full"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Appointments', "Ward's", "Provider's", 'Emergency', "Team/Personal's", 'Specialties', 'Default', 'New Order Dashboard'].map((cat) => (
                  <div key={cat} className="flex items-center space-x-1.5">
                    <RadioGroupItem value={cat} id={cat} className="h-3.5 w-3.5" />
                    <Label htmlFor={cat} className="text-xs whitespace-nowrap cursor-pointer">
                      {cat}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
          
          {/* Search Bar - Right side */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-48">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder={isSSNSearch ? "SSN..." : "Search..."}
                className="pl-9 pr-7 h-8 text-sm border rounded-md w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={isSSNSearch ? ssnSearch : searchQuery}
                onChange={handleSearchChange}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                disabled={isSearchingSSN && isSSNSearch}
              />
              {(isSSNSearch ? ssnSearch : searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    if (isSSNSearch) {
                      setSSNSearch('');
                      setSSNSearchResults([]);
                    } else {
                      setSearchQuery('');
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {isSearchingSSN && isSSNSearch && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
              )}
            </div>
            
            <div className="flex border rounded-md overflow-hidden h-8 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (isSSNSearch) {
                    setIsSSNSearch(false);
                    setSSNSearch('');
                    setSSNSearchResults([]);
                  }
                }}
                className={`px-2 text-sm flex items-center gap-1 transition-colors ${
                  !isSSNSearch 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white hover:bg-gray-100 text-gray-700'
                }`}
              >
                <SearchIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Search</span>
              </button>
              
              <div className="w-px bg-gray-200"></div>
              
              <button
                type="button"
                onClick={() => {
                  if (!isSSNSearch) {
                    setIsSSNSearch(true);
                    setSearchQuery('');
                  }
                }}
                className={`px-2 text-sm flex items-center gap-1 transition-colors ${
                  isSSNSearch 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white hover:bg-gray-100 text-gray-700'
                }`}
              >
                <Fingerprint className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">SSN</span>
              </button>
              
              <div className="w-px bg-gray-200"></div>
              
              <button
                type="button"
                onClick={() => setIsAdvOpen(true)}
                className="px-2 text-sm flex items-center gap-1 bg-white hover:bg-gray-100 text-gray-700 transition-colors"
              >
                <span className="hidden sm:inline">Advanced</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Advanced Search Dialog */}
      <Dialog open={isAdvOpen} onOpenChange={setIsAdvOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Advanced Search</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdvancedSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="advName">Patient Name</Label>
              <Input
                id="advName"
                value={advName}
                onChange={(e) => setAdvName(e.target.value)}
                placeholder="Enter patient name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="advDob">Date of Birth</Label>
              <Input
                id="advDob"
                type="date"
                value={advDob}
                onChange={(e) => setAdvDob(e.target.value)}
                placeholder="MM/DD/YYYY"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="advPhone">Phone Number</Label>
              <Input
                id="advPhone"
                value={advPhone}
                onChange={(e) => setAdvPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="advIp">IP Number</Label>
              <Input
                id="advIp"
                value={advIp}
                onChange={(e) => setAdvIp(e.target.value)}
                placeholder="Enter IP number"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAdvOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Search</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Patient Table */}
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        {/* Table content remains the same */}
        <div className="overflow-x-auto">
          <div className="h-[400px] overflow-y-auto text-xs">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-2 py-1 text-left text-[11px] font-medium text-white uppercase tracking-wider bg-[#2c5282] sticky top-0">
                    #
                  </th>
                  {TABLE_FIELDS.map((field) => {
                    const Icon = field.icon;
                    return (
                      <th
                        key={field.key}
                        scope="col"
                        className="px-2 py-1 text-left text-[11px] font-medium text-white uppercase tracking-wider bg-[#2c5282] sticky top-0"
                        onClick={() => handleSort(field.key)}
                      >
                        <div className="flex items-center">
                          <Icon className="h-3 w-3 mr-1 text-blue-300" />
                          <span className="flex items-center">
                            {field.label}
                            {sortKey === field.key && (
                              sortDir === 'asc' ? (
                                <ChevronUp className="ml-0.5 h-2.5 w-2.5" />
                              ) : (
                                <ChevronDown className="ml-0.5 h-2.5 w-2.5" />
                              )
                            )}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && !isRefreshing ? (
                  <tr>
                    <td colSpan={TABLE_FIELDS.length + 1} className="px-6 py-6 text-center">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        <p className="text-xs text-gray-500">Loading patients...</p>
                      </div>
                    </td>
                  </tr>
                ) : sortedPatients.length === 0 ? (
                  <tr>
                    <td colSpan={TABLE_FIELDS.length + 1} className="px-6 py-6 text-center">
                      <p className="text-xs text-gray-500">
                        {searchQuery ? 'No patients match your search. Try a different term.' : 'No patients found.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  sortedPatients.map((patient, index) => (
                    <tr 
                      key={patient.DFN || index} 
                      className="bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                      onClick={(e) => handleRowClick(e, patient)}
                    >
                      <td className="px-2 py-1 whitespace-nowrap text-gray-700">
                        {index + 1}
                      </td>
                      {TABLE_FIELDS.map((field) => (
                        <td key={field.key} className="px-2 py-1 whitespace-nowrap text-gray-700">
                          {getStringValue(patient[field.key], field.key)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-200 pt-2 mt-2">
        <div className="flex items-center gap-4">
          <span>Total Patients: {patients.length}</span>
          {searchQuery && (
            <span className="text-blue-600">
              Filtered: {filteredPatients.length}
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-[10px] opacity-75">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}