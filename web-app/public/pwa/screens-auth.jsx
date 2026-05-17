// screens-auth.jsx - Landing, Login, Register, Pending Approval

function LandingScreen({ go, onInstall }) {
  const [showBanner, setShowBanner] = useState(true);
  return (
    <div className="app-body">
      <div className="hero">
        <div className="hero-brand">
          <div className="brand-mark" style={{width:28,height:28,background:'rgba(255,255,255,0.18)',borderRadius:8,display:'grid',placeItems:'center'}}>
            <Icon name="compass" size={16} color="#fff" />
          </div>
          <span>Safari Adventures</span>
          <div className="dot" />
          <span style={{opacity:0.7}}>Sri Lanka</span>
        </div>
        <div className="hero-content">
          <h1>Manage Every Safari,<br/>Every Step.</h1>
          <p className="tag">Book seats, manage vendors, and track revenue across<br/>every park in Sri Lanka — from one place.</p>
          <div className="hero-search">
            <div className="field-grow">
              <small>WHERE</small>
              <strong>Yala, Udawalawe, Wilpattu…</strong>
            </div>
            <button onClick={() => go('browse')}>
              <Icon name="search" size={18} color="#fff" />
            </button>
          </div>
        </div>
      </div>

      <div style={{padding: '0 16px 16px'}}>
        <div className="row between" style={{marginBottom: 12}}>
          <h2 style={{fontSize:16,fontWeight:700,margin:0,letterSpacing:'-0.01em'}}>Trending parks</h2>
          <button onClick={() => go('browse')} style={{fontSize:12,fontWeight:600,color:'var(--primary)'}}>See all →</button>
        </div>
        <div className="stack">
          {window.MOCK.SAFARIS.slice(0,2).map(s => (
            <SafariCard key={s.id} safari={s} onClick={() => go('detail', { safari: s })} />
          ))}
        </div>

        <div className="card card-pad" style={{marginTop: 16, background: 'var(--sand-soft)', border: '1px solid var(--sand)'}}>
          <div className="row" style={{gap:14}}>
            <div style={{width:44,height:44,borderRadius:12,background:'var(--brown)',display:'grid',placeItems:'center',flex:'0 0 44px'}}>
              <Icon name="briefcase" size={20} color="#fff" />
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>Run a safari business?</div>
              <div style={{fontSize:12,color:'var(--text-2)',lineHeight:1.4}}>Sign in to your operator dashboard or join as a vendor.</div>
            </div>
          </div>
          <div className="row" style={{marginTop: 14, gap: 8}}>
            <button className="btn btn-secondary" style={{flex:1,padding:'10px 12px',fontSize:13}} onClick={() => go('login')}>Owner Login</button>
            <button className="btn btn-primary" style={{flex:1,padding:'10px 12px',fontSize:13}} onClick={() => go('register')}>Join as Vendor</button>
          </div>
        </div>

        <div style={{marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--line)', fontSize: 11.5, color: 'var(--text-3)', textAlign:'center', lineHeight: 1.6}}>
          © 2026 Safari Adventures · Colombo<br/>
          <span style={{color:'var(--primary)',fontWeight:600}}>About</span> · <span style={{color:'var(--primary)',fontWeight:600}}>Safety</span> · <span style={{color:'var(--primary)',fontWeight:600}}>Help</span> · <span style={{color:'var(--primary)',fontWeight:600}}>Privacy</span>
        </div>
        <div style={{height: 100}} />
      </div>

      {showBanner && (
        <div className="pwa-banner">
          <div className="ico">
            <Icon name="compass" size={20} color="#fff" />
          </div>
          <div className="copy">
            <strong>Add Safari Adventures to Home Screen</strong>
            <span>Faster bookings, offline access, push alerts</span>
          </div>
          <button className="btn btn-primary" style={{padding:'8px 12px',fontSize:12}} onClick={onInstall}>Install</button>
          <button onClick={() => setShowBanner(false)} style={{padding:4,color:'rgba(255,255,255,0.6)'}}>
            <Icon name="x" size={16} color="rgba(255,255,255,0.6)" />
          </button>
        </div>
      )}
    </div>
  );
}

function LoginScreen({ go, onLogin }) {
  const [email, setEmail] = useState('owner@wildlanka.lk');
  const [password, setPassword] = useState('••••••••');
  const [show, setShow] = useState(false);
  const toast = useToast();
  return (
    <div className="app-body" style={{padding: '60px 24px 32px', display:'flex',flexDirection:'column'}}>
      <button onClick={() => go('landing')} style={{alignSelf:'flex-start',marginBottom:24,padding:'8px',marginLeft:-8}}>
        <Icon name="arrow-left" size={22} />
      </button>
      <div style={{width:48,height:48,borderRadius:14,background:'var(--primary)',display:'grid',placeItems:'center',marginBottom:20}}>
        <Icon name="compass" size={24} color="#fff" />
      </div>
      <h1 style={{fontSize:26,fontWeight:800,letterSpacing:'-0.02em',margin:'0 0 6px'}}>Welcome back</h1>
      <p style={{color:'var(--text-3)',fontSize:14,margin:'0 0 28px'}}>Sign in to manage your safaris and bookings.</p>

      <div className="field">
        <label className="label">Email</label>
        <div className="input-icon-wrap">
          <Icon name="mail" size={16} className="input-icon" color="var(--text-3)" />
          <input className="input" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label className="label">Password</label>
        <div className="input-icon-wrap">
          <Icon name="lock" size={16} className="input-icon" color="var(--text-3)" />
          <input className="input" type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} />
          <button style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)'}} onClick={() => setShow(!show)}>
            <Icon name={show ? 'eye-off' : 'eye'} size={16} color="var(--text-3)" />
          </button>
        </div>
      </div>
      <div style={{textAlign:'right',marginTop:-6}}>
        <button style={{fontSize:12.5,color:'var(--primary)',fontWeight:600}}>Forgot Password?</button>
      </div>

      <button className="btn btn-primary btn-lg btn-block" style={{marginTop:18}} onClick={() => { toast('Signed in as Safari Owner'); onLogin(); }}>
        Sign In
      </button>

      <div className="row" style={{margin:'18px 0',gap:10,alignItems:'center'}}>
        <div style={{flex:1,height:1,background:'var(--line)'}} />
        <span style={{fontSize:11,color:'var(--text-3)',fontWeight:500}}>OR</span>
        <div style={{flex:1,height:1,background:'var(--line)'}} />
      </div>

      <button className="btn btn-secondary btn-lg btn-block">
        <svg width="16" height="16" viewBox="0 0 24 24" style={{marginRight:4}}>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <div style={{marginTop:'auto',paddingTop:24,textAlign:'center',fontSize:13,color:'var(--text-2)'}}>
        New here? <button onClick={() => go('register')} style={{color:'var(--primary)',fontWeight:600}}>Create account</button>
      </div>
    </div>
  );
}

function RegisterScreen({ go }) {
  const [role, setRole] = useState('owner');
  const [vtype, setVtype] = useState('jeep');
  const [agree, setAgree] = useState(true);
  return (
    <div className="app-body" style={{padding: '60px 24px 32px'}}>
      <button onClick={() => go('login')} style={{padding:'8px',marginLeft:-8,marginBottom:18}}>
        <Icon name="arrow-left" size={22} />
      </button>
      <h1 style={{fontSize:26,fontWeight:800,letterSpacing:'-0.02em',margin:'0 0 6px'}}>Create your account</h1>
      <p style={{color:'var(--text-3)',fontSize:14,margin:'0 0 22px'}}>It takes about 2 minutes.</p>

      <div className="field">
        <label className="label">Full name</label>
        <input className="input" defaultValue="Wild Lanka Co." />
      </div>
      <div className="field">
        <label className="label">Email</label>
        <input className="input" defaultValue="ops@wildlanka.lk" />
      </div>
      <div className="row" style={{gap:10}}>
        <div className="field grow">
          <label className="label">Password</label>
          <input className="input" type="password" defaultValue="••••••••" />
        </div>
        <div className="field grow">
          <label className="label">Confirm</label>
          <input className="input" type="password" defaultValue="••••••••" />
        </div>
      </div>

      <div className="field">
        <label className="label">I am a</label>
        <div className="row" style={{gap:8}}>
          {[
            {id:'owner', label:'Safari Owner', icon:'home'},
            {id:'vendor', label:'Vendor', icon:'briefcase'},
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              style={{
                flex:1,
                padding:'14px 12px',
                borderRadius:12,
                border: role === r.id ? '2px solid var(--primary)' : '1.5px solid var(--line)',
                background: role === r.id ? 'var(--primary-100)' : 'var(--surface)',
                display:'flex',flexDirection:'column',alignItems:'center',gap:6,
                fontWeight:600,fontSize:13,
                color: role === r.id ? 'var(--primary-700)' : 'var(--text-2)',
              }}
            >
              <Icon name={r.icon} size={20} />
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {role === 'vendor' && (
        <div className="field">
          <label className="label">Vendor type</label>
          <select className="select" value={vtype} onChange={e => setVtype(e.target.value)}>
            <option value="jeep">Jeep Provider</option>
            <option value="guide">Guide</option>
            <option value="restaurant">Restaurant</option>
            <option value="accommodation">Accommodation</option>
            <option value="camera">Camera Rental</option>
          </select>
        </div>
      )}

      <label className="row" style={{gap:10,marginTop:8,marginBottom:14,alignItems:'flex-start',cursor:'pointer'}}>
        <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{marginTop:3,accentColor:'var(--primary)',width:18,height:18}} />
        <span style={{fontSize:12.5,color:'var(--text-2)',lineHeight:1.5}}>
          I agree to the <span style={{color:'var(--primary)',fontWeight:600}}>Terms of Service</span> and <span style={{color:'var(--primary)',fontWeight:600}}>Privacy Policy</span>.
        </span>
      </label>

      <button className="btn btn-primary btn-lg btn-block" disabled={!agree} style={{opacity: agree ? 1 : 0.5}} onClick={() => go('pending')}>
        Create account
      </button>

      <div style={{marginTop:18,textAlign:'center',fontSize:13,color:'var(--text-2)'}}>
        Already registered? <button onClick={() => go('login')} style={{color:'var(--primary)',fontWeight:600}}>Sign in</button>
      </div>
    </div>
  );
}

function PendingApprovalScreen({ go }) {
  return (
    <div className="app-body" style={{padding:'60px 24px 32px',display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center'}}>
      <div style={{width:120,height:120,borderRadius:30,background:'var(--sand-soft)',display:'grid',placeItems:'center',marginBottom:28,position:'relative'}}>
        <Icon name="hourglass" size={48} color="var(--brown)" />
        <div style={{position:'absolute',bottom:-6,right:-6,width:38,height:38,borderRadius:'50%',background:'var(--primary)',display:'grid',placeItems:'center',boxShadow:'0 4px 12px rgba(45,106,79,0.3)'}}>
          <Icon name="check" size={20} color="#fff" />
        </div>
      </div>
      <h1 style={{fontSize:24,fontWeight:800,margin:'0 0 10px',letterSpacing:'-0.02em'}}>Your account is under review</h1>
      <p style={{fontSize:14,color:'var(--text-2)',margin:'0 0 24px',lineHeight:1.5,maxWidth:300}}>
        Our team will verify your details and notify you within 24–48 hours via email and push notification.
      </p>

      <div className="card card-pad" style={{width:'100%',background:'var(--bg)',textAlign:'left'}}>
        <div className="row" style={{gap:12,marginBottom:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:'var(--primary)',display:'grid',placeItems:'center'}}>
            <Icon name="check" size={14} color="#fff" />
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600}}>Account submitted</div>
            <div style={{fontSize:11,color:'var(--text-3)'}}>Just now</div>
          </div>
        </div>
        <div className="row" style={{gap:12,marginBottom:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:'var(--sand)',display:'grid',placeItems:'center'}}>
            <Icon name="loader" size={14} color="var(--brown)" />
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600}}>Verification in progress</div>
            <div style={{fontSize:11,color:'var(--text-3)'}}>Estimated 24–48 hours</div>
          </div>
        </div>
        <div className="row" style={{gap:12,opacity:0.5}}>
          <div style={{width:30,height:30,borderRadius:8,background:'var(--line)',display:'grid',placeItems:'center'}}>
            <Icon name="bell" size={14} color="var(--text-3)" />
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600}}>You'll be notified</div>
            <div style={{fontSize:11,color:'var(--text-3)'}}>Push + email</div>
          </div>
        </div>
      </div>

      <button className="btn btn-secondary btn-lg btn-block" style={{marginTop:20}}>
        <Icon name="message-circle" size={16} /> Contact Support
      </button>
      <button onClick={() => go('login')} style={{marginTop:14,fontSize:13,color:'var(--text-3)',fontWeight:600}}>Back to Sign In</button>
    </div>
  );
}

Object.assign(window, { LandingScreen, LoginScreen, RegisterScreen, PendingApprovalScreen });
