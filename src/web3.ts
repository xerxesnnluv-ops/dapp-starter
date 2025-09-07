// src/web3.ts
import { createConfig, http } from 'wagmi'
import { mainnet, polygon, bsc, base, arbitrum, optimism } from 'wagmi/chains'

// ✅ v2 正確匯入：從套件根匯入「函式型」連線器
import { injected, walletConnect } from '@wagmi/connectors'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string

export const supportedChains = [mainnet, base, polygon, bsc, arbitrum, optimism] as const

export const wagmiConfig = createConfig({
  chains: supportedChains,
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
  },
  // ✅ v2 用法：呼叫函式，不是 new 類別
  connectors: [
    injected({ shimDisconnect: true }),
    walletConnect({ projectId, showQrModal: true }),
  ],
})
