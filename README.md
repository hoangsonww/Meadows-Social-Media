# Meadows - A Next.js Social Media for Gen-Z 🍃

A full-featured social feed application built with Next.js, Supabase, and React Query. Meadows lets users create posts (with optional images), follow other users, like posts, and manage their profiles. It includes infinite scrolling, light/dark mode, and a responsive, mobile-friendly design.

<p align="center">
  <a href="https://meadows.vercel.app/">
    <img src="img/logo.png" alt="Meadows Logo" width="30%" style="border-radius: 8px;" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Shadcn%20UI-111?style=for-the-badge&logo=shadcnui&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white" alt="React Query" />
  <img src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E" alt="JavaScript" />
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/lucide-000000?style=for-the-badge&logo=lucide&logoColor=white" alt="Lucide React" />
  <img src="https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white" alt="React Router" />
  <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" alt="ESLint" />
  <img src="https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black" alt="Prettier" />
  <img src="https://img.shields.io/badge/Zod-2B6CB0?style=for-the-badge&logo=zod&logoColor=white" alt="Zod" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Jest-333?style=for-the-badge&logo=jest&logoColor=C21325" alt="Jest" />
  <img src="https://img.shields.io/badge/Cypress-17202C?style=for-the-badge&logo=cypress&logoColor=white" alt="Cypress" />
  <img src="https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white" alt="GitHub Actions" />
  <img src="https://img.shields.io/badge/Markdown-000000?style=for-the-badge&logo=markdown&logoColor=white" alt="Markdown" />
</p>

> [!IMPORTANT]
> **Live Web App**: **[https://meadows.vercel.app/](https://meadows.vercel.app/).** 🍃
>
> Please give it a try and start sharing your thoughts stylishly!

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Environment Variables](#environment-variables)
5. [Project Structure](#project-structure)
6. [Architecture Docs](#architecture-docs)
7. [Key Components](#key-components)
8. [Scripts](#scripts)
9. [Supabase Setup](#supabase-setup)
10. [Testing & Formatting](#testing--formatting)
11. [GitHub Actions](#github-actions)
12. [Contributing](#contributing)
13. [License](#license)
14. [Acknowledgments](#acknowledgments)
15. [Contact](#contact)

---

## User Interface

<p align="center">
  <img src="img/landing.png" alt="Landing Page" width="100%" />
  <img src="img/home.png" alt="Home Feed" width="100%" />
  <img src="img/post.png" alt="Post Page" width="100%" />
  <img src="img/post-1.png" alt="Post Page with Poll" width="100%" />
  <img src="img/profile.png" alt="Profile Page" width="100%" />
  <img src="img/signup.png" alt="Sign Up Page" width="100%" />
  <img src="img/login.png" alt="Login Page" width="100%" />
</p>

---

## Features

- **User Authentication** via Supabase
- **Profile Management**: upload/change avatar, view followers/following
- **Post Creation**: text + multiple image uploads with responsive galleries
- **Infinite Scrolling** for feeds and profiles
- **Like/Unlike** posts
- **Vibe Check Reactions**: one-tap social signals (Aura Up, Real, Mood, Chaotic) with a live top-vibe meter
- **Daily Vibe Pulse**: one-tap daily check-in + live social mood dashboard with a Vibe Mix Wheel, Vibe Skyline, and weekly recap
- **Quick Poll Posts**: create 2-4 option polls in the composer, vote directly in feed or post detail, and see live percentages
- **Comments & Replies**: full post threads with one-level reply depth for clean conversation UX
- **Comment Vibe Reactions**: same vibe language on comments for consistent emotional feedback
- **Mentions in Comments**: `@handle` suggestions while typing, mention highlighting, and mention notifications
- **Notifications Center**: in-header unread badge and latest interaction notifications
- **Global Profile Search**: live typeahead search by name/handle, keyboard navigation, click-to-open profile
- **Follow/Unfollow** other users
- **Light/Dark Mode** toggle
- **Share & Copy Link** buttons using Web Share API
- **Responsive Layout** with mobile-optimized navigation and interaction controls
- **Client-side Bookmarking** (via `localStorage`)
- **Server-Side Rendering** for initial data fetch
- **TypeScript** for type safety
- **Zod** for schema validation
- **ESLint & Prettier** for code quality
- and more!

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Authentication & Database**: [Supabase](https://supabase.com/)
- **Data Fetching**: [React Query](https://tanstack.com/query/)
- **UI Components**: Custom, plus [lucide-react](https://lucide.dev/) icons
- **Styling**: Tailwind CSS (via shadcn/ui conventions)
- **File Storage**: Supabase Storage
- and more!

---

## Getting Started

1. **Clone the repo**

```bash
git clone https://github.com/hoangsonww/Meadows-Social-Media.git
cd Meadows-Social-Media/web
```

2. **Install dependencies**

```bash
npm install
# or
yarn
```

3. **Set up environment variables** (see next section)

4. **Run the dev server**

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a `.env.local` file at project root with:

```ini
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
```

You can find these in your Supabase project settings.

---

## Project Structure

```text
/
├── database/                         # SQL schema/feature files
├── migrations/                       # runnable migration scripts
├── web/
│   ├── components/
│   │   ├── header.tsx               # global navbar + notifications + profile search
│   │   ├── post.tsx                 # feed post card
│   │   ├── post-comments.tsx        # comments, replies, mentions, comment vibes
│   │   ├── daily-vibe-pulse.tsx     # pulse dashboard + vibe charts
│   │   └── ui/                      # shadcn/ui-style components
│   ├── pages/
│   │   ├── index.tsx                # landing page
│   │   ├── home.tsx                 # main feed + composer
│   │   ├── pulse.tsx                # daily pulse page
│   │   ├── post/[id].tsx            # post detail + comments
│   │   ├── profile/[id].tsx         # profile page
│   │   ├── login.tsx / signup.tsx   # auth entry
│   │   └── _app.tsx
│   ├── utils/supabase/
│   │   ├── clients/                 # browser + SSR clients
│   │   ├── models/                  # Zod schemas
│   │   └── queries/                 # data access logic
│   ├── styles/globals.css
│   └── package.json
└── README.md
```

---

## Architecture Docs

For a full technical deep-dive (runtime boundaries, data model, query architecture, feature flows, and Mermaid diagrams), see:

- [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Key Components

### `<Header />`

- Responsive global navbar (mobile-first behavior)
- Live profile search by name/@handle with keyboard navigation
- Notifications dropdown with unread badge and read-on-open behavior
- Quick access actions: Pulse, Create Post, Theme toggle, Account menu

### `<HomePage />`

- “Write a Post” card with multi-image upload and optional polls
- Tabs: Feed / Following / Liked / Mine
- Inline infinite scroll of `<PostCard />`

### `<PostFeed />` (embedded directly)

- Renders `<PostCard />` components inline
- IntersectionObserver to fetch more

### `<PostPage />`

- Single post view
- Share, copy link, email, print, bookmark button
- Full comments experience via `<PostComments />`

### `<PostComments />`

- Top/Newest comment sorting
- One-level threaded replies (reply-to-reply handled cleanly in the same thread model)
- Mention suggestions and highlighted mentions
- Comment vibe reactions, report, and delete-own-comment actions

### `<DailyVibePulse />`

- Daily vibe check-in with optional status note
- Meadows Pulse visualization (Vibe Mix Wheel + Vibe Skyline)
- Circle vibe statuses and weekly recap cards
- Top posts influencing today’s social mood

### `<PublicProfilePage />`

- Profile header: avatar, name, handle, follow button
- Stats: posts, followers, following
- Infinite scroll of user’s posts
- Modals for followers/following lists

---

## Scripts

- `dev`: Start development server
- `build`: Create a production build
- `start`: Run production build
- `lint`: Run ESLint
- `format`: Run Prettier

---

## Supabase Setup

This project uses Supabase for Auth, Postgres, and Storage.

To set up Supabase:

1. Create a new project on [Supabase](https://supabase.com/).
2. Set up auth provider(s) (email/password is enough for local development).
3. Run SQL from the migration files in [`/migrations`](./migrations), especially:
   - [`all_tables_only.sql`](./migrations/all_tables_only.sql) for full table definitions
   - [`20260316_add_daily_vibe_and_comments.sql`](./migrations/20260316_add_daily_vibe_and_comments.sql) for Daily Vibe Pulse + comments/replies + notifications feature pack
4. Create/verify storage buckets:
   - `avatars`
   - `images`
5. Update `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
6. Verify app flows: auth, post creation, vibe reactions, comments/replies, pulse dashboard, and profile search.

FYI, you can find the schema definitions under the [database directory](./database). Below is a visual representation of the database schema:

<p align="center">
  <img src="img/schema.png" alt="Supabase" width="100%"/>
</p>

---

## Testing & Formatting

This project uses Jest for testing and Prettier for code formatting.

To run tests:

```bash
cd web

npm run test
# or
yarn test

# To run tests in watch mode
npm run test:watch
# or
yarn test:watch

# To run tests with coverage report
npm run coverage
# or
yarn coverage
```

To format code:

```bash
cd web

npm run format
# or
yarn format
```

Running `npm run format` will automatically format your code according to the Prettier configuration. It is recommended to run this command **every time** before committing changes to ensure consistent code style.

---

## GitHub Actions

This project uses GitHub Actions for continuous integration. The workflow is defined in `.github/workflows/ci.yml`. It runs the following checks on every push and pull request:

- Linting with ESLint
- Formatting with Prettier
- Running tests with Jest
- Building the Next.js application
- Checking for type errors with TypeScript
- Deploying to Vercel if all checks pass

The workflow ensures that all code changes meet the project's quality standards before being merged into the main branch.

---

## Contributing

1. Fork this repo
2. Create a feature branch (`git checkout -b feature/x`)
3. Commit your changes (`git commit -m "feat: your message"`)
4. Push to your branch (`git push origin feature/x`)
5. Open a pull request

Please ensure all new code is covered by tests and adheres to the project’s coding standards.

---

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

Please note that while this project is open-source, it is intended for educational purposes and personal use. Please do not use it for commercial purposes without prior permission, and always give credit to the original authors regardless of usage.

---

## Acknowledgments

Big thanks to Prof. Ajay Gandecha at UNC-Chapel Hill for the inspiration and basic structure of this project. The original project was a simple social media app, and this version has been significantly expanded with additional features and improvements.

Additionally, thanks to the open-source community for the libraries and tools that made this project possible, including Next.js, Supabase, React Query, Tailwind CSS, and many others.

---

## Contact

If you have any questions or feedback, feel free to reach out to me via either:

- **Email**: [hoangson091104@gmail.com](mailto:hoangson091104@gmail.com)
- **GitHub**: [hoangsonww](https://github.com/hoangsonww)
- **LinkedIn**: [Son Nguyen](https://www.linkedin.com/in/hoangsonw/)

I welcome contributions, suggestions, and any issues you may encounter while using this project. Your feedback is invaluable in making Meadows better for everyone!

---

Thank you for checking out Meadows! I hope you find it useful and enjoyable to use. If you have any questions or suggestions, feel free to reach out or open an issue on GitHub. Happy coding! 🍃
