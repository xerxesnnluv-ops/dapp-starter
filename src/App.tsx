import { useMemo, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { formatUnits } from 'viem'
import { erc20Abi } from './abi/erc20'
import { wagmiConfig, supportedChains } from './web3'

const USDC: Record<number, `0x${string}`> = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  56: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  42161: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
  10: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
}

const partners = [
  { name: 'Ethereum', logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  { name: 'BNB Chain', logo: 'https://assets.coingecko.com/coins/images/825/small/binance-coin-logo.png' },
  { name: 'Polygon', logo: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png' },
  { name: 'Arbitrum', logo: 'https://assets.coingecko.com/coins/images/16547/small/arbitrum.png' },
  { name: 'Optimism', logo: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png' },
  { name: 'Base', logo: 'https://assets.coingecko.com/coins/images/27739/small/base-logo.png' },
  { name: 'zkSync', logo: 'https://assets.coingecko.com/coins/images/30354/small/zksync.jpg' },
  { name: 'Avalanche', logo: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite.png' },
  { name: 'Fantom', logo: 'https://assets.coingecko.com/coins/images/4001/small/Fantom.png' },
]

export default function App() {
  const { connectors, connect, status, error } = useConnect()
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { disconnect } = useDisconnect()
  const { data: nativeBal } = useBalance({ address, chainId })
  const [usdc, setUsdc] = useState<string>('-')
  const currentUsdc = useMemo(() => USDC[chainId ?? 1], [chainId])

  async function fetchUsdc() {
    if (!address || !currentUsdc) return setUsdc('-')
    try {
      const [raw, decimals] = await Promise.all([
        readContract(wagmiConfig, { address: currentUsdc, abi: erc20Abi, functionName: 'balanceOf', args: [address] }),
        readContract(wagmiConfig, { address: currentUsdc, abi: erc20Abi, functionName: 'decimals' }),
      ])
      setUsdc(formatUnits(raw as bigint, Number(decimals)))
    } catch {
      setUsdc('讀取失敗')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F1A', color: 'white', fontFamily: 'ui-sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #1f2937' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#22d3ee,#6366f1)', borderRadius: 8 }} />
          <strong>悟淨 · DeFi DApp</strong>
          {chainId && (
            <span style={{ fontSize: 12, marginLeft: 8, padding: '2px 6px', borderRadius: 6, background: '#1f2937' }}>
              Chain ID : {chainId}
            </span>
          )}
        </div>
        <div>
          {!isConnected ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {connectors.map(c => (
                <button
                  key={c.uid}
                  onClick={() => connect({ connector: c })}
                  style={{ padding: '10px 14px', background: '#111827', border: '1px solid #374151', borderRadius: 10, cursor: 'pointer' }}
                >
                  連線：{c.name}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => disconnect()}
              style={{ padding: '10px 14px', background: '#111827', border: '1px solid #374151', borderRadius: 10, cursor: 'pointer' }}
            >
              斷開連線
            </button>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Bitget / Trust 相容 · 正式版介面</h1>
        <p style={{ opacity: 0.85, marginBottom: 24 }}>支援 Injected（錢包內建瀏覽器）與 WalletConnect v2。</p>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 14, padding: 18 }}>
            <h2 style={{ fontSize: 18, marginBottom: 10 }}>連線狀態</h2>
            <div style={{ fontSize: 14, opacity: 0.9 }}>
              <div>狀態：{status}</div>
              {error && <div style={{ color: '#fca5a5' }}>錯誤：{String(error.message ?? error)}</div>}
              <div>地址：{address ?? '-'}</div>
              <div>鏈 ID：{chainId ?? '-'}</div>
            </div>
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 14, padding: 18 }}>
            <h2 style={{ fontSize: 18, marginBottom: 10 }}>餘額</h2>
            <div style={{ fontSize: 14, opacity: 0.9 }}>
              <div>原生幣：{nativeBal ? `${nativeBal.formatted} ${nativeBal.symbol}` : '-'}</div>
              <div>USDC（當前鏈）：{usdc}</div>
              <button
                onClick={fetchUsdc}
                style={{ marginTop: 10, padding: '8px 12px', background: '#2563eb', border: 'none', borderRadius: 8, cursor: 'pointer', color: 'white' }}
              >
                重新讀取 USDC
              </button>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 24, background: '#0f172a', border: '1px solid #1f2937', borderRadius: 14, padding: 18 }}>
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>切換鏈</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {supportedChains.map(c => (
              <button
                key={c.id}
                onClick={async () => {
                  const provider = (window as any).ethereum
                  if (!provider?.request) return alert('未偵測到以太坊提供者')
                  try {
                    await provider.request({
                      method: 'wallet_switchEthereumChain',
                      params: [{ chainId: `0x${c.id.toString(16)}` }],
                    })
                  } catch (e: any) {
                    if (e?.code === 4902) {
                      await provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                          {
                            chainId: `0x${c.id.toString(16)}`,
                            chainName: c.name,
                            nativeCurrency: c.nativeCurrency,
                            rpcUrls: c.rpcUrls.default.http,
                          },
                        ],
                      })
                    }
                  }
                }}
                style={{ padding: '8px 12px', background: '#111827', border: '1px solid #374151', borderRadius: 8, cursor: 'pointer', color: 'white' }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </section>

        {/* 跑馬燈合作夥伴區 */}
        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>合作夥伴</h2>
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <div
              style={{
                display: 'inline-flex',
                gap: 30,
                animation: 'scroll 25s linear infinite',
              }}
            >
              {partners.map((p, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={p.logo} alt={p.name} style={{ width: 40, height: 40, borderRadius: '50%' }} />
                  <span style={{ fontSize: 12, marginTop: 6 }}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer style={{ textAlign: 'center', padding: 20, fontSize: 12, opacity: 0.7 }}>
        © 2025 攀越點
      </footer>

      <style>
        {`
          @keyframes scroll {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
        `}
      </style>
    </div>
  )
}
