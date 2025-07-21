"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiService, Patient } from "@/services/api";
import { 
  User, 
  Phone, 
  BedDouble, 
  CalendarDays, 
  CreditCard,
  LayoutDashboard,
  FileText,
  ClipboardList,
  Stethoscope,
  Activity,
  Pill,
  AlertTriangle,
  HeartPulse,
  Search
} from 'lucide-react';
import { useSidebar } from "@/components/ui/sidebar";
import { PatientDetailsModal } from "@/components/patient-details-modal";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { usePatientAllergies } from "@/hooks/usePatientAllergies";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems: { name: string; icon: any; href: string }[] = [];

export default function SidebarNav() {
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPatientDetailsOpen, setIsPatientDetailsOpen] = useState(false);
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === 'collapsed';

  // Fetch allergies for the current patient
  const { allergies: patientAllergies, loading: allergiesLoading } = usePatientAllergies(patient?.SSN || '');

  // Get the first allergy for display
  const firstAllergy = Object.values(patientAllergies)[0];
  const hasAllergies = Object.keys(patientAllergies).length > 0;

  useEffect(() => {
    const fetchPatient = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const data = await apiService.getPatients();
        if (Array.isArray(data)) {
          const found = (data as any[]).find((p: any) => String(p.DFN) === String(id));
          if (found) {
            const transformedPatient: Patient = {
              id: String(found.DFN || ''),
              name: found.Name || 'Unknown',
              avatarUrl: '',
              gender: found.Gender || '',
              age: typeof found.Age === 'number' ? found.Age : parseInt(found.Age) || 0,
              dob: found.DOB || '',
              wardNo: found.Ward || '',
              bedDetails: found.Bed || '',
              admissionDate: found["Admission Date"] || '',
              lengthOfStay: found.LOS || '',
              mobile: String(found["Mobile No"] || ''),
              primaryConsultant: found["Primary Consultant"] || '',
              specialty: found.Specialty || '',
              encounterProvider: found["Treating Consultant"] || '',
              finalDiagnosis: found["Final Diagnosis"] || '',
              posting: found.Posting || '',
              reasonForVisit: found["Reason For Visit"] || '',
              // Try multiple possible SSN field names from the API
              ssn: String(found.SSN || found.ssn || found['SSN No'] || found['SSN_No'] || ''),
              // Include other fields from ApiPatient if necessary and not already mapped
              "Admission Date": found["Admission Date"] || '',
              Age: found.Age,
              Bed: found.Bed || '',
              DFN: found.DFN || 0,
              DOB: found.DOB || '',
              Gender: found.Gender || '',
              "IP No": found["IP No"] || 0,
              LOS: found.LOS || '',
              "Mobile No": found["Mobile No"] || 0,
              Name: found.Name || '',
              "Primary Consultant": found["Primary Consultant"] || '',
              "Secondary Consultant": found["Secondary Consultant"] || '',
              Specialty: found.Specialty || '',
              "Treating Consultant": found["Treating Consultant"] || '',
              Ward: found.Ward || '',
            };
            setPatient(transformedPatient);
          }
        }
      } catch (error) {
        console.error('Error fetching patient for sidebar:', error);
      }
      setLoading(false);
    };
    if (id) fetchPatient();
    else setPatient(null);
  }, [id]);

  if (!id) return (
    <div className={`text-gray-100 bg-[#1a365d] h-full p-4 text-center ${isCollapsed ? 'w-12' : 'w-full'}`}>
      No patient selected
    </div>
  );
  
  if (loading) return (
    <div className={`text-gray-100 bg-[#1a365d] h-full p-4 text-center ${isCollapsed ? 'w-12' : 'w-full'}`}>
      Loading...
    </div>
  );
  
  if (!patient) return (
    <div className={`text-red-200 bg-[#1a365d] h-full p-4 text-center ${isCollapsed ? 'w-12' : 'w-full'}`}>
      Patient not found
    </div>
  );

  // Format Gender initial and Age
  const genderInitial = patient?.gender ? patient.gender.charAt(0).toUpperCase() : '';
  const formattedPatientInfo = patient ? `${patient.name} (${genderInitial} ${patient.age})` : '';

  const handlePatientNameClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (patient) {
      setIsPatientDetailsOpen(true);
    }
  };

  return (
    <aside 
      className={`bg-[#1a365d] text-white min-h-screen overflow-y-auto text-xs transition-all duration-200 ${
        isCollapsed ? 'w-12' : 'w-full max-w-xs'
      }`}
    >
      <div className="flex flex-col items-center">
        {/* Patient Search Button */}
        <Link href="/patients" className="flex items-center gap-2 p-2 mb-2 rounded-md hover:bg-[#2c5282] text-white w-full justify-center">
          <Search className="h-4 w-4" />
          {!isCollapsed && <span className="text-sm font-medium">Patient Search</span>}
        </Link>

        {!isCollapsed && patient && (
          <>
            {/* Avatar Placeholder */}
            <div className="w-16 h-16 rounded-full bg-[#2c5282] flex items-center justify-center mb-2 mt-4">
              <User className="w-10 h-10 text-blue-200" />
            </div>
            {/* Patient Name (Gender Age) */}
            <button 
              onClick={handlePatientNameClick}
              className="text-sm font-semibold text-center mb-4 text-white hover:underline cursor-pointer"
            >
              {formattedPatientInfo}
            </button>
          </>
        )}
        
        {/* Navigation Items */}
        {/* {renderNavigationItems()} */}

        {!isCollapsed && (
          <>
            <div className="mb-2 px-4 w-full">
              {/* Patient ID with Icon */}
              <div className="flex items-center text-blue-100">
                <CreditCard className="mr-2 h-4 w-4 flex-shrink-0 text-blue-200" />
                <span className="truncate">UHID: {patient.ssn || 'N/A'}</span>
              </div>
              {/* Mobile No. with Icon */}
              <div className="flex items-center text-blue-100">
                <Phone className="mr-2 h-4 w-4 flex-shrink-0 text-blue-200" />
                <span className="truncate">{patient.mobile || patient["Mobile No"] || 'N/A'}</span>
              </div>
            </div>

            <hr className="my-2 border-[#2c5282] w-full" />

            <div className="mb-4 w-full text-blue-100">
              <div className="font-semibold mb-2 text-white px-4">Patient Visit / IPD Details</div>
              <div className="space-y-1 px-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-200">Ward:</span>
                  <span>{patient.Ward}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-200">Bed:</span>
                  <span>{patient.Bed}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 mb-1 px-4">
                <CalendarDays className="h-4 w-4 flex-shrink-0 text-blue-200" />
                <span className="truncate">{patient["Admission Date"]}</span>
              </div>
              <div className="mb-1 px-4">
                <span className="font-semibold text-blue-200">LOS:</span> {patient.LOS ? patient.LOS.split('^')[0] : ''} 
              </div>
              <div className="mb-1 px-4">
                <span className="font-semibold text-blue-200">Primary Consultant:</span> {patient["Primary Consultant"]}
              </div>
              <div className="mb-1 px-4">
                <span className="font-semibold text-blue-200">Encounter Provider:</span> {patient["Treating Consultant"]}
              </div>
            </div>
            <hr className="my-2 border-[#2c5282] w-full" />
            <div className="mb-4 w-full text-blue-100">
              <div className="font-semibold mb-2 text-white px-4">Patient Clinical Details</div>
              <div className="mb-1 px-4"><span className="font-semibold text-blue-200">Final Diagnosis:</span> {patient.finalDiagnosis}</div>
              <div className="mb-1 px-4"><span className="font-semibold text-blue-200">Posting:</span> {patient.posting}</div>
              <div className="mb-1 px-4"><span className="font-semibold text-blue-200">Reason For Visit:</span> {patient.reasonForVisit}</div>
              <div className="mb-1 px-4">
                <span className="font-semibold text-blue-200">Allergies: </span>
                {allergiesLoading ? (
                  <span className="text-blue-200">Loading...</span>
                ) : hasAllergies ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-left hover:underline focus:outline-none">
                          {firstAllergy?.Allergies || 'No allergies'}
                          {Object.keys(patientAllergies).length > 1 && ' +' + (Object.keys(patientAllergies).length - 1) + ' more'}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs bg-gray-800 text-white border-gray-600">
                        <div className="space-y-1">
                          {Object.values(patientAllergies).map((allergy, index) => (
                            <div key={index} className="py-1">
                              <div className="font-medium">{allergy.Allergies}</div>
                              {allergy.Symptoms && (
                                <div className="text-sm text-gray-300">Symptoms: {allergy.Symptoms}</div>
                              )}
                              {allergy["Nature of Reaction"] && (
                                <div className="text-sm text-gray-300">Reaction: {allergy["Nature of Reaction"]}</div>
                              )}
                              {index < Object.keys(patientAllergies).length - 1 && (
                                <hr className="my-1 border-gray-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <span>No known allergies</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Patient Details Modal */}
      {patient && (
        <PatientDetailsModal
          isOpen={isPatientDetailsOpen}
          onClose={() => setIsPatientDetailsOpen(false)}
          patient={patient}
        />
      )}
    </aside>
  );
}