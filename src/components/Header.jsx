import { Download, Save } from 'lucide-react';

/**
 * Top header bar with branding and export actions.
 */
export default function Header({ onSave, onExport }) {
  return (
    <header className="glass relative z-20 flex flex-shrink-0 flex-wrap items-center justify-between gap-3 overflow-hidden border-b border-white/[0.08] px-4 py-3">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/80 to-transparent" />

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
          <img src="/logo.png" alt="Tactical Board" className="h-10 w-10 object-contain" />
        </div>

        <div className="min-w-0">
          <h1 className="font-display text-sm uppercase tracking-[0.34em] text-txt-primary">
            Tactical Board
          </h1>
          <p className="text-xs text-txt-secondary">
            Analise tatica pronta para estudo, apresentacao e post.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-txt-secondary transition-all duration-200 hover:bg-white/10"
          onClick={onSave}
        >
          <Save size={14} /> Salvar
        </button>

        <button
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-txt-primary transition-all duration-200 hover:bg-white/10"
          onClick={() => onExport('png')}
        >
          <Download size={14} /> PNG
        </button>

        <button
          className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs text-white transition-all duration-200 hover:bg-accent-hover"
          onClick={() => onExport('jpg')}
        >
          <Download size={14} /> JPG
        </button>
      </div>
    </header>
  );
}
