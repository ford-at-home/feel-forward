# Session Management System

## Overview

The Feel Forward application includes a comprehensive session management system that provides persistence, auto-save, resume, and export functionality based on the demo patterns from FRONTEND.md. This system ensures users never lose their progress and can seamlessly continue their emotional discovery journey across sessions.

## Features

### ✅ Core Session Persistence
- **Browser Storage**: Uses localStorage for persistent session storage
- **Session Structure**: Based on demo JSON format with complete state preservation
- **Auto-Resume**: Automatically resumes the last active session when user returns
- **Session Validation**: Ensures data integrity with TypeScript interfaces

### ✅ Auto-Save Functionality
- **Real-time Sync**: Continuously syncs application state with session storage
- **Configurable Interval**: 30-second auto-save interval (configurable)
- **Smart Triggers**: Saves on phase completion and significant data changes
- **Change Detection**: Only saves when there are actual changes to prevent unnecessary writes

### ✅ Export & Import
- **JSON Export**: Complete session data with metadata for backup/sharing
- **Markdown Reports**: Human-readable reports with insights and progress
- **Import Capability**: Restore sessions from exported JSON data
- **File Downloads**: Automatic file generation for easy sharing

### ✅ Session Management UI
- **Session Bar**: Compact controls in main interface
- **Full Manager**: Comprehensive session management dialog
- **Quick Resume**: Recent sessions accessible from welcome screen
- **Progress Indicators**: Visual progress tracking and completion status

### ✅ Storage Management
- **Storage Monitoring**: Track usage and available space
- **Session Cleanup**: Automatic cleanup of old sessions
- **Quota Management**: Handles localStorage quota exceeded errors
- **Session Limits**: Configurable maximum session count (default: 10)

## Technical Implementation

### File Structure

```
src/
├── lib/
│   └── session.ts              # Core session management logic
├── hooks/
│   └── use-session.ts          # React hook for session state
├── components/
│   ├── SessionManager.tsx      # Full session management UI
│   └── SessionBar.tsx          # Compact session controls
├── examples/
│   └── session-demo.ts         # Demo and testing utilities
└── pages/
    └── Index.tsx               # Integrated session functionality
```

### Session Data Structure

Based on the demo format from FRONTEND.md:

```typescript
interface SessionData {
  version: string;
  timestamp: string;
  sessionId: string;
  topic: string;
  currentPhase: number;
  factors: Factor[];
  preferences: Preference[];
  scenarios: Scenario[];
  reactions: Reaction[];
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
```

### Key Components

#### SessionManager Class (`src/lib/session.ts`)
- Central session management logic
- Browser storage operations
- Export/import functionality
- Session cleanup and validation

#### useSession Hook (`src/hooks/use-session.ts`)
- React state management
- Auto-save coordination
- Component integration interface
- Session lifecycle management

#### SessionBar Component (`src/components/SessionBar.tsx`)
- Compact session controls
- Status indicators
- Quick save/export actions
- Session selection

#### SessionManager Component (`src/components/SessionManager.tsx`)
- Full session management interface
- Import/export dialogs
- Session list with details
- Storage information

## Usage Examples

### Creating a New Session

```typescript
import { useSession } from '@/hooks/use-session';

const { createNewSession } = useSession();

// Create with topic
createNewSession('Choosing a career path');

// Create without topic
createNewSession();
```

### Auto-Save Integration

```typescript
const {
  sessionData,
  updateSessionData,
  hasUnsavedChanges,
  isAutoSaveEnabled
} = useSession();

// Update session data (triggers auto-save)
updateSessionData({
  topic: 'Updated topic',
  currentPhase: 1,
  factors: newFactors
});

// Manual save
saveCurrentSession();
```

### Export and Download

```typescript
const { exportCurrentSession } = useSession();

// Export as JSON
const jsonData = exportCurrentSession('json');

// Export as Markdown report
const markdownReport = exportCurrentSession('markdown');

// Automatically triggers download
```

### Import from File

```typescript
const { importSession } = useSession();

// Import from JSON string
const success = importSession(jsonDataString);
if (success) {
  console.log('Session imported successfully');
}
```

### Session List Management

```typescript
const {
  sessionList,
  loadSession,
  deleteSession,
  refreshSessionList
} = useSession();

// Load specific session
loadSession(sessionId);

// Delete session
deleteSession(sessionId);

// Refresh list
refreshSessionList();
```

## Configuration

### Auto-Save Settings

```typescript
const {
  enableAutoSave,
  disableAutoSave,
  isAutoSaveEnabled
} = useSession();

// Toggle auto-save
if (isAutoSaveEnabled) {
  disableAutoSave();
} else {
  enableAutoSave();
}
```

### Storage Configuration

```typescript
// In session.ts
const MAX_SESSIONS = 10;          // Maximum stored sessions
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const SESSION_VERSION = '1.0';    // Data format version
```

## Demo and Testing

### Running the Demo

```typescript
import { demonstrateSessionFeatures } from '@/examples/session-demo';

// Run comprehensive demo
const results = demonstrateSessionFeatures();
console.log(results);
```

### Demo Features
- Session creation and loading
- Data persistence testing
- Export/import validation
- Storage monitoring
- Cleanup functionality

## Integration with Feel Forward Flow

### Phase Integration
- **Phase 0 (Topic)**: Auto-creates session and saves topic
- **Phase 1 (Factors)**: Saves discovered factors and categories
- **Phase 2 (Preferences)**: Saves importance ratings and limits
- **Phase 3 (Scenarios)**: Saves generated scenarios
- **Phase 4 (Reactions)**: Saves emotional responses
- **Phase 5 (Insights)**: Saves final insights and summary

### State Synchronization
- Real-time sync between React state and session storage
- Automatic session updates on phase completion
- Progress tracking and completion percentage calculation
- Time spent monitoring

### Resume Capability
- Detects existing sessions on app load
- Restores exact phase and data state
- Maintains progress indicators
- Preserves user preferences and settings

## Error Handling

### Storage Errors
- Quota exceeded error handling
- Automatic session cleanup when storage full
- Graceful degradation when localStorage unavailable
- Validation of session data integrity

### Recovery Mechanisms
- Automatic retry for failed saves
- Session validation on load
- Fallback to memory-only mode if needed
- User notification of storage issues

## Browser Compatibility

### Storage Support
- localStorage (primary storage)
- sessionStorage (fallback for temporary sessions)
- Memory storage (fallback for unsupported browsers)

### Cross-Browser Testing
- Chrome/Chromium: Full support
- Firefox: Full support
- Safari: Full support
- Edge: Full support
- Mobile browsers: Basic support

## Security Considerations

### Data Privacy
- Local storage only (no server transmission)
- User-controlled data deletion
- No sensitive data in session metadata
- Export warnings for shared data

### Data Validation
- TypeScript interfaces for type safety
- Session data structure validation
- Sanitization of imported data
- Version compatibility checking

## Performance Optimization

### Efficient Storage
- JSON compression for large sessions
- Lazy loading of session list
- Debounced auto-save to prevent excessive writes
- Memory management for session cleanup

### UI Performance
- Memoized components and calculations
- Efficient re-renders with React.memo
- Virtual scrolling for large session lists
- Progressive loading of session data

## Future Enhancements

### Potential Improvements
- Cloud storage sync (optional)
- Session sharing via secure links
- Advanced export formats (PDF, CSV)
- Session analytics and insights
- Collaborative session features
- Enhanced mobile support

### Extensibility
- Plugin architecture for custom export formats
- Hooks for third-party integrations
- Configurable storage backends
- Custom session metadata fields

---

This session management system provides a robust foundation for persistent user experiences in the Feel Forward application, ensuring users can always continue their emotional discovery journey exactly where they left off.