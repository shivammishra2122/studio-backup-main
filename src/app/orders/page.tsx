'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge'; // Ensure this path is correct
import {
  Settings,
  FileEdit,
  RefreshCw,
  CalendarDays,
  ArrowUpDown,
  Ban,
  FileText,
  Printer,
  Download,
  Filter,
  PenLine,
  ChevronsUpDown,
  Check,
  X as XIcon,
  Save,
  Pencil,
  Copy,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Search,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle as DialogUITitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import IpMedicationOrderDialog from './IpMedicationOrderDialog';
import type { Patient } from '@/lib/constants';
import type { NextPage } from 'next';
import { apiService } from '@/services/api'; // Import api
import { useMedications } from '@/hooks/useMedications'; // Import the useMedications hook
import { fetchRadiologyOrders } from '@/services/radiology';
import { fetchNursingOrders } from '@/services/nursing';
import { fetchProcedureOrders, ProcedureOrder } from '@/services/procedure';
import dynamic from 'next/dynamic';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Dynamically import sub-views with loading fallback
const CpoeOrderListView = dynamic(() => import('./CpoeOrderListView'), { loading: () => <div className="flex justify-center items-center h-full"><span>Loading CPOE Order List...</span></div> });
const DelayOrdersView = dynamic(() => import('./DelayOrdersView'), { loading: () => <div className="flex justify-center items-center h-full"><span>Loading Delay Orders...</span></div> });
const IpMedicationView = dynamic(() => import('./IpMedicationView'), { loading: () => <div className="flex justify-center items-center h-full"><span>Loading IP Medication...</span></div> });
const LabCpoeListViewUpdated = dynamic(() => import('./LabCpoeListViewUpdated'), { loading: () => <div className="flex justify-center items-center h-full"><span>Loading Laboratory...</span></div> });
const RadiologyView = dynamic(() => import('./RadiologyView'), { loading: () => <div className="flex justify-center items-center h-full"><span>Loading Radiology...</span></div> });
const VisitAdtView = dynamic(() => import('./VisitAdtView'), { loading: () => <div className="flex justify-center items-center h-full"><span>Loading Visit/ADT...</span></div> });
const ProcedureOrdersView = dynamic(() => import('./ProcedureOrdersView'), { loading: () => <div className="flex justify-center items-center h-full"><span>Loading Procedure Orders...</span></div> });
const NursingCareView = dynamic(() => import('./NursingCareView'), { loading: () => <div className="flex justify-center items-center h-full"><span>Loading Nursing Care...</span></div> });
const BloodOrderView = dynamic(() => import('./BloodOrderView'), { loading: () => <div className="flex justify-center items-center h-full"><span>Loading Blood Order...</span></div> });

// Navigation items
const orderSubNavItems = [
  "CPOE Order List",
  "Write Delay Order",
  "IP Medication",
  "Laboratory",
  "Radiology",
  "Visit/ADT",
  "Procedure Orders",
  "Nursing Care",
  "Blood Order"
];

const OrdersPage = () => {
  const patient = undefined; // Use default or fetch as needed
  const [activeSubNav, setActiveSubNav] = useState(orderSubNavItems[0]);

    return (
    <div className="flex flex-col h-full">
      {/* Horizontal Sub-Navigation Bar */}
      <div className="flex items-end space-x-1 px-4 pt-0 pb-0 overflow-x-auto no-scrollbar border-b border-border">
        {orderSubNavItems.map((item) => (
          <Button
            key={item}
            onClick={() => setActiveSubNav(item)}
            className={`text-xs px-4 py-2 h-auto rounded-t-md whitespace-nowrap focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors
              ${activeSubNav === item
                ? 'bg-background text-primary border-x border-t border-border border-b-2 border-b-background shadow-sm relative -mb-px z-10 hover:bg-background/80'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border-x border-t border-transparent'
              }`}
          >
            {item}
          </Button>
        ))}
      </div>
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="w-full h-full">
          {activeSubNav === "CPOE Order List" && <CpoeOrderListView />}
          {activeSubNav === "Write Delay Order" && <DelayOrdersView />}
          {activeSubNav === "IP Medication" && <IpMedicationView active={true} />}
          {activeSubNav === "Laboratory" && <LabCpoeListViewUpdated active={true} />}
          {activeSubNav === "Radiology" && <RadiologyView active={true} />}
          {activeSubNav === "Visit/ADT" && <VisitAdtView />}
          {activeSubNav === "Procedure Orders" && <ProcedureOrdersView />}
          {activeSubNav === "Nursing Care" && <NursingCareView />}
          {activeSubNav === "Blood Order" && <BloodOrderView />}
        </div>
      </main>
    </div>
  );
};

export default OrdersPage;