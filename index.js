import dotenv from 'dotenv';
dotenv.config();

import chalk from 'chalk';
import inquirer from 'inquirer';
import { requestFaucet, checkBalances } from './src/actions/faucet.js';
import { sendPayment, watchIncomingPayments, batchTransfer, multiTokenTransfer } from './src/actions/payments.js';
import { createStablecoin, mintTokens } from './src/actions/stablecoin.js';
import { addFeeLiquidity, removeFeeLiquidity, getPoolInfo } from './src/actions/liquidity.js';
import { swapTokens, placeOrder, cancelOrder, getSwapQuote } from './src/actions/dex.js';
import { getNetworkInfo, getAddNetworkConfig } from './src/actions/network.js';
import { TOKENS } from './src/config.js';
import * as readline from 'readline';

process.stdout.isTTY = true;
process.stdin.isTTY = true;

let rl = null;

function initReadline() {
  if (!rl || rl.closed) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    rl.on('close', () => {
      rl = null;
    });
  }
  return rl;
}

function question(prompt) {
  return new Promise((resolve) => {
    try {
      const reader = initReadline();
      reader.question(chalk.cyan(prompt), (answer) => {
        resolve(answer);
      });
    } catch (error) {
      resolve('');
    }
  });
}

function clearScreen() {
  console.clear();
}

function getTokenChoices() {
  return Object.keys(TOKENS).map(name => ({
    name: `${name} (${TOKENS[name].symbol})`,
    value: name,
  }));
}

async function selectToken(message = 'Pilih token:') {
  if (rl) {
    rl.close();
    rl = null;
  }
  
  const { token } = await inquirer.prompt([
    {
      type: 'list',
      name: 'token',
      message,
      choices: getTokenChoices(),
    }
  ]);
  return token;
}

async function selectMultipleTokens(message = 'Pilih token (Space = pilih, Enter = konfirmasi):') {
  if (rl) {
    rl.close();
    rl = null;
  }
  
  const { tokens } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'tokens',
      message,
      choices: getTokenChoices(),
    }
  ]);
  return tokens;
}

async function showMenu() {
  clearScreen();
  console.log(chalk.bold.blue('\n╔════════════════════════════════════════════════╗'));
  console.log(chalk.bold.blue('║     TEMPO NETWORK TESTNET - OTOMATISASI        ║'));
  console.log(chalk.bold.blue('╠════════════════════════════════════════════════╣'));
  console.log(chalk.blue('║  ') + chalk.green('1') + chalk.blue('.  Info Jaringan                              ║'));
  console.log(chalk.blue('║  ') + chalk.green('2') + chalk.blue('.  Request Dana Faucet                        ║'));
  console.log(chalk.blue('║  ') + chalk.green('3') + chalk.blue('.  Cek Saldo                                  ║'));
  console.log(chalk.blue('║  ') + chalk.green('4') + chalk.blue('.  Kirim Pembayaran                           ║'));
  console.log(chalk.blue('║  ') + chalk.green('5') + chalk.blue('.  Pantau Pembayaran Masuk                    ║'));
  console.log(chalk.blue('║  ') + chalk.green('6') + chalk.blue('.  Buat Stablecoin                            ║'));
  console.log(chalk.blue('║  ') + chalk.green('7') + chalk.blue('.  Tukar Token (Swap)                         ║'));
  console.log(chalk.blue('║  ') + chalk.green('8') + chalk.blue('.  Tambah Likuiditas Fee                      ║'));
  console.log(chalk.blue('║  ') + chalk.green('9') + chalk.blue('.  Hapus Likuiditas Fee                       ║'));
  console.log(chalk.blue('║ ') + chalk.green('10') + chalk.blue('.  Pasang Order DEX                           ║'));
  console.log(chalk.blue('║ ') + chalk.green('11') + chalk.blue('.  Info Pool                                  ║'));
  console.log(chalk.blue('║ ') + chalk.green('12') + chalk.blue('.  Quote Swap                                 ║'));
  console.log(chalk.blue('║ ') + chalk.green('13') + chalk.blue('.  Konfigurasi Tambah Jaringan                ║'));
  console.log(chalk.bold.blue('║  ') + chalk.red('0') + chalk.blue('.  Keluar                                     ║'));
  console.log(chalk.bold.blue('╚════════════════════════════════════════════════╝\n'));
  
  const choice = await question('Pilih opsi: ');
  return choice.trim();
}

async function handleChoice(choice) {
  switch (choice) {
    case '1':
      clearScreen();
      await getNetworkInfo();
      break;
      
    case '2':
      clearScreen();
      const targetAddr = await question('Alamat target (kosongkan untuk diri sendiri): ');
      await requestFaucet(targetAddr || null);
      break;
      
    case '3':
      clearScreen();
      await checkBalances();
      break;
      
    case '4':
      clearScreen();
      console.log(chalk.bold.yellow('\n=== Kirim Pembayaran ===\n'));
      console.log(`${chalk.cyan('1.')} Single Transfer - Transfer 1 token ke 1 alamat`);
      console.log(`${chalk.cyan('2.')} Multi-Token Transfer - Multiple tokens ke 1 alamat`);
      console.log(`${chalk.cyan('3.')} Batch Transfer - Multiple transfers (berbeda token/alamat)`);
      console.log(`${chalk.red('0.')} Kembali ke menu utama\n`);
      const paymentType = await question('Pilih tipe (0-3): ');
      
      if (paymentType === '0' || !paymentType.trim()) {
        break;
      }
      
      if (paymentType === '1') {
        const recipient = await question('Alamat penerima: ');
        if (!recipient.trim()) {
          console.log(chalk.red('Alamat penerima tidak boleh kosong'));
          break;
        }
        const amount = await question('Jumlah: ');
        if (!amount.trim() || isNaN(parseFloat(amount))) {
          console.log(chalk.red('Jumlah tidak valid'));
          break;
        }
        const token = await selectToken('Pilih token:');
        const memo = await question('Memo (opsional): ');
        await sendPayment(recipient, parseFloat(amount), token, memo || null);
        
      } else if (paymentType === '2') {
        const recipient = await question('Alamat penerima: ');
        if (!recipient.trim()) {
          console.log(chalk.red('Alamat penerima tidak boleh kosong'));
          break;
        }
        
        const selectedTokens = await selectMultipleTokens();
        
        if (selectedTokens.length === 0) {
          console.log(chalk.red('Tidak ada token yang dipilih'));
          break;
        }
        
        console.log(chalk.green(`\nToken terpilih: ${selectedTokens.join(', ')}\n`));
        
        const transfers = {};
        for (const tokenName of selectedTokens) {
          const token = TOKENS[tokenName];
          const amt = await question(`Jumlah ${tokenName} (${token.symbol}): `);
          if (amt.trim() && !isNaN(parseFloat(amt)) && parseFloat(amt) > 0) {
            transfers[tokenName] = parseFloat(amt);
          }
        }
        
        if (Object.keys(transfers).length > 0) {
          await multiTokenTransfer(recipient, transfers);
        } else {
          console.log(chalk.red('Tidak ada transfer yang valid'));
        }
        
      } else if (paymentType === '3') {
        const transfers = [];
        let addMore = true;
        
        while (addMore) {
          const recipient = await question('Alamat penerima: ');
          if (!recipient.trim()) {
            console.log(chalk.yellow('Alamat kosong, melewati...'));
            const more = await question('Tambah transfer lagi? (y/n): ');
            addMore = more.toLowerCase() === 'y';
            continue;
          }
          const amount = await question('Jumlah: ');
          if (!amount.trim() || isNaN(parseFloat(amount))) {
            console.log(chalk.yellow('Jumlah tidak valid, melewati...'));
            const more = await question('Tambah transfer lagi? (y/n): ');
            addMore = more.toLowerCase() === 'y';
            continue;
          }
          const token = await selectToken('Pilih token:');
          transfers.push({ to: recipient, amount: parseFloat(amount), token });
          const more = await question('Tambah transfer lagi? (y/n): ');
          addMore = more.toLowerCase() === 'y';
        }
        
        if (transfers.length > 0) {
          await batchTransfer(transfers);
        }
      }
      break;
      
    case '5':
      clearScreen();
      const watchToken = await selectToken('Pilih token untuk dipantau:');
      console.log(chalk.yellow('\nMemantau pembayaran... Tekan Ctrl+C untuk berhenti'));
      await watchIncomingPayments(watchToken);
      break;
      
    case '6':
      clearScreen();
      const name = await question('Nama stablecoin: ');
      if (!name.trim()) {
        console.log(chalk.red('Nama tidak boleh kosong'));
        break;
      }
      const symbol = await question('Simbol stablecoin: ');
      if (!symbol.trim()) {
        console.log(chalk.red('Simbol tidak boleh kosong'));
        break;
      }
      const currency = await question('Mata uang (default: USD): ') || 'USD';
      await createStablecoin(name, symbol, currency);
      break;
      
    case '7':
      clearScreen();
      console.log(chalk.bold.yellow('\n=== Tukar Token (Swap) ===\n'));
      const tokenIn = await selectToken('Token DARI:');
      const tokenOut = await selectToken('Token KE:');
      
      if (tokenIn === tokenOut) {
        console.log(chalk.red('Token DARI dan KE tidak boleh sama'));
        break;
      }
      
      const swapAmount = await question('Jumlah yang ditukar: ');
      if (!swapAmount.trim() || isNaN(parseFloat(swapAmount))) {
        console.log(chalk.red('Jumlah tidak valid'));
        break;
      }
      await swapTokens(tokenIn, tokenOut, parseFloat(swapAmount));
      break;
      
    case '8':
      clearScreen();
      console.log(chalk.bold.yellow('\n=== Tambah Likuiditas Fee ===\n'));
      const userToken = await selectToken('User token:');
      const validatorToken = await selectToken('Validator token:');
      
      const liqAmount = await question('Jumlah: ');
      if (!liqAmount.trim() || isNaN(parseFloat(liqAmount))) {
        console.log(chalk.red('Jumlah tidak valid'));
        break;
      }
      await addFeeLiquidity(userToken, validatorToken, parseFloat(liqAmount));
      break;
      
    case '9':
      clearScreen();
      console.log(chalk.bold.yellow('\n=== Hapus Likuiditas Fee ===\n'));
      const rmUserToken = await selectToken('User token:');
      const rmValidatorToken = await selectToken('Validator token:');
      
      const lpAmount = await question('Jumlah LP yang dihapus: ');
      if (!lpAmount.trim() || isNaN(parseFloat(lpAmount))) {
        console.log(chalk.red('Jumlah tidak valid'));
        break;
      }
      await removeFeeLiquidity(rmUserToken, rmValidatorToken, parseFloat(lpAmount));
      break;
      
    case '10':
      clearScreen();
      console.log(chalk.bold.yellow('\n=== Pasang Order DEX ===\n'));
      const orderToken = await selectToken('Token:');
      
      const orderAmount = await question('Jumlah: ');
      if (!orderAmount.trim() || isNaN(parseFloat(orderAmount))) {
        console.log(chalk.red('Jumlah tidak valid'));
        break;
      }
      
      console.log(chalk.yellow('\nTipe Order:'));
      console.log(chalk.blue('  1.') + ' Beli');
      console.log(chalk.blue('  2.') + ' Jual');
      const orderTypeChoice = await question('Pilih tipe (1/2): ');
      const isBuy = orderTypeChoice === '1';
      const tickPrice = await question('Harga (default: 0.99): ') || '0.99';
      await placeOrder(orderToken, parseFloat(orderAmount), isBuy, tickPrice);
      break;
      
    case '11':
      clearScreen();
      console.log(chalk.bold.yellow('\n=== Info Pool ===\n'));
      const poolUserToken = await selectToken('User token:');
      const poolValidatorToken = await selectToken('Validator token:');
      await getPoolInfo(poolUserToken, poolValidatorToken);
      break;
      
    case '12':
      clearScreen();
      console.log(chalk.bold.yellow('\n=== Quote Swap ===\n'));
      const quoteIn = await selectToken('Token DARI:');
      const quoteOut = await selectToken('Token KE:');
      
      if (quoteIn === quoteOut) {
        console.log(chalk.red('Token DARI dan KE tidak boleh sama'));
        break;
      }
      
      const quoteAmount = await question('Jumlah: ');
      if (!quoteAmount.trim() || isNaN(parseFloat(quoteAmount))) {
        console.log(chalk.red('Jumlah tidak valid'));
        break;
      }
      await getSwapQuote(quoteIn, quoteOut, parseFloat(quoteAmount));
      break;
      
    case '13':
      clearScreen();
      getAddNetworkConfig();
      break;
      
    case '0':
      clearScreen();
      console.log(chalk.green('\nSampai jumpa!\n'));
      if (rl) rl.close();
      process.exit(0);
      
    default:
      console.log(chalk.red('\nOpsi tidak valid.\n'));
  }
}

async function mainLoop() {
  while (true) {
    try {
      const choice = await showMenu();
      await handleChoice(choice);
      
      if (choice !== '0' && choice !== '5') {
        console.log(chalk.gray('\n─────────────────────────────────────────────────'));
        console.log(chalk.green('Operasi selesai'));
        await question('Tekan Enter untuk kembali ke menu utama...');
      }
    } catch (error) {
      if (error.name === 'ExitPromptError') {
        console.log(chalk.yellow('\n\nKeluar...'));
        process.exit(0);
      }
      if (error.code !== 'ERR_USE_AFTER_CLOSE') {
        console.error(chalk.red('Error:'), error.message);
      }
      rl = null;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

async function main() {
  console.log(chalk.bold.cyan('\nScript Tempo Network Testnet'));
  console.log(chalk.cyan('================================\n'));
  
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\nMenghentikan program...'));
    if (rl) rl.close();
    process.exit(0);
  });
  
  try {
    if (!process.env.PRIVATE_KEY) {
      console.log(chalk.red('PRIVATE_KEY tidak ditemukan!'));
      console.log(chalk.yellow('Silakan atur private key di file .env atau Replit Secrets:\n'));
      console.log(chalk.gray('  PRIVATE_KEY=private_key_anda_disini\n'));
      process.exit(1);
    }
    
    await mainLoop();
  } catch (error) {
    console.error(chalk.red('\nFatal Error:'), error.message);
    if (rl) rl.close();
    process.exit(1);
  }
}

main().catch(console.error);
