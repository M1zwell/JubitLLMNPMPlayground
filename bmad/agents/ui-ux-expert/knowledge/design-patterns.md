# Common UI/UX Design Patterns

Reference library of proven design patterns for common interface problems.

## Navigation Patterns

### Primary Navigation
- **Top Navigation**: Horizontal menu for 5-7 main sections
- **Sidebar Navigation**: Vertical menu for complex hierarchies
- **Hamburger Menu**: Mobile-first, space-efficient (use sparingly)
- **Tab Navigation**: Related content sections, max 5-7 tabs
- **Mega Menu**: Large dropdown for extensive navigation structures

### Breadcrumbs
```html
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li aria-current="page">Current Item</li>
  </ol>
</nav>
```

## Form Patterns

### Form Layout
- **Single Column**: Fastest completion, best for mobile
- **Multi-Column**: Only for naturally grouped data (address)
- **Stepped Forms**: Break complex forms into logical steps

### Input Validation
```typescript
// Real-time validation pattern
const [email, setEmail] = useState('');
const [error, setError] = useState('');

const validateEmail = (value: string) => {
  if (!value) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Please enter a valid email';
  }
  return '';
};

// Validate on blur, not on every keystroke
<input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  onBlur={(e) => setError(validateEmail(e.target.value))}
  aria-invalid={!!error}
  aria-describedby={error ? 'email-error' : undefined}
/>
{error && <span id="email-error" role="alert">{error}</span>}
```

### Progressive Disclosure
Show only essential fields initially, reveal advanced options on demand:
```tsx
<button
  onClick={() => setShowAdvanced(!showAdvanced)}
  aria-expanded={showAdvanced}
>
  Advanced Options
</button>
{showAdvanced && <AdvancedFields />}
```

## Loading States

### Skeleton Screens
Preferred over spinners - shows content structure while loading:
```tsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>
```

### Progress Indicators
- **Determinate**: Show percentage (0-100%) when duration known
- **Indeterminate**: Spinner when duration unknown
- **Steps**: Show current step in multi-step process

## Empty States

### Zero Data Pattern
```tsx
<div className="text-center py-12">
  <Icon className="mx-auto text-gray-400" size={48} />
  <h3 className="mt-4 text-lg font-medium">No items yet</h3>
  <p className="mt-2 text-gray-500">Get started by creating your first item.</p>
  <button className="mt-4">Create Item</button>
</div>
```

## Error Handling

### Inline Errors
- Show error next to the field
- Use aria-describedby to associate error with input
- Use role="alert" for dynamic errors

### Error Summary
For forms with multiple errors:
```tsx
{errors.length > 0 && (
  <div role="alert" className="error-summary">
    <h2>Please fix the following errors:</h2>
    <ul>
      {errors.map(error => (
        <li key={error.field}>
          <a href={`#${error.field}`}>{error.message}</a>
        </li>
      ))}
    </ul>
  </div>
)}
```

### Error Pages
- **404**: Helpful navigation, search, common links
- **500**: Apologize, explain, provide support contact
- **503**: Maintenance mode, estimated return time

## Modal Dialogs

### Accessibility Requirements
```tsx
<div
  role="dialog"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
  aria-modal="true"
>
  <h2 id="modal-title">Modal Title</h2>
  <p id="modal-description">Modal content</p>
  <button onClick={closeModal}>Close</button>
</div>
```

### Focus Management
- Trap focus within modal when open
- Return focus to trigger element on close
- ESC key closes modal

## Cards

### Card Anatomy
```tsx
<article className="card">
  <img src={image} alt={title} /> {/* Optional */}
  <div className="card-content">
    <h3>{title}</h3>
    <p>{description}</p>
    <div className="card-meta">
      <span>{date}</span>
      <span>{author}</span>
    </div>
  </div>
  <div className="card-actions">
    <button>Primary Action</button>
    <button>Secondary</button>
  </div>
</article>
```

### Card Grid
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}
```

## Tables

### Responsive Tables
- **Stacked**: Convert to card layout on mobile
- **Horizontal Scroll**: Keep table structure, scroll horizontally
- **Column Toggle**: Hide less important columns on mobile

### Sortable Columns
```tsx
<th>
  <button
    onClick={() => handleSort('name')}
    aria-sort={sortColumn === 'name' ? sortDirection : 'none'}
  >
    Name
    <SortIcon direction={sortColumn === 'name' ? sortDirection : null} />
  </button>
</th>
```

## Search

### Search Pattern
- Search box prominent, clearly labeled
- Show search results count
- Highlight search terms in results
- Provide filters for refinement
- Offer "no results" state with suggestions

### Autocomplete
```tsx
<input
  type="search"
  role="combobox"
  aria-autocomplete="list"
  aria-controls="search-results"
  aria-expanded={showResults}
/>
<ul id="search-results" role="listbox">
  {results.map(result => (
    <li key={result.id} role="option">{result.name}</li>
  ))}
</ul>
```

## Notifications

### Toast Messages
- Auto-dismiss for success (3-5 seconds)
- Persistent for errors (require user dismissal)
- Stack multiple toasts vertically
- Position consistently (usually top-right)

### Notification Types
```tsx
// Success
<div role="status" className="toast-success">
  <CheckIcon /> Item saved successfully
</div>

// Error
<div role="alert" className="toast-error">
  <ErrorIcon /> Failed to save item
</div>

// Warning
<div role="status" className="toast-warning">
  <WarningIcon /> Changes not saved
</div>

// Info
<div role="status" className="toast-info">
  <InfoIcon /> New feature available
</div>
```

## Pagination

### Accessible Pagination
```tsx
<nav aria-label="Pagination">
  <ul>
    <li>
      <a href="?page=1" aria-label="Previous page">Previous</a>
    </li>
    <li>
      <a href="?page=1">1</a>
    </li>
    <li>
      <a href="?page=2" aria-current="page">2</a>
    </li>
    <li>
      <a href="?page=3">3</a>
    </li>
    <li>
      <a href="?page=3" aria-label="Next page">Next</a>
    </li>
  </ul>
</nav>
```

## Tabs

### Tab Pattern
```tsx
<div className="tabs">
  <div role="tablist" aria-label="Content sections">
    <button
      role="tab"
      aria-selected={activeTab === 1}
      aria-controls="panel-1"
      id="tab-1"
    >
      Tab 1
    </button>
    <button
      role="tab"
      aria-selected={activeTab === 2}
      aria-controls="panel-2"
      id="tab-2"
    >
      Tab 2
    </button>
  </div>
  <div
    role="tabpanel"
    id="panel-1"
    aria-labelledby="tab-1"
    hidden={activeTab !== 1}
  >
    Panel 1 content
  </div>
  <div
    role="tabpanel"
    id="panel-2"
    aria-labelledby="tab-2"
    hidden={activeTab !== 2}
  >
    Panel 2 content
  </div>
</div>
```

### Keyboard Navigation
- Arrow keys navigate between tabs
- Tab key moves to panel content
- Home/End jump to first/last tab

## Dropdowns

### Select Dropdown
```tsx
<label htmlFor="country">Country</label>
<select id="country" name="country">
  <option value="">Select a country</option>
  <option value="us">United States</option>
  <option value="uk">United Kingdom</option>
</select>
```

### Custom Dropdown (Combobox)
Use native select when possible; custom only when necessary for:
- Multi-select with checkboxes
- Rich content (images, descriptions)
- Autocomplete/type-ahead

## Accordions

### Accordion Pattern
```tsx
<div className="accordion">
  <h3>
    <button
      aria-expanded={isOpen}
      aria-controls="section-1"
      onClick={() => setIsOpen(!isOpen)}
    >
      Section Title
    </button>
  </h3>
  <div id="section-1" hidden={!isOpen}>
    Section content
  </div>
</div>
```

## Tooltips

### Accessible Tooltip
```tsx
<button
  aria-describedby="tooltip-1"
  onMouseEnter={showTooltip}
  onMouseLeave={hideTooltip}
  onFocus={showTooltip}
  onBlur={hideTooltip}
>
  Info
</button>
{visible && (
  <div id="tooltip-1" role="tooltip">
    Additional information
  </div>
)}
```

### Best Practices
- Don't hide essential info in tooltips
- Show on both hover and focus
- Don't use for touch-only interfaces
- Keep text brief

## Mobile Patterns

### Bottom Navigation
For 3-5 primary sections on mobile apps

### Pull-to-Refresh
Use browser default when possible

### Swipe Gestures
- Swipe to delete (with confirmation)
- Swipe between pages/images
- Swipe to reveal actions (inbox pattern)

### Touch Targets
- Minimum 44x44px (iOS) or 48x48dp (Android)
- 8px spacing between targets
- Larger for primary actions

## Anti-Patterns to Avoid

- Infinite scroll without pagination option
- Carousel/slider (low engagement, accessibility issues)
- Confirmation dialogs for every action
- Disabled buttons without explanation
- Placeholder text as labels
- CAPTCHA (use honeypot or better bot detection)
- Forcing registration before browsing
- Auto-playing audio/video
- Hijacking scroll behavior
