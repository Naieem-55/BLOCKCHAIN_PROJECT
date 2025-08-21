const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to kill processes on a specific port
function killProcessOnPort(port) {
  try {
    console.log(`Checking for processes on port ${port}...`);
    
    // Get processes using the port
    const netstatOutput = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const lines = netstatOutput.split('\n').filter(line => line.includes('LISTENING'));
    
    lines.forEach(line => {
      const match = line.match(/\s+(\d+)$/);
      if (match) {
        const pid = match[1];
        try {
          console.log(`Killing process ${pid} on port ${port}`);
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        } catch (e) {
          // Process might already be dead
        }
      }
    });
    
    // Wait a bit for processes to actually die
    setTimeout(() => {}, 1000);
    
  } catch (error) {
    // No processes found on port - that's good
    console.log(`No processes found on port ${port}`);
  }
}

// Function to ensure clean startup
function cleanStart() {
  console.log('🧹 Cleaning up existing processes...');
  
  // Kill any process on port 5001
  killProcessOnPort(5001);
  
  // Also clean up any stale processes on port 5000 just in case
  killProcessOnPort(5000);
  
  console.log('✅ Cleanup complete!');
  console.log('🚀 Starting server...');
  
  // Start the server
  require('./server.js');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

// Start the clean process
cleanStart();