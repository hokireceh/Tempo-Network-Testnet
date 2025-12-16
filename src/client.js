import { createClient, http, publicActions, walletActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { tempo } from 'tempo.ts/chains';
import { tempoActions } from 'tempo.ts/viem';
import { TOKENS, getPrivateKey } from './config.js';

export function getPublicClient() {
  return createClient({
    chain: tempo({ feeToken: TOKENS.AlphaUSD.address }),
    transport: http('https://rpc.testnet.tempo.xyz'),
  }).extend(publicActions);
}

export function getWalletClient() {
  const privateKey = getPrivateKey();
  const account = privateKeyToAccount(privateKey);
  
  return createClient({
    account,
    chain: tempo({ feeToken: TOKENS.AlphaUSD.address }),
    transport: http('https://rpc.testnet.tempo.xyz'),
  })
    .extend(publicActions)
    .extend(walletActions)
    .extend(tempoActions());
}

export function getAccount() {
  const privateKey = getPrivateKey();
  return privateKeyToAccount(privateKey);
}
