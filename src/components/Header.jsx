import { Download } from 'lucide-react';

/**
 * Top header bar with branding and a single export action.
 */
export default function Header({ onExport }) {
  return (
    <header className="glass relative z-20 flex flex-shrink-0 flex-wrap items-center justify-between gap-3 overflow-hidden border-b border-white/[0.08] px-5 py-3.5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

      <div className="flex items-center gap-3.5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.1] bg-gradient-to-br from-white/[0.08] to-white/[0.02] shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
          <img src="/logo.png" alt="Tatical Board Pro" className="h-10 w-10 object-contain" />
        </div>

        <div className="min-w-0">
          <h1 className="font-display text-sm uppercase tracking-[0.34em] text-txt-primary">
            Tatical Board Pro
          </h1>
          <p className="text-xs tracking-wide text-txt-secondary">
            Analise tatica pronta para estudo, apresentacao e post.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-semibold text-white shadow-[0_0_16px_rgba(20,201,107,0.2)] transition-all duration-200 hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(20,201,107,0.3)]"
          onClick={onExport}
        >
          <Download size={14} /> EXPORTAR
        </button>
      </div>
    </header>
  );
}
