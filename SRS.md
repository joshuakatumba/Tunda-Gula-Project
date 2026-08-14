# Software Requirements Specification (SRS) & Design Roadmap
**Project:** Tunda Gula Platform
**Version:** 1.0

## 1. Introduction
### 1.1 Purpose
This document provides a comprehensive Software Requirements Specification (SRS) and implementation roadmap for Tunda Gula. It outlines the architectural design, feature specifications, and technical pathways required to transition the platform from its current prototype state into a fully functional, production-ready agricultural marketplace.

### 1.2 Scope
Tunda Gula is a centralized agricultural platform connecting farmers directly with buyers across Uganda. The system encompasses a Django REST Framework (DRF) backend, a React (Vite) Single Page Application frontend, and a PostgreSQL database.

## 2. Overall Description
### 2.1 User Characteristics
The platform caters to three primary roles:
1.  **Sellers (Farmers/Aggregators):** Users who list agricultural produce or pre-harvest plans. Many operate in rural areas, requiring accessible interfaces (e.g., voice notes) and localized languages.
2.  **Buyers (Households/Institutions):** Users who browse, reserve, and purchase produce.
3.  **Administrators:** Staff managing user verifications, resolving disputes, and overseeing platform analytics.

### 2.2 Operating Environment
*   **Backend:** Python 3.12, Django 5.x, Django REST Framework, PostgreSQL 16. Containerized via Docker.
*   **Frontend:** React 18, Vite, Node.js. Hosted via Nginx.
*   **Infrastructure:** Deployed on cloud VMs (e.g., Azure/DigitalOcean) utilizing Docker Compose.

## 3. System Features & Design Roadmap

This section details the design and implementation strategy for all core platform features.

### 3.1 Authentication & Onboarding (Highest Priority)
*   **Description:** Secure, phone-based authentication using One-Time Passwords (OTP).
*   **Frontend Design (`/accounts/`):**
    *   Multi-step wizard UI (`Auth.tsx`) capturing Role, Type, Details, OTP, and GPS data.
    *   `AuthContext.tsx` manages session state via JWT tokens stored securely.
*   **Backend Design (`accounts` app):**
    *   `RegisterView`, `request_otp`, and `verify_otp` endpoints.
    *   Integrate third-party SMS gateway (e.g., Africa's Talking) for OTP delivery.
    *   Custom User model supporting `buyer` and `seller` profiles.

### 3.2 UI/UX Redesign: Premium Glassmorphism
*   **Description:** A complete visual overhaul to present a premium, trustworthy brand aesthetic.
*   **Design Implementation:**
    *   **Tokens & Utilities:** Update `tundagula.css` to include glassmorphic variables (translucent backgrounds, background-blur, subtle borders).
    *   **Components:** Refine modals (`Modal.tsx`), cards, and navigation bars with soft shadows and dynamic hover states.
    *   **Mobile:** Implement smooth slide-in navigation drawers for touch-first experiences.
    *   **Typography:** Utilize modern, highly legible fonts (e.g., Inter or Roboto).

### 3.3 Live Payments
*   **Description:** Secure transactions using Mobile Money, holding funds in escrow until delivery confirmation.
*   **Frontend Design (`/payments/`):**
    *   Checkout flow (`Checkout.tsx`) capturing MTN/Airtel provider selection.
    *   Polling mechanism to await push-notification approval from the user's phone.
*   **Backend Design (`payments` app):**
    *   API integration with Mobile Money aggregator (e.g., Flutterwave or direct MTN/Airtel APIs).
    *   Webhooks to asynchronously receive payment confirmations.
    *   Escrow logic mapping to the `Order` model's `status` (funds released upon `status='delivered'`).

### 3.4 GPS Tracking & Logistics Mapping
*   **Description:** Tracking farm locations and delivery routes.
*   **Frontend Design:**
    *   Integrate a mapping library (e.g., `react-leaflet`).
    *   Display obfuscated district-level data for buyers, and precise coordinates for administrators (`AdminDelivery.tsx`).
*   **Backend Design:**
    *   Add `gps_lat` and `gps_lng` fields to User (Seller) and Order models.
    *   Geo-spatial querying capabilities using PostGIS (optional, based on scale) or standard float bounding boxes.

### 3.5 Core Marketplace (Listings & Pre-Harvest)
*   **Description:** The primary engine for trade.
*   **Frontend Design:**
    *   Listing grids (`Marketplace.tsx`) with client-side/server-side filtering by district, category, and price.
    *   Dedicated forms (`ListingForm.tsx`, `PlanForm.tsx`) for sellers.
*   **Backend Design (`listings` app):**
    *   `Listing` and `PreHarvestPlan` models.
    *   `ViewSet` controllers handling CRUD operations.
    *   Image processing and storage configuration (AWS S3 or local volumes).

### 3.6 Accessibility: Voice Notes & i18n
*   **Description:** Ensuring the platform is usable by farmers regardless of literacy or language.
*   **Design Implementation:**
    *   **Voice Notes:** Frontend Web Audio API integration for recording. Backend `FileField` supporting audio formats. Buyer UI includes inline playback.
    *   **Localization (i18n):** Implement `react-i18next`. Extract hardcoded strings from components (currently seeded in `strings.ts`) to manage English, Luganda, and Swahili.

### 3.7 Order Lifecycle & Dispute Resolution
*   **Description:** State machine managing the transaction from placement to completion.
*   **Design Implementation (`orders` & `disputes` apps):**
    *   **Order States:** `placed` -> `accepted` -> `out_for_delivery` -> `delivered`.
    *   **Disputes:** If an order fails, buyers/sellers can raise a ticket. Backend `Dispute` model links to the Order and holds chat logs.
    *   **Admin Tools:** UI in `AdminDisputes.tsx` to view evidence and trigger refunds or payouts.

### 3.8 Live Market Data Automations
*   **Description:** Real-time commodity pricing to guide fair trade.
*   **Backend Design (`market_data` app):**
    *   Celery scheduled tasks configured to scrape or fetch data weekly from InfoTrade Connect/WFP APIs.
    *   Updates the `ReferencePrice` models to serve the frontend `PriceRail.tsx`.

## 4. Non-Functional Requirements
*   **Security:** Enforce strict JWT authentication. Validate all input. Secure webhook endpoints against spoofing.
*   **Performance:** Implement Redis caching for market data and frequent listing queries.
*   **Reliability:** CI/CD pipeline using GitHub Actions (referencing `.github/workflows/deploy.yml`) for zero-downtime deployments.
*   **Scalability:** Dockerized architecture allows for easy horizontal scaling of the Django application servers.
