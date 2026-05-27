<div align="center">
  <img src="public/skull.svg" width="80" alt="Skull Logo" />
  <h1 align="center">GATE WAR ROOM</h1>

  <p align="center">
    <strong>NO MERCY. NO EXCUSES.</strong><br/>
    An aggressive, high-tension, brutally aesthetic dashboard built to track preparation for the GATE 2027 examination.
  </p>

  <p align="center">
    <a href="https://gate-war-room.vercel.app/"><strong>View Live Dashboard</strong></a>
  </p>

  <p align="center">
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js" alt="Next.js" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://zustand-demo.pmnd.rs/"><img src="https://img.shields.io/badge/Zustand-4A4A55?style=flat-square" alt="Zustand" /></a>
    <a href="https://framer.com/motion/"><img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer" alt="Framer Motion" /></a>
  </p>
</div>

---

## 🎯 The Mission

The **GATE War Room** is not a standard, passive checklist. It is designed to induce urgency, focus, and a sense of "do or die." I built this specifically to maintain psychological pressure and strict accountability while preparing for **GATE 2027**.

### 🔗 Live Deployment
**[https://gate-war-room.vercel.app/](https://gate-war-room.vercel.app/)**

---

## ⚡ Core Arsenal (Features)

- **Two-Tier Command Structure**: 
  - **Active Directives**: The subjects currently under execution. Large, prominent, and demanding attention.
  - **Standby Queue**: Subjects waiting for deployment. Compact, organized, and out of the immediate line of fire.
- **Tactical Drag-and-Drop**: Seamlessly drag subjects between the Standby Queue and Active Directives. Built with `@dnd-kit/core` with fluid, real-time spatial shifting.
- **Aggressive Time Tracking**: Track completion days vs. total allocated days per subject with visceral, glowing progress bars.
- **Dynamic Threat Calculation**: The deadline automatically calculates based on the remaining days of *only* the Active Directives, giving a hard date for completion.
- **Merge Protocol**: Ability to select two subjects and fuse them into a single, combined directive (e.g., merging TOC and Compiler Design).
- **Persistent Local State**: State is preserved entirely in your browser via `localStorage`. No accounts, no database delays.

---

## 🎨 Aesthetic Doctrine

The interface is inspired by brutalist military command terminals and cyberpunk interfaces.
- **Pitch Black Foundation**: `#050505` and deep matte grays.
- **Piercing Crimson Accents**: `#E60000` to simulate emergency lighting and critical status.
- **Animations**: Glitch effects, scanning lines, status blinks, and flickering numbers for deadlines less than 60 days away.
- **Typography**: Heavy, monospaced fonts (`JetBrains Mono`) for maximum utilitarian feel.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (with `persist` middleware)
- **Drag & Drop**: [@dnd-kit](https://dndkit.com/) (using `rectSortingStrategy` for grid stability)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Running Locally

If you want to spin up your own instance of the War Room:

```bash
# 1. Clone the repository
git clone https://github.com/devkaran-solanki/gate-war-room.git

# 2. Navigate into the directory
cd gate-war-room

# 3. Install dependencies
npm install

# 4. Start the command center
npm run dev
```

Open `http://localhost:3000` in your browser.

---

> *"The successful warrior is the average man, with laser-like focus."*  
> — Bruce Lee
