import { getWalletClient, getAccount } from '../client.js';
import { TOKENS, TEMPO_CONFIG } from '../config.js';
import { parseUnits, formatUnits, stringToHex, pad } from 'viem';
import chalk from 'chalk';
import { default as ora } from 'ora';

export async function sendPayment(recipientAddress, amount, tokenName = 'AlphaUSD', memo = null) {
  const client = getWalletClient();
  const account = getAccount();
  
  const token = TOKENS[tokenName];
  if (!token) {
    throw new Error(`Token tidak dikenal: ${tokenName}. Tersedia: ${Object.keys(TOKENS).join(', ')}`);
  }
  
  const amountWei = parseUnits(amount.toString(), token.decimals);
  
  console.log('\n=== Kirim Pembayaran ===');
  console.log(`Dari: ${account.address}`);
  console.log(`Ke: ${recipientAddress}`);
  console.log(`Jumlah: ${amount} ${tokenName}`);
  if (memo) console.log(`Memo: ${memo}`);
  
  try {
    let result;
    
    if (memo) {
      const memoBytes = pad(stringToHex(memo), { size: 32 });
      result = await client.token.transferSync({
        amount: amountWei,
        to: recipientAddress,
        token: token.address,
        memo: memoBytes,
      });
    } else {
      result = await client.token.transferSync({
        amount: amountWei,
        to: recipientAddress,
        token: token.address,
      });
    }
    
    console.log(`\nTransaksi berhasil!`);
    console.log(`Lihat di explorer: ${TEMPO_CONFIG.explorer}/tx/${result.receipt.transactionHash}`);
    console.log(`Blok: ${result.receipt.blockNumber}`);
    
    return { success: true, receipt: result };
  } catch (error) {
    console.error('Pembayaran gagal:', error.message);
    return { success: false, error: error.message };
  }
}

export async function batchTransfer(transfers) {
  const client = getWalletClient();
  const account = getAccount();
  
  console.log('\n=== Batch Transfer (Multi-Token) ===');
  console.log(`Total transfer: ${transfers.length}`);
  console.log(`Dari: ${account.address}\n`);
  
  const spinner = ora('Memproses transfer...').start();
  const results = [];
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < transfers.length; i++) {
    const { to, amount, token: tokenName, memo } = transfers[i];
    const token = TOKENS[tokenName];
    
    if (!token) {
      spinner.warn(`[${i + 1}/${transfers.length}] Token tidak dikenal: ${tokenName}`);
      results.push({ to, amount, token: tokenName, status: 'failed', error: 'Token tidak dikenal' });
      failCount++;
      continue;
    }
    
    try {
      const amountWei = parseUnits(amount.toString(), token.decimals);
      spinner.text = `[${i + 1}/${transfers.length}] Transfer ${amount} ${tokenName} ke ${to.slice(0, 10)}...`;
      
      let result;
      if (memo) {
        const memoBytes = pad(stringToHex(memo), { size: 32 });
        result = await client.token.transferSync({
          amount: amountWei,
          to,
          token: token.address,
          memo: memoBytes,
        });
      } else {
        result = await client.token.transferSync({
          amount: amountWei,
          to,
          token: token.address,
        });
      }
      
      results.push({
        to,
        amount,
        token: tokenName,
        status: 'success',
        hash: result.receipt.transactionHash,
        block: result.receipt.blockNumber,
      });
      successCount++;
    } catch (error) {
      results.push({
        to,
        amount,
        token: tokenName,
        status: 'failed',
        error: error.message,
      });
      failCount++;
    }
  }
  
  spinner.succeed(`Batch transfer selesai!`);
  
  console.log(`\n✅ Berhasil: ${successCount}`);
  console.log(`❌ Gagal: ${failCount}\n`);
  
  for (const result of results) {
    if (result.status === 'success') {
      console.log(chalk.green(`✓ ${result.amount} ${result.token} → ${result.to.slice(0, 12)}...`));
      console.log(`  ${TEMPO_CONFIG.explorer}/tx/${result.hash}`);
    } else {
      console.log(chalk.red(`✗ ${result.amount} ${result.token} → ${result.to.slice(0, 12)}... (${result.error})`));
    }
  }
  
  return { success: failCount === 0, results, successCount, failCount };
}

export async function multiTokenTransfer(recipientAddress, amounts) {
  const client = getWalletClient();
  const account = getAccount();
  
  console.log('\n=== Transfer Multi-Token (Satu Penerima) ===');
  console.log(`Dari: ${account.address}`);
  console.log(`Ke: ${recipientAddress}`);
  console.log(`Total token: ${Object.keys(amounts).length}\n`);
  
  const spinner = ora('Memproses transfer...').start();
  const results = [];
  let successCount = 0;
  let failCount = 0;
  
  for (const [tokenName, amount] of Object.entries(amounts)) {
    const token = TOKENS[tokenName];
    
    if (!token) {
      spinner.warn(`Token tidak dikenal: ${tokenName}`);
      results.push({ tokenName, amount, status: 'failed', error: 'Token tidak dikenal' });
      failCount++;
      continue;
    }
    
    try {
      const amountWei = parseUnits(amount.toString(), token.decimals);
      spinner.text = `Transfer ${amount} ${tokenName}...`;
      
      const result = await client.token.transferSync({
        amount: amountWei,
        to: recipientAddress,
        token: token.address,
      });
      
      results.push({
        tokenName,
        amount,
        status: 'success',
        hash: result.receipt.transactionHash,
      });
      successCount++;
    } catch (error) {
      results.push({
        tokenName,
        amount,
        status: 'failed',
        error: error.message,
      });
      failCount++;
    }
  }
  
  spinner.succeed(`Transfer selesai!`);
  
  console.log(`\n✅ Berhasil: ${successCount}`);
  console.log(`❌ Gagal: ${failCount}\n`);
  
  for (const result of results) {
    if (result.status === 'success') {
      console.log(chalk.green(`✓ ${result.amount} ${result.tokenName}`));
      console.log(`  ${TEMPO_CONFIG.explorer}/tx/${result.hash}`);
    } else {
      console.log(chalk.red(`✗ ${result.amount} ${result.tokenName} (${result.error})`));
    }
  }
  
  return { success: failCount === 0, results, successCount, failCount };
}

export async function watchIncomingPayments(tokenName = 'AlphaUSD', callback = null) {
  const client = getWalletClient();
  const account = getAccount();
  const token = TOKENS[tokenName];
  
  console.log('\n=== Memantau Pembayaran Masuk ===');
  console.log(`Token: ${tokenName}`);
  console.log(`Alamat: ${account.address}`);
  console.log('Tekan Ctrl+C untuk berhenti...\n');
  
  const unwatch = client.token.watchTransfer({
    token: token.address,
    onLogs: (logs) => {
      for (const log of logs) {
        if (log.args.to?.toLowerCase() === account.address.toLowerCase()) {
          const amount = formatUnits(log.args.value, token.decimals);
          console.log(`\n[PEMBAYARAN DITERIMA]`);
          console.log(`Dari: ${log.args.from}`);
          console.log(`Jumlah: ${amount} ${tokenName}`);
          console.log(`Tx: ${log.transactionHash}`);
          
          if (callback) {
            callback({
              from: log.args.from,
              to: log.args.to,
              amount,
              hash: log.transactionHash,
            });
          }
        }
      }
    },
  });
  
  // Keep the watcher running
  return unwatch;
}
