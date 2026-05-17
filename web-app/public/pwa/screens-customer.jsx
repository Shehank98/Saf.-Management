// screens-customer.jsx - Browse, Detail, Payment, My Bookings
// Business rule: Shared safari payments are NOT collected until 4+ customers are onboard.
// Customers reserve their seat first; payment is triggered once the minimum is met.

const MIN_CUSTOMERS_FOR_PAYMENT = 4;

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

      {mapView ? (
        <div style={{padding: '0 16px 16px'}}>
          <MapPlaceholder height={300} />
          <div style={{marginTop:12}}>
            {safaris.slice(0,2).map(s => (
              <div key={s.id} style={{display:'flex',gap:12,padding:12,background:'var(--surface)',borderRadius:12,border:'1px solid var(--line)',marginBottom:8}}>
                <div style={{width:50,height:50,borderRadius:10,background:'linear-gradient(135deg,var(--primary),#4A8E6B)',flex:'0 0 50px'}} />
                <div style={{flex:1}}>
                  <div style={{fontSize:13.5,fontWeight:700}}>{s.name}</div>
                  <div style={{fontSize:11.5,color:'var(--text-3)'}}>{s.location} · {s.date}</div>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--primary)',marginTop:2}}>LKR {s.price.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{padding:'4px 16px 0'}}>
          <div className="row between" style={{margin:'8px 4px 12px'}}>
            <span style={{fontSize:12,color:'var(--text-3)',fontWeight:500}}>{safaris.length} safaris available</span>
            <button style={{fontSize:12.5,fontWeight:600,color:'var(--text)',display:'flex',alignItems:'center',gap:4}}>
              Sort <Icon name="chevron-down" size={12} />
            </button>
          </div>
          {/* Shared safari minimum notice */}
          {shareType === 'shared' && (
            <div style={{padding:'10px 12px',background:'var(--sky-100)',borderRadius:10,marginBottom:14,display:'flex',gap:10,alignItems:'flex-start'}}>
              <Icon name="info" size={14} color="#1E5A87" />
              <span style={{fontSize:11.5,color:'#1E5A87',fontWeight:500,lineHeight:1.4}}>
                <strong>No charge until 4 customers join.</strong> Reserve your seat free — payment is collected once the trip reaches minimum occupancy.
              </span>
            </div>
          )}
          <div className="stack" style={{gap:14}}>
            {safaris.map(s => (
              <SafariCard key={s.id} safari={s} onClick={() => go('detail', { safari: s })} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SafariDetailScreen({ go, safari }) {
  const s = safari || window.MOCK.SAFARIS[0];
  const [selected, setSelected] = useState([2]);
  const [pickup, setPickup] = useState('Tissamaharama Hotel');
  const [meal, setMeal] = useState('veg');
  const [showPickup, setShowPickup] = useState(false);
  const total = (s.price * selected.length);
  const taken = Array.from({length: s.taken}, (_, i) => i);
  const isShared = s.type === 'shared';
  const currentCustomers = s.taken + selected.length; // existing + my selection
  const needsMore = isShared && currentCustomers < MIN_CUSTOMERS_FOR_PAYMENT;
  const stillNeeded = Math.max(0, MIN_CUSTOMERS_FOR_PAYMENT - s.taken);

  const toggle = (i) => {
    if (taken.includes(i)) return;
    setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  return (
    <div className="app-body" style={{paddingBottom:120}}>
      {/* Hero */}
      <div style={{position:'relative',height:280,marginBottom:14}}>
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
        </div>
      </div>

      <div style={{padding:'0 18px'}}>
        <h1 style={{fontSize:24,fontWeight:800,letterSpacing:'-0.02em',margin:'0 0 6px'}}>{s.name}</h1>
        <div className="row" style={{gap:6,color:'var(--text-2)',fontSize:13,marginBottom:14}}>
          <Icon name="map-pin" size={14} color="var(--primary)" />
          <span>{s.location}</span>
          <span style={{color:'var(--text-3)',margin:'0 4px'}}>·</span>
          <Icon name="calendar" size={14} color="var(--primary)" />
          <span>{s.date} · {s.time}</span>
        </div>

        {/* Shared safari minimum occupancy notice */}
        {isShared && (
          <div style={{
            padding:'14px',
            borderRadius:12,
            background: needsMore ? '#FEF3C7' : 'var(--primary-100)',
            border: `1px solid ${needsMore ? '#FDE68A' : 'rgba(45,106,79,0.2)'}`,
            marginBottom:18,
          }}>
            <div className="row" style={{gap:10,marginBottom:6}}>
              <Icon name={needsMore ? 'users' : 'check-circle-2'} size={16} color={needsMore ? '#92400E' : 'var(--primary)'} />
              <span style={{fontSize:13,fontWeight:700,color: needsMore ? '#92400E' : 'var(--primary-700)'}}>
                {needsMore ? `${stillNeeded} more customer${stillNeeded !== 1 ? 's' : ''} needed to confirm` : 'Minimum reached — trip is confirmed!'}
              </span>
            </div>
            {/* Progress bar */}
            <div style={{height:6,background:'rgba(0,0,0,0.08)',borderRadius:3,overflow:'hidden',marginBottom:8}}>
              <div style={{
                height:'100%',
                width:`${Math.min(100, (s.taken / MIN_CUSTOMERS_FOR_PAYMENT) * 100)}%`,
                background: needsMore ? '#D97706' : 'var(--primary)',
                transition:'width 0.4s',
                borderRadius:3,
              }} />
            </div>
            <div style={{fontSize:11,color: needsMore ? '#92400E' : 'var(--primary-700)',fontWeight:500}}>
              {s.taken} of {MIN_CUSTOMERS_FOR_PAYMENT} minimum seats reserved
              {needsMore ? ' · No payment until trip fills' : ' · Payment will be collected now'}
            </div>
          </div>
        )}

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
        <h3 style={{fontSize:14,fontWeight:700,margin:'0 0 4px'}}>Select your seats</h3>
        <p style={{fontSize:11.5,color:'var(--text-3)',margin:'0 0 12px'}}>Window seats give the best wildlife views.</p>
        <div className="seat-map">
          <div className="seat-jeep">
            <div className="seat driver">DRV</div>
            <div className="seat driver">CO</div>
            <div className="seat-spacer" />
            <div className="seat-spacer" />
            <div className="seat-spacer" />
            {[0,1,2,3,4,5].map((_, i) => {
              const row = Math.floor(i / 2);
              const col = i % 2;
              return null;
            })}
            {/* Render 3 rows × 2+2 = manually */}
            {Array.from({length: 6}).map((_, i) => {
              const isTaken = taken.includes(i);
              const isSel = selected.includes(i);
              return (
                <React.Fragment key={i}>
                  <div
                    className={`seat ${isTaken ? 'taken' : ''} ${isSel ? 'selected' : ''}`}
                    onClick={() => toggle(i)}
                    style={{gridColumn: (i % 2 === 0) ? (i % 4 === 0 ? '1' : '4') : (i % 4 === 1 ? '2' : '5')}}
                  >
                    {String.fromCharCode(65 + Math.floor(i/2))}{(i % 2) + 1}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          <div className="seat-legend">
            <span><span className="sw" style={{background:'var(--surface)',border:'1.5px solid var(--line)'}} /> Available</span>
            <span><span className="sw" style={{background:'#E5E0D5'}} /> Taken</span>
            <span><span className="sw" style={{background:'var(--primary)'}} /> Selected</span>
          </div>
        </div>

        {/* Pickup */}
        <div className="field" style={{marginTop:18}}>
          <label className="label">Pickup location</label>
          <button className="input" style={{display:'flex',alignItems:'center',justifyContent:'space-between',textAlign:'left'}} onClick={() => setShowPickup(true)}>
            <span className="row" style={{gap:8}}>
              <Icon name="map-pin" size={16} color="var(--primary)" />
              <span>{pickup}</span>
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

      {/* Price footer (sticky) */}
      <div style={{
        position:'absolute',bottom:0,left:0,right:0,
        background:'var(--surface)',
        borderTop:'1px solid var(--line)',
        padding:'14px 18px 28px',
        display:'flex',alignItems:'center',gap:12,
        zIndex:20,
      }}>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:'var(--text-3)',fontWeight:500}}>
            {needsMore ? 'Reserve price · no charge yet' : 'Total'} · {selected.length} seat{selected.length !== 1 ? 's' : ''}
          </div>
          <div style={{fontSize:20,fontWeight:800,letterSpacing:'-0.02em'}}>LKR {total.toLocaleString()}</div>
          {needsMore && (
            <div style={{fontSize:10,color:'var(--warning)',fontWeight:600,marginTop:1}}>
              💳 Payment collected once 4 seats filled
            </div>
          )}
        </div>
        <button
          className="btn btn-primary btn-lg"
          style={{flexShrink:0}}
          onClick={() => go('payment', { safari: s, total, seats: selected.length, needsMore })}
          disabled={selected.length === 0}
        >
          {needsMore ? (
            <><Icon name="bookmark" size={16} color="#fff" /> Reserve</>
          ) : (
            <><Icon name="arrow-right" size={16} color="#fff" /> Book Now</>
          )}
        </button>
      </div>

      <Sheet open={showPickup} onClose={() => setShowPickup(false)} title="Pick up at">
        {['Tissamaharama Hotel','Kataragama Junction','Yala Gate','Hotel Hibiscus','Custom address…'].map(p => (
          <button
            key={p}
            onClick={() => { setPickup(p); setShowPickup(false); }}
            className="row"
            style={{padding:'14px 0',borderBottom:'1px solid var(--line-soft)',width:'100%',gap:12,fontSize:14,textAlign:'left'}}
          >
            <Icon name="map-pin" size={18} color="var(--primary)" />
            <span style={{flex:1}}>{p}</span>
            {p === pickup && <Icon name="check" size={18} color="var(--primary)" />}
          </button>
        ))}
      </Sheet>
    </div>
  );
}

function PaymentScreen({ go, total = 25000, safari, seats = 2, needsMore = false }) {
  const [payAmount, setPayAmount] = useState('deposit');
  const [paying, setPaying] = useState(false);
  const toast = useToast();
  const isShared = safari?.type === 'shared';
  // If shared + not enough customers, this is a reservation (no real charge yet)
  const isReservation = isShared && needsMore;
  const amount = payAmount === 'deposit' ? Math.round(total * 0.3) : total;

  const onPay = () => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      if (isReservation) {
        toast('Seat reserved! You\'ll be charged once 4 customers join.');
      } else {
        toast('Payment successful · Booking #B-2402 confirmed');
      }
      go('bookings');
    }, 1400);
  };

  return (
    <div className="app-body" style={{paddingBottom: 130}}>
      <div className="top-bar">
        <div className="row" style={{gap:12}}>
          <button onClick={() => go('detail', { safari })} style={{padding:4}}>
            <Icon name="arrow-left" size={22} />
          </button>
          <h1>{isReservation ? 'Reserve Seat' : 'Payment'}</h1>
        </div>
        {!isReservation && (
          <button className="bell" style={{background:'transparent',border:'none',width:'auto',padding:'0 10px',color:'var(--text-3)',fontSize:11,fontWeight:600}}>
            <Icon name="shield-check" size={14} color="var(--primary)" /> Secure
          </button>
        )}
      </div>

      <div style={{padding:'4px 18px'}}>

        {/* Shared safari reservation notice — shown when below 4 customers */}
        {isReservation && (
          <div style={{
            padding:'16px',
            borderRadius:14,
            background:'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            border:'1px solid #FCD34D',
            marginBottom:16,
          }}>
            <div className="row" style={{gap:12,marginBottom:8}}>
              <div style={{width:40,height:40,borderRadius:11,background:'#D97706',display:'grid',placeItems:'center',flex:'0 0 40px'}}>
                <Icon name="clock" size={20} color="#fff" />
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:'#92400E'}}>Free reservation — no payment yet</div>
                <div style={{fontSize:11.5,color:'#B45309',marginTop:2}}>
                  This safari needs {MIN_CUSTOMERS_FOR_PAYMENT} customers before it runs.
                </div>
              </div>
            </div>
            <div style={{height:6,background:'rgba(0,0,0,0.1)',borderRadius:3,overflow:'hidden',marginBottom:8}}>
              <div style={{
                height:'100%',
                width:`${Math.min(100, ((safari?.taken || 2) / MIN_CUSTOMERS_FOR_PAYMENT) * 100)}%`,
                background:'#D97706',
                borderRadius:3,
              }} />
            </div>
            <div style={{fontSize:11,color:'#92400E',fontWeight:600}}>
              {safari?.taken || 2} of {MIN_CUSTOMERS_FOR_PAYMENT} seats reserved · {Math.max(0, MIN_CUSTOMERS_FOR_PAYMENT - (safari?.taken || 2))} more needed
            </div>
            <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid #FCD34D',fontSize:11.5,color:'#92400E',lineHeight:1.5}}>
              📧 We'll email & notify you when the minimum is reached and your card is charged. You can cancel free of charge any time before that.
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="card card-pad" style={{marginBottom:14}}>
          <div className="row" style={{gap:12}}>
            <div className={`safari-thumb alt-${safari?.thumb ?? 0}`} style={{width:60,height:60,borderRadius:10,flex:'0 0 60px',position:'relative',overflow:'hidden'}}>
              <div className="sun" style={{width:16,height:16,top:8,right:8}} />
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700}}>{safari?.name || 'Yala National Park'}</div>
              <div style={{fontSize:12,color:'var(--text-3)'}}>{safari?.date || 'Tue, May 19'} · {seats} seat{seats !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div style={{height:1,background:'var(--line)',margin:'12px 0'}} />
          <div className="row between" style={{fontSize:13,marginBottom:6}}>
            <span style={{color:'var(--text-2)'}}>Price per seat</span>
            <span className="tnum">LKR {safari?.price?.toLocaleString() || '12,500'}</span>
          </div>
          <div className="row between" style={{fontSize:13,marginBottom:6}}>
            <span style={{color:'var(--text-2)'}}>Seats</span>
            <span className="tnum">× {seats}</span>
          </div>
          <div className="row between" style={{fontSize:15,fontWeight:700,marginTop:6}}>
            <span>{isReservation ? 'Reserved amount' : 'Total'}</span>
            <span className="tnum">LKR {total.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment options — only shown for confirmed trips */}
        {!isReservation && (
          <>
            <label className="label">Payment option</label>
            <div className="stack" style={{gap:8,marginBottom:18}}>
              {[
                {id:'deposit',title:'Pay 30% deposit',sub:'Balance due at safari',amt: Math.round(total * 0.3)},
                {id:'full',title:'Pay full amount',sub:'Refundable up to 24h before',amt: total},
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setPayAmount(opt.id)}
                  style={{
                    padding:'14px 16px',
                    borderRadius:12,
                    border: payAmount === opt.id ? '2px solid var(--primary)' : '1.5px solid var(--line)',
                    background: payAmount === opt.id ? 'var(--primary-100)' : 'var(--surface)',
                    display:'flex',alignItems:'center',gap:12,width:'100%',textAlign:'left',
                  }}
                >
                  <div style={{
                    width:20,height:20,borderRadius:'50%',
                    border: payAmount === opt.id ? '6px solid var(--primary)' : '2px solid var(--line)',
                    background:'#fff', flex:'0 0 20px',
                  }} />
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13.5}}>{opt.title}</div>
                    <div style={{fontSize:11.5,color:'var(--text-3)',marginTop:1}}>{opt.sub}</div>
                  </div>
                  <div style={{fontWeight:700,fontSize:14}} className="tnum">LKR {opt.amt.toLocaleString()}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Card form — shown only when trip is confirmed (not a reservation) */}
        {!isReservation && (
          <>
            <label className="label">Card details</label>
            <div className="card" style={{padding:14, marginBottom: 14}}>
              <div className="row between" style={{marginBottom: 12}}>
                <span style={{fontSize:11,fontWeight:600,color:'var(--text-3)'}}>CARD NUMBER</span>
                <div className="row" style={{gap:4}}>
                  <div style={{width:28,height:18,borderRadius:3,background:'linear-gradient(135deg,#1A1F71,#2E76B5)',color:'#fff',fontSize:7,fontWeight:700,display:'grid',placeItems:'center',letterSpacing:0.5}}>VISA</div>
                  <div style={{width:28,height:18,borderRadius:3,background:'#fff',border:'1px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <div style={{width:9,height:9,background:'#EB001B',borderRadius:'50%'}} />
                    <div style={{width:9,height:9,background:'#F79E1B',borderRadius:'50%',marginLeft:-3}} />
                  </div>
                </div>
              </div>
              <div style={{fontSize:18,letterSpacing:'0.04em',fontFamily:'JetBrains Mono, monospace',marginBottom:14,color:'var(--text)'}}>4242 4242 4242 <span style={{color:'var(--text-3)'}}>0000</span></div>
              <div className="row" style={{gap:12}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:600,color:'var(--text-3)',marginBottom:3}}>EXPIRY</div>
                  <div style={{fontSize:13,fontFamily:'JetBrains Mono'}}>12 / 28</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:600,color:'var(--text-3)',marginBottom:3}}>CVC</div>
                  <div style={{fontSize:13,fontFamily:'JetBrains Mono'}}>•••</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:600,color:'var(--text-3)',marginBottom:3}}>NAME</div>
                  <div style={{fontSize:11,fontWeight:600}}>Emma Larsson</div>
                </div>
              </div>
            </div>

            <div className="row" style={{gap:12,marginBottom:8,padding:'10px 12px',background:'var(--bg)',borderRadius:10,border:'1px solid var(--line)'}}>
              <Icon name="shield" size={16} color="var(--primary)" />
              <span style={{fontSize:11.5,color:'var(--text-2)',lineHeight:1.4,flex:1}}>Payments are encrypted via Stripe. Your card details never touch our servers.</span>
            </div>
          </>
        )}

        {/* For reservations: show card save notice */}
        {isReservation && (
          <div style={{padding:'14px',borderRadius:12,background:'var(--surface)',border:'1px solid var(--line)',marginBottom:14}}>
            <div className="row" style={{gap:10,marginBottom:10}}>
              <Icon name="credit-card" size={16} color="var(--text-3)" />
              <span style={{fontSize:12.5,fontWeight:600,color:'var(--text)'}}>Save card for when trip confirms</span>
            </div>
            <div className="card" style={{padding:12,background:'var(--bg)',border:'none'}}>
              <div style={{fontSize:14,letterSpacing:'0.04em',fontFamily:'JetBrains Mono, monospace',marginBottom:8,color:'var(--text)'}}>4242 4242 4242 <span style={{color:'var(--text-3)'}}>0000</span></div>
              <div className="row" style={{gap:12}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:600,color:'var(--text-3)',marginBottom:2}}>EXPIRY</div>
                  <div style={{fontSize:12,fontFamily:'JetBrains Mono'}}>12 / 28</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:600,color:'var(--text-3)',marginBottom:2}}>CVC</div>
                  <div style={{fontSize:12,fontFamily:'JetBrains Mono'}}>•••</div>
                </div>
              </div>
            </div>
            <div style={{fontSize:11,color:'var(--text-3)',marginTop:10,lineHeight:1.5}}>
              🔒 Card saved securely via Stripe. You won't be charged until the trip is confirmed.
            </div>
          </div>
        )}
      </div>

      <div style={{
        position:'absolute',bottom:0,left:0,right:0,
        background:'var(--surface)',
        borderTop:'1px solid var(--line)',
        padding:'14px 18px 28px',
        zIndex:20,
      }}>
        {isReservation ? (
          <button className="btn btn-lg btn-block" style={{background:'#D97706',color:'#fff',gap:8}} onClick={onPay} disabled={paying}>
            {paying ? (
              <><Icon name="loader" size={16} color="#fff" /> Reserving…</>
            ) : (
              <><Icon name="bookmark" size={15} color="#fff" /> Reserve Seat — No Charge Yet</>
            )}
          </button>
        ) : (
          <button className="btn btn-primary btn-lg btn-block" onClick={onPay} disabled={paying}>
            {paying ? (
              <><Icon name="loader" size={16} color="#fff" /> Processing…</>
            ) : (
              <><Icon name="lock" size={15} color="#fff" /> Pay LKR {amount.toLocaleString()} Securely</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function MyBookingsScreen({ go }) {
  const [tab, setTab] = useState('upcoming');
  const [expanded, setExpanded] = useState('B-2401');
  const [confirm, setConfirm] = useState(null);
  const toast = useToast();
  const bookings = window.MOCK.BOOKINGS;
  const filtered = bookings.filter(b => {
    if (tab === 'upcoming') return b.status === 'confirmed' || b.status === 'pending';
    if (tab === 'cancelled') return b.status === 'cancelled';
    return b.status !== 'confirmed' && b.status !== 'pending';
  });

  return (
    <div className="app-body" style={{paddingBottom:110}}>
      <TopBar title="My Bookings" subtitle="2 upcoming · 1 reserved" onBell={() => go('notifications')} notifCount={3} />

      {/* Reserved (pending payment) notice */}
      <div style={{padding:'0 16px 8px'}}>
        <div style={{padding:'12px 14px',background:'#FEF3C7',borderRadius:10,border:'1px solid #FDE68A',display:'flex',gap:10,alignItems:'flex-start'}}>
          <Icon name="clock" size={14} color="#92400E" />
          <div style={{flex:1}}>
            <div style={{fontSize:12.5,fontWeight:700,color:'#92400E',marginBottom:2}}>1 seat reserved — awaiting min. occupancy</div>
            <div style={{fontSize:11,color:'#B45309',lineHeight:1.4}}>
              Udawalawe Elephant Trail needs {MIN_CUSTOMERS_FOR_PAYMENT} customers. Currently {2} reserved. Your card will be charged automatically once confirmed.
            </div>
          </div>
        </div>
      </div>

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
          {filtered.map(b => (
            <div key={b.id} className="card" style={{overflow:'hidden'}}>
              <button
                onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                style={{width:'100%',padding:16,textAlign:'left',display:'block'}}
              >
                <div className="row between" style={{marginBottom:10}}>
                  <span style={{fontSize:10.5,color:'var(--text-3)',fontWeight:600,letterSpacing:0.04}}>{b.id}</span>
                  <Badge kind={b.status === 'confirmed' ? 'confirmed' : b.status === 'pending' ? 'pending' : 'cancelled'}>
                    {b.status === 'pending' ? 'Reserved' : b.status[0].toUpperCase() + b.status.slice(1)}
                  </Badge>
                </div>
                <div style={{fontSize:15,fontWeight:700,letterSpacing:'-0.01em',marginBottom:6}}>{b.safari}</div>
                <div className="row between">
                  <div className="row" style={{gap:6,fontSize:12,color:'var(--text-2)'}}>
                    <Icon name="calendar" size={13} />
                    <span>{b.date}</span>
                    <span style={{color:'var(--text-3)'}}>·</span>
                    <Icon name="users" size={13} />
                    <span>{b.seats} seat{b.seats > 1 ? 's' : ''}</span>
                  </div>
                  <div style={{fontSize:14,fontWeight:700,color: b.status === 'pending' ? 'var(--warning)' : 'var(--primary)'}}>
                    {b.status === 'pending' ? '— Reserved' : `LKR ${b.amount.toLocaleString()}`}
                  </div>
                </div>
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
                    {b.status === 'pending' && (
                      <div style={{padding:'10px 12px',background:'#FEF3C7',borderRadius:8,marginTop:4}}>
                        <div style={{fontSize:11.5,color:'#92400E',fontWeight:600,marginBottom:2}}>⏳ Awaiting min. occupancy</div>
                        <div style={{fontSize:11,color:'#B45309'}}>Payment will be collected once {MIN_CUSTOMERS_FOR_PAYMENT} customers join. You'll receive an email + push notification.</div>
                      </div>
                    )}
                  </div>
                  {b.status !== 'cancelled' && (
                    <div className="row" style={{gap:8}}>
                      <button className="btn btn-secondary" style={{flex:1,fontSize:13,padding:'10px'}}>
                        <Icon name="message-circle" size={14} /> Contact
                      </button>
                      <button className="btn btn-danger" style={{flex:1,fontSize:13,padding:'10px'}} onClick={() => setConfirm(b)}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Sheet open={!!confirm} onClose={() => setConfirm(null)} title="Cancel this booking?">
        <p style={{fontSize:13,color:'var(--text-2)',margin:'0 0 18px',lineHeight:1.5}}>
          {confirm?.status === 'pending'
            ? 'Your seat reservation will be cancelled with no charge. You have not been billed yet.'
            : `You'll receive an 85% refund (LKR ${confirm ? Math.round(confirm.amount * 0.85).toLocaleString() : 0}) within 5 business days. The 15% retained covers operator commitments.`
          }
        </p>
        <div className="stack" style={{gap:8}}>
          <button className="btn btn-danger btn-lg btn-block" onClick={() => { toast(confirm?.status === 'pending' ? 'Reservation cancelled — no charge' : 'Booking cancelled · Refund initiated', 'success'); setConfirm(null); }}>
            {confirm?.status === 'pending' ? 'Cancel reservation' : 'Cancel & request refund'}
          </button>
          <button className="btn btn-secondary btn-lg btn-block" onClick={() => setConfirm(null)}>Keep booking</button>
        </div>
      </Sheet>
    </div>
  );
}

Object.assign(window, { BrowseScreen, SafariDetailScreen, PaymentScreen, MyBookingsScreen });
