import { Save, Download } from 'lucide-react';

/**
 * Top header bar with app branding, save, and export buttons.
 */
export default function Header({ onSave, onExport }) {
  return (
    <header className="glass flex items-center justify-between px-4 py-2 z-20 flex-shrink-0 border-b border-white/[0.08]">
      <div className="flex items-center gap-2.5">
        <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
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
          <Download size={14} /> Exportar PNG
        </button>
      </div>
    </header>
  );
}
