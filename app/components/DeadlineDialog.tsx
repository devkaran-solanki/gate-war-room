'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, X, ChevronLeft, ChevronRight, Check, ChevronDown } from 'lucide-react';
import { useStore } from '../store';

interface DeadlineDialogProps {
  open: boolean;
  onClose: () => void;
}

const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

const DAY_LABELS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function CustomSelect({ 
  value, 
  options, 
  onChange, 
  isOpen, 
  setIsOpen 
}: {
  value: number;
  options: { label: string; value: number }[];
  onChange: (val: number) => void;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#111] border border-neutral-800 hover:border-neutral-600 focus:border-[#E60000] text-white font-mono text-xs font-bold uppercase py-1.5 px-3 rounded-sm outline-none transition-colors min-w-[76px] justify-between"
      >
        <span>{options.find(o => o.value === value)?.label}</span>
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180 text-[#E60000]' : 'text-neutral-500'}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto bg-[#0a0a0a] border border-neutral-800 rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.8)] z-50"
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 font-mono text-xs uppercase transition-colors ${
                    opt.value === value
                      ? 'bg-[#E60000]/10 text-[#E60000] font-bold'
                      : 'text-neutral-400 hover:bg-[#111] hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DeadlineDialog({ open, onClose }: DeadlineDialogProps) {
  const { overallDeadline, setOverallDeadline } = useStore();

  // Parse stored deadline into initial view month
  const initial = useMemo(() => {
    const d = new Date(overallDeadline + 'T00:00:00');
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }, [overallDeadline]);

  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);
  const [selectedDate, setSelectedDate] = useState(overallDeadline);

  const [monthOpen, setMonthOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);

  const monthOptions = useMemo(() => MONTH_NAMES.map((m, i) => ({ label: m, value: i })), []);
  const yearOptions = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => {
      const y = new Date().getFullYear() - 5 + i;
      return { label: y.toString(), value: y };
    });
  }, []);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      const d = new Date(overallDeadline + 'T00:00:00');
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setSelectedDate(overallDeadline);
    }
  }, [open, overallDeadline]);

  // Calendar grid data
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startDow = firstDay.getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];

    // Previous month fill
    for (let i = startDow - 1; i >= 0; i--) {
      const pm = viewMonth === 0 ? 11 : viewMonth - 1;
      const py = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({ day: daysInPrevMonth - i, month: pm, year: py, isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month: viewMonth, year: viewYear, isCurrentMonth: true });
    }

    // Next month fill to complete 6 rows
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nm = viewMonth === 11 ? 0 : viewMonth + 1;
      const ny = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({ day: d, month: nm, year: ny, isCurrentMonth: false });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const navigateMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  };

  const cellToDateStr = (cell: { day: number; month: number; year: number }) =>
    `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;

  const handleConfirm = () => {
    setOverallDeadline(selectedDate);
    onClose();
  };

  const selectedParsed = new Date(selectedDate + 'T23:59:59');
  const daysFromNow = Math.max(0, Math.ceil((selectedParsed.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  if (!open) return null;

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
            className="relative bg-[#111] border border-[#E60000]/50 rounded-sm w-full max-w-sm shadow-[0_0_40px_rgba(230,0,0,0.3)]"
          >
            {/* Header accent */}
            <div className="h-[2px] bg-gradient-to-r from-[#E60000] via-[#ff3333] to-[#E60000]" />

            <div className="p-5">
              {/* Title */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 flex items-center justify-center bg-[#E60000]/10 border border-[#E60000]/30 rounded-sm">
                  <Flame size={20} className="text-[#E60000]" />
                </div>
                <div>
                  <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                    SET DEADLINE
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono">
                    Campaign end date
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="ml-auto p-1 text-neutral-600 hover:text-[#E60000] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Calendar */}
              <div className="bg-[#0a0a0a] border border-neutral-800 rounded-sm p-4 mb-4">
                {/* Month/year navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-[#E60000] hover:bg-[#E60000]/10 rounded-sm transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex items-center gap-2">
                    <CustomSelect
                      value={viewMonth}
                      options={monthOptions}
                      onChange={setViewMonth}
                      isOpen={monthOpen}
                      setIsOpen={setMonthOpen}
                    />
                    <CustomSelect
                      value={viewYear}
                      options={yearOptions}
                      onChange={setViewYear}
                      isOpen={yearOpen}
                      setIsOpen={setYearOpen}
                    />
                  </div>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-[#E60000] hover:bg-[#E60000]/10 rounded-sm transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Day labels */}
                <div className="grid grid-cols-7 mb-1">
                  {DAY_LABELS.map((label) => (
                    <div
                      key={label}
                      className="h-8 flex items-center justify-center font-mono text-[9px] font-bold uppercase tracking-widest text-neutral-600"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((cell, i) => {
                    const dateStr = cellToDateStr(cell);
                    const isSelected = dateStr === selectedDate;
                    const isToday = dateStr === todayStr;
                    const isPast = dateStr < todayStr;

                    return (
                      <button
                        key={i}
                        onClick={() => !isPast && setSelectedDate(dateStr)}
                        disabled={isPast}
                        className={`
                          h-9 flex items-center justify-center font-mono text-xs rounded-sm transition-all relative
                          ${!cell.isCurrentMonth
                            ? 'text-neutral-800'
                            : isPast
                              ? 'text-neutral-700 cursor-not-allowed'
                              : 'text-neutral-400 hover:text-white hover:bg-[#E60000]/10 cursor-pointer'
                          }
                          ${isSelected
                            ? 'bg-[#E60000] text-white font-bold hover:bg-[#cc0000] shadow-[0_0_12px_rgba(230,0,0,0.5)]'
                            : ''
                          }
                          ${isToday && !isSelected
                            ? 'ring-1 ring-[#E60000]/50 text-[#E60000] font-bold'
                            : ''
                          }
                        `}
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected date preview */}
              <div className="bg-[#0a0a0a] border border-[#E60000]/20 rounded-sm p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-1">
                      Selected Deadline
                    </p>
                    <p className="font-mono text-sm font-bold text-white uppercase">
                      {selectedParsed.toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono text-xl font-black ${daysFromNow < 60 ? 'text-[#E60000]' : 'text-orange-400'}`}>
                      {daysFromNow}
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">
                      Days left
                    </p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#E60000] hover:bg-[#cc0000] text-white font-mono text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-sm transition-all hover:shadow-[0_0_20px_rgba(230,0,0,0.4)]"
                >
                  <Check size={14} />
                  CONFIRM
                </button>
                <button
                  onClick={onClose}
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
