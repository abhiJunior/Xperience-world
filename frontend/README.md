# Xperience — Frontend

The frontend for the Xperience AI Event Planner. Built with React 19, Tailwind CSS v4, and Vite.

## Tech Stack
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 (using CSS-native config in `index.css`)
- **State Management**: Zustand (UI and Auth state)
- **Data Fetching**: TanStack Query (React Query)
- **Forms & Validation**: React Hook Form + Zod
- **Icons**: Lucide React
- **HTTP Client**: Axios

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env`.
   ```bash
   cp .env.example .env
   ```
   *Note: In development, the Vite proxy is configured to forward `/api` requests to `http://localhost:5000` to avoid CORS and allow the HTTP-only refresh token cookie to work seamlessly.*

3. **Start the development server**:
   ```bash
   npm run dev
   ```

## Architecture

- **`src/api`**: API resource controllers (Axios instance configured with JWT interceptors).
- **`src/components/ui`**: Reusable Tailwind-styled primitive components (Buttons, Cards, Inputs, Modals, etc.).
- **`src/components/layout`**: App shell, sidebar, and header.
- **`src/components/assistant`**: The AI assistant chat interface.
- **`src/pages`**: Main route views (Dashboard, Tasks, Risks, Timeline, etc.).
- **`src/store`**: Zustand stores for global state.
- **`src/utils`**: Helper functions (date formatting, constants, class merger).

## Design System
The app follows a modern, premium design aesthetic defined primarily in `src/index.css`.
- **Primary Color**: Indigo (`#4F46E5`)
- **Backgrounds**: Soft gray (`#F8F9FB`) and crisp white cards.
- **Typography**: Inter (Google Fonts).
- **Status Colors**: Success (Green), Warning (Amber), Danger (Red), Info (Blue).
