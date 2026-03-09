// ═══════════════════════════════════════════════════════════════════════════
// VendaFlow — Camada de banco de dados
// Agora:    localStorage (demo / dev)
// Produção: trocar ADAPTER para "supabase" e configurar as variáveis abaixo
// ═══════════════════════════════════════════════════════════════════════════

// ── CONFIGURAÇÃO ─────────────────────────────────────────────────────────────
export const DB_CONFIG = {
  adapter: "localStorage",           // "localStorage" | "supabase"
  supabaseUrl:  "",                  // https://xxxx.supabase.co
  supabaseKey:  "",                  // anon key pública
};

// ── SUPABASE CLIENT (lazy — só inicializa se adapter = supabase) ─────────────
let _supabase = null;
async function getSupabase() {
  if (_supabase) return _supabase;
  if (DB_CONFIG.adapter !== "supabase") return null;
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  _supabase = createClient(DB_CONFIG.supabaseUrl, DB_CONFIG.supabaseKey);
  return _supabase;
}

// ═══════════════════════════════════════════════════════════════════════════
// TABELAS / COLEÇÕES
// localStorage key   →  Supabase table name
// ═══════════════════════════════════════════════════════════════════════════
const TABLES = {
  users:     { ls: "vendaflow_users",     sb: "vf_users"     },
  leads:     { ls: "vendaflow_leads",     sb: "vf_leads"     },
  clientes:  { ls: "vendaflow_clientes",  sb: "vf_clientes"  },
  pipeline:  { ls: "vendaflow_pipeline",  sb: "vf_pipeline"  },
  financeiro:{ ls: "vendaflow_financeiro",sb: "vf_financeiro"},
  agenda:    { ls: "vendaflow_agenda",    sb: "vf_agenda"    },
  ia_config: { ls: "vendaflow_ia_config", sb: "vf_ia_config" },
  ia_convs:  { ls: "vendaflow_ia_convs",  sb: "vf_ia_convs"  },
  ia_leads:  { ls: "vendaflow_ia_leads",  sb: "vf_ia_leads"  },
};

// ═══════════════════════════════════════════════════════════════════════════
// API GENÉRICA — mesma interface independente do adapter
// ═══════════════════════════════════════════════════════════════════════════

/** Busca todos os registros de uma tabela */
export async function dbGetAll(table) {
  const t = TABLES[table];
  if (!t) throw new Error(`Tabela desconhecida: ${table}`);

  if (DB_CONFIG.adapter === "supabase") {
    const sb = await getSupabase();
    const { data, error } = await sb.from(t.sb).select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  // localStorage
  try { return JSON.parse(localStorage.getItem(t.ls) || "[]"); }
  catch { return []; }
}

/** Busca um registro por id */
export async function dbGetById(table, id) {
  const all = await dbGetAll(table);
  return all.find(r => r.id === id) || null;
}

/** Salva array completo (sobrescreve) */
export async function dbSaveAll(table, data) {
  const t = TABLES[table];
  if (!t) throw new Error(`Tabela desconhecida: ${table}`);

  if (DB_CONFIG.adapter === "supabase") {
    const sb = await getSupabase();
    // upsert em lote
    const { error } = await sb.from(t.sb).upsert(data);
    if (error) throw error;
    return data;
  }

  localStorage.setItem(t.ls, JSON.stringify(data));
  return data;
}

/** Insere um novo registro */
export async function dbInsert(table, record) {
  if (DB_CONFIG.adapter === "supabase") {
    const sb = await getSupabase();
    const t = TABLES[table];
    const { data, error } = await sb.from(t.sb).insert(record).select().single();
    if (error) throw error;
    return data;
  }

  const all = await dbGetAll(table);
  const novo = { ...record, id: record.id || Date.now() };
  await dbSaveAll(table, [novo, ...all]);
  return novo;
}

/** Atualiza um registro pelo id */
export async function dbUpdate(table, id, patch) {
  if (DB_CONFIG.adapter === "supabase") {
    const sb = await getSupabase();
    const t = TABLES[table];
    const { data, error } = await sb.from(t.sb).update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data;
  }

  const all = await dbGetAll(table);
  const updated = all.map(r => r.id === id ? { ...r, ...patch } : r);
  await dbSaveAll(table, updated);
  return updated.find(r => r.id === id);
}

/** Remove um registro pelo id */
export async function dbDelete(table, id) {
  if (DB_CONFIG.adapter === "supabase") {
    const sb = await getSupabase();
    const t = TABLES[table];
    const { error } = await sb.from(t.sb).delete().eq("id", id);
    if (error) throw error;
    return true;
  }

  const all = await dbGetAll(table);
  await dbSaveAll(table, all.filter(r => r.id !== id));
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS SÍNCRONOS (localStorage only — mantém compatibilidade imediata)
// Para migrar para Supabase, troque por chamadas async com dbGetAll/dbSaveAll
// ═══════════════════════════════════════════════════════════════════════════
export const lsGet  = (key, fallback=[]) => { try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; } catch { return fallback; } };
export const lsSet  = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// ═══════════════════════════════════════════════════════════════════════════
// MIGRAÇÃO localStorage → Supabase (utilitário)
// Chame dbMigrateToSupabase() no console após configurar supabaseUrl/Key
// ═══════════════════════════════════════════════════════════════════════════
export async function dbMigrateToSupabase() {
  console.log("[VendaFlow DB] Iniciando migração localStorage → Supabase...");
  for (const [name, t] of Object.entries(TABLES)) {
    try {
      const data = JSON.parse(localStorage.getItem(t.ls) || "[]");
      if (data.length === 0) { console.log(`  ⏩ ${name}: vazio, pulando`); continue; }
      const sb = await getSupabase();
      const { error } = await sb.from(t.sb).upsert(data);
      if (error) throw error;
      console.log(`  ✅ ${name}: ${data.length} registros migrados`);
    } catch(e) {
      console.error(`  ❌ ${name}:`, e.message);
    }
  }
  console.log("[VendaFlow DB] Migração concluída. Mude DB_CONFIG.adapter para 'supabase'.");
}

// ═══════════════════════════════════════════════════════════════════════════
// SCRIPT SQL — cola no Supabase SQL Editor para criar as tabelas
// ═══════════════════════════════════════════════════════════════════════════
export const SUPABASE_SCHEMA = `
-- Execute no Supabase SQL Editor: https://app.supabase.com → SQL Editor

create table if not exists vf_users (
  id bigint primary key,
  nome text, email text unique, senha text,
  perfil text, ativo boolean, avatar text, cor text,
  created_at timestamptz default now()
);

create table if not exists vf_leads (
  id bigint primary key,
  nome text, telefone text, email text, origem text,
  responsavel text, status text, valor numeric,
  previsao text, obs text, score text, segmento text,
  criado_por text, criado_em text,
  created_at timestamptz default now()
);

create table if not exists vf_clientes (
  id bigint primary key,
  nome text, empresa text, telefone text, email text,
  origem text, responsavel text, status text, valor numeric,
  ultima_interacao text, obs text,
  created_at timestamptz default now()
);

create table if not exists vf_pipeline (
  id bigint primary key,
  nome text, empresa text, valor numeric, coluna text,
  responsavel text, probabilidade int, proxima_acao text,
  created_at timestamptz default now()
);

create table if not exists vf_financeiro (
  id bigint primary key,
  cliente text, descricao text, valor numeric,
  vencimento text, status text, vendedor text,
  created_at timestamptz default now()
);

create table if not exists vf_agenda (
  id bigint primary key,
  cliente text, tipo text, data text, hora text,
  responsavel text, status text, obs text, resultado text,
  created_at timestamptz default now()
);

create table if not exists vf_ia_config (
  id text primary key default 'singleton',
  config jsonb,
  updated_at timestamptz default now()
);

create table if not exists vf_ia_convs (
  id bigint primary key,
  numero text, nome text, status text, score text,
  msgs jsonb, lead_criado boolean, lead_id bigint,
  ultima_mensagem text, analise jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists vf_ia_leads (
  id bigint primary key,
  nome text, telefone text, email text, origem text,
  responsavel text, status text, valor numeric,
  obs text, score text, segmento text, plano_sugerido text,
  criado_por text, criado_em text, convertido boolean default false,
  created_at timestamptz default now()
);

-- Row Level Security (habilite em produção!)
-- alter table vf_users    enable row level security;
-- alter table vf_leads    enable row level security;
-- (repita para todas as tabelas)
`;
