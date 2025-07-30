import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { CalendarDays, ArrowUpDown, Edit3, Ban, RefreshCw } from 'lucide-react';
import { usePatientProblems } from '@/hooks/usePatientProblems';
import { format } from 'date-fns';
// You may need to adjust the import for Problem type
// import { Problem } from '@/types/problem';

const ProblemsView = ({ patient }: { patient?: any }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [searchValue, setSearchValueState] = useState<string>("");
  const [selectedProblem, setSelectedProblem] = useState<any | null>(null);
  const [isViewOpen, setIsViewOpen] = useState<boolean>(false);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [problemsWithCoMorbidity, setProblemsWithCoMorbidity] = useState<Record<string, boolean>>({});
  
  // Use the patient's SSN or a default one
  const { problems, loading, error } = usePatientProblems(patient?.ssn);
  
  // Initialize co-morbidity state when problems are loaded
  useEffect(() => {
    if (problems && problems.length > 0) {
      const initialCoMorbidityState = problems.reduce((acc: Record<string, boolean>, problem: any) => {
        acc[problem.id] = problem.coMorbidity || false;
        return acc;
      }, {});
      setProblemsWithCoMorbidity(initialCoMorbidityState);
    }
  }, [problems]);
  
  // Update the table headers to match the image
  const tableHeaders = ["Problems", "Immediacy", "Status", "Date of OnSet", "Edit", "Remove", "Restore", "Co-Morbidity"];
  
  // Filter problems based on search
  const filteredProblems = useMemo(() => {
    if (!problems) return [];
    return problems.filter((problem: any) => {
      const searchLower = searchValue.toLowerCase();
      return (
        problem.problem.toLowerCase().includes(searchLower) ||
        (problem.immediacy && problem.immediacy.toLowerCase().includes(searchLower)) ||
        (problem.status && problem.status.toLowerCase().includes(searchLower))
      );
    });
  }, [problems, searchValue]);
  
  // Get current problems for pagination
  const indexOfLastProblem = currentPage * rowsPerPage;
  const indexOfFirstProblem = indexOfLastProblem - rowsPerPage;
  const currentProblems = filteredProblems.slice(indexOfFirstProblem, indexOfLastProblem);
  const totalPages = Math.ceil(filteredProblems.length / rowsPerPage);
  
  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Handle rows per page change
  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing rows per page
  };
  
  // Format date helper function
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM, yyyy');
    } catch (e) {
      return dateString; // Return as is if date parsing fails
    }
  };

  const handleCoMorbidityToggle = (problemId: string, checked: boolean) => {
    setProblemsWithCoMorbidity(prev => ({
      ...prev,
      [problemId]: checked
    }));
    
    // Here you would typically make an API call to update the co-morbidity status
    // For example:
    // updateProblemCoMorbidity(problemId, checked);
  };

  if (loading) {
    return (
      <Card className="flex-1 flex flex-col shadow text-xs overflow-hidden">
        <CardHeader className="p-2.5 border-b bg-card text-foreground rounded-t-md">
          <CardTitle className="text-base font-semibold">Problems</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex-1 flex flex-col shadow text-xs overflow-hidden">
        <CardHeader className="p-2.5 border-b bg-card text-foreground rounded-t-md">
          <CardTitle className="text-base font-semibold">Problems</CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-red-500">
          Error loading problems. Please try again.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex-1 flex flex-col shadow text-xs overflow-hidden">
      <CardHeader className="p-2.5 border-b bg-card text-foreground rounded-t-md">
        <CardTitle className="text-base font-semibold">Problems</CardTitle>
      </CardHeader>
      <CardContent className="p-1 flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between p-2 border-b gap-y-2 mb-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="showEntriesProblem" className="text-xs">Show</Label>
            <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
              <SelectTrigger id="showEntriesProblem" className="h-7 w-20 text-xs">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="text-xs">10</SelectItem>
                <SelectItem value="25" className="text-xs">25</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
                <SelectItem value="all" className="text-xs">All</SelectItem>
              </SelectContent>
            </Select>
            <Label htmlFor="showEntriesProblem" className="text-xs">entries</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="searchProblem" className="text-xs">Search:</Label>
            <Input 
              id="searchProblem" 
              type="text" 
              value={searchValue} 
              onChange={(e) => setSearchValueState(e.target.value)} 
              className="h-7 w-48 text-xs" 
              placeholder="Search problems..." 
            />
          </div>
        </div>
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
            <Table className="text-xs min-h-0">
              <TableHeader className="bg-accent text-foreground sticky top-0 z-10">
                <TableRow>
                  <TableHead className="py-2 px-2 text-xs h-8 whitespace-nowrap text-foreground font-medium bg-accent/50 hover:bg-accent transition-colors w-1/4">
                    <div className="flex items-center justify-between">
                      Problems
                      <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                    </div>
                  </TableHead>
                  <TableHead className="py-2 px-2 text-xs h-8 whitespace-nowrap text-foreground font-medium bg-accent/50 hover:bg-accent transition-colors w-1/6">
                    <div className="flex items-center justify-between">
                      Immediacy
                      <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                    </div>
                  </TableHead>
                  <TableHead className="py-2 px-2 text-xs h-8 whitespace-nowrap text-foreground font-medium bg-accent/50 hover:bg-accent transition-colors w-1/6">
                    <div className="flex items-center justify-between">
                      Status
                      <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                    </div>
                  </TableHead>
                  <TableHead className="py-2 px-2 text-xs h-8 whitespace-nowrap text-foreground font-medium bg-accent/50 hover:bg-accent transition-colors w-1/6">
                    <div className="flex items-center justify-between">
                      Date of OnSet
                      <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                    </div>
                  </TableHead>
                  <TableHead className="py-2 px-2 text-xs h-8 whitespace-nowrap text-foreground font-medium bg-accent/50 hover:bg-accent transition-colors w-1/12">
                    Edit
                  </TableHead>
                  <TableHead className="py-2 px-2 text-xs h-8 whitespace-nowrap text-foreground font-medium bg-accent/50 hover:bg-accent transition-colors w-1/12">
                    Remove
                  </TableHead>
                  <TableHead className="py-2 px-2 text-xs h-8 whitespace-nowrap text-foreground font-medium bg-accent/50 hover:bg-accent transition-colors w-1/12">
                    Restore
                  </TableHead>
                  <TableHead className="py-2 px-2 text-xs h-8 whitespace-nowrap text-foreground font-medium bg-accent/50 hover:bg-accent transition-colors w-1/6">
                    Co-Morbidity
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr:last-child]:border-0">
                {currentProblems.length > 0 ? (
                  currentProblems.map((problem: any) => (
                    <TableRow key={problem.id} className="even:bg-muted/30 hover:bg-muted/50">
                      <TableCell className="px-2 py-2 text-xs align-top">
                        <Button 
                          variant="link" 
                          className="h-auto p-0 text-xs text-left font-normal hover:no-underline hover:text-primary"
                          onClick={() => {
                            setSelectedProblem(problem);
                            setIsViewOpen(true);
                          }}
                        >
                          {problem.problem.split(' (')[0]}
                        </Button>
                      </TableCell>
                      <TableCell className="px-2 py-2 text-xs align-top">
                        {problem.immediacy || 'N/A'}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-xs align-top">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          problem.status === 'A' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {problem.status === 'A' ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-2 text-xs align-top">
                        {formatDate(problem.dateOfOnSet)}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-center align-top">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 p-1.5 text-muted-foreground hover:text-foreground"
                          onClick={() => window.open(problem.editUrl, '_blank')}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                      <TableCell className="px-2 py-2 text-center align-top">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => window.open(problem.removeUrl, '_blank')}
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                      <TableCell className="px-2 py-2 text-center align-top">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 p-1.5 text-muted-foreground hover:text-foreground"
                          onClick={() => window.open(problem.restoreUrl, '_blank')}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                      <TableCell className="px-2 py-2 text-center align-middle">
                        <div className="flex justify-center">
                          <Switch 
                            checked={problemsWithCoMorbidity[problem.id] || false}
                            onCheckedChange={(checked) => handleCoMorbidityToggle(problem.id, checked)}
                            className="data-[state=checked]:bg-primary h-4 w-8"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={tableHeaders.length} className="text-center py-10 text-muted-foreground">
                      No problems found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex items-center justify-between p-2.5 border-t text-xs text-muted-foreground mt-auto">
          <div>
            Showing {filteredProblems.length === 0 ? 0 : indexOfFirstProblem + 1} to{' '}
            {Math.min(indexOfLastProblem, filteredProblems.length)} of {filteredProblems.length} entries
          </div>
          <div className="flex items-center space-x-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs px-2 py-1"
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
              // Show first page, last page, and current page with one page on each side
              if (totalPages <= 3 || i < 2 || i >= totalPages - 2) {
                return (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? 'default' : 'outline'}
                    size="sm"
                    className={`h-7 text-xs px-2 py-1 ${currentPage === i + 1 ? 'bg-accent text-foreground' : ''}`}
                    onClick={() => paginate(i + 1)}
                  >
                    {i + 1}
                  </Button>
                );
              } else if (i === 2 && totalPages > 3) {
                return <span key="ellipsis" className="px-2">...</span>;
              }
              return null;
            })}
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs px-2 py-1"
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
      <div className="flex items-center justify-center p-2.5 border-t">
        <Button
          size="sm"
          className="text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => setIsPopupOpen(true)}
        >
          New Problem
        </Button>
      </div>

      {isPopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-card rounded-lg shadow-lg p-4 w-[32rem] max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h3 className="text-xs">Add New Problem</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsPopupOpen(false)}>
                <Ban className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="text-xs w-24">
                  Problem <span className="text-red-500">*</span>
                </Label>
                <Input className="h-8 text-xs flex-1" placeholder="Enter problem" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="text-xs w-24">
                  Type <span className="text-red-500">*</span>
                </Label>
                <Select>
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acute">Acute</SelectItem>
                    <SelectItem value="chronic">Chronic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <Label className="text-xs w-24">
                  Date <span className="text-red-500">*</span>
                </Label>
                <div className="flex-1">
                  <Input
                    className="h-8 text-xs pr-8"
                    placeholder="MM/DD/YYYY"
                    defaultValue="05/29/2025"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7 absolute right-0.5 top-0.5 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Label className="text-xs w-24">Remark</Label>
                <Input className="h-8 text-xs flex-1" placeholder="Enter remark" />
              </div>
              <div className="flex items-center gap-4">
                <Label className="text-xs w-24">Status</Label>
                <Switch defaultChecked className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input h-5 w-9" />
                <span className="text-xs">ACTIVE</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => setIsPopupOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ProblemsView; 