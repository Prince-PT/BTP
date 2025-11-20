# BookRide Component - Testing Guide

## 🧪 Manual Testing Checklist

### Test 1: Pickup Location Selection
**Steps:**
1. Navigate to BookRide page
2. Click anywhere on the map in Step 1
3. **Expected:** Green marker appears, address loads with spinner
4. **Expected:** "Confirm This Location" button appears
5. Click "Confirm This Location"
6. **Expected:** Pickup location is confirmed
7. **Expected:** "Continue to Drop-off" button appears
8. Click "Continue to Drop-off"
9. **Expected:** Move to Step 2 (Drop-off section)

**Pass Criteria:**
- ✅ No automatic step transition
- ✅ Confirmation button required
- ✅ Continue button required
- ✅ Loading indicator shows during geocoding
- ✅ Address displays correctly

---

### Test 2: Drop-off Location Selection
**Steps:**
1. Complete Test 1
2. Click anywhere on the map in Step 2
3. **Expected:** Red marker appears, address loads with spinner
4. **Expected:** "Confirm This Location" button appears
5. Click "Confirm This Location"
6. **Expected:** Drop-off location is confirmed
7. **Expected:** "Continue to Schedule" button appears
8. Click "Continue to Schedule"
9. **Expected:** Move to Step 3 (Schedule section)

**Pass Criteria:**
- ✅ No automatic step transition
- ✅ Confirmation button required
- ✅ Continue button required
- ✅ Loading indicator shows during geocoding
- ✅ Address displays correctly

---

### Test 3: Date Selection
**Steps:**
1. Complete Test 1 & 2
2. Click on date picker in Step 3
3. Select tomorrow's date
4. **Expected:** Date field updates
5. **Expected:** Quick time presets are hidden (not today)

**Pass Criteria:**
- ✅ Can select future dates
- ✅ Cannot select past dates
- ✅ Quick presets only show for today

---

### Test 4: Time Selection
**Steps:**
1. Complete Test 1 & 2
2. Select today's date in Step 3
3. **Expected:** Quick time preset buttons appear
4. Click "+30m" preset button
5. **Expected:** Time updates to current time + 30 minutes
6. **Expected:** Formatted confirmation box appears with animation
7. Manually change time using time picker
8. **Expected:** Confirmation box updates

**Pass Criteria:**
- ✅ Quick presets work correctly
- ✅ Manual time selection works
- ✅ Confirmation box shows readable format
- ✅ Animation plays (bounce effect)

---

### Test 5: Passenger Selection
**Steps:**
1. Complete Test 1-4
2. Click on passenger button "2"
3. **Expected:** Button scales up and changes to gradient purple-pink
4. **Expected:** Previous selection (1) returns to normal
5. Click passenger button "4"
6. **Expected:** Selection updates with animation

**Pass Criteria:**
- ✅ Only one passenger count selected at a time
- ✅ Hover effects work
- ✅ Selected state shows gradient background
- ✅ Labels show: Solo, Duo, Trio, Group

---

### Test 6: Complete Flow
**Steps:**
1. Start at Step 1
2. Select and confirm pickup location
3. Click "Continue to Drop-off"
4. Select and confirm drop-off location
5. Click "Continue to Schedule"
6. Select date and time
7. Select passenger count
8. **Expected:** "Review Trip" button appears
9. Click "Review Trip"
10. **Expected:** Move to Step 4 (Review)
11. **Expected:** All details displayed correctly
12. Click "Request Ride"
13. **Expected:** Success message appears
14. **Expected:** Navigate to ride details page

**Pass Criteria:**
- ✅ All steps complete in order
- ✅ No automatic transitions
- ✅ All data persists between steps
- ✅ Review shows correct information
- ✅ Ride created successfully

---

### Test 7: Step Navigation
**Steps:**
1. Complete Steps 1-3
2. Click on Step 1 in progress indicator
3. **Expected:** Return to Step 1
4. **Expected:** Pickup location still set
5. Click on Step 3 in progress indicator
6. **Expected:** Jump to Step 3
7. **Expected:** Date/time still set

**Pass Criteria:**
- ✅ Can navigate back to previous steps
- ✅ Data persists when navigating
- ✅ Progress indicator shows completion status

---

### Test 8: Loading States
**Steps:**
1. Open BookRide page
2. Click on map location
3. **Expected:** Loading spinner appears on map
4. **Expected:** "Loading address..." text shows
5. Wait for geocoding to complete
6. **Expected:** Spinner disappears
7. **Expected:** Address displays

**Pass Criteria:**
- ✅ Loading indicator appears immediately
- ✅ Backdrop blur effect visible
- ✅ Loading text is readable
- ✅ Spinner animates smoothly

---

### Test 9: Responsive Design (Mobile)
**Steps:**
1. Open DevTools (F12)
2. Switch to mobile view (iPhone 12)
3. Complete booking flow
4. Check all elements

**Pass Criteria:**
- ✅ Map is fully visible
- ✅ Buttons are touch-friendly (≥44px)
- ✅ Text is readable
- ✅ Passenger selection grid adapts
- ✅ Date/time inputs stack vertically

---

### Test 10: Edge Cases

#### Test 10A: No Location Confirmation
**Steps:**
1. Click map in Step 1
2. Don't click "Confirm This Location"
3. Try to click "Continue to Drop-off"
4. **Expected:** Button doesn't appear until confirmed

#### Test 10B: Incomplete Date/Time
**Steps:**
1. Complete Steps 1-2
2. Select only date, not time
3. **Expected:** "Review Trip" button doesn't appear
4. Select time
5. **Expected:** "Review Trip" button appears

#### Test 10C: Browser Back Button
**Steps:**
1. Complete booking flow
2. Press browser back button
3. **Expected:** Navigate to previous page
4. **Expected:** No errors in console

---

## 🎨 Visual Testing Checklist

### Animations
- [ ] fadeIn animation on Step 3 entrance
- [ ] bounceIn animation on time confirmation
- [ ] pulse-soft animation on clock emoji
- [ ] Scale animation on button hover
- [ ] Spin animation on loading spinner

### Colors & Gradients
- [ ] Pickup: Green marker and accents
- [ ] Drop-off: Red marker and accents
- [ ] Schedule: Blue-purple gradients
- [ ] Passengers: Purple-pink gradients
- [ ] Confirmation: Green borders and backgrounds

### Typography
- [ ] Headers are bold and readable
- [ ] Labels have proper hierarchy
- [ ] Formatted dates are large and prominent
- [ ] Helper text is smaller and muted

---

## 📊 Performance Testing

### Metrics to Check
1. **Geocoding Response Time**
   - Expected: < 1 second for most locations
   - Check Network tab for Nominatim API calls

2. **Animation Smoothness**
   - Expected: 60 FPS during animations
   - Check Performance tab during interactions

3. **Memory Usage**
   - Expected: No memory leaks on step transitions
   - Navigate between steps multiple times

---

## 🐛 Known Issues to Watch For

1. **Rapid Map Clicks**
   - Multiple rapid clicks may queue geocoding requests
   - Debouncing should handle this, but test it

2. **Date/Time Validation**
   - Browser datetime validation may differ
   - Test on Chrome, Firefox, Safari

3. **Mobile Keyboard**
   - Keyboard may cover date/time inputs
   - Check scroll behavior on mobile

---

## ✅ Acceptance Criteria

The BookRide component is ready when:

1. ✅ No automatic step transitions occur
2. ✅ User must confirm each location selection
3. ✅ User must click "Continue" to advance
4. ✅ Date/time picker is interactive and beautiful
5. ✅ Quick time presets work correctly
6. ✅ Passenger selection is visual and engaging
7. ✅ Loading states provide clear feedback
8. ✅ All animations are smooth
9. ✅ Mobile experience is polished
10. ✅ Complete flow works end-to-end

---

## 🚀 Testing Script for Quick Verification

```bash
# 1. Start the application
cd /Users/rajatsharma/Desktop/BTP/apps/frontend
npm run dev

# 2. Open browser
# Navigate to: http://localhost:5173/rider/book

# 3. Quick smoke test:
# - Click map → Confirm → Continue (Pickup)
# - Click map → Confirm → Continue (Drop-off)
# - Select today's date → Click "+1h" preset
# - Click "4" passengers
# - Click "Review Trip"
# - Verify all details in Step 4
```

---

## 📝 Bug Report Template

If you find issues:

```markdown
**Issue:** [Brief description]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**


**Actual Behavior:**


**Browser/Device:**


**Screenshot/Video:**

```

---

**Happy Testing! 🎉**

