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

function short(addr?: `0x${string}` | string) {
  if (!addr) return '-'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
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

  async function switchTo(chain: (typeof supportedChains)[number]) {
    const provider = (window as any).ethereum
    if (!provider?.request) return alert('未偵測到以太坊提供者')
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: `0x${chain.id.toString(16)}` }] })
    } catch (e: any) {
      if (e?.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{ chainId: `0x${chain.id.toString(16)}`, chainName: chain.name, nativeCurrency: chain.nativeCurrency, rpcUrls: chain.rpcUrls.default.http }],
        })
      }
    }
  }

  return (
    <>
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <div className="logo" />
          <div className="title">悟淨 · DeFi 控台</div>
          <span className="badge">Chain ID：{chainId ?? '-'}</span>
        </div>

        <div className="toolbar">
          {!isConnected ? (
            <>
              <select
                className="select"
                defaultValue=""
                onChange={e => {
                  const uid = e.target.value
                  const ct = connectors.find(c => c.uid === uid)
                  if (ct) connect({ connector: ct })
                }}
              >
                <option value="" disabled>選擇連線方式</option>
                {connectors.map(c => (
                  <option key={c.uid} value={c.uid}>🔗 {c.name}</option>
                ))}
              </select>
              <button className="btn primary">等待連線…</button>
            </>
          ) : (
            <>
              <span className="badge addr">{short(address)}</span>
              <button className="btn ghost" onClick={() => disconnect()}>斷開連線</button>
            </>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="container">
        <h1 style={{ margin: '6px 0 10px', fontSize: 28 }}>Bitget / Trust 相容 · 正式版介面</h1>
        <p style={{ marginTop: 0, color: 'var(--muted)' }}>支援 Injected（錢包內建瀏覽器）與 WalletConnect v2。</p>

        <div className="grid">
          {/* 連線資訊 */}
          <section className="card">
            <h2>連線狀態</h2>
            <div className="kv">
              <div>狀態：<span className="muted">{status}</span></div>
              {error && <div style={{ color: 'var(--danger)' }}>錯誤：{String(error.message ?? error)}</div>}
              <div>地址：<span className="addr muted">{short(address)}</span></div>
              <div>鏈 ID：<span className="muted">{chainId ?? '-'}</span></div>
            </div>
          </section>

          {/* 餘額卡 */}
          <section className="card">
            <h2>餘額</h2>
            <div className="kv">
              <div>原生幣：<span className="muted">{nativeBal ? `${nativeBal.formatted} ${nativeBal.symbol}` : '-'}</span></div>
              <div>USDC：<span className="muted">{usdc}</span></div>
            </div>
            <div style={{ marginTop: 10 }}>
              <button className="btn primary small" onClick={fetchUsdc}>重新讀取 USDC</button>
            </div>
          </section>
        </div>

        {/* 切換鏈 */}
        <section className="card" style={{ marginTop: 16 }}>
          <h2>切換鏈</h2>
          <div className="chips">
            {supportedChains.map(c => (
              <button key={c.id} className="chip" onClick={() => switchTo(c)}>{c.name}</button>
            ))}
          </div>
        </section>

        <div className="footer">© {new Date().getFullYear()} 悟淨 · DeFi 控台</div>
      </main>
    </>
  )
}
