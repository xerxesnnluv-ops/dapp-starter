import { useMemo, useRef, useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { formatUnits } from 'viem'
import { erc20Abi } from './abi/erc20'
import { wagmiConfig, supportedChains } from './web3'

// ===== USDC 地址（多鏈）=====
const USDC: Record<number, `0x${string}`> = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  56: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  42161: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
  10: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
}

// ===== 外部資源（可改成你的連結）=====
const LINKS = {
  whitepaper: 'https://example.com/whitepaper.pdf',
  help: 'https://example.com/help',
  rewards: 'https://example.com/rewards',
  language: 'https://example.com/language',
}

// ===== 線上 logo（免下載）=====
const partnerLogos = [
  { name: 'Ethereum',  logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
  { name: 'Binance',   logo: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png' },
  { name: 'Polygon',   logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png' },
  { name: 'Arbitrum',  logo: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png' },
  { name: 'Optimism',  logo: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png' },
  { name: 'Base',      logo: 'https://cryptologos.cc/logos/base-2-logo.png' },
];

export default function App() {
  const { connectors, connect, status, error } = useConnect()
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { disconnect } = useDisconnect()
  const { data: nativeBal } = useBalance({ address, chainId })
  const [usdc, setUsdc] = useState<string>('-')
  const [menuOpen, setMenuOpen] = useState(false)
  const currentUsdc = useMemo(() => USDC[chainId ?? 1], [chainId])

  // 安全錨點（允許為 null，避免 TS2322）
  const homeRef = useRef<HTMLDivElement | null>(null)
  const rewardsRef = useRef<HTMLDivElement | null>(null)
  const historyRef = useRef<HTMLDivElement | null>(null)

  // 全域樣式（專業＋簡潔）
  useEffect(() => {
    const s = document.createElement('style')
    s.textContent = `
      :root{
        --bg:#0B0F14; --panel:#0E141B; --muted:#93A4B8; --text:#EAF1F8;
        --line:#1C2530; --brand:#22D3EE; --brand2:#5B8CFF;
        --r:16px; --r-lg:22px; --shadow:0 8px 30px rgba(0,0,0,.35);
      }
      *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--text);
        font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans TC","PingFang TC",Arial}
      a{color:inherit;text-decoration:none}

      /* Topbar */
      .top{position:sticky;top:0;z-index:50;background:rgba(10,14,20,.7);
        backdrop-filter:saturate(160%) blur(10px);border-bottom:1px solid var(--line)}
      .topin{max-width:1080px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:12px 16px}
      .brand{display:flex;align-items:center;gap:10px}
      .logo{width:28px;height:28px;border-radius:9px;background:linear-gradient(135deg,var(--brand),var(--brand2))}
      .right{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
      .btn{padding:10px 14px;border-radius:12px;border:1px solid #223140;background:#0A1220;color:var(--text);cursor:pointer}
      .btn-ghost{border:1px solid #243446}
      .btn-primary{border:none;background:linear-gradient(135deg,var(--brand),var(--brand2));color:#041018;font-weight:800}
      .icon{width:38px;height:38px;border-radius:12px;border:1px solid #243446;background:#0A1220;display:grid;place-items:center;cursor:pointer}
      .hb,.closex{width:18px;height:18px;position:relative}
      .hb span{position:absolute;left:0;right:0;height:2px;background:#DCE7F5;border-radius:2px}
      .hb span:nth-child(1){top:2px}.hb span:nth-child(2){top:8px}.hb span:nth-child(3){top:14px}
      .closex::before,.closex::after{content:"";position:absolute;left:0;right:0;top:8px;height:2px;background:#DCE7F5;border-radius:2px}
      .closex::before{transform:rotate(45deg)}.closex::after{transform:rotate(-45deg)}

      /* Menu sheet */
      .sheet{position:fixed;inset:0;display:none;z-index:60}
      .sheet.open{display:block}
      .mask{position:absolute;inset:0;background:rgba(0,0,0,.45)}
      .panel{position:absolute;left:0;right:0;top:0;background:#0E141B;border-bottom:1px solid var(--line);box-shadow:0 20px 40px rgba(0,0,0,.35)}
      .panelin{max-width:1080px;margin:0 auto;padding:12px 16px}
      .mtitle{display:flex;align-items:center;gap:10px;justify-content:space-between;margin-bottom:10px}
      .mlist{background:#0C121A;border:1px solid #1E2A36;border-radius:14px;overflow:hidden}
      .mitem{display:flex;align-items:center;gap:10px;padding:14px 16px;border-top:1px solid rgba(255,255,255,.04);cursor:pointer}
      .mitem:first-child{border-top:none}
      .mitem:hover{background:#0f1722}
      .mfoot{padding:10px 4px;color:var(--muted)}

      /* Hero */
      .hero{position:relative;overflow:hidden;border-bottom:1px solid var(--line)}
      .hero img{width:100%;height:42vh;object-fit:cover;opacity:.9}
      .hero .shade{position:absolute;inset:0;background:linear-gradient(180deg,transparent 25%, rgba(7,11,18,.9) 85%)}
      .hero-ct{position:absolute;left:50%;transform:translateX(-50%);bottom:26px;width:min(1080px,94vw)}
      .h1{font-size:clamp(26px,5vw,40px);font-weight:800;margin:0 0 12px;letter-spacing:.2px}
      .cta{display:flex;gap:10px;flex-wrap:wrap}

      /* Layout */
      .wrap{max-width:1080px;margin:0 auto;padding:28px 16px}
      .grid{display:grid;gap:18px}
      @media(min-width:900px){.grid{grid-template-columns:1fr 1fr}}
      .card{background:rgba(255,255,255,.02);border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--shadow);padding:18px}
      .card h3{margin:0 0 12px;font-size:18px}
      .muted{color:var(--muted)}

      /* Partners marquee（較快速度） */
      .partners{margin-top:26px;border-radius:var(--r-lg);border:1px solid var(--line);background:#0B1219;padding:10px}
      .marquee{overflow:hidden}
      .track{display:flex;gap:18px;align-items:center;width:max-content;animation:scroll 9s linear infinite}
      .pill{min-width:118px;height:48px;padding:8px 12px;border:1px solid #233144;background:rgba(255,255,255,.03);
        border-radius:999px;display:flex;align-items:center;gap:10px}
      .pill img{width:26px;height:26px;object-fit:contain}
      .pill span{font-weight:600;font-size:14px;white-space:nowrap}
      @keyframes scroll{from{transform:translateX(0)} to{transform:translateX(-50%)}}

      footer{margin-top:30px;text-align:center;color:var(--muted)}
    `
    document.head.appendChild(s)
    return () => { s.remove() }
  }, [])

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

  // 選單項目
  const menuItems: Array<
    { label: string; type: 'anchor' | 'external'; refKey?: 'home' | 'rewards' | 'history'; target?: string }
  > = [
    { label: '首頁', type: 'anchor', refKey: 'home' },
    { label: '獎勵', type: 'external', target: LINKS.rewards },
    { label: '收益記錄', type: 'anchor', refKey: 'history' },
    { label: '白皮書', type: 'external', target: LINKS.whitepaper },
    { label: '幫助中心', type: 'external', target: LINKS.help },
    { label: '選擇語言', type: 'external', target: LINKS.language },
  ]

  // 安全捲動（不做物件映射，TS 安心）
  function handleMenuClick(item: (typeof menuItems)[number]) {
    try {
      if (item.type === 'external' && item.target) {
        window.open(item.target, '_blank'); return
      }
      if (item.type === 'anchor' && item.refKey) {
        let el: HTMLDivElement | null = null
        if (item.refKey === 'home') el = homeRef.current
        else if (item.refKey === 'rewards') el = rewardsRef.current
        else if (item.refKey === 'history') el = historyRef.current
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } finally {
      setMenuOpen(false)
    }
  }

  return (
    <div>
      {/* Topbar */}
      <div className="top">
        <div className="topin">
          <div className="brand">
            <div className="logo" />
            <strong>悟淨・DeFi DApp</strong>
            <span style={{ fontSize: 12, opacity: 0.6 }}>Chain ID：{chainId ?? '-'}</span>
          </div>
          <div className="right">
            {isConnected ? (
              <button className="btn btn-ghost" onClick={() => disconnect()}>斷開連線</button>
            ) : (
              connectors.map(c => (
                <button key={c.uid} className="btn btn-ghost" onClick={() => connect({ connector: c })}>
                  連線：{c.name}
                </button>
              ))
            )}
            <button className="icon" onClick={() => setMenuOpen(true)} aria-label="open menu">
              <div className="hb" aria-hidden><span></span><span></span><span></span></div>
            </button>
          </div>
        </div>
      </div>

      {/* Menu sheet */}
      <div className={`sheet ${menuOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
        <div className="mask" onClick={() => setMenuOpen(false)} />
        <div className="panel">
          <div className="panelin">
            <div className="mtitle">
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div className="logo" /><strong>Ether</strong>
              </div>
              <button className="icon" onClick={() => setMenuOpen(false)} aria-label="close menu">
                <div className="closex" />
              </button>
            </div>
            <div className="mlist">
              {menuItems.map((i, idx) => (
                <div className="mitem" key={idx} onClick={() => handleMenuClick(i)}>
                  <span style={{ width:22, textAlign:'center' }}>•</span>
                  <span style={{ fontWeight:700 }}>{i.label}</span>
                </div>
              ))}
            </div>
            <div className="mfoot">安全可靠 · 功能完整 · 相容 Bitget / Trust</div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="hero" ref={homeRef}>
        <img
          src="https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=1600&auto=format&fit=crop"
          alt="cover"
        />
        <div className="shade" />
        <div className="hero-ct">
          <h1 className="h1">加入 Ether</h1>
          <div className="cta">
            <button
              className="btn btn-primary"
              onClick={() => (document.querySelector('#balances') as HTMLDivElement | null)?.scrollIntoView({behavior:'smooth'})}
            >
              已連接成功
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="wrap">
        <div className="grid">
          <div className="card">
            <h3>連線狀態</h3>
            <div className="muted">狀態：<span style={{ color:'#EAF1F8' }}>{status}</span></div>
            {error && <div style={{ color:'#fda4af', marginTop:6 }}>錯誤：{String(error.message ?? error)}</div>}
            <div className="muted" style={{ marginTop:6 }}>地址：<span style={{ color:'#EAF1F8' }}>{address ?? '-'}</span></div>
            <div className="muted" style={{ marginTop:6 }}>鏈 ID：<span style={{ color:'#EAF1F8' }}>{chainId ?? '-'}</span></div>
          </div>

          <div className="card" id="balances">
            <h3>餘額</h3>
            <div className="muted">原生幣：<span style={{ color:'#EAF1F8' }}>{nativeBal ? `${nativeBal.formatted} ${nativeBal.symbol}` : '-'}</span></div>
            <div className="muted" style={{ marginTop:6 }}>USDC：<span style={{ color:'#EAF1F8' }}>{usdc}</span></div>
            <button className="btn btn-primary" style={{ marginTop:12 }} onClick={fetchUsdc}>重新讀取 USDC</button>
          </div>
        </div>

        {/* 合作夥伴（跑馬燈） */}
        <div className="partners" ref={rewardsRef}>
          <div className="muted" style={{ margin:'0 4px 8px' }}>合作夥伴</div>
          <div className="marquee">
            <div className="track">
              {partnerLogos.concat(partnerLogos).map((p, i) => (
                <div className="pill" key={i}>
                  <img src={p.logo} alt={p.name} /><span>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 收益記錄（示意） */}
        <div className="card" style={{ marginTop:26 }} ref={historyRef}>
          <h3>收益記錄</h3>
          <div className="muted">（示意：之後可換成表格或列表）</div>
        </div>

        {/* 切鏈 */}
        <div className="card" style={{ marginTop:26 }}>
          <h3>切換鏈</h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {supportedChains.map(c => (
              <button
                key={c.id}
                className="btn"
                onClick={async () => {
                  const provider = (window as any).ethereum
                  if (!provider?.request) return alert('未偵測到以太坊提供者')
                  try {
                    await provider.request({ method:'wallet_switchEthereumChain', params:[{ chainId:`0x${c.id.toString(16)}` }] })
                  } catch (e:any) {
                    if (e?.code === 4902) {
                      await provider.request({
                        method:'wallet_addEthereumChain',
                        params:[{ chainId:`0x${c.id.toString(16)}`, chainName:c.name, nativeCurrency:c.nativeCurrency, rpcUrls:c.rpcUrls.default.http }]
                      })
                    }
                  }
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <footer>© {new Date().getFullYear()} 悟淨・DeFi DApp</footer>
      </div>
    </div>
  )
}
