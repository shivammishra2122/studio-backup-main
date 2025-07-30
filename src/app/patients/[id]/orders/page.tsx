'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiService as api } from '@/services/api';
import OrdersPage from '@/app/orders/page';
import { usePatient } from '@/hooks/use-patient';

export default function PatientOrdersPage() {
    const patient = usePatient();

    if (!patient) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">Patient not found</p>
            </div>
        );
    }

    return <OrdersPage />;
} 