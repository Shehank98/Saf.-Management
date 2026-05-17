// screens-admin.jsx - Super Admin: Dashboard, Users, Features, Billing, Locations, Bookings, Analytics

function AdminDashboardScreen({ go }) {
  return (
    <div className="app-body" style={{paddingBottom: 110}}>
      <TopBar avatar="A" subtitle="Super Admin" title="Platform Overview" onBell={() => go('notifications')} notifCount={5} />
      <div style={{padding:'4px 16px 0'}}>
        {/* Stats grid */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <StatCard icon="users" label="Total Users" value="1,248" trend="+34 this wk" trendDir="up" />
          <StatCard icon="map" label="Active Safaris" value="312" trend="+12%" trendDir="up" bg="var(--sky-100)" fg="#1E5A87" />
          <StatCard icon="banknote" label="Monthly Rev" value="LKR 28.4M" trend="+18.4%" trendDir="up" bg="var(--sand-soft)" fg="var(--brown)" />
          <StatCard icon="alert-circle" label="Pending" value="14" trend="approvals" bg="#FEF3C7" fg="#92400E" />
        </div>

        {/* Quick actions */}
        <h2 style={{fontSize:14,fontWeight:700,margin:'18px 0 10px'}}>Quick actions</h2>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[
            {label:'Approve Users',sub:'14 pending',ico:'user-check',color:'#92400E',bg:'#FEF3C7',go:'users'},
            {label:'Manage Locations',sub:'8 parks',ico:'map-pin',color:'var(--primary)',bg:'var(--primary-100)',go:'locations'},
            {label:'View Billing',sub:'LKR 412K MRR',ico:'credit-card',color:'var(--brown)',bg:'var(--sand-soft)',go:'billing'},
            {label:'All Bookings',sub:'2,891 total',ico:'ticket',color:'#1E5A87',bg:'var(--sky-100)',go:'adminBookings'},
          ].map(a => (
            <button key={a.label} onClick={() => go(a.go)} className="card card-pad" style={{textAlign:'left',padding:14,display:'block'}}>
              <div style={{width:32,height:32,borderRadius:9,background:a.bg,display:'grid',placeItems:'center',marginBottom:8}}>
                <Icon name={a.ico} size={16} color={a.color} />
              </div>
              <div style={{fontSize:13,fontWeight:700}}>{a.label}</div>
              <div style={{fontSize:11,color:'var(--text-3)',marginTop:1}}>{a.sub}</div>
            </button>
          ))}
        </div>

        {/* Activity feed */}
        <h2 style={{fontSize:14,fontWeight:700,margin:'18px 0 10px'}}>Recent activity</h2>
        <div className="card" style={{padding:6}}>
          {[
            {ico:'user-plus',color:'var(--primary)',bg:'var(--primary-100)',title:'New registration',sub:'Mama Lanka Kitchen · Restaurant',time:'12m'},
            {ico:'credit-card',color:'var(--brown)',bg:'var(--sand-soft)',title:'Subscription paid',sub:'Wild Lanka Co. · LKR 7,500',time:'24m'},
            {ico:'ticket',color:'#1E5A87',bg:'var(--sky-100)',title:'5 new bookings',sub:'Yala Morning · LKR 62,500',time:'1h'},
            {ico:'alert-triangle',color:'#92400E',bg:'#FEF3C7',title:'Refund request',sub:'B-2376 · LKR 22,000',time:'2h'},
          ].map((a, i) => (
            <div key={i} className="row" style={{padding:'11px 10px',gap:11,borderBottom: i < 3 ? '1px solid var(--line-soft)' : 'none'}}>
              <div style={{width:32,height:32,borderRadius:9,background:a.bg,display:'grid',placeItems:'center',flex:'0 0 32px'}}>
                <Icon name={a.ico} size={14} color={a.color} />
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12.5,fontWeight:600}}>{a.title}</div>
                <div style={{fontSize:11,color:'var(--text-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.sub}</div>
              </div>
              <span style={{fontSize:10.5,color:'var(--text-3)',fontWeight:500}}>{a.time}</span>
            </div>
          ))}
        </div>

        {/* MRR chart card */}
        <div className="card card-pad" style={{marginTop:14}}>
          <div className="row between" style={{marginBottom: 8}}>
            <div>
              <div style={{fontSize:11,color:'var(--text-3)',fontWeight:600,letterSpacing:0.04,textTransform:'uppercase'}}>Platform revenue · 6mo</div>
              <div style={{fontSize:20,fontWeight:700,letterSpacing:'-0.02em'}} className="tnum">LKR 142M</div>
            </div>
            <span className="stat-trend up"><Icon name="trending-up" size={11} /> +24%</span>
          </div>
          <BarChart data={[42, 58, 65, 78, 85, 92]} highlight={5} />
          <div className="bar-labels"><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span></div>
        </div>
      </div>
    </div>
  );
}

function UserManagementScreen({ go }) {
  const [tab, setTab] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [actioned, setActioned] = useState({});
  const toast = useToast();
  const users = window.MOCK.ADMIN_USERS.filter(u => u.status === tab);

  const isVendorRole = (role) => role !== 'Safari Owner';

  return (
    <div className="app-body" style={{paddingBottom: 110}}>
      <TopBar title="User Management" subtitle="3 pending review" onBack={() => go('home')} />
      <div style={{padding:'0 16px'}}>
        <Tabs items={[{id:'pending',label:'Pending (3)'},{id:'approved',label:'Approved'},{id:'rejected',label:'Rejected'}]} active={tab} onChange={setTab} />

        <div className="input-icon-wrap" style={{marginTop:12,marginBottom: 14}}>
          <Icon name="search" size={16} className="input-icon" color="var(--text-3)" />
          <input className="input" placeholder="Search by name, email, or role" />
        </div>

        <div className="stack" style={{gap:10}}>
          {users.map(u => {
            const a = actioned[u.email];
            const subActive = u.sub || a === 'sub';
            return (
              <div key={u.email} className="card card-pad">
                <div className="row" style={{gap:12}}>
                  <div className="avatar-sm" style={{background: u.role.includes('Owner') ? 'var(--primary)' : 'var(--brown)'}}>
                    {u.name.split(' ').map(p => p[0]).slice(0,2).join('')}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13.5,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.name}</div>
                    <div style={{fontSize:11.5,color:'var(--text-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <span className="chip" style={{padding:'3px 8px',fontSize:10.5,background:'var(--bg)',border:'1px solid var(--line)'}}>{u.role}</span>
                  </div>
                </div>
                <div className="row between" style={{marginTop:10,paddingTop:10,borderTop:'1px solid var(--line-soft)',flexWrap:'wrap',gap:8}}>
                  <span style={{fontSize:11,color:'var(--text-3)'}}>Registered {u.date}</span>
                  {tab === 'pending' ? (
                    <div className="row" style={{gap:6}}>
                      <button className="btn btn-secondary" style={{padding:'6px 12px',fontSize:11.5}} onClick={() => setSelected({...u, action:'reject'})}>
                        Reject
                      </button>
                      <button className="btn btn-primary" style={{padding:'6px 12px',fontSize:11.5}} onClick={() => toast(`${u.name} approved · WhatsApp sent`)}>
                        Approve
                      </button>
                    </div>
                  ) : tab === 'approved' && isVendorRole(u.role) && !subActive ? (
                    <button className="btn" style={{background:'var(--brown)',color:'#fff',padding:'6px 12px',fontSize:11.5}} onClick={() => { setActioned(p => ({...p, [u.email]:'sub'})); toast(`Subscription activated for ${u.name}`); }}>
                      <Icon name="zap" size={11} color="#fff" /> Activate Subscription
                    </button>
                  ) : tab === 'approved' && isVendorRole(u.role) && subActive ? (
                    <Badge kind="active" icon="zap">Sub Active</Badge>
                  ) : (
                    <Badge kind={u.status === 'approved' ? 'active' : 'cancelled'}>{u.status}</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={`Reject ${selected?.name}?`}>
        <div className="field">
          <label className="label">Reason (will be sent via WhatsApp)</label>
          <textarea className="textarea" placeholder="Tell them what's needed to be approved later…"></textarea>
        </div>
        <div className="row" style={{gap:8}}>
          <button className="btn btn-secondary" style={{flex:1,padding:14}} onClick={() => setSelected(null)}>Cancel</button>
          <button className="btn btn-danger" style={{flex:1,padding:14,fontWeight:600}} onClick={() => { toast(`${selected.name} rejected`, 'info'); setSelected(null); }}>
            Reject account
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function FeatureManagementScreen({ go }) {
  const [features, setFeatures] = useState({
    'Wild Lanka Co.': {shared:true, private:true, booking:true, vendors:true, analytics:true},
    'Northern Trails': {shared:true, private:false, booking:true, vendors:true, analytics:false},
    'Sunil Jeeps': {shared:true, private:false, booking:false, vendors:true, analytics:false},
    'Mama Lanka Kitchen': {shared:false, private:false, booking:false, vendors:true, analytics:false},
  });
  const toggle = (user, feat) => setFeatures(f => ({...f, [user]: {...f[user], [feat]: !f[user][feat]}}));

  return (
    <div className="app-body" style={{paddingBottom:110}}>
      <TopBar title="Feature Management" subtitle="Toggle per-user access" onBack={() => go('home')} />
      <div style={{padding:'0 16px'}}>
        <div style={{padding:'12px 14px',background:'var(--sky-100)',borderRadius:12,marginBottom:14,display:'flex',gap:10,alignItems:'flex-start'}}>
          <Icon name="info" size={15} color="#1E5A87" />
          <span style={{fontSize:11.5,color:'#1E5A87',lineHeight:1.4}}>Granular feature flags. Changes apply immediately to user dashboards.</span>
        </div>

        <div className="stack" style={{gap:12}}>
          {Object.entries(features).map(([user, feats]) => (
            <div key={user} className="card card-pad">
              <div className="row between" style={{marginBottom:12}}>
                <div className="row" style={{gap:10}}>
                  <div className="avatar-sm">{user.split(' ').map(p=>p[0]).slice(0,2).join('')}</div>
                  <div>
                    <div style={{fontSize:13.5,fontWeight:700}}>{user}</div>
                    <div style={{fontSize:11,color:'var(--text-3)'}}>{Object.values(feats).filter(Boolean).length} of 5 enabled</div>
                  </div>
                </div>
                <button style={{fontSize:11,color:'var(--primary)',fontWeight:600}}>Bulk →</button>
              </div>
              {[
                {k:'shared',label:'Shared Trips'},
                {k:'private',label:'Private Safari'},
                {k:'booking',label:'Booking Mgmt'},
                {k:'vendors',label:'Vendor Listings'},
                {k:'analytics',label:'Reports & Analytics'},
              ].map((f, i) => (
                <div key={f.k} className="row between" style={{padding:'10px 0',borderTop: i === 0 ? '1px solid var(--line-soft)' : '1px solid var(--line-soft)'}}>
                  <span style={{fontSize:13}}>{f.label}</span>
                  <Switch value={feats[f.k]} onChange={() => toggle(user, f.k)} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BillingScreen({ go }) {
  return (
    <div className="app-body" style={{paddingBottom:110}}>
      <TopBar title="Billing & Subscriptions" subtitle="LKR 412K MRR" onBack={() => go('home')} />
      <div style={{padding:'0 16px'}}>
        <div className="row" style={{gap:10,marginBottom:14}}>
          <div className="card card-pad" style={{flex:1}}>
            <div style={{fontSize:10.5,color:'var(--text-3)',fontWeight:600,letterSpacing:0.04,textTransform:'uppercase'}}>MRR</div>
            <div style={{fontSize:18,fontWeight:700,marginTop:2}} className="tnum">LKR 412K</div>
            <span className="stat-trend up" style={{marginTop:4,fontSize:10}}>
              <Icon name="trending-up" size={10} /> +14%
            </span>
          </div>
          <div className="card card-pad" style={{flex:1}}>
            <div style={{fontSize:10.5,color:'var(--text-3)',fontWeight:600,letterSpacing:0.04,textTransform:'uppercase'}}>Active subs</div>
            <div style={{fontSize:18,fontWeight:700,marginTop:2}} className="tnum">165</div>
            <span className="stat-trend up" style={{marginTop:4,fontSize:10}}>
              <Icon name="user-plus" size={10} /> +8 new
            </span>
          </div>
          <div className="card card-pad" style={{flex:1}}>
            <div style={{fontSize:10.5,color:'var(--text-3)',fontWeight:600,letterSpacing:0.04,textTransform:'uppercase'}}>Churn</div>
            <div style={{fontSize:18,fontWeight:700,marginTop:2}} className="tnum">2.1%</div>
            <span className="stat-trend down" style={{marginTop:4,fontSize:10}}>
              <Icon name="trending-down" size={10} /> healthy
            </span>
          </div>
        </div>

        <h2 style={{fontSize:14,fontWeight:700,margin:'4px 0 10px'}}>Vendor subscriptions</h2>
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          {[
            {name:'Sunil Jeeps', plan:'Pro', amount:2500, renews:'May 21', status:'active'},
            {name:'Pradeep Silva', plan:'Pro', amount:2500, renews:'May 24', status:'active'},
            {name:'Mama Lanka', plan:'Basic', amount:1200, renews:'May 18', status:'expiring'},
            {name:'Yala Camera Hub', plan:'Pro', amount:2500, renews:'Jun 2', status:'active'},
            {name:'Asanka Tours', plan:'Pro', amount:2500, renews:'May 10', status:'expired'},
          ].map((v, i, arr) => (
            <div key={v.name} className="row" style={{padding:'14px 16px',gap:12,borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none'}}>
              <div className="avatar-sm" style={{flex:'0 0 32px',width:32,height:32,fontSize:11,background: v.status === 'expired' ? '#94A89A' : 'var(--brown)'}}>
                {v.name.split(' ').map(p=>p[0]).slice(0,2).join('')}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div className="row between">
                  <div style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v.name}</div>
                  <Badge kind={v.status === 'active' ? 'active' : v.status === 'expiring' ? 'pending' : 'expired'}>
                    {v.status === 'expired' ? 'Expired' : v.status === 'expiring' ? 'Expiring' : v.plan}
                  </Badge>
                </div>
                <div className="row between" style={{marginTop:2}}>
                  <span style={{fontSize:11,color:'var(--text-3)'}}>Renews {v.renews}</span>
                  <span style={{fontSize:12,fontWeight:600}} className="tnum">LKR {v.amount.toLocaleString()}/mo</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LocationsScreen({ go }) {
  const toast = useToast();
  return (
    <div className="app-body" style={{paddingBottom:110,position:'relative'}}>
      <TopBar title="Locations" subtitle="8 parks · 24 owners" onBack={() => go('home')} />
      <div style={{padding:'0 16px'}}>
        <MapPlaceholder height={160} />
        <div style={{marginTop:14}}>
          <h2 style={{fontSize:14,fontWeight:700,margin:'0 0 10px'}}>All parks</h2>
          <div className="stack" style={{gap:10}}>
            {[
              {name:'Yala National Park', district:'Southern', owners:6, vendors:18, status:'active'},
              {name:'Udawalawe National Park', district:'Sabaragamuwa', owners:4, vendors:12, status:'active'},
              {name:'Wilpattu National Park', district:'North-West', owners:3, vendors:9, status:'active'},
              {name:'Minneriya National Park', district:'North-Central', owners:5, vendors:11, status:'active'},
              {name:'Bundala Bird Sanctuary', district:'Southern', owners:2, vendors:5, status:'limited'},
              {name:'Kumana National Park', district:'Eastern', owners:1, vendors:3, status:'limited'},
            ].map((p, i) => (
              <div key={p.name} className="card card-pad row" style={{gap:12,padding:'12px 14px'}}>
                <div style={{width:42,height:42,borderRadius:10,background:'var(--primary-100)',display:'grid',placeItems:'center',flex:'0 0 42px'}}>
                  <Icon name="map-pin" size={18} color="var(--primary)" />
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="row between">
                    <div style={{fontSize:13.5,fontWeight:700}}>{p.name}</div>
                    <Badge kind={p.status === 'active' ? 'active' : 'pending'}>{p.status}</Badge>
                  </div>
                  <div style={{fontSize:11,color:'var(--text-3)',marginTop:1}}>{p.district} Province · {p.owners} owners · {p.vendors} vendors</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button onClick={() => toast('Add location')} style={{position:'absolute',bottom:90,right:18,width:56,height:56,borderRadius:18,background:'var(--primary)',color:'#fff',boxShadow:'0 10px 24px rgba(45,106,79,0.4)',display:'grid',placeItems:'center',zIndex:20}}>
        <Icon name="plus" size={26} color="#fff" />
      </button>
    </div>
  );
}

function AdminBookingsScreen({ go }) {
  const [filter, setFilter] = useState('all');
  const [refundOpen, setRefundOpen] = useState(null);
  const toast = useToast();
  return (
    <div className="app-body" style={{paddingBottom: 110}}>
      <TopBar title="Bookings" subtitle="2,891 this month" onBack={() => go('home')} right={<button className="bell" style={{width:'auto',padding:'0 12px',fontSize:11,fontWeight:600,color:'var(--text-2)'}}><Icon name="download" size={14} /> CSV</button>} />
      <div style={{padding:'0 16px'}}>
        <Chips items={[
          {id:'all',label:'All'},
          {id:'confirmed',label:'Confirmed'},
          {id:'pending',label:'Pending'},
          {id:'cancelled',label:'Cancelled'},
          {id:'refunded',label:'Refunded'},
        ]} active={filter} onChange={setFilter} />

        <div style={{marginTop:14}}>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            {[
              {id:'B-2401', cust:'Emma Larsson', safari:'Yala Morning', date:'May 19', amt:25000, status:'confirmed'},
              {id:'B-2399', cust:'Marco Rossi', safari:'Udawalawe PM', date:'May 20', amt:9800, status:'pending'},
              {id:'B-2395', cust:'Hana Tanaka', safari:'Wilpattu Full', date:'May 21', amt:66000, status:'confirmed'},
              {id:'B-2389', cust:'Priya Patel', safari:'Yala Private', date:'May 24', amt:86000, status:'confirmed'},
              {id:'B-2376', cust:'Hans Müller', safari:'Wilpattu', date:'Apr 28', amt:22000, status:'cancelled'},
              {id:'B-2371', cust:'Aisha Khan', safari:'Yala Morning', date:'Apr 26', amt:18500, status:'refunded'},
            ].filter(b => filter === 'all' || b.status === filter).map((b, i, arr) => (
              <div key={b.id} className="row" style={{padding:'13px 14px',gap:10,borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none',alignItems:'flex-start'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div className="row between" style={{marginBottom:2}}>
                    <span style={{fontSize:10.5,color:'var(--text-3)',fontFamily:'JetBrains Mono',fontWeight:500}}>{b.id}</span>
                    <Badge kind={b.status}>{b.status}</Badge>
                  </div>
                  <div style={{fontSize:13.5,fontWeight:600}}>{b.cust}</div>
                  <div style={{fontSize:11.5,color:'var(--text-3)'}}>{b.safari} · {b.date}</div>
                  <div className="row between" style={{marginTop:6}}>
                    <span style={{fontSize:13,fontWeight:700,color:'var(--primary)'}} className="tnum">LKR {b.amt.toLocaleString()}</span>
                    {b.status === 'cancelled' && (
                      <button className="btn btn-secondary" style={{padding:'5px 10px',fontSize:11}} onClick={() => setRefundOpen(b)}>
                        Refund
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Sheet open={!!refundOpen} onClose={() => setRefundOpen(null)} title={`Process refund · ${refundOpen?.id}`}>
        <div className="card card-pad" style={{marginBottom:14,background:'var(--bg)'}}>
          <div className="row between" style={{marginBottom:6}}>
            <span style={{fontSize:12,color:'var(--text-3)'}}>Customer</span>
            <span style={{fontSize:12.5,fontWeight:600}}>{refundOpen?.cust}</span>
          </div>
          <div className="row between" style={{marginBottom:6}}>
            <span style={{fontSize:12,color:'var(--text-3)'}}>Original amount</span>
            <span style={{fontSize:12.5,fontWeight:600}} className="tnum">LKR {refundOpen?.amt.toLocaleString()}</span>
          </div>
          <div className="row between">
            <span style={{fontSize:12,color:'var(--text-3)'}}>Refund (85%)</span>
            <span style={{fontSize:14,fontWeight:700,color:'var(--primary)'}} className="tnum">LKR {refundOpen ? Math.round(refundOpen.amt * 0.85).toLocaleString() : 0}</span>
          </div>
        </div>
        <div className="row" style={{gap:8}}>
          <button className="btn btn-secondary" style={{flex:1,padding:14}} onClick={() => setRefundOpen(null)}>Cancel</button>
          <button className="btn btn-primary btn-lg" style={{flex:1.5}} onClick={() => { toast('Refund processed via Stripe'); setRefundOpen(null); }}>
            Process Refund
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function AdminAnalyticsScreen({ go }) {
  return (
    <div className="app-body" style={{paddingBottom:110}}>
      <TopBar title="Analytics" subtitle="Platform performance" onBack={() => go('home')} />
      <div style={{padding:'4px 16px 0'}}>
        <Tabs items={[{id:'mo',label:'Month'},{id:'qr',label:'Quarter'},{id:'yr',label:'Year'}]} active="mo" onChange={() => {}} />

        <div className="card card-pad" style={{marginTop:14}}>
          <div className="row between" style={{marginBottom: 4}}>
            <div>
              <div style={{fontSize:11,color:'var(--text-3)',fontWeight:600,letterSpacing:0.04,textTransform:'uppercase'}}>Platform revenue</div>
              <div style={{fontSize:24,fontWeight:800,letterSpacing:'-0.02em',marginTop:2}} className="tnum">LKR 28.4M</div>
            </div>
            <span className="stat-trend up"><Icon name="trending-up" size={12} /> +18.4%</span>
          </div>
          <div style={{marginTop:12,margin:'12px -6px 0'}}>
            <svg viewBox="0 0 320 120" width="100%" height="120">
              <defs>
                <linearGradient id="lg2" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d="M 0 90 L 32 85 L 64 75 L 96 70 L 128 55 L 160 60 L 192 42 L 224 38 L 256 28 L 288 22 L 320 12" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M 0 90 L 32 85 L 64 75 L 96 70 L 128 55 L 160 60 L 192 42 L 224 38 L 256 28 L 288 22 L 320 12 L 320 120 L 0 120 Z" fill="url(#lg2)" />
              <circle cx="320" cy="12" r="4" fill="var(--primary)" stroke="#fff" strokeWidth="2" />
            </svg>
          </div>
        </div>

        <div className="card card-pad" style={{marginTop:14}}>
          <div className="row between" style={{marginBottom: 10}}>
            <h2 style={{fontSize:14,fontWeight:700,margin:0}}>Bookings volume</h2>
            <span style={{fontSize:11,color:'var(--text-3)',fontWeight:600}}>2,891 this month</span>
          </div>
          <BarChart data={[120, 145, 168, 142, 180, 195, 210, 235, 220, 268, 285, 312]} />
          <div className="bar-labels" style={{fontSize:9}}>
            <span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span>
          </div>
        </div>

        <h2 style={{fontSize:14,fontWeight:700,margin:'18px 0 10px'}}>Top safari owners</h2>
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          {[
            {rank:1, name:'Wild Lanka Co.', rev: 2410000, bookings: 148, badge:'🥇'},
            {rank:2, name:'Northern Trails', rev: 1820000, bookings: 92, badge:'🥈'},
            {rank:3, name:'Yala Heritage Safaris', rev: 1640000, bookings: 87, badge:'🥉'},
            {rank:4, name:'Eastern Eco Tours', rev: 1180000, bookings: 64, badge:'4'},
            {rank:5, name:'Bundala Wildlife', rev: 980000, bookings: 52, badge:'5'},
          ].map((o, i, arr) => (
            <div key={o.rank} className="row" style={{padding:'12px 14px',gap:12,borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none'}}>
              <div style={{width:30,height:30,borderRadius:'50%',background:i < 3 ? 'var(--sand-soft)' : 'var(--bg)',display:'grid',placeItems:'center',fontSize: i < 3 ? 14 : 12,fontWeight:700,color:'var(--brown)',flex:'0 0 30px'}}>
                {o.badge}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700}}>{o.name}</div>
                <div style={{fontSize:11,color:'var(--text-3)'}}>{o.bookings} bookings</div>
              </div>
              <div style={{fontSize:13,fontWeight:700,color:'var(--primary)'}} className="tnum">LKR {(o.rev/1000000).toFixed(2)}M</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  AdminDashboardScreen, UserManagementScreen, FeatureManagementScreen,
  BillingScreen, LocationsScreen, AdminBookingsScreen, AdminAnalyticsScreen,
});
