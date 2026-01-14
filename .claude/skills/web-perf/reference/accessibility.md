# Accessibility & Performance

Deep dive into accessibility issues that impact performance and user experience, including contrast ratios, ARIA attributes, focus management, and keyboard navigation.

## Why Accessibility Matters for Performance

**Accessibility and performance are interconnected:**

1. **Focus management issues** → Keyboard users face delays
2. **Missing ARIA labels** → Screen readers make extra requests
3. **Poor contrast** → Users strain to read, slow comprehension
4. **Complex DOM** → Screen readers take longer to parse
5. **Auto-play media** → Unexpected bandwidth usage

**Goal:** Make sites fast AND usable for everyone.

---

## Color Contrast Analysis

### WCAG Contrast Requirements

**Contrast ratio = (lighter color + 0.05) / (darker color + 0.05)**

**WCAG 2.1 Standards:**
- **Level AA** (minimum):
  - Normal text: 4.5:1
  - Large text (18pt/14pt bold): 3:1
- **Level AAA** (enhanced):
  - Normal text: 7:1
  - Large text: 4.5:1

### Checking Contrast in DevTools

**Manual check:**
1. Open DevTools
2. Select element with Inspect tool
3. Check color picker for contrast ratio
4. Look for ✅ or ❌ indicators

**Automatic detection:**
```javascript
// Using chrome-devtools MCP
// Take snapshot and look for contrast issues
chrome-devtools_take_snapshot({ verbose: true })

// Elements with low contrast will be flagged
```

### Fixing Contrast Issues

**Common problems:**
```css
/* ❌ Poor contrast (2.5:1) */
.text {
  color: #999999;
  background: #ffffff;
}

/* ✅ Good contrast (4.6:1) - AA compliant */
.text {
  color: #767676;
  background: #ffffff;
}

/* ✅ Better contrast (7.4:1) - AAA compliant */
.text {
  color: #595959;
  background: #ffffff;
}
```

**Dark mode considerations:**
```css
/* Light mode */
:root {
  --text-primary: #1a1a1a; /* 14.5:1 */
  --text-secondary: #595959; /* 7.4:1 */
  --bg-primary: #ffffff;
}

/* Dark mode */
:root[data-theme="dark"] {
  --text-primary: #f5f5f5; /* 15.8:1 */
  --text-secondary: #a6a6a6; /* 7.0:1 */
  --bg-primary: #1a1a1a;
}
```

**Tools for contrast checking:**
```bash
# CLI tool
npm install -g get-contrast

# Check contrast
get-contrast "#999999" "#ffffff"
# Output: 2.85:1 (FAIL)

# Find accessible color
get-contrast "#999999" "#ffffff" --wcag aa
# Suggests: #767676 (4.54:1)
```

**Automated checking in CI:**
```javascript
// vitest/jest test
import { getContrast } from 'polished'

test('text has sufficient contrast', () => {
  const textColor = '#999999'
  const bgColor = '#ffffff'
  const ratio = getContrast(textColor, bgColor)
  
  expect(ratio).toBeGreaterThanOrEqual(4.5) // AA standard
})
```

---

## ARIA Attributes

### Proper ARIA Usage

**ARIA helps screen readers understand interactive elements.**

### Common ARIA Issues

#### 1. Missing ARIA Labels

**Problem:** Buttons/links without accessible names.

```html
<!-- ❌ No accessible name -->
<button>
  <svg>...</svg>
</button>

<!-- ✅ Has accessible name -->
<button aria-label="Close dialog">
  <svg aria-hidden="true">...</svg>
</button>

<!-- ✅ Or use visually hidden text -->
<button>
  <span class="sr-only">Close dialog</span>
  <svg aria-hidden="true">...</svg>
</button>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
```

---

#### 2. Duplicate ARIA IDs

**Problem:** Multiple elements with same `aria-labelledby` or `id`.

```html
<!-- ❌ Duplicate IDs -->
<div id="dialog-title">Settings</div>
<div id="dialog-title">Profile</div>

<!-- ✅ Unique IDs -->
<div id="settings-dialog-title">Settings</div>
<div id="profile-dialog-title">Profile</div>
```

**Checking for duplicates:**
```javascript
// Check for duplicate IDs
const ids = new Set()
const duplicates = []

document.querySelectorAll('[id]').forEach(el => {
  if (ids.has(el.id)) {
    duplicates.push(el.id)
  }
  ids.add(el.id)
})

if (duplicates.length > 0) {
  console.error('Duplicate IDs:', duplicates)
}
```

---

#### 3. Incorrect ARIA Roles

**Problem:** Wrong role for element type.

```html
<!-- ❌ Button implemented as div -->
<div onclick="submit()">Submit</div>

<!-- ✅ Use semantic element -->
<button onclick="submit()">Submit</button>

<!-- ✅ Or add proper role + keyboard support -->
<div role="button" tabindex="0" onclick="submit()" onkeydown="handleKey(event)">
  Submit
</div>
```

**Common role mistakes:**
| Element | Wrong | Right |
|---------|-------|-------|
| Clickable div | `role="link"` | Use `<button>` or `<a>` |
| List of items | No role | `role="list"` on container |
| Tab panel | `role="tab"` | `role="tabpanel"` |
| Alert | `role="alert"` on div | Use `role="alert"` + `aria-live="assertive"` |

---

#### 4. Missing Form Labels

**Problem:** Inputs without associated labels.

```html
<!-- ❌ No label association -->
<label>Email</label>
<input type="email" name="email">

<!-- ✅ Explicit association -->
<label for="email">Email</label>
<input type="email" id="email" name="email">

<!-- ✅ Implicit association -->
<label>
  Email
  <input type="email" name="email">
</label>

<!-- ✅ Or use aria-label -->
<input type="email" name="email" aria-label="Email address">
```

---

#### 5. Live Region Announcements

**Problem:** Dynamic content changes not announced to screen readers.

**Solution: Use ARIA live regions**

```html
<!-- Polite updates (not interrupting) -->
<div aria-live="polite" aria-atomic="true">
  <p id="status">Loading...</p>
</div>

<!-- Assertive updates (important, interrupting) -->
<div role="alert" aria-live="assertive">
  <p>Error: Invalid email address</p>
</div>

<!-- Off-screen announcements -->
<div class="sr-only" aria-live="polite" aria-atomic="true" id="announcer">
  <!-- Announcements go here -->
</div>
```

**JavaScript integration:**
```javascript
// Announce to screen reader
function announce(message, priority = 'polite') {
  const announcer = document.getElementById('announcer')
  announcer.setAttribute('aria-live', priority)
  announcer.textContent = message
  
  // Clear after announcement
  setTimeout(() => {
    announcer.textContent = ''
  }, 1000)
}

// Usage
announce('Item added to cart')
announce('Error: Payment failed', 'assertive')
```

**Framework examples:**
```javascript
// React - live region component
function LiveRegion({ children, priority = 'polite' }) {
  return (
    <div 
      className="sr-only"
      role="status"
      aria-live={priority}
      aria-atomic="true"
    >
      {children}
    </div>
  )
}

// Usage
<LiveRegion>{statusMessage}</LiveRegion>

// Vue - live region composable
const { announce } = useLiveAnnouncer()
announce('Item saved')
```

---

## Focus Management

### Why Focus Management Matters

**Performance impact:**
- Poor focus management → Users tab through entire page
- Missing focus styles → Users lose position, retry actions
- Focus traps → Users stuck, must reload page

### Focus Visibility

**Problem:** Focus indicator removed or invisible.

```css
/* ❌ Never do this */
*:focus {
  outline: none;
}

/* ✅ Keep default or provide custom */
:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* ✅ Custom focus ring */
button:focus-visible {
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.4);
  outline: none;
}

/* Skip outline for mouse clicks (not keyboard) */
button:focus:not(:focus-visible) {
  outline: none;
}
```

---

### Focus Order

**Problem:** Tab order doesn't match visual order.

```html
<!-- ❌ Bad - uses positive tabindex -->
<button tabindex="3">Third</button>
<button tabindex="1">First</button>
<button tabindex="2">Second</button>

<!-- ✅ Good - natural DOM order -->
<button>First</button>
<button>Second</button>
<button>Third</button>

<!-- ✅ Or use negative tabindex to remove from tab order -->
<div tabindex="-1">Not keyboard accessible</div>
```

**CSS flexbox/grid visual reordering:**
```css
/* ❌ Visual order ≠ DOM order (confusing) */
.container {
  display: flex;
  flex-direction: column-reverse;
}

/* ✅ Match visual and DOM order */
/* Reorder in DOM, not CSS */
```

---

### Focus Traps (Modals/Dialogs)

**Problem:** Focus escapes modal, or can't escape modal.

**Solution: Trap focus within modal**

```javascript
// Focus trap implementation
function createFocusTrap(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  
  function handleTab(e) {
    if (e.key !== 'Tab') return
    
    if (e.shiftKey) { // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus()
        e.preventDefault()
      }
    } else { // Tab
      if (document.activeElement === lastElement) {
        firstElement.focus()
        e.preventDefault()
      }
    }
  }
  
  element.addEventListener('keydown', handleTab)
  firstElement.focus()
  
  return () => element.removeEventListener('keydown', handleTab)
}

// Usage
const modal = document.getElementById('modal')
const removeTrap = createFocusTrap(modal)

// When closing modal
removeTrap()
```

**Using focus-trap library:**
```bash
npm install focus-trap
```

```javascript
import { createFocusTrap } from 'focus-trap'

const modal = document.getElementById('modal')
const trap = createFocusTrap(modal, {
  onDeactivate: () => modal.classList.remove('is-active')
})

// Open modal
modal.classList.add('is-active')
trap.activate()

// Close modal
trap.deactivate()
```

**Framework examples:**
```javascript
// React - focus trap hook
import { useFocusTrap } from '@mantine/hooks'

function Modal({ opened }) {
  const focusTrapRef = useFocusTrap(opened)
  
  return (
    <div ref={focusTrapRef}>
      <button>Action</button>
      <button>Close</button>
    </div>
  )
}

// Vue - focus trap directive
<div v-trap-focus="isOpen">
  <button>Action</button>
  <button>Close</button>
</div>
```

---

### Focus Restoration

**Problem:** After closing modal, focus lost.

**Solution: Save and restore focus**

```javascript
// Save focus before opening modal
let previousActiveElement

function openModal() {
  previousActiveElement = document.activeElement
  modal.showModal()
  modal.querySelector('button').focus()
}

function closeModal() {
  modal.close()
  // Restore focus to element that opened modal
  previousActiveElement?.focus()
}
```

**Framework examples:**
```javascript
// React
function useModal() {
  const previousFocusRef = useRef()
  
  const openModal = useCallback(() => {
    previousFocusRef.current = document.activeElement
    setIsOpen(true)
  }, [])
  
  const closeModal = useCallback(() => {
    setIsOpen(false)
    previousFocusRef.current?.focus()
  }, [])
  
  return { openModal, closeModal }
}
```

---

## Keyboard Navigation

### Ensuring Keyboard Access

**All interactive elements must be keyboard accessible.**

#### Custom Interactive Elements

**Problem:** Clickable divs without keyboard support.

```html
<!-- ❌ Not keyboard accessible -->
<div onclick="handleClick()">Click me</div>

<!-- ✅ Keyboard accessible -->
<div 
  role="button"
  tabindex="0"
  onclick="handleClick()"
  onkeydown="if (event.key === 'Enter' || event.key === ' ') handleClick()"
>
  Click me
</div>

<!-- ✅ Better - use semantic element -->
<button onclick="handleClick()">Click me</button>
```

**Keyboard event handler helper:**
```javascript
function handleKeyboardClick(event, callback) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    callback(event)
  }
}

// Usage
<div 
  role="button"
  tabindex="0"
  onkeydown={(e) => handleKeyboardClick(e, handleClick)}
>
  Click me
</div>
```

---

#### Skip Links

**Problem:** Keyboard users must tab through navigation every page.

**Solution: Add skip link**

```html
<!-- Skip link (first element in body) -->
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<nav>
  <!-- Navigation links -->
</nav>

<main id="main-content" tabindex="-1">
  <!-- Page content -->
</main>

<style>
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 9999;
  }
  
  .skip-link:focus {
    top: 0;
  }
</style>
```

---

#### Keyboard Shortcuts

**Problem:** Conflicts with browser/screen reader shortcuts.

**Guidelines:**
- Avoid single-key shortcuts (use modifiers: Ctrl, Alt, Meta)
- Allow users to customize shortcuts
- Document shortcuts visibly
- Avoid conflicting with screen reader shortcuts

```javascript
// Good keyboard shortcut implementation
document.addEventListener('keydown', (e) => {
  // Use modifier keys
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    saveDocument()
  }
  
  // Avoid conflicts
  if (e.altKey && e.key === 'n') {
    e.preventDefault()
    createNew()
  }
})
```

---

## Form Accessibility

### Error Messages

**Problem:** Errors not associated with inputs.

```html
<!-- ❌ Error not linked -->
<input type="email" name="email">
<p class="error">Invalid email</p>

<!-- ✅ Error properly associated -->
<label for="email">Email</label>
<input 
  type="email" 
  id="email"
  name="email"
  aria-invalid="true"
  aria-describedby="email-error"
>
<p id="email-error" class="error" role="alert">
  Invalid email address
</p>
```

---

### Required Fields

**Problem:** Required fields not indicated accessibly.

```html
<!-- ❌ Visual indicator only -->
<label>Email*</label>
<input type="email" name="email">

<!-- ✅ Accessible required indicator -->
<label for="email">
  Email
  <span aria-hidden="true">*</span>
  <span class="sr-only">required</span>
</label>
<input 
  type="email" 
  id="email"
  name="email"
  required
  aria-required="true"
>
```

---

### Form Validation

```javascript
// Accessible form validation
function validateForm(form) {
  const errors = []
  
  // Check each required field
  form.querySelectorAll('[required]').forEach(input => {
    if (!input.value) {
      const label = form.querySelector(`label[for="${input.id}"]`)
      const fieldName = label?.textContent || input.name
      
      // Add error
      errors.push({
        field: input,
        message: `${fieldName} is required`
      })
      
      // Mark field invalid
      input.setAttribute('aria-invalid', 'true')
      
      // Create/update error message
      let errorEl = document.getElementById(`${input.id}-error`)
      if (!errorEl) {
        errorEl = document.createElement('p')
        errorEl.id = `${input.id}-error`
        errorEl.className = 'error'
        errorEl.setAttribute('role', 'alert')
        input.parentNode.appendChild(errorEl)
      }
      errorEl.textContent = `${fieldName} is required`
      input.setAttribute('aria-describedby', errorEl.id)
    }
  })
  
  // Announce errors
  if (errors.length > 0) {
    announce(`Form has ${errors.length} errors. Please correct them.`, 'assertive')
    // Focus first error
    errors[0].field.focus()
  }
  
  return errors.length === 0
}
```

---

## Media Accessibility

### Auto-Playing Media

**Problem:** Unexpected audio/video hurts performance and UX.

```html
<!-- ❌ Auto-play with sound -->
<video src="video.mp4" autoplay></video>

<!-- ✅ Muted auto-play (allowed) -->
<video src="video.mp4" autoplay muted loop playsinline></video>

<!-- ✅ User-initiated play -->
<video src="video.mp4" controls></video>
```

---

### Video Captions

**Problem:** Videos without captions.

```html
<!-- ❌ No captions -->
<video src="video.mp4" controls></video>

<!-- ✅ With captions -->
<video src="video.mp4" controls>
  <track 
    kind="captions" 
    src="captions-en.vtt" 
    srclang="en" 
    label="English"
    default
  >
  <track 
    kind="captions" 
    src="captions-es.vtt" 
    srclang="es" 
    label="Español"
  >
</video>
```

---

## Performance Impact of Accessibility

### Screen Reader Performance

**Issue:** Complex DOM structures slow down screen readers.

**Solutions:**

**1. Simplify DOM structure:**
```html
<!-- ❌ Deeply nested -->
<div>
  <div>
    <div>
      <div>
        <button>Action</button>
      </div>
    </div>
  </div>
</div>

<!-- ✅ Flat structure -->
<button>Action</button>
```

**2. Use semantic HTML:**
```html
<!-- ❌ DIVs with roles -->
<div role="navigation">
  <div role="list">
    <div role="listitem">Item</div>
  </div>
</div>

<!-- ✅ Semantic elements -->
<nav>
  <ul>
    <li>Item</li>
  </ul>
</nav>
```

**3. Hide decorative elements:**
```html
<!-- Hide from screen readers -->
<svg aria-hidden="true">...</svg>
<span aria-hidden="true" class="icon">→</span>
```

---

## Accessibility Testing Tools

### Automated Testing

**axe DevTools (Chrome extension):**
- Install from Chrome Web Store
- Run audit on any page
- Shows WCAG violations

**Lighthouse accessibility audit:**
```bash
# Run Lighthouse with accessibility audit
lighthouse https://example.com --only-categories=accessibility
```

**Jest + jest-axe:**
```bash
npm install --save-dev jest-axe
```

```javascript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('page has no accessibility violations', async () => {
  const { container } = render(<MyComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

---

### Manual Testing

**Keyboard navigation:**
1. Tab through page (should follow logical order)
2. Shift+Tab to reverse
3. Enter/Space to activate buttons/links
4. Escape to close dialogs

**Screen reader testing:**
- **macOS:** VoiceOver (Cmd + F5)
- **Windows:** NVDA (free) or JAWS
- **Chrome:** ChromeVox extension

---

## Accessibility Checklist

- [ ] **Color contrast meets AA** - 4.5:1 for normal text
- [ ] **All images have alt text** - Or aria-hidden if decorative
- [ ] **Form inputs have labels** - Visible or aria-label
- [ ] **No duplicate ARIA IDs** - Each ID unique
- [ ] **Focus visible** - Custom or default outline
- [ ] **Keyboard accessible** - All interactions work with keyboard
- [ ] **Skip links provided** - Jump to main content
- [ ] **Headings in order** - h1 → h2 → h3 (no skipping)
- [ ] **Links descriptive** - Not "click here"
- [ ] **Live regions for updates** - Dynamic content announced
- [ ] **Error messages associated** - aria-describedby
- [ ] **Videos have captions** - VTT track files
- [ ] **No auto-play with sound** - Only muted auto-play
- [ ] **Semantic HTML used** - nav, main, article, etc.

---

## Next Steps

After accessibility optimization:

1. **Run axe audit** - Fix critical issues first
2. **Test with keyboard** - Verify all interactions
3. **Test with screen reader** - Listen to page structure
4. **Monitor in production** - Track accessibility metrics

For related topics:
- **Rendering performance** → [rendering.md](./rendering.md)
- **Metrics impact** → [metrics.md](./metrics.md)
