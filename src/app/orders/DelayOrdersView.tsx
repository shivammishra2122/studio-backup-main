import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, Settings, RefreshCw, PenLine, Ban, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DelayOrdersView = () => {
  const [delayOrderView, setDelayOrderView] = useState<string>("Delay Order List");
  const [eventFilter, setEventFilter] = useState<string>("ADMISSION TO LAJPATNAGAR");
  const [showEntries, setShowEntries] = useState<string>("10");
  const [searchText, setSearchText] = useState<string>("");

  const filteredDelayOrders: any[] = [];

  const delayOrderTableHeaders = ["S.No.", "Event", "Order", "Start/Stop Date", "Status", "Ordered By", "Sign", "Discontinue", "Change Event", "Release Order", "Order View"];

  return (
    <Card className="flex-1 flex flex-col shadow overflow-hidden">
      <CardHeader className="p-2.5 border-b bg-card text-foreground rounded-t-md">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Delay Orders - List/Events</CardTitle>
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
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="delayOrderList"
                name="delayOrderView"
                value="Delay Order List"
                checked={delayOrderView === "Delay Order List"}
                onChange={() => setDelayOrderView("Delay Order List")}
                className="h-4 w-4 text-blue-600"
                title="Delay Order List"
              />
              <Label htmlFor="delayOrderList" className="text-xs">Delay Order List</Label>
              <input
                type="radio"
                id="delayOrderEvents"
                name="delayOrderView"
                value="Delay Order Events"
                checked={delayOrderView === "Delay Order Events"}
                onChange={() => setDelayOrderView("Delay Order Events")}
                className="h-4 w-4 text-blue-600"
                title="Delay Order Events"
              />
              <Label htmlFor="delayOrderEvents" className="text-xs">Delay Order Events</Label>
            </div>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="h-7 w-48 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMISSION TO LAJPATNAGAR">ADMISSION TO LAJPATNAGAR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center space-x-1">
              <Label htmlFor="delayShowEntries" className="text-xs shrink-0">Show</Label>
              <Select value={showEntries} onValueChange={setShowEntries}>
                <SelectTrigger id="delayShowEntries" className="h-7 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <Label htmlFor="delayShowEntries" className="text-xs shrink-0">entries</Label>
            </div>
            <div className="flex-grow"></div>
            <Label htmlFor="delaySearch" className="shrink-0">Search:</Label>
            <Input id="delaySearch" type="text" value={searchText} onChange={e => setSearchText(e.target.value)} className="h-7 w-40 text-xs" />
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          <Table className="text-xs w-full">
            <TableHeader className="bg-accent sticky top-0 z-10">
              <TableRow>
                {delayOrderTableHeaders.map(header => (
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
              {filteredDelayOrders.length > 0 ? filteredDelayOrders.map((order, index) => (
                <TableRow key={order.id} className={`${index % 2 === 0 ? 'bg-muted/30' : ''}`}>
                  <TableCell className="py-1.5 px-3">{index + 1}</TableCell>
                  <TableCell className="py-1.5 px-3">{order.event}</TableCell>
                  <TableCell className="py-1.5 px-3">{order.order}</TableCell>
                  <TableCell className="py-1.5 px-3">
                    <div>Start: {order.startDate} {order.startTime}</div>
                    {order.stopDate && <div>Stop: {order.stopDate} {order.stopTime}</div>}
                  </TableCell>
                  <TableCell className="py-1.5 px-3 text-xs">{order.status}</TableCell>
                  <TableCell className="py-1.5 px-3">{order.orderedBy}</TableCell>
                  <TableCell className="py-1.5 px-3 text-center"><Button variant="ghost" size="icon" className="h-6 w-6"><PenLine className="h-3.5 w-3.5 text-blue-600" /></Button></TableCell>
                  <TableCell className="py-1.5 px-3 text-center"><Button variant="ghost" size="icon" className="h-6 w-6"><Ban className="h-3.5 w-3.5 text-red-500" /></Button></TableCell>
                  <TableCell className="py-1.5 px-3 text-center"><Button variant="ghost" size="icon" className="h-6 w-6"><FileText className="h-3.5 w-3.5 text-blue-600" /></Button></TableCell>
                  <TableCell className="py-1.5 px-3 text-center"><Button variant="ghost" size="icon" className="h-6 w-6"><FileText className="h-3.5 w-3.5 text-blue-600" /></Button></TableCell>
                  <TableCell className="py-1.5 px-3 text-center"><Button variant="ghost" size="icon" className="h-6 w-6"><FileText className="h-3.5 w-3.5 text-blue-600" /></Button></TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={delayOrderTableHeaders.length} className="text-center py-10 text-muted-foreground">
                    No Data Found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-2.5 border-t text-xs text-muted-foreground mt-auto">
          <div>Showing {filteredDelayOrders.length > 0 ? 1 : 0} to {filteredDelayOrders.length} of {filteredDelayOrders.length} entries</div>
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

export default DelayOrdersView; 