"use client";

import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';

export interface ClinicalNote {
  id: string;
  patientId: string;
  patientName: string;
  notesTitle: string;
  dateOfEntry: string;
  status: "COMPLETED" | "UNSIGNED" | "DRAFT" | "PENDING";
  author: string;
  location: string;
  department: string;
  visitType: string;
  cosigner?: string;
  content?: string;
}

interface ClinicalNotesSplitViewProps {
  notes: ClinicalNote[];
  onBack: () => void;
  onNoteSelect: (note: ClinicalNote) => void;
  selectedNote: ClinicalNote | null;
}

const ClinicalNotesSplitView: React.FC<ClinicalNotesSplitViewProps> = ({
  notes,
  onBack,
  onNoteSelect,
  selectedNote,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-4 border-b">
        <button
          onClick={onBack}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to List
        </button>
        <h2 className="text-lg font-semibold">Clinical Notes</h2>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Notes List */}
        <div className="w-1/3 border-r overflow-y-auto">
          <div className="divide-y">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedNote?.id === note.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                }`}
                onClick={() => onNoteSelect(note)}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{note.notesTitle}</h3>
                  <span className="text-xs text-gray-500">{note.dateOfEntry}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {note.author} • {note.department}
                </p>
                <span
                  className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${
                    note.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800'
                      : note.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {note.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Note Details */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedNote ? (
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedNote.notesTitle}</h2>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                    <span>{selectedNote.author}</span>
                    <span>•</span>
                    <span>{selectedNote.department}</span>
                    <span>•</span>
                    <span>{selectedNote.visitType}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {selectedNote.dateOfEntry}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <div className="prose max-w-none">
                  <p>
                    {selectedNote.content || 
                     `This is a detailed view of the ${selectedNote.notesTitle}. ` +
                     'The full content of the note would be displayed here.'}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">Location</p>
                      <p className="text-gray-600">{selectedNote.location}</p>
                    </div>
                    {selectedNote.patientName && (
                      <div>
                        <p className="font-medium text-gray-900">Patient</p>
                        <p className="text-gray-600">
                          {selectedNote.patientName}
                          {selectedNote.patientId && ` (${selectedNote.patientId})`}
                        </p>
                      </div>
                    )}
                    {selectedNote.cosigner && (
                      <div>
                        <p className="font-medium text-gray-900">Cosigner</p>
                        <p className="text-gray-600">{selectedNote.cosigner}</p>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">Status</p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedNote.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : selectedNote.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {selectedNote.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <FileText className="h-12 w-12 text-gray-300 mb-4" />
              <p>Select a note to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicalNotesSplitView;
