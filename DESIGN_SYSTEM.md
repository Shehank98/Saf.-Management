# Safari Adventures Design System Specification

## Color Palette

### Brand Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `safari-green` | `#2D6A4F` | Primary actions, active states, links |
| `safari-green-dark` | `#1F4F3A` | Hover states, dark accents |
| `safari-green-light` | `#E3EFE9` | Success backgrounds, active nav bg |
| `safari-brown` | `#8B5E3C` | Secondary accent, private safari theme |
| `safari-sand` | `#F4E1C1` | Warning backgrounds, sandy accents |
| `safari-sand-soft` | `#FAEFD9` | Light warning tints |

### Status Colors
| Status | Background | Text | Icon |
|--------|-----------|------|------|
| Success/Active | `#E3EFE9` | `#1F4F3A` | CheckCircle |
| Warning/Pending | `#FEF3C7` | `#92400E` | AlertTriangle |
| Error/Cancelled | `#FEE2E2` | `#991B1B` | AlertCircle |
| Info/Reserved | `#DBEAFE` | `#1E40AF` | Info |
| Neutral/Completed | `#F3F4F6` | `#6B7280` | Circle |

### Semantic Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#FAFAF7` | Page background |
| `--surface` | `#FFFFFF` | Card/panel backgrounds |
| `--text` | `#1A1A1A` | Primary text |
| `--text-2` | `#555555` | Secondary text |
| `--text-3` | `#8A8A8A` | Muted/placeholder text |
| `--border` | `#E8E5DE` | Standard borders |
| `--border-soft` | `#F1EEE7` | Subtle borders |
| `--danger` | `#C0392B` | Destructive actions |
| `--warning` | `#D97706` | Warning states |
| `--info` | `#2E6BB8` | Informational |

### Contrast Ratios (WCAG AA Compliance)
- `#1A1A1A` on `#FAFAF7` = 15.8:1 (AAA)
- `#2D6A4F` on `#FFFFFF` = 5.9:1 (AA)
- `#1F4F3A` on `#E3EFE9` = 7.2:1 (AAA)
- `#92400E` on `#FEF3C7` = 5.7:1 (AA)
- `#991B1B` on `#FEE2E2` = 6.4:1 (AA)

## Typography

### Font Family
- **Primary**: Inter (Google Fonts), system-ui fallback
- **Monospace**: JetBrains Mono (booking IDs, codes)

### Scale
| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| H1 | 28-36px | 800 | 1.05 | Hero headings |
| H2 | 20-24px | 800 | 1.1 | Section headings |
| H3 | 15-17px | 700 | 1.2 | Card titles, page titles |
| Body | 14-15px | 400-500 | 1.5 | Content text |
| Small | 13px | 500-600 | 1.4 | Descriptions, metadata |
| Caption | 11-12px | 500-600 | 1.3 | Labels, badges, timestamps |
| Micro | 10-11px | 600-700 | 1.2 | Badge text, helper text |

### Number Formatting
- Use `font-variant-numeric: tabular-nums` (class `.tnum`) for prices/counts
- Currency: `LKR X,XXX` format via `formatCurrency()`
- Dates: `Mon, Jan 1, 2025` short format

## Spacing

### Base Unit: 4px
| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Inline gaps |
| `sm` | 8px | Form field gaps |
| `md` | 12px | Component internal padding |
| `base` | 16px | Card padding, section spacing |
| `lg` | 20-24px | Section margins |
| `xl` | 32px | Major section dividers |
| `2xl` | 48px | Page sections |

### Layout Rules
- Card padding: 16px
- Section gap: 16-24px
- Form field gap: 12px
- Mobile page padding: 16px horizontal
- Desktop max-width: 768px (content), 1400px (container)
- Bottom nav padding: `max(80px, calc(64px + env(safe-area-inset-bottom)))`

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 6-8px | Badges, small elements |
| `md` | 10-12px | Inputs, nav buttons |
| `lg` | 14px | Cards, buttons |
| `xl` | 16-20px | Modals, hero cards |
| `full` | 999px | Pills, chips, avatars |

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | `0 1px 2px rgba(20,20,20,0.04)` | Subtle lift |
| `card` | `0 6px 18px rgba(28,38,32,0.06), 0 1px 2px rgba(20,20,20,0.04)` | Standard cards |
| `elevated` | `0 16px 40px rgba(28,38,32,0.12), 0 2px 6px rgba(20,20,20,0.05)` | Modals, dropdowns |
| `bottom-nav` | `0 -4px 20px rgba(28,38,32,0.06)` | Bottom navigation |

## Component Library

### Web App Components (`web-app/components/ui/`)

| Component | File | States | Status |
|-----------|------|--------|--------|
| Alert | `alert.tsx` | default, info, success, warning, destructive | Done |
| Avatar | `avatar.tsx` | image, initials; sm, md, lg | Done |
| Badge | `badge.tsx` | default, secondary, destructive, outline, success, warning, info | Done |
| Breadcrumb | `breadcrumb.tsx` | clickable, current page | Done |
| Button | `button.tsx` | default, hover, active, disabled, loading; 7 variants, 4 sizes | Done |
| Card | `card.tsx` | Card, Header, Title, Description, Content, Footer | Done |
| Confirm Dialog | `confirm-dialog.tsx` | danger, warning, info; loading state | Done |
| Data Table | `data-table.tsx` | sortable, searchable, paginated, loading, empty | Done |
| Empty State | `empty-state.tsx` | icon, title, description, action CTA | Done |
| Form Field | `form-field.tsx` | label, required indicator, error, hint | Done |
| Input | `input.tsx` | default, focus, error, success, disabled; left icon | Done |
| Modal | `modal.tsx` | open/close animation, focus trap, escape to close | Done |
| Pagination | `pagination.tsx` | numbered pages, prev/next, ellipsis | Done |
| Progress Steps | `progress-steps.tsx` | completed, current, upcoming | Done |
| Skeleton | `skeleton.tsx` | shimmer animation, configurable shape | Done |
| Spinner | `spinner.tsx` | sm, md, lg; with label | Done |
| Stat Card | `stat-card.tsx` | label, value, icon, trend indicator | Done |
| Tabs | `tabs.tsx` | pills, underline, segmented; with icons & counts | Done |
| Textarea | `textarea.tsx` | default, error state | Done |
| Toast | `toast.tsx` | success, error, warning, info; auto-dismiss | Done |
| Toggle Switch | `toggle-switch.tsx` | on/off; sm, md; with label & description | Done |
| Tooltip | `tooltip.tsx` | top, bottom, left, right positioning | Done |

### Mobile App Components (`mobile-app/src/components/common/`)

| Component | File | States | Status |
|-----------|------|--------|--------|
| Badge | `Badge.tsx` | success, warning, error, info, neutral | Done |
| Button | `Button.tsx` | primary, secondary, outline, ghost; loading, disabled | Done |
| Card | `Card.tsx` | configurable padding, shadow | Done |
| Empty State | `EmptyState.tsx` | icon, title, description, action | Done |
| Form Field | `FormField.tsx` | label, error, hint, required, disabled | Done |
| Progress Steps | `ProgressSteps.tsx` | completed, current, upcoming | Done |
| Status Dot | `StatusDot.tsx` | active, warning, error, inactive | Done |
| Toast | `Toast.tsx` | success, error, warning, info; animated | Done |

### Layout Components (`web-app/components/layout/`)

| Component | File | Responsive | Status |
|-----------|------|-----------|--------|
| Dashboard Shell | `DashboardShell.tsx` | Desktop sidebar, mobile overlay + bottom nav | Done |
| Top Bar | `TopBar.tsx` | Hamburger on mobile, user dropdown | Done |
| Sidebar | `Sidebar.tsx` | Fixed desktop, overlay mobile with backdrop | Done |
| Bottom Nav | `BottomNav.tsx` | Safe area padding, blur backdrop | Done |

### Booking Components (`web-app/components/booking/`)

| Component | File | Features | Status |
|-----------|------|----------|--------|
| Seat Map | `SeatMap.tsx` | 6-seat grid, available/reserved/paid states, animation | Done |
| Location Picker | `LocationPicker.tsx` | Google Maps, 7km radius, haversine validation | Done |
| Meal Preferences | `MealPreferences.tsx` | Toggle, dietary options, allergies | Done |
| Pickup Selector | `PickupSelector.tsx` | Leaflet map, search, time slots, distance validation | Done |

### Infrastructure Components

| Component | File | Purpose | Status |
|-----------|------|---------|--------|
| Error Boundary | `error-boundary.tsx` | Catch rendering errors, retry button | Done |
| Skip to Content | `skip-to-content.tsx` | Keyboard accessibility skip link | Done |
| Toast Provider | `toast.tsx` | Global toast notification system | Done |

## Animation Guide

### Timing
- **Micro-interactions**: 150ms (hover, focus)
- **Transitions**: 200ms (tab changes, fade)
- **Entrances**: 250ms (slide-in, scale-in)
- **Modals**: 200ms (zoom-in + fade)
- **Max duration**: 300ms for UI, 400ms for celebrations

### Easing
- Standard: `ease-out`
- Entrance: `cubic-bezier(0.16, 1, 0.3, 1)` (spring-like)
- Exit: `ease-in`

### Animations Available
| Animation | CSS Class | Duration | Usage |
|-----------|-----------|----------|-------|
| Fade In | `.animate-fade-in` | 200ms | Page content |
| Slide Up | `.animate-slide-up` | 250ms | Cards, list items |
| Slide Down | `.animate-slide-down` | 250ms | Dropdowns |
| Scale In | `.animate-scale-in` | 200ms | Modals, popovers |
| Shake | `.animate-shake` | 400ms | Error feedback |
| Success Pop | `.animate-success-pop` | 350ms | Checkmarks |
| Spin | `.animate-spin` | 800ms | Loading spinners |
| Shimmer | `.skeleton` | 1400ms | Skeleton loading |
| Pulse | `@keyframes pulse` | 1800ms | Status dots |

### Reduced Motion
All animations respect `prefers-reduced-motion: reduce`.

## Accessibility Checklist

- [x] Skip-to-content link for keyboard users
- [x] Focus-visible outlines on all interactive elements (2px solid #2D6A4F)
- [x] ARIA labels on buttons, inputs, navigation
- [x] `role="dialog"` and `aria-modal` on modals
- [x] Focus trap in modal dialogs
- [x] `role="alert"` on error messages and toasts
- [x] `role="tab"` and `aria-selected` on tab components
- [x] `role="switch"` and `aria-checked` on toggle switches
- [x] `aria-current="page"` on breadcrumb and pagination
- [x] `aria-label="Pagination"` on navigation components
- [x] `aria-live="polite"` on toast container
- [x] Semantic HTML (button, nav, main, header, footer)
- [x] Minimum 44x44px touch targets on mobile (enforced via CSS)
- [x] Color never used alone to convey meaning (icon + text + color)
- [x] 4.5:1 minimum contrast ratio for text
- [x] 3:1 minimum contrast ratio for UI components

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Single column, bottom nav, full-width forms |
| Tablet | 768-1024px | 2-column grids, sidebar toggle |
| Desktop | > 1024px | Multi-column, persistent sidebar |

## Page States Checklist

Every page must implement:
- [x] **Loading**: Skeleton screens or spinner with label
- [x] **Empty**: Illustration icon + title + description + CTA
- [x] **Error**: Error icon + message + retry button
- [x] **Success**: Checkmark + confirmation message + next action
- [x] **404**: Custom not-found page with navigation options
