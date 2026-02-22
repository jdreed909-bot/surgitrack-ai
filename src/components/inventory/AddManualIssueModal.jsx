import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Mail } from "lucide-react";

const CATEGORIES = ["Materials", "Scheduling", "SPD", "OR"];
const SEVERITY_OPTIONS = ["Critical", "High", "Medium", "Low"];

export default function AddManualIssueModal({ open, onClose, onCreated, defaultDate, defaultSurgeon }) {
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [message, setMessage] = useState("");
  const [surgeon, setSurgeon] = useState(defaultSurgeon || "");
  const [issueDate, setIssueDate] = useState(defaultDate || "");
  const [contacts, setContacts] = useState([]);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAddContact = () => {
    if (!contactEmail.trim()) return;
    setContacts([...contacts, { name: contactName, email: contactEmail }]);
    setContactName("");
    setContactEmail("");
  };

  const handleRemoveContact = (idx) => {
    setContacts(contacts.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!category || !message.trim()) return;
    setSaving(true);
    await base44.entities.Alert.create({
      type: category,
      severity,
      message,
      points_of_contact: contacts,
    });
    setSaving(false);
    onCreated();
    resetForm();
  };

  const resetForm = () => {
    setCategory("");
    setSeverity("Medium");
    setMessage("");
    setContacts([]);
    setContactName("");
    setContactEmail("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && resetForm()}>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-6 pt-6 pb-5">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="w-5 h-5" /> Add Manual Issue
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-xl border-slate-200">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="rounded-xl border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_OPTIONS.map((sev) => (
                  <SelectItem key={sev} value={sev}>{sev}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Issue Description</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue..."
              className="rounded-xl border-slate-200 text-sm resize-none"
              rows="3"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1">
              <Mail className="w-3 h-3" /> Points of Contact
            </Label>
            <div className="space-y-2">
              {contacts.length > 0 && (
                <div className="space-y-1.5 bg-slate-50 rounded-lg p-2.5">
                  {contacts.map((contact, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5 text-xs border border-slate-200">
                      <div>
                        <div className="font-semibold text-slate-800">{contact.name || "No name"}</div>
                        <div className="text-slate-500 text-[11px]">{contact.email}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveContact(idx)}
                        className="text-red-500 hover:text-red-600 p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-1.5">
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Name (optional)"
                  className="rounded-lg border-slate-200 text-xs"
                />
                <div className="flex gap-2">
                  <Input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Email address"
                    type="email"
                    className="rounded-lg border-slate-200 text-xs flex-1"
                  />
                  <Button
                    onClick={handleAddContact}
                    variant="outline"
                    className="rounded-lg border-slate-200 px-3"
                    size="sm"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saving || !category || !message.trim()}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl mt-6"
          >
            {saving ? "Creating..." : "Create Issue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}