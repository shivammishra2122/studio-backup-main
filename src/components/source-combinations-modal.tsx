'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X } from 'lucide-react';
import { useState } from 'react';

type SourceType = 'WARD' | 'CLINIC' | 'PROVIDER' | 'SPECIALTY' | 'LIST';

interface Combination {
  id: string;
  entry: string;
  source: SourceType;
}

type SourceCombinationsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SourceCombinationsModal({ open, onOpenChange }: SourceCombinationsModalProps) {
  const [selectedSource, setSelectedSource] = useState<SourceType>('WARD');
  const [combinations, setCombinations] = useState<Combination[]>([
    { id: '1', entry: 'MEDICINE WARD ONE', source: 'WARD' },
    { id: '2', entry: 'NEUROSURGERY WARD ONE', source: 'WARD' },
  ]);

  // Sample data for the dropdowns
  const sourceItems = {
    WARD: [
      'GENERAL DAYCARE',
      'ICU ONE',
      'ICU THREE',
      'ICU TWO',
      'MEDICINE WARD ONE',
      'MEDICINE WARD TWO',
      'MICU THREE',
      'NEUROLOGY WARD TWO',
      'NEURO SURGERY WARD TWO',
      'NEUROLOGY WARD ONE',
      'NEUROSURGERY WARD ONE',
      'ONCO-DAYCARE',
      'OT RECOVERY',
    ],
    CLINIC: ['CARDIOLOGY', 'NEUROLOGY', 'ORTHOPEDICS', 'PEDIATRICS'],
    PROVIDER: ['DR. SMITH', 'DR. JOHNSON', 'DR. WILLIAMS', 'DR. BROWN'],
    SPECIALTY: ['CARDIOLOGY', 'NEUROLOGY', 'ORTHOPEDICS', 'PEDIATRICS'],
    LIST: ['TEAM A', 'TEAM B', 'TEAM C', 'TEAM D'],
  };

  const handleItemSelect = (value: string) => {
    if (!value) return;
    
    const newCombination: Combination = {
      id: Date.now().toString(),
      entry: value,
      source: selectedSource,
    };

    setCombinations(prev => [...prev, newCombination]);
    // Reset the dropdown selection
    const select = document.getElementById('sourceSelect') as HTMLSelectElement;
    if (select) select.selectedIndex = 0;
  };

  const handleRemoveCombination = (id: string) => {
    setCombinations(combinations.filter(item => item.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Source Combinations</DialogTitle>
          <DialogDescription>
            You can change your combinations by adding or removing specific wards, clinics, providers, specialties, or lists.
            Patients meeting this criteria can be used for patient selection.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 mt-2 h-[60vh] max-h-[60vh] overflow-hidden">
          {/* Column 1: Source Selection */}
          <div className="space-y-1 border-r pr-2">
            <h3 className="text-xs font-medium mb-1">Select Source By</h3>
            <RadioGroup 
              value={selectedSource} 
              onValueChange={(value) => setSelectedSource(value as SourceType)}
              className="space-y-1"
            >
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="WARD" id="ward" className="h-3 w-3" />
                <Label htmlFor="ward" className="text-xs">Ward</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="CLINIC" id="clinic" className="h-3 w-3" />
                <Label htmlFor="clinic" className="text-xs">Clinic</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="PROVIDER" id="provider" className="h-3 w-3" />
                <Label htmlFor="provider" className="text-xs">Provider</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="SPECIALTY" id="specialty" className="h-3 w-3" />
                <Label htmlFor="specialty" className="text-xs">Specialty</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="LIST" id="list" className="h-3 w-3" />
                <Label htmlFor="list" className="text-xs">List</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Column 2: Item List */}
          <div className="space-y-1 border-r pr-2">
            <Label className="text-xs">{selectedSource.charAt(0) + selectedSource.slice(1).toLowerCase()}:</Label>
            <div className="h-[calc(100%-1.5rem)] overflow-y-auto">
              <select
                id="sourceSelect"
                className="w-full p-1 border rounded text-xs h-full"
                size={15}
                style={{
                  height: '100%',
                  minHeight: '100%',
                  maxHeight: '100%',
                }}
                onChange={(e) => handleItemSelect(e.target.value)}
              >
                <option value="">Select {selectedSource.toLowerCase()}</option>
                {sourceItems[selectedSource]
                  .filter(item => !combinations.some(combo => combo.entry === item && combo.source === selectedSource))
                  .map((item) => (
                    <option key={item} value={item} className="text-xs">
                      {item}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Column 3: Combinations Table */}
          <div className="space-y-1">
            <h3 className="text-xs font-medium">Combinations:</h3>
            <div className="h-[calc(100%-1.5rem)] overflow-hidden flex flex-col">
              <div className="overflow-y-auto flex-1">
                <Table className="border">
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow className="h-6">
                      <TableHead className="p-1 text-xs font-medium">Entry</TableHead>
                      <TableHead className="p-1 text-xs font-medium w-16">Source</TableHead>
                      <TableHead className="p-1 w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combinations.length > 0 ? (
                      combinations.map((item) => (
                        <TableRow key={item.id} className="h-6 hover:bg-muted/50">
                          <TableCell className="p-1 text-xs truncate">{item.entry}</TableCell>
                          <TableCell className="p-1 text-xs">{item.source}</TableCell>
                          <TableCell className="p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 ml-auto"
                              onClick={() => handleRemoveCombination(item.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-2 text-muted-foreground text-xs">
                          No combinations
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2 mt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button">
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
