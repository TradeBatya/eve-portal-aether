# EVE Online Corporation Management System

A modern web application for managing EVE Online corporation operations, intel, and member authentication.

## Project info

**URL**: https://lovable.dev/projects/b7ff3560-e7f8-408a-8f50-911559f30ad0

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Lovable Cloud (Supabase)
- **Authentication**: EVE Online SSO + Discord OAuth2
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── ui/           # shadcn/ui components
│   ├── admin/        # Admin panel components
│   ├── dashboard/    # Dashboard widgets
│   ├── intel/        # Intel reporting components
│   └── operations/   # Fleet operations components
├── pages/            # Main application pages
├── contexts/         # React contexts (Auth, Language)
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
├── utils/            # Utility functions and helpers
├── plugins/          # Plugin system
└── integrations/     # Supabase client integration

supabase/
├── functions/        # Edge functions
└── migrations/       # Database migrations
```

## Features

- ✅ **Authentication**: EVE Online SSO and Discord OAuth2
- ✅ **Role Management**: Flexible role-based access control
- ✅ **Fleet Operations**: Schedule and manage fleet operations
- ✅ **Intel Reports**: Real-time hostile activity tracking
- ✅ **News System**: Bilingual news management (EN/RU)
- ✅ **Plugin System**: Extensible architecture for custom features
- ✅ **Storage**: Avatar and media file management
- ✅ **Internationalization**: English and Russian support

## Database Tables

- `profiles` - Extended user profiles
- `corporations` - EVE Online corporations data
- `alliances` - EVE Online alliances data
- `roles` - System roles and permissions
- `user_roles` - User role assignments
- `fleet_operations` - Fleet operation scheduling
- `operation_signups` - Operation participation
- `intel_reports` - Hostile activity reports
- `ping_notifications` - Urgent notifications
- `news` - Bilingual news articles
- `plugins` - Available plugins
- `user_plugins` - User-installed plugins
- `eve_characters` - EVE character data
- `corporation_role_mappings` - Corp role to system role mapping

## Storage Buckets

- `avatars` - User avatar images (5MB limit)
- `media` - General media files (10MB limit)

## Authentication Providers

### EVE Online SSO
- All ESI scopes enabled
- Character and corporation data sync
- Automatic role mapping based on in-game roles

### Discord OAuth2
- Scopes: email, guilds, guilds.join, identify
- Server integration for role synchronization
- Avatar and profile data sync

## Getting Started

### Use Lovable

Simply visit the [Lovable Project](https://lovable.dev/projects/b7ff3560-e7f8-408a-8f50-911559f30ad0) and start prompting.

### Use your preferred IDE

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Environment Variables

All environment variables are automatically managed by Lovable Cloud:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## Security

- Row Level Security (RLS) enabled on all tables
- Secure edge functions for OAuth flows
- Role-based access control (RBAC)
- Automatic session management
- Secure file storage with access policies

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Plugin Development

Create custom plugins by implementing the `Plugin` interface:

```typescript
import { Plugin } from '@/types/plugin';

const myPlugin: Plugin = {
  metadata: {
    id: 'my-plugin',
    name: 'My Plugin',
    version: '1.0.0',
    description: 'Plugin description',
    author: 'Author Name',
  },
  hooks: {
    onLoad: async () => {
      // Initialization logic
    },
  },
  routes: [
    {
      path: '/my-plugin',
      element: <MyPluginPage />,
      protected: true,
    },
  ],
  navItems: [
    {
      title: 'My Plugin',
      href: '/my-plugin',
      order: 100,
    },
  ],
};
```

## Deployment

Simply open [Lovable](https://lovable.dev/projects/b7ff3560-e7f8-408a-8f50-911559f30ad0) and click on Share -> Publish.

## Custom Domain

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## License

Private - EVE Online Corporation Use Only
