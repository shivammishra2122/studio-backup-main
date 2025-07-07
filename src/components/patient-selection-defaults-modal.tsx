'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

type PatientSelectionDefaultsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PatientSelectionDefaultsModal({ open, onOpenChange }: PatientSelectionDefaultsModalProps) {
  const [formData, setFormData] = useState({
    listSource: 'Primary Provider',
    shortOrder: 'Alphabetical',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [selections, setSelections] = useState({
    primaryProvider: 'SAN,NEUROLOGY~103',
    treatingSpecialty: 'ALLERGY AND ASTHMA',
    teamList: 'SAN COMMON TEAM',
    ward: 'ICU ONE',
    clinicDays: {
      monday: 'CARDIOLOGY',
      tuesday: 'INTERNAL MEDICINE ONE',
      wednesday: 'INTERNAL MEDICINE TWO',
      thursday: 'INTERNAL MEDICINE THREE',
      friday: 'NEURO SURGERY THREE',
      saturday: 'NEURO SURGERY TWO',
      sunday: 'NEUROLOGY TWO'
    }
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', { ...formData, ...selections });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Patient Selection Defaults</DialogTitle>
          <p className="text-sm text-muted-foreground">
            The values on the right will be defaults for selecting patients depending on the list source selected.
            Combination uses the criteria defined using Source Combinations.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-12 gap-6">
            <div className="space-y-4 col-span-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">List Source</Label>
                <Select 
                  value={formData.listSource} 
                  onValueChange={(value) => handleChange('listSource', value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select list source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primary Provider">Primary Provider</SelectItem>
                    <SelectItem value="Treating Specialty">Treating Specialty</SelectItem>
                    <SelectItem value="Team / List">Team / List</SelectItem>
                    <SelectItem value="Ward">Ward</SelectItem>
                    <SelectItem value="Clinic">Clinic</SelectItem>
                    <SelectItem value="Combination">Combination</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Short Order</Label>
                <Select 
                  value={formData.shortOrder} 
                  onValueChange={(value) => handleChange('shortOrder', value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select short order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alphabetical">Alphabetical</SelectItem>
                    <SelectItem value="Room / Bed">Room / Bed</SelectItem>
                    <SelectItem value="Appointment Date">Appointment Date</SelectItem>
                    <SelectItem value="Terminal Digit">Terminal Digit</SelectItem>
                    <SelectItem value="Source">Source</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Display patients that have clinic appointments within this date range.</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Start</Label>
                    <Input 
                      type="date" 
                      className="h-8 text-xs"
                      value={formData.startDate}
                      onChange={(e) => handleChange('startDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Stop</Label>
                    <Input 
                      type="date" 
                      className="h-8 text-xs"
                      value={formData.endDate}
                      onChange={(e) => handleChange('endDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-l pl-6 col-span-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Primary Provider</Label>
                  <div className="text-xs p-2 bg-muted rounded">{selections.primaryProvider}</div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Treating Specialty</Label>
                  <div className="text-xs p-2 bg-muted rounded">{selections.treatingSpecialty}</div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Team / List</Label>
                  <div className="text-xs p-2 bg-muted rounded">{selections.teamList}</div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Ward</Label>
                  <div className="text-xs p-2 bg-muted rounded">{selections.ward}</div>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <Label className="text-xs font-medium">Clinic For Day Of Week</Label>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="flex items-center justify-between p-1">
                    <span className="font-medium">Monday:</span>
                    <span className="bg-muted px-2 py-1 rounded">{selections.clinicDays.monday}</span>
                  </div>
                  <div className="flex items-center justify-between p-1">
                    <span className="font-medium">Tuesday:</span>
                    <span className="bg-muted px-2 py-1 rounded">{selections.clinicDays.tuesday}</span>
                  </div>
                  <div className="flex items-center justify-between p-1">
                    <span className="font-medium">Wednesday:</span>
                    <span className="bg-muted px-2 py-1 rounded">{selections.clinicDays.wednesday}</span>
                  </div>
                  <div className="flex items-center justify-between p-1">
                    <span className="font-medium">Thursday:</span>
                    <span className="bg-muted px-2 py-1 rounded">{selections.clinicDays.thursday}</span>
                  </div>
                  <div className="flex items-center justify-between p-1">
                    <span className="font-medium">Friday:</span>
                    <span className="bg-muted px-2 py-1 rounded">{selections.clinicDays.friday}</span>
                  </div>
                  <div className="flex items-center justify-between p-1">
                    <span className="font-medium">Saturday:</span>
                    <span className="bg-muted px-2 py-1 rounded">{selections.clinicDays.saturday}</span>
                  </div>
                  <div className="flex items-center justify-between p-1">
                    <span className="font-medium">Sunday:</span>
                    <span className="bg-muted px-2 py-1 rounded">{selections.clinicDays.sunday}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              OK
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
