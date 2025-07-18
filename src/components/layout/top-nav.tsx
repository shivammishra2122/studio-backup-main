'use client';

import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, MoreVertical, MapPin, Lock, PenLine, LogOut, HelpCircle, Package, User, Building2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogoutButton } from '@/components/auth/logout-button';
import { PatientSelectionDefaultsModal } from '../patient-selection-defaults-modal';
import { SourceCombinationsModal } from '../source-combinations-modal';
import { PersonalListsModal } from '../personal-lists-modal';
import { PersonalDiagnosisListsModal } from '../personal-diagnosis-lists-modal';
import { TeamInformationModal } from '../team-information-modal';
import { useState } from 'react';

const navButtonLabels = [
  "Cover Sheet", "Dashboard", "Orders", "Clinical Notes", "Discharge Summary",
  "Emergency Care", "Postmortem", "Nursing", "Referral", "Lab", "Radiology",
  "Report"
];

// Custom SVG Icon Components for the dropdown header
const HeadsetIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" {...props}>
    <circle cx="12" cy="12" r="10" fill="#4472C4" stroke="none" />
    <path d="M12 1a9 9 0 0 0-9 9v4a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2V9a2 2 0 0 0-1.6-1.9M21 14h-1a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-4a9 9 0 0 0-9-9" stroke="#FFF" strokeWidth="1.5" fill="none" />
    <circle cx="8" cy="14" r="3" fill="#FFF" stroke="none" />
    <circle cx="16" cy="14" r="3" fill="#FFF" stroke="none" />
  </svg>
);

const AlertIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <circle cx="12" cy="12" r="10" fill="#FF0000" stroke="none" />
    <path d="M12 16h.01" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 8v4" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PowerIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <circle cx="12" cy="12" r="10" fill="#FF0000" stroke="none" />
    <path d="M12 2.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm0 3.25V12" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);


export function TopNav() {
  const pathname = usePathname();
  const [showPatientSelectionModal, setShowPatientSelectionModal] = useState(false);
  const [showSourceCombinationsModal, setShowSourceCombinationsModal] = useState(false);
  const [showPersonalListsModal, setShowPersonalListsModal] = useState(false);
  const [showPersonalDiagnosisListsModal, setShowPersonalDiagnosisListsModal] = useState(false);
  const [showTeamInformationModal, setShowTeamInformationModal] = useState(false);

  // Detect if on a patient-specific route: /patients/[id] or /patients/[id]/something
  const patientMatch = pathname.match(/^\/patients\/(\w+)(?:\/|$)/);
  const patientId = patientMatch ? patientMatch[1] : null;

  return (
    <div className="bg-card px-1 py-1 flex items-center min-h-8 w-full shadow-sm">
      {/* Left side - Sidebar toggle */}
      <div className="md:hidden flex-shrink-0">
        <SidebarTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Menu className="h-4 w-4" />
          </Button>
        </SidebarTrigger>
      </div>

      {/* Middle - Navigation buttons with scroll */}
      <div className="flex-1 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-0.5 flex-nowrap">
          {navButtonLabels.map((label) => {
            let href = "#";
            if (patientId) {
              // Patient-specific links
              if (label === "Cover Sheet") href = `/patients/${patientId}`;
              else if (label === "Dashboard") href = `/patients/${patientId}/vitals-dashboard`;
              else if (label === "Orders") href = `/patients/${patientId}/orders`;
              else if (label === "Clinical Notes") href = `/patients/${patientId}/clinical-notes`;
              else if (label === "Discharge Summary") href = `/patients/${patientId}/discharge-summary`;
              else if (label === "Emergency Care") href = `/patients/${patientId}/emergency-care`;
              else if (label === "Postmortem") href = `/patients/${patientId}/postmortem`;
              else if (label === "Nursing") href = `/patients/${patientId}/nursing`;
              else if (label === "Referral") href = `/patients/${patientId}/referral`;
              else if (label === "Lab") href = `/patients/${patientId}/lab`;
              else if (label === "Radiology") href = `/patients/${patientId}/radiology`;
              else if (label === "Report") href = `/patients/${patientId}/report`;
            } else {
              // Global links
              if (label === "Cover Sheet") href = "/";
              else if (label === "Dashboard") href = "/vitals-dashboard";
              else if (label === "Orders") href = "/orders";
              else if (label === "Clinical Notes") href = "/clinical-notes";
              else if (label === "Discharge Summary") href = "/discharge-summary";
              else if (label === "Emergency Care") href = "/emergency-care";
              else if (label === "Postmortem") href = "/postmortem";
              else if (label === "Nursing") href = "/nursing";
              else if (label === "Referral") href = "/referral";
              else if (label === "Lab") href = "/lab";
              else if (label === "Radiology") href = "/radiology";
              else if (label === "Report") href = "/report";
            }

            const isActive = pathname === href && href !== "#";

            if (href === "#") {
              return (
                <Button
                  key={label}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs whitespace-nowrap min-w-[90px] hover:bg-accent hover:text-foreground flex-shrink-0"
                >
                  {label}
                </Button>
              );
            }

            return (
              <Link key={label} href={href} passHref legacyBehavior>
                <Button
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`h-8 px-3 text-xs whitespace-nowrap min-w-[90px] flex-shrink-0 ${
                    !isActive ? 'hover:bg-accent hover:text-foreground' : 'hover:bg-primary/90'
                  }`}
                >
                  <a>{label}</a>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right side - All action buttons in a single group */}
      <div className="flex items-center gap-0.5 flex-shrink-0 ml-2 pl-2 border-l border-border">
        {/* Helpdesk Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Helpdesk">
              <HeadsetIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="text-xs">Help Center</DropdownMenuItem>
            <DropdownMenuItem className="text-xs">Contact Support</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Logout Button */}
        <LogoutButton 
          variant="ghost" 
          size="icon"
          className="h-8 w-8"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Logout</span>
        </LogoutButton>

        {/* More Options Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="flex items-center justify-end space-x-2 p-2 border-b mb-1">
              <HeadsetIcon className="h-6 w-6" />
              <AlertIcon className="h-6 w-6" />
              <PowerIcon className="h-6 w-6" />
            </div>
            <DropdownMenuItem className="py-2 px-3 text-xs">
              <Avatar className="h-5 w-5 mr-2.5">
                <AvatarImage src="https://placehold.co/40x40.png" alt="User" />
                <AvatarFallback className="text-xs">
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              SANSYS DOCTOR
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2 px-3 text-xs" disabled>
              <Building2 className="h-4 w-4 mr-2.5 text-muted-foreground" />
              Location: Main Clinic
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2 px-3 text-xs">
              <MapPin className="h-4 w-4 mr-2.5 text-muted-foreground" />
              CHANGE LOCATION
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2 px-3 text-xs">
              <Lock className="h-4 w-4 mr-2.5 text-muted-foreground" />
              CHANGE PASSWORD
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2 px-3 text-xs">
              <PenLine className="h-4 w-4 mr-2.5 text-muted-foreground" />
              CHANGE SIGNATURE
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2 px-3 text-xs">
              <PenLine className="h-4 w-4 mr-2.5 text-muted-foreground" />
              SIGNATURE BLOCK
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modals */}
      <PatientSelectionDefaultsModal
        open={showPatientSelectionModal}
        onOpenChange={setShowPatientSelectionModal}
      />
      <SourceCombinationsModal
        open={showSourceCombinationsModal}
        onOpenChange={setShowSourceCombinationsModal}
      />
      <PersonalListsModal
        open={showPersonalListsModal}
        onOpenChange={setShowPersonalListsModal}
      />
      <PersonalDiagnosisListsModal
        open={showPersonalDiagnosisListsModal}
        onOpenChange={setShowPersonalDiagnosisListsModal}
      />
      <TeamInformationModal
        open={showTeamInformationModal}
        onOpenChange={setShowTeamInformationModal}
      />
    </div>
  );
}