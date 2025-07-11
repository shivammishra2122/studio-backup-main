'use client';

import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader as ShadcnTableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle as DialogUITitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Settings, RefreshCw, CalendarDays, ArrowUpDown, Trash2, Edit2, CheckCircle2, ImageUp, X, FileSignature, Droplets, Loader2, Search, ArrowLeft, Printer, PlusCircle } from 'lucide-react';
import { DigitalSignatureDialog } from '@/components/DigitalSignatureDialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Patient } from '@/lib/constants';
import { apiService } from '@/services/api';

const clinicalNotesSubNavItems = [
  "Notes View", "New Notes", "Scanned Notes",
  "Clinical Report", "Clinical Reminder",
  "Clinical Reminder Analysis", "Clinical Template"
];

type PatientClinicalNoteType = {
  id: string;
  patientId: string;
  patientName: string;
  notesTitle: string;
  dateOfEntry: string;
  status: "COMPLETED" | "UNSIGNED" | "DRAFT" | "PENDING";
  author: string;
  location: string;
  cosigner?: string;
  department: string;
  visitType: string;
};

const mockPatientClinicalNotes: PatientClinicalNoteType[] = [
  {
    id: '1',
    patientId: 'P001',
    patientName: 'John Smith',
    notesTitle: 'Initial Assessment - Orthopedics',
    dateOfEntry: '15 MAY, 2025 20:05',
    status: 'COMPLETED',
    author: 'Dr. J. Doe',
    location: 'Gen Ward',
    cosigner: 'Dr. S. Ray',
    department: 'Orthopedics',
    visitType: 'OPD'
  },
  {
    id: '2',
    patientId: 'P001',
    patientName: 'John Smith',
    notesTitle: 'Follow-up Assessment',
    dateOfEntry: '18 MAY, 2025 09:00',
    status: 'COMPLETED',
    author: 'Dr. J. Doe',
    location: 'Gen Ward',
    cosigner: 'Dr. S. Ray',
    department: 'Orthopedics',
    visitType: 'OPD'
  },
  {
    id: '3',
    patientId: 'P002',
    patientName: 'Sarah Johnson',
    notesTitle: 'Routine Checkup - General Medicine',
    dateOfEntry: '18 MAY, 2025 09:00',
    status: 'COMPLETED',
    author: 'Dr. Lisa Ray',
    location: 'Clinic A',
    cosigner: 'Dr. John Davis',
    department: 'General Medicine',
    visitType: 'OPD'
  },
  {
    id: '4',
    patientId: 'P003',
    patientName: 'Michael Brown',
    notesTitle: 'Pre-operative Assessment',
    dateOfEntry: '19 MAY, 2025 11:45',
    status: 'COMPLETED',
    author: 'Dr. M. Chen',
    location: 'Surg Pre-Op',
    cosigner: 'Dr. S. Bell',
    department: 'Surgery',
    visitType: 'IPD'
  },
];

interface ClinicalNotesPageProps {
  patient?: Patient;
}

const DEFAULT_SSN = '800000035';

const ClinicalNotesPage = ({ patient }: ClinicalNotesPageProps) => {
  const [activeSubNav, setActiveSubNav] = useState<string>(clinicalNotesSubNavItems[0]);
  const [viewMode, setViewMode] = useState<'table' | 'detail'>('table');
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDateValue, setToDateValue] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [selectedNote, setSelectedNote] = useState<PatientClinicalNoteType | null>(null);
  const [selectedNoteContent, setSelectedNoteContent] = useState<string>("");
  const [isNoteDetailDialogOpen, setIsNoteDetailDialogOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [signatureNoteId, setSignatureNoteId] = useState<string | null>(null);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSignClick = (noteId: string) => {
    setSignatureNoteId(noteId);
    setIsSignatureDialogOpen(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      setIsDeleting(true);
      await apiService.post('/api/clinical-notes/delete', {
        data: { noteId },
      });

      // Refresh the notes list after successful deletion
      const ssn = patient?.ssn || DEFAULT_SSN;
      if (ssn) {
        const notes = await apiService.fetchClinicalNotes({
          patientSSN: ssn,
          fromDate: fromDate ? formatDate(fromDate) : '',
          toDate: toDateValue ? formatDate(toDateValue) : '',
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          ihtLocation: "67",
          ewd_sessid: "36608394"
        });
        
        const normalizedNotes = notes.map((note: any, index) => ({
          id: note.NoteIEN || `${note["Notes Title"]}-${index}`,
          notesTitle: note["Notes Title"] || note.notesTitle || "No Title",
          dateOfEntry: note["Date of Entry"] || note.dateOfEntry || "No Date",
          status: note["Status"] || note.status || "UNKNOWN",
          author: note.Author || note.author || "Unknown Author",
          location: note.Location || note.location || "Unknown Location",
          cosigner: note.Cosigner || note.cosigner || "-",
          department: note.department || "Unknown Department",
          visitType: note.visitType || "Unknown Visit Type",
        }));

        setNotes(normalizedNotes);
      }
      
      alert('Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveSignature = async (signatureData: string): Promise<void> => {
    if (!currentNoteId) return;
    
    try {
      setIsSigning(true);
      await apiService.post('/api/clinical-notes/sign', {
        data: { 
          noteId: currentNoteId,
          signatureData
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to sign note');
      }

      // Update the note status to COMPLETED in the UI
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === currentNoteId ? { ...note, status: 'COMPLETED' } : note
        )
      );
      
      // No return value needed as we're returning void
    } catch (error) {
      console.error('Error signing note:', error);
      throw error; // Re-throw to be handled by the dialog
    } finally {
      setIsSigning(false);
    }
  };

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

  useEffect(() => {
    const ssn = patient?.ssn || DEFAULT_SSN;
    if (!ssn) return;
    
    setLoading(true);
    
    apiService.fetchClinicalNotes({
      patientSSN: ssn,
      fromDate: fromDate || '',
      toDate: toDateValue || '',
      status: statusFilter !== "ALL" ? statusFilter : undefined,
      ihtLocation: 67,
      ewd_sessid: "36608394"
    })
      .then((data: any[]) => {
        console.log("API Data:", data);

        const notesArray = Array.isArray(data) ? data : Object.values(data || {});

        const normalizedNotes = notesArray.map((note: any, index) => ({
          id: note.NoteIEN || `${note["Notes Title"]}-${index}`,
          notesTitle: note["Notes Title"] || note.notesTitle || "No Title",
          dateOfEntry: note["Date of Entry"] || note.dateOfEntry || "No Date",
          status: note["Status"] || note.status || "UNKNOWN",
          author: note.Author || note.author || "Unknown Author",
          location: note.Location || note.location || "Unknown Location",
          cosigner: note.Cosigner || note.cosigner || "-",
          department: note.department || "Unknown Department",
          visitType: note.visitType || "Unknown Visit Type",
        }));

        setNotes(normalizedNotes);
      })
      .catch((error: any) => {
        console.error("Error fetching clinical notes:", error);
        setNotes([]); // fallback to empty array
      })
      .finally(() => setLoading(false));
  }, [patient?.ssn, fromDate, toDateValue, statusFilter]);

  const filteredNotes = (notes || []).filter(note => {
    if (statusFilter !== "ALL" && note.status !== statusFilter) return false;
    if (searchText && !note.notesTitle?.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const uniquePatients = Array.from(new Set(mockPatientClinicalNotes.map(note => note.patientId)))
    .map(id => {
      const note = mockPatientClinicalNotes.find(n => n.patientId === id);
      return {
        id: note?.patientId || '',
        name: note?.patientName || ''
      };
    });

  const handleNoteClick = (note: PatientClinicalNoteType) => {
    setSelectedNote(note);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('table');
    setSelectedNote(null);
  };

  const truncateText = (text: string, maxLength: number = 40) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-var(--top-nav-height,40px))] bg-background text-sm px-1 pb-1 pt-0">
      {/* Sub-navigation */}
      <div className="flex items-end space-x-1 px-1 pb-0 overflow-x-auto no-scrollbar">
        {clinicalNotesSubNavItems.map((item) => (
          <Button
            key={item}
            onClick={() => {
              setActiveSubNav(item);
              setSelectedNote(null);
            }}
            className={`text-xs px-3 py-1.5 h-auto rounded-b-none rounded-t-md whitespace-nowrap focus-visible:ring-0 focus-visible:ring-offset-0
              ${activeSubNav === item
                ? 'bg-background text-primary border-x border-t border-border border-b-2 border-b-background shadow-sm relative -mb-px z-10 hover:bg-background hover:text-primary'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground border-x border-t border-transparent'
              }`}
          >
            {item}
          </Button>
        ))}
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {activeSubNav === "Notes View" ? (
          viewMode === 'table' ? (
            // Table View
            <Card className="h-full flex flex-col shadow">
              <CardContent className="p-2.5 flex-grow overflow-auto">
                {/* Filters and search UI */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs mb-2">
                  {/* Existing filter components */}
                  {!patient && (
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="patient-filter">Patient</Label>
                      <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                        <SelectTrigger id="patient-filter" className="h-8 w-[180px]">
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Patients</SelectItem>
                          {uniquePatients.map(patient => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.name} ({patient.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* Status filter */}
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="status-filter">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger id="status-filter" className="h-8 w-[120px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date range filters */}
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="from-date">From</Label>
                    <div className="relative">
                      <Input
                        id="from-date"
                        type="date"
                        className="h-8 w-[120px]"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                      <CalendarDays className="h-3.5 w-3.5 absolute right-2.5 top-2 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label htmlFor="to-date">To</Label>
                    <div className="relative">
                      <Input
                        id="to-date"
                        type="date"
                        className="h-8 w-[120px]"
                        value={toDateValue}
                        onChange={(e) => setToDateValue(e.target.value)}
                      />
                      <CalendarDays className="h-3.5 w-3.5 absolute right-2.5 top-2 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Search */}
                  <div className="flex-1 flex justify-end">
                    <div className="relative w-full max-w-xs">
                      <Search className="h-3.5 w-3.5 absolute left-2.5 top-2 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search notes..."
                        className="h-8 pl-8"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Notes Table */}
                <Table>
                  <ShadcnTableHeader>
                    <TableRow>
                      {[
                        { name: "Notes Title", className: "min-w-[6rem]" },
                        { name: "Date of Entry", className: "min-w-[4rem]" },
                        { name: "Status", className: "min-w-[4rem]" },
                        { name: "Department", className: "min-w-[4.5rem]" },
                        { name: "Visit Type", className: "min-w-[4rem]" },
                        { name: "Sign", className: "min-w-[3rem] text-center" },
                        { name: "Edit", className: "min-w-[3rem] text-center" },
                        { name: "Delete", className: "min-w-[3rem] text-center" },
                        { name: "Author", className: "min-w-[4.5rem]" },
                        { name: "Location", className: "min-w-[4.5rem]" },
                        { name: "Cosigner", className: "min-w-[4.5rem]" },
                        { name: "Image Upload", className: "min-w-[3rem] text-center" }
                      ].map(header => (
                        <TableHead key={header.name} className={`py-2 px-1.5 text-foreground font-semibold h-auto ${header.className || ''}`}>
                          <div className="flex items-center justify-between">
                            <span className="break-words text-xs">{header.name}</span>
                            <ArrowUpDown className="h-3 w-3 ml-1 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer" />
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </ShadcnTableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-10 text-muted-foreground">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : filteredNotes && Array.isArray(filteredNotes) && filteredNotes.length > 0 ? filteredNotes.map((note) => (
                      <TableRow 
                        key={note.id} 
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleNoteClick(note)}
                      >
                        <TableCell className="py-1.5 px-1.5 min-w-[6rem]">{truncateText(note.notesTitle, 40)}</TableCell>
                        <TableCell className="py-1.5 px-1.5 min-w-[4rem]">{note.dateOfEntry}</TableCell>
                        <TableCell className="py-1.5 px-1.5 min-w-[4rem]">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            note.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-800' 
                              : note.status === 'PENDING' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {note.status}
                          </span>
                        </TableCell>
                        <TableCell className="py-1.5 px-1.5 min-w-[4.5rem]">{note.department}</TableCell>
                        <TableCell className="py-1.5 px-1.5 min-w-[4rem]">{note.visitType}</TableCell>
                        <TableCell className="py-1.5 px-1.5 text-center min-w-[3rem]">
                          {note.status === 'UNSIGNED' ? (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 hover:text-green-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSignClick(note.id);
                              }}
                              disabled={isSigning}
                            >
                              <FileSignature className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <span className="text-green-600 text-xs flex items-center justify-center">
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Signed
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-1.5 px-1.5 text-center min-w-[3rem]">
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                        <TableCell className="py-1.5 px-1.5 text-center min-w-[3rem]">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-6 w-6 ${
                              note.status === 'SIGNED' || note.status === 'COMPLETED' 
                                ? 'text-muted-foreground cursor-not-allowed' 
                                : 'hover:text-destructive'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                            disabled={isDeleting || note.status === 'SIGNED' || note.status === 'COMPLETED'}
                            title={
                              note.status === 'SIGNED' || note.status === 'COMPLETED' 
                                ? 'Cannot delete signed or completed notes' 
                                : 'Delete note'
                            }
                          >
                            {isDeleting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="py-1.5 px-1.5 min-w-[4.5rem]">{note.author}</TableCell>
                        <TableCell className="py-1.5 px-1.5 min-w-[4.5rem]">{note.location}</TableCell>
                        <TableCell className="py-1.5 px-1.5 min-w-[4.5rem]">{note.cosigner || '-'}</TableCell>
                        <TableCell className="py-1.5 px-1.5 text-center min-w-[3rem]">
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ImageUp className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-10 text-muted-foreground">
                          No clinical notes found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            // Detail View
            <div className="h-full flex flex-col bg-white rounded-lg shadow overflow-hidden">
              {/* Detail view header */}
              <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={handleBackToList}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to List
                  </Button>
                  <h2 className="text-lg font-medium">Note Details</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="h-8">
                    <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="h-8">
                    <Printer className="h-3.5 w-3.5 mr-1.5" />
                    Print
                  </Button>
                </div>
              </div>
              
              {/* Note content */}
              <div className="flex-1 overflow-auto p-6">
                {selectedNote && (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="border-b pb-4">
                      <h1 className="text-2xl font-bold text-gray-900">{selectedNote.notesTitle}</h1>
                      <div className="mt-1 flex items-center text-sm text-muted-foreground">
                        <span>Created on {selectedNote.dateOfEntry}</span>
                        <span className="mx-2">•</span>
                        <span>Status: </span>
                        <span className={`ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedNote.status === 'COMPLETED' 
                            ? 'bg-green-100 text-green-800' 
                            : selectedNote.status === 'PENDING' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedNote.status}
                        </span>
                      </div>
                    </div>
                    
                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="text-muted-foreground">Patient</div>
                        <div className="font-medium">{selectedNote.patientName}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-muted-foreground">Author</div>
                        <div className="font-medium">{selectedNote.author}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-muted-foreground">Department</div>
                        <div className="font-medium">{selectedNote.department}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-muted-foreground">Visit Type</div>
                        <div className="font-medium">{selectedNote.visitType}</div>
                      </div>
                      {selectedNote.cosigner && (
                        <div className="space-y-2">
                          <div className="text-muted-foreground">Co-signed by</div>
                          <div className="font-medium">{selectedNote.cosigner}</div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="text-muted-foreground">Location</div>
                        <div className="font-medium">{selectedNote.location}</div>
                      </div>
                    </div>
                    
                    {/* Recent Templates */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Recent Templates</Label>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          View All
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {mockNewNoteTemplates.slice(0, 4).map((template) => (
                          <div 
                            key={`recent-${template.id}`}
                            className="border rounded-md p-2 text-xs cursor-pointer hover:bg-accent/50 transition-colors"
                          >
                            <div className="font-medium text-xs">{template.templateName}</div>
                            <div className="text-muted-foreground text-xs">{template.department}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Note content */}
                    <div className="pt-4">
                      <div className="text-muted-foreground text-sm mb-2">Note Content</div>
                      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 min-h-[200px]">
                        {selectedNoteContent || 'No content available for this note.'}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button variant="outline">
                        Back to List
                      </Button>
                      {selectedNote.status === 'UNSIGNED' && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleSignClick(selectedNote.id)}
                          disabled={isSigning}
                        >
                          {isSigning ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <FileSignature className="h-3.5 w-3.5" />
                          )}
                          Sign Note
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          // Other sub-nav views
          <div className="h-full">
            {activeSubNav === "New Notes" && (
              <div className="p-3 space-y-4">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="note-title">Title</Label>
                      <Input id="note-title" placeholder="Enter title..." className="w-full" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="specialty">Specialty</Label>
                      <Select>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select specialty..." />
                        </SelectTrigger>
                        <SelectContent>
                          {mockSpecialties.map((specialty) => (
                            <SelectItem key={specialty.id} value={specialty.id}>
                              {specialty.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="template">Template</Label>
                      <Select>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {mockNewNoteTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.templateName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Templates */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Recent Templates</h3>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">View All</Button>
                      </div>
                      <div className="space-y-2">
                        {mockNewNoteTemplates.slice(0, 5).map((template) => (
                          <div 
                            key={`recent-${template.id}`}
                            className="p-3 border rounded-md hover:bg-accent/50 transition-colors cursor-pointer"
                          >
                            <div className="text-xs font-medium">{template.templateName}</div>
                            <div className="text-xs text-muted-foreground">{template.department}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Note Editor */}
                    <div className="lg:col-span-2 flex flex-col h-[calc(100vh-250px)]">
                      <div className="space-y-2 flex-1 flex flex-col">
                        <Label htmlFor="note-content">Note Content</Label>
                        <div className="rounded-md border border-input flex-1 flex flex-col">
                          <textarea
                            id="note-content"
                            className="flex-1 w-full p-4 focus-visible:outline-none resize-none overflow-y-auto"
                            placeholder="Enter your clinical notes here..."
                            style={{ minHeight: '200px' }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                        <Button variant="outline">Save as Draft</Button>
                        <Button>Save & Sign</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeSubNav === "Scanned Notes" && <ScannedNotesView />}
            {activeSubNav === "Clinical Report" && <ClinicalReportView />}
            {activeSubNav === "Clinical Reminder" && <ClinicalReminderView />}
            {activeSubNav === "Clinical Reminder Analysis" && <ClinicalReminderAnalysisView />}
            {activeSubNav === "Clinical Template" && <ClinicalTemplateView />}
          </div>
        )}
      </div>

      {/* Signature Dialog */}
      <DigitalSignatureDialog
        open={!!signatureNoteId}
        onOpenChange={(open) => !open && setSignatureNoteId(null)}
        onSave={handleSaveSignature}
      />
    </div>
  );
};

type NewNoteTemplateType = {
  id: string;
  templateName: string;
  department: string;
  lastUpdated: string;
};

// Mock New Notes Template Data
const mockNewNoteTemplates: NewNoteTemplateType[] = [
  {
    id: '1',
    templateName: 'Standard Note',
    department: 'General',
    lastUpdated: '2023-05-15'
  },
  {
    id: '2',
    templateName: 'Progress Note',
    department: 'General',
    lastUpdated: '2023-06-20'
  },
  {
    id: '3',
    templateName: 'Consult Note',
    department: 'Specialty',
    lastUpdated: '2023-07-01'
  },
  {
    id: '4',
    templateName: 'Procedure Note',
    department: 'Surgery',
    lastUpdated: '2023-07-10'
  }
];

// Mock Medical Specialties
const mockSpecialties = [
  // Primary Care
  { id: 'fm', name: 'Family Medicine' },
  { id: 'im', name: 'Internal Medicine' },
  { id: 'peds', name: 'Pediatrics' },
  { id: 'obgyn', name: 'OB/GYN' },
  
  // Medical Specialties
  { id: 'cardio', name: 'Cardiology' },
  { id: 'derm', name: 'Dermatology' },
  { id: 'endo', name: 'Endocrinology' },
  { id: 'gastro', name: 'Gastroenterology' },
  { id: 'heme', name: 'Hematology' },
  { id: 'id', name: 'Infectious Disease' },
  { id: 'nephro', name: 'Nephrology' },
  { id: 'neuro', name: 'Neurology' },
  { id: 'onc', name: 'Oncology' },
  { id: 'pulm', name: 'Pulmonology' },
  { id: 'rheum', name: 'Rheumatology' },
  
  // Surgical Specialties
  { id: 'gensurg', name: 'General Surgery' },
  { id: 'cardio', name: 'Cardiothoracic Surgery' },
  { id: 'ent', name: 'Otolaryngology (ENT)' },
  { id: 'nsgy', name: 'Neurosurgery' },
  { id: 'ortho', name: 'Orthopedic Surgery' },
  { id: 'plastics', name: 'Plastic Surgery' },
  { id: 'urol', name: 'Urology' },
  { id: 'vasc', name: 'Vascular Surgery' },
  
  // Other Specialties
  { id: 'anes', name: 'Anesthesiology' },
  { id: 'derm', name: 'Dermatology' },
  { id: 'em', name: 'Emergency Medicine' },
  { id: 'path', name: 'Pathology' },
  { id: 'pmr', name: 'Physical Medicine & Rehab' },
  { id: 'psych', name: 'Psychiatry' },
  { id: 'rads', name: 'Radiology' }
];

// Mock Scanned Notes Data
const mockScannedNotes: ScannedNoteDataType[] = [
  {
    id: '1',
    documentName: 'Handwritten Progress Note - ICU',
    scanDate: '20 MAY, 2025',
    scanTime: '10:30',
    uploadedBy: 'Nurse Patel',
    status: 'VERIFIED',
    location: 'ICU 1'
  },
  {
    id: '2',
    documentName: 'Surgical Consent Form',
    scanDate: '21 MAY, 2025',
    scanTime: '14:00',
    uploadedBy: 'Nurse Sharma',
    status: 'PENDING',
    location: 'Surg Pre-Op'
  },
  {
    id: '3',
    documentName: 'Discharge Summary Scan',
    scanDate: '22 MAY, 2025',
    scanTime: '09:15',
    uploadedBy: 'Dr. Gupta',
    status: 'VERIFIED',
    location: 'Gen Ward'
  },
  {
    id: '4',
    documentName: 'Lab Results - Handwritten',
    scanDate: '23 MAY, 2025',
    scanTime: '11:45',
    uploadedBy: 'Nurse Singh',
    status: 'PENDING',
    location: 'Clinic A'
  },
  {
    id: '5',
    documentName: 'Patient Consent Form',
    scanDate: '24 MAY, 2025',
    scanTime: '08:00',
    uploadedBy: 'Dr. Verma',
    status: 'VERIFIED',
    location: 'Peds Ward'
  },
];

const ScannedNotesView = () => {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");

  const filteredScannedNotes = mockScannedNotes;

  const scannedNotesTableHeaders = [
    "Document Name",
    "Scan Date:Time",
    "Uploaded By",
    "Status",
    "Action",
    "Location",
  ];

  return (
    <Card className="flex-1 flex flex-col shadow overflow-hidden">
      <CardContent className="p-2.5 flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs mb-2">
          <Label htmlFor="scannedStatus" className="shrink-0 text-xs">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="scannedStatus" className="h-6 w-24 text-xs">
              <SelectValue placeholder="ALL" className="text-xs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">ALL</SelectItem>
              <SelectItem value="VERIFIED" className="text-xs">VERIFIED</SelectItem>
              <SelectItem value="PENDING" className="text-xs">PENDING</SelectItem>
            </SelectContent>
          </Select>

          <Label htmlFor="scannedFromDate" className="shrink-0 text-xs">From Date</Label>
          <div className="relative">
            <Input
              id="scannedFromDate"
              type="text"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="h-6 w-24 text-xs pr-7"
            />
            <CalendarDays className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>

          <Label htmlFor="scannedToDate" className="shrink-0 text-xs">To</Label>
          <div className="relative">
            <Input
              id="scannedToDate"
              type="text"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="h-6 w-24 text-xs pr-7"
            />
            <CalendarDays className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>

          <Label htmlFor="scannedSearch" className="shrink-0 text-xs">Search:</Label>
          <Input
            id="scannedSearch"
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="h-6 w-28 text-xs"
          />
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          <Table className="text-xs w-full">
            <ShadcnTableHeader className="bg-accent sticky top-0 z-10">
              <TableRow>
                {scannedNotesTableHeaders.map(header => (
                  <TableHead key={header} className="py-2 px-3 text-foreground font-semibold h-auto">
                    <div className="flex items-center justify-between">
                      <span className="break-words text-xs">{header}</span>
                      <ArrowUpDown className="h-3 w-3 ml-1 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer" />
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </ShadcnTableHeader>
            <TableBody>
              {filteredScannedNotes.length > 0 ? filteredScannedNotes.map((note, index) => (
                <TableRow key={note.id} className={`hover:bg-muted/50 ${index % 2 === 0 ? 'bg-muted/30' : ''}`}>
                  <TableCell className="py-1.5 px-3">{note.documentName}</TableCell>
                  <TableCell className="py-1.5 px-3">{note.scanDate} {note.scanTime}</TableCell>
                  <TableCell className="py-1.5 px-3">{note.uploadedBy}</TableCell>
                  <TableCell className="py-1.5 px-3">{note.status}</TableCell>
                  <TableCell className="py-1.5 px-3 text-center">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      {note.status === "PENDING" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <FileSignature className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="py-1.5 px-3">{note.location}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No scanned notes found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-start p-2.5 border-t text-xs text-muted-foreground mt-auto">
          <div>Showing {filteredScannedNotes.length > 0 ? 1 : 0} to {filteredScannedNotes.length} of {filteredScannedNotes.length} entries</div>
        </div>
      </CardContent>
    </Card>
  );
};

type ClinicalReportDataType = {
  id: string;
  reportTitle: string;
  generatedDate: string;
  generatedTime: string;
  department: string;
  generatedBy: string;
  summary: string;
};

// Mock Clinical Report Data
const mockClinicalReports: ClinicalReportDataType[] = [
  {
    id: '1',
    reportTitle: 'Monthly Patient Outcomes - ICU',
    generatedDate: '20 MAY, 2025',
    generatedTime: '15:00',
    department: 'ICU',
    generatedBy: 'Dr. Sharma',
    summary: 'Summary of patient outcomes in ICU for May 2025, including recovery rates and complications.'
  },
  {
    id: '2',
    reportTitle: 'Surgical Procedure Report',
    generatedDate: '21 MAY, 2025',
    generatedTime: '12:30',
    department: 'Surgery',
    generatedBy: 'Dr. Gupta',
    summary: 'Details of surgical procedures performed, including success rates and post-op complications.'
  },
  {
    id: '3',
    reportTitle: 'Psychiatric Ward Summary',
    generatedDate: '22 MAY, 2025',
    generatedTime: '10:00',
    department: 'Psychiatry',
    generatedBy: 'Dr. Patel',
    summary: 'Overview of patient progress, medication adherence, and therapy outcomes in the psychiatric ward.'
  },
  {
    id: '4',
    reportTitle: 'Rehabilitation Progress Report',
    generatedDate: '23 MAY, 2025',
    generatedTime: '14:15',
    department: 'Rehabilitation',
    generatedBy: 'Laura White, PT',
    summary: 'Progress of patients in rehabilitation, focusing on physical therapy outcomes.'
  },
  {
    id: '5',
    reportTitle: 'Pediatric Admissions Report',
    generatedDate: '24 MAY, 2025',
    generatedTime: '09:00',
    department: 'Pediatrics',
    generatedBy: 'Dr. Young',
    summary: 'Summary of pediatric admissions, including common diagnoses and treatment plans.'
  },
];

const ClinicalReportView = () => {
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [selectedReportSummary, setSelectedReportSummary] = useState<string>("");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  const filteredReports = mockClinicalReports;

  const clinicalReportTableHeaders = [
    "Report Title",
    "Generated Date:Time",
    "Department",
    "Generated By",
    "Action",
  ];

  const handleViewReport = (summary: string) => {
    setSelectedReportSummary(summary);
    setIsReportDialogOpen(true);
  };

  return (
    <>
      <Card className="flex-1 flex flex-col shadow overflow-hidden">
        <CardContent className="p-2.5 flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs mb-2">
            <Label htmlFor="reportDepartment" className="shrink-0 text-xs">Department</Label>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger id="reportDepartment" className="h-6 w-24 text-xs">
                <SelectValue placeholder="ALL" className="text-xs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">ALL</SelectItem>
                <SelectItem value="ICU" className="text-xs">ICU</SelectItem>
                <SelectItem value="Surgery" className="text-xs">Surgery</SelectItem>
                <SelectItem value="Psychiatry" className="text-xs">Psychiatry</SelectItem>
                <SelectItem value="Rehabilitation" className="text-xs">Rehabilitation</SelectItem>
                <SelectItem value="Pediatrics" className="text-xs">Pediatrics</SelectItem>
              </SelectContent>
            </Select>

            <Label htmlFor="reportFromDate" className="shrink-0 text-xs">From Date</Label>
            <div className="relative">
              <Input
                id="reportFromDate"
                type="text"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="h-6 w-24 text-xs pr-7"
              />
              <CalendarDays className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>

            <Label htmlFor="reportToDate" className="shrink-0 text-xs">To</Label>
            <div className="relative">
              <Input
                id="reportToDate"
                type="text"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="h-6 w-24 text-xs pr-7"
              />
              <CalendarDays className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>

            <Label htmlFor="reportSearch" className="shrink-0 text-xs">Search:</Label>
            <Input
              id="reportSearch"
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="h-6 w-28 text-xs"
            />
          </div>

          <div className="flex-1 overflow-auto min-h-0">
            <Table className="text-xs w-full">
              <ShadcnTableHeader className="bg-accent sticky top-0 z-10">
                <TableRow>
                  {clinicalReportTableHeaders.map(header => (
                    <TableHead key={header} className="py-2 px-3 text-foreground font-semibold h-auto">
                      <div className="flex items-center justify-between">
                        <span className="break-words text-xs">{header}</span>
                        <ArrowUpDown className="h-3 w-3 ml-1 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer" />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </ShadcnTableHeader>
              <TableBody>
                {filteredReports.length > 0 ? filteredReports.map((report, index) => (
                  <TableRow key={report.id} className={`hover:bg-muted/50 ${index % 2 === 0 ? 'bg-muted/30' : ''}`}>
                    <TableCell className="py-1.5 px-3">{report.reportTitle}</TableCell>
                    <TableCell className="py-1.5 px-3">{report.generatedDate} {report.generatedTime}</TableCell>
                    <TableCell className="py-1.5 px-3">{report.department}</TableCell>
                    <TableCell className="py-1.5 px-3">{report.generatedBy}</TableCell>
                    <TableCell className="py-1.5 px-3 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleViewReport(report.summary)}
                      >
                        <FileSignature className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No clinical reports found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-start p-2.5 border-t text-xs text-muted-foreground mt-auto">
            <div>Showing {filteredReports.length > 0 ? 1 : 0} to {filteredReports.length} of {filteredReports.length} entries</div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogUITitle>Report Summary</DialogUITitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] p-1 rounded-md">
            <div className="text-sm whitespace-pre-wrap p-3 border rounded-md bg-muted/30">
              {selectedReportSummary}
            </div>
          </ScrollArea>
          <div className="flex justify-end pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

type ClinicalReminderDataType = {
  id: string;
  reminderTitle: string;
  dueDate: string;
  dueTime: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "COMPLETED" | "OVERDUE";
  assignedTo: string;
  patient: string;
};

// Mock Clinical Reminder Data
const mockClinicalReminders: ClinicalReminderDataType[] = [
  {
    id: '1',
    reminderTitle: 'Follow-up Appointment',
    dueDate: '25 MAY, 2025',
    dueTime: '09:00',
    priority: 'MEDIUM',
    status: 'PENDING',
    assignedTo: 'Dr. Sharma',
    patient: 'John Doe'
  },
  {
    id: '2',
    reminderTitle: 'Lab Results Review',
    dueDate: '24 MAY, 2025',
    dueTime: '14:30',
    priority: 'HIGH',
    status: 'OVERDUE',
    assignedTo: 'Dr. Gupta',
    patient: 'Jane Smith'
  },
  {
    id: '3',
    reminderTitle: 'Medication Renewal',
    dueDate: '26 MAY, 2025',
    dueTime: '10:00',
    priority: 'LOW',
    status: 'PENDING',
    assignedTo: 'Nurse Patel',
    patient: 'Alice Brown'
  },
  {
    id: '4',
    reminderTitle: 'Vaccination Schedule',
    dueDate: '23 MAY, 2025',
    dueTime: '11:00',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    assignedTo: 'Dr. Singh',
    patient: 'Bob Wilson'
  },
  {
    id: '5',
    reminderTitle: 'Annual Checkup',
    dueDate: '27 MAY, 2025',
    dueTime: '08:30',
    priority: 'LOW',
    status: 'PENDING',
    assignedTo: 'Dr. Verma',
    patient: 'Emma Davis'
  },
];

// Clinical Reminder View
const ClinicalReminderView = () => {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");

  const filteredReminders = mockClinicalReminders;

  const clinicalReminderTableHeaders = [
    "Reminder Title",
    "Due Date:Time",
    "Priority",
    "Status",
    "Assigned To",
    "Patient",
    "Action",
  ];

  const handleMarkAsCompleted = (id: string) => {
    // Placeholder for marking reminder as completed
    console.log(`Marking reminder ${id} as completed`);
  };

  return (
    <Card className="flex-1 flex flex-col shadow overflow-hidden">
      <CardContent className="p-2.5 flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs mb-2">
          <Label htmlFor="reminderStatus" className="shrink-0 text-xs">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="reminderStatus" className="h-6 w-24 text-xs">
              <SelectValue placeholder="ALL" className="text-xs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">ALL</SelectItem>
              <SelectItem value="PENDING" className="text-xs">PENDING</SelectItem>
              <SelectItem value="COMPLETED" className="text-xs">COMPLETED</SelectItem>
              <SelectItem value="OVERDUE" className="text-xs">OVERDUE</SelectItem>
            </SelectContent>
          </Select>

          <Label htmlFor="reminderPriority" className="shrink-0 text-xs">Priority</Label>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger id="reminderPriority" className="h-6 w-24 text-xs">
              <SelectValue placeholder="ALL" className="text-xs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">ALL</SelectItem>
              <SelectItem value="LOW" className="text-xs">LOW</SelectItem>
              <SelectItem value="MEDIUM" className="text-xs">MEDIUM</SelectItem>
              <SelectItem value="HIGH" className="text-xs">HIGH</SelectItem>
            </SelectContent>
          </Select>

          <Label htmlFor="reminderFromDate" className="shrink-0 text-xs">From Date</Label>
          <div className="relative">
            <Input
              id="reminderFromDate"
              type="text"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="h-6 w-24 text-xs pr-7"
            />
            <CalendarDays className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>

          <Label htmlFor="reminderToDate" className="shrink-0 text-xs">To</Label>
          <div className="relative">
            <Input
              id="reminderToDate"
              type="text"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="h-6 w-24 text-xs pr-7"
            />
            <CalendarDays className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>

          <Label htmlFor="reminderSearch" className="shrink-0 text-xs">Search:</Label>
          <Input
            id="reminderSearch"
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="h-6 w-28 text-xs"
          />
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          <Table className="text-xs w-full">
            <ShadcnTableHeader className="bg-accent sticky top-0 z-10">
              <TableRow>
                {clinicalReminderTableHeaders.map(header => (
                  <TableHead key={header} className="py-2 px-3 text-foreground font-semibold h-auto">
                    <div className="flex items-center justify-between">
                      <span className="break-words text-xs">{header}</span>
                      <ArrowUpDown className="h-3 w-3 ml-1 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer" />
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </ShadcnTableHeader>
            <TableBody>
              {filteredReminders.length > 0 ? filteredReminders.map((reminder, index) => (
                <TableRow key={reminder.id} className={`hover:bg-muted/50 ${index % 2 === 0 ? 'bg-muted/30' : ''}`}>
                  <TableCell className="py-1.5 px-3">{reminder.reminderTitle}</TableCell>
                  <TableCell className="py-1.5 px-3">{reminder.dueDate} {reminder.dueTime}</TableCell>
                  <TableCell className="py-1.5 px-3">{reminder.priority}</TableCell>
                  <TableCell className="py-1.5 px-3">{reminder.status}</TableCell>
                  <TableCell className="py-1.5 px-3">{reminder.assignedTo}</TableCell>
                  <TableCell className="py-1.5 px-3">{reminder.patient}</TableCell>
                  <TableCell className="py-1.5 px-3 text-center">
                    {reminder.status !== "COMPLETED" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMarkAsCompleted(reminder.id)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No clinical reminders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-start p-2.5 border-t text-xs text-muted-foreground mt-auto">
          <div>Showing {filteredReminders.length > 0 ? 1 : 0} to {filteredReminders.length} of {filteredReminders.length} entries</div>
        </div>
      </CardContent>
    </Card>
  );
};

// Clinical Reminder Analysis Data Type
type ClinicalReminderAnalysisDataType = {
  id: string;
  department: string;
  totalReminders: number;
  completedReminders: number;
  overdueReminders: number;
  completionRate: string;
  analysisDate: string;
};

// Mock Clinical Reminder Analysis Data
const mockClinicalReminderAnalysis: ClinicalReminderAnalysisDataType[] = [
  {
    id: '1',
    department: 'ICU',
    totalReminders: 50,
    completedReminders: 40,
    overdueReminders: 5,
    completionRate: '80%',
    analysisDate: '24 MAY, 2025'
  },
  {
    id: '2',
    department: 'Surgery',
    totalReminders: 30,
    completedReminders: 25,
    overdueReminders: 2,
    completionRate: '83%',
    analysisDate: '24 MAY, 2025'
  },
  {
    id: '3',
    department: 'Psychiatry',
    totalReminders: 20,
    completedReminders: 15,
    overdueReminders: 3,
    completionRate: '75%',
    analysisDate: '24 MAY, 2025'
  },
  {
    id: '4',
    department: 'Rehabilitation',
    totalReminders: 40,
    completedReminders: 35,
    overdueReminders: 1,
    completionRate: '88%',
    analysisDate: '24 MAY, 2025'
  },
  {
    id: '5',
    department: 'Pediatrics',
    totalReminders: 25,
    completedReminders: 20,
    overdueReminders: 2,
    completionRate: '80%',
    analysisDate: '24 MAY, 2025'
  },
];

// Clinical Reminder Analysis View
const ClinicalReminderAnalysisView = () => {
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
  const [analysisDate, setAnalysisDate] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [selectedAnalysisSummary, setSelectedAnalysisSummary] = useState<string>("");
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);

  const filteredAnalysis = mockClinicalReminderAnalysis;

  const clinicalReminderAnalysisTableHeaders = [
    "Department",
    "Total Reminders",
    "Completed Reminders",
    "Overdue Reminders",
    "Completion Rate",
    "Analysis Date",
    "Action",
  ];

  const handleViewSummary = (department: string) => {
    const summary = `Analysis for ${department}: Total Reminders: ${filteredAnalysis.find(d => d.department === department)?.totalReminders}, Completed: ${filteredAnalysis.find(d => d.department === department)?.completedReminders}, Overdue: ${filteredAnalysis.find(d => d.department === department)?.overdueReminders}, Completion Rate: ${filteredAnalysis.find(d => d.department === department)?.completionRate}`;
    setSelectedAnalysisSummary(summary);
    setIsAnalysisDialogOpen(true);
  };

  return (
    <>
      <Card className="flex-1 flex flex-col shadow overflow-hidden">
        <CardContent className="p-2.5 flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs mb-2">
            <Label htmlFor="analysisDepartment" className="shrink-0 text-xs">Department</Label>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger id="analysisDepartment" className="h-6 w-24 text-xs">
                <SelectValue placeholder="ALL" className="text-xs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">ALL</SelectItem>
                <SelectItem value="ICU" className="text-xs">ICU</SelectItem>
                <SelectItem value="Surgery" className="text-xs">Surgery</SelectItem>
                <SelectItem value="Psychiatry" className="text-xs">Psychiatry</SelectItem>
                <SelectItem value="Rehabilitation" className="text-xs">Rehabilitation</SelectItem>
                <SelectItem value="Pediatrics" className="text-xs">Pediatrics</SelectItem>
              </SelectContent>
            </Select>

            <Label htmlFor="analysisDate" className="shrink-0 text-xs">Analysis Date</Label>
            <div className="relative">
              <Input
                id="analysisDate"
                type="text"
                value={analysisDate}
                onChange={e => setAnalysisDate(e.target.value)}
                className="h-6 w-24 text-xs pr-7"
              />
              <CalendarDays className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>

            <Label htmlFor="analysisSearch" className="shrink-0 text-xs">Search:</Label>
            <Input
              id="analysisSearch"
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="h-6 w-28 text-xs"
            />
          </div>

          <div className="flex-1 overflow-auto min-h-0">
            <Table className="text-xs w-full">
              <ShadcnTableHeader className="bg-accent sticky top-0 z-10">
                <TableRow>
                  {clinicalReminderAnalysisTableHeaders.map(header => (
                    <TableHead key={header} className="py-2 px-3 text-foreground font-semibold h-auto">
                      <div className="flex items-center justify-between">
                        <span className="break-words text-xs">{header}</span>
                        <ArrowUpDown className="h-3 w-3 ml-1 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer" />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </ShadcnTableHeader>
              <TableBody>
                {filteredAnalysis.length > 0 ? filteredAnalysis.map((data, index) => (
                  <TableRow key={data.id} className={`hover:bg-muted/50 ${index % 2 === 0 ? 'bg-muted/30' : ''}`}>
                    <TableCell className="py-1.5 px-3">{data.department}</TableCell>
                    <TableCell className="py-1.5 px-3">{data.totalReminders}</TableCell>
                    <TableCell className="py-1.5 px-3">{data.completedReminders}</TableCell>
                    <TableCell className="py-1.5 px-3">{data.overdueReminders}</TableCell>
                    <TableCell className="py-1.5 px-3">{data.completionRate}</TableCell>
                    <TableCell className="py-1.5 px-3">{data.analysisDate}</TableCell>
                    <TableCell className="py-1.5 px-3 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleViewSummary(data.department)}
                      >
                        <FileSignature className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No clinical reminder analysis data found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-start p-2.5 border-t text-xs text-muted-foreground mt-auto">
            <div>Showing {filteredAnalysis.length > 0 ? 1 : 0} to {filteredAnalysis.length} of {filteredAnalysis.length} entries</div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogUITitle>Reminder Analysis Summary</DialogUITitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] p-1 rounded-md">
            <div className="text-sm whitespace-pre-wrap p-3 border rounded-md bg-muted/30">
              {selectedAnalysisSummary}
            </div>
          </ScrollArea>
          <div className="flex justify-end pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Clinical Template Data Type
type ClinicalTemplateDataType = {
  id: string;
  templateName: string;
  department: string;
  lastUpdated: string;
  createdBy: string;
  contentPreview: string;
};

// Mock Clinical Template Data
const mockClinicalTemplates: ClinicalTemplateDataType[] = [
  {
    id: '1',
    templateName: 'Progress Note - General Medicine',
    department: 'General Medicine',
    lastUpdated: '20 MAY, 2025 14:00',
    createdBy: 'Dr. Sharma',
    contentPreview: 'Patient presents with... Vital signs: BP, HR, Temp...'
  },
  {
    id: '2',
    templateName: 'Post-Operative Note - Surgery',
    department: 'Surgery',
    lastUpdated: '21 MAY, 2025 09:30',
    createdBy: 'Dr. Gupta',
    contentPreview: 'Procedure performed... Post-op status: Stable...'
  },
  {
    id: '3',
    templateName: 'Psychiatric Assessment',
    department: 'Psychiatry',
    lastUpdated: '22 MAY, 2025 11:15',
    createdBy: 'Dr. Patel',
    contentPreview: 'Mental status exam... Mood: Stable...'
  },
  {
    id: '4',
    templateName: 'Physical Therapy Session Note',
    department: 'Rehabilitation',
    lastUpdated: '23 MAY, 2025 13:45',
    createdBy: 'Laura White, PT',
    contentPreview: 'Range of motion exercises... Progress: Improved...'
  },
  {
    id: '5',
    templateName: 'Pediatric Discharge Summary',
    department: 'Pediatrics',
    lastUpdated: '24 MAY, 2025 08:00',
    createdBy: 'Dr. Young',
    contentPreview: 'Discharge condition: Stable... Follow-up: 1 week...'
  },
];

// Clinical Template View
const ClinicalTemplateView = () => {
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
  const [searchText, setSearchText] = useState<string>("");
  const [selectedTemplateContent, setSelectedTemplateContent] = useState<string>("");
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  const filteredTemplates = mockClinicalTemplates;

  const clinicalTemplateTableHeaders = [
    "Template Name",
    "Department",
    "Last Updated",
    "Created By",
    "Action",
  ];

  const handleViewTemplate = (content: string) => {
    setSelectedTemplateContent(content);
    setIsTemplateDialogOpen(true);
  };

  return (
    <>
      <Card className="flex-1 flex flex-col shadow overflow-hidden">
        <CardContent className="p-2.5 flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs mb-2">
            <Label htmlFor="templateDepartment" className="shrink-0 text-xs">Department</Label>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger id="templateDepartment" className="h-6 w-24 text-xs">
                <SelectValue placeholder="ALL" className="text-xs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">ALL</SelectItem>
                <SelectItem value="General Medicine" className="text-xs">General Medicine</SelectItem>
                <SelectItem value="Surgery" className="text-xs">Surgery</SelectItem>
                <SelectItem value="Psychiatry" className="text-xs">Psychiatry</SelectItem>
                <SelectItem value="Rehabilitation" className="text-xs">Rehabilitation</SelectItem>
                <SelectItem value="Pediatrics" className="text-xs">Pediatrics</SelectItem>
              </SelectContent>
            </Select>

            <Label htmlFor="templateSearch" className="shrink-0 text-xs">Search:</Label>
            <Input
              id="templateSearch"
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="h-6 w-28 text-xs"
            />
          </div>

          <div className="flex-1 overflow-auto min-h-0">
            <Table className="text-xs w-full">
              <ShadcnTableHeader className="bg-accent sticky top-0 z-10">
                <TableRow>
                  {clinicalTemplateTableHeaders.map(header => (
                    <TableHead key={header} className="py-2 px-3 text-foreground font-semibold h-auto">
                      <div className="flex items-center justify-between">
                        <span className="break-words text-xs">{header}</span>
                        <ArrowUpDown className="h-3 w-3 ml-1 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer" />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </ShadcnTableHeader>
              <TableBody>
                {filteredTemplates.length > 0 ? filteredTemplates.map((template, index) => (
                  <TableRow key={template.id} className={`hover:bg-muted/50 ${index % 2 === 0 ? 'bg-muted/30' : ''}`}>
                    <TableCell className="py-1.5 px-3">{template.templateName}</TableCell>
                    <TableCell className="py-1.5 px-3">{template.department}</TableCell>
                    <TableCell className="py-1.5 px-3">{template.lastUpdated}</TableCell>
                    <TableCell className="py-1.5 px-3">{template.createdBy}</TableCell>
                    <TableCell className="py-1.5 px-3 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleViewTemplate(template.contentPreview)}
                      >
                        <FileSignature className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No clinical templates found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-start p-2.5 border-t text-xs text-muted-foreground mt-auto">
            <div>Showing {filteredTemplates.length > 0 ? 1 : 0} to {filteredTemplates.length} of {filteredTemplates.length} entries</div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogUITitle>Template Preview</DialogUITitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] p-1 rounded-md">
            <div className="text-sm whitespace-pre-wrap p-3 border rounded-md bg-muted/30">
              {selectedTemplateContent}
            </div>
          </ScrollArea>
          <div className="flex justify-end pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClinicalNotesPage;