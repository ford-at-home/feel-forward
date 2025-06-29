# Testing Suite Documentation

## Overview

This project includes a comprehensive testing suite with unit tests, integration tests, and end-to-end tests to ensure the Feel Forward application works correctly across all scenarios.

## Test Structure

```
src/
├── test/
│   ├── setup.ts                 # Test environment setup
│   ├── utils.tsx                # Testing utilities and helpers
│   ├── mocks/
│   │   ├── server.ts            # MSW server setup
│   │   ├── handlers.ts          # API mock handlers
│   │   └── browser.ts           # Browser MSW worker
│   └── integration/
│       ├── api-integration.test.ts
│       └── user-workflow.test.tsx
├── components/__tests__/        # Component unit tests
├── lib/__tests__/              # Utility and API tests
├── pages/__tests__/            # Page component tests
e2e/                            # End-to-end tests
├── user-journey.spec.ts
└── api-scenarios.spec.ts
```

## Testing Technologies

- **Vitest**: Fast unit test runner for Vite projects
- **React Testing Library**: Component testing utilities
- **MSW (Mock Service Worker)**: API mocking for integration tests
- **Playwright**: End-to-end testing framework
- **JSDOM**: DOM environment for unit tests

## Test Commands

### Unit and Integration Tests
```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

### All Tests
```bash
# Run all tests (unit, integration, E2E)
npm run test:all
```

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual components and functions in isolation.

**Location**: `src/**/__tests__/*.test.{ts,tsx}`

**Coverage**:
- React components (Phase components, UI components)
- API client functionality
- Utility functions
- Hook behavior

**Example**:
```typescript
// src/components/__tests__/PhaseZero.test.tsx
describe('PhaseZero', () => {
  it('should render topic input initially', () => {
    render(<PhaseZero onComplete={mockOnComplete} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
```

### 2. Integration Tests

**Purpose**: Test interaction between components and API integration.

**Location**: `src/test/integration/*.test.{ts,tsx}`

**Coverage**:
- Complete API workflow (Phase 0 → Phase 4)
- Error handling and retry logic
- User workflow integration
- Data flow between components

**Example**:
```typescript
// src/test/integration/api-integration.test.ts
describe('Complete API Workflow', () => {
  it('should complete the full API workflow from Phase 0 to Phase 4', async () => {
    const factorsResponse = await apiClient.getFactors({ topic: 'Career transition' })
    // ... test complete workflow
  })
})
```

### 3. End-to-End Tests

**Purpose**: Test real user scenarios in a browser environment.

**Location**: `e2e/*.spec.ts`

**Coverage**:
- Complete user journeys
- Cross-browser compatibility
- Mobile responsiveness
- API failure scenarios
- Performance and accessibility

**Example**:
```typescript
// e2e/user-journey.spec.ts
test('should complete the welcome flow and start the journey', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Feel Forward')).toBeVisible()
  await page.getByRole('button', { name: /begin your journey/i }).click()
})
```

## Mock Services

### API Mocking with MSW

The test suite uses Mock Service Worker (MSW) to intercept and mock API calls:

```typescript
// src/test/mocks/handlers.ts
export const handlers = [
  http.post('/phase0/factors', () => {
    return HttpResponse.json({
      factors: [
        { category: "Financial", items: ["Salary", "Benefits"] }
      ]
    })
  }),
  // ... other handlers
]
```

### Test Data Factories

Helper functions create consistent test data:

```typescript
// src/test/utils.tsx
export const mockFactor = (overrides = {}) => ({
  category: 'Test Category',
  items: ['Test Item 1', 'Test Item 2'],
  ...overrides,
})
```

## Testing Scenarios

### 1. Happy Path Testing
- Complete user journey from welcome to summary
- All API calls succeed
- User makes valid inputs
- Data flows correctly between phases

### 2. Error Handling
- API failures and timeouts
- Network connectivity issues
- Invalid user inputs
- Malformed API responses

### 3. Edge Cases
- Empty responses
- Rate limiting
- Concurrent requests
- Browser navigation

### 4. Accessibility
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Focus management

### 5. Performance
- Load times
- Responsive design
- Mobile compatibility
- Memory usage

## Coverage Requirements

The test suite maintains high coverage standards:

- **Branches**: 80% minimum
- **Functions**: 80% minimum
- **Lines**: 80% minimum
- **Statements**: 80% minimum

Coverage reports are generated in:
- `coverage/lcov-report/index.html` (HTML report)
- `coverage/lcov.info` (LCOV format for CI)

## CI/CD Integration

### GitHub Actions Workflow

The testing pipeline runs on:
- Every push to `main` and `develop` branches
- Every pull request

**Jobs**:
1. **Unit and Integration Tests**
   - Node.js 18.x and 20.x matrix
   - Type checking
   - Linting
   - Test execution with coverage

2. **End-to-End Tests**
   - Cross-browser testing (Chrome, Firefox, Safari)
   - Mobile viewport testing
   - Performance validation

3. **Build Testing**
   - Production build validation
   - Staging build validation
   - Artifact verification

### Coverage Reporting

Coverage reports are uploaded to Codecov for tracking over time.

## Best Practices

### Writing Tests

1. **Test Behavior, Not Implementation**
   ```typescript
   // Good: Test user interaction
   await user.click(screen.getByRole('button', { name: /submit/i }))
   expect(screen.getByText(/success/i)).toBeInTheDocument()
   
   // Avoid: Test internal state
   expect(component.state.isSubmitted).toBe(true)
   ```

2. **Use Descriptive Test Names**
   ```typescript
   // Good
   it('should show error when submitting empty form')
   
   // Avoid
   it('should work')
   ```

3. **Arrange-Act-Assert Pattern**
   ```typescript
   it('should save preferences when form is valid', async () => {
     // Arrange
     const mockOnComplete = vi.fn()
     render(<PhaseOne onComplete={mockOnComplete} />)
     
     // Act
     await user.click(screen.getByRole('button', { name: /save/i }))
     
     // Assert
     expect(mockOnComplete).toHaveBeenCalled()
   })
   ```

4. **Clean Up After Tests**
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks()
   })
   ```

### Debugging Tests

1. **Use `screen.debug()`** to see current DOM state
2. **Use `waitFor()`** for async operations
3. **Check `data-testid`** attributes for reliable selection
4. **Use Playwright UI mode** for E2E debugging

### Performance Testing

1. **Measure load times** in E2E tests
2. **Test with realistic data sizes**
3. **Validate memory usage patterns**
4. **Test on slow networks**

## Maintenance

### Regular Tasks

1. **Update dependencies** monthly
2. **Review coverage reports** weekly
3. **Update test data** when API changes
4. **Monitor flaky tests** and fix immediately

### Adding New Tests

When adding new features:

1. **Write unit tests** for new components
2. **Add integration tests** for API interactions
3. **Update E2E tests** for new user flows
4. **Maintain coverage thresholds**

### Test Data Management

1. **Use factories** for consistent test data
2. **Mock external dependencies**
3. **Keep test data minimal** but realistic
4. **Version test fixtures** with code changes

## Troubleshooting

### Common Issues

1. **Tests timeout**: Increase timeout or check for infinite loops
2. **Flaky tests**: Add proper waits and reduce test coupling
3. **Coverage drops**: Add tests for new code or uncovered branches
4. **E2E failures**: Check for race conditions and element timing

### Getting Help

1. Check the [Vitest documentation](https://vitest.dev/)
2. Review [React Testing Library guides](https://testing-library.com/docs/react-testing-library/intro/)
3. Consult [Playwright documentation](https://playwright.dev/)
4. Search existing issues in the project repository

## Future Improvements

1. **Visual regression testing** with Playwright
2. **Performance monitoring** integration
3. **Accessibility automation** with axe-core
4. **Load testing** for API endpoints
5. **Contract testing** between frontend and backend