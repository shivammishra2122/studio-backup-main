import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, ArrowUpDown, Plus } from 'lucide-react';
import { usePatientComplaints } from '@/hooks/usePatientComplaints';
// import { Patient } from '@/services/api'; // Uncomment if Patient type is needed

const ChiefComplaintsView = ({ patient }: { patient?: any }) => {
  const [showEntriesValue, setShowEntriesValueState] = useState<string>("10");
  const [searchValue, setSearchValueState] = useState<string>("");
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const { complaints, loading, error, refresh } = usePatientComplaints(patient?.ssn);
  
  const tableHeaders = ["S.No", "Complaint", "Type", "Date/Time", "Status", "Remarks"];

  // Debug logs
  useEffect(() => {
    console.log('Complaints data:', complaints);
  }, [complaints]);

  return (
    <Card className="flex-1 flex flex-col shadow text-xs overflow-hidden">
      <CardHeader className="p-2.5 border-b bg-card text-foreground rounded-t-md">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Chief Complaints</CardTitle>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-primary hover:bg-muted/50"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-primary hover:bg-muted/50"
              onClick={() => setIsPopupOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-1 flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between p-2 border-b gap-y-2 mb-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="showEntries" className="text-xs">Show</Label>
            <Select value={showEntriesValue} onValueChange={setShowEntriesValueState}>
              <SelectTrigger id="showEntries" className="h-7 w-20 text-xs">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="text-xs">10</SelectItem>
                <SelectItem value="25" className="text-xs">25</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
                <SelectItem value="all" className="text-xs">All</SelectItem>
              </SelectContent>
            </Select>
            <Label htmlFor="showEntries" className="text-xs">entries</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="search" className="text-xs">Search:</Label>
            <Input 
              id="search" 
              type="text" 
              value={searchValue} 
              onChange={(e) => setSearchValueState(e.target.value)} 
              className="h-7 w-48 text-xs" 
              placeholder="Search complaints..." 
            />
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={tableHeaders.length} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span>Loading complaints data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={tableHeaders.length} className="text-center py-10 text-red-500">
                      Error loading complaints. <Button variant="link" className="h-auto p-0 text-red-500" onClick={refresh}>Retry</Button>
                    </TableCell>
                  </TableRow>
                ) : Object.keys(complaints).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableHeaders.length} className="text-center py-10 text-muted-foreground">
                      No complaints found
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(complaints).map(([id, complaint]) => (
                    <TableRow key={id} className="even:bg-muted/30">
                      <TableCell>{id}</TableCell>
                      <TableCell className="font-medium">{complaint.CompName}</TableCell>
                      <TableCell>{complaint.CmpType}</TableCell>
                      <TableCell>{complaint.DateTime}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          complaint.Status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {complaint.Status}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={complaint.Remark}>
                        {complaint.Remark || '-'}
                      </TableCell>
                      
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex items-center justify-between p-2.5 border-t text-xs text-muted-foreground mt-auto">
          <div>Showing {Object.keys(complaints).length > 0 ? 1 : 0} to {Object.keys(complaints).length} of {Object.keys(complaints).length} entries</div>
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1">Previous</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1 bg-accent text-foreground border-border">1</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1">Next</Button>
          </div>
        </div>
      </CardContent>

      {/* Add Complaint Popup */}
      {isPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-[500px] p-5 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setIsPopupOpen(false)}
            >
              ✖
            </button>
            <h2 className="text-base font-semibold mb-4">Add Chief Complaint</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Complaint</label>
                <input
                  type="text"
                  placeholder="E.g. Headache"
                  className="mt-1 block w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="complaintType">Type</label>
                <select id="complaintType" className="mt-1 block w-full px-3 py-2 border rounded text-sm">
                  <option>New</option>
                  <option>Follow-up</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Remark</label>
                <textarea
                  placeholder="Optional remarks"
                  className="mt-1 block w-full px-3 py-2 border rounded text-sm"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsPopupOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ChiefComplaintsView; 