'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge'; // Ensure this path is correct
import {
  Settings,
  FileEdit,
  RefreshCw,
  CalendarDays,
  ArrowUpDown,
  Ban,
  FileText,
  Printer,
  Download,
  Filter,
  PenLine,
  ChevronsUpDown,
  Check,
  X as XIcon,
  Save,
  Pencil,
  Copy,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Search,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle as DialogUITitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import IpMedicationOrderDialog from './IpMedicationOrderDialog';
import type { Patient } from '@/lib/constants';
import type { NextPage } from 'next';
import { apiService } from '@/services/api'; // Import api
import { useMedications } from '@/hooks/useMedications'; // Import the useMedications hook
import { fetchRadiologyOrders } from '@/services/radiology';
import { fetchNursingOrders } from '@/services/nursing';
import { fetchProcedureOrders, ProcedureOrder } from '@/services/procedure';
import { usePatient } from '@/hooks/use-patient';
import { usePatientActions } from '@/hooks/use-patient-actions';

// Add OrdersPageProps interface


// Navigation items
const orderSubNavItems = [
  "CPOE Order List",
  "Write Delay Order",
  "IP Medication",
  "Laboratory",
  "Radiology",
  "Visit/ADT",
  "Procedure Orders",
  "Nursing Care"
];

// Data Types and Mock Data

// CPOE Order List Data
type OrderDataType = {
  id: string;
  service: string;
  order: string;
  orderNote?: string;
  startDate: string;
  startTime: string;
  stopDate?: string;
  stopTime?: string;
  provider: string;
  status: "UNRELEASED" | "ACTIVE" | "Completed" | "Pending" | "Cancelled";
  location: string;
};

// Visit/ADT Data
type VisitAdtDataType = {
  id: string;
  event: string;
  dateTime: string;
  provider: string;
  status: "COMPLETED" | "DISCONTINUED";
  location: string;
};

// IP Medication Data
interface VisitData {
  VST_DATE: string;
  VST_DFT: string | number;
  VST_HOS: string;
  VST_IEN: string | number;
  VST_TYP: string;
}

interface VisitApiResponse {
  [key: string]: VisitData;
}

interface IpMedicationEntryDataType {
  id: string;
  services: string;
  medicationName: string;
  status: string;
  startDate: string;
  startTime?: string;
  stopDate?: string;
  stopTime?: string;
  orderedBy: string;
  medicationDay: string;
  orderURL: string;
  schedule?: string;
  scheduleNote?: string;
  signURL?: string;
  discontinueURL?: string;
  changeURL?: string;
  copyURL?: string;
  flagURL?: string;
  unflagURL?: string;
  holdURL?: string;
  releaseURL?: string;
  renewURL?: string;
}

// Delay Orders Data
type DelayOrderDataType = {
  id: string;
  event: string;
  order: string;
  startDate: string;
  startTime: string;
  stopDate?: string;
  stopTime?: string;
  status: "UNRELEASED" | "ACTIVE" | "Completed" | "Pending" | "Cancelled";
  orderedBy: string;
};

// Lab CPOE List Data
type LabCpoeDataType = {
  id: string;
  section: string;
  labTest: string;
  sample: string;
  orderDate: string;
  orderTime: string;
  startDate: string;
  startTime: string;
  status: "UNRELEASED" | "ACTIVE" | "Completed" | "Pending" | "Cancelled";
};

// Radiology Data
type RadiologyDataType = {
  id: string;
  testName: string;
  orderDate: string;
  orderTime: string;
  startDate?: string;
  startTime?: string;
  provider: string;
  status: "UNRELEASED" | "PENDING" | "COMPLETED" | "ACTIVE";
  location: string;
  result?: string;  // Add optional result field
  'Order IEN'?: string;  // Add optional Order IEN field
  'Imaging Procedure'?: string;  // Add optional Imaging Procedure field
};

// Components

// CPOE Order List View
const CpoeOrderListView = () => {
  const patient = usePatient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingLabOrders, setLoadingLabOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visitDateFilter, setVisitDateFilter] = useState<string>("");
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [orderFromDate, setOrderFromDate] = useState<string>("");
  const [orderToDate, setOrderToDate] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [showEntries, setShowEntries] = useState<string>("10");
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingLabOrders(true);
      setError(null);

      // Use fallback SSN if patient SSN is not available
      const effectiveSSN = patient?.ssn || '800000035';
      
      if (!effectiveSSN) {
        console.error('No patient SSN available');
        setError('Patient SSN is required to fetch orders');
        setLoadingLabOrders(false);
        return;
      }

      try {
        const requestBody = {
          UserName: 'CPRS-UAT',
          Password: 'UAT@123',
          PatientSSN: effectiveSSN,
          DUZ: '80',
          ihtLocation: 67,
          FromDate: '',
          ToDate: '',
          rcpAdmDateL: '11435762',
          rcpoeSerOrd: '6',
        };

        console.log('Fetching CPOE orders for SSN:', effectiveSSN);
        
        const response = await fetch('http://192.168.1.53/cgi-bin/apiOrdCPOEList.sh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        const data = await response.json();
        
        if (!data || Object.keys(data).length === 0) {
          setOrders([]);
          setError('No orders found for this patient');
        } else {
          // Transform the response data into the expected format
          const ordersArray = Object.entries(data).map(([key, item]: [string, any]) => ({
            id: item.ID?.toString() || key,
            Service: item.Service || 'N/A',
            Order: item.Order || 'N/A',
            'Start Date': item['Start Date'] || '',
            'Start Time': item['Start Time'] || '',
            'Stop Date': item['Stop Date'] || '',
            'Stop Time': item['Stop Time'] || '',
            Provider: item.Provider || 'N/A',
            Status: item.Status || 'UNKNOWN',
            Location: item.Location || 'N/A',
          }));
          
          setOrders(ordersArray);
        }
      } catch (err) {
        console.error('Error fetching CPOE orders:', err);
        setError(`Failed to fetch orders: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setOrders([]);
      } finally {
        setLoadingLabOrders(false);
      }
    };

    fetchOrders();
  }, [patient?.ssn]); // Only re-run if patient SSN changes

  const filteredOrders = orders.filter(order => {
    const serviceMatch = serviceFilter ? order.Service.toLowerCase() === serviceFilter.toLowerCase() : true;
    const statusMatch = statusFilter ? order.Status.toLowerCase() === statusFilter.toLowerCase() : true;
    const dateMatch = orderFromDate && orderToDate ? order['Start Date'] >= orderFromDate && order['Start Date'] <= orderToDate : true;
    const searchMatch = searchText ? Object.values(order).some((value) => (value as any)?.toString().toLowerCase().includes(searchText.toLowerCase())) : true;
    return serviceMatch && statusMatch && dateMatch && searchMatch;
  });

  const totalPages = Math.ceil(filteredOrders.length / parseInt(showEntries));
  const startIndex = (currentPage - 1) * parseInt(showEntries);
  const endIndex = startIndex + parseInt(showEntries);
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  if (loadingLabOrders) {
    return (
      <Card className="flex-1 flex items-center justify-center">
        <CardContent className="text-center">
          <p className="text-muted-foreground">Loading orders...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex-1 flex items-center justify-center">
        <CardContent className="text-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex-1 flex flex-col shadow overflow-hidden">
      <CardHeader className="p-1.5 border-b bg-card text-foreground rounded-t-md">
        <CardTitle className="text-base font-semibold">CPOE Order List</CardTitle>
      </CardHeader>
      <CardContent className="p-1.5 flex-1 flex flex-col overflow-hidden">
        <div className="space-y-1 mb-2 text-xs">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Label htmlFor="visitDate" className="shrink-0">Visit Date</Label>
            <Select value={visitDateFilter} onValueChange={setVisitDateFilter}>
              <SelectTrigger id="visitDate" className="h-7 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15 MAY, 2025 19:4">15 MAY, 2025 19:4</SelectItem>
              </SelectContent>
            </Select>
            <Label htmlFor="service" className="shrink-0">Service</Label>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger id="service" className="h-7 w-24 text-xs">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All" key="all-services">All</SelectItem>
                {Array.from(new Set(orders.map(order => order.Service))).map(service => (
                  <SelectItem key={`service-${service}`} value={service}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label htmlFor="status" className="shrink-0">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status" className="h-7 w-24 text-xs">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All" key="all-status">All</SelectItem>
                {Array.from(new Set(orders.map(order => order.Status))).map(status => (
                  <SelectItem key={`status-${status}`} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label htmlFor="orderFrom" className="shrink-0">Order From</Label>
            <div className="relative">
              <Input id="orderFrom" type="text" value={orderFromDate} onChange={e => setOrderFromDate(e.target.value)} className="h-7 w-24 text-xs pr-7" aria-label="Lab Order From Date" placeholder="DD/MM/YYYY" />
              <CalendarDays className="h-3.5 w-3.5 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Label htmlFor="orderTo" className="shrink-0">Order To</Label>
            <div className="relative">
              <Input id="orderTo" type="text" value={orderToDate} onChange={e => setOrderToDate(e.target.value)} className="h-7 w-24 text-xs pr-7" aria-label="Lab Order To Date" placeholder="DD/MM/YYYY" />
              <CalendarDays className="h-3.5 w-3.5 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <div className="flex items-center space-x-1">
              <Label htmlFor="showEntries" className="text-xs shrink-0">Show</Label>
              <Select value={showEntries} onValueChange={setShowEntries}>
                <SelectTrigger id="showEntries" className="h-7 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10" key="entries-10">10</SelectItem>
                  <SelectItem value="25" key="entries-25">25</SelectItem>
                  <SelectItem value="50" key="entries-50">50</SelectItem>
                </SelectContent>
              </Select>
              <Label htmlFor="showEntries" className="text-xs shrink-0">entries</Label>
            </div>
            <div className="flex-grow"></div>
            <Label htmlFor="search" className="shrink-0">Search:</Label>
            <Input id="search" type="text" value={searchText} onChange={e => setSearchText(e.target.value)} className="h-7 w-40 text-xs" />
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          <Table className="text-xs w-full">
            <TableHeader className="bg-accent sticky top-0 z-10">
              <TableRow>
                <TableHead className="py-1 px-2 text-xs h-auto">
                  <div className="flex items-center justify-between">
                    Service
                    <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                  </div>
                </TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">
                  <div className="flex items-center justify-between">
                    Order
                    <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                  </div>
                </TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">
                  <div className="flex items-center justify-between">
                    Start/Stop Date
                    <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                  </div>
                </TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">
                  <div className="flex items-center justify-between">
                    Provider
                    <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                  </div>
                </TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">
                  <div className="flex items-center justify-between">
                    Status
                    <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                  </div>
                </TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">
                  <div className="flex items-center justify-between">
                    Location
                    <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length > 0 ? paginatedOrders.map((order, index) => (
                <TableRow key={`order-${order.id || order.Service}-${order.Order}`} className={`${index % 2 === 0 ? 'bg-muted/30' : ''}`}>
                  <TableCell className="py-1 px-2">{order.Service}</TableCell>
                  <TableCell className="py-1 px-2">{order.Order}</TableCell>
                  <TableCell className="py-1 px-2">
                    {order['Start Date'] && order['Start Time'] ? `Start: ${order['Start Date']} ${order['Start Time']}` : ''}
                    {order['Stop Date'] && order['Stop Time'] ? <><br />{`Stop: ${order['Stop Date']} ${order['Stop Time']}`}</> : null}
                  </TableCell>
                  <TableCell className="py-1 px-2">{order.Provider}</TableCell>
                  <TableCell className="py-1 px-2 text-xs">{order.Status}</TableCell>
                  <TableCell className="py-1 px-2">{order.Location}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-1.5 border-t text-xs text-muted-foreground mt-auto">
          <div>Showing {paginatedOrders.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} entries</div>
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1 bg-accent text-foreground border-border">{currentPage}</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const IpMedicationView = () => {
  const patient = usePatient();
  const [isAddIpMedicationDialogOpen, setIsAddIpMedicationDialogOpen] = useState(false);
  const [visitDate, setVisitDate] = useState<string | undefined>(undefined);
  
  // Use the useMedications hook to fetch medication data
  const { data: medications, loading, error: medicationError } = useMedications();
  
  // Transform the medication data to match the expected format
  const ipMedicationList = useMemo(() => {
    return medications.map(med => ({
      id: med.id?.toString() || med.OrderIEN?.toString() || Math.random().toString(36).substr(2, 9),
      services: med.Services || 'Inpt. Meds',
      medicationName: med.medicationName || med.medication || med['Medication Name'] || 'Unknown Medication',
      status: med.status || med.Status || 'UNKNOWN',
      startDate: med['Start Date'] || '',
      startTime: '', // Add time if available in the API response
      stopDate: med['Stop Date'] || '',
      stopTime: '', // Add time if available in the API response
      orderedBy: med['Ordered By'] || 'Unknown',
      medicationDay: med['Medication Day'] || '1',
      orderURL: med.OrderURL || '#',
      schedule: med.schedule || med.Schedule || '',
      signURL: med.Sign,
      discontinueURL: med.Discontinue,
      changeURL: med.Change,
      copyURL: med.Copy,
      flagURL: med.Flag,
      unflagURL: med.Unflag,
      holdURL: med.Hold,
      releaseURL: med.Release,
      renewURL: med.Renew
    }));
  }, [medications]);
  
  const [scheduleType, setScheduleType] = useState<string | undefined>();
  const [status, setStatus] = useState<string>("all");
  const [orderFrom, setOrderFrom] = useState<string>("");
  const [orderTo, setOrderTo] = useState<string>("");
  const [showEntries, setShowEntries] = useState<string>("All");
  const [searchText, setSearchText] = useState<string>("");
  const [loadingLabOrders, setLoadingLabOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const openOrderMedicinesDialog = () => {
    setIsAddIpMedicationDialogOpen(true);
  };

  const handleConfirmOrder = (rows: any[]) => {
    const newMedications: IpMedicationEntryDataType[] = rows.map(row => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
      services: 'Inpt. Meds',
      medicationName: row.medicationName,
      status: 'UNRELEASED',
      startDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      stopDate: '',
      stopTime: '',
      orderedBy: 'System (Dialog)',
      medicationDay: 'Day 1',
      orderURL: '#', // Required field
      schedule: row.schedule === 'SELECT' ? 'Pending' : row.schedule,
      scheduleNote: row.prn ? 'PRN' : row.comment || undefined,
    }));

    // Update the ipMedicationList state with the new medications
    // This is not necessary if you're using the useMedications hook correctly
    // setIpMedicationList(prev => [...newMedications, ...prev]);
    setIsAddIpMedicationDialogOpen(false);
  };

  const ipMedTableHeaders = ["Services", "Medication Name", "Start/Stop Date", "Status", "Ordered By", "Sign", "Discontinue", "Actions", "Medication Day", "Schedule"];

  return (
    <Card className="flex-1 flex flex-col shadow overflow-hidden">
      <CardHeader className="p-1.5 border-b bg-card text-foreground rounded-t-md">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">IPD Medication List</CardTitle>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50"><FileEdit className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50"><RefreshCw className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50"><Settings className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50"><Printer className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50"><Download className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50"><Filter className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-1.5 flex-1 flex flex-col overflow-hidden">
        <div className="space-y-1 mb-2 text-xs">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Label htmlFor="ipVisitDate" className="shrink-0">Visit Date</Label>
            <Select value={visitDate} onValueChange={setVisitDate}>
              <SelectTrigger id="ipVisitDate" className="h-7 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15 MAY, 2025 19:4">15 MAY, 2025 19:4</SelectItem>
              </SelectContent>
            </Select>
            <Label htmlFor="ipStatus" className="shrink-0">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="ipStatus" className="h-7 w-24 text-xs">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="HOLD">HOLD</SelectItem>
                <SelectItem value="UNRELEASED">UNRELEASED</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Loading medication data...</p>
          </div>
        ) : medicationError ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-destructive">{medicationError}</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="overflow-hidden rounded-md border">
              <div className="relative h-full max-h-[calc(100vh-250px)] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background">
                    <TableRow className="border-b">
                      <TableHead className="py-1 px-2 text-xs h-8 bg-muted/50">Services</TableHead>
                      <TableHead className="py-1 px-2 text-xs h-8 bg-muted/50">Medication Name</TableHead>
                      <TableHead className="py-1 px-2 text-xs h-8 bg-muted/50">Start/Stop Date</TableHead>
                      <TableHead className="py-1 px-2 text-xs h-8 bg-muted/50">Status</TableHead>
                      <TableHead className="py-1 px-2 text-xs h-8 bg-muted/50">Ordered By</TableHead>
                      <TableHead className="py-1 px-2 text-xs h-8 bg-muted/50">Sign</TableHead>
                      <TableHead className="py-1 px-2 text-xs h-8 bg-muted/50">Discontinue</TableHead>
                      <TableHead className="py-1 px-2 text-xs h-8 bg-muted/50">Actions</TableHead>
                      <TableHead className="py-1 px-2 text-xs h-8 bg-muted/50">Medication Day</TableHead>
                      <TableHead className="py-1 px-2 text-xs h-8 bg-muted/50">Schedule</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&>tr:last-child]:border-0">
                    {ipMedicationList.length > 0 ? ipMedicationList.map((med, index) => (
                      <TableRow key={med.id} className={`text-xs hover:bg-muted/50 ${index % 2 === 0 ? 'bg-muted/10' : 'bg-background'}`}>
                        <TableCell className="py-1 px-2">{med.services}</TableCell>
                        <TableCell className="py-1 px-2">
                          <a href={med.orderURL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {med.medicationName}
                          </a>
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          {med.startDate && `Start: ${med.startDate} ${med.startTime || ''}`}
                          {med.stopDate && (
                            <>
                              <br />
                              {`Stop: ${med.stopDate} ${med.stopTime || ''}`}
                            </>
                          )}
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          <Badge 
                            variant={
                              med.status?.toUpperCase() === 'UNRELEASED' ? 'secondary' : 
                              med.status?.toUpperCase() === 'ACTIVE' ? 'default' :
                              med.status?.toUpperCase() === 'DISCONTINUED' ? 'destructive' : 'outline'
                            }
                            className="text-[11px] font-normal capitalize"
                          >
                            {med.status?.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1 px-2">{med.orderedBy}</TableCell>
                        <TableCell className="py-1 px-2">
                          {med.signURL && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 p-0" asChild>
                                  <a href={med.signURL} target="_blank" rel="noopener noreferrer" title="Sign">
                                    <PenLine className="h-3 w-3" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">Sign Order</TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          {med.discontinueURL && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 p-0" asChild>
                                  <a href={med.discontinueURL} target="_blank" rel="noopener noreferrer" title="Discontinue">
                                    <Ban className="h-3 w-3 text-red-500" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">Discontinue</TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          <div className="flex gap-1">
                            {med.changeURL && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0" asChild>
                                    <a href={med.changeURL} target="_blank" rel="noopener noreferrer" title="Change">
                                      <Pencil className="h-3 w-3" />
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">Change Order</TooltipContent>
                              </Tooltip>
                            )}
                            {med.copyURL && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0" asChild>
                                    <a href={med.copyURL} target="_blank" rel="noopener noreferrer" title="Copy">
                                      <Copy className="h-3 w-3" />
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">Copy Order</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          {med.medicationDay || 'N/A'}
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          {med.schedule || 'N/A'}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                          No medications found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-2.5 border-t text-xs text-muted-foreground mt-auto">
          <div>
            Showing {ipMedicationList.length > 0 ? 1 : 0} to {ipMedicationList.length} of {ipMedicationList.length} entries
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1">Previous</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1 bg-accent text-foreground border-border">1</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1">Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Delay Orders View
const DelayOrdersView = () => {
  const [delayOrderView, setDelayOrderView] = useState<string>("Delay Order List");
  const [eventFilter, setEventFilter] = useState<string>("ADMISSION TO LAJPATNAGAR");
  const [showEntries, setShowEntries] = useState<string>("10");
  const [searchText, setSearchText] = useState<string>("");

  const filteredDelayOrders: any[] = [];

  const delayOrderTableHeaders = ["S.No.", "Event", "Order", "Start/Stop Date", "Status", "Ordered By", "Sign", "Discontinue", "Change Event", "Release Order", "Order View"];

  return (
    <Card className="flex-1 flex flex-col shadow overflow-hidden">
      <CardHeader className="p-2.5 border-b bg-card text-foreground rounded-t-md">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Delay Orders - List/Events</CardTitle>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2.5 flex-1 flex flex-col overflow-hidden">
        <div className="space-y-2 mb-2 text-xs">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="delayOrderList"
                name="delayOrderView"
                value="Delay Order List"
                checked={delayOrderView === "Delay Order List"}
                onChange={() => setDelayOrderView("Delay Order List")}
                className="h-4 w-4 text-blue-600"
                title="Delay Order List"
              />
              <Label htmlFor="delayOrderList" className="text-xs">Delay Order List</Label>
              <input
                type="radio"
                id="delayOrderEvents"
                name="delayOrderView"
                value="Delay Order Events"
                checked={delayOrderView === "Delay Order Events"}
                onChange={() => setDelayOrderView("Delay Order Events")}
                className="h-4 w-4 text-blue-600"
                title="Delay Order Events"
              />
              <Label htmlFor="delayOrderEvents" className="text-xs">Delay Order Events</Label>
            </div>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="h-7 w-48 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMISSION TO LAJPATNAGAR">ADMISSION TO LAJPATNAGAR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center space-x-1">
              <Label htmlFor="delayShowEntries" className="text-xs shrink-0">Show</Label>
              <Select value={showEntries} onValueChange={setShowEntries}>
                <SelectTrigger id="delayShowEntries" className="h-7 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <Label htmlFor="delayShowEntries" className="text-xs shrink-0">entries</Label>
            </div>
            <div className="flex-grow"></div>
            <Label htmlFor="delaySearch" className="shrink-0">Search:</Label>
            <Input id="delaySearch" type="text" value={searchText} onChange={e => setSearchText(e.target.value)} className="h-7 w-40 text-xs" />
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          <Table className="text-xs w-full">
            <TableHeader className="bg-accent sticky top-0 z-10">
              <TableRow>
                {delayOrderTableHeaders.map(header => (
                  <TableHead key={header} className="py-1 px-3 text-xs h-auto">
                    <div className="flex items-center justify-between">
                      {header}
                      <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDelayOrders.length > 0 ? filteredDelayOrders.map((order, index) => (
                <TableRow key={order.id} className={`${index % 2 === 0 ? 'bg-muted/30' : ''}`}>
                  <TableCell className="py-1.5 px-3">{index + 1}</TableCell>
                  <TableCell className="py-1.5 px-3">{order.event}</TableCell>
                  <TableCell className="py-1.5 px-3">{order.order}</TableCell>
                  <TableCell className="py-1.5 px-3">
                    <div>Start: {order.startDate} {order.startTime}</div>
                    {order.stopDate && <div>Stop: {order.stopDate} {order.stopTime}</div>}
                  </TableCell>
                  <TableCell className="py-1.5 px-3 text-xs">{order.status}</TableCell>
                  <TableCell className="py-1.5 px-3">{order.orderedBy}</TableCell>
                  <TableCell className="py-1.5 px-3 text-center"><Button variant="ghost" size="icon" className="h-6 w-6"><PenLine className="h-3.5 w-3.5 text-blue-600" /></Button></TableCell>
                  <TableCell className="py-1.5 px-3 text-center"><Button variant="ghost" size="icon" className="h-6 w-6"><Ban className="h-3.5 w-3.5 text-red-500" /></Button></TableCell>
                  <TableCell className="py-1.5 px-3 text-center"><Button variant="ghost" size="icon" className="h-6 w-6"><FileText className="h-3.5 w-3.5 text-blue-600" /></Button></TableCell>
                  <TableCell className="py-1.5 px-3 text-center"><Button variant="ghost" size="icon" className="h-6 w-6"><FileText className="h-3.5 w-3.5 text-blue-600" /></Button></TableCell>
                  <TableCell className="py-1.5 px-3 text-center"><Button variant="ghost" size="icon" className="h-6 w-6"><FileText className="h-3.5 w-3.5 text-blue-600" /></Button></TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={delayOrderTableHeaders.length} className="text-center py-10 text-muted-foreground">
                    No Data Found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-2.5 border-t text-xs text-muted-foreground mt-auto">
          <div>Showing {filteredDelayOrders.length > 0 ? 1 : 0} to {filteredDelayOrders.length} of {filteredDelayOrders.length} entries</div>
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1">Previous</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1 bg-accent text-foreground border-border">1</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1">Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const RadiologyView = () => {
  const patient = usePatient();
  const [radiologyOrders, setRadiologyOrders] = useState<RadiologyDataType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [orderFromDate, setOrderFromDate] = useState<string>('');
  const [orderToDate, setOrderToDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Fetch radiology orders when component mounts or patient changes
  useEffect(() => {
    const fetchOrders = async () => {
      if (!patient?.ssn) {
        console.log('No patient SSN available, using test SSN');
      }

      setLoading(true);
      setError(null);
      
      try {
        const response = await fetchRadiologyOrders(patient?.ssn || '', {
          fromDate: orderFromDate,
          toDate: orderToDate,
        });

        // Transform the API response to match RadiologyDataType
        const orders = response.map((order, index) => ({
          id: order.id || `order-${index}`,
          testName: order.imagingProcedure || 'Unknown Test',
          orderDate: order.orderDateTime ? new Date(order.orderDateTime).toLocaleDateString() : '',
          orderTime: order.orderDateTime ? new Date(order.orderDateTime).toLocaleTimeString() : '',
          startDate: '', // Not provided in API response
          startTime: '', // Not provided in API response
          provider: order.provider || 'Unknown',
          status: order.status,
          location: order.location || 'N/A',
          result: order.result,
          'Order IEN': order.id,
          'Imaging Procedure': order.imagingProcedure
        }));
        
        setRadiologyOrders(orders);
      } catch (error) {
        console.error('Error fetching radiology orders:', error);
        setError('Failed to load radiology orders. Please try again later.');
        setRadiologyOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [patient?.ssn, orderFromDate, orderToDate]);

  const filteredRadiologyOrders = radiologyOrders.filter(order => 
    order.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const radiologyTableHeaders = [
    "Imaging Procedure", 
    "Type", 
    "Order Date/Time", 
    "Provider", 
    "Status", 
    "Sign", 
    "Discontinue", 
    "Result",
    "Location"
  ];

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden border">
      <CardHeader className="p-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Radiology Orders</CardTitle>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted/50">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted/50">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted/50">
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted/50">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted/50">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
        {/* Filters */}
        <div className="space-y-3 mb-4 pb-3 border-b">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="orderFrom" className="text-xs whitespace-nowrap">Order From</Label>
              <div className="relative">
                <Input
                  id="orderFrom"
                  type="text"
                  value={orderFromDate}
                  onChange={(e) => setOrderFromDate(e.target.value)}
                  className="h-8 w-32 text-xs pr-7"
                  placeholder="DD/MM/YYYY"
                />
                <CalendarDays className="h-3.5 w-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="orderTo" className="text-xs whitespace-nowrap">To</Label>
              <div className="relative">
                <Input
                  id="orderTo"
                  type="text"
                  value={orderToDate}
                  onChange={(e) => setOrderToDate(e.target.value)}
                  className="h-8 w-32 text-xs pr-7"
                  placeholder="DD/MM/YYYY"
                />
                <CalendarDays className="h-3.5 w-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            
            <div className="flex-1"></div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="search" className="text-xs whitespace-nowrap">Search:</Label>
              <Input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 w-48 text-xs"
                placeholder="Search orders..."
              />
            </div>
          </div>
        </div>
        
        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-destructive">{error}</p>
            </div>
          ) : (
            <Table className="text-xs">
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow>
                  {radiologyTableHeaders.map((header) => (
                    <TableHead key={header} className="py-2 px-3 font-medium">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRadiologyOrders.length > 0 ? (
                  filteredRadiologyOrders.map((order, index) => (
                    <TableRow 
                      key={`${order.id}-${index}`}
                      className={index % 2 === 0 ? 'bg-muted/5' : ''}
                    >
                      <TableCell className="py-2 px-3">{order.testName}</TableCell>
                      <TableCell className="py-2 px-3">N/A</TableCell>
                      <TableCell className="py-2 px-3 whitespace-nowrap">
                        {order.orderDate} {order.orderTime}
                      </TableCell>
                      <TableCell className="py-2 px-3">{order.provider}</TableCell>
                      <TableCell className="py-2 px-3">
                        <Badge 
                          variant={
                            order.status === 'COMPLETED' ? 'default' : 
                            order.status === 'PENDING' ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1 px-3 text-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <PenLine className="h-3.5 w-3.5 text-blue-600" />
                        </Button>
                      </TableCell>
                      <TableCell className="py-1 px-3 text-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Ban className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        {order.result || 'N/A'}
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        {order.location}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={radiologyTableHeaders.length} className="py-8 text-center text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Lab CPOE List View
const LabCpoeListViewUpdated = () => {
  const patient = usePatient();
  const [labOrders, setLabOrders] = useState<LabCpoeDataType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sectionFilter, setSectionFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showEntries, setShowEntries] = useState<string>("10");
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const fetchLabOrders = async () => {
      try {
        setLoading(true);
        
        // Use the correct endpoint and ensure we have a valid SSN
        const effectiveSSN = patient?.ssn || '800000035'; // Fallback to default SSN if not available
        
        if (!effectiveSSN) {
          console.error('No patient SSN available for lab orders');
          setError('Patient SSN is required to fetch lab orders');
          return;
        }

        const response = await fetch('http://192.168.1.53/cgi-bin/apiOrdCPOEList.sh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            UserName: 'CPRS-UAT',
            Password: 'UAT@123',
            PatientSSN: effectiveSSN,
            DUZ: '80',
            ihtLocation: 67,
            FromDate: '',
            ToDate: '',
            Action: 'L'
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Lab orders response:', data);

        // Transform the response data to match the expected format
        const orders = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          section: value.Section || 'UNKNOWN',
          labTest: value['Lab Test'] || 'N/A',
          sample: value.Sample || 'N/A',
          orderDate: value['Order Date'] || '',
          orderTime: value['Order Time'] || '',
          startDate: value['Start Date'] || '',
          startTime: value['Start Time'] || '',
          status: value.Status || 'UNKNOWN',
        }));

        setLabOrders(orders);
      } catch (err) {
        console.error('Error fetching lab orders:', err);
        setError('Failed to load lab orders. Please try again later.');
        // Fallback to empty array to prevent rendering errors
        setLabOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLabOrders();
  }, [patient.ssn]);

  const filteredLabOrders = labOrders.filter(order => {
    const matchesSection = sectionFilter ? order.section.toLowerCase() === sectionFilter.toLowerCase() : true;
    const matchesSearch = searchTerm ? Object.values(order).some((value) => (value as any)?.toString().toLowerCase().includes(searchTerm.toLowerCase())) : true;
    return matchesSection && matchesSearch;
  });

  const totalPages = Math.ceil(filteredLabOrders.length / parseInt(showEntries));
  const startIndex = (currentPage - 1) * parseInt(showEntries);
  const endIndex = startIndex + parseInt(showEntries);
  const paginatedLabOrders = filteredLabOrders.slice(startIndex, endIndex);

  const labCpoeTableHeaders = ["Section", "Lab Test", "Sample", "Order Date", "Order Time", "Start Date", "Start Time", "Status"];

  return (
    <Card className="flex-1 flex flex-col shadow overflow-hidden">
      <CardHeader className="p-2.5 border-b bg-card text-foreground rounded-t-md">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Lab CPOE List</CardTitle>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2.5 flex-1 flex flex-col overflow-hidden">
        <div className="space-y-2 mb-2 text-xs">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Label htmlFor="labSection" className="shrink-0">Section</Label>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger id="labSection" className="h-7 w-24 text-xs">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {Array.from(new Set(labOrders.map(order => order.section))).map(section => (
                  <SelectItem key={`section-${section}`} value={section}>{section}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label htmlFor="labSearch" className="shrink-0">Search:</Label>
            <Input id="labSearch" type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-7 w-40 text-xs" />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center space-x-1">
              <Label htmlFor="labShowEntries" className="text-xs shrink-0">Show</Label>
              <Select value={showEntries} onValueChange={setShowEntries}>
                <SelectTrigger id="labShowEntries" className="h-7 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <Label htmlFor="labShowEntries" className="text-xs shrink-0">entries</Label>
            </div>
            <div className="flex-grow"></div>
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading lab orders...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-destructive">{error}</p>
            </div>
          ) : (
            <Table className="text-xs w-full">
              <TableHeader className="bg-accent sticky top-0 z-10">
                <TableRow>
                  {labCpoeTableHeaders.map(header => (
                    <TableHead key={header} className="py-1 px-3 text-xs h-auto">
                      <div className="flex items-center justify-between">
                        {header}
                        <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLabOrders.length > 0 ? paginatedLabOrders.map((lab, index) => (
                  <TableRow key={`lab-${lab.id}`} className={`${index % 2 === 0 ? 'bg-muted/30' : ''}`}>
                    <TableCell className="py-1 px-3">{lab.section}</TableCell>
                    <TableCell className="py-1 px-3">{lab.labTest}</TableCell>
                    <TableCell className="py-1 px-3">{lab.sample}</TableCell>
                    <TableCell className="py-1 px-3">{lab.orderDate}</TableCell>
                    <TableCell className="py-1 px-3">{lab.orderTime}</TableCell>
                    <TableCell className="py-1 px-3">{lab.startDate}</TableCell>
                    <TableCell className="py-1 px-3">{lab.startTime}</TableCell>
                    <TableCell className="py-1 px-3 text-xs">{lab.status}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={labCpoeTableHeaders.length} className="text-center py-10 text-muted-foreground">
                      No lab orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex items-center justify-between p-2.5 border-t text-xs text-muted-foreground mt-auto">
          <div>Showing {paginatedLabOrders.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredLabOrders.length)} of {filteredLabOrders.length} entries</div>
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1 bg-accent text-foreground border-border">{currentPage}</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Visit/ADT View
const VisitAdtView = () => {
  const patient = usePatient();
  const [visitDate, setVisitDate] = useState<string | undefined>("Select");
  const [visitDetails, setVisitDetails] = useState<VisitData[]>([]);
  const [loadingLabOrders, setLoadingLabOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('VisitAdtView - Patient data:', patient); // Debug log

  useEffect(() => {
    console.log('VisitAdtView - useEffect triggered with patient:', patient);
    
    setLoadingLabOrders(true);
    setError(null);

    if (!patient?.ssn) {
      setError('Patient SSN not available.');
      setLoadingLabOrders(false);
      return;
    }

    const requestBody = {
      UserName: "CPRS-UAT",
      Password: "UAT@123",
      Patientssn: patient.ssn,
      DUZ: "80"
    };

    console.log('Fetching visit details for SSN:', patient.ssn);
    
    console.log('API URL:', 'http://3.6.230.54:4003/api/apiPatVstDtl.sh');
    
    console.log('Sending request with body:', JSON.stringify(requestBody, null, 2));
    
    fetch('http://3.6.230.54:4003/api/apiPatVstDtl.sh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
    })
      .then(async res => {
        console.log('Response status:', res.status);
        if (!res.ok) {
          const errorText = await res.text();
          console.error('API Error:', errorText);
          throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
        }
        return res.json();
      })
      .then((data: Record<string, VisitData>) => {
        console.log('Visit Details API response:', data);
        if (!data || Object.keys(data).length === 0 || data.errors) {
          setVisitDetails([]);
          setError('No data found');
        } else {
          const detailsArray = Object.values(data);
          setVisitDetails(detailsArray);
          // Set the first non-select visit date as default
          const firstValidVisit = detailsArray.find((visit: VisitData) => visit.VST_DATE !== "Select");
          if (firstValidVisit) {
            setVisitDate(firstValidVisit.VST_DATE);
          }
        }
      })
      .catch(err => {
        console.error('Error fetching visit details:', err);
        setError('Failed to fetch visit details: ' + err.message);
      })
      .finally(() => setLoadingLabOrders(false));

  }, [patient]); // Depend on patient to refetch if it changes

  const visitAdtTableHeaders = ["Visit Date", "Visit Type", "Hospital", "Visit IEN", "Visit DFT"];

  return (
    <Card className="flex-1 flex flex-col shadow overflow-hidden">
      <CardHeader className="p-2.5 border-b bg-card text-foreground rounded-t-md">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Visit/ADT Details</CardTitle>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2.5 flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs mb-2">
          <Label htmlFor="visitDate" className="shrink-0 text-xs">Visit Date</Label>
          <Select 
            value={visitDate} 
            onValueChange={setVisitDate}
          >
            <SelectTrigger id="visitDate" className="h-7 w-40 text-xs">
              <SelectValue placeholder="Select Visit Date" />
            </SelectTrigger>
            <SelectContent>
              {visitDetails.map((visit) => (
                <SelectItem 
                  key={String(visit.VST_IEN)} 
                  value={String(visit.VST_DATE)} 
                  className="text-xs"
                >
                  {String(visit.VST_DATE)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          {loadingLabOrders ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading visit details...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-destructive">{error}</p>
            </div>
          ) : (
            <Table className="text-xs w-full">
              <TableHeader className="bg-accent sticky top-0 z-10">
                <TableRow>
                  {visitAdtTableHeaders.map(header => (
                    <TableHead key={header} className="py-1 px-3 text-xs h-auto">
                      <div className="flex items-center justify-between">
                        {header}
                        <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitDetails.length > 0 ? visitDetails.map((visit, index) => (
                  <TableRow 
                    key={visit.VST_IEN ? String(visit.VST_IEN) : `visit-row-${index}`} 
                    className={`${index % 2 === 0 ? 'bg-muted/30' : ''}`}
                  >
                    <TableCell className="py-1 px-3">{String(visit.VST_DATE)}</TableCell>
                    <TableCell className="py-1 px-3">{String(visit.VST_TYP)}</TableCell>
                    <TableCell className="py-1 px-3">{String(visit.VST_HOS)}</TableCell>
                    <TableCell className="py-1 px-3">{String(visit.VST_IEN)}</TableCell>
                    <TableCell className="py-1 px-3">{String(visit.VST_DFT)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={visitAdtTableHeaders.length} className="text-center py-10 text-muted-foreground">
                      No visit details found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ProcedureOrderView = () => (
  <Card className="flex-1 flex items-center justify-center">
    <CardContent className="text-center">
      <p className="text-muted-foreground">Procedure Order View</p>
    </CardContent>
  </Card>
);

interface NursingCareViewProps {
  patientSSN: string;
}

const NursingCareView = () => {
  const patient = usePatient();
  const [nursingOrders, setNursingOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showEntries, setShowEntries] = useState<string>('10');
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const fetchNursingCareOrders = async () => {
      if (!patient?.ssn) {
        setError('No patient SSN available');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchNursingOrders(patient.ssn);
        setNursingOrders(data);
      } catch (err) {
        console.error('Error fetching nursing orders:', err);
        setError('Failed to load nursing orders. Please try again later.');
        setNursingOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNursingCareOrders();
  }, [patient.ssn]);

  const filteredOrders = nursingOrders.filter(order => 
    Object.values(order).some(
      (value: any) => 
        value && 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredOrders.length / parseInt(showEntries));
  const startIndex = (currentPage - 1) * parseInt(showEntries);
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + parseInt(showEntries));

  const nursingTableHeaders = [
    'Order',
    'Start/Stop Date',
    'Provider',
    'Status',
    'Sign',
    'Discontinue',
    'Actions',
    'Location'
  ];

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return <Badge variant="default">Active</Badge>;
      case 'COMPLETED':
        return <Badge variant="secondary">Completed</Badge>;
      case 'DISCONTINUED':
        return <Badge variant="destructive">Discontinued</Badge>;
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRetry = () => {
    if (patient?.ssn) {
      fetchNursingOrders(patient.ssn)
        .then(setNursingOrders)
        .catch(console.error);
    }
  };

  if (loading) {
    return (
      <Card className="flex-1 flex items-center justify-center">
        <CardContent className="text-center">
          <p className="text-muted-foreground">Loading nursing orders...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex-1 flex items-center justify-center">
        <CardContent className="text-center">
          <p className="text-destructive">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={handleRetry}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex-1 flex flex-col shadow overflow-hidden">
      <CardHeader className="p-2.5 border-b bg-card text-foreground rounded-t-md">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Nursing Orders</CardTitle>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50">
              <Settings className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-primary hover:bg-muted/50"
              onClick={handleRetry}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-2.5 flex-1 flex flex-col overflow-hidden">
        <div className="space-y-2 mb-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="showEntries" className="whitespace-nowrap">Show</Label>
              <Select value={showEntries} onValueChange={setShowEntries}>
                <SelectTrigger id="showEntries" className="h-7 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <Label htmlFor="showEntries" className="whitespace-nowrap">entries</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="search" className="whitespace-nowrap">Search:</Label>
              <Input 
                id="search" 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-7 w-40 text-xs"
                placeholder="Search orders..."
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                {nursingTableHeaders.map((header) => (
                  <TableHead key={header} className="py-1 px-2 text-xs font-medium">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="py-1 px-2 text-xs">
                      <div className="font-medium">{order.order}</div>
                      {order.instructions && (
                        <div className="text-muted-foreground text-xs">{order.instructions}</div>
                      )}
                    </TableCell>
                    <TableCell className="py-1 px-2 text-xs">
                      <div>{order.startDate}</div>
                      <div className="text-muted-foreground">{order.startTime}</div>
                    </TableCell>
                    <TableCell className="py-1 px-2 text-xs">
                      {order.orderedBy}
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <XIcon className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="py-1 px-2 text-xs">
                      {order.location}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={nursingTableHeaders.length} className="text-center py-4 text-muted-foreground">
                    {searchTerm ? 'No matching orders found' : 'No nursing orders found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs">
          <div className="text-muted-foreground">
            Showing {filteredOrders.length === 0 ? 0 : startIndex + 1} to{' '}
            {Math.min(startIndex + parseInt(showEntries), filteredOrders.length)} of {filteredOrders.length} entries
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center justify-center text-sm font-medium w-8">
              {currentPage}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ProcedureOrdersViewProps {
  patientSSN: string;
}

const ProcedureOrdersView = () => {
  const patient = usePatient();
  // Ensure patientSSN is always a string, even if null or undefined
  const effectivePatientSSN = patient?.ssn || '';
  const [procedureOrders, setProcedureOrders] = useState<ProcedureOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showEntries, setShowEntries] = useState<string>('10');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [orderFromDate, setOrderFromDate] = useState<string>('');
  const [orderToDate, setOrderToDate] = useState<string>('');

  const fetchProcedureOrdersData = useCallback(async () => {
    if (!patient?.ssn) {
      setError('No patient SSN available');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchProcedureOrders(patient.ssn);
      setProcedureOrders(data);
    } catch (err) {
      console.error('Error fetching procedure orders:', err);
      setError('Failed to load procedure orders. Please try again later.');
      setProcedureOrders([]);
    } finally {
      setLoading(false);
    }
  }, [patient.ssn]);

  useEffect(() => {
    fetchProcedureOrdersData();
  }, [fetchProcedureOrdersData]);

  const handleRefresh = () => {
    fetchProcedureOrdersData();
  };

  const handleRetry = () => {
    fetchProcedureOrdersData();
  };

  const filteredOrders = useMemo(() => {
    return procedureOrders.filter(order => {
      const matchesSearch = Object.values(order).some(
        value => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const orderDate = new Date(order.startDate);
      const fromDate = orderFromDate ? new Date(orderFromDate) : null;
      const toDate = orderToDate ? new Date(orderToDate) : null;
      
      const matchesDate = (!fromDate || orderDate >= fromDate) && 
                         (!toDate || orderDate <= toDate);
      
      return matchesSearch && matchesDate;
    });
  }, [procedureOrders, searchTerm, orderFromDate, orderToDate]);

  const totalPages = Math.ceil(filteredOrders.length / parseInt(showEntries));
  const startIndex = (currentPage - 1) * parseInt(showEntries);
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + parseInt(showEntries));

  const procedureTableHeaders = [
    'Order',
    'Procedure Date/Time',
    'Provider',
    'Status',
    'Sign',
    'Discontinue',
    'Actions',
    'Location'
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | null | undefined; label: string }> = {
      'COMPLETE': { variant: 'default', label: 'Complete' },
      'PENDING': { variant: 'secondary', label: 'Pending' },
      'IN PROGRESS': { variant: 'default', label: 'In Progress' },
      'DISCONTINUED': { variant: 'destructive', label: 'Discontinued' },
      'EXPIRED': { variant: 'outline', label: 'Expired' },
    };

    const statusInfo = statusMap[status.toUpperCase()] || { variant: 'secondary' as const, label: status };
    
    return (
      <Badge variant={statusInfo.variant} className="text-xs">
        {statusInfo.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="mt-2 text-sm text-muted-foreground">Loading procedure orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-destructive">Error loading procedure orders</h3>
            <div className="mt-2 text-sm text-destructive">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="border-destructive text-destructive hover:bg-destructive/10"
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium">Procedure Orders</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefresh}>
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search orders..."
              className="w-full pl-8 sm:w-[200px] lg:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Filter className="mr-2 h-3.5 w-3.5" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="order-date-from" className="mb-2 block text-sm font-medium">
                      Order Date Range
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          id="order-date-from"
                          type="date"
                          value={orderFromDate}
                          onChange={(e) => setOrderFromDate(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          id="order-date-to"
                          type="date"
                          value={orderToDate}
                          onChange={(e) => setOrderToDate(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="show-entries" className="whitespace-nowrap text-sm font-normal">
                Show
              </Label>
              <Select value={showEntries} onValueChange={setShowEntries}>
                <SelectTrigger id="show-entries" className="h-9 w-[70px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="whitespace-nowrap text-sm">entries</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {procedureTableHeaders.map((header) => (
                <TableHead key={header} className="py-1 px-2 text-xs font-medium">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 px-2 text-xs">
                    <div className="font-medium">{order.order}</div>
                    {order.instructions && (
                      <div className="text-muted-foreground text-xs">{order.instructions}</div>
                    )}
                  </TableCell>
                  <TableCell className="py-1 px-2 text-xs">
                    <div>{order.procedureDate || order.startDate}</div>
                    <div className="text-muted-foreground">{order.procedureTime || order.startTime}</div>
                  </TableCell>
                  <TableCell className="py-1 px-2 text-xs">
                    {order.provider}
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    {getStatusBadge(order.status)}
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <XIcon className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="py-1 px-2 text-xs">
                    {order.location}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={procedureTableHeaders.length} className="text-center py-4 text-muted-foreground">
                  {searchTerm || orderFromDate || orderToDate 
                    ? 'No matching orders found' 
                    : 'No procedure orders found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(startIndex + parseInt(showEntries), filteredOrders.length)} of{' '}
          {filteredOrders.length} entries
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <div className="flex items-center justify-center text-sm font-medium w-8">
            {currentPage}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Add interface for API response type
interface ApiPatientResponse {
  SSN: string;
  DFN: number;
  Name: string;
  Gender: string;
  Age: number | string;
  DOB: string;
  Ward: string;
  Bed: string;
  "Admission Date": string;
  LOS: string;
  "Mobile No": number;
  "Primary Consultant": string;
  "Secondary Consultant": string;
  Specialty: string;
  "Treating Consultant": string;
  posting: string;
  ssn: string;
  "IP No": number;
}

// Main Orders Page
const OrdersPage = () => {
  const patient = usePatient();
  const [activeSubNav, setActiveSubNav] = useState<string>(orderSubNavItems[0]);
  const [loadingLabOrders, setLoadingLabOrders] = useState(!patient);

  useEffect(() => {
    const fetchDefaultPatient = async () => {
      if (!patient) {
        try {
          setLoadingLabOrders(true);
          console.log('Fetching default patient data with default SSN...');
          // Fetch default patient using the default SSN
          const defaultSSN = "800000035";
          const data = await apiService.getPatients({ searchSSN: defaultSSN });
          console.log('Default Patient API response:', JSON.stringify(data, null, 2));

          if (data && Array.isArray(data) && data.length > 0) {
            // Map API data to Patient type from constants.ts
            const defaultPatientData = data[0]; // Get the first patient from the results
            console.log('Raw patient data for mapping:', defaultPatientData);
            
            const defaultPatient: Patient = {
              id: String(defaultPatientData.DFN || ''),
              name: defaultPatientData.Name || '',
              avatarUrl: '',
              gender: defaultPatientData.Gender || '',
              age: typeof defaultPatientData.Age === 'number' ? defaultPatientData.Age : parseInt(String(defaultPatientData.Age)) || 0,
              dob: defaultPatientData.DOB || '',
              wardNo: defaultPatientData.Ward || '',
              bedDetails: defaultPatientData.Bed || '',
              admissionDate: defaultPatientData["Admission Date"] || '',
              lengthOfStay: defaultPatientData.LOS || '',
              mobile: String(defaultPatientData["Mobile No"] || ''),
              primaryConsultant: defaultPatientData["Primary Consultant"] || '',
              "Secondary Consultant": defaultPatientData["Secondary Consultant"] || '',
              specialty: defaultPatientData.Specialty || '',
              encounterProvider: defaultPatientData["Treating Consultant"] || '',
              finalDiagnosis: '',
              posting: defaultPatientData.posting || '',
              reasonForVisit: '',
              ssn: String(
                defaultPatientData.SSN || 
                defaultPatientData.ssn || 
                defaultPatientData['SSN No'] || 
                defaultSSN
              ),
              "IP No": defaultPatientData["IP No"] || 0,
              "Admission Date": defaultPatientData["Admission Date"] || '',
              "Mobile No": Number(defaultPatientData["Mobile No"] || 0),
              "Primary Consultant": defaultPatientData["Primary Consultant"] || '',
              "Secondary Consultant": defaultPatientData["Secondary Consultant"] || '',
              "Treating Consultant": defaultPatientData["Treating Consultant"] || '',
              LOS: defaultPatientData.LOS || '',
              Specialty: defaultPatientData.Specialty || '',
              Ward: defaultPatientData.Ward || '',
              Bed: defaultPatientData.Bed || '',
              Age: defaultPatientData.Age || 0,
              DFN: Number(defaultPatientData.DFN || 0),
              DOB: defaultPatientData.DOB || '',
              Gender: defaultPatientData.Gender || '',
              Name: defaultPatientData.Name || '',
              SSN: String(defaultPatientData.SSN || defaultPatientData.ssn || defaultSSN)
            };
            
            console.log('Mapped patient data with SSN:', defaultPatient.ssn);
            setPatient(defaultPatient);
          } else {
            console.log('No patient data found for default SSN');
            setPatient(null);
          }
        } catch (error) {
          console.error('Error fetching default patient:', error);
          setPatient(null);
        } finally {
          setLoadingLabOrders(false);
        }
      }
    };

    fetchDefaultPatient();
  }, [patient, setPatient]);

  if (loadingLabOrders) {
    return (
      <div className="flex flex-col h-[calc(100vh-var(--top-nav-height,40px))] bg-white text-sm p-3">
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col h-[calc(100vh-var(--top-nav-height,40px))] bg-white text-sm p-3">
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Unable to load patient data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-var(--top-nav-height,40px))] bg-white text-sm">
      {/* Horizontal Sub-Navigation Bar */}
      <div className="flex items-end space-x-1 px-4 pt-0 pb-0 overflow-x-auto no-scrollbar border-b border-border">
        {orderSubNavItems.map((item) => (
          <Button
            key={item}
            onClick={() => setActiveSubNav(item)}
            className={`text-xs px-4 py-2 h-auto rounded-none whitespace-nowrap focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors
              ${activeSubNav === item
                ? 'bg-background text-primary border-x border-t border-border border-b-2 border-b-background shadow-sm relative -mb-px z-10 hover:bg-background/80'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border-x border-t border-transparent'
              }`}
          >
            {item}
          </Button>
        ))}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="w-full h-full">
          {activeSubNav === "CPOE Order List" && <CpoeOrderListView patient={patient} />}
          {activeSubNav === "Write Delay Order" && <DelayOrdersView />}
          {activeSubNav === "IP Medication" && <IpMedicationView patient={patient} />}
          {activeSubNav === "Laboratory" && <LabCpoeListViewUpdated patient={patient} />}
          {activeSubNav === "Radiology" && <RadiologyView patient={patient} />}
          {activeSubNav === "Visit/ADT" && <VisitAdtView patient={patient} />}
          {activeSubNav === "Procedure Orders" && <ProcedureOrdersView patientSSN={patient.ssn} />}
          {activeSubNav === "Nursing Care" && <NursingCareView />}
        </div>
      </main>
    </div>
  );
};

export default OrdersPage;