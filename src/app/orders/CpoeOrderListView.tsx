import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Patient } from '@/lib/constants';

const CpoeOrderListView = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingLabOrders, setLoadingLabOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visitDateFilter, setVisitDateFilter] = useState<string>("");
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [orderFromDate, setOrderFromDate] = useState<string>("");
  const [orderToDate, setOrderToDate] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [showEntries, setShowEntries] = useState<string>("10");
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingLabOrders(true);
      setError(null);
      const effectiveSSN = '800000035'; // Assuming a default SSN for now, as patient prop is removed
      if (!effectiveSSN) {
        setError('Patient SSN is required to fetch orders');
        setLoadingLabOrders(false);
        return;
      }
      try {
        const requestBody = {
          UserName: 'CPRS-UAT',
          Password: 'UAT@123',
          PatientSSN: effectiveSSN,
          DUZ: '80',
          ihtLocation: 67,
          FromDate: '',
          ToDate: '',
          rcpAdmDateL: '11435762',
          rcpoeSerOrd: '6',
        };
        const response = await fetch('http://192.168.1.53/cgi-bin/apiOrdCPOEList.sh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }
        const data = await response.json();
        if (!data || Object.keys(data).length === 0) {
          setOrders([]);
          setError('No orders found for this patient');
        } else {
          const ordersArray = Object.entries(data).map(([key, item]: [string, any]) => ({
            id: item.ID?.toString() || key,
            Service: item.Service || 'N/A',
            Order: item.Order || 'N/A',
            'Start Date': item['Start Date'] || '',
            'Start Time': item['Start Time'] || '',
            'Stop Date': item['Stop Date'] || '',
            'Stop Time': item['Stop Time'] || '',
            Provider: item.Provider || 'N/A',
            Status: item.Status || 'UNKNOWN',
            Location: item.Location || 'N/A',
          }));
          setOrders(ordersArray);
        }
      } catch (err) {
        setError(`Failed to fetch orders: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setOrders([]);
      } finally {
        setLoadingLabOrders(false);
      }
    };
    fetchOrders();
  }, []); // Removed patient?.ssn from dependency array

  const filteredOrders = orders.filter(order => {
    const serviceMatch = serviceFilter ? order.Service.toLowerCase() === serviceFilter.toLowerCase() : true;
    const statusMatch = statusFilter ? order.Status.toLowerCase() === statusFilter.toLowerCase() : true;
    const dateMatch = orderFromDate && orderToDate ? order['Start Date'] >= orderFromDate && order['Start Date'] <= orderToDate : true;
    const searchMatch = searchText ? Object.values(order).some((value) => (value as any)?.toString().toLowerCase().includes(searchText.toLowerCase())) : true;
    return serviceMatch && statusMatch && dateMatch && searchMatch;
  });

  const totalPages = Math.ceil(filteredOrders.length / parseInt(showEntries));
  const startIndex = (currentPage - 1) * parseInt(showEntries);
  const endIndex = startIndex + parseInt(showEntries);
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  if (loadingLabOrders) {
    return (
      <Card className="flex-1 flex items-center justify-center">
        <CardContent className="text-center">
          <p className="text-muted-foreground">Loading orders...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex-1 flex items-center justify-center">
        <CardContent className="text-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex-1 flex flex-col shadow overflow-hidden">
      <CardHeader className="p-1.5 border-b bg-card text-foreground rounded-t-md">
        <CardTitle className="text-base font-semibold">CPOE Order List</CardTitle>
      </CardHeader>
      <CardContent className="p-1.5 flex-1 flex flex-col overflow-hidden">
        <div className="space-y-1 mb-2 text-xs">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Label htmlFor="visitDate" className="shrink-0">Visit Date</Label>
            <Select value={visitDateFilter} onValueChange={setVisitDateFilter}>
              <SelectTrigger id="visitDate" className="h-7 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15 MAY, 2025 19:4">15 MAY, 2025 19:4</SelectItem>
              </SelectContent>
            </Select>
            <Label htmlFor="service" className="shrink-0">Service</Label>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger id="service" className="h-7 w-24 text-xs">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All" key="all-services">All</SelectItem>
                {Array.from(new Set(orders.map(order => order.Service))).map(service => (
                  <SelectItem key={`service-${service}`} value={service}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label htmlFor="status" className="shrink-0">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status" className="h-7 w-24 text-xs">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All" key="all-status">All</SelectItem>
                {Array.from(new Set(orders.map(order => order.Status))).map(status => (
                  <SelectItem key={`status-${status}`} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label htmlFor="orderFrom" className="shrink-0">Order From</Label>
            <div className="relative">
              <Input id="orderFrom" type="text" value={orderFromDate} onChange={e => setOrderFromDate(e.target.value)} className="h-7 w-24 text-xs pr-7" aria-label="Lab Order From Date" placeholder="DD/MM/YYYY" />
              <CalendarDays className="h-3.5 w-3.5 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Label htmlFor="orderTo" className="shrink-0">Order To</Label>
            <div className="relative">
              <Input id="orderTo" type="text" value={orderToDate} onChange={e => setOrderToDate(e.target.value)} className="h-7 w-24 text-xs pr-7" aria-label="Lab Order To Date" placeholder="DD/MM/YYYY" />
              <CalendarDays className="h-3.5 w-3.5 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <div className="flex items-center space-x-1">
              <Label htmlFor="showEntries" className="text-xs shrink-0">Show</Label>
              <Select value={showEntries} onValueChange={setShowEntries}>
                <SelectTrigger id="showEntries" className="h-7 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10" key="entries-10">10</SelectItem>
                  <SelectItem value="25" key="entries-25">25</SelectItem>
                  <SelectItem value="50" key="entries-50">50</SelectItem>
                </SelectContent>
              </Select>
              <Label htmlFor="showEntries" className="text-xs shrink-0">entries</Label>
            </div>
            <div className="flex-grow"></div>
            <Label htmlFor="search" className="shrink-0">Search:</Label>
            <Input id="search" type="text" value={searchText} onChange={e => setSearchText(e.target.value)} className="h-7 w-40 text-xs" />
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          <Table className="text-xs w-full">
            <TableHeader className="bg-accent sticky top-0 z-10">
              <TableRow>
                <TableHead className="py-1 px-2 text-xs h-auto">
                  <div className="flex items-center justify-between">
                    Service
                    <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                  </div>
                </TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">
                  <div className="flex items-center justify-between">
                    Order
                    <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                  </div>
                </TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">
                  <div className="flex items-center justify-between">
                    Start/Stop Date
                    <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                  </div>
                </TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">
                  <div className="flex items-center justify-between">
                    Provider
                    <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                  </div>
                </TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">
                  <div className="flex items-center justify-between">
                    Status
                    <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                  </div>
                </TableHead>
                <TableHead className="py-1 px-2 text-xs h-auto">
                  <div className="flex items-center justify-between">
                    Location
                    <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length > 0 ? paginatedOrders.map((order, index) => (
                <TableRow key={`order-${order.id || order.Service}-${order.Order}`} className={`${index % 2 === 0 ? 'bg-muted/30' : ''}`}>
                  <TableCell className="py-1 px-2">{order.Service}</TableCell>
                  <TableCell className="py-1 px-2">{order.Order}</TableCell>
                  <TableCell className="py-1 px-2">
                    {order['Start Date'] && order['Start Time'] ? `Start: ${order['Start Date']} ${order['Start Time']}` : ''}
                    {order['Stop Date'] && order['Stop Time'] ? <><br />{`Stop: ${order['Stop Date']} ${order['Stop Time']}`}</> : null}
                  </TableCell>
                  <TableCell className="py-1 px-2">{order.Provider}</TableCell>
                  <TableCell className="py-1 px-2 text-xs">{order.Status}</TableCell>
                  <TableCell className="py-1 px-2">{order.Location}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-1.5 border-t text-xs text-muted-foreground mt-auto">
          <div>Showing {paginatedOrders.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} entries</div>
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

export default CpoeOrderListView; 