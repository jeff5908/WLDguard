import { encodeFunctionData, parseUnits } from 'viem';
import { ADDRESSES, ERC20_ABI, REFERRAL_ROUTER_ABI } from './contracts';

/**
 * Builds the batched transaction payload for depositing WLD or USDC into Morpho Vaults.
 * Includes the protocol fee routing for the WLDguard treasury.
 */
export function buildYieldDepositBatch(amount: string, token: 'WLD' | 'USDC', userAddress: string) {
  const vaultAddress = token === 'WLD' ? ADDRESSES.MORPHO_WLD_VAULT : ADDRESSES.MORPHO_USDC_VAULT;
  const tokenAddress = token === 'WLD' ? ADDRESSES.WLD : ADDRESSES.USDC;

  // Convert human-readable amount (e.g., "1.5") to blockchain math (Wei: 18 decimals)
  const amountInWei = parseUnits(amount, 18);

  // 1. TRANSACTION 1: The Approval
  const approveCalldata = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [ADDRESSES.MORPHO_REFERRAL_ROUTER as `0x${string}`, amountInWei]
  });

  // 2. TRANSACTION 2: The Deposit & Revenue Routing
  const depositCalldata = encodeFunctionData({
    abi: REFERRAL_ROUTER_ABI,
    functionName: 'depositWithReferral',
    args: [
      vaultAddress as `0x${string}`,
      amountInWei,
      userAddress as `0x${string}`, // User gets the vault receipts
      ADDRESSES.WLDGUARD_TREASURY as `0x${string}` // WLDguard gets the yield commission
    ]
  });

  // 3. Bundle them together for 1-click execution in World App
  return [
    {
      to: tokenAddress,
      data: approveCalldata,
      description: `Approve ${amount} ${token} for WLDguard`
    },
    {
      to: ADDRESSES.MORPHO_REFERRAL_ROUTER,
      data: depositCalldata,
      description: `Deposit ${amount} ${token} to earn yield`
    }
  ];
}