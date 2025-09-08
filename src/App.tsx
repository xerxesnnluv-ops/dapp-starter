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
    <div style={{ minHeight: '100vh', background: '#0B0F1A', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      {/* 導覽列 */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #1f2937' }}>
        <h1 style={{ fontSize: 20, fontWeight: 'bold' }}>悟淨 · DeFi DApp</h1>
        <div>
          {!isConnected ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {connectors.map(c => (
                <button
                  key={c.uid}
                  onClick={() => connect({ connector: c })}
                  style={{ padding: '8px 12px', background: '#2563eb', border: 'none', borderRadius: 8, cursor: 'pointer', color: 'white' }}
                >
                  連線 {c.name}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => disconnect()}
              style={{ padding: '8px 12px', background: '#dc2626', border: 'none', borderRadius: 8, cursor: 'pointer', color: 'white' }}
            >
              斷開連線
            </button>
          )}
        </div>
      </header>

      {/* 主內容 */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px', display: 'grid', gap: 24 }}>
        {/* 卡片：連線狀態 */}
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>連線狀態</h2>
          <p>狀態：{status}</p>
          {error && <p style={{ color: '#fca5a5' }}>錯誤：{String(error.message ?? error)}</p>}
          <p>地址：{address ?? '-'}</p>
          <p>鏈 ID：{chainId ?? '-'}</p>
        </div>

        {/* 卡片：餘額 */}
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>錢包餘額</h2>
          <p>原生幣：{nativeBal ? `${nativeBal.formatted} ${nativeBal.symbol}` : '-'}</p>
          <p>USDC（當前鏈）：{usdc}</p>
          <button
            onClick={fetchUsdc}
            style={{ marginTop: 12, padding: '8px 12px', background: '#2563eb', border: 'none', borderRadius: 8, cursor: 'pointer', color: 'white' }}
          >
            重新讀取 USDC
          </button>
        </div>

        {/* 卡片：切換鏈 */}
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>切換鏈</h2>
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
                style={{ padding: '8px 12px', background: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer', color: 'white' }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* 頁尾 */}
      <footer style={{ textAlign: 'center', padding: 20, opacity: 0.6 }}>
        © 2025 悟淨 · DeFi DApp
      </footer>
    </div>
  )
}
