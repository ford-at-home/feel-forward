/**
 * React hook for session management
 * Provides session state management, auto-save, and persistence
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { sessionManager, SessionData, SessionSummary } from '@/lib/session';

interface UseSessionReturn {
  // Session state
  sessionData: SessionData | null;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  
  // Session operations
  createNewSession: (topic?: string) => void;
  loadSession: (sessionId: string) => void;
  saveCurrentSession: () => void;
  updateSessionData: (updates: Partial<SessionData>) => void;
  
  // Session management
  exportCurrentSession: (format?: 'json' | 'markdown') => string | null;
  importSession: (jsonData: string) => boolean;
  deleteCurrentSession: () => void;
  
  // Session list
  sessionList: SessionSummary[];
  refreshSessionList: () => void;
  
  // Auto-save control
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  isAutoSaveEnabled: boolean;
}

export const useSession = (): UseSessionReturn => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [sessionList, setSessionList] = useState<SessionSummary[]>([]);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);
  
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Try to resume existing session
        const existingSession = sessionManager.resumeCurrentSession();
        if (existingSession) {
          setSessionData(existingSession);
          console.log('Resumed existing session:', existingSession.sessionId);
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
    refreshSessionList();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (isAutoSaveEnabled && sessionData && hasUnsavedChanges) {
      startAutoSave();
    } else {
      stopAutoSave();
    }

    return () => stopAutoSave();
  }, [isAutoSaveEnabled, sessionData, hasUnsavedChanges]);

  const startAutoSave = () => {
    stopAutoSave();
    autoSaveTimerRef.current = setInterval(() => {
      if (sessionData && hasUnsavedChanges) {
        saveCurrentSession();
        console.log('Auto-saved session');
      }
    }, AUTO_SAVE_INTERVAL);
  };

  const stopAutoSave = () => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  };

  const createNewSession = useCallback((topic: string = '') => {
    try {
      const sessionId = sessionManager.createNewSession(topic);
      const newSession = sessionManager.loadSession(sessionId);
      
      if (newSession) {
        setSessionData(newSession);
        setHasUnsavedChanges(false);
        refreshSessionList();
        console.log('Created new session:', sessionId);
      }
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  }, []);

  const loadSession = useCallback((sessionId: string) => {
    try {
      setIsLoading(true);
      const session = sessionManager.loadSession(sessionId);
      
      if (session) {
        setSessionData(session);
        setHasUnsavedChanges(false);
        console.log('Loaded session:', sessionId);
      } else {
        console.error('Session not found:', sessionId);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveCurrentSession = useCallback(() => {
    if (!sessionData) {
      console.warn('No session data to save');
      return;
    }

    try {
      sessionManager.saveSession(sessionData);
      setHasUnsavedChanges(false);
      refreshSessionList();
      console.log('Session saved successfully');
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }, [sessionData]);

  const updateSessionData = useCallback((updates: Partial<SessionData>) => {
    setSessionData(prev => {
      if (!prev) return null;
      
      const updated = { ...prev, ...updates };
      setHasUnsavedChanges(true);
      return updated;
    });
  }, []);

  const exportCurrentSession = useCallback((format: 'json' | 'markdown' = 'json') => {
    if (!sessionData) {
      console.warn('No session to export');
      return null;
    }

    try {
      const exported = sessionManager.exportSession(sessionData.sessionId, {
        format,
        includeMetadata: true,
        prettifyJson: true
      });
      
      if (exported) {
        console.log('Session exported successfully');
      }
      
      return exported;
    } catch (error) {
      console.error('Error exporting session:', error);
      return null;
    }
  }, [sessionData]);

  const importSession = useCallback((jsonData: string): boolean => {
    try {
      const newSessionId = sessionManager.importSession(jsonData);
      
      if (newSessionId) {
        loadSession(newSessionId);
        refreshSessionList();
        console.log('Session imported successfully:', newSessionId);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error importing session:', error);
      return false;
    }
  }, [loadSession]);

  const deleteCurrentSession = useCallback(() => {
    if (!sessionData) {
      console.warn('No session to delete');
      return;
    }

    try {
      sessionManager.deleteSession(sessionData.sessionId);
      setSessionData(null);
      setHasUnsavedChanges(false);
      refreshSessionList();
      console.log('Session deleted successfully');
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }, [sessionData]);

  const refreshSessionList = useCallback(() => {
    try {
      const sessions = sessionManager.getSessionList();
      setSessionList(sessions);
    } catch (error) {
      console.error('Error refreshing session list:', error);
    }
  }, []);

  const enableAutoSave = useCallback(() => {
    setIsAutoSaveEnabled(true);
  }, []);

  const disableAutoSave = useCallback(() => {
    setIsAutoSaveEnabled(false);
  }, []);

  return {
    // Session state
    sessionData,
    isLoading,
    hasUnsavedChanges,
    
    // Session operations
    createNewSession,
    loadSession,
    saveCurrentSession,
    updateSessionData,
    
    // Session management
    exportCurrentSession,
    importSession,
    deleteCurrentSession,
    
    // Session list
    sessionList,
    refreshSessionList,
    
    // Auto-save control
    enableAutoSave,
    disableAutoSave,
    isAutoSaveEnabled
  };
};