'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Patient } from '@/services/api';
import ReportPage from '@/app/report/page';
import { usePatient } from '@/hooks/use-patient';

export default function PatientReportPage() {
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
            <ReportPage />
        </div>
    );
} 