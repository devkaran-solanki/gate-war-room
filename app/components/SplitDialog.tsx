'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, X, Zap, AlertTriangle } from 'lucide-react';
import { useStore } from '../store';

interface SplitDialogProps {
  open: boolean;
  onClose: () => void;
}

interface SplitPart {
  name: string;
  days: number;
}

export default function SplitDialog({ open, onClose }: SplitDialogProps) {
  const { subjects, splitSelection, splitSubject, clearSplitSelection } = useStore();
  const [parts, setParts] = useState<SplitPart[]>([]);

  const source = subjects.find((s) => s.id === splitSelection);

  useEffect(() => {
    if (open && source) {
      // Split name by '+', trim whitespace around each part
      const nameParts = source.name
        .split('+')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      // Divide days evenly, remainder goes to first part
      const baseDays = Math.floor(source.totalDays / nameParts.length);
      const remainder = source.totalDays % nameParts.length;

      setParts(
        nameParts.map((name, i) => ({
          name,
          days: baseDays + (i < remainder ? 1 : 0),
        }))
      );
    }
  }, [open, source]);

  if (!open || !source) return null;

  const totalAllocated = parts.reduce((sum, p) => sum + p.days, 0);
  const daysMatch = totalAllocated === source.totalDays;
  const allNamed = parts.every((p) => p.name.trim().length > 0);
  const allPositive = parts.every((p) => p.days > 0);
  const canExecute = daysMatch && allNamed && allPositive;

  const updatePart = (index: number, field: keyof SplitPart, value: string | number) => {
    setParts((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      )
    );
  };

  const handleSplit = () => {
    if (canExecute) {
      splitSubject(parts);
      onClose();
    }
  };

  const handleAbort = () => {
    clearSplitSelection();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleAbort}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative bg-[#111] border border-orange-500/50 rounded-sm w-full max-w-md shadow-[0_0_40px_rgba(249,115,22,0.3)]"
          >
            {/* Header accent */}
            <div className="h-[2px] bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />

            <div className="p-6">
              {/* Title */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 flex items-center justify-center bg-orange-500/10 border border-orange-500/30 rounded-sm">
                  <Scissors size={20} className="text-orange-500" />
                </div>
                <div>
                  <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                    SPLIT PROTOCOL
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono">
                    Dividing tactical unit
                  </p>
                </div>
                <button
                  onClick={handleAbort}
                  className="ml-auto p-1 text-neutral-600 hover:text-orange-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Source subject */}
              <div className="bg-[#0a0a0a] border border-neutral-800 rounded-sm p-3 mb-6">
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-1">
                  Source Unit
                </p>
                <p className="font-mono text-sm font-bold uppercase text-white">
                  {source.name}
                </p>
                <p className="font-mono text-[10px] text-neutral-500 mt-1">
                  {source.totalDays} DAYS / {source.completedDays} COMPLETED
                </p>
              </div>

              {/* Arrow divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-neutral-800" />
                <span className="font-mono text-xs text-orange-500 uppercase tracking-widest">
                  Splits into
                </span>
                <div className="flex-1 h-px bg-neutral-800" />
              </div>

              {/* Split parts */}
              <div className="space-y-3 mb-6">
                {parts.map((part, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[#0a0a0a] border border-neutral-800 rounded-sm p-3"
                  >
                    <div className="flex items-center gap-3">
                      {/* Part number */}
                      <div className="w-6 h-6 flex items-center justify-center bg-orange-500/10 border border-orange-500/30 rounded-sm shrink-0">
                        <span className="font-mono text-[10px] font-bold text-orange-500">
                          {index + 1}
                        </span>
                      </div>

                      {/* Name input */}
                      <input
                        value={part.name}
                        onChange={(e) => updatePart(index, 'name', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSplit()}
                        className="flex-1 bg-[#111] border border-neutral-700 focus:border-orange-500 text-white font-mono text-xs font-bold uppercase px-2 py-1.5 rounded-none outline-none transition-colors focus:shadow-[0_0_10px_rgba(249,115,22,0.2)]"
                        placeholder="NAME"
                      />

                      {/* Days input */}
                      <input
                        type="number"
                        value={part.days}
                        onChange={(e) =>
                          updatePart(index, 'days', Math.max(1, parseInt(e.target.value) || 1))
                        }
                        onKeyDown={(e) => e.key === 'Enter' && handleSplit()}
                        min={1}
                        className="w-16 bg-[#111] border border-neutral-700 focus:border-orange-500 text-white font-mono text-xs font-bold px-2 py-1.5 rounded-none outline-none text-center transition-colors focus:shadow-[0_0_10px_rgba(249,115,22,0.2)]"
                      />
                      <span className="font-mono text-[9px] text-neutral-500 uppercase">
                        Days
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Day allocation status */}
              <div
                className={`bg-[#0a0a0a] border rounded-sm p-3 mb-6 ${
                  daysMatch
                    ? 'border-green-500/30'
                    : 'border-[#E60000]/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono">
                    Day Allocation
                  </span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      daysMatch ? 'text-green-400' : 'text-[#E60000]'
                    }`}
                  >
                    {totalAllocated} / {source.totalDays} DAYS
                  </span>
                </div>
                {!daysMatch && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <AlertTriangle size={10} className="text-[#E60000]" />
                    <span className="font-mono text-[10px] text-[#E60000]">
                      {totalAllocated > source.totalDays
                        ? `${totalAllocated - source.totalDays} days over-allocated`
                        : `${source.totalDays - totalAllocated} days unallocated`}
                    </span>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSplit}
                  disabled={!canExecute}
                  className={`flex-1 flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-sm transition-all ${
                    canExecute
                      ? 'bg-orange-500 hover:bg-orange-600 text-white hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]'
                      : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                  }`}
                >
                  <Zap size={14} />
                  EXECUTE SPLIT
                </button>
                <button
                  onClick={handleAbort}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#0a0a0a] hover:bg-neutral-900 text-neutral-400 hover:text-white font-mono text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-sm border border-neutral-700 hover:border-neutral-500 transition-all"
                >
                  ABORT
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
