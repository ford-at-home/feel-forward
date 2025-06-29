/**
 * Session Control Bar Component
 * Compact session controls for the main application interface
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  Save, 
  Settings, 
  Circle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { SessionManager } from './SessionManager';
import { useToast } from '@/hooks/use-toast';

interface SessionBarProps {
  sessionData: any;
  sessionList: any[];
  hasUnsavedChanges: boolean;
  isAutoSaveEnabled: boolean;
  onCreateNew: (topic?: string) => void;
  onLoadSession: (sessionId: string) => void;
  onSaveSession: () => void;
  onExportSession: (format: 'json' | 'markdown') => string | null;
  onImportSession: (jsonData: string) => boolean;
  onDeleteSession: (sessionId: string) => void;
  onToggleAutoSave: () => void;
}

export const SessionBar: React.FC<SessionBarProps> = (props) => {
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const { toast } = useToast();

  const handleQuickSave = () => {
    props.onSaveSession();
    toast({
      title: "Session Saved",
      description: "Your progress has been saved",
      duration: 2000
    });
  };

  const getStatusIcon = () => {
    if (!props.sessionData) {
      return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
    
    if (props.hasUnsavedChanges) {
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    }
    
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!props.sessionData) {
      return "No Session";
    }
    
    if (props.hasUnsavedChanges) {
      return "Unsaved Changes";
    }
    
    return "Saved";
  };

  return (
    <div className="flex items-center justify-between p-3 bg-background border-b">
      <div className="flex items-center gap-3">
        {/* Session Status */}
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
        
        {/* Auto-save Indicator */}
        {props.sessionData && (
          <Badge 
            variant={props.isAutoSaveEnabled ? "default" : "secondary"}
            className="text-xs"
          >
            Auto-save {props.isAutoSaveEnabled ? "On" : "Off"}
          </Badge>
        )}
        
        {/* Session Info */}
        {props.sessionData && (
          <div className="hidden sm:block text-sm text-muted-foreground">
            {props.sessionData.topic || "Untitled Session"} • 
            Step {props.sessionData.currentPhase + 2} of 5
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Quick Save */}
        {props.sessionData && props.hasUnsavedChanges && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleQuickSave}
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        )}
        
        {/* Session Manager */}
        <Dialog open={isManagerOpen} onOpenChange={setIsManagerOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Settings className="w-4 h-4 mr-1" />
              Sessions
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <SessionManager {...props} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};