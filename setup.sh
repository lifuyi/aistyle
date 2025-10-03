#!/bin/bash

# HTML Transformer Setup Script
echo "🚀 Setting up HTML Transformer..."

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ UV is not installed. Installing UV..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    echo "✅ UV installed successfully"
    echo "⚠️  Please restart your terminal or run: source ~/.bashrc"
    exit 1
fi

echo "✅ UV is already installed"

# Create virtual environment
echo "📦 Creating virtual environment..."
uv venv

# Activate virtual environment and install dependencies
echo "📚 Installing dependencies..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    source .venv/Scripts/activate
else
    # Unix/Linux/MacOS
    source .venv/bin/activate
fi

uv pip install -e .

echo "✅ Setup complete!"
echo ""
echo "🎯 To run the application:"
echo "   1. Activate the virtual environment:"
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "      source .venv/Scripts/activate"
else
    echo "      source .venv/bin/activate"
fi
echo "   2. Start the server:"
echo "      python main.py"
echo "   3. Open http://localhost:8000 in your browser"
echo ""
echo "🔧 For development with auto-reload, the server will restart automatically when you make changes."