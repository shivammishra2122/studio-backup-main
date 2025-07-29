'use client';

import LabPage from '@/app/lab/page';
import { usePatient, PatientProvider } from '@/hooks/use-patient';

export default function PatientLabPage() {
    const patient = usePatient();

    if (!patient) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">Patient not found</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-var(--top-nav-height,40px))] bg-background text-sm">
            <PatientProvider patient={patient}>
                <LabPage />
            </PatientProvider>
        </div>
    );
}