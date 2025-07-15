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
  X
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

      if (Array.isArray(data)) {
        setSSNSearchResults(data);
      } else if (data && typeof data === 'object') {
        const results = Object.entries(data).map(([id, name]) => ({
          id,
          name: String(name)
        }));
        setSSNSearchResults(results);
      }
    } catch (error) {
      console.error('Error searching SSN:', error);
      setSSNSearchResults([]);
    } finally {
      setIsSearchingSSN(false);
    }
  }, 300), [duz, ihtLocation]);

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

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchPatients({ search: searchQuery.trim() });
    } else {
      fetchPatients({});
    }
  };

  const handleSort = useCallback((key: TableFieldKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey]);

  // Handle SSN search input change
  const handleSSNSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSSNSearch(e.target.value);
  }, []);

  // Apply advanced search filters to the patients
  const filteredPatients = useMemo(() => {
    let result = [...patients];
    
    // Apply simple search if active
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(patient => 
        Object.values(patient).some(
          val => val && String(val).toLowerCase().includes(query)
        )
      );
    }
    
    // Apply SSN search if active
    if (ssnSearch) {
      result = result.filter(patient => 
        patient.SSN?.toLowerCase().includes(ssnSearch.toLowerCase())
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
  }, [patients, searchQuery, isAdvSearchActive, currentAdvSearch, ssnSearch]);

  const sortedPatients = useMemo(() => {
    if (!sortKey) return filteredPatients;

    return [...filteredPatients].sort((a, b) => {
      // Use type assertion to access dynamic properties
      const aValue = (a as any)[sortKey] || '';
      const bValue = (b as any)[sortKey] || '';
      
      if (aValue < bValue) return sortDir === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredPatients, sortKey, sortDir]);

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#2d3748]">Patient List</h1>
        <div className="flex items-center gap-2">
          {/* SSN Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by SSN..."
              className="pl-9 h-8 text-sm border rounded-md w-64 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={ssnSearch}
              onChange={handleSSNSearchChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchSSN(ssnSearch);
                }
              }}
              disabled={isSearchingSSN}
            />
            {isSearchingSSN && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
            )}
          </div>
          
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
      
      {/* Category section (left) + Search section (right) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        {/* Category filter */}
        <RadioGroup
          value={filterCategory}
          onValueChange={setFilterCategory}
          className="w-full"
        >
          <div className="grid grid-cols-4 gap-2">
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

        {/* Search section */}
        <div className="flex items-center gap-2">
          {/* Simple search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search patients..."
              className="pl-9 h-9 text-sm border rounded-md w-full md:w-64 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Clear filters button - only show when advanced search is active */}
          {isAdvSearchActive && (
            <Button 
              type="button"
              variant="outline"
              size="sm"
              onClick={clearAdvancedSearch}
              className="h-9 text-xs flex items-center gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <X className="h-3.5 w-3.5" />
              Clear Filters
            </Button>
          )}

          {/* Advanced search button */}
          <Dialog open={isAdvOpen} onOpenChange={setIsAdvOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                variant={isAdvSearchActive ? "default" : "outline"}
                className="h-8 text-xs"
              >
                {isAdvSearchActive ? 'Edit Search' : 'Advanced'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Advanced Patient Search</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdvancedSearch} className="space-y-3 mt-2">
                <div className="space-y-1">
                  <Label htmlFor="adv-name">Name</Label>
                  <Input 
                    id="adv-name" 
                    value={advName} 
                    onChange={(e) => setAdvName(e.target.value)} 
                    placeholder="Last Name, First Name" 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="adv-dob">Date of Birth</Label>
                  <Input 
                    id="adv-dob" 
                    value={advDob} 
                    onChange={(e) => setAdvDob(e.target.value)} 
                    placeholder="DD/MM/YYYY" 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="adv-phone">Phone No.</Label>
                  <Input 
                    id="adv-phone" 
                    value={advPhone} 
                    onChange={(e) => setAdvPhone(e.target.value)} 
                    placeholder="Phone Number" 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="adv-ip">IP No.</Label>
                  <Input 
                    id="adv-ip" 
                    value={advIp} 
                    onChange={(e) => setAdvIp(e.target.value)} 
                    placeholder="IP Number" 
                  />
                </div>
                <DialogFooter className="mt-4">
                  <div className="flex justify-between w-full">
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        clearAdvancedSearch();
                        setIsAdvOpen(false);
                      }}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Clear
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsAdvOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        size="sm"
                        className="flex items-center gap-1.5"
                      >
                        Search
                      </Button>
                    </div>
                  </div>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
        
      {/* Patient Table */}
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
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