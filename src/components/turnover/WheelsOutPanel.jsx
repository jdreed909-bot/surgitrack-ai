import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Clock, AlertTriangle } from "lucide-react";

export default function WheelsOutPanel({ turnover, onWheelsOut }) {
  const [showModal, setShowModal] = useState(false);
  const [cleaningStarted, setCleaningStarted] = useState(false);
  const [cleaningFinished, setCleaningFinished] = useState(false);
  const [countdown, setCountdown] = useState(20 * 60); // 20 mins in seconds

  useEffect(() => {
    if (!cleaningStarted) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cleaningStarted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCleaningStart = async () => {
    setCleaningStarted(true);
    await onWheelsOut({
      action: "cleaning_start",
      timestamp: new Date(),
    });
  };

  const handleCleaningFinish = async () => {
    setCleaningFinished(true);
    setCleaningStarted(false);
    await onWheelsOut({
      action: "cleaning_finish",
      timestamp: new Date(),
    });
  };

  if (cleaningStarted) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-red-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Wheels Out Active
          </h3>
          <div className="text-3xl font-bold text-red-600 font-mono">{formatTime(countdown)}</div>
        </div>

        <p className="text-sm text-red-700 mb-4">Cleaning in progress - alerts sent to all assigned staff with 20-minute countdown</p>

        <Button
          onClick={handleCleaningFinish}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          ✓ Cleaning Finished
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" /> Wheels Out
      </h3>

      <p className="text-sm text-slate-600 mb-4">Start room cleaning - alerts sent to all assigned staff with 20-minute countdown</p>

      <Button
        onClick={() => setShowModal(true)}
        className="w-full bg-red-600 hover:bg-red-700"
      >
        Start Cleaning
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Cleaning - {turnover?.or_room}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 py-4">
            This will alert all assigned staff (RN, Scrub Tech, Anesthesia, Surgeon) with a 20-minute countdown timer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              onClick={() => {
                handleCleaningStart();
                setShowModal(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Start Cleaning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}