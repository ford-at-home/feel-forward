# Feel Forward Frontend

The Feel Forward frontend is a React TypeScript application that provides an intuitive interface for users to navigate through the five-phase self-awareness workflow.

## 🛠 Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks
- **HTTP Client**: Axios with retry logic
- **Testing**: Vitest + React Testing Library + Playwright

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/          # shadcn/ui components
│   └── phase/       # Phase-specific components
├── contexts/        # React contexts for state
├── hooks/           # Custom React hooks
├── lib/             # Utilities and API client
├── pages/           # Page components
├── services/        # API service layer
└── types/           # TypeScript type definitions
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 5173)
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm run test             # Run unit tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run Playwright E2E tests

# Code Quality
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript compiler

# Deployment
npm run deploy:prod      # Deploy to production
npm run deploy:staging   # Deploy to staging environment
```

## 🌐 Environment Configuration

Create `.env.local` for development:
```env
VITE_API_URL=http://localhost:8000
```

Create `.env.production` for production:
```env
VITE_API_URL=https://api.feelfwd.app
```

## 🏗 Architecture

### Component Architecture
- **Atomic Design**: UI components follow atomic design principles
- **Composition**: Complex components built from simpler ones
- **Type Safety**: Full TypeScript coverage with strict mode

### State Management
- **Session Context**: Manages user session and progress
- **Phase Context**: Handles current phase state and transitions
- **Error Boundary**: Global error handling with user-friendly messages

### API Integration
- **Centralized Client**: All API calls through `lib/api.ts`
- **Retry Logic**: Automatic retry with exponential backoff
- **Error Handling**: Comprehensive error handling with fallbacks
- **Type Safety**: Fully typed request/response models

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliance
- **Loading States**: Skeleton screens and progress indicators
- **Error States**: User-friendly error messages
- **Animations**: Smooth transitions between phases
- **Dark Mode**: System preference detection

## 🧪 Testing Strategy

### Unit Tests
- Component testing with React Testing Library
- Hook testing with renderHook
- Service layer testing with mocked APIs

### Integration Tests
- API integration tests
- Context integration tests
- Component interaction tests

### E2E Tests
- Full workflow testing with Playwright
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile viewport testing

## 📊 Performance Optimizations

- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Dynamic imports for heavy components
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: For long lists (scenarios)
- **Image Optimization**: WebP with fallbacks
- **Bundle Size**: ~150KB gzipped

## 🔒 Security Considerations

- **Content Security Policy**: Strict CSP headers
- **Input Validation**: Client-side validation
- **XSS Prevention**: React's built-in protections
- **HTTPS Only**: Enforced in production
- **Secure Storage**: Session data in memory only

## 🚢 Deployment

The frontend is deployed to AWS S3 + CloudFront:

```bash
# Production deployment
npm run deploy:prod

# Staging deployment
npm run deploy:staging
```

See [Frontend Deployment Guide](../docs/deployment/frontend.md) for details.

## 🐛 Debugging

### Development Tools
- React Developer Tools
- Redux DevTools (for debugging context)
- Network tab for API debugging

### Common Issues

1. **API Connection Failed**
   - Check VITE_API_URL is set correctly
   - Verify backend is running
   - Check CORS configuration

2. **Build Failures**
   - Clear node_modules and reinstall
   - Check for TypeScript errors
   - Verify all imports are correct

3. **Test Failures**
   - Update snapshots if UI changed
   - Check for timing issues in async tests
   - Verify test environment setup

## 📝 Code Style

- **ESLint**: Enforced code style
- **Prettier**: Automatic formatting
- **TypeScript**: Strict mode enabled
- **Naming**: Component names in PascalCase
- **Files**: Component files match component names

## 🤝 Contributing

1. Create feature branch from `main`
2. Follow existing code patterns
3. Write tests for new features
4. Ensure all tests pass
5. Submit PR with description

## 📦 Dependencies

Key dependencies:
- `react`: UI library
- `vite`: Build tool
- `tailwindcss`: Utility-first CSS
- `@radix-ui/*`: Headless UI components
- `axios`: HTTP client
- `react-router-dom`: Routing
- `vitest`: Test runner

See `package.json` for complete list.

## 🔗 Related Documentation

- [API Documentation](../docs/api/reference.md)
- [Deployment Guide](../docs/deployment/frontend.md)
- [Testing Guide](./TESTING.md)
- [Session Management](./docs/SESSION_MANAGEMENT.md)