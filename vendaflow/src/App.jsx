import { useState, useEffect, useRef } from "react";

// ── AUTH USERS DB (simulado — substituir por Supabase em produção) ─────────
const USERS_DB_KEY = "vendaflow_users";
const SESSION_KEY  = "vendaflow_session";

const defaultUsers = [
  { id:1, nome:"Fernando", email:"fernando@vendaflow.com", senha:"admin123", perfil:"admin",    ativo:true,  avatar:"F", cor:"linear-gradient(135deg,#f59e0b,#ef4444)" },
  { id:2, nome:"Carlos",   email:"carlos@vendaflow.com",   senha:"carlos123", perfil:"vendedor", ativo:true,  avatar:"C", cor:"linear-gradient(135deg,#3b82f6,#8b5cf6)" },
  { id:3, nome:"Ana",      email:"ana@vendaflow.com",      senha:"ana123",    perfil:"vendedor", ativo:true,  avatar:"A", cor:"linear-gradient(135deg,#10b981,#06b6d4)" },
];

const getUsers  = () => { try { return JSON.parse(localStorage.getItem(USERS_DB_KEY)) || defaultUsers; } catch { return defaultUsers; } };
const saveUsers = (u) => localStorage.setItem(USERS_DB_KEY, JSON.stringify(u));
const getSession= () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } };
const saveSession=(u) => localStorage.setItem(SESSION_KEY, JSON.stringify(u));
const clearSession=()=> localStorage.removeItem(SESSION_KEY);

// Inicializa users no localStorage se não existir
if (!localStorage.getItem(USERS_DB_KEY)) saveUsers(defaultUsers);

// ── TELA DE LOGIN ──────────────────────────────────────────────────────────
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail]     = useState("");
  const [senha, setSenha]     = useState("");
  const [showSenha, setShow]  = useState(false);
  const [erro, setErro]       = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !senha) { setErro("Preencha e-mail e senha."); return; }
    setLoading(true); setErro("");
    setTimeout(() => {
      const users = getUsers();
      const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha);
      if (!user)        { setErro("E-mail ou senha incorretos."); setLoading(false); return; }
      if (!user.ativo)  { setErro("Usuário inativo. Contate o administrador."); setLoading(false); return; }
      saveSession(user);
      onLogin(user);
    }, 800);
  };

  const lFS = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    html,body,#root { height:100%; }
    body { font-family:'Outfit',sans-serif; background:#080c14; color:#e2e8f0; -webkit-font-smoothing:antialiased; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    .login-card { animation: fadeIn .5s ease forwards; }
    input { font-size:16px !important; }
    @media(min-width:768px){ input{font-size:14px !important;} }
  `;

  return (
    <>
      <style>{lFS}</style>
      {/* Background grid */}
      <div style={{ position:"fixed", inset:0, background:"#080c14", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(59,130,246,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.04) 1px,transparent 1px)", backgroundSize:"40px 40px" }} />
        <div style={{ position:"absolute", top:"20%", left:"50%", transform:"translateX(-50%)", width:500, height:500, background:"radial-gradient(circle, rgba(59,130,246,.08) 0%, transparent 70%)", pointerEvents:"none" }} />
      </div>

      <div style={{ position:"relative", minHeight:"100%", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
        <div className="login-card" style={{ width:"100%", maxWidth:420 }}>

          {/* Logo */}
          <div style={{ textAlign:"center", marginBottom:36 }}>
            <div style={{ width:56, height:56, borderRadius:16, background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:26, marginBottom:14, animation:"float 3s ease-in-out infinite", boxShadow:"0 0 40px rgba(59,130,246,.3)" }}>⚡</div>
            <div style={{ fontSize:28, fontWeight:800, color:"#fff", letterSpacing:"-0.03em" }}>VendaFlow</div>
            <div style={{ fontSize:13, color:"#475569", marginTop:4, fontWeight:500 }}>CRM Inteligente</div>
          </div>

          {/* Card */}
          <div style={{ background:"#0d1117", border:"1px solid #1e293b", borderRadius:20, padding:"32px 28px", boxShadow:"0 24px 60px rgba(0,0,0,.5)" }}>
            <h2 style={{ fontSize:20, fontWeight:700, color:"#f1f5f9", marginBottom:6 }}>Bem-vindo de volta 👋</h2>
            <p style={{ fontSize:13, color:"#475569", marginBottom:28 }}>Entre com suas credenciais para acessar</p>

            {/* E-mail */}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:"#64748b", fontWeight:600, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>E-mail</label>
              <input
                type="email" value={email} onChange={e=>{setEmail(e.target.value);setErro("");}}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                placeholder="seu@email.com"
                style={{ width:"100%", background:"#111827", border:`1px solid ${erro?"#ef4444":"#1e293b"}`, borderRadius:10, padding:"12px 14px", color:"#e2e8f0", fontFamily:"'Outfit',sans-serif", outline:"none" }}
              />
            </div>

            {/* Senha */}
            <div style={{ marginBottom:8 }}>
              <label style={{ fontSize:12, color:"#64748b", fontWeight:600, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Senha</label>
              <div style={{ position:"relative" }}>
                <input
                  type={showSenha?"text":"password"} value={senha} onChange={e=>{setSenha(e.target.value);setErro("");}}
                  onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                  placeholder="••••••••"
                  style={{ width:"100%", background:"#111827", border:`1px solid ${erro?"#ef4444":"#1e293b"}`, borderRadius:10, padding:"12px 44px 12px 14px", color:"#e2e8f0", fontFamily:"'Outfit',sans-serif", outline:"none" }}
                />
                <button onClick={()=>setShow(!showSenha)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#475569", cursor:"pointer", fontSize:16, padding:4 }}>
                  {showSenha ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:8, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:14 }}>⚠️</span>
                <span style={{ fontSize:13, color:"#fca5a5" }}>{erro}</span>
              </div>
            )}

            {/* Btn */}
            <button onClick={handleLogin} disabled={loading} style={{ width:"100%", padding:"13px", borderRadius:12, border:"none", background:loading?"#1e293b":"linear-gradient(135deg,#3b82f6,#2563eb)", color:"#fff", fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:15, cursor:loading?"not-allowed":"pointer", marginTop:erro?0:16, transition:"all .2s", boxShadow:loading?"none":"0 4px 20px rgba(59,130,246,.3)" }}>
              {loading ? "Entrando..." : "Entrar no sistema →"}
            </button>

            {/* Hint */}
            <div style={{ marginTop:24, padding:"14px", background:"#111827", borderRadius:10, border:"1px solid #1e293b" }}>
              <div style={{ fontSize:11, color:"#334155", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Contas de demonstração</div>
              {defaultUsers.map(u=>(
                <div key={u.id} onClick={()=>{setEmail(u.email);setSenha(u.senha);setErro("");}} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", cursor:"pointer", borderBottom:"1px solid rgba(30,41,59,.5)" }}>
                  <div style={{ width:26, height:26, borderRadius:"50%", background:u.cor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff", flexShrink:0 }}>{u.avatar}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#94a3b8" }}>{u.nome} <span style={{ color:"#334155" }}>·</span> <span style={{ color:u.perfil==="admin"?"#f59e0b":"#60a5fa", fontSize:11 }}>{u.perfil}</span></div>
                    <div style={{ fontSize:11, color:"#334155" }}>{u.email}</div>
                  </div>
                  <span style={{ fontSize:10, color:"#334155" }}>clique →</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ textAlign:"center", fontSize:12, color:"#1e293b", marginTop:20 }}>VendaFlow CRM © 2024</p>
        </div>
      </div>
    </>
  );
};

// ── GESTÃO DE USUÁRIOS (só Admin) ──────────────────────────────────────────
const GestaoUsuarios = ({ currentUser }) => {
  const [users, setUsers]   = useState(getUsers());
  const [modal, setModal]   = useState(false);
  const [editUser, setEdit] = useState(null);
  const EF = { nome:"", email:"", senha:"", perfil:"vendedor", ativo:true };
  const [form, setForm]     = useState(EF);
  const [erro, setErro]     = useState("");

  const cores = ["linear-gradient(135deg,#3b82f6,#8b5cf6)","linear-gradient(135deg,#10b981,#06b6d4)","linear-gradient(135deg,#f59e0b,#ef4444)","linear-gradient(135deg,#8b5cf6,#ec4899)"];

  const abrir = (u=null) => { setEdit(u); setForm(u?{...u}:EF); setErro(""); setModal(true); };

  const salvar = () => {
    if (!form.nome||!form.email||!form.senha) { setErro("Preencha todos os campos."); return; }
    const emailExiste = users.find(u=>u.email.toLowerCase()===form.email.toLowerCase()&&u.id!==editUser?.id);
    if (emailExiste) { setErro("E-mail já cadastrado."); return; }
    let updated;
    if (editUser) {
      updated = users.map(u=>u.id===editUser.id?{...u,...form}:u);
    } else {
      const novoUser = { id:Date.now(), ...form, avatar:form.nome[0].toUpperCase(), cor:cores[users.length%cores.length] };
      updated = [...users, novoUser];
    }
    saveUsers(updated); setUsers(updated); setModal(false);
  };

  const toggleAtivo = (id) => {
    if (id===currentUser.id) return; // não pode desativar a si mesmo
    const updated = users.map(u=>u.id===id?{...u,ativo:!u.ativo}:u);
    saveUsers(updated); setUsers(updated);
  };

  const excluir = (id) => {
    if (id===currentUser.id) return;
    if (!window.confirm("Excluir este usuário?")) return;
    const updated = users.filter(u=>u.id!==id);
    saveUsers(updated); setUsers(updated);
  };

  const cardS = { background:"#0d1117", border:"1px solid #1e293b", borderRadius:12 };
  const inpS  = { background:"#111827", border:"1px solid #1e293b", borderRadius:10, padding:"12px 14px", color:"#e2e8f0", fontFamily:"'Outfit',sans-serif", outline:"none", width:"100%", fontSize:"14px" };
  const btnS  = (v="primary") => ({ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, padding:"10px 16px", borderRadius:10, border:"none", cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:13, background:v==="primary"?"#3b82f6":v==="danger"?"#ef4444":v==="success"?"#10b981":"#1e293b", color:"#fff" });

  const PERFIL_LABELS = { admin:"Admin", vendedor:"Vendedor", financeiro:"Financeiro", gestor:"Gestor" };

  return (
    <div className="fade-in">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, color:"#f1f5f9" }}>Usuários</h2>
          <p style={{ fontSize:13, color:"#475569", marginTop:2 }}>{users.length} usuários cadastrados</p>
        </div>
        <button style={btnS()} onClick={()=>abrir()}>+ Novo Usuário</button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {users.map(u=>(
          <div key={u.id} style={{ ...cardS, padding:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:"50%", background:u.cor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, fontWeight:700, color:"#fff", flexShrink:0 }}>{u.avatar}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:15, fontWeight:700, color:"#f1f5f9" }}>{u.nome}</span>
                  <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20, background:u.perfil==="admin"?"rgba(245,158,11,.15)":"rgba(59,130,246,.15)", color:u.perfil==="admin"?"#f59e0b":"#60a5fa" }}>{PERFIL_LABELS[u.perfil]||u.perfil}</span>
                  {u.id===currentUser.id && <span style={{ fontSize:10, color:"#475569" }}>(você)</span>}
                </div>
                <div style={{ fontSize:12, color:"#475569", marginTop:3 }}>{u.email}</div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
                <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20, background:u.ativo?"rgba(16,185,129,.15)":"rgba(239,68,68,.15)", color:u.ativo?"#10b981":"#ef4444" }}>{u.ativo?"Ativo":"Inativo"}</span>
                <button style={btnS("secondary")} onClick={()=>abrir(u)}>✏️</button>
                {u.id!==currentUser.id && (
                  <>
                    <button style={{...btnS(u.ativo?"secondary":"success"),fontSize:12,padding:"8px 10px"}} onClick={()=>toggleAtivo(u.id)}>{u.ativo?"🚫":"✅"}</button>
                    <button style={{...btnS("danger"),fontSize:12,padding:"8px 10px"}} onClick={()=>excluir(u.id)}>🗑️</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.8)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:100 }} onClick={()=>setModal(false)}>
          <div style={{ background:"#0d1117", border:"1px solid #1e293b", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:500, padding:"24px 24px 40px", animation:"slideUp .25s ease" }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ fontSize:18, fontWeight:700, color:"#f1f5f9" }}>{editUser?"Editar Usuário":"Novo Usuário"}</h3>
              <button style={{ background:"#1e293b", border:"none", color:"#94a3b8", width:32, height:32, borderRadius:"50%", cursor:"pointer" }} onClick={()=>setModal(false)}>✕</button>
            </div>
            {[["nome","Nome completo","text"],["email","E-mail","email"],["senha","Senha","password"]].map(([f,label,type])=>(
              <div key={f} style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, color:"#475569", fontWeight:600, display:"block", marginBottom:6 }}>{label}</label>
                <input style={inpS} type={type} value={form[f]||""} onChange={e=>setForm({...form,[f]:e.target.value})} placeholder={f==="senha"&&editUser?"Deixe em branco para manter":""} />
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:"#475569", fontWeight:600, display:"block", marginBottom:6 }}>Perfil de acesso</label>
              <select style={inpS} value={form.perfil} onChange={e=>setForm({...form,perfil:e.target.value})}>
                <option value="vendedor">Vendedor</option>
                <option value="gestor">Gestor</option>
                <option value="financeiro">Financeiro</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, padding:"12px 14px", background:"#111827", borderRadius:10 }}>
              <input type="checkbox" checked={form.ativo} onChange={e=>setForm({...form,ativo:e.target.checked})} style={{ width:16, height:16, cursor:"pointer" }} id="ativo-check" />
              <label htmlFor="ativo-check" style={{ fontSize:13, color:"#94a3b8", cursor:"pointer" }}>Usuário ativo (pode fazer login)</label>
            </div>
            {erro && <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#fca5a5" }}>⚠️ {erro}</div>}
            <div style={{ display:"flex", gap:10 }}>
              <button style={{...btnS("secondary"),flex:1}} onClick={()=>setModal(false)}>Cancelar</button>
              <button style={{...btnS(),flex:1}} onClick={salvar}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── RESPONSIVE HOOK ────────────────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
};

// ── FONTS & GLOBAL CSS ─────────────────────────────────────────────────────
const fontStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { font-family: 'Outfit', sans-serif; background: #080c14; color: #e2e8f0; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
  .fade-in { animation: fadeIn .3s ease forwards; }
  button { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
  input, select, textarea { font-size: 16px !important; }
  @media (min-width: 768px) { input, select, textarea { font-size: 14px !important; } }
`;

// ── MOCK DATA ──────────────────────────────────────────────────────────────
const MOCK_CLIENTES = [
  { id:1, nome:"Restaurante Sabor & Arte", cnpj:"12.345.678/0001-90", telefone:"(11) 98765-4321", whatsapp:"11987654321", email:"contato@saborarte.com.br", origem:"Instagram", responsavel:"Fernando", status:"ativo", valor_total:12400, obs:"Cliente VIP, prefere contato pela manhã" },
  { id:2, nome:"Clínica Bem Viver", cnpj:"98.765.432/0001-11", telefone:"(21) 97654-3210", whatsapp:"21976543210", email:"admin@bemviver.com", origem:"Indicação", responsavel:"Fernando", status:"ativo", valor_total:8900, obs:"Interesse em plano anual" },
  { id:3, nome:"Auto Peças Turbo", cnpj:"45.678.901/0001-23", telefone:"(31) 96543-2109", whatsapp:"31965432109", email:"vendas@turbopecas.com", origem:"WhatsApp", responsavel:"Carlos", status:"ativo", valor_total:5600, obs:"" },
  { id:4, nome:"Studio Fit Academia", cnpj:"67.890.123/0001-45", telefone:"(41) 95432-1098", whatsapp:"41954321098", email:"studio@studiofit.com", origem:"Site", responsavel:"Ana", status:"inativo", valor_total:3200, obs:"Contrato pausado até março" },
  { id:5, nome:"Farmácia Saúde Total", cnpj:"23.456.789/0001-67", telefone:"(51) 94321-0987", whatsapp:"51943210987", email:"gerencia@saudetotal.com", origem:"Google", responsavel:"Fernando", status:"ativo", valor_total:19800, obs:"Maior cliente da carteira" },
];

const MOCK_LEADS = [
  { id:1, nome:"Pizzaria Bella Napoli", telefone:"(11) 91234-5678", email:"bella@napoli.com", origem:"Instagram", responsavel:"Fernando", status:"novo", valor:3500, previsao:"2024-02-15", obs:"Demonstração agendada" },
  { id:2, nome:"Oficina Mecânica Silva", telefone:"(21) 92345-6789", email:"silva@oficina.com", origem:"Indicação", responsavel:"Carlos", status:"contato", valor:1800, previsao:"2024-02-20", obs:"Ligou ontem, muito interessado" },
  { id:3, nome:"Salão Beleza Premium", telefone:"(31) 93456-7890", email:"premium@salao.com", origem:"WhatsApp", responsavel:"Ana", status:"proposta", valor:2400, previsao:"2024-02-10", obs:"Proposta enviada via email" },
  { id:4, nome:"Padaria Trigo Dourado", telefone:"(41) 94567-8901", email:"trigo@padaria.com", origem:"Google", responsavel:"Fernando", status:"negociacao", valor:4200, previsao:"2024-02-08", obs:"Negociando desconto no plano anual" },
  { id:5, nome:"Pet Shop Amigo Fiel", telefone:"(51) 95678-9012", email:"amigo@petshop.com", origem:"Site", responsavel:"Carlos", status:"fechado", valor:1600, previsao:"2024-01-30", obs:"Fechado! Contrato assinado" },
  { id:6, nome:"Distribuidora ABC", telefone:"(11) 96789-0123", email:"abc@dist.com", origem:"LinkedIn", responsavel:"Ana", status:"perdido", valor:8000, previsao:"2024-01-25", obs:"Escolheu concorrente" },
  { id:7, nome:"Consultório Dr. Matos", telefone:"(21) 97890-1234", email:"matos@clinica.com", origem:"Indicação", responsavel:"Fernando", status:"novo", valor:5500, previsao:"2024-02-25", obs:"Primeiro contato hoje" },
  { id:8, nome:"Loja Vip Style", telefone:"(31) 98901-2345", email:"vip@style.com", origem:"Instagram", responsavel:"Carlos", status:"contato", valor:2100, previsao:"2024-02-18", obs:"Aguardando retorno" },
];

const MOCK_ATIVIDADES = [
  { id:1, tipo:"visita", titulo:"Visita Restaurante Sabor & Arte", cliente:"Restaurante Sabor & Arte", data:"2024-02-05", hora:"10:00", status:"pendente", resultado:"" },
  { id:2, tipo:"reuniao", titulo:"Reunião Clínica Bem Viver", cliente:"Clínica Bem Viver", data:"2024-02-06", hora:"14:30", status:"pendente", resultado:"" },
  { id:3, tipo:"ligacao", titulo:"Follow-up Padaria Trigo Dourado", cliente:"Padaria Trigo Dourado", data:"2024-02-05", hora:"09:00", status:"concluida", resultado:"Cliente vai decidir amanhã" },
  { id:4, tipo:"visita", titulo:"Demo Auto Peças Turbo", cliente:"Auto Peças Turbo", data:"2024-02-07", hora:"11:00", status:"pendente", resultado:"" },
];

const MOCK_FINANCEIRO = [
  { id:1, cliente:"Farmácia Saúde Total", descricao:"Plano Business - Fevereiro", valor:397, vencimento:"2024-02-10", status:"pendente", vendedor:"Fernando" },
  { id:2, cliente:"Restaurante Sabor & Arte", descricao:"Plano Pro - Fevereiro", valor:197, vencimento:"2024-02-05", status:"pago", vendedor:"Fernando" },
  { id:3, cliente:"Clínica Bem Viver", descricao:"Plano Pro - Fevereiro", valor:197, vencimento:"2024-01-28", status:"atrasado", vendedor:"Carlos" },
  { id:4, cliente:"Auto Peças Turbo", descricao:"Plano Starter - Fevereiro", valor:97, vencimento:"2024-02-15", status:"pendente", vendedor:"Ana" },
  { id:5, cliente:"Farmácia Saúde Total", descricao:"Plano Business - Janeiro", valor:397, vencimento:"2024-01-10", status:"pago", vendedor:"Fernando" },
];

const MOCK_MSGS = [
  { id:1, de:"cliente", texto:"Olá! Vi o anúncio de vocês. Quero saber mais sobre os planos.", hora:"09:12" },
  { id:2, de:"ia", texto:"Olá! Que ótimo 😊 Me conta: quantos vendedores você tem na equipe?", hora:"09:12" },
  { id:3, de:"cliente", texto:"Temos 3 vendedores e uso planilha hoje. Tá uma bagunça!", hora:"09:14" },
  { id:4, de:"ia", texto:"Entendo! Para 3 vendedores, nosso Plano Pro (R$197/mês) seria ideal. Posso agendar uma demo de 20min?", hora:"09:14" },
  { id:5, de:"cliente", texto:"Sim! Pode ser amanhã às 10h?", hora:"09:16" },
  { id:6, de:"ia", texto:"✅ Agendei para amanhã às 10h! O Fernando vai conduzir. Alguma dúvida?", hora:"09:16" },
];

// ── CONSTANTS ──────────────────────────────────────────────────────────────
const LEAD_STATUS = {
  novo:       { label:"Novo",        color:"#3b82f6", bg:"rgba(59,130,246,.15)" },
  contato:    { label:"Em Contato",  color:"#a855f7", bg:"rgba(168,85,247,.15)" },
  proposta:   { label:"Proposta",    color:"#f59e0b", bg:"rgba(245,158,11,.15)" },
  negociacao: { label:"Negociação",  color:"#f97316", bg:"rgba(249,115,22,.15)" },
  fechado:    { label:"Fechado",     color:"#10b981", bg:"rgba(16,185,129,.15)" },
  perdido:    { label:"Perdido",     color:"#ef4444", bg:"rgba(239,68,68,.15)" },
};

const FIN_STATUS = {
  pago:     { label:"Pago",     color:"#10b981", bg:"rgba(16,185,129,.15)" },
  pendente: { label:"Pendente", color:"#f59e0b", bg:"rgba(245,158,11,.15)" },
  atrasado: { label:"Atrasado", color:"#ef4444", bg:"rgba(239,68,68,.15)" },
};

const TIPO_ICON = { visita:"🚗", reuniao:"📋", ligacao:"📞" };

const NAV = [
  { id:"dashboard",  icon:"⚡", label:"Início" },
  { id:"leads",      icon:"🎯", label:"Leads" },
  { id:"clientes",   icon:"👥", label:"Clientes" },
  { id:"pipeline",   icon:"📊", label:"Pipeline" },
  { id:"agenda",     icon:"📅", label:"Agenda" },
  { id:"financeiro", icon:"💰", label:"Financeiro" },
  { id:"ia",         icon:"🤖", label:"IA" },
];

// ── STYLE HELPERS ──────────────────────────────────────────────────────────
const card = { background:"#0d1117", border:"1px solid #1e293b", borderRadius:12 };
const inp = { background:"#111827", border:"1px solid #1e293b", borderRadius:10, padding:"12px 14px", color:"#e2e8f0", fontFamily:"'Outfit',sans-serif", outline:"none", width:"100%", transition:"border .15s" };
const btn = (v="primary") => ({
  display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6,
  padding:"11px 18px", borderRadius:10, border:"none", cursor:"pointer",
  fontFamily:"'Outfit',sans-serif", fontWeight:600, transition:"all .15s",
  background: v==="primary"?"#3b82f6": v==="danger"?"#ef4444": v==="success"?"#10b981":"#1e293b",
  color:"#fff", fontSize:14,
});
const bdg = (color,bg) => ({ display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:600, color, background:bg, whiteSpace:"nowrap" });

// ── SHARED COMPONENTS ──────────────────────────────────────────────────────
const Badge = ({ status, map }) => {
  const c = map[status] || { label:status, color:"#64748b", bg:"rgba(100,116,139,.15)" };
  return <span style={bdg(c.color,c.bg)}>{c.label}</span>;
};

const StatCard = ({ icon, label, value, delta, color="#3b82f6" }) => (
  <div style={{ ...card, padding:"14px", position:"relative", overflow:"hidden" }}>
    <div style={{ position:"absolute", top:10, right:10, fontSize:18, opacity:.4 }}>{icon}</div>
    <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.08em", color:"#475569", textTransform:"uppercase", marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.03em", color:"#f1f5f9" }}>{value}</div>
    {delta && <div style={{ fontSize:11, fontWeight:600, color:delta.startsWith("+")?"#10b981":"#ef4444", marginTop:3 }}>{delta}</div>}
    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3, background:color, opacity:.5 }} />
  </div>
);

// Modal — slides up from bottom (mobile-native feel)
const Modal = ({ onClose, children, title }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.8)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:100 }} onClick={onClose}>
    <div style={{ background:"#0d1117", border:"1px solid #1e293b", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:600, maxHeight:"93vh", overflowY:"auto", animation:"slideUp .25s ease" }} onClick={e=>e.stopPropagation()}>
      <div style={{ padding:"20px 20px 0", display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
        <h3 style={{ fontSize:18, fontWeight:700, color:"#f1f5f9" }}>{title}</h3>
        <button style={{ background:"#1e293b", border:"none", color:"#94a3b8", width:32, height:32, borderRadius:"50%", cursor:"pointer", fontSize:16 }} onClick={onClose}>✕</button>
      </div>
      <div style={{ padding:"0 20px 40px" }}>{children}</div>
    </div>
  </div>
);

const FF = ({ label, field, form, setForm, type="text", options=null }) => (
  <div style={{ marginBottom:14 }}>
    <label style={{ fontSize:12, color:"#475569", fontWeight:600, display:"block", marginBottom:6 }}>{label}</label>
    {options
      ? <select style={inp} value={form[field]||""} onChange={e=>setForm({...form,[field]:e.target.value})}>{options.map(o=><option key={o}>{o}</option>)}</select>
      : <input style={inp} type={type} value={form[field]||""} onChange={e=>setForm({...form,[field]:e.target.value})} />}
  </div>
);

// ── DASHBOARD ──────────────────────────────────────────────────────────────
const Dashboard = ({ clientes, leads, financeiro, atividades }) => {
  const pago = financeiro.filter(f=>f.status==="pago").reduce((a,b)=>a+b.valor,0);
  const pendente = financeiro.filter(f=>f.status==="pendente").reduce((a,b)=>a+b.valor,0);
  const atrasado = financeiro.filter(f=>f.status==="atrasado").reduce((a,b)=>a+b.valor,0);
  const conversao = Math.round(leads.filter(l=>l.status==="fechado").length/leads.length*100);
  const tarefasHoje = atividades.filter(a=>a.status==="pendente");
  const funnelData = Object.entries(LEAD_STATUS).map(([k,v])=>({ label:v.label, count:leads.filter(l=>l.status===k).length, color:v.color }));
  const rankVendedores = ["Fernando","Carlos","Ana"].map(v=>({ nome:v, fechados:leads.filter(l=>l.responsavel===v&&l.status==="fechado").length, receita:financeiro.filter(f=>f.vendedor===v&&f.status==="pago").reduce((a,b)=>a+b.valor,0) })).sort((a,b)=>b.receita-a.receita);

  return (
    <div className="fade-in">
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
        <StatCard icon="💰" label="Recebido" value={`R$${(pago/1000).toFixed(1)}k`} delta="+12%" color="#10b981" />
        <StatCard icon="⏳" label="A Receber" value={`R$${(pendente/1000).toFixed(1)}k`} delta="+5%" color="#f59e0b" />
        <StatCard icon="🚨" label="Atrasado" value={`R$${atrasado}`} color="#ef4444" />
        <StatCard icon="🎯" label="Conversão" value={`${conversao}%`} delta="+3%" color="#3b82f6" />
      </div>

      {tarefasHoje.length>0 && (
        <div style={{ ...card, marginBottom:14 }}>
          <div style={{ padding:"12px 14px", borderBottom:"1px solid #1e293b", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontWeight:700, fontSize:13, color:"#f1f5f9" }}>📅 Hoje</span>
            <span style={bdg("#f59e0b","rgba(245,158,11,.15)")}>{tarefasHoje.length} pendentes</span>
          </div>
          {tarefasHoje.map(a=>(
            <div key={a.id} style={{ padding:"11px 14px", borderBottom:"1px solid rgba(30,41,59,.5)", display:"flex", gap:10, alignItems:"center" }}>
              <span style={{ fontSize:18 }}>{TIPO_ICON[a.tipo]}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#e2e8f0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.titulo}</div>
                <div style={{ fontSize:11, color:"#475569" }}>{a.hora} · {a.cliente}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...card, marginBottom:14 }}>
        <div style={{ padding:"12px 14px", borderBottom:"1px solid #1e293b", fontWeight:700, fontSize:13, color:"#f1f5f9" }}>📊 Funil</div>
        <div style={{ padding:14 }}>
          {funnelData.map((item,i)=>(
            <div key={i} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:12, color:"#94a3b8" }}>{item.label}</span>
                <span style={{ fontSize:12, fontWeight:700, color:item.color }}>{item.count}</span>
              </div>
              <div style={{ height:5, background:"#1e293b", borderRadius:3 }}>
                <div style={{ height:"100%", width:`${Math.max(4,(item.count/leads.length)*100)}%`, background:item.color, borderRadius:3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={{ padding:"12px 14px", borderBottom:"1px solid #1e293b", fontWeight:700, fontSize:13, color:"#f1f5f9" }}>🏆 Ranking</div>
        <div style={{ padding:14 }}>
          {rankVendedores.map((v,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:i<2?12:0 }}>
              <div style={{ width:34, height:34, borderRadius:"50%", background:["linear-gradient(135deg,#f59e0b,#ef4444)","linear-gradient(135deg,#3b82f6,#8b5cf6)","linear-gradient(135deg,#10b981,#06b6d4)"][i], display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0 }}>{v.nome[0]}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:"#f1f5f9" }}>{v.nome}</div>
                <div style={{ fontSize:11, color:"#64748b" }}>{v.fechados} fechamentos · R${v.receita.toLocaleString()}</div>
              </div>
              <span style={{ fontSize:18 }}>{["🥇","🥈","🥉"][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── CLIENTES ───────────────────────────────────────────────────────────────
const Clientes = ({ clientes, setClientes }) => {
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const EF = { nome:"", cnpj:"", telefone:"", whatsapp:"", email:"", origem:"Instagram", responsavel:"Fernando", obs:"", status:"ativo" };
  const [form, setForm] = useState(EF);

  const filtrados = clientes.filter(c=>c.nome.toLowerCase().includes(busca.toLowerCase())||c.telefone.includes(busca));
  const abrir = (c=null) => { setSelected(c); setForm(c?{...c}:EF); setModal(true); };
  const salvar = () => { if(!form.nome) return; selected?setClientes(clientes.map(c=>c.id===selected.id?{...c,...form}:c)):setClientes([...clientes,{id:Date.now(),...form,valor_total:0}]); setModal(false); };

  return (
    <div className="fade-in">
      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        <input style={{...inp,flex:1}} placeholder="🔍 Buscar..." value={busca} onChange={e=>setBusca(e.target.value)} />
        <button style={{...btn(),padding:"11px 16px",flexShrink:0}} onClick={()=>abrir()}>+ Novo</button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {filtrados.map(c=>(
          <div key={c.id} style={{ ...card, padding:14 }} onClick={()=>abrir(c)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div style={{ flex:1, minWidth:0, marginRight:8 }}>
                <div style={{ fontSize:15, fontWeight:700, color:"#f1f5f9", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.nome}</div>
                <div style={{ fontSize:12, color:"#475569", marginTop:2 }}>{c.cnpj}</div>
              </div>
              <span style={bdg(c.status==="ativo"?"#10b981":"#ef4444",c.status==="ativo"?"rgba(16,185,129,.15)":"rgba(239,68,68,.15)")}>{c.status==="ativo"?"Ativo":"Inativo"}</span>
            </div>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
              <span style={{ fontSize:12, color:"#64748b" }}>📞 {c.telefone}</span>
              <span style={{ fontSize:12, color:"#64748b" }}>👤 {c.responsavel}</span>
              <span style={{ fontSize:12, fontWeight:700, color:"#10b981" }}>R${c.valor_total.toLocaleString()}</span>
            </div>
            {c.obs&&<div style={{ fontSize:12, color:"#475569", marginTop:8, padding:"8px", background:"#111827", borderRadius:6 }}>💬 {c.obs}</div>}
          </div>
        ))}
      </div>
      {modal&&(
        <Modal title={selected?"Editar Cliente":"Novo Cliente"} onClose={()=>setModal(false)}>
          <FF label="Nome / Razão Social" field="nome" form={form} setForm={setForm} />
          <FF label="CPF / CNPJ" field="cnpj" form={form} setForm={setForm} />
          <FF label="Telefone" field="telefone" form={form} setForm={setForm} />
          <FF label="WhatsApp" field="whatsapp" form={form} setForm={setForm} />
          <FF label="E-mail" field="email" form={form} setForm={setForm} type="email" />
          <FF label="Origem" field="origem" form={form} setForm={setForm} options={["Instagram","WhatsApp","Indicação","Site","Google","LinkedIn"]} />
          <FF label="Responsável" field="responsavel" form={form} setForm={setForm} options={["Fernando","Carlos","Ana"]} />
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:"#475569", fontWeight:600, display:"block", marginBottom:6 }}>Observações</label>
            <textarea style={{...inp,resize:"vertical",minHeight:70}} value={form.obs||""} onChange={e=>setForm({...form,obs:e.target.value})} />
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button style={{...btn("secondary"),flex:1}} onClick={()=>setModal(false)}>Cancelar</button>
            <button style={{...btn(),flex:1}} onClick={salvar}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── LEADS ──────────────────────────────────────────────────────────────────
const Leads = ({ leads, setLeads, setClientes }) => {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [modal, setModal] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const EF = { nome:"", telefone:"", email:"", origem:"Instagram", responsavel:"Fernando", status:"novo", valor:"", previsao:"", obs:"" };
  const [form, setForm] = useState(EF);

  const filtrados = leads.filter(l=>(filtroStatus==="todos"||l.status===filtroStatus)&&(l.nome.toLowerCase().includes(busca.toLowerCase())||l.telefone.includes(busca)));
  const salvar = () => { if(!form.nome) return; setLeads([...leads,{id:Date.now(),...form,valor:Number(form.valor)||0}]); setModal(false); setForm(EF); };
  const mudarStatus = (id,status) => setLeads(leads.map(l=>l.id===id?{...l,status}:l));
  const converter = (lead) => { setClientes(p=>[...p,{id:Date.now(),nome:lead.nome,cnpj:"",telefone:lead.telefone,whatsapp:"",email:lead.email,origem:lead.origem,responsavel:lead.responsavel,obs:lead.obs,status:"ativo",valor_total:lead.valor}]); mudarStatus(lead.id,"fechado"); };

  return (
    <div className="fade-in">
      <div style={{ display:"flex", gap:10, marginBottom:12 }}>
        <input style={{...inp,flex:1}} placeholder="🔍 Buscar..." value={busca} onChange={e=>setBusca(e.target.value)} />
        <button style={{...btn(),padding:"11px 16px",flexShrink:0}} onClick={()=>setModal(true)}>+ Novo</button>
      </div>
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:8, marginBottom:14, WebkitOverflowScrolling:"touch" }}>
        {[["todos","Todos",null],...Object.entries(LEAD_STATUS).map(([k,v])=>[k,v.label,v.color])].map(([k,label,color])=>(
          <button key={k} onClick={()=>setFiltroStatus(k)} style={{ padding:"7px 14px", borderRadius:20, border:`1px solid ${filtroStatus===k?(color||"#3b82f6"):"#1e293b"}`, background:filtroStatus===k?`rgba(59,130,246,.1)`:"transparent", color:filtroStatus===k?(color||"#60a5fa"):"#64748b", fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>{label}</button>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {filtrados.map(l=>(
          <div key={l.id} style={card}>
            <div style={{ padding:14 }} onClick={()=>setExpandido(expandido===l.id?null:l.id)}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                <div style={{ fontSize:15, fontWeight:700, color:"#f1f5f9", flex:1, marginRight:8, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.nome}</div>
                <Badge status={l.status} map={LEAD_STATUS} />
              </div>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <span style={{ fontSize:12, color:"#64748b" }}>👤 {l.responsavel}</span>
                <span style={{ fontSize:12, fontWeight:700, color:"#10b981" }}>R${l.valor.toLocaleString()}</span>
                <span style={{ fontSize:12, color:"#64748b" }}>📅 {l.previsao}</span>
              </div>
            </div>
            {expandido===l.id&&(
              <div style={{ padding:"0 14px 14px", borderTop:"1px solid #1e293b", paddingTop:12 }}>
                {l.obs&&<div style={{ fontSize:12, color:"#94a3b8", marginBottom:12 }}>💬 {l.obs}</div>}
                <div style={{ marginBottom:10 }}>
                  <select style={{...inp}} value={l.status} onChange={e=>mudarStatus(l.id,e.target.value)}>
                    {Object.entries(LEAD_STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                {l.status!=="fechado"&&<button style={{...btn("success"),width:"100%"}} onClick={()=>converter(l)}>✓ Converter para Cliente</button>}
              </div>
            )}
          </div>
        ))}
      </div>
      {modal&&(
        <Modal title="Novo Lead" onClose={()=>setModal(false)}>
          <FF label="Nome" field="nome" form={form} setForm={setForm} />
          <FF label="Telefone" field="telefone" form={form} setForm={setForm} />
          <FF label="E-mail" field="email" form={form} setForm={setForm} type="email" />
          <FF label="Origem" field="origem" form={form} setForm={setForm} options={["Instagram","WhatsApp","Indicação","Site","Google","LinkedIn"]} />
          <FF label="Responsável" field="responsavel" form={form} setForm={setForm} options={["Fernando","Carlos","Ana"]} />
          <FF label="Valor Potencial (R$)" field="valor" form={form} setForm={setForm} type="number" />
          <FF label="Previsão de Fechamento" field="previsao" form={form} setForm={setForm} type="date" />
          <div style={{ marginBottom:14 }}><label style={{ fontSize:12, color:"#475569", fontWeight:600, display:"block", marginBottom:6 }}>Observações</label><textarea style={{...inp,resize:"vertical",minHeight:60}} value={form.obs||""} onChange={e=>setForm({...form,obs:e.target.value})} /></div>
          <div style={{ display:"flex", gap:10 }}>
            <button style={{...btn("secondary"),flex:1}} onClick={()=>setModal(false)}>Cancelar</button>
            <button style={{...btn(),flex:1}} onClick={salvar}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── PIPELINE ───────────────────────────────────────────────────────────────
const Pipeline = ({ leads, setLeads }) => {
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);
  const totalPipeline = leads.filter(l=>l.status!=="perdido").reduce((a,b)=>a+b.valor,0);

  const onDrop = (status) => { if(dragging) setLeads(leads.map(l=>l.id===dragging?{...l,status}:l)); setDragging(null); setOver(null); };

  return (
    <div className="fade-in">
      <div style={{ ...card, padding:"11px 14px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:13, color:"#64748b" }}>Previsão total</span>
        <span style={{ fontSize:18, fontWeight:800, color:"#10b981" }}>R$ {totalPipeline.toLocaleString()}</span>
      </div>
      <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:16, WebkitOverflowScrolling:"touch" }}>
        {Object.entries(LEAD_STATUS).map(([status,cfg])=>{
          const colLeads = leads.filter(l=>l.status===status);
          return (
            <div key={status} style={{ background:"#0d1117", border:"1px solid #1e293b", borderTop:`3px solid ${cfg.color}`, borderRadius:12, padding:12, minWidth:190, flexShrink:0, minHeight:100, opacity:over===status?.85:1, transition:"opacity .15s" }}
              onDragOver={e=>{e.preventDefault();setOver(status);}} onDrop={()=>onDrop(status)} onDragLeave={()=>setOver(null)}>
              <div style={{ fontSize:11, fontWeight:700, color:cfg.color, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>{cfg.label}</div>
              <div style={{ fontSize:11, color:"#475569", marginBottom:10 }}>{colLeads.length} · R${colLeads.reduce((a,b)=>a+b.valor,0).toLocaleString()}</div>
              {colLeads.map(lead=>(
                <div key={lead.id} draggable onDragStart={()=>setDragging(lead.id)}
                  style={{ background:"#111827", border:"1px solid #1e293b", borderRadius:8, padding:10, marginBottom:8, cursor:"grab", userSelect:"none", touchAction:"none" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=cfg.color}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="#1e293b"}>
                  <div style={{ fontSize:12, fontWeight:600, color:"#f1f5f9", marginBottom:4 }}>{lead.nome}</div>
                  <div style={{ fontSize:11, color:"#475569" }}>👤 {lead.responsavel}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#10b981", marginTop:4 }}>R${lead.valor.toLocaleString()}</div>
                </div>
              ))}
              {colLeads.length===0&&<div style={{ textAlign:"center", padding:"16px 0", color:"#334155", fontSize:12 }}>Arraste aqui</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── AGENDA ─────────────────────────────────────────────────────────────────
const Agenda = ({ atividades, setAtividades }) => {
  const [modal, setModal] = useState(false);
  const EF = { tipo:"reuniao", titulo:"", cliente:"", data:"", hora:"" };
  const [form, setForm] = useState(EF);

  const salvar = () => { if(!form.titulo) return; setAtividades([...atividades,{id:Date.now(),...form,status:"pendente",resultado:""}]); setModal(false); setForm(EF); };
  const concluir = (id) => setAtividades(atividades.map(a=>a.id===id?{...a,status:"concluida",resultado:"Concluído"}:a));

  const pendentes = atividades.filter(a=>a.status==="pendente");
  const concluidas = atividades.filter(a=>a.status==="concluida");

  return (
    <div className="fade-in">
      <button style={{...btn(),width:"100%",marginBottom:16}} onClick={()=>setModal(true)}>+ Nova Atividade</button>
      <div style={{ fontSize:11, fontWeight:700, color:"#f59e0b", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>⏳ Pendentes ({pendentes.length})</div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:18 }}>
        {pendentes.map(a=>(
          <div key={a.id} style={{ ...card, padding:14 }}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:12 }}>
              <span style={{ fontSize:22, flexShrink:0 }}>{TIPO_ICON[a.tipo]}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:"#f1f5f9" }}>{a.titulo}</div>
                <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>📅 {a.data} às {a.hora}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>🏢 {a.cliente}</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              {a.tipo==="visita"&&<button style={{...btn("success"),flex:1,fontSize:13}} onClick={()=>concluir(a.id)}>✅ Check-in</button>}
              <button style={{...btn("secondary"),flex:1,fontSize:13}} onClick={()=>concluir(a.id)}>✓ Concluir</button>
            </div>
          </div>
        ))}
        {pendentes.length===0&&<div style={{ ...card, padding:24, textAlign:"center", color:"#475569" }}>✅ Nenhuma tarefa pendente!</div>}
      </div>
      <div style={{ fontSize:11, fontWeight:700, color:"#10b981", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>✅ Concluídas ({concluidas.length})</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {concluidas.map(a=>(
          <div key={a.id} style={{ ...card, padding:14, opacity:.65 }}>
            <div style={{ display:"flex", gap:10 }}>
              <span style={{ fontSize:20 }}>{TIPO_ICON[a.tipo]}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"#94a3b8" }}>{a.titulo}</div>
                <div style={{ fontSize:11, color:"#475569" }}>{a.data} · {a.cliente}</div>
                {a.resultado&&<div style={{ fontSize:11, color:"#10b981", marginTop:4 }}>💬 {a.resultado}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {modal&&(
        <Modal title="Nova Atividade" onClose={()=>setModal(false)}>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {["reuniao","ligacao","visita"].map(t=>(
              <button key={t} onClick={()=>setForm({...form,tipo:t})} style={{ flex:1, padding:"10px 6px", borderRadius:10, border:`1px solid ${form.tipo===t?"#3b82f6":"#1e293b"}`, background:form.tipo===t?"rgba(59,130,246,.15)":"transparent", color:form.tipo===t?"#60a5fa":"#64748b", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                {TIPO_ICON[t]} {t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
          <FF label="Título" field="titulo" form={form} setForm={setForm} />
          <FF label="Cliente" field="cliente" form={form} setForm={setForm} />
          <FF label="Data" field="data" form={form} setForm={setForm} type="date" />
          <FF label="Hora" field="hora" form={form} setForm={setForm} type="time" />
          <div style={{ display:"flex", gap:10 }}>
            <button style={{...btn("secondary"),flex:1}} onClick={()=>setModal(false)}>Cancelar</button>
            <button style={{...btn(),flex:1}} onClick={salvar}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── FINANCEIRO ─────────────────────────────────────────────────────────────
const Financeiro = ({ financeiro, setFinanceiro }) => {
  const [modal, setModal] = useState(false);
  const EF = { cliente:"", descricao:"", valor:"", vencimento:"", status:"pendente", vendedor:"Fernando" };
  const [form, setForm] = useState(EF);

  const pago = financeiro.filter(f=>f.status==="pago").reduce((a,b)=>a+b.valor,0);
  const pendente = financeiro.filter(f=>f.status==="pendente").reduce((a,b)=>a+b.valor,0);
  const atrasado = financeiro.filter(f=>f.status==="atrasado").reduce((a,b)=>a+b.valor,0);
  const salvar = () => { if(!form.cliente||!form.valor) return; setFinanceiro([...financeiro,{id:Date.now(),...form,valor:Number(form.valor)}]); setModal(false); setForm(EF); };
  const marcarPago = (id) => setFinanceiro(financeiro.map(f=>f.id===id?{...f,status:"pago"}:f));

  return (
    <div className="fade-in">
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
        {[["Recebido",`R$${pago}`,"#10b981"],["Pendente",`R$${pendente}`,"#f59e0b"],["Atrasado",`R$${atrasado}`,"#ef4444"]].map(([l,v,c])=>(
          <div key={l} style={{ ...card, padding:12, textAlign:"center" }}>
            <div style={{ fontSize:9, color:"#475569", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:15, fontWeight:800, color:c }}>{v}</div>
          </div>
        ))}
      </div>
      <button style={{...btn(),width:"100%",marginBottom:14}} onClick={()=>setModal(true)}>+ Nova Cobrança</button>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {financeiro.map(f=>(
          <div key={f.id} style={{ ...card, padding:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div style={{ flex:1, minWidth:0, marginRight:10 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.cliente}</div>
                <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{f.descricao}</div>
              </div>
              <Badge status={f.status} map={FIN_STATUS} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <span style={{ fontSize:18, fontWeight:800, color:"#10b981" }}>R${f.valor}</span>
                <span style={{ fontSize:11, color:"#475569", marginLeft:8 }}>vence {f.vencimento}</span>
              </div>
              {f.status!=="pago"&&<button style={{...btn("success"),fontSize:12,padding:"7px 14px"}} onClick={()=>marcarPago(f.id)}>✓ Pago</button>}
            </div>
          </div>
        ))}
      </div>
      {modal&&(
        <Modal title="Nova Cobrança" onClose={()=>setModal(false)}>
          <FF label="Cliente" field="cliente" form={form} setForm={setForm} />
          <FF label="Descrição" field="descricao" form={form} setForm={setForm} />
          <FF label="Valor (R$)" field="valor" form={form} setForm={setForm} type="number" />
          <FF label="Vencimento" field="vencimento" form={form} setForm={setForm} type="date" />
          <FF label="Vendedor" field="vendedor" form={form} setForm={setForm} options={["Fernando","Carlos","Ana"]} />
          <div style={{ display:"flex", gap:10 }}>
            <button style={{...btn("secondary"),flex:1}} onClick={()=>setModal(false)}>Cancelar</button>
            <button style={{...btn(),flex:1}} onClick={salvar}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── AGENTE IA ──────────────────────────────────────────────────────────────
const AgenteIA = () => {
  const [msgs, setMsgs] = useState(MOCK_MSGS);
  const [input, setInput] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [tom, setTom] = useState("amigável");
  const bottomRef = useRef();

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  const enviar = () => {
    if(!input.trim()) return;
    setMsgs(p=>[...p,{id:Date.now(),de:"cliente",texto:input,hora:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}]);
    setInput("");
    setTimeout(()=>setMsgs(p=>[...p,{id:Date.now()+1,de:"ia",texto:"🤖 Entendi! Vou verificar as melhores opções. Posso te ligar amanhã às 9h?",hora:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}]),1200);
  };

  return (
    <div className="fade-in">
      <div style={{ ...card, padding:"12px 14px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:ativo?"#10b981":"#ef4444", animation:ativo?"pulse 2s infinite":"none" }} />
          <span style={{ fontSize:13, fontWeight:600, color:ativo?"#10b981":"#ef4444" }}>{ativo?"Agente Ativo":"Pausado"}</span>
        </div>
        <button style={{...btn(ativo?"secondary":"primary"),fontSize:12,padding:"7px 14px"}} onClick={()=>setAtivo(!ativo)}>{ativo?"Pausar":"Ativar"}</button>
      </div>
      <div style={{ ...card, padding:12, marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>Tom</div>
        <div style={{ display:"flex", gap:8 }}>
          {["formal","amigável","direto"].map(t=>(
            <button key={t} onClick={()=>setTom(t)} style={{ flex:1, padding:"8px 6px", borderRadius:8, border:`1px solid ${tom===t?"#3b82f6":"#1e293b"}`, background:tom===t?"rgba(59,130,246,.15)":"transparent", color:tom===t?"#60a5fa":"#64748b", fontSize:12, fontWeight:600, cursor:"pointer" }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
        {[["Mensagens","6","💬"],["Leads qualif.","2","🎯"],["Demos","1","📅"],["Resposta","94%","⚡"]].map(([l,v,ic])=>(
          <div key={l} style={{ ...card, padding:10, textAlign:"center" }}>
            <div style={{ fontSize:16, marginBottom:3 }}>{ic}</div>
            <div style={{ fontSize:18, fontWeight:800, color:"#f1f5f9" }}>{v}</div>
            <div style={{ fontSize:9, color:"#475569", marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={card}>
        <div style={{ padding:"11px 14px", borderBottom:"1px solid #1e293b", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#10b981,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>🤖</div>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:"#f1f5f9" }}>VendaFlow IA</div>
            <div style={{ fontSize:11, color:"#10b981" }}>● Online</div>
          </div>
        </div>
        <div style={{ padding:12, display:"flex", flexDirection:"column", gap:10, maxHeight:280, overflowY:"auto" }}>
          {msgs.map(m=>(
            <div key={m.id} style={{ display:"flex", justifyContent:m.de==="ia"?"flex-start":"flex-end" }}>
              {m.de==="ia"&&<div style={{ width:24, height:24, borderRadius:"50%", background:"linear-gradient(135deg,#10b981,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, marginRight:6, flexShrink:0, marginTop:2 }}>🤖</div>}
              <div style={{ maxWidth:"80%", background:m.de==="ia"?"#111827":"#1e40af", borderRadius:m.de==="ia"?"4px 12px 12px 12px":"12px 4px 12px 12px", padding:"9px 12px" }}>
                <div style={{ fontSize:13, color:"#e2e8f0", lineHeight:1.5 }}>{m.texto}</div>
                <div style={{ fontSize:10, color:"#475569", marginTop:3 }}>{m.hora}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div style={{ padding:"10px 12px", borderTop:"1px solid #1e293b", display:"flex", gap:8 }}>
          <input style={{...inp,flex:1,padding:"10px 12px"}} placeholder="Simular mensagem..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&enviar()} />
          <button style={{...btn(),padding:"10px 14px",flexShrink:0}} onClick={enviar}>↗</button>
        </div>
      </div>
    </div>
  );
};

// ── APP SHELL ──────────────────────────────────────────────────────────────
const PAGE_TITLES = { dashboard:"Início", clientes:"Clientes", leads:"Leads", pipeline:"Pipeline", agenda:"Agenda", financeiro:"Financeiro", ia:"Agente IA", usuarios:"Usuários" };

export default function App() {
  const [page, setPage]             = useState("dashboard");
  const isMobile                    = useIsMobile();
  const [clientes, setClientes]     = useState(MOCK_CLIENTES);
  const [leads, setLeads]           = useState(MOCK_LEADS);
  const [atividades, setAtividades] = useState(MOCK_ATIVIDADES);
  const [financeiro, setFinanceiro] = useState(MOCK_FINANCEIRO);
  const [moreOpen, setMoreOpen]     = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // ── AUTH ──
  const [currentUser, setCurrentUser] = useState(() => getSession());
  const handleLogin  = (user) => { setCurrentUser(user); setPage("dashboard"); };
  const handleLogout = () => { clearSession(); setCurrentUser(null); setPage("dashboard"); setUserMenuOpen(false); };

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  const novosLeads = leads.filter(l=>l.status==="novo").length;
  const isAdmin    = currentUser.perfil === "admin";

  const NAV_ITEMS = [...NAV, ...(isAdmin ? [{ id:"usuarios", icon:"🔐", label:"Usuários" }] : [])];

  const navigate = (id) => { setPage(id); setMoreOpen(false); setUserMenuOpen(false); };

  const renderPage = () => {
    switch(page) {
      case "dashboard":  return <Dashboard clientes={clientes} leads={leads} financeiro={financeiro} atividades={atividades} />;
      case "clientes":   return <Clientes clientes={clientes} setClientes={setClientes} />;
      case "leads":      return <Leads leads={leads} setLeads={setLeads} setClientes={setClientes} />;
      case "pipeline":   return <Pipeline leads={leads} setLeads={setLeads} />;
      case "agenda":     return <Agenda atividades={atividades} setAtividades={setAtividades} />;
      case "financeiro": return <Financeiro financeiro={financeiro} setFinanceiro={setFinanceiro} />;
      case "ia":         return <AgenteIA />;
      case "usuarios":   return isAdmin ? <GestaoUsuarios currentUser={currentUser} /> : null;
      default: return null;
    }
  };

  // User menu dropdown (desktop)
  const UserMenu = () => (
    <div style={{ position:"relative" }}>
      <div onClick={()=>setUserMenuOpen(!userMenuOpen)} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"6px 10px", borderRadius:10, background:userMenuOpen?"rgba(30,41,59,.8)":"transparent", transition:"background .15s" }}>
        <div style={{ width:32, height:32, borderRadius:"50%", background:currentUser.cor||"linear-gradient(135deg,#f59e0b,#ef4444)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff" }}>{currentUser.avatar}</div>
        <div style={{ display:"none" }} className="desktop-only">
          <div style={{ fontSize:13, fontWeight:600, color:"#f1f5f9", lineHeight:1.2 }}>{currentUser.nome}</div>
          <div style={{ fontSize:11, color:"#475569" }}>{currentUser.perfil}</div>
        </div>
        <span style={{ fontSize:10, color:"#475569" }}>▼</span>
      </div>
      {userMenuOpen && (
        <>
          <div style={{ position:"fixed", inset:0, zIndex:39 }} onClick={()=>setUserMenuOpen(false)} />
          <div style={{ position:"absolute", right:0, top:"calc(100% + 8px)", background:"#0d1117", border:"1px solid #1e293b", borderRadius:12, padding:8, minWidth:200, zIndex:40, boxShadow:"0 16px 40px rgba(0,0,0,.5)" }}>
            <div style={{ padding:"10px 12px", borderBottom:"1px solid #1e293b", marginBottom:6 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>{currentUser.nome}</div>
              <div style={{ fontSize:12, color:"#475569" }}>{currentUser.email}</div>
              <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:20, background:isAdmin?"rgba(245,158,11,.15)":"rgba(59,130,246,.15)", color:isAdmin?"#f59e0b":"#60a5fa", marginTop:6, display:"inline-block" }}>{currentUser.perfil}</span>
            </div>
            {isAdmin && (
              <button onClick={()=>navigate("usuarios")} style={{ width:"100%", padding:"10px 12px", background:"transparent", border:"none", color:"#94a3b8", cursor:"pointer", display:"flex", alignItems:"center", gap:10, borderRadius:8, fontSize:13, fontFamily:"'Outfit',sans-serif", marginBottom:2 }}
                onMouseEnter={e=>e.currentTarget.style.background="#111827"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                🔐 Gerenciar Usuários
              </button>
            )}
            <button onClick={handleLogout} style={{ width:"100%", padding:"10px 12px", background:"transparent", border:"none", color:"#ef4444", cursor:"pointer", display:"flex", alignItems:"center", gap:10, borderRadius:8, fontSize:13, fontFamily:"'Outfit',sans-serif" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,.08)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              🚪 Sair do sistema
            </button>
          </div>
        </>
      )}
    </div>
  );

  // ── MOBILE ──
  if(isMobile) return (
    <>
      <style>{fontStyle}</style>
      <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"#080c14", overflow:"hidden" }}>
        {/* Topbar */}
        <div style={{ background:"#0d1117", borderBottom:"1px solid #1e293b", padding:"0 16px", height:52, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>⚡</div>
            <span style={{ fontWeight:800, fontSize:17, color:"#fff", letterSpacing:"-0.02em" }}>VendaFlow</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {novosLeads>0&&<span style={{ background:"#ef4444", color:"#fff", fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:10 }}>{novosLeads}</span>}
            {/* Avatar abre menu mobile */}
            <div onClick={()=>setUserMenuOpen(!userMenuOpen)} style={{ width:32, height:32, borderRadius:"50%", background:currentUser.cor||"linear-gradient(135deg,#f59e0b,#ef4444)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", cursor:"pointer" }}>{currentUser.avatar}</div>
          </div>
        </div>

        {/* User menu mobile */}
        {userMenuOpen && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:50 }} onClick={()=>setUserMenuOpen(false)}>
            <div style={{ position:"absolute", top:52, right:0, background:"#0d1117", border:"1px solid #1e293b", borderRadius:"0 0 0 16px", padding:16, minWidth:220 }} onClick={e=>e.stopPropagation()}>
              <div style={{ marginBottom:14, paddingBottom:14, borderBottom:"1px solid #1e293b" }}>
                <div style={{ fontSize:15, fontWeight:700, color:"#f1f5f9" }}>{currentUser.nome}</div>
                <div style={{ fontSize:12, color:"#475569" }}>{currentUser.email}</div>
                <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:20, background:isAdmin?"rgba(245,158,11,.15)":"rgba(59,130,246,.15)", color:isAdmin?"#f59e0b":"#60a5fa", marginTop:6, display:"inline-block" }}>{currentUser.perfil}</span>
              </div>
              {isAdmin && <button onClick={()=>navigate("usuarios")} style={{ width:"100%", padding:"12px", background:"#111827", border:"1px solid #1e293b", borderRadius:10, color:"#94a3b8", cursor:"pointer", display:"flex", alignItems:"center", gap:10, fontSize:14, fontFamily:"'Outfit',sans-serif", marginBottom:8 }}>🔐 Gerenciar Usuários</button>}
              <button onClick={handleLogout} style={{ width:"100%", padding:"12px", background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:10, color:"#ef4444", cursor:"pointer", display:"flex", alignItems:"center", gap:10, fontSize:14, fontFamily:"'Outfit',sans-serif", fontWeight:600 }}>🚪 Sair do sistema</button>
            </div>
          </div>
        )}

        {/* Page title */}
        <div style={{ padding:"14px 16px 4px", flexShrink:0 }}>
          <h1 style={{ fontSize:21, fontWeight:800, color:"#f1f5f9", letterSpacing:"-0.02em" }}>{PAGE_TITLES[page]}</h1>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding:"10px 16px", paddingBottom:76, WebkitOverflowScrolling:"touch" }}>
          {renderPage()}
        </div>

        {/* Bottom nav — 5 itens principais */}
        <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#0d1117", borderTop:"1px solid #1e293b", display:"grid", gridTemplateColumns:"repeat(6,1fr)", zIndex:20, paddingBottom:"env(safe-area-inset-bottom,0px)" }}>
          {NAV_ITEMS.slice(0,5).map(item=>(
            <button key={item.id} onClick={()=>navigate(item.id)} style={{ padding:"10px 4px 8px", background:"transparent", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, position:"relative" }}>
              {page===item.id&&<div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:28, height:2, background:"#3b82f6", borderRadius:"0 0 3px 3px" }} />}
              <span style={{ fontSize:20 }}>{item.icon}</span>
              <span style={{ fontSize:9, fontWeight:600, color:page===item.id?"#3b82f6":"#475569" }}>{item.label}</span>
              {item.id==="leads"&&novosLeads>0&&<div style={{ position:"absolute", top:5, right:8, width:14, height:14, background:"#ef4444", borderRadius:"50%", fontSize:8, fontWeight:700, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>{novosLeads}</div>}
            </button>
          ))}
          <button onClick={()=>setMoreOpen(true)} style={{ padding:"10px 4px 8px", background:"transparent", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
            <span style={{ fontSize:20 }}>☰</span>
            <span style={{ fontSize:9, fontWeight:600, color:"#475569" }}>Mais</span>
          </button>
        </div>

        {/* More menu */}
        {moreOpen&&(
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:30 }} onClick={()=>setMoreOpen(false)}>
            <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"#0d1117", borderRadius:"20px 20px 0 0", padding:"20px 20px 48px", animation:"slideUp .25s ease" }} onClick={e=>e.stopPropagation()}>
              <div style={{ width:36, height:4, background:"#334155", borderRadius:2, margin:"0 auto 18px" }} />
              {NAV_ITEMS.slice(5).map(item=>(
                <button key={item.id} onClick={()=>navigate(item.id)} style={{ width:"100%", padding:"14px 16px", background:page===item.id?"rgba(59,130,246,.1)":"transparent", border:`1px solid ${page===item.id?"rgba(59,130,246,.3)":"transparent"}`, borderRadius:12, cursor:"pointer", display:"flex", alignItems:"center", gap:14, marginBottom:8 }}>
                  <span style={{ fontSize:24 }}>{item.icon}</span>
                  <span style={{ fontSize:15, fontWeight:600, color:page===item.id?"#60a5fa":"#e2e8f0" }}>{item.label}</span>
                  {item.id==="ia"&&<span style={bdg("#10b981","rgba(16,185,129,.15)")}>IA</span>}
                  {item.id==="usuarios"&&<span style={bdg("#f59e0b","rgba(245,158,11,.15)")}>Admin</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );

  // ── DESKTOP ──
  return (
    <>
      <style>{fontStyle}</style>
      <div style={{ display:"flex", height:"100%", overflow:"hidden", background:"#080c14" }}>
        {/* Sidebar */}
        <div style={{ width:220, background:"#0d1117", borderRight:"1px solid #1e293b", display:"flex", flexDirection:"column", flexShrink:0 }}>
          <div style={{ padding:"20px 16px 16px", borderBottom:"1px solid #1e293b" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>⚡</div>
              <div>
                <div style={{ fontWeight:800, fontSize:17, color:"#fff", letterSpacing:"-0.02em" }}>VendaFlow</div>
                <div style={{ fontSize:10, color:"#475569", fontWeight:500, letterSpacing:"0.07em", textTransform:"uppercase" }}>CRM Inteligente</div>
              </div>
            </div>
          </div>
          <nav style={{ flex:1, padding:"10px 8px", overflowY:"auto" }}>
            {NAV_ITEMS.map(item=>(
              <div key={item.id} onClick={()=>setPage(item.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, cursor:"pointer", marginBottom:2, background:page===item.id?"rgba(59,130,246,.15)":"transparent", color:page===item.id?"#60a5fa":"#64748b", fontWeight:page===item.id?600:400, fontSize:14, transition:"all .15s" }}>
                <span style={{ fontSize:16, width:20, textAlign:"center" }}>{item.icon}</span>
                {item.label}
                {item.id==="leads"&&novosLeads>0&&<span style={{ marginLeft:"auto", fontSize:10, background:"#ef4444", color:"#fff", borderRadius:10, padding:"1px 7px", fontWeight:700 }}>{novosLeads}</span>}
                {item.id==="ia"&&<span style={{ marginLeft:"auto", fontSize:9, background:"#10b981", color:"#fff", borderRadius:10, padding:"1px 7px", fontWeight:700 }}>IA</span>}
                {item.id==="usuarios"&&<span style={{ marginLeft:"auto", fontSize:9, background:"#f59e0b", color:"#000", borderRadius:10, padding:"1px 7px", fontWeight:700 }}>ADM</span>}
              </div>
            ))}
          </nav>
          {/* User info + logout */}
          <div style={{ padding:"12px 14px", borderTop:"1px solid #1e293b" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:currentUser.cor||"linear-gradient(135deg,#f59e0b,#ef4444)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0 }}>{currentUser.avatar}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#f1f5f9", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{currentUser.nome}</div>
                <div style={{ fontSize:11, color:"#475569" }}>{currentUser.perfil}</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{ width:"100%", padding:"8px 12px", background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.2)", borderRadius:8, color:"#ef4444", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'Outfit',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              🚪 Sair
            </button>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"0 24px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #1e293b", background:"#0d1117", flexShrink:0 }}>
            <h1 style={{ fontSize:17, fontWeight:700, color:"#f1f5f9" }}>{PAGE_TITLES[page]}</h1>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:12, color:"#475569" }}><span style={{ color:"#10b981" }}>●</span> {new Date().toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"})}</span>
              <UserMenu />
            </div>
          </div>
          <div style={{ flex:1, overflow:"auto", padding:"24px" }}>{renderPage()}</div>
        </div>
      </div>
    </>
  );
}
