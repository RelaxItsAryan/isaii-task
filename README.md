# Forge — BDA Team Management

A modern web application for managing leads, tasks, and team performance in business development operations. Built with React, TypeScript, and Supabase.

## Features

### 📊 Dashboard
- Real-time metrics: active leads, closed deals, conversion rate, average deal size
- Lead pipeline funnel visualization
- Team performance tracking
- Recent activity feed
- Upcoming follow-ups

### 🎯 Lead Management
- Full CRUD operations for leads
- Pipeline stages: New Lead → Contacted → Qualified → Proposal Sent → Closed Won/Lost
- Deal value tracking
- Lead assignment to team members
- Bulk actions and filtering
- Export functionality

### 👥 Client Management
- Client database with contact information
- Phone and email tracking
- Client-lead relationships
- Client contact history

### 📋 Pipeline Management
- Visual pipeline board with drag-and-drop stages
- Real-time lead status updates
- Quick actions (edit, delete, reassign)
- Stage-based organization

### ✅ Task Management
- Create and manage follow-up tasks
- Priority levels (High, Medium, Low)
- Due date tracking
- Status management (Pending, Completed)
- Task assignment to team members

### 📈 Reports & Analytics
- Revenue tracking and forecasting
- Team performance metrics
- Activity analytics
- Conversion rate analysis
- Customizable reports

### 👨‍💼 Team Management
- Team member profiles
- Role assignments
- Performance statistics
- Lead allocation tracking

## Tech Stack

- **Frontend Framework**: React 19 + TypeScript
- **Full-Stack Framework**: TanStack Start
- **Styling**: Tailwind CSS + PostCSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: Radix UI, shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts
- **Build Tool**: Vite
- **Server**: Cloudflare Workers (deployment ready)
- **Form Handling**: React Hook Form + Zod validation
- **State Management**: TanStack Query (React Query)
- **Routing**: TanStack Router

## Getting Started

### Prerequisites
- Node.js 18+ (npm or bun)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd isaii-task
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory with your Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building

Build for production:
```bash
npm run build
```

Build for development mode:
```bash
npm run build:dev
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
isaii-task/
├── src/
│   ├── routes/              # TanStack Router pages
│   │   ├── __root.tsx      # Root layout
│   │   ├── index.tsx       # Home/redirect
│   │   ├── login.tsx       # Authentication
│   │   ├── register.tsx    # Registration
│   │   ├── _authenticated/ # Protected routes
│   │   │   ├── dashboard.tsx
│   │   │   ├── leads.tsx
│   │   │   ├── clients.tsx
│   │   │   ├── pipeline.tsx
│   │   │   ├── tasks.tsx
│   │   │   ├── reports.tsx
│   │   │   ├── team.tsx
│   │   │   └── settings.tsx
│   ├── components/          # Reusable React components
│   │   ├── layout/         # Header, sidebar, nav
│   │   └── ui/             # UI primitives (buttons, dialogs, etc.)
│   ├── contexts/           # React context (auth, etc.)
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # Third-party integrations
│   │   └── supabase/       # Database client
│   ├── lib/                # Utility functions
│   ├── styles.css          # Global styles
│   ├── server.ts           # Server entry point
│   ├── start.ts            # Client entry point
│   └── router.tsx          # Router configuration
├── public/                 # Static assets
│   └── favicon.jpg        # Site favicon
├── supabase/              # Database migrations
├── package.json
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── .env                   # Environment variables
```

## Key Workflows

### Creating a Lead
1. Go to **Leads** page
2. Click "Add Lead" button
3. Fill in company name, deal value, stage, and assign to team member
4. Save

### Managing Pipeline
1. Go to **Pipeline** page
2. View leads organized by stage
3. Drag leads between stages to update status
4. Click on a lead to edit details

### Tracking Tasks
1. Go to **Tasks** page
2. Create new task with due date and priority
3. Assign to team members
4. Mark as complete when done

### Viewing Analytics
1. Go to **Dashboard** for quick overview
2. Go to **Reports** for detailed analytics
3. Filter by date range, team member, or stage

## Database Schema

### Key Tables
- **leads** - Lead pipeline management
- **profiles** - Team member information
- **activities** - Activity log (calls, emails, updates)
- **tasks** - Follow-up tasks and reminders
- **clients** - Client contact database

## Authentication

The application uses Supabase Auth for user management:
- Email/password signup and login
- Session-based authentication
- Protected routes for authenticated users
- Auto-redirect to login for unauthenticated access

## Deployment

### Deploy to Cloudflare
```bash
npm run build
# Upload dist/ folder to Cloudflare Workers
```

The project is configured for Cloudflare deployment via the `@cloudflare/vite-plugin`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run build:dev` | Build for development |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Performance

Recent optimizations:
- ✅ Replaced heavy MUI icon library with lightweight Lucide React
- ✅ Optimized bundle size
- ✅ Lazy loading for routes
- ✅ Efficient database queries with Supabase
- ✅ Tailwind CSS for minimal CSS footprint

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Make your changes
3. Format code (`npm run format`)
4. Lint code (`npm run lint`)
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Troubleshooting

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf dist && npm run build`

### Authentication Issues
- Verify Supabase credentials in `.env`
- Check browser console for error messages
- Ensure email is confirmed in Supabase

### Database Connection
- Verify network connectivity
- Check Supabase project status
- Ensure API keys are correct

## License

Proprietary - Forge Manufacturing

## Support

For issues or questions, please contact the development team.
