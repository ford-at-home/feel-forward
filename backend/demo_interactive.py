#!/usr/bin/env python3
"""Launch the interactive Feel Forward demo with proper terminal setup."""

import sys
import os

def main():
    """Launch the interactive demo with input validation."""
    print("🎯 FEEL FORWARD - Interactive Demo Launcher")
    print("=" * 50)
    
    if not sys.stdin.isatty():
        print("❌ This demo requires an interactive terminal.")
        print("   Please run this directly in your terminal, not through a script.")
        print("\n💡 Try running: python demo_interactive.py")
        print("   Or for a quick non-interactive demo: make demo")
        return
    
    print("✅ Interactive terminal detected!")
    print("   Launching full CLI experience...\n")
    
    # Import and run the interactive demo
    try:
        from demo_cli import FeelForwardDemo
        demo = FeelForwardDemo()
        demo.run_demo()
    except KeyboardInterrupt:
        print("\n\n👋 Demo interrupted by user.")
    except ImportError as e:
        print(f"❌ Error importing demo: {e}")
        print("   Make sure you've activated your virtual environment and installed dependencies.")
        print("   Try: source venv/bin/activate && pip install -r requirements.txt")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        print("   Please check your environment setup.")

if __name__ == "__main__":
    main()