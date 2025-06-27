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
type DialogType = 'problem' | 'medication' | 'info-item' | 'allergies' | 'radiology' | 'report';

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
  
  // Use the useMedications hook to fetch medications
  const { data: medications = initialMedications, loading: medicationsLoading, error: medicationsError } = useMedications();

  // Use the useProblemSave hook
  const { saveProblem, isLoading: isSavingProblem } = useProblemSave();
  
  // Use the useProblemSearch hook
  const { 
    searchProblems, 
    searchResults, 
    isSearching, 
    searchError, 
    clearSearch 
  } = useProblemSearch();

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

  // Dialog input states
  const [medicationInputs, setMedicationInputs] = useState<
    Record<string, { name: string; reason: string; amount: string; timing: string }>
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
        [id]: { name: '', reason: '', amount: '', timing: '' },
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
    if (!input?.name.trim()) {
      toast.error('Medication name is required');
      return;
    }

    const newMed: Medication = {
      id: Date.now().toString(),
      name: input.name,
      reason: input.reason || 'General',
      amount: input.amount || 'N/A',
      timing: input.timing || 'N/A',
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

  // Handle problem search input change with debounce
  const handleSearchChange = useCallback(
    debounce((searchTerm: string, dialogId: string) => {
      if (searchTerm.trim().length >= 2) {  // Only search if 2 or more characters
        console.log('Initiating search for:', searchTerm);
        searchProblems(searchTerm, patient.ssn || '800000035');
      } else {
        console.log('Search term too short, clearing results');
        clearSearch();
      }
    }, 300),
    [searchProblems, patient.ssn, clearSearch]
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
      clearSearch();
    } else if (value.trim().length >= 2) {
      console.log('Triggering search for:', value);
      handleSearchChange(value, dialogId);
    } else {
      console.log('Search term too short, not searching');
      clearSearch();
    }
  }, [handleSearchChange, clearSearch]);

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
    clearSearch();
  }, [clearSearch]);

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-auto bg-background relative">
      {/* Top Row: Problems, Chart, Vital Signs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-2">
        <Card className="lg:col-span-3 shadow-lg">
          <ShadcnCardHeader className="flex flex-row items-center justify-between pt-2 pb-0 px-3">
            <div className="flex items-center space-x-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Problems</CardTitle>
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">{problemsToShow.length}</Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => openFloatingDialog('problem', 'Add New Problem')}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span className="sr-only">Add Problem</span>
            </Button>
          </ShadcnCardHeader>
          <CardContent className="p-0 max-h-32 overflow-y-auto no-scrollbar">
            <Table>
              <TableBody>
                {problemsToShow.map((problem, index) => (
                  <TableRow key={problem.id} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                    <TableCell className="px-2 py-1">
                      <div
                        className="font-medium text-xs cursor-pointer"
                        onClick={() => {
                          setSelectedProblem(problem);
                          setShowProblemDialog(true);
                        }}
                      >{('description' in problem ? problem.description : (problem as any).problem)}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {problemsToShow.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">No problems listed.</p>
            )}
          </CardContent>
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
      <div className="grid grid-cols-1 md:grid-cols-10 gap-3 mb-2">
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
                <CardContent className="p-0 h-[120px] overflow-y-auto scrollbar-hide">
                  <style jsx global>{`
                    .scrollbar-hide::-webkit-scrollbar {
                      display: none;
                    }
                    .scrollbar-hide {
                      -ms-overflow-style: none;
                      scrollbar-width: none;
                    }
                  `}</style>
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
                        openFloatingDialog('report', 'Order Report');
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-1">
        {thirdRowInformationalCardTitles.map((title) => {
          const IconComponent = infoCardIcons[title] || FileText;
          const items = dynamicPageCardContent[title] || [];
          const isLoading = title === 'Clinical Notes' ? clinicalNotesLoading : false;
          const itemCount = title === 'Clinical Notes' ? clinicalNotes?.length || 0 : items.length;
          const displayItems = title === 'Clinical Notes' ? clinicalNotes : items;
          
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
                  onClick={() => {
                    if (title === 'Clinical Notes') {
                      window.location.href = '/clinical-notes';
                    } else {
                      openFloatingDialog('info-item', `Add New Item to ${title}`, { title });
                    }
                  }}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span className="sr-only">Edit {title}</span>
                </Button>
              </ShadcnCardHeader>
              <CardContent className="p-0 h-[120px] overflow-y-auto scrollbar-hide">
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
                      displayItems.map((item: any, index: number) => (
                        <TableRow 
                          key={item.id || index}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="p-0">
                            <div className="text-xs px-3 py-1.5">
                              {item.note || item.title || item.name || item.notesTitle || 'Unnamed Item'}
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
          className="fixed bg-background border rounded-lg shadow-xl max-h-[90vh] overflow-y-auto w-[80%] max-w-[1200px] z-50"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) translate(${dialog.position.x}px, ${dialog.position.y}px)`,
          }}
          onKeyDown={(e) => handleKeyDown(dialog.id, e)}
          tabIndex={0}
        >
          <div
            className="flex justify-between items-center bg-muted p-2 cursor-grab"
            onMouseDown={(e) => handleMouseDown(dialog.id, e)}
          >
            <h2 className="text-base font-semibold">{dialog.title}</h2>
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground flex items-center gap-x-4">
                <span>Patient ID: 148</span>
                <span>Name: Anonymous One</span>
                <span>Age: 65</span>
                <span>Sex: FEMALE</span>
                <span>Patient Type: In Patient</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => closeFloatingDialog(dialog.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-4">
            {dialog.type === 'problem' ? (
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="w-1/2">
                    <Label className="font-medium mb-1 block">Categories</Label>
                    <Select
                      value={problemInputs[dialog.id]?.category}
                      onValueChange={(value) =>
                        setProblemInputs((prev) => ({
                          ...prev,
                          [dialog.id]: { ...prev[dialog.id], category: value as ProblemCategory },
                        }))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Common Problems" className="text-xs py-1.5">Common Problems</SelectItem>
                        <SelectItem value="Other" className="text-xs py-1.5">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <Checkbox
                      id={`otherProblems-${dialog.id}`}
                      checked={problemInputs[dialog.id]?.other || false}
                      onCheckedChange={(checked) =>
                        setProblemInputs((prev) => ({
                          ...prev,
                          [dialog.id]: { ...prev[dialog.id], other: checked as boolean },
                        }))
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`otherProblems-${dialog.id}`} className="text-sm">
                      Other Problems
                    </Label>
                  </div>
                </div>

                {/* Preferred Problems List */}
                {!problemInputs[dialog.id]?.other && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Preferred Problems</h4>
                    <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1 max-h-40 overflow-y-auto p-2 border rounded bg-muted/50">
                      {[
                        { name: "Anemia", code: "D64.9" },
                        { name: "Diabetes", code: "E11.9" },
                        { name: "Dehydration", code: "E86.0" },
                        { name: "Burns", code: "T30.0" },
                        { name: "Post operative discharge", code: "T81.4XXA" }
                      ].map((problem, index) => {
                        const problemText = `${problem.name} (${problem.code})`;
                        const isSelected = problemInputs[dialog.id]?.problemName === problem.name && 
                                         problemInputs[dialog.id]?.problemCode === problem.code;
                        
                        return (
                          <div 
                            key={index}
                            className="flex items-center gap-2 p-1 hover:bg-accent hover:text-accent-foreground rounded cursor-pointer"
                            onClick={() => {
                              // Toggle selection
                              if (isSelected) {
                                // Clear selection if clicking on already selected item
                                setProblemInputs(prev => ({
                                  ...prev,
                                  [dialog.id]: {
                                    ...prev[dialog.id],
                                    input: '',
                                    problemName: '',
                                    problemCode: ''
                                  },
                                }));
                              } else {
                                // Set the problem without showing the search field
                                setProblemInputs(prev => ({
                                  ...prev,
                                  [dialog.id]: {
                                    ...prev[dialog.id],
                                    input: problemText,
                                    other: false,
                                    problemName: problem.name,
                                    problemCode: problem.code
                                  },
                                }));
                                // Clear any existing search results
                                clearSearch();
                              }
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => {}} // Empty handler to prevent React warning
                              className="h-3 w-3 rounded border-gray-300 text-primary focus:ring-primary"
                              onClick={(e) => e.stopPropagation()} // Prevent double trigger with parent div
                            />
                            <span>{problemText}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Problem description input */}
                <div className="relative w-full mt-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <Label htmlFor={`problemInput-${dialog.id}`} className="w-[120px] min-w-[120px] shrink-0">
                        {problemInputs[dialog.id]?.other ? 'Search Problem' : 'Problem'}
                      </Label>
                      <div className="relative flex-1">
                        <Input
                          id={`problemInput-${dialog.id}`}
                          value={problemInputs[dialog.id]?.input || ''}
                          onChange={(e) => handleInputChange(e, dialog.id)}
                          onFocus={() => {
                            // Trigger search if we have a value but no results yet
                            const currentValue = problemInputs[dialog.id]?.input || '';
                            if (currentValue.trim().length >= 2 && searchResults.length === 0) {
                              console.log('Input focused, triggering search');
                              searchProblems(currentValue, patient.ssn || '800000035');
                            }
                          }}
                          placeholder="Start typing to search problems (min 2 characters)..."
                          className="flex-1 pr-10"
                          autoComplete="off"
                        />
                        {isSearching ? (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          </div>
                        ) : problemInputs[dialog.id]?.input ? (
                          <X 
                            className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground"
                            onClick={() => {
                              console.log('Clear button clicked');
                              setProblemInputs(prev => ({
                                ...prev,
                                [dialog.id]: { ...prev[dialog.id], input: '' }
                              }));
                              clearSearch();
                            }}
                          />
                        ) : null}
                      </div>
                    </div>
                    
                    {/* Debug info - remove in production */}
                    <div className="text-xs text-gray-500 ml-[120px] mt-1">
                      Debug: {searchResults.length} results | Searching: {isSearching ? 'Yes' : 'No'} | 
                      Input: "{problemInputs[dialog.id]?.input || '(empty)'}"
                    </div>
                    
                    {/* Search results dropdown */}
                    {(searchResults.length > 0 || isSearching) && (
                      <div className="absolute left-[120px] right-0 z-50 mt-1 border rounded-md bg-white shadow-lg max-h-60 overflow-y-auto">
                        {isSearching && searchResults.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                              <span>Searching...</span>
                            </div>
                          </div>
                        ) : searchResults.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground">No matching problems found</div>
                        ) : (
                          searchResults.map((result, index) => (
                            <div
                              key={`${result.code}-${index}`}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                              onClick={() => {
                                console.log('Selected problem:', result.description);
                                handleSelectProblem(result.description, dialog.id);
                              }}
                            >
                              <div className="font-medium">{result.description}</div>
                              {result.code && (
                                <div className="text-xs text-muted-foreground mt-1">Code: {result.code}</div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    
                    {/* Error message */}
                    {searchError && (
                      <div className="text-sm text-red-500 mt-1 ml-[120px]">{searchError}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1/2 flex items-center gap-3">
                    <Label className="w-[120px] min-w-[120px]">Immediacy</Label>
                    <RadioGroup
                      value={problemInputs[dialog.id]?.immediacy || ''}
                      onValueChange={(value) =>
                        setProblemInputs((prev) => ({
                          ...prev,
                          [dialog.id]: { ...prev[dialog.id], immediacy: value as ProblemImmediacy },
                        }))
                      }
                      className="flex items-center gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="UNKNOWN" id={`immediacy-unknown-${dialog.id}`} />
                        <Label htmlFor={`immediacy-unknown-${dialog.id}`} className="text-sm">Unknown</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ACUTE" id={`immediacy-acute-${dialog.id}`} />
                        <Label htmlFor={`immediacy-acute-${dialog.id}`} className="text-sm">Acute</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="CHRONIC" id={`immediacy-chronic-${dialog.id}`} />
                        <Label htmlFor={`immediacy-chronic-${dialog.id}`} className="text-sm">Chronic</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="w-1/2 flex items-center gap-3">
                    <Label htmlFor={`problemService-${dialog.id}`} className="w-[120px] min-w-[120px] shrink-0">
                      Service
                    </Label>
                    <Select
                      value={problemInputs[dialog.id]?.service}
                      onValueChange={(value) =>
                        setProblemInputs((prev) => ({
                          ...prev,
                          [dialog.id]: { ...prev[dialog.id], service: value },
                        }))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select Service" />
                      </SelectTrigger>
                      <SelectContent className="text-xs max-h-60 overflow-y-auto">
                        <SelectItem value="CARDIOLOGY" className="text-xs py-1.5">Cardiology</SelectItem>
                        <SelectItem value="NEUROLOGY" className="text-xs py-1.5">Neurology</SelectItem>
                        <SelectItem value="ORTHOPEDICS" className="text-xs py-1.5">Orthopedics</SelectItem>
                        <SelectItem value="PULMONOLOGY" className="text-xs py-1.5">Pulmonology</SelectItem>
                        <SelectItem value="GASTROENTEROLOGY" className="text-xs py-1.5">Gastroenterology</SelectItem>
                        <SelectItem value="NEPHROLOGY" className="text-xs py-1.5">Nephrology</SelectItem>
                        <SelectItem value="ONCOLOGY" className="text-xs py-1.5">Oncology</SelectItem>
                        <SelectItem value="ENDOCRINOLOGY" className="text-xs py-1.5">Endocrinology</SelectItem>
                        <SelectItem value="RHEUMATOLOGY" className="text-xs py-1.5">Rheumatology</SelectItem>
                        <SelectItem value="GENERAL" className="text-xs py-1.5">General Medicine</SelectItem>
                        <SelectItem value="SURGERY" className="text-xs py-1.5">Surgery</SelectItem>
                        <SelectItem value="GYNECOLOGY" className="text-xs py-1.5">Gynecology</SelectItem>
                        <SelectItem value="UROLOGY" className="text-xs py-1.5">Urology</SelectItem>
                        <SelectItem value="DERMATOLOGY" className="text-xs py-1.5">Dermatology</SelectItem>
                        <SelectItem value="OPHTHALMOLOGY" className="text-xs py-1.5">Ophthalmology</SelectItem>
                        <SelectItem value="ENT" className="text-xs py-1.5">ENT</SelectItem>
                        <SelectItem value="PSYCHIATRY" className="text-xs py-1.5">Psychiatry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor={`problemComment-${dialog.id}`} className="w-full">
                    Comment
                  </Label>
                  <Textarea
                    id={`problemComment-${dialog.id}`}
                    value={problemInputs[dialog.id]?.comment || ''}
                    onChange={(e) =>
                      setProblemInputs((prev) => ({
                        ...prev,
                        [dialog.id]: { ...prev[dialog.id], comment: e.target.value },
                      }))
                    }
                    placeholder="Add any additional comments..."
                    className="w-full min-h-[80px]"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    onClick={() => handleAddProblem(dialog.id)}
                    disabled={isSavingProblem}
                  >
                    {isSavingProblem ? 'Saving...' : 'Create'}
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
                  >
                    Reset
                  </Button>
                  <Button variant="outline" onClick={() => closeFloatingDialog(dialog.id)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : dialog.type === 'medication' ? (
              <div className="flex flex-col gap-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="font-semibold">Patient ID:</span> 800000035</div>
                  <div><span className="font-semibold">Name:</span> Anonymous Two</div>
                  <div><span className="font-semibold">Age:</span> 69 Years</div>
                  <div><span className="font-semibold">Sex:</span> MALE</div>
                  <div className="md:col-span-2"><span className="font-semibold">Patient Type:</span> In Patient</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="font-medium">Medication Name</Label>
                    <Input
                      value={medSearch}
                      onChange={(e) => {
                        setMedSearch(e.target.value);
                        setDropdownOpen(true);
                        setFilteredMeds(
                          MEDICATIONS.filter((med) =>
                            med.toLowerCase().includes(e.target.value.toLowerCase())
                          )
                        );
                      }}
                      onFocus={() => setDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setDropdownOpen(false), 120)}
                      className="w-full"
                      placeholder="Type to search..."
                      autoComplete="off"
                    />
                    {dropdownOpen && medSearch && (
                      <div className="border rounded bg-white max-h-48 overflow-y-auto absolute z-20 w-full">
                        {filteredMeds.length === 0 ? (
                          <div className="p-2 text-muted-foreground">No medication found.</div>
                        ) : (
                          filteredMeds.map((med) => (
                            <div
                              key={med}
                              className="p-2 hover:bg-sky-100 cursor-pointer"
                              onMouseDown={() => handleSelectMed(med)}
                            >
                              {med}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="font-medium">Quick Order</Label>
                    <Input
                      value={quickOrder}
                      onChange={(e) => setQuickOrder(e.target.value)}
                      className="w-full"
                      placeholder=""
                    />
                  </div>
                  <Button type="button" className="bg-yellow-500 hover:bg-yellow-600 text-white h-9 text-xs">
                    Edit Quick List
                  </Button>
                </div>
                {selectedRows.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full mt-2 border">
                      <tbody>
                        {selectedRows.map((row, idx) => (
                          <tr key={row.medicationName}>
                            <td className="px-2 py-1">{row.medicationName}</td>
                            <td className="px-2 py-1">
                              <Input
                                value={row.dosage}
                                onChange={(e) => handleRowChange(idx, 'dosage', e.target.value)}
                                className="w-20"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <Select
                                value={row.route}
                                onValueChange={(val) => handleRowChange(idx, 'route', val)}
                              >
                                <SelectTrigger className="w-24 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROUTES.map((route) => (
                                    <SelectItem value={route} key={route}>
                                      {route}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-2 py-1">
                              <Select
                                value={row.schedule}
                                onValueChange={(val) => handleRowChange(idx, 'schedule', val)}
                              >
                                <SelectTrigger className="w-24 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SCHEDULES.map((schedule) => (
                                    <SelectItem value={schedule} key={schedule}>
                                      {schedule}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-2 py-1 text-center">
                              <Checkbox
                                checked={row.prn}
                                onCheckedChange={(val) => handleRowChange(idx, 'prn', val)}
                              />
                            </td>
                            <td className="px-2 py-1 flex items-center">
                              <Input
                                type="number"
                                value={row.duration}
                                onChange={(e) => handleRowChange(idx, 'duration', e.target.value)}
                                className="w-12"
                              />
                              <Select
                                value={row.durationUnit}
                                onValueChange={(val) => handleRowChange(idx, 'durationUnit', val)}
                              >
                                <SelectTrigger className="w-16 h-8 ml-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="days">days</SelectItem>
                                  <SelectItem value="weeks">weeks</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-2 py-1">
                              <Select
                                value={row.priority}
                                onValueChange={(val) => handleRowChange(idx, 'priority', val)}
                              >
                                <SelectTrigger className="w-24 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PRIORITIES.map((priority) => (
                                    <SelectItem value={priority} key={priority}>
                                      {priority}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-2 py-1 text-center">
                              <Checkbox
                                checked={row.additionalDoseNow}
                                onCheckedChange={(val) => handleRowChange(idx, 'additionalDoseNow', val)}
                              />
                            </td>
                            <td className="px-2 py-1">
                              <Input
                                value={row.comment}
                                onChange={(e) => handleRowChange(idx, 'comment', e.target.value)}
                                className="w-28"
                              />
                            </td>
                            <td className="px-2 py-1 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveRow(idx)}
                              >
                                ❌
                              </Button>
                            </td>
                            <td className="px-2 py-1 text-center">
                              <Button variant="ghost" size="icon">
                                💾
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex justify-end gap-2 p-4">
                  <Button
                    onClick={() => {
                      selectedRows.forEach((row) => {
                        const newMed: Medication = {
                          id: Date.now().toString(),
                          name: row.medicationName,
                          reason: row.comment || 'General',
                          amount: row.dosage || 'N/A',
                          timing: row.schedule || 'N/A',
                          status: 'Active',
                        };
                        // Update local medications state
                        // setLocalMedications((prev: Medication[]) => [newMed, ...prev]);
                      });
                      toast.success('Medications added successfully!');
                      closeFloatingDialog(dialog.id);
                    }}
                  >
                    Confirm Order
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedRows([])}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => closeFloatingDialog(dialog.id)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : dialog.type === 'radiology' ? (
              <div className="flex flex-col gap-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="font-semibold">Patient ID:</span> 800000035</div>
                  <div><span className="font-semibold">Name:</span> Anonymous Two</div>
                  <div><span className="font-semibold">Age:</span> 69 Years</div>
                  <div><span className="font-semibold">Sex:</span> MALE</div>
                  <div className="md:col-span-2"><span className="font-semibold">Patient Type:</span> In Patient</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="w-[120px] min-w-[120px]">Imaging Type</Label>
                    <Select
                      value={radiologyInputs[dialog.id]?.type || ''}
                      onValueChange={(value) =>
                        setRadiologyInputs((prev) => ({
                          ...prev,
                          [dialog.id]: { ...prev[dialog.id], type: value },
                        }))
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select test" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="X-Ray">X-Ray</SelectItem>
                        <SelectItem value="MRI">MRI</SelectItem>
                        <SelectItem value="CT Scan">CT Scan</SelectItem>
                        <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-[120px] min-w-[120px]">Body Part</Label>
                    <Input
                      value={radiologyInputs[dialog.id]?.bodyPart || ''}
                      onChange={(e) =>
                        setRadiologyInputs((prev) => ({
                          ...prev,
                          [dialog.id]: { ...prev[dialog.id], bodyPart: e.target.value },
                        }))
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={radiologyInputs[dialog.id]?.notes || ''}
                    onChange={(e) =>
                      setRadiologyInputs((prev) => ({
                        ...prev,
                        [dialog.id]: { ...prev[dialog.id], notes: e.target.value },
                      }))
                    }
                    className="flex-1 min-h-[80px]"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    onClick={() => {
                      toast.success('Radiology order placed!');
                      closeFloatingDialog(dialog.id);
                    }}
                  >
                    Confirm Order
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setRadiologyInputs((prev) => ({
                        ...prev,
                        [dialog.id]: { type: '', bodyPart: '', notes: '' },
                      }))
                    }
                  >
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => closeFloatingDialog(dialog.id)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : dialog.type === 'report' ? (
              <div className="flex flex-col gap-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="font-semibold">Report Search</span></div>
                  <div><span className="font-semibold">Quick Orders</span></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Search</Label>
                    <Input
                      value={reportInputs[dialog.id]?.search || ''}
                      onChange={(e) =>
                        setReportInputs((prev) => ({
                          ...prev,
                          [dialog.id]: { ...prev[dialog.id], search: e.target.value },
                        }))
                      }
                      className="flex-1"
                    />
                    <div className="mt-2 border p-2 h-32 overflow-y-auto text-sm">
                      {['LIVER FUNCTION TEST', 'DSDNA AB', 'THYROID PANEL']
                        .filter((test) => test.toLowerCase().includes((reportInputs[dialog.id]?.search || '').toLowerCase()))
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
                  <div className="flex flex-col gap-2">
                    <Label>Quick Search</Label>
                    <Input
                      value={reportInputs[dialog.id]?.quickSearch || ''}
                      onChange={(e) =>
                        setReportInputs((prev) => ({
                          ...prev,
                          [dialog.id]: { ...prev[dialog.id], quickSearch: e.target.value },
                        }))
                      }
                      className="flex-1"
                    />
                    <div className="mt-2 border p-2 h-32 overflow-y-auto text-sm">
                      {['BLOOD SUGAR', 'CBC', 'ESR']
                        .filter((q) => q.toLowerCase().includes((reportInputs[dialog.id]?.quickSearch || '').toLowerCase()))
                        .map((q, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              checked={reportInputs[dialog.id]?.selected.includes(q)}
                              onCheckedChange={(checked) => {
                                setReportInputs((prev) => {
                                  const current = prev[dialog.id]?.selected || [];
                                  return {
                                    ...prev,
                                    [dialog.id]: {
                                      ...prev[dialog.id],
                                      selected: checked
                                        ? [...current, q]
                                        : current.filter((item) => item !== q),
                                    },
                                  };
                                });
                              }}
                            />
                            <span>{q}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => {
                      toast.success('Report order confirmed');
                      closeFloatingDialog(dialog.id);
                    }}
                  >
                    Confirm Order
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setReportInputs((prev) => ({
                        ...prev,
                        [dialog.id]: { search: '', quickSearch: '', selected: [] },
                      }))
                    }
                  >
                    Reset
                  </Button>
                  <Button variant="outline" onClick={() => closeFloatingDialog(dialog.id)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : dialog.type === 'allergies' ? (
              <div className="flex flex-col gap-4 text-sm">
                {/* Allergies Input */}
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor={`allergies-${dialog.id}`} className="font-medium">Allergies</Label>
                  <Input
                    id={`allergies-${dialog.id}`}
                    value={allergyInputs[dialog.id]?.allergies || ''}
                    onChange={(e) => setAllergyInputs(prev => ({
                      ...prev,
                      [dialog.id]: { ...prev[dialog.id], allergies: e.target.value }
                    }))}
                    placeholder="Enter allergies"
                  />
                </div>

                {/* Nature of Reaction - Select + Radio Group */}
                <div className="grid grid-cols-1 gap-2">
                  <Label className="font-medium">Nature of Reaction</Label>
                  <div className="flex gap-4">
                    <Select
                      value={allergyInputs[dialog.id]?.natureOfReaction || ''}
                      onValueChange={(value) => setAllergyInputs(prev => ({
                        ...prev,
                        [dialog.id]: { ...prev[dialog.id], natureOfReaction: value }
                      }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select nature of reaction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Allergy">Allergy</SelectItem>
                        <SelectItem value="Intolerance">Intolerance</SelectItem>
                        <SelectItem value="Side Effect">Side Effect</SelectItem>
                      </SelectContent>
                    </Select>
                    <RadioGroup 
                      value={allergyInputs[dialog.id]?.reactionType || ''}
                      onValueChange={(value) => setAllergyInputs(prev => ({
                        ...prev,
                        [dialog.id]: { ...prev[dialog.id], reactionType: value as 'Observed' | 'Historical' | '' }
                      }))}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Observed" id={`observed-${dialog.id}`} />
                        <Label htmlFor={`observed-${dialog.id}`}>Observed</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Historical" id={`historical-${dialog.id}`} />
                        <Label htmlFor={`historical-${dialog.id}`}>Historical</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Sign/Symptoms - Select */}
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor={`signSymptom-${dialog.id}`} className="font-medium">Sign/Symptoms</Label>
                  <Select
                    value={allergyInputs[dialog.id]?.signSymptom || ''}
                    onValueChange={(value) => setAllergyInputs(prev => ({
                      ...prev,
                      [dialog.id]: { ...prev[dialog.id], signSymptom: value }
                    }))}
                  >
                    <SelectTrigger>
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
                </div>

                {/* Date/Time Input */}
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor={`dateTime-${dialog.id}`} className="font-medium">Date/Time</Label>
                  <Input
                    id={`dateTime-${dialog.id}`}
                    type="datetime-local"
                    value={allergyInputs[dialog.id]?.dateTime || ''}
                    onChange={(e) => setAllergyInputs(prev => ({
                      ...prev,
                      [dialog.id]: { ...prev[dialog.id], dateTime: e.target.value }
                    }))}
                  />
                </div>

                {/* Comment Textarea */}
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor={`comment-${dialog.id}`} className="font-medium">Comment</Label>
                  <Textarea
                    id={`comment-${dialog.id}`}
                    value={allergyInputs[dialog.id]?.comment || ''}
                    onChange={(e) => setAllergyInputs(prev => ({
                      ...prev,
                      [dialog.id]: { ...prev[dialog.id], comment: e.target.value }
                    }))}
                    placeholder="Add any additional comments"
                    className="h-24"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => closeFloatingDialog(dialog.id)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleAddAllergy(dialog.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Save
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