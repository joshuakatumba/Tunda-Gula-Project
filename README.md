# TundaGula

> Uganda's open agricultural marketplace. From farm, to you.

TundaGula is a centralized agricultural platform connecting farmers directly with buyers across Uganda. By removing intermediaries, TundaGula ensures that farmers get a fair price for their produce, and buyers access fresh food at transparent, market-driven rates.

## Features

- **Direct Trading:** Verified farmers list their produce; verified buyers order directly.
- **Role-Based Workspaces:** Dedicated dashboards tailored for Sellers, Buyers, and Admin staff.
- **Live Market Data:** Integrates reference prices (from InfoTrade Connect and the WFP food price database) updated weekly so all parties make informed decisions.
- **Multilingual Support:** Accessible in English, Luganda, and Swahili.
- **Pre-harvest Sales:** Farmers can list produce before harvest; buyers can reserve with a deposit, securing income early.
- **Inclusive Accessibility:** Voice note support for farmers who prefer speaking over typing.
- **Mobile Money Integration:** Seamless, escrow-like transactions using MTN or Airtel Mobile Money, where funds are held until delivery is confirmed.

## Tech Stack

This project is a modern, modular Single Page Application (SPA) built with:

- **React 18** - Frontend framework
- **Vite** - Next-generation frontend tooling and bundler
- **Lucide React** - Modern, crisp iconography
- **Vanilla CSS** - Flexible, performant, and custom styling system

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/joshuakatumba/Tunda-Gula-Project.git
   ```
2. Navigate to the project directory:
   ```bash
   cd "Tunda Gula"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Development Server

Start the local Vite development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3002`.

### Build for Production

To create a production-ready bundle:

```bash
npm run build
```

To preview the built app locally:

```bash
npm run preview
```

## Project Structure

The codebase is modularized for maintainability, separating concerns by user roles and shared resources:

- `/src/admin/`: Admin dashboard and platform management tools (verification, disputes, deliveries, reports).
- `/src/buyer/`: Buyer interface (marketplace, pre-orders, order tracking, checkout).
- `/src/seller/`: Seller workspace (listings management, pre-harvest plans, ratings, payouts).
- `/src/landing/`: Marketing, informational pages, and the main entry point.
- `/src/auth/`: Authentication and multi-step registration flows.
- `/src/components/`: Reusable, shared UI components (Price rails, badges, modals, etc.).
- `/src/data/`: Application data, seed data, reference prices, and localized language strings.
- `/src/styles/`: Global CSS styling (`tundagula.css`).

## License

© 2026 TundaGula Limited. Prototype built to SRS v1.0. All Rights Reserved.
