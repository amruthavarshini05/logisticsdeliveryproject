# Status Transitions & Journey Log Guide

## 📋 Overview

Your logistics system now enforces a **strict state machine** for shipment statuses. This ensures that every status change follows a logical workflow, preventing invalid transitions and maintaining data integrity.

---

## 🔄 Valid Status Transitions

### State Machine Diagram

```
     ┌─────────┐
     │ BOOKED  │  (Shipment created, awaiting assignment)
     └────┬────┘
          │
          ▼
     ┌─────────────┐
     │ ASSIGNED    │  (Driver assigned automatically)
     └────┬────────┘
          │
          ▼
     ┌──────────────┐
     │ PICKED UP    │  (Collected from sender)
     └────┬─────────┘
          │
          ▼
     ┌──────────────┐
     │ IN TRANSIT   │  (On the way to delivery)
     └────┬─────────┘
          │
          ▼
    ┌─────────────────────┐
    │ OUT FOR DELIVERY    │  (Final delivery route)
    └─────┬───────────┬───┘
          │           │
          ▼           ▼
    ┌──────────┐  ┌──────────┐
    │DELIVERED │  │ FAILED   │  (Terminal states)
    └──────────┘  └──────────┘
```

### Detailed Transitions

| # | From | To | Trigger | When |
|---|------|----|---------|----|
| 1 | 📦 Booked | 👤 Assigned | Backend automation | When shipment is created |
| 2 | 👤 Assigned | 🏪 Picked Up | Driver barcode scan | At collection/pickup point |
| 3 | 🏪 Picked Up | 🚗 In Transit | Driver barcode scan | Item loaded in vehicle |
| 4 | 🚗 In Transit | 🚚 Out for Delivery | Driver barcode scan | About to start delivery run |
| 5 | 🚚 Out for Delivery | ✓ Delivered | Driver barcode scan | At customer doorstep |
| 6 | 🚚 Out for Delivery | ✗ Failed | Driver barcode scan | Customer not available/rejected |

---

## ✅ What's Enforced

### ✓ Valid Only

```javascript
// These transitions work:
booked → assigned          // Auto-assigned
assigned → picked_up       // First driver scan
picked_up → in_transit     // Second driver scan
in_transit → out_for_delivery  // Third driver scan
out_for_delivery → delivered    // Final scan
out_for_delivery → failed       // Delivery attempt failed
```

### ✗ Invalid (400 Error)

```javascript
// These are rejected with error:

// Skipping steps
booked → in_transit        // ❌ Skip assigned, picked_up
assigned → delivered       // ❌ Skip intermediate states

// Going backwards
delivered → in_transit     // ❌ No reversals
in_transit → assigned      // ❌ Can't go back

// Invalid endpoints
booked → failed            // ❌ Can't fail before delivery
in_transit → failed        // ❌ Can't fail except during delivery
delivered → failed         // ❌ Can't fail after delivered
```

---

## 🛠️ Implementation Details

### Backend Validation (scanRoutes.js)

```javascript
const validTransitions = {
  booked: ["assigned"],
  assigned: ["picked_up"],
  picked_up: ["in_transit"],
  in_transit: ["out_for_delivery"],
  out_for_delivery: ["delivered", "failed"],
  delivered: [],           // Terminal - no transitions
  failed: []               // Terminal - no transitions
};

const isValidTransition = (currentStatus, newStatus) => {
  return validTransitions[currentStatus]?.includes(newStatus) || false;
};
```

### Error Response (400 Bad Request)

When an invalid transition is attempted:

```json
{
  "message": "Invalid status transition from 'in_transit' to 'booked'",
  "currentStatus": "in_transit",
  "allowedNextStates": ["out_for_delivery"]
}
```

### Frontend Logic (ScannedShipmentModal.jsx)

The modal automatically shows only valid next-state buttons:

```javascript
const getNextStates = () => {
  return validTransitions[shipment.status] || [];
};

// Renders only valid buttons
{getNextStates().map((nextStatus) => (
  <button onClick={() => handleStatusUpdate(nextStatus)}>
    {getButtonLabel(nextStatus)}
  </button>
))}
```

---

## 📱 Enhanced Journey Log (Sender Tracking Page)

Your tracking page now features a **professional journey log** similar to ParcelPulse, with:

### Visual Elements

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  🕐 Apr 26, 2025 2:15:30 PM                    │
│  📦 BOOKED                                      │
│  📍 Lat: 17.3500, Lng: 78.5000                 │
│                                                 │
├─────────────────────────────────────────────────┤
│  👤 Apr 26, 2025 2:20:15 PM                    │
│  ASSIGNED                                       │
│  📍 Lat: 17.3501, Lng: 78.5001                 │
│                                                 │
├─────────────────────────────────────────────────┤
│  🏪 Apr 26, 2025 2:45:00 PM                    │
│  PICKED UP                                      │
│  📍 Lat: 17.3502, Lng: 78.5002                 │
│                                                 │
├─────────────────────────────────────────────────┤
│  🚗 Apr 26, 2025 3:10:45 PM                    │
│  IN TRANSIT                                     │
│  📍 Lat: 17.3600, Lng: 78.5100                 │
│                                                 │
├─────────────────────────────────────────────────┤
│  🚚 Apr 26, 2025 3:55:20 PM                    │
│  OUT FOR DELIVERY                               │
│  📍 Lat: 17.3750, Lng: 78.5150                 │
│                                                 │
├─────────────────────────────────────────────────┤
│  ✓ Apr 26, 2025 4:05:00 PM  ⭐ LATEST          │
│  DELIVERED                                      │
│  📍 Lat: 17.3800, Lng: 78.5200                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Features

✨ **Status Icons**
- 📦 Booked - Package registered
- 👤 Assigned - Driver assigned
- 🏪 Picked Up - Collected from sender
- 🚗 In Transit - Traveling to delivery area
- 🚚 Out for Delivery - On delivery route
- ✓ Delivered - Successfully delivered
- ✗ Failed - Delivery failed

🎨 **Visual Design**
- Gradient connecting line (blue → purple)
- Animated slide-in effects for each status
- Color-coded status badges
- Precise timestamp formatting
- GPS coordinates with 4 decimal precision

📍 **Information Displayed**
- Status name (human-readable)
- Exact timestamp with AM/PM
- Location (Latitude & Longitude)
- Visual indication of latest status

---

## 📊 Status Color Coding

| Status | Color | Hex Code | Meaning |
|--------|-------|----------|---------|
| Booked | 🟡 Amber | #FFB800 | Awaiting assignment |
| Assigned | 🔵 Blue | #0066CC | Driver assigned |
| Picked Up | 🔷 Bright Blue | (new) | Collected |
| In Transit | 🔵 Steel Blue | #1F77D2 | On the way |
| Out for Delivery | 🟠 Orange | #FF6B35 | Final delivery |
| Delivered | 🟢 Green | #06A77D | Complete |
| Failed | 🔴 Red | #D32F2F | Not delivered |

---

## 🚀 How It Works End-to-End

### User Journey (Sender)

1. **Sender creates shipment** → Status: `booked`
2. **Backend assigns driver** → Status: `assigned`
3. **Driver scans at pickup** → Status: `picked_up`
4. **Driver starts driving** → Status: `in_transit`
5. **Driver starts delivery route** → Status: `out_for_delivery`
6. **Driver scans at door** → Status: `delivered` or `failed`
7. **Sender sees in tracking page** → Full journey log with all statuses

### Technical Flow

```
POST /api/shipment (create)
  ↓
Auto-assign driver
  ↓
Status = "booked" → "assigned"
  ↓
Driver scans barcode
  ↓
POST /api/scan (validate transition)
  ↓
Check validTransitions[currentStatus]
  ↓
✓ If valid: Create ScanEvent, update Shipment
✗ If invalid: Return 400 error
  ↓
GET /api/track/:trackingId (sender views)
  ↓
Display enhanced journey log with timeline
```

---

## ⚠️ Error Handling

### When Invalid Transition Attempted

**Frontend:**
- Modal only shows valid next-state buttons
- No UI option for invalid transitions
- Error message if user somehow bypasses (shouldn't happen)

**Backend:**
- Validates every POST /api/scan request
- Returns 400 with `allowedNextStates` array
- Frontend catches and displays error

### Example Error Message

```
"Invalid status transition from 'in_transit' to 'booked'
Current Status: in_transit
Allowed Next States: ['out_for_delivery']"
```

---

## 📱 Mobile Considerations

### On Mobile Devices

✓ Large emoji status icons for easy reading
✓ Vertical timeline optimized for scrolling
✓ Touch-friendly marker circles
✓ Readable timestamp format
✓ Full GPS coordinates for verification

### Responsive Layout

```
Desktop (1024px+)      Tablet (768px)       Mobile (<480px)
─────────────────      ──────────────       ───────────────
Wider timeline         Adjusted spacing     Compact markers
50px markers           44px markers         44px markers
Full padding           Medium padding       Minimal padding
Large fonts            Standard fonts       Readable fonts
```

---

## 🧪 Testing the New System

### Test Case 1: Valid Sequence

```
1. Create shipment → booked ✓
2. Check backend assigned → assigned ✓
3. Driver scans → picked_up ✓
4. Driver scans → in_transit ✓
5. Driver scans → out_for_delivery ✓
6. Driver scans → delivered ✓
7. View tracking page → See full journey log ✓
```

### Test Case 2: Invalid Transition

```
1. In "assigned" state
2. Try to go to "in_transit" (skip picked_up)
3. Backend returns 400 error ✓
4. Frontend shows error message ✓
5. Only "picked_up" button available ✓
```

### Test Case 3: Mobile Journey Log

```
1. Create test shipment with multiple statuses
2. Open tracking page on mobile device
3. Verify timeline renders vertically ✓
4. Scroll through journey log ✓
5. Check all status icons display ✓
6. Verify timestamps readable ✓
7. Verify GPS coordinates visible ✓
```

---

## 📋 API Changes

### POST /api/scan (Enhanced)

**Request:**
```json
{
  "trackingId": "TRK-123456",
  "driverId": "507f1f77bcf86cd799439011",
  "lat": 17.3500,
  "lng": 78.5000,
  "newStatus": "in_transit"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Scan successful",
  "shipment": { /* updated shipment */ },
  "scan": { /* new scan event */ },
  "allowedNextStates": ["out_for_delivery"]
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Invalid status transition from 'assigned' to 'in_transit'",
  "currentStatus": "assigned",
  "allowedNextStates": ["picked_up"]
}
```

---

## 🎯 Summary

✅ **Status Validation** - Enforced state machine prevents invalid workflows
✅ **Journey Log** - Beautiful timeline showing full delivery progression
✅ **Error Prevention** - Frontend & backend validation
✅ **GPS Tracking** - Location captured at each status change
✅ **Mobile-Optimized** - Fully responsive journey log
✅ **User-Friendly** - Clear visual feedback for current and next states

**Ready for production deployment!** 🚀

---

**Version**: 1.0.0  
**Last Updated**: April 26, 2026  
**Status Validation**: Fully Implemented ✅
