# Fleet Management V2 - Setup Guide

Complete setup instructions for getting the project running locally.

## Quick Start (5 minutes)

```bash
# 1. Navigate to project
cd fleet-management-v2

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Make Husky hooks executable
chmod +x .husky/pre-commit

# 5. Generate database types
npm run db:types

# 6. Start development server
npm run dev
```

Visit http://localhost:3000

## Detailed Setup

### 1. Prerequisites

Ensure you have:

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Git** for version control
- **Supabase** account with a project

Check versions:

```bash
node --version  # Should be 18+
npm --version   # Should be 9+
```

### 2. Supabase Project Setup

#### Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in project details:
   - Name: `fleet-management-v2`
   - Database Password: (save this securely)
   - Region: Choose closest to you
4. Wait for project to be ready (~2 minutes)

#### Get API Credentials

1. Go to Project Settings > API
2. Copy the following:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon (public) key: `eyJh...`
   - Service Role key: `eyJh...` (keep secret!)

#### Configure Database

Run this SQL in Supabase SQL Editor:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create example pilots table
CREATE TABLE pilots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE pilots ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view pilots"
  ON pilots FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert pilots"
  ON pilots FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update pilots"
  ON pilots FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX idx_pilots_email ON pilots(email);
CREATE INDEX idx_pilots_status ON pilots(status);
CREATE INDEX idx_pilots_created_at ON pilots(created_at DESC);
```

### 3. Environment Configuration

Create `.env.local` from template:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Replace with your actual values from Supabase
NEXT_PUBLIC_SUPABASE_URL=https://wgdmgvonqysflwdiiols.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Development URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# App Configuration
NEXT_PUBLIC_APP_NAME="Fleet Management V2"
NEXT_PUBLIC_APP_VERSION="0.1.0"

# Optional: Service Role Key (server-side only, NEVER expose to client)
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 4. Install Dependencies

```bash
npm install
```

This will:
- Install all packages (~30 seconds)
- Setup Husky git hooks automatically
- Generate `node_modules/` directory

### 5. Generate Database Types

```bash
npm run db:types
```

This generates TypeScript types from your Supabase schema into `types/supabase.ts`.

**Note**: Run this command whenever you change your database schema.

### 6. Verify Installation

Run all quality checks:

```bash
npm run validate
```

This runs:
- TypeScript type checking
- ESLint linting
- Prettier format checking

All should pass ✅

### 7. Start Development Server

```bash
npm run dev
```

Server starts at: http://localhost:3000

You should see:
```
  ▲ Next.js 15.5.4
  - Local:        http://localhost:3000
  - Ready in 2.5s
```

## Additional Setup

### Storybook

View and develop components in isolation:

```bash
npm run storybook
```

Storybook UI: http://localhost:6006

### Playwright Testing

Install browser binaries:

```bash
npx playwright install
```

Run tests:

```bash
npm test
```

### VS Code Extensions

Recommended extensions (install from VS Code):

1. **ESLint** - `dbaeumer.vscode-eslint`
2. **Prettier** - `esbenp.prettier-vscode`
3. **Tailwind CSS IntelliSense** - `bradlc.vscode-tailwindcss`
4. **TypeScript** - Built-in
5. **Playwright Test** - `ms-playwright.playwright`

Settings are pre-configured in `.vscode/settings.json`

### Git Configuration

Ensure Husky hooks are executable:

```bash
chmod +x .husky/pre-commit
```

Test pre-commit hook:

```bash
git add .
git commit -m "test: verify pre-commit hook"
```

Should run:
- lint-staged (ESLint + Prettier)
- Type checking

## Troubleshooting

### Issue: "Cannot find module '@/components/...'"

**Solution**: Restart TypeScript server in VS Code
- Cmd/Ctrl + Shift + P
- "TypeScript: Restart TS Server"

### Issue: "Supabase connection error"

**Checklist**:
- [ ] Verified `.env.local` exists
- [ ] Copied correct Supabase URL and anon key
- [ ] No spaces or quotes around values
- [ ] Restarted dev server after changing .env

### Issue: "Tailwind classes not working"

**Solutions**:
- Verify `postcss.config.js` exists
- Check `app/globals.css` imports Tailwind
- Clear `.next` folder: `rm -rf .next`
- Restart dev server

### Issue: "Type error in types/supabase.ts"

**Solution**: Regenerate types
```bash
npm run db:types
```

### Issue: "Playwright tests failing"

**Solutions**:
- Install browsers: `npx playwright install`
- Check if dev server is running
- View test report: `npx playwright show-report`

### Issue: "Husky hooks not running"

**Solution**: Reinstall Husky
```bash
npm run prepare
chmod +x .husky/pre-commit
```

### Issue: "Port 3000 already in use"

**Solution**: Kill process or use different port
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Or use different port
PORT=3001 npm run dev
```

## Next Steps

After setup is complete:

1. **Explore the Codebase**
   - Read `README.md` for overview
   - Check `CONTRIBUTING.md` for guidelines
   - Browse `components/` directory

2. **View Storybook**
   ```bash
   npm run storybook
   ```

3. **Run Tests**
   ```bash
   npm test
   ```

4. **Start Building**
   - Create new components in `components/`
   - Add pages in `app/`
   - Write tests in `e2e/`

5. **Read Documentation**
   - Next.js: https://nextjs.org/docs
   - Supabase: https://supabase.com/docs
   - shadcn/ui: https://ui.shadcn.com
   - Tailwind: https://tailwindcss.com/docs

## Development Workflow

```bash
# 1. Start dev server
npm run dev

# 2. Make changes to code

# 3. Check code quality
npm run validate

# 4. Run tests
npm test

# 5. Commit changes
git add .
git commit -m "feat: add new feature"

# 6. Push to repository
git push origin main
```

## Production Build

Test production build locally:

```bash
npm run build
npm run start
```

Visit http://localhost:3000

## Getting Help

- **Documentation**: Check `docs/` folder
- **Component Examples**: View in Storybook
- **Issues**: Create GitHub issue
- **Questions**: Open discussion

---

**Setup Complete!** 🎉

You're ready to start building with Fleet Management V2.
