import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BloodOrderView = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [orderStatus, setOrderStatus] = useState('Select');
  const [search, setSearch] = useState('');

  // No data for now
  const orders: any[] = [];

  return (
    <Card className="flex-1 flex flex-col shadow overflow-hidden">
      {/* Blue header */}
      <div className="bg-[#d6f0fd] px-4 py-2 flex items-center justify-between border-b border-[#b6e0ef]">
        <span className="font-semibold text-base text-[#1a5176]">Blood Order Management</span>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50">
            <span className="material-icons">edit</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50">
            <span className="material-icons">refresh</span>
          </Button>
        </div>
      </div>
      {/* Filters */}
      <div className="bg-[#d6f0fd] px-4 py-2 flex flex-wrap items-center gap-3 border-b border-[#b6e0ef] text-sm">
        <Label htmlFor="fromDate" className="font-semibold">From Date:</Label>
        <div className="relative">
          <Input id="fromDate" type="text" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-7 w-32 text-xs pr-7" placeholder="" />
          <CalendarDays className="h-3.5 w-3.5 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
        <Label htmlFor="toDate" className="font-semibold">To Date:</Label>
        <div className="relative">
          <Input id="toDate" type="text" value={toDate} onChange={e => setToDate(e.target.value)} className="h-7 w-32 text-xs pr-7" placeholder="" />
          <CalendarDays className="h-3.5 w-3.5 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
        <Label htmlFor="orderStatus" className="font-semibold">Order Status:</Label>
        <Select value={orderStatus} onValueChange={setOrderStatus}>
          <SelectTrigger id="orderStatus" className="h-7 w-32 text-xs">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Select">Select</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
            <SelectItem value="Discontinued">Discontinued</SelectItem>
          </SelectContent>
        </Select>
        <Label htmlFor="search" className="font-semibold ml-auto">Search:</Label>
        <Input id="search" type="text" value={search} onChange={e => setSearch(e.target.value)} className="h-7 w-40 text-xs" />
        <Button className="bg-[#ffb84d] text-black font-semibold ml-2 px-6 py-1 h-7 rounded">Search</Button>
      </div>
      {/* Table */}
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        <div className="flex-1 overflow-auto min-h-0 px-2 pb-2">
          <Table className="text-xs w-full">
            <TableHeader className="bg-[#d6f0fd] sticky top-0 z-10">
              <TableRow>
                <TableHead className="py-1 px-2 text-xs h-auto">S.No <ArrowUpDown className="h-3 w-3 ml-1 inline text-muted-foreground hover:text-foreground cursor-pointer" /></TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">Order Date <ArrowUpDown className="h-3 w-3 ml-1 inline text-muted-foreground hover:text-foreground cursor-pointer" /></TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">Order ID <ArrowUpDown className="h-3 w-3 ml-1 inline text-muted-foreground hover:text-foreground cursor-pointer" /></TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">Order By <ArrowUpDown className="h-3 w-3 ml-1 inline text-muted-foreground hover:text-foreground cursor-pointer" /></TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">Status <ArrowUpDown className="h-3 w-3 ml-1 inline text-muted-foreground hover:text-foreground cursor-pointer" /></TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">Component Name <ArrowUpDown className="h-3 w-3 ml-1 inline text-muted-foreground hover:text-foreground cursor-pointer" /></TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">Quantity <ArrowUpDown className="h-3 w-3 ml-1 inline text-muted-foreground hover:text-foreground cursor-pointer" /></TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">Update <ArrowUpDown className="h-3 w-3 ml-1 inline text-muted-foreground hover:text-foreground cursor-pointer" /></TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">View <ArrowUpDown className="h-3 w-3 ml-1 inline text-muted-foreground hover:text-foreground cursor-pointer" /></TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">Blood Request <ArrowUpDown className="h-3 w-3 ml-1 inline text-muted-foreground hover:text-foreground cursor-pointer" /></TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">Transfuse <ArrowUpDown className="h-3 w-3 ml-1 inline text-muted-foreground hover:text-foreground cursor-pointer" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                  No Data Found for this Patient
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-6 px-4 py-2 border-t text-xs text-muted-foreground mt-auto">
          <div className="flex items-center"><span className="inline-block w-6 h-5 border border-gray-300 bg-white mr-1"></span> - Pending/ Active</div>
          <div className="flex items-center"><span className="inline-block w-6 h-5 border border-gray-300 bg-green-100 mr-1"></span> - Closed</div>
          <div className="flex items-center"><span className="inline-block w-6 h-5 border border-gray-300 bg-yellow-100 mr-1"></span> - Discontinued</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BloodOrderView; 