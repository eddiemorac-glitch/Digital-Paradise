import { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    Zap,
    X,
    Settings2,
    DollarSign,
    ListChecks
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OptionValue {
    name: string;
    addPrice: number;
}

interface OptionGroup {
    name: string;
    required: boolean;
    maxSelections?: number;
    values: OptionValue[];
}

interface ProductVariationProProps {
    value: OptionGroup[];
    onChange: (value: OptionGroup[]) => void;
}

export const ProductVariationPro = ({ value, onChange }: ProductVariationProProps) => {
    const [groups, setGroups] = useState<OptionGroup[]>(value || []);

    useEffect(() => {
        setGroups(value || []);
    }, [value]);

    const updateGroups = (newGroups: OptionGroup[]) => {
        setGroups(newGroups);
        onChange(newGroups);
    };

    const addGroup = () => {
        const newGroup: OptionGroup = {
            name: '',
            required: false,
            values: [{ name: '', addPrice: 0 }]
        };
        updateGroups([...groups, newGroup]);
    };

    const removeGroup = (index: number) => {
        const newGroups = groups.filter((_, i) => i !== index);
        updateGroups(newGroups);
    };

    const updateGroup = (index: number, data: Partial<OptionGroup>) => {
        const newGroups = [...groups];
        newGroups[index] = { ...newGroups[index], ...data };
        updateGroups(newGroups);
    };

    const addValue = (groupIndex: number) => {
        const newGroups = [...groups];
        newGroups[groupIndex].values.push({ name: '', addPrice: 0 });
        updateGroups(newGroups);
    };

    const removeValue = (groupIndex: number, valueIndex: number) => {
        const newGroups = [...groups];
        newGroups[groupIndex].values = newGroups[groupIndex].values.filter((_, i) => i !== valueIndex);
        updateGroups(newGroups);
    };

    const updateValue = (groupIndex: number, valueIndex: number, data: Partial<OptionValue>) => {
        const newGroups = [...groups];
        newGroups[groupIndex].values[valueIndex] = { ...newGroups[groupIndex].values[valueIndex], ...data };
        updateGroups(newGroups);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-xl text-primary">
                        <ListChecks size={18} />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Variaciones y Extras</h4>
                        <p className="text-[8px] font-bold text-white/20 uppercase">Configura tamaños, salsas o adicionales</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={addGroup}
                    className="bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-xl transition-all flex items-center gap-2"
                >
                    <Plus size={16} />
                    <span className="text-[8px] font-black uppercase pr-1">Nuevo Grupo</span>
                </button>
            </div>

            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {groups.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-10 glass rounded-3xl border-white/5"
                        >
                            <Settings2 className="mx-auto mb-3 text-white/5" size={32} />
                            <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">Sin variaciones configuradas</p>
                        </motion.div>
                    )}
                    {groups.map((group, gIdx) => (
                        <motion.div
                            key={gIdx}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white/5 rounded-[2rem] p-6 border border-white/5 space-y-4 hover:border-white/10 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-background/50 rounded-xl">
                                    <Zap size={14} className="text-primary" />
                                </div>
                                <input
                                    className="bg-transparent border-b border-white/10 text-xs font-black uppercase tracking-widest focus:border-primary outline-none flex-1 text-white py-2"
                                    value={group.name}
                                    onChange={(e) => updateGroup(gIdx, { name: e.target.value })}
                                    placeholder="Nombre del Grupo (ej: Acompañamientos)"
                                />
                                <div className="flex items-center gap-4 px-4 border-l border-white/10">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={group.required}
                                            onChange={(e) => updateGroup(gIdx, { required: e.target.checked })}
                                            className="w-4 h-4 rounded-lg bg-white/5 border-white/10 checked:bg-primary accent-primary transition-all"
                                        />
                                        <span className="text-[8px] font-black uppercase text-white/40 group-hover:text-white transition-all">Obligatorio</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => removeGroup(gIdx)}
                                        className="text-red-500/40 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 pl-12">
                                {group.values.map((val, vIdx) => (
                                    <div key={vIdx} className="flex gap-3 animate-in slide-in-from-left-2 duration-300">
                                        <div className="flex-1 relative">
                                            <input
                                                placeholder="Nombre de la opción"
                                                className="w-full bg-white/5 rounded-xl px-4 py-3 text-[10px] outline-none text-white/70 border border-transparent focus:border-white/10 transition-all font-bold"
                                                value={val.name}
                                                onChange={(e) => updateValue(gIdx, vIdx, { name: e.target.value })}
                                            />
                                        </div>
                                        <div className="relative w-32">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">
                                                <DollarSign size={10} />
                                            </div>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                className="w-full bg-white/5 rounded-xl pl-8 pr-4 py-3 text-[10px] outline-none text-primary font-black border border-transparent focus:border-primary/20 transition-all"
                                                value={val.addPrice}
                                                onChange={(e) => updateValue(gIdx, vIdx, { addPrice: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeValue(gIdx, vIdx)}
                                            className="text-white/10 hover:text-red-400 transition-colors self-center p-2"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => addValue(gIdx)}
                                    className="text-[8px] font-black uppercase text-primary hover:text-background hover:bg-primary/20 transition-all px-4 py-2 rounded-xl border border-primary/20 flex items-center gap-2 mt-2"
                                >
                                    <Plus size={10} />
                                    <span>Agregar Opción</span>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
