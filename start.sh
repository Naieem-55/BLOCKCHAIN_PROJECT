#!/bin/bash

# Quick Start Script for Supply Chain Traceability
# This script provides easy access to the deployment scripts

echo "🚀 High-Efficiency Blockchain-Based Supply Chain Traceability"
echo "Quick Start Script"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Detect platform
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    echo "🖥️  Detected: Windows"
    echo ""
    echo "Choose your deployment method:"
    echo "1. PowerShell Script (Recommended)"
    echo "2. Batch File"
    echo "3. Bash Script (Git Bash/WSL)"
    echo ""
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            echo "Starting PowerShell deployment..."
            powershell -File scripts/deploy.ps1
            ;;
        2)
            echo "Starting Batch deployment..."
            scripts/deploy.bat
            ;;
        3)
            echo "Starting Bash deployment..."
            chmod +x scripts/deploy.sh
            ./scripts/deploy.sh
            ;;
        *)
            echo "Invalid choice. Using PowerShell script..."
            powershell -File scripts/deploy.ps1
            ;;
    esac
else
    echo "🖥️  Detected: Unix/Linux/macOS"
    echo ""
    echo "Starting deployment..."
    chmod +x scripts/deploy.sh
    ./scripts/deploy.sh
fi