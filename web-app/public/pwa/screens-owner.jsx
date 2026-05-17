// screens-owner.jsx - Owner dashboard, safaris, create, payments, revenue

function OwnerHomeScreen({ go }) {
  return (
    <div className="app-body" style={{paddingBottom:110}}>
      <TopBar
        avatar="W"
        subtitle="Good morning"
        title="Wild Lanka Co."
        onBell={() => go('notifications')}
        notifCount={3}
      />

      <div style={{padding:'4px 16px 0'}}>
        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <StatCard icon="ticket" label="Bookings" value="148" trend="+12%" trendDir="up" />
          <StatCard icon="trending-up" label="Revenue" value="LKR 2.4M" trend="+18%" trendDir="up" bg="var(--sand-soft)" fg="var(--brown)" />
          <StatCard icon="map" label="Active Safaris" value="6" trend="2 today" trendDir="up" bg="var(--sky-100)" fg="#1E5A87" />
          <StatCard icon="alert-circle" label="Pending Pay" value="LKR 28K" trend="3 vendors" trendDir="down" bg="#FEF3C7" fg="#92400E" />
        </div>

        {/* Quick actions */}
        <div className="row" style={{gap:10,marginTop:14}}>
          <button className="btn btn-primary" style={{flex:1,padding:'14px 12px',fontSize:13}} onClick={() => go('createShared')}>
            <Icon name="plus" size={16} color="#fff" /> New Shared
          </button>
          <button className="btn btn-secondary" style={{flex:1,padding:'14px 12px',fontSize:13}} onClick={() => go('createPrivate')}>
            <Icon name="user-plus" size={16} /> New Private
          </button>
        </div>

        {/* Revenue mini chart */}
        <div className="card card-pad" style={{marginTop:14}}>
          <div className="row between" style={{marginBottom:10}}>
            <div>
              <div style={{fontSize:11,color:'var(--text-3)',fontWeight:600,letterSpacing:0.04,textTransform:'uppercase'}}>Last 7 days</div>
              <div style={{fontSize:18,fontWeight:700,letterSpacing:'-0.01em'}}>LKR 412,800</div>
            </div>
            <button className="btn btn-ghost" style={{padding:'6px 10px',fontSize:11.5}} onClick={() => go('revenue')}>View all →</button>
          </div>
          <BarChart data={[40,62,55,80,48,92,72]} highlight={5} />
          <div className="bar-labels">
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
          </div>
        </div>

        {/* Recent bookings */}
        <div className="section-head" style={{marginTop:18}}>
          <h2>Recent Bookings</h2>
          <a href="#" onClick={e => { e.preventDefault(); go('shared'); }}>See all</a>
        </div>
        <div className="stack" style={{gap:8}}>
          {window.MOCK.OWNER_BOOKINGS.slice(0,4).map(b => (
            <div key={b.id} className="card card-pad row" style={{gap:12,padding:'12px 14px'}}>
              <div className="avatar-sm">{b.name.split(' ').map(p=>p[0]).slice(0,2).join('')}</div>
              <div style={{flex:1,minWidth:0}}>
                <div className="row between">
                  <div style={{fontSize:13.5,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.name}</div>
                  <Badge kind={b.status === 'pending' ? 'pending' : 'confirmed'}>{b.status}</Badge>
                </div>
                <div className="row between" style={{marginTop:2}}>
                  <span style={{fontSize:11.5,color:'var(--text-3)'}}>{b.safari} · {b.seats} seat{b.seats > 1 ? 's' : ''}</span>
                  <span style={{fontSize:12.5,fontWeight:600,color:'var(--primary)'}} className="tnum">LKR {(b.amount/1000).toFixed(1)}K</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SharedSafarisScreen({ go }) {
  const [pulled, setPulled] = useState(false);
  return (
    <div className="app-body" style={{paddingBottom:120,position:'relative'}}>
      <TopBar title="Shared Safaris" subtitle="6 active · 2 drafts" onBell={() => go('notifications')} notifCount={3} />

      {pulled && (
        <div style={{position:'absolute',top:60,left:'50%',transform:'translateX(-50%)',background:'var(--surface)',padding:'8px 14px',borderRadius:999,boxShadow:'var(--shadow)',display:'flex',alignItems:'center',gap:8,zIndex:20,fontSize:11.5,fontWeight:600}}>
          <Icon name="refresh-cw" size={14} color="var(--primary)" /> Refreshing…
        </div>
      )}

      <div style={{padding:'0 16px'}}>
        <Chips items={['All','Today','This Week','Drafts']} active="All" onChange={() => {}} />
        <div style={{margin:'10px 0 16px',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontSize:11,color:'var(--text-3)'}} onClick={() => { setPulled(true); setTimeout(() => setPulled(false), 1200); }}>
          <Icon name="arrow-down" size={11} /> Pull to refresh
        </div>
        <div className="stack" style={{gap:12}}>
          {window.MOCK.SAFARIS.map((s, i) => (
            <div key={s.id} className="card" style={{overflow:'hidden',position:'relative'}}>
              <div className="row" style={{padding: 12, gap: 14}}>
                <div className={`safari-thumb alt-${s.thumb}`} style={{width: 68, height: 68, borderRadius: 12, flex: '0 0 68px', position:'relative'}}>
                  <div className="sun" style={{width:14,height:14,top:8,right:8}} />
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="row between" style={{marginBottom:4}}>
                    <div style={{fontSize:14.5,fontWeight:700}}>{s.name}</div>
                    <Badge kind={i === 3 ? 'draft' : 'active'}>{i === 3 ? 'Draft' : 'Active'}</Badge>
                  </div>
                  <div style={{fontSize:11.5,color:'var(--text-3)'}}>{s.date} · {s.time} · {s.duration}</div>
                  <div className="row between" style={{marginTop:8}}>
                    <div style={{fontSize:12,color:'var(--text-2)'}}>
                      <span style={{fontWeight:600}}>{s.taken}/{s.seats}</span> seats filled
                    </div>
                    <div style={{fontSize:13,fontWeight:700,color:'var(--primary)'}} className="tnum">LKR {s.price.toLocaleString()}</div>
                  </div>
                  {/* progress bar */}
                  <div style={{height:4,background:'var(--line)',borderRadius:2,marginTop:6,overflow:'hidden'}}>
                    <div style={{height:'100%',width: `${(s.taken/s.seats)*100}%`,background: s.taken === s.seats ? 'var(--brown)' : 'var(--primary)',transition:'width 0.4s'}} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => go('createShared')}
        style={{
          position:'absolute',bottom:90,right:18,
          width:56,height:56,borderRadius:18,
          background:'var(--primary)',
          color:'#fff',
          boxShadow:'0 10px 24px rgba(45,106,79,0.4)',
          display:'grid',placeItems:'center',
          zIndex:20,
        }}
      >
        <Icon name="plus" size={26} color="#fff" />
      </button>
    </div>
  );
}

function CreateSharedSafariScreen({ go }) {
  const [type, setType] = useState('morning');
  const [seats, setSeats] = useState(6);
  const [price, setPrice] = useState(12500);
  const toast = useToast();
  return (
    <div className="app-body" style={{paddingBottom:120}}>
      <TopBar title="New Shared Safari" onBack={() => go('shared')} />
      <div style={{padding:'0 18px'}}>
        <div className="field">
          <label className="label">Park / location</label>
          <div className="input-icon-wrap">
            <Icon name="map-pin" size={16} className="input-icon" color="var(--text-3)" />
            <select className="select" style={{paddingLeft:40}} defaultValue="yala">
              <option value="yala">Yala National Park</option>
              <option value="uda">Udawalawe</option>
              <option value="wil">Wilpattu</option>
              <option value="min">Minneriya</option>
            </select>
          </div>
        </div>

        <div className="row" style={{gap:10}}>
          <div className="field grow">
            <label className="label">Date</label>
            <div className="input-icon-wrap">
              <Icon name="calendar" size={16} className="input-icon" color="var(--text-3)" />
              <input className="input" defaultValue="May 19, 2026" />
            </div>
          </div>
          <div className="field grow">
            <label className="label">Time</label>
            <div className="input-icon-wrap">
              <Icon name="clock" size={16} className="input-icon" color="var(--text-3)" />
              <input className="input" defaultValue="5:30 AM" />
            </div>
          </div>
        </div>

        <div className="field">
          <label className="label">Safari type</label>
          <div className="row" style={{gap:6}}>
            {[
              {id:'morning',label:'Morning',icon:'sunrise'},
              {id:'afternoon',label:'Afternoon',icon:'sun'},
              {id:'fullday',label:'Full Day',icon:'sun-medium'},
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                style={{
                  flex:1,
                  padding:'10px 8px',
                  borderRadius:10,
                  border: type === t.id ? '2px solid var(--primary)' : '1.5px solid var(--line)',
                  background: type === t.id ? 'var(--primary-100)' : 'var(--surface)',
                  display:'flex',flexDirection:'column',alignItems:'center',gap:4,
                  color: type === t.id ? 'var(--primary-700)' : 'var(--text-2)',
                  fontWeight: 600, fontSize: 12,
                }}
              >
                <Icon name={t.icon} size={16} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="row" style={{gap:10}}>
          <div className="field grow">
            <label className="label">Total seats</label>
            <div className="row" style={{gap:8}}>
              <button onClick={() => setSeats(Math.max(1, seats - 1))} style={{width:36,height:42,borderRadius:10,border:'1.5px solid var(--line)',background:'var(--surface)',fontSize:18,fontWeight:600}}>−</button>
              <input className="input" style={{textAlign:'center'}} value={seats} onChange={e => setSeats(parseInt(e.target.value) || 0)} />
              <button onClick={() => setSeats(seats + 1)} style={{width:36,height:42,borderRadius:10,border:'1.5px solid var(--line)',background:'var(--surface)',fontSize:18,fontWeight:600}}>+</button>
            </div>
          </div>
          <div className="field grow">
            <label className="label">Price / seat</label>
            <div className="input-icon-wrap">
              <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'var(--text-3)',fontWeight:600}}>LKR</span>
              <input className="input" style={{paddingLeft:46}} value={price} onChange={e => setPrice(parseInt(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        <div className="field">
          <label className="label">Assigned vendors</label>
          <div className="stack" style={{gap:8}}>
            {[
              {role:'Guide', name:'Pradeep Silva', icon:'user-check', assigned:true},
              {role:'Jeep', name:'Sunil Jeeps · 4×4', icon:'truck', assigned:true},
              {role:'Meals', name:'Mama Lanka Kitchen', icon:'utensils', assigned:true},
              {role:'Camera Rental', name:'+ Assign vendor', icon:'camera', assigned:false},
            ].map(v => (
              <div key={v.role} className="row" style={{gap:12,padding:'12px 14px',background: v.assigned ? 'var(--surface)' : 'var(--bg)',borderRadius:12,border: v.assigned ? '1px solid var(--line)' : '1.5px dashed var(--line)'}}>
                <div style={{width:36,height:36,borderRadius:10,background: v.assigned ? 'var(--primary-100)' : 'var(--line-soft)', display:'grid',placeItems:'center',flex:'0 0 36px'}}>
                  <Icon name={v.icon} size={16} color={v.assigned ? 'var(--primary)' : 'var(--text-3)'} />
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:'var(--text-3)',fontWeight:500}}>{v.role}</div>
                  <div style={{fontSize:13,fontWeight:600,color: v.assigned ? 'var(--text)' : 'var(--text-3)'}}>{v.name}</div>
                </div>
                {v.assigned && <Icon name="check-circle-2" size={18} color="var(--primary)" />}
              </div>
            ))}
          </div>
        </div>

        <div style={{padding:'14px 16px',background:'var(--sand-soft)',borderRadius:12,marginTop:14,marginBottom:18}}>
          <div className="row between">
            <span style={{fontSize:12,color:'var(--text-2)',fontWeight:500}}>Potential revenue</span>
            <span style={{fontSize:18,fontWeight:700,color:'var(--brown)'}} className="tnum">LKR {(seats * price).toLocaleString()}</span>
          </div>
          <div style={{fontSize:10.5,color:'var(--text-3)',marginTop:2}}>If all {seats} seats are filled at LKR {price.toLocaleString()}</div>
        </div>
      </div>

      <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'14px 18px 28px',background:'var(--surface)',borderTop:'1px solid var(--line)',display:'flex',gap:10,zIndex:20}}>
        <button className="btn btn-secondary" style={{flex:1,padding:'14px'}} onClick={() => { toast('Draft saved', 'info'); go('shared'); }}>
          Save Draft
        </button>
        <button className="btn btn-primary btn-lg" style={{flex:1.4}} onClick={() => { toast('Safari published'); go('shared'); }}>
          Publish
        </button>
      </div>
    </div>
  );
}

function VendorPaymentsScreen({ go }) {
  const [expanded, setExpanded] = useState(null);
  const toast = useToast();
  return (
    <div className="app-body" style={{paddingBottom:110}}>
      <TopBar title="Vendor Payments" subtitle="LKR 32,400 outstanding" onBell={() => go('notifications')} notifCount={3} />
      <div style={{padding:'4px 16px 0'}}>
        <div className="card card-pad" style={{marginBottom:16,background:'linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)',color:'#fff',border:'none'}}>
          <div style={{fontSize:11,opacity:0.8,fontWeight:600,letterSpacing:0.04,textTransform:'uppercase'}}>Total Outstanding</div>
          <div style={{fontSize:30,fontWeight:800,letterSpacing:'-0.02em',marginTop:2}} className="tnum">LKR 32,400</div>
          <div className="row" style={{marginTop:10,gap:14,fontSize:12}}>
            <div><span style={{opacity:0.7}}>This week:</span> <strong>LKR 18,400</strong></div>
            <div><span style={{opacity:0.7}}>Overdue:</span> <strong>2 vendors</strong></div>
          </div>
        </div>

        <div className="row between" style={{marginBottom: 12}}>
          <h2 style={{fontSize:14,fontWeight:700,margin:0}}>Vendors</h2>
          <Tabs items={[{id:'all',label:'All'},{id:'pending',label:'Pending'},{id:'paid',label:'Paid'}]} active="all" onChange={() => {}} />
        </div>

        <div className="stack" style={{gap:10}}>
          {window.MOCK.VENDORS_FOR_OWNER.map((v, i) => (
            <div key={v.name} className="card">
              <div className="row" style={{padding: 14, gap: 12}}>
                <div className="avatar-sm" style={{background: v.status === 'paid' ? '#94A89A' : 'var(--brown)'}}>{v.name.split(' ').map(p=>p[0]).slice(0,2).join('')}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="row between">
                    <div style={{fontSize:13.5,fontWeight:600}}>{v.name}</div>
                    <Badge kind={v.status === 'paid' ? 'active' : 'pending'}>{v.status === 'paid' ? 'Paid' : 'Pending'}</Badge>
                  </div>
                  <div className="row between" style={{marginTop:2}}>
                    <span style={{fontSize:11.5,color:'var(--text-3)'}}>{v.role}</span>
                    <span style={{fontSize:14,fontWeight:700,color: v.status === 'paid' ? 'var(--text-3)' : 'var(--text)'}} className="tnum">
                      LKR {v.owed.toLocaleString()}
                    </span>
                  </div>
                  <div className="row" style={{gap:8,marginTop:10}}>
                    <button onClick={() => setExpanded(expanded === v.name ? null : v.name)} style={{fontSize:11.5,color:'var(--primary)',fontWeight:600}}>
                      History {expanded === v.name ? '▴' : '▾'}
                    </button>
                    <div style={{flex:1}} />
                    {v.status === 'pending' && (
                      <button className="btn btn-primary" style={{padding:'7px 12px',fontSize:12}} onClick={() => toast(`Paid ${v.name}`)}>
                        Mark as Paid
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {expanded === v.name && (
                <div style={{padding:'0 14px 14px',borderTop:'1px solid var(--line-soft)'}}>
                  {[
                    {date:'May 10', amt: 6200, ref:'TX-9821', paid:true},
                    {date:'Apr 28', amt: 5400, ref:'TX-9760', paid:true},
                    {date:'Apr 14', amt: 7100, ref:'TX-9712', paid:true},
                  ].map(p => (
                    <div key={p.ref} className="row between" style={{padding:'10px 0',fontSize:12,borderBottom:'1px solid var(--line-soft)'}}>
                      <span>{p.date} · <span style={{color:'var(--text-3)',fontFamily:'JetBrains Mono'}}>{p.ref}</span></span>
                      <span style={{fontWeight:600}} className="tnum">LKR {p.amt.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RevenueAnalyticsScreen({ go }) {
  const [range, setRange] = useState('month');
  return (
    <div className="app-body" style={{paddingBottom:110}}>
      <TopBar title="Revenue" subtitle="Performance overview" onBell={() => go('notifications')} notifCount={3} right={<button className="bell" style={{width:'auto',padding:'0 12px',fontSize:11,fontWeight:600,color:'var(--text-2)'}}><Icon name="download" size={14} /></button>} />
      <div style={{padding:'4px 16px 0'}}>
        <Tabs items={[{id:'week',label:'Week'},{id:'month',label:'Month'},{id:'custom',label:'Custom'}]} active={range} onChange={setRange} />

        {/* Total revenue card */}
        <div className="card card-pad" style={{marginTop:14}}>
          <div className="row between" style={{marginBottom: 8}}>
            <div>
              <div style={{fontSize:11,color:'var(--text-3)',fontWeight:600,letterSpacing:0.04,textTransform:'uppercase'}}>Revenue · May</div>
              <div style={{fontSize:28,fontWeight:800,letterSpacing:'-0.02em',marginTop:2}} className="tnum">LKR 2.41M</div>
              <span className="stat-trend up" style={{marginTop:6}}>
                <Icon name="trending-up" size={12} /> +18.4% vs Apr
              </span>
            </div>
          </div>
          <div style={{margin:'12px -6px 0'}}>
            <svg viewBox="0 0 320 100" width="100%" height="100">
              <defs>
                <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d="M 0 70 L 30 60 L 60 65 L 90 45 L 120 50 L 150 35 L 180 40 L 210 25 L 240 30 L 270 18 L 300 22 L 320 12" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 0 70 L 30 60 L 60 65 L 90 45 L 120 50 L 150 35 L 180 40 L 210 25 L 240 30 L 270 18 L 300 22 L 320 12 L 320 100 L 0 100 Z" fill="url(#lg)" />
              {[30,60,90,120,150,180,210,240,270,300].map((x, i) => i === 9 ? <circle key={i} cx={x} cy={22} r="4" fill="var(--primary)" stroke="#fff" strokeWidth="2" /> : null)}
            </svg>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:10,color:'var(--text-3)',fontWeight:500}}>
              <span>1</span><span>7</span><span>14</span><span>21</span><span>28</span>
            </div>
          </div>
        </div>

        {/* Split */}
        <div className="card card-pad" style={{marginTop:14}}>
          <div className="row between" style={{marginBottom: 14}}>
            <h2 style={{fontSize:14,fontWeight:700,margin:0}}>Revenue split</h2>
          </div>
          <div className="row" style={{gap:18,alignItems:'center'}}>
            <Donut
              segments={[
                {value: 62, color: 'var(--primary)'},
                {value: 38, color: 'var(--brown)'},
              ]}
              value="LKR 2.41M"
              label="Total"
            />
            <div style={{flex:1}}>
              <div className="row between" style={{marginBottom:10}}>
                <div className="row" style={{gap:8}}>
                  <div style={{width:10,height:10,borderRadius:3,background:'var(--primary)'}} />
                  <span style={{fontSize:12.5,fontWeight:600}}>Shared</span>
                </div>
                <span style={{fontSize:12.5,fontWeight:700}} className="tnum">62%</span>
              </div>
              <div style={{fontSize:13.5,fontWeight:700}} className="tnum">LKR 1.49M</div>
              <div style={{height:1,background:'var(--line)',margin:'12px 0'}} />
              <div className="row between" style={{marginBottom:10}}>
                <div className="row" style={{gap:8}}>
                  <div style={{width:10,height:10,borderRadius:3,background:'var(--brown)'}} />
                  <span style={{fontSize:12.5,fontWeight:600}}>Private</span>
                </div>
                <span style={{fontSize:12.5,fontWeight:700}} className="tnum">38%</span>
              </div>
              <div style={{fontSize:13.5,fontWeight:700}} className="tnum">LKR 0.92M</div>
            </div>
          </div>
        </div>

        {/* Top performers */}
        <div className="section-head" style={{marginTop:16}}>
          <h2>Top performing</h2>
          <a href="#">Details</a>
        </div>
        <div className="stack" style={{gap:8}}>
          {[
            {name:'Yala Morning Safari', rev: 612000, bookings: 38, trend: '+22%', idx: 0},
            {name:'Wilpattu Full Day', rev: 480000, bookings: 21, trend: '+14%', idx: 2},
            {name:'Udawalawe PM', rev: 312000, bookings: 32, trend: '+6%', idx: 1},
          ].map((s, i) => (
            <div key={i} className="card card-pad row" style={{gap: 12, padding: 12}}>
              <div className={`safari-thumb alt-${s.idx}`} style={{width:48,height:48,borderRadius:10,flex:'0 0 48px',overflow:'hidden'}} />
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13.5,fontWeight:700}}>{s.name}</div>
                <div className="row between" style={{marginTop:2}}>
                  <span style={{fontSize:11.5,color:'var(--text-3)'}}>{s.bookings} bookings</span>
                  <span style={{fontSize:11,fontWeight:600,color:'var(--success)'}}>{s.trend}</span>
                </div>
              </div>
              <div style={{fontSize:13,fontWeight:700,color:'var(--primary)'}} className="tnum">LKR {(s.rev/1000).toFixed(0)}K</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PrivateSafarisScreen({ go }) {
  return (
    <div className="app-body" style={{paddingBottom:120,position:'relative'}}>
      <TopBar title="Private Safaris" subtitle="3 active · 1 draft" onBell={() => go('notifications')} notifCount={3} />
      <div style={{padding:'0 16px'}}>
        <Chips items={['All','Upcoming','In Progress','Past']} active="All" onChange={() => {}} />
        <div className="stack" style={{gap:12,marginTop:14}}>
          {[
            {customer:'Priya Patel', dates:'May 24 – May 26', amount: 168000, status:'confirmed', incl:['Meals','Guide','Camera']},
            {customer:'Hans Müller (party of 6)', dates:'May 29 – Jun 1', amount: 312000, status:'confirmed', incl:['Meals','Guide','Accommodation']},
            {customer:'Elena Brown', dates:'Jun 4', amount: 86000, status:'pending', incl:['Meals','Guide']},
          ].map((p, i) => (
            <div key={i} className="card" style={{overflow:'hidden'}}>
              <SafariThumb index={1} type="private" name={p.customer} />
              <div style={{padding:'14px 16px 16px'}}>
                <div className="row between" style={{marginBottom: 6}}>
                  <div style={{fontSize:15,fontWeight:700}}>{p.customer}</div>
                  <Badge kind={p.status === 'confirmed' ? 'confirmed' : 'pending'}>{p.status}</Badge>
                </div>
                <div className="row" style={{gap:6,fontSize:12,color:'var(--text-3)',marginBottom:10}}>
                  <Icon name="calendar" size={12} />
                  <span>{p.dates}</span>
                </div>
                <div className="row" style={{gap:6,flexWrap:'wrap',marginBottom: 12}}>
                  {p.incl.map(x => (
                    <span key={x} className="chip" style={{fontSize:10.5,padding:'4px 9px',background:'var(--sand-soft)',borderColor:'var(--sand)',color:'var(--brown)'}}>
                      {x}
                    </span>
                  ))}
                </div>
                <div className="row between">
                  <div>
                    <div style={{fontSize:10.5,color:'var(--text-3)',fontWeight:500}}>TOTAL</div>
                    <div style={{fontSize:17,fontWeight:700,color:'var(--primary)'}} className="tnum">LKR {p.amount.toLocaleString()}</div>
                  </div>
                  <button className="btn btn-secondary" style={{padding:'8px 14px',fontSize:12.5}}>Manage</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => go('createPrivate')}
        style={{position:'absolute',bottom:90,right:18,width:56,height:56,borderRadius:18,background:'var(--primary)',color:'#fff',boxShadow:'0 10px 24px rgba(45,106,79,0.4)',display:'grid',placeItems:'center',zIndex:20}}
      >
        <Icon name="plus" size={26} color="#fff" />
      </button>
    </div>
  );
}

function CreatePrivateSafariScreen({ go }) {
  const [incl, setIncl] = useState({meals:true, guide:true, accom:false, camera:true});
  const total = (incl.meals?12000:0)+(incl.guide?15000:0)+(incl.accom?28000:0)+(incl.camera?6000:0)+50000;
  const toast = useToast();
  return (
    <div className="app-body" style={{paddingBottom:130}}>
      <TopBar title="New Private Safari" onBack={() => go('private')} />
      <div style={{padding:'0 18px'}}>
        <div className="field">
          <label className="label">Customer name</label>
          <input className="input" defaultValue="Priya Patel" />
        </div>
        <div className="row" style={{gap:10}}>
          <div className="field grow">
            <label className="label">Contact</label>
            <input className="input" defaultValue="+44 7700 900..." />
          </div>
          <div className="field" style={{width:90}}>
            <label className="label">Party</label>
            <input className="input" defaultValue="4" />
          </div>
        </div>
        <div className="row" style={{gap:10}}>
          <div className="field grow">
            <label className="label">From</label>
            <input className="input" defaultValue="May 24" />
          </div>
          <div className="field grow">
            <label className="label">To</label>
            <input className="input" defaultValue="May 26" />
          </div>
        </div>

        <div className="field">
          <label className="label">Inclusions</label>
          <div className="stack" style={{gap:8}}>
            {[
              {k:'meals',label:'Meals · all 3 daily',icon:'utensils',price:12000},
              {k:'guide',label:'Dedicated guide',icon:'user-check',price:15000},
              {k:'accom',label:'Accommodation',icon:'bed',price:28000},
              {k:'camera',label:'Camera rental',icon:'camera',price:6000},
            ].map(x => (
              <div key={x.k} className="row" style={{gap:12,padding:'12px 14px',background:'var(--surface)',borderRadius:12,border:'1px solid var(--line)'}}>
                <div style={{width:34,height:34,borderRadius:9,background: incl[x.k] ? 'var(--primary-100)' : 'var(--line-soft)',display:'grid',placeItems:'center'}}>
                  <Icon name={x.icon} size={15} color={incl[x.k] ? 'var(--primary)' : 'var(--text-3)'} />
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13.5,fontWeight:600}}>{x.label}</div>
                  <div style={{fontSize:11.5,color:'var(--text-3)'}}>+ LKR {x.price.toLocaleString()}</div>
                </div>
                <Switch value={incl[x.k]} onChange={(v) => setIncl({...incl, [x.k]: v})} />
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label">Special requirements</label>
          <textarea className="textarea" defaultValue="Customer is interested in leopard spotting and bird photography. Prefers early morning departures."></textarea>
        </div>

        <div className="card card-pad" style={{marginBottom: 14,background:'var(--primary-100)',border:'1px solid rgba(45,106,79,0.15)'}}>
          <div className="row between">
            <span style={{fontSize:12,color:'var(--primary-700)',fontWeight:600}}>Estimated total</span>
            <span style={{fontSize:22,fontWeight:800,color:'var(--primary-700)'}} className="tnum">LKR {total.toLocaleString()}</span>
          </div>
          <div style={{fontSize:11,color:'var(--text-2)',marginTop:2}}>Base price LKR 50,000 + inclusions</div>
        </div>
      </div>

      <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'14px 18px 28px',background:'var(--surface)',borderTop:'1px solid var(--line)',display:'flex',gap:10,zIndex:20}}>
        <button className="btn btn-secondary" style={{flex:1,padding:'14px'}} onClick={() => go('private')}>Cancel</button>
        <button className="btn btn-primary btn-lg" style={{flex:1.5}} onClick={() => { toast('Private safari created'); go('private'); }}>
          Create Safari
        </button>
      </div>
    </div>
  );
}

Object.assign(window, {
  OwnerHomeScreen, SharedSafarisScreen, CreateSharedSafariScreen,
  VendorPaymentsScreen, RevenueAnalyticsScreen,
  PrivateSafarisScreen, CreatePrivateSafariScreen,
});
