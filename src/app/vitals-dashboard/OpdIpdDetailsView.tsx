import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Edit3, ArrowUpDown } from 'lucide-react';
// import { Patient } from '@/services/api'; // Uncomment if Patient type is needed

const OpdIpdDetailsView = ({ patient }: { patient?: any }) => {
  const [showEntriesValue, setShowEntriesValueState] = useState<string>("10");
  const [visitDateValue, setVisitDateValueState] = useState<string>("10 SEP, 2024 13:10");
  const [statusSwitchChecked, setStatusSwitchCheckedState] = useState<boolean>(true);
  const [searchValue, setSearchValueState] = useState<string>("");

  const tableHeaders = ["S.No", "Visit ID", "Visit Type", "Department", "Doctor", "Date", "Status"];

  return (
    <Card className="flex-1 flex flex-col shadow text-xs overflow-hidden">
      <CardHeader className="p-2.5 border-b bg-card text-foreground rounded-t-md">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">OPD/IPD Details</CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-muted/50">
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-1 flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between p-2 border-b gap-y-2 mb-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="showEntriesOpdIpd" className="text-xs">Show</Label>
            <Select value={showEntriesValue} onValueChange={setShowEntriesValueState}>
              <SelectTrigger id="showEntriesOpdIpd" className="h-7 w-20 text-xs">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="text-xs">10</SelectItem>
                <SelectItem value="25" className="text-xs">25</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
                <SelectItem value="all" className="text-xs">All</SelectItem>
              </SelectContent>
            </Select>
            <Label htmlFor="showEntriesOpdIpd" className="text-xs">entries</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="visitDateOpdIpd" className="text-xs">Visit Date</Label>
            <Select value={visitDateValue} onValueChange={setVisitDateValueState}>
              <SelectTrigger id="visitDateOpdIpd" className="h-7 w-40 text-xs">
                <SelectValue placeholder="Select Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10 SEP, 2024 13:10" className="text-xs">10 SEP, 2024 13:10</SelectItem>
              </SelectContent>
            </Select>
            <Label htmlFor="statusSwitchOpdIpd" className="text-xs">Status</Label>
            <Switch id="statusSwitchOpdIpd" checked={statusSwitchChecked} onCheckedChange={setStatusSwitchCheckedState} className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input h-5 w-9" />
            <Label htmlFor="statusSwitchOpdIpd" className="text-xs ml-1">{statusSwitchChecked ? "ACTIVE" : "INACTIVE"}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="searchOpdIpd" className="text-xs">Search:</Label>
            <Input id="searchOpdIpd" type="text" value={searchValue} onChange={(e) => setSearchValueState(e.target.value)} className="h-7 w-48 text-xs" />
          </div>
        </div>
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-auto">
            <Table className="text-xs min-h-0">
              <TableHeader className="bg-accent text-foreground sticky top-0 z-10">
                <TableRow>
                  {tableHeaders.map(header => (
                    <TableHead key={header} className="py-2 px-3 text-xs h-8 whitespace-nowrap text-foreground font-medium bg-accent/50 hover:bg-accent transition-colors">
                      <div className="flex items-center justify-between">
                        {header}
                        <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="even:bg-muted/30">
                  <TableCell colSpan={tableHeaders.length} className="text-center py-10 text-muted-foreground">
                    No Data Found
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex items-center justify-between p-2.5 border-t text-xs text-muted-foreground mt-auto">
          <div>Showing 0 to 0 of 0 entries</div>
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

export default OpdIpdDetailsView; 