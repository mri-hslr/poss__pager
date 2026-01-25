import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';

export default function MenuItemModal({ isOpen, onClose, onSave, onDelete, itemToEdit, categories, isDarkMode }) {
  if (!isOpen) return null;

  const [form, setForm] = useState({ name: '', price: '', category: 'General' });

  // Populate form if editing, otherwise reset
  useEffect(() => {
    if (itemToEdit) {
      setForm({
        name: itemToEdit.name,
        price: itemToEdit.price,
        category: itemToEdit.category || 'General',
      });
    } else {
      setForm({ name: '', price: '', category: 'General' });
    }
  }, [itemToEdit, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ 
        ...form, 
        price: Number(form.price)
    });
  };

  const theme = {
    bgCard: isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-stone-900',
    input: isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-stone-50 border-stone-200',
    border: isDarkMode ? 'border-slate-800' : 'border-stone-200',
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-md ${theme.bgCard} rounded-xl shadow-2xl overflow-hidden`}>
        
        <div className={`p-4 border-b ${theme.border} flex justify-between items-center`}>
          <h2 className="font-bold text-lg">{itemToEdit ? 'Edit Item' : 'Add New Item'}</h2>
          <button onClick={onClose} className="p-1 hover:opacity-70"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1 opacity-70">ITEM NAME</label>
            <input 
              required
              className={`w-full p-2 border rounded-lg outline-none ${theme.input}`}
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="e.g. Butter Chicken"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 opacity-70">PRICE (₹)</label>
            <input 
              required
              type="number"
              className={`w-full p-2 border rounded-lg outline-none ${theme.input}`}
              value={form.price}
              onChange={e => setForm({...form, price: e.target.value})}
              placeholder="0"
            />
          </div>

          <div>
             <label className="block text-xs font-bold mb-1 opacity-70">CATEGORY</label>
             <div className="flex gap-2 flex-wrap mb-2">
                {categories.map(cat => (
                    <button 
                        type="button"
                        key={cat}
                        onClick={() => setForm({...form, category: cat})}
                        className={`px-3 py-1 rounded text-xs border ${form.category === cat ? 'bg-blue-600 text-white border-blue-600' : `${theme.border} opacity-70`}`}
                    >
                        {cat}
                    </button>
                ))}
             </div>
             <input 
                className={`w-full p-2 border rounded-lg outline-none ${theme.input}`}
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
                placeholder="Or type custom category..."
             />
          </div>

          <div className={`pt-4 border-t ${theme.border} flex gap-3`}>
             {itemToEdit && (
                 <button 
                    type="button" 
                    onClick={onDelete}
                    className="p-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                 >
                    <Trash2 size={20}/>
                 </button>
             )}
             <button 
                type="submit" 
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2"
             >
                <Save size={18}/> Save Item
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}