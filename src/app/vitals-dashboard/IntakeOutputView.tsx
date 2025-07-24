import React, { useState, useEffect, useCallback } from 'react';
import { Patient } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays } from 'lucide-react';
import { fetchIntakeOutputData, fetchIntakeUpdateData, IntakeOutputSummary } from '@/services/intakeOutput';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw, Edit3 } from 'lucide-react';

const IntakeOutputView = ({ patient }: { patient?: Patient }) => {
  const [fromDateValue, setFromDateValue] = useState<string>("05/16/2025 14:05");
  const [toDateValueState, setToDateValueState] = useState<string>("05/17/2025 14:05");
  const [isIntakeOutputEntryMode, setIsIntakeOutputEntryMode] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<string>('summary');
  
  // State for API data and loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [chartData, setChartData] = useState<Array<{name: string, series1: number, series2: number}>>([]);
  const [intakeOutputData, setIntakeOutputData] = useState<IntakeOutputSummary | null>(null);
  const [useUpdateData, setUseUpdateData] = useState<boolean>(false);

  // Define a type for the intake/output data
  type IntakeOutputData = {
    ivfluid: string;
    bloodproduct: string;
    po: string;
    tubefeeding: string;
    infusion: string;
    other: string;
    urine: string;
    ng: string;
    emesis: string;
    drainage: string;
    faeces: string;
    [key: string]: string; // Index signature to allow string indexing
  };

  const [intakeOutputEntryData, setIntakeOutputEntryData] = useState<IntakeOutputData>({
    ivfluid: '',
    bloodproduct: '',
    po: '',
    tubefeeding: '',
    infusion: '',
    other: '',
    urine: '',
    ng: '',
    emesis: '',
    drainage: '',
    faeces: ''
  });

  const inputHeaders = ["IV FLUID", "BLOOD PRODUCT", "PO", "TUBE FEEDING", "INFUSION", "OTHER"];
  const outputHeaders = ["URINE", "N/G", "EMESIS", "DRAINAGE", "FAECES"];

  const handleIntakeOutputEntryChange = (key: keyof IntakeOutputData, value: string) => {
    setIntakeOutputEntryData(prev => ({ ...prev, [key]: value }));
  };
  
  // Update the intake/output data state when loading is complete
  useEffect(() => {
    if (!loading && intakeOutputData) {
      // Update the chart data when we have new intake/output data
      const newChartData = intakeOutputData.records
        .slice(0, 10) // Limit to last 10 records for the chart
        .map((record: { timestamp: string; type: string; amount: number }) => ({
          name: new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          series1: record.type === 'INTAKE' ? record.amount : 0,
          series2: record.type === 'OUTPUT' ? record.amount : 0,
        }));
      
      setChartData(newChartData);
    }
  }, [loading, intakeOutputData]);

  // Function to load intake/output data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = useUpdateData 
        ? await fetchIntakeUpdateData('670768354')
        : await fetchIntakeOutputData('670768354');
      setIntakeOutputData(data);
      setError(null);
    } catch (err) {
      console.error('Error loading intake/output data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load intake/output data'));
    } finally {
      setLoading(false);
    }
  }, [useUpdateData]);

  // Fetch intake/output data on component mount or when data source changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateString; // Return as is if parsing fails
    }
  };

  const IntakeOutputForm = ({ title, isIntake, isUpdate }: { title: string; isIntake: boolean; isUpdate: boolean }) => {
    const [date, setDate] = useState('05/29/2025');
    const [hour, setHour] = useState('10');
    const [minute, setMinute] = useState('32');
    const [second, setSecond] = useState('00');
    const [type, setType] = useState('');
    const [amount, setAmount] = useState('');

    const handleSubmit = () => {
      console.log(`${isUpdate ? 'Update' : 'Add'} ${isIntake ? 'Intake' : 'Output'}`, { date, time: `${hour}:${minute}:${second}`, type, amount });
      setCurrentView('summary');
    };

    const handleReset = () => {
      setDate('05/29/2025');
      setHour('10');
      setMinute('32');
      setSecond('00');
      setType('');
      setAmount('');
    };

    return (
      <div className="flex-1 flex flex-col">
        <div className="p-2 border-b bg-card text-foreground">
          <h2 className="text-base">{title}</h2>
        </div>
        <div className="p-4 flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Label className="text-sm w-24">
              {isIntake ? 'Intake Date' : 'Output Date'} <span className="text-red-500">*</span>
            </Label>
            <div className="flex-1">
              <Input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 text-sm"
                placeholder="MM/DD/YYYY"
              />
              <Button variant="ghost" size="icon" className="h-7 w-7 absolute right-0.5 top-0.5 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Label className="text-sm w-24">
              {isIntake ? 'Intake Time' : 'Output Time'}
            </Label>
            <div className="flex gap-2">
              <Select value={hour} onValueChange={setHour}>
                <SelectTrigger className="w-16 h-8 text-sm">
                  <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(24)].map((_, i) => (
                    <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                      {i.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={minute} onValueChange={setMinute}>
                <SelectTrigger className="w-16 h-8 text-sm">
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(60)].map((_, i) => (
                    <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                      {i.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={second} onValueChange={setSecond}>
                <SelectTrigger className="w-16 h-8 text-sm">
                  <SelectValue placeholder="SS" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(60)].map((_, i) => (
                    <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                      {i.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Label className="text-sm w-24">
              {isIntake ? 'Intake Type' : 'Output Type'} <span className="text-red-500">*</span>
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-8 text-sm flex-1">
                <SelectValue placeholder="SELECT" />
              </SelectTrigger>
              <SelectContent>
                {(isIntake ? inputHeaders : outputHeaders).map((header) => (
                  <SelectItem key={header} value={header.toLowerCase().replace(' ', '')}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <Label className="text-sm w-24">
              Amount <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-8 text-sm"
                placeholder="Enter amount"
              />
              <span className="text-sm">ml</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-auto p-2 border-t">
          <Button
            size="sm"
            className="text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleSubmit}
          >
            {isIntake ? (isUpdate ? 'Update Intake' : 'Add Intake') : (isUpdate ? 'Update Output' : 'Output Add')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8"
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8"
            onClick={() => setCurrentView('summary')}
          >
            Back
          </Button>
        </div>
      </div>
    );
  };

  const IntakeOutputList = ({ title, isIntake }: { title: string; isIntake: boolean }) => {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-2 border-b bg-card text-foreground">
          <h2 className="text-base">{title}</h2>
        </div>
        <div className="flex flex-wrap items-center space-x-3 p-2 border-b text-xs gap-y-2">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="12"
              value="1"
              className="w-20"
              title="Select number of months"
              aria-label="Select number of months"
            />
            <span>1 Month</span>
          </div>
          <Label htmlFor="listFromDate" className="shrink-0 text-xs">From Date</Label>
          <div className="relative">
            <Input
              id="listFromDate"
              type="text"
              value={fromDateValue}
              onChange={(e) => setFromDateValue(e.target.value)}
              className="h-8 w-36 text-xs"
            />
            <Button variant="ghost" size="icon" className="h-7 w-7 absolute right-0.5 top-0.5 text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
            </Button>
          </div>
          <Label htmlFor="listToDate" className="shrink-0 text-xs">To Date</Label>
          <div className="relative">
            <Input
              id="listToDate"
              type="text"
              value={toDateValueState}
              onChange={(e) => setToDateValueState(e.target.value)}
              className="h-8 w-36 text-xs"
            />
            <Button variant="ghost" size="icon" className="h-7 w-7 absolute right-0.5 top-0.5 text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Show</Label>
            <Select defaultValue="10">
              <SelectTrigger className="w-16 h-8 text-xs">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs">entries</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Search:</Label>
            <Input className="h-8 w-36 text-xs" placeholder="Search..." />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-accent text-foreground">
                <th className="p-1.5 border text-xs text-center">UPDATE</th>
                <th className="p-1.5 border text-xs text-center">{isIntake ? 'INTAKE DATE/TIME' : 'OUTPUT DATE/TIME'}</th>
                <th className="p-1.5 border text-xs text-center">{isIntake ? 'INTAKE TYPE' : 'OUTPUT TYPE'}</th>
                <th className="p-1.5 border text-xs text-center">HOSPITAL LOCATION</th>
                <th className="p-1.5 border text-xs text-center">AMOUNT</th>
                <th className="p-1.5 border text-xs text-center">ENTER BY</th>
              </tr>
            </thead>
            <tbody className="bg-card">
              <tr>
                <td colSpan={6} className="p-4 text-center">No Data Found</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-2 border-t text-xs">
          <span>Showing 0 to 0 of 0 entries</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs h-8">Previous</Button>
            <Button size="sm" variant="outline" className="text-xs h-8">Next</Button>
          </div>
        </div>
        <div className="flex justify-center p-2 border-t">
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8"
            onClick={() => setCurrentView('summary')}
          >
            Back
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 w-[100%] flex justify-between gap-3 overflow-auto">
      <div className="flex flex-col border rounded-md bg-card shadow overflow-hidden">
        {currentView === 'summary' ? (
          <>
            <div className="flex items-center justify-between p-2 border-b bg-card text-foreground rounded-t-md">
              <h2 className="text-base font-semibold">Patient Intake/Output Summary</h2>
              <div className="flex items-center space-x-1">
                <Button 
                  variant={useUpdateData ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setUseUpdateData(!useUpdateData)}
                >
                  {useUpdateData ? 'Switch to Standard View' : 'Switch to Update View'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-primary hover:bg-muted/50"
                  onClick={() => {
                    setLoading(true);
                    loadData();
                  }}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-primary hover:bg-muted/50"
                  onClick={() => setIsIntakeOutputEntryMode(!isIntakeOutputEntryMode)}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {isIntakeOutputEntryMode ? (
              <>
                <ScrollArea className="flex-1 min-h-0">
                  <Table className="text-xs">
                    <thead className="bg-accent sticky top-0 z-10">
                      <tr>
                        <TableHead className="text-foreground py-2 px-3 h-8">Category</TableHead>
                        <TableHead className="text-foreground py-2 px-3 h-8">Value (ml)</TableHead>
                      </tr>
                    </thead>
                    <TableBody>
                      {inputHeaders.map((header, index) => (
                        <TableRow key={header} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                          <TableCell className="py-1.5 px-3">{header}</TableCell>
                          <TableCell className="py-1.5 px-3">
                            <Input
                              type="text"
                              className="h-7 text-xs w-20"
                              value={intakeOutputEntryData[header.toLowerCase().replace(' ', '') as keyof IntakeOutputData]}
                              onChange={e => handleIntakeOutputEntryChange(header.toLowerCase().replace(' ', '') as keyof IntakeOutputData, e.target.value)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {outputHeaders.map((header, index) => (
                        <TableRow key={header} className={(index + inputHeaders.length) % 2 === 0 ? 'bg-muted/30' : ''}>
                          <TableCell className="py-1.5 px-3">{header}</TableCell>
                          <TableCell className="py-1.5 px-3">
                            <Input
                              type="text"
                              className="h-7 text-xs w-20"
                              value={intakeOutputEntryData[header.toLowerCase().replace('/', '') as keyof IntakeOutputData]}
                              onChange={e => handleIntakeOutputEntryChange(header.toLowerCase().replace('/', '') as keyof IntakeOutputData, e.target.value)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                <div className="flex justify-end space-x-2 mt-auto p-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => setIsIntakeOutputEntryMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => {
                      setIsIntakeOutputEntryMode(false);
                      // TODO: Save logic
                    }}
                  >
                    Save
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center space-x-3 p-2 border-b text-xs gap-y-2">
                  <Label htmlFor="intakeFromDate" className="shrink-0 text-xs">From Date</Label>
                  <div className="relative">
                    <Input
                      id="intakeFromDate"
                      type="text"
                      value={fromDateValue}
                      onChange={(e) => setFromDateValue(e.target.value)}
                      className="h-8 w-36 text-xs pr-8"
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 absolute right-0.5 top-0.5 text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                    </Button>
                  </div>
                  <Label htmlFor="intakeToDate" className="shrink-0 text-xs">To Date</Label>
                  <div className="relative">
                    <Input
                      id="intakeToDate"
                      type="text"
                      value={toDateValueState}
                      onChange={(e) => setToDateValueState(e.target.value)}
                      className="h-8 w-36 text-xs pr-8"
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 absolute right-0.5 top-0.5 text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-xs border-collapse min-w-[60rem]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-accent text-foreground">
                        <th colSpan={inputHeaders.length} className="p-2 border text-center">Input</th>
                        <th colSpan={outputHeaders.length} className="p-2 border text-center">Output</th>
                      </tr>
                      <tr className="bg-accent text-foreground">
                        {inputHeaders.map(header => (
                          <th
                            key={header}
                            className="p-1.5 border text-xs text-center whitespace-nowrap sticky top-8 z-10 bg-accent"
                          >
                            {header.split(" ")[0]}<br />{header.split(" ")[1] || ""}
                          </th>
                        ))}
                        {outputHeaders.map(header => (
                          <th
                            key={header}
                            className="p-1.5 border text-xs text-center whitespace-nowrap sticky top-8 z-10 bg-accent"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-card">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rowNum, index) => (
                        <TableRow 
                          key={`data-row-${rowNum}`}
                          className={`${index % 2 === 0 ? 'bg-muted/30' : ''} hover:bg-muted/50`}
                        >
                          {inputHeaders.map(header => (
                            <TableCell key={`input-data-${header}-${rowNum}`} className="p-1.5 border text-center text-xs h-8">-</TableCell>
                          ))}
                          {outputHeaders.map(header => (
                            <TableCell key={`output-data-${header}-${rowNum}`} className="p-1.5 border text-center h-8">-</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-2 border-t text-xs space-y-1">
                  <div className="flex justify-between"><span>Total Intake Measured:</span><span> ml</span></div>
                  <div className="flex justify-between"><span>Total Output Measured:</span><span> ml</span></div>
                  <div className="flex justify-between"><span>Total Balanced Measured:</span><span> ml</span></div>
                  <div className="text-primary text-center mt-1">M-Morning(08:00-13:59) E-Evening(14:00-19:59) N-Night(20:00-07:59)</div>
                </div>
                <div className="flex items-center justify-center space-x-2 p-2 border-t">
                  <Button
                    size="sm"
                    className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground h-8"
                    onClick={() => setCurrentView('addIntake')}
                  >
                    Add Intake
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground h-8"
                    onClick={() => setCurrentView('addOutput')}
                  >
                    Add Output
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground h-8"
                    onClick={() => setCurrentView('updateIntake')}
                  >
                    Update Intake
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground h-8"
                    onClick={() => setCurrentView('updateOutput')}
                  >
                    Update Output
                  </Button>
                </div>
              </>
            )}
          </>
        ) : currentView === 'addIntake' ? (
          <IntakeOutputForm title="Add Intake" isIntake={true} isUpdate={false} />
        ) : currentView === 'addOutput' ? (
          <IntakeOutputForm title="Add Output" isIntake={false} isUpdate={false} />
        ) : currentView === 'updateIntake' ? (
          <IntakeOutputList title="Intake List" isIntake={true} />
        ) : currentView === 'updateOutput' ? (
          <IntakeOutputList title="Output List" isIntake={false} />
        ) : null}
      </div>
      <div className="w-1/2 flex flex-col border rounded-md bg-card shadow">
        <div className="flex items-center p-2 border-b bg-card text-foreground rounded-t-md">
          <h2 className="text-base">Intake/Output Graph</h2>
        </div>
        <div className="flex-1 p-2">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center text-destructive">
              <p>Error loading chart data</p>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 7 }} 
                  label={{ value: "Time", position: 'insideBottom', offset: -5, fontSize: 7 }} 
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  label={{ value: "Amount (ml)", angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, dy: 0, dx: -5 }}
                />
                <Tooltip 
                  contentStyle={{ fontSize: 10, padding: '5px 10px' }} 
                  formatter={(value, name) => [`${value} ml`, name === 'series1' ? 'Intake' : 'Output']}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  wrapperStyle={{ fontSize: "10px" }} 
                  formatter={(value) => value === 'series1' ? 'Intake' : 'Output'}
                />
                <Line 
                  type="monotone" 
                  dataKey="series1" 
                  name="Intake" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2} 
                  dot={{ r: 3 }} 
                  activeDot={{ r: 5 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="series2" 
                  name="Output" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2} 
                  dot={{ r: 3 }} 
                  activeDot={{ r: 5 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p>No data available for the chart</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntakeOutputView; 