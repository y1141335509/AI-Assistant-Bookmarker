# Chrome Extension Setup Guide

## Directory Structure for Extension
```
ai-chat-navigator/
├── manifest.json
├── background/
│   └── service-worker.js
├── content/
│   ├── inject.js
│   └── navigator.css
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── navigator/ (from canvas)
│   ├── components/
│   ├── utils/
│   └── assets/
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
└── assets/
```

## Steps to Convert Canvas to Extension

### 1. Copy Canvas Files
- Copy all files from this canvas to `navigator/` folder
- Update file paths in HTML to use relative paths

### 2. Create Content Script (`content/inject.js`)
```javascript
// Inject the navigator drawer into AI websites
// Detect conversation elements and extract Q&A pairs
// Handle website-specific DOM structures
```

### 3. Create Background Script (`background/service-worker.js`)
```javascript
// Handle extension lifecycle
// Manage Chrome storage
// Handle Google Sheets API authentication
```

### 4. Create Extension Popup (`popup/popup.html`)
```javascript
// Quick settings and controls
// Enable/disable extension
// Export options
```

### 5. Add Icons
Create icons in required sizes: 16x16, 32x32, 48x48, 128x128 pixels

### 6. Google Sheets API Setup
1. Create Google Cloud Project
2. Enable Google Sheets API
3. Create OAuth2 credentials
4. Update manifest.json with client_id

## Chrome Web Store Review Requirements

### Essential for Approval:
1. **Complete manifest.json** ✅
2. **Privacy policy** (required for data handling)
3. **Detailed description** (what it does, how it works)
4. **Screenshots** (show functionality)
5. **Icons** (all required sizes)
6. **Single purpose** (clearly defined functionality)

### Common Rejection Reasons:
- Incomplete permissions justification
- Missing privacy policy
- Vague functionality description
- Low-quality icons/screenshots
- Requesting unnecessary permissions

## Testing Steps
1. Load extension in Chrome Developer mode
2. Test on supported AI websites
3. Verify table export functionality
4. Check anchor navigation
5. Test on different screen sizes