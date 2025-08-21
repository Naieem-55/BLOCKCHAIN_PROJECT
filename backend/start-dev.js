#!/usr/bin/env node

/**
 * Development server startup script
 * Automatically kills existing process on port before starting
 */

const { exec, spawn } = require('child_process');
const chalk = require('chalk');

const PORT = process.env.PORT || 5003;

console.log(chalk.blue(`🔄 Preparing to start development server on port ${PORT}...`));

// Kill any existing process on the port
console.log(chalk.yellow(`🔪 Killing any existing process on port ${PORT}...`));

exec(`npx kill-port ${PORT}`, (error, stdout, stderr) => {
  if (error && !error.message.includes('No process running')) {
    console.log(chalk.yellow(`⚠️  Could not kill port ${PORT}: ${error.message}`));
  } else if (stdout) {
    console.log(chalk.green(`✅ Killed process on port ${PORT}`));
  } else {
    console.log(chalk.gray(`📝 No process was running on port ${PORT}`));
  }

  // Wait a moment for port to be fully released
  setTimeout(() => {
    console.log(chalk.blue(`🚀 Starting development server...`));
    
    // Start nodemon
    const nodemon = spawn('npx', ['nodemon', 'server.js'], {
      stdio: 'inherit',
      shell: true
    });

    nodemon.on('error', (error) => {
      console.error(chalk.red(`❌ Failed to start server: ${error.message}`));
      process.exit(1);
    });

    nodemon.on('exit', (code) => {
      if (code !== 0) {
        console.error(chalk.red(`❌ Server exited with code ${code}`));
      }
      process.exit(code);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n👋 Gracefully shutting down...'));
      nodemon.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log(chalk.yellow('\n👋 Gracefully shutting down...'));
      nodemon.kill('SIGTERM');
      process.exit(0);
    });
  }, 1000);
});