'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Crosshair } from 'lucide-react';
import { useStore } from '../store';

interface AddSubjectDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AddSubjectDialog({ open, onClose }: AddSubjectDialogProps) {
  const { addSubject } = useStore();
  const [name, setName] = useState('');
  const [days, setDays] = useState('15');
  const [zone, setZone] = useState<'active' | 'standby'>('standby');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setDays('15');
      setZone('standby');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleDeploy = () => {
    const trimmed = name.trim();
    const numDays = parseInt(days, 10);
    if (trimmed && numDays > 0) {
      addSubject(trimmed.toUpperCase(), numDays, zone);
      onClose();
    }
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
            onClick={onClose}
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
                  <Crosshair size={20} className="text-[#E60000]" />
                </div>
                <div>
                  <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                    DEPLOY NEW SUBJECT
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono">
                    Add to battle roster
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="ml-auto p-1 text-neutral-600 hover:text-[#E60000] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Name input */}
              <div className="mb-4">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono block mb-2">
                  Subject Designation
                </label>
                <input
                  ref={inputRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDeploy()}
                  className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-[#E60000] text-white font-mono text-sm font-bold uppercase px-3 py-2 rounded-none outline-none transition-colors focus:shadow-[0_0_10px_rgba(230,0,0,0.3)]"
                  placeholder="E.G. DISCRETE MATHEMATICS"
                />
              </div>

              {/* Days input */}
              <div className="mb-4">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono block mb-2">
                  Allotted Days
                </label>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDeploy()}
                  min={1}
                  className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-[#E60000] text-white font-mono text-sm px-3 py-2 rounded-none outline-none transition-colors focus:shadow-[0_0_10px_rgba(230,0,0,0.3)]"
                />
              </div>

              {/* Zone selector */}
              <div className="mb-6">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono block mb-2">
                  Deployment Zone
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setZone('active')}
                    className={`
                      flex-1 font-mono text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-sm border transition-all
                      ${zone === 'active'
                        ? 'bg-[#E60000]/10 text-[#E60000] border-[#E60000] shadow-[0_0_10px_rgba(230,0,0,0.2)]'
                        : 'bg-[#0a0a0a] text-neutral-500 border-neutral-700 hover:border-neutral-500'
                      }
                    `}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setZone('standby')}
                    className={`
                      flex-1 font-mono text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-sm border transition-all
                      ${zone === 'standby'
                        ? 'bg-[#E60000]/10 text-[#E60000] border-[#E60000] shadow-[0_0_10px_rgba(230,0,0,0.2)]'
                        : 'bg-[#0a0a0a] text-neutral-500 border-neutral-700 hover:border-neutral-500'
                      }
                    `}
                  >
                    Standby
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDeploy}
                  disabled={!name.trim() || !parseInt(days, 10)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#E60000] hover:bg-[#cc0000] text-white font-mono text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-sm transition-all hover:shadow-[0_0_20px_rgba(230,0,0,0.4)] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                  DEPLOY
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#0a0a0a] hover:bg-neutral-900 text-neutral-400 hover:text-white font-mono text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-sm border border-neutral-700 hover:border-neutral-500 transition-all"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
