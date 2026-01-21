import React, { useState } from 'react';
import { X, Trash2, Plus, User, Shield, Key } from 'lucide-react';

export default function UserManagementModal({ 
  isOpen, 
  onClose, 
  users, 
  onAddUser, 
  onDeleteUser, 
  currentUser,
  theme 
}) {
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'employee' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newUser.username && newUser.password) {
      onAddUser({ ...newUser, id: Date.now() });
      setNewUser({ name: '', username: '', password: '', role: 'employee' }); // Reset form
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Container */}
      <div className={`relative ${theme.bgCard} w-full max-w-3xl p-6 rounded-2xl shadow-2xl mx-4 flex flex-col max-h-[90vh] border ${theme.border}`}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 shrink-0 border-b pb-4 border-slate-700/30">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2"><Shield className="text-blue-500" size={24}/> User Management</h2>
            <p className={`text-sm ${theme.textSec} mt-1`}>Manage access and permissions for your staff.</p>
          </div>
          <button onClick={onClose} className={`p-2 ${theme.bgHover} rounded-full transition-colors`}><X size={20}/></button>
        </div>

        {/* User List Table */}
        <div className="flex-1 overflow-y-auto mb-6 pr-2">
          <table className="w-full text-sm text-left border-collapse">
            <thead className={`${theme.textSec} border-b ${theme.border} uppercase text-xs sticky top-0 ${theme.bgCard} z-10`}>
              <tr>
                <th className="py-3 pl-2 font-semibold tracking-wider">Name</th>
                <th className="py-3 font-semibold tracking-wider">Username</th>
                <th className="py-3 font-semibold tracking-wider">Role</th>
                <th className="py-3 pr-2 text-right font-semibold tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map(u => (
                <tr key={u.id} className={`group ${theme.bgHover} transition-colors`}>
                  <td className="py-3 pl-2 font-medium flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    {u.name}
                  </td>
                  <td className={`py-3 ${theme.textSec}`}>{u.username}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                      {u.role === 'admin' && <Shield size={10} />}
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 pr-2 text-right">
                    {u.username.toLowerCase() !== 'admin' && u.id !== currentUser.id ? (
                      <button 
                        onClick={() => onDeleteUser(u.id)} 
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-70 hover:opacity-100"
                        title="Remove User"
                      >
                        <Trash2 size={16}/>
                      </button>
                    ) : (
                      <span className="text-xs text-stone-400 italic pr-2">Protected</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add User Form Section */}
        <div className={`p-5 ${theme.inputBg} rounded-xl border ${theme.border} shrink-0 shadow-inner`}>
          <h3 className="font-bold mb-4 text-sm flex items-center gap-2"><Plus size={16} className="text-green-500"/> Add New User</h3>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
            
            {/* Name Input */}
            <div className="md:col-span-3">
              <input 
                required 
                placeholder="Full Name" 
                value={newUser.name} 
                onChange={e => setNewUser({...newUser, name: e.target.value})} 
                className={`w-full px-3 py-2.5 rounded-lg border ${theme.border} bg-white dark:bg-black/20 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all`} 
              />
            </div>

            {/* Username Input */}
            <div className="md:col-span-3 relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none"/>
              <input 
                required 
                placeholder="Username" 
                value={newUser.username} 
                onChange={e => setNewUser({...newUser, username: e.target.value})} 
                className={`w-full pl-9 pr-3 py-2.5 rounded-lg border ${theme.border} bg-white dark:bg-black/20 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all`} 
              />
            </div>

            {/* Password Input */}
            <div className="md:col-span-3 relative">
              <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none"/>
              <input 
                required 
                type="text" 
                placeholder="Password" 
                value={newUser.password} 
                onChange={e => setNewUser({...newUser, password: e.target.value})} 
                className={`w-full pl-9 pr-3 py-2.5 rounded-lg border ${theme.border} bg-white dark:bg-black/20 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all`} 
              />
            </div>

            {/* Role & Button */}
            <div className="md:col-span-3 flex gap-2">
              <select 
                value={newUser.role} 
                onChange={e => setNewUser({...newUser, role: e.target.value})} 
                className={`px-2 py-2.5 rounded-lg border ${theme.border} bg-white dark:bg-black/20 outline-none text-sm flex-1 cursor-pointer`}
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
              
              <button 
                type="submit" 
                className={`px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all font-bold text-sm flex items-center justify-center`}
              >
                Add
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}