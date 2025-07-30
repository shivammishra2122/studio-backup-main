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
import { RefreshCw, Edit3, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

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

  const inputHeaders = ["IV\nFLUID", "BLOOD\nPRODUCT", "PO\n", "TUBE\nFEEDING", "INFUSION\n", "OTHER\n"];
  const outputHeaders = ["URINE\n", "N/G\n", "EMESIS\n", "DRAINAGE\n", "FAECES\n"];

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

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Update date change handlers
  const handleFromDateChange = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      setFromDateValueState(formattedDate);
      setFromDate(date);
      // Trigger data reload when date changes
      loadData();
    }
  };

  const handleToDateChange = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      setToDateValueState(formattedDate);
      setToDate(date);
      // Trigger data reload when date changes
      loadData();
    }
  };

  const groupRecordsByTimePeriod = () => {
    const timePeriods = [
      { name: 'Morning', code: 'M', startHour: 8, endHour: 13 },
      { name: 'Evening', code: 'E', startHour: 14, endHour: 19 },
      { name: 'Night', code: 'N', startHour: 20, endHour: 7 }
    ];

    const recordTypes = ['INTAKE', 'OUTPUT'];
    
    return recordTypes.flatMap(recordType => 
      timePeriods.map(period => {
        const periodRecords = intakeOutputData?.records?.filter(record => {
          if (!record.timestamp || record.type !== recordType) return false;
          const recordHour = new Date(record.timestamp).getHours();
          
          if (period.code === 'N') {
            return recordHour >= period.startHour || recordHour <= period.endHour;
          } else {
            return recordHour >= period.startHour && recordHour <= period.endHour;
          }
        }) || [];

        return {
          type: recordType,
          period: period.name,
          code: period.code,
          records: periodRecords,
          total: periodRecords.reduce((sum, r) => sum + (r.amount || 0), 0)
        };
      })
    );
  };

  const timePeriodData = groupRecordsByTimePeriod();

  return (
    <div className="flex-1 w-full flex justify-between gap-4 overflow-auto">
      {/* Table Section - 100% width */}
      <div className="w-full flex flex-col border rounded-md bg-card shadow overflow-hidden">
        <div className="flex items-center justify-between p-2 border-b bg-card text-foreground rounded-t-md">
          <h2 className="text-base">Patient Intake/Output Summary</h2>
          <div className="flex items-center space-x-1">
            <Button 
              variant={useUpdateData ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setUseUpdateData(!useUpdateData)}
            >
              {useUpdateData ? 'View Data' : 'Update Data'}
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
          </div>
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="from-date" className="text-xs text-muted-foreground whitespace-nowrap">
                  From Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[200px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={handleFromDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="to-date" className="text-xs text-muted-foreground whitespace-nowrap">
                  To Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[200px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={handleToDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto space-y-4">
            {/* INTAKE Table */}
            <div className="border rounded-md overflow-hidden">
              <div className="bg-accent/50 p-2 text-center font-medium">INTAKE</div>
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="p-1.5 border text-xs text-center sticky left-0 z-20 bg-accent">Time</th>
                    {inputHeaders.map(header => (
                      <th
                        key={`intake-${header}`}
                        className="p-1.5 border text-xs text-center whitespace-nowrap sticky top-0 z-10 bg-accent"
                      >
                        {header.split("\n")[0]}<br />{header.split("\n")[1] || ""}
                      </th>
                    ))}
                    <th className="p-1.5 border text-xs text-center whitespace-nowrap sticky top-0 z-10 bg-accent">
                      TOTAL
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card">
                  {timePeriodData
                    .filter(item => item.type === 'INTAKE')
                    .map((item, index) => (
                      <tr key={`intake-${item.code}`} className={index % 2 === 0 ? 'bg-muted/10' : ''}>
                        <td className="p-1.5 border text-center text-xs font-medium sticky left-0 bg-card">
                          {item.period} ({item.code})
                        </td>
                        {inputHeaders.map(header => {
                          const category = header.split('\n')[0];
                          const record = item.records.find(r => r.category === category);
                          return (
                            <td key={`intake-${item.code}-${category}`} className="p-1.5 border text-center text-xs">
                              {record?.amount || '0'}
                            </td>
                          );
                        })}
                        <td className="p-1.5 border text-center text-xs font-medium">
                          {item.total || '0'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* OUTPUT Table */}
            <div className="border rounded-md overflow-hidden">
              <div className="bg-accent/50 p-2 text-center font-medium">OUTPUT</div>
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="p-1.5 border text-xs text-center sticky left-0 z-20 bg-accent">Time</th>
                    {outputHeaders.map(header => (
                      <th
                        key={`output-${header}`}
                        className="p-1.5 border text-xs text-center whitespace-nowrap sticky top-0 z-10 bg-accent"
                      >
                        {header.split("\n")[0]}<br />{header.split("\n")[1] || ""}
                      </th>
                    ))}
                    <th className="p-1.5 border text-xs text-center whitespace-nowrap sticky top-0 z-10 bg-accent">
                      TOTAL
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card">
                  {timePeriodData
                    .filter(item => item.type === 'OUTPUT')
                    .map((item, index) => (
                      <tr key={`output-${item.code}`} className={index % 2 === 0 ? 'bg-muted/10' : ''}>
                        <td className="p-1.5 border text-center text-xs font-medium sticky left-0 bg-card">
                          {item.period} ({item.code})
                        </td>
                        {outputHeaders.map(header => {
                          const category = header.split('\n')[0];
                          const record = item.records.find(r => r.category === category);
                          return (
                            <td key={`output-${item.code}-${category}`} className="p-1.5 border text-center text-xs">
                              {record?.amount || '0'}
                            </td>
                          );
                        })}
                        <td className="p-1.5 border text-center text-xs font-medium">
                          {item.total || '0'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntakeOutputView; 