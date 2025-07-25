import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, FileEdit, RefreshCw, Settings, Printer, Download, Filter, PenLine, Ban, Pencil, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Patient } from '@/lib/constants';
import { useMedications } from '@/hooks/useMedications';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const IpMedicationView = ({ active }: { active: boolean }) => {
  const [isAddIpMedicationDialogOpen, setIsAddIpMedicationDialogOpen] = useState(false);
  const [visitDate, setVisitDate] = useState<string | undefined>(undefined);
  
  // Only fetch medications if active
  const { data: medications, loading, error: medicationError } = active ? useMedications() : { data: [], loading: false, error: null };
  
  // Transform the medication data to match the expected format
  const ipMedicationList = useMemo(() => {
    return medications.map(med => ({
      id: med.id?.toString() || med.OrderIEN?.toString() || Math.random().toString(36).substr(2, 9),
      services: med.Services || 'Inpt. Meds',
      medicationName: med.medicationName || med.medication || med['Medication Name'] || 'Unknown Medication',
      status: med.status || med.Status || 'UNKNOWN',
      startDate: med['Start Date'] || '',
      startTime: '', // Add time if available in the API response
      stopDate: med['Stop Date'] || '',
      stopTime: '', // Add time if available in the API response
      orderedBy: med['Ordered By'] || 'Unknown',
      medicationDay: med['Medication Day'] || '1',
      orderURL: med.OrderURL || '#',
      schedule: med.schedule || med.Schedule || '',
      signURL: med.Sign,
      discontinueURL: med.Discontinue,
      changeURL: med.Change,
      copyURL: med.Copy,
      flagURL: med.Flag,
      unflagURL: med.Unflag,
      holdURL: med.Hold,
      releaseURL: med.Release,
      renewURL: med.Renew
    }));
  }, [medications]);
  
  const [scheduleType, setScheduleType] = useState<string | undefined>();
  const [status, setStatus] = useState<string>("all");
  const [orderFrom, setOrderFrom] = useState<string>("");
  const [orderTo, setOrderTo] = useState<string>("");
  const [showEntries, setShowEntries] = useState<string>("All");
  const [searchText, setSearchText] = useState<string>("");
  const [loadingLabOrders, setLoadingLabOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const openOrderMedicinesDialog = () => {
    setIsAddIpMedicationDialogOpen(true);
  };

  const handleConfirmOrder = (rows: any[]) => {
    const newMedications: any[] = rows.map(row => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
      services: 'Inpt. Meds',
      medicationName: row.medicationName,
      status: 'UNRELEASED',
      startDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      stopDate: '',
      stopTime: '',
      orderedBy: 'System (Dialog)',
      medicationDay: 'Day 1',
      orderURL: '#', // Required field
      schedule: row.schedule === 'SELECT' ? 'Pending' : row.schedule,
      scheduleNote: row.prn ? 'PRN' : row.comment || undefined,
    }));
    setIsAddIpMedicationDialogOpen(false);
  };

  const ipMedTableHeaders = ["Services", "Medication Name", "Start/Stop Date", "Status", "Ordered By", "Sign", "Discontinue", "Actions", "Medication Day", "Schedule"];

  return (
    <Card className="flex-1 flex flex-col shadow overflow-hidden">
      <CardHeader className="p-1.5 border-b bg-card text-foreground rounded-t-md">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">IPD Medication List</CardTitle>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50"><FileEdit className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50"><RefreshCw className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50"><Settings className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50"><Printer className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50"><Download className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50"><Filter className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-1.5 flex-1 flex flex-col overflow-hidden">
        <div className="space-y-1 mb-2 text-xs">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Label htmlFor="ipVisitDate" className="shrink-0">Visit Date</Label>
            <Select value={visitDate} onValueChange={setVisitDate}>
              <SelectTrigger id="ipVisitDate" className="h-7 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15 MAY, 2025 19:4">15 MAY, 2025 19:4</SelectItem>
              </SelectContent>
            </Select>
            <Label htmlFor="ipStatus" className="shrink-0">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="ipStatus" className="h-7 w-24 text-xs">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="HOLD">HOLD</SelectItem>
                <SelectItem value="UNRELEASED">UNRELEASED</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Loading medication data...</p>
          </div>
        ) : medicationError ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-destructive">{medicationError}</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="overflow-hidden rounded-md border">
              <div className="relative h-full max-h-[calc(100vh-250px)] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background">
                    <TableRow className="border-b">
                      <TableHead className="py-1 px-2 text-xs h-8 bg-muted/50">Services</TableHead>
                      <TableHead className="py-1 px-2 text-xs h-8 bg-muted/50">Medication Name</TableHead>
                      <TableHead className="py-1 px-2 text-xs h-8 bg-muted/50">Start/Stop Date</TableHead>
                      <TableHead className="py-1 px-2 text-xs h-8 bg-muted/50">Status</TableHead>
                      <TableHead className="py-1 px-2 text-xs h-8 bg-muted/50">Ordered By</TableHead>
                      <TableHead className="py-1 px-2 text-xs h-8 bg-muted/50">Sign</TableHead>
                      <TableHead className="py-1 px-2 text-xs h-8 bg-muted/50">Discontinue</TableHead>
                      <TableHead className="py-1 px-2 text-xs h-8 bg-muted/50">Actions</TableHead>
                      <TableHead className="py-1 px-2 text-xs h-8 bg-muted/50">Medication Day</TableHead>
                      <TableHead className="py-1 px-2 text-xs h-8 bg-muted/50">Schedule</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&>tr:last-child]:border-0">
                    {ipMedicationList.length > 0 ? ipMedicationList.map((med, index) => (
                      <TableRow key={med.id} className={`text-xs hover:bg-muted/50 ${index % 2 === 0 ? 'bg-muted/10' : 'bg-background'}`}>
                        <TableCell className="py-1 px-2">{med.services}</TableCell>
                        <TableCell className="py-1 px-2">
                          <a href={med.orderURL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {med.medicationName}
                          </a>
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          {med.startDate && `Start: ${med.startDate} ${med.startTime || ''}`}
                          {med.stopDate && (
                            <>
                              <br />
                              {`Stop: ${med.stopDate} ${med.stopTime || ''}`}
                            </>
                          )}
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          <Badge 
                            variant={
                              med.status?.toUpperCase() === 'UNRELEASED' ? 'secondary' : 
                              med.status?.toUpperCase() === 'ACTIVE' ? 'default' :
                              med.status?.toUpperCase() === 'DISCONTINUED' ? 'destructive' : 'outline'
                            }
                            className="text-[11px] font-normal capitalize"
                          >
                            {med.status?.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1 px-2">{med.orderedBy}</TableCell>
                        <TableCell className="py-1 px-2">
                          {med.signURL && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 p-0" asChild>
                                  <a href={med.signURL} target="_blank" rel="noopener noreferrer" title="Sign">
                                    <PenLine className="h-3 w-3" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">Sign Order</TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          {med.discontinueURL && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 p-0" asChild>
                                  <a href={med.discontinueURL} target="_blank" rel="noopener noreferrer" title="Discontinue">
                                    <Ban className="h-3 w-3 text-red-500" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">Discontinue</TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          <div className="flex gap-1">
                            {med.changeURL && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0" asChild>
                                    <a href={med.changeURL} target="_blank" rel="noopener noreferrer" title="Change">
                                      <Pencil className="h-3 w-3" />
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">Change Order</TooltipContent>
                              </Tooltip>
                            )}
                            {med.copyURL && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0" asChild>
                                    <a href={med.copyURL} target="_blank" rel="noopener noreferrer" title="Copy">
                                      <Copy className="h-3 w-3" />
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">Copy Order</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          {med.medicationDay || 'N/A'}
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          {med.schedule || 'N/A'}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                          No medications found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-2.5 border-t text-xs text-muted-foreground mt-auto">
          <div>
            Showing {ipMedicationList.length > 0 ? 1 : 0} to {ipMedicationList.length} of {ipMedicationList.length} entries
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1">Previous</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1 bg-accent text-foreground border-border">1</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1">Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IpMedicationView; 