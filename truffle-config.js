const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');

// Load mnemonic from a hidden file (never commit this file to GitHub)
const mnemonic = fs.readFileSync(".secret").toString().trim();

// Your Infura Project ID (create at https://infura.io)
// https://mainnet.infura.io/v3/940c27ebf8104002ad5ee0e23549baa1
const infuraProjectId = "940c27ebf8104002ad5ee0e23549baa1";

module.exports = {
  contracts_build_directory: './client/src/artifacts',

  networks: {
    // Local Ganache
    development: {
      host: "127.0.0.1",     // Localhost
      port: 7545,            // Ganache default port
      network_id: "*",       // Any network
    },

    // Ropsten Testnet
    ropsten: {
      provider: () =>
        new HDWalletProvider(
          mnemonic,
          `https://ropsten.infura.io/v3/${infuraProjectId}`
        ),
      network_id: 3,          // Ropsten's id
      gas: 5500000,           // Gas limit
      confirmations: 2,       // Wait for 2 blocks confirmation
      timeoutBlocks: 200,
      skipDryRun: true
    },

    // Goerli Testnet
    goerli: {
      provider: () =>
        new HDWalletProvider(
          mnemonic,
          `https://goerli.infura.io/v3/${infuraProjectId}`
        ),
      network_id: 5,          // Goerli's id
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },

  mocha: {
    // timeout: 100000
  },

  compilers: {
    solc: {
      version: "0.8.19",  // Adjust to your Solidity version
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },

  db: {
    enabled: false
  }
};
