import { getWalletClient, getAccount } from '../client.js';
import { TEMPO_CONFIG } from '../config.js';

export async function getNetworkInfo() {
  const client = getWalletClient();
  
  console.log('\n=== Info Jaringan Tempo Testnet ===');
  console.log(`Nama Jaringan: ${TEMPO_CONFIG.networkName}`);
  console.log(`Chain ID: ${TEMPO_CONFIG.chainId}`);
  console.log(`RPC URL: ${TEMPO_CONFIG.rpcUrl}`);
  console.log(`WebSocket URL: ${TEMPO_CONFIG.wsUrl}`);
  console.log(`Explorer: ${TEMPO_CONFIG.explorer}`);
  
  try {
    const blockNumber = await client.getBlockNumber();
    console.log(`\nBlok Saat Ini: ${blockNumber}`);
    
    const account = getAccount();
    console.log(`\nAlamat Wallet Anda: ${account.address}`);
    
    return {
      ...TEMPO_CONFIG,
      blockNumber,
      walletAddress: account.address,
    };
  } catch (error) {
    console.error('Gagal mendapat info jaringan:', error.message);
    return null;
  }
}

export function getAddNetworkConfig() {
  console.log('\n=== Konfigurasi Tambah Jaringan ===');
  console.log('Gunakan detail ini untuk menambahkan Tempo Testnet ke wallet Anda:\n');
  
  const config = {
    chainId: `0x${TEMPO_CONFIG.chainId.toString(16)}`,
    chainName: TEMPO_CONFIG.networkName,
    nativeCurrency: {
      name: 'USD',
      symbol: 'USD',
      decimals: 6,
    },
    rpcUrls: [TEMPO_CONFIG.rpcUrl],
    blockExplorerUrls: [TEMPO_CONFIG.explorer],
  };
  
  console.log(`Nama Jaringan: ${config.chainName}`);
  console.log(`Chain ID: ${TEMPO_CONFIG.chainId} (${config.chainId})`);
  console.log(`Mata Uang: USD`);
  console.log(`RPC URL: ${TEMPO_CONFIG.rpcUrl}`);
  console.log(`Block Explorer: ${TEMPO_CONFIG.explorer}`);
  
  return config;
}
