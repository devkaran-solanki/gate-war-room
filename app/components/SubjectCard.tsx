'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import {
    GripVertical,
    Minus,
    Plus,
    Pencil,
    Trash2,
    Check,
    Target,
    Clock,
    Shield,
} from 'lucide-react';
import { Subject, useStore } from '../store';

interface SubjectCardProps {
    subject: Subject;
    isDragOverlay?: boolean;
    compact?: boolean;
    large?: boolean;
    onEdit?: (subject: Subject) => void;
}

export default function SubjectCard({ subject, isDragOverlay, compact: compactProp, large: largeProp, onEdit }: SubjectCardProps) {
    // When used as a drag overlay, always force compact styling for consistent size
    const compact = isDragOverlay ? true : compactProp;
    const large = isDragOverlay ? false : largeProp;
    const {
        incrementDay,
        decrementDay,
        deleteSubject,
        mergeMode,
        mergeSelection,
        toggleMergeSelection,
        splitMode,
        splitSelection,
        selectSplitSubject,
    } = useStore();

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: subject.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const percentage =
        subject.totalDays > 0
            ? Math.round((subject.completedDays / subject.totalDays) * 100)
            : 0;

    const isActive = subject.zone === 'active';
    const isSelected = mergeSelection.includes(subject.id);
    const isComplete = percentage === 100;
    const isSplittable = subject.name.includes('+');
    const isSplitSelected = splitSelection === subject.id;

    const handleCardClick = () => {
        if (mergeMode) {
            toggleMergeSelection(subject.id);
        } else if (splitMode && isSplittable) {
            selectSplitSubject(subject.id);
        }
    };

    return (
        <div
            ref={isDragOverlay ? undefined : setNodeRef}
            style={isDragOverlay ? { width: 280 } : style}
            onClick={handleCardClick}
            className={`
        relative group rounded-none overflow-hidden transition-shadow
        bg-[#111] border-x border-b
        ${isDragOverlay ? 'border-transparent' : isComplete ? 'border-green-500/30' : isActive ? 'border-[#E60000]/30' : 'border-neutral-800'}
        ${isDragOverlay ? 'z-50 scale-105 shadow-2xl shadow-black/80' : ''}
        ${isActive && !isDragOverlay ? 'card-active-glow card-glow' : ''}
        ${isSelected ? 'ring-2 ring-[#E60000] ring-offset-2 ring-offset-[#050505]' : ''}
        ${isSplitSelected ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-[#050505]' : ''}
        ${mergeMode ? 'cursor-pointer' : ''}
        ${splitMode && isSplittable ? 'cursor-pointer' : ''}
        ${splitMode && !isSplittable ? 'opacity-30 pointer-events-none' : ''}
      `}
        >
            {/* Top accent line */}
            <div
                className={`${large ? 'h-[3px]' : 'h-[2px]'} w-full ${isDragOverlay
                    ? 'bg-transparent'
                    : isComplete
                        ? 'bg-green-500'
                        : isActive
                            ? 'bg-gradient-to-r from-[#E60000] via-[#ff3333] to-[#E60000]'
                            : 'bg-neutral-700'
                    }`}
            />

            <div
                className={`
          ${compact ? 'p-3' : large ? 'p-5 sm:p-6' : 'p-4'}
        `}
            >
                {/* Header row: drag handle + name + actions */}
                <div className={`flex items-center gap-2 ${compact ? 'mb-2 min-h-[24px]' : large ? 'mb-4 min-h-[28px]' : 'mb-3 min-h-[24px]'}`}>
                    {/* Drag handle */}
                    {!isDragOverlay && !mergeMode && !splitMode && (
                        <button
                            {...attributes}
                            {...listeners}
                            className="drag-handle text-neutral-600 hover:text-[#E60000] transition-colors p-1 -ml-1 touch-none"
                            tabIndex={-1}
                        >
                            <GripVertical size={large ? 20 : 16} />
                        </button>
                    )}

                    {/* Merge checkbox */}
                    {mergeMode && (
                        <div
                            className={`
                w-6 h-6 shrink-0 rounded-none border-2 flex items-center justify-center transition-all
                ${isSelected
                                    ? 'bg-[#E60000] border-[#E60000]'
                                    : 'border-neutral-600 hover:border-[#E60000]'
                                }
              `}
                        >
                            {isSelected && <Check size={14} className="text-white" />}
                        </div>
                    )}

                    {/* Split indicator */}
                    {splitMode && isSplittable && (
                        <div
                            className={`
                w-6 h-6 shrink-0 rounded-none border-2 flex items-center justify-center transition-all
                ${isSplitSelected
                                    ? 'bg-orange-500 border-orange-500'
                                    : 'border-neutral-600 hover:border-orange-500'
                                }
              `}
                        >
                            {isSplitSelected && <Check size={14} className="text-white" />}
                        </div>
                    )}

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                        <h3
                            className={`
                  font-mono ${large ? 'text-base sm:text-lg' : 'text-sm'} font-bold uppercase tracking-wider truncate transition-colors
                  ${isComplete ? 'text-green-400 line-through' : isActive ? 'text-white' : 'text-neutral-400 group-hover:text-[#E60000]'}
                `}
                        >
                            {subject.name}
                        </h3>
                    </div>

                    {/* Action buttons */}
                    {!mergeMode && !splitMode && !isDragOverlay && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit?.(subject); }}
                                className="p-1 text-neutral-600 hover:text-orange-500 hover:bg-orange-500/10 rounded-sm transition-all"
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); deleteSubject(subject.id); }}
                                className="p-1 text-neutral-600 hover:text-[#E60000] hover:bg-[#E60000]/10 rounded-sm transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Progress bar */}
                <div className={compact ? 'mb-2' : large ? 'mb-4' : 'mb-3'}>
                    <div className="flex items-center justify-between mb-1">
                        {!compact && (
                            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono">
                                Progress
                            </span>
                        )}
                        <span
                            className={`text-[10px] font-mono font-bold ${compact ? 'ml-auto' : ''} ${isComplete ? 'text-green-400' : percentage > 50 ? 'text-[#ff6666]' : 'text-neutral-400'
                                }`}
                        >
                            {subject.completedDays}/{subject.totalDays} DAYS
                        </span>
                    </div>
                    <div className={`${compact ? 'h-1.5' : large ? 'h-3' : 'h-2'} bg-[#0a0a0a] rounded-none border border-neutral-800 overflow-hidden`}>
                        <motion.div
                            className={`h-full rounded-none ${isComplete
                                ? 'bg-green-500'
                                : 'bg-gradient-to-r from-[#991b1b] to-[#E60000]'
                                } ${!isComplete && percentage > 0 ? 'animate-progress-glow' : ''}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                        />
                    </div>
                </div>

                {/* Day controls + stats */}
                <div className="flex items-center justify-between">
                    {/* Decrement / Increment */}
                    <div className="flex items-center gap-1">
                        <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                decrementDay(subject.id);
                            }}
                            disabled={subject.completedDays <= 0}
                            className={`${compact ? 'w-6 h-6' : large ? 'w-9 h-9' : 'w-7 h-7'} flex items-center justify-center bg-[#0a0a0a] border border-neutral-700 hover:border-[#E60000] text-neutral-400 hover:text-[#E60000] rounded-none transition-all disabled:opacity-20 disabled:cursor-not-allowed`}
                        >
                            <Minus size={large ? 16 : 12} />
                        </motion.button>
                        <div className={`px-2 font-mono ${compact ? 'text-xs' : large ? 'text-lg' : 'text-sm'} font-bold text-white min-w-[2.5rem] text-center`}>
                            {percentage}%
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                incrementDay(subject.id);
                            }}
                            disabled={subject.completedDays >= subject.totalDays}
                            className={`${compact ? 'w-6 h-6' : large ? 'w-9 h-9' : 'w-7 h-7'} flex items-center justify-center bg-[#0a0a0a] border border-neutral-700 hover:border-[#E60000] text-neutral-400 hover:text-[#E60000] rounded-none transition-all disabled:opacity-20 disabled:cursor-not-allowed`}
                        >
                            <Plus size={large ? 16 : 12} />
                        </motion.button>
                    </div>

                    {/* Zone badge */}
                    <div
                        className={`
              flex items-center gap-1 px-2 py-0.5 rounded-sm ${large ? 'text-[10px]' : 'text-[9px]'} uppercase tracking-widest font-mono font-bold
              ${isComplete
                                ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                : isActive
                                    ? 'bg-[#E60000]/10 text-[#E60000] border border-[#E60000]/30'
                                    : 'bg-neutral-800/50 text-neutral-500 border border-neutral-700'
                            }
            `}
                    >
                        {isComplete ? (
                            <Shield size={9} />
                        ) : isActive ? (
                            <Target size={9} />
                        ) : (
                            <Clock size={9} />
                        )}
                        {isComplete ? 'COMPLETE' : isActive ? 'ACTIVE' : 'STANDBY'}
                    </div>
                </div>
            </div>
        </div>
    );
}
