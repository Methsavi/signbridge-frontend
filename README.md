# SignBridge Frontend

React + Vite frontend for the SignBridge application. It provides the public site, translator experience, dictionary views, authentication screens, profile management, and supporting pages.

## Tech Stack

- React 19
- Vite
- React Router
- Axios
- Framer Motion
- Recharts
- Tailwind CSS
- MediaPipe browser packages and webcam support

## Prerequisites

- Node.js 18+ recommended
- Backend API running locally or remotely

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure any environment values required by `src/services/api.js` or Appwrite integration.

## Run

Development server:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Lint the project:

```bash
npm run lint
```

## Main Pages

- Home
- Translator
- Dictionary
- How To Use
- About
- Login / Register
- Profile
- Privacy Policy
- Terms

## Project Structure

- `src/pages/` - route-level screens
- `src/components/` - shared UI components
- `src/context/` - app state providers
- `src/services/api.js` - backend API client
- `public/` - static assets and reference files

## Notes

- The frontend currently expects the backend API and media assets to be available.
- If you change backend ports or deployment URLs, update the API configuration accordingly.
