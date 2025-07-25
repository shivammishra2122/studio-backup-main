import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, Settings, RefreshCw, Printer, Download, Filter, CalendarDays, PenLine, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Patient } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { fetchRadiologyOrders } from '@/services/radiology';
import { Skeleton } from '@/components/ui/skeleton';

const RadiologyView = ({ active }: { active: boolean }) => {
  const [radiologyOrders, setRadiologyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [orderFromDate, setOrderFromDate] = useState<string>('');
  const [orderToDate, setOrderToDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    if (!active) return;
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchRadiologyOrders('800000035', {
          fromDate: orderFromDate,
          toDate: orderToDate,
        });
        const orders = response.map((order: any, index: number) => ({
          id: order.id || `order-${index}`,
          testName: order.imagingProcedure || 'Unknown Test',
          orderDate: order.orderDateTime ? new Date(order.orderDateTime).toLocaleDateString() : '',
          orderTime: order.orderDateTime ? new Date(order.orderDateTime).toLocaleTimeString() : '',
          startDate: '',
          startTime: '',
          provider: order.provider || 'Unknown',
          status: order.status,
          location: order.location || 'N/A',
          result: order.result,
          'Order IEN': order.id,
          'Imaging Procedure': order.imagingProcedure
        }));
        setRadiologyOrders(orders);
      } catch (error) {
        console.error('Error fetching radiology orders:', error);
        setError('Failed to load radiology orders. Please try again later.');
        setRadiologyOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [active, orderFromDate, orderToDate]);

  const filteredRadiologyOrders = radiologyOrders.filter(order => 
    order.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const radiologyTableHeaders = [
    "Imaging Procedure", 
    "Type", 
    "Order Date/Time", 
    "Provider", 
    "Status", 
    "Sign", 
    "Discontinue", 
    "Result",
    "Location"
  ];

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden border">
      <CardHeader className="p-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Radiology Orders</CardTitle>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted/50">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted/50">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted/50">
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted/50">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted/50">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
        {/* Filters */}
        <div className="space-y-3 mb-4 pb-3 border-b">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="orderFrom" className="text-xs whitespace-nowrap">Order From</Label>
              <div className="relative">
                <Input
                  id="orderFrom"
                  type="text"
                  value={orderFromDate}
                  onChange={(e) => setOrderFromDate(e.target.value)}
                  className="h-8 w-32 text-xs pr-7"
                  placeholder="DD/MM/YYYY"
                />
                <CalendarDays className="h-3.5 w-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="orderTo" className="text-xs whitespace-nowrap">To</Label>
              <div className="relative">
                <Input
                  id="orderTo"
                  type="text"
                  value={orderToDate}
                  onChange={(e) => setOrderToDate(e.target.value)}
                  className="h-8 w-32 text-xs pr-7"
                  placeholder="DD/MM/YYYY"
                />
                <CalendarDays className="h-3.5 w-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            
            <div className="flex-1"></div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="search" className="text-xs whitespace-nowrap">Search:</Label>
              <Input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 w-48 text-xs"
                placeholder="Search orders..."
              />
            </div>
          </div>
        </div>
        
        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-destructive">{error}</p>
            </div>
          ) : (
            <Table className="text-xs">
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow>
                  {radiologyTableHeaders.map((header) => (
                    <TableHead key={header} className="py-2 px-3 font-medium">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRadiologyOrders.length > 0 ? (
                  filteredRadiologyOrders.map((order, index) => (
                    <TableRow 
                      key={`${order.id}-${index}`}
                      className={index % 2 === 0 ? 'bg-muted/5' : ''}
                    >
                      <TableCell className="py-2 px-3">{order.testName}</TableCell>
                      <TableCell className="py-2 px-3">N/A</TableCell>
                      <TableCell className="py-2 px-3 whitespace-nowrap">
                        {order.orderDate} {order.orderTime}
                      </TableCell>
                      <TableCell className="py-2 px-3">{order.provider}</TableCell>
                      <TableCell className="py-2 px-3">
                        <Badge 
                          variant={
                            order.status === 'COMPLETED' ? 'default' : 
                            order.status === 'PENDING' ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1 px-3 text-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <PenLine className="h-3.5 w-3.5 text-blue-600" />
                        </Button>
                      </TableCell>
                      <TableCell className="py-1 px-3 text-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Ban className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        {order.result || 'N/A'}
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        {order.location}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={radiologyTableHeaders.length} className="py-8 text-center text-muted-foreground">
                      No orders found
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

export default RadiologyView; 