import { useMemo, useState, useRef } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { formatUnits } from 'viem'
import { erc20Abi } from './abi/erc20'
import { wagmiConfig, supportedChains } from './web3'

// USDC 合約地址
const USDC: Record<number, `0x${string}`> = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  56: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  42161: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
  10: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
}

export default function App() {
  const { connectors, connect, status, error } = useConnect()
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { disconnect } = useDisconnect()
  const { data: nativeBal } = useBalance({ address, chainId })
  const [usdc, setUsdc] = useState<string>('-')
  const currentUsdc = useMemo(() => USDC[chainId ?? 1], [chainId])

  // ✅ 正確寫法：泛型 HTMLDivElement，初始值 null!
  const homeRef = useRef<HTMLDivElement>(null!)
  const rewardsRef = useRef<HTMLDivElement>(null!)
  const historyRef = useRef<HTMLDivElement>(null!)

  async function fetchUsdc() {
    if (!address || !currentUsdc) return setUsdc('-')
    try {
      const [raw, decimals] = await Promise.all([
        readContract(wagmiConfig, {
          address: currentUsdc,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
        }),
        readContract(wagmiConfig, {
          address: currentUsdc,
          abi: erc20Abi,
          functionName: 'decimals',
        }),
      ])
      setUsdc(formatUnits(raw as bigint, Number(decimals)))
    } catch {
      setUsdc('讀取失敗')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F1A', color: 'white', fontFamily: 'ui-sans-serif' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #1f2937' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#22d3ee,#6366f1)', borderRadius: 8 }} />
          <strong>悟淨・DeFi DApp</strong>
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

      {/* Main */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: 36, marginBottom: 12 }}>Bitget / Trust 相容 · 正式版介面</h1>
        <p style={{ opacity: 0.85, marginBottom: 24 }}>支援 Injected（錢包內建瀏覽器）與 WalletConnect v2。</p>

        {/* 連線狀態 */}
        <section ref={homeRef} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 14, padding: 18 }}>
            <h2 style={{ fontSize: 18, marginBottom: 10 }}>連線狀態</h2>
            <div style={{ fontSize: 14, opacity: 0.9 }}>
              <div>狀態：{status}</div>
              {error && <div style={{ color: '#fca5a5' }}>錯誤：{String(error.message ?? error)}</div>}
              <div>地址：{address ?? '-'}</div>
              <div>鏈 ID：{chainId ?? '-'}</div>
            </div>
          </div>

          {/* 餘額 */}
          <div ref={rewardsRef} style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 14, padding: 18 }}>
            <h2 style={{ fontSize: 18, marginBottom: 10 }}>餘額</h2>
            <div style={{ fontSize: 14, opacity: 0.9 }}>
              <div>原生幣：{nativeBal ? `${nativeBal.formatted} ${nativeBal.symbol}` : '-'}</div>
              <div>USDC（當前鏈）：{usdc}</div>
              <button
                onClick={fetchUsdc}
                style={{ marginTop: 10, padding: '8px 12px', background: '#111827', border: '1px solid #374151', borderRadius: 8, cursor: 'pointer' }}
              >
                重新讀取 USDC
              </button>
            </div>
          </div>
        </section>

        {/* 切換鏈 */}
        <section ref={historyRef} style={{ marginTop: 24, background: '#0f172a', border: '1px solid #1f2937', borderRadius: 14, padding: 18 }}>
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
                style={{ padding: '8px 12px', background: '#111827', border: '1px solid #374151', borderRadius: 8, cursor: 'pointer' }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
