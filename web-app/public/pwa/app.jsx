// app.jsx - main app shell
const { useState: useS, useEffect: useE, useRef: useR } = React;

const ROLES = [
  { id: 'customer', label: 'Customer', icon: 'compass', color: 'var(--primary)' },
  { id: 'owner', label: 'Safari Owner', icon: 'home', color: 'var(--primary)' },
  { id: 'vendor', label: 'Vendor', icon: 'briefcase', color: 'var(--brown)' },
  { id: 'admin', label: 'Super Admin', icon: 'shield', color: '#1E5A87' },
  { id: 'auth', label: 'Auth / PWA', icon: 'log-in', color: 'var(--text-3)' },
];

const SCREENS = {
  customer: [
    { id: 'browse', label: 'Browse Safaris', num: '05' },
    { id: 'detail', label: 'Safari Detail', num: '06' },
    { id: 'publicPay', label: 'WhatsApp Pay Link', num: '07' },
    { id: 'bookings', label: 'My Bookings', num: '08' },
  ],
  owner: [
    { id: 'home', label: 'Dashboard', num: '09' },
    { id: 'shared', label: 'Shared Jeeps', num: '10' },
    { id: 'pricing', label: 'Pricing Setup', num: '11' },
    { id: 'private', label: 'Private Safaris', num: '12' },
    { id: 'createPrivate', label: 'Create Private', num: '13' },
    { id: 'payments', label: 'Vendor Payments', num: '14' },
    { id: 'revenue', label: 'Revenue Analytics', num: '15' },
  ],
  vendor: [
    { id: 'home', label: 'Dashboard', num: '16' },
    { id: 'jobs', label: 'Jobs', num: '17' },
    { id: 'jobDetail', label: 'Job Detail', num: '18' },
    { id: 'earnings', label: 'Earnings', num: '19' },
    { id: 'subscription', label: 'Subscription', num: '20' },
  ],
  admin: [
    { id: 'home', label: 'Dashboard', num: '21' },
    { id: 'users', label: 'User Management', num: '22' },
    { id: 'features', label: 'Feature Management', num: '23' },
    { id: 'billing', label: 'Billing', num: '24' },
    { id: 'locations', label: 'Locations', num: '25' },
    { id: 'adminBookings', label: 'Bookings Mgmt', num: '26' },
    { id: 'analytics', label: 'Analytics', num: '27' },
  ],
  auth: [
    { id: 'landing', label: 'Landing Page', num: '01' },
    { id: 'login', label: 'Login', num: '02' },
    { id: 'register', label: 'Register', num: '03' },
    { id: 'pending', label: 'Pending Approval', num: '04' },
    { id: 'pushPerm', label: 'Push Permission', num: '28' },
    { id: 'notifications', label: 'Notification Center', num: '29' },
    { id: 'offline', label: 'Offline State', num: '30' },
  ],
};

const NAV_TABS = {
  customer: [
    { id: 'browse', icon: 'search', label: 'Browse' },
    { id: 'bookings', icon: 'ticket', label: 'Bookings' },
    { id: 'notifications', icon: 'bell', label: 'Inbox' },
    { id: 'profile', icon: 'user', label: 'Profile' },
  ],
  owner: [
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'shared', icon: 'users', label: 'Shared' },
    { id: 'private', icon: 'user', label: 'Private' },
    { id: 'payments', icon: 'wallet', label: 'Payments' },
    { id: 'revenue', icon: 'trending-up', label: 'Revenue' },
  ],
  vendor: [
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'jobs', icon: 'briefcase', label: 'Jobs' },
    { id: 'earnings', icon: 'banknote', label: 'Earnings' },
    { id: 'subscription', icon: 'zap', label: 'Subscribe' },
  ],
  admin: [
    { id: 'home', icon: 'layout-dashboard', label: 'Home' },
    { id: 'users', icon: 'users', label: 'Users' },
    { id: 'adminBookings', icon: 'ticket', label: 'Bookings' },
    { id: 'analytics', icon: 'bar-chart-3', label: 'Analytics' },
  ],
};

function App() {
  const [role, setRole] = useS('customer');
  const [screen, setScreen] = useS('browse');
  const [navState, setNavState] = useS({});
  const [dark, setDark] = useS(false);
  const [pwaModal, setPwaModal] = useS(false);

  const go = (s, payload = {}) => {
    setNavState(payload);
    setScreen(s);
  };

  const handleRoleChange = (r) => {
    setRole(r);
    // Default screen per role
    const defaults = {
      customer: 'browse',
      owner: 'home',
      vendor: 'home',
      admin: 'home',
      auth: 'landing',
    };
    setScreen(defaults[r]);
    setNavState({});
  };

  const tabs = NAV_TABS[role];
  const showNav = role !== 'auth' && ![
    'detail','publicPay','payment','createShared','createPrivate','pricing','jobDetail','pushPerm','offline','login','register','pending','landing',
    'users','features','billing','locations',
  ].includes(screen);

  const renderScreen = () => {
    if (role === 'auth') {
      if (screen === 'landing') return <LandingScreen go={go} onInstall={() => setPwaModal(true)} />;
      if (screen === 'login') return <LoginScreen go={go} onLogin={() => { setRole('owner'); setScreen('home'); }} />;
      if (screen === 'register') return <RegisterScreen go={go} />;
      if (screen === 'pending') return <PendingApprovalScreen go={go} />;
      if (screen === 'pushPerm') return <PushPermissionScreen go={(s) => { handleRoleChange('owner'); }} back="home" />;
      if (screen === 'notifications') return <NotificationsScreen go={go} back="landing" />;
      if (screen === 'offline') return <OfflineScreen go={go} />;
    }
    if (role === 'customer') {
      if (screen === 'browse') return <BrowseScreen go={go} />;
      if (screen === 'detail') return <SafariDetailScreen go={go} safari={navState.safari} />;
      if (screen === 'payment' || screen === 'publicPay') return <PublicBookingPayScreen go={go} />;
      if (screen === 'bookings') return <MyBookingsScreen go={go} />;
      if (screen === 'notifications') return <NotificationsScreen go={go} back="browse" />;
      if (screen === 'profile') return <ProfilePlaceholder go={go} role="customer" />;
    }
    if (role === 'owner') {
      if (screen === 'home') return <OwnerHomeScreen go={go} />;
      if (screen === 'shared') return <SharedSafarisScreen go={go} />;
      if (screen === 'pricing' || screen === 'createShared') return <PricingSetupScreen go={go} />;
      if (screen === 'private') return <PrivateSafarisScreen go={go} />;
      if (screen === 'createPrivate') return <CreatePrivateSafariScreen go={go} />;
      if (screen === 'payments') return <VendorPaymentsScreen go={go} />;
      if (screen === 'revenue') return <RevenueAnalyticsScreen go={go} />;
      if (screen === 'notifications') return <NotificationsScreen go={go} back="home" />;
    }
    if (role === 'vendor') {
      if (screen === 'home') return <VendorHomeScreen go={go} />;
      if (screen === 'jobs') return <VendorJobsScreen go={go} />;
      if (screen === 'jobDetail') return <JobDetailScreen go={go} job={navState.job} />;
      if (screen === 'earnings') return <VendorEarningsScreen go={go} />;
      if (screen === 'subscription') return <SubscriptionScreen go={go} />;
      if (screen === 'notifications') return <NotificationsScreen go={go} back="home" />;
    }
    if (role === 'admin') {
      if (screen === 'home') return <AdminDashboardScreen go={go} />;
      if (screen === 'users') return <UserManagementScreen go={go} />;
      if (screen === 'features') return <FeatureManagementScreen go={go} />;
      if (screen === 'billing') return <BillingScreen go={go} />;
      if (screen === 'locations') return <LocationsScreen go={go} />;
      if (screen === 'adminBookings') return <AdminBookingsScreen go={go} />;
      if (screen === 'analytics') return <AdminAnalyticsScreen go={go} />;
      if (screen === 'notifications') return <NotificationsScreen go={go} back="home" />;
    }
    return <div style={{padding:40,textAlign:'center',color:'var(--text-3)'}}>Screen not found</div>;
  };

  const currentRoleLabel = ROLES.find(r => r.id === role)?.label || '';

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>
          <span className="brand-mark">
            <Icon name="compass" size={18} color="#fff" />
          </span>
          Safari Adventures
        </h1>
        <div className="sub">PWA Prototype · 30 screens</div>

        <h2>View as</h2>
        {ROLES.map(r => (
          <button key={r.id} className={`role-btn ${role === r.id ? 'active' : ''}`} onClick={() => handleRoleChange(r.id)}>
            <span className="role-ico">
              <Icon name={r.icon} size={14} color={role === r.id ? '#fff' : 'var(--text-2)'} />
            </span>
            <span style={{flex:1}}>{r.label}</span>
            <span style={{fontSize:10.5,color: role === r.id ? 'rgba(255,255,255,0.6)' : 'var(--text-3)'}}>{SCREENS[r.id].length}</span>
          </button>
        ))}

        <h2>{currentRoleLabel} screens</h2>
        <div className="screen-list">
          {SCREENS[role].map(s => (
            <button
              key={s.id}
              className={screen === s.id ? 'active' : ''}
              onClick={() => { setScreen(s.id); setNavState({}); }}
            >
              <span className="num">{s.num}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-foot">
          <strong>Tips</strong>
          Tap cards & buttons inside the phone — most flows are wired. Open a safari to see seat selection. Use ⓘ icons for context.
        </div>
      </aside>

      <main className="stage">
        <div className="stage-meta">
          <span className="meta-pill"><Icon name="smartphone" size={12} /> 390 × 844 · PWA</span>
          <span className="meta-pill dark-toggle" onClick={() => setDark(!dark)}>
            <Icon name={dark ? 'sun' : 'moon'} size={12} />
            {dark ? 'Light' : 'Dark'}
          </span>
        </div>

        <div className={`phone ${dark ? 'dark' : ''}`}>
          <div className="phone-dynamic-island" />
          <div className="phone-screen" style={dark ? {background:'var(--bg)'} : {}}>
            <StatusBar />
            {renderScreen()}
            {showNav && <BottomNav tabs={tabs} active={screen} onChange={(t) => { setScreen(t); setNavState({}); }} />}
            <div className="home-indicator" />
          </div>
        </div>

        {pwaModal && (
          <PwaInstallModal onClose={() => setPwaModal(false)} />
        )}
      </main>
    </div>
  );
}

function ProfilePlaceholder({ go, role }) {
  return (
    <div className="app-body" style={{paddingBottom:110}}>
      <TopBar title="Profile" subtitle="Settings & preferences" />
      <div style={{padding:'0 16px'}}>
        <div className="card card-pad" style={{textAlign:'center',padding:'24px 18px',marginBottom:14}}>
          <div className="avatar" style={{margin:'0 auto 12px',width:64,height:64,borderRadius:20,fontSize:22,background:'linear-gradient(135deg, var(--primary), var(--primary-700))'}}>EL</div>
          <div style={{fontSize:17,fontWeight:700}}>Emma Larsson</div>
          <div style={{fontSize:12.5,color:'var(--text-3)'}}>emma.larsson@gmail.com</div>
        </div>
        <div className="card" style={{padding:6}}>
          {[
            {ico:'user-cog', label:'Personal info'},
            {ico:'credit-card', label:'Payment methods'},
            {ico:'bell', label:'Notifications'},
            {ico:'globe', label:'Language · English'},
            {ico:'help-circle', label:'Help & support'},
            {ico:'log-out', label:'Sign out', danger:true},
          ].map((x, i, arr) => (
            <button key={x.label} className="row" style={{padding:'14px 12px',gap:14,width:'100%',textAlign:'left',borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none', color: x.danger ? 'var(--danger)' : 'inherit'}}>
              <Icon name={x.ico} size={17} color={x.danger ? 'var(--danger)' : 'var(--text-3)'} />
              <span style={{flex:1,fontSize:13.5,fontWeight:500}}>{x.label}</span>
              {!x.danger && <Icon name="chevron-right" size={16} color="var(--text-3)" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PwaInstallModal({ onClose }) {
  return (
    <div className="sheet-backdrop" onClick={onClose} style={{position:'fixed',inset:0,zIndex:200}}>
      <div className="sheet" onClick={e => e.stopPropagation()} style={{maxWidth: 380, alignSelf:'center',borderRadius: 22, margin:'auto', maxHeight:'90vh'}}>
        <div style={{textAlign:'center',padding:'12px 12px 4px'}}>
          <div style={{width:64,height:64,borderRadius:20,background:'var(--primary)',display:'grid',placeItems:'center',margin:'0 auto 14px',boxShadow:'0 10px 30px rgba(45,106,79,0.3)'}}>
            <Icon name="compass" size={32} color="#fff" />
          </div>
          <h2 style={{margin:'0 0 6px',fontSize:20,fontWeight:800,letterSpacing:'-0.02em'}}>Install Safari Adventures</h2>
          <p style={{margin:'0 0 18px',fontSize:13,color:'var(--text-2)',lineHeight:1.5}}>Get a faster experience, push alerts, and offline access — straight from your home screen.</p>
        </div>
        <div className="stack" style={{gap:10,marginBottom:18}}>
          {[
            {ico:'zap',title:'Instant launch',sub:'1-tap from your home screen'},
            {ico:'wifi-off',title:'Works offline',sub:'View bookings without signal'},
            {ico:'bell',title:'Push notifications',sub:'Never miss a confirmation'},
          ].map(b => (
            <div key={b.title} className="row" style={{gap:12,padding:'10px 12px',background:'var(--bg)',borderRadius:10}}>
              <div style={{width:32,height:32,borderRadius:8,background:'var(--primary-100)',display:'grid',placeItems:'center',flex:'0 0 32px'}}>
                <Icon name={b.ico} size={14} color="var(--primary)" />
              </div>
              <div>
                <div style={{fontSize:12.5,fontWeight:600}}>{b.title}</div>
                <div style={{fontSize:11,color:'var(--text-3)'}}>{b.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-lg btn-block" onClick={onClose}>
          <Icon name="download" size={16} color="#fff" /> Add to Home Screen
        </button>
        <button onClick={onClose} style={{width:'100%',marginTop:10,padding:8,color:'var(--text-3)',fontSize:12.5,fontWeight:500}}>Not now</button>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ToastProvider>
    <App />
  </ToastProvider>
);
