import React, { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const KEYS = { users: 'pw_users', tx: 'pw_transactions', cats: 'pw_categories', budgets: 'pw_budgets', accounts: 'pw_accounts', recurring: 'pw_recurring', session: 'pw_session' }
const defaultCats = ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Education', 'Entertainment', 'Other']
const palette = ['#8b7cf6', '#39b7a4', '#f3a65a', '#ed7b91', '#5b9de8', '#b58ae8', '#d6bd59', '#7c91a5']
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback } }
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value))
const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0))
const today = () => new Date().toISOString().slice(0, 10)
const seed = () => {
  if (!read(KEYS.users, null)) write(KEYS.users, [{ id: 'admin-1', name: 'PocketWise Admin', email: 'admin@pocketwise.com', password: 'Admin@123', role: 'admin' }])
  if (!read(KEYS.cats, null)) write(KEYS.cats, defaultCats)
  if (!read(KEYS.tx, null)) write(KEYS.tx, [])
  if (!read(KEYS.budgets, null)) write(KEYS.budgets, [])
  if (!read(KEYS.accounts, null)) write(KEYS.accounts, ['Cash', 'Bank Account', 'Digital Wallet'])
  if (!read(KEYS.recurring, null)) write(KEYS.recurring, [])
}
const Icon = ({ children }) => <span className="icon" aria-hidden="true">{children}</span>

function App() {
  const [users, setUsers] = useState(() => read(KEYS.users, []))
  const [transactions, setTransactions] = useState(() => read(KEYS.tx, []))
  const [categories, setCategories] = useState(() => read(KEYS.cats, defaultCats))
  const [budgets, setBudgets] = useState(() => read(KEYS.budgets, []))
  const [accounts, setAccounts] = useState(() => read(KEYS.accounts, ['Cash', 'Bank Account', 'Digital Wallet']))
  const [recurring, setRecurring] = useState(() => read(KEYS.recurring, []))
  const [currentUser, setCurrentUser] = useState(() => read(KEYS.session, null))
  const [authMode, setAuthMode] = useState('login')
  const [page, setPage] = useState('overview')
  const [toast, setToast] = useState('')
  const [editing, setEditing] = useState(null)

  useEffect(() => { seed(); setUsers(read(KEYS.users, [])); setTransactions(read(KEYS.tx, [])); setCategories(read(KEYS.cats, defaultCats)); setBudgets(read(KEYS.budgets, [])); setAccounts(read(KEYS.accounts, ['Cash','Bank Account','Digital Wallet'])); setRecurring(read(KEYS.recurring, [])) }, [])
  useEffect(() => { write(KEYS.users, users) }, [users])
  useEffect(() => { write(KEYS.tx, transactions) }, [transactions])
  useEffect(() => { write(KEYS.cats, categories) }, [categories])
  useEffect(() => { write(KEYS.budgets, budgets) }, [budgets])
  useEffect(() => { write(KEYS.accounts, accounts) }, [accounts])
  useEffect(() => { write(KEYS.recurring, recurring) }, [recurring])
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t) } }, [toast])

  const isAdmin = currentUser?.role === 'admin'
  const myTx = useMemo(() => transactions.filter(t => t.userId === currentUser?.id), [transactions, currentUser])
  const income = myTx.filter(t => t.type === 'income').reduce((s,t) => s + Number(t.amount), 0)
  const expenses = myTx.filter(t => t.type === 'expense').reduce((s,t) => s + Number(t.amount), 0)
  const balance = income - expenses

  function login(email, password) {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
    if (!found) return setToast('Incorrect email or password.')
    setCurrentUser(found); write(KEYS.session, found); setPage('overview'); setToast(`Welcome back, ${found.name.split(' ')[0]}!`)
  }
  function signup(name, email, password) {
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) return setToast('An account with this email already exists.')
    const user = { id: crypto.randomUUID(), name, email, password, role: 'user' }
    setUsers(v => [...v, user]); setCurrentUser(user); write(KEYS.session, user); setPage('overview'); setToast('Account created successfully!')
  }
  function logout() { setCurrentUser(null); localStorage.removeItem(KEYS.session); setPage('overview'); setToast('You have logged out.') }
  function saveTransaction(data) {
    if (editing) { setTransactions(v => v.map(t => t.id === editing.id ? { ...t, ...data } : t)); setToast('Transaction updated.') }
    else { setTransactions(v => [{ ...data, id: crypto.randomUUID(), userId: currentUser.id, createdAt: new Date().toISOString() }, ...v]); setToast('Transaction added.') }
    setEditing(null)
  }
  function removeTransaction(id) { if (confirm('Delete this transaction?')) { setTransactions(v => v.filter(t => t.id !== id)); setToast('Transaction deleted.') } }

  if (!currentUser) return <Auth mode={authMode} setMode={setAuthMode} onLogin={login} onSignup={signup} />
  if (isAdmin) return <Admin users={users} transactions={transactions} onLogout={logout} onDeleteUser={id => { if (confirm('Delete this user and all their transactions?')) { setUsers(v => v.filter(u => u.id !== id)); setTransactions(v => v.filter(t => t.userId !== id)); setToast('User removed.') } }} onReset={() => { if(confirm('Reset all demo transactions, budgets and recurring items?')) { setTransactions([]); setBudgets([]); setRecurring([]); setToast('Demo data reset.') } }} toast={toast} />

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">p</span><span>PocketWise</span></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>
        {[['overview','▦','Overview'],['transactions','⇄','Transactions'],['budgets','◎','Budgets & Categories'],['accounts','▣','Accounts'],['recurring','↻','Recurring'],['analytics','▥','Reports & Analytics'],['profile','○','My Profile']].map(([id,ic,label]) => <button key={id} className={page===id?'nav-item active':'nav-item'} onClick={()=>setPage(id)}><span>{ic}</span>{label}</button>)}
      </nav>
      <div className="sidebar-bottom"><div className="avatar">{currentUser.name[0].toUpperCase()}</div><div className="user-mini"><b>{currentUser.name}</b><small>Personal account</small></div><button className="logout-icon" title="Log out" onClick={logout}>↗</button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div><div className="eyebrow">PERSONAL FINANCE</div><h1>{({overview:'Overview',transactions:'Transactions',budgets:'Budgets & Categories',accounts:'Accounts',recurring:'Recurring expenses',analytics:'Reports & Analytics',profile:'My Profile'})[page]}</h1></div><div className="topbar-right"><span className="date-chip">{new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</span><div className="avatar small">{currentUser.name[0].toUpperCase()}</div></div></header>
      {page==='overview' && <Overview user={currentUser} tx={myTx} income={income} expenses={expenses} balance={balance} setPage={setPage} onAdd={()=>{setEditing(null);setPage('transactions')}} />}
      {page==='transactions' && <Transactions tx={myTx} categories={categories} accounts={accounts} onSave={saveTransaction} onDelete={removeTransaction} editing={editing} setEditing={setEditing} />}
      {page==='budgets' && <Budgets categories={categories} setCategories={setCategories} budgets={budgets.filter(b=>b.userId===currentUser.id)} allBudgets={budgets} setBudgets={setBudgets} tx={myTx} user={currentUser} />}
      {page==='accounts' && <Accounts accounts={accounts} setAccounts={setAccounts} />}
      {page==='recurring' && <Recurring items={recurring.filter(r=>r.userId===currentUser.id)} all={recurring} setAll={setRecurring} user={currentUser} />}
      {page==='analytics' && <Analytics tx={myTx} />}
      {page==='profile' && <Profile user={currentUser} onSave={updated=>{setUsers(v=>v.map(u=>u.id===updated.id?updated:u));setCurrentUser(updated);write(KEYS.session,updated);setToast('Profile updated.')}} />}
      {toast && <div className="toast">{toast}</div>}
    </main>
  </div>
}

function Auth({ mode, setMode, onLogin, onSignup }) {
  const [name,setName]=useState(''), [email,setEmail]=useState(''), [password,setPassword]=useState('')
  const submit=e=>{e.preventDefault(); if(mode==='signup'){if(password.length<6)return alert('Password must contain at least 6 characters.');onSignup(name.trim(),email.trim(),password)}else onLogin(email.trim(),password)}
  return <div className="auth-page"><div className="auth-art"><div className="brand light"><span className="brand-mark">p</span><span>PocketWise</span></div><div className="art-copy"><span className="pill">PERSONAL EXPENSE TRACKER</span><h1>Track your<br/><em>money.</em></h1><p>Keep your income and expenses organised in one place.</p><div className="art-stats"><div><b>Record</b><small>Every transaction</small></div><div><b>Plan</b><small>Your budgets</small></div><div><b>Review</b><small>Your spending</small></div></div></div><div className="art-orb orb-one"></div><div className="art-orb orb-two"></div></div><div className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><div className="eyebrow">POCKETWISE</div><h2>{mode==='login'?'Welcome back':'Create your account'}</h2><p className="muted">{mode==='login'?'Sign in to continue.':'Create an account to manage your expenses.'}</p>{mode==='signup'&&<label>Full name<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label>}<label>Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" required minLength="6" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters"/></label><button className="btn primary full">{mode==='login'?'Log in':'Create account'} <span>→</span></button><p className="switch-auth">{mode==='login'?"Don't have an account?":"Already have an account?"} <button type="button" onClick={()=>setMode(mode==='login'?'signup':'login')}>{mode==='login'?'Sign up':'Log in'}</button></p></form></div></div>
}

function Overview({user,tx,income,expenses,balance,setPage,onAdd}) {
  const recent=tx.slice(0,5), month=new Date().toISOString().slice(0,7)
  const monthTx=tx.filter(t=>t.date?.startsWith(month))
  const monthSpend=monthTx.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount),0)
  return <div className="content"><div className="welcome-row"><div><h2>Hello, {user.name.split(' ')[0]} <span>✦</span></h2><p className="muted">Here’s your financial snapshot.</p></div><button className="btn primary" onClick={onAdd}>＋ Add transaction</button></div>
    <div className="stats-grid"><Stat label="Total balance" value={money(balance)} note="Income minus expenses" icon="◈" tone="purple"/><Stat label="Total income" value={money(income)} note="All recorded income" icon="↗" tone="green"/><Stat label="Total expenses" value={money(expenses)} note="All recorded spending" icon="↘" tone="orange"/><Stat label="This month" value={money(monthSpend)} note="Expenses this month" icon="◷" tone="blue"/></div>
    <div className="section-grid"><section className="panel"><div className="panel-head"><div><h3>Recent transactions</h3><p className="muted">Your latest money activity</p></div><button className="text-btn" onClick={()=>setPage('transactions')}>View all →</button></div>{recent.length?<TransactionList tx={recent}/>:<Empty title="No transactions yet" desc="Add your first expense or income to get started."/>}</section><section className="panel quick-panel"><div className="panel-head"><div><h3>Quick actions</h3><p className="muted">Keep your finances up to date</p></div></div><button className="quick-action" onClick={onAdd}><span className="quick-icon violet">＋</span><span><b>Add transaction</b><small>Record income or an expense</small></span><span className="arrow">→</span></button><button className="quick-action" onClick={()=>setPage('budgets')}><span className="quick-icon mint">◎</span><span><b>Set a budget</b><small>Plan your category spending</small></span><span className="arrow">→</span></button><button className="quick-action" onClick={()=>setPage('analytics')}><span className="quick-icon peach">▥</span><span><b>View insights</b><small>Understand your spending</small></span><span className="arrow">→</span></button></section></div>
  </div>
}
function Stat({label,value,note,icon,tone}) { return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}>{icon}</span></div><strong>{value}</strong><small>{note}</small></div> }
function Empty({title,desc}) { return <div className="empty"><div className="empty-icon">＋</div><b>{title}</b><p>{desc}</p></div> }
function TransactionList({tx, onEdit, onDelete}) { return <div className="tx-list">{tx.map(t=><div className="tx-row" key={t.id}><div className={`tx-symbol ${t.type}`}>{t.type==='income'?'↙':(t.category||'O').slice(0,1).toUpperCase()}</div><div className="tx-info"><b>{t.title}</b><small>{t.category} · {t.date}</small></div><strong className={t.type==='income'?'positive':'negative'}>{t.type==='income'?'+':'−'}{money(t.amount)}</strong>{onEdit&&<div className="row-actions"><button onClick={()=>onEdit(t)}>Edit</button><button onClick={()=>onDelete(t.id)}>Delete</button></div>}</div>)}</div> }

function Transactions({tx,categories,accounts,onSave,onDelete,editing,setEditing}) {
  const [show,setShow]=useState(false), [query,setQuery]=useState(''), [filter,setFilter]=useState('all')
  const [form,setForm]=useState({title:'',amount:'',type:'expense',category:categories[0]||'Other',date:today(),account:accounts[0]||'Cash',note:''})
  useEffect(()=>{if(editing){setForm({...editing});setShow(true)}},[editing])
  const filtered=tx.filter(t=>(filter==='all'||t.type===filter)&&`${t.title} ${t.category} ${t.note||''}`.toLowerCase().includes(query.toLowerCase()))
  const submit=e=>{e.preventDefault();onSave({...form,amount:Number(form.amount)});setForm({title:'',amount:'',type:'expense',category:categories[0]||'Other',date:today(),account:accounts[0]||'Cash',note:''});setShow(false)}
  const close=()=>{setShow(false);setEditing(null)}
  return <div className="content"><div className="toolbar"><div><h2>All transactions</h2><p className="muted">Add, edit and review your income and expenses.</p></div><button className="btn primary" onClick={()=>{setEditing(null);setShow(true)}}>＋ Add transaction</button></div>
    <div className="panel"><div className="filter-bar"><input className="search" placeholder="⌕  Search transactions..." value={query} onChange={e=>setQuery(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All types</option><option value="expense">Expenses</option><option value="income">Income</option></select></div>{filtered.length?<TransactionList tx={filtered} onEdit={t=>{setEditing(t);setForm({...t})}} onDelete={onDelete}/>:<Empty title="No matching transactions" desc="Try another search or add a new transaction."/>}</div>
    {show&&<div className="modal-backdrop"><form className="modal" onSubmit={submit}><div className="modal-head"><div><h3>{editing?'Edit transaction':'Add transaction'}</h3><p className="muted">Enter the details below.</p></div><button type="button" className="close" onClick={close}>×</button></div><div className="type-switch"><button type="button" className={form.type==='expense'?'selected expense-tab':''} onClick={()=>setForm({...form,type:'expense'})}>Expense</button><button type="button" className={form.type==='income'?'selected income-tab':''} onClick={()=>setForm({...form,type:'income'})}>Income</button></div><label>Description<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Grocery shopping"/></label><div className="form-two"><label>Amount (₹)<input type="number" min="1" step="0.01" required value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0.00"/></label><label>Date<input type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label></div><div className="form-two"><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Account<select value={form.account} onChange={e=>setForm({...form,account:e.target.value})}>{accounts.map(a=><option key={a}>{a}</option>)}</select></label></div><label>Note (optional)<input value={form.note||''} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Add a short note"/></label><div className="modal-actions"><button type="button" className="btn secondary" onClick={close}>Cancel</button><button className="btn primary">{editing?'Save changes':'Add transaction'}</button></div></form></div>}
  </div>
}

function Budgets({categories,setCategories,budgets,allBudgets,setBudgets,tx,user}) {
  const [cat,setCat]=useState(''),[budgetCat,setBudgetCat]=useState(categories[0]||''),[amount,setAmount]=useState('')
  const used=c=>tx.filter(t=>t.type==='expense'&&t.category===c).reduce((s,t)=>s+Number(t.amount),0)
  const addCategory=e=>{e.preventDefault();if(cat.trim()&&!categories.some(c=>c.toLowerCase()===cat.trim().toLowerCase())){setCategories(v=>[...v,cat.trim()]);setCat('')}}
  const addBudget=e=>{e.preventDefault();if(!amount||Number(amount)<=0)return;setBudgets(v=>[...v.filter(b=>!(b.userId===user.id&&b.category===budgetCat)),{id:crypto.randomUUID(),userId:user.id,category:budgetCat,amount:Number(amount)}]);setAmount('')}
  return <div className="content"><div className="toolbar"><div><h2>Budgets & categories</h2><p className="muted">Organise spending and set limits that work for you.</p></div></div><div className="section-grid"><section className="panel"><div className="panel-head"><div><h3>Category budgets</h3><p className="muted">Your spending against each planned limit</p></div></div>{budgets.length?budgets.map(b=>{const spent=used(b.category),pct=Math.min(100,spent/b.amount*100);return <div className="budget-item" key={b.id}><div className="budget-line"><b>{b.category}</b><span>{money(spent)} <small>of {money(b.amount)}</small></span></div><div className="progress"><span style={{width:`${pct}%`,background:pct>=100?'#e47777':'#8273e8'}}/></div><small className={pct>=100?'over-budget':'muted'}>{pct>=100?'Budget limit reached':`${Math.round(pct)}% used · ${money(b.amount-spent)} remaining`}</small></div>}):<Empty title="No budgets set" desc="Create a category budget to start tracking limits."/>}<form className="inline-form" onSubmit={addBudget}><select value={budgetCat} onChange={e=>setBudgetCat(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select><input type="number" min="1" placeholder="Budget amount ₹" value={amount} onChange={e=>setAmount(e.target.value)} required/><button className="btn primary">Set budget</button></form></section><section className="panel"><div className="panel-head"><div><h3>Your categories</h3><p className="muted">Use categories to group transactions</p></div></div><div className="category-cloud">{categories.map((c,i)=><span className="category-chip" key={c}><i style={{background:palette[i%palette.length]}}/>{c}</span>)}</div><form className="inline-form" onSubmit={addCategory}><input value={cat} onChange={e=>setCat(e.target.value)} placeholder="New category name" required/><button className="btn primary">＋ Add</button></form><p className="tiny-note">Default categories are ready to use. Add your own whenever you need.</p></section></div></div>
}

function Accounts({accounts,setAccounts}) {
  const [name,setName]=useState('')
  const add=e=>{e.preventDefault();if(name.trim()&&!accounts.includes(name.trim()))setAccounts(v=>[...v,name.trim()]);setName('')}
  return <div className="content"><div className="toolbar"><div><h2>My accounts</h2><p className="muted">Keep track of the places your money lives.</p></div></div><div className="account-grid">{accounts.map((a,i)=><div className="account-card" key={a}><div className="account-symbol">{['▣','▤','◈','▧'][i%4]}</div><span className="muted">ACCOUNT {String(i+1).padStart(2,'0')}</span><h3>{a}</h3><p className="muted">Transactions can be assigned to this account.</p>{i>2&&<button className="text-btn danger-text" onClick={()=>setAccounts(v=>v.filter(x=>x!==a))}>Remove account</button>}</div>)}</div><form className="panel add-account" onSubmit={add}><div><h3>Add an account</h3><p className="muted">Cash, savings, wallet or another account.</p></div><input value={name} onChange={e=>setName(e.target.value)} placeholder="Account name" required/><button className="btn primary">＋ Add account</button></form></div>
}

function Recurring({items,all,setAll,user}) {
  const [form,setForm]=useState({title:'',amount:'',category:'Bills',frequency:'Monthly',nextDate:today()})
  const add=e=>{e.preventDefault();setAll(v=>[{...form,id:crypto.randomUUID(),userId:user.id,amount:Number(form.amount)},...v]);setForm({title:'',amount:'',category:'Bills',frequency:'Monthly',nextDate:today()})}
  return <div className="content"><div className="toolbar"><div><h2>Recurring expenses</h2><p className="muted">Keep regular payments visible so nothing slips through.</p></div></div><div className="section-grid"><section className="panel"><div className="panel-head"><div><h3>Scheduled payments</h3><p className="muted">Your recurring expense list</p></div></div>{items.length?items.map(r=><div className="tx-row" key={r.id}><div className="tx-symbol expense">↻</div><div className="tx-info"><b>{r.title}</b><small>{r.category} · {r.frequency} · Next: {r.nextDate}</small></div><strong className="negative">{money(r.amount)}</strong><button className="icon-button" onClick={()=>setAll(v=>v.filter(x=>x.id!==r.id))}>×</button></div>):<Empty title="Nothing scheduled" desc="Add rent, subscriptions or regular bills."/>}</section><form className="panel recurring-form" onSubmit={add}><h3>Add recurring item</h3><label>Name<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Monthly rent"/></label><label>Amount (₹)<input type="number" min="1" required value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0.00"/></label><label>Frequency<select value={form.frequency} onChange={e=>setForm({...form,frequency:e.target.value})}><option>Weekly</option><option>Monthly</option><option>Yearly</option></select></label><label>Next payment date<input type="date" value={form.nextDate} onChange={e=>setForm({...form,nextDate:e.target.value})}/></label><button className="btn primary full">Save recurring item</button></form></div></div>
}

function Analytics({tx}) {
  const monthly=Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-5+i);const key=d.toISOString().slice(0,7);return {month:d.toLocaleDateString('en-IN',{month:'short'}),income:tx.filter(t=>t.type==='income'&&t.date?.startsWith(key)).reduce((s,t)=>s+Number(t.amount),0),expenses:tx.filter(t=>t.type==='expense'&&t.date?.startsWith(key)).reduce((s,t)=>s+Number(t.amount),0)}})
  const byCat=Object.entries(tx.filter(t=>t.type==='expense').reduce((o,t)=>({...o,[t.category]:(o[t.category]||0)+Number(t.amount)}),{})).map(([name,value])=>({name,value}))
  const total=byCat.reduce((s,x)=>s+x.value,0)
  return <div className="content"><div className="toolbar"><div><h2>Reports & analytics</h2><p className="muted">A simple view of where your money goes.</p></div></div><div className="section-grid analytics-grid"><section className="panel chart-panel"><div className="panel-head"><div><h3>Income vs expenses</h3><p className="muted">Last six months · ₹</p></div></div>{tx.length?<ResponsiveContainer width="100%" height={280}><BarChart data={monthly} barGap={8}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip formatter={v=>money(v)}/><Bar dataKey="income" fill="#48b89d" radius={[5,5,0,0]}/><Bar dataKey="expenses" fill="#8a7cf0" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer>:<Empty title="No data to chart" desc="Add transactions to see your monthly report."/>}<div className="legend"><span><i className="income-dot"/>Income</span><span><i className="expense-dot"/>Expenses</span></div></section><section className="panel chart-panel"><div className="panel-head"><div><h3>Spending by category</h3><p className="muted">All recorded expenses</p></div></div>{byCat.length?<><ResponsiveContainer width="100%" height={210}><PieChart><Pie data={byCat} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={3}>{byCat.map((e,i)=><Cell key={e.name} fill={palette[i%palette.length]}/>)}</Pie><Tooltip formatter={v=>money(v)}/></PieChart></ResponsiveContainer><div className="category-legend">{byCat.map((c,i)=><div key={c.name}><span><i style={{background:palette[i%palette.length]}}/>{c.name}</span><b>{total?Math.round(c.value/total*100):0}%</b></div>)}</div></>:<Empty title="No spending breakdown" desc="Add expenses to see category insights."/>}</section></div></div>
}

function Profile({user,onSave}) {
  const [name,setName]=useState(user.name),[email,setEmail]=useState(user.email)
  return <div className="content"><div className="panel profile-panel"><div className="profile-avatar">{user.name[0].toUpperCase()}</div><h2>Profile settings</h2><p className="muted">Update the basic details associated with your account.</p><form onSubmit={e=>{e.preventDefault();onSave({...user,name,email})}}><label>Full name<input required value={name} onChange={e=>setName(e.target.value)}/></label><label>Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Account type<input value="User" disabled/></label><button className="btn primary">Save profile</button></form></div></div>
}

function Admin({users,transactions,onLogout,onDeleteUser,onReset,toast}) {
  const regular=users.filter(u=>u.role!=='admin'), total=transactions.reduce((s,t)=>s+Number(t.amount),0), spent=transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount),0)
  return <div className="admin-shell"><header className="admin-top"><div className="brand"><span className="brand-mark">p</span><span>PocketWise</span><span className="admin-badge">ADMIN</span></div><button className="btn secondary" onClick={onLogout}>Log out ↗</button></header><main className="admin-content"><div className="admin-welcome"><div><div className="eyebrow">ADMINISTRATION</div><h1>Admin dashboard</h1><p className="muted">Manage registered users and monitor application activity.</p></div><button className="btn secondary" onClick={onReset}>↻ Reset demo data</button></div><div className="stats-grid"><Stat label="Registered users" value={regular.length} note="Active user accounts" icon="♙" tone="purple"/><Stat label="Transactions" value={transactions.length} note="All user records" icon="⇄" tone="green"/><Stat label="Total recorded" value={money(total)} note="Income + expenses" icon="◈" tone="blue"/><Stat label="Total expenses" value={money(spent)} note="Across all users" icon="↘" tone="orange"/></div><section className="panel admin-users"><div className="panel-head"><div><h3>User management</h3><p className="muted">Registered accounts and their activity</p></div></div>{regular.length?<div className="table-wrap"><table><thead><tr><th>USER</th><th>EMAIL</th><th>TRANSACTIONS</th><th>EXPENSES</th><th>ACTION</th></tr></thead><tbody>{regular.map(u=>{const mine=transactions.filter(t=>t.userId===u.id);const totalMine=mine.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount),0);return <tr key={u.id}><td><div className="table-user"><span className="avatar small">{u.name[0].toUpperCase()}</span><b>{u.name}</b></div></td><td>{u.email}</td><td>{mine.length}</td><td>{money(totalMine)}</td><td><button className="text-btn danger-text" onClick={()=>onDeleteUser(u.id)}>Remove</button></td></tr>})}</tbody></table></div>:<Empty title="No users registered" desc="New sign-ups will appear here."/>}</section><section className="panel admin-users"><div className="panel-head"><div><h3>Latest transactions</h3><p className="muted">Recent activity across all users</p></div></div>{transactions.length?<div className="tx-list">{transactions.slice(0,8).map(t=><div className="tx-row" key={t.id}><div className={`tx-symbol ${t.type}`}>{t.type==='income'?'↙':'↘'}</div><div className="tx-info"><b>{t.title}</b><small>{users.find(u=>u.id===t.userId)?.name||'Unknown user'} · {t.category} · {t.date}</small></div><strong className={t.type==='income'?'positive':'negative'}>{money(t.amount)}</strong></div>)}</div>:<Empty title="No transactions recorded" desc="User transactions will be listed here."/>}</section><p className="admin-foot">PocketWise · Admin module · Browser Local Storage demo</p></main>{toast&&<div className="toast">{toast}</div>}</div>
}

export default App
