// src/App.tsx
import { useState } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [lang, setLang] = useState<'zh' | 'en'>('zh')

  async function fetchUsdc() {
    if (!address || !chainId || !USDC[chainId]) return setUsdc('-')
    try {
      const [raw, decimals] = await Promise.all([
        readContract(wagmiConfig, { address: USDC[chainId], abi: erc20Abi, functionName: 'balanceOf', args: [address] }),
        readContract(wagmiConfig, { address: USDC[chainId], abi: erc20Abi, functionName: 'decimals' }),
      ])
      setUsdc(formatUnits(raw as bigint, Number(decimals)))
    } catch {
      setUsdc('讀取失敗')
    }
  }

  const links = {
    whitepaper: 'https://example.com/whitepaper.pdf',
    help: 'https://example.com/help-center',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F1A', color: 'white', fontFamily: 'ui-sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #1f2937' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#22d3ee,#6366f1)', borderRadius: 8 }} />
          <strong>{lang === 'zh' ? '悟淨・DeFi DApp' : 'Wujing • DeFi DApp'}</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!isConnected ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {connectors.map(c => (
                <button key={c.uid} onClick={() => connect({ connector: c })}
                  style={{ padding: '8px 12px', background: '#111827', border: '1px solid #374151', borderRadius: 8, cursor: 'pointer' }}>
                  {lang === 'zh' ? '連線' : 'Connect'} {c.name}
                </button>
              ))}
            </div>
          ) : (
            <button onClick={() => disconnect()}
              style={{ padding: '8px 12px', background: '#111827', border: '1px solid #374151', borderRadius: 8, cursor: 'pointer' }}>
              {lang === 'zh' ? '斷開連線' : 'Disconnect'}
            </button>
          )}

          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(v => !v)} aria-haspopup="menu" aria-expanded={menuOpen}
              style={{ padding: '8px 12px', background: '#0ea5e9', borderRadius: 8, cursor: 'pointer', border: 'none' }}>
              {lang === 'zh' ? '選單' : 'Menu'}
            </button>

            {menuOpen && (
              <div role="menu"
                style={{ position: 'absolute', right: 0, marginTop: 8, minWidth: 200, background: '#0f172a',
                         border: '1px solid #1f2937', borderRadius: 10, padding: 8, zIndex: 10 }}>
                <a href={links.whitepaper} target="_blank" rel="noreferrer"
                   style={{ display: 'block', padding: 10, borderRadius: 8, textDecoration: 'none', color: 'white' }}>
                  📄 {lang === 'zh' ? '白皮書' : 'Whitepaper'}
                </a>
                <a href={links.help} target="_blank" rel="noreferrer"
                   style={{ display: 'block', padding: 10, borderRadius: 8, textDecoration: 'none', color: 'white' }}>
                  💬 {lang === 'zh' ? '幫助中心' : 'Help Center'}
                </a>
                <div style={{ height: 1, background: '#1f2937', margin: '6px 0' }} />
                <div style={{ padding: 10, display: 'flex', gap: 8 }}>
                  <button onClick={() => setLang('zh')}
                    style={{ padding: '6px 10px', borderRadius: 6, background: lang === 'zh' ? '#2563eb' : '#111827',
                             border: '1px solid #374151', color: 'white', cursor: 'pointer' }}>
                    中文
                  </button>
                  <button onClick={() => setLang('en')}
                    style={{ padding: '6px 10px', borderRadius: 6, background: lang === 'en' ? '#2563eb' : '#111827',
                             border: '1px solid #374151', color: 'white', cursor: 'pointer' }}>
                    EN
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: 28, marginBottom: 14 }}>
          {lang === 'zh' ? 'Bitget / Trust 相容・正式版介面' : 'Bitget / Trust Compatible • Pro UI'}
        </h1>
        <p style={{ opacity: 0.8, marginBottom: 24 }}>
          {lang === 'zh' ? '支援 Injected（錢包內建瀏覽器）與 WalletConnect v2。' : 'Supports Injected (in-app browser) & WalletConnect v2.'}
        </p>

        <section style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 12, padding: 18, marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>{lang === 'zh' ? '連線狀態' : 'Connection'}</h2>
          <div style={{ fontSize: 14 }}>
            <div>{lang === 'zh' ? '狀態' : 'Status'}：{status}</div>
            {error && <div style={{ color: '#fca5a5' }}>{lang === 'zh' ? '錯誤' : 'Error'}：{String(error.message ?? error)}</div>}
            <div>{lang === 'zh' ? '地址' : 'Address'}：{address ?? '-'}</div>
            <div>Chain ID：{chainId ?? '-'}</div>
          </div>
        </section>

        <section style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 12, padding: 18, marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>{lang === 'zh' ? '餘額' : 'Balances'}</h2>
          <div style={{ fontSize: 14 }}>
            <div>{lang === 'zh' ? '原生幣' : 'Native'}：{nativeBal ? `${nativeBal.formatted} ${nativeBal.symbol}` : '-'}</div>
            <div>USDC：{usdc}</div>
            <button onClick={fetchUsdc}
              style={{ marginTop: 10, padding: '8px 12px', background: '#1d4ed8', borderRadius: 8, cursor: 'pointer', border: 'none' }}>
              {lang === 'zh' ? '重新讀取 USDC' : 'Refresh USDC'}
            </button>
          </div>
        </section>

        <section style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 12, padding: 18 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>{lang === 'zh' ? '切換鏈' : 'Switch Chain'}</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {supportedChains.map(c => (
              <button key={c.id}
                onClick={async () => {
                  const provider = (window as any).ethereum
                  if (!provider?.request) return alert(lang === 'zh' ? '未偵測到以太坊提供者' : 'No Ethereum provider detected')
                  try {
                    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: `0x${c.id.toString(16)}` }] })
                  } catch (e: any) {
                    if (e?.code === 4902) {
                      await provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{ chainId: `0x${c.id.toString(16)}`, chainName: c.name, nativeCurrency: c.nativeCurrency, rpcUrls: c.rpcUrls.default.http }],
                      })
                    }
                  }
                }}
                style={{ padding: '8px 12px', background: '#111827', border: '1px solid #374151', borderRadius: 8, cursor: 'pointer' }}>
                {c.name}
              </button>
            ))}
          </div>
        </section>
      </main>

      <footer style={{ textAlign: 'center', padding: 20, opacity: 0.6, fontSize: 12 }}>© 2025 悟淨・DeFi DApp</footer>
    </div>
  )
}
