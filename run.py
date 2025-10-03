#!/usr/bin/env python3
"""
Quick start script for HTML Transformer
"""

import sys
import subprocess
import os
from pathlib import Path

def check_venv():
    """Check if we're in a virtual environment"""
    return hasattr(sys, 'real_prefix') or (
        hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix
    )

def main():
    print("🚀 Starting HTML Transformer...")
    
    # Check if virtual environment is activated
    if not check_venv():
        print("⚠️  Virtual environment not detected.")
        print("Please activate your virtual environment first:")
        if os.name == 'nt':  # Windows
            print("   .venv\\Scripts\\activate")
        else:  # Unix/Linux/MacOS
            print("   source .venv/bin/activate")
        print("\nOr run the setup script first:")
        print("   bash setup.sh")
        return 1
    
    # Check if main.py exists
    if not Path("main.py").exists():
        print("❌ main.py not found. Make sure you're in the project directory.")
        return 1
    
    print("✅ Virtual environment active")
    print("🌐 Starting server at http://localhost:8000")
    print("📝 Press Ctrl+C to stop the server")
    print()
    
    try:
        # Run the FastAPI application
        subprocess.run([sys.executable, "main.py"], check=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped. Goodbye!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting server: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())