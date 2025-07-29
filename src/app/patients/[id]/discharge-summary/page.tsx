'use client';


import { usePatient, PatientProvider } from '@/hooks/use-patient';
import DischargeSummaryPage from '@/app/discharge-summary/page';

export default function PatientDischargeSummaryPage() {
    const patient = usePatient();

    if (!patient) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">Patient not found</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-var(--top-nav-height,40px))] bg-background text-sm px-3 pb-3 pt-0">
            <PatientProvider patient={patient}>
                <DischargeSummaryPage />
            </PatientProvider>
        </div>
    );
}