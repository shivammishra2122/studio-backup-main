"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { cn } from "@/lib/utils";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Section({ title, children, defaultOpen = true, className }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className={cn("border rounded-lg overflow-hidden bg-white shadow-sm", className)}>
      <button
        className="w-full flex items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 
          className="flex-1 text-sm font-medium text-gray-900 text-left truncate pr-3"
          title={title}
        >
          {title}
        </h3>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value?: string | number | null;
  copyable?: boolean;
  fieldName?: string;
  className?: string;
}

export function DetailRow({ 
  label, 
  value, 
  copyable = false, 
  fieldName = '', 
  className = '' 
}: DetailRowProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayValue = value || 'N/A';
  
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-2", className)}>
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className="md:col-span-3 flex items-center">
        <span className="text-sm text-gray-900 break-words">{displayValue}</span>
        {copyable && value && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-2 text-gray-400 hover:text-gray-900"
                  onClick={() => handleCopy(String(value))}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy to clipboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
