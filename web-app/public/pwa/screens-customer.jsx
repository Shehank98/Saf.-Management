// screens-customer.jsx - Browse, Detail (Reserve), Public Pay, My Bookings

function BrowseScreen({ go }) {
  const [shareType, setShareType] = useState('shared');
  const [filter, setFilter] = useState('week');
  const [mapView, setMapView] = useState(false);
  const safaris = window.MOCK.SAFARIS;
  return (
    <div className="app-body" style={{paddingBottom: 110}}>
      <div style={{padding:'8px 16px 12px',background:'var(--bg)',position:'sticky',top:0,zIndex:5}}>
        <div className="row between" style={{marginBottom:12}}>
          <div>
            <div style={{fontSize:12,color:'var(--text-3)',fontWeight:500}}>Find your safari</div>
            <h1 style={{fontSize:22,fontWeight:800,letterSpacing:'-0.02em',margin:0}}>Sri Lanka, May 19</h1>
          </div>
          <button className="bell" onClick={() => setMapView(!mapView)}>
            <Icon name={mapView ? 'list' : 'map'} size={18} />
          </button>
        </div>

        <div className="input-icon-wrap" style={{marginBottom:12}}>
          <Icon name="search" size={16} className="input-icon" color="var(--text-3)" />
          <input className="input" placeholder="Yala, Udawalawe, Wilpattu…" />
        </div>

        <div className="row" style={{gap:6,marginBottom:10}}>
          <button
            className="chip"
            style={{flex:1, background: shareType === 'shared' ? 'var(--primary)' : 'var(--surface)', color: shareType === 'shared' ? '#fff' : 'var(--text-2)', borderColor: shareType === 'shared' ? 'var(--primary)' : 'var(--line)'}}
            onClick={() => setShareType('shared')}
          >
            <Icon name="users" size={13} style={{marginRight:4}} /> Shared
          </button>
          <button
            className="chip"
            style={{flex:1, background: shareType === 'private' ? 'var(--primary)' : 'var(--surface)', color: shareType === 'private' ? '#fff' : 'var(--text-2)', borderColor: shareType === 'private' ? 'var(--primary)' : 'var(--line)'}}
            onClick={() => setShareType('private')}
          >
            <Icon name="user" size={13} style={{marginRight:4}} /> Private
          </button>
        </div>

        <Chips
          items={[
            {id:'today',label:'Today'},
            {id:'week',label:'This Week'},
            {id:'full',label:'Full Day'},
            {id:'half',label:'Half Day'},
            {id:'morning',label:'Morning'},
          ]}
          active={filter}
          onChange={setFilter}
        />
      </div>

      <div style={{padding:'4px 16px 0'}}>
        <div className="row between" style={{margin:'8px 4px 12px'}}>
          <span style={{fontSize:12,color:'var(--text-3)',fontWeight:500}}>{safaris.length} safaris available</span>
          <button style={{fontSize:12.5,fontWeight:600,color:'var(--text)',display:'flex',alignItems:'center',gap:4}}>
            Sort <Icon name="chevron-down" size={12} />
          </button>
        </div>

        {/* Explainer chip about model */}
        <div style={{padding:'10px 12px',background:'var(--sand-soft)',borderRadius:10,marginBottom:14,display:'flex',gap:10,alignItems:'flex-start',border:'1px solid var(--sand)'}}>
          <Icon name="info" size={14} color="var(--brown)" />
          <span style={{fontSize:11.5,color:'var(--brown)',fontWeight:500,lineHeight:1.4,flex:1}}>
            <strong>How it works:</strong> Reserve a seat free. Once 4 seats are filled, you and the others get a WhatsApp payment link with 48h to confirm.
          </span>
        </div>

        <div className="stack" style={{gap:14}}>
          {safaris.map(s => (
            <SafariCard key={s.id} safari={s} onClick={() => go('detail', { safari: s })} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SafariDetailScreen({ go, safari }) {
  const s = safari || window.MOCK.SAFARIS[0];
  const [selected, setSelected] = useState([2]);
  const [pickup, setPickup] = useState('Tissamaharama Hotel');
  const [meal, setMeal] = useState('veg');
  const [showPickup, setShowPickup] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const total = (s.price * selected.length);
  const paidSeats = s.paidSeats || 0;
  const reservedSeats = s.reservedSeats || 0;
  const totalSeats = s.totalSeats || 6;
  const minSeats = s.minSeats || 4;
  const remaining = minSeats - paidSeats - reservedSeats;
  const toast = useToast();

  // Mark which seats are paid/reserved/free
  const seatState = Array.from({length: totalSeats}).map((_, i) => {
    if (i < paidSeats) return 'paid';
    if (i < paidSeats + reservedSeats) return 'reserved';
    return 'free';
  });

  const toggle = (i) => {
    if (seatState[i] !== 'free') return;
    setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  return (
    <div className="app-body" style={{paddingBottom:120}}>
      {/* Hero */}
      <div style={{position:'relative',height:240,marginBottom:14}}>
        <div className={`safari-thumb alt-${s.thumb}`} style={{height:'100%'}}>
          <div className="sun" />
          <div className="terrain" />
          <div className="silhouette">
            <div style={{width:30,height:32,borderRadius:'4px 4px 0 0'}} />
            <div style={{width:16,height:18,borderRadius:'50% 50% 0 0 / 80% 80% 0 0'}} />
            <div style={{width:22,height:24,borderRadius:'4px 4px 0 0'}} />
          </div>
        </div>
        <div style={{position:'absolute',top:50,left:16,right:16,display:'flex',justifyContent:'space-between',zIndex:5}}>
          <button onClick={() => go('browse')} style={{width:40,height:40,borderRadius:12,background:'rgba(255,255,255,0.92)',display:'grid',placeItems:'center'}}>
            <Icon name="arrow-left" size={20} />
          </button>
          <button style={{width:40,height:40,borderRadius:12,background:'rgba(255,255,255,0.92)',display:'grid',placeItems:'center'}}>
            <Icon name="heart" size={20} />
          </button>
        </div>
        <div style={{position:'absolute',bottom:12,left:16,zIndex:5,display:'flex',gap:6}}>
          <span style={{background:'rgba(0,0,0,0.55)',color:'#fff',padding:'4px 10px',borderRadius:999,fontSize:11,fontWeight:600,display:'flex',alignItems:'center',gap:4}}>
            <Icon name="star" size={11} color="#FFCB48" /> {s.rating} · {s.reviews}
          </span>
          <span style={{background:'rgba(0,0,0,0.55)',color:'#fff',padding:'4px 10px',borderRadius:999,fontSize:11,fontWeight:600}}>{s.duration}</span>
          <span style={{background:'rgba(0,0,0,0.55)',color:'#fff',padding:'4px 10px',borderRadius:999,fontSize:11,fontWeight:600,fontFamily:'JetBrains Mono'}}>{s.jeepCode}</span>
        </div>
      </div>

      <div style={{padding:'0 18px'}}>
        <h1 style={{fontSize:22,fontWeight:800,letterSpacing:'-0.02em',margin:'0 0 6px'}}>{s.name}</h1>
        <div className="row" style={{gap:6,color:'var(--text-2)',fontSize:13,marginBottom:14}}>
          <Icon name="map-pin" size={14} color="var(--primary)" />
          <span>{s.locationFull || s.location}</span>
          <span style={{color:'var(--text-3)',margin:'0 4px'}}>·</span>
          <Icon name="calendar" size={14} color="var(--primary)" />
          <span>{s.date} · {s.time}</span>
        </div>

        {/* Occupancy panel */}
        <div className="card card-pad" style={{marginBottom:14, background: s.status === 'CONFIRMED' ? 'var(--primary-100)' : 'var(--surface)', borderColor: s.status === 'CONFIRMED' ? 'rgba(45,106,79,0.15)' : 'var(--line)'}}>
          <div className="row between" style={{marginBottom:8}}>
            <div className="row" style={{gap:8}}>
              <Icon name="users" size={16} color={s.status === 'CONFIRMED' ? 'var(--primary)' : 'var(--text)'} />
              <span style={{fontSize:13,fontWeight:700}}>Seat occupancy</span>
            </div>
            <Badge kind={s.status || 'OPEN'}>
              {s.status === 'PENDING_PAYMENT' ? 'Paying' : s.status === 'CONFIRMED' ? 'Confirmed' : 'Open'}
            </Badge>
          </div>
          <div className="occ-bar" style={{marginTop:18}}>
            <div className="fill">
              <div className="paid" style={{width: ((paidSeats/totalSeats)*100) + '%'}} />
              <div className="reserved" style={{width: ((reservedSeats/totalSeats)*100) + '%'}} />
            </div>
            <div className="min-mark" style={{left: `calc(${(minSeats/totalSeats)*100}% - 1px)`}} />
          </div>
          <div className="row between" style={{marginTop:10}}>
            <div style={{fontSize:11.5}}>
              <span style={{fontWeight:700,color:'var(--primary)'}}>{paidSeats} paid</span>
              {reservedSeats > 0 && <span style={{color:'var(--text-3)'}}> · {reservedSeats} reserved</span>}
              <span style={{color:'var(--text-3)'}}> · {totalSeats - paidSeats - reservedSeats} open</span>
            </div>
            {s.status !== 'CONFIRMED' && s.status !== 'PENDING_PAYMENT' && (
              <span style={{fontSize:11.5,fontWeight:600,color:'var(--brown)'}}>{remaining} more to trigger payment</span>
            )}
          </div>
        </div>

        {/* Guide */}
        <div className="row" style={{gap:10,marginBottom:18,padding:'12px 14px',background:'var(--sand-soft)',borderRadius:12}}>
          <div className="avatar-sm" style={{background:'var(--brown)'}}>{s.guide.split(' ').map(n=>n[0]).join('')}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,color:'var(--text-3)'}}>Your guide</div>
            <div style={{fontSize:13,fontWeight:600}}>{s.guide}</div>
          </div>
          <button className="btn btn-secondary" style={{padding:'6px 12px',fontSize:12}}>
            <Icon name="message-circle" size={14} />
          </button>
        </div>

        {/* Seat map */}
        <h3 style={{fontSize:14,fontWeight:700,margin:'0 0 4px'}}>Choose your seat</h3>
        <p style={{fontSize:11.5,color:'var(--text-3)',margin:'0 0 12px'}}>Free reservation — no charge until 4 seats fill.</p>
        <div className="seat-map">
          <div className="seat-jeep">
            <div className="seat driver">DRV</div>
            <div className="seat driver">CO</div>
            <div className="seat-spacer" />
            <div className="seat-spacer" />
            <div className="seat-spacer" />
            {Array.from({length: 6}).map((_, i) => {
              const st = seatState[i];
              const isSel = selected.includes(i);
              return (
                <div
                  key={i}
                  className={`seat ${st === 'paid' ? 'taken' : ''} ${st === 'reserved' ? 'taken' : ''} ${isSel ? 'selected' : ''}`}
                  onClick={() => toggle(i)}
                  style={{
                    gridColumn: (i % 2 === 0) ? (i % 4 === 0 ? '1' : '4') : (i % 4 === 1 ? '2' : '5'),
                    background: st === 'reserved' ? 'var(--sky-100)' : undefined,
                    borderColor: st === 'reserved' ? '#87CEEB' : undefined,
                    color: st === 'reserved' ? '#1E5A87' : undefined,
                  }}
                >
                  {String.fromCharCode(65 + Math.floor(i/2))}{(i % 2) + 1}
                </div>
              );
            })}
          </div>
          <div className="seat-legend">
            <span><span className="sw" style={{background:'var(--surface)',border:'1.5px solid var(--line)'}} /> Open</span>
            <span><span className="sw" style={{background:'var(--sky-100)'}} /> Reserved</span>
            <span><span className="sw" style={{background:'#E5E0D5'}} /> Paid</span>
            <span><span className="sw" style={{background:'var(--primary)'}} /> Yours</span>
          </div>
        </div>

        {/* Pickup */}
        <div className="field" style={{marginTop:18}}>
          <label className="label row between" style={{marginBottom:6}}>
            <span>Pickup location</span>
            <span style={{fontSize:10,fontWeight:500,color:'var(--text-3)',display:'flex',alignItems:'center',gap:3}}>
              <Icon name="circle-dot" size={10} /> Within 7 km of park
            </span>
          </label>
          <button className="input" style={{display:'flex',alignItems:'center',justifyContent:'space-between',textAlign:'left'}} onClick={() => setShowPickup(true)}>
            <span className="row" style={{gap:8}}>
              <Icon name="map-pin" size={16} color="var(--primary)" />
              <span>{pickup}</span>
              <span style={{fontSize:10.5,color:'var(--success)',fontWeight:600,display:'inline-flex',alignItems:'center',gap:3}}>
                <Icon name="check" size={10} /> 4.2 km
              </span>
            </span>
            <Icon name="chevron-down" size={16} color="var(--text-3)" />
          </button>
        </div>

        {/* Meal */}
        <div className="field">
          <label className="label">Meal preference</label>
          <div className="row" style={{gap:6,flexWrap:'wrap'}}>
            {[
              {id:'veg',label:'Vegetarian'},
              {id:'nonveg',label:'Non-Veg'},
              {id:'vegan',label:'Vegan'},
              {id:'none',label:'No meal'},
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMeal(m.id)}
                className="chip"
                style={{
                  flex:'1 0 calc(50% - 3px)',
                  background: meal === m.id ? 'var(--primary)' : 'var(--surface)',
                  color: meal === m.id ? '#fff' : 'var(--text-2)',
                  borderColor: meal === m.id ? 'var(--primary)' : 'var(--line)',
                  padding:'10px',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reserve footer */}
      <div style={{
        position:'absolute',bottom:0,left:0,right:0,
        background:'var(--surface)',
        borderTop:'1px solid var(--line)',
        padding:'14px 18px 28px',
        display:'flex',alignItems:'center',gap:12,
        zIndex:20,
      }}>
        <div>
          <div style={{fontSize:10.5,color:'var(--text-3)',fontWeight:500,letterSpacing:0.04,textTransform:'uppercase'}}>Pay later · LKR {total.toLocaleString()}</div>
          <div style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>Free to reserve</div>
        </div>
        <button className="btn btn-primary btn-lg" style={{flex:1,marginLeft:'auto'}} onClick={() => setShowSheet(true)} disabled={selected.length === 0}>
          Reserve Seat <Icon name="arrow-right" size={16} color="#fff" />
        </button>
      </div>

      <Sheet open={showPickup} onClose={() => setShowPickup(false)} title="Pickup point">
        <div style={{marginBottom: 14}}>
          <MapPlaceholder height={140} />
        </div>
        {[
          {name:'Tissamaharama Hotel',dist:'4.2 km',ok:true},
          {name:'Kataragama Junction',dist:'5.8 km',ok:true},
          {name:'Yala Gate',dist:'1.4 km',ok:true},
          {name:'Hotel Hibiscus · Tissa',dist:'6.1 km',ok:true},
          {name:'Galle Town',dist:'72 km',ok:false},
        ].map(p => (
          <button
            key={p.name}
            onClick={() => { if (p.ok) { setPickup(p.name); setShowPickup(false); } }}
            className="row"
            style={{padding:'14px 0',borderBottom:'1px solid var(--line-soft)',width:'100%',gap:12,fontSize:14,textAlign:'left',opacity: p.ok ? 1 : 0.45,cursor: p.ok ? 'pointer' : 'not-allowed'}}
          >
            <Icon name="map-pin" size={18} color={p.ok ? 'var(--primary)' : 'var(--text-3)'} />
            <div style={{flex:1}}>
              <div>{p.name}</div>
              <div style={{fontSize:10.5,color: p.ok ? 'var(--success)' : 'var(--danger)',fontWeight:600,marginTop:1}}>
                {p.dist} {p.ok ? '· within geofence' : '· outside 7 km · not eligible'}
              </div>
            </div>
            {p.name === pickup && <Icon name="check" size={18} color="var(--primary)" />}
          </button>
        ))}
      </Sheet>

      <Sheet open={showSheet} onClose={() => setShowSheet(false)} title="Reserve seat · no charge yet">
        <div className="card card-pad" style={{marginBottom: 14,background:'var(--bg)'}}>
          <div className="row between" style={{marginBottom:8}}>
            <span style={{fontSize:12,color:'var(--text-3)'}}>Safari</span>
            <span style={{fontSize:12.5,fontWeight:600}}>{s.name}</span>
          </div>
          <div className="row between" style={{marginBottom:8}}>
            <span style={{fontSize:12,color:'var(--text-3)'}}>Seats</span>
            <span style={{fontSize:12.5,fontWeight:600}}>{selected.length} · {selected.map(i => String.fromCharCode(65 + Math.floor(i/2)) + ((i % 2) + 1)).join(', ')}</span>
          </div>
          <div className="row between" style={{marginBottom:8}}>
            <span style={{fontSize:12,color:'var(--text-3)'}}>Pickup</span>
            <span style={{fontSize:12.5,fontWeight:600}}>{pickup}</span>
          </div>
          <div className="row between" style={{marginBottom:8}}>
            <span style={{fontSize:12,color:'var(--text-3)'}}>Amount due (later)</span>
            <span style={{fontSize:14,fontWeight:700,color:'var(--primary)'}}>LKR {total.toLocaleString()}</span>
          </div>
        </div>

        <div style={{padding:'12px 14px',background:'rgba(37,211,102,0.08)',borderRadius:10,border:'1px solid rgba(37,211,102,0.2)',marginBottom:18,display:'flex',gap:10,alignItems:'flex-start'}}>
          <div style={{width:28,height:28,borderRadius:'50%',background:'#25D366',display:'grid',placeItems:'center',flex:'0 0 28px'}}>
            <Icon name="message-circle" size={14} color="#fff" />
          </div>
          <span style={{fontSize:11.5,color:'#0F5E45',fontWeight:500,lineHeight:1.4,flex:1}}>
            We'll send a WhatsApp payment link once {remaining} more {remaining === 1 ? 'seat is' : 'seats are'} reserved. You'll have 48 hours to pay.
          </span>
        </div>

        <button className="btn btn-primary btn-lg btn-block" onClick={() => { setShowSheet(false); toast('Seat reserved · Booking #B-2402'); go('bookings'); }}>
          <Icon name="check" size={16} color="#fff" /> Reserve Free
        </button>
        <button className="btn btn-secondary btn-lg btn-block" style={{marginTop:8}} onClick={() => setShowSheet(false)}>Back</button>
      </Sheet>
    </div>
  );
}

// Public booking page — what the WhatsApp link opens (no auth)
function PublicBookingPayScreen({ go }) {
  const [paying, setPaying] = useState(false);
  const toast = useToast();
  const total = 5200;
  // simulate countdown
  const [hrs, setHrs] = useState(31);
  const [mins, setMins] = useState(48);
  useEffect(() => {
    const id = setInterval(() => {
      setMins(m => {
        if (m <= 0) { setHrs(h => h - 1); return 59; }
        return m - 1;
      });
    }, 60000); // every minute (irrelevant for demo, but realistic)
    return () => clearInterval(id);
  }, []);

  const onPay = () => {
    setPaying(true);
    setTimeout(() => { setPaying(false); toast('Payment confirmed · Jeep CONFIRMED'); go('bookings'); }, 1500);
  };

  return (
    <div className="app-body" style={{background:'#0F1A1C',color:'#fff',paddingBottom: 0}}>
      <div style={{padding:'30px 20px 20px',background:'linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)',color:'#fff'}}>
        <div className="row between" style={{marginBottom:18}}>
          <div className="row" style={{gap:8}}>
            <div style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.18)',display:'grid',placeItems:'center'}}>
              <Icon name="compass" size={16} color="#fff" />
            </div>
            <span style={{fontWeight:700,fontSize:14}}>Safari Adventures</span>
          </div>
          <span className="wa-pill"><Icon name="message-circle" size={11} color="#fff" /> via WhatsApp</span>
        </div>
        <div style={{fontSize:11,opacity:0.7,fontWeight:600,letterSpacing:0.04,textTransform:'uppercase'}}>Confirm your seat</div>
        <h1 style={{fontSize:24,fontWeight:800,letterSpacing:'-0.02em',margin:'4px 0 0'}}>Minneriya Elephants</h1>
        <div style={{fontSize:13,opacity:0.85,marginTop:4}}>Fri, May 22 · 3:30 PM · JP-1045</div>

        <div style={{marginTop:18, padding:'12px 14px',background:'rgba(255,255,255,0.12)',borderRadius:12,display:'flex',alignItems:'center',gap:10}}>
          <Icon name="clock" size={16} color="#FFD27A" />
          <div style={{flex:1}}>
            <div style={{fontSize:11,opacity:0.8}}>Pay within</div>
            <div style={{fontSize:18,fontWeight:800,fontFamily:'JetBrains Mono'}} className="tnum">{hrs}h {String(mins).padStart(2,'0')}m</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:11,opacity:0.8}}>Deadline</div>
            <div style={{fontSize:13,fontWeight:600}}>Sat May 17 · 9:41 AM</div>
          </div>
        </div>
      </div>

      <div style={{background:'#F4F0E5',padding:'22px 20px',color:'var(--text)'}}>
        <div style={{padding:'12px 14px',background:'var(--primary-100)',borderRadius:10,marginBottom:16,display:'flex',gap:10,alignItems:'center'}}>
          <Icon name="check-circle-2" size={16} color="var(--primary)" />
          <span style={{fontSize:12,color:'var(--primary-700)',fontWeight:600,lineHeight:1.4}}>
            4 of 4 seats reserved — your safari is going ahead. Lock in your seat now.
          </span>
        </div>

        <div className="card card-pad" style={{marginBottom:14}}>
          <div className="row between" style={{marginBottom:8}}>
            <span style={{fontSize:12,color:'var(--text-3)'}}>Booking ID</span>
            <span style={{fontSize:12,fontWeight:600,fontFamily:'JetBrains Mono'}}>B-2403</span>
          </div>
          <div className="row between" style={{marginBottom:8}}>
            <span style={{fontSize:12,color:'var(--text-3)'}}>Seat</span>
            <span style={{fontSize:12,fontWeight:600}}>B2 (window)</span>
          </div>
          <div className="row between" style={{marginBottom:8}}>
            <span style={{fontSize:12,color:'var(--text-3)'}}>Pickup</span>
            <span style={{fontSize:12,fontWeight:600}}>Habarana Junction · 3:00 PM</span>
          </div>
          <div style={{height:1,background:'var(--line)',margin:'10px 0'}} />
          <div className="row between">
            <span style={{fontSize:13,fontWeight:600}}>Amount</span>
            <span style={{fontSize:20,fontWeight:800,color:'var(--primary)'}} className="tnum">LKR {total.toLocaleString()}</span>
          </div>
        </div>

        <div className="card" style={{padding:14,marginBottom:14}}>
          <div className="row between" style={{marginBottom:10}}>
            <span style={{fontSize:11,fontWeight:600,color:'var(--text-3)'}}>CARD</span>
            <Icon name="lock" size={12} color="var(--text-3)" />
          </div>
          <div style={{fontSize:17,letterSpacing:'0.04em',fontFamily:'JetBrains Mono',color:'var(--text-3)'}}>•••• •••• •••• ____</div>
          <div className="row" style={{marginTop:14,gap:10}}>
            <div style={{flex:1,padding:'8px 10px',background:'var(--bg)',borderRadius:8,fontSize:12,color:'var(--text-3)',fontFamily:'JetBrains Mono'}}>MM / YY</div>
            <div style={{flex:1,padding:'8px 10px',background:'var(--bg)',borderRadius:8,fontSize:12,color:'var(--text-3)',fontFamily:'JetBrains Mono'}}>CVC</div>
          </div>
        </div>

        <button className="btn btn-primary btn-lg btn-block" onClick={onPay} disabled={paying}>
          {paying ? (
            <><Icon name="loader" size={16} color="#fff" /> Processing…</>
          ) : (
            <><Icon name="lock" size={15} color="#fff" /> Pay LKR {total.toLocaleString()} via Stripe</>
          )}
        </button>

        <div className="row" style={{gap:10,marginTop:12,fontSize:10.5,color:'var(--text-3)',justifyContent:'center'}}>
          <Icon name="shield-check" size={12} />
          <span>Encrypted by Stripe · No charge until you confirm</span>
        </div>
      </div>
    </div>
  );
}

function PaymentScreen(props) {
  // Redirect to public payment page — payments now happen via WhatsApp link
  return <PublicBookingPayScreen {...props} />;
}

function MyBookingsScreen({ go }) {
  const [tab, setTab] = useState('upcoming');
  const [expanded, setExpanded] = useState('B-2403');
  const [confirm, setConfirm] = useState(null);
  const toast = useToast();
  const bookings = window.MOCK.BOOKINGS;
  const filtered = bookings.filter(b => {
    if (tab === 'upcoming') return ['RESERVED','PAYMENT_PENDING','PAID'].includes(b.status);
    if (tab === 'past') return b.status === 'COMPLETED' || b.status === 'PAID';
    return ['RELEASED','AUTO_CANCELLED','REFUNDED','CANCELLED'].includes(b.status);
  });

  const statusKindMap = {
    RESERVED: 'reserved',
    PAYMENT_PENDING: 'payment_pending',
    PAID: 'paid',
    RELEASED: 'released',
    AUTO_CANCELLED: 'auto_cancelled',
    REFUNDED: 'refunded',
    COMPLETED: 'confirmed',
  };
  const statusLabel = {
    RESERVED: 'Reserved',
    PAYMENT_PENDING: 'Pay now',
    PAID: 'Confirmed',
    RELEASED: 'Window expired',
    AUTO_CANCELLED: 'Auto-cancelled',
    REFUNDED: 'Refunded',
    COMPLETED: 'Completed',
  };

  return (
    <div className="app-body" style={{paddingBottom:110}}>
      <TopBar title="My Bookings" subtitle="3 upcoming · 2 past" onBell={() => go('notifications')} notifCount={3} />
      <div style={{padding:'0 16px'}}>
        <Tabs
          items={[{id:'upcoming',label:'Upcoming'},{id:'past',label:'Past'},{id:'cancelled',label:'Cancelled'}]}
          active={tab}
          onChange={setTab}
        />
        <div className="stack" style={{marginTop:16,gap:12}}>
          {filtered.length === 0 && (
            <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text-3)'}}>
              <Icon name="inbox" size={36} color="var(--text-3)" />
              <p style={{marginTop:10,fontSize:13}}>No bookings here yet.</p>
            </div>
          )}
          {filtered.map(b => {
            const isAction = b.status === 'PAYMENT_PENDING';
            const isReserved = b.status === 'RESERVED';
            return (
              <div key={b.id} className="card" style={{overflow:'hidden',position:'relative',
                borderColor: isAction ? '#FCC56C' : 'var(--line)',
                boxShadow: isAction ? '0 0 0 3px rgba(252,197,108,0.18)' : 'var(--shadow-sm)',
              }}>
                <button
                  onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                  style={{width:'100%',padding:16,textAlign:'left',display:'block'}}
                >
                  <div className="row between" style={{marginBottom:10}}>
                    <div className="row" style={{gap:8}}>
                      <span style={{fontSize:10.5,color:'var(--text-3)',fontWeight:600,fontFamily:'JetBrains Mono'}}>{b.id}</span>
                      <span style={{fontSize:10,color:'var(--text-3)'}}>·</span>
                      <span style={{fontSize:10.5,color:'var(--text-3)',fontWeight:600,fontFamily:'JetBrains Mono'}}>{b.jeepCode}</span>
                    </div>
                    <Badge kind={statusKindMap[b.status]}>{statusLabel[b.status]}</Badge>
                  </div>
                  <div style={{fontSize:15,fontWeight:700,letterSpacing:'-0.01em',marginBottom:6}}>{b.safari}</div>
                  <div className="row between">
                    <div className="row" style={{gap:6,fontSize:12,color:'var(--text-2)'}}>
                      <Icon name="calendar" size={13} />
                      <span>{b.date}</span>
                    </div>
                    <div style={{fontSize:14,fontWeight:700,color: b.status === 'PAID' ? 'var(--success)' : b.status === 'RELEASED' ? 'var(--text-3)' : 'var(--primary)'}}>
                      LKR {b.amount.toLocaleString()}
                    </div>
                  </div>

                  {/* Status-specific footer */}
                  {isReserved && (
                    <div style={{marginTop:10,padding:'8px 10px',background:'var(--sky-100)',borderRadius:8,display:'flex',gap:8,alignItems:'center'}}>
                      <Icon name="users" size={13} color="#1E5A87" />
                      <span style={{fontSize:11.5,color:'#1E5A87',fontWeight:600,flex:1}}>
                        Waiting for {b.waitingFor} more {b.waitingFor === 1 ? 'customer' : 'customers'} ({b.paidSeats}/4 paid)
                      </span>
                    </div>
                  )}
                  {isAction && (
                    <div style={{marginTop:10,padding:'10px 12px',background:'#FEF3C7',borderRadius:8,display:'flex',gap:10,alignItems:'center'}}>
                      <span className="countdown danger" style={{background:'transparent',padding:0,color:'#991B1B'}}>
                        <span className="dot" style={{background:'#991B1B'}} />
                        {b.deadlineHrs}h left
                      </span>
                      <span style={{fontSize:11.5,color:'#92400E',fontWeight:600,flex:1}}>4-seat min hit — pay to confirm</span>
                    </div>
                  )}
                  {b.status === 'RELEASED' && (
                    <div style={{marginTop:10,padding:'8px 10px',background:'var(--bg)',borderRadius:8,fontSize:11,color:'var(--text-3)'}}>
                      Payment window expired · not charged · seat released
                    </div>
                  )}
                  {b.status === 'AUTO_CANCELLED' && (
                    <div style={{marginTop:10,padding:'8px 10px',background:'#FEE2E2',borderRadius:8,fontSize:11,color:'#991B1B',fontWeight:600}}>
                      Auto-cancelled · LKR {b.refundAmount.toLocaleString()} refunded · Stripe txn TX-9821
                    </div>
                  )}
                </button>

                {expanded === b.id && (
                  <div style={{padding:'0 16px 16px',borderTop:'1px solid var(--line-soft)',background:'var(--bg)'}}>
                    <div className="stack" style={{gap:8,padding:'14px 0'}}>
                      <div className="row" style={{gap:10}}>
                        <Icon name="map-pin" size={14} color="var(--text-3)" />
                        <span style={{fontSize:12.5}}><strong>Pickup:</strong> {b.pickup}</span>
                      </div>
                      <div className="row" style={{gap:10}}>
                        <Icon name="utensils" size={14} color="var(--text-3)" />
                        <span style={{fontSize:12.5}}><strong>Meal:</strong> {b.meal}</span>
                      </div>
                      <div className="row" style={{gap:10}}>
                        <Icon name="user-check" size={14} color="var(--text-3)" />
                        <span style={{fontSize:12.5}}><strong>Guide:</strong> Pradeep Silva</span>
                      </div>
                    </div>
                    {isAction && (
                      <button className="btn btn-primary btn-lg btn-block" onClick={() => go('publicPay')}>
                        <Icon name="lock" size={15} color="#fff" /> Pay LKR {b.amount.toLocaleString()} now
                      </button>
                    )}
                    {isReserved && (
                      <div className="row" style={{gap:8}}>
                        <button className="btn btn-secondary" style={{flex:1,fontSize:13,padding:'10px'}}>
                          <Icon name="share-2" size={14} /> Invite friends
                        </button>
                        <button className="btn btn-danger" style={{flex:1,fontSize:13,padding:'10px'}} onClick={() => setConfirm(b)}>
                          Cancel
                        </button>
                      </div>
                    )}
                    {b.status === 'PAID' && (
                      <div className="row" style={{gap:8}}>
                        <button className="btn btn-secondary" style={{flex:1,fontSize:13,padding:'10px'}}>
                          <Icon name="message-circle" size={14} /> Contact
                        </button>
                        <button className="btn btn-secondary" style={{flex:1,fontSize:13,padding:'10px'}}>
                          <Icon name="download" size={14} /> Ticket
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Sheet open={!!confirm} onClose={() => setConfirm(null)} title="Cancel this reservation?">
        <p style={{fontSize:13,color:'var(--text-2)',margin:'0 0 18px',lineHeight:1.5}}>
          You haven't been charged yet. Cancelling now frees your seat for someone else — no fee.
        </p>
        <div className="stack" style={{gap:8}}>
          <button className="btn btn-danger btn-lg btn-block" onClick={() => { toast('Reservation cancelled · No charge applied', 'success'); setConfirm(null); }}>
            Cancel reservation
          </button>
          <button className="btn btn-secondary btn-lg btn-block" onClick={() => setConfirm(null)}>Keep it</button>
        </div>
      </Sheet>
    </div>
  );
}

Object.assign(window, { BrowseScreen, SafariDetailScreen, PaymentScreen, PublicBookingPayScreen, MyBookingsScreen });
