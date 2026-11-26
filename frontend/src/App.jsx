import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";
const api = axios.create({ baseURL: API });
api.interceptors.request.use(config => {
  const token = localStorage.getItem("alumni_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("alumni_user")); } catch { return null; }
  });
  const [page, setPage] = useState("dashboard");
  const [message, setMessage] = useState("");

  function signOut() {
    localStorage.removeItem("alumni_token");
    localStorage.removeItem("alumni_user");
    setUser(null); setPage("dashboard"); setMessage("You have logged out.");
  }

  function onLogin(data) {
    localStorage.setItem("alumni_token", data.token);
    localStorage.setItem("alumni_user", JSON.stringify(data.user));
    setUser(data.user); setPage("dashboard"); setMessage(`Welcome, ${data.user.name}!`);
  }

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand" onClick={() => setPage("dashboard")} role="button" tabIndex="0">
        <span className="brand-icon">A</span><span>Alumni<span className="brand-light">Connect</span></span>
      </div>
      <nav>
        {user ? <>
          <button className={page === "dashboard" ? "nav-active" : ""} onClick={() => setPage("dashboard")}>Dashboard</button>
          <button className={page === "mentors" ? "nav-active" : ""} onClick={() => setPage("mentors")}>Find Mentors</button>
          <button className={page === "requests" ? "nav-active" : ""} onClick={() => setPage("requests")}>Mentorship</button>
          <button className={page === "jobs" ? "nav-active" : ""} onClick={() => setPage("jobs")}>Jobs</button>
          <span className="user-pill">{user.name} · {user.role}</span>
          <button className="outline-btn" onClick={signOut}>Log out</button>
        </> : <><button onClick={() => setPage("login")}>Log in</button><button className="primary-btn small" onClick={() => setPage("register")}>Join portal</button></>}
      </nav>
    </header>
    <main>
      {message && <div className="notice" onClick={() => setMessage("")}>{message} <span>×</span></div>}
      {!user && page !== "login" && page !== "register" && <Landing setPage={setPage} />}
      {!user && page === "login" && <AuthForm mode="login" onSuccess={onLogin} setPage={setPage} setMessage={setMessage} />}
      {!user && page === "register" && <AuthForm mode="register" onSuccess={onLogin} setPage={setPage} setMessage={setMessage} />}
      {user && page === "dashboard" && <Dashboard user={user} setPage={setPage} />}
      {user && page === "mentors" && <Mentors user={user} setMessage={setMessage} />}
      {user && page === "requests" && <Requests user={user} setMessage={setMessage} />}
      {user && page === "jobs" && <Jobs user={user} setMessage={setMessage} />}
    </main>
    <footer>AlumniConnect · Building careers through community <span>Full-stack MCA mini project</span></footer>
  </div>;
}

function Landing({ setPage }) {
  return <section className="hero">
    <div className="hero-copy">
      <div className="eyebrow"><span className="dot"></span> YOUR COLLEGE. YOUR COMMUNITY. YOUR FUTURE.</div>
      <h1>One connection can<br />change <em>your career.</em></h1>
      <p>Meet experienced alumni, find a mentor, discover opportunities, and take your next step with confidence.</p>
      <div className="hero-actions"><button className="primary-btn" onClick={() => setPage("register")}>Get started <span>→</span></button><button className="text-btn" onClick={() => setPage("login")}>I already have an account</button></div>
      <div className="trust-row"><div className="avatar-stack"><i>AK</i><i>SR</i><i>MP</i><i>+</i></div><span><strong>Stronger together</strong><br/>Students and alumni in one place</span></div>
    </div>
    <div className="hero-visual">
      <div className="visual-glow"></div>
      <div className="profile-card main-card">
        <div className="card-top"><span className="tiny-label">FEATURED MENTOR</span><span className="online"><b></b> Available</span></div>
        <div className="mentor-avatar">AK</div><h3>Arun Kumar</h3><p className="muted">Software Engineer · Tech Industry</p>
        <div className="tag-row"><span>Java</span><span>Cloud</span><span>Career growth</span></div>
        <div className="card-bottom"><span>Mentorship areas</span><strong>3 specialties</strong></div>
      </div>
      <div className="floating-note note-one"><span className="note-icon">✓</span><div><strong>Mentorship request</strong><small>Connection made easier</small></div></div>
      <div className="floating-note note-two"><span className="note-icon gold">↗</span><div><strong>New opportunities</strong><small>Find your next role</small></div></div>
      <div className="circle circle-one"></div><div className="circle circle-two"></div>
    </div>
    <div className="hero-bottom"><div><strong>01</strong><span>Connect with alumni</span></div><div><strong>02</strong><span>Learn from experience</span></div><div><strong>03</strong><span>Grow your future</span></div></div>
  </section>;
}

function AuthForm({ mode, onSuccess, setPage, setMessage }) {
  const isRegister = mode === "register";
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const { data } = await api.post(`/auth/${mode === "register" ? "register" : "login"}`, form);
      onSuccess(data);
    } catch (err) { setMessage(err.response?.data?.message || "Could not connect to the backend. Check that the server is running."); }
    finally { setBusy(false); }
  }
  return <section className="auth-wrap">
    <div className="auth-side"><div className="eyebrow">ALUMNICONNECT COMMUNITY</div><h2>Great careers<br/>start with <em>great people.</em></h2><p>Build meaningful connections with people who have been where you want to go.</p><div className="auth-quote">“Your network can become your strongest learning resource.”</div></div>
    <form className="auth-card" onSubmit={submit}>
      <span className="tiny-label">{isRegister ? "CREATE YOUR ACCOUNT" : "WELCOME BACK"}</span><h2>{isRegister ? "Join the community" : "Log in to your portal"}</h2><p className="muted">{isRegister ? "Choose your role to get started." : "Enter your details to continue."}</p>
      {isRegister && <label>Full name<input required value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Your full name" /></label>}
      <label>Email address<input type="email" required value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="you@example.com" /></label>
      <label>Password<input type="password" minLength="8" required value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder="At least 8 characters" /></label>
      {isRegister && <label>I am a<select value={form.role} onChange={e => setForm({...form, role:e.target.value})}><option value="student">Student</option><option value="alumni">Alumni</option></select></label>}
      <button className="primary-btn full" disabled={busy}>{busy ? "Please wait…" : isRegister ? "Create account →" : "Log in →"}</button>
      <p className="switch-auth">{isRegister ? "Already registered?" : "New to the portal?"} <button type="button" onClick={() => setPage(isRegister ? "login" : "register")}>{isRegister ? "Log in" : "Create account"}</button></p>
    </form>
  </section>;
}

function Dashboard({ user, setPage }) {
  const [stats, setStats] = useState({ alumni: 0, jobs: 0, requests: 0 });
  useEffect(() => {
    Promise.all([api.get("/alumni"), api.get("/jobs"), api.get("/mentorship/my-requests")])
      .then(([a,j,r]) => setStats({alumni:a.data.alumni.length, jobs:j.data.jobs.length, requests:r.data.requests.length}))
      .catch(() => {});
  }, []);
  return <section className="content-page">
    <div className="page-heading"><div><div className="eyebrow">YOUR COMMUNITY SPACE</div><h1>Hello, {user.name.split(" ")[0]} <span className="wave">✦</span></h1><p>Make a connection today. Your next opportunity could start here.</p></div><span className="role-badge">{user.role}</span></div>
    <div className="welcome-panel"><div><span className="tiny-label">ALUMNICONNECT</span><h2>Every connection is a new possibility.</h2><p>Explore experienced alumni, request guidance, and discover opportunities that help you move forward.</p><button className="light-btn" onClick={() => setPage("mentors")}>Explore mentors →</button></div><div className="welcome-mark">A<span>+</span></div></div>
    <div className="stat-grid"><Stat number={stats.alumni} label="Alumni to connect with" icon="◎"/><Stat number={stats.requests} label="Your mentorship requests" icon="↗"/><Stat number={stats.jobs} label="Opportunities listed" icon="▤"/></div>
    <div className="section-title"><div><h2>Explore the portal</h2><p>Choose where you want to go next.</p></div></div>
    <div className="feature-grid">
      <Feature icon="◎" title="Find a mentor" text="Connect with alumni who can share real-world guidance." onClick={() => setPage("mentors")} />
      <Feature icon="↗" title="Mentorship requests" text="Track requests and manage your mentoring connections." onClick={() => setPage("requests")} />
      <Feature icon="▤" title="Jobs & internships" text="Explore career opportunities shared by the community." onClick={() => setPage("jobs")} />
    </div>
    {user.role === "alumni" && <ProfileEditor />}
  </section>;
}
function Stat({number,label,icon}) { return <div className="stat-card"><span className="stat-icon">{icon}</span><strong>{number}</strong><span>{label}</span></div>; }
function Feature({icon,title,text,onClick}) { return <button className="feature-card" onClick={onClick}><span className="feature-icon">{icon}</span><h3>{title}</h3><p>{text}</p><span className="feature-arrow">Explore →</span></button>; }

function ProfileEditor() {
  const [form,setForm] = useState({graduationYear:"",company:"",jobTitle:"",skills:"",mentorshipAreas:"",bio:""});
  const [status,setStatus] = useState("");
  async function save(e) {
    e.preventDefault(); setStatus("");
    try {
      await api.put("/alumni/profile",{...form,graduationYear:form.graduationYear ? Number(form.graduationYear):undefined,skills:form.skills.split(",").map(s=>s.trim()).filter(Boolean),mentorshipAreas:form.mentorshipAreas.split(",").map(s=>s.trim()).filter(Boolean)});
      setStatus("Profile saved successfully.");
    } catch(err) { setStatus(err.response?.data?.message || "Could not save profile."); }
  }
  return <div className="panel form-panel"><div className="section-title"><div><h2>Complete your alumni profile</h2><p>Help students find you based on your experience.</p></div></div><form className="inline-form" onSubmit={save}>
    <label>Graduation year<input type="number" value={form.graduationYear} onChange={e=>setForm({...form,graduationYear:e.target.value})} placeholder="2022"/></label>
    <label>Company<input value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="Company name"/></label>
    <label>Job title<input value={form.jobTitle} onChange={e=>setForm({...form,jobTitle:e.target.value})} placeholder="Software Engineer"/></label>
    <label>Skills (comma-separated)<input value={form.skills} onChange={e=>setForm({...form,skills:e.target.value})} placeholder="Java, AWS, SQL"/></label>
    <label>Mentorship areas<input value={form.mentorshipAreas} onChange={e=>setForm({...form,mentorshipAreas:e.target.value})} placeholder="Interview prep, cloud"/></label>
    <label>Short bio<input value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} placeholder="A little about your journey"/></label>
    <button className="primary-btn">Save profile</button>{status && <span className="inline-status">{status}</span>}
  </form></div>;
}

function Mentors({ user, setMessage }) {
  const [search,setSearch] = useState(""); const [alumni,setAlumni] = useState([]); const [selected,setSelected] = useState(null); const [note,setNote] = useState("");
  async function load(term="") { try { const {data}=await api.get("/alumni",{params:{search:term}}); setAlumni(data.alumni); } catch(err){setMessage(err.response?.data?.message || "Could not load alumni.");} }
  useEffect(()=>{load("");},[]);
  async function requestMentor(e) {
    e.preventDefault();
    try { await api.post("/mentorship",{alumniId:selected._id || selected.id,message:note}); setMessage("Mentorship request sent."); setSelected(null); setNote(""); }
    catch(err){setMessage(err.response?.data?.message || "Could not send request.");}
  }
  return <section className="content-page"><div className="page-heading"><div><div className="eyebrow">MAKE YOUR NEXT CONNECTION</div><h1>Find your mentor</h1><p>Learn from alumni who have experience in the areas you care about.</p></div></div>
    <form className="search-bar" onSubmit={e=>{e.preventDefault();load(search);}}><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, company, role or skill…"/><button className="primary-btn">Search</button></form>
    {user.role !== "student" && <div className="info-strip">You can browse profiles here. Mentorship requests are available to student accounts.</div>}
    <div className="mentor-grid">{alumni.map(person=><article className="mentor-card" key={person.id || person._id}><div className="mentor-card-top"><div className="mentor-avatar small-avatar">{person.name?.split(" ").map(n=>n[0]).slice(0,2).join("")}</div><span className="verified">✓ Alumni</span></div><h3>{person.name}</h3><p className="muted">{person.jobTitle || "Professional"}{person.company ? ` · ${person.company}` : ""}</p><p className="mentor-bio">{person.bio || "Open to connecting with students and sharing professional experience."}</p><div className="tag-row">{(person.skills || []).slice(0,4).map(s=><span key={s}>{s}</span>)}</div><button className="outline-btn full" onClick={()=>user.role==="student" ? setSelected(person) : setMessage("Log in with a student account to request mentorship.")}>Request mentorship →</button></article>)}
    {!alumni.length && <div className="empty-state"><span>◎</span><h3>No alumni found yet</h3><p>Register a second account as an alumnus and add a profile to see it here.</p></div>}</div>
    {selected && <div className="modal-backdrop" onClick={()=>setSelected(null)}><form className="modal-card" onSubmit={requestMentor} onClick={e=>e.stopPropagation()}><button type="button" className="modal-close" onClick={()=>setSelected(null)}>×</button><span className="tiny-label">MENTORSHIP REQUEST</span><h2>Connect with {selected.name}</h2><p>Briefly explain what guidance you are looking for.</p><textarea required minLength="10" value={note} onChange={e=>setNote(e.target.value)} placeholder="I would like advice about…" rows="5"/><button className="primary-btn full">Send request →</button></form></div>}
  </section>;
}

function Requests({ user, setMessage }) {
  const [requests,setRequests] = useState([]);
  async function load(){try{const {data}=await api.get("/mentorship/my-requests");setRequests(data.requests);}catch(err){setMessage(err.response?.data?.message || "Could not load requests.");}}
  useEffect(()=>{load();},[]);
  async function update(id,status){try{await api.patch(`/mentorship/${id}/status`,{status});setMessage(`Request ${status.toLowerCase()}.`);load();}catch(err){setMessage(err.response?.data?.message || "Could not update request.");}}
  return <section className="content-page"><div className="page-heading"><div><div className="eyebrow">BUILD MEANINGFUL CONNECTIONS</div><h1>Mentorship requests</h1><p>{user.role==="student"?"Keep track of the guidance you have requested.":"Review requests from students and respond when you can."}</p></div></div>
    {!requests.length ? <div className="empty-state large-empty"><span>↗</span><h3>No requests yet</h3><p>{user.role==="student"?"Visit Find Mentors to send your first request.":"When a student requests your guidance, it will appear here."}</p></div> : <div className="request-list">{requests.map(r=><article className="request-card" key={r._id}><div className="request-avatar">{(user.role==="student"?r.alumni?.name:r.student?.name)?.split(" ").map(n=>n[0]).slice(0,2).join("") || "M"}</div><div className="request-main"><h3>{user.role==="student"?r.alumni?.name:r.student?.name}</h3><p className="muted">{user.role==="student"?"Alumni mentor":"Student mentee"} · {new Date(r.createdAt).toLocaleDateString()}</p><p>{r.message}</p></div><div className="request-actions"><span className={`status status-${r.status.toLowerCase()}`}>{r.status}</span>{user.role!=="student" && r.status==="Pending" && <><button className="primary-btn small" onClick={()=>update(r._id,"Accepted")}>Accept</button><button className="outline-btn small" onClick={()=>update(r._id,"Rejected")}>Reject</button></>}</div></article>)}</div>}
  </section>;
}

function Jobs({ user, setMessage }) {
  const [jobs,setJobs] = useState([]); const [showForm,setShowForm] = useState(false);
  const [form,setForm] = useState({title:"",company:"",description:"",applicationUrl:""});
  async function load(){try{const {data}=await api.get("/jobs");setJobs(data.jobs);}catch(err){setMessage(err.response?.data?.message || "Could not load jobs.");}}
  useEffect(()=>{load();},[]);
  async function submit(e){e.preventDefault();try{await api.post("/jobs",form);setForm({title:"",company:"",description:"",applicationUrl:""});setShowForm(false);setMessage("Opportunity posted.");load();}catch(err){setMessage(err.response?.data?.message || "Could not post opportunity.");}}
  return <section className="content-page"><div className="page-heading"><div><div className="eyebrow">YOUR NEXT OPPORTUNITY</div><h1>Jobs & internships</h1><p>Explore opportunities shared by members of the alumni community.</p></div>{["alumni","admin"].includes(user.role) && <button className="primary-btn" onClick={()=>setShowForm(!showForm)}>{showForm?"Cancel":"+ Post opportunity"}</button>}</div>
    {showForm && <form className="panel job-form" onSubmit={submit}><h2>Post a new opportunity</h2><div className="form-two"><label>Job title<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Junior Developer"/></label><label>Company<input required value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="Company name"/></label></div><label>Description<textarea required rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Responsibilities, skills and requirements"/></label><label>Application URL (optional)<input type="url" value={form.applicationUrl} onChange={e=>setForm({...form,applicationUrl:e.target.value})} placeholder="https://…"/></label><button className="primary-btn">Publish opportunity</button></form>}
    <div className="job-grid">{jobs.map(job=><article className="job-card" key={job._id}><div className="company-icon">{job.company?.slice(0,1).toUpperCase()}</div><span className="job-type">COMMUNITY POST</span><h3>{job.title}</h3><p className="muted">{job.company}</p><p>{job.description}</p><div className="job-bottom"><span>Shared by {job.postedBy?.name || "Alumni"}</span>{job.applicationUrl && <a href={job.applicationUrl} target="_blank" rel="noreferrer">Apply ↗</a>}</div></article>)}
    {!jobs.length && <div className="empty-state"><span>▤</span><h3>No opportunities posted yet</h3><p>Alumni can sign in and post the first opportunity.</p></div>}</div>
  </section>;
}

export default App;
