// screens-owner.jsx - Owner dashboard, jeep pipeline, pricing setup, payments, revenue

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
          <StatCard icon="ticket" label="Confirmed jeeps" value="14" trend="+3 today" trendDir="up" />
          <StatCard icon="trending-up" label="May revenue" value="LKR 2.4M" trend="+18%" trendDir="up" bg="var(--sand-soft)" fg="var(--brown)" />
          <StatCard icon="users" label="Paid seats" value="68" trend="this week" trendDir="up" bg="var(--sky-100)" fg="#1E5A87" />
          <StatCard icon="alert-circle" label="Pay window" value="3 jeeps" trend="48h ⏱" trendDir="down" bg="#FEF3C7" fg="#92400E" />
        </div>

        {/* Quick actions */}
        <div className="row" style={{gap:10,marginTop:14}}>
          <button className="btn btn-primary" style={{flex:1,padding:'14px 12px',fontSize:13}} onClick={() => go('pricing')}>
            <Icon name="settings" size={16} color="#fff" /> Pricing setup
          </button>
          <button className="btn btn-secondary" style={{flex:1,padding:'14px 12px',fontSize:13}} onClick={() => go('createPrivate')}>
            <Icon name="user-plus" size={16} /> New Private
          </button>
        </div>

        {/* Jeep pipeline panel */}
        <div className="card card-pad" style={{marginTop:14}}>
          <div className="row between" style={{marginBottom: 12}}>
            <h3 style={{fontSize:13,fontWeight:700,margin:0}}>Jeep status pipeline</h3>
            <button className="btn btn-ghost" style={{padding:'4px 8px',fontSize:11}} onClick={() => go('shared')}>View all →</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:8}}>
            {[
              {label:'Open',val:8,color:'var(--brown)'},
              {label:'Paying',val:3,color:'#92400E'},
              {label:'Confirmed',val:14,color:'var(--success)'},
              {label:'Completed',val:42,color:'var(--text-3)'},
            ].map(s => (
              <div key={s.label} style={{textAlign:'center',padding:'10px 4px',background:'var(--bg)',borderRadius:10}}>
                <div style={{fontSize:18,fontWeight:800,color:s.color}} className="tnum">{s.val}</div>
                <div style={{fontSize:10,fontWeight:600,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:0.04,marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
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

        {/* Action: Jeep in payment window */}
        <div className="card card-pad" style={{marginTop:14, background:'#FEF3C7',border:'1px solid #FCD56B'}}>
          <div className="row between" style={{marginBottom:6}}>
            <div className="row" style={{gap:8}}>
              <Icon name="alert-triangle" size={16} color="#92400E" />
              <span style={{fontSize:13,fontWeight:700,color:'#92400E'}}>JP-1045 · Minneriya PM</span>
            </div>
            <span className="countdown" style={{fontSize:10}}>32h left</span>
          </div>
          <div style={{fontSize:11.5,color:'#92400E',marginBottom:10}}>4 of 4 seats reserved · 1 customer hasn't paid yet</div>
          <button className="btn" style={{background:'#92400E',color:'#fff',padding:'8px 12px',fontSize:11.5,fontWeight:600}} onClick={() => go('shared')}>
            Nudge customer via WhatsApp →
          </button>
        </div>
      </div>
    </div>
  );
}

function SharedSafarisScreen({ go }) {
  const [pulled, setPulled] = useState(false);
  const [filter, setFilter] = useState('all');
  return (
    <div className="app-body" style={{paddingBottom:120,position:'relative'}}>
      <TopBar title="Shared Jeeps" subtitle="6 active · 1 paying · 1 overflow" onBell={() => go('notifications')} notifCount={3} />

      {pulled && (
        <div style={{position:'absolute',top:60,left:'50%',transform:'translateX(-50%)',background:'var(--surface)',padding:'8px 14px',borderRadius:999,boxShadow:'var(--shadow)',display:'flex',alignItems:'center',gap:8,zIndex:20,fontSize:11.5,fontWeight:600}}>
          <Icon name="refresh-cw" size={14} color="var(--primary)" /> Refreshing…
        </div>
      )}

      <div style={{padding:'0 16px'}}>
        <Chips
          items={[
            {id:'all',label:'All'},
            {id:'OPEN',label:'Open'},
            {id:'PENDING_PAYMENT',label:'Paying'},
            {id:'CONFIRMED',label:'Confirmed'},
          ]}
          active={filter}
          onChange={setFilter}
        />
        <div style={{margin:'10px 0 16px',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontSize:11,color:'var(--text-3)'}} onClick={() => { setPulled(true); setTimeout(() => setPulled(false), 1200); }}>
          <Icon name="arrow-down" size={11} /> Pull to refresh
        </div>

        <div className="stack" style={{gap:12}}>
          {window.MOCK.OWNER_JEEPS.filter(j => filter === 'all' || j.status === filter).map((j, i) => {
            const filled = j.paidSeats + j.reservedSeats;
            const min = 4;
            return (
              <div key={j.code} className="card" style={{overflow:'hidden',position:'relative'}}>
                {j.overflow && (
                  <div style={{position:'absolute',top:0,right:0,padding:'4px 10px',background:'var(--brown)',color:'#fff',fontSize:9,fontWeight:700,letterSpacing:0.04,borderBottomLeftRadius:8}}>
                    AUTO-OVERFLOW
                  </div>
                )}
                <div style={{padding:14}}>
                  <div className="row between" style={{marginBottom:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="row" style={{gap:8,marginBottom:2}}>
                        <span style={{fontSize:10.5,fontWeight:700,fontFamily:'JetBrains Mono',color:'var(--text-3)'}}>{j.code}</span>
                        <Badge kind={j.status}>{j.status === 'PENDING_PAYMENT' ? 'Paying' : j.status === 'CONFIRMED' ? 'Confirmed' : 'Open'}</Badge>
                      </div>
                      <div style={{fontSize:14.5,fontWeight:700}}>{j.name}</div>
                      <div style={{fontSize:11.5,color:'var(--text-3)',marginTop:1}}>{j.date}</div>
                    </div>
                    {j.status === 'PENDING_PAYMENT' && (
                      <span className="countdown" style={{fontSize:10}}>
                        <span className="dot" />
                        {j.deadlineHrs}h
                      </span>
                    )}
                  </div>

                  {/* occupancy */}
                  <div className="occ-bar" style={{marginTop:14}}>
                    <div className="fill">
                      <div className="paid" style={{width: ((j.paidSeats/j.totalSeats)*100) + '%'}} />
                      <div className="reserved" style={{width: ((j.reservedSeats/j.totalSeats)*100) + '%'}} />
                    </div>
                    <div className="min-mark" style={{left: `calc(${(min/j.totalSeats)*100}% - 1px)`}} />
                  </div>
                  <div className="row between" style={{marginTop:8}}>
                    <div style={{fontSize:11.5,color:'var(--text-2)'}}>
                      <span style={{fontWeight:700,color:'var(--primary)'}}>{j.paidSeats}</span> paid
                      {j.reservedSeats > 0 && <span style={{color:'var(--text-3)'}}> · {j.reservedSeats} reserved</span>}
                      <span style={{color:'var(--text-3)'}}> · {j.totalSeats - filled} open</span>
                    </div>
                    <div style={{fontSize:13,fontWeight:700,color:'var(--primary)'}} className="tnum">LKR {j.price.toLocaleString()}</div>
                  </div>

                  {/* Vendor / Booking link row */}
                  <div className="row between" style={{marginTop:12,paddingTop:10,borderTop:'1px solid var(--line-soft)'}}>
                    {j.vendor ? (
                      <div className="row" style={{gap:6,fontSize:11.5,color:'var(--text-2)'}}>
                        <Icon name="truck" size={12} color="var(--primary)" />
                        <span>{j.vendor}</span>
                      </div>
                    ) : (
                      <button style={{fontSize:11.5,fontWeight:600,color:'var(--brown)'}}>
                        <Icon name="plus" size={11} style={{verticalAlign:'-2px'}} /> Assign vendor
                      </button>
                    )}
                    <button style={{fontSize:11.5,fontWeight:600,color:'var(--primary)',display:'flex',alignItems:'center',gap:4}}>
                      <Icon name="link" size={12} /> Booking link
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => go('pricing')}
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
        <Icon name="settings" size={22} color="#fff" />
      </button>
    </div>
  );
}

function PricingSetupScreen({ go }) {
  const [price, setPrice] = useState(6500);
  const [days, setDays] = useState(30);
  const [time, setTime] = useState('morning');
  const [showResult, setShowResult] = useState(false);
  const toast = useToast();

  const onPublish = () => {
    setShowResult(true);
  };

  return (
    <div className="app-body" style={{paddingBottom:120}}>
      <TopBar title="Pricing setup" subtitle="Auto-schedule jeeps" onBack={() => go('shared')} />

      <div style={{padding:'0 18px'}}>
        <div style={{padding:'12px 14px',background:'var(--sky-100)',borderRadius:10,marginBottom:16,display:'flex',gap:10,alignItems:'flex-start'}}>
          <Icon name="zap" size={15} color="#1E5A87" />
          <span style={{fontSize:11.5,color:'#1E5A87',fontWeight:500,lineHeight:1.4,flex:1}}>
            Set your pricing once. We'll auto-create jeep slots for the next <strong>{days} days</strong>, skipping dates you've already scheduled.
          </span>
        </div>

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
            <label className="label">Price / seat</label>
            <div className="input-icon-wrap">
              <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'var(--text-3)',fontWeight:600}}>LKR</span>
              <input className="input" style={{paddingLeft:46}} value={price} onChange={e => setPrice(parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div className="field grow">
            <label className="label">Default seats</label>
            <input className="input" defaultValue="6" />
          </div>
        </div>

        <div className="field">
          <label className="label">Default schedule</label>
          <div className="row" style={{gap:6}}>
            {[
              {id:'morning',label:'Morning',sub:'5:30 AM',icon:'sunrise'},
              {id:'afternoon',label:'Afternoon',sub:'2:00 PM',icon:'sun'},
              {id:'both',label:'Both',sub:'×2 / day',icon:'sun-medium'},
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTime(t.id)}
                style={{
                  flex:1,
                  padding:'10px 8px',
                  borderRadius:10,
                  border: time === t.id ? '2px solid var(--primary)' : '1.5px solid var(--line)',
                  background: time === t.id ? 'var(--primary-100)' : 'var(--surface)',
                  display:'flex',flexDirection:'column',alignItems:'center',gap:2,
                  color: time === t.id ? 'var(--primary-700)' : 'var(--text-2)',
                  fontWeight: 600, fontSize: 12,
                }}
              >
                <Icon name={t.icon} size={16} />
                {t.label}
                <span style={{fontSize:10,fontWeight:500,opacity:0.7}}>{t.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label">Auto-schedule horizon</label>
          <div className="row" style={{gap:8,marginBottom:6}}>
            {[7, 14, 30, 60].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                style={{
                  flex:1,
                  padding:'10px 8px',
                  borderRadius:10,
                  border: days === d ? '2px solid var(--primary)' : '1.5px solid var(--line)',
                  background: days === d ? 'var(--primary-100)' : 'var(--surface)',
                  color: days === d ? 'var(--primary-700)' : 'var(--text-2)',
                  fontWeight: 600, fontSize: 13,
                }}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label">Pickup points (within 7 km of park)</label>
          <div className="stack" style={{gap:8}}>
            {['Tissamaharama Hotel','Kataragama Junction','Yala Gate','Hotel Hibiscus'].map(p => (
              <div key={p} className="row" style={{gap:10,padding:'10px 12px',background:'var(--surface)',borderRadius:10,border:'1px solid var(--line)'}}>
                <Icon name="map-pin" size={14} color="var(--primary)" />
                <span style={{flex:1,fontSize:13}}>{p}</span>
                <button style={{padding:4}}>
                  <Icon name="x" size={14} color="var(--text-3)" />
                </button>
              </div>
            ))}
            <button className="row" style={{padding:'10px 12px',background:'transparent',border:'1.5px dashed var(--line)',borderRadius:10,fontSize:12.5,color:'var(--primary)',fontWeight:600,justifyContent:'center',gap:6}}>
              <Icon name="plus" size={14} /> Add pickup point
            </button>
          </div>
        </div>

        <div style={{padding:'14px 16px',background:'var(--sand-soft)',borderRadius:12,marginBottom:18}}>
          <div className="row between">
            <span style={{fontSize:12,color:'var(--text-2)',fontWeight:500}}>Projected jeeps</span>
            <span style={{fontSize:22,fontWeight:800,color:'var(--brown)'}} className="tnum">{days * (time === 'both' ? 2 : 1)}</span>
          </div>
          <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>{time === 'both' ? '2 slots/day' : '1 slot/day'} × {days} days</div>
        </div>
      </div>

      <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'14px 18px 28px',background:'var(--surface)',borderTop:'1px solid var(--line)',display:'flex',gap:10,zIndex:20}}>
        <button className="btn btn-secondary" style={{flex:1,padding:'14px'}} onClick={() => go('shared')}>Cancel</button>
        <button className="btn btn-primary btn-lg" style={{flex:1.5}} onClick={onPublish}>
          <Icon name="zap" size={16} color="#fff" /> Save & Auto-Schedule
        </button>
      </div>

      <Sheet open={showResult} onClose={() => { setShowResult(false); go('shared'); }} title="">
        <div style={{textAlign:'center',padding:'0 0 8px'}}>
          <div style={{width:72,height:72,borderRadius:22,background:'var(--primary-100)',display:'grid',placeItems:'center',margin:'0 auto 18px'}}>
            <Icon name="check-circle-2" size={36} color="var(--primary)" />
          </div>
          <h2 style={{margin:'0 0 6px',fontSize:20,fontWeight:800,letterSpacing:'-0.02em'}}>Pricing saved</h2>
          <p style={{margin:'0 0 18px',fontSize:13,color:'var(--text-2)'}}>{days * (time === 'both' ? 2 : 1)} jeep slots auto-created for the next {days} days.</p>
        </div>
        <div className="card card-pad" style={{background:'var(--bg)',marginBottom:14}}>
          <div className="row between" style={{marginBottom:6}}>
            <span style={{fontSize:12,color:'var(--text-3)'}}>Created</span>
            <span style={{fontSize:13,fontWeight:700}} className="tnum">{days * (time === 'both' ? 2 : 1)} jeeps</span>
          </div>
          <div className="row between" style={{marginBottom:6}}>
            <span style={{fontSize:12,color:'var(--text-3)'}}>Skipped (already scheduled)</span>
            <span style={{fontSize:13,fontWeight:600}}>4</span>
          </div>
          <div className="row between">
            <span style={{fontSize:12,color:'var(--text-3)'}}>Booking links</span>
            <span style={{fontSize:12,fontWeight:600,color:'var(--primary)'}}>Auto-generated for each</span>
          </div>
        </div>
        <button className="btn btn-primary btn-lg btn-block" onClick={() => { setShowResult(false); go('shared'); }}>
          View jeeps
        </button>
      </Sheet>
    </div>
  );
}

// Keep CreateSharedSafariScreen as legacy / not used in nav but referenced
function CreateSharedSafariScreen(props) {
  return <PricingSetupScreen {...props} />;
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
          <h2 style={{fontSize:14,fontWeight:700,margin:0}}>By vendor</h2>
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
                    <span style={{fontSize:11.5,color:'var(--text-3)'}}>{v.role} · {v.trips} completed trip{v.trips > 1 ? 's' : ''}</span>
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
                      <button className="btn btn-primary" style={{padding:'7px 12px',fontSize:12}} onClick={() => toast(`Paid ${v.name} · WhatsApp sent`)}>
                        Mark as Paid
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {expanded === v.name && (
                <div style={{padding:'0 14px 14px',borderTop:'1px solid var(--line-soft)'}}>
                  {[
                    {date:'May 10', amt: 6200, ref:'TX-9821', paid:true, jeep:'JP-1038'},
                    {date:'Apr 28', amt: 5400, ref:'TX-9760', paid:true, jeep:'JP-1019'},
                    {date:'Apr 14', amt: 7100, ref:'TX-9712', paid:true, jeep:'JP-0998'},
                  ].map(p => (
                    <div key={p.ref} className="row between" style={{padding:'10px 0',fontSize:12,borderBottom:'1px solid var(--line-soft)'}}>
                      <span>{p.date} · <span style={{color:'var(--text-3)',fontFamily:'JetBrains Mono'}}>{p.jeep} · {p.ref}</span></span>
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

        {/* Total revenue */}
        <div className="card card-pad" style={{marginTop:14}}>
          <div className="row between" style={{marginBottom: 8}}>
            <div>
              <div style={{fontSize:11,color:'var(--text-3)',fontWeight:600,letterSpacing:0.04,textTransform:'uppercase'}}>Net revenue · May</div>
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
              <circle cx="300" cy="22" r="4" fill="var(--primary)" stroke="#fff" strokeWidth="2" />
            </svg>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:10,color:'var(--text-3)',fontWeight:500}}>
              <span>1</span><span>7</span><span>14</span><span>21</span><span>28</span>
            </div>
          </div>
        </div>

        {/* Breakdown card */}
        <div className="card card-pad" style={{marginTop:14}}>
          <h2 style={{fontSize:14,fontWeight:700,margin:'0 0 14px'}}>Breakdown</h2>
          <div className="stack" style={{gap:10}}>
            {[
              {label:'Gross bookings', val: 2890000, color:'var(--text)'},
              {label:'Platform commission (10%)', val: -289000, color:'var(--danger)'},
              {label:'Vendor payouts', val: -191400, color:'var(--danger)'},
              {label:'Net revenue', val: 2409600, color:'var(--primary)', bold: true},
            ].map((r, i) => (
              <div key={i} className="row between" style={{padding: r.bold ? '10px 0 0' : '4px 0', borderTop: r.bold ? '1px solid var(--line)' : 'none'}}>
                <span style={{fontSize: r.bold ? 13.5 : 12.5, fontWeight: r.bold ? 700 : 500, color: r.bold ? 'var(--text)' : 'var(--text-2)'}}>{r.label}</span>
                <span style={{fontSize: r.bold ? 16 : 13, fontWeight: r.bold ? 700 : 600, color: r.color}} className="tnum">
                  {r.val < 0 ? '−' : ''}LKR {Math.abs(r.val).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Split */}
        <div className="card card-pad" style={{marginTop:14}}>
          <h2 style={{fontSize:14,fontWeight:700,margin:'0 0 14px'}}>Shared vs Private</h2>
          <div className="row" style={{gap:18,alignItems:'center'}}>
            <Donut
              segments={[
                {value: 62, color: 'var(--primary)'},
                {value: 38, color: 'var(--brown)'},
              ]}
              value="2.41M"
              label="LKR"
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
            {name:'Yala Morning Slots', rev: 612000, jeeps: 38, trend: '+22%', idx: 0},
            {name:'Wilpattu Full Day', rev: 480000, jeeps: 21, trend: '+14%', idx: 2},
            {name:'Udawalawe PM', rev: 312000, jeeps: 32, trend: '+6%', idx: 1},
          ].map((s, i) => (
            <div key={i} className="card card-pad row" style={{gap: 12, padding: 12}}>
              <div className={`safari-thumb alt-${s.idx}`} style={{width:48,height:48,borderRadius:10,flex:'0 0 48px',overflow:'hidden'}} />
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13.5,fontWeight:700}}>{s.name}</div>
                <div className="row between" style={{marginTop:2}}>
                  <span style={{fontSize:11.5,color:'var(--text-3)'}}>{s.jeeps} confirmed jeeps</span>
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
      <TopBar title="Private Safaris" subtitle="3 active · 1 inquiry" onBell={() => go('notifications')} notifCount={3} />
      <div style={{padding:'0 16px'}}>
        <Chips items={['All','Inquiries','Booked','Past']} active="All" onChange={() => {}} />
        <div className="stack" style={{gap:12,marginTop:14}}>
          {[
            {customer:'Priya Patel', dates:'May 24 – May 26', amount: 168000, status:'confirmed', incl:['Meals','Guide','Camera'], party:4},
            {customer:'Hans Müller', dates:'May 29 – Jun 1', amount: 312000, status:'confirmed', incl:['Meals','Guide','Accommodation'], party:6},
            {customer:'Elena Brown', dates:'Jun 4', amount: 86000, status:'pending', incl:['Meals','Guide'], party:2, inquiry:true},
          ].map((p, i) => (
            <div key={i} className="card" style={{overflow:'hidden'}}>
              <SafariThumb index={1} type="private" name={p.customer} />
              <div style={{padding:'14px 16px 16px'}}>
                <div className="row between" style={{marginBottom: 6}}>
                  <div style={{fontSize:15,fontWeight:700}}>{p.customer}</div>
                  {p.inquiry ? (
                    <Badge kind="pending" icon="message-circle">Inquiry</Badge>
                  ) : (
                    <Badge kind={p.status === 'confirmed' ? 'confirmed' : 'pending'}>{p.status}</Badge>
                  )}
                </div>
                <div className="row" style={{gap:6,fontSize:12,color:'var(--text-3)',marginBottom:10}}>
                  <Icon name="calendar" size={12} />
                  <span>{p.dates}</span>
                  <span>·</span>
                  <Icon name="users" size={12} />
                  <span>{p.party} guests</span>
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
                  <button className="btn btn-secondary" style={{padding:'8px 14px',fontSize:12.5}}>
                    {p.inquiry ? 'Quote & Book →' : 'Manage'}
                  </button>
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
  const incTotal = (incl.meals?12000:0)+(incl.guide?15000:0)+(incl.accom?28000:0)+(incl.camera?6000:0);
  const baseFee = 50000;
  const commission = Math.round((baseFee + incTotal) * 0.10);
  const markup = Math.round((baseFee + incTotal) * 0.15);
  const total = baseFee + incTotal + commission + markup;
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
            <label className="label">WhatsApp</label>
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
          <label className="label">Vendor fee + inclusions</label>
          <div className="stack" style={{gap:8}}>
            {[
              {k:'meals',label:'Meals · 3 daily',icon:'utensils',price:12000},
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

        <div className="card card-pad" style={{marginBottom: 14}}>
          <h3 style={{fontSize:13,fontWeight:700,margin:'0 0 10px'}}>Financials (auto-calc)</h3>
          <div className="stack" style={{gap:6}}>
            {[
              {l:'Vendor fee + inclusions',v: baseFee + incTotal},
              {l:'Platform commission (10%)',v: commission},
              {l:'Owner markup (15%)',v: markup},
            ].map(r => (
              <div key={r.l} className="row between" style={{fontSize:12}}>
                <span style={{color:'var(--text-2)'}}>{r.l}</span>
                <span className="tnum">LKR {r.v.toLocaleString()}</span>
              </div>
            ))}
            <div style={{height:1,background:'var(--line)',margin:'4px 0'}} />
            <div className="row between">
              <span style={{fontSize:13.5,fontWeight:700}}>Customer pays</span>
              <span style={{fontSize:18,fontWeight:800,color:'var(--primary)'}} className="tnum">LKR {total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'14px 18px 28px',background:'var(--surface)',borderTop:'1px solid var(--line)',display:'flex',gap:10,zIndex:20}}>
        <button className="btn btn-secondary" style={{flex:1,padding:'14px'}} onClick={() => go('private')}>Cancel</button>
        <button className="btn btn-primary btn-lg" style={{flex:1.5}} onClick={() => { toast('Booked · WhatsApp payment link sent to Priya'); go('private'); }}>
          <Icon name="message-circle" size={15} color="#fff" /> Send Payment Link
        </button>
      </div>
    </div>
  );
}

Object.assign(window, {
  OwnerHomeScreen, SharedSafarisScreen, CreateSharedSafariScreen, PricingSetupScreen,
  VendorPaymentsScreen, RevenueAnalyticsScreen,
  PrivateSafarisScreen, CreatePrivateSafariScreen,
});
