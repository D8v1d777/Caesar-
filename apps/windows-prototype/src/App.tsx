import { useEffect, useMemo, useRef, useState } from "react";
import { fetchDemoMetric, type DemoMetricName, type DemoMetricResult, type DemoPeriod } from "./api";
import { canApproveProposal, getProposalApprovalKey, type ApprovalSnapshot } from "./proposalApproval";
import { initialVoiceSessionState, transitionVoiceSession, type VoiceSessionState } from "./voiceSession";
import { getLocalSpeechStatus, startLocalAudioCapture, transcribeLocalWav, type LocalAudioCapture } from "./localVoice";
import {
  Activity, ArrowUpRight, AudioLines, BarChart3, Bell, BookOpen,
  Check, ChevronDown, ChevronRight, CircleHelp, Command, FileChartColumn, Images,
  Gauge, LayoutDashboard, LockKeyhole, Mic, MicOff, MoreHorizontal, Plus,
  Presentation, Search, Settings2, ShieldCheck, Sparkles, TrendingUp, X
} from "lucide-react";

type View = "Overview" | "Create" | "Presentation" | "Integrations" | "Templates" | "Gallery" | "Tutorial";
type Proposal = { title: string; detail: string; chart: string; reason: string; metricResult?: DemoMetricResult };

function formatDemoMetricValue(result: DemoMetricResult): string {
  if (result.unit === "USD") return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(result.value);
  if (result.unit === "customers") return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(result.value) + " customers";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(result.value) + "%";
}

const nav: { label: View; icon: typeof LayoutDashboard }[] = [
  { label: "Overview", icon: LayoutDashboard }, { label: "Create", icon: Sparkles },
  { label: "Presentation", icon: Presentation }, { label: "Integrations", icon: Command },
  { label: "Templates", icon: FileChartColumn }, { label: "Gallery", icon: Images },
  { label: "Tutorial", icon: BookOpen },
];

type StatueArtwork = { name: string; epithet: string; alt: string; image: string; description: string; };

const statueArtworks: StatueArtwork[] = [
  { name: "The Laurel Gaze", epithet: "Marble portrait · I", alt: "Marble portrait of a classical woman wearing a laurel wreath, looking upward.", image: "/images/caesar-statues/laurel-gaze.webp", description: "A quiet upward gaze, laurel leaves, and a face shaped by light and shadow." },
  { name: "The Votive Figure", epithet: "Standing sculpture · II", alt: "Full-length marble woman in flowing drapery, arms lifted beneath a tall arch.", image: "/images/caesar-statues/votive-figure.webp", description: "Flowing stone folds and an ascending silhouette frame a gesture of offering." },
  { name: "The Contemplative Muse", epithet: "Sculptural study · III", alt: "Classical marble woman with lowered head and delicately carved hair.", image: "/images/caesar-statues/contemplative-muse.webp", description: "A contemplative profile, carved curls, and tactile marble softened by gallery light." },
  { name: "The Draped Muse", epithet: "Standing sculpture · IV", alt: "Full-length classical marble woman wearing layered draped robes in a shadowed gallery.", image: "/images/caesar-statues/draped-muse.webp", description: "The vertical fall of the garment gives the figure its rhythm and quiet authority." },
  { name: "The Marble Profile", epithet: "Laurel portrait · V", alt: "Classical marble head with laurel wreath and face turned toward the light.", image: "/images/caesar-statues/marble-profile.webp", description: "A monumental profile defined by the contrast between polished stone and deep shadow." },
  { name: "The Standing Muse", epithet: "Full figure · VI", alt: "Full-length marble woman in a classical robe standing beside stone columns.", image: "/images/caesar-statues/standing-muse.webp", description: "Balanced posture, architectural framing, and carefully restrained folds of drapery." },
  { name: "The Profile Study", epithet: "Sculptural study · VII", alt: "Side view of a carved marble woman's head and shoulder with detailed curled hair.", image: "/images/caesar-statues/profile-study.webp", description: "The turn of the neck and carved hair bring a quiet sense of movement to stone." },
  { name: "The Lyre Muse", epithet: "Figure with lyre · VIII", alt: "Draped classical marble woman holding a lyre inside a dimly lit stone hall.", image: "/images/caesar-statues/lyre-muse.webp", description: "Music and sculpture meet in a composed figure framed by warm architectural light." },
  { name: "The Oracle Gaze", epithet: "Marble portrait · IX", alt: "Close-up marble portrait of a classical woman looking toward the light.", image: "/images/caesar-statues/oracle-gaze.webp", description: "An upward glance, sculpted curls, and a strong silhouette against the darkened hall." },
];

const sales = [42, 57, 49, 70, 62, 81, 74, 95, 86, 104, 92, 118];

function MiniChart({ values = sales }: { values?: number[] }) {
  const max = Math.max(...values);
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 300},${100 - (v / max) * 82}`).join(" ");
  return <svg className="mini-chart" viewBox="0 0 300 110" role="img" aria-label="Illustrative monthly revenue trend">
    <defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#c9aa70" stopOpacity=".24"/><stop offset="100%" stopColor="#c9aa70" stopOpacity="0"/></linearGradient></defs>
    {[20, 45, 70, 95].map(y => <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="currentColor" opacity=".08" />)}
    <polygon points={`0,110 ${points} 300,110`} fill="url(#area)" />
    <polyline points={points} fill="none" stroke="#c9aa70" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    {values.map((v, i) => <circle key={i} cx={(i / (values.length - 1)) * 300} cy={100 - (v / max) * 82} r={i === values.length - 1 ? 4 : 0} fill="#c9aa70" />)}
  </svg>;
}

function CaesarSigil() {
  return <svg className="caesar-sigil" viewBox="0 0 36 36" aria-hidden="true">
    <path d="M10 29C5.9 25.6 4.5 20.7 5.8 15.4 6.5 12 8.1 9.1 10.8 6.8" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
    <path d="M26 29c4.1-3.4 5.5-8.3 4.2-13.6-.7-3.4-2.3-6.3-5-8.6" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
    <path d="M7.2 23.7l5-1.5M6.1 17.6l5.1.4M8.4 11.6l4.1 2.6M28.8 23.7l-5-1.5m6.1-4.6-5.1.4m2.3-6.4-4.1 2.6" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round"/>
    <text x="18" y="23" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="19" fontWeight="700" fill="currentColor">C</text>
  </svg>;
}

function ImperialWatermark() {
  return <div className="imperial-watermark" aria-hidden="true">
    <svg viewBox="0 0 280 190" fill="none">
      <path d="M22 171V79C22 37 72 10 140 10s118 27 118 69v92" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M39 171V83c0-34 43-59 101-59s101 25 101 59v88" stroke="currentColor" strokeWidth=".7"/>
      <path d="M48 67h184M48 72h184M47 159h186M42 165h196M35 171h210" stroke="currentColor" strokeWidth=".8"/>
      <path d="M71 78v80m7-80v80m-11-80h15m-18-5h21m-22 90h23M107 78v80m7-80v80m-11-80h15m-18-5h21m-22 90h23M166 78v80m7-80v80m-11-80h15m-18-5h21m-22 90h23M202 78v80m7-80v80m-11-80h15m-18-5h21m-22 90h23" stroke="currentColor" strokeWidth=".7"/>
      <circle cx="140" cy="109" r="27" stroke="currentColor" strokeWidth="1"/>
      <circle cx="140" cy="109" r="22" stroke="currentColor" strokeWidth=".6"/>
      <text x="140" y="117" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="28" fill="currentColor">C</text>
      <text x="140" y="185" textAnchor="middle" fontFamily="'Courier New', monospace" fontSize="7" letterSpacing="1.8" fill="currentColor">SPEAK · SHAPE · PRESENT</text>
    </svg>
  </div>;
}

export default function App() {
  const [active, setActive] = useState<View>("Overview");
  const [voiceState, setVoiceState] = useState<VoiceSessionState>(initialVoiceSessionState);
  const voiceCaptureRef = useRef<LocalAudioCapture | null>(null);
  const voiceOperationRef = useRef(false);
  const [query, setQuery] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [notice, setNotice] = useState("Ready when you are.");
  const [approvedProposalKey, setApprovedProposalKey] = useState<string | null>(null);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [installed, setInstalled] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedStatue, setSelectedStatue] = useState<StatueArtwork | null>(null);
  const [metricResult, setMetricResult] = useState<DemoMetricResult | null>(null);
  const [apiBusy, setApiBusy] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<DemoMetricName>("revenue");
  const [selectedPeriod, setSelectedPeriod] = useState<DemoPeriod>("2026-Q2");

  const proposalApprovalSnapshot: ApprovalSnapshot | null = proposal ? { title: proposal.title, detail: proposal.detail, chart: proposal.chart, reason: proposal.reason, metricResult: proposal.metricResult ?? null } : null;
  const approved = proposalApprovalSnapshot !== null && approvedProposalKey === getProposalApprovalKey(proposalApprovalSnapshot);

  useEffect(() => () => {
    const activeCapture = voiceCaptureRef.current;
    voiceCaptureRef.current = null;
    if (activeCapture) void activeCapture.cancel();
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  }, []);

  function draftProposal(text = query, metricResult?: DemoMetricResult) {
    const trimmed = text.trim();
    if (!trimmed) { setNotice("Tell Caesar what you want to show."); return; }
    setProposal({
      title: trimmed,
      detail: metricResult ? metricResult.definition : "A revenue trend with monthly comparison and a concise executive takeaway.",
      chart: metricResult ? `${metricResult.metric} · ${metricResult.period}` : "Monthly revenue · illustrative dataset",
      reason: metricResult ? `Source: ${metricResult.source}. ${metricResult.warning}` : "Caesar will use illustrative demo data. No company system is connected.",
      ...(metricResult ? { metricResult } : {}),
    });
    setApprovedProposalKey(null);
    setVoiceState(current => transitionVoiceSession(current, { type: "dismiss_transcript" }));
    setActive("Create");
    setNotice("Proposal ready for your review. Nothing has changed on the presentation yet.");
  }

  async function testDemoApi() {
    setApiBusy(true);
    setNotice("Requesting a synthetic metric from the local API…");
    try {
      const result = await fetchDemoMetric(selectedMetric, selectedPeriod);
      setMetricResult(result);
      setNotice("Synthetic API connected. " + result.metric.replace(/_/g, " ") + " for " + result.period + " returned with provenance.");
    } catch (error) {
      setMetricResult(null);
      setNotice(error instanceof Error ? error.message : "Synthetic API request failed.");
    } finally {
      setApiBusy(false);
    }
  }

  async function startVoiceInput() {
    if (voiceOperationRef.current || voiceCaptureRef.current) return;
    voiceOperationRef.current = true;

    try {
      if (window.location.origin !== "http://127.0.0.1:5173") {
        setVoiceState(current => transitionVoiceSession(current, { type: "runtime_missing" }));
        setNotice("Voice input is restricted to the loopback prototype at http://127.0.0.1:5173. No microphone permission was requested.");
        return;
      }

      setNotice("Checking the local speech runtime. Microphone permission has not been requested.");
      const status = await getLocalSpeechStatus();
      if (!status.available) {
        setVoiceState(current => transitionVoiceSession(current, { type: "runtime_missing" }));
        setNotice(status.message);
        return;
      }

      let base = voiceState;
      if (base.status === "transcript_ready") {
        base = transitionVoiceSession(base, { type: "dismiss_transcript" });
      }
      if (base.status === "unavailable") {
        base = transitionVoiceSession(base, { type: "runtime_ready" });
      }
      const requesting = transitionVoiceSession(base, { type: "start_requested" });
      if (requesting.status !== "requesting_permission") {
        setNotice("Voice session could not start from its current state. Please retry.");
        return;
      }
      setVoiceState(requesting);

      const capture = await startLocalAudioCapture(() => { void stopVoiceInput(); });
      voiceCaptureRef.current = capture;
      setVoiceState(current => transitionVoiceSession(current, { type: "permission_granted" }));
      setNotice("Recording active · processed locally. Press the microphone button again to stop and transcribe.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Local voice capture could not start.";
      setVoiceState(current => {
        const ready = current.status === "unavailable"
          ? transitionVoiceSession(current, { type: "runtime_ready" })
          : current;
        return transitionVoiceSession(ready, { type: "permission_denied", message });
      });
      setNotice(message);
    } finally {
      voiceOperationRef.current = false;
    }
  }

  async function stopVoiceInput() {
    if (voiceOperationRef.current) return;
    const capture = voiceCaptureRef.current;
    if (!capture) return;
    voiceOperationRef.current = true;
    voiceCaptureRef.current = null;
    setVoiceState(current => transitionVoiceSession(current, { type: "audio_stopped" }));
    setNotice("Transcribing locally. Audio is not sent to a cloud provider.");

    try {
      const wav = await capture.stop();
      const result = await transcribeLocalWav(wav);
      setQuery(result.transcript);
      setVoiceState(current => transitionVoiceSession(current, {
        type: "transcription_succeeded",
        transcript: result.transcript,
      }));
      setNotice("Local transcript ready. Review or edit it before creating a proposal.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Local transcription failed.";
      setVoiceState(current => transitionVoiceSession(current, { type: "transcription_failed", message }));
      setNotice(message);
    } finally {
      voiceOperationRef.current = false;
    }
  }

  async function cancelVoiceInput() {
    if (voiceOperationRef.current) return;
    const capture = voiceCaptureRef.current;
    if (!capture) return;
    voiceOperationRef.current = true;
    voiceCaptureRef.current = null;
    try {
      await capture.cancel();
      setVoiceState(current => transitionVoiceSession(current, { type: "cancel" }));
      setNotice("Voice input cancelled. In-memory audio was discarded.");
    } finally {
      voiceOperationRef.current = false;
    }
  }

  function approveProposal() {
    if (!proposal || !canApproveProposal(proposal.title)) { setNotice("Add a proposal title before approving."); return; }
    setApprovedProposalKey(getProposalApprovalKey({ title: proposal.title, detail: proposal.detail, chart: proposal.chart, reason: proposal.reason, metricResult: proposal.metricResult ?? null }));
    setNotice("Approved. Demo visual updated using synthetic data only.");
    setActive("Presentation");
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => setActive("Overview")} aria-label="Caesar home">
        <span className="brand-mark"><CaesarSigil /></span>
        <span><strong>CAESAR</strong><small>VOICE · PRESENTATION</small></span>
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
      <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14}/><strong>{active}</strong></div><div className="top-actions"><span className="environment"><span className="live-dot"/> SYNTHETIC DATA / DEMO</span><button className="icon-button" title="Search" onClick={() => setNotice("Search is planned; no content is indexed in this prototype.")}><Search size={17}/></button><button className="icon-button" title="Notifications" onClick={() => setNotice("You're all caught up.")}><Bell size={17}/></button><button className="avatar-small" aria-label="Profile">V</button></div></header>

      <div className="page-content">
        {active === "Overview" && <>
          <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line"/> {greeting.toUpperCase()} · THE ART OF THE CLEAR STORY</div><h1>Make your next<br/>story <em>unforgettable.</em></h1><p className="subheading">Turn a thought into a clear, data-grounded presentation. You stay in control at every step.</p></div><ImperialWatermark /><div className="date-chip"><ShieldCheck size={14}/> APPROVAL-FIRST <span className="live-dot"/></div></section>
          <section className="copilot-panel">
            <div className="copilot-orb"><AudioLines size={25}/><span className="orb-ring ring-one"/><span className="orb-ring ring-two"/></div>
            <div className="copilot-content"><div className="copilot-heading"><div><span className="status-pill"><span className="live-dot"/> COPILOT READY</span><h2>What are we working on?</h2></div><span className="shortcut"><Command size={12}/> K</span></div><p>Describe the story you want your audience to see. Caesar will prepare a proposal for your approval. Local voice input is available only when the verified local runtime is configured; no cloud transcription fallback is used.</p>
              <form className="prompt-box" onSubmit={e => { e.preventDefault(); draftProposal(); }}>
                <textarea value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. Show our quarterly revenue trend and highlight the biggest change…" rows={2} aria-label="Describe the presentation you want"/>
                <div className="prompt-bottom"><span><LockKeyhole size={13}/> Private by design · demo data only</span><div className="prompt-buttons"><button type="button" className={`mic-button ${voiceState.status === "listening" ? "recording" : voiceState.status === "unavailable" ? "unavailable" : voiceState.status === "error" ? "voice-error" : ""}`} onClick={() => {void (voiceState.status === "listening" ? stopVoiceInput() : startVoiceInput());}} disabled={voiceState.status === "requesting_permission" || voiceState.status === "transcribing"} aria-label={voiceState.status === "listening" ? "Stop and transcribe locally" : "Start local voice input"} title={voiceState.status === "listening" ? "Stop and transcribe locally" : "Start local voice input"}>{voiceState.status === "listening" ? <MicOff size={16}/> : <Mic size={16}/>}</button><span className={`voice-offline-label ${voiceState.status === "listening" || voiceState.status === "transcript_ready" ? "active" : voiceState.status === "error" ? "error" : ""}`} aria-live="polite">{voiceState.status === "unavailable" ? "VOICE OFFLINE" : voiceState.status === "requesting_permission" ? "REQUESTING MIC" : voiceState.status === "listening" ? "LISTENING" : voiceState.status === "transcribing" ? "LOCAL TRANSCRIPTION" : voiceState.status === "transcript_ready" ? "TRANSCRIPT READY" : voiceState.status === "error" ? "VOICE ERROR" : "VOICE READY"}</span>{voiceState.status === "listening" && <button type="button" className="voice-cancel-button" onClick={() => {void cancelVoiceInput();}}>Cancel</button>}<button type="submit" className="primary-button">Create proposal <ArrowUpRight size={15}/></button></div></div>
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

        {active === "Create" && <section className="subpage"><div className="eyebrow">CREATION STUDIO</div><h1>Give your idea <em>a shape.</em></h1><p className="subheading">Caesar drafts the next step. Review the proposal before approving anything.</p><div className="studio-card"><label htmlFor="studio-prompt">WHAT SHOULD THE AUDIENCE UNDERSTAND?</label><textarea id="studio-prompt" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tell Caesar the story, audience, or question…" rows={4}/><div className="studio-footer"><span><LockKeyhole size={13}/> Synthetic demo only</span><button className="primary-button" onClick={()=>draftProposal()}>Draft proposal <Sparkles size={15}/></button></div></div>{proposal && <div className="proposal-card"><div className="proposal-title"><span className="status-pill">AWAITING YOUR APPROVAL</span><span className="demo-tag">SYNTHETIC DATA</span></div><label className="proposal-edit-label" htmlFor="proposal-title">PROPOSAL TITLE · EDITING INVALIDATES APPROVAL</label><input id="proposal-title" className="proposal-title-input" value={proposal.title} onChange={e=>{setProposal({...proposal,title:e.target.value});setApprovedProposalKey(null);}}/><p>{proposal.detail}</p><div className="proposal-preview"><BarChart3 size={18}/><div><strong>{proposal.chart}</strong><small>{proposal.reason}</small></div></div><div className="proposal-actions"><button className="secondary-button" onClick={()=>{setProposal(null);setApprovedProposalKey(null);setNotice("Proposal discarded.");}}>Discard</button><button className="primary-button" disabled={!canApproveProposal(proposal.title)} onClick={approveProposal}><Check size={15}/> Approve & preview</button></div></div>}</section>}

        {active === "Presentation" && <section className="subpage"><div className="eyebrow">PRESENTATION CANVAS</div><h1>Your story, <em>in focus.</em></h1><p className="subheading">Only approved proposals appear here. This prototype uses synthetic data, not company data.</p>{approved && proposal ? <div className="slide-preview"><div className="slide-top"><span>CAESAR / EXECUTIVE BRIEF</span><span>01 — 01</span></div><h2>{proposal.title}</h2><p className="slide-description">A clearer look at the trend behind the numbers.</p>{proposal.metricResult ? <div className="grounded-metric"><span>{proposal.metricResult.metric.replace(/_/g, " ") } · {proposal.metricResult.period}</span><strong>{formatDemoMetricValue(proposal.metricResult)}</strong><small>{proposal.metricResult.definition}</small></div> : <div className="slide-chart"><MiniChart/></div>}<div className="slide-bottom"><span>{proposal.metricResult ? `Source: ${proposal.metricResult.source} · ${proposal.metricResult.freshness}` : "Source: illustrative demo chart"}</span><span>{proposal.metricResult ? proposal.metricResult.warning : "Illustrative values · not for business decisions"}</span></div></div> : <div className="empty-state"><div className="empty-icon"><Presentation size={26}/></div><h2>No approved visuals yet</h2><p>Draft a proposal and approve it to see it on your presentation canvas.</p><button className="primary-button" onClick={()=>setActive("Create")}>Create a proposal <ArrowUpRight size={15}/></button></div>}</section>}

        {active === "Integrations" && <section className="subpage"><div className="eyebrow">CONNECTED WORKSPACE</div><h1>Your tools, <em>on your terms.</em></h1><p className="subheading">Power BI and Microsoft 365 remain UI-only concepts. The company API card can test the local synthetic endpoint; no company service or credentials are used.</p><div className="integration-banner"><ShieldCheck size={20}/><div><strong>Permission-first integrations</strong><p>Only the local synthetic API is callable in this prototype. It does not authenticate users or access company data.</p></div></div><div className="integration-grid">{[{name:"Power BI",desc:"Bring approved reports and semantic-model metrics into your story.",tag:"Analytics",icon:"P",color:"power"},{name:"Microsoft 365",desc:"Use approved files and presentation templates from your workspace.",tag:"Productivity",icon:"M",color:"office"},{name:"Company data API",desc:"Test the local synthetic metric contract and inspect returned provenance.",tag:"Synthetic API",icon:"D",color:"data"}].map(item=><article className="integration-card" key={item.name}><div className={`integration-logo ${item.color}`}>{item.icon}</div><span className="integration-tag">{item.tag}</span><h3>{item.name}</h3><p>{item.desc}</p>{item.name === "Company data API" && <div className="api-controls"><label>Metric<select value={selectedMetric} onChange={e=>{setSelectedMetric(e.target.value as DemoMetricName);setMetricResult(null);}}><option value="revenue">Revenue</option><option value="active_customers">Active customers</option><option value="conversion_rate">Conversion rate</option></select></label><label>Period<select value={selectedPeriod} onChange={e=>{setSelectedPeriod(e.target.value as DemoPeriod);setMetricResult(null);}}><option value="2026-Q1">2026 · Q1</option><option value="2026-Q2">2026 · Q2</option><option value="2026-Q3">2026 · Q3</option><option value="2026-Q4">2026 · Q4</option></select></label></div>}{item.name === "Company data API" && metricResult && <div className="api-result" role="status"><strong>{metricResult.metric.replace(/_/g, " ")} · {metricResult.period}</strong><p>{formatDemoMetricValue(metricResult)}</p><small>{metricResult.definition}</small><small>Source: {metricResult.source}</small><small>Freshness: {metricResult.freshness} · Synthetic only</small><small>{metricResult.warning}</small><button className="secondary-button use-metric-button" onClick={() => draftProposal(metricResult.metric.replace(/_/g, " ") + " briefing · " + metricResult.period, metricResult)}>Use in proposal <ArrowUpRight size={13}/></button></div>}<div className="integration-bottom"><span>{item.name === "Company data API" ? metricResult ? "Synthetic API reachable" : "Not tested" : installed.includes(item.name) ? "Demo enabled" : "Not connected"}</span><button disabled={item.name === "Company data API" && apiBusy} className={item.name === "Company data API" ? "primary-button" : installed.includes(item.name) ? "secondary-button" : "primary-button"} onClick={() => {if (item.name === "Company data API") { void testDemoApi(); return; } setInstalled(installed.includes(item.name)?installed.filter(x=>x!==item.name):[...installed,item.name]);setNotice(installed.includes(item.name)?item.name+" demo disabled.":item.name+" added to local demo list only. No connection was made.");}}>{item.name === "Company data API" ? apiBusy ? "Testing…" : metricResult ? "Test again" : "Test synthetic API" : installed.includes(item.name) ? "Disable demo" : "Try demo"} {item.name === "Company data API" ? <ArrowUpRight size={13}/> : installed.includes(item.name) ? <X size={13}/> : <Plus size={13}/>}</button></div></article>)}</div></section>}

        {active === "Templates" && <section className="subpage"><div className="eyebrow">START WITH A STRONG STORY</div><h1>Good structure. <em>Great clarity.</em></h1><p className="subheading">Original starter directions for the stories teams tell most often.</p><div className="template-grid">{[{name:"The executive brief",type:"DECISION-MAKING",desc:"One headline, three signals, one clear next step.",style:"template-dark"},{name:"The growth story",type:"PERFORMANCE",desc:"A grounded trend, its context, and the question it raises.",style:"template-green"},{name:"The project pulse",type:"TEAM UPDATE",desc:"Progress, risk, and decisions needed from stakeholders.",style:"template-paper"}].map((t,i)=><button className="template-card" key={t.name} onClick={()=>{setQuery(t.name);setProposal({title:t.name,detail:t.desc,chart:"Template preview · synthetic dataset",reason:"This is an original starter concept, not a connected data source."});setApprovedProposalKey(null);setActive("Create");}}><div className={`template-art ${t.style}`}><span className="art-kicker">CAESAR / {String(i+1).padStart(2,"0")}</span><div className="art-lines"><i/><i/><i/></div><MiniChart values={sales.slice(i, i+8)}/></div><span className="eyebrow">{t.type}</span><h3>{t.name}</h3><p>{t.desc}</p><span className="template-open">Use template <ArrowUpRight size={14}/></span></button>)}</div></section>}

        {active === "Tutorial" && <section className="subpage"><div className="eyebrow">THE 3-MINUTE TOUR</div><h1>Meet your new <em>copilot.</em></h1><p className="subheading">A short guided tour of the approval-first workflow.</p><div className="tutorial-layout"><div className="tutorial-steps">{["Start with a thought","Review the proposal","Approve the change","Connect with care"].map((s,i)=><button key={s} className={tutorialStep===i?"tutorial-step selected":"tutorial-step"} onClick={()=>setTutorialStep(i)}><span>{i+1}</span><div><strong>{s}</strong><small>{["Describe the story you need.","Check what Caesar plans to do.","You decide what reaches the canvas.","Review access before connecting data."][i]}</small></div>{tutorialStep===i&&<ChevronRight size={16}/>}</button>)}</div><div className="tutorial-detail"><div className="tutorial-illustration"><div className="tutorial-orb"><AudioLines size={32}/></div><span>STEP 0{tutorialStep+1} / 04</span></div><h2>{["Say what matters.","Nothing happens in the dark.","Your approval is the switch.","Your data deserves boundaries."][tutorialStep]}</h2><p>{["Start with plain language. Caesar can prepare a structured proposal from your request. Voice input requires an explicitly configured, checksum-verified local speech runtime. The browser prototype never falls back to cloud transcription.","Before anything changes, you'll see a summary of the intended action and which data it would use. Ambiguity means ask, not guess.","Approval applies to the exact proposal reviewed. If the content changes, the previous approval is no longer valid.","Integrations will show their publisher, requested permissions, data destination, and controls to test, disable, or revoke access."][tutorialStep]}</p><div className="tutorial-nav"><button className="secondary-button" disabled={tutorialStep===0} onClick={()=>setTutorialStep(Math.max(0,tutorialStep-1))}>Back</button><button className="primary-button" onClick={()=>tutorialStep===3?setActive("Overview"):setTutorialStep(tutorialStep+1)}>{tutorialStep===3?"Finish tour":"Next step"} <ChevronRight size={14}/></button></div></div></div></section>}
        {active === "Gallery" && <section className="subpage statue-gallery-page">
          <div className="eyebrow">THE ART OF FORM · MARBLE STUDIES</div>
          <h1>Figures of <em>antiquity.</em></h1>
          <p className="subheading">A collection of classical figures, shaped by gesture, proportion, light, and stone.</p>
          <div className="statue-gallery-heading">
            <div><span className="eyebrow">THE MARBLE CANON</span><h2>Studies in grace and permanence</h2></div>
            <span className="gallery-count">IX <span>FIGURES</span></span>
          </div>
          <div className="statue-gallery">
            {statueArtworks.map((statue, index) => <article className="statue-card" key={statue.image}>
              <button className="statue-artwork" onClick={() => setSelectedStatue(statue)} aria-label={`Inspect ${statue.name}`}>
                <img src={statue.image} alt={statue.alt} loading="lazy" />
                <span className="statue-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="statue-open"><span>View figure</span><ArrowUpRight size={16}/></span>
              </button>
              <div className="statue-caption"><span>{statue.epithet}</span><h3>{statue.name}</h3></div>
            </article>)}
          </div>
        </section>}

      </div>
      <footer className="statusbar"><span><span className="live-dot"/> {notice}</span><span><LockKeyhole size={12}/> Local demo · No company connection <span className="status-divider"/> <button onClick={()=>setShowHelp(true)}>About this prototype</button></span></footer>
    </main>
    {selectedStatue && <div className="modal-backdrop statue-modal-backdrop" onClick={() => setSelectedStatue(null)}>
      <section className="statue-modal" role="dialog" aria-modal="true" aria-labelledby="statue-modal-title" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setSelectedStatue(null)} aria-label="Close figure detail"><X size={18}/></button>
        <div className="statue-modal-image"><img src={selectedStatue.image} alt={selectedStatue.alt}/></div>
        <div className="statue-modal-copy">
          <div className="eyebrow">CAESAR · THE MARBLE CANON</div>
          <h2 id="statue-modal-title">{selectedStatue.name}</h2>
          <p>{selectedStatue.description}</p>
          <span>{selectedStatue.epithet}</span>
        </div>
      </section>
    </div>}
    {showHelp && <div className="modal-backdrop" onClick={()=>setShowHelp(false)}><section className="help-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowHelp(false)} aria-label="Close"><X size={18}/></button><div className="trust-mark"><ShieldCheck size={22}/></div><div className="eyebrow">PROTOTYPE NOTES</div><h2>Designed to earn trust.</h2><p>This is an interactive front-end prototype built around Caesar's proposed approval-first workflow. It uses synthetic values only.</p><ul><li><Check size={15}/> Navigation, starter prompts, and tutorial work locally.</li><li><Check size={15}/> Proposal review and approval are simulated in browser state.</li><li><X size={15}/> Microphone capture, speech recognition, real integrations, export, and backend authorization are not implemented.</li></ul><button className="primary-button" onClick={()=>setShowHelp(false)}>Got it <Check size={15}/></button></section></div>}
  </div>;
}
