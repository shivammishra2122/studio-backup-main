'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Patient } from '@/services/api';
import DashboardPage from '@/app/page';
import { usePatient } from '@/hooks/use-patient';

export default function PatientPage() {
    const patient = usePatient();

    if (!patient) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">Patient not found</p>
            </div>
        );
    }

    // Mock data for the dashboard
    const mockData = {
        problems: [],
        medications: [],
        allergies: [],
        vitals: {}
    };

    // Pass patient as a prop inside mockData, not as a separate prop
    return <DashboardPage {...mockData} patient={patient} />;
}