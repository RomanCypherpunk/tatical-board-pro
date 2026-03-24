import { Save, Download } from 'lucide-react';

/**
 * Top header bar with app branding, save, and export buttons.
 */
export default function Header({ onSave, onExport }) {
  return (
    <header className="glass flex items-center justify-between px-4 py-2 z-20 flex-shrink-0 border-b border-white/[0.08]">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            <path d="M2 12h20" />
          </svg>
        </div>
        <h1 className="font-display font-bold text-sm tracking-wide text-txt-primary">
          TACTICAL BOARD
        </h1>
        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent">PRO</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/10 text-txt-secondary"
          onClick={onSave}
        >
          <Save size={14} /> Salvar
        </button>
        <button
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer bg-accent text-white hover:bg-accent-hover"
          onClick={onExport}
        >
          <Download size={14} /> Exportar SVG
        </button>
      </div>
    </header>
  );
}
