'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    pointerWithin,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
    type DragStartEvent,
    type DragEndEvent,
    type DragOverEvent,
    type CollisionDetection,
} from '@dnd-kit/core';
import {
    SortableContext,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import {
    Crosshair,
    GitMerge,
    Scissors,
    Plus,
    Target,
    Clock,
    Activity,
    AlertTriangle,
    Flame,
    Swords,
    ShieldAlert,
    CheckCheck,
} from 'lucide-react';
import { useStore, type Subject } from './store';
import SubjectCard from './components/SubjectCard';
import MergeDialog from './components/MergeDialog';
import SplitDialog from './components/SplitDialog';
import DeadlineDialog from './components/DeadlineDialog';
import EditSubjectDialog from './components/EditSubjectDialog';
import AddSubjectDialog from './components/AddSubjectDialog';

// Droppable zone wrapper — catches drops in empty space within a zone
function DroppableZone({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            className={`${className ?? ''} transition-colors duration-150 ${isOver ? 'bg-[#E60000]/[0.06] border-[#E60000]/40' : ''
                }`}
        >
            {children}
        </div>
    );
}

export default function WarRoom() {
    const {
        subjects,
        mergeMode,
        mergeSelection,
        toggleMergeMode,
        splitMode,
        splitSelection,
        toggleSplitMode,
        overallDeadline,
        moveToZone,
        reorder,
        archiveAllCompleted,
    } = useStore();

    const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
    const [showMergeDialog, setShowMergeDialog] = useState(false);
    const [showSplitDialog, setShowSplitDialog] = useState(false);
    const [showDeadlineDialog, setShowDeadlineDialog] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [mounted, setMounted] = useState(false);

    // Hydration guard for Zustand + localStorage
    useEffect(() => {
        setMounted(true);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const activeSubjects = useMemo(
        () =>
            subjects
                .filter((s) => s.zone === 'active')
                .sort((a, b) => a.order - b.order),
        [subjects]
    );

    const standbySubjects = useMemo(
        () =>
            subjects
                .filter((s) => s.zone === 'standby')
                .sort((a, b) => a.order - b.order),
        [subjects]
    );

    const completedSubjects = useMemo(
        () =>
            subjects
                .filter((s) => s.zone === 'completed')
                .sort((a, b) => a.order - b.order),
        [subjects]
    );

    // Custom collision detection: use pointerWithin to find which zone the
    // pointer is inside, then closestCenter *only* among that zone's cards.
    // This prevents drops from "leaking" to the other zone when dragging
    // into empty grid space (e.g. far-right of the active zone).
    const collisionDetection: CollisionDetection = useCallback(
        (args) => {
            // Which droppables is the pointer physically inside?
            const pointerCollisions = pointerWithin(args);
            const zoneHit = pointerCollisions.find((c) =>
                c.id.toString().startsWith('zone-')
            );

            if (zoneHit) {
                const zoneName =
                    zoneHit.id === 'zone-active' ? 'active' : 
                    zoneHit.id === 'zone-standby' ? 'standby' : 'completed';

                // Only consider cards that belong to this zone
                const zoneCards = args.droppableContainers.filter(
                    (container) => {
                        const id = container.id.toString();
                        if (id.startsWith('zone-')) return false;
                        const sub = subjects.find((s) => s.id === id);
                        return sub?.zone === zoneName;
                    }
                );

                if (zoneCards.length > 0) {
                    const closest = closestCenter({
                        ...args,
                        droppableContainers: zoneCards,
                    });
                    if (closest.length > 0) return closest;
                }

                // Zone has no cards — return the zone itself as drop target
                return [zoneHit];
            }

            // Pointer isn't inside any zone — default behaviour
            return closestCenter(args);
        },
        [subjects]
    );

    const totalDays = subjects.reduce((sum, s) => sum + s.totalDays, 0);
    const completedDays = subjects.reduce((sum, s) => sum + s.completedDays, 0);
    const overallPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    // Deadline = today + total remaining days from ACTIVE directives
    const activeRemainingDays = activeSubjects.reduce(
        (sum, s) => sum + (s.totalDays - s.completedDays),
        0
    );
    const now = new Date();
    const deadlineDate = new Date(now.getTime() + activeRemainingDays * 24 * 60 * 60 * 1000);
    const deadlineDateStr = deadlineDate.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).toUpperCase();

    // Overall deadline from store
    const overallDeadlineDate = new Date(overallDeadline + 'T23:59:59');
    const daysUntilOverallDeadline = Math.max(0, Math.ceil((overallDeadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const deadlineDateDisplay = overallDeadlineDate.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).toUpperCase();

    // Open merge dialog when 2 subjects are selected
    useEffect(() => {
        if (mergeSelection.length === 2) {
            setShowMergeDialog(true);
        }
    }, [mergeSelection]);

    // Open split dialog when a subject is selected for split
    useEffect(() => {
        if (splitSelection) {
            setShowSplitDialog(true);
        }
    }, [splitSelection]);

    const handleDragStart = (event: DragStartEvent) => {
        const sub = subjects.find((s) => s.id === event.active.id);
        if (sub) setActiveSubject(sub);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;
        if (activeId === overId) return;

        const activeSub = subjects.find((s) => s.id === activeId);

        // Dropping over a zone container (empty space)
        if (overId === 'zone-active' || overId === 'zone-standby' || overId === 'zone-completed') {
            const targetZone = overId === 'zone-active' ? 'active' : overId === 'zone-standby' ? 'standby' : 'completed';
            if (activeSub && activeSub.zone !== targetZone) {
                moveToZone(activeId, targetZone);
            }
            return;
        }

        // Dropping over another subject card
        const overSub = subjects.find((s) => s.id === overId);
        if (!activeSub || !overSub) return;

        // Cross-container: move to new zone in real-time so items shift
        if (activeSub.zone !== overSub.zone) {
            moveToZone(activeId, overSub.zone);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveSubject(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        // Dropping on zone container — already handled in onDragOver
        if (overId === 'zone-active' || overId === 'zone-standby' || overId === 'zone-completed') return;

        // Reorder within zone
        const activeSub = subjects.find((s) => s.id === activeId);
        const overSub = subjects.find((s) => s.id === overId);

        if (activeSub && overSub) {
            reorder(activeId, overId);
        }
    };

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Show loading skeleton until hydrated
    if (!mounted) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <img src="/skull.svg" alt="Loading Skull" className="w-12 h-12 animate-pulse" />
                    <p className="font-mono text-sm uppercase tracking-widest text-neutral-500 animate-flicker">
                        INITIALIZING WAR ROOM...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col">
            {/* ===== HEADER ===== */}
            <header className="border-b border-neutral-800 bg-[#080808]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Title row */}
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <img src="/skull.svg" alt="Skull Logo" className="w-7 h-7" />
                                <h1 className="font-mono text-2xl sm:text-3xl font-black uppercase tracking-wider text-white animate-glitch-text">
                                    GATE WAR ROOM
                                </h1>
                            </div>
                            <p className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.3em] text-neutral-500">
                                <span className="text-[#E60000] animate-status-blink">●</span>{' '}
                                COMMAND CENTER ACTIVE // {currentDate.toUpperCase()}
                            </p>
                        </div>

                        {/* Quick stats */}
                        <div className="flex items-center gap-4 sm:gap-6">
                            <div className="text-right">
                                <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                                    ACTIVE DEADLINE
                                </p>
                                <p className="font-mono text-xl sm:text-2xl font-black text-[#E60000]">
                                    {activeRemainingDays}
                                    <span className="text-xs text-neutral-400 ml-1">DAYS</span>
                                </p>
                                <p className="font-mono text-[10px] text-neutral-400 mt-0.5">
                                    {deadlineDateStr}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Overall progress bar */}
                    <div className="mb-4">
                        <div className="flex items-center mb-1.5">
                            <span className="font-mono text-xs uppercase tracking-widest text-neutral-300 flex items-center gap-1.5">
                                <Activity size={12} className="text-[#E60000]" />
                                OVERALL CAMPAIGN PROGRESS
                            </span>
                        </div>
                        <div className="h-2.5 bg-[#0a0a0a] rounded-none border border-neutral-800 overflow-hidden">
                            <motion.div
                                className={`h-full rounded-none ${overallPercentage === 100
                                    ? 'bg-green-500'
                                    : 'bg-gradient-to-r from-[#991b1b] via-[#E60000] to-[#ff3333]'
                                    }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${overallPercentage}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-sm p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Target size={12} className="text-neutral-400" />
                                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                                    ACTIVE
                                </span>
                            </div>
                            <p className="font-mono text-lg font-bold text-[#E60000]">
                                {activeSubjects.length}
                            </p>
                        </div>

                        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-sm p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Clock size={12} className="text-neutral-400" />
                                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                                    STANDBY
                                </span>
                            </div>
                            <p className="font-mono text-lg font-bold text-neutral-300">
                                {standbySubjects.length}
                            </p>
                        </div>

                        <div
                            onClick={() => setShowDeadlineDialog(true)}
                            className="bg-[#0a0a0a] border border-neutral-800 rounded-sm p-3 cursor-pointer hover:border-[#E60000]/40 transition-all group/dl"
                        >
                            <div className="flex items-center gap-1.5 mb-1">
                                <Flame size={12} className="text-neutral-400" />
                                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                                    DEADLINE
                                </span>
                                <span className="ml-auto font-mono text-[9px] uppercase tracking-widest text-neutral-700 opacity-0 group-hover/dl:opacity-100 transition-opacity">
                                    EDIT
                                </span>
                            </div>
                            <p className={`font-mono text-lg font-bold ${daysUntilOverallDeadline < 60 ? 'text-[#E60000]' : 'text-orange-400'}`}>
                                {daysUntilOverallDeadline}
                                <span className="text-xs text-neutral-400 ml-1">DAYS</span>
                            </p>
                            <p className="font-mono text-[10px] text-neutral-400 mt-0.5">
                                {deadlineDateDisplay}
                            </p>
                        </div>

                        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-sm p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Activity size={12} className="text-neutral-400" />
                                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                                    COMPLETION
                                </span>
                            </div>
                            <p className={`font-mono text-lg font-bold ${overallPercentage === 100 ? 'text-green-400' : overallPercentage > 50 ? 'text-[#ff6666]' : 'text-[#E60000]'}`}>
                                {overallPercentage}%
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* ===== TOOLBAR ===== */}
            <div className="border-b border-neutral-800 bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 flex-wrap">
                    <button
                        onClick={() => setShowAddDialog(true)}
                        className="flex items-center gap-2 bg-[#111] hover:bg-[#1a1a1a] text-neutral-300 hover:text-white font-mono text-[11px] font-bold uppercase tracking-wider py-2 px-4 rounded-sm border border-neutral-700 hover:border-[#E60000] transition-all hover:shadow-[0_0_10px_rgba(230,0,0,0.2)]"
                    >
                        <Plus size={14} />
                        DEPLOY SUBJECT
                    </button>

                    <button
                        onClick={toggleMergeMode}
                        className={`flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider py-2 px-4 rounded-sm border transition-all ${mergeMode
                            ? 'bg-[#E60000]/10 text-[#E60000] border-[#E60000] shadow-[0_0_10px_rgba(230,0,0,0.3)]'
                            : 'bg-[#111] hover:bg-[#1a1a1a] text-neutral-300 hover:text-white border-neutral-700 hover:border-[#E60000] hover:shadow-[0_0_10px_rgba(230,0,0,0.2)]'
                            }`}
                    >
                        <GitMerge size={14} />
                        {mergeMode ? 'EXIT MERGE' : 'MERGE MODE'}
                    </button>

                    <button
                        onClick={toggleSplitMode}
                        className={`flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider py-2 px-4 rounded-sm border transition-all ${splitMode
                            ? 'bg-orange-500/10 text-orange-500 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                            : 'bg-[#111] hover:bg-[#1a1a1a] text-neutral-300 hover:text-white border-neutral-700 hover:border-orange-500 hover:shadow-[0_0_10px_rgba(249,115,22,0.2)]'
                            }`}
                    >
                        <Scissors size={14} />
                        {splitMode ? 'EXIT SPLIT' : 'SPLIT MODE'}
                    </button>

                    {mergeMode && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="font-mono text-[10px] uppercase tracking-widest text-[#E60000] flex items-center gap-1.5"
                        >
                            <AlertTriangle size={12} className="animate-pulse" />
                            SELECT 2 SUBJECTS TO MERGE ({mergeSelection.length}/2)
                        </motion.span>
                    )}

                    {splitMode && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="font-mono text-[10px] uppercase tracking-widest text-orange-500 flex items-center gap-1.5"
                        >
                            <AlertTriangle size={12} className="animate-pulse" />
                            SELECT A COMBINED SUBJECT TO SPLIT
                        </motion.span>
                    )}
                </div>
            </div>

            {/* ===== MAIN CONTENT — TWO-TIER LAYOUT ===== */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                <DndContext
                    sensors={sensors}
                    collisionDetection={collisionDetection}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    {/* ===== ACTIVE DIRECTIVES ZONE ===== */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center gap-2">
                                <Swords size={18} className="text-[#E60000]" />
                                <h2 className="font-mono text-sm font-black uppercase tracking-[0.2em] text-white">
                                    ACTIVE DIRECTIVES
                                </h2>
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-r from-[#E60000]/40 to-transparent" />
                            <button
                                onClick={archiveAllCompleted}
                                className="font-mono text-[10px] uppercase tracking-widest bg-[#111] hover:bg-[#1a1a1a] text-neutral-300 hover:text-white border border-neutral-700 hover:border-green-500 py-1 px-2 rounded-sm transition-all flex items-center gap-1.5"
                                title="Move all 100% active subjects to completed queue"
                            >
                                <CheckCheck size={12} className="text-green-500" />
                                ARCHIVE COMPLETED SUBJECTS
                            </button>
                            <span className="font-mono text-[10px] uppercase tracking-widest text-[#E60000] flex items-center gap-1">
                                <span className="animate-status-blink">●</span>
                                {activeSubjects.length} ENGAGED
                            </span>
                        </div>

                        <DroppableZone
                            id="zone-active"
                            className="min-h-[120px] rounded-sm border border-[#E60000]/20 bg-[#E60000]/[0.02] p-4"
                        >
                            <SortableContext
                                items={activeSubjects.map((s) => s.id)}
                                strategy={rectSortingStrategy}
                            >
                                {activeSubjects.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-neutral-600">
                                        <ShieldAlert size={32} className="mb-2 opacity-40" />
                                        <p className="font-mono text-xs uppercase tracking-widest">
                                            NO ACTIVE DIRECTIVES
                                        </p>
                                        <p className="font-mono text-[10px] text-neutral-700 mt-1">
                                            DRAG SUBJECTS HERE TO ACTIVATE
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {activeSubjects.map((subject) => (
                                            <SubjectCard key={subject.id} subject={subject} large onEdit={setEditingSubject} />
                                        ))}
                                    </div>
                                )}
                            </SortableContext>
                        </DroppableZone>
                    </section>

                    {/* ===== STANDBY QUEUE ZONE ===== */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center gap-2">
                                <Clock size={18} className="text-neutral-500" />
                                <h2 className="font-mono text-sm font-black uppercase tracking-[0.2em] text-neutral-400">
                                    STANDBY QUEUE
                                </h2>
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-r from-neutral-700/40 to-transparent" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">
                                {standbySubjects.length} PENDING
                            </span>
                        </div>

                        <DroppableZone
                            id="zone-standby"
                            className="min-h-[120px] rounded-sm border border-neutral-800 bg-neutral-900/30 p-4"
                        >
                            <SortableContext
                                items={standbySubjects.map((s) => s.id)}
                                strategy={rectSortingStrategy}
                            >
                                {standbySubjects.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-neutral-700">
                                        <Crosshair size={32} className="mb-2 opacity-30" />
                                        <p className="font-mono text-xs uppercase tracking-widest">
                                            STANDBY QUEUE EMPTY
                                        </p>
                                        <p className="font-mono text-[10px] text-neutral-800 mt-1">
                                            ALL SUBJECTS DEPLOYED
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {standbySubjects.map((subject) => (
                                            <SubjectCard key={subject.id} subject={subject} compact onEdit={setEditingSubject} />
                                        ))}
                                    </div>
                                )}
                            </SortableContext>
                        </DroppableZone>
                    </section>

                    {/* ===== COMPLETED QUEUE ZONE ===== */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-4 mt-10">
                            <div className="flex items-center gap-2">
                                <ShieldAlert size={18} className="text-green-500" />
                                <h2 className="font-mono text-sm font-black uppercase tracking-[0.2em] text-green-400">
                                    COMPLETED QUEUE
                                </h2>
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-r from-green-500/40 to-transparent" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-green-600">
                                {completedSubjects.length} SECURED
                            </span>
                        </div>

                        <DroppableZone
                            id="zone-completed"
                            className="min-h-[120px] rounded-sm border border-green-900/30 bg-green-900/10 p-4"
                        >
                            <SortableContext
                                items={completedSubjects.map((s) => s.id)}
                                strategy={rectSortingStrategy}
                            >
                                {completedSubjects.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-green-700/50">
                                        <ShieldAlert size={32} className="mb-2 opacity-30" />
                                        <p className="font-mono text-xs uppercase tracking-widest">
                                            COMPLETED QUEUE EMPTY
                                        </p>
                                        <p className="font-mono text-[10px] text-green-800 mt-1">
                                            NO SUBJECTS 100% COMPLETE YET
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {completedSubjects.map((subject) => (
                                            <SubjectCard key={subject.id} subject={subject} compact onEdit={setEditingSubject} />
                                        ))}
                                    </div>
                                )}
                            </SortableContext>
                        </DroppableZone>
                    </section>

                    {/* Drag overlay */}
                    <DragOverlay>
                        {activeSubject ? (
                            <SubjectCard subject={activeSubject} isDragOverlay />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </main>

            {/* ===== FOOTER ===== */}
            <footer className="border-t border-neutral-800 bg-[#080808]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-700">
                        GATE WAR ROOM v1.0 // NO MERCY. NO EXCUSES.
                    </p>
                    <a
                        href="https://github.com/devkaran-solanki/gate-war-room"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-neutral-500 hover:text-[#E60000] transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                            <path d="M9 18c-4.51 2-5-2-7-2" />
                        </svg>
                        SOURCE CODE
                    </a>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-700 flex items-center gap-1.5">
                        <span className="text-green-600 animate-status-blink">●</span>
                        SYSTEM OPERATIONAL
                    </p>
                </div>
            </footer>

            {/* ===== DIALOGS ===== */}
            <MergeDialog
                open={showMergeDialog}
                onClose={() => setShowMergeDialog(false)}
            />
            <SplitDialog
                open={showSplitDialog}
                onClose={() => setShowSplitDialog(false)}
            />
            <DeadlineDialog
                open={showDeadlineDialog}
                onClose={() => setShowDeadlineDialog(false)}
            />
            <AddSubjectDialog
                open={showAddDialog}
                onClose={() => setShowAddDialog(false)}
            />
            <EditSubjectDialog
                open={!!editingSubject}
                subject={editingSubject}
                onClose={() => setEditingSubject(null)}
            />
        </div>
    );
}
