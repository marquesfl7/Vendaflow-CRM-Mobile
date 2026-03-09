import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// MODO DEMONSTRAÇÃO — VendaFlow CRM
//
// Como usar:
//   <DemoGuard enabled={true} pin="1234">
//     <App />
//   </DemoGuard>
//
// Quando enabled=true:
//   • Exibe marca d'água "DEMONSTRAÇÃO" em todas as telas
//   • Bloqueia ações destrutivas (excluir, editar dados reais)
//   • Banner fixo no topo com timer de sessão
//   • PIN opcional para desbloquear modo admin completo
//   • Dados resetam após X minutos de inatividade
// ═══════════════════════════════════════════════════════════════════════════

const DEMO_KEY        = "vendaflow_demo_mode";
const DEMO_SESSION    = "vendaflow_demo_session";
const DEMO_TIMEOUT_MS = 30 * 60 * 1000; // 30 min

export const isDemoMode = () => {
  try { return JSON.parse(localStorage.getItem(DEMO_KEY) || "false"); }
  catch { return false; }
};
export const setDemoMode = (v) => localStorage.setItem(DEMO_KEY, JSON.stringify(v));

// Hook para usar em qualquer componente
export const useDemo = () => {
  const [demo, setDemo] = useState(isDemoMode());
  return { demo, setDemo: (v) => { setDemoMode(v); setDemo(v); } };
};

// ─────────────────────────────────────────────────────────────────────────────
// WATERMARK — marca d'água diagonal em todas as telas
// ─────────────────────────────────────────────────────────────────────────────
export const DemoWatermark = ({ enabled }) => {
  if (!enabled) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9000,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {/* Grade de marcas d'água */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          top:  `${(i % 4) * 28 + 10}%`,
          left: `${Math.floor(i / 4) * 36 - 5}%`,
          fontSize: 13,
          fontWeight: 800,
          color: "rgba(255,255,255,0.04)",
          letterSpacing: "0.2em",
          transform: "rotate(-35deg)",
          whiteSpace: "nowrap",
          userSelect: "none",
          fontFamily: "monospace",
        }}>
          DEMONSTRAÇÃO · VENDAFLOW
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BANNER FIXO NO TOPO
// ─────────────────────────────────────────────────────────────────────────────
export const DemoBanner = ({ enabled, onDesbloqueio, timeLeft }) => {
  if (!enabled) return null;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 8999,
      background: "linear-gradient(90deg, #f59e0b, #ef4444)",
      padding: "6px 16px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 6,
      boxShadow: "0 2px 12px rgba(245,158,11,.4)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13 }}>🎯</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>
          MODO DEMONSTRAÇÃO
        </span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.8)" }}>
          — dados fictícios para apresentação
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.9)", fontFamily: "monospace" }}>
          ⏱ {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
        </span>
        <button
          onClick={onDesbloqueio}
          style={{
            background: "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.3)",
            color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 12px",
            borderRadius: 6, cursor: "pointer",
          }}
        >
          🔓 Desbloquear
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DE PIN
// ─────────────────────────────────────────────────────────────────────────────
export const DemoPinModal = ({ onSuccess, onCancel, pin }) => {
  const [input, setInput] = useState("");
  const [erro, setErro]   = useState("");
  const [shake, setShake] = useState(false);

  const tentar = () => {
    if (input === pin) { onSuccess(); }
    else {
      setErro("PIN incorreto. Tente novamente.");
      setShake(true);
      setInput("");
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: 20,
    }}>
      <div style={{
        background: "#0d1117", border: "1px solid #1e293b", borderRadius: 20,
        padding: "32px 28px", width: "100%", maxWidth: 340,
        boxShadow: "0 32px 64px rgba(0,0,0,.7)",
        animation: shake ? "shake 0.4s ease" : "none",
      }}>
        <style>{`
          @keyframes shake {
            0%,100%{transform:translateX(0)}
            20%,60%{transform:translateX(-8px)}
            40%,80%{transform:translateX(8px)}
          }
        `}</style>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔐</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>
            Acesso Admin
          </div>
          <div style={{ fontSize: 12, color: "#475569" }}>
            Digite o PIN para desbloquear o sistema completo
          </div>
        </div>

        {/* PIN dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              width: 14, height: 14, borderRadius: "50%",
              background: i < input.length ? "#3b82f6" : "#1e293b",
              transition: "background .15s",
              border: "2px solid",
              borderColor: i < input.length ? "#3b82f6" : "#334155",
            }} />
          ))}
        </div>

        {/* Teclado numérico */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((n, i) => (
            <button key={i}
              onClick={() => {
                if (n === "⌫") setInput(p => p.slice(0,-1));
                else if (n !== "") {
                  const novo = (input + n).slice(0, 4);
                  setInput(novo);
                  if (novo.length === 4) {
                    setTimeout(() => {
                      if (novo === pin) onSuccess();
                      else { setErro("PIN incorreto."); setShake(true); setInput(""); setTimeout(()=>setShake(false),500); }
                    }, 150);
                  }
                }
              }}
              style={{
                height: 52, borderRadius: 10,
                background: n === "" ? "transparent" : "#1e293b",
                border: n === "" ? "none" : "1px solid #334155",
                color: "#f1f5f9", fontSize: n === "⌫" ? 18 : 20, fontWeight: 700,
                cursor: n === "" ? "default" : "pointer",
                transition: "background .1s",
              }}
              onMouseEnter={e => { if(n!=="") e.currentTarget.style.background="#2d3f55"; }}
              onMouseLeave={e => { if(n!=="") e.currentTarget.style.background="#1e293b"; }}
            >
              {n}
            </button>
          ))}
        </div>

        {erro && (
          <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, padding: "9px 12px", marginBottom: 12, fontSize: 12, color: "#fca5a5", textAlign: "center" }}>
            ⚠️ {erro}
          </div>
        )}

        <button
          onClick={onCancel}
          style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: "#1e293b", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL — DemoGuard
// Envolve toda a aplicação
// ─────────────────────────────────────────────────────────────────────────────
export default function DemoGuard({ children, enabled = false, pin = "1234", onDesbloqueio }) {
  const [ativo, setAtivo]         = useState(enabled);
  const [pinModal, setPinModal]   = useState(false);
  const [timeLeft, setTimeLeft]   = useState(DEMO_TIMEOUT_MS / 1000);
  const [unlocked, setUnlocked]   = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!ativo || unlocked) return;
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { clearInterval(t); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [ativo, unlocked]);

  // Reset inatividade ao interagir
  useEffect(() => {
    if (!ativo || unlocked) return;
    const reset = () => setTimeLeft(DEMO_TIMEOUT_MS / 1000);
    window.addEventListener("mousemove", reset);
    window.addEventListener("touchstart", reset);
    window.addEventListener("keydown", reset);
    return () => {
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("touchstart", reset);
      window.removeEventListener("keydown", reset);
    };
  }, [ativo, unlocked]);

  const handleDesbloqueio = () => setPinModal(true);

  const handlePinSucesso = () => {
    setPinModal(false);
    setAtivo(false);
    setUnlocked(true);
    onDesbloqueio?.();
  };

  // Offset no topo quando banner está ativo (evita conteúdo ficar embaixo)
  const bannerOffset = ativo && !unlocked ? 34 : 0;

  return (
    <>
      {/* Banner amarelo/vermelho no topo */}
      <DemoBanner
        enabled={ativo && !unlocked}
        onDesbloqueio={handleDesbloqueio}
        timeLeft={timeLeft}
      />

      {/* Offset do conteúdo */}
      <div style={{ paddingTop: bannerOffset }}>
        {children}
      </div>

      {/* Marca d'água */}
      <DemoWatermark enabled={ativo && !unlocked} />

      {/* Modal PIN */}
      {pinModal && (
        <DemoPinModal
          pin={pin}
          onSuccess={handlePinSucesso}
          onCancel={() => setPinModal(false)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOC — bloqueia ações em modo demo
// Uso: <DemoBlock demo={demoAtivo} msg="Demo: ação indisponível">
//        <button onClick={deletar}>Excluir</button>
//      </DemoBlock>
// ─────────────────────────────────────────────────────────────────────────────
export const DemoBlock = ({ children, demo, msg = "Indisponível no modo demonstração" }) => {
  if (!demo) return children;
  return (
    <div
      style={{ position: "relative", cursor: "not-allowed", opacity: 0.5 }}
      onClick={e => { e.stopPropagation(); e.preventDefault(); alert(`🎯 ${msg}`); }}
      title={msg}
    >
      <div style={{ pointerEvents: "none" }}>{children}</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURADOR — aba Admin para ligar/desligar modo demo
// ─────────────────────────────────────────────────────────────────────────────
export const DemoConfigPanel = ({ currentUser }) => {
  const [ativo, setAtivo]     = useState(isDemoMode());
  const [pin, setPin]         = useState(localStorage.getItem("vendaflow_demo_pin") || "1234");
  const [saved, setSaved]     = useState(false);

  if (currentUser?.perfil !== "admin") return null;

  const salvar = () => {
    setDemoMode(ativo);
    localStorage.setItem("vendaflow_demo_pin", pin);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Recarrega para aplicar
    setTimeout(() => window.location.reload(), 400);
  };

  const inpS = { background:"#111827", border:"1px solid #1e293b", borderRadius:9, padding:"11px 13px", color:"#e2e8f0", fontFamily:"inherit", outline:"none", fontSize:16 };

  return (
    <div style={{ background:"#0d1117", border:"1px solid #1e293b", borderRadius:12, overflow:"hidden" }}>
      <div style={{ padding:"12px 16px", borderBottom:"1px solid #1e293b", display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:15 }}>🎯</span>
        <span style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>Modo Demonstração</span>
      </div>
      <div style={{ padding:16 }}>
        <div style={{ fontSize:12, color:"#475569", marginBottom:14, lineHeight:1.6 }}>
          Ative para mostrar o sistema a clientes. Exibe marca d'água, banner de demo e bloqueia ações destrutivas. O PIN desbloqueia para acesso completo durante a apresentação.
        </div>

        {/* Toggle */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:"#111827", borderRadius:9, marginBottom:12 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"#f1f5f9" }}>Modo demo</div>
            <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>{ativo ? "🟠 Ativo — dados protegidos" : "⚫ Inativo — sistema normal"}</div>
          </div>
          <div onClick={()=>setAtivo(!ativo)} style={{ width:44, height:26, borderRadius:13, background:ativo?"#f59e0b":"#1e293b", cursor:"pointer", position:"relative", transition:"background .2s", flexShrink:0 }}>
            <div style={{ position:"absolute", top:3, left:ativo?21:3, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left .2s", boxShadow:"0 1px 4px rgba(0,0,0,.3)" }} />
          </div>
        </div>

        {/* PIN */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, color:"#475569", fontWeight:700, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>PIN de desbloqueio (4 dígitos)</label>
          <input
            style={{ ...inpS, width:120, textAlign:"center", letterSpacing:"0.3em", fontWeight:700 }}
            type="password" maxLength={4} inputMode="numeric"
            value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,"").slice(0,4))}
          />
        </div>

        {/* Info */}
        {ativo && (
          <div style={{ padding:"10px 14px", background:"rgba(245,158,11,.08)", border:"1px solid rgba(245,158,11,.2)", borderRadius:9, marginBottom:14 }}>
            <div style={{ fontSize:12, color:"#f59e0b", fontWeight:700, marginBottom:4 }}>Como funciona no modo demo:</div>
            <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.7 }}>
              ✅ Banner laranja no topo com timer<br/>
              ✅ Marca d'água sutil em todas as telas<br/>
              ✅ Timer reseta ao mover mouse/tocar<br/>
              ✅ PIN desbloqueia o sistema completo<br/>
              ✅ Dados fictícios visíveis normalmente
            </div>
          </div>
        )}

        <button
          onClick={salvar}
          style={{ width:"100%", padding:"12px", borderRadius:10, border:"none", background:saved?"#10b981":"#3b82f6", color:"#fff", fontFamily:"inherit", fontWeight:700, fontSize:14, cursor:"pointer", transition:"background .3s" }}
        >
          {saved ? "✅ Salvo! Recarregando..." : "💾 Salvar configurações"}
        </button>
      </div>
    </div>
  );
};
