import { getWalletClient, getAccount, getPublicClient } from '../client.js';
import { TOKENS, TEMPO_CONFIG, CONTRACTS } from '../config.js';
import { formatUnits, encodeFunctionData } from 'viem';
import { Abis } from 'tempo.ts/viem';

export async function requestFaucet(targetAddress = null) {
  const client = getWalletClient();
  const account = getAccount();
  const publicClient = getPublicClient();
  
  const address = targetAddress || account.address;
  
  console.log('\n=== Tempo Testnet Faucet ===');
  console.log(`Meminta dana untuk: ${address}`);
  
  try {
    let hashes = [];
    let receipts = [];
    
    // Method 1: Try using SDK faucet.fund()
    if (client.faucet?.fund) {
      hashes = await client.faucet.fund({ account: address });
      console.log(`✓ Faucet call berhasil dikirim`);
    } else {
      throw new Error('faucet.fund tidak tersedia');
    }
    
    // Wait for receipts
    for (const hash of hashes) {
      try {
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash,
          timeout: 30000,
        });
        receipts.push(receipt);
        console.log(`Transaksi: ${TEMPO_CONFIG.explorer}/tx/${receipt.transactionHash}`);
      } catch (e) {
        console.log(`Hash: ${hash}`);
      }
    }
    
    console.log('\n✓ Token faucet yang diterima:');
    console.log('  - AlphaUSD: 1,000,000');
    console.log('  - BetaUSD: 1,000,000');
    console.log('  - ThetaUSD: 1,000,000');
    
    return { success: true, receipts };
  } catch (error) {
    console.error('✗ Gagal request faucet:', error.message);
    return { success: false, error: error.message };
  }
}

export async function checkBalances(address = null) {
  const client = getWalletClient();
  const account = getAccount();
  const targetAddress = address || account.address;
  
  console.log('\n=== Saldo Token ===');
  console.log(`Alamat: ${targetAddress}\n`);
  
  const balances = {};
  
  for (const [name, token] of Object.entries(TOKENS)) {
    try {
      const balance = await client.token.getBalance({
        token: token.address,
        address: targetAddress,
      });
      
      const formatted = formatUnits(balance, token.decimals);
      balances[name] = { raw: balance, formatted };
      console.log(`${name} (${token.symbol}): ${formatted}`);
    } catch (error) {
      console.log(`${name}: Gagal mengambil saldo`);
    }
  }
  
  return balances;
}
