import { useMemo, useState, useRef } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { formatUnits } from 'viem'
import { erc20Abi } from './abi/erc20'
import { wagmiConfig, supportedChains } from './web3'

/** ---------------------------
 *  基本設定
 *  --------------------------*/

// 可替換為你自己的文件網址
const LINKS = {
  homepage: '/',
  account: '#',
  rewards: '#',
  history: '#',
  whitepaper: 'https://example.com/whitepaper', // ← 換成你的白皮書連結
  help: 'https://example.com/help',             // ← 換成你的幫助中心
  language: '#',                                // ← 語言選擇頁
}

// USDC 合約地址（常見鏈）
const USDC: Record<number, `0x${string}`> = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  56: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  42161: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
  10: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
}

// 合作夥伴（使用公有圖標，不用下載）
const PARTNERS = [
  { name: 'Ethereum',  url: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg' },
  { name: 'BNB Chain', url: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg' },
  { name: 'Polygon',   url: 'https://cryptologos.cc/logos/polygon-matic-logo.svg' },
  { name: 'Arbitrum',  url: 'https://cryptologos.cc/logos/arbitrum-arb-logo.svg' },
  { name: 'Base',      url: 'https://cryptologos.cc/logos/base-base-logo.svg' },
  { name: 'Optimism',  url: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg' },
  { name: 'Avalanche', url: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg' },
  { name: 'Fantom',    url: 'https://cryptologos.cc/logos/fantom-ftm-logo.svg' },
] as const

export default function App() {
  /** web3 狀態 */
  const { connectors, connect, status, error } = useConnect()
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { disconnect } = useDisconnect()
  const { data: nativeBal } = useBalance({ address, chainId })
  const [usdc, setUsdc] = useState<string>('-')
  const currentUsdc = useMemo(() => USDC[chainId ?? 1], [chainId])

  /** 版面與選單狀態 */
  const [menuOpen, setMenuOpen] = useState(false)

  /** Refs（宣告為可為 null，但用 callback ref 指派，避免 TS2322） */
  const homeRef = useRef<HTMLDivElement | null>(null)
  const rewardsRef = useRef<HTMLDivElement | null>(null)
  const historyRef = useRef<HTMLDivElement | null>(null)

  /** 讀取 USDC 餘額 */
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

  /** 切鏈 */
  async function switchChain(id: number, name: string, nativeCurrency: any, rpcUrls: string[]) {
    const provider = (window as any).ethereum
    if (!provider?.request) return alert('未偵測到以太坊提供者')
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${id.toString(16)}` }],
      })
    } catch (e: any) {
      if (e?.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${id.toString(16)}`,
              chainName: name,
              nativeCurrency,
              rpcUrls,
            },
          ],
        })
      }
    }
  }

  return (
    <div className="page">
      {/* 內嵌樣式（單檔即可跑） */}
      <style>{`
        :root { --bg:#0B0F1A; --card:#0f172a; --line:#1f2937; --muted:#9CA3AF; --brand:#60A5FA; --btn:#111827; --btnline:#374151; }
        *{box-sizing:border-box}
        body,html,#root{height:100%}
        .page{min-height:100vh;background:var(--bg);color:#fff;font-family:ui-sans-serif,system-ui,'PingFang TC',Noto Sans TC,Segoe UI,Roboto}
        .container{max-width:1000px;margin:0 auto;padding:20px}
        header{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--bg);z-index:50}
        .logo{display:flex;align-items:center;gap:10px}
        .logo-badge{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#22d3ee,#6366f1)}
        .hstack{display:flex;gap:10px;flex-wrap:wrap}
        .btn{padding:10px 14px;background:var(--btn);border:1px solid var(--btnline);border-radius:10px;color:#fff;cursor:pointer}
        .btn.primary{background:#2563EB;border-color:#2563EB}
        .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        h1{font-size:32px;margin:24px 0 8px}
        h2{font-size:18px;margin:0 0 10px}
        .muted{color:var(--muted)}
        .drawer-mask{position:fixed;inset:0;background:rgba(0,0,0,.35);backdrop-filter:saturate(1.2) blur(2px);opacity:0;pointer-events:none;transition:.2s}
        .drawer-mask.show{opacity:1;pointer-events:auto}
        .drawer{position:fixed;right:0;top:0;height:100%;width:78%;max-width:360px;background:#0e1422;border-left:1px solid var(--line);transform:translateX(100%);transition:.22s}
        .drawer.show{transform:translateX(0)}
        .menu-hd{display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid var(--line)}
        .menu-list a{display:flex;align-items:center;gap:10px;padding:14px 16px;color:#e5e7eb;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.04)}
        .menu-list a:hover{background:rgba(255,255,255,.03)}
        .hero{margin:14px 0 28px;padding:18px;border:1px dashed #1e293b;border-radius:14px;background:linear-gradient(180deg,rgba(96,165,250,.08),rgba(0,0,0,0))}
        .partners{position:relative;overflow:hidden;border-radius:12px;border:1px solid var(--line);margin-top:14px}
        .marquee{display:flex;gap:28px;align-items:center;white-space:nowrap;will-change:transform;animation:scroll 18s linear infinite} /* 稍快 */
        .marquee img{height:28px;width:auto;filter:saturate(120%)}
        @keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        footer{padding:24px 0 60px;text-align:center;color:#94a3b8;border-top:1px solid var(--line);margin-top:28px}
        @media (max-width:800px){ .grid2{grid-template-columns:1fr} h1{font-size:26px} }
      `}</style>

      {/* 頂部列 */}
      <header>
        <div className="logo">
          <div className="logo-badge" />
          <strong>悟淨・DeFi DApp</strong>
        </div>

        {/* 右上角：連線/選單 */}
        <div className="hstack">
          {!isConnected ? (
            connectors.map(c => (
              <button key={c.uid} className="btn" onClick={() => connect({ connector: c })}>連線：{c.name}</button>
            ))
          ) : (
            <>
              <button className="btn" onClick={() => disconnect()}>斷開連線</button>
              <button className="btn" onClick={() => setMenuOpen(true)}>選單</button>
            </>
          )}
        </div>
      </header>

      {/* 抽屜選單 */}
      <div className={`drawer-mask ${menuOpen ? 'show' : ''}`} onClick={() => setMenuOpen(false)} />
      <aside className={`drawer ${menuOpen ? 'show' : ''}`} aria-hidden={!menuOpen}>
        <div className="menu-hd">
          <strong>功能選單</strong>
          <button className="btn" onClick={() => setMenuOpen(false)}>關閉</button>
        </div>
        <nav className="menu-list" onClick={() => setMenuOpen(false)}>
          <a href={LINKS.homepage}>🏠 首頁</a>
          <a href={LINKS.account}>👤 帳號</a>
          <a href={LINKS.rewards}>🎁 獎勵</a>
          <a href={LINKS.history}>🧾 收益記錄</a>
          <a href={LINKS.whitepaper} target="_blank" rel="noreferrer">📄 白皮書</a>
          <a href={LINKS.help} target="_blank" rel="noreferrer">❓ 幫助中心</a>
          <a href={LINKS.language}>🌐 選擇語言</a>
        </nav>
      </aside>

      {/* 內容 */}
      <div className="container">
        <section className="hero">
          <h1>Bitget / Trust 相容 · 正式版介面</h1>
          <p className="muted">支援 Injected（錢包內建瀏覽器）與 WalletConnect v2。介面採卡片式設計，清晰易讀。</p>
        </section>

        {/* 連線資訊 + 餘額 */}
        <section className="grid2">
          <div
            ref={(el) => { homeRef.current = el }}
            className="card"
          >
            <h2>連線狀態</h2>
            <div className="muted">
              <div>狀態：{status}</div>
              {error && <div style={{ color: '#fca5a5' }}>錯誤：{String(error.message ?? error)}</div>}
              <div>地址：{address ?? '-'}</div>
              <div>鏈 ID：{chainId ?? '-'}</div>
            </div>
          </div>

          <div
            ref={(el) => { rewardsRef.current = el }}
            className="card"
          >
            <h2>餘額</h2>
            <div className="muted">
              <div>原生幣：{nativeBal ? `${nativeBal.formatted} ${nativeBal.symbol}` : '-'}</div>
              <div>USDC（當前鏈）：{usdc}</div>
              <button className="btn" style={{ marginTop: 10 }} onClick={fetchUsdc}>重新讀取 USDC</button>
            </div>
          </div>
        </section>

        {/* 切換鏈 */}
        <section
          ref={(el) => { historyRef.current = el }}
          className="card"
          style={{ marginTop: 18 }}
        >
          <h2>切換鏈</h2>
          <div className="hstack">
            {supportedChains.map(c => (
              <button
                key={c.id}
                className="btn"
                onClick={() => switchChain(c.id, c.name, c.nativeCurrency, c.rpcUrls?.default?.http ?? [])}
              >
                {c.name}
              </button>
            ))}
          </div>
        </section>

        {/* 合作夥伴（跑馬燈） */}
        <section className="partners">
          <div className="marquee">
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <img key={p.name + i} src={p.url} alt={p.name} title={p.name} />
            ))}
          </div>
        </section>

        <footer>© 2025 悟淨・DeFi DApp</footer>
      </div>
    </div>
  )
}
