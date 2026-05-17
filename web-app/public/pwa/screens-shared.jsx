// screens-shared.jsx - Notifications, Push permission, Offline

function NotificationsScreen({ go, back = 'home' }) {
  const toast = useToast();
  const groups = [
    { label: 'Today', items: window.MOCK.NOTIFICATIONS.slice(0, 3) },
    { label: 'Earlier', items: window.MOCK.NOTIFICATIONS.slice(3) },
  ];
  const iconMap = {
    booking: { ico: 'check-circle-2', color: 'var(--success)', bg: 'var(--primary-100)' },
    payment: { ico: 'banknote', color: 'var(--primary)', bg: 'var(--primary-100)' },
    job: { ico: 'briefcase', color: '#1E5A87', bg: 'var(--sky-100)' },
    warning: { ico: 'alert-triangle', color: '#92400E', bg: '#FEF3C7' },
    subscription: { ico: 'clock', color: 'var(--danger)', bg: '#FEE2E2' },
    cancel: { ico: 'x-circle', color: 'var(--danger)', bg: '#FEE2E2' },
  };

  return (
    <div className="app-body" style={{paddingBottom: 110}}>
      <TopBar
        title="Notifications"
        subtitle="3 unread"
        onBack={() => go(back)}
        right={
          <button style={{fontSize:11.5,fontWeight:600,color:'var(--primary)',padding:'8px 10px'}} onClick={() => toast('All marked as read', 'info')}>
            Mark all read
          </button>
        }
      />
      <div style={{padding:'0 16px'}}>
        {groups.map(g => (
          <div key={g.label} style={{marginTop:8}}>
            <div style={{fontSize:11,color:'var(--text-3)',fontWeight:600,letterSpacing:0.04,textTransform:'uppercase',padding:'8px 4px'}}>{g.label}</div>
            <div className="stack" style={{gap:8}}>
              {g.items.map((n, i) => {
                const m = iconMap[n.type];
                return (
                  <div key={i} className={`notif ${n.unread ? 'unread' : ''}`}>
                    {n.unread && <div style={{position:'absolute',top:14,left:-4,width:6,height:6,borderRadius:'50%',background:'var(--primary)'}} />}
                    <div className="ico" style={{background: m.bg, color: m.color}}>
                      <Icon name={m.ico} size={16} color={m.color} />
                    </div>
                    <div className="body">
                      <strong>{n.title}</strong>
                      <p>{n.body}</p>
                      <div className="time">{n.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PushPermissionScreen({ go, back = 'home' }) {
  const toast = useToast();
  return (
    <div className="app-body" style={{padding:'40px 24px 32px',display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center'}}>
      <div style={{width:120,height:120,borderRadius:30,background:'var(--primary-100)',display:'grid',placeItems:'center',marginBottom:28,position:'relative'}}>
        <Icon name="bell-ring" size={52} color="var(--primary)" />
        <div style={{position:'absolute',top:6,right:-6,width:24,height:24,borderRadius:'50%',background:'var(--danger)',display:'grid',placeItems:'center',color:'#fff',fontWeight:700,fontSize:12,boxShadow:'0 4px 12px rgba(192,57,43,0.3)'}}>3</div>
      </div>
      <h1 style={{fontSize:24,fontWeight:800,margin:'0 0 8px',letterSpacing:'-0.02em'}}>Stay in the loop</h1>
      <p style={{fontSize:14,color:'var(--text-2)',margin:'0 0 28px',lineHeight:1.5,maxWidth:300}}>
        Get instant updates on bookings, payments, and safari changes.
      </p>

      <div className="stack" style={{gap:14,width:'100%',marginBottom:28,textAlign:'left'}}>
        {[
          {ico:'check-circle-2', title:'Booking confirmations', sub:'Know when seats sell out instantly'},
          {ico:'credit-card', title:'Payment reminders', sub:'Never miss a vendor payout'},
          {ico:'map', title:'Safari alerts', sub:'Weather, route, and last-minute changes'},
        ].map((b, i) => (
          <div key={i} className="row" style={{gap:14}}>
            <div style={{width:38,height:38,borderRadius:11,background:'var(--primary-100)',display:'grid',placeItems:'center',flex:'0 0 38px'}}>
              <Icon name={b.ico} size={18} color="var(--primary)" />
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13.5,fontWeight:600}}>{b.title}</div>
              <div style={{fontSize:12,color:'var(--text-3)',marginTop:1}}>{b.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-primary btn-lg btn-block" onClick={() => { toast('Notifications enabled'); go(back); }}>
        <Icon name="bell" size={16} color="#fff" /> Enable Notifications
      </button>
      <button style={{marginTop:14,fontSize:13,color:'var(--text-3)',fontWeight:600,padding:8}} onClick={() => go(back)}>
        Maybe later
      </button>
    </div>
  );
}

function OfflineScreen({ go }) {
  return (
    <div className="app-body" style={{padding:'40px 24px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',height:'100%'}}>
      <div style={{width:180,height:140,marginBottom:28,position:'relative'}}>
        {/* Mini safari illustration */}
        <svg viewBox="0 0 180 140" width="180" height="140">
          {/* Sky */}
          <rect width="180" height="100" fill="#E1F2FA" rx="14" />
          {/* Sun */}
          <circle cx="135" cy="35" r="14" fill="#FFE8A6" opacity="0.7" />
          {/* Hills */}
          <ellipse cx="40" cy="105" rx="60" ry="22" fill="#94A89A" />
          <ellipse cx="120" cy="110" rx="80" ry="28" fill="#5B7C58" />
          {/* Ground */}
          <rect y="100" width="180" height="40" fill="#5B7C58" rx="14" />
          {/* Lone tree */}
          <rect x="40" y="76" width="3" height="22" fill="#3A2818" />
          <circle cx="41.5" cy="74" r="12" fill="#3F5C3D" />
          {/* No signal overlay */}
          <line x1="20" y1="20" x2="160" y2="120" stroke="#C0392B" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        </svg>
      </div>
      <h1 style={{fontSize:22,fontWeight:800,margin:'0 0 8px',letterSpacing:'-0.02em'}}>You're offline</h1>
      <p style={{fontSize:14,color:'var(--text-2)',margin:'0 0 24px',lineHeight:1.5,maxWidth:280}}>
        We've saved your last view. Reconnect to sync new bookings.
      </p>
      <div style={{padding:'10px 14px',background:'var(--bg)',borderRadius:10,fontSize:11.5,color:'var(--text-3)',marginBottom:24,display:'flex',alignItems:'center',gap:8}}>
        <Icon name="refresh-cw" size={13} />
        Last synced 4 minutes ago
      </div>
      <button className="btn btn-primary btn-lg btn-block" onClick={() => go('home')}>
        <Icon name="refresh-cw" size={16} color="#fff" /> Retry connection
      </button>
    </div>
  );
}

Object.assign(window, { NotificationsScreen, PushPermissionScreen, OfflineScreen });
