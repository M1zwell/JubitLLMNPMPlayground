# WCAG 2.1 Quick Reference

Essential accessibility guidelines for UI/UX reviews.

## Perceivable

### 1.1 Text Alternatives
- **1.1.1 Non-text Content (A)**: All images need alt text; decorative images use empty alt=""

### 1.2 Time-based Media
- **1.2.1 Audio-only and Video-only (A)**: Provide transcripts
- **1.2.2 Captions (A)**: Captions for videos with audio

### 1.3 Adaptable
- **1.3.1 Info and Relationships (A)**: Use semantic HTML (headings, lists, tables)
- **1.3.2 Meaningful Sequence (A)**: DOM order matches visual order
- **1.3.3 Sensory Characteristics (A)**: Don't rely solely on shape, color, size, or location

### 1.4 Distinguishable
- **1.4.1 Use of Color (A)**: Color alone cannot convey information
- **1.4.3 Contrast (AA)**:
  - Normal text: 4.5:1 minimum
  - Large text (18pt+): 3:1 minimum
- **1.4.4 Resize Text (AA)**: Text can resize to 200% without loss of content
- **1.4.5 Images of Text (AA)**: Use real text, not images of text
- **1.4.10 Reflow (AA)**: No horizontal scrolling at 320px width
- **1.4.11 Non-text Contrast (AA)**: UI components and graphics have 3:1 contrast
- **1.4.12 Text Spacing (AA)**: Content reflows when text spacing is adjusted
- **1.4.13 Content on Hover/Focus (AA)**: Hoverable content must be dismissible, hoverable, and persistent

## Operable

### 2.1 Keyboard Accessible
- **2.1.1 Keyboard (A)**: All functionality available via keyboard
- **2.1.2 No Keyboard Trap (A)**: Keyboard focus not trapped
- **2.1.4 Character Key Shortcuts (A)**: Can turn off, remap, or activate only on focus

### 2.2 Enough Time
- **2.2.1 Timing Adjustable (A)**: User can turn off, adjust, or extend time limits
- **2.2.2 Pause, Stop, Hide (A)**: Control for moving, blinking, scrolling content

### 2.4 Navigable
- **2.4.1 Bypass Blocks (A)**: Skip navigation links
- **2.4.2 Page Titled (A)**: Pages have descriptive titles
- **2.4.3 Focus Order (A)**: Logical focus order
- **2.4.4 Link Purpose (A)**: Link text describes destination
- **2.4.5 Multiple Ways (AA)**: More than one way to find pages
- **2.4.6 Headings and Labels (AA)**: Descriptive headings and labels
- **2.4.7 Focus Visible (AA)**: Keyboard focus indicator visible

### 2.5 Input Modalities
- **2.5.1 Pointer Gestures (A)**: Multipoint gestures have single-point alternative
- **2.5.2 Pointer Cancellation (A)**: Down-event doesn't execute function
- **2.5.3 Label in Name (A)**: Accessible name contains visible label text
- **2.5.4 Motion Actuation (A)**: Motion-triggered functions have UI alternative

## Understandable

### 3.1 Readable
- **3.1.1 Language of Page (A)**: Page language identified in HTML
- **3.1.2 Language of Parts (AA)**: Language changes marked in HTML

### 3.2 Predictable
- **3.2.1 On Focus (A)**: Focus doesn't trigger context changes
- **3.2.2 On Input (A)**: Input doesn't trigger context changes
- **3.2.3 Consistent Navigation (AA)**: Navigation order consistent across pages
- **3.2.4 Consistent Identification (AA)**: Same functionality labeled consistently

### 3.3 Input Assistance
- **3.3.1 Error Identification (A)**: Errors identified and described
- **3.3.2 Labels or Instructions (A)**: Labels provided for user input
- **3.3.3 Error Suggestion (AA)**: Error correction suggestions provided
- **3.3.4 Error Prevention (AA)**: Reversible, checked, or confirmed for important data

## Robust

### 4.1 Compatible
- **4.1.1 Parsing (A)**: Valid HTML (deprecated in WCAG 2.2)
- **4.1.2 Name, Role, Value (A)**: All UI components have accessible names and roles
- **4.1.3 Status Messages (AA)**: Status messages programmatically determined

## Common Violations & Fixes

### Missing Alt Text
```html
<!-- Wrong -->
<img src="logo.png">

<!-- Right -->
<img src="logo.png" alt="Company Name">

<!-- Decorative -->
<img src="divider.png" alt="">
```

### Poor Contrast
```css
/* Wrong - 3.2:1 contrast */
color: #767676;
background: #ffffff;

/* Right - 4.6:1 contrast */
color: #595959;
background: #ffffff;
```

### Missing Focus Indicator
```css
/* Wrong */
button:focus {
  outline: none;
}

/* Right */
button:focus-visible {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}
```

### Non-semantic HTML
```html
<!-- Wrong -->
<div class="button" onclick="submit()">Submit</div>

<!-- Right -->
<button type="submit">Submit</button>
```

### Missing Form Labels
```html
<!-- Wrong -->
<input type="email" placeholder="Email">

<!-- Right -->
<label for="email">Email</label>
<input type="email" id="email" name="email">
```

### Incorrect Heading Hierarchy
```html
<!-- Wrong -->
<h1>Page Title</h1>
<h3>Section</h3>

<!-- Right -->
<h1>Page Title</h1>
<h2>Section</h2>
```

## Testing Tools

- **Automated**: axe DevTools, WAVE, Lighthouse
- **Manual**: Keyboard navigation, screen reader (NVDA, JAWS, VoiceOver)
- **Contrast**: WebAIM Contrast Checker, Stark
- **Color Blindness**: Color Oracle, Chromatic Vision Simulator

## Quick Checklist

- [ ] All images have alt text
- [ ] Color contrast meets 4.5:1 (text) and 3:1 (UI)
- [ ] Keyboard navigation works for all interactive elements
- [ ] Focus indicators visible
- [ ] Semantic HTML used (headings, lists, buttons, forms)
- [ ] Form inputs have associated labels
- [ ] Heading hierarchy is logical (h1→h2→h3)
- [ ] No keyboard traps
- [ ] Page has descriptive title
- [ ] Language attribute set on <html>
- [ ] ARIA used correctly (when HTML insufficient)
- [ ] Touch targets minimum 44x44px
