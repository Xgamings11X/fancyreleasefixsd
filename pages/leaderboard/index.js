import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Settings } from '../../lib/storage.js';
import FancyNav, { PlayerAvatar } from '../../components/FancyNav';
import LoginModal from '../../components/LoginModal';
import toast from 'react-hot-toast';

export function getServerSideProps() {
  try { return { props:{ settings: Settings.get() } }; }
  catch { return { props:{ settings:{} } }; }
}

const BOARDS = {
  balance:    { label:'Top Balance',    icon:'fa-coins',       color:'#f1c40f', unit:'Coins' },
  auraskills: { label:'Top AuraSkills', icon:'fa-wand-sparkles',color:'#9b59b6', unit:'Level' },
  votes:      { label:'Top Votes',      icon:'fa-star',        color:'var(--primary)', unit:'Vote' },
};

const RANK_COLORS = {1:'var(--gold)', 2:'var(--silver)', 3:'var(--bronze)'};
const RANK_ICONS  = {1:'fa-trophy', 2:'fa-medal', 3:'fa-award'};

function fmtScore(v, unit) {
  const n = Number(v||0);
  if (unit==='Coins' && n>=1000000) return (n/1000000).toFixed(1)+'M';
  if (n>=1000) return (n/1000).toFixed(1)+'K';
  return n.toLocaleString('id-ID');
}

export default function LeaderboardPage({ settings }) {
  const s = settings || {};
  const serverName = s.server_name || 'Fancy Network';

  const [player,    setPlayer]    = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [active,    setActive]    = useState('balance');
  const [data,      setData]      = useState({});
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    try { const r=localStorage.getItem('mc_player'); if(r) setPlayer(JSON.parse(r)); } catch{}
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const results = {};
    await Promise.all(Object.keys(BOARDS).map(async b => {
      try {
        const r = await fetch(`/api/leaderboard?board=${b}&limit=10`);
        const d = await r.json();
        if (d.success) results[b] = d.entries || [];
      } catch {}
    }));
    setData(results);
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout',{method:'POST',credentials:'include'});
    setPlayer(null); localStorage.removeItem('mc_player');
    toast.success('Berhasil keluar');
  };

  const board   = BOARDS[active];
  const entries = data[active] || [];

  return (
    <>
      <Head>
        <title>Leaderboard — {serverName}</title>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
      </Head>

      <FancyNav player={player} onLoginClick={()=>setShowLogin(true)} onLogout={async()=>{
        await fetch('/api/auth/logout',{method:'POST',credentials:'include'});
        setPlayer(null); localStorage.removeItem('mc_player'); toast.success('Berhasil keluar');
      }} settings={s}/>

      <div style={{padding:'130px 6% 80px', maxWidth:900, margin:'0 auto'}}>

        {/* Header */}
        <div style={{textAlign:'center', marginBottom:40}}>
          <span style={{color:'var(--primary)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:1.5,display:'block',marginBottom:8}}>HALL OF FAME</span>
          <h1 className="font-space" style={{fontSize:'clamp(24px,5vw,36px)',fontWeight:700,marginBottom:10}}>
            Papan <span style={{color:'var(--primary)'}}>Peringkat</span>
          </h1>
          <p style={{color:'var(--text-muted)',fontSize:14}}>Sinkron otomatis dari server • Diperbarui secara berkala</p>
        </div>

        {/* Board Tabs */}
        <div className="tabs-container" style={{marginBottom:32,maxWidth:500,margin:'0 auto 32px'}}>
          {Object.entries(BOARDS).map(([key,meta])=>(
            <button key={key} className={`tab-btn${active===key?' active':''}`}
              onClick={()=>setActive(key)}
              style={active===key ? {background:meta.color, boxShadow:`0 4px 15px ${meta.color}44`} : {}}>
              <i className={`fa-solid ${meta.icon}`}/> {meta.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:'80px 0'}}>
            <div className="fn-spinner" style={{width:40,height:40,borderWidth:3,margin:'0 auto 16px'}}/>
            <p style={{color:'var(--text-muted)'}}>Memuat data...</p>
          </div>

        ) : entries.length === 0 ? (
          <div style={{textAlign:'center',padding:'80px 0'}}>
            <i className={`fa-solid ${board.icon}`} style={{fontSize:48,color:'var(--text-muted)',display:'block',marginBottom:16}}/>
            <h3 className="font-space" style={{fontSize:20,marginBottom:8}}>Data Belum Tersedia</h3>
            <p style={{color:'var(--text-muted)',fontSize:13,marginBottom:24}}>Plugin akan sync otomatis sesuai konfigurasi di config.yml</p>
            <div className="fn-card" style={{display:'inline-block',padding:'16px 24px',textAlign:'left'}}>
              <p style={{fontSize:11,color:'var(--primary)',fontWeight:700,marginBottom:8,textTransform:'uppercase',letterSpacing:1}}>Config plugin (config.yml)</p>
              <pre style={{fontSize:12,color:'var(--text-muted)',lineHeight:1.6,fontFamily:'monospace'}}>{`leaderboards:\n  endpoint: "https://fancynet.my.id/api/plugin/leaderboard"\n  boards:\n    ${active}:\n      enabled: true`}</pre>
            </div>
          </div>

        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>

            {/* Top 3 Podium */}
            {entries.length >= 3 && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12,alignItems:'flex-end'}}>
                {[entries[1], entries[0], entries[2]].map((e, i) => {
                  const podRank = [2,1,3][i];
                  const col     = RANK_COLORS[podRank];
                  const heights = ['160px','200px','140px'];
                  return (
                    <div key={e.rank}
                      style={{height:heights[i],background:`rgba(0,0,0,0.3)`,border:`1px solid ${col}44`,borderRadius:16,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,padding:16,transition:'transform 0.2s'}}
                      className="fn-card">
                      <i className={`fa-solid ${RANK_ICONS[podRank]}`} style={{fontSize:22,color:col}}/>
                      <PlayerAvatar uuid={e.player} username={e.player} size={podRank===1?44:36}/>
                      <span style={{fontWeight:700,fontSize:podRank===1?14:12,color:'#fff',textAlign:'center',wordBreak:'break-word',lineHeight:1.3}}>{e.player}</span>
                      <span className="font-space" style={{fontWeight:700,color:col,fontSize:podRank===1?16:13}}>
                        {fmtScore(e.score,board.unit)}
                      </span>
                      <span style={{fontSize:9,color:col,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5}}>#{podRank}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full list */}
            {entries.map(e => {
              const isTop3 = e.rank <= 3;
              const rankCol = RANK_COLORS[e.rank];
              return (
                <div key={e.rank}
                  className={`lb-row${e.rank===1?' rank-1':e.rank===2?' rank-2':e.rank===3?' rank-3':''}`}>
                  {/* Rank number */}
                  <div style={{width:40,flexShrink:0,textAlign:'center'}}>
                    {isTop3
                      ? <i className={`fa-solid ${RANK_ICONS[e.rank]}`} style={{fontSize:20,color:rankCol}}/>
                      : <span style={{fontWeight:700,color:'var(--text-muted)',fontSize:15}}>#{e.rank}</span>
                    }
                  </div>

                  {/* Avatar */}
                  <PlayerAvatar uuid={e.player} username={e.player} size={36}/>

                  {/* Name */}
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontWeight:700,fontSize:14,color:isTop3?rankCol:'#fff',truncate:true,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.player}</p>
                  </div>

                  {/* Score */}
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <p className="font-space" style={{fontWeight:700,fontSize:15,color:isTop3?rankCol:board.color}}>{fmtScore(e.score,board.unit)}</p>
                    <p style={{fontSize:10,color:'var(--text-muted)',fontWeight:600}}>{board.unit}</p>
                  </div>
                </div>
              );
            })}

            {/* Last sync */}
            {data[active] && (
              <p style={{textAlign:'center',color:'var(--text-muted)',fontSize:11,marginTop:12}}>
                <i className="fa-solid fa-rotate" style={{marginRight:4}}/>
                Data diperbarui otomatis oleh plugin sesuai interval konfigurasi
              </p>
            )}
          </div>
        )}
      </div>

      <footer className="fn-footer">
        <p style={{fontSize:11,color:'#44444a'}}>© 2026 {serverName}. Leaderboard</p>
      </footer>

      {showLogin && <LoginModal onClose={()=>setShowLogin(false)} onSuccess={p=>{setPlayer(p);localStorage.setItem('mc_player',JSON.stringify(p));setShowLogin(false);}}/>}
    </>
  );
}
