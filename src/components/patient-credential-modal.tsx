'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Upload, Printer } from 'lucide-react';

interface PatientCredentialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PatientData {
  patientId: string;
  age: number;
  name: string;
  sex: string;
  loginUrl: string;
  userName: string;
  password: string;
  imageUrl?: string;
}

export function PatientCredentialModal({ open, onOpenChange }: PatientCredentialModalProps) {
  const [patientIdInput, setPatientIdInput] = useState('');
  const [patientData, setPatientData] = useState<PatientData | null>(null);

  const handleShowCredential = () => {
    // TODO: Replace with actual API call
    if (patientIdInput === '800000035') {
      setPatientData({
        patientId: '800000035',
        age: 69,
        name: 'Anonymous Two',
        sex: 'MALE',
        loginUrl: 'http://172.30.0.38/ewd/patportal/login.ewd',
        userName: '800000035',
        password: '802453',
        imageUrl: undefined, // No image in the example
      });
    } else {
      setPatientData(null);
      // Optionally show an error message
    }
  };

  const handleCancel = () => {
    setPatientIdInput('');
    setPatientData(null);
    onOpenChange(false);
  };
  
  const handleRefresh = () => {
    setPatientIdInput('');
    setPatientData(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Patient Credential</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-4">
            <Label htmlFor="patient-id-input" className="whitespace-nowrap">Patient ID</Label>
            <Input 
              id="patient-id-input" 
              value={patientIdInput}
              onChange={(e) => setPatientIdInput(e.target.value)}
            />
            <Button onClick={handleShowCredential}>Show Credential</Button>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          </div>

          {patientData && (
            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <div className="flex"><Label className="w-24">Patient ID:</Label> <span>{patientData.patientId}</span></div>
                <div className="flex"><Label className="w-24">Name:</Label> <span>{patientData.name}</span></div>
                <div className="flex"><Label className="w-24">Age:</Label> <span>{patientData.age}</span></div>
                <div className="flex"><Label className="w-24">Sex:</Label> <span>{patientData.sex}</span></div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex"><Label className="w-24">Login URL:</Label> <a href={patientData.loginUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{patientData.loginUrl}</a></div>
                <div className="flex"><Label className="w-24">User Name:</Label> <span>{patientData.userName}</span></div>
                <div className="flex"><Label className="w-24">Password:</Label> <span>{patientData.password}</span></div>
              </div>

              <div className="flex items-end justify-between mt-6">
                <div className="flex items-center space-x-8">
                    <Button variant="ghost" className="flex flex-col h-auto items-center">
                        <Camera className="h-8 w-8" />
                        <span className="text-xs mt-1">Capture Patient Image</span>
                    </Button>
                    <Button variant="ghost" className="flex flex-col h-auto items-center">
                        <Upload className="h-8 w-8" />
                        <span className="text-xs mt-1">Upload Patient Image</span>
                    </Button>
                </div>
                <div className="flex flex-col items-center">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={patientData.imageUrl} />
                        <AvatarFallback>No Image</AvatarFallback>
                    </Avatar>
                </div>
                <div className="self-end">
                    <Button variant="ghost" className="flex flex-col h-auto items-center" onClick={() => window.print()}>
                        <Printer className="h-8 w-8" />
                        <span className="text-xs mt-1">Print</span>
                    </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="mt-4">
            <Button variant="outline" onClick={handleRefresh}>Refresh</Button>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
