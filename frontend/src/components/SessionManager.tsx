/**
 * Session Management UI Component
 * Provides interface for save/load/export/import session operations
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  FolderOpen, 
  Download, 
  Upload, 
  Trash2, 
  Clock, 
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { SessionSummary } from '@/lib/session';

interface SessionManagerProps {
  sessionData: any;
  sessionList: SessionSummary[];
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

export const SessionManager: React.FC<SessionManagerProps> = ({
  sessionData,
  sessionList,
  hasUnsavedChanges,
  isAutoSaveEnabled,
  onCreateNew,
  onLoadSession,
  onSaveSession,
  onExportSession,
  onImportSession,
  onDeleteSession,
  onToggleAutoSave
}) => {
  const [newSessionTopic, setNewSessionTopic] = useState('');
  const [importData, setImportData] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown'>('json');
  const [exportedData, setExportedData] = useState('');
  
  const { toast } = useToast();

  const handleCreateNew = () => {
    onCreateNew(newSessionTopic || undefined);
    setNewSessionTopic('');
    toast({
      title: "New Session Created",
      description: "A new session has been started"
    });
  };

  const handleLoadSession = (sessionId: string) => {
    onLoadSession(sessionId);
    toast({
      title: "Session Loaded",
      description: "Your previous session has been restored"
    });
  };

  const handleSaveSession = () => {
    onSaveSession();
    toast({
      title: "Session Saved",
      description: "Your progress has been saved"
    });
  };

  const handleExport = () => {
    const exported = onExportSession(exportFormat);
    if (exported) {
      setExportedData(exported);
      
      // Create downloadable file
      const blob = new Blob([exported], { 
        type: exportFormat === 'json' ? 'application/json' : 'text/markdown' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feel-forward-session-${sessionData?.sessionId || 'export'}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Session Exported",
        description: `Session exported as ${exportFormat.toUpperCase()}`
      });
    } else {
      toast({
        title: "Export Failed",
        description: "Could not export session data",
        variant: "destructive"
      });
    }
  };

  const handleImport = () => {
    try {
      const success = onImportSession(importData);
      if (success) {
        setImportData('');
        setIsImportDialogOpen(false);
        toast({
          title: "Session Imported",
          description: "Session has been imported successfully"
        });
      } else {
        toast({
          title: "Import Failed",
          description: "Invalid session data format",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Import Error",
        description: "Failed to import session data",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    onDeleteSession(sessionId);
    toast({
      title: "Session Deleted",
      description: "Session has been removed"
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPhaseDescription = (phase: number) => {
    const phases = [
      "Topic Selection",
      "Factor Discovery", 
      "Preference Setting",
      "Scenario Exploration",
      "Reaction Analysis",
      "Insights Complete"
    ];
    return phases[phase + 1] || "Not Started";
  };

  return (
    <div className="space-y-6">
      {/* Current Session Status */}
      {sessionData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                Current Session
                {hasUnsavedChanges ? (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Unsaved
                  </Badge>
                ) : (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Saved
                  </Badge>
                )}
              </span>
              <Button
                size="sm"
                variant={isAutoSaveEnabled ? "default" : "outline"}
                onClick={onToggleAutoSave}
              >
                Auto-save {isAutoSaveEnabled ? "On" : "Off"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">{sessionData.topic || "Untitled Session"}</p>
                <p className="text-sm text-muted-foreground">
                  {getPhaseDescription(sessionData.currentPhase)}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm">Progress:</span>
                <div className="flex-1">
                  <Progress value={sessionData.summary?.completion_percentage || 0} />
                </div>
                <span className="text-sm text-muted-foreground">
                  {sessionData.summary?.completion_percentage || 0}%
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {sessionData.summary?.time_spent_minutes || 0} min
                </span>
                <span>
                  Last saved: {formatDate(sessionData.metadata?.last_updated)}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSaveSession} disabled={!hasUnsavedChanges}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Now
                </Button>
                
                <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Export Session</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Export Format</Label>
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant={exportFormat === 'json' ? 'default' : 'outline'}
                            onClick={() => setExportFormat('json')}
                          >
                            JSON Data
                          </Button>
                          <Button
                            variant={exportFormat === 'markdown' ? 'default' : 'outline'}
                            onClick={() => setExportFormat('markdown')}
                          >
                            Markdown Report
                          </Button>
                        </div>
                      </div>
                      
                      {exportedData && (
                        <div>
                          <Label>Exported Data</Label>
                          <Textarea
                            value={exportedData}
                            readOnly
                            className="mt-2 h-32 font-mono text-xs"
                          />
                        </div>
                      )}
                      
                      <Button onClick={handleExport} className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Download {exportFormat.toUpperCase()}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Session Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create New Session */}
            <div className="space-y-2">
              <Label htmlFor="new-topic">Start New Session</Label>
              <div className="flex gap-2">
                <Input
                  id="new-topic"
                  placeholder="Session topic (optional)"
                  value={newSessionTopic}
                  onChange={(e) => setNewSessionTopic(e.target.value)}
                />
                <Button onClick={handleCreateNew}>
                  <FileText className="w-4 h-4 mr-2" />
                  New
                </Button>
              </div>
            </div>

            {/* Import Session */}
            <div className="space-y-2">
              <Label>Import Session</Label>
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Import from JSON
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Session</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="import-data">Paste Session JSON</Label>
                      <Textarea
                        id="import-data"
                        placeholder="Paste your exported session JSON here..."
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                        className="mt-2 h-32 font-mono text-xs"
                      />
                    </div>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Only import session data from trusted sources. This will create a new session.
                      </AlertDescription>
                    </Alert>
                    <Button 
                      onClick={handleImport} 
                      disabled={!importData.trim()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import Session
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saved Sessions */}
      {sessionList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Sessions ({sessionList.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessionList.map((session) => (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">
                        {session.topic || "Untitled Session"}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {getPhaseDescription(session.currentPhase)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{session.completion_percentage}% complete</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {session.time_spent_minutes} min
                      </span>
                      <span>{formatDate(session.last_updated)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLoadSession(session.sessionId)}
                    >
                      <FolderOpen className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSession(session.sessionId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};