"use client";

import { Download, Upload } from "lucide-react";
import { useScriptStore } from "../store/useScriptStore";
import { useRef } from "react";

export function DatabaseActions() {
    const { scripts, setScripts } = useScriptStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const dataStr = JSON.stringify(scripts, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `dojo_roteiros_backup_${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (Array.isArray(json)) {
                    setScripts(json);
                    alert("Database importada com sucesso!");
                }
            } catch (err) {
                alert("Erro ao importar database. Verifique o formato do arquivo.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex gap-2">
            <button 
                onClick={handleExport}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white/40 hover:text-white transition-all"
                title="Exportar Database"
            >
                <Download size={18} />
            </button>
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white/40 hover:text-white transition-all"
                title="Importar Database"
            >
                <Upload size={18} />
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImport} 
                accept=".json" 
                className="hidden" 
            />
        </div>
    );
}
