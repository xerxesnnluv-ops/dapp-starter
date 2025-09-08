import { useEffect, useMemo, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { formatUnits } from 'viem'
import { erc20Abi } from './abi/erc20'
import { wagmiConfig, supportedChains } from './web3'

/** 換成你的主視覺圖（1080x600 以上，構圖靠中央更穩） */
const HERO_URL =
  'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=1600&auto=format&fit=crop'

/** 內建 CSS：避免 index.css / 快取沒更新 */
function injectStyles() {
  const ID = 'impermax-like-style'
  if (document.getElementById(ID)) return
  const css = `
:root{
  --bg:#0b0f1a;--text:#e5e7eb;--muted:#9ca3af;
  --line:#1f2937;--card:#0f172a;--card-2:#111827;
  --accent:#14b8a6;/* 青綠主色 */--accent-2:#0ea5e9;--danger:#ef4444;--brand-grad:linear-gradient(135deg,#22d3ee,#6366f1);
  --r:14px;--rs:10px
}
*{box-sizing:border-box} html,body,#root{height:100%}
body{margin:0;background:var(--bg);color:var(--text);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"PingFang TC","Microsoft JhengHei"}
/* Header */
.topbar{position:sticky;top:0;z-index:50;background:#0b0f1acc;backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.topbar-inner{display:flex;align-items:center;justify-content:space-between;padding:12px 16px}
.brand{display:flex;align-items:center;gap:10px}
.logo{width:28px;height:28px;background:var(--brand-grad);border-radius:8px}
.btitle{font-weight:800}
.hamb{width:38px;height:34px;border:1px solid var(--line);border-radius:10px;display:grid;place-items:center}
.hamb span{width:16px;height:2px;background:#94a3b8;display:block;box-shadow:0 5px 0 #94a3b8,0 -5px 0 #94a3b8}
/* Subnav */
.subnav{background:var(--accent);color:#071b1b}
.subnav-inner{display:flex;align-items:center;gap:8px;padding:10px 16px;font-weight:600}
/* Hero */
.hero{position:relative;isolation:isolate}
.hero img{width:100%;height:46vh;object-fit:cover;display:block}
@media(min-width:860px){ .hero img{height:56vh} }
.hero .shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.25),rgba(0,0,0,.65))}
.hero .content{position:absolute;left:16px;right:16px;bottom:20px}
.h1{font-size:38px;font-weight:900;letter-spacing:.02em;margin:0 0 6px}
.p{margin:0 0 14px;color:var(--text);opacity:.9}
.cta-row{display:flex;gap:10px;flex-wrap:wrap}
.btn{padding:12px 16px;border:none;border-radius:12px;cursor:pointer;font-weight:700}
.btn.primary{background:var(--accent);color:#062a29}
.btn.ghost{background:transparent;color:#e5e7eb;border:1px solid #ffffff33}
/* Partners */
.wrap{max-width:1024px;margin:0 auto;padding:18px 16px}
.partners{background:#0e1524;border:1px solid var(--line);border-radius:var(--r);padding:12px}
.scroller{display:flex;gap:12px;overflow:auto;padding:4px}
.logo-pill{min-width:56px;height:56px;border-radius:999px;background:var(--card-2);border:1px solid var(--line);display:grid;place-items:center;font-weight:800}
.note{color:var(--muted);font-size:12px;text-align:center;margin-top:8px}
/* Cards */
.grid{display:grid;gap:16px;margin-top:16px}
@media(min-width:860px){ .grid{grid-template-columns:1fr 1fr} }
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:16px}
.card h3{margin:0 0 10px}
.kv{line-height:1.7}
.kv .muted{color:var(--muted)}
.badge{padding:6px 10px;border-radius:999px;border:1px solid var(--line);background:var(--card-2);color:var(--muted);font-size:12px}
.btn-xs{padding:8px 12px;border-radius:10px;border:1px solid var(--line);background:var(--card-2);color:var(--text);cursor:pointer}
.btn-accent{background:var(--accent);border:none;color:#052321}
.switch-chip{padding:8px 12px;border-radius:10px;border:1px solid var(--line);background:var(--card-2);cursor:pointer}
footer{color:var(--muted);text-align:center;padding:20px}
`.trim()
  const s = document.createElement('style')
  s.id = ID
  s.textContent = css
  document.head.appendChild(s)
}

/** 工具 */
const USDC: Record<number, `0x${string}`> = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  56: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  42161: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
  10: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
}
const short = (a?: `0x${string}` | string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '-')

export default function App() {
  useEffect(() => { injectStyles() }, [])

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
    } catch { setUsdc('讀取失敗') }
  }

  async function switchTo(c: (typeof supportedChains)[number]) {
    const p = (window as any).ethereum
    if (!p?.request) return alert('未偵測到以太坊提供者')
    try { await p.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: `0x${c.id.toString(16)}` }] }) }
    catch (e: any) {
      if (e?.code === 4902) {
        await p.request({ method: 'wallet_addEthereumChain', params: [{ chainId: `0x${c.id.toString(16)}`, chainName: c.name, nativeCurrency: c.nativeCurrency, rpcUrls: c.rpcUrls.default.http }] })
      }
    }
  }

  return (
    <>
      {/* 頂欄 */}
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="logo" />
            <div className="btitle">Impermax · 悟淨</div>
          </div>
          <div className="hamb"><span /></div>
        </div>
        <div className="subnav">
          <div className="subnav-inner">🔊 收益獎勵利率</div>
        </div>
      </div>

      {/* Hero 區 */}
      <section className="hero">
        <img src={HERO_URL} alt="hero" />
        <div className="shade" />
        <div className="content">
          <h1 className="h1">加入 IMPERMAX</h1>
          <p className="p">功能強大、安全可靠</p>
          <div className="cta-row">
            {!isConnected ? (
              <>
                <select
                  style={{ padding: 12, borderRadius: 12, background: '#0f172a', color: '#e5e7eb', border: '1px solid #1f2937' }}
                  defaultValue=""
                  onChange={e => {
                    const ct = connectors.find(x => x.uid === e.target.value)
                    if (ct) connect({ connector: ct })
                  }}
                >
                  <option value="" disabled>選擇連線方式</option>
                  {connectors.map(c => <option key={c.uid} value={c.uid}>🔗 {c.name}</option>)}
                </select>
                <button className="btn primary">連接錢包</button>
              </>
            ) : (
              <>
                <button className="btn primary">已連接成功</button>
                <button className="btn ghost" onClick={() => disconnect()}>斷開連線</button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 合作夥伴 */}
      <div className="wrap">
        <div className="partners">
          <div className="scroller">
            {['ETH','BSC','POLY','ARB','OP','BASE','ZKS','IMX','AVA','FTM'].map(t => (
              <div className="logo-pill" key={t}>{t}</div>
            ))}
          </div>
          <div className="note">合作夥伴（示意，可放品牌 Logo）</div>
        </div>

        {/* 功能卡片 */}
        <div className="grid">
          <section className="card">
            <h3>連線資訊 <span className="badge">Chain ID: {chainId ?? '-'}</span></h3>
            <div className="kv">
              <div>狀態：<span className="muted">{status}</span></div>
              {error && <div style={{ color: '#ef4444' }}>錯誤：{String(error.message ?? error)}</div>}
              <div>地址：<span className="muted">{short(address)}</span></div>
            </div>
          </section>

          <section className="card">
            <h3>餘額</h3>
            <div className="kv">
              <div>原生幣：<span className="muted">{nativeBal ? `${nativeBal.formatted} ${nativeBal.symbol}` : '-'}</span></div>
              <div>USDC：<span className="muted">{usdc}</span></div>
            </div>
            <div style={{ marginTop: 10 }}>
              <button className="btn-xs btn-accent" onClick={fetchUsdc}>重新讀取 USDC</button>
            </div>
          </section>
        </div>

        <section className="card" style={{ marginTop: 16 }}>
          <h3>切換鏈</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {supportedChains.map(c => (
              <button key={c.id} className="switch-chip" onClick={() => switchTo(c)}>{c.name}</button>
            ))}
          </div>
        </section>
      </div>

      <footer>© {new Date().getFullYear()} 悟淨 · DeFi DApp</footer>
    </>
  )
}
