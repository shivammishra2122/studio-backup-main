import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, FileText, CalendarDays, RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProcedureOrder {
  id: string;
  order: string;
  startDate: string;
  stopDate: string;
  provider: string;
  status: string;
  location: string;
}

const mockData: ProcedureOrder[] = [
  {
    id: '1',
    order: 'Antenatal class (3 session)',
    startDate: 'Start: 16 JUL, 2025 12:59',
    stopDate: 'Stop: 16 JUL, 2025 13:00',
    provider: 'Sansys Doctor',
    status: 'COMPLETE',
    location: 'ICU ONE',
  },
];

const ProcedureOrdersView = () => {
  const [orders, setOrders] = useState<ProcedureOrder[]>(mockData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visitDate, setVisitDate] = useState('15 MAY, 2025 19:45 - ICU ONI');
  const [status, setStatus] = useState('Select');
  const [orderFrom, setOrderFrom] = useState('');
  const [orderTo, setOrderTo] = useState('');
  const [search, setSearch] = useState('');
  const [showEntries, setShowEntries] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtering logic (mocked for now)
  const filteredOrders = orders.filter(order =>
    (!search || order.order.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Card className="flex-1 flex flex-col shadow overflow-hidden">
      {/* Blue header */}
      <div className="bg-[#d6f0fd] px-4 py-2 flex items-center justify-between border-b border-[#b6e0ef]">
        <span className="font-semibold text-base text-[#1a5176]">Procedure Orders</span>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* Filters */}
      <div className="bg-[#d6f0fd] px-4 py-2 flex flex-wrap items-center gap-3 border-b border-[#b6e0ef] text-sm">
        <Label htmlFor="visitDate" className="font-semibold">Visit Date</Label>
        <Select value={visitDate} onValueChange={setVisitDate}>
          <SelectTrigger id="visitDate" className="h-7 w-56 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15 MAY, 2025 19:45 - ICU ONI">15 MAY, 2025 19:45 - ICU ONI</SelectItem>
          </SelectContent>
        </Select>
        <Label htmlFor="status" className="font-semibold">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id="status" className="h-7 w-32 text-xs">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Select">Select</SelectItem>
            <SelectItem value="COMPLETE">COMPLETE</SelectItem>
          </SelectContent>
        </Select>
        <Label htmlFor="orderFrom" className="font-semibold">Order From</Label>
        <div className="relative">
          <Input id="orderFrom" type="text" value={orderFrom} onChange={e => setOrderFrom(e.target.value)} className="h-7 w-32 text-xs pr-7" placeholder="" />
          <CalendarDays className="h-3.5 w-3.5 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
        <Label htmlFor="orderTo" className="font-semibold">Order To</Label>
        <div className="relative">
          <Input id="orderTo" type="text" value={orderTo} onChange={e => setOrderTo(e.target.value)} className="h-7 w-32 text-xs pr-7" placeholder="" />
          <CalendarDays className="h-3.5 w-3.5 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
        <Label htmlFor="search" className="font-semibold ml-auto">Search:</Label>
        <Input id="search" type="text" value={search} onChange={e => setSearch(e.target.value)} className="h-7 w-40 text-xs" />
      </div>
      {/* Table */}
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 text-xs">
          <Label htmlFor="showEntries" className="text-xs shrink-0">Show</Label>
          <Select value={showEntries} onValueChange={setShowEntries}>
            <SelectTrigger id="showEntries" className="h-7 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <Label htmlFor="showEntries" className="text-xs shrink-0">entries</Label>
        </div>
        <div className="flex-1 overflow-auto min-h-0 px-2 pb-2">
          <Table className="text-xs w-full">
            <TableHeader className="bg-[#d6f0fd] sticky top-0 z-10">
              <TableRow>
                <TableHead className="py-1 px-2 text-xs h-auto">Order <ArrowUpDown className="h-3 w-3 ml-1 inline text-muted-foreground hover:text-foreground cursor-pointer" /></TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">Start/Stop Date <ArrowUpDown className="h-3 w-3 ml-1 inline text-muted-foreground hover:text-foreground cursor-pointer" /></TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">Provider <ArrowUpDown className="h-3 w-3 ml-1 inline text-muted-foreground hover:text-foreground cursor-pointer" /></TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">Status <ArrowUpDown className="h-3 w-3 ml-1 inline text-muted-foreground hover:text-foreground cursor-pointer" /></TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">Sign</TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">Discontinue</TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">Actions</TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">Location <ArrowUpDown className="h-3 w-3 ml-1 inline text-muted-foreground hover:text-foreground cursor-pointer" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? filteredOrders.map((order, index) => (
                <TableRow key={order.id} className={index % 2 === 0 ? 'bg-[#f5fbfe]' : ''}>
                  <TableCell className="py-1 px-2">{order.order}</TableCell>
                  <TableCell className="py-1 px-2">
                    <span>{order.startDate}</span><br />
                    <span className="text-green-600">{order.stopDate}</span>
                  </TableCell>
                  <TableCell className="py-1 px-2">{order.provider}</TableCell>
                  <TableCell className="py-1 px-2">{order.status}</TableCell>
                  <TableCell className="py-1 px-2"></TableCell>
                  <TableCell className="py-1 px-2"></TableCell>
                  <TableCell className="py-1 px-2 text-center">
                    <Button variant="ghost" size="icon" className="h-6 w-6"><FileText className="h-4 w-4 text-blue-600" /></Button>
                  </TableCell>
                  <TableCell className="py-1 px-2">{order.location}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    No procedure orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between p-2 border-t text-xs text-muted-foreground mt-auto">
          <div>Showing 1 to {filteredOrders.length} of {filteredOrders.length} entries</div>
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

export default ProcedureOrdersView; 