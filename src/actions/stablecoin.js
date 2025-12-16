import { getWalletClient, getAccount } from '../client.js';
import { TEMPO_CONFIG } from '../config.js';
import { parseUnits } from 'viem';

export async function createStablecoin(name, symbol, currency = 'USD') {
  const client = getWalletClient();
  const account = getAccount();
  
  console.log('\n=== Buat Stablecoin ===');
  console.log(`Nama: ${name}`);
  console.log(`Simbol: ${symbol}`);
  console.log(`Mata Uang: ${currency}`);
  console.log(`Pembuat: ${account.address}`);
  
  try {
    const result = await client.token.createSync({
      admin: account.address,
      name,
      symbol,
      currency,
    });
    
    console.log(`\nStablecoin berhasil dibuat!`);
    console.log(`Nama Token: ${result.name}`);
    console.log(`Alamat Token: ${result.token}`);
    console.log(`Lihat di explorer: ${TEMPO_CONFIG.explorer}/tx/${result.receipt.transactionHash}`);
    
    return { success: true, ...result };
  } catch (error) {
    console.error('Gagal membuat stablecoin:', error.message);
    return { success: false, error: error.message };
  }
}

export async function mintTokens(tokenAddress, recipientAddress, amount, decimals = 6) {
  const client = getWalletClient();
  
  console.log('\n=== Mint Token ===');
  console.log(`Token: ${tokenAddress}`);
  console.log(`Penerima: ${recipientAddress}`);
  console.log(`Jumlah: ${amount}`);
  
  try {
    const amountWei = parseUnits(amount.toString(), decimals);
    const result = await client.token.mintSync({
      token: tokenAddress,
      to: recipientAddress,
      amount: amountWei,
    });
    
    console.log(`\nMint berhasil!`);
    console.log(`Lihat di explorer: ${TEMPO_CONFIG.explorer}/tx/${result.receipt.transactionHash}`);
    
    return { success: true, receipt: result };
  } catch (error) {
    console.error('Gagal mint token:', error.message);
    return { success: false, error: error.message };
  }
}
