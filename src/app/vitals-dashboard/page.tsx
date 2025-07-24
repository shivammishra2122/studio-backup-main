'use client';

import type { NextPage } from 'next';
import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

type vitalSign
 = {
  id: string;
  date: string;
  bloodPressure: string | null;
  temperature: string | null;
  pulse: string | null;
  respiration: string | null;
  height: string | null;
  weight: string | null;
  cvp: string | null;
  cg: string | null;
  pulseOximetry: string | null;
  pain: string | null;
  earlyWarningSign: string | null;
  location: string;
  enteredBy: string;
  [key: string]: any; // Allow string indexing
};

interface VitalApiResponse {
  [key: string]: {
    VitalDateTime: string;
    VitalFlag: number;
    VitalName: string;
    VitalType: number;
    VitalValue: string | number;
  };
}

interface VitalData {
  id: string;
  date: string;
  name: string;
  type: number;
  value: string | number;
  flag: number;
}

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Problem } from '@/hooks/usePatientProblems';

// Custom TableRow without hover effect for vitals entry
const VitalsTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b",
      className
    )}
    {...props}
  />
));
VitalsTableRow.displayName = "VitalsTableRow";

import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  Edit3, CalendarDays, RefreshCw, ArrowUpDown, ChevronDown, ChevronUp, 
  Settings, FileEdit, Printer, Download, Filter, Ban,Plus, FileText, PenLine 
} from 'lucide-react';

import { Switch } from "@/components/ui/switch";
import { fetchClinicalNotes, Patient } from '@/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { usePatientProblems } from '@/hooks/usePatientProblems';
import { usePatientDiagnosis } from '@/hooks/usePatientDiagnosis';
import { usePatientAllergies } from '@/hooks/usePatientAllergies';
import { usePatientComplaints } from '@/hooks/usePatientComplaints';
import { fetchIntakeOutputData, fetchIntakeUpdateData, IntakeOutputSummary } from '@/services/intakeOutput';
import { submitVitalEntry } from '@/services/vitalEntry';
import { getPatientSSN } from '@/utils/patientUtils';

const verticalNavItems = [
  "Vitals", "Intake/Output", "Problems", "Final Diagnosis",
  "Chief-Complaints", "Allergies", "OPD/IPD Details"]

const vitalTypes = [
  "B/P (mmHg)", "Temp (F)", "Resp (/min)", "Pulse (/min)",
  "Height (In)", "Weight (kg)", "CVP (cmH2O)", "C/G (In)",
  "Pulse Oximetry (%)", "Pain", "Early Warning Sign", "Location", "Entered By"
];

type VitalChartDataPoint = { name: string; value?: number; systolic?: number; diastolic?: number };

const getYAxisConfig = (vitalName: string): { label: string; domain: [number | string, number | string] } => {
  switch (vitalName) {
    case "B/P (mmHg)": return { label: "mmHg", domain: [40, 200] };
    case "Temp (F)": return { label: "°F", domain: [95, 105] };
    case "Resp (/min)": return { label: "/min", domain: [0, 40] };
    case "Pulse (/min)": return { label: "bpm", domain: [40, 160] };
    case "Height (In)": return { label: "Inches", domain: [48, 84] };
    case "Weight (kg)": return { label: "kg", domain: [30, 150] };
    case "CVP (cmH2O)": return { label: "cmH2O", domain: [0, 15] };
    case "C/G (In)": return { label: "Inches", domain: [15, 45] };
    case "Pulse Oximetry (%)": return { label: "%", domain: [80, 100] };
    case "Pain": return { label: "Scale 0-10", domain: [0, 10] };
    case "Early Warning Sign": return { label: "Score", domain: [0, 10] };
    default: return { label: "Value", domain: ['auto', 'auto'] };
  }
};

const VitalsView = React.FC<{ patient?: Patient }> = ({ patient }) => {
  const [visitDateState, setVisitDateState] = useState<string | undefined>("today");
  const [fromDateValue, setFromDateValue] = useState<string>("");
  const [toDateValueState, setToDateValueState] = useState<string>("");
  const [selectedVitalForGraph, setSelectedVitalForGraph] = useState<string>("Temp (F)");
  const [chartData, setChartData] = useState<VitalChartDataPoint[]>([]);
  const [isEnteredInError, setIsEnteredInError] = useState<boolean>(false);
  const [isVitalsEntryMode, setIsVitalsEntryMode] = useState<boolean>(false);
  const [vitalsEntryData, setVitalsEntryData] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    bloodPressureNotRecordable: false,
    bloodPressureQualifier: undefined as string | undefined,
    heightValue: '',
    heightUnit: 'cm',
    heightQualifier: undefined as string | undefined,
    painValue: undefined as string | undefined,
    pulseValue: '',
    pulseQualifier: undefined as string | undefined,
    respirationValue: '',
    respirationQualifier: undefined as string | undefined,
    temperatureValue: '',
    temperatureUnit: 'F',
    temperatureSite: undefined as string | undefined,
    temperatureQualifier: undefined as string | undefined,
    weightValue: '',
    weightUnit: 'kg',
    weightQualifier: undefined as string | undefined,
    cvpValue: '',
    cvpUnit: 'mmHg',
    cgValue: '',
    cgUnit: 'cm',
    cgQualifier: undefined as string | undefined,
    pulseOximetryValue: '',
    pulseOximetryQualifier: undefined as string | undefined,
  });
  const [vitalsData, setVitalsData] = useState<VitalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEntries, setShowEntries] = useState<string>("10");
  const [dateRange, setDateRange] = useState<[number, number]>([0, 7]);

  const yAxisConfig = getYAxisConfig(selectedVitalForGraph);

  const handleVitalsEntryChange = (field: keyof typeof vitalsEntryData, value: string | boolean | undefined) => {
    setVitalsEntryData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Use getPatientSSN to handle SSN extraction consistently
      const patientSSN = patient ? getPatientSSN(patient) : '';
      
      if (!patientSSN) {
        console.error('Patient SSN is required');
        alert('Patient SSN is missing. Please ensure patient data is loaded correctly.');
        return;
      }
      
      // Format the vitals data for the API
      const formattedData = {
        PatientSSN: patientSSN, // Now using the normalized SSN
        IPNo: patient?.ipNo || "",
        EntredID: "",
        EntredDateTime: new Date().toLocaleDateString('en-US'),
        EditDateTime: "",
        Status: "ACTIVE",
        UserName: "CPRS-UAT",
        Password: "UAT@123",
        Temperature: vitalsEntryData.temperatureValue ? `${vitalsEntryData.temperatureValue}°${vitalsEntryData.temperatureUnit}` : "",
        Pulse: vitalsEntryData.pulseValue || "",
        Respiration: vitalsEntryData.respirationValue || "",
        BloodPressure: vitalsEntryData.bloodPressureSystolic && vitalsEntryData.bloodPressureDiastolic 
          ? `${vitalsEntryData.bloodPressureSystolic}/${vitalsEntryData.bloodPressureDiastolic}` 
          : "",
        Weight: vitalsEntryData.weightValue ? `${vitalsEntryData.weightValue}${vitalsEntryData.weightUnit}` : "",
        OxygenSaturation: vitalsEntryData.pulseOximetryValue || "",
        Pain: vitalsEntryData.painValue || "1",
        ReasonEntredError: isEnteredInError ? "1" : "2",
        EntredUserID: "20407", // This should come from the auth context
        Height: vitalsEntryData.heightValue ? `${vitalsEntryData.heightValue}${vitalsEntryData.heightUnit}` : "",
        CVP: vitalsEntryData.cvpValue || "",
        CG: vitalsEntryData.cgValue || "",
      };

      const response = await submitVitalEntry(formattedData);
      
      if (response.succeeded) {
        // Show success message
        alert('Vitals submitted successfully!');
        // Reset form
        setVitalsEntryData({
          bloodPressureSystolic: '',
          bloodPressureDiastolic: '',
          bloodPressureNotRecordable: false,
          bloodPressureQualifier: undefined,
          heightValue: '',
          heightUnit: 'cm',
          heightQualifier: undefined,
          painValue: undefined,
          pulseValue: '',
          pulseQualifier: undefined,
          respirationValue: '',
          respirationQualifier: undefined,
          temperatureValue: '',
          temperatureUnit: 'F',
          temperatureSite: undefined,
          temperatureQualifier: undefined,
          weightValue: '',
          weightUnit: 'kg',
          weightQualifier: undefined,
          cvpValue: '',
          cvpUnit: 'mmHg',
          cgValue: '',
          cgUnit: 'cm',
          cgQualifier: undefined,
          pulseOximetryValue: '',
          pulseOximetryQualifier: undefined,
        });
        setIsEnteredInError(false);
        setIsVitalsEntryMode(false);
        // Refresh vitals data
        fetchVitalsData();
      } else {
        throw new Error('Failed to submit vitals');
      }
    } catch (error) {
      console.error('Error submitting vitals:', error);
      alert('Failed to submit vitals. Please try again.');
    }
  };

  const fetchVitalsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://192.168.1.53/cgi-bin/apiVitalView.sh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          UserName: 'CPRS-UAT',
          Password: 'UAT@123',
          PatientSSN: patient?.ssn || 800000035,
          DUZ: '80'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: VitalApiResponse = await response.json();
      console.log('API Response:', data);
      
      // Transform API response to our VitalData array
      const transformedData: VitalData[] = Object.entries(data).map(([key, value]) => ({
        id: key,
        date: value.VitalDateTime || new Date().toISOString(),
        name: value.VitalName,
        type: value.VitalType,
        value: value.VitalValue,
        flag: value.VitalFlag
      }));

      console.log('Transformed Vitals Data:', transformedData);
      setVitalsData(transformedData);
      
      // Set default selected vital if not already set or if we have data now
      if (transformedData.length > 0) {
        const tempVital = transformedData.find(v => v.name === 'Temp');
        if (tempVital) {
          setSelectedVitalForGraph('Temp');
        } else if (!selectedVitalForGraph) {
          setSelectedVitalForGraph(transformedData[0].name);
        }
      }
    } catch (err) {
      console.error('Error fetching vitals:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vitals');
    } finally {
      setLoading(false);
    }
  }, [selectedVitalForGraph, patient]);

  const handleVitalRowClick = (vitalName: string) => {
    console.log('Vital selected:', vitalName);
    setSelectedVitalForGraph(vitalName);
    
    if (vitalsData.length === 0) {
      setChartData([]);
      return;
    }
    
    // Filter and map data for the selected vital
    const selectedVitalData = vitalsData
      .filter(vital => vital.name === vitalName && vital.value !== undefined)
      .map((vital, index) => {
        let numericValue: number | null = null;
        
        // Extract numeric value from the VitalValue string
        if (typeof vital.value === 'string') {
          const match = String(vital.value).match(/(\d+\.?\d*)/);
          if (match) {
            numericValue = parseFloat(match[0]);
          }
        } else if (typeof vital.value === 'number') {
          numericValue = vital.value;
        }
        
        return {
          name: `Record ${index + 1}`,
          value: numericValue !== null && !isNaN(numericValue) ? numericValue : 0,
          date: vital.date,
          rawValue: vital.value
        };
      });
    
    console.log('Chart data for', vitalName, ':', selectedVitalData);
    setChartData(selectedVitalData);
  };

  useEffect(() => {
    fetchVitalsData();
  }, [fetchVitalsData]);

  useEffect(() => {
    if (vitalsData.length > 0 && selectedVitalForGraph) {
      const selectedVitalData = vitalsData
        .filter(vital => vital.name === selectedVitalForGraph && vital.value !== undefined)
        .map((vital, index) => {
          let numericValue: number | null = null;
          
          if (typeof vital.value === 'string') {
            const match = String(vital.value).match(/(\d+\.?\d*)/);
            if (match) {
              numericValue = parseFloat(match[0]);
            }
          } else if (typeof vital.value === 'number') {
            numericValue = vital.value;
          }
          
          return {
            name: `Record ${index + 1}`,
            value: numericValue !== null && !isNaN(numericValue) ? numericValue : 0,
            date: vital.date,
            rawValue: vital.value
          };
        });
      
      console.log('Initial chart data for', selectedVitalForGraph, ':', selectedVitalData);
      setChartData(selectedVitalData);
    }
  }, [vitalsData, selectedVitalForGraph]);

  const formatDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).toUpperCase();
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 w-full h-full">
      <div className="w-full md:w-[65%] flex flex-col border rounded-md bg-card shadow">
        <div className="flex items-center justify-between py-1.5 px-3 border-b bg-card text-foreground rounded-t-md">
          <h2 className="text-sm">{isVitalsEntryMode ? "Vitals Entry" : "Vitals"}</h2>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-muted/50" onClick={() => setIsVitalsEntryMode(!isVitalsEntryMode)}>
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {isVitalsEntryMode ? (
          <>
            <ScrollArea className="flex-1 min-h-0 flex flex-col">
              <Table className="text-xs">
                <TableHeader className="sticky top-0 z-0">
                  <VitalsTableRow className="bg-accent/50 hover:bg-accent transition-colors">
                    <TableHead className="py-2 px-3 text-xs h-8 whitespace-nowrap text-foreground font-medium">Vitals</TableHead>
                    <TableHead className="py-2 px-3 text-xs h-8 whitespace-nowrap text-foreground font-medium">Not Recordable</TableHead>
                    <TableHead className="py-2 px-3 text-xs h-8 whitespace-nowrap text-foreground font-medium">Value</TableHead>
                    <TableHead className="py-2 px-3 text-xs h-8 whitespace-nowrap text-foreground font-medium">Unit</TableHead>
                    <TableHead className="py-2 px-3 text-xs h-8 whitespace-nowrap text-foreground font-medium">Qualifiers</TableHead>
                  </VitalsTableRow>
                </TableHeader>
                <TableBody>
                  <VitalsTableRow className="bg-muted/30">
                    <TableCell className="py-1.5 px-3">B/P</TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Checkbox id="bpNotRecordable" checked={vitalsEntryData.bloodPressureNotRecordable} onCheckedChange={(checked) => handleVitalsEntryChange('bloodPressureNotRecordable', Boolean(checked))} className="h-3.5 w-3.5" />
                    </TableCell>
                    <TableCell className="py-1.5 px-3">
                      <div className="flex items-center gap-1">
                        <Input type="text" placeholder="SYS" className="h-7 text-xs w-12" value={vitalsEntryData.bloodPressureSystolic} onChange={e => handleVitalsEntryChange('bloodPressureSystolic', e.target.value)} />
                        <span className="mx-0.5">/</span>
                        <Input type="text" placeholder="DIA" className="h-7 text-xs w-12" value={vitalsEntryData.bloodPressureDiastolic} onChange={e => handleVitalsEntryChange('bloodPressureDiastolic', e.target.value)} />
                      </div>
                    </TableCell>
                    <TableCell className="py-1.5 px-3">mmHg</TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Select value={vitalsEntryData.bloodPressureQualifier} onValueChange={val => handleVitalsEntryChange('bloodPressureQualifier', val)}>
                        <SelectTrigger className="h-7 text-xs w-28"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sitting" className="text-xs">Sitting</SelectItem>
                          <SelectItem value="standing" className="text-xs">Standing</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </VitalsTableRow>
                  <VitalsTableRow className="hover:bg-transparent">
                    <TableCell className="py-1.5 px-3">Temp</TableCell>
                    <TableCell className="py-1.5 px-3"></TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Input type="text" className="h-7 text-xs w-20" value={vitalsEntryData.temperatureValue} onChange={e => handleVitalsEntryChange('temperatureValue', e.target.value)} />
                    </TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Select value={vitalsEntryData.temperatureUnit} onValueChange={val => handleVitalsEntryChange('temperatureUnit', val)}>
                        <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="F" className="text-xs">F</SelectItem>
                          <SelectItem value="C" className="text-xs">C</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Select value={vitalsEntryData.temperatureQualifier} onValueChange={val => handleVitalsEntryChange('temperatureQualifier', val)}>
                        <SelectTrigger className="h-7 text-xs w-28"><SelectValue placeholder="Site" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oral" className="text-xs">Oral</SelectItem>
                          <SelectItem value="axillary" className="text-xs">Axillary</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </VitalsTableRow>
                  <VitalsTableRow className="bg-muted/30">
                    <TableCell className="py-1.5 px-3">Pain</TableCell>
                    <TableCell className="py-1.5 px-3"></TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Select value={vitalsEntryData.painValue} onValueChange={val => handleVitalsEntryChange('painValue', val)}>
                        <SelectTrigger className="h-7 text-xs w-24"><SelectValue placeholder="Scale 0-10" /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 11 }, (_, i) => <SelectItem key={i} value={i.toString()} className="text-xs">{i}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-1.5 px-3"></TableCell>
                    <TableCell className="py-1.5 px-3"></TableCell>
                  </VitalsTableRow>
                  <TableRow>
                    <TableCell className="py-1.5 px-3">Pulse</TableCell>
                    <TableCell className="py-1.5 px-3"></TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Input type="text" className="h-7 text-xs w-20" value={vitalsEntryData.pulseValue} onChange={e => handleVitalsEntryChange('pulseValue', e.target.value)} />
                    </TableCell>
                    <TableCell className="py-1.5 px-3">/min</TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Select value={vitalsEntryData.pulseQualifier} onValueChange={val => handleVitalsEntryChange('pulseQualifier', val)}>
                        <SelectTrigger className="h-7 text-xs w-28"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular" className="text-xs">Regular</SelectItem>
                          <SelectItem value="irregular" className="text-xs">Irregular</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="py-1.5 px-3">Height</TableCell>
                    <TableCell className="py-1.5 px-3"></TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Input type="text" className="h-7 text-xs w-20" value={vitalsEntryData.heightValue} onChange={e => handleVitalsEntryChange('heightValue', e.target.value)} />
                    </TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Select value={vitalsEntryData.heightUnit} onValueChange={val => handleVitalsEntryChange('heightUnit', val)}>
                        <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cm" className="text-xs">cm</SelectItem>
                          <SelectItem value="in" className="text-xs">in</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Select value={vitalsEntryData.heightQualifier} onValueChange={val => handleVitalsEntryChange('heightQualifier', val)}>
                        <SelectTrigger className="h-7 text-xs w-28"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standing" className="text-xs">Standing</SelectItem>
                          <SelectItem value="lying" className="text-xs">Lying</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-1.5 px-3">Weight</TableCell>
                    <TableCell className="py-1.5 px-3"></TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Input type="text" className="h-7 text-xs w-20" value={vitalsEntryData.weightValue} onChange={e => handleVitalsEntryChange('weightValue', e.target.value)} />
                    </TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Select value={vitalsEntryData.weightUnit} onValueChange={val => handleVitalsEntryChange('weightUnit', val)}>
                        <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg" className="text-xs">kg</SelectItem>
                          <SelectItem value="lbs" className="text-xs">lbs</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Select value={vitalsEntryData.weightQualifier} onValueChange={val => handleVitalsEntryChange('weightQualifier', val)}>
                        <SelectTrigger className="h-7 text-xs w-28"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="actual" className="text-xs">Actual</SelectItem>
                          <SelectItem value="estimated" className="text-xs">Estimated</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="py-1.5 px-3">CVP</TableCell>
                    <TableCell className="py-1.5 px-3"></TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Input type="text" className="h-7 text-xs w-20" value={vitalsEntryData.cvpValue} onChange={e => handleVitalsEntryChange('cvpValue', e.target.value)} />
                    </TableCell>
                    <TableCell className="py-1.5 px-3">cmH2O</TableCell>
                    <TableCell className="py-1.5 px-3"></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-1.5 px-3">C/G</TableCell>
                    <TableCell className="py-1.5 px-3"></TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Input type="text" className="h-7 text-xs w-20" value={vitalsEntryData.cgValue} onChange={e => handleVitalsEntryChange('cgValue', e.target.value)} />
                    </TableCell>
                    <TableCell className="py-1.5 px-3">cm</TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Select value={vitalsEntryData.cgQualifier} onValueChange={val => handleVitalsEntryChange('cgQualifier', val)}>
                        <SelectTrigger className="h-7 text-xs w-28"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="head" className="text-xs">Head</SelectItem>
                          <SelectItem value="chest" className="text-xs">Chest</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="py-1.5 px-3">Pulse Oximetry</TableCell>
                    <TableCell className="py-1.5 px-3"></TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Input type="text" className="h-7 text-xs w-20" value={vitalsEntryData.pulseOximetryValue} onChange={e => handleVitalsEntryChange('pulseOximetryValue', e.target.value)} />
                    </TableCell>
                    <TableCell className="py-1.5 px-3">%</TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Select value={vitalsEntryData.pulseOximetryQualifier} onValueChange={val => handleVitalsEntryChange('pulseOximetryQualifier', val)}>
                        <SelectTrigger className="h-7 text-xs w-28"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="room-air" className="text-xs">Room Air</SelectItem>
                          <SelectItem value="oxygen" className="text-xs">Oxygen</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-1.5 px-3">Respiration</TableCell>
                    <TableCell className="py-1.5 px-3"></TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Input type="text" className="h-7 text-xs w-20" value={vitalsEntryData.respirationValue} onChange={e => handleVitalsEntryChange('respirationValue', e.target.value)} />
                    </TableCell>
                    <TableCell className="py-1.5 px-3">/min</TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Select value={vitalsEntryData.respirationQualifier} onValueChange={val => handleVitalsEntryChange('respirationQualifier', val)}>
                        <SelectTrigger className="h-7 text-xs w-28"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular" className="text-xs">Regular</SelectItem>
                          <SelectItem value="irregular" className="text-xs">Irregular</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="py-1.5 px-3">Entered in Error</TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Switch checked={isEnteredInError} onCheckedChange={setIsEnteredInError} />
                    </TableCell>
                    <TableCell className="py-1.5 px-3" colSpan={3}>Mark this vital as entered in error.</TableCell>
                  </TableRow>

                </TableBody>
              </Table>
            </ScrollArea>
            <div className="p-3 border-t flex justify-end space-x-2">
              <Button 
                variant="secondary" 
                className="text-xs"
                type="button"
                onClick={() => setIsVitalsEntryMode(false)}
              >
                Cancel
              </Button>
              <Button 
                className="text-xs" 
                type="button"
                onClick={handleSubmitVitals}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Vitals'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 flex flex-col overflow-auto p-3 no-scrollbar">
              <div className="mb-2 text-xs">
                <div className="flex flex-nowrap items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-3">
                    <Select value={visitDateState} onValueChange={(value) => {
                      setVisitDateState(value);
                      // Set default date ranges based on selection
                      if (value === 'today') setDateRange([0, 0]);
                      if (value === 'yesterday') setDateRange([1, 1]);
                      if (value === 'week') setDateRange([0, 7]);
                      if (value === 'month') setDateRange([0, 30]);
                    }}>
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue placeholder="Last 7 days" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today" className="text-xs">Today</SelectItem>
                        <SelectItem value="yesterday" className="text-xs">Yesterday</SelectItem>
                        <SelectItem value="week" className="text-xs">This Week</SelectItem>
                        <SelectItem value="month" className="text-xs">This Month</SelectItem>
                        <SelectItem value="custom" className="text-xs">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="showEntries" className="text-xs whitespace-nowrap">Show</Label>
                    <Select value={showEntries} onValueChange={setShowEntries}>
                      <SelectTrigger className="h-7 w-16 text-xs">
                        <SelectValue placeholder="10" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10" className="text-xs">10</SelectItem>
                        <SelectItem value="25" className="text-xs">25</SelectItem>
                        <SelectItem value="50" className="text-xs">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <Label htmlFor="showEntries" className="text-xs whitespace-nowrap">entries</Label>
                  </div>
                </div>
              </div>

              {/* Vitals Table */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <Table className="text-xs w-full">
                  <TableHeader className="bg-accent sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="py-2 px-3 text-xs h-8 whitespace-nowrap text-foreground font-medium bg-accent/50 hover:bg-accent transition-colors">Vital Type</TableHead>
                      <TableHead className="py-2 px-3 text-xs h-8 whitespace-nowrap text-foreground font-medium bg-accent/50 hover:bg-accent transition-colors">Date</TableHead>
                      <TableHead className="py-2 px-3 text-xs h-8 whitespace-nowrap text-foreground font-medium bg-accent/50 hover:bg-accent transition-colors">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4">
                          <p className="text-muted-foreground">Loading vitals...</p>
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4">
                          <p className="text-destructive">{error}</p>
                        </TableCell>
                      </TableRow>
                    ) : vitalsData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4">
                          <p className="text-muted-foreground">No vitals data available</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      // Group vitals by name to show only the latest entry for each vital type
                      Object.entries(
                        vitalsData.reduce((acc, vital) => {
                          if (!acc[vital.name] || new Date(acc[vital.name].date) < new Date(vital.date)) {
                            acc[vital.name] = vital;
                          }
                          return acc;
                        }, {} as Record<string, VitalData>)
                      ).map(([name, vital], index) => {
                        const isSelected = selectedVitalForGraph === name;
                        
                        return (
                          <TableRow 
                            key={`${name}-${index}`}
                            className={`${index % 2 === 0 ? 'bg-muted/30' : ''} ${
                              isSelected ? 'ring-2 ring-primary' : 'cursor-pointer hover:bg-accent/50'
                            }`}
                            onClick={() => handleVitalRowClick(name)}
                          >
                            <TableCell className="py-2 px-3">{name}</TableCell>
                            <TableCell className="py-2 px-3 text-right text-xs">
                              {vital.date ? 
                              (vital.date) : '-'}
                            </TableCell>
                            <TableCell className="py-2 px-3 text-right">
                              {vital.flag === 1 && <span className="text-red-500 mr-1">*</span>}
                              {String(vital.value)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end space-x-2 mt-auto p-2 border-t">
                <Button size="sm" className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground h-8" onClick={() => setIsVitalsEntryMode(true)}>Vitals Entry</Button>
                <Button size="sm" className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground h-8">Multiple Vitals Graph</Button>
                <Button size="sm" className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground h-8">ICU Flow Sheet</Button>
              </div>
              </div>
            </>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col border rounded-md bg-card shadow">
          <div className="flex items-center p-2 border-b bg-card text-foreground rounded-t-md">
            <h2 className="text-base">{selectedVitalForGraph} Graph</h2>
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Loading chart data...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-destructive">Error loading chart: {error}</p>
            </div>
          ) : chartData.length > 0 ? (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: getYAxisConfig(selectedVitalForGraph).label, angle: -90, position: 'insideLeft' }}
                    domain={getYAxisConfig(selectedVitalForGraph).domain}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: any) => [value, selectedVitalForGraph]}
                    labelFormatter={(name) => `Record: ${name}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name={selectedVitalForGraph}
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">No data available for the selected vital</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Lazy load sub-navigation views except VitalsView (default)
const IntakeOutputView = dynamic(() => import('./IntakeOutputView'), { loading: () => <Skeleton className="w-full h-32" /> });
const ProblemsView = dynamic(() => import('./ProblemsView'), { loading: () => <Skeleton className="w-full h-32" /> });
const FinalDiagnosisView = dynamic(() => import('./FinalDiagnosisView'), { loading: () => <Skeleton className="w-full h-32" /> });
const ChiefComplaintsView = dynamic(() => import('./ChiefComplaintsView'), { loading: () => <Skeleton className="w-full h-32" /> });
const AllergiesView = dynamic(() => import('./AllergiesView'), { loading: () => <Skeleton className="w-full h-32" /> });
const OpdIpdDetailsView = dynamic(() => import('./OpdIpdDetailsView'), { loading: () => <Skeleton className="w-full h-32" /> });

const VitalsDashboardPage: NextPage<{ patient?: Patient }> = ({ patient }) => {
  const [activeVerticalTab, setActiveVerticalTab] = useState<string>(verticalNavItems[0]);

  // Add a default patient object if not provided
  const currentPatient = patient || { ssn: '' };

  return (
    <div className="flex flex-col h-[calc(100vh-var(--top-nav-height,60px))] bg-background text-sm px-3 pb-3 pt-0">
      <div className="flex items-end space-x-1 px-1 pb-0 pt-1 overflow-x-auto no-scrollbar">
        {verticalNavItems.map((item) => (
          <Button
            key={item}
            onClick={() => setActiveVerticalTab(item)}
            className={`text-xs px-3 py-1.5 h-auto rounded-b-none rounded-t-md whitespace-nowrap focus-visible:ring-0 focus-visible:ring-offset-0
              ${activeVerticalTab === item
                ? 'bg-background text-primary border-x border-t border-border border-b-2 border-b-background shadow-sm relative -mb-px z-10 hover:bg-background hover:text-primary'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground border-x border-t border-transparent hover:text-foreground'
              }`}
          >
            {item}
          </Button>
        ))}
      </div>
      <main className="flex-1 flex flex-col gap-3 overflow-hidden">
        {activeVerticalTab === "Vitals" && <VitalsView patient={currentPatient} />}
        {activeVerticalTab === "Intake/Output" && <IntakeOutputView patient={currentPatient} />}
        {activeVerticalTab === "Problems" && <ProblemsView patient={currentPatient} />}
        {activeVerticalTab === "Final Diagnosis" && <FinalDiagnosisView patient={currentPatient} />}
        {activeVerticalTab === "Chief-Complaints" && <ChiefComplaintsView patient={currentPatient} />}
        {activeVerticalTab === "Allergies" && <AllergiesView patient={currentPatient} />}
        {activeVerticalTab === "OPD/IPD Details" && <OpdIpdDetailsView patient={currentPatient} />}
        {![
          "Vitals", "Intake/Output", "Problems", "Final Diagnosis",
          "Chief-Complaints", "Allergies", "OPD/IPD Details"
        ].includes(activeVerticalTab) && (
            <Card className="flex-1 flex items-center justify-center">
              <CardContent className="text-center">
                <CardTitle className="text-xl text-muted-foreground">
                  {activeVerticalTab} View
                </CardTitle>
                <p className="text-sm text-muted-foreground">Content for this section is not yet implemented.</p>
              </CardContent>
            </Card>
          )}
      </main>
    </div>
  );
};

export default VitalsDashboardPage;