'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, X, Check, Target, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { Subject, useStore } from '../store';

interface EditSubjectDialogProps {
    open: boolean;
    subject: Subject | null;
    onClose: () => void;
}

export default function EditSubjectDialog({ open, subject, onClose }: EditSubjectDialogProps) {
    const { updateSubject } = useStore();
    const [editName, setEditName] = useState('');
    const [editDays, setEditDays] = useState('');
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open && subject) {
            setEditName(subject.name);
            setEditDays(subject.totalDays.toString());
            setTimeout(() => {
                nameInputRef.current?.focus();
                nameInputRef.current?.select();
            }, 100);
        }
    }, [open, subject]);

    if (!open || !subject) return null;

    const days = parseInt(editDays, 10);
    const isValid = editName.trim().length > 0 && days > 0;
    const percentage = subject.totalDays > 0
        ? Math.round((subject.completedDays / subject.totalDays) * 100)
        : 0;
    const isActive = subject.zone === 'active';

    const handleSave = () => {
        if (!isValid) return;
        updateSubject(subject.id, {
            name: editName.trim().toUpperCase(),
            totalDays: days,
        });
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') onClose();
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

                        <div className="p-5">
                            {/* Title */}
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 flex items-center justify-center bg-[#E60000]/10 border border-[#E60000]/30 rounded-sm">
                                    <Pencil size={20} className="text-[#E60000]" />
                                </div>
                                <div>
                                    <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                                        MODIFY SUBJECT
                                    </h2>
                                    <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono">
                                        Reconfigure parameters
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="ml-auto p-1 text-neutral-600 hover:text-[#E60000] transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Current status bar */}
                            <div className="bg-[#0a0a0a] border border-neutral-800 rounded-sm p-3 mb-5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {isActive ? (
                                        <Target size={12} className="text-[#E60000]" />
                                    ) : (
                                        <Clock size={12} className="text-neutral-500" />
                                    )}
                                    <span className={`font-mono text-[10px] uppercase tracking-widest font-bold ${isActive ? 'text-[#E60000]' : 'text-neutral-500'}`}>
                                        {isActive ? 'ACTIVE ZONE' : 'STANDBY ZONE'}
                                    </span>
                                </div>
                                <span className={`font-mono text-[10px] uppercase tracking-widest ${percentage === 100 ? 'text-green-400' : 'text-neutral-400'}`}>
                                    {subject.completedDays}/{subject.totalDays} DAYS — {percentage}%
                                </span>
                            </div>

                            {/* Form fields */}
                            <div className="space-y-4 mb-5">
                                {/* Name field */}
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-2">
                                        Subject Designation
                                    </label>
                                    <input
                                        ref={nameInputRef}
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="w-full bg-[#0a0a0a] border border-neutral-800 focus:border-[#E60000] text-white font-mono text-sm font-bold uppercase tracking-wider px-3 py-2.5 rounded-sm outline-none transition-all focus:shadow-[0_0_15px_rgba(230,0,0,0.2)]"
                                        placeholder="ENTER SUBJECT NAME"
                                    />
                                </div>

                                {/* Days field */}
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-2">
                                        Total Days Allocated
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={editDays}
                                            onChange={(e) => setEditDays(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            min={1}
                                            className="w-full bg-[#0a0a0a] border border-neutral-800 focus:border-[#E60000] text-white font-mono text-sm font-bold px-3 py-2.5 rounded-sm outline-none transition-all focus:shadow-[0_0_15px_rgba(230,0,0,0.2)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pr-8"
                                            placeholder="ENTER DAYS"
                                        />
                                        <div className="absolute right-1 top-1 bottom-1 flex flex-col justify-center gap-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => setEditDays((parseInt(editDays || '0') + 1).toString())}
                                                className="bg-neutral-800 hover:bg-[#E60000] text-neutral-400 hover:text-white flex items-center justify-center w-5 flex-1 rounded-[1px] transition-colors cursor-pointer"
                                            >
                                                <ChevronUp size={12} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditDays(Math.max(1, parseInt(editDays || '0') - 1).toString())}
                                                className="bg-neutral-800 hover:bg-[#E60000] text-neutral-400 hover:text-white flex items-center justify-center w-5 flex-1 rounded-[1px] transition-colors cursor-pointer"
                                            >
                                                <ChevronDown size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    {days > 0 && days !== subject.totalDays && (
                                        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                                            Changing from <span className="text-[#E60000] font-bold">{subject.totalDays}</span> → <span className="text-white font-bold">{days}</span> days
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={!isValid}
                                    className="flex-1 flex items-center justify-center gap-2 bg-[#E60000] hover:bg-[#cc0000] disabled:bg-neutral-800 disabled:text-neutral-600 text-white font-mono text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-sm transition-all hover:shadow-[0_0_20px_rgba(230,0,0,0.4)] disabled:shadow-none disabled:cursor-not-allowed"
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
