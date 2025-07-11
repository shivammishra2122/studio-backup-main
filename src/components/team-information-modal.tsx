'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Team = {
  id: string;
  name: string;
};

type TeamMember = {
  id: string;
  name: string;
  role: string;
};

type Patient = {
  id: string;
  name: string;
  mrn: string;
};

type TeamInformationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TeamInformationModal({ open, onOpenChange }: TeamInformationModalProps) {
  const [includePersonalLists, setIncludePersonalLists] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  
  // Mock data
  const userTeams: Team[] = [
    { id: '1', name: 'SAN CTVS' },
    { id: '2', name: 'SAN COMMON TEAM' },
  ];

  const availableTeams: Team[] = [
    { id: '3', name: 'SAN CARDIOLOGY' },
    { id: '4', name: 'SAN NEURO' },
    { id: '5', name: 'SAN ORTHO' },
  ];

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: '1', name: 'Dr. John Smith', role: 'Cardiologist' },
    { id: '2', name: 'Dr. Sarah Johnson', role: 'Surgeon' },
    { id: '3', name: 'Dr. Michael Brown', role: 'Nurse Practitioner' },
  ]);

  const [patients, setPatients] = useState<Patient[]>([]);

  const handleSubscribe = () => {
    if (!selectedTeam) return;
    // In a real app, you would handle the subscription logic here
    console.log(`Subscribed to team: ${selectedTeam}`);
  };

  const handleUnsubscribe = (teamId: string) => {
    // In a real app, you would handle the unsubscription logic here
    console.log(`Unsubscribed from team: ${teamId}`);
  };

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeam(teamId);
    // In a real app, you would fetch team members and patients for the selected team
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-blue-700">Team Information</DialogTitle>
          <p className="text-sm text-muted-foreground">
            View team information by selecting teams. You can subscribe or remove yourself from teams.
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="include-personal-lists" 
              checked={includePersonalLists}
              onCheckedChange={(checked) => setIncludePersonalLists(!!checked)}
            />
            <Label htmlFor="include-personal-lists">Include Personal Lists</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>You are on these teams:</Label>
                <div className="border rounded-md mt-1 h-32 overflow-y-auto p-2">
                  {userTeams.length > 0 ? (
                    <ul className="space-y-2">
                      {userTeams.map((team) => (
                        <li key={team.id} className="flex justify-between items-center p-2 hover:bg-accent rounded">
                          <span>{team.name}</span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUnsubscribe(team.id)}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      You are not currently a member of any teams.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label>Subscribe to a team:</Label>
                <div className="flex space-x-2 mt-1">
                  <Select value={selectedTeam} onValueChange={handleTeamSelect}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="SELECT" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleSubscribe}
                    disabled={!selectedTeam}
                  >
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Patient on selected team:</Label>
                <div className="border rounded-md mt-1 h-32 overflow-y-auto p-2">
                  {patients.length > 0 ? (
                    <ul className="space-y-1">
                      {patients.map((patient) => (
                        <li key={patient.id} className="p-1 hover:bg-accent rounded">
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-sm text-muted-foreground">MRN: {patient.mrn}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No patients found for the selected team.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label>Team Members:</Label>
                <div className="border rounded-md mt-1 h-32 overflow-y-auto p-2">
                  {teamMembers.length > 0 ? (
                    <ul className="space-y-1">
                      {teamMembers.map((member) => (
                        <li key={member.id} className="p-1 hover:bg-accent rounded">
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground">{member.role}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No team members found.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button 
            variant="outline" 
            className="bg-orange-500 text-white hover:bg-orange-600 hover:text-white"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
