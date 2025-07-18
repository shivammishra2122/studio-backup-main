'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface DoctorAvailabilityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Doctor {
  id: number;
  name: string;
  speciality: string;
  available: boolean;
  nextAvailable?: string;
  location: string;
  contact: string;
}

const specialities = [
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Oncology',
  'Pediatrics',
  'Orthopedics',
  'General Medicine',
  'ENT',
  'Ophthalmology',
  'Gynecology',
  'Urology',
  'Nephrology',
  'Endocrinology',
  'Gastroenterology',
  'Pulmonology',
  'Rheumatology',
  'Hematology',
  'Infectious Disease',
  'Psychiatry',
  'Physical Medicine',
  'Emergency Medicine',
  'Family Medicine',
  'Internal Medicine',
  'Anesthesiology',
  'Pathology',
  'Radiology',
  'General Surgery',
  'Cardiothoracic Surgery',
  'Neurosurgery',
  'Orthopedic Surgery',
  'Plastic Surgery',
  'Vascular Surgery',
  'Pediatric Surgery',
  'Surgical Oncology',
  'Colorectal Surgery',
  'Maxillofacial Surgery',
  'Cardiovascular Surgery',
  'Transplant Surgery',
  'Trauma Surgery',
  'Bariatric Surgery',
];

// Sample doctor data
const doctorsData: Record<string, Doctor[]> = {
  cardiology: [
    { id: 1, name: 'Dr. John Smith', speciality: 'Cardiology', available: true, location: 'Main Hospital, 2nd Floor', contact: 'Ext. 1234' },
    { id: 2, name: 'Dr. Sarah Johnson', speciality: 'Cardiology', available: false, nextAvailable: '2:00 PM', location: 'Heart Center, 3rd Floor', contact: 'Ext. 2345' },
    { id: 3, name: 'Dr. Michael Brown', speciality: 'Cardiology', available: true, location: 'Main Hospital, 2nd Floor', contact: 'Ext. 3456' },
  ],
  neurology: [
    { id: 4, name: 'Dr. Emily Davis', speciality: 'Neurology', available: true, location: 'Neuro Center, 4th Floor', contact: 'Ext. 4567' },
    { id: 5, name: 'Dr. Robert Wilson', speciality: 'Neurology', available: false, nextAvailable: 'Tomorrow 9:00 AM', location: 'Main Hospital, 4th Floor', contact: 'Ext. 5678' },
  ],
};

export function DoctorAvailabilityModal({ open, onOpenChange }: DoctorAvailabilityModalProps) {
  const [selectedSpeciality, setSelectedSpeciality] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleClose = () => {
    setSelectedSpeciality('');
    setSearchQuery('');
    onOpenChange(false);
  };

  // Get all doctors for the selected speciality
  const filteredDoctors = selectedSpeciality 
    ? (doctorsData[selectedSpeciality.toLowerCase()] || [])
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="text-lg">Doctor's Availability</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="speciality-select" className="text-sm font-medium">
                Select Speciality
              </Label>
              <Select value={selectedSpeciality} onValueChange={setSelectedSpeciality}>
                <SelectTrigger id="speciality-select" className="mt-1 w-full">
                  <SelectValue placeholder="Select Speciality" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {specialities.map((speciality) => (
                    <SelectItem key={speciality} value={speciality.toLowerCase()}>
                      {speciality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedSpeciality && (
            <div className="mt-4 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Doctor Name</TableHead>
                    <TableHead className="w-[20%]">Status</TableHead>
                    <TableHead className="w-[20%]">Location</TableHead>
                    <TableHead className="w-[20%]">Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor) => (
                      <TableRow key={doctor.id}>
                        <TableCell className="font-medium">{doctor.name}</TableCell>
                        <TableCell>
                          {doctor.available ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Available
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600">
                              <XCircle className="h-4 w-4 mr-1" />
                              Not Available
                              {doctor.nextAvailable && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  (Next: {doctor.nextAvailable})
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{doctor.location}</TableCell>
                        <TableCell>{doctor.contact}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No doctors found for the selected speciality.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <div className="flex justify-between w-full">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              Last updated: {new Date().toLocaleTimeString()}
            </div>
            <div>
              <Button variant="outline" className="mr-2" onClick={handleClose}>
                Close
              </Button>
              <Button>Print</Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
