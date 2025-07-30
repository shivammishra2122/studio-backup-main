import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, ArrowUpDown, Eye, XCircle } from 'lucide-react';
import { usePatientAllergies } from '@/hooks/usePatientAllergies';
// import { Patient } from '@/services/api'; // Uncomment if Patient type is needed

const AllergiesView = ({ patient }: { patient?: any }) => {
  const [showEntriesValue, setShowEntriesValueState] = useState<string>("10");
  const [searchValue, setSearchValueState] = useState<string>("");
  const [selectedAllergies, setSelectedAllergies] = useState<Record<string, boolean>>({});
  const { allergies, loading, error, refresh } = usePatientAllergies(patient?.ssn);

  // Debug logs
  useEffect(() => {
    console.log('Allergies data in component:', allergies);
  }, [allergies]);

  const tableHeaders = ["Allergies", "Date", "Nature of Reaction", "Observed/Historical", "Originator", "Symptoms", "Actions"];

  const handleAllergyAction = (allergyId: string, action: boolean) => {
    setSelectedAllergies(prev => ({
      ...prev,
      [allergyId]: action
    }));
    // In a real app, you would make an API call here to update the allergy status
    console.log(`${action ? 'Adding' : 'Removing'} allergy:`, allergyId);
  };

  return (
    <Card className="flex-1 flex flex-col shadow text-xs overflow-hidden">
      <CardHeader className="p-2.5 border-b bg-card text-foreground rounded-t-md">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Allergies</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-primary hover:bg-muted/50"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-1 flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between p-2 border-b gap-y-2 mb-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="showEntriesAllergy" className="text-xs">Show</Label>
            <Select value={showEntriesValue} onValueChange={setShowEntriesValueState}>
              <SelectTrigger id="showEntriesAllergy" className="h-7 w-20 text-xs">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="text-xs">10</SelectItem>
                <SelectItem value="25" className="text-xs">25</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
                <SelectItem value="all" className="text-xs">All</SelectItem>
              </SelectContent>
            </Select>
            <Label htmlFor="showEntriesAllergy" className="text-xs">entries</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="searchAllergy" className="text-xs">Search:</Label>
            <Input 
              id="searchAllergy" 
              type="text" 
              value={searchValue} 
              onChange={(e) => setSearchValueState(e.target.value)} 
              className="h-7 w-48 text-xs" 
              placeholder="Search allergies..." 
            />
          </div>
        </div>
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-auto">
            <Table className="text-xs min-h-0">
              <TableHeader className="bg-accent text-foreground sticky top-0 z-10">
                <TableRow>
                  {tableHeaders.map(header => (
                    <TableHead 
                      key={header} 
                      className={`py-2 px-3 text-xs h-8 whitespace-nowrap text-foreground font-medium bg-accent/50 hover:bg-accent transition-colors ${
                        header === 'Actions' ? 'text-center' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        {header}
                        {header !== 'Actions' && (
                          <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </ TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={tableHeaders.length} className="text-center py-4">
                      <p className="text-muted-foreground">Loading allergies data...</p>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={tableHeaders.length} className="text-center py-4">
                      <p className="text-destructive">{error.message || 'Error loading allergies data'}</p>
                    </TableCell>
                  </TableRow>
                ) : Object.keys(allergies).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableHeaders.length} className="text-center py-4">
                      <p className="text-muted-foreground">No allergies data available</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(allergies).map(([id, allergy], index) => (
                    <TableRow key={id} className="even:bg-muted/30">
                      <TableCell>{allergy.Allergies}</TableCell>
                      <TableCell>{allergy.Date}</TableCell>
                      <TableCell>
                        {allergy["Nature of Reaction"] && (
                          <span className="capitalize">{allergy["Nature of Reaction"]}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {allergy["Observed/Historical"] && (
                          <span className="capitalize">{allergy["Observed/Historical"]}</span>
                        )}
                      </TableCell>
                      <TableCell>{allergy.Originator}</TableCell>
                      <TableCell>{allergy.Symptoms}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-7 w-7 p-1.5 rounded-full ${
                              selectedAllergies[id] 
                                ? 'text-blue-500 hover:bg-blue-50' 
                                : 'text-blue-500 hover:bg-blue-50'
                            }`}
                            onClick={() => handleAllergyAction(id, false)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-7 w-7 p-1.5 rounded-full ${
                              selectedAllergies[id] 
                                ? 'text-red-500 hover:bg-red-50' 
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                            onClick={() => handleAllergyAction(id, true)}
                          >
                            <XCircle className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex items-center justify-between p-2.5 border-t text-xs text-muted-foreground mt-auto">
          <div>Showing {Object.keys(allergies).length > 0 ? 1 : 0} to {Object.keys(allergies).length} of {Object.keys(allergies).length} entries</div>
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

export default AllergiesView; 