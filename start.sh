#!/bin/bash

# HTML Transformer - Easy Start Script
# This script handles both setup and running the application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if we're in a virtual environment
check_venv() {
    if [[ "$VIRTUAL_ENV" != "" ]]; then
        return 0
    fi
    return 1
}

# Function to check if uv is installed
check_uv() {
    if command -v uv &> /dev/null; then
        return 0
    fi
    return 1
}

# Function to install uv
install_uv() {
    print_status "Installing UV package manager..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    print_success "UV installed successfully"
    print_warning "Please restart your terminal or run: source ~/.bashrc"
    print_warning "Then run this script again."
    exit 1
}

# Function to setup virtual environment and dependencies
setup_project() {
    print_status "Setting up HTML Transformer project..."
    
    # Create virtual environment if it doesn't exist
    if [[ ! -d ".venv" ]]; then
        print_status "Creating virtual environment..."
        uv venv
        print_success "Virtual environment created"
    else
        print_success "Virtual environment already exists"
    fi
    
    # Activate virtual environment
    print_status "Activating virtual environment..."
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        source .venv/Scripts/activate
    else
        source .venv/bin/activate
    fi
    
    # Install dependencies
    print_status "Installing dependencies..."
    uv pip install -e .
    print_success "Dependencies installed successfully"
}

# Function to start the application
start_app() {
    print_status "Starting HTML Transformer application..."
    
    # Activate virtual environment if not already active
    if ! check_venv; then
        if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
            source .venv/Scripts/activate
        else
            source .venv/bin/activate
        fi
    fi
    
    # Check if main.py exists
    if [[ ! -f "main.py" ]]; then
        print_error "main.py not found. Make sure you're in the project directory."
        exit 1
    fi
    
    print_success "Virtual environment active"
    echo ""
    echo -e "${BLUE}🌐 Starting server at ${GREEN}http://localhost:8000${NC}"
    echo -e "${BLUE}📝 Press ${YELLOW}Ctrl+C${BLUE} to stop the server${NC}"
    echo -e "${BLUE}🔄 Auto-reload enabled for development${NC}"
    echo ""
    
    # Start the FastAPI application
    python main.py
}

# Main script logic
main() {
    echo ""
    echo -e "${BLUE}🚀 HTML Transformer - Easy Start Script${NC}"
    echo ""
    
    # Check if uv is installed
    if ! check_uv; then
        print_warning "UV package manager not found"
        read -p "Do you want to install UV? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_uv
        else
            print_error "UV is required to run this project. Please install UV manually:"
            echo "curl -LsSf https://astral.sh/uv/install.sh | sh"
            exit 1
        fi
    fi
    
    # Check if virtual environment exists and has dependencies
    if [[ ! -d ".venv" ]] || [[ ! -f ".venv/pyvenv.cfg" ]]; then
        print_status "First time setup required"
        setup_project
    else
        # Check if we need to install/update dependencies
        if ! check_venv; then
            print_status "Activating existing environment..."
            if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
                source .venv/Scripts/activate
            else
                source .venv/bin/activate
            fi
        fi
        
        # Quick dependency check
        if ! python -c "import fastapi" 2>/dev/null; then
            print_warning "Dependencies seem to be missing"
            read -p "Do you want to reinstall dependencies? (y/N): " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_status "Reinstalling dependencies..."
                uv pip install -e .
                print_success "Dependencies reinstalled"
            fi
        fi
    fi
    
    # Start the application
    echo ""
    start_app
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n${BLUE}👋 Server stopped. Goodbye!${NC}"; exit 0' INT

# Run main function
main "$@"