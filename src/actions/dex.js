import { getWalletClient, getAccount } from '../client.js';
import { TOKENS, TEMPO_CONFIG } from '../config.js';
import { parseUnits, formatUnits } from 'viem';
import { Tick } from 'tempo.ts/viem';

export async function swapTokens(tokenInName, tokenOutName, amountIn, minAmountOut = null) {
  const client = getWalletClient();
  
  const tokenIn = TOKENS[tokenInName];
  const tokenOut = TOKENS[tokenOutName];
  
  if (!tokenIn || !tokenOut) {
    throw new Error('Nama token tidak valid');
  }
  
  const amountInWei = parseUnits(amountIn.toString(), tokenIn.decimals);
  const minOutWei = minAmountOut 
    ? parseUnits(minAmountOut.toString(), tokenOut.decimals)
    : amountInWei * 99n / 100n;
  
  console.log('\n=== Tukar Token ===');
  console.log(`Dari: ${amountIn} ${tokenInName}`);
  console.log(`Ke: ${tokenOutName}`);
  console.log(`Min output: ${formatUnits(minOutWei, tokenOut.decimals)}`);
  
  try {
    const result = await client.dex.sellSync({
      tokenIn: tokenIn.address,
      tokenOut: tokenOut.address,
      amountIn: amountInWei,
      minAmountOut: minOutWei,
    });
    
    console.log(`\nTukar berhasil!`);
    console.log(`Lihat di explorer: ${TEMPO_CONFIG.explorer}/tx/${result.receipt.transactionHash}`);
    
    return { success: true, receipt: result };
  } catch (error) {
    console.error('Gagal menukar:', error.message);
    return { success: false, error: error.message };
  }
}

export async function placeOrder(tokenName, amount, isBuy = true, tickPrice = '0.99') {
  const client = getWalletClient();
  const account = getAccount();
  
  const token = TOKENS[tokenName];
  
  if (!token) {
    throw new Error('Nama token tidak valid');
  }
  
  const amountWei = parseUnits(amount.toString(), token.decimals);
  const tick = Tick.fromPrice(parseFloat(tickPrice));
  
  console.log('\n=== Pasang Order DEX ===');
  console.log(`Token: ${tokenName}`);
  console.log(`Tipe: ${isBuy ? 'BELI' : 'JUAL'}`);
  console.log(`Jumlah: ${amount}`);
  console.log(`Harga (Tick): ${tickPrice}`);
  
  try {
    const result = await client.dex.placeSync({
      token: token.address,
      amount: amountWei,
      type: isBuy ? 'buy' : 'sell',
      tick: tick,
    });
    
    console.log(`\nOrder berhasil dipasang!`);
    console.log(`Order ID: ${result.id || 'N/A'}`);
    console.log(`Lihat di explorer: ${TEMPO_CONFIG.explorer}/tx/${result.receipt.transactionHash}`);
    
    return { success: true, receipt: result };
  } catch (error) {
    console.error('Gagal memasang order:', error.message);
    return { success: false, error: error.message };
  }
}

export async function cancelOrder(orderId) {
  const client = getWalletClient();
  
  console.log('\n=== Batalkan Order ===');
  console.log(`Order ID: ${orderId}`);
  
  try {
    const result = await client.dex.cancelSync({
      orderId: BigInt(orderId),
    });
    
    console.log(`\nOrder berhasil dibatalkan!`);
    console.log(`Lihat di explorer: ${TEMPO_CONFIG.explorer}/tx/${result.receipt.transactionHash}`);
    
    return { success: true, receipt: result };
  } catch (error) {
    console.error('Gagal membatalkan order:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getSwapQuote(tokenInName, tokenOutName, amountIn) {
  const client = getWalletClient();
  
  const tokenIn = TOKENS[tokenInName];
  const tokenOut = TOKENS[tokenOutName];
  
  if (!tokenIn || !tokenOut) {
    throw new Error('Nama token tidak valid');
  }
  
  const amountInWei = parseUnits(amountIn.toString(), tokenIn.decimals);
  
  console.log('\n=== Quote Swap ===');
  
  try {
    const amountOut = await client.dex.getSellQuote({
      tokenIn: tokenIn.address,
      tokenOut: tokenOut.address,
      amountIn: amountInWei,
    });
    
    console.log(`Input: ${amountIn} ${tokenInName}`);
    console.log(`Output estimasi: ${formatUnits(amountOut, tokenOut.decimals)} ${tokenOutName}`);
    
    return {
      amountIn: amountIn,
      amountOut: formatUnits(amountOut, tokenOut.decimals),
    };
  } catch (error) {
    console.error('Gagal mendapat quote:', error.message);
    return null;
  }
}
