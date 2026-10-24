import { useMemo, useState } from "react";
import {
  Activity, ArrowUpRight, AudioLines, BarChart3, Bell, BookOpen,
  Check, ChevronDown, ChevronRight, CircleHelp, Clock3, Command, FileChartColumn,
  Gauge, LayoutDashboard, LockKeyhole, Mic, MicOff, MoreHorizontal, Plus,
  Presentation, Search, Settings2, ShieldCheck, Sparkles, TrendingUp, X
} from "lucide-react";

type View = "Overview" | "Create" | "Presentation" | "Integrations" | "Templates" | "Tutorial";
type Proposal = { title: string; detail: string; chart: string; reason: string };

const nav: { label: View; icon: typeof LayoutDashboard }[] = [
  { label: "Overview", icon: LayoutDashboard }, { label: "Create", icon: Sparkles },
  { label: "Presentation", icon: Presentation }, { label: "Integrations", icon: Command },
  { label: "Templates", icon: FileChartColumn }, { label: "Tutorial", icon: BookOpen },
];
const sales = [42, 57, 49, 70, 62, 81, 74, 95, 86, 104, 92, 118];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function MiniChart({ values = sales }: { values?: number[] }) {
  const max = Math.max(...values);
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 300},${100 - (v / max) * 82}`).join(" ");
  return <svg className="mini-chart" viewBox="0 0 300 110" role="img" aria-label="Illustrative monthly revenue trend">
    <defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#b9f27c" stopOpacity=".24"/><stop offset="100%" stopColor="#b9f27c" stopOpacity="0"/></linearGradient></defs>
    {[20, 45, 70, 95].map(y => <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="currentColor" opacity=".08" />)}
    <polygon points={`0,110 ${points} 300,110`} fill="url(#area)" />
    <polyline points={points} fill="none" stroke="#b9f27c" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    {values.map((v, i) => <circle key={i} cx={(i / (values.length - 1)) * 300} cy={100 - (v / max) * 82} r={i === values.length - 1 ? 4 : 0} fill="#b9f27c" />)}
  </svg>;
}

export default function App() {
  const [active, setActive] = useState<View>("Overview");
  const [listening, setListening] = useState(false);
  const [query, setQuery] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [notice, setNotice] = useState("Ready when you are.");
  const [approved, setApproved] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [installed, setInstalled] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  }, []);

  function draftProposal(text = query) {
    const trimmed = text.trim();
    if (!trimmed) { setNotice("Tell Caesar what you want to show."); return; }
    setProposal({
      title: trimmed,
      detail: "A revenue trend with monthly comparison and a concise executive takeaway.",
      chart: "Monthly revenue · synthetic dataset",
      reason: "Caesar will use the approved demo dataset. No company system is connected.",
    });
    setApproved(false);
    setListening(false);
    setActive("Create");
    setNotice("Proposal ready for your review. Nothing has changed on the presentation yet.");
  }

  function approveProposal() {
    if (!proposal) return;
    setApproved(true);
    setNotice("Approved. Demo visual updated using synthetic data only.");
    setActive("Presentation");
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => setActive("Overview")} aria-label="Caesar home">
        <span className="brand-mark"><AudioLines size={21} strokeWidth={2.2}/></span>
        <span><strong>caesar</strong><small>WORKSPACE</small></span>
      </button>
      <div className="workspace-picker"><div className="workspace-avatar">N</div><div className="workspace-copy"><strong>Northstar Studio</strong><span>Personal workspace</span></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="nav-list">{nav.map(({ label, icon: Icon }) =>
        <button key={label} className={`nav-item ${active === label ? "active" : ""}`} onClick={() => setActive(label)}>
          <Icon size={17}/><span>{label}</span>{label === "Integrations" && <span className="nav-count">{installed.length}</span>}
        </button>)}</nav>
      <div className="sidebar-bottom">
        <div className="privacy-card"><div className="privacy-icon"><ShieldCheck size={17}/></div><div><strong>Privacy mode</strong><span>Demo data only</span></div><span className="live-dot"/></div>
        <button className="nav-item" onClick={() => setShowHelp(true)}><CircleHelp size={17}/><span>Help & feedback</span></button>
        <button className="nav-item" onClick={() => setNotice("Settings are a prototype in this build.")}><Settings2 size={17}/><span>Settings</span></button>
        <div className="profile"><div className="profile-avatar">V</div><div className="profile-copy"><strong>Workspace owner</strong><span>Local prototype</span></div><MoreHorizontal size={18}/></div>
      </div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14}/><strong>{active}</strong></div><div className="top-actions"><span className="environment"><span className="live-dot"/> SYNTHETIC ENVIRONMENT</span><button className="icon-button" title="Search" onClick={() => setNotice("Search is planned; no content is indexed in this prototype.")}><Search size={17}/></button><button className="icon-button" title="Notifications" onClick={() => setNotice("You're all caught up.")}><Bell size={17}/></button><button className="avatar-small" aria-label="Profile">V</button></div></header>

      <div className="page-content">
        {active === "Overview" && <>
          <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line"/> YOUR CREATIVE COMMAND CENTER</div><h1>{greeting}. Let's make<br/>something <em>remarkable.</em></h1><p className="subheading">Turn a thought into a clear, data-grounded presentation. You stay in control at every step.</p></div><div className="date-chip"><Clock3 size={14}/> Live workspace <span className="live-dot"/></div></section>
          <section className="copilot-panel">
            <div className="copilot-orb"><AudioLines size={25}/><span className="orb-ring ring-one"/><span className="orb-ring ring-two"/></div>
            <div className="copilot-content"><div className="copilot-heading"><div><span className="status-pill"><span className="live-dot"/> COPILOT READY</span><h2>What are we working on?</h2></div><span className="shortcut"><Command size={12}/> K</span></div><p>Describe the story you want your audience to see. Caesar will prepare a proposal for your approval.</p>
              <form className="prompt-box" onSubmit={e => { e.preventDefault(); draftProposal(); }}>
                <textarea value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. Show our quarterly revenue trend and highlight the biggest change…" rows={2} aria-label="Describe the presentation you want"/>
                <div className="prompt-bottom"><span><LockKeyhole size={13}/> Private by design · demo data only</span><div className="prompt-buttons"><button type="button" className={`mic-button ${listening ? "recording" : ""}`} onClick={() => {setListening(!listening);setNotice(listening ? "Microphone stopped. No audio was recorded." : "Listening indicator enabled for UI demonstration. Speech recognition is not connected.");}} title={listening ? "Stop listening" : "Start listening"}>{listening ? <MicOff size={16}/> : <Mic size={16}/>}</button><button type="submit" className="primary-button">Create proposal <ArrowUpRight size={15}/></button></div></div>
              </form>
              <div className="suggestions"><span>TRY A STARTER</span>{["Quarterly revenue story", "Executive project update", "Customer growth snapshot"].map(s=><button key={s} onClick={() => {setQuery(s);draftProposal(s)}}>{s}<ArrowUpRight size={12}/></button>)}</div>
            </div>
          </section>
          <div className="section-heading"><div><span className="eyebrow">YOUR WORKSPACE</span><h2>A clearer view of your work</h2></div><button className="text-button" onClick={() => setActive("Templates")}>Explore templates <ChevronRight size={15}/></button></div>
          <section className="metrics-grid">
            <article className="metric-card"><div className="metric-top"><span>Revenue <span className="demo-tag">DEMO</span></span><span className="metric-icon"><TrendingUp size={17}/></span></div><div className="metric-value">$284.6k <span className="metric-change"><ArrowUpRight size={13}/> 12.8%</span></div><p>Illustrative quarterly total</p><MiniChart values={[26,32,28,42,39,52,47,64,61,74,69,91]}/><div className="metric-footer"><span>Jan — Dec</span><span>Illustrative only</span></div></article>
            <article className="metric-card"><div className="metric-top"><span>Audience growth <span className="demo-tag">DEMO</span></span><span className="metric-icon"><Activity size={17}/></span></div><div className="metric-value">+18.4% <span className="metric-change"><ArrowUpRight size={13}/> 4.2%</span></div><p>Compared to prior period</p><div className="bar-chart">{[35,48,42,58,50,72,65,84,74,94,80,100].map((v,i)=><span key={i} style={{height:`${v}%`}} className={i===11?"bar current":""}/>)}</div><div className="metric-footer"><span>12-month trend</span><span>Illustrative only</span></div></article>
            <article className="metric-card highlight-card"><div className="metric-top"><span>Time back to your team</span><span className="metric-icon"><Gauge size={17}/></span></div><div className="metric-value">4.5 <small>hrs</small></div><p>Example estimate, not measured usage</p><div className="time-spark"><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/></div><div className="metric-footer"><span>Potential weekly saving</span><span>Illustrative only</span></div></article>
          </section>
          <section className="bottom-grid"><article className="activity-card"><div className="card-heading"><div><span className="eyebrow">GET STARTED</span><h3>Your first Caesar session</h3></div><span className="progress-label">01 <span>/ 04</span></span></div><div className="progress-track"><span style={{width:"25%"}}/></div><div className="task-row"><span className="task-number done"><Check size={13}/></span><div><strong>Explore your workspace</strong><p>You're right here. Everything starts here.</p></div><Check className="task-check" size={16}/></div><div className="task-row"><span className="task-number">2</span><div><strong>Draft your first proposal</strong><p>Turn a plain-language request into a reviewable plan.</p></div><button className="task-link" onClick={() => setActive("Create")}>Start <ChevronRight size={14}/></button></div><div className="task-row"><span className="task-number">3</span><div><strong>Approve a visual</strong><p>Nothing changes until you explicitly approve.</p></div></div><div className="task-row"><span className="task-number">4</span><div><strong>Explore integrations</strong><p>See how governed data sources will connect.</p></div></div></article>
            <article className="trust-card"><div className="trust-mark"><ShieldCheck size={21}/></div><span className="eyebrow">BUILT ON TRUST</span><h3>Your voice.<br/>Your data. <em>Your call.</em></h3><p>Caesar drafts. You decide. Every proposed change is reviewable before it reaches your presentation.</p><div className="trust-rule"/><div className="trust-detail"><LockKeyhole size={15}/><span><strong>Company-controlled by design</strong><small>Real data connectors are not enabled in this demo.</small></span></div><button className="text-button" onClick={() => setActive("Integrations")}>Explore data controls <ArrowUpRight size={14}/></button></article></section>
        </>}

        {active === "Create" && <section className="subpage"><div className="eyebrow">CREATION STUDIO</div><h1>Give your idea <em>a shape.</em></h1><p className="subheading">Caesar drafts the next step. Review the proposal before approving anything.</p><div className="studio-card"><label htmlFor="studio-prompt">WHAT SHOULD THE AUDIENCE UNDERSTAND?</label><textarea id="studio-prompt" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tell Caesar the story, audience, or question…" rows={4}/><div className="studio-footer"><span><LockKeyhole size={13}/> Synthetic demo only</span><button className="primary-button" onClick={()=>draftProposal()}>Draft proposal <Sparkles size={15}/></button></div></div>{proposal && <div className="proposal-card"><div className="proposal-title"><span className="status-pill">AWAITING YOUR APPROVAL</span><span className="demo-tag">SYNTHETIC DATA</span></div><h2>{proposal.title}</h2><p>{proposal.detail}</p><div className="proposal-preview"><BarChart3 size={18}/><div><strong>{proposal.chart}</strong><small>{proposal.reason}</small></div></div><div className="proposal-actions"><button className="secondary-button" onClick={()=>{setProposal(null);setApproved(false);setNotice("Proposal discarded.");}}>Discard</button><button className="primary-button" onClick={approveProposal}><Check size={15}/> Approve & preview</button></div></div>}</section>}

        {active === "Presentation" && <section className="subpage"><div className="eyebrow">PRESENTATION CANVAS</div><h1>Your story, <em>in focus.</em></h1><p className="subheading">Only approved proposals appear here. This prototype uses illustrative values, not company data.</p>{approved && proposal ? <div className="slide-preview"><div className="slide-top"><span>CAESAR / EXECUTIVE BRIEF</span><span>01 — 01</span></div><h2>{proposal.title}</h2><p className="slide-description">A clearer look at the trend behind the numbers.</p><div className="slide-chart"><MiniChart/></div><div className="slide-bottom"><span>Source: synthetic demonstration dataset</span><span>Illustrative values · not for business decisions</span></div></div> : <div className="empty-state"><div className="empty-icon"><Presentation size={26}/></div><h2>No approved visuals yet</h2><p>Draft a proposal and approve it to see it on your presentation canvas.</p><button className="primary-button" onClick={()=>setActive("Create")}>Create a proposal <ArrowUpRight size={15}/></button></div>}</section>}

        {active === "Integrations" && <section className="subpage"><div className="eyebrow">CONNECTED WORKSPACE</div><h1>Your tools, <em>on your terms.</em></h1><p className="subheading">A curated catalog concept. Installation is simulated; no service is contacted and no credentials are collected.</p><div className="integration-banner"><ShieldCheck size={20}/><div><strong>Permission-first integrations</strong><p>Each connector will disclose data access, destination, and requested scopes before installation.</p></div></div><div className="integration-grid">{[{name:"Power BI",desc:"Bring approved reports and semantic-model metrics into your story.",tag:"Analytics",icon:"P",color:"power"},{name:"Microsoft 365",desc:"Use approved files and presentation templates from your workspace.",tag:"Productivity",icon:"M",color:"office"},{name:"Company data API",desc:"A governed route to approved metrics, definitions, and freshness.",tag:"Private data",icon:"D",color:"data"}].map(item=><article className="integration-card" key={item.name}><div className={`integration-logo ${item.color}`}>{item.icon}</div><span className="integration-tag">{item.tag}</span><h3>{item.name}</h3><p>{item.desc}</p><div className="integration-bottom"><span>{installed.includes(item.name)?"Demo enabled":"Not connected"}</span><button className={installed.includes(item.name)?"secondary-button":"primary-button"} onClick={()=>{setInstalled(installed.includes(item.name)?installed.filter(x=>x!==item.name):[...installed,item.name]);setNotice(installed.includes(item.name)?`${item.name} demo disabled.`:`${item.name} added to local demo list only. No connection was made.`);}}>{installed.includes(item.name)?"Disable demo":"Try demo"} {installed.includes(item.name)?<X size={13}/>:<Plus size={13}/>}</button></div></article>)}</div></section>}

        {active === "Templates" && <section className="subpage"><div className="eyebrow">START WITH A STRONG STORY</div><h1>Good structure. <em>Great clarity.</em></h1><p className="subheading">Original starter directions for the stories teams tell most often.</p><div className="template-grid">{[{name:"The executive brief",type:"DECISION-MAKING",desc:"One headline, three signals, one clear next step.",style:"template-dark"},{name:"The growth story",type:"PERFORMANCE",desc:"A grounded trend, its context, and the question it raises.",style:"template-green"},{name:"The project pulse",type:"TEAM UPDATE",desc:"Progress, risk, and decisions needed from stakeholders.",style:"template-paper"}].map((t,i)=><button className="template-card" key={t.name} onClick={()=>{setQuery(t.name);setProposal({title:t.name,detail:t.desc,chart:"Template preview · synthetic dataset",reason:"This is an original starter concept, not a connected data source."});setApproved(false);setActive("Create");}}><div className={`template-art ${t.style}`}><span className="art-kicker">CAESAR / {String(i+1).padStart(2,"0")}</span><div className="art-lines"><i/><i/><i/></div><MiniChart values={sales.slice(i, i+8)}/></div><span className="eyebrow">{t.type}</span><h3>{t.name}</h3><p>{t.desc}</p><span className="template-open">Use template <ArrowUpRight size={14}/></span></button>)}</div></section>}

        {active === "Tutorial" && <section className="subpage"><div className="eyebrow">THE 3-MINUTE TOUR</div><h1>Meet your new <em>copilot.</em></h1><p className="subheading">A short guided tour of the approval-first workflow.</p><div className="tutorial-layout"><div className="tutorial-steps">{["Start with a thought","Review the proposal","Approve the change","Connect with care"].map((s,i)=><button key={s} className={tutorialStep===i?"tutorial-step selected":"tutorial-step"} onClick={()=>setTutorialStep(i)}><span>{i+1}</span><div><strong>{s}</strong><small>{["Describe the story you need.","Check what Caesar plans to do.","You decide what reaches the canvas.","Review access before connecting data."][i]}</small></div>{tutorialStep===i&&<ChevronRight size={16}/>}</button>)}</div><div className="tutorial-detail"><div className="tutorial-illustration"><div className="tutorial-orb"><AudioLines size={32}/></div><span>STEP 0{tutorialStep+1} / 04</span></div><h2>{["Say what matters.","Nothing happens in the dark.","Your approval is the switch.","Your data deserves boundaries."][tutorialStep]}</h2><p>{["Start with plain language. Caesar can prepare a structured proposal from your request. Microphone controls will be explicit and visible.","Before anything changes, you'll see a summary of the intended action and which data it would use. Ambiguity means ask, not guess.","Approval applies to the exact proposal reviewed. If the content changes, the previous approval is no longer valid.","Integrations will show their publisher, requested permissions, data destination, and controls to test, disable, or revoke access."][tutorialStep]}</p><div className="tutorial-nav"><button className="secondary-button" disabled={tutorialStep===0} onClick={()=>setTutorialStep(Math.max(0,tutorialStep-1))}>Back</button><button className="primary-button" onClick={()=>tutorialStep===3?setActive("Overview"):setTutorialStep(tutorialStep+1)}>{tutorialStep===3?"Finish tour":"Next step"} <ChevronRight size={14}/></button></div></div></div></section>}
      </div>
      <footer className="statusbar"><span><span className="live-dot"/> {notice}</span><span><LockKeyhole size={12}/> Local demo · No company connection <span className="status-divider"/> <button onClick={()=>setShowHelp(true)}>About this prototype</button></span></footer>
    </main>
    {showHelp && <div className="modal-backdrop" onClick={()=>setShowHelp(false)}><section className="help-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowHelp(false)} aria-label="Close"><X size={18}/></button><div className="trust-mark"><ShieldCheck size={22}/></div><div className="eyebrow">PROTOTYPE NOTES</div><h2>Designed to earn trust.</h2><p>This is an interactive front-end prototype built around Caesar's proposed approval-first workflow. It uses synthetic values only.</p><ul><li><Check size={15}/> Navigation, starter prompts, and tutorial work locally.</li><li><Check size={15}/> Proposal review and approval are simulated in browser state.</li><li><X size={15}/> Microphone capture, speech recognition, real integrations, export, and backend authorization are not implemented.</li></ul><button className="primary-button" onClick={()=>setShowHelp(false)}>Got it <Check size={15}/></button></section></div>}
  </div>;
}
