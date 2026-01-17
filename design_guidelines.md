# SettlementFast Mobile App - Design Guidelines

## Brand Identity

**Purpose**: Demystify class action settlements through accessible, confidence-building design.

**Aesthetic**: Bloomberg meets Headspace - sophisticated information design with generous whitespace, typography-led hierarchy, subtle color use for trust, smooth purposeful animations.

**Signature Experience**: Eligibility checker flow with celebration animations when users discover qualifying settlements.

## Navigation

**Tab Bar** (4 tabs): Home, Browse, My Claims, Profile  
**FAB**: "Check Eligibility" (contextual on settlement details)  
**Auth**: Apple/Google SSO (primary), email/password fallback, biometric unlock

## Core Screens

### Home Dashboard
- **Header**: Transparent, "Good morning, [Name]" (h2), bell icon
- **Content**: Stats cards (horizontal scroll, animated count-up) → Upcoming Deadlines (urgency badges if <7 days) → Recommended carousel → Recent Activity feed
- **Safe Area**: top: headerHeight + 24, bottom: tabBarHeight + 24

### Browse (Settlements)
- **Header**: Search bar embedded, filter icon
- **Content**: Filter chips (horizontal scroll) → Settlement cards (infinite scroll: logo, title, category badge, payout range, deadline, proof tag)
- **Empty State**: "No settlements found" illustration, "Try adjusting filters" subtitle

### Settlement Detail (Modal)
- **Header**: Back, share, save/heart icons
- **Content**: Hero image with gradient overlay + title → Payout range (large) → Countdown timer (if <30 days) → Eligibility Requirements (accordion) → Key Details → Sticky "Check Eligibility" CTA → Claim Form link → Similar Settlements carousel
- **Safe Area**: top: insets.top + 24, bottom: insets.bottom + 24

### Eligibility Checker (Modal Stack)
- **Header**: Progress bar (0-100%), close icon
- **Content**: Question (centered, large) → Answer buttons → "Next" button (disabled until answered)
- **Result Screen**: Animated icon (confetti/checkmark/shake) → Explanation → "Save to Claims" CTA → "View Claim Form" secondary
- **Safe Area**: top: 24, bottom: insets.bottom + 24

### My Claims
- **Content**: Sectioned list ("Not Filed", "Filed - Pending", "Paid") → Swipeable claim cards (title, status badge, deadline/confirmation #)
- **Empty State**: "No claims yet" illustration, "Start browsing" CTA

### Claim Detail (Stack)
- **Header**: "Edit" button top-right
- **Content**: Settlement summary (read-only) → Status dropdown → Confirmation # input → Filed date picker → Payout amount → Notes textarea → "Scan Document" button

### Profile
- **Content**: Avatar + name (editable) → Account (email, subscription) → Preferences (categories, brands, notifications, dark mode, biometric toggles) → Support (contact, rate, about, legal) → "Log Out" (destructive)

## Color Palette

**Primary**: `#1A4D2E` (forest green) | Light: `#2D7A4C`  
**Accent**: `#F77F00` (warm orange - urgency/CTAs)

**Backgrounds**:  
Light: `#FFFFFF` | Dark: `#0F1419`  
Surface: `#F8F9FA` / `#1C2128`  
Surface Elevated: `#FFFFFF` / `#252D36`

**Text**:  
Primary: `#1A1A1A` / `#E6E8EB`  
Secondary: `#666666` / `#8B929A`  
Tertiary: `#999999` / `#6E7781`

**Semantic**: Success `#2D7A4C`, Warning `#F59E0B`, Error `#DC2626`, Info `#3B82F6`

**Status**: Not Filed `#6B7280`, Filed Pending `#F59E0B`, Paid `#2D7A4C`, Rejected `#DC2626`

## Typography

**Families**: Montserrat (titles/headers), SF Pro/Roboto (body/UI)

**Scale**:
- h1: Montserrat Bold 32/40
- h2: Montserrat SemiBold 24/32
- h3: Montserrat SemiBold 20/28
- h4: Montserrat Medium 18/24
- body: System Regular 16/24
- body-small: System Regular 14/20
- caption: System Regular 12/16
- button: Montserrat SemiBold 16

## Components

**Cards**: 16px radius, shadow (0,2) opacity 0.08 radius 8, 20px padding

**Buttons**:
- Primary: filled Primary, white text, 12px radius, 52px height, opacity 0.7 pressed
- Secondary: outlined Primary, Primary text, 12px radius, 52px height
- Text: no background, Primary text

**FAB**: 56x56, 28px radius, Accent background, white icon, shadow (0,2) opacity 0.10 radius 8

**Badges/Chips**: 6px radius, 6/12px padding, caption medium weight, status colors at 10% opacity

**Empty States**: Illustration (max-width 280px, centered) → h3 heading → body-small secondary text → CTA (if applicable)

## Required Assets

**Icons**:
- icon.png: Stylized settlement document, forest green on white (home screen)
- splash-icon.png: Same as icon, larger, centered on Primary background (launch)

**Empty States**:
- empty-claims.png: Empty folder, green/orange accents (My Claims)
- empty-search.png: Magnifying glass, minimal line-art (Browse no results)
- empty-notifications.png: Peaceful bell with checkmark (Notifications)

**Onboarding**:
- onboarding-welcome.png: Person discovering settlement check (first slide)
- onboarding-categories.png: Organized categories/folders (category selection)
- onboarding-notifications.png: Phone with friendly notification (permission request)

**Results**:
- eligibility-likely.png: Celebration confetti/checkmark, joyful green (LIKELY result)
- eligibility-possible.png: Thoughtful checkmark, hopeful neutral (POSSIBLE result)
- eligibility-unlikely.png: Gentle empathetic illustration (UNLIKELY result)

**Profile**:
- avatar-default.png: Geometric user icon, Primary on light (default avatar)

## Safe Area Standards

**Tabs with Header**: top: 24, bottom: tabBarHeight + 24  
**Modals**: top: insets.top + 24, bottom: insets.bottom + 24  
**Custom Headers**: top: headerHeight + 24, bottom: tabBarHeight + 24

## Key Interactions

- Stats cards: Animated count-up on load
- Countdown timer: Animated if <30 days to deadline
- Hero images: Parallax scroll effect
- Claims: Swipe-to-delete
- Search: Debounced input
- Buttons: 0.7 opacity on press
- Chips: Selected state uses Primary fill
- Progress: Visual progress bar during multi-step flows