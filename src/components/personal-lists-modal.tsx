'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Plus, Save, Trash2 } from 'lucide-react';

type Patient = {
  id: string;
  name: string;
  // Add other patient fields as needed
};

type PersonalList = {
  id: string;
  name: string;
  patients: Patient[];
};

type PersonalListsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function PersonalListsModal({ isOpen, onClose }: PersonalListsModalProps) {
  const [selectedCriteria, setSelectedCriteria] = useState('Patient');
  const [searchText, setSearchText] = useState('');
  const [lists, setLists] = useState<PersonalList[]>([
    { id: '1', name: 'TEST PAT PER LIST', patients: [] },
  ]);
  const [activeList, setActiveList] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');

  // Mock data for demonstration
  const mockPatients: Patient[] = [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
    // Add more mock patients as needed
  ];

  const handleAddToList = (patient: Patient) => {
    if (!activeList) return;
    
    setLists(lists.map(list => {
      if (list.id === activeList) {
        // Check if patient already exists in the list
        if (!list.patients.some(p => p.id === patient.id)) {
          return { ...list, patients: [...list.patients, patient] };
        }
      }
      return list;
    }));
  };

  const handleRemoveFromList = (patientId: string) => {
    if (!activeList) return;
    
    setLists(lists.map(list => {
      if (list.id === activeList) {
        return { ...list, patients: list.patients.filter(p => p.id !== patientId) };
      }
      return list;
    }));
  };

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    
    const newList: PersonalList = {
      id: Date.now().toString(),
      name: newListName.trim(),
      patients: [],
    };
    
    setLists([...lists, newList]);
    setActiveList(newList.id);
    setNewListName('');
  };

  const handleDeleteList = (listId: string) => {
    const newLists = lists.filter(list => list.id !== listId);
    setLists(newLists);
    if (activeList === listId) {
      setActiveList(newLists[0]?.id || null);
    }
  };

  const currentList = lists.find(list => list.id === activeList);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Personal Lists</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Left Panel - Patient Selection */}
          <div className="w-1/2 border rounded-md p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Select value={selectedCriteria} onValueChange={setSelectedCriteria}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select criteria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Patient">Patient</SelectItem>
                  <SelectItem value="Provider">Provider</SelectItem>
                  <SelectItem value="Ward">Ward</SelectItem>
                  <SelectItem value="Specialty">Specialty</SelectItem>
                  <SelectItem value="Clinic">Clinic</SelectItem>
                  <SelectItem value="List">List</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={`Search ${selectedCriteria}...`}
                  className="pl-8"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              
              <Button variant="outline" size="sm" className="ml-2">
                <Search className="h-4 w-4 mr-1" /> Search
              </Button>
            </div>
            
            {/* Patient List */}
            <div className="flex-1 overflow-y-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Patient Name</th>
                    <th className="p-2 text-left">MRN</th>
                    <th className="p-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPatients.map((patient) => (
                    <tr key={patient.id} className="border-t hover:bg-gray-50">
                      <td className="p-2">{patient.name}</td>
                      <td className="p-2">{patient.id}</td>
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => handleAddToList(patient)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Right Panel - Personal Lists */}
          <div className="w-1/2 border rounded-md p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Personal Lists</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="New list name"
                  className="w-48"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                />
                <Button size="sm" onClick={handleCreateList}>
                  <Plus className="h-4 w-4 mr-1" /> New List
                </Button>
              </div>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              {/* List of Personal Lists */}
              <div className="w-1/3 border-r overflow-y-auto">
                {lists.map((list) => (
                  <div
                    key={list.id}
                    className={`p-2 cursor-pointer hover:bg-gray-100 ${
                      activeList === list.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                    }`}
                    onClick={() => setActiveList(list.id)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="truncate">{list.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteList(list.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Patients in Selected List */}
              <div className="flex-1 overflow-y-auto pl-4">
                {currentList ? (
                  <>
                    <h4 className="font-medium mb-2">{currentList.name}</h4>
                    {currentList.patients.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No patients in this list</p>
                    ) : (
                      <div className="space-y-2">
                        {currentList.patients.map((patient) => (
                          <div
                            key={patient.id}
                            className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                          >
                            <span>{patient.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleRemoveFromList(patient.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">Select a list or create a new one</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <div className="space-x-2">
              <Button variant="outline">
                <Save className="h-4 w-4 mr-1" /> Save Changes
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
