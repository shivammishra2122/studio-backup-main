import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Patient } from '@/lib/constants';

const LabCpoeListViewUpdated = ({ active }: { active: boolean }) => {
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sectionFilter, setSectionFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showEntries, setShowEntries] = useState<string>("10");
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    if (!active) return;
    const fetchLabOrders = async () => {
      try {
        setLoading(true);
        
        // Use the correct endpoint and ensure we have a valid SSN
        const effectiveSSN = '800000035'; // Fallback to default SSN if not available
        
        if (!effectiveSSN) {
          console.error('No patient SSN available for lab orders');
          setError('Patient SSN is required to fetch lab orders');
          return;
        }

        const response = await fetch('http://192.168.1.53/cgi-bin/apiOrdCPOEList.sh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            UserName: 'CPRS-UAT',
            Password: 'UAT@123',
            PatientSSN: effectiveSSN,
            DUZ: '80',
            ihtLocation: 67,
            FromDate: '',
            ToDate: '',
            Action: 'L'
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Transform the response data to match the expected format
        const orders = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          section: value.Section || 'UNKNOWN',
          labTest: value['Lab Test'] || 'N/A',
          sample: value.Sample || 'N/A',
          orderDate: value['Order Date'] || '',
          orderTime: value['Order Time'] || '',
          startDate: value['Start Date'] || '',
          startTime: value['Start Time'] || '',
          status: value.Status || 'UNKNOWN',
        }));

        setLabOrders(orders);
      } catch (err) {
        console.error('Error fetching lab orders:', err);
        setError('Failed to load lab orders. Please try again later.');
        setLabOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLabOrders();
  }, [active]);

  const filteredLabOrders = labOrders.filter(order => {
    const matchesSection = sectionFilter ? order.section.toLowerCase() === sectionFilter.toLowerCase() : true;
    const matchesSearch = searchTerm ? Object.values(order).some((value) => (value as any)?.toString().toLowerCase().includes(searchTerm.toLowerCase())) : true;
    return matchesSection && matchesSearch;
  });

  const totalPages = Math.ceil(filteredLabOrders.length / parseInt(showEntries));
  const startIndex = (currentPage - 1) * parseInt(showEntries);
  const endIndex = startIndex + parseInt(showEntries);
  const paginatedLabOrders = filteredLabOrders.slice(startIndex, endIndex);

  const labCpoeTableHeaders = ["Section", "Lab Test", "Sample", "Order Date", "Order Time", "Start Date", "Start Time", "Status"];

  return (
    <Card className="flex-1 flex flex-col shadow overflow-hidden">
      <CardHeader className="p-2.5 border-b bg-card text-foreground rounded-t-md">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Lab CPOE List</CardTitle>
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
        <div className="space-y-2 mb-2 text-xs">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Label htmlFor="labSection" className="shrink-0">Section</Label>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger id="labSection" className="h-7 w-24 text-xs">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {Array.from(new Set(labOrders.map(order => order.section))).map(section => (
                  <SelectItem key={`section-${section}`} value={section}>{section}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label htmlFor="labSearch" className="shrink-0">Search:</Label>
            <Input id="labSearch" type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-7 w-40 text-xs" />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center space-x-1">
              <Label htmlFor="labShowEntries" className="text-xs shrink-0">Show</Label>
              <Select value={showEntries} onValueChange={setShowEntries}>
                <SelectTrigger id="labShowEntries" className="h-7 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <Label htmlFor="labShowEntries" className="text-xs shrink-0">entries</Label>
            </div>
            <div className="flex-grow"></div>
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading lab orders...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-destructive">{error}</p>
            </div>
          ) : (
            <Table className="text-xs w-full">
              <TableHeader className="bg-accent sticky top-0 z-10">
                <TableRow>
                  {labCpoeTableHeaders.map(header => (
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
                {paginatedLabOrders.length > 0 ? paginatedLabOrders.map((lab, index) => (
                  <TableRow key={`lab-${lab.id}`} className={`${index % 2 === 0 ? 'bg-muted/30' : ''}`}>
                    <TableCell className="py-1 px-3">{lab.section}</TableCell>
                    <TableCell className="py-1 px-3">{lab.labTest}</TableCell>
                    <TableCell className="py-1 px-3">{lab.sample}</TableCell>
                    <TableCell className="py-1 px-3">{lab.orderDate}</TableCell>
                    <TableCell className="py-1 px-3">{lab.orderTime}</TableCell>
                    <TableCell className="py-1 px-3">{lab.startDate}</TableCell>
                    <TableCell className="py-1 px-3">{lab.startTime}</TableCell>
                    <TableCell className="py-1 px-3 text-xs">{lab.status}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={labCpoeTableHeaders.length} className="text-center py-10 text-muted-foreground">
                      No lab orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex items-center justify-between p-2.5 border-t text-xs text-muted-foreground mt-auto">
          <div>Showing {paginatedLabOrders.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredLabOrders.length)} of {filteredLabOrders.length} entries</div>
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1 bg-accent text-foreground border-border">{currentPage}</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LabCpoeListViewUpdated; 