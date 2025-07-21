'use client';

import { Card, CardContent, CardTitle, CardHeader as ShadcnCardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { CartesianGrid, XAxis, YAxis, Line, LineChart as RechartsLineChart } from 'recharts';
import {
  Droplet, HeartPulse, Activity, Thermometer, Scale, Edit3, Clock, Pill as PillIcon, X, Ban, FileText,
  ScanLine, ClipboardList, BellRing,
} from 'lucide-react';
import { Trash2, Save } from 'lucide-react';
import {
  HealthMetric, Problem, Medication, ProblemCategory, ProblemStatus, ProblemImmediacy, ProblemService,
  MOCK_PROBLEMS, MOCK_MEDICATIONS, pageCardSampleContent, MOCK_KEY_INDICATORS,
  MOCK_HEART_RATE_MONITOR_DATA, MOCK_HEART_RATE_MONITOR_CHART_CONFIG,
  MOCK_GLUCOSE_DATA, MOCK_BLOOD_PRESSURE_DATA, MOCK_BODY_TEMPERATURE_DATA, MOCK_WEIGHT_DATA,
  MOCK_PATIENT, Patient,
} from '@/lib/constants';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import usePatientProblems from '@/hooks/usePatientProblems';
import { usePatientAllergies } from '@/hooks/usePatientAllergies';
import { useClinicalNotes, type ClinicalNote } from '@/hooks/useClinicalNotes';
import { saveProblem as saveProblemService, type ApiProbSavePayload } from '@/services/problem';
import { saveAllergy, type ApiAllergySavePayload } from '@/services/allergy';
import { useMedications } from '@/hooks/useMedications';
import useProblemSave from '@/hooks/useProblemSave';
import useProblemSearch from '@/hooks/useProblemSearch';
import { debounce } from 'lodash';
import { usePatientDiagnosis } from '@/hooks/usePatientDiagnosis';
import { usePatientComplaints } from '@/hooks/usePatientComplaints';

// Chart configurations
const glucoseChartConfig: ChartConfig = { level: { label: 'Glucose (mg/dL)', color: 'hsl(var(--chart-2))' } };
const bloodPressureChartConfig: ChartConfig = {
  systolic: { label: 'Systolic (mmHg)', color: 'hsl(var(--chart-1))' },
  diastolic: { label: 'Diastolic (mmHg)', color: 'hsl(var(--chart-3))' },
};
const bodyTemperatureChartConfig: ChartConfig = { temp: { label: 'Temperature (°F)', color: 'hsl(var(--chart-4))' } };
const weightChartConfig: ChartConfig = { weight: { label: 'Weight (kg)', color: 'hsl(var(--chart-5))' } };

// Icon mappings for informational cards
const infoCardIcons: Record<string, React.ElementType> = {
  Allergies: Ban,
  Radiology: ScanLine,
  'Lab Report': FileText,
  'Clinical notes': FileText,
  'Encounter notes': ClipboardList,
  'Clinical reminder': BellRing,
};

// Card titles for dashboard rows
const secondRowInformationalCardTitles: string[] = ['Allergies', 'Medications History', 'Lab Report', 'Radiology'];
const thirdRowInformationalCardTitles: string[] = ['Clinical notes', 'Encounter notes', 'Clinical reminder'];

// Define Allergy interface
interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  dateOnset: string;
  treatment: string;
  status: 'Active' | 'Inactive';
  notes: string;
  createdBy: string;
  createdAt: string;
}

// Define Dialog types
type DialogType = 'problem' | 'medication' | 'info-item' | 'allergies' | 'radiology' | 'report' | 'lab';

interface FloatingDialog {
  id: string;
  type: DialogType;
  title: string;
  position: { x: number; y: number };
  data?: any;
}

// Medication row interface for table
interface MedicationRow {
  medicationName: string;
  dosage: string;
  route: string;
  schedule: string;
  prn: boolean;
  duration: string;
  durationUnit: string;
  priority: string;
  additionalDoseNow: boolean;
  comment: string;
}

interface LabTest {
  name: string;
  collectSample: string;
  specimen: string;
  urgency: string;
  howOften: string;
  comments: string;
}

interface RadiologyTest {
  id: string;
  name: string;
  requestedDate: string;
  submitTo: string;
  urgency: string;
  modifiers: string;
  transport: string;
  reason: string;
}

export default function DashboardPage({
  patient,
  problems: initialProblems = [],
  medications: initialMedications = [],
  allergies: initialAllergies = [],
  vitals = {},
}: {
  patient: Patient;
  problems?: Problem[];
  medications?: Medication[];
  allergies?: any[];
  vitals?: any;
}): JSX.Element {
  // State for allergy dialog
  const [showAllergyDialog, setShowAllergyDialog] = useState(false);
  const [ssnSearch, setSSNSearch] = useState('');
  const [ssnSearchResults, setSSNSearchResults] = useState<any[]>([]);
  const [isSearchingSSN, setIsSearchingSSN] = useState(false);
  
  // Use the useMedications hook to fetch medications
  const { data: medications = initialMedications, loading: medicationsLoading, error: medicationsError } = useMedications();

  // Use the useProblemSave hook
  const { saveProblem, isLoading: isSavingProblem } = useProblemSave();
  
  // Use the useProblemSearch hook
  const { 
    searchProblems, 
    searchResults, 
    isSearching: isProblemSearching, 
    searchError: problemSearchError, 
    clearSearch: clearProblemSearch 
  } = useProblemSearch();

  // State for active tab in Problems card
  const [activeProblemsTab, setActiveProblemsTab] = useState<'problems' | 'chief-complaints' | 'final-diagnosis'>('problems');

  // State for problem inputs
  const [problemInputs, setProblemInputs] = useState<Record<string, {
    input: string;
    category: ProblemCategory | '';
    other: boolean;
    status: ProblemStatus | '';
    immediacy: ProblemImmediacy | '';
    dateOnset: string;
    service: string;
    comment: string;
    problemName: string;
    problemCode: string;
  }>>({});

  // Fetch up-to-date problems for the patient (fallback to provided problems until fetch completes)
  const effectiveSSN = patient.ssn || '800000035';
  const { problems: fetchedProblems } = usePatientProblems(effectiveSSN);
  const { allergies: fetchedAllergies, loading: allergiesLoading } = usePatientAllergies(effectiveSSN);
  const { notes: clinicalNotes, loading: clinicalNotesLoading } = useClinicalNotes(effectiveSSN);
  
  // Map the API Problem type to our local Problem type
  const problemsToShow = fetchedProblems.length 
    ? fetchedProblems.map(p => ({
        id: p.id,
        description: p.problem,
        dateOnset: p.dateOfOnset,
        status: p.status as ProblemStatus,
        immediacy: p.immediacy as ProblemImmediacy
      }))
    : initialProblems;

  const allergiesToShow = Object.values(fetchedAllergies).length > 0 ? Object.values(fetchedAllergies) : initialAllergies;

  // State management
  const [dynamicPageCardContent, setDynamicPageCardContent] = useState<Record<string, string[]>>(() => {
    const parsedContent = JSON.parse(JSON.stringify(pageCardSampleContent)) as Record<string, string[]>;
    // Remove Allergies and Clinical Notes from dynamic content as they use their own data
    return Object.fromEntries(
      Object.entries(parsedContent)
        .filter(([key]) => key !== 'Allergies' && key !== 'Clinical Notes')
    );
  });
  const [floatingDialogs, setFloatingDialogs] = useState<FloatingDialog[]>([]);
  const [selectedRows, setSelectedRows] = useState<MedicationRow[]>([]);
  const [showProblemDialog, setShowProblemDialog] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<string>('heart-rate');
  const [detailViewTitle, setDetailViewTitle] = useState<string>('');
  const [detailViewContent, setDetailViewContent] = useState<string>('');
  const [medSearch, setMedSearch] = useState<string>('');
  const [quickOrder, setQuickOrder] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [filteredMeds, setFilteredMeds] = useState<string[]>([]);
  const [isAllergyDialogVisible, setIsAllergyDialogVisible] = useState<boolean>(false);
  const [selectedAllergy, setSelectedAllergy] = useState<Allergy | null>(null);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [labTestInput, setLabTestInput] = useState('');
  const [radiologyTests, setRadiologyTests] = useState<RadiologyTest[]>([]);


  // Add with other state declarations
const { diagnosis, loading: diagnosisLoading, error: diagnosisError } = usePatientDiagnosis(patient?.ssn || '');

// Convert the diagnosis object to an array for easier mapping
const diagnosisList = Object.entries(diagnosis).map(([key, value]) => ({
  id: key,
  ...value
}));


  // Dialog input states
  const [medicationInputs, setMedicationInputs] = useState<
    Record<string, { 
      medicationName: string; 
      quickOrder: string; 
      dosage: string; 
      route: string; 
      schedule: string; 
      prn: boolean; 
      duration: string; 
      durationUnit: string; 
      priority: string; 
      additionalDoseNow: boolean; 
      comment: string; 
    }>
  >({});

  const [infoItemInputs, setInfoItemInputs] = useState<
    Record<string, { title: string; item: string }>
  >({});
  const [allergyInputs, setAllergyInputs] = useState<
    Record<string, { 
      allergies: string; 
      natureOfReaction: string;
      reactionType: 'Observed' | 'Historical' | '';
      signSymptom: string;
      dateTime: string;
      comment: string;
    }>
  >({});
  const [radiologyInputs, setRadiologyInputs] = useState<
    Record<string, { type: string; bodyPart: string; notes: string }>
  >({});
  const [reportInputs, setReportInputs] = useState<
    Record<string, { search: string; quickSearch: string; selected: string[] }>
  >({});

  // Allergy search state
  const [allergySearchTerm, setAllergySearchTerm] = useState('');
  const [allergySearchResults, setAllergySearchResults] = useState<any[]>([]);
  const [isSearchingAllergies, setIsSearchingAllergies] = useState(false);
  const [showAllergyDropdown, setShowAllergyDropdown] = useState(false);

  // Add with other state declarations
const { complaints, loading: complaintsLoading } = usePatientComplaints(patient?.ssn || '');
const complaintsList = Object.values(complaints);

  // Debounced allergy search function
  const searchAllergies = useCallback(debounce(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setAllergySearchResults([]);
      return;
    }

    setIsSearchingAllergies(true);
    try {
      const response = await fetch('http://192.168.1.53/cgi-bin/apiAllergySrh.sh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          UserName: 'CPRS-UAT',
          Password: 'UAT@123',
          PatientSSN: '800000035',
          cpProvDiag: searchTerm,
          iAllrgy: searchTerm,
          DUZ: '80'
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

      // Handle different response formats
      if (Array.isArray(data)) {
        setAllergySearchResults(data);
      } else if (data && typeof data === 'object') {
        // Handle object with numeric keys
        const results = Object.entries(data).map(([id, name]) => ({
          id,
          name: String(name)
        }));
        setAllergySearchResults(results);
      }
    } catch (error) {
      console.error('Error searching allergies:', error);
      toast.error('Failed to search for allergies. Please try again.');
      setAllergySearchResults([]);
    } finally {
      setIsSearchingAllergies(false);
    }
  }, 300), []);

  // Debounced SSN search function
  const searchSSN = useCallback(debounce(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSSNSearchResults([]);
      return;
    }

    setIsSearchingSSN(true);
    try {
      const response = await fetch('http://192.168.1.53/cgi-bin/apiAllergySrh.sh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          UserName: 'CPRS-UAT',
          Password: 'UAT@123',
          PatientSSN: searchTerm,
          DUZ: '80'
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

      // Handle different response formats
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
      toast.error('Failed to search for SSN. Please try again.');
      setSSNSearchResults([]);
    } finally {
      setIsSearchingSSN(false);
    }
  }, 300), []);

  // Update search term and trigger search
  const handleAllergySearchChange = (value: string) => {
    setAllergySearchTerm(value);
    if (value.trim()) {
      searchAllergies(value);
      setShowAllergyDropdown(true);
    } else {
      setShowAllergyDropdown(false);
    }
  };

  // Update search term and trigger search
  const handleSSNSearchChange = (value: string) => {
    setSSNSearch(value);
    if (value.trim()) {
      searchSSN(value);
    }
  };

  // Dialog refs for dragging
  const dialogRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dialogDragging = useRef<Record<string, boolean>>({});
  const dragStartCoords = useRef<Record<string, { x: number; y: number }>>({});
  const initialDialogOffset = useRef<Record<string, { x: number; y: number }>>({});

  // Medication constants
  const ROUTES = ['Oral', 'IV', 'IM', 'Subcutaneous'];
  const SCHEDULES = ['Daily', 'BID', 'TID', 'QID'];
  const PRIORITIES = ['Routine', 'Urgent', 'STAT'];
  const MEDICATIONS = ['Aspirin', 'Metformin', 'Ibuprofen', 'Lisinopril'];

  // Debug medications data
  useEffect(() => {
    console.log('Initial medications prop:', initialMedications);
    console.log('Initial localMedications state:', medications);
  }, [initialMedications, medications]);

  // Auto-save functionality for dialog inputs
  useEffect(() => {
    const saveDrafts = () => {
      if (Object.keys(allergyInputs).length > 0) {
        localStorage.setItem('allergyInputsDraft', JSON.stringify(allergyInputs));
      }
      if (Object.keys(problemInputs).length > 0) {
        localStorage.setItem('problemInputsDraft', JSON.stringify(problemInputs));
      }
      if (Object.keys(medicationInputs).length > 0) {
        localStorage.setItem('medicationInputsDraft', JSON.stringify(medicationInputs));
      }
      if (Object.keys(infoItemInputs).length > 0) {
        localStorage.setItem('infoItemInputsDraft', JSON.stringify(infoItemInputs));
      }
      if (Object.keys(radiologyInputs).length > 0) {
        localStorage.setItem('radiologyInputsDraft', JSON.stringify(radiologyInputs));
      }
      if (Object.keys(reportInputs).length > 0) {
        localStorage.setItem('reportInputsDraft', JSON.stringify(reportInputs));
      }
    };

    const interval = setInterval(saveDrafts, 30 * 1000); // Save every 30 seconds
    return () => clearInterval(interval);
  }, [allergyInputs, problemInputs, medicationInputs, infoItemInputs, radiologyInputs, reportInputs]);

  // Load drafts on component mount
  useEffect(() => {
    const loadDrafts = () => {
      const allergyDraft = localStorage.getItem('allergyInputsDraft');
      if (allergyDraft) setAllergyInputs(JSON.parse(allergyDraft));

      const problemDraft = localStorage.getItem('problemInputsDraft');
      if (problemDraft) setProblemInputs(JSON.parse(problemDraft));

      const medicationDraft = localStorage.getItem('medicationInputsDraft');
      if (medicationDraft) setMedicationInputs(JSON.parse(medicationDraft));

      const infoItemDraft = localStorage.getItem('infoItemInputsDraft');
      if (infoItemDraft) setInfoItemInputs(JSON.parse(infoItemDraft));

      const radiologyDraft = localStorage.getItem('radiologyInputsDraft');
      if (radiologyDraft) setRadiologyInputs(JSON.parse(radiologyDraft));

      const reportDraft = localStorage.getItem('reportInputsDraft');
      if (reportDraft) setReportInputs(JSON.parse(reportDraft));
    };

    loadDrafts();
  }, []);

  // Dialog management
  const openFloatingDialog = useCallback((type: DialogType, title: string, data?: any) => {
    if (floatingDialogs.length >= 3) {
      toast.error('Maximum 3 dialogs can be open at a time.');
      return;
    }

    const id = Date.now().toString();
    setFloatingDialogs((prev) => [
      ...prev,
      {
        id,
        type,
        title,
        position: { x: 0, y: 0 },
        data,
      },
    ]);

    if (type === 'problem') {
      setProblemInputs((prev) => ({
        ...prev,
        [id]: {
          input: '',
          category: '',
          other: false,
          status: '',
          immediacy: '',
          dateOnset: '',
          service: '',
          comment: '',
          problemName: '',
          problemCode: ''
        },
      }));
    } else if (type === 'medication') {
      setMedicationInputs((prev) => ({
        ...prev,
        [id]: { 
          medicationName: '', 
          quickOrder: '', 
          dosage: '', 
          route: '', 
          schedule: '', 
          prn: false, 
          duration: '', 
          durationUnit: '', 
          priority: '', 
          additionalDoseNow: false, 
          comment: '' 
        },
      }));
    } else if (type === 'info-item') {
      setInfoItemInputs((prev) => ({
        ...prev,
        [id]: { title: data?.title || '', item: '' },
      }));
    } else if (type === 'allergies') {
      setAllergyInputs((prev) => ({
        ...prev,
        [id]: { 
          allergies: '', 
          natureOfReaction: '',
          reactionType: '',
          signSymptom: '',
          dateTime: new Date().toISOString().slice(0, 16), // Pre-fill with current date/time
          comment: '' 
        },
      }));
    } else if (type === 'radiology') {
      setRadiologyInputs((prev) => ({
        ...prev,
        [id]: { type: '', bodyPart: '', notes: '' },
      }));
    } else if (type === 'report') {
      setReportInputs((prev) => ({
        ...prev,
        [id]: { search: '', quickSearch: '', selected: [] },
      }));
    } else if (type === 'lab') {
      setLabTests([]);
      setLabTestInput('');
    }
  }, [floatingDialogs]);

  const closeFloatingDialog = useCallback((id: string) => {
    setFloatingDialogs((prev) => prev.filter((dialog) => dialog.id !== id));
    setProblemInputs((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setMedicationInputs((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setInfoItemInputs((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setAllergyInputs((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setRadiologyInputs((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setReportInputs((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Dialog dragging functionality
  const handleMouseDown = useCallback((id: string, e: React.MouseEvent<HTMLDivElement>) => {
    const dialogRef = dialogRefs.current[id];
    if (dialogRef) {
      dialogDragging.current[id] = true;
      dragStartCoords.current[id] = { x: e.clientX, y: e.clientY };
      const style = window.getComputedStyle(dialogRef);
      const matrix = new DOMMatrixReadOnly(style.transform);
      initialDialogOffset.current[id] = { x: matrix.m41, y: matrix.m42 };
      dialogRef.style.cursor = 'grabbing';
      document.body.style.cursor = 'grabbing';
      e.preventDefault();
    }
  }, []);

  const handleKeyDown = useCallback((id: string, e: React.KeyboardEvent<HTMLDivElement>) => {
    const dialogRef = dialogRefs.current[id];
    if (!dialogRef) return;

    const step = 10; // Pixels to move per key press
    const style = window.getComputedStyle(dialogRef);
    const matrix = new DOMMatrixReadOnly(style.transform);
    let x = matrix.m41;
    let y = matrix.m42;

    if (e.key === 'ArrowUp') {
      y -= step;
    } else if (e.key === 'ArrowDown') {
      y += step;
    } else if (e.key === 'ArrowLeft') {
      x -= step;
    } else if (e.key === 'ArrowRight') {
      x += step;
    } else if (e.key === 'Escape') {
      closeFloatingDialog(id);
      return;
    } else {
      return;
    }

    dialogRef.style.transform = `translate(${x}px, ${y}px)`;
  }, [closeFloatingDialog]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      Object.keys(dialogDragging.current).forEach((id) => {
        if (dialogDragging.current[id] && dialogRefs.current[id]) {
          const deltaX = e.clientX - dragStartCoords.current[id].x;
          const deltaY = e.clientY - dragStartCoords.current[id].y;
          const newX = initialDialogOffset.current[id].x + deltaX;
          const newY = initialDialogOffset.current[id].y + deltaY;
          dialogRefs.current[id]!.style.transform = `translate(${newX}px, ${newY}px)`;
        }
      });
    };

    const handleMouseUp = () => {
      Object.keys(dialogDragging.current).forEach((id) => {
        if (dialogDragging.current[id] && dialogRefs.current[id]) {
          dialogDragging.current[id] = false;
          dialogRefs.current[id]!.style.cursor = 'grab';
          document.body.style.cursor = 'default';
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Handle medication search and table
  const handleSelectMed = (med: string) => {
    setSelectedRows((prev) => [
      ...prev,
      {
        medicationName: med,
        dosage: '',
        route: 'Oral',
        schedule: 'Daily',
        prn: false,
        duration: '1',
        durationUnit: 'days',
        priority: 'Routine',
        additionalDoseNow: false,
        comment: '',
      },
    ]);
    setMedSearch('');
    setDropdownOpen(false);
  };

  const handleRowChange = (
    idx: number,
    field: keyof MedicationRow,
    value: string | boolean
  ) => {
    setSelectedRows((prev) =>
      prev.map((row, i) =>
        i === idx ? { ...row, [field]: value } : row
      )
    );
  };

  const handleRemoveRow = (idx: number) => {
    setSelectedRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddProblem = useCallback(async (dialogId: string) => {
    const input = problemInputs[dialogId];
    if (!input) {
      toast.error('Problem input not found');
      return;
    }

    // Validate required fields
    if (!input.category) {
      toast.error('Please select a category');
      return;
    }

    if (!input.input.trim()) {
      toast.error('Please enter a problem description');
      return;
    }

    try {
      const problemDescription = input.input;
      
      // Map the form data to the API payload
      const payload = {
        PatientSSN: patient.ssn || '800000035',
        DUZ: '1', // Default DUZ value
        ihtLocation: '1', // Default location
        cdpProbL: problemDescription,
        cpClinic: '1', // Default clinic
        cdpDOSet: input.dateOnset || new Date().toISOString().split('T')[0],
        cdpStts: input.status || 'ACTIVE',
        cdpServ: input.service || 'GENERAL',
        cdpImmed: input.immediacy || 'ACUTE',
        cdpCMT: input.comment || '',
        cpWard: '1', // Default ward
        DUZIP: '1.1.1.1', // Default IP
      };

      await saveProblem(payload);
      
      // Close the dialog and reset the form
      closeFloatingDialog(dialogId);
      
      // Clear the form
      setProblemInputs(prev => ({
        ...prev,
        [dialogId]: {
          input: '',
          category: '',
          other: false,
          status: '',
          immediacy: '',
          dateOnset: '',
          service: '',
          comment: '',
          problemName: '',
          problemCode: ''
        },
      }));
      
      // Refresh problems list
      // Note: You might want to implement a refetch function in your usePatientProblems hook
      // and call it here to refresh the problems list
      
    } catch (error) {
      // Error is already handled by the useProblemSave hook
      console.error('Error saving problem:', error);
    }
  }, [problemInputs, patient.ssn, saveProblem]);

  const handleAddMedication = (dialogId: string) => {
    const input = medicationInputs[dialogId];
    if (!input?.medicationName.trim()) {
      toast.error('Medication name is required');
      return;
    }

    const newMed: Medication = {
      id: Date.now().toString(),
      name: input.medicationName,
      reason: input.comment || 'General',
      amount: input.dosage || 'N/A',
      timing: input.schedule || 'N/A',
      status: 'Active',
    };
    toast.success('Medication added successfully!');
    closeFloatingDialog(dialogId);
  };

  const handleAddAllergy = useCallback((dialogId: string) => {
    const input = allergyInputs[dialogId];
    if (!input) return;

    // Validate required fields
    if (!input.allergies) {
      toast.error('Please enter allergies');
      return;
    }

    // Create the new allergy object
    const newAllergy: Allergy = {
      id: `allergy-${Date.now()}`,
      allergen: input.allergies,
      reaction: input.natureOfReaction,
      severity: 'Moderate' as const, // Set a default severity
      dateOnset: input.dateTime,
      treatment: '', // Not in the new design
      status: 'Active' as const,
      notes: input.comment,
      createdBy: 'Current User', // Replace with actual user
      createdAt: new Date().toISOString(),
    };

    // Here you would typically make an API call to save the allergy
    console.log('Saving allergy:', newAllergy);
    
    // Show success message
    toast.success('Allergy saved successfully');
    
    // Close the dialog
    closeFloatingDialog(dialogId);
    
    // Reset the form
    setAllergyInputs(prev => ({
      ...prev,
      [dialogId]: { 
        allergies: '', 
        natureOfReaction: '',
        reactionType: '',
        signSymptom: '',
        dateTime: new Date().toISOString().slice(0, 16),
        comment: '' 
      },
    }));
  }, [allergyInputs, closeFloatingDialog]);

  const handleSaveNewInfoItem = (dialogId: string) => {
    const input = infoItemInputs[dialogId];
    if (!input?.item.trim() || !input.title) {
      toast.error('Item content and title are required');
      return;
    }

    setDynamicPageCardContent((prev) => ({
      ...prev,
      [input.title]: [input.item, ...(prev[input.title] || [])],
    }));
    toast.success('Item added successfully!');
    closeFloatingDialog(dialogId);
  };

  const addLabTest = (name: string) => {
    if (labTests.find((test) => test.name === name)) {
      toast.error('Lab test already added');
      return;
    }

    setLabTests((prev) => [
      ...prev,
      {
        name,
        collectSample: '',
        specimen: '',
        urgency: '',
        howOften: '',
        comments: '',
      },
    ]);
  };

  const saveLabTests = (dialogId: string) => {
    // Implement logic to save lab tests
    console.log('Saving lab tests:', labTests);
    toast.success('Lab tests saved successfully!');
    closeFloatingDialog(dialogId);
  };

  const addRadiologyTest = (name: string) => {
    if (radiologyTests.find((test) => test.name === name)) {
      toast.error('Radiology test already added');
      return;
    }

    setRadiologyTests((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name,
        requestedDate: new Date().toISOString().split('T')[0],
        submitTo: '',
        urgency: 'ROUTINE',
        modifiers: '',
        transport: '',
        reason: ''
      },
    ]);
  };

  const updateRadiologyTest = (id: string, field: keyof RadiologyTest, value: string) => {
    setRadiologyTests((prev) => prev.map((test) => test.id === id ? { ...test, [field]: value } : test));
  };

  const removeRadiologyTest = (id: string) => {
    setRadiologyTests((prev) => prev.filter((test) => test.id !== id));
  };

  const saveRadiologyTests = (dialogId: string) => {
    // Implement logic to save radiology tests
    console.log('Saving radiology tests:', radiologyTests);
    toast.success('Radiology tests saved successfully!');
    closeFloatingDialog(dialogId);
  };

  // Handle problem search input change with debounce
  const handleSearchChange = useCallback(
    debounce((searchTerm: string, dialogId: string) => {
      if (searchTerm.trim().length >= 2) {  // Only search if 2 or more characters
        console.log('Initiating search for:', searchTerm);
        searchProblems(searchTerm, patient.ssn || '800000035');
      } else {
        console.log('Search term too short, clearing results');
        clearProblemSearch();
      }
    }, 300),
    [searchProblems, patient.ssn, clearProblemSearch]
  );

  // Handle input change with immediate feedback
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, dialogId: string) => {
    const value = e.target.value;
    console.log('Input changed:', value, 'for dialog:', dialogId);
    
    // Update input value
    setProblemInputs(prev => ({
      ...prev,
      [dialogId]: { 
        ...(prev[dialogId] || {}), 
        input: value,
        other: true // Ensure other is true when typing
      }
    }));
    
    // Clear results if input is cleared
    if (!value.trim()) {
      console.log('Input cleared, clearing search');
      clearProblemSearch();
    } else if (value.trim().length >= 2) {
      console.log('Triggering search for:', value);
      handleSearchChange(value, dialogId);
    } else {
      console.log('Search term too short, not searching');
      clearProblemSearch();
    }
  }, [handleSearchChange, clearProblemSearch]);

  // Handle problem selection from search results
  const handleSelectProblem = useCallback((problem: string, dialogId: string) => {
    setProblemInputs(prev => ({
      ...prev,
      [dialogId]: {
        ...prev[dialogId],
        input: problem,
        other: true // Keep the search input visible after selection
      }
    }));
    clearProblemSearch();
  }, [clearProblemSearch]);

  // Medication names for selection
  const medicationList = [
    'Aspirin',
    'Paracetamol',
    'Amoxicillin',
    'Metformin',
    'Atorvastatin',
  ];

  // Track selected medications
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);

  // Add a new medication to the list
  const addSelectedMedication = (medication: string) => {
    if (medication && !selectedMedications.includes(medication)) {
      setSelectedMedications(prev => [...prev, medication]);
      
      // Update the input field to show the selected medication
      const dialogId = Object.keys(medicationInputs)[0]; // Get the first dialog ID
      if (dialogId) {
        setMedicationInputs(prev => ({
          ...prev,
          [dialogId]: { 
            ...(prev[dialogId] || {}), 
            medicationName: medication 
          }
        }));
      }
    }
  };

  // Remove a medication from the list
  const removeSelectedMedication = (medication: string) => {
    setSelectedMedications(prev => prev.filter(m => m !== medication));
  };

  // Reset form and clear selection
  const resetMedicationForm = (dialogId: string) => {
    setMedicationInputs(prev => ({
      ...prev,
      [dialogId]: { 
        medicationName: '', 
        quickOrder: '', 
        dosage: '', 
        route: '', 
        schedule: '', 
        prn: false, 
        duration: '', 
        durationUnit: '', 
        priority: '', 
        additionalDoseNow: false, 
        comment: '' 
      }
    }));
    setSelectedMedications([]);
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-auto bg-background relative">
      {/* Top Row: Problems, Chart, Vital Signs */}
      <div className="h-1/3 grid grid-cols-1 lg:grid-cols-12 gap-3 mb-2">
        <Card className="lg:col-span-3 shadow-lg flex flex-col h-full">
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between border-b px-3 pt-2">
              <div className="flex items-center space-x-1.5">
                <Clock className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Problems</CardTitle>
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
  {`${problemsToShow.length} | ${complaintsList.length} | ${diagnosisList.length}`}
</Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => openFloatingDialog('problem', 'Add New Problem')}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span className="sr-only">Add {activeProblemsTab === 'problems' ? 'Problem' : activeProblemsTab === 'chief-complaints' ? 'Chief Complaint' : 'Final Diagnosis'}</span>
              </Button>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex border-b">
              <button
                className={`flex-1 py-2 text-xs font-medium text-center ${
                  activeProblemsTab === 'problems'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveProblemsTab('problems')}
              >
                Problems
              </button>
              <button
                className={`flex-1 py-2 text-xs font-medium text-center ${
                  activeProblemsTab === 'chief-complaints'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveProblemsTab('chief-complaints')}
              >
                Chief Complaints
              </button>
              <button
                className={`flex-1 py-2 text-xs font-medium text-center ${
                  activeProblemsTab === 'final-diagnosis'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveProblemsTab('final-diagnosis')}
              >
                Final Diagnosis
              </button>
            </div>
            <CardContent className="flex-1 p-0 overflow-y-auto">
              {/* Problems Tab */}
              {activeProblemsTab === 'problems' && (
                <div className="h-full flex flex-col">
                  <div className="overflow-y-auto" style={{ maxHeight: '9rem' }}>
                    <Table>
                      <TableBody>
                        {problemsToShow.map((problem, index) => (
                          <TableRow key={problem.id} className={`${index % 2 === 0 ? 'bg-muted/30' : ''} h-6`}>
                            <TableCell className="p-0 px-2">
                              <div
                                className="font-medium text-xs cursor-pointer leading-tight"
                                onClick={() => {
                                  setSelectedProblem(problem);
                                  setShowProblemDialog(true);
                                }}
                              >
                                {('description' in problem ? problem.description : (problem as any).problem)}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {problemsToShow.length === 0 && (
                          <TableRow className="h-6">
                            <TableCell className="p-0 px-2 text-center">
                              <p className="text-xs text-muted-foreground">No problems listed.</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Chief Complaints Tab */}
              {/* Chief Complaints Tab */}
{activeProblemsTab === 'chief-complaints' && (
  <div className="h-full flex flex-col">
    <div className="overflow-y-auto" style={{ maxHeight: '9rem' }}>
      <Table>
        <TableBody>
          {complaintsLoading ? (
            <TableRow>
              <TableCell className="text-center" colSpan={1}>
                <div className="flex justify-center py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                </div>
              </TableCell>
            </TableRow>
          ) : complaintsList.length > 0 ? (
            complaintsList.map((complaint, index) => (
              <TableRow key={complaint["Order IEN"]} className={`${index % 2 === 0 ? 'bg-muted/30' : ''} h-6`}>
                <TableCell className="p-0 px-2">
                  <div className="font-medium text-xs cursor-pointer leading-tight">
                    {complaint.CompName}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="text-center text-muted-foreground text-xs py-2">
                No chief complaints recorded.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  </div>
)}

              {/* Final Diagnosis Tab */}
              {/* Final Diagnosis Tab */}
{activeProblemsTab === 'final-diagnosis' && (
  <div className="h-full flex flex-col">
    <div className="overflow-y-auto" style={{ maxHeight: '9rem' }}>
      <Table>
        <TableBody>
          {diagnosisLoading ? (
            <TableRow>
              <TableCell className="text-center" colSpan={1}>
                <div className="flex justify-center py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                </div>
              </TableCell>
            </TableRow>
          ) : diagnosisError ? (
            <TableRow>
              <TableCell className="text-center text-red-500 text-xs py-2">
                Error loading diagnosis
              </TableCell>
            </TableRow>
          ) : diagnosisList.length > 0 ? (
            diagnosisList.map((diag, index) => (
              <TableRow key={diag.id} className={`${index % 2 === 0 ? 'bg-muted/30' : ''} h-6`}>
                <TableCell className="p-0 px-2">
                  <div
                    className="font-medium text-xs cursor-pointer leading-tight"
                    onClick={() => {
                      // You can add a click handler here if needed
                      console.log('Diagnosis clicked:', diag);
                    }}
                  >
                    {diag['Diagnosis Description'] || 'No description available'}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="text-center text-muted-foreground text-xs py-2">
                No diagnosis listed.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  </div>
)}
            </CardContent>
          </div>
        </Card>

        <Card className="lg:col-span-5 shadow-lg h-full">
          <CardContent className="pt-2 px-2 pb-2">
            <Tabs value={activeChartTab} onValueChange={setActiveChartTab} className="w-full">
              <TabsList className="hidden">
                <TabsTrigger value="heart-rate">Heart Rate</TabsTrigger>
                <TabsTrigger value="blood-glucose">Blood Glucose</TabsTrigger>
                <TabsTrigger value="blood-pressure">Blood Pressure</TabsTrigger>
                <TabsTrigger value="body-temperature">Body Temperature</TabsTrigger>
                <TabsTrigger value="weight">Weight</TabsTrigger>
                <TabsTrigger value="detail-view">Detail</TabsTrigger>
              </TabsList>
              <TabsContent value="heart-rate">
                <ChartContainer config={MOCK_HEART_RATE_MONITOR_CHART_CONFIG} className="h-[140px] w-full">
                  <RechartsLineChart data={MOCK_HEART_RATE_MONITOR_DATA} margin={{ left: 0, right: 5, top: 5, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={4} fontSize={9} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={4} fontSize={9} domain={[60, 120]} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Line
                      dataKey="hr"
                      type="monotone"
                      stroke="var(--color-hr)"
                      strokeWidth={1.5}
                      dot={(props: any) => {
                        const { cx, cy, value } = props;
                        const isCritical = value < 60 || value > 100;
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isCritical ? 4 : 2}
                            fill={isCritical ? 'red' : 'var(--color-hr)'}
                            stroke="none"
                          />
                        );
                      }}
                    />
                  </RechartsLineChart>
                </ChartContainer>
              </TabsContent>
              <TabsContent value="blood-glucose">
                <ChartContainer config={glucoseChartConfig} className="h-[140px] w-full">
                  <RechartsLineChart data={MOCK_GLUCOSE_DATA} margin={{ left: 0, right: 5, top: 5, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={4} fontSize={9} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={4} fontSize={9} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Line
                      dataKey="level"
                      type="monotone"
                      stroke="var(--color-level)"
                      strokeWidth={1.5}
                      dot={(props: any) => {
                        const { cx, cy, value } = props;
                        const isCritical = value < 70 || value > 180;
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isCritical ? 4 : 2}
                            fill={isCritical ? 'red' : 'var(--color-level)'}
                            stroke="none"
                          />
                        );
                      }}
                    />
                  </RechartsLineChart>
                </ChartContainer>
              </TabsContent>
              <TabsContent value="blood-pressure">
                <ChartContainer config={bloodPressureChartConfig} className="h-[140px] w-full">
                  <RechartsLineChart data={MOCK_BLOOD_PRESSURE_DATA} margin={{ left: 0, right: 5, top: 5, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={4} fontSize={9} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={4} fontSize={9} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                    <Line
                      dataKey="systolic"
                      type="monotone"
                      stroke="var(--color-systolic)"
                      strokeWidth={1.5}
                      dot={(props: any) => {
                        const { cx, cy, value } = props;
                        const isCritical = value < 90 || value > 140;
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isCritical ? 4 : 2}
                            fill={isCritical ? 'red' : 'var(--color-systolic)'}
                            stroke="none"
                          />
                        );
                      }}
                    />
                    <Line
                      dataKey="diastolic"
                      type="monotone"
                      stroke="var(--color-diastolic)"
                      strokeWidth={1.5}
                      dot={(props: any) => {
                        const { cx, cy, value } = props;
                        const isCritical = value < 60 || value > 90;
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isCritical ? 4 : 2}
                            fill={isCritical ? 'red' : 'var(--color-diastolic)'}
                            stroke="none"
                          />
                        );
                      }}
                    />
                  </RechartsLineChart>
                </ChartContainer>
              </TabsContent>
              <TabsContent value="body-temperature">
                <ChartContainer config={bodyTemperatureChartConfig} className="h-[140px] w-full">
                  <RechartsLineChart data={MOCK_BODY_TEMPERATURE_DATA} margin={{ left: 0, right: 5, top: 5, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={4} fontSize={9} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={4} fontSize={9} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Line
                      dataKey="temp"
                      type="monotone"
                      stroke="var(--color-temp)"
                      strokeWidth={1.5}
                      dot={(props: any) => {
                        const { cx, cy, value } = props;
                        const isCritical = value < 95 || value > 100.4;
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isCritical ? 4 : 2}
                            fill={isCritical ? 'red' : 'var(--color-temp)'}
                            stroke="none"
                          />
                        );
                      }}
                    />
                  </RechartsLineChart>
                </ChartContainer>
              </TabsContent>
              <TabsContent value="weight">
                <ChartContainer config={weightChartConfig} className="h-[140px] w-full">
                  <RechartsLineChart data={MOCK_WEIGHT_DATA} margin={{ left: 0, right: 5, top: 5, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={4} fontSize={9} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={4} fontSize={9} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Line
                      dataKey="weight"
                      type="monotone"
                      stroke="var(--color-weight)"
                      strokeWidth={1.5}
                      dot={(props: any) => {
                        const { cx, cy, value } = props;
                        const isCritical = value < 50 || value > 100;
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isCritical ? 4 : 2}
                            fill={isCritical ? 'red' : 'var(--color-weight)'}
                            stroke="none"
                          />
                        );
                      }}
                    />
                  </RechartsLineChart>
                </ChartContainer>
              </TabsContent>
              <TabsContent value="detail-view">
                <Card className="border-0 shadow-none">
                  <ShadcnCardHeader className="pt-2 pb-1 px-3">
                    <CardTitle className="text-base">{detailViewTitle}</CardTitle>
                  </ShadcnCardHeader>
                  <CardContent className="p-3 text-sm text-foreground max-h-[150px] overflow-y-auto no-scrollbar">
                    {detailViewContent.split('\n').map((line, index) => (
                      <div key={index}>{line}</div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 shadow-lg h-full">
          <CardContent className="space-y-1.5 p-2 max-h-44 overflow-y-auto no-scrollbar">
            {MOCK_KEY_INDICATORS.map((indicator) => {
              const isActive = indicator.tabValue === activeChartTab;
              return (
                <div
                  key={indicator.name}
                  className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer
                    ${isActive ? 'bg-primary/10 ring-1 ring-primary' : 'bg-muted/70 hover:bg-muted/90'}`}
                  onClick={() => indicator.tabValue && setActiveChartTab(indicator.tabValue)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && indicator.tabValue) setActiveChartTab(indicator.tabValue);
                  }}
                >
                  <div className="flex items-center">
                    {indicator.icon && (
                      <indicator.icon
                        className="h-4 w-4 mr-1.5"
                        style={{ color: isActive && indicator.activeColor ? indicator.activeColor : 'hsl(var(--primary))' }}
                      />
                    )}
                    <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {indicator.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-normal ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {indicator.value}
                    </span>
                    <span className={`text-xs font-normal ml-0.5 ${isActive ? 'text-primary/80' : 'text-foreground/80'}`}>
                      {indicator.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Second Row: Allergies, Medications, Report, Radiology */}
      <div className="h-1/3 grid grid-cols-1 md:grid-cols-10 gap-3 mb-2">
        {secondRowInformationalCardTitles.map((title) => {
          const IconComponent = infoCardIcons[title] || FileText;
          const items = title === 'Allergies' ? allergiesToShow : dynamicPageCardContent[title] || [];
          // Determine column span based on card type
          const colSpan = (title === 'Allergies' || title === 'Radiology') ? 'md:col-span-2' : 'md:col-span-3';
          
          if (title === 'Medications History') {
            return (
              <Card key="medications-history" className={`shadow-lg ${colSpan}`}>
                <ShadcnCardHeader className="flex flex-row items-center justify-between pt-2 pb-0 px-3">
                  <div className="flex items-center space-x-1.5">
                    <IconComponent className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">{title}</CardTitle>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {medicationsLoading ? '...' : medications?.length || 0}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openFloatingDialog('medication', 'Order Medicines')}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span className="sr-only">Edit {title}</span>
                  </Button>
                </ShadcnCardHeader>
                <CardContent className="p-0 h-[172px] overflow-y-auto scrollbar-hide">
                  <Table>
                    <TableBody>
                      {medicationsLoading ? (
                        <TableRow>
                          <TableCell className="text-center" colSpan={1}>
                            <div className="flex justify-center py-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : medicationsError ? (
                        <TableRow>
                          <TableCell className="text-center text-red-500 text-xs py-2">
                            Error loading medications
                          </TableCell>
                        </TableRow>
                      ) : medications && medications.length > 0 ? (
                        medications.map((medication: any, index: number) => (
                          <TableRow 
                            key={medication['Order IEN'] || medication.id || index}
                            className="hover:bg-muted/50"
                          >
                            <TableCell className="px-2 py-1">
                              <div className="text-xs">
                                {medication['Medication Name'] || medication.medicationName || 'Unnamed Medication'}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell className="text-center text-muted-foreground text-xs py-2">
                            No medications found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          } else if (title === 'Lab Report') {
            return (
              <Card key="lab-report" className={`shadow-lg ${colSpan}`}>
                <ShadcnCardHeader className="flex flex-row items-center justify-between pt-2 pb-0 px-3">
                  <div className="flex items-center space-x-1.5">
                    <IconComponent className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">{title}</CardTitle>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">0</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openFloatingDialog('lab', 'Order Lab Tests')}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span className="sr-only">Edit {title}</span>
                  </Button>
                </ShadcnCardHeader>
                <CardContent className="p-0 h-[132px] overflow-y-auto scrollbar-hide">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-center text-muted-foreground text-xs py-2">
                          No lab reports found
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          } else {
            return (
              <Card
                key={`${title.toLowerCase().replace(/\s+/g, '-')}`}
                className={`shadow-lg ${colSpan}`}
              >
                <ShadcnCardHeader className="flex flex-row items-center justify-between pt-2 pb-0 px-3">
                  <div className="flex items-center space-x-1.5">
                    <IconComponent className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">{title}</CardTitle>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {title === 'Allergies' ? allergiesToShow.length : items.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      if (title === 'Allergies') {
                        openFloatingDialog('allergies', 'Add New Allergy');
                      } else if (title === 'Radiology') {
                        openFloatingDialog('radiology', 'Order Radiology Test');
                      } else if (title === 'Lab Report') {
                        openFloatingDialog('lab', 'Order Lab Tests');
                      } else {
                        openFloatingDialog('info-item', `Add New Item to ${title}`, { title });
                      }
                    }}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span className="sr-only">Edit {title}</span>
                  </Button>
                </ShadcnCardHeader>
                <CardContent className="p-0 max-h-[200px] overflow-y-auto">
                  <Table>
                    <TableBody>
                      {title === 'Allergies' ? (
                        allergiesToShow.length > 0 ? (
                          allergiesToShow.slice(0, 5).map((allergy: any, index: number) => (
                            <TableRow
                              key={allergy['Order IEN'] || index}
                              className="hover:bg-muted/50"
                              onClick={() => {
                                setSelectedAllergy(allergy);
                                setShowAllergyDialog(true);
                              }}
                            >
                              <TableCell className="px-2 py-1">
                                <div className="text-xs">
                                  {allergy.Allergies || 'Unknown Allergen'}
                                  {allergy.Symptoms && ` - ${allergy.Symptoms}`}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell className="px-2 py-2">
                              <div className="text-xs text-muted-foreground">
                                {allergiesLoading ? 'Loading allergies...' : 'No allergies listed.'}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      ) : items.length > 0 ? (
                        items.slice(0, 5).map((item: string, index: number) => (
                          <TableRow 
                            key={index}
                            className="hover:bg-muted/50"
                          >
                            <TableCell className="px-2 py-1">
                              <div className="text-xs">{item}</div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell className="px-2 py-2">
                            <div className="text-xs text-muted-foreground">No items found</div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          }
        })}
      </div>

      {/* Third Row: Clinical Notes, Encounter Notes, Clinical Reminder */}
      <div className="h-1/3 grid grid-cols-1 lg:grid-cols-3 gap-3 mb-1">
        {thirdRowInformationalCardTitles.map((title) => {
          const IconComponent = infoCardIcons[title] || FileText;
          const items = dynamicPageCardContent[title] || [];
          
          // For Clinical Notes, use the useClinicalNotes hook data
          if (title === 'Clinical Notes') {
            const { notes: clinicalNotes, loading: clinicalNotesLoading } = useClinicalNotes(patient?.ssn);
            const itemCount = clinicalNotes?.length || 0;
            
            return (
              <Card key="clinical-notes" className="shadow-lg">
                <ShadcnCardHeader className="flex flex-row items-center justify-between pt-2 pb-0 px-3">
                  <div className="flex items-center space-x-1.5">
                    <IconComponent className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">Clinical Notes</CardTitle>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {clinicalNotesLoading ? '...' : itemCount}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => window.location.href = '/clinical-notes'}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span className="sr-only">Edit Clinical Notes</span>
                  </Button>
                </ShadcnCardHeader>
                <CardContent className="p-0 h-[172px] overflow-y-auto scrollbar-hide">
                  <Table>
                    <TableBody>
                      {clinicalNotesLoading ? (
                        <TableRow>
                          <TableCell className="text-center" colSpan={1}>
                            <div className="flex justify-center py-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : itemCount === 0 ? (
                        <TableRow>
                          <TableCell className="text-center text-muted-foreground text-xs py-2">
                            No clinical notes found
                          </TableCell>
                        </TableRow>
                      ) : (
                        clinicalNotes.map((note: any) => (
                          <TableRow key={note.id} className="hover:bg-muted/50">
                            <TableCell className="p-0">
                              <div className="text-xs px-3 py-1.5">
                                {note.notesTitle || 'Untitled Note'}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          }
          
          // For other cards, use the existing implementation
          const isLoading = false;
          const itemCount = items.length;
          
          return (
            <Card key={`${title.toLowerCase().replace(/\s+/g, '-')}`} className="shadow-lg">
              <ShadcnCardHeader className="flex flex-row items-center justify-between pt-2 pb-0 px-3">
                <div className="flex items-center space-x-1.5">
                  <IconComponent className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">{title}</CardTitle>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {isLoading ? '...' : itemCount}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => openFloatingDialog('info-item', `Add New Item to ${title}`, { title })}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span className="sr-only">Edit {title}</span>
                </Button>
              </ShadcnCardHeader>
              <CardContent className="p-0 h-[172px] overflow-y-auto scrollbar-hide">
                <Table>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell className="text-center" colSpan={1}>
                          <div className="flex justify-center py-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : itemCount === 0 ? (
                      <TableRow>
                        <TableCell className="text-center text-muted-foreground text-xs py-2">
                          No items found
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item: any, index: number) => (
                        <TableRow key={index} className="hover:bg-muted/50">
                          <TableCell className="p-0">
                            <div className="text-xs px-3 py-1.5">
                              {item}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Floating Dialogs */}
      {floatingDialogs.map((dialog) => (
        <div
          key={dialog.id}
          ref={(el) => { dialogRefs.current[dialog.id] = el; }}
          className="fixed bg-white border rounded-lg shadow-lg z-50 flex flex-col w-[80vw] h-[80vh]"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) translate(${dialog.position.x}px, ${dialog.position.y}px)`,
          }}
          onKeyDown={(e) => handleKeyDown(dialog.id, e)}
          tabIndex={0}
        >
          <div
            className="flex justify-between items-center p-2 bg-gray-100 border-b cursor-move rounded-t-lg"
            onMouseDown={(e) => handleMouseDown(dialog.id, e)}
          >
            <h2 className="text-base font-semibold">{dialog.title}</h2>
            <Button variant="ghost" size="icon" onClick={() => closeFloatingDialog(dialog.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4">
            {dialog.type === 'problem' ? (
              <div className="flex flex-col gap-4 text-sm">
                {/* Main Row: Preferred Problem on left, other fields on right */}
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Left Column: Preferred Problem */}
                  <div className="w-full md:w-1/3 flex flex-col">
                    <div className="bg-white rounded-lg shadow-md p-2 border flex-1">
                      <div className="space-y-2">
                        <Label className="block mb-1 text-xs font-semibold text-gray-700">Preferred Problem</Label>
                        <div className="h-full overflow-y-auto space-y-2">
                          <div className="flex flex-col gap-2">
                            {[{ name: "Anemia", code: "D64.9" },
                              { name: "Diabetes", code: "E11.9" },
                              { name: "Dehydration", code: "E86.0" },
                              { name: "Burns", code: "T30.0" },
                              { name: "Post operative discharge", code: "T81.4XXA" }].map((prob, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  const [name, code] = `${prob.name} (${prob.code})`.split(' (');
                                  setProblemInputs(prev => ({
                                    ...prev,
                                    [dialog.id]: {
                                      ...prev[dialog.id],
                                      problemName: name,
                                      problemCode: code.replace(')', ''),
                                      input: `${prob.name} (${prob.code})`,
                                      other: false,
                                    }
                                  }));
                                }}
                                className={`w-full p-2 text-left text-xs rounded-lg transition-colors duration-200 ${
                                  problemInputs[dialog.id]?.problemName === prob.name 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-white hover:bg-blue-50 text-gray-700 hover:text-gray-900'
                                }`}
                              >
                                {prob.name} <span className="text-[10px] text-gray-500">({prob.code})</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Category, Other Problem, Service, Immediacy */}
                  <div className="w-full md:w-2/3 flex flex-col gap-4">
                    {/* First Row: Category and Other Problem */}
                    <div className="flex flex-col md:flex-row gap-2">
                      <div className="flex-1 bg-white rounded-lg shadow-md p-2 border">
                        <Label className="block mb-1 text-xs font-semibold text-gray-700">Category</Label>
                        <Select
                          value={problemInputs[dialog.id]?.category || ''}
                          onValueChange={value => setProblemInputs(prev => ({
                            ...prev,
                            [dialog.id]: { ...prev[dialog.id], category: value as string }
                          }))}
                        >
                          <SelectTrigger className="w-full h-8 text-xs border rounded shadow-sm bg-gray-50">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Medical">Medical</SelectItem>
                            <SelectItem value="Surgical">Surgical</SelectItem>
                            <SelectItem value="Pediatric">Pediatric</SelectItem>
                            <SelectItem value="Obstetric">Obstetric</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 bg-white rounded-lg shadow-md p-2 border">
                        <div className="flex items-center gap-2 mb-1">
                          <Checkbox
                            id={`otherProblems-${dialog.id}`}
                            checked={problemInputs[dialog.id]?.other || false}
                            onCheckedChange={checked => setProblemInputs(prev => ({
                              ...prev,
                              [dialog.id]: { ...prev[dialog.id], other: checked as boolean, problemName: '', problemCode: '', input: '' }
                            }))}
                            className="h-4 w-4"
                          />
                          <Label htmlFor={`otherProblems-${dialog.id}`} className="text-xs font-semibold text-gray-700">Other Problem</Label>
                        </div>
                        {problemInputs[dialog.id]?.other && (
                          <div className="relative">
                            <Input
                              id={`problemInput-${dialog.id}`}
                              value={problemInputs[dialog.id]?.input || ''}
                              onChange={e => handleInputChange(e, dialog.id)}
                              onFocus={() => {
                                const currentValue = problemInputs[dialog.id]?.input || '';
                                if (currentValue.trim().length >= 2 && searchResults.length === 0) {
                                  searchProblems(currentValue, patient.ssn || '800000035');
                                }
                              }}
                              placeholder="Search or enter a problem..."
                              className="w-full h-8 text-xs border rounded shadow-sm bg-gray-50 pr-8"
                              autoComplete="off"
                            />
                            {problemInputs[dialog.id]?.input && (
                              <button
                                type="button"
                                onClick={() => {
                                  setProblemInputs(prev => ({
                                    ...prev,
                                    [dialog.id]: {
                                      ...prev[dialog.id],
                                      input: '',
                                      problemName: '',
                                      problemCode: ''
                                    }
                                  }));
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                            {isProblemSearching ? (
                              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                                <div className="p-2 text-center text-xs text-gray-500">Searching...</div>
                              </div>
                            ) : problemSearchError ? (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-red-200 rounded-md shadow-lg">
                                <div className="p-2 text-center text-xs text-red-500">{problemSearchError}</div>
                              </div>
                            ) : searchResults.length > 0 && problemInputs[dialog.id]?.input?.trim() ? (
                              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {searchResults.map((result, index) => {
                                  const problemName = result.description || '';
                                  const problemCode = result.code || '';
                                  const displayText = problemName && problemCode ? 
                                    `${problemName} (${problemCode})` : 
                                    problemName || problemCode;
                                  
                                  const isSelected = problemInputs[dialog.id]?.problemName === problemName &&
                                    problemInputs[dialog.id]?.problemCode === problemCode;
                                  
                                  return (
                                    <div
                                      key={`${problemCode}-${index}`}
                                      className={`px-3 py-2 text-xs cursor-pointer flex items-center ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}
                                      onClick={() => {
                                        setProblemInputs(prev => ({
                                          ...prev,
                                          [dialog.id]: {
                                            ...prev[dialog.id],
                                            input: displayText,
                                            problemName: problemName,
                                            problemCode: problemCode,
                                          }
                                        }));
                                        clearProblemSearch();
                                      }}
                                    >
                                      {isSelected && (
                                        <Check className="mr-2 h-3.5 w-3.5 text-blue-500" />
                                      )}
                                      {!isSelected && <span className="w-5.5"></span>}
                                      <span className={isSelected ? 'font-medium' : ''}>
                                        {displayText}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Second Row: Immediacy and Service */}
                    <div className="flex flex-col md:flex-row gap-2">
                      {/* Immediacy section moved to left */}
                      <div className="flex-1 bg-white rounded-lg shadow-md p-2 border">
                        <div className="space-y-2">
                          <Label className="block mb-1 text-xs font-semibold text-gray-700">Immediacy</Label>
                          <div className="flex gap-4">
                            <RadioGroup
                              value={problemInputs[dialog.id]?.immediacy}
                              onValueChange={(value) => setProblemInputs(prev => ({
                                ...prev,
                                [dialog.id]: { ...prev[dialog.id], immediacy: value as string }
                              }))}
                              className="flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center space-x-1.5">
                                <RadioGroupItem value="ROUTINE" id={`routine-${dialog.id}`} className="h-4 w-4" />
                                <Label htmlFor={`routine-${dialog.id}`} className="text-xs cursor-pointer">Cronic </Label>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <RadioGroupItem value="URGENT" id={`urgent-${dialog.id}`} className="h-4 w-4" />
                                <Label htmlFor={`urgent-${dialog.id}`} className="text-xs cursor-pointer">Acute</Label>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <RadioGroupItem value="STAT" id={`stat-${dialog.id}`} className="h-4 w-4" />
                                <Label htmlFor={`stat-${dialog.id}`} className="text-xs cursor-pointer">Unknown</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>
                      </div>
                      
                      {/* Service section moved to right */}
                      <div className="flex-1 bg-white rounded-lg shadow-md p-2 border">
                        <Label className="block mb-1 text-xs font-semibold text-gray-700">Service</Label>
                        <Select
                          value={problemInputs[dialog.id]?.service || ''}
                          onValueChange={(value) => setProblemInputs(prev => ({
                            ...prev,
                            [dialog.id]: { ...prev[dialog.id], service: value as string }
                          }))}
                        >
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue placeholder="Select Service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CARDIOLOGY">Cardiology</SelectItem>
                            <SelectItem value="NEUROLOGY">Neurology</SelectItem>
                            <SelectItem value="ORTHOPEDICS">Orthopedics</SelectItem>
                            <SelectItem value="PULMONOLOGY">Pulmonology</SelectItem>
                            <SelectItem value="GASTROENTEROLOGY">Gastroenterology</SelectItem>
                            <SelectItem value="NEPHROLOGY">Nephrology</SelectItem>
                            <SelectItem value="ONCOLOGY">Oncology</SelectItem>
                            <SelectItem value="ENDOCRINOLOGY">Endocrinology</SelectItem>
                            <SelectItem value="RHEUMATOLOGY">Rheumatology</SelectItem>
                            <SelectItem value="GENERAL">General Medicine</SelectItem>
                            <SelectItem value="SURGERY">Surgery</SelectItem>
                            <SelectItem value="GYNECOLOGY">Gynecology</SelectItem>
                            <SelectItem value="UROLOGY">Urology</SelectItem>
                            <SelectItem value="DERMATOLOGY">Dermatology</SelectItem>
                            <SelectItem value="OPHTHALMOLOGY">Ophthalmology</SelectItem>
                            <SelectItem value="ENT">ENT</SelectItem>
                            <SelectItem value="PSYCHIATRY">Psychiatry</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* New Row: Status and Date */}
                    <div className="flex flex-col md:flex-row gap-2">
                      {/* Status Card */}
                      <div className="flex-1 bg-white rounded-lg shadow-md p-2 border">
                        <Label className="block mb-1 text-xs font-semibold text-gray-700">Status</Label>
                        <Select
                          value={problemInputs[dialog.id]?.status || ''}
                          onValueChange={(value) => setProblemInputs(prev => ({
                            ...prev,
                            [dialog.id]: { ...prev[dialog.id], status: value as string }
                          }))}
                        >
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                            
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Date Card */}
                      <div className="flex-1 bg-white rounded-lg shadow-md p-2 border">
                        <Label className="block mb-1 text-xs font-semibold text-gray-700">Date</Label>
                        <Input
                          type="date"
                          value={problemInputs[dialog.id]?.dateOnset || ''}
                          onChange={e => setProblemInputs(prev => ({
                            ...prev,
                            [dialog.id]: { ...prev[dialog.id], dateOnset: e.target.value }
                          }))}
                          className="w-full h-8 text-xs"
                        />
                      </div>
                    </div>

                    {/* Comment Card */}
                    <div className="bg-white rounded-lg shadow-md p-2 border">
                      <Label className="block mb-1 text-xs font-semibold text-gray-700">Comment</Label>
                      <Textarea
                        id={`problemComment-${dialog.id}`}
                        value={problemInputs[dialog.id]?.comment || ''}
                        onChange={e => setProblemInputs(prev => ({
                          ...prev,
                          [dialog.id]: { ...prev[dialog.id], comment: e.target.value }
                        }))}
                        placeholder="Add any additional comments..."
                        className="w-full h-16 text-xs border rounded shadow-sm bg-gray-50"
                      />
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex justify-end gap-2 mt-2">
                      <Button 
                        onClick={() => handleAddProblem(dialog.id)}
                        disabled={isSavingProblem}
                        className="px-4 text-xs h-8"
                      >
                        {isSavingProblem ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setProblemInputs((prev) => ({
                            ...prev,
                            [dialog.id]: {
                              input: '',
                              category: '',
                              other: false,
                              status: '',
                              immediacy: '',
                              dateOnset: '',
                              service: '',
                              comment: '',
                              problemName: '',
                              problemCode: ''
                            },
                          }));
                        }}
                        className="px-4 text-xs h-8"
                      >
                        Reset
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => closeFloatingDialog(dialog.id)}
                        className="px-4 text-xs h-8"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : dialog.type === 'medication' ? (
              <div className="flex flex-col gap-4 text-sm">
                {/* Medication Search and Quick Order Cards */}
                <div className="grid grid-cols-2 gap-4 mb-2">
                  {/* Medication Name Card */}
                  <Card className="flex flex-col bg-white border border-gray-200 shadow-md rounded-lg p-2">
                    <div className="text-sm font-semibold mb-1">Medication Name</div>
                    <div className="flex flex-row items-center gap-2 w-full">
                      <Input
                        id={`medication-name-${dialog.id}`}
                        value={medicationInputs[dialog.id]?.medicationName || ''}
                        onChange={(e) => setMedicationInputs(prev => ({
                          ...prev,
                          [dialog.id]: { ...(prev[dialog.id] || {}), medicationName: e.target.value }
                        }))}
                        className="flex-1 border border-gray-200 rounded-md px-3 py-2 bg-[#f5f5f5]"
                        placeholder="Enter medication name..."
                      />
                    </div>
                  </Card>
                  {/* Quick Order Card */}
                  <Card className="flex flex-col bg-white border border-gray-200 shadow-md rounded-lg p-2">
                    <div className="text-sm font-semibold mb-1">Quick Order</div>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-row items-center gap-2 w-full">
                        <Select
                          value=""
                          onValueChange={(value) => addSelectedMedication(value)}
                          className="bg-[#f5f5f5]"
                        >
                          <SelectTrigger className="w-full border border-gray-200 rounded-md px-3 py-2 bg-[#f5f5f5]">
                            <SelectValue placeholder="Select medications" />
                          </SelectTrigger>
                          <SelectContent>
                            {['Aspirin', 'Paracetamol', 'Amoxicillin', 'Metformin', 'Atorvastatin']
                              .filter(med => !selectedMedications.includes(med))
                              .map(med => (
                                <SelectItem key={med} value={med}>
                                  {med}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedMedications.map(med => (
                            <div key={med} className="flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {med}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSelectedMedication(med);
                                }}
                                className="ml-1 text-blue-500 hover:text-blue-700"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setShowQuickListDialog(dialog.id)}
                      >
                        Edit Quick List
                      </Button>
                    </div>
                  </Card>
                </div>
                {/* Medication Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full border rounded-lg overflow-hidden shadow-md">
                    <thead>
                      <tr className="bg-blue-100 text-blue-900">
                        <th className="px-4 py-2 text-left font-semibold">Medication Name</th>
                        <th className="px-4 py-2 text-left font-semibold">Dosage</th>
                        <th className="px-4 py-2 text-left font-semibold">Route</th>
                        <th className="px-4 py-2 text-left font-semibold">Schedule</th>
                        <th className="px-4 py-2 text-left font-semibold">PRN</th>
                        <th className="px-4 py-2 text-left font-semibold">Duration</th>
                        <th className="px-4 py-2 text-left font-semibold">Priority</th>
                        <th className="px-4 py-2 text-left font-semibold">Additional Dose Now</th>
                        <th className="px-4 py-2 text-left font-semibold">Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMedications.length > 0 ? (
                        selectedMedications.map((medication, index) => (
                          <tr key={index} className="even:bg-gray-50 odd:bg-white hover:bg-blue-50 transition">
                            <td className="px-4 py-2 font-semibold text-blue-700">
                              <div className="flex items-center justify-between">
                                {medication}
                                <button 
                                  onClick={() => removeSelectedMedication(medication)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ×
                                </button>
                              </div>
                            </td>
                        <td className="px-4 py-2">
                          <Input
                            value={medicationInputs[dialog.id]?.dosage || ''}
                            onChange={(e) => setMedicationInputs(prev => ({
                              ...prev,
                              [dialog.id]: { ...prev[dialog.id], dosage: e.target.value }
                            }))}
                            className="w-full border border-gray-200 rounded bg-[#f5f5f5]"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Select
                            value={medicationInputs[dialog.id]?.route || ''}
                            onValueChange={(value) => setMedicationInputs(prev => ({
                              ...prev,
                              [dialog.id]: { ...prev[dialog.id], route: value }
                            }))}
                          >
                            <SelectTrigger className="w-full border border-gray-200 rounded bg-[#f5f5f5]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PO">PO</SelectItem>
                              <SelectItem value="IV">IV</SelectItem>
                              <SelectItem value="IM">IM</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={medicationInputs[dialog.id]?.schedule || ''}
                            onChange={(e) => setMedicationInputs(prev => ({
                              ...prev,
                              [dialog.id]: { ...prev[dialog.id], schedule: e.target.value }
                            }))}
                            className="w-full border border-gray-200 rounded bg-[#f5f5f5]"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Switch
                            checked={medicationInputs[dialog.id]?.prn || false}
                            onCheckedChange={(checked) => setMedicationInputs(prev => ({
                              ...prev,
                              [dialog.id]: { ...prev[dialog.id], prn: checked }
                            }))}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={medicationInputs[dialog.id]?.duration || ''}
                              onChange={(e) => setMedicationInputs(prev => ({
                                ...prev,
                                [dialog.id]: { ...prev[dialog.id], duration: e.target.value }
                              }))}
                              className="w-20 border border-gray-200 rounded bg-[#f5f5f5]"
                            />
                            <Select
                              value={medicationInputs[dialog.id]?.durationUnit || ''}
                              onValueChange={(value) => setMedicationInputs(prev => ({
                                ...prev,
                                [dialog.id]: { ...prev[dialog.id], durationUnit: value }
                              }))}
                            >
                              <SelectTrigger className="w-32 border border-gray-200 rounded bg-[#f5f5f5]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="days">Days</SelectItem>
                                <SelectItem value="weeks">Weeks</SelectItem>
                                <SelectItem value="months">Months</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <Select
                            value={medicationInputs[dialog.id]?.priority || ''}
                            onValueChange={(value) => setMedicationInputs(prev => ({
                              ...prev,
                              [dialog.id]: { ...prev[dialog.id], priority: value }
                            }))}
                          >
                            <SelectTrigger className="w-full border border-gray-200 rounded bg-[#f5f5f5]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-2">
                          <Switch
                            checked={medicationInputs[dialog.id]?.additionalDoseNow || false}
                            onCheckedChange={(checked) => setMedicationInputs(prev => ({
                              ...prev,
                              [dialog.id]: { ...prev[dialog.id], additionalDoseNow: checked }
                            }))}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={medicationInputs[dialog.id]?.comment || ''}
                            onChange={(e) => setMedicationInputs(prev => ({
                              ...prev,
                              [dialog.id]: { ...prev[dialog.id], comment: e.target.value }
                            }))}
                            className="w-full border border-gray-200 rounded bg-[#f5f5f5]"
                          />
                        </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="text-center py-4 text-gray-500">
                            No medications selected. Use the dropdown above to add medications.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Save/Reset/Close buttons */}
                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    onClick={() => handleAddMedication(dialog.id)}
                    className="px-4 text-xs h-8"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => resetMedicationForm(dialog.id)}
                    className="px-4 text-xs h-8"
                  >
                    Reset
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => closeFloatingDialog(dialog.id)}
                    className="px-4 text-xs h-8"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : dialog.type === 'lab' ? (
              <div className="flex flex-col gap-4 text-sm">
                {/* Lab Test Name and Quick Order Cards */}
                <div className="grid grid-cols-2 gap-4 mb-2">
                  {/* Lab Test Name Card */}
                  <Card className="flex flex-col bg-white border border-gray-200 shadow-md rounded-lg p-2">
                    <div className="text-sm font-semibold mb-1">Lab Test Name</div>
                    <div className="flex flex-row items-center gap-2 w-full">
                      <Input
                        value={labTestInput}
                        onChange={e => setLabTestInput(e.target.value)}
                        className="flex-1 border border-gray-200 rounded-md px-3 py-2 bg-[#f5f5f5]"
                        placeholder="Enter lab test name..."
                      />
                    </div>
                  </Card>
                  {/* Quick Order Card */}
                  <Card className="flex flex-col bg-white border border-gray-200 shadow-md rounded-lg p-2">
                    <div className="text-sm font-semibold mb-1">Quick Order</div>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-row items-center gap-2 w-full">
                        <Select
                          value=""
                          onValueChange={(value) => addLabTest(value)}
                          className="bg-[#f5f5f5]"
                        >
                          <SelectTrigger className="w-full border border-gray-200 rounded-md px-3 py-2 bg-[#f5f5f5]">
                            <SelectValue placeholder="Select quick order" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CBC">CBC</SelectItem>
                            <SelectItem value="LFT">LFT</SelectItem>
                            <SelectItem value="KFT">KFT</SelectItem>
                            <SelectItem value="Blood Sugar">Blood Sugar</SelectItem>
                            <SelectItem value="Lipid Profile">Lipid Profile</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setShowQuickListDialog(dialog.id)}
                      >
                        Edit Quick List
                      </Button>
                    </div>
                  </Card>
                </div>
                {/* Lab Test Table */}
                {labTests.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border rounded-lg overflow-hidden shadow-md">
                      <thead>
                        <tr className="bg-blue-100 text-blue-900">
                          <th className="px-4 py-2 text-left font-semibold">Lab Investigation Name</th>
                          <th className="px-4 py-2 text-left font-semibold">Collect Sample</th>
                          <th className="px-4 py-2 text-left font-semibold">Specimen</th>
                          <th className="px-4 py-2 text-left font-semibold">Urgency</th>
                          <th className="px-4 py-2 text-left font-semibold">How Often</th>
                          <th className="px-4 py-2 text-left font-semibold">Comments</th>
                          <th className="px-4 py-2 text-center font-semibold">Remove</th>
                          <th className="px-4 py-2 text-center font-semibold">Save Quick Order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {labTests.map((test, idx) => (
                          <tr key={test.name} className="even:bg-gray-50 odd:bg-white hover:bg-blue-50 transition">
                            <td className="px-4 py-2 font-semibold text-blue-700">{test.name}</td>
                            <td className="px-4 py-2">
                              <Select
                                value={test.collectSample}
                                onValueChange={value => {
                                  const updated = [...labTests];
                                  updated[idx].collectSample = value;
                                  setLabTests(updated);
                                }}
                              >
                                <SelectTrigger className="w-full border border-gray-200 rounded bg-[#f5f5f5]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="LAVENDER-WB">LAVENDER-WB</SelectItem>
                                  <SelectItem value="YELLOW-SERUM">YELLOW-SERUM</SelectItem>
                                  <SelectItem value="RED-CLOT">RED-CLOT</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-2">
                              <Select
                                value={test.specimen}
                                onValueChange={value => {
                                  const updated = [...labTests];
                                  updated[idx].specimen = value;
                                  setLabTests(updated);
                                }}
                              >
                                <SelectTrigger className="w-full border border-gray-200 rounded bg-[#f5f5f5]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="BLOOD">BLOOD</SelectItem>
                                  <SelectItem value="URINE">URINE</SelectItem>
                                  <SelectItem value="SERUM">SERUM</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-2">
                              <Select
                                value={test.urgency}
                                onValueChange={value => {
                                  const updated = [...labTests];
                                  updated[idx].urgency = value;
                                  setLabTests(updated);
                                }}
                              >
                                <SelectTrigger className="w-full border border-gray-200 rounded bg-[#f5f5f5]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ROUTINE">ROUTINE</SelectItem>
                                  <SelectItem value="URGENT">URGENT</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-2">
                              <Select
                                value={test.howOften}
                                onValueChange={value => {
                                  const updated = [...labTests];
                                  updated[idx].howOften = value;
                                  setLabTests(updated);
                                }}
                              >
                                <SelectTrigger className="w-full border border-gray-200 rounded bg-[#f5f5f5]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ONCE">ONCE</SelectItem>
                                  <SelectItem value="DAILY">DAILY</SelectItem>
                                  <SelectItem value="WEEKLY">WEEKLY</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                value={test.comments}
                                onChange={e => {
                                  const updated = [...labTests];
                                  updated[idx].comments = e.target.value;
                                  setLabTests(updated);
                                }}
                                className="w-full border border-gray-200 rounded bg-[#f5f5f5]"
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Button size="icon" variant="ghost" onClick={() => setLabTests(tests => tests.filter((_, i) => i !== idx))}>
                                <Trash2 className="h-5 w-5 text-red-500" />
                                <span className="sr-only">Remove</span>
                              </Button>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Button size="icon" variant="ghost" onClick={() => {/* Save quick order logic here */}}>
                                <Save className="h-5 w-5 text-blue-500" />
                                <span className="sr-only">Save Quick Order</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Save/Reset/Close buttons */}
                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    onClick={() => saveLabTests(dialog.id)}
                    className="px-4 text-xs h-8"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLabTests([])}
                    className="px-4 text-xs h-8"
                  >
                    Reset
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => closeFloatingDialog(dialog.id)}
                    className="px-4 text-xs h-8"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : dialog.type === 'radiology' ? (
              <div className="flex flex-col gap-4 text-sm">
                {/* Radiology Test Name and Quick Order Cards */}
                <div className="grid grid-cols-2 gap-4 mb-2">
                  {/* Radiology Test Name Card */}
                  <Card className="flex flex-col bg-white border border-gray-200 shadow-md rounded-lg p-2">
                    <div className="text-sm font-semibold mb-1">Radiology Test Name</div>
                    <div className="flex flex-row items-center gap-2 w-full">
                      <Input
                        value={radiologyInputs[dialog.id]?.type || ''}
                        onChange={(e) =>
                          setRadiologyInputs((prev) => ({
                            ...prev,
                            [dialog.id]: { ...prev[dialog.id], type: e.target.value },
                          }))
                        }
                        className="flex-1 border border-gray-200 rounded-md px-3 py-2 bg-[#f5f5f5]"
                        placeholder="Enter radiology test name..."
                      />
                      <Button
                        size="sm"
                        className="ml-2"
                        onClick={() => {
                          addRadiologyTest(radiologyInputs[dialog.id]?.type || '');
                          setRadiologyInputs(prev => ({
                            ...prev,
                            [dialog.id]: { ...prev[dialog.id], type: '' },
                          }));
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </Card>
                  
                  {/* Quick Order Card */}
                  <Card className="flex flex-col bg-white border border-gray-200 shadow-md rounded-lg p-2">
                    <div className="text-sm font-semibold mb-1">Quick Order</div>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-row items-center gap-2 w-full">
                        <Select
                          value=""
                          onValueChange={(value) => {
                            addRadiologyTest(value);
                          }}
                          className="bg-[#f5f5f5]"
                        >
                          <SelectTrigger className="w-full border border-gray-200 rounded-md px-3 py-2 bg-[#f5f5f5]">
                            <SelectValue placeholder="Select quick order" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="X-Ray">X-Ray</SelectItem>
                            <SelectItem value="MRI">MRI</SelectItem>
                            <SelectItem value="CT Scan">CT Scan</SelectItem>
                            <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setShowQuickListDialog(dialog.id)}
                      >
                        Edit Quick List
                      </Button>
                    </div>
                  </Card>
                </div>

                {/* Radiology Test Table */}
                {radiologyTests.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border rounded-lg overflow-hidden shadow-md">
                      <thead>
                        <tr className="bg-blue-100 text-blue-900">
                          <th className="px-4 py-2 text-left font-semibold">Procedure Name</th>
                          <th className="px-4 py-2 text-left font-semibold">Requested Date</th>
                          <th className="px-4 py-2 text-left font-semibold">Submit To</th>
                          <th className="px-4 py-2 text-left font-semibold">Urgency</th>
                          <th className="px-4 py-2 text-left font-semibold">Modifiers</th>
                          <th className="px-4 py-2 text-left font-semibold">Transport</th>
                          <th className="px-4 py-2 text-left font-semibold">Reason for Study</th>
                          <th className="px-4 py-2 text-center font-semibold">Remove</th>
                          <th className="px-4 py-2 text-center font-semibold">Save Quick Order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {radiologyTests.map((test, idx) => (
                          <tr key={test.id} className="even:bg-gray-50 odd:bg-white hover:bg-blue-50 transition">
                            <td className="px-4 py-2 font-semibold text-blue-700">
                              <Input
                                value={test.name}
                                onChange={(e) => updateRadiologyTest(test.id, 'name', e.target.value)}
                                className="w-full border border-gray-200 rounded bg-[#f5f5f5]"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                type="date"
                                value={test.requestedDate}
                                onChange={(e) => updateRadiologyTest(test.id, 'requestedDate', e.target.value)}
                                className="w-full border border-gray-200 rounded bg-[#f5f5f5]"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                value={test.submitTo}
                                onChange={(e) => updateRadiologyTest(test.id, 'submitTo', e.target.value)}
                                className="w-full border border-gray-200 rounded bg-[#f5f5f5]"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Select
                                value={test.urgency}
                                onValueChange={(value) => updateRadiologyTest(test.id, 'urgency', value)}
                              >
                                <SelectTrigger className="w-full border border-gray-200 rounded bg-[#f5f5f5]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ROUTINE">ROUTINE</SelectItem>
                                  <SelectItem value="URGENT">URGENT</SelectItem>
                                  <SelectItem value="STAT">STAT</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                value={test.modifiers}
                                onChange={(e) => updateRadiologyTest(test.id, 'modifiers', e.target.value)}
                                className="w-full border border-gray-200 rounded bg-[#f5f5f5]"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                value={test.transport}
                                onChange={(e) => updateRadiologyTest(test.id, 'transport', e.target.value)}
                                className="w-full border border-gray-200 rounded bg-[#f5f5f5]"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                value={test.reason}
                                onChange={(e) => updateRadiologyTest(test.id, 'reason', e.target.value)}
                                className="w-full border border-gray-200 rounded bg-[#f5f5f5]"
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Button size="icon" variant="ghost" onClick={() => removeRadiologyTest(test.id)}>
                                <Trash2 className="h-5 w-5 text-red-500" />
                                <span className="sr-only">Remove</span>
                              </Button>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Button size="icon" variant="ghost" onClick={() => saveQuickOrder(test)}>
                                <Save className="h-5 w-5 text-blue-500" />
                                <span className="sr-only">Save Quick Order</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Save/Reset/Close buttons */}
                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    onClick={() => {
                      toast.success('Radiology order placed!');
                      closeFloatingDialog(dialog.id);
                    }}
                    className="px-4 text-xs h-8"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRadiologyTests([])}
                    className="px-4 text-xs h-8"
                  >
                    Reset
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => closeFloatingDialog(dialog.id)}
                    className="px-4 text-xs h-8"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : dialog.type === 'report' ? (
              <div className="flex flex-col gap-4 text-sm">
                {/* Report Search */}
                <Card className="flex flex-col bg-white border border-gray-200 shadow-md rounded-lg p-2">
                  <div className="text-sm font-semibold mb-1">Report Search</div>
                  <div className="flex flex-row items-center gap-2 w-full">
                    <Input
                      id={`report-search-${dialog.id}`}
                      value={reportInputs[dialog.id]?.search || ''}
                      onChange={(e) =>
                        setReportInputs((prev) => ({
                          ...prev,
                          [dialog.id]: { ...prev[dialog.id], search: e.target.value },
                        }))
                      }
                      className="w-full border border-gray-200 rounded-md px-3 py-2 bg-[#f5f5f5]"
                    />
                  </div>
                </Card>

                {/* Quick Search */}
                <Card className="flex flex-col bg-white border border-gray-200 shadow-md rounded-lg p-2">
                  <div className="text-sm font-semibold mb-1">Quick Search</div>
                  <div className="flex flex-row items-center gap-2 w-full">
                    <Input
                      id={`quick-search-${dialog.id}`}
                      value={reportInputs[dialog.id]?.quickSearch || ''}
                      onChange={(e) =>
                        setReportInputs((prev) => ({
                          ...prev,
                          [dialog.id]: { ...prev[dialog.id], quickSearch: e.target.value },
                        }))
                      }
                      className="w-full border border-gray-200 rounded-md px-3 py-2 bg-[#f5f5f5]"
                    />
                  </div>
                </Card>
                {/* Selected Reports */}
                <Card className="flex flex-col bg-white border border-gray-200 shadow-md rounded-lg p-2">
                  <div className="text-sm font-semibold mb-1">Selected Reports</div>
                  <div className="flex flex-row items-center gap-2 w-full">
                    <div className="flex flex-col gap-2">
                      {['LIVER FUNCTION TEST', 'DSDNA AB', 'THYROID PANEL']
                        .filter((test) => reportInputs[dialog.id]?.selected.includes(test))
                        .map((test, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              checked={reportInputs[dialog.id]?.selected.includes(test)}
                              onCheckedChange={(checked) => {
                                setReportInputs((prev) => {
                                  const current = prev[dialog.id]?.selected || [];
                                  return {
                                    ...prev,
                                    [dialog.id]: {
                                      ...prev[dialog.id],
                                      selected: checked
                                        ? [...current, test]
                                        : current.filter((item) => item !== test),
                                    },
                                  };
                                });
                              }}
                            />
                            <span>{test}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </Card>

                {/* Save/Reset/Close buttons */}
                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    onClick={() => {
                      toast.success('Report order confirmed');
                      closeFloatingDialog(dialog.id);
                    }}
                    className="px-4 text-xs h-8"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setReportInputs((prev) => ({
                        ...prev,
                        [dialog.id]: { search: '', quickSearch: '', selected: [] },
                      }))
                    }
                    className="px-4 text-xs h-8"
                  >
                    Reset
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => closeFloatingDialog(dialog.id)}
                    className="px-4 text-xs h-8"
                  >
                    Close
                  </Button>
                </div>
              </div>
                                                ) : dialog.type === 'allergies' ? (
                          <div className="flex flex-col gap-4 text-sm">
                            {/* Top Row Cards */}
                            <div className="grid grid-cols-3 gap-1">
                              {/* Allergy Name Card */}
                              <Card className="flex flex-col bg-white border border-gray-200 shadow-md rounded-lg p-2">
                                <div className="text-sm font-semibold mb-1">Enter Allergy</div>
                                <div className="flex flex-row items-center gap-2 w-full">
                                  <Input
                                    id={`allergies-${dialog.id}`}
                                    value={allergyInputs[dialog.id]?.allergies || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setAllergyInputs(prev => ({
                                        ...prev,
                                        [dialog.id]: { ...(prev[dialog.id] || {}), allergies: value }
                                      }));
                                      handleAllergySearchChange(value);
                                    }}
                                    onFocus={() => allergySearchTerm.trim() && setShowAllergyDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowAllergyDropdown(false), 200)}
                                    placeholder="Start typing to search allergies..."
                                    className="flex-1 border border-gray-200 rounded-md px-3 py-2 bg-[#f5f5f5]"
                                  />
                                </div>
                              </Card>
            
                              {/* Nature of Reaction Card */}
                              <Card className="flex flex-col bg-white border border-gray-200 shadow-md rounded-lg p-2">
                                <div className="text-sm font-semibold mb-1">Nature of Reaction</div>
                                <Select
                                  value={allergyInputs[dialog.id]?.natureOfReaction || ''}
                                  onValueChange={(value) => setAllergyInputs(prev => ({
                                    ...prev,
                                    [dialog.id]: { ...prev[dialog.id], natureOfReaction: value }
                                  }))}
                                >
                                  <SelectTrigger className="w-full border border-gray-200 rounded-md px-3 py-2 bg-[#f5f5f5]">
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Allergy">Allergy</SelectItem>
                                    <SelectItem value="Intolerance">Intolerance</SelectItem>
                                    <SelectItem value="Side Effect">Side Effect</SelectItem>
                                  </SelectContent>
                                </Select>
                              </Card>

                              {/* Type Card */}
                              <Card className="flex flex-col bg-white border border-gray-200 shadow-md rounded-lg p-2">
                                <div className="text-sm font-semibold mb-1">Type</div>
                                <RadioGroup 
                                  value={allergyInputs[dialog.id]?.reactionType || ''}
                                  onValueChange={(value) => setAllergyInputs(prev => ({
                                    ...prev,
                                    [dialog.id]: { ...prev[dialog.id], reactionType: value as 'Observed' | 'Historical' | '' }
                                  }))}
                                  className="flex gap-4 mt-2"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Observed" id={`observed-${dialog.id}`} />
                                    <Label htmlFor={`observed-${dialog.id}`} className="text-xs">Observed</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Historical" id={`historical-${dialog.id}`} />
                                    <Label htmlFor={`historical-${dialog.id}`} className="text-xs">Historical</Label>
                                  </div>
                                </RadioGroup>
                              </Card>
                            </div>
            
                            {/* Conditional fields for 'Observed' type */}
                            {allergyInputs[dialog.id]?.reactionType === 'Observed' && (
                              <div className="grid grid-cols-2 gap-1 mt-1">
                                {/* Reaction Date/Time Card */}
                                <Card className="flex flex-col bg-white border border-gray-200 shadow-md rounded-lg p-2">
                                  <div className="text-sm font-semibold mb-1">Reaction Date/Time</div>
                                  <Input
                                    type="datetime-local"
                                    value={allergyInputs[dialog.id]?.reactionDateTime || ''}
                                    onChange={e => setAllergyInputs(prev => ({
                                      ...prev,
                                      [dialog.id]: { ...prev[dialog.id], reactionDateTime: e.target.value }
                                    }))}
                                    className="w-full border border-gray-200 rounded-md px-3 py-2 bg-[#f5f5f5]"
                                  />
                                </Card>
            
                                {/* Severity Card */}
                                <Card className="flex flex-col bg-white border border-gray-200 shadow-md rounded-lg p-2">
                                  <div className="text-sm font-semibold mb-1">Severity</div>
                                  <Select
                                    value={allergyInputs[dialog.id]?.severity || ''}
                                    onValueChange={(value) => setAllergyInputs(prev => ({
                                      ...prev,
                                      [dialog.id]: { ...prev[dialog.id], severity: value }
                                    }))}
                                  >
                                    <SelectTrigger className="w-full border border-gray-200 rounded-md px-3 py-2 bg-[#f5f5f5]">
                                      <SelectValue placeholder="Select severity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Mild">Mild</SelectItem>
                                      <SelectItem value="Moderate">Moderate</SelectItem>
                                      <SelectItem value="Severe">Severe</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </Card>
                              </div>
                            )}
            
                            {/* Sign/Symptoms & Date/Time Row */}
                            <div className="grid grid-cols-2 gap-1 mt-1">
                                {/* Sign/Symptoms Card */}
                                <Card className="flex flex-col bg-white border border-gray-200 shadow-md rounded-lg p-2">
                                <div className="text-sm font-semibold mb-1">Sign/Symptoms</div>
                                <Select
                                    value={allergyInputs[dialog.id]?.signSymptom || ''}
                                    onValueChange={(value) => setAllergyInputs(prev => ({
                                    ...prev,
                                    [dialog.id]: { ...prev[dialog.id], signSymptom: value }
                                    }))}
                                >
                                    <SelectTrigger className="w-full border border-gray-200 rounded-md px-3 py-2 bg-[#f5f5f5]">
                                    <SelectValue placeholder="Select sign/symptom" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    <SelectItem value="Rash">Rash</SelectItem>
                                    <SelectItem value="Hives">Hives</SelectItem>
                                    <SelectItem value="Swelling">Swelling</SelectItem>
                                    <SelectItem value="Difficulty Breathing">Difficulty Breathing</SelectItem>
                                    <SelectItem value="Nausea">Nausea</SelectItem>
                                    <SelectItem value="Dizziness">Dizziness</SelectItem>
                                    </SelectContent>
                                </Select>
                                </Card>

                                {/* Date/Time Card */}
                                <Card className="flex flex-col bg-white border border-gray-200 shadow-md rounded-lg p-2">
                                    <div className="text-sm font-semibold mb-1">Date/Time</div>
                                    <Input
                                        type="datetime-local"
                                        value={allergyInputs[dialog.id]?.dateTime || ''}
                                        onChange={e => setAllergyInputs(prev => ({
                                        ...prev,
                                        [dialog.id]: { ...prev[dialog.id], dateTime: e.target.value }
                                        }))}
                                        className="w-full border border-gray-200 rounded-md px-3 py-2 bg-[#f5f5f5]"
                                    />
                                </Card>
                            </div>
            
                            {/* Comment Card */}
                            <Card className="flex flex-col bg-white border border-gray-200 shadow-md rounded-lg mt-1 p-2">
                              <div className="text-sm font-semibold mb-1">Comment</div>
                              <Textarea
                                id={`comment-${dialog.id}`}
                                value={allergyInputs[dialog.id]?.comment || ''}
                                onChange={(e) => setAllergyInputs(prev => ({
                                  ...prev,
                                  [dialog.id]: { ...prev[dialog.id], comment: e.target.value }
                                }))}
                                placeholder="Add any additional comments"
                                className="h-24 w-full border border-gray-200 rounded-md px-3 py-2 bg-[#f5f5f5]"
                              />
                            </Card>
            
                            {/* Action Buttons */}
                            <div className="flex justify-end gap-2 mt-4">
                              <Button 
                                onClick={() => handleAddAllergy(dialog.id)}
                                className="px-4 text-xs h-8"
                              >
                                Save
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => {
                                  setAllergyInputs(prev => ({
                                    ...prev,
                                    [dialog.id]: {
                                      allergies: '',
                                      natureOfReaction: '',
                                      reactionType: '',
                                      signSymptom: '',
                                    
                                      dateTime: '',
                                      reactionDateTime: '',
                                      severity: '',
                                      comment: ''
                                    }
                                  }));
                                }}
                                className="px-4 text-xs h-8"
                              >
                                Reset
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => closeFloatingDialog(dialog.id)}
                                className="px-4 text-xs h-8"
                              >
                                Close
                              </Button>
                            </div>
                          </div>
            ) : dialog.type === 'info-item' ? (
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4 text-sm">
                  <Label htmlFor={`itemName-${dialog.id}`} className="text-right">Item</Label>
                  <Input
                    id={`itemName-${dialog.id}`}
                    value={infoItemInputs[dialog.id]?.item}
                    onChange={(e) => setInfoItemInputs((prev) => ({
                      ...prev,
                      [dialog.id]: { ...prev[dialog.id], item: e.target.value },
                    }))}
                    className="col-span-3"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button onClick={() => handleSaveNewInfoItem(dialog.id)}>Add Item</Button>
                  <Button variant="outline" onClick={() => closeFloatingDialog(dialog.id)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Unsupported dialog type
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Problem Detail Dialog */}
      <Dialog open={showProblemDialog} onOpenChange={setShowProblemDialog}>
        <DialogContent className="sm:max-w-[425px] p-0 rounded-lg overflow-hidden" style={{ padding: 0 }}>
          <div className="bg-sky-200 px-3 py-2 text-sm font-semibold text-sky-800">Problem View</div> {/* Keep existing header class */}
          <div className="p-4 text-sm">
            <div className="mb-3 font-bold">{selectedProblem?.description || 'Anemia (D64.9)'}</div>
            <div className="grid grid-cols-1 gap-1">
              <div><span className="font-medium">Onset:</span> {selectedProblem?.dateOnset}</div> {/* Use actual data */}
              <div><span className="font-medium">Status:</span> {selectedProblem?.status}</div> {/* Use actual data */}
              <div><span className="font-medium">SC Cond:</span> NO</div>
              <div><span className="font-medium">Exposure:</span> None</div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-1">
              <div><span className="font-medium">Provider:</span> DOCTOR,SANSYS</div>
              <div><span className="font-medium">Clinic:</span> ICU ONE</div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-1 text-muted-foreground text-xs">
              <div>Recorded: , by DOCTOR,SANSYS</div>
              <div>Entered: 1/10/24, by DOCTOR,SANSYS</div>
              <div>Updated: 1/10/24</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Allergy Detail Dialog */}
      <Dialog open={showAllergyDialog} onOpenChange={setShowAllergyDialog}>
        <DialogContent className="sm:max-w-[425px] p-0 rounded-lg overflow-hidden" style={{ padding: 0 }}>
          <div className="bg-sky-200 px-3 py-2 text-sm font-semibold text-sky-800">Allergy View</div>
          <div className="p-4 text-sm">
            <div className="mb-3 font-bold">{`${selectedAllergy?.allergen} - ${selectedAllergy?.reaction}`}</div>
            <div className="grid grid-cols-1 gap-1">
              <div><span className="font-medium">Severity:</span> {selectedAllergy?.severity}</div>
              <div><span className="font-medium">Onset:</span> {selectedAllergy?.dateOnset || 'Not specified'}</div>
              <div><span className="font-medium">Status:</span> {selectedAllergy?.status}</div>
              <div><span className="font-medium">Treatment:</span> {selectedAllergy?.treatment || 'None'}</div>
              <div><span className="font-medium">Notes:</span> {selectedAllergy?.notes || 'None'}</div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-1">
              <div><span className="font-medium">Created By:</span> {selectedAllergy?.createdBy}</div>
              <div><span className="font-medium">Created At:</span> {selectedAllergy?.createdAt ? new Date(selectedAllergy.createdAt).toLocaleString() : 'Not specified'}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
