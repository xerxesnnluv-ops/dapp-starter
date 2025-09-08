import React, { useMemo, useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { formatUnits } from 'viem'
import { erc20Abi } from './abi/erc20'
import { wagmiConfig, supportedChains } from './web3'

// USDC on major chains
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

  // Inject CSS (含：流動漸層背景 / Hero / 卡片 / 跑馬燈)
  useEffect(() => {
    const s = document.createElement('style')
    s.textContent = `
      :root{
        --bg:#0b1020;--bg-2:#0d1326;--line:#1c2842;--text:#e7ecf6;
        --brand:#22d3ee;--brand-2:#6366f1;
        --shadow:0 6px 24px rgba(0,0,0,.28);
        --r:16px;--pill:999px;
      }
      *{box-sizing:border-box}
      body{margin:0;background:var(--bg);color:var(--text);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"PingFang TC","Noto Sans TC",Arial}

      /* ===== Animated Gradient Background (Web3 風格) ===== */
      .bg-anim{
        position:fixed; inset:0; z-index:-1; overflow:hidden; pointer-events:none;
        background: radial-gradient(900px 600px at 15% -10%, #0d1630 0%, transparent 60%), var(--bg);
      }
      .blob{
        position:absolute; width:48vw; height:48vw; min-width:380px; min-height:380px;
        filter: blur(60px); opacity:.22; mix-blend-mode:screen; border-radius:50%;
        animation: float 22s ease-in-out infinite;
      }
      .blob.a{ left:-10vw; top:5vh;  background: radial-gradient(circle at 30% 30%, #22d3ee, transparent 60%); }
      .blob.b{ right:-12vw; top:-6vh; background: radial-gradient(circle at 70% 40%, #6366f1, transparent 60%); animation-delay:-6s;}
      .blob.c{ left:20vw; bottom:-12vh; background: radial-gradient(circle at 50% 60%, #14b8a6, transparent 60%); animation-delay:-12s;}
      @keyframes float{
        0%,100%{ transform:translate3d(0,0,0) scale(1); }
        50%{ transform:translate3d(2vw, -2vh, 0) scale(1.06); }
      }

      /* ===== Topbar ===== */
      .topbar{background:rgba(13,19,38,.75);backdrop-filter:saturate(160%) blur(10px);border-bottom:1px solid #18243d}
      .topbar-in{max-width:1080px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:12px 18px}
      .brand{display:flex;align-items:center;gap:10px}
      .logo{width:28px;height:28px;border-radius:10px;background:linear-gradient(135deg,var(--brand),var(--brand-2))}

      /* ===== Hero ===== */
      .hero{position:relative;overflow:hidden;border-bottom:1px solid rgba(255,255,255,.06)}
      .hero img{width:100%;height:38vh;object-fit:cover;opacity:.85}
      .shade{position:absolute;inset:0;background:linear-gradient(180deg,transparent 28%,rgba(5,8,16,.86) 92%)}
      .hero-ct{position:absolute;left:50%;transform:translateX(-50%);bottom:28px;width:min(1080px,94vw)}
      .h1{font-size:clamp(26px,5vw,40px);font-weight:900;margin:0 0 6px}

      /* ===== Layout / Card ===== */
      .wrap{max-width:1080px;margin:0 auto;padding:22px 16px}
      .card{background:var(--bg-2);border:1px solid rgba(255,255,255,.08);border-radius:var(--r);box-shadow:var(--shadow);padding:18px}
      .grid{display:grid;gap:16px}
      @media(min-width:900px){.grid{grid-template-columns:1fr 1fr}}
      h3{margin:0 0 10px;font-size:17px}

      .btn{padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:#111b30;color:var(--text);cursor:pointer}
      .btn.primary{border:none;background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#05121a;font-weight:700}

      /* ===== Partners Marquee ===== */
      .partners{padding:12px;border-radius:var(--r);background:#0c1328;margin-top:24px;border:1px solid rgba(255,255,255,.08)}
      .marquee{overflow:hidden}
      .track{display:flex;gap:20px;align-items:center;width:max-content;animation:scroll 12s linear infinite} /* 12s 更快 */
      .pill{min-width:120px;height:54px;padding:10px 14px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.03);
        border-radius:var(--pill);display:flex;align-items:center;gap:12px}
      .pill img{width:28px;height:28px;object-fit:contain}
      .pill span{font-weight:600;font-size:14px;white-space:nowrap}
      @keyframes scroll{from{transform:translateX(0)} to{transform:translateX(-50%)}}
    `
    document.head.appendChild(s)
    return () => { s.remove() }
  }, [])

  return (
    <div>
      {/* animated bg behind everything */}
      <div className="bg-anim">
        <div className="blob a" />
        <div className="blob b" />
        <div className="blob c" />
      </div>

      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-in">
          <div className="brand">
            <div className="logo" />
            <strong>攀越點</strong>
          </div>
          {isConnected ? (
            <button className="btn" onClick={() => disconnect()}>斷開連線</button>
          ) : (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {connectors.map(c => (
                <button key={c.uid} className="btn" onClick={() => connect({ connector:c })}>
                  連線：{c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hero */}
      <div className="hero">
        <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop" alt="" />
        <div className="shade" />
        <div className="hero-ct">
          <h1 className="h1">Bitget / Trust 相容 · 正式版介面</h1>
        </div>
      </div>

      {/* Content */}
      <div className="wrap">
        <div className="grid">
          <div className="card">
            <h3>連線狀態</h3>
            <div>狀態：{status}</div>
            {error && <div style={{ color:'#fca5a5' }}>錯誤：{String(error.message ?? error)}</div>}
            <div>地址：{address ?? '-'}</div>
            <div>鏈 ID：{chainId ?? '-'}</div>
          </div>
          <div className="card">
            <h3>餘額</h3>
            <div>原生幣：{nativeBal ? `${nativeBal.formatted} ${nativeBal.symbol}` : '-'}</div>
            <div>USDC：{usdc}</div>
            <button className="btn primary" style={{ marginTop:10 }} onClick={fetchUsdc}>重新讀取 USDC</button>
          </div>
        </div>

        {/* Partners Marquee with external logo URLs */}
        <div className="partners">
          <h3>合作夥伴</h3>
          <div className="marquee">
            <div className="track">
              {[
                { name:'Ethereum', logo:'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
                { name:'Binance',  logo:'https://cryptologos.cc/logos/binance-coin-bnb-logo.png' },
                { name:'Polygon',  logo:'https://cryptologos.cc/logos/polygon-matic-logo.png' },
                { name:'Arbitrum', logo:'https://cryptologos.cc/logos/arbitrum-arb-logo.png' },
                { name:'Optimism', logo:'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png' },
                { name:'Base',     logo:'https://cryptologos.cc/logos/base-2-logo.png' }
              ].map((p, i) => (
                <div className="pill" key={i}>
                  <img src={p.logo} alt={p.name} />
                  <span>{p.name}</span>
                </div>
              ))}
              {/* duplicate for seamless loop */}
              {[
                { name:'Ethereum', logo:'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
                { name:'Binance',  logo:'https://cryptologos.cc/logos/binance-coin-bnb-logo.png' },
                { name:'Polygon',  logo:'https://cryptologos.cc/logos/polygon-matic-logo.png' },
                { name:'Arbitrum', logo:'https://cryptologos.cc/logos/arbitrum-arb-logo.png' },
                { name:'Optimism', logo:'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png' },
                { name:'Base',     logo:'https://cryptologos.cc/logos/base-2-logo.png' }
              ].map((p, i) => (
                <div className="pill" key={`b-${i}`}>
                  <img src={p.logo} alt={p.name} />
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop:24 }}>
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

        <footer style={{ marginTop:24, textAlign:'center', opacity:.7 }}>
          © {new Date().getFullYear()} 攀越點
        </footer>
      </div>
    </div>
  )
}
