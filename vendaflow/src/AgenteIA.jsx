import { useState, useEffect, useRef, useCallback } from "react";

// Hook mobile — mesma lógica do App.jsx
const useIsMobile = () => {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return m;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const CONFIG_KEY    = "vendaflow_ia_config";
const CONV_KEY      = "vendaflow_ia_convs";
const LEADS_IA_KEY  = "vendaflow_ia_leads";

const defaultConfig = {
  // IA — modelo escolhido pelo admin, sem padrão forçado
  modelo:       "",           // admin escolhe no painel (claude | gpt | gemini)
  apiKey:       "",
  tom:          "amigável",
  nomeAgente:   "VendaFlow IA",
  nomeEmpresa:  "VendaFlow",
  baseConhecimento: "Somos o VendaFlow CRM, sistema para gestão de vendas e clientes.\nPlanos: Starter R$97 (2 usuários), Pro R$197 (5 usuários), Business R$397 (ilimitado).\nBenefícios: funil visual, agenda inteligente, agente IA e integração WhatsApp.",
  // Automações — todas ativas por padrão
  autoQualificar:      true,   // faz perguntas de qualificação (equipe, dificuldade, urgência)
  autoCriarLead:       true,   // cria lead no CRM automaticamente
  autoAgendar:         true,   // propõe agendamento de demo
  autoEnviarProposta:  true,   // apresenta plano adequado
  autoTransferir:      true,   // transfere para vendedor humano após qualificação completa
  qualificarAntesTransferir: true, // OBRIGATÓRIO: só transfere depois de qualificar (nome, equipe, dificuldade, urgência)
  limiteMsg:           8,      // máximo de msgs antes de transferir mesmo sem qualificação completa
  vendedorTransferencia: "Fernando", // vendedor que recebe o lead transferido
  // WhatsApp — Evolution API como padrão
  waProvider:       "evolution",
  waApiUrl:         "",
  waApiKey:         "",
  waInstanceId:     "",
  waNumero:         "",
  // Status
  ativo:            true,
};

const getConfig  = () => { try { return { ...defaultConfig, ...JSON.parse(localStorage.getItem(CONFIG_KEY)||"{}") }; } catch { return defaultConfig; } };
const saveConfig = (c) => localStorage.setItem(CONFIG_KEY, JSON.stringify(c));
const getConvs   = () => { try { return JSON.parse(localStorage.getItem(CONV_KEY)||"[]"); } catch { return []; } };
const saveConvs  = (c) => localStorage.setItem(CONV_KEY, JSON.stringify(c));
const getIALeads = () => { try { return JSON.parse(localStorage.getItem(LEADS_IA_KEY)||"[]"); } catch { return []; } };
const saveIALeads= (l) => localStorage.setItem(LEADS_IA_KEY, JSON.stringify(l));

const hora = () => new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
const ts   = () => new Date().toLocaleString("pt-BR");

const SCORE_LABELS = { alto:{ label:"Alta", color:"#10b981", bg:"rgba(16,185,129,.15)" }, medio:{ label:"Média", color:"#f59e0b", bg:"rgba(245,158,11,.15)" }, baixo:{ label:"Baixa", color:"#ef4444", bg:"rgba(239,68,68,.15)" } };
const CONV_STATUS  = { ativo:"Ativo", aguardando:"Aguardando", qualificado:"Qualificado", transferido:"Transferido", convertido:"Convertido", encerrado:"Encerrado" };
const CONV_COLORS  = { ativo:"#3b82f6", aguardando:"#f59e0b", qualificado:"#10b981", transferido:"#8b5cf6", convertido:"#06b6d4", encerrado:"#475569" };

// ─────────────────────────────────────────────────────────────────────────────
// IA ENGINE — chama Claude / GPT-4o / Gemini ou simula em modo demo
// ─────────────────────────────────────────────────────────────────────────────
async function chamarIA(config, historico, mensagemUsuario) {
  const { modelo, apiKey, tom, nomeAgente, nomeEmpresa, baseConhecimento, autoQualificar, autoAgendar, autoEnviarProposta, autoTransferir, limiteMsg } = config;

  const { qualificarAntesTransferir, vendedorTransferencia } = config;

  // Calcula o nível de qualificação da conversa atual
  const msgCount = historico.length;
  const jaQualificado = historico.some(m => m.analise?.tamanhoEquipe) &&
                        historico.some(m => m.analise?.dificuldade) &&
                        historico.some(m => m.analise?.nomeContato);

  const systemPrompt = `Você é ${nomeAgente}, assistente comercial da empresa ${nomeEmpresa}.

BASE DE CONHECIMENTO:
${baseConhecimento}

TOM DE COMUNICAÇÃO: ${tom}

═══════════════════════════════════════════
FLUXO DE ATENDIMENTO OBRIGATÓRIO
═══════════════════════════════════════════

FASE 1 — QUALIFICAÇÃO (execute SEMPRE antes de qualquer outra coisa):
${autoQualificar ? `Colete OBRIGATORIAMENTE estas 4 informações (uma pergunta por vez, não sobrecarregue):
  a) Nome do contato
  b) Tamanho da equipe de vendas (quantas pessoas)
  c) Maior dificuldade atual do time comercial
  d) Urgência (precisa resolver em quanto tempo?)
  → Só avance para a Fase 2 após coletar pelo menos nome + equipe + dificuldade.` : "Responda dúvidas gerais sem qualificação obrigatória."}

FASE 2 — PROPOSTA (após qualificar):
${autoEnviarProposta ? `Com base no tamanho da equipe, indique o plano mais adequado:
  • 1-2 pessoas → Starter (R$97/mês)
  • 3-5 pessoas → Pro (R$197/mês) ← geralmente o ideal
  • 6+ pessoas  → Business (R$397/mês)
  Apresente 2-3 benefícios específicos para a dificuldade relatada.` : "Não envie proposta automaticamente."}

FASE 3 — AGENDAMENTO (após apresentar proposta):
${autoAgendar ? `Proponha demonstração de 20 minutos: "Que tal uma demo rápida para você ver funcionando ao vivo?"
  Ofereça 2 opções de horário (ex: "amanhã às 10h ou às 15h").` : "Não agende demonstrações."}

FASE 4 — TRANSFERÊNCIA PARA HUMANO:
${autoTransferir ? `${qualificarAntesTransferir
    ? `REGRA CRÍTICA: SÓ transfira após coletar nome + equipe + dificuldade + urgência (qualificação completa).
  Se o lead pedir falar com humano antes da qualificação, diga: "Claro! Antes de te conectar com nosso especialista ${vendedorTransferencia || "Fernando"}, me ajuda com 2 perguntas rápidas..." e continue qualificando.
  Após qualificação OU após ${limiteMsg} mensagens: avise que vai transferir e sete transferirHumano: true.`
    : `Transfira quando o lead pedir ou após ${limiteMsg} mensagens.`}
  Mensagem de transferência: "Perfeito! Vou te conectar agora com ${vendedorTransferencia || "Fernando"}, nosso especialista, que já vai ter todo o histórico da nossa conversa. 🤝"` 
  : "Nunca transfira para humano — resolva tudo você mesmo."}

ESTADO ATUAL DA CONVERSA:
- Mensagens trocadas: ${msgCount}
- Qualificação completa: ${jaQualificado ? "✅ SIM" : "❌ NÃO — continue qualificando"}
- Limite de msgs para transferir: ${limiteMsg}

RESPONDA SEMPRE em JSON com este formato exato (sem markdown, sem backticks):
{
  "resposta": "sua mensagem para o cliente (WhatsApp, informal, emojis OK, máx 3 parágrafos)",
  "analise": {
    "intencao": "curiosidade|interesse|pronto_comprar|objecao|agendar|outro",
    "score": "alto|medio|baixo",
    "tamanhoEquipe": null,
    "segmento": null,
    "nomeContato": null,
    "dificuldade": null,
    "urgencia": "alta|media|baixa|desconhecida",
    "faseAtual": "qualificacao|proposta|agendamento|transferencia"
  },
  "acoes": {
    "criarLead": false,
    "agendarDemo": false,
    "enviarProposta": false,
    "transferirHumano": false,
    "planoSugerido": null,
    "notaInterna": "resumo interno para o vendedor humano"
  }
}`;

  const msgs = [
    ...historico.map(m => ({ role: m.de === "ia" ? "assistant" : "user", content: m.texto })),
    { role: "user", content: mensagemUsuario }
  ];

  // ── MODO DEMO (sem API key) ──
  if (!apiKey || !modelo) {
    await new Promise(r => setTimeout(r, 900 + Math.random()*600));
    // Sequência demo: cobre todo o fluxo qualificação → proposta → demo → transferência
    const demoRespostas = [
      // Msg 0 — primeiro contato: pede nome
      { resposta: `Olá! 😊 Que ótimo que você entrou em contato com a ${nomeEmpresa}!\n\nPrimeiro, como posso te chamar?`, analise: { intencao:"curiosidade", score:"baixo", tamanhoEquipe:null, segmento:null, nomeContato:null, dificuldade:null, urgencia:"desconhecida", faseAtual:"qualificacao" }, acoes: { criarLead:false, agendarDemo:false, enviarProposta:false, transferirHumano:false, planoSugerido:null, notaInterna:"Fase 1: coletando nome" } },
      // Msg 1 — coletou nome, pede equipe
      { resposta: `Prazer, ${nomeAgente} aqui! 👋\n\nPra eu te ajudar da melhor forma: quantas pessoas trabalham no seu time de vendas hoje?`, analise: { intencao:"curiosidade", score:"baixo", tamanhoEquipe:null, segmento:null, nomeContato:"contato", dificuldade:null, urgencia:"desconhecida", faseAtual:"qualificacao" }, acoes: { criarLead:false, agendarDemo:false, enviarProposta:false, transferirHumano:false, planoSugerido:null, notaInterna:"Fase 1: coletando tamanho da equipe" } },
      // Msg 2 — coletou equipe, pede dificuldade
      { resposta: `Entendido! 📊 Me conta uma coisa: qual é a maior dificuldade do seu time comercial hoje?\n\n🔹 Organizar os contatos e histórico?\n🔹 Fazer follow-up no prazo certo?\n🔹 Controlar resultados e metas?`, analise: { intencao:"interesse", score:"medio", tamanhoEquipe:"3-5", segmento:null, nomeContato:"contato", dificuldade:null, urgencia:"desconhecida", faseAtual:"qualificacao" }, acoes: { criarLead:false, agendarDemo:false, enviarProposta:false, transferirHumano:false, planoSugerido:null, notaInterna:"Fase 1: coletando dificuldade principal" } },
      // Msg 3 — qualificado! Cria lead + proposta
      { resposta: `Perfeito! Isso é exatamente o que resolvemos. 🎯\n\nCom base no tamanho da equipe, o *Plano Pro* (R$197/mês) seria ideal pra vocês:\n• 5 usuários inclusos\n• Pipeline kanban com arrastar e soltar\n• Follow-up automático com alertas\n• Histórico completo por cliente\n• Agente IA integrado ao WhatsApp\n\nQual dessas funcionalidades chamou mais atenção?`, analise: { intencao:"interesse", score:"medio", tamanhoEquipe:"3-5", segmento:"comercio", nomeContato:"contato", dificuldade:"follow-up", urgencia:"media", faseAtual:"proposta" }, acoes: { criarLead:true, agendarDemo:false, enviarProposta:true, transferirHumano:false, planoSugerido:"Pro", notaInterna:"Qualificação completa — proposta Pro enviada" } },
      // Msg 4 — proposta recebida, propõe demo
      { resposta: `Que ótimo! 🚀 Você veria isso funcionando ao vivo em 20 minutinhos.\n\nQue tal uma demonstração rápida? Posso te passar o link hoje mesmo.\n\nPrefere *amanhã às 10h* ou *às 15h*?`, analise: { intencao:"interesse", score:"alto", tamanhoEquipe:"3-5", segmento:"comercio", nomeContato:"contato", dificuldade:"follow-up", urgencia:"alta", faseAtual:"agendamento" }, acoes: { criarLead:true, agendarDemo:true, enviarProposta:true, transferirHumano:false, planoSugerido:"Pro", notaInterna:"QUENTE — demo proposta, aguardando confirmação de horário" } },
      // Msg 5 — demo confirmada, transfere para vendedor
      { resposta: `✅ Demo confirmada!\n\nPra fechar com chave de ouro, vou te conectar com *Fernando*, nosso especialista de vendas — ele já vai ter todo o histórico da nossa conversa e pode tirar qualquer dúvida sobre contrato, customização e integração.\n\nVocê vai adorar o sistema. Até já! 🤝`, analise: { intencao:"pronto_comprar", score:"alto", tamanhoEquipe:"3-5", segmento:"comercio", nomeContato:"contato", dificuldade:"follow-up", urgencia:"alta", faseAtual:"transferencia" }, acoes: { criarLead:true, agendarDemo:true, enviarProposta:true, transferirHumano:true, planoSugerido:"Pro", notaInterna:"TRANSFERIDO — qualificação completa, demo agendada, plano Pro. Urgência alta." } },
    ];
    const idx = Math.min(Math.floor(historico.length / 2), demoRespostas.length - 1);
    return demoRespostas[idx];
  }

  // ── CLAUDE ──
  if (modelo.startsWith("claude")) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type":"application/json", "x-api-key": apiKey, "anthropic-version":"2023-06-01" },
        body: JSON.stringify({ model: modelo, max_tokens:1024, system: systemPrompt, messages: msgs })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "{}";
      return JSON.parse(text.replace(/```json|```/g,"").trim());
    } catch(e) { console.error("Claude error", e); return null; }
  }

  // ── GPT-4o ──
  if (modelo.startsWith("gpt")) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${apiKey}` },
        body: JSON.stringify({ model: modelo, messages: [{ role:"system", content:systemPrompt }, ...msgs], response_format:{ type:"json_object" } })
      });
      const data = await res.json();
      return JSON.parse(data.choices?.[0]?.message?.content || "{}");
    } catch(e) { console.error("GPT error", e); return null; }
  }

  // ── GEMINI ──
  if (modelo.startsWith("gemini")) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ contents:[{ parts:[{ text: systemPrompt + "\n\nConversa:\n" + msgs.map(m=>`${m.role}: ${m.content}`).join("\n") }] }] })
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      return JSON.parse(text.replace(/```json|```/g,"").trim());
    } catch(e) { console.error("Gemini error", e); return null; }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// WHATSAPP ENGINE — envia mensagem via Evolution API / Z-API / Meta / demo
// ─────────────────────────────────────────────────────────────────────────────
async function enviarWhatsApp(config, numero, mensagem) {
  const { waProvider, waApiUrl, waApiKey, waInstanceId } = config;

  if (waProvider === "demo" || !waApiUrl) {
    console.log("[DEMO WA] →", numero, ":", mensagem);
    return { ok: true, demo: true };
  }

  if (waProvider === "evolution") {
    try {
      const res = await fetch(`${waApiUrl}/message/sendText/${waInstanceId}`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", "apikey": waApiKey },
        body: JSON.stringify({ number: numero.replace(/\D/g,""), textMessage:{ text: mensagem } })
      });
      return await res.json();
    } catch(e) { console.error("Evolution WA error", e); return { ok:false, error:e.message }; }
  }

  if (waProvider === "zapi") {
    try {
      const res = await fetch(`${waApiUrl}/instances/${waInstanceId}/token/${waApiKey}/send-text`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ phone: numero.replace(/\D/g,""), message: mensagem })
      });
      return await res.json();
    } catch(e) { console.error("Z-API error", e); return { ok:false, error:e.message }; }
  }

  if (waProvider === "meta") {
    try {
      const res = await fetch(`https://graph.facebook.com/v18.0/${waInstanceId}/messages`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${waApiKey}` },
        body: JSON.stringify({ messaging_product:"whatsapp", to: numero.replace(/\D/g,""), type:"text", text:{ body: mensagem } })
      });
      return await res.json();
    } catch(e) { console.error("Meta WA error", e); return { ok:false, error:e.message }; }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const S = {
  card:  { background:"#0d1117", border:"1px solid #1e293b", borderRadius:12 },
  inp:   { background:"#111827", border:"1px solid #1e293b", borderRadius:9, padding:"11px 13px", color:"#e2e8f0", fontFamily:"inherit", outline:"none", width:"100%", transition:"border .15s", resize:"vertical" },
  label: { fontSize:11, color:"#475569", fontWeight:700, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" },
  btn:   (v="primary",sm=false) => ({ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, padding:sm?"7px 12px":"11px 18px", borderRadius:9, border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:sm?12:13, background:v==="primary"?"#3b82f6":v==="danger"?"#ef4444":v==="success"?"#10b981":v==="purple"?"#8b5cf6":"#1e293b", color:"#fff", transition:"all .15s", whiteSpace:"nowrap" }),
  badge: (color,bg,sm=false) => ({ display:"inline-flex", alignItems:"center", padding:sm?"2px 7px":"3px 10px", borderRadius:20, fontSize:sm?10:12, fontWeight:700, color, background:bg, whiteSpace:"nowrap" }),
};

const Toggle = ({ value, onChange, label }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px", background:"#111827", borderRadius:9, marginBottom:8 }}>
    <span style={{ fontSize:13, color:"#94a3b8" }}>{label}</span>
    <div onClick={()=>onChange(!value)} style={{ width:42, height:24, borderRadius:12, background:value?"#3b82f6":"#1e293b", cursor:"pointer", position:"relative", transition:"background .2s", flexShrink:0 }}>
      <div style={{ position:"absolute", top:3, left:value?19:3, width:18, height:18, borderRadius:"50%", background:"#fff", transition:"left .2s", boxShadow:"0 1px 4px rgba(0,0,0,.3)" }} />
    </div>
  </div>
);

const ScoreBadge = ({ score }) => {
  const c = SCORE_LABELS[score] || SCORE_LABELS.medio;
  return <span style={S.badge(c.color, c.bg, true)}>{c.label}</span>;
};

// ─────────────────────────────────────────────────────────────────────────────
// ABA: CONVERSAS — MOBILE-FIRST
// ─────────────────────────────────────────────────────────────────────────────
const AbaConversas = ({ config, convs, setConvs, onLeadCriado }) => {
  const isMobile                      = useIsMobile();
  const [convAtiva, setConvAtiva]     = useState(null);
  const [inputMsg, setInputMsg]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [novaConv, setNovaConv]       = useState(false);
  const [novoNum, setNovoNum]         = useState("");
  const [novoNome, setNovoNome]       = useState("");
  const bottomRef = useRef();

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[convAtiva, convs]);

  const conv = convs.find(c=>c.id===convAtiva);

  // Mobile: ao abrir conversa, esconde lista e mostra chat tela cheia
  const abrirConversa = (id) => { setConvAtiva(id); };
  const voltarLista   = () => { setConvAtiva(null); };

  const iniciarConversa = () => {
    if (!novoNum) return;
    const nova = { id:Date.now(), numero:novoNum, nome:novoNome||novoNum, status:"ativo", score:"baixo", msgs:[], leadCriado:false, leadId:null, createdAt:ts(), ultimaMensagem:"" };
    const updated = [nova, ...convs];
    setConvs(updated); saveConvs(updated);
    abrirConversa(nova.id); setNovaConv(false); setNovoNum(""); setNovoNome("");
  };

  const simularMsgEntrada = async () => {
    if (!conv) return;
    const frases = ["Olá, vi o anúncio de vocês. Como funciona?","Quero saber mais sobre os planos","Quanto custa?","Tenho 4 vendedores. Vocês atendem pequenas empresas?","Pode me falar mais sobre a integração com WhatsApp?","Gostaria de ver uma demonstração"];
    const txt = frases[Math.floor(Math.random()*frases.length)];
    await processarMensagem(conv, txt, "cliente");
  };

  const processarMensagem = useCallback(async (c, texto, origem="cliente") => {
    if (loading) return;
    setLoading(true);
    const msgCliente = { id:Date.now(), de:"cliente", texto, hora:hora(), origem };
    const msgsAtualizadas = [...c.msgs, msgCliente];
    setConvs(prev => {
      const u = prev.map(x => x.id===c.id ? {...x, msgs:msgsAtualizadas, ultimaMensagem:texto} : x);
      saveConvs(u); return u;
    });
    const resultado = await chamarIA(config, c.msgs, texto);
    if (!resultado) { setLoading(false); return; }
    const { resposta, analise, acoes } = resultado;
    const msgIA = { id:Date.now()+1, de:"ia", texto:resposta, hora:hora(), analise, acoes };
    const msgsFinal = [...msgsAtualizadas, msgIA];
    let novoStatus = c.status;
    let novoScore  = analise?.score || c.score;
    let leadCriado = c.leadCriado;
    let leadId     = c.leadId;
    if (acoes?.criarLead && !c.leadCriado && config.autoCriarLead) {
      const novoLead = {
        id: Date.now()+2,
        nome:    analise?.nomeContato || c.nome,
        telefone: c.numero,
        email:   "",
        origem:  "WhatsApp",
        responsavel: config.vendedorTransferencia || "Fernando",
        status:  "novo",
        valor:   acoes?.planoSugerido === "Business" ? 397 : acoes?.planoSugerido === "Pro" ? 197 : 97,
        previsao:"",
        obs:     acoes?.notaInterna || "",
        score:   novoScore,
        segmento: analise?.segmento || "",
        criadoPor: "IA",
        criadoEm: ts(),
      };
      const existentes = getIALeads();
      saveIALeads([novoLead, ...existentes]);
      onLeadCriado?.(novoLead);
      leadCriado = true; leadId = novoLead.id;
      novoStatus = "qualificado";
    }
    if (acoes?.agendarDemo) novoStatus = "qualificado";
    if (acoes?.transferirHumano) {
      novoStatus = "transferido";
      console.log(`[VendaFlow IA] Lead ${c.nome} transferido para ${config.vendedorTransferencia||"Fernando"} | Score: ${novoScore} | Nota: ${acoes?.notaInterna}`);
    }
    if (analise?.intencao === "pronto_comprar") novoStatus = "qualificado";
    if (config.waProvider !== "demo" && config.waApiUrl && config.ativo) {
      enviarWhatsApp(config, c.numero, resposta).catch(console.error);
    }
    setConvs(prev => {
      const u = prev.map(x => x.id===c.id ? { ...x, msgs:msgsFinal, status:novoStatus, score:novoScore, leadCriado, leadId, ultimaMensagem:resposta, analise } : x);
      saveConvs(u); return u;
    });
    setLoading(false);
  }, [config, loading]);

  const enviarManual = async () => {
    if (!inputMsg.trim() || !conv) return;
    const txt = inputMsg; setInputMsg("");
    await processarMensagem(conv, txt, "manual");
  };

  // ── LISTA DE CONVERSAS ──
  const ListaConversas = () => (
    <div style={{ background:"#0d1117", border:"1px solid #1e293b", borderRadius:12, display:"flex", flexDirection:"column", overflow:"hidden", height: isMobile ? "calc(100vh - 240px)" : "100%" }}>
      <div style={{ padding:"12px 14px", borderBottom:"1px solid #1e293b", display:"flex", gap:8, alignItems:"center" }}>
        <span style={{ flex:1, fontSize:13, fontWeight:700, color:"#f1f5f9" }}>Conversas ({convs.length})</span>
        <button style={S.btn("primary",true)} onClick={()=>setNovaConv(true)}>+ Nova</button>
      </div>
      {novaConv && (
        <div style={{ padding:"12px 14px", background:"#111827", borderBottom:"1px solid #1e293b" }}>
          <input style={{...S.inp, marginBottom:8, fontSize:16, padding:"11px 13px"}} placeholder="Número WhatsApp (5511...)" value={novoNum} onChange={e=>setNovoNum(e.target.value)} inputMode="tel" />
          <input style={{...S.inp, marginBottom:8, fontSize:16, padding:"11px 13px"}} placeholder="Nome (opcional)" value={novoNome} onChange={e=>setNovoNome(e.target.value)} />
          <div style={{ display:"flex", gap:6 }}>
            <button style={{...S.btn("secondary",true),flex:1}} onClick={()=>setNovaConv(false)}>Cancelar</button>
            <button style={{...S.btn("primary",true),flex:1}} onClick={iniciarConversa}>Iniciar</button>
          </div>
        </div>
      )}
      <div style={{ flex:1, overflowY:"auto" }}>
        {convs.length === 0 && (
          <div style={{ padding:32, textAlign:"center", color:"#334155", fontSize:13 }}>
            <div style={{ fontSize:36, marginBottom:10 }}>💬</div>
            Nenhuma conversa ainda.<br/>Toque em "+ Nova" para iniciar.
          </div>
        )}
        {convs.map(c=>(
          <div key={c.id} onClick={()=>abrirConversa(c.id)}
            style={{ padding:"13px 15px", borderBottom:"1px solid rgba(30,41,59,.5)", cursor:"pointer", background:convAtiva===c.id&&!isMobile?"rgba(59,130,246,.08)":"transparent", borderLeft:`3px solid ${convAtiva===c.id&&!isMobile?"#3b82f6":"transparent"}`, transition:"all .15s", minHeight:68, display:"flex", flexDirection:"column", justifyContent:"center" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
              <span style={{ fontSize:14, fontWeight:700, color:"#f1f5f9", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth: isMobile?200:140 }}>{c.nome}</span>
              <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                {c.leadCriado && <span style={{ fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:10, background:"rgba(16,185,129,.15)", color:"#10b981" }}>LEAD</span>}
                <ScoreBadge score={c.score} />
              </div>
            </div>
            <div style={{ fontSize:12, color:"#475569", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:3 }}>{c.ultimaMensagem || "Sem mensagens"}</div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:11, color:"#334155" }}>{c.numero}</span>
              <span style={{ fontSize:11, padding:"1px 7px", borderRadius:10, background:"rgba(59,130,246,.08)", color:CONV_COLORS[c.status]||"#475569", fontWeight:600 }}>{CONV_STATUS[c.status]||c.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── JANELA DE CHAT ──
  const JanelChat = () => (
    <div style={{ display:"flex", flexDirection:"column", background:"#080c14", border:"1px solid #1e293b", borderRadius:12, overflow:"hidden", height: isMobile ? "calc(100vh - 180px)" : "100%" }}>
      {/* Header */}
      <div style={{ padding:"11px 14px", background:"#0d1117", borderBottom:"1px solid #1e293b", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        {isMobile && (
          <button onClick={voltarLista} style={{ background:"#1e293b", border:"none", color:"#94a3b8", width:34, height:34, borderRadius:9, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>‹</button>
        )}
        <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#25d366,#128c7e)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>💬</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{conv.nome}</div>
          <div style={{ fontSize:11, color:"#475569" }}>{conv.numero} · {conv.msgs.length} msgs</div>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
          <ScoreBadge score={conv.score} />
          {!isMobile && <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, background:"rgba(59,130,246,.1)", color:"#60a5fa", fontWeight:600 }}>{CONV_STATUS[conv.status]||conv.status}</span>}
          <button style={S.btn("success",true)} onClick={simularMsgEntrada} title="Simular mensagem recebida">{isMobile?"⬇":"⬇ Receber"}</button>
        </div>
      </div>

      {/* Mensagens */}
      <div style={{ flex:1, overflowY:"auto", padding:isMobile?12:16, display:"flex", flexDirection:"column", gap:10 }}>
        {conv.msgs.length === 0 && (
          <div style={{ textAlign:"center", color:"#334155", marginTop:40 }}>
            <div style={{ fontSize:40, marginBottom:10 }}>🤖</div>
            <div style={{ fontSize:13 }}>Conversa iniciada.<br/>Toque em "⬇" para simular mensagem do lead.</div>
          </div>
        )}
        {conv.msgs.map(m=>(
          <div key={m.id}>
            <div style={{ display:"flex", justifyContent:m.de==="ia"?"flex-start":"flex-end" }}>
              {m.de==="ia" && <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#10b981,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, marginRight:8, flexShrink:0, alignSelf:"flex-end" }}>🤖</div>}
              <div style={{ maxWidth:isMobile?"85%":"72%", background:m.de==="ia"?"#0d1117":"#1e40af", border:m.de==="ia"?"1px solid #1e293b":"none", borderRadius:m.de==="ia"?"4px 14px 14px 14px":"14px 4px 14px 14px", padding:"10px 13px" }}>
                <div style={{ fontSize:13, color:"#e2e8f0", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{m.texto}</div>
                <div style={{ display:"flex", gap:6, marginTop:4, alignItems:"center", flexWrap:"wrap" }}>
                  <span style={{ fontSize:10, color:"#334155" }}>{m.hora}</span>
                  {m.de==="ia" && m.analise && !isMobile && <span style={{ fontSize:9, color:"#334155" }}>· {m.analise.score} · {m.analise.intencao}</span>}
                </div>
              </div>
            </div>
            {m.de==="ia" && m.acoes && Object.entries(m.acoes).some(([k,v])=>v===true) && (
              <div style={{ display:"flex", gap:5, marginTop:6, marginLeft:isMobile?0:36, flexWrap:"wrap" }}>
                {m.acoes.criarLead      && <span style={S.badge("#10b981","rgba(16,185,129,.1)",true)}>✓ Lead criado</span>}
                {m.acoes.agendarDemo    && <span style={S.badge("#3b82f6","rgba(59,130,246,.1)",true)}>✓ Demo</span>}
                {m.acoes.enviarProposta && <span style={S.badge("#f59e0b","rgba(245,158,11,.1)",true)}>✓ Proposta</span>}
                {m.acoes.transferirHumano&&<span style={S.badge("#8b5cf6","rgba(139,92,246,.1)",true)}>✓ Transferido</span>}
                {m.acoes.planoSugerido  && <span style={S.badge("#06b6d4","rgba(6,182,212,.1)",true)}>{m.acoes.planoSugerido}</span>}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
            <div style={{ width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12 }}>🤖</div>
            <div style={{ background:"#0d1117",border:"1px solid #1e293b",borderRadius:"4px 14px 14px 14px",padding:"12px 16px" }}>
              <div style={{ display:"flex",gap:4 }}>{[0,1,2].map(i=><div key={i} style={{ width:6,height:6,borderRadius:"50%",background:"#3b82f6",animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}</div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding:isMobile?"10px 12px 16px":"10px 14px", borderTop:"1px solid #1e293b", display:"flex", gap:8, flexShrink:0 }}>
        <input
          style={{...S.inp, flex:1, padding:"11px 13px", fontSize:16}}
          placeholder="Simular mensagem do lead..."
          value={inputMsg}
          onChange={e=>setInputMsg(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&enviarManual()}
        />
        <button style={{...S.btn("primary",true), padding:"11px 16px", flexShrink:0}} onClick={enviarManual} disabled={loading}>↗</button>
      </div>
    </div>
  );

  // ── LAYOUT: mobile = tela cheia por vez | desktop = side-by-side ──
  if (isMobile) {
    return conv ? <JanelChat /> : <ListaConversas />;
  }

  return (
    <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:0, height:"calc(100vh - 200px)", minHeight:440 }}>
      <ListaConversas />
      {conv
        ? <div style={{ borderLeft:"none", height:"100%" }}><JanelChat /></div>
        : <div style={{ background:"#080c14", border:"1px solid #1e293b", borderLeft:"none", borderRadius:"0 12px 12px 0", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, color:"#334155" }}>
            <div style={{ fontSize:40 }}>💬</div>
            <div style={{ fontSize:13 }}>Selecione uma conversa à esquerda</div>
          </div>
      }
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ABA: LEADS IA
// ─────────────────────────────────────────────────────────────────────────────
const AbaLeadsIA = ({ onConverter }) => {
  const isMobile = useIsMobile();
  const [leads, setLeads] = useState(getIALeads());

  useEffect(()=>{
    const fn = ()=>setLeads(getIALeads());
    window.addEventListener("vendaflow_lead_criado", fn);
    return ()=>window.removeEventListener("vendaflow_lead_criado", fn);
  },[]);

  const converter = (lead) => {
    if (!window.confirm(`Converter "${lead.nome}" para lead no CRM?`)) return;
    onConverter?.(lead);
    const atualizados = leads.map(l=>l.id===lead.id?{...l,convertido:true}:l);
    setLeads(atualizados); saveIALeads(atualizados);
  };

  const excluir = (id) => {
    if (!window.confirm("Remover este lead?")) return;
    const u = leads.filter(l=>l.id!==id); setLeads(u); saveIALeads(u);
  };

  if (leads.length===0) return (
    <div style={{ ...S.card, padding:48, textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>🎯</div>
      <div style={{ fontSize:16, fontWeight:700, color:"#f1f5f9", marginBottom:6 }}>Nenhum lead gerado pela IA ainda</div>
      <div style={{ fontSize:13, color:"#475569" }}>Quando a IA qualificar um contato e criar um lead automaticamente, ele aparecerá aqui para você revisar e converter.</div>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontSize:13, color:"#475569" }}>{leads.length} lead(s) gerado(s) pela IA</div>
        <span style={S.badge("#10b981","rgba(16,185,129,.1)")}>{leads.filter(l=>l.score==="alto").length} quentes 🔥</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {leads.map(lead=>(
          <div key={lead.id} style={{ ...S.card, padding:16, opacity:lead.convertido?.7:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:"#f1f5f9" }}>{lead.nome}</div>
                <div style={{ fontSize:12, color:"#475569", marginTop:2 }}>📞 {lead.telefone} · via WhatsApp · {lead.criadoEm}</div>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <ScoreBadge score={lead.score} />
                {lead.convertido && <span style={S.badge("#10b981","rgba(16,185,129,.15)",true)}>Convertido</span>}
              </div>
            </div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:10 }}>
              {lead.segmento  && <span style={{ fontSize:11, color:"#64748b", background:"#111827", padding:"3px 9px", borderRadius:20 }}>🏢 {lead.segmento}</span>}
              {lead.planoSugerido&&<span style={{ fontSize:11, color:"#60a5fa", background:"rgba(59,130,246,.1)", padding:"3px 9px", borderRadius:20 }}>💡 Plano {lead.planoSugerido}</span>}
              <span style={{ fontSize:11, color:"#10b981", background:"rgba(16,185,129,.1)", padding:"3px 9px", borderRadius:20 }}>💰 R${lead.valor}/mês</span>
            </div>
            {lead.obs && <div style={{ fontSize:12, color:"#64748b", background:"#111827", borderRadius:8, padding:"8px 12px", marginBottom:10 }}>🤖 {lead.obs}</div>}
            {!lead.convertido && (
              <div style={{ display:"flex", gap:8 }}>
                <button style={{...S.btn("success",true),flex:1}} onClick={()=>converter(lead)}>✓ Converter para CRM</button>
                <button style={{...S.btn("secondary",true)}} onClick={()=>excluir(lead.id)}>🗑️</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ABA: CONFIGURAÇÕES
// ─────────────────────────────────────────────────────────────────────────────
const AbaConfig = ({ config, setConfig }) => {
  const isMobile = useIsMobile();
  const [local, setLocal]   = useState({ ...config });
  const [saved, setSaved]   = useState(false);
  const [testando, setTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const salvar = () => { saveConfig(local); setConfig(local); setSaved(true); setTimeout(()=>setSaved(false), 2000); };

  const testarIA = async () => {
    setTest(true); setTestResult(null);
    try {
      const r = await chamarIA(local, [], "Olá, quero saber mais sobre o sistema");
      setTestResult({ ok:true, msg: r?.resposta || "OK - sem resposta" });
    } catch(e) { setTestResult({ ok:false, msg:e.message }); }
    setTest(false);
  };

  const testarWA = async () => {
    setTest(true); setTestResult(null);
    try {
      const r = await enviarWhatsApp({ ...local }, local.waNumero || "5511999999999", "🤖 Teste de integração VendaFlow IA");
      setTestResult({ ok:true, msg: local.waProvider==="demo" ? "Modo demo — sem envio real" : JSON.stringify(r).slice(0,80) });
    } catch(e) { setTestResult({ ok:false, msg:e.message }); }
    setTest(false);
  };

  const F = ({ label, field, type="text", placeholder="" }) => (
    <div style={{ marginBottom:12 }}>
      <label style={S.label}>{label}</label>
      {type==="textarea"
        ? <textarea style={{...S.inp, minHeight:90, fontSize:16}} value={local[field]||""} onChange={e=>setLocal({...local,[field]:e.target.value})} placeholder={placeholder} />
        : <input style={{...S.inp, fontSize:16}} type={type} value={local[field]||""} onChange={e=>setLocal({...local,[field]:e.target.value})} placeholder={placeholder} />
      }
    </div>
  );

  const Sel = ({ label, field, options }) => (
    <div style={{ marginBottom:12 }}>
      <label style={S.label}>{label}</label>
      <select style={{...S.inp, fontSize:16}} value={local[field]||""} onChange={e=>setLocal({...local,[field]:e.target.value})}>
        {options.map(([v,l])=><option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  const Section = ({ title, children, icon }) => (
    <div style={{ ...S.card, marginBottom:14, overflow:"hidden" }}>
      <div style={{ padding:"12px 16px", borderBottom:"1px solid #1e293b", display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:16 }}>{icon}</span>
        <span style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>{title}</span>
      </div>
      <div style={{ padding:16 }}>{children}</div>
    </div>
  );

  return (
    <div>
      <Section icon="🤖" title="Agente IA">
        <Sel label="Modelo de IA" field="modelo" options={[
          ["","— Selecione o modelo —"],
          ["claude-sonnet-4-20250514","🟣 Claude Sonnet 4.5 (Anthropic) — Recomendado"],
          ["claude-opus-4-5","🟣 Claude Opus 4 (Anthropic) — Mais poderoso"],
          ["gpt-4o","🟢 GPT-4o (OpenAI) — Mais conhecido"],
          ["gpt-4o-mini","🟢 GPT-4o Mini (OpenAI) — Mais barato"],
          ["gemini-1.5-pro","🔵 Gemini 1.5 Pro (Google)"],
          ["gemini-1.5-flash","🔵 Gemini 1.5 Flash (Google) — Mais rápido"],
        ]} />
        {!local.modelo && <div style={{ marginBottom:12, padding:"9px 13px", background:"rgba(245,158,11,.08)", border:"1px solid rgba(245,158,11,.2)", borderRadius:9, fontSize:12, color:"#f59e0b" }}>⚠️ Selecione um modelo para ativar a IA real. Sem modelo selecionado, o agente roda em modo demo.</div>}
        <F label="API Key" field="apiKey" type="password" placeholder="sk-ant-... ou sk-... ou AIza..." />
        <div style={{ marginBottom:12, padding:"10px 14px", background:"#111827", borderRadius:9, fontSize:12, color:"#475569" }}>
          <strong style={{ color:"#64748b" }}>Onde encontrar:</strong><br/>
          Claude: <a href="https://console.anthropic.com" target="_blank" style={{ color:"#60a5fa" }}>console.anthropic.com</a> &nbsp;·&nbsp;
          OpenAI: <a href="https://platform.openai.com/api-keys" target="_blank" style={{ color:"#60a5fa" }}>platform.openai.com</a> &nbsp;·&nbsp;
          Gemini: <a href="https://aistudio.google.com" target="_blank" style={{ color:"#60a5fa" }}>aistudio.google.com</a>
        </div>
        <F label="Nome do agente" field="nomeAgente" placeholder="VendaFlow IA" />
        <F label="Nome da empresa" field="nomeEmpresa" placeholder="VendaFlow" />
        <div style={{ marginBottom:12 }}>
          <label style={S.label}>Tom de comunicação</label>
          <div style={{ display:"flex", gap:8 }}>
            {["formal","amigável","direto","animado"].map(t=>(
              <button key={t} onClick={()=>setLocal({...local,tom:t})} style={{ flex:1, padding:"9px 6px", borderRadius:8, border:`1px solid ${local.tom===t?"#3b82f6":"#1e293b"}`, background:local.tom===t?"rgba(59,130,246,.15)":"transparent", color:local.tom===t?"#60a5fa":"#64748b", fontSize:12, fontWeight:600, cursor:"pointer" }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
            ))}
          </div>
        </div>
        <F label="Base de conhecimento (o que o agente sabe sobre sua empresa)" field="baseConhecimento" type="textarea" placeholder="Descreva seus planos, diferenciais, público-alvo..." />
        <button style={{...S.btn("purple",true)}} onClick={testarIA} disabled={testando}>{testando?"Testando...":"🧪 Testar IA agora"}</button>
        {testResult && <div style={{ marginTop:10, padding:"10px 14px", background:testResult.ok?"rgba(16,185,129,.1)":"rgba(239,68,68,.1)", border:`1px solid ${testResult.ok?"rgba(16,185,129,.3)":"rgba(239,68,68,.3)"}`, borderRadius:9, fontSize:12, color:testResult.ok?"#6ee7b7":"#fca5a5" }}>{testResult.ok?"✅ IA funcionando — resposta: ":"❌ "}{testResult.msg}</div>}
      </Section>

      <Section icon="⚡" title="Automações">
        <div style={{ marginBottom:10, padding:"10px 13px", background:"rgba(59,130,246,.06)", border:"1px solid rgba(59,130,246,.15)", borderRadius:9, fontSize:12, color:"#64748b" }}>
          💡 Fluxo padrão: <strong style={{color:"#60a5fa"}}>Qualificar → Proposta → Demo → Transferir</strong>. Desative etapas conforme necessário.
        </div>
        <Toggle value={local.autoQualificar}           onChange={v=>setLocal({...local,autoQualificar:v})}           label="① Qualificar (nome, equipe, dificuldade, urgência)" />
        <Toggle value={local.autoCriarLead}            onChange={v=>setLocal({...local,autoCriarLead:v})}            label="② Criar lead no CRM automaticamente" />
        <Toggle value={local.autoEnviarProposta}       onChange={v=>setLocal({...local,autoEnviarProposta:v})}       label="③ Apresentar proposta do plano adequado" />
        <Toggle value={local.autoAgendar}              onChange={v=>setLocal({...local,autoAgendar:v})}              label="④ Propor agendamento de demonstração" />
        <Toggle value={local.autoTransferir}           onChange={v=>setLocal({...local,autoTransferir:v})}           label="⑤ Transferir para vendedor humano" />
        {local.autoTransferir && (
          <div style={{ background:"#111827", borderRadius:10, padding:"12px 14px", marginTop:4, marginBottom:8 }}>
            <Toggle value={local.qualificarAntesTransferir} onChange={v=>setLocal({...local,qualificarAntesTransferir:v})} label="Obrigatório: qualificar ANTES de transferir" />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:10 }}>
              <div>
                <label style={S.label}>Transferir após (msgs)</label>
                <input style={{...S.inp, fontSize:13}} type="number" min={2} max={30} value={local.limiteMsg} onChange={e=>setLocal({...local,limiteMsg:Number(e.target.value)})} />
              </div>
              <div>
                <label style={S.label}>Vendedor responsável</label>
                <input style={{...S.inp, fontSize:13}} type="text" placeholder="Fernando" value={local.vendedorTransferencia||""} onChange={e=>setLocal({...local,vendedorTransferencia:e.target.value})} />
              </div>
            </div>
            <div style={{ marginTop:8, fontSize:11, color:"#334155" }}>
              {local.qualificarAntesTransferir
                ? "✅ A IA vai coletar nome, equipe, dificuldade e urgência antes de transferir. Se o lead pedir humano antes, a IA vai qualificar primeiro."
                : "⚠️ A IA transfere ao atingir o limite de mensagens sem qualificação obrigatória."}
            </div>
          </div>
        )}
      </Section>

      <Section icon="📱" title="Integração WhatsApp">
        <Sel label="Provedor" field="waProvider" options={[
          ["evolution","Evolution API (self-hosted, gratuito) ← Padrão"],
          ["zapi","Z-API (pago, fácil de configurar)"],
          ["meta","Meta Business API (oficial)"],
          ["demo","Demo (sem envio real — para testes)"],
        ]} />

        {local.waProvider !== "demo" && (
          <>
            <div style={{ marginBottom:12, padding:"10px 14px", background:"#111827", borderRadius:9, fontSize:12, color:"#475569" }}>
              {local.waProvider === "evolution" && <>
                <strong style={{ color:"#64748b" }}>Evolution API:</strong> instale em <a href="https://doc.evolution-api.com" target="_blank" style={{ color:"#60a5fa" }}>doc.evolution-api.com</a> (Docker) · Gratuito e open-source<br/>
                URL base: <code style={{ color:"#94a3b8" }}>http://seu-servidor:8080</code>
              </>}
              {local.waProvider === "zapi" && <>
                <strong style={{ color:"#64748b" }}>Z-API:</strong> acesse <a href="https://z-api.io" target="_blank" style={{ color:"#60a5fa" }}>z-api.io</a> · R$79/mês<br/>
                Instância e token disponíveis no painel Z-API
              </>}
              {local.waProvider === "meta" && <>
                <strong style={{ color:"#64748b" }}>Meta API:</strong> configure em <a href="https://developers.facebook.com/docs/whatsapp" target="_blank" style={{ color:"#60a5fa" }}>developers.facebook.com</a><br/>
                Phone Number ID como Instance ID · Access Token como API Key
              </>}
            </div>
            <F label="URL da API" field="waApiUrl" placeholder={local.waProvider==="evolution"?"https://seu-servidor:8080":local.waProvider==="zapi"?"https://api.z-api.io":"https://graph.facebook.com/v18.0"} />
            <F label="API Key / Token" field="waApiKey" type="password" placeholder="sua-api-key..." />
            <F label="Instance ID / Phone Number ID" field="waInstanceId" placeholder="nome-da-instancia ou 12345678..." />
          </>
        )}

        <F label="Número de teste para envio" field="waNumero" placeholder="5511999999999 (DDI+DDD+número)" />
        <button style={{...S.btn("success",true)}} onClick={testarWA} disabled={testando}>{testando?"Enviando...":"📲 Testar envio"}</button>
        {testResult && <div style={{ marginTop:10, padding:"10px 14px", background:testResult.ok?"rgba(16,185,129,.1)":"rgba(239,68,68,.1)", border:`1px solid ${testResult.ok?"rgba(16,185,129,.3)":"rgba(239,68,68,.3)"}`, borderRadius:9, fontSize:12, color:testResult.ok?"#6ee7b7":"#fca5a5" }}>{testResult.ok?"✅ ":"❌ "}{testResult.msg}</div>}

        {local.waProvider !== "demo" && (
          <div style={{ marginTop:14, padding:"12px 14px", background:"rgba(59,130,246,.06)", border:"1px solid rgba(59,130,246,.2)", borderRadius:10 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#60a5fa", marginBottom:6 }}>🔗 Webhook para receber mensagens</div>
            <div style={{ fontSize:11, color:"#475569", marginBottom:8 }}>Configure este endpoint no seu provedor de WhatsApp para que as mensagens cheguem automaticamente:</div>
            <code style={{ fontSize:11, color:"#94a3b8", background:"#111827", padding:"8px 12px", borderRadius:7, display:"block", wordBreak:"break-all" }}>
              {window.location.origin}/api/webhook/whatsapp
            </code>
            <div style={{ fontSize:11, color:"#334155", marginTop:6 }}>⚠️ Requer backend Node.js/Supabase Edge Function — veja documentação</div>
          </div>
        )}
      </Section>

      <div style={{ display:"flex", gap:10 }}>
        <button style={{...S.btn("primary"), flex:1}} onClick={salvar}>{saved?"✅ Salvo!":"💾 Salvar configurações"}</button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ABA: ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
const AbaAnalytics = ({ convs }) => {
  const total     = convs.length;
  const leads     = getIALeads();
  const quentes   = leads.filter(l=>l.score==="alto").length;
  const convertidos = leads.filter(l=>l.convertido).length;
  const txConv    = total>0 ? Math.round(convertidos/Math.max(leads.length,1)*100) : 0;
  const totalMsgs = convs.reduce((a,c)=>a+c.msgs.length,0);
  const tempoMed  = totalMsgs>0 ? Math.round(totalMsgs/Math.max(total,1)) : 0;

  const porStatus = Object.entries(CONV_STATUS).map(([k,v])=>({ key:k, label:v, n:convs.filter(c=>c.status===k).length, color:CONV_COLORS[k] })).filter(x=>x.n>0);
  const porScore  = ["alto","medio","baixo"].map(s=>({ label:SCORE_LABELS[s].label, n:leads.filter(l=>l.score===s).length, color:SCORE_LABELS[s].color }));

  const kpi = (icon,label,value,color="#3b82f6") => (
    <div style={{ ...S.card, padding:14, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:10, right:12, fontSize:20, opacity:.3 }}>{icon}</div>
      <div style={{ fontSize:9, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:800, color:"#f1f5f9" }}>{value}</div>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3, background:color }} />
    </div>
  );

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10, marginBottom:16 }}>
        {kpi("💬","Conversas",total,"#3b82f6")}
        {kpi("🎯","Leads IA",leads.length,"#10b981")}
        {kpi("🔥","Leads quentes",quentes,"#ef4444")}
        {kpi("✅","Convertidos",convertidos,"#06b6d4")}
        {kpi("📊","Taxa conversão",`${txConv}%`,"#f59e0b")}
        {kpi("💬","Msgs/conversa",tempoMed,"#8b5cf6")}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:12 }}>
        <div style={S.card}>
          <div style={{ padding:"12px 14px", borderBottom:"1px solid #1e293b", fontSize:13, fontWeight:700, color:"#f1f5f9" }}>Por Status</div>
          <div style={{ padding:14 }}>
            {porStatus.map(s=>(
              <div key={s.key} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:12, color:"#94a3b8" }}>{s.label}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:s.color }}>{s.n}</span>
                </div>
                <div style={{ height:5, background:"#1e293b", borderRadius:3 }}>
                  <div style={{ height:"100%", width:`${Math.max(4,(s.n/Math.max(total,1))*100)}%`, background:s.color, borderRadius:3 }} />
                </div>
              </div>
            ))}
            {porStatus.length===0 && <div style={{ fontSize:12, color:"#334155", textAlign:"center", padding:12 }}>Sem dados</div>}
          </div>
        </div>

        <div style={S.card}>
          <div style={{ padding:"12px 14px", borderBottom:"1px solid #1e293b", fontSize:13, fontWeight:700, color:"#f1f5f9" }}>Score dos Leads</div>
          <div style={{ padding:14 }}>
            {porScore.map(s=>(
              <div key={s.label} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:12, color:"#94a3b8" }}>{s.label}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:s.color }}>{s.n}</span>
                </div>
                <div style={{ height:5, background:"#1e293b", borderRadius:3 }}>
                  <div style={{ height:"100%", width:`${Math.max(4,(s.n/Math.max(leads.length,1))*100)}%`, background:s.color, borderRadius:3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function AgenteIAModule({ setLeads: setCRMLeads }) {
  const isMobile             = useIsMobile();
  const [config, setConfig] = useState(() => getConfig());
  const [convs,  setConvs]  = useState(() => getConvs());
  const [aba, setAba]       = useState("conversas");

  const ABAS = [
    { id:"conversas",  icon:"💬", label:"Conversas" },
    { id:"leads",      icon:"🎯", label:"Leads IA" },
    { id:"analytics",  icon:"📊", label:"Analytics" },
    { id:"config",     icon:"⚙️", label:"Config" },
  ];

  const handleLeadCriado = (lead) => {
    // Também adiciona ao pipeline do CRM se quiser
    window.dispatchEvent(new Event("vendaflow_lead_criado"));
  };

  const handleConverter = (leadIA) => {
    if (!setCRMLeads) return;
    const leadCRM = {
      id: Date.now(),
      nome: leadIA.nome,
      telefone: leadIA.telefone,
      email: leadIA.email || "",
      origem: "WhatsApp",
      responsavel: "Fernando",
      status: "novo",
      valor: leadIA.valor || 197,
      previsao: "",
      obs: `Lead gerado pela IA — ${leadIA.obs}`,
    };
    setCRMLeads(prev => [leadCRM, ...prev]);
  };

  const leadsIA = getIALeads();

  return (
    <div className="fade-in">
      {/* Header com status */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:9, height:9, borderRadius:"50%", background:config.ativo?"#10b981":"#ef4444", animation:config.ativo?"pulse 2s infinite":"none" }} />
          <span style={{ fontSize:14, fontWeight:700, color:config.ativo?"#10b981":"#ef4444" }}>{config.ativo?"Agente Ativo":"Agente Pausado"}</span>
          <span style={{ fontSize:11, color:"#334155", background:"#111827", padding:"3px 10px", borderRadius:20 }}>
            {config.waProvider==="demo"?"Demo":"WhatsApp"} · {config.modelo?.split("-")[0]}
          </span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:11, color:"#475569" }}>{leadsIA.filter(l=>!l.convertido).length} leads aguardando revisão</span>
          <button style={S.btn(config.ativo?"secondary":"primary",true)} onClick={()=>{ const c={...config,ativo:!config.ativo}; setConfig(c); saveConfig(c); }}>
            {config.ativo?"⏸ Pausar":"▶ Ativar"}
          </button>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display:"flex", gap:0, marginBottom:16, background:"#0d1117", border:"1px solid #1e293b", borderRadius:10, padding:4, overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
        {ABAS.map(a=>(
          <button key={a.id} onClick={()=>setAba(a.id)} style={{ flex:1, padding:"9px 6px", background:aba===a.id?"#1e293b":"transparent", border:"none", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:aba===a.id?700:500, color:aba===a.id?"#f1f5f9":"#475569", display:"flex", alignItems:"center", justifyContent:"center", gap:5, transition:"all .15s" }}>
            <span>{a.icon}</span>
            <span style={{ display:"none" }} className="tab-label">{a.label}</span>
            <span style={{ fontSize:11 }}>{a.label}</span>
            {a.id==="leads" && leadsIA.filter(l=>!l.convertido).length>0 && (
              <span style={{ background:"#ef4444", color:"#fff", fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:10 }}>{leadsIA.filter(l=>!l.convertido).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {aba==="conversas"  && <AbaConversas config={config} convs={convs} setConvs={setConvs} onLeadCriado={handleLeadCriado} />}
      {aba==="leads"      && <AbaLeadsIA  onConverter={handleConverter} />}
      {aba==="analytics"  && <AbaAnalytics convs={convs} />}
      {aba==="config"     && <AbaConfig   config={config} setConfig={(c)=>{ setConfig(c); saveConfig(c); }} />}
    </div>
  );
}
