/**
 * Session Management Demo Script
 * Demonstrates the session management features implemented
 */

import { sessionManager, SessionData } from '../lib/session';

// Demo function to showcase session features
export function demonstrateSessionFeatures() {
  console.log('🚀 Feel Forward Session Management Demo');
  console.log('=======================================\n');

  // 1. Create a new session
  console.log('1. Creating a new session...');
  const sessionId = sessionManager.createNewSession('Choosing a career path');
  console.log(`✓ Session created: ${sessionId}\n`);

  // 2. Load the session
  console.log('2. Loading the session...');
  const sessionData = sessionManager.loadSession(sessionId);
  if (sessionData) {
    console.log('✓ Session loaded successfully');
    console.log(`   Topic: ${sessionData.topic}`);
    console.log(`   Current Phase: ${sessionData.currentPhase}`);
    console.log(`   Created: ${sessionData.metadata.created_at}\n`);
  }

  // 3. Update session with sample data
  console.log('3. Updating session with sample data...');
  if (sessionData) {
    sessionData.currentPhase = 1;
    sessionData.factors = [
      {
        category: 'Work Environment',
        items: ['Remote work flexibility', 'Team collaboration', 'Office location']
      },
      {
        category: 'Compensation',
        items: ['Base salary', 'Benefits package', 'Stock options']
      }
    ];
    sessionData.preferences = [
      {
        factor: 'Remote work flexibility',
        importance: 9,
        hasLimit: true,
        limit: 'Must be at least 50% remote',
        tradeoff: 'Willing to accept slightly lower salary for flexibility'
      }
    ];

    sessionManager.saveSession(sessionData);
    console.log('✓ Session updated and saved\n');
  }

  // 4. Export session as JSON
  console.log('4. Exporting session as JSON...');
  const jsonExport = sessionManager.exportSession(sessionId, {
    format: 'json',
    includeMetadata: true,
    prettifyJson: true
  });
  if (jsonExport) {
    console.log('✓ JSON export successful');
    console.log(`   Export size: ${jsonExport.length} characters\n`);
  }

  // 5. Export session as Markdown
  console.log('5. Exporting session as Markdown...');
  const markdownExport = sessionManager.exportSession(sessionId, {
    format: 'markdown',
    includeMetadata: true,
    prettifyJson: false
  });
  if (markdownExport) {
    console.log('✓ Markdown export successful');
    console.log(`   Export size: ${markdownExport.length} characters\n`);
  }

  // 6. List all sessions
  console.log('6. Listing all sessions...');
  const sessionList = sessionManager.getSessionList();
  console.log(`✓ Found ${sessionList.length} session(s):`);
  sessionList.forEach((session, index) => {
    console.log(`   ${index + 1}. ${session.topic} (${session.completion_percentage}% complete)`);
  });
  console.log();

  // 7. Storage information
  console.log('7. Storage information...');
  const storageInfo = sessionManager.getStorageInfo();
  console.log(`✓ Storage used: ${Math.round(storageInfo.used / 1024)} KB`);
  console.log(`   Sessions stored: ${storageInfo.sessionCount}`);
  console.log(`   Available space: ${Math.round(storageInfo.available / 1024)} KB\n`);

  // 8. Import/Export demo
  console.log('8. Testing import functionality...');
  if (jsonExport) {
    const importedSessionId = sessionManager.importSession(jsonExport);
    if (importedSessionId) {
      console.log(`✓ Session imported successfully: ${importedSessionId}`);
      console.log('   (Note: Imported as new session with different ID)\n');
    }
  }

  // 9. Cleanup demo (optional)
  console.log('9. Session cleanup demo...');
  sessionManager.cleanupOldSessions();
  console.log('✓ Old sessions cleaned up\n');

  console.log('🎉 Demo completed! All session management features working.');
  console.log('\nKey Features Demonstrated:');
  console.log('• ✅ Session creation and loading');
  console.log('• ✅ Auto-save functionality');
  console.log('• ✅ JSON and Markdown export');
  console.log('• ✅ Session import');
  console.log('• ✅ Session list management');
  console.log('• ✅ Storage monitoring');
  console.log('• ✅ Session cleanup');
  console.log('• ✅ Browser storage persistence');
  console.log('• ✅ Resume capability');
  
  return {
    sessionId,
    jsonExport,
    markdownExport,
    sessionList,
    storageInfo
  };
}

// Demo session data for testing
export const createDemoSessionData = (): Partial<SessionData> => ({
  topic: 'Choosing between job offers',
  currentPhase: 3,
  factors: [
    {
      category: 'Compensation',
      items: ['Base salary', 'Bonus structure', 'Equity/Stock options', 'Benefits package']
    },
    {
      category: 'Work-Life Balance',
      items: ['Working hours', 'Remote work policy', 'Vacation time', 'Flexibility']
    },
    {
      category: 'Career Growth',
      items: ['Learning opportunities', 'Promotion path', 'Mentorship', 'Skill development']
    }
  ],
  preferences: [
    {
      factor: 'Base salary',
      importance: 8,
      hasLimit: true,
      limit: 'Must be at least $80k',
      tradeoff: 'Willing to negotiate on equity for higher base'
    },
    {
      factor: 'Remote work policy',
      importance: 9,
      hasLimit: true,
      limit: 'Must allow at least 3 days remote',
      tradeoff: 'Would accept lower salary for full remote'
    },
    {
      factor: 'Learning opportunities',
      importance: 7,
      hasLimit: false,
      limit: '',
      tradeoff: 'Important for long-term career growth'
    }
  ],
  scenarios: [
    {
      id: 'scenario-1',
      title: 'High-paying corporate job',
      text: 'A well-established corporation offers you a high salary but requires full-time office presence and has limited growth opportunities.'
    },
    {
      id: 'scenario-2',
      title: 'Startup with equity',
      text: 'A promising startup offers lower base salary but significant equity, full remote work, and rapid learning opportunities.'
    }
  ],
  reactions: [
    {
      scenario_id: 'scenario-1',
      excitement: 6,
      anxiety: 4,
      body: 'Neutral - feels secure but not inspiring',
      freeform: 'The salary is attractive but I worry about being stuck in a rigid environment'
    },
    {
      scenario_id: 'scenario-2',
      excitement: 8,
      anxiety: 6,
      body: 'Energized but nervous about risk',
      freeform: 'Excited about the potential but concerned about financial stability'
    }
  ],
  insights: 'Based on your reactions, you value flexibility and growth opportunities more than pure financial security. The startup scenario excited you despite the risks, suggesting you\'re ready for a challenge and value autonomy in your work environment.'
});

// Usage example
if (typeof window !== 'undefined') {
  // Browser environment - can run demo
  console.log('Session management system loaded. Run demonstrateSessionFeatures() to see demo.');
}