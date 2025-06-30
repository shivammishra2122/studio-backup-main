"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Printer, User, AlertCircle, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Patient } from "@/services/api";
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from 'react';

interface PatientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  isLoading?: boolean;
  error?: string | null;
}

// Section Component
interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

const Section = ({ title, children, defaultOpen = true, className }: SectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className={cn("border rounded-lg overflow-hidden bg-white shadow-sm", className)}>
      <button
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      {isOpen && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
};

// DetailRow Component
interface DetailRowProps {
  label: string;
  value?: string | number | null;
  copyable?: boolean;
  fieldName?: string;
  className?: string;
}

const DetailRow = ({ 
  label, 
  value, 
  copyable = false, 
  fieldName = '', 
  className = '' 
}: DetailRowProps) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayValue = value || 'N/A';
  
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-2", className)}>
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className="md:col-span-3 flex items-center">
        <span className="text-sm text-gray-900 break-words">{displayValue}</span>
        {copyable && value && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-2 text-gray-400 hover:text-gray-900"
                  onClick={() => handleCopy(String(value))}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy to clipboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

// Helper function to safely format dates
const formatDate = (dateString?: string | null, formatStr = 'dd MMM yyyy') => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid Date';
    return format(date, formatStr);
  } catch (e) {
    return 'N/A';
  }
};

export function PatientDetailsModal({ 
  isOpen, 
  onClose, 
  patient, 
  isLoading = false,
  error = null 
}: PatientDetailsModalProps) {
  const handlePrint = () => {
    window.print();
  };

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-red-100 p-3 mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Error Loading Patient Details</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {error || 'An unexpected error occurred while loading patient information.'}
            </p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full h-full max-w-none max-h-none rounded-none flex flex-col border-0 shadow-none overflow-hidden bg-white p-0">
        {/* Header - Made more compact */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-700 to-blue-900 text-white px-4 py-2 flex justify-between items-center border-b border-blue-600">
          <div className="py-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <User className="h-4 w-4" />
              {isLoading ? <Skeleton className="h-5 w-40 bg-blue-600/30" /> : 'Patient Details'}
            </h2>
            {!isLoading && patient && (
              <p className="text-xs text-blue-100 mt-0.5">
                {patient.name} • {patient.id}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="xs" 
              onClick={handlePrint} 
              className="text-blue-100 hover:bg-blue-600/30 hover:text-white h-8 px-2"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline text-xs">Print</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-blue-100 hover:bg-blue-600/30 hover:text-white h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-6 bg-gray-50">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full bg-gray-200 rounded-lg" />
              ))}
            </div>
          ) : patient ? (
            <div className="space-y-6">
              {/* ===== PATIENT BASIC INFO ===== */}
              <Section title="Patient Information">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DetailRow label="Full Name" value={patient.name} copyable fieldName="name" />
                    <DetailRow label="Gender" value={patient.gender} />
                    <DetailRow label="Age" value={patient.age} />
                    <DetailRow 
                      label="Date of Birth" 
                      value={formatDate(patient.dob)} 
                      copyable 
                      fieldName="dob" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailRow label="Father's Name" value={patient.fatherName} />
                    <DetailRow label="Mother's Name" value={patient.motherName} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailRow label="Aadhaar No." value={patient.aadhaarNo} copyable fieldName="aadhaar" />
                    <DetailRow label="Passport" value={patient.passport} copyable fieldName="passport" />
                  </div>
                </div>
              </Section>

              {/* ===== CONTACT & ADDRESS ===== */}
              <Section title="Contact Information">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DetailRow label="Mobile No." value={patient.mobile} copyable fieldName="mobile" />
                    <DetailRow label="Alternate Phone" value={patient.phone} copyable fieldName="phone" />
                    <DetailRow label="Email" value={patient.email} copyable fieldName="email" />
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Address Details</h4>
                    <div className="space-y-4">
                      <DetailRow label="Local Address" value={patient.address} copyable fieldName="address" />
                      <DetailRow label="Permanent Address" value={patient.permanentAddress} copyable fieldName="permanentAddress" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailRow label="Permanent Phone" value={patient.permanentPhone} copyable fieldName="permanentPhone" />
                        <DetailRow label="Permanent Mobile" value={patient.permanentMobile} copyable fieldName="permanentMobile" />
                      </div>
                    </div>
                  </div>
                </div>
              </Section>

              {/* ===== MEDICAL REGISTRATION ===== */}
              <Section title="Medical Registration & History">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <DetailRow label="Patient ID" value={patient.id} copyable fieldName="patientId" />
                    <DetailRow 
                      label="Registration Date/Time" 
                      value={formatDate(patient.registrationDate, 'dd MMM yyyy hh:mm a')} 
                    />
                    <DetailRow label="Status" value={patient.status} />
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Medical History</h4>
                    <div className="space-y-4">
                      <DetailRow label="Chief Complaints" value={patient.chiefComplaints} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailRow label="Final Diagnosis" value={patient.finalDiagnosis} />
                        <DetailRow label="Comorbidity" value={patient.comorbidity} />
                      </div>
                      <DetailRow label="Special Precautions" value={patient.specialPrecautions} />
                      <DetailRow label="Remarks" value={patient.remarks} />
                    </div>
                  </div>
                </div>
              </Section>

              {/* ===== ADMISSION DETAILS ===== */}
              <Section title="Admission Details">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DetailRow 
                      label="Admission Date/Time" 
                      value={formatDate(patient.admissionDate, 'dd MMM yyyy hh:mm a')} 
                    />
                    <DetailRow label="IP No." value={patient.ipNo} copyable fieldName="ipNo" />
                    <DetailRow label="Type of Admission" value={patient.admissionType} />
                    <DetailRow label="Transferred" value={patient.transferred} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DetailRow label="Ward" value={patient.ward} />
                    <DetailRow label="Room/Bed" value={patient.roomBed} />
                    <DetailRow label="Specialty" value={patient.specialty} />
                  </div>
                </div>
              </Section>

              {/* ===== MEDICAL TEAM ===== */}
              <Section title="Medical Team">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailRow label="Primary Consultant 1" value={patient.primaryConsultant1} />
                    <DetailRow label="Primary Consultant 2" value={patient.primaryConsultant2} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DetailRow label="Referred By" value={patient.referredBy} />
                    <DetailRow label="Attended By" value={patient.attendedBy} />
                    <DetailRow label="Brought By" value={patient.broughtBy} />
                  </div>
                </div>
              </Section>

              {/* ===== ADDITIONAL SECTIONS ===== */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Section title="Insurance Details" defaultOpen={false}>
                  <DetailRow label="Payer Category" value={patient.payerCategory} />
                </Section>

                <Section title="eMLC Details" defaultOpen={false}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <DetailRow label="eMLC ID" value={patient.emlcId} />
                      <DetailRow label="Facility Incharge" value={patient.facilityIncharge} />
                      <DetailRow label="Mode of Injury" value={patient.modeOfInjury} />
                      <DetailRow label="eMLC Report Link" value={patient.emlcReportLink} />
                    </div>
                  </div>
                </Section>
              </div>

              <Section title="Autopsy Details" defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <DetailRow label="Date of Death" value={formatDate(patient.dateOfDeath)} />
                  <DetailRow label="Death Certificate" value={patient.deathCertificate} />
                  <DetailRow label="Death Report" value={patient.deathReport} />
                  <DetailRow label="Police Application" value={patient.policeApplication} />
                  <DetailRow label="Death Card" value={patient.deathCard} />
                  <DetailRow label="Source of Notification" value={patient.sourceOfNotification} />
                </div>
              </Section>
            </div>
          ) : null}
        </div>

        {/* Footer - Made more compact */}
        <div className="sticky bottom-0 bg-white border-t p-2 flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 px-3 text-xs">
            Close
          </Button>
          <Button variant="default" size="sm" onClick={handlePrint} className="h-8 px-3 text-xs">
            <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
