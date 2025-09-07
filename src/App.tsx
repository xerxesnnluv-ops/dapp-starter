import { useEffect, useMemo, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { formatUnits } from 'viem'
import { erc20Abi } from './abi/erc20'
import { wagmiConfig, supportedChains } from './web3'

/** --- 1) 內建 CSS：避免 index.css/快取問題 --- */
function injectStyles() {
  const ID = 'pro-dapp-style'
  if (document.getElementById(ID)) return
  const css = `
:root{
  --bg:#0b0f1a;--surface:#0f172a;--surface-2:#111827;--line:#1f2937;
  --text:#e5e7eb;--muted:#94a3b8;--brand:#3b82f6;--brand-2:#22d3ee;
  --danger:#ef4444;--radius:14px;--r-sm:10px;
}
*{box-sizing:border-box} html,body,#root{height:100%}
body{margin:0;background:var(--bg);color:var(--text);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"PingFang TC","Microsoft JhengHei";}
.app-header{position:sticky;top:0;z-index:40;display:flex;justify-content:space-between;align-items:center;
  padding:12px 16px;border-bottom:1px solid var(--line);
  background:linear-gradient(180deg,rgba(11,15,26,.95),rgba(11,15,26,.85));backdrop-filter:blur(6px)}
.brand{display:flex;align-items:center;gap:10px}
.logo{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,var(--brand-2),#6366f1)}
.title{font-weight:700}
.badge{font-size:12px;color:var(--muted);border:1px solid var(--line);padding:4px 8px;border-radius:999px;margin-left:8px}
.addr{font-family:ui-monospace,Menlo,Consolas}
.toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.select{background:var(--surface-2);border:1px solid var(--line);color:var(--text);border-radius:10px;padding:8px 10px}
.btn{padding:10px 14px;border-radius:var(--r-sm);background:var(--surface-2);border:1px solid var(--line);
  color:var(--text);cursor:pointer;transition:transform .12s ease}
.btn:hover{transform:translateY(-1px)} .btn.primary{background:var(--brand);border-color:transparent}
.btn.ghost{background:transparent;border:1px solid var(--line)} .btn.small{padding:6px 10px;font-size:14px}
.container{max-width:980px;margin:0 auto;padding:24px 16px}
.grid{display:grid;gap:16px} @media(min-width:860px){.grid{grid-template-columns:1fr 1fr}}
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:16px}
.card h2{margin:0 0 10px;font-size:18px}
.kv{font-size:14px;line-height:1.7} .kv .muted{color:var(--muted)}
.chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.chip{padding:8px 12px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px;cursor:pointer}
.footer{margin:28px 0;color:var(--muted);font-size:12px;text-align:center}
  `.trim()
  const style = document.createElement('style')
  style.id = ID
  style.textContent = css
  document.head.appendChild(style)
}

/** --- 2) App 主程式 --- */
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
  useEffect(() => { injectStyles() }, []) // 關鍵：載入企業樣式

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
