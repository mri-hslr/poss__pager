import { useState, useEffect } from "react";

export default function AdminSettingsModal({ open, onClose }) {
  const [upiId, setUpiId] = useState("");
  const [payeeName, setPayeeName] = useState("");

  const token = localStorage.getItem("auth_token");
  const API = "http://localhost:3000";

  useEffect(() => {
    if (!open) return;

    fetch(`${API}/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setUpiId(data.upi_id || "");
        setPayeeName(data.payee_name || "");
      })
      .catch(console.error);
  }, [open]);

  async function save() {
    await fetch(`${API}/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ upiId, payeeName })
    });

    alert("Saved");
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded w-96">
        <h2 className="font-bold mb-4">Payment Settings</h2>

        <input
          value={upiId}
          onChange={e => setUpiId(e.target.value)}
          placeholder="UPI ID"
          className="border p-2 w-full mb-3"
        />

        <input
          value={payeeName}
          onChange={e => setPayeeName(e.target.value)}
          placeholder="Payee Name"
          className="border p-2 w-full mb-3"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Cancel</button>
          <button onClick={save} className="bg-black text-white px-3 py-1">Save</button>
        </div>
      </div>
    </div>
  );
}