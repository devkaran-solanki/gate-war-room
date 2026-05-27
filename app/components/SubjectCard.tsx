'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  X,
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
}

export default function SubjectCard({ subject, isDragOverlay, compact, large }: SubjectCardProps) {
  const {
    updateSubject,
    incrementDay,
    decrementDay,
    deleteSubject,
    mergeMode,
    mergeSelection,
    toggleMergeSelection,
  } = useStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(subject.name);
  const [editDays, setEditDays] = useState(subject.totalDays.toString());
  const nameInputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: subject.id,
    disabled: isEditing,
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

  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveEdit = () => {
    const trimmedName = editName.trim();
    const days = parseInt(editDays, 10);
    if (trimmedName && days > 0) {
      updateSubject(subject.id, {
        name: trimmedName.toUpperCase(),
        totalDays: days,
      });
    } else {
      setEditName(subject.name);
      setEditDays(subject.totalDays.toString());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(subject.name);
    setEditDays(subject.totalDays.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') handleCancelEdit();
  };

  const handleCardClick = () => {
    if (mergeMode) {
      toggleMergeSelection(subject.id);
    }
  };

  const wrapperRef = isDragOverlay ? undefined : setNodeRef;
  const dragStyle = isDragOverlay ? {} : style;

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      onClick={handleCardClick}
      className={`
        relative group rounded-sm overflow-hidden transition-shadow
        ${isDragOverlay ? 'shadow-[0_0_30px_rgba(230,0,0,0.6)] z-50 scale-105' : ''}
        ${isActive && !isDragOverlay ? 'card-active-glow animate-border-pulse' : ''}
        ${!isDragOverlay ? 'card-glow' : ''}
        ${isSelected ? 'ring-2 ring-[#E60000] ring-offset-2 ring-offset-[#050505]' : ''}
        ${mergeMode ? 'cursor-pointer' : ''}
        ${isComplete ? 'border-green-500/60' : ''}
      `}
    >
      {/* Top accent line */}
      <div
        className={`${large ? 'h-[3px]' : 'h-[2px]'} w-full ${
          isComplete
            ? 'bg-green-500'
            : isActive
              ? 'bg-gradient-to-r from-[#E60000] via-[#ff3333] to-[#E60000]'
              : 'bg-neutral-700'
        }`}
      />

      <div
        className={`
          bg-[#111] ${compact ? 'p-3' : large ? 'p-5 sm:p-6' : 'p-4'} border border-t-0
          ${isComplete ? 'border-green-500/30' : isActive ? 'border-[#E60000]/30' : 'border-neutral-800'}
        `}
      >
        {/* Header row: drag handle + name + actions */}
        <div className={`flex items-center gap-2 ${compact ? 'mb-2 min-h-[24px]' : large ? 'mb-4 min-h-[28px]' : 'mb-3 min-h-[24px]'}`}>
          {/* Drag handle */}
          {!isDragOverlay && !mergeMode && (
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

          {/* Name */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                ref={nameInputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-[#0a0a0a] border border-[#E60000]/50 text-white font-mono text-sm font-bold uppercase px-2 py-1 w-full rounded-none outline-none focus:border-[#E60000] focus:shadow-[0_0_10px_rgba(230,0,0,0.3)]"
              />
            ) : (
              <h3
                className={`
                  font-mono ${large ? 'text-base sm:text-lg' : 'text-sm'} font-bold uppercase tracking-wider truncate
                  ${isComplete ? 'text-green-400 line-through' : isActive ? 'text-white' : 'text-neutral-400'}
                `}
              >
                {subject.name}
              </h3>
            )}
          </div>

          {/* Action buttons */}
          {!mergeMode && !isDragOverlay && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isEditing ? (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                    className="p-1 text-green-500 hover:text-green-400 hover:bg-green-500/10 rounded-sm transition-all"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                    className="p-1 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-500/10 rounded-sm transition-all"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                    className="p-1 text-neutral-600 hover:text-[#E60000] hover:bg-[#E60000]/10 rounded-sm transition-all"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSubject(subject.id); }}
                    className="p-1 text-neutral-600 hover:text-[#E60000] hover:bg-[#E60000]/10 rounded-sm transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Days editor (when editing) */}
        {isEditing && (
          <div className="mb-3 flex items-center gap-2">
            <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono">
              Days:
            </label>
            <input
              type="number"
              value={editDays}
              onChange={(e) => setEditDays(e.target.value)}
              onKeyDown={handleKeyDown}
              min={1}
              className="bg-[#0a0a0a] border border-[#E60000]/50 text-white font-mono text-sm px-2 py-1 w-20 rounded-none outline-none focus:border-[#E60000] focus:shadow-[0_0_10px_rgba(230,0,0,0.3)]"
            />
          </div>
        )}

        {/* Progress bar */}
        <div className={compact ? 'mb-2' : large ? 'mb-4' : 'mb-3'}>
          <div className="flex items-center justify-between mb-1">
            {!compact && (
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono">
                Progress
              </span>
            )}
            <span
              className={`text-[10px] font-mono font-bold ${compact ? 'ml-auto' : ''} ${
                isComplete ? 'text-green-400' : percentage > 50 ? 'text-[#ff6666]' : 'text-neutral-400'
              }`}
            >
              {subject.completedDays}/{subject.totalDays} DAYS
            </span>
          </div>
          <div className={`${compact ? 'h-1.5' : large ? 'h-3' : 'h-2'} bg-[#0a0a0a] rounded-none border border-neutral-800 overflow-hidden`}>
            <motion.div
              className={`h-full rounded-none ${
                isComplete
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
