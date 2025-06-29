/**
 * Session Management System
 * Implements session persistence, auto-save, resume, and export functionality
 * Based on demo patterns from FRONTEND.md
 */

// Session data structure based on demo format
export interface SessionData {
  version: string;
  timestamp: string;
  sessionId: string;
  topic: string;
  currentPhase: number;
  factors: Array<{
    category: string;
    items: string[];
  }>;
  preferences: Array<{
    factor: string;
    importance: number;
    hasLimit: boolean;
    limit: string;
    tradeoff: string;
  }>;
  scenarios: Array<{
    id: string;
    title: string;
    text: string;
  }>;
  reactions: Array<{
    scenario_id: string;
    excitement: number;
    anxiety: number;
    body: string;
    freeform: string;
  }>;
  insights: string;
  summary: {
    total_factors: number;
    preferences_count: number;
    scenarios_count: number;
    reactions_count: number;
    completion_percentage: number;
    time_spent_minutes: number;
  };
  metadata: {
    created_at: string;
    last_updated: string;
    user_agent: string;
    app_version: string;
  };
}

export interface SessionSummary {
  sessionId: string;
  topic: string;
  currentPhase: number;
  completion_percentage: number;
  last_updated: string;
  time_spent_minutes: number;
}

export interface ExportOptions {
  format: 'json' | 'markdown';
  includeMetadata: boolean;
  prettifyJson: boolean;
}

class SessionManager {
  private readonly STORAGE_KEY_PREFIX = 'feel_forward_session_';
  private readonly CURRENT_SESSION_KEY = 'feel_forward_current_session';
  private readonly SESSION_LIST_KEY = 'feel_forward_session_list';
  private readonly AUTO_SAVE_INTERVAL = 30000; // 30 seconds
  private readonly MAX_SESSIONS = 10; // Maximum stored sessions
  private readonly SESSION_VERSION = '1.0';
  
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private currentSessionId: string | null = null;
  private startTime: Date | null = null;

  /**
   * Initialize a new session
   */
  createNewSession(topic: string = ''): string {
    const sessionId = this.generateSessionId();
    const now = new Date().toISOString();
    
    const sessionData: SessionData = {
      version: this.SESSION_VERSION,
      timestamp: now,
      sessionId,
      topic,
      currentPhase: -1,
      factors: [],
      preferences: [],
      scenarios: [],
      reactions: [],
      insights: '',
      summary: {
        total_factors: 0,
        preferences_count: 0,
        scenarios_count: 0,
        reactions_count: 0,
        completion_percentage: 0,
        time_spent_minutes: 0
      },
      metadata: {
        created_at: now,
        last_updated: now,
        user_agent: navigator.userAgent,
        app_version: '1.0.0' // TODO: Get from config
      }
    };

    this.saveSession(sessionData);
    this.setCurrentSession(sessionId);
    this.startAutoSave();
    this.startTime = new Date();
    
    return sessionId;
  }

  /**
   * Load an existing session
   */
  loadSession(sessionId: string): SessionData | null {
    try {
      const data = localStorage.getItem(this.getSessionKey(sessionId));
      if (!data) {
        return null;
      }
      
      const sessionData: SessionData = JSON.parse(data);
      this.setCurrentSession(sessionId);
      this.startAutoSave();
      this.startTime = new Date(sessionData.metadata.created_at);
      
      return sessionData;
    } catch (error) {
      console.error('Error loading session:', error);
      return null;
    }
  }

  /**
   * Resume the current session if it exists
   */
  resumeCurrentSession(): SessionData | null {
    const currentSessionId = this.getCurrentSessionId();
    if (!currentSessionId) {
      return null;
    }
    
    return this.loadSession(currentSessionId);
  }

  /**
   * Save session data
   */
  saveSession(sessionData: SessionData): void {
    try {
      // Update metadata
      sessionData.metadata.last_updated = new Date().toISOString();
      sessionData.summary.time_spent_minutes = this.calculateTimeSpent();
      sessionData.summary.completion_percentage = this.calculateCompletionPercentage(sessionData);
      
      // Save to localStorage
      localStorage.setItem(
        this.getSessionKey(sessionData.sessionId),
        JSON.stringify(sessionData)
      );
      
      // Update session list
      this.updateSessionList(sessionData);
      
      console.log('Session saved:', sessionData.sessionId);
    } catch (error) {
      console.error('Error saving session:', error);
      // Handle storage quota exceeded
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.cleanupOldSessions();
        // Try saving again
        try {
          localStorage.setItem(
            this.getSessionKey(sessionData.sessionId),
            JSON.stringify(sessionData)
          );
        } catch (retryError) {
          console.error('Failed to save session even after cleanup:', retryError);
        }
      }
    }
  }

  /**
   * Auto-save current session
   */
  private autoSave = (): void => {
    const currentSessionId = this.getCurrentSessionId();
    if (!currentSessionId) {
      return;
    }
    
    // Get current session data from the application state
    // This would need to be connected to the actual app state
    console.log('Auto-save triggered for session:', currentSessionId);
  };

  /**
   * Start auto-save functionality
   */
  startAutoSave(): void {
    this.stopAutoSave(); // Clear any existing timer
    this.autoSaveTimer = setInterval(this.autoSave, this.AUTO_SAVE_INTERVAL);
  }

  /**
   * Stop auto-save functionality
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Get list of all saved sessions
   */
  getSessionList(): SessionSummary[] {
    try {
      const data = localStorage.getItem(this.SESSION_LIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading session list:', error);
      return [];
    }
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): void {
    try {
      // Remove from localStorage
      localStorage.removeItem(this.getSessionKey(sessionId));
      
      // Remove from session list
      const sessionList = this.getSessionList();
      const updatedList = sessionList.filter(s => s.sessionId !== sessionId);
      localStorage.setItem(this.SESSION_LIST_KEY, JSON.stringify(updatedList));
      
      // If this was the current session, clear it
      if (this.getCurrentSessionId() === sessionId) {
        this.clearCurrentSession();
      }
      
      console.log('Session deleted:', sessionId);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  /**
   * Export session data
   */
  exportSession(sessionId: string, options: ExportOptions = {
    format: 'json',
    includeMetadata: true,
    prettifyJson: true
  }): string | null {
    const sessionData = this.loadSession(sessionId);
    if (!sessionData) {
      return null;
    }

    if (options.format === 'json') {
      const exportData = options.includeMetadata ? sessionData : {
        ...sessionData,
        metadata: undefined
      };
      
      return options.prettifyJson 
        ? JSON.stringify(exportData, null, 2)
        : JSON.stringify(exportData);
    } else if (options.format === 'markdown') {
      return this.generateMarkdownReport(sessionData, options.includeMetadata);
    }

    return null;
  }

  /**
   * Import session data from JSON
   */
  importSession(jsonData: string): string | null {
    try {
      const sessionData: SessionData = JSON.parse(jsonData);
      
      // Validate session data structure
      if (!this.validateSessionData(sessionData)) {
        throw new Error('Invalid session data format');
      }
      
      // Generate new session ID to avoid conflicts
      const newSessionId = this.generateSessionId();
      sessionData.sessionId = newSessionId;
      sessionData.metadata.last_updated = new Date().toISOString();
      
      this.saveSession(sessionData);
      return newSessionId;
    } catch (error) {
      console.error('Error importing session:', error);
      return null;
    }
  }

  /**
   * Clean up old sessions to free storage space
   */
  cleanupOldSessions(): void {
    const sessionList = this.getSessionList();
    
    // Sort by last updated (oldest first)
    sessionList.sort((a, b) => 
      new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime()
    );
    
    // Keep only the most recent sessions
    const sessionsToDelete = sessionList.slice(0, -this.MAX_SESSIONS);
    
    sessionsToDelete.forEach(session => {
      this.deleteSession(session.sessionId);
    });
    
    console.log(`Cleaned up ${sessionsToDelete.length} old sessions`);
  }

  /**
   * Generate markdown report from session data
   */
  private generateMarkdownReport(sessionData: SessionData, includeMetadata: boolean): string {
    const { topic, factors, preferences, scenarios, reactions, insights, summary } = sessionData;
    
    let markdown = `# Feel Forward Session Report\n\n`;
    markdown += `**Topic:** ${topic}\n\n`;
    markdown += `**Completion:** ${summary.completion_percentage}%\n\n`;
    markdown += `**Time Spent:** ${summary.time_spent_minutes} minutes\n\n`;
    
    if (factors.length > 0) {
      markdown += `## Discovered Factors (${summary.total_factors})\n\n`;
      factors.forEach(factor => {
        markdown += `### ${factor.category}\n`;
        factor.items.forEach(item => {
          markdown += `- ${item}\n`;
        });
        markdown += `\n`;
      });
    }
    
    if (preferences.length > 0) {
      markdown += `## Preferences (${summary.preferences_count})\n\n`;
      preferences.forEach(pref => {
        markdown += `### ${pref.factor}\n`;
        markdown += `- **Importance:** ${pref.importance}/10\n`;
        if (pref.hasLimit) {
          markdown += `- **Limit:** ${pref.limit}\n`;
        }
        markdown += `- **Trade-off:** ${pref.tradeoff}\n\n`;
      });
    }
    
    if (scenarios.length > 0) {
      markdown += `## Scenarios (${summary.scenarios_count})\n\n`;
      scenarios.forEach((scenario, index) => {
        markdown += `### Scenario ${index + 1}: ${scenario.title}\n`;
        markdown += `${scenario.text}\n\n`;
        
        // Find corresponding reaction
        const reaction = reactions.find(r => r.scenario_id === scenario.id);
        if (reaction) {
          markdown += `**Your Reaction:**\n`;
          markdown += `- Excitement: ${reaction.excitement}/10\n`;
          markdown += `- Anxiety: ${reaction.anxiety}/10\n`;
          markdown += `- Physical Response: ${reaction.body}\n`;
          if (reaction.freeform) {
            markdown += `- Additional Thoughts: ${reaction.freeform}\n`;
          }
          markdown += `\n`;
        }
      });
    }
    
    if (insights) {
      markdown += `## Insights\n\n${insights}\n\n`;
    }
    
    if (includeMetadata) {
      markdown += `## Session Details\n\n`;
      markdown += `- **Session ID:** ${sessionData.sessionId}\n`;
      markdown += `- **Created:** ${new Date(sessionData.metadata.created_at).toLocaleString()}\n`;
      markdown += `- **Last Updated:** ${new Date(sessionData.metadata.last_updated).toLocaleString()}\n`;
      markdown += `- **App Version:** ${sessionData.metadata.app_version}\n\n`;
    }
    
    markdown += `---\n*Generated by Feel Forward Flow*`;
    
    return markdown;
  }

  /**
   * Validate session data structure
   */
  private validateSessionData(data: any): data is SessionData {
    return (
      data &&
      typeof data.version === 'string' &&
      typeof data.sessionId === 'string' &&
      typeof data.topic === 'string' &&
      typeof data.currentPhase === 'number' &&
      Array.isArray(data.factors) &&
      Array.isArray(data.preferences) &&
      Array.isArray(data.scenarios) &&
      Array.isArray(data.reactions) &&
      data.summary &&
      data.metadata
    );
  }

  /**
   * Calculate completion percentage based on phase progress
   */
  private calculateCompletionPercentage(sessionData: SessionData): number {
    const { currentPhase, factors, preferences, scenarios, reactions } = sessionData;
    
    if (currentPhase < 0) return 0;
    if (currentPhase >= 4) return 100;
    
    let completion = (currentPhase / 5) * 100;
    
    // Add partial completion for current phase
    switch (currentPhase) {
      case 0:
        completion += (factors.length > 0 ? 20 : 0);
        break;
      case 1:
        completion += (preferences.length / Math.max(1, factors.reduce((acc, f) => acc + f.items.length, 0))) * 20;
        break;
      case 2:
        completion += (scenarios.length > 0 ? 20 : 0);
        break;
      case 3:
        completion += (reactions.length / Math.max(1, scenarios.length)) * 20;
        break;
    }
    
    return Math.min(100, Math.round(completion));
  }

  /**
   * Calculate time spent in minutes
   */
  private calculateTimeSpent(): number {
    if (!this.startTime) return 0;
    
    const now = new Date();
    const diffMs = now.getTime() - this.startTime.getTime();
    return Math.round(diffMs / (1000 * 60));
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomStr}`;
  }

  /**
   * Get storage key for session
   */
  private getSessionKey(sessionId: string): string {
    return `${this.STORAGE_KEY_PREFIX}${sessionId}`;
  }

  /**
   * Set current session ID
   */
  private setCurrentSession(sessionId: string): void {
    this.currentSessionId = sessionId;
    localStorage.setItem(this.CURRENT_SESSION_KEY, sessionId);
  }

  /**
   * Get current session ID
   */
  private getCurrentSessionId(): string | null {
    if (this.currentSessionId) {
      return this.currentSessionId;
    }
    
    return localStorage.getItem(this.CURRENT_SESSION_KEY);
  }

  /**
   * Clear current session
   */
  private clearCurrentSession(): void {
    this.currentSessionId = null;
    localStorage.removeItem(this.CURRENT_SESSION_KEY);
    this.stopAutoSave();
  }

  /**
   * Update session list with current session summary
   */
  private updateSessionList(sessionData: SessionData): void {
    const sessionList = this.getSessionList();
    const summary: SessionSummary = {
      sessionId: sessionData.sessionId,
      topic: sessionData.topic,
      currentPhase: sessionData.currentPhase,
      completion_percentage: sessionData.summary.completion_percentage,
      last_updated: sessionData.metadata.last_updated,
      time_spent_minutes: sessionData.summary.time_spent_minutes
    };
    
    // Remove existing entry if it exists
    const filteredList = sessionList.filter(s => s.sessionId !== sessionData.sessionId);
    
    // Add current session
    filteredList.push(summary);
    
    // Sort by last updated (newest first)
    filteredList.sort((a, b) => 
      new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
    );
    
    // Keep only recent sessions
    const limitedList = filteredList.slice(0, this.MAX_SESSIONS);
    
    localStorage.setItem(this.SESSION_LIST_KEY, JSON.stringify(limitedList));
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): {
    used: number;
    available: number;
    sessionCount: number;
  } {
    let totalSize = 0;
    const sessionList = this.getSessionList();
    
    sessionList.forEach(session => {
      const data = localStorage.getItem(this.getSessionKey(session.sessionId));
      if (data) {
        totalSize += data.length;
      }
    });
    
    // Estimate available storage (5MB typical limit for localStorage)
    const estimatedLimit = 5 * 1024 * 1024; // 5MB in bytes
    
    return {
      used: totalSize,
      available: estimatedLimit - totalSize,
      sessionCount: sessionList.length
    };
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

// Utility functions for easy import
export const createSession = (topic?: string) => sessionManager.createNewSession(topic);
export const loadSession = (sessionId: string) => sessionManager.loadSession(sessionId);
export const resumeSession = () => sessionManager.resumeCurrentSession();
export const saveSession = (data: SessionData) => sessionManager.saveSession(data);
export const exportSession = (sessionId: string, options?: ExportOptions) => 
  sessionManager.exportSession(sessionId, options);
export const importSession = (jsonData: string) => sessionManager.importSession(jsonData);
export const getSessionList = () => sessionManager.getSessionList();
export const deleteSession = (sessionId: string) => sessionManager.deleteSession(sessionId);
export const cleanupSessions = () => sessionManager.cleanupOldSessions();