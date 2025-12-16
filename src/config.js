import dotenv from 'dotenv';
dotenv.config();

export const TEMPO_CONFIG = {
  networkName: 'Tempo Testnet (Andantino)',
  chainId: 42429,
  currency: 'USD',
  rpcUrl: 'https://rpc.testnet.tempo.xyz',
  wsUrl: 'wss://rpc.testnet.tempo.xyz',
  explorer: 'https://explore.tempo.xyz',
};

export const TOKENS = {
  AlphaUSD: {
    address: '0x20c0000000000000000000000000000000000001',
    symbol: 'αUSD',
    decimals: 6,
  },
  BetaUSD: {
    address: '0x20c0000000000000000000000000000000000002',
    symbol: 'βUSD',
    decimals: 6,
  },
  ThetaUSD: {
    address: '0x20c0000000000000000000000000000000000003',
    symbol: 'θUSD',
    decimals: 6,
  },
  PathUSD: {
    address: '0x20c0000000000000000000000000000000000000',
    symbol: 'pUSD',
    decimals: 6,
  },
};

export const CONTRACTS = {
  faucet: '0x0000000000000000000000000000000000000801',
  tokenFactory: '0x0000000000000000000000000000000000000802',
  feeAmm: '0x0000000000000000000000000000000000000803',
  stablecoinExchange: '0x0000000000000000000000000000000000000804',
};

export function getPrivateKey() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    throw new Error('PRIVATE_KEY not found in environment variables. Please set it in .env file or Secrets.');
  }
  return pk.startsWith('0x') ? pk : `0x${pk}`;
}

export function getWalletAddress() {
  return process.env.WALLET_ADDRESS || null;
}
