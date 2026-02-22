import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Mail } from "lucide-react";

const CATEGORIES = [
  { id: "SPD", label: "SPD", color: "bg-red-100 text-red-800" },
  { id: "Materials", label: "Materials", color: "bg-blue-100 text-blue-800" },
  { id: "Scheduling", label: "Scheduling", color: "bg-amber-100 text-amber-800" },
  { id: "Nursing", label: "Nursing", color: "bg-purple-100 text-purple-800" },
];

export default function ContactsManagerModal({ open, onClose, onSave }) {
  const [contacts, setContacts] = useState({
    SPD: [],
    Materials: [],
    Scheduling: [],
    Nursing: [],
  });
  const [expandedCategory, setExpandedCategory] = useState("SPD");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const addContact = (category) => {
    if (!newEmail.trim()) return;
    
    setContacts((prev) => ({
      ...prev,
      [category]: [
        ...prev[category],
        {
          name: newName.trim() || undefined,
          email: newEmail.trim(),
        },
      ],
    }));
    setNewName("");
    setNewEmail("");
  };

  const removeContact = (category, index) => {
    setContacts((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    onSave(contacts);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Alert Contacts</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 max-h-96 overflow-y-auto">
          {CATEGORIES.map((category) => (
            <div key={category.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge className={category.color}>{category.label}</Badge>
                <span className="text-xs text-slate-500">{contacts[category.id].length} contact{contacts[category.id].length !== 1 ? "s" : ""}</span>
              </div>

              {/* Existing contacts */}
              <div className="space-y-2 mb-4">
                {contacts[category.id].map((contact, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                    <div className="flex-1 min-w-0">
                      {contact.name && (
                        <div className="text-xs font-semibold text-slate-700">{contact.name}</div>
                      )}
                      <div className="text-xs text-slate-600 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {contact.email}
                      </div>
                    </div>
                    <button
                      onClick={() => removeContact(category.id, idx)}
                      className="ml-2 p-1 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new contact */}
              {expandedCategory === category.id ? (
                <div className="space-y-2 border-t border-slate-200 pt-3">
                  <input
                    type="text"
                    placeholder="Name (optional)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => addContact(category.id)}
                      className="flex-1 text-xs font-semibold bg-teal-600 text-white px-2 py-1.5 rounded hover:bg-teal-700 transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setExpandedCategory(null);
                        setNewName("");
                        setNewEmail("");
                      }}
                      className="flex-1 text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-1.5 rounded hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setExpandedCategory(category.id)}
                  className="w-full text-xs font-semibold text-teal-600 py-1.5 hover:bg-teal-50 rounded transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Contact
                </button>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">Save Contacts</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}