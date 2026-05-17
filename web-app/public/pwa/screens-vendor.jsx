// screens-vendor.jsx - Vendor dashboard, jobs, earnings, subscription

function VendorHomeScreen({ go }) {
  const [showGate, setShowGate] = useState(false);
  return (
    <div className="app-body" style={{paddingBottom:110}}>
      <TopBar
        avatar="S"
        subtitle="Hi there"
        title="Sunil Jeeps"
        onBell={() => go('notifications')}
        notifCount={2}
      />
      <div style={{padding:'4px 16px 0'}}>
        {/* Subscription banner */}
        <div className="card card-pad" style={{marginBottom:14, background:'linear-gradient(135deg, var(--sand-soft) 0%, var(--sand) 100%)', border:'1px solid var(--sand)'}}>
          <div className="row between" style={{marginBottom:6}}>
            <div className="row" style={{gap:8}}>
              <Icon name="zap" size={16} color="var(--brown)" />
              <span style={{fontSize:13,fontWeight:700,color:'var(--brown)'}}>Vendor Pro · Active</span>
            </div>
            <span style={{fontSize:11,fontWeight:600,color:'var(--brown)'}}>4 days left</span>
          </div>
          <div style={{height:6,background:'rgba(139,94,60,0.18)',borderRadius:3,overflow:'hidden',marginBottom:10}}>
            <div style={{height:'100%',width:'13%',background:'var(--brown)'}} />
          </div>
          <div className="row" style={{gap:6}}>
            <button className="btn" style={{flex:1,background:'var(--brown)',color:'#fff',padding:'8px',fontSize:12}} onClick={() => go('subscription')}>
              Renew · LKR 2,500/mo
            </button>
            <button className="btn btn-secondary" style={{padding:'8px 10px',fontSize:11.5}} onClick={() => setShowGate(true)}>
              Preview gate
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
          <StatCard icon="briefcase" label="Jobs" value="12" trend="+3" trendDir="up" />
          <StatCard icon="banknote" label="Earned" value="48K" trend="+22%" trendDir="up" bg="var(--sand-soft)" fg="var(--brown)" />
          <StatCard icon="star" label="Rating" value="4.9" trend="86 reviews" trendDir="up" bg="#FEF3C7" fg="#92400E" />
        </div>

        {/* Pending response */}
        <div className="card card-pad" style={{marginTop:14,background:'#FEF3C7',border:'1px solid #FCD56B'}}>
          <div className="row" style={{gap:10}}>
            <div style={{width:34,height:34,borderRadius:10,background:'#92400E',display:'grid',placeItems:'center',flex:'0 0 34px'}}>
              <Icon name="clock" size={16} color="#fff" />
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:'#92400E'}}>2 jobs awaiting response</div>
              <div style={{fontSize:11.5,color:'#92400E',marginTop:2}}>Accept within 6h or owner reassigns</div>
            </div>
            <button className="btn" style={{background:'#92400E',color:'#fff',padding:'8px 12px',fontSize:12}} onClick={() => go('jobs')}>
              View
            </button>
          </div>
        </div>

        {/* Upcoming jobs */}
        <div className="section-head" style={{marginTop:18}}>
          <h2>Upcoming Jobs</h2>
          <a href="#" onClick={e => { e.preventDefault(); go('jobs'); }}>View all</a>
        </div>
        <div className="stack" style={{gap:10}}>
          {window.MOCK.VENDOR_JOBS.filter(j => j.status !== 'COMPLETED').slice(0,3).map((j, i) => (
            <button
              key={j.id}
              className="card card-pad row"
              onClick={() => go('jobDetail', { job: j })}
              style={{gap:12,padding:'14px',width:'100%',textAlign:'left'}}
            >
              <div style={{width:48,height:48,borderRadius:12,background: i === 0 ? 'var(--primary-100)' : 'var(--sky-100)',display:'grid',placeItems:'center',flex:'0 0 48px',color: i === 0 ? 'var(--primary-700)' : '#1E5A87',fontSize:11,fontWeight:700}}>
                {j.date.split(' ')[1]?.replace(',','') || '19'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div className="row between">
                  <span style={{fontSize:13,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{j.safari.split('·')[0].trim()}</span>
                  <Badge kind={j.status}>{j.status.toLowerCase()}</Badge>
                </div>
                <div className="row between" style={{marginTop:2}}>
                  <span style={{fontSize:11.5,color:'var(--text-3)',fontFamily:'JetBrains Mono'}}>{j.safari.split('·')[1]?.trim()}</span>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--primary)'}} className="tnum">LKR {j.payment.toLocaleString()}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Expired-subscription gate preview */}
      {showGate && (
        <div className="sheet-backdrop" onClick={() => setShowGate(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()} style={{textAlign:'center'}}>
            <div className="sheet-handle" />
            <div style={{width:80,height:80,borderRadius:24,background:'#FEE2E2',display:'grid',placeItems:'center',margin:'8px auto 18px'}}>
              <Icon name="lock" size={36} color="#991B1B" />
            </div>
            <h3 style={{margin:'0 0 8px',fontSize:18,fontWeight:800}}>Subscription expired</h3>
            <p style={{fontSize:13,color:'var(--text-2)',margin:'0 0 18px',lineHeight:1.5}}>
              Your Vendor Pro plan ended. You'll be removed from owners' vendor pickers until you renew.
            </p>
            <div style={{padding:'10px 12px',background:'var(--bg)',borderRadius:10,marginBottom:14,fontSize:11.5,color:'var(--text-2)',textAlign:'left'}}>
              <strong style={{display:'block',marginBottom:4,color:'var(--text)'}}>What stops working:</strong>
              · Can't accept new jobs<br/>
              · Removed from owner vendor lists<br/>
              · No new WhatsApp notifications
            </div>
            <button className="btn btn-primary btn-lg btn-block" onClick={() => { setShowGate(false); go('subscription'); }}>Renew now</button>
            <button onClick={() => setShowGate(false)} style={{width:'100%',marginTop:10,padding:8,color:'var(--text-3)',fontSize:12.5,fontWeight:500}}>Close preview</button>
          </div>
        </div>
      )}
    </div>
  );
}

function VendorJobsScreen({ go }) {
  const [tab, setTab] = useState('upcoming');
  const [actioned, setActioned] = useState({});
  const toast = useToast();
  const filtered = window.MOCK.VENDOR_JOBS.filter(j => {
    if (tab === 'upcoming') return ['PENDING','ACCEPTED'].includes(j.status);
    if (tab === 'completed') return j.status === 'COMPLETED';
    return true;
  });

  const respond = (job, response) => {
    setActioned(a => ({...a, [job.id]: response}));
    if (response === 'ACCEPT') {
      toast(`Accepted · WhatsApp sent to ${job.owner}`);
    } else {
      toast(`Declined · ${job.owner} will reassign`, 'info');
    }
  };

  return (
    <div className="app-body" style={{paddingBottom:110}}>
      <TopBar title="Jobs" subtitle="2 awaiting response" onBell={() => go('notifications')} notifCount={2} />
      <div style={{padding:'0 16px'}}>
        <Tabs
          items={[{id:'upcoming',label:'Upcoming'},{id:'completed',label:'Completed'},{id:'all',label:'All'}]}
          active={tab}
          onChange={setTab}
        />

        <div style={{marginTop:10,marginBottom:14,padding:'10px 12px',background:'rgba(37,211,102,0.08)',borderRadius:10,display:'flex',gap:10,alignItems:'center'}}>
          <Icon name="message-circle" size={14} color="#128C7E" />
          <span style={{fontSize:11.5,color:'#0F5E45',fontWeight:500,lineHeight:1.4}}>Owners are notified by WhatsApp the moment you accept or decline.</span>
        </div>

        <div className="stack" style={{gap:12}}>
          {filtered.map((j) => {
            const userAction = actioned[j.id];
            const effectiveStatus = userAction === 'ACCEPT' ? 'ACCEPTED' : userAction === 'DECLINE' ? 'DECLINED' : j.status;
            return (
              <div key={j.id} className="card" style={{position:'relative',overflow:'hidden',
                opacity: effectiveStatus === 'DECLINED' ? 0.55 : 1,
                borderColor: effectiveStatus === 'ACCEPTED' ? 'rgba(45,106,79,0.25)' : 'var(--line)',
              }}>
                <button onClick={() => go('jobDetail', { job: j })} style={{padding:14,width:'100%',textAlign:'left',display:'block',position:'relative'}}>
                  <div className="row between" style={{marginBottom:10}}>
                    <span style={{fontSize:10.5,color:'var(--text-3)',fontWeight:600,fontFamily:'JetBrains Mono'}}>{j.id}</span>
                    <Badge kind={effectiveStatus}>{effectiveStatus.toLowerCase()}</Badge>
                  </div>
                  <div style={{fontSize:14.5,fontWeight:700,letterSpacing:'-0.01em',marginBottom:6}}>{j.safari}</div>
                  <div className="row" style={{gap:6,fontSize:12,color:'var(--text-2)',marginBottom:4}}>
                    <Icon name="calendar" size={13} />
                    <span>{j.date}</span>
                  </div>
                  <div className="row" style={{gap:6,fontSize:12,color:'var(--text-2)',marginBottom:4}}>
                    <Icon name="map-pin" size={13} />
                    <span>{j.location}</span>
                  </div>
                  <div className="row" style={{gap:6,fontSize:12,color:'var(--text-2)',marginBottom:10}}>
                    <Icon name="user" size={13} />
                    <span>{j.owner} · {j.customers} customers</span>
                  </div>
                  <div className="row between" style={{paddingTop:10,borderTop:'1px solid var(--line-soft)'}}>
                    <span style={{fontSize:11.5,color:'var(--text-3)',fontWeight:500}}>Your fee</span>
                    <span style={{fontSize:15,fontWeight:700,color:'var(--primary)'}} className="tnum">LKR {j.payment.toLocaleString()}</span>
                  </div>
                </button>

                {effectiveStatus === 'PENDING' && (
                  <div className="row" style={{gap:8,padding:'0 14px 14px'}}>
                    <button className="btn btn-secondary" style={{flex:1,padding:'10px',fontSize:13}} onClick={(e) => { e.stopPropagation(); respond(j, 'DECLINE'); }}>
                      <Icon name="x" size={14} /> Decline
                    </button>
                    <button className="btn btn-primary" style={{flex:1.4,padding:'10px',fontSize:13}} onClick={(e) => { e.stopPropagation(); respond(j, 'ACCEPT'); }}>
                      <Icon name="check" size={14} color="#fff" /> Accept
                    </button>
                  </div>
                )}
                {effectiveStatus === 'ACCEPTED' && (
                  <div style={{padding:'10px 14px',background:'rgba(45,106,79,0.06)',borderTop:'1px solid var(--line-soft)',display:'flex',alignItems:'center',gap:8,fontSize:11.5,color:'var(--primary-700)',fontWeight:600}}>
                    <Icon name="check-circle-2" size={13} color="var(--primary)" />
                    Accepted · Owner notified via WhatsApp
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function JobDetailScreen({ go, job }) {
  const j = job || window.MOCK.VENDOR_JOBS[0];
  return (
    <div className="app-body" style={{paddingBottom:120}}>
      <TopBar title={j.id} subtitle={j.safari.split('—')[0].trim()} onBack={() => go('jobs')} />
      <div style={{padding:'0 16px'}}>
        <div className="card card-pad" style={{marginBottom: 12}}>
          <div className="row between" style={{marginBottom: 12}}>
            <div>
              <div style={{fontSize:11,color:'var(--text-3)',fontWeight:600,letterSpacing:0.04,textTransform:'uppercase'}}>Payment</div>
              <div style={{fontSize:24,fontWeight:800,color:'var(--primary)',letterSpacing:'-0.02em'}} className="tnum">LKR {j.payment.toLocaleString()}</div>
            </div>
            <Badge kind={j.status === 'pending' ? 'pending' : 'confirmed'}>{j.status}</Badge>
          </div>
          <div style={{height:1,background:'var(--line)',margin:'4px 0 12px'}} />
          <div className="stack" style={{gap:10}}>
            {[
              {ico:'calendar',label:'Date & time',val: j.date},
              {ico:'map-pin',label:'Pickup location',val: j.location},
              {ico:'users',label:'Customer count',val: `${j.customers} passengers`},
              {ico:'user',label:'Safari owner',val: j.owner},
            ].map(x => (
              <div key={x.label} className="row" style={{gap:12}}>
                <div style={{width:32,height:32,borderRadius:8,background:'var(--bg)',display:'grid',placeItems:'center',flex:'0 0 32px'}}>
                  <Icon name={x.ico} size={14} color="var(--text-3)" />
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:'var(--text-3)',fontWeight:500}}>{x.label}</div>
                  <div style={{fontSize:13,fontWeight:600}}>{x.val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <h3 style={{fontSize:13,fontWeight:700,margin:'14px 0 8px'}}>Pickup map</h3>
        <MapPlaceholder height={160} />

        <h3 style={{fontSize:13,fontWeight:700,margin:'18px 0 8px'}}>Pickup points</h3>
        <div className="stack" style={{gap:8}}>
          {[
            {name: 'Tissamaharama Hotel', time: '5:30 AM', pax: 2},
            {name: 'Kataragama Junction', time: '5:50 AM', pax: 2},
          ].map((p, i) => (
            <div key={i} className="card card-pad row" style={{gap:12,padding:12}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:'var(--primary)',color:'#fff',display:'grid',placeItems:'center',fontSize:12,fontWeight:700,flex:'0 0 28px'}}>{i+1}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>{p.name}</div>
                <div style={{fontSize:11.5,color:'var(--text-3)'}}>{p.time} · {p.pax} passengers</div>
              </div>
              <Icon name="navigation" size={16} color="var(--primary)" />
            </div>
          ))}
        </div>
      </div>

      <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'14px 18px 28px',background:'var(--surface)',borderTop:'1px solid var(--line)',display:'flex',gap:10,zIndex:20}}>
        <button className="btn btn-secondary" style={{flex:1,padding:'14px'}}>
          <Icon name="phone" size={15} /> Call owner
        </button>
        <button className="btn btn-primary btn-lg" style={{flex:1.4}}>
          <Icon name="check" size={16} color="#fff" /> Accept Job
        </button>
      </div>
    </div>
  );
}

function VendorEarningsScreen({ go }) {
  return (
    <div className="app-body" style={{paddingBottom:110}}>
      <TopBar title="Earnings" subtitle="May 2026" onBell={() => go('notifications')} notifCount={2} />
      <div style={{padding:'4px 16px 0'}}>
        <div className="card card-pad" style={{marginBottom:14}}>
          <div style={{fontSize:11,color:'var(--text-3)',fontWeight:600,letterSpacing:0.04,textTransform:'uppercase'}}>Total earned · May</div>
          <div style={{fontSize:30,fontWeight:800,letterSpacing:'-0.02em',marginTop:2}} className="tnum">LKR 48,200</div>
          <span className="stat-trend up" style={{marginTop:6}}>
            <Icon name="trending-up" size={12} /> +22% vs Apr
          </span>
          <div style={{marginTop:14}}>
            <BarChart data={[18,32,28,45,38,52,48,62,55,48,68,72]} highlight={11} />
            <div className="bar-labels" style={{fontSize:9}}>
              <span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span>
            </div>
          </div>
        </div>

        <div className="row" style={{gap:10,marginBottom:14}}>
          <div className="card card-pad" style={{flex:1}}>
            <div style={{fontSize:10.5,color:'var(--text-3)',fontWeight:600,letterSpacing:0.04,textTransform:'uppercase'}}>Paid out</div>
            <div style={{fontSize:18,fontWeight:700,color:'var(--success)',marginTop:2}} className="tnum">LKR 36.8K</div>
          </div>
          <div className="card card-pad" style={{flex:1}}>
            <div style={{fontSize:10.5,color:'var(--text-3)',fontWeight:600,letterSpacing:0.04,textTransform:'uppercase'}}>Pending</div>
            <div style={{fontSize:18,fontWeight:700,color:'var(--warning)',marginTop:2}} className="tnum">LKR 11.4K</div>
          </div>
        </div>

        <h2 style={{fontSize:14,fontWeight:700,margin:'18px 0 10px'}}>Recent payments</h2>
        <div className="stack" style={{gap:8}}>
          {[
            {date:'May 14', desc:'Yala Morning · J-3201', amt: 4200, status:'paid'},
            {date:'May 12', desc:'Wilpattu Full Day · J-3198', amt: 6800, status:'pending'},
            {date:'May 10', desc:'Udawalawe PM · J-3193', amt: 3500, status:'paid'},
            {date:'May 06', desc:'Yala Morning · J-3188', amt: 4200, status:'paid'},
          ].map((p, i) => (
            <div key={i} className="card card-pad row" style={{padding:'12px 14px',gap:12}}>
              <div style={{width:36,height:36,borderRadius:10,background: p.status === 'paid' ? 'var(--primary-100)' : '#FEF3C7',display:'grid',placeItems:'center',flex:'0 0 36px'}}>
                <Icon name={p.status === 'paid' ? 'arrow-down-left' : 'clock'} size={15} color={p.status === 'paid' ? 'var(--primary)' : '#92400E'} />
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.desc}</div>
                <div style={{fontSize:11.5,color:'var(--text-3)'}}>{p.date}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:14,fontWeight:700}} className="tnum">+ LKR {p.amt.toLocaleString()}</div>
                <Badge kind={p.status === 'paid' ? 'active' : 'pending'}>{p.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SubscriptionScreen({ go }) {
  const toast = useToast();
  return (
    <div className="app-body" style={{paddingBottom:110}}>
      <TopBar title="Subscription" onBell={() => go('notifications')} notifCount={2} />
      <div style={{padding:'4px 16px 0'}}>
        {/* Current plan */}
        <div className="card" style={{background:'linear-gradient(135deg, #1F4F3A 0%, var(--primary) 100%)', border:'none', color:'#fff', padding:'22px 20px', marginBottom: 16, position:'relative', overflow:'hidden'}}>
          <div style={{position:'absolute',top:-30,right:-30,width:140,height:140,background:'rgba(255,255,255,0.08)',borderRadius:'50%'}} />
          <div style={{position:'absolute',bottom:-50,left:-20,width:160,height:160,background:'rgba(255,255,255,0.04)',borderRadius:'50%'}} />
          <div style={{position:'relative'}}>
            <div className="row between" style={{marginBottom: 18}}>
              <div>
                <div style={{fontSize:11,opacity:0.7,fontWeight:600,letterSpacing:0.04,textTransform:'uppercase'}}>Current Plan</div>
                <div style={{fontSize:22,fontWeight:800,letterSpacing:'-0.02em'}}>Vendor Pro</div>
              </div>
              <div style={{padding:'4px 10px',background:'rgba(255,255,255,0.2)',borderRadius:999,fontSize:11,fontWeight:600}}>ACTIVE</div>
            </div>

            <div style={{fontSize:32,fontWeight:800,letterSpacing:'-0.03em'}}>LKR 2,500<span style={{fontSize:14,fontWeight:500,opacity:0.7}}>/month</span></div>

            <div style={{marginTop:18,padding:'12px',background:'rgba(255,255,255,0.1)',borderRadius:10}}>
              <div className="row between" style={{marginBottom:6}}>
                <span style={{fontSize:12,opacity:0.85}}>Renews in 4 days</span>
                <span style={{fontSize:12,fontWeight:600}}>May 21</span>
              </div>
              <div style={{height:6,background:'rgba(255,255,255,0.15)',borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',width:'13%',background:'#fff'}} />
              </div>
            </div>
          </div>
        </div>

        <button className="btn btn-primary btn-lg btn-block" style={{marginBottom: 18}} onClick={() => toast('Subscription renewed · May 21 → Jun 21')}>
          <Icon name="refresh-cw" size={16} color="#fff" /> Renew Now
        </button>

        {/* Benefits */}
        <h2 style={{fontSize:14,fontWeight:700,margin:'0 0 10px'}}>Plan benefits</h2>
        <div className="card" style={{padding:6}}>
          {[
            {ico:'briefcase', text:'Unlimited job assignments'},
            {ico:'bell', text:'Push notifications for new jobs'},
            {ico:'bar-chart-3', text:'Earnings analytics & history'},
            {ico:'star', text:'Featured listing in vendor directory'},
            {ico:'headphones', text:'Priority support · 24/7 chat'},
          ].map((b, i) => (
            <div key={i} className="row" style={{gap:12,padding:'12px 12px',borderBottom: i < 4 ? '1px solid var(--line-soft)' : 'none'}}>
              <div style={{width:30,height:30,borderRadius:8,background:'var(--primary-100)',display:'grid',placeItems:'center',flex:'0 0 30px'}}>
                <Icon name={b.ico} size={14} color="var(--primary)" />
              </div>
              <span style={{fontSize:13,flex:1}}>{b.text}</span>
              <Icon name="check" size={16} color="var(--primary)" />
            </div>
          ))}
        </div>

        <div style={{marginTop:14,padding:'12px 14px',background:'var(--bg)',borderRadius:12,fontSize:11.5,color:'var(--text-3)',textAlign:'center',lineHeight:1.5}}>
          Manage payment via <strong style={{color:'var(--text)'}}>Stripe</strong> · Cancel anytime
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { VendorHomeScreen, VendorJobsScreen, JobDetailScreen, VendorEarningsScreen, SubscriptionScreen });
