// components.jsx - shared components
const { useState, useEffect, useRef, createContext, useContext } = React;

// ---- Icon helper (lucide) ----
function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 2, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && window.lucide) {
      // lucide UMD attaches createIcons that walks [data-lucide] elements.
      // We just set the attribute on a child <i> and call createIcons.
      ref.current.innerHTML = `<i data-lucide="${name}" style="display:inline-flex;width:${size}px;height:${size}px;"></i>`;
      try { window.lucide.createIcons({ attrs: { 'stroke-width': strokeWidth, width: size, height: size }, nameAttr: 'data-lucide' }); }
      catch (e) {}
    }
  }, [name, size, color, strokeWidth]);
  return <span ref={ref} className={`icon ${className}`} style={{display:'inline-flex',width:size,height:size,alignItems:'center',justifyContent:'center',color}} />;
}

// ---- Toast context ----
const ToastCtx = createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = (msg, kind = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600);
  };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-host">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.kind}`}>
            <Icon name={t.kind === 'error' ? 'x-circle' : t.kind === 'info' ? 'info' : 'check-circle-2'} size={18} color="#fff" />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast = () => useContext(ToastCtx);

// ---- Status bar (iOS-style) ----
function StatusBar() {
  return (
    <div className="status-bar">
      <span>9:41</span>
      <div className="bars">
        <Icon name="signal" size={14} />
        <Icon name="wifi" size={14} />
        <Icon name="battery-full" size={18} />
      </div>
    </div>
  );
}

// ---- Top bar ----
function TopBar({ title, subtitle, onBack, onBell, notifCount = 3, avatar, right, scrolled }) {
  return (
    <div className={`top-bar ${scrolled ? 'scrolled' : ''}`}>
      <div className="row" style={{gap: 12, flex: 1, minWidth: 0}}>
        {onBack && (
          <button onClick={onBack} className="bell" style={{background:'transparent',border:'none'}}>
            <Icon name="arrow-left" size={20} />
          </button>
        )}
        {avatar && <div className="avatar-sm">{avatar}</div>}
        <div style={{flex: 1, minWidth: 0}}>
          {subtitle && <div className="greet">{subtitle}</div>}
          <h1 style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title}</h1>
        </div>
      </div>
      <div className="row" style={{gap: 8}}>
        {right}
        {onBell && (
          <button className="bell" onClick={onBell}>
            <Icon name="bell" size={18} />
            {notifCount > 0 && <span className="badge">{notifCount}</span>}
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Bottom nav ----
function BottomNav({ tabs, active, onChange }) {
  return (
    <nav className="bottom-nav" role="navigation">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`nav-tab ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          <Icon name={t.icon} size={22} strokeWidth={active === t.id ? 2.4 : 1.8} />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ---- Stat Card ----
function StatCard({ icon, label, value, trend, trendDir = 'up', bg = 'var(--primary-100)', fg = 'var(--primary)' }) {
  return (
    <div className="stat-card">
      <div className="stat-ico" style={{background: bg, color: fg}}>
        <Icon name={icon} size={16} />
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value tnum">{value}</div>
      {trend && (
        <span className={`stat-trend ${trendDir}`}>
          <Icon name={trendDir === 'up' ? 'trending-up' : 'trending-down'} size={11} />
          {trend}
        </span>
      )}
    </div>
  );
}

// ---- Safari Card ----
function SafariThumb({ index = 0, type, name }) {
  const sil = index % 2 === 0
    ? [{w: 24, h: 26}, {w: 14, h: 14}, {w: 18, h: 20}] // elephant-ish + tree
    : [{w: 18, h: 22}, {w: 22, h: 14}, {w: 12, h: 18}];
  return (
    <div className={`safari-thumb alt-${index}`}>
      <div className="sun" />
      <div className="terrain" />
      <div className="silhouette">
        {sil.map((s, i) => (
          <div key={i} style={{width: s.w, height: s.h, borderRadius: i === 1 ? '50% 50% 0 0 / 80% 80% 0 0' : '4px 4px 0 0'}} />
        ))}
      </div>
      {type === 'private' && (
        <div style={{position:'absolute',top:12,left:12,zIndex:3}}>
          <span className="badge private" style={{background:'rgba(255,255,255,0.95)',color:'#5C3A1F'}}>
            <Icon name="lock" size={10} /> Private
          </span>
        </div>
      )}
    </div>
  );
}

function SafariCard({ safari, onClick, dense }) {
  const paid = safari.paidSeats || 0;
  const reserved = safari.reservedSeats || 0;
  const total = safari.totalSeats || safari.seats || 6;
  const min = safari.minSeats || 4;
  const filledPct = ((paid + reserved) / total) * 100;
  const paidPct = (paid / total) * 100;
  const minPct = (min / total) * 100;
  const isConfirmed = safari.status === 'CONFIRMED' || safari.status === 'PENDING_PAYMENT';
  const remaining = min - paid;

  return (
    <button className="safari-card" onClick={onClick} style={{textAlign:'left',width:'100%',display:'block'}}>
      <SafariThumb index={safari.thumb} type={safari.type} name={safari.name} />
      <div className="safari-card-body">
        <div className="row between" style={{alignItems:'flex-start',marginBottom: 4}}>
          <div style={{flex:1,minWidth:0}}>
            <div className="safari-card-title">{safari.name}</div>
            <div className="safari-card-meta" style={{marginBottom:0}}>
              <Icon name="map-pin" size={12} />
              <span>{safari.location}</span>
              <span style={{margin:'0 4px'}}>·</span>
              <Icon name="clock" size={12} />
              <span>{safari.time}</span>
            </div>
          </div>
          {safari.status && safari.status !== 'OPEN' && (
            <Badge kind={safari.status}>
              {safari.status === 'PENDING_PAYMENT' ? 'Paying' : safari.status === 'CONFIRMED' ? 'Confirmed' : safari.status}
            </Badge>
          )}
        </div>

        <div style={{marginTop: 12}}>
          <div className="occ-bar">
            <div className="fill">
              <div className="paid" style={{width: paidPct + '%'}} />
              <div className="reserved" style={{width: ((reserved / total) * 100) + '%'}} />
            </div>
            <div className="min-mark" style={{left: `calc(${minPct}% - 1px)`, top: 0, bottom: 0}} />
          </div>
          <div className="row between" style={{marginTop:8}}>
            <div style={{fontSize:11,color:'var(--text-2)',fontWeight:600}}>
              {isConfirmed ? (
                <span style={{color:'var(--success)'}}>
                  <Icon name="check-circle-2" size={11} style={{marginRight:3,verticalAlign:'-2px'}} />
                  4-seat minimum hit
                </span>
              ) : (
                <span style={{color: remaining <= 1 ? 'var(--brown)' : 'var(--text-2)'}}>
                  {paid}/{min} paid · need {remaining} more
                </span>
              )}
            </div>
            <div className="price" style={{fontSize:15}}>LKR {safari.price.toLocaleString()} <small>/seat</small></div>
          </div>
        </div>
      </div>
    </button>
  );
}

// ---- Chips row ----
function Chips({ items, active, onChange }) {
  return (
    <div className="chips">
      {items.map(it => (
        <button
          key={it.id || it}
          className={`chip ${active === (it.id || it) ? 'active' : ''}`}
          onClick={() => onChange(it.id || it)}
        >
          {it.label || it}
        </button>
      ))}
    </div>
  );
}

// ---- Tabs ----
function Tabs({ items, active, onChange }) {
  return (
    <div className="tabs">
      {items.map(it => (
        <button
          key={it.id || it}
          className={active === (it.id || it) ? 'active' : ''}
          onClick={() => onChange(it.id || it)}
        >
          {it.label || it}
        </button>
      ))}
    </div>
  );
}

// ---- Bar chart ----
function BarChart({ data, max, highlight = -1 }) {
  const m = max || Math.max(...data);
  return (
    <>
      <div className="bar-chart">
        {data.map((v, i) => (
          <div
            key={i}
            className={`bar ${i === highlight ? 'highlight' : ''} ${v / m < 0.25 ? 'muted' : ''}`}
            style={{height: `${(v / m) * 100}%`}}
          />
        ))}
      </div>
    </>
  );
}

// ---- Donut chart ----
function Donut({ segments, value, label }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 50;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="donut">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line-soft)" strokeWidth="14" />
        {segments.map((s, i) => {
          const len = (s.value / total) * C;
          const el = (
            <circle
              key={i}
              cx="60" cy="60" r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="donut-center">
        <div>
          <div className="val tnum">{value}</div>
          <div className="lbl">{label}</div>
        </div>
      </div>
    </div>
  );
}

// ---- Switch ----
function Switch({ value, onChange }) {
  return <div className={`switch ${value ? 'on' : ''}`} onClick={() => onChange(!value)} />;
}

// ---- Badge ----
function Badge({ kind, children, icon }) {
  return (
    <span className={`badge ${kind}`}>
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  );
}

// ---- Sheet (mobile bottom sheet) ----
function Sheet({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        {title && <h3 style={{margin:'0 0 14px',fontSize:17,fontWeight:700}}>{title}</h3>}
        {children}
      </div>
    </div>
  );
}

// ---- Map placeholder ----
function MapPlaceholder({ height = 140, pin }) {
  return (
    <div style={{
      height,
      borderRadius: 14,
      background:
        'linear-gradient(135deg, #DDE8DC 0%, #E8E4D2 100%)',
      backgroundImage: `
        linear-gradient(135deg, #DDE8DC 0%, #E8E4D2 100%),
        repeating-linear-gradient(0deg, transparent 0 19px, rgba(0,0,0,0.04) 19px 20px),
        repeating-linear-gradient(90deg, transparent 0 19px, rgba(0,0,0,0.04) 19px 20px)
      `,
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid var(--line)',
    }}>
      <div style={{
        position:'absolute',
        inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 19px, rgba(0,0,0,0.05) 19px 20px), repeating-linear-gradient(90deg, transparent 0 19px, rgba(0,0,0,0.05) 19px 20px)',
      }} />
      {/* fake road */}
      <svg width="100%" height="100%" style={{position:'absolute',inset:0}}>
        <path d="M 0 70 Q 80 40 160 90 T 360 100" stroke="#fff" strokeWidth="6" fill="none" opacity="0.8" />
        <path d="M 0 70 Q 80 40 160 90 T 360 100" stroke="#B8C2B8" strokeWidth="2" strokeDasharray="6 6" fill="none" />
      </svg>
      {/* pin */}
      {pin !== false && (
        <div style={{
          position:'absolute',
          left: '52%', top: '38%',
          transform: 'translate(-50%, -100%)',
          color: 'var(--primary)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            background: 'var(--primary)',
            boxShadow: '0 4px 12px rgba(45,106,79,0.35)',
            display:'grid',placeItems:'center',
          }}>
            <div style={{transform:'rotate(45deg)'}}>
              <Icon name="map-pin" size={14} color="#fff" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  Icon, ToastProvider, useToast,
  StatusBar, TopBar, BottomNav,
  StatCard, SafariThumb, SafariCard,
  Chips, Tabs, BarChart, Donut,
  Switch, Badge, Sheet, MapPlaceholder,
});
