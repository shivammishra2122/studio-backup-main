import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, ArrowUpDown } from 'lucide-react';
import { usePatientDiagnosis } from '@/hooks/usePatientDiagnosis';
// import { Patient } from '@/services/api'; // Uncomment if Patient type is needed

const FinalDiagnosisView = ({ patient }: { patient?: any }) => {
  const [showEntriesValue, setShowEntriesValueState] = useState<string>("10");
  const [visitDateValue, setVisitDateValueState] = useState<string>("10 SEP, 2024 13:10");
  const [searchValue, setSearchValueState] = useState<string>("");
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<Record<string, string>>({});
  
  // Use the patient's SSN or a default one
  const { diagnosis, loading, error, refresh } = usePatientDiagnosis(patient?.ssn);
  
  // Debug logs
  useEffect(() => {
    console.log('Diagnosis data in component:', diagnosis);
    console.log('Loading state:', loading);
    console.log('Error state:', error);
  }, [diagnosis, loading, error]);
  
  const tableHeaders = ["S.No", "Type", "Diagnosis Description", "Comment", "Entered Date", "Provider", "Actions"];
  
  const handleDiagnosisAction = (diagnosisId: string, action: 'add' | 'remove') => {
    setSelectedDiagnosis(prev => ({
      ...prev,
      [diagnosisId]: action
    }));
    
    // In a real app, you would make an API call here to update the diagnosis
    console.log(`${action === 'add' ? 'Adding' : 'Removing'} diagnosis:`, diagnosisId);
  };

  return (
    <Card className="flex-1 flex flex-col shadow text-xs overflow-hidden">
      <CardHeader className="p-2.5 border-b bg-card text-foreground rounded-t-md">
        <CardTitle className="text-base">Diagnosis</CardTitle>
      </CardHeader>
      <CardContent className="p-1 flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between p-2 border-b gap-y-2 mb-2">
          <div className="flex items-center space-x-1">
            <Label htmlFor="showEntriesDiagnosis" className="text-xs">Show</Label>
            <Select value={showEntriesValue} onValueChange={setShowEntriesValueState}>
              <SelectTrigger id="showEntriesDiagnosis" className="h-7 w-20 text-xs">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="text-xs">10</SelectItem>
                <SelectItem value="25" className="text-xs">25</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
                <SelectItem value="all" className="text-xs">All</SelectItem>
              </SelectContent>
            </Select>
            <Label htmlFor="showEntriesDiagnosis" className="text-xs">entries</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="visitDateDiagnosis" className="text-xs">Visit Date</Label>
            <Select value={visitDateValue} onValueChange={setVisitDateValueState}>
              <SelectTrigger id="visitDateDiagnosis" className="h-7 w-40 text-xs">
                <SelectValue placeholder="Select Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10 SEP, 2024 13:10" className="text-xs">10 SEP, 2024 13:10</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="searchDiagnosis" className="text-xs">Search:</Label>
            <Input 
              id="searchDiagnosis" 
              type="text" 
              value={searchValue} 
              onChange={(e) => setSearchValueState(e.target.value)} 
              className="h-7 w-48 text-xs" 
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
                        <span>Loading diagnosis data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={tableHeaders.length} className="text-center py-10 text-red-500">
                      Error loading diagnosis data. <Button variant="link" className="h-auto p-0 text-red-500" onClick={refresh}>Retry</Button>
                    </TableCell>
                  </TableRow>
                ) : Object.keys(diagnosis).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableHeaders.length} className="text-center py-10 text-muted-foreground">
                      No diagnosis data found
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(diagnosis).map(([id, diag]: [string, any], idx) => (
                    <TableRow key={id} className="even:bg-muted/30">
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="capitalize">{diag.Type || 'N/A'}</TableCell>
                      <TableCell>{diag["Diagnosis Description"] || 'N/A'}</TableCell>
                      <TableCell>{diag.Comment || 'N/A'}</TableCell>
                      <TableCell>{diag["Entered Date"] || 'N/A'}</TableCell>
                      <TableCell>{diag.Provider || 'N/A'}</TableCell>
                      <TableCell className="space-x-1">
                        {selectedDiagnosis[id] === 'add' ? (
                          <Button variant="outline" size="sm" className="h-7 text-xs" disabled>
                            Added
                          </Button>
                        ) : selectedDiagnosis[id] === 'remove' ? (
                          <Button variant="outline" size="sm" className="h-7 text-xs" disabled>
                            Removed
                          </Button>
                        ) : (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-xs"
                              onClick={() => handleDiagnosisAction(id, 'add')}
                            >
                              Add
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-xs text-red-500 hover:text-red-600"
                              onClick={() => handleDiagnosisAction(id, 'remove')}
                            >
                              Remove
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex items-center justify-between p-2.5 border-t text-xs text-muted-foreground mt-auto">
          <div>Showing {Object.keys(diagnosis).length > 0 ? 1 : 0} to {Object.keys(diagnosis).length} of {Object.keys(diagnosis).length} entries</div>
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1">Previous</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1 bg-accent text-foreground border-border">1</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 py-1">Next</Button>
          </div>
        </div>
      </CardContent>
      <div className="flex items-center justify-center p-2.5 border-t">
        <Button size="sm" className="text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground">New Diagnosis</Button>
      </div>
    </Card>
  );
};

export default FinalDiagnosisView; 