import { getWalletClient, getAccount } from '../client.js';
import { TOKENS, TEMPO_CONFIG } from '../config.js';
import { parseUnits, formatUnits } from 'viem';

export async function addFeeLiquidity(userTokenName, validatorTokenName, amount) {
  const client = getWalletClient();
  const account = getAccount();
  
  const userToken = TOKENS[userTokenName];
  const validatorToken = TOKENS[validatorTokenName];
  
  if (!userToken || !validatorToken) {
    throw new Error('Nama token tidak valid');
  }
  
  const amountWei = parseUnits(amount.toString(), validatorToken.decimals);
  
  console.log('\n=== Tambah Likuiditas Fee ===');
  console.log(`User Token: ${userTokenName}`);
  console.log(`Validator Token: ${validatorTokenName}`);
  console.log(`Jumlah: ${amount}`);
  
  try {
    const result = await client.amm.mintSync({
      userTokenAddress: userToken.address,
      validatorTokenAddress: validatorToken.address,
      validatorTokenAmount: amountWei,
      to: account.address,
    });
    
    console.log(`\nLikuiditas berhasil ditambahkan!`);
    console.log(`Likuiditas yang diterima: ${formatUnits(result.liquidity, 18)}`);
    console.log(`Lihat di explorer: ${TEMPO_CONFIG.explorer}/tx/${result.receipt.transactionHash}`);
    
    return { success: true, receipt: result };
  } catch (error) {
    console.error('Gagal menambah likuiditas:', error.message);
    return { success: false, error: error.message };
  }
}

export async function removeFeeLiquidity(userTokenName, validatorTokenName, lpAmount) {
  const client = getWalletClient();
  const account = getAccount();
  
  const userToken = TOKENS[userTokenName];
  const validatorToken = TOKENS[validatorTokenName];
  
  if (!userToken || !validatorToken) {
    throw new Error('Nama token tidak valid');
  }
  
  const amountWei = parseUnits(lpAmount.toString(), 18);
  
  console.log('\n=== Hapus Likuiditas Fee ===');
  console.log(`User Token: ${userTokenName}`);
  console.log(`Validator Token: ${validatorTokenName}`);
  console.log(`Jumlah LP: ${lpAmount}`);
  
  try {
    const result = await client.amm.burnSync({
      userToken: userToken.address,
      validatorToken: validatorToken.address,
      liquidity: amountWei,
      to: account.address,
    });
    
    console.log(`\nLikuiditas berhasil dihapus!`);
    console.log(`User Token diterima: ${formatUnits(result.amountUserToken, userToken.decimals)}`);
    console.log(`Validator Token diterima: ${formatUnits(result.amountValidatorToken, validatorToken.decimals)}`);
    console.log(`Lihat di explorer: ${TEMPO_CONFIG.explorer}/tx/${result.receipt.transactionHash}`);
    
    return { success: true, receipt: result };
  } catch (error) {
    console.error('Gagal menghapus likuiditas:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getPoolInfo(userTokenName, validatorTokenName) {
  const client = getWalletClient();
  const account = getAccount();
  
  const userToken = TOKENS[userTokenName];
  const validatorToken = TOKENS[validatorTokenName];
  
  if (!userToken || !validatorToken) {
    throw new Error('Nama token tidak valid');
  }
  
  console.log('\n=== Info Pool ===');
  console.log(`User Token: ${userTokenName}`);
  console.log(`Validator Token: ${validatorTokenName}`);
  
  try {
    const poolInfo = await client.amm.getPool({
      userTokenAddress: userToken.address,
      validatorTokenAddress: validatorToken.address,
    });
    
    if (!poolInfo) {
      console.log('Pool belum dibuat untuk pair ini');
      return { success: false, error: 'Pool tidak ada' };
    }
    
    const liquidityBalance = await client.amm.getLiquidityBalance({
      userTokenAddress: userToken.address,
      validatorTokenAddress: validatorToken.address,
      address: account.address,
    });
    
    console.log(`\nUser Token Reserve: ${formatUnits(poolInfo.userTokenReserve || 0n, userToken.decimals)}`);
    console.log(`Validator Token Reserve: ${formatUnits(poolInfo.validatorTokenReserve || 0n, validatorToken.decimals)}`);
    console.log(`LP Token Balance Anda: ${formatUnits(liquidityBalance || 0n, 18)}`);
    
    return { 
      success: true, 
      poolInfo: {
        userTokenReserve: formatUnits(poolInfo.userTokenReserve || 0n, userToken.decimals),
        validatorTokenReserve: formatUnits(poolInfo.validatorTokenReserve || 0n, validatorToken.decimals),
        liquidityBalance: formatUnits(liquidityBalance || 0n, 18),
      }
    };
  } catch (error) {
    console.error('Gagal mengambil info pool:', error.message);
    return { success: false, error: error.message };
  }
}
