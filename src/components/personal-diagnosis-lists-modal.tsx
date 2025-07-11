'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, X, Plus, Check, ChevronDown } from 'lucide-react';

type Diagnosis = {
  id: string;
  code: string;
  description: string;
};

type PersonalDiagnosisListsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PersonalDiagnosisListsModal({ open, onOpenChange }: PersonalDiagnosisListsModalProps) {
  const [searchText, setSearchText] = useState('');
  const [selectedSection, setSelectedSection] = useState('Problem List Items');
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<Diagnosis[]>([]);
  const [selectedCode, setSelectedCode] = useState<Diagnosis | null>(null);

  // Mock data for diagnosis sections
  const diagnosisSections = [
    'Problem List Items',
    'Admit Diagnosis',
    'Discharge Diagnosis',
    'Pre-op Diagnosis',
    'Post-op Diagnosis',
  ];

  // Mock data for diagnoses
  const diagnoses: Diagnosis[] = [
    { id: '1', code: 'S72.90', description: 'Fracture of unspecified part of' },
    { id: '2', code: 'M25.50', description: 'Pain in Joints' },
    { id: '3', code: 'M25.55', description: 'Pain in unspecified Hip' },
    { id: '4', code: 'D64.9', description: 'Anemia' },
    { id: '5', code: 'E11.9', description: 'Diabetes' },
    { id: '6', code: 'F29', description: 'Confusion' },
    { id: '7', code: 'K92.0', description: 'Blood in vomit' },
    { id: '8', code: 'O26.9', description: 'Maternal Care for High Head a' },
  ];

  const handleAddDiagnosis = (diagnosis: Diagnosis) => {
    if (!selectedDiagnoses.some(d => d.id === diagnosis.id)) {
      setSelectedDiagnoses([...selectedDiagnoses, diagnosis]);
    }
  };

  const handleRemoveDiagnosis = (diagnosisId: string) => {
    setSelectedDiagnoses(selectedDiagnoses.filter(d => d.id !== diagnosisId));
  };

  const handleSelectCode = (diagnosis: Diagnosis) => {
    setSelectedCode(diagnosis);
  };

  const handleAddSelectedCode = () => {
    if (selectedCode && !selectedDiagnoses.some(d => d.id === selectedCode.id)) {
      setSelectedDiagnoses([...selectedDiagnoses, selectedCode]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Personal Diagnosis List</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Left Panel - Diagnosis Sections */}
          <div className="w-1/4 border rounded-md p-2 flex flex-col">
            <h3 className="font-medium mb-2">Diagnosis Sections</h3>
            <div className="border rounded overflow-y-auto flex-1">
              {diagnosisSections.map((section) => (
                <div 
                  key={section}
                  className={`p-2 cursor-pointer hover:bg-accent ${
                    selectedSection === section ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedSection(section)}
                >
                  {section}
                </div>
              ))}
            </div>
          </div>
          
          {/* Middle Panel - Diagnosis to add */}
          <div className="w-2/4 border rounded-md p-2 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search diagnosis..."
                  className="pl-8"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>
            
            <div className="border rounded overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Code</th>
                    <th className="p-2 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnoses
                    .filter(d => 
                      d.code.toLowerCase().includes(searchText.toLowerCase()) ||
                      d.description.toLowerCase().includes(searchText.toLowerCase())
                    )
                    .map((diagnosis) => (
                      <tr 
                        key={diagnosis.id} 
                        className={`border-t cursor-pointer hover:bg-accent ${
                          selectedCode?.id === diagnosis.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleSelectCode(diagnosis)}
                      >
                        <td className="p-2">{diagnosis.code}</td>
                        <td className="p-2">{diagnosis.description}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Right Panel - Selected Diagnosis Codes */}
          <div className="w-1/4 border rounded-md p-2 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Diagnosis Codes</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddSelectedCode}
                disabled={!selectedCode}
              >
                Add
              </Button>
            </div>
            
            <div className="border rounded overflow-y-auto flex-1">
              {selectedDiagnoses.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No diagnosis codes added
                </div>
              ) : (
                <div className="divide-y">
                  {selectedDiagnoses.map((diagnosis) => (
                    <div 
                      key={diagnosis.id} 
                      className="p-2 flex justify-between items-center hover:bg-accent"
                    >
                      <div>
                        <div className="font-medium">{diagnosis.code}</div>
                        <div className="text-xs text-muted-foreground">{diagnosis.description}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveDiagnosis(diagnosis.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="border-t pt-4">
          <div className="flex justify-between w-full">
            <Button variant="outline" className="border-dashed">
              Other Diagnosis
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button>OK</Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
