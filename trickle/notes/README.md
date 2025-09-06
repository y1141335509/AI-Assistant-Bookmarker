# AI Chat Navigator Chrome Extension

## Overview
A Chrome extension canvas that helps users navigate long AI conversations by providing an organized drawer interface with question and answer pairs.

## Key Features
- **Navigation Drawer**: Side panel that stores conversation Q&A pairs
- **Add/Delete Items**: Users can manually add or remove conversation items
- **Quick Navigation**: Click items to jump to specific parts of conversations
- **Expandable Items**: Truncated text with expand/collapse functionality
- **Table Export**: Automatic detection of tables in AI responses with Google Sheets export
- **Multiple Formats**: Supports HTML, Markdown, CSV, and TSV table formats
- **Mock Interface**: Simulates popular AI websites like ChatGPT, Claude

## Target Pain Point
When AI conversations become very long, users spend significant time searching for specific questions they asked previously. This extension provides a structured navigation system to quickly locate and jump to relevant conversation segments.

## Technical Architecture
- **React 18**: Component-based UI framework
- **TailwindCSS**: Utility-first styling with custom theme variables
- **Modular Structure**: Separated components for maintainability
- **Local Storage**: Conversation data management utility

## Components
- `DrawerPanel`: Main navigation sidebar with Q&A list
- `ConversationItem`: Individual conversation entry with actions and table detection
- `AddItemModal`: Form for adding new Q&A pairs
- `MockChatInterface`: Simulated AI chat interface with table examples
- `TableExportButton`: Google Sheets export functionality for tables
- `ConversationStore`: Data management utility
- `TableDetector`: Utility for detecting and parsing various table formats
- `GoogleSheetsExporter`: Handler for Google Sheets API integration

## Usage
This canvas demonstrates the core functionality. For actual Chrome extension implementation, additional files needed:
- `manifest.json` for extension configuration
- Content scripts for webpage interaction
- Background scripts for persistent functionality
- Proper Chrome extension APIs integration

## Next Steps
1. Convert to actual Chrome extension structure
2. Implement content script injection
3. Add webpage conversation detection
4. Integrate with popular AI websites
5. Add persistent storage with Chrome storage API