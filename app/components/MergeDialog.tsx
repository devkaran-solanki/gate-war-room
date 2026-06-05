'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitMerge, X, Zap } from 'lucide-react';
import { useStore } from '../store';

interface MergeDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function MergeDialog({ open, onClose }: MergeDialogProps) {
  const { subjects, mergeSelection, mergeSubjects, clearMergeSelection } = useStore();
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const sub1 = subjects.find((s) => s.id === mergeSelection[0]);
  const sub2 = subjects.find((s) => s.id === mergeSelection[1]);

  useEffect(() => {
    if (open && sub1 && sub2) {
      // Split each name on '+', trim parts, then rejoin all with ' + '
      // e.g. 'EM+TOC' + 'CD' → 'EM + TOC + CD'
      const allParts = [sub1.name, sub2.name]
        .flatMap((n) => n.split('+').map((p) => p.trim()))
        .filter((p) => p.length > 0);
      setNewName(allParts.join(' + '));
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [open, sub1, sub2]);

  if (!open || !sub1 || !sub2) return null;

  const totalDays = sub1.totalDays + sub2.totalDays;
  const totalCompleted = sub1.completedDays + sub2.completedDays;

  const handleMerge = () => {
    const trimmed = newName.trim();
    if (trimmed) {
      mergeSubjects(trimmed.toUpperCase());
      onClose();
    }
  };

  const handleAbort = () => {
    clearMergeSelection();
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
            className="relative bg-[#111] border border-[#E60000]/50 rounded-sm w-full max-w-md shadow-[0_0_40px_rgba(230,0,0,0.3)]"
          >
            {/* Header accent */}
            <div className="h-[2px] bg-gradient-to-r from-[#E60000] via-[#ff3333] to-[#E60000]" />

            <div className="p-6">
              {/* Title */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 flex items-center justify-center bg-[#E60000]/10 border border-[#E60000]/30 rounded-sm">
                  <GitMerge size={20} className="text-[#E60000]" />
                </div>
                <div>
                  <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                    MERGE PROTOCOL
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono">
                    Combining tactical units
                  </p>
                </div>
                <button
                  onClick={handleAbort}
                  className="ml-auto p-1 text-neutral-600 hover:text-[#E60000] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Merge preview */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 bg-[#0a0a0a] border border-neutral-800 rounded-sm p-3">
                  <p className="font-mono text-xs font-bold uppercase text-white truncate">
                    {sub1.name}
                  </p>
                  <p className="font-mono text-[10px] text-neutral-500 mt-1">
                    {sub1.totalDays} DAYS / {sub1.completedDays} DONE
                  </p>
                </div>
                <div className="text-[#E60000] font-mono font-bold text-xl">+</div>
                <div className="flex-1 bg-[#0a0a0a] border border-neutral-800 rounded-sm p-3">
                  <p className="font-mono text-xs font-bold uppercase text-white truncate">
                    {sub2.name}
                  </p>
                  <p className="font-mono text-[10px] text-neutral-500 mt-1">
                    {sub2.totalDays} DAYS / {sub2.completedDays} DONE
                  </p>
                </div>
              </div>

              {/* Result preview */}
              <div className="bg-[#0a0a0a] border border-[#E60000]/20 rounded-sm p-3 mb-6">
                <p className="text-[10px] uppercase tracking-widest text-[#E60000] font-mono mb-2">
                  Result
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-white">
                    {totalDays} DAYS TOTAL
                  </span>
                  <span className="font-mono text-xs text-neutral-500">
                    {totalCompleted} COMPLETED
                  </span>
                </div>
              </div>

              {/* New name input */}
              <div className="mb-6">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono block mb-2">
                  Designation
                </label>
                <input
                  ref={inputRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleMerge()}
                  className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-[#E60000] text-white font-mono text-sm font-bold uppercase px-3 py-2 rounded-none outline-none transition-colors focus:shadow-[0_0_10px_rgba(230,0,0,0.3)]"
                  placeholder="ENTER NEW NAME"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleMerge}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#E60000] hover:bg-[#cc0000] text-white font-mono text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-sm transition-all hover:shadow-[0_0_20px_rgba(230,0,0,0.4)]"
                >
                  <Zap size={14} />
                  EXECUTE MERGE
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
