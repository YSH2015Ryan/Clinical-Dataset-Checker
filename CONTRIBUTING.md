# Contributing to Clinical Dataset Checker

Thank you for your interest in contributing! This document provides guidelines for contributions.

## 🎯 Ways to Contribute

### 1. Report Issues
Found a bug? Have a question? Please open an [Issue](https://github.com/YSH2015Ryan/Clinical-Dataset-Checker/issues).

**Include in your report:**
- Detailed steps to reproduce
- Expected vs. actual behavior
- File format and approximate data size
- Browser and operating system
- Screenshots (if applicable)

### 2. Suggest Features
Have an idea? Open a [Discussion](https://github.com/YSH2015Ryan/Clinical-Dataset-Checker/discussions) or an [Issue](https://github.com/YSH2015Ryan/Clinical-Dataset-Checker/issues/new) with label `enhancement`.

**Describe:**
- The problem you're trying to solve
- Your proposed solution
- Alternative approaches
- Use cases

### 3. Improve Documentation
- Fix typos and clarify explanations
- Add examples to docs
- Translate documentation to new languages
- Improve architecture diagrams

### 4. Contribute Code
See "Development Guidelines" section below.

---

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- npm 9+ or yarn
- Git

### Clone and Setup
```bash
git clone https://github.com/YSH2015Ryan/Clinical-Dataset-Checker.git
cd Clinical-Dataset-Checker
npm install
npm run dev
```

### Verify Setup
```bash
npm run test      # All tests should pass
npm run lint      # No linting errors
npm run build     # Should build successfully
```

---

## 💻 Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/my-feature
# or
git checkout -b fix/my-bugfix
```

### 2. Make Your Changes
- Edit source files in `src/`
- Write/update tests in `tests/`
- Update `src/i18n/` files for user-facing text

### 3. Test Locally
```bash
npm run test      # Run unit tests
npm run lint      # Check code quality
npm run build     # Verify build
npm run dev       # Manual testing
```

### 4. Commit Changes
```bash
git add .
git commit -m "feat: Add descriptive message"
# Commit message format: type(scope): description
```

### 5. Push and Submit PR
```bash
git push origin feature/my-feature
```
Then open a Pull Request on GitHub.

---

## 📋 Code Guidelines

### TypeScript & Type Safety
- ✅ Use `strict: true` mode (no `any` types)
- ✅ Define interfaces for all data structures
- ✅ Add JSDoc comments for exported functions
- ❌ Avoid `any`, `as unknown`, or type assertions

**Example:**
```typescript
// ✅ Good
interface ParsedRow {
  [columnName: string]: string | number | boolean | null;
}

export function parseCSV(content: string): ParsedRow[] {
  // Implementation...
}

// ❌ Bad
export function parseCSV(content: any): any {
  // Implementation...
}
```

### React Components
- ✅ Use functional components with hooks
- ✅ Keep components focused and reusable
- ✅ Add PropTypes or interface definitions
- ✅ Memoize expensive computations

**Example:**
```typescript
// ✅ Good
interface HomeProps {
  onFileSelect: (file: File) => void;
}

export const Home: React.FC<HomeProps> = ({ onFileSelect }) => {
  return (
    <div>
      {/* Component content */}
    </div>
  );
};

// ❌ Bad
export const Home = ({ onFileSelect }: any) => {
  // Component content
};
```

### Testing
- ✅ Write tests for all new rules
- ✅ Minimum 5 test cases per rule
- ✅ Include edge cases (empty, null, boundary values)
- ✅ Test descriptions should be clear

**Example:**
```typescript
describe("DUPLICATE_ID Rule", () => {
  test("should detect duplicate ID values", () => {
    // Test case
  });

  test("should handle null/missing ID values", () => {
    // Edge case
  });

  test("should work with longitudinal data", () => {
    // Study design variant
  });
});
```

### Code Style
- ✅ Run `npm run format` before committing
- ✅ Use ESLint rules configured in `.eslintrc.json`
- ✅ Follow existing code patterns in the codebase
- ✅ Use meaningful variable names

### Comments & Documentation
- ✅ Add JSDoc for exported functions
- ✅ Explain non-obvious logic
- ✅ Link to related issues/discussions
- ❌ Don't comment obvious code

---

## 📝 New Quality Check Rule

If you want to add a new quality check rule:

### 1. Define the Rule
Create an interface extending `QualityCheckRule`:

```typescript
interface MyNewRule extends QualityCheckRule {
  ruleId: "MY_NEW_RULE";
  severity: "blocker" | "warning" | "info";
  // Implementation...
}
```

### 2. Implement the Check
```typescript
export const MyNewRule: QualityCheckRule = {
  ruleId: "MY_NEW_RULE",
  severity: "warning",
  
  async run(profile: DatasetProfile): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    // Your logic here
    // ...
    
    return issues;
  },
};
```

### 3. Add Tests
Create at least 5 test cases covering:
- Happy path (should detect the issue)
- Edge cases (null, empty, boundary)
- False negatives (shouldn't flag valid data)

```typescript
describe("MY_NEW_RULE", () => {
  test("should detect the issue", () => {
    // Test implementation
  });

  test("should handle edge cases", () => {
    // Edge case tests
  });

  // ... more tests
});
```

### 4. Update i18n Files
Add translations to `src/i18n/`:

**en.json:**
```json
{
  "rules.MY_NEW_RULE.title": "My New Rule Title",
  "rules.MY_NEW_RULE.description": "Description of what this rule checks...",
  "rules.MY_NEW_RULE.action": "Suggested action to resolve..."
}
```

**zh-CN.json:**
```json
{
  "rules.MY_NEW_RULE.title": "我的新规则标题",
  "rules.MY_NEW_RULE.description": "描述此规则检查的内容...",
  "rules.MY_NEW_RULE.action": "建议的解决操作..."
}
```

### 5. Register the Rule
Add your rule to the rules engine in `src/lib/rules/index.ts`:

```typescript
export const ALL_RULES = [
  // ... existing rules
  MyNewRule,
];
```

### 6. Add to Documentation
Update `README.md` to include your new rule in the checklist.

### 7. Submit PR
Include:
- Implementation + tests
- i18n translations
- Documentation updates
- Explanation of the rule's purpose

---

## 🌍 Adding a New Language

Want to translate the app to a new language?

### 1. Create Translation File
Create `src/i18n/[locale].json`:

```bash
cp src/i18n/en.json src/i18n/fr.json
```

### 2. Translate All Strings
- Do NOT change keys, only values
- Keep formatting (e.g., `{count}` placeholders)
- Review context by looking at `en.json` comments

### 3. Register Locale
Update `src/i18n/config.ts`:

```typescript
import fr from './fr.json';

i18n.addResourceBundle('fr', 'translation', fr);

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'fr', name: 'Français' },  // Add this
];
```

### 4. Test
```bash
npm run dev
# Test language switcher in browser
```

### 5. Submit PR
Include translated files and language registration.

---

## 📦 Dependency Guidelines

Before adding a new dependency:

### ✅ Acceptable Additions
- **Parsing**: Already have PapaParse + SheetJS
- **i18n**: Already have i18next
- **Testing**: Already have Vitest + Playwright
- **UI**: React ecosystem tools
- **Build**: Vite ecosystem

### ❌ Discouraged
- ❌ External API calls (breaks privacy-first principle)
- ❌ ML/AI model libraries (not in v1.0 scope)
- ❌ Heavy frameworks for small functionality
- ❌ Multiple alternatives (use what's already there)

### Process
1. Explain why the dependency is needed
2. Confirm no existing alternative exists
3. Verify it's actively maintained
4. Check bundle size impact
5. Get approval before adding

---

## 🧪 Testing Guidelines

### Run Tests
```bash
npm run test              # Unit tests
npm run test:ui           # Visual test runner
npm run e2e               # End-to-end tests
npm run e2e:ui            # Visual E2E runner
```

### Write Good Tests
```typescript
// ✅ Good - Clear intent and assertion
describe("checkDuplicateID", () => {
  test("should flag duplicate ID values", () => {
    const data = [
      { id: "001", name: "John" },
      { id: "002", name: "Jane" },
      { id: "001", name: "John" },  // Duplicate
    ];
    const issues = checkDuplicateID(data, "id");
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe("DUPLICATE_ID");
  });

  test("should not flag unique IDs", () => {
    const data = [
      { id: "001", name: "John" },
      { id: "002", name: "Jane" },
    ];
    const issues = checkDuplicateID(data, "id");
    expect(issues).toHaveLength(0);
  });
});

// ❌ Vague - Hard to understand intent
test("test function", () => {
  // Unclear what this tests
});
```

---

## 📊 Performance Considerations

When optimizing:

1. **Profile First**: Identify actual bottleneck
2. **Measure Impact**: Before/after metrics
3. **Preserve Correctness**: Never sacrifice accuracy for speed
4. **Document Changes**: Explain optimization in PR

### Target Performance
- Parse 100K rows: < 3 seconds
- Run all 15 checks: < 2 seconds
- Generate report: < 1 second
- Export file: < 1 second

---

## 🔒 Security & Privacy

### Rules
- ❌ Never add code that transmits data externally
- ❌ Never add tracking or analytics
- ❌ Never add user account requirements
- ✅ Always validate user input
- ✅ Always handle sensitive data carefully
- ✅ Always document privacy implications

### Code Review
Security reviews are mandatory for any changes affecting data handling.

---

## 📝 PR Checklist

Before submitting a Pull Request, ensure:

- [ ] Code follows TypeScript strict mode
- [ ] All tests pass (`npm run test`)
- [ ] Code is formatted (`npm run format`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] i18n updated (if UI text changed)
- [ ] Documentation updated
- [ ] No external API calls added
- [ ] No new privacy concerns
- [ ] PR description explains the changes

### PR Title Format
```
feat: Add new quality check rule for X
fix: Resolve Y bug in Z
docs: Update README with examples
chore: Upgrade dependency to v1.2.3
```

### PR Description Template
```markdown
## Description
Brief explanation of changes.

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Performance improvement

## Testing
How did you test these changes?

## Impact
- Does this change the public API?
- Does this affect privacy?
- Breaking changes?

## Checklist
- [ ] Tests pass
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] i18n updated
```

---

## 🐛 Fixing Bugs

1. **Confirm the Bug**
   - Reproduce consistently
   - Identify root cause
   - Document in a test case

2. **Fix the Code**
   - Make minimal changes
   - Don't refactor while fixing

3. **Add Regression Test**
   - Test that catches this bug
   - Prevents future regression

4. **Document the Fix**
   - Explain the bug
   - Explain the solution
   - Reference the issue

---

## 📚 Documentation Standards

### README Changes
- Keep it concise and scannable
- Use headers and bullet points
- Include code examples
- Add links to detailed docs

### Code Comments
- Explain *why*, not *what*
- Use clear, professional language
- Reference related issues/PRs
- Keep them current

### JSDoc Style
```typescript
/**
 * Validates if a column contains mixed data types.
 * 
 * @param column Array of values to check
 * @returns true if mixed types detected, false otherwise
 * 
 * @example
 * hasMixedTypes(["1", 2, true])  // returns true
 * hasMixedTypes([1, 2, 3])       // returns false
 */
export function hasMixedTypes(column: any[]): boolean {
  // Implementation
}
```

---

## 🎓 Learning Resources

- **TypeScript**: https://www.typescriptlang.org/
- **React 18**: https://react.dev/
- **Vite**: https://vitejs.dev/
- **i18next**: https://www.i18next.com/
- **Vitest**: https://vitest.dev/

---

## 🤝 Community

- **Discussions**: [GitHub Discussions](https://github.com/YSH2015Ryan/Clinical-Dataset-Checker/discussions)
- **Issues**: [GitHub Issues](https://github.com/YSH2015Ryan/Clinical-Dataset-Checker/issues)
- **Code of Conduct**: See below

---

## 📜 Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inclusive environment.

### Expected Behavior
- ✅ Use welcoming and inclusive language
- ✅ Be respectful of differing opinions
- ✅ Accept constructive criticism gracefully
- ✅ Focus on what is best for the community

### Unacceptable Behavior
- ❌ Harassment or discrimination
- ❌ Trolling or inflammatory comments
- ❌ Personal attacks
- ❌ Publishing others' private information

### Reporting Issues
Report Code of Conduct violations to: [specify contact]

---

## 🙏 Thank You

Thank you for contributing to Clinical Dataset Checker! Your efforts help make data quality checks easier for researchers worldwide.

---

*Last Updated: October 22, 2026*
