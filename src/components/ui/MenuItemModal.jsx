import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, Save } from 'lucide-react';

export default function MenuItemModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  itemToEdit, 
  theme, 
  categories 
}) {
  const [formData, setFormData] = useState({ name: '', price: '', category: categories[0], image: null });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (itemToEdit) {
      setFormData({ name: itemToEdit.name, price: itemToEdit.price, category: itemToEdit.category || categories[0], image: itemToEdit.image });
      setPreview(itemToEdit.image);
    } else {
      setFormData({ name: '', price: '', category: categories[0], image: null });
      setPreview(null);
    }
  }, [itemToEdit, isOpen, categories]);

  // --- NEW IMAGE HANDLING LOGIC ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create a FileReader to read the file
      const reader = new FileReader();
      
      // When reading is complete, get the result
      reader.onloadend = () => {
        const base64String = reader.result;
        setPreview(base64String); // Show preview
        setFormData({ ...formData, image: base64String }); // Save the Base64 string
      };
      
      // Read the file as a Data URL (Base64)
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, id: itemToEdit?.id || Date.now() });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative ${theme.bgCard} w-full max-w-md p-6 rounded-2xl shadow-2xl mx-4`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{itemToEdit ? 'Edit Dish' : 'Add New Dish'}</h2>
          <button onClick={onClose} className={`p-2 ${theme.bgHover} rounded-full`}><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center mb-4">
            <label className={`w-32 h-32 rounded-xl border-2 border-dashed ${theme.border} flex flex-col items-center justify-center cursor-pointer overflow-hidden relative hover:border-blue-500 transition-colors`}>
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <><Upload size={24} className={theme.textSec}/><span className={`text-xs mt-2 ${theme.textSec}`}>Upload Image</span></>
              )}
              {/* Added 'accept' attribute to restrict to images */}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-stone-400">Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full p-2 rounded-lg border ${theme.border} ${theme.inputBg} outline-none focus:ring-2 focus:ring-blue-500`} placeholder="Dish Name" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-stone-400">Price (₹)</label>
              <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={`w-full p-2 rounded-lg border ${theme.border} ${theme.inputBg} outline-none focus:ring-2 focus:ring-blue-500`} placeholder="100" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-stone-400">Category</label>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={`w-full p-2 rounded-lg border ${theme.border} ${theme.inputBg} outline-none`}>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            {itemToEdit && (
              <button type="button" onClick={() => { onDelete(itemToEdit.id); onClose(); }} className="flex-1 py-3 bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-200">
                <Trash2 size={18}/> Delete
              </button>
            )}
            <button type="submit" className={`flex-[2] py-3 ${theme.accent} text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90`}>
              <Save size={18}/> {itemToEdit ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}