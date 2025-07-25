import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Patient } from '@/lib/constants';

type VisitData = {
  VST_DATE: string;
  VST_TYP: string;
  VST_HOS: string;
  VST_IEN: string | number;
  VST_DFT: string | number;
};

const VisitAdtView = () => {
  const [visitDate, setVisitDate] = useState<string | undefined>("Select");
  const [visitDetails, setVisitDetails] = useState<VisitData[]>([]);
  const [loadingLabOrders, setLoadingLabOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingLabOrders(true);
    setError(null);
    const requestBody = {
      UserName: "CPRS-UAT",
      Password: "UAT@123",
      PatientSSN: "123-45-6789", // Placeholder for patient SSN
      DUZ: "80"
    };
    fetch('http://3.6.230.54:4003/api/apiPatVstDtl.sh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
    })
      .then(async res => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
        }
        return res.json();
      })
      .then((data: Record<string, VisitData>) => {
        if (!data || Object.keys(data).length === 0 || data.errors) {
          setVisitDetails([]);
          setError('No data found');
        } else {
          const detailsArray = Object.values(data);
          setVisitDetails(detailsArray);
          const firstValidVisit = detailsArray.find((visit: VisitData) => visit.VST_DATE !== "Select");
          if (firstValidVisit) {
            setVisitDate(firstValidVisit.VST_DATE);
          }
        }
      })
      .catch(err => {
        setError('Failed to fetch visit details: ' + err.message);
      })
      .finally(() => setLoadingLabOrders(false));
  }, []);

  const visitAdtTableHeaders = ["Visit Date", "Visit Type", "Hospital", "Visit IEN", "Visit DFT"];

  return (
    <Card className="flex-1 flex flex-col shadow overflow-hidden">
      <CardHeader className="p-2.5 border-b bg-card text-foreground rounded-t-md">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Visit/ADT Details</CardTitle>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2.5 flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs mb-2">
          <Label htmlFor="visitDate" className="shrink-0 text-xs">Visit Date</Label>
          <Select 
            value={visitDate} 
            onValueChange={setVisitDate}
          >
            <SelectTrigger id="visitDate" className="h-7 w-40 text-xs">
              <SelectValue placeholder="Select Visit Date" />
            </SelectTrigger>
            <SelectContent>
              {visitDetails.map((visit) => (
                <SelectItem 
                  key={String(visit.VST_IEN)} 
                  value={String(visit.VST_DATE)} 
                  className="text-xs"
                >
                  {String(visit.VST_DATE)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-auto min-h-0">
          {loadingLabOrders ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading visit details...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-destructive">{error}</p>
            </div>
          ) : (
            <Table className="text-xs w-full">
              <TableHeader className="bg-accent sticky top-0 z-10">
                <TableRow>
                  {visitAdtTableHeaders.map(header => (
                    <TableHead key={header} className="py-1 px-3 text-xs h-auto">
                      <div className="flex items-center justify-between">
                        {header}
                        <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitDetails.length > 0 ? visitDetails.map((visit, index) => (
                  <TableRow 
                    key={visit.VST_IEN ? String(visit.VST_IEN) : `visit-row-${index}`} 
                    className={`${index % 2 === 0 ? 'bg-muted/30' : ''}`}
                  >
                    <TableCell className="py-1 px-3">{String(visit.VST_DATE)}</TableCell>
                    <TableCell className="py-1 px-3">{String(visit.VST_TYP)}</TableCell>
                    <TableCell className="py-1 px-3">{String(visit.VST_HOS)}</TableCell>
                    <TableCell className="py-1 px-3">{String(visit.VST_IEN)}</TableCell>
                    <TableCell className="py-1 px-3">{String(visit.VST_DFT)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={visitAdtTableHeaders.length} className="text-center py-10 text-muted-foreground">
                      No visit details found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VisitAdtView; 