import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";

const CATEGORIES = ["OR Protocol", "Safety", "Equipment", "Sterilization", "Staff", "General"];

export default function PolicyUploadModal({ open, onClose, onPolicySaved }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("OR Protocol");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      let fileUrl = null;
      if (file) {
        const uploaded = await base44.integrations.Core.UploadFile({ file });
        fileUrl = uploaded.file_url;
      }

      return base44.entities.Policy.create({
        title,
        category,
        content,
        file_url: fileUrl,
        is_active: true,
        last_updated: new Date().toISOString().split("T")[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      onPolicySaved();
      setTitle("");
      setCategory("OR Protocol");
      setContent("");
      setFile(null);
      onClose();
    },
  });

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Policy</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Title</label>
            <Input
              placeholder="Policy title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Policy Content</label>
            <Textarea
              placeholder="Enter policy text or paste content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="6"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Attach Document (Optional)</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0])}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || createMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Upload className="w-4 h-4 mr-2" /> Save Policy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}