#!/usr/bin/env python3
"""Session management utility for Feel Forward demos."""

import json
import os
import glob
import datetime
from typing import List, Dict, Optional

def list_sessions() -> List[Dict]:
    """List all available session files with metadata."""
    session_files = glob.glob("feel_forward_session_*.json")
    sessions = []
    
    for file in session_files:
        try:
            with open(file, 'r') as f:
                data = json.load(f)
            
            # Get file metadata
            timestamp = os.path.getctime(file)
            date_str = datetime.datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')
            size_kb = os.path.getsize(file) / 1024
            
            session_info = {
                'filename': file,
                'topic': data.get('topic', 'Unknown'),
                'timestamp': data.get('timestamp', date_str),
                'date_created': date_str,
                'file_size_kb': round(size_kb, 1),
                'status': data.get('status', 'completed'),
                'version': data.get('version', '1.0'),
                'summary': data.get('summary', {}),
                'has_insights': bool(data.get('insights', '')),
                'phase_progress': {
                    'factors': len(data.get('factors', [])),
                    'preferences': len(data.get('preferences', [])),
                    'scenarios': len(data.get('scenarios', [])),
                    'reactions': len(data.get('reactions', [])),
                    'insights': bool(data.get('insights', ''))
                }
            }
            sessions.append(session_info)
        except Exception as e:
            sessions.append({
                'filename': file,
                'topic': 'ERROR',
                'error': str(e),
                'status': 'corrupted'
            })
    
    # Sort by creation date, newest first
    sessions.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    return sessions

def clean_sessions(keep_latest: int = 5, remove_corrupted: bool = True):
    """Clean up old session files."""
    sessions = list_sessions()
    
    removed_count = 0
    kept_count = 0
    
    print(f"🧹 Cleaning session files...")
    print(f"   Keeping latest {keep_latest} sessions")
    print(f"   Removing corrupted files: {remove_corrupted}")
    
    for i, session in enumerate(sessions):
        filename = session['filename']
        
        # Remove corrupted files
        if remove_corrupted and session.get('status') == 'corrupted':
            try:
                os.remove(filename)
                print(f"   ❌ Removed corrupted: {filename}")
                removed_count += 1
            except Exception as e:
                print(f"   ⚠️  Could not remove {filename}: {e}")
            continue
        
        # Keep the latest N sessions
        if i < keep_latest:
            print(f"   ✅ Keeping: {session['topic']} ({session['date_created']})")
            kept_count += 1
        else:
            try:
                os.remove(filename)
                print(f"   🗑️  Removed old: {session['topic']} ({session['date_created']})")
                removed_count += 1
            except Exception as e:
                print(f"   ⚠️  Could not remove {filename}: {e}")
    
    print(f"\n📊 Cleanup complete: {kept_count} kept, {removed_count} removed")

def export_session_summary(output_file: str = "session_summary.md"):
    """Export a summary of all sessions to markdown."""
    sessions = list_sessions()
    
    with open(output_file, 'w') as f:
        f.write("# Feel Forward Session Summary\n\n")
        f.write(f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Total sessions: {len(sessions)}\n\n")
        
        # Statistics
        completed_sessions = [s for s in sessions if s.get('status') != 'corrupted']
        if completed_sessions:
            f.write("## Statistics\n\n")
            f.write(f"- **Completed sessions:** {len(completed_sessions)}\n")
            f.write(f"- **With insights:** {sum(1 for s in completed_sessions if s.get('has_insights'))}\n")
            f.write(f"- **Interrupted sessions:** {sum(1 for s in completed_sessions if s.get('status') == 'interrupted')}\n")
            
            # Most common topics
            topics = [s['topic'] for s in completed_sessions if s['topic'] != 'Unknown']
            if topics:
                from collections import Counter
                common_topics = Counter(topics).most_common(3)
                f.write(f"- **Most common topics:** {', '.join([f'{topic} ({count})' for topic, count in common_topics])}\n")
            f.write("\n")
        
        # Session list
        f.write("## All Sessions\n\n")
        for session in sessions:
            f.write(f"### {session['topic']}\n")
            f.write(f"- **File:** `{session['filename']}`\n")
            f.write(f"- **Created:** {session['date_created']}\n")
            f.write(f"- **Status:** {session.get('status', 'completed')}\n")
            
            if session.get('status') != 'corrupted':
                progress = session.get('phase_progress', {})
                f.write(f"- **Progress:** {progress.get('factors', 0)} factors, {progress.get('preferences', 0)} preferences, {progress.get('scenarios', 0)} scenarios, {progress.get('reactions', 0)} reactions\n")
                f.write(f"- **Has insights:** {'Yes' if session.get('has_insights') else 'No'}\n")
            else:
                f.write(f"- **Error:** {session.get('error', 'Unknown error')}\n")
            
            f.write("\n")
    
    print(f"✅ Session summary exported to {output_file}")

def main():
    """Command-line interface for session management."""
    import sys
    
    if len(sys.argv) < 2:
        print("Feel Forward Session Manager\n")
        print("Usage:")
        print("  python session_manager.py list          - List all sessions")
        print("  python session_manager.py clean [N]     - Keep latest N sessions (default: 5)")
        print("  python session_manager.py export [file] - Export summary to markdown")
        print("  python session_manager.py stats         - Show quick statistics")
        return
    
    command = sys.argv[1].lower()
    
    if command == "list":
        sessions = list_sessions()
        print(f"\n📋 Found {len(sessions)} session files:\n")
        
        for i, session in enumerate(sessions, 1):
            status_emoji = {
                'completed': '✅',
                'interrupted': '⏸️ ',
                'corrupted': '❌'
            }.get(session.get('status', 'completed'), '❓')
            
            print(f"{i:2d}. {status_emoji} {session['topic']}")
            print(f"     File: {session['filename']}")
            print(f"     Date: {session['date_created']}")
            
            if session.get('status') != 'corrupted':
                progress = session.get('phase_progress', {})
                print(f"     Progress: {progress.get('preferences', 0)} prefs, {progress.get('scenarios', 0)} scenarios, {progress.get('reactions', 0)} reactions")
                print(f"     Insights: {'Yes' if session.get('has_insights') else 'No'}")
            print()
    
    elif command == "clean":
        keep_count = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        clean_sessions(keep_latest=keep_count)
    
    elif command == "export":
        output_file = sys.argv[2] if len(sys.argv) > 2 else "session_summary.md"
        export_session_summary(output_file)
    
    elif command == "stats":
        sessions = list_sessions()
        completed = [s for s in sessions if s.get('status') != 'corrupted']
        
        print(f"\n📊 Session Statistics:")
        print(f"   Total files: {len(sessions)}")
        print(f"   Completed sessions: {len(completed)}")
        print(f"   With insights: {sum(1 for s in completed if s.get('has_insights'))}")
        print(f"   Interrupted: {sum(1 for s in completed if s.get('status') == 'interrupted')}")
        print(f"   Corrupted: {len(sessions) - len(completed)}")
        
        if completed:
            total_size = sum(s.get('file_size_kb', 0) for s in sessions)
            print(f"   Total size: {total_size:.1f} KB")
            
            # Most recent session
            latest = completed[0] if completed else None
            if latest:
                print(f"   Latest session: '{latest['topic']}' ({latest['date_created']})")
    
    else:
        print(f"❌ Unknown command: {command}")
        print("Run without arguments to see usage help.")

if __name__ == "__main__":
    main()