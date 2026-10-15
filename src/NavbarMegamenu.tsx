// NavbarMegamenu · Criado por FlowCore Soluções LTDA · flowcoresolucoes.com.br/codigos · licença MIT
// Barra de navegação com mega menu (abre por hover, clique ou teclado, fecha com
// Esc e clique fora) e gaveta lateral no celular com menu hambúrguer.
// Props: tema ("claro" padrão | "escuro"), accent, marca, menus, cta, mostrarCorpo.
// Requisitos: React 18+ e Tailwind CSS 3+. Zero dependências.

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

type ItemMega = { titulo: string; texto: string; href: string };
type Menu = { rotulo: string; href?: string; colunas?: { titulo: string; itens: ItemMega[] }[]; destaque?: { titulo: string; texto: string; href: string } };

type Tema = "claro" | "escuro";

type Props = {
  /** Tema visual. Padrão "claro". */
  tema?: Tema;
  /** Cor de destaque (qualquer cor CSS). */
  accent?: string;
  marca?: string;
  menus?: Menu[];
  cta?: { label: string; href: string };
  /** Mostra um corpo de página fictício abaixo da barra (útil no preview). */
  mostrarCorpo?: boolean;
};

// Paleta do tema aplicada como CSS vars na raiz (não depende do tailwind.config).
// --fc-panel é opaco (painel do mega menu e gaveta); --fc-header é a barra translúcida.
const TEMAS: Record<Tema, Record<string, string>> = {
  claro: {
    "--fc-bg": "#F7F8FB", "--fc-surface": "#FFFFFF", "--fc-surface-2": "#F1F4F9",
    "--fc-border": "#E3E8F0", "--fc-border-strong": "#CBD3E1",
    "--fc-text": "#0B1220", "--fc-muted": "#4B5565", "--fc-subtle": "#8A94A6",
    "--fc-pos": "#059669", "--fc-neg": "#E11D48", "--fc-warn": "#D97706",
    "--fc-shadow": "0 1px 2px rgba(16,24,40,.06), 0 12px 32px -16px rgba(16,24,40,.18)",
    "--fc-panel": "#FFFFFF", "--fc-header": "rgba(255,255,255,0.80)", "--fc-soft": "#334155",
    "--fc-panel-shadow": "0 24px 48px -20px rgba(16,24,40,.22)", "--fc-glow": "0.10",
  },
  escuro: {
    "--fc-bg": "#0B0F17", "--fc-surface": "rgba(255,255,255,0.03)", "--fc-surface-2": "rgba(255,255,255,0.06)",
    "--fc-border": "rgba(255,255,255,0.10)", "--fc-border-strong": "rgba(255,255,255,0.25)",
    "--fc-text": "#FFFFFF", "--fc-muted": "rgba(255,255,255,0.60)", "--fc-subtle": "rgba(255,255,255,0.40)",
    "--fc-pos": "#34D399", "--fc-neg": "#FB7185", "--fc-warn": "#FBBF24",
    "--fc-shadow": "0 24px 48px -24px rgba(0,0,0,.6)",
    "--fc-panel": "#0D121C", "--fc-header": "rgba(11,15,23,0.80)", "--fc-soft": "rgba(255,255,255,0.70)",
    "--fc-panel-shadow": "0 25px 50px -12px rgba(0,0,0,.5)", "--fc-glow": "0.12",
  },
};

const CORES = ["var(--accent)", "#7C3AED", "#10B981", "#F59E0B", "#EC4899", "#06B6D4"];

const PADRAO: Menu[] = [
  {
    rotulo: "Soluções",
    colunas: [
      {
        titulo: "Por área",
        itens: [
          { titulo: "Financeiro", texto: "Conciliação, cobrança e DRE automáticos", href: "#financeiro" },
          { titulo: "Comercial", texto: "Funil, propostas e comissões", href: "#comercial" },
          { titulo: "Operações", texto: "Pedidos, estoque e expedição", href: "#operacoes" },
        ],
      },
      {
        titulo: "Por setor",
        itens: [
          { titulo: "Indústria", texto: "Ordem de produção e custos", href: "#industria" },
          { titulo: "Saúde", texto: "Agenda, convênios e LGPD", href: "#saude" },
          { titulo: "Serviços B2B", texto: "Contratos e faturamento recorrente", href: "#servicos" },
        ],
      },
    ],
    destaque: { titulo: "Estudo de caso: Grupo Sena", texto: "Fechamento do mês caiu de 9 para 2 dias.", href: "#caso" },
  },
  {
    rotulo: "Recursos",
    colunas: [
      {
        titulo: "Aprender",
        itens: [
          { titulo: "Blog", texto: "Gestão e automação na prática", href: "#blog" },
          { titulo: "Calculadora de ROI", texto: "Quanto você economiza", href: "#roi" },
          { titulo: "Webinars", texto: "Encontros mensais ao vivo", href: "#webinars" },
        ],
      },
    ],
    destaque: { titulo: "Guia de automação 2026", texto: "E-book gratuito com 40 processos prontos.", href: "#guia" },
  },
  { rotulo: "Preços", href: "#precos" },
  { rotulo: "Clientes", href: "#clientes" },
];

const Seta = ({ aberto }: { aberto: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden className={`transition-transform duration-200 ${aberto ? "rotate-180" : ""}`}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export default function NavbarMegamenu({ tema = "claro", accent = "#0057FF", marca = "Vértice", menus = PADRAO, cta = { label: "Agendar demonstração", href: "#contato" }, mostrarCorpo = true }: Props) {
  const id = useId();
  const escuro = tema === "escuro";
  const raiz = useRef<HTMLElement>(null);
  const [aberto, setAberto] = useState<number | null>(null);
  const [gaveta, setGaveta] = useState(false);
  const [sub, setSub] = useState<number | null>(null);
  const botoes = useRef<(HTMLButtonElement | null)[]>([]);
  const fechar = useRef<ReturnType<typeof setTimeout>>();

  // Clique fora: usa o document do próprio elemento (funciona dentro de iframe/portal).
  useEffect(() => {
    const doc = raiz.current?.ownerDocument;
    if (!doc || aberto === null) return;
    const fora = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(null);
    };
    doc.addEventListener("mousedown", fora);
    return () => doc.removeEventListener("mousedown", fora);
  }, [aberto]);

  useEffect(() => () => clearTimeout(fechar.current), []);

  const entrar = (i: number) => {
    clearTimeout(fechar.current);
    setAberto(i);
  };
  const sair = () => {
    fechar.current = setTimeout(() => setAberto(null), 150);
  };

  const teclas = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape") {
      if (aberto !== null) {
        const i = aberto;
        setAberto(null);
        botoes.current[i]?.focus();
      }
      setGaveta(false);
    }
  };

  const menuAtual = aberto !== null ? menus[aberto] : null;

  return (
    <div style={{ ...TEMAS[tema], "--accent": accent } as CSSProperties} className="relative isolate min-h-[32rem] overflow-hidden bg-[var(--fc-bg)] text-[var(--fc-text)]">
      <header ref={raiz} onKeyDown={teclas} className="relative z-30 border-b border-[var(--fc-border)] bg-[var(--fc-header)] backdrop-blur-xl">
        <nav aria-label="Principal" className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-6 lg:px-8">
          <a href="#inicio" className="flex items-center gap-2 font-semibold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)] text-xs font-bold text-white">{marca[0]}</span>
            {marca}
          </a>

          <ul className="hidden items-center gap-1 lg:flex">
            {menus.map((m, i) => (
              <li key={m.rotulo} onMouseEnter={() => m.colunas && entrar(i)} onMouseLeave={() => m.colunas && sair()}>
                {m.colunas ? (
                  <button
                    ref={(el) => {
                      botoes.current[i] = el;
                    }}
                    type="button"
                    aria-expanded={aberto === i}
                    aria-controls={`${id}-painel`}
                    onClick={() => setAberto(aberto === i ? null : i)}
                    className={`flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${aberto === i ? "bg-[var(--fc-surface-2)] text-[var(--fc-text)]" : "text-[var(--fc-muted)] hover:text-[var(--fc-text)]"}`}
                  >
                    {m.rotulo}
                    <Seta aberto={aberto === i} />
                  </button>
                ) : (
                  <a href={m.href} className="flex h-9 items-center rounded-full px-3.5 text-sm text-[var(--fc-muted)] transition-colors hover:text-[var(--fc-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]">
                    {m.rotulo}
                  </a>
                )}
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-3">
            <a href="#entrar" className="hidden text-sm text-[var(--fc-muted)] transition-colors hover:text-[var(--fc-text)] sm:block">Entrar</a>
            <a href={cta.href} className="hidden h-9 items-center rounded-full bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:inline-flex">
              {cta.label}
            </a>
            <button type="button" aria-label={gaveta ? "Fechar menu" : "Abrir menu"} aria-expanded={gaveta} aria-controls={`${id}-gaveta`} onClick={() => setGaveta(!gaveta)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--fc-border)] lg:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                {gaveta ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </nav>

        {/* Painel do mega menu (desktop) */}
        {menuAtual?.colunas && (
          <div id={`${id}-painel`} onMouseEnter={() => aberto !== null && entrar(aberto)} onMouseLeave={sair} className="absolute inset-x-0 top-full hidden border-b border-[var(--fc-border)] bg-[var(--fc-panel)] shadow-[var(--fc-panel-shadow)] lg:block motion-safe:animate-[megaIn_.18s_ease-out]">
            <div className="mx-auto grid max-w-7xl gap-8 px-8 py-8" style={{ gridTemplateColumns: `repeat(${menuAtual.colunas.length}, minmax(0,1fr)) 18rem` }}>
              {menuAtual.colunas.map((c, ci) => (
                <div key={c.titulo}>
                  <p className="px-3 text-[11px] font-medium uppercase tracking-[0.15em] text-[var(--fc-subtle)]">{c.titulo}</p>
                  <ul className="mt-3 space-y-1">
                    {c.itens.map((it, ii) => (
                      <li key={it.titulo}>
                        <a href={it.href} onClick={() => setAberto(null)} className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--fc-surface-2)] focus-visible:bg-[var(--fc-surface-2)] focus-visible:outline-none">
                          <span className="flex items-center gap-2 text-sm font-medium">
                            {!escuro && <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: CORES[(ci * 3 + ii) % CORES.length] }} />}
                            {it.titulo}
                          </span>
                          <span className={`block text-xs text-[var(--fc-muted)] ${escuro ? "" : "pl-3.5"}`}>{it.texto}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {menuAtual.destaque && (
                <a href={menuAtual.destaque.href} className={`group relative overflow-hidden rounded-2xl border border-[var(--fc-border)] p-5 transition-colors hover:border-[var(--fc-border-strong)] ${escuro ? "bg-[var(--fc-surface)]" : "bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_10%,#FFFFFF),color-mix(in_srgb,#7C3AED_8%,#FFFFFF))] shadow-[var(--fc-shadow)]"} focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]`}>
                  <span aria-hidden className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--accent)] ${escuro ? "opacity-30" : "opacity-20"} blur-2xl`} />
                  <span className="relative block text-[11px] font-medium uppercase tracking-[0.15em] text-[var(--accent)]">Destaque</span>
                  <span className="relative mt-2 block font-semibold tracking-tight">{menuAtual.destaque.titulo}</span>
                  <span className="relative mt-1 block text-sm text-[var(--fc-muted)]">{menuAtual.destaque.texto}</span>
                  <span className="relative mt-4 block text-sm font-medium text-[var(--fc-soft)] group-hover:text-[var(--accent)]">Ler agora →</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Gaveta (celular) */}
        <div id={`${id}-gaveta`} hidden={!gaveta} className="absolute inset-x-0 top-full h-[calc(32rem-4rem)] overflow-y-auto border-b border-[var(--fc-border)] bg-[var(--fc-panel)] px-6 py-4 lg:hidden">
          <ul className="divide-y divide-[var(--fc-border)]">
            {menus.map((m, i) => (
              <li key={m.rotulo} className="py-1">
                {m.colunas ? (
                  <>
                    <button type="button" aria-expanded={sub === i} onClick={() => setSub(sub === i ? null : i)} className="flex h-12 w-full items-center justify-between text-left text-base font-medium focus-visible:outline-none focus-visible:text-[var(--accent)]">
                      {m.rotulo}
                      <Seta aberto={sub === i} />
                    </button>
                    {sub === i && (
                      <ul className="pb-3">
                        {m.colunas.flatMap((c) => c.itens).map((it) => (
                          <li key={it.titulo}>
                            <a href={it.href} onClick={() => setGaveta(false)} className="block rounded-lg px-3 py-2 text-sm text-[var(--fc-soft)] hover:bg-[var(--fc-surface-2)] hover:text-[var(--fc-text)]">{it.titulo}</a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <a href={m.href} onClick={() => setGaveta(false)} className="flex h-12 items-center text-base font-medium">{m.rotulo}</a>
                )}
              </li>
            ))}
          </ul>
          <a href={cta.href} onClick={() => setGaveta(false)} className="mt-6 flex h-12 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white">{cta.label}</a>
        </div>
      </header>

      {mostrarCorpo && (
        <main className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-[var(--accent)] opacity-[var(--fc-glow)] blur-[120px]" />
          {!escuro && <div aria-hidden className="pointer-events-none absolute right-0 top-24 -z-10 h-64 w-64 rounded-full bg-[#06B6D4] opacity-[0.10] blur-[100px]" />}
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--fc-subtle)]">Corpo da página</p>
          <h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">Passe o mouse em Soluções ou Recursos</h1>
          <p className="mt-4 max-w-xl text-[var(--fc-muted)]">No celular, toque no ícone de menu. Teclado: Tab até o item, Enter abre e Esc fecha.</p>
        </main>
      )}

      <p className="absolute inset-x-0 bottom-4 text-center text-[11px] text-[var(--fc-subtle)]">
        <a href="https://flowcoresolucoes.com.br/codigos" target="_blank" rel="noopener" className="transition-colors hover:text-[var(--fc-text)]">
          Criado por FlowCore Soluções LTDA
        </a>
      </p>

      <style>{`@keyframes megaIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
