import React, { useState } from 'react';
import { X, Trash2, UserPlus, Shield } from 'lucide-react';

export default function UserManagementModal({ 
  isOpen, 
  onClose, 
  users = [], 
  onAddUser, 
  onDeleteUser, 
  currentUser, 
  theme = {} 
}) {
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'cashier' });

  // 1. If closed, render nothing
  if (!isOpen) return null;

  // 2. Safe Theme Fallbacks (Prevents Transparent Box)
  const bgCard = theme.bgCard || 'bg-white';
  const textMain = theme.textMain || 'text-black';
  const textSec = theme.textSec || 'text-gray-500';
  const border = theme.border || 'border-gray-200';
  const bgHover = theme.bgHover || 'bg-gray-50';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newUser.name && newUser.email && newUser.password) {
      onAddUser({ ...newUser });
      setNewUser({ name: '', email: '', password: '', role: 'cashier' });
    }
  };

  return (
    // BACKDROP: Force high Z-Index
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      
      {/* MODAL WINDOW: Force white background to be visible */}
      <div className={`${bgCard} w-full max-w-2xl rounded-2xl shadow-2xl border ${border} flex flex-col max-h-[90vh] z-[10000] relative`}>
        
        {/* HEADER */}
        <div className={`p-6 border-b ${border} flex justify-between items-center`}>
          <div>
            <h2 className={`text-xl font-bold ${textMain} flex items-center gap-2`}>
              <Shield className="w-6 h-6 text-blue-600" />
              User Management
            </h2>
            <p className={`text-sm ${textSec}`}>Manage staff access and roles</p>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-full ${bgHover} transition-colors`}
          >
            <X size={24} className={textSec} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* ADD USER FORM */}
          <div className={`p-4 rounded-xl border ${border} ${theme.bgMain || 'bg-gray-50'}`}>
            <h3 className={`font-bold ${textMain} mb-4 flex items-center gap-2`}>
              <UserPlus size={18} /> Add New Staff
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                placeholder="Full Name" 
                value={newUser.name}
                onChange={e => setNewUser({...newUser, name: e.target.value})}
                className={`p-2 rounded-lg border ${border} ${bgCard} ${textMain} outline-none focus:ring-2 focus:ring-blue-500`}
                required 
              />
              <input 
                placeholder="Email" 
                type="email"
                value={newUser.email}
                onChange={e => setNewUser({...newUser, email: e.target.value})}
                className={`p-2 rounded-lg border ${border} ${bgCard} ${textMain} outline-none focus:ring-2 focus:ring-blue-500`}
                required 
              />
              <input 
                placeholder="Password" 
                type="password"
                value={newUser.password}
                onChange={e => setNewUser({...newUser, password: e.target.value})}
                className={`p-2 rounded-lg border ${border} ${bgCard} ${textMain} outline-none focus:ring-2 focus:ring-blue-500`}
                required 
              />
              <select 
                value={newUser.role}
                onChange={e => setNewUser({...newUser, role: e.target.value})}
                className={`p-2 rounded-lg border ${border} ${bgCard} ${textMain} outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
              >
                <option value="cashier">Cashier</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </select>
              
              <button className="md:col-span-2 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                Add User
              </button>
            </form>
          </div>

          {/* USER LIST */}
          <div>
            <h3 className={`font-bold ${textMain} mb-4`}>Current Staff</h3>
            <div className="space-y-3">
              {/* SAFETY CHECK: Ensure users is an array before mapping */}
              {Array.isArray(users) && users.length > 0 ? (
                users.map((u, index) => (
                  <div key={u.id || index} className={`flex items-center justify-between p-4 rounded-xl border ${border} ${bgHover}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${u.role === 'admin' ? 'bg-purple-600' : 'bg-gray-500'}`}>
                        {(u.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className={`font-bold ${textMain}`}>{u.name} {currentUser?.email === u.email && '(You)'}</p>
                        <p className={`text-xs ${textSec}`}>{u.email} • <span className="uppercase">{u.role}</span></p>
                      </div>
                    </div>
                    
                    {/* Delete Button (Hide for self) */}
                    {currentUser?.email !== u.email && (
                      <button 
                        onClick={() => onDeleteUser(u.id)}
                        className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors"
                        title="Remove User"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className={`text-center py-8 ${textSec}`}>
                  {Array.isArray(users) ? "No users found." : "Loading users..."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}