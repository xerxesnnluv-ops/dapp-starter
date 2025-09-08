// src/web3.ts
import { createConfig, http } from 'wagmi'
import { mainnet, base, polygon, bsc, arbitrum, optimism } from 'wagmi/chains'
import { injected, walletConnect } from '@wagmi/connectors'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string

// 你要支援的鏈（可自行增減）
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
  connectors: [
    injected({ shimDisconnect: true }),
    walletConnect({
      projectId,
      showQrModal: true,
    }),
  ],
})
