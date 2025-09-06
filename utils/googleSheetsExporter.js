const GoogleSheetsExporter = {
  // Google Sheets API integration with fallback to CSV download
  async exportTable(tableData, sheetName = 'AI_Conversation_Table') {
    try {
      if (!tableData || !Array.isArray(tableData)) {
        throw new Error('Invalid table data');
      }

      // Show loading state
      this.showLoadingNotification();

      // Try Google Sheets API first (if available in extension context)
      if (this.isExtensionContext()) {
        try {
          return await this.createGoogleSheet(tableData, sheetName);
        } catch (apiError) {
          console.log('Google Sheets API not available, falling back to CSV download');
        }
      }

      // Fallback to CSV download
      await this.downloadAsCSV(tableData, sheetName);
      
      return { success: true, sheetName, method: 'csv' };
    } catch (error) {
      console.error('Export failed:', error);
      this.showErrorNotification();
      throw error;
    }
  },

  async downloadAsCSV(tableData, sheetName) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const csvContent = this.convertToCSV(tableData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sheetName}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    this.showSuccessNotification(sheetName, 'csv');
  },

  async createGoogleSheet(tableData, sheetName) {
    // This would be implemented with Google Sheets API in real extension
    // Requires OAuth2 authentication and proper API setup
    throw new Error('Google Sheets API integration requires extension context');
  },

  isExtensionContext() {
    return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
  },

  convertToCSV(tableData) {
    return tableData.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(cell).replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      }).join(',')
    ).join('\n');
  },

  showLoadingNotification() {
    const notification = document.createElement('div');
    notification.id = 'export-notification';
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
        <div>
          <p class="font-medium">Exporting Table...</p>
          <p class="text-sm opacity-90">Please wait</p>
        </div>
      </div>
    `;
    document.body.appendChild(notification);
  },

  showSuccessNotification(sheetName, method = 'sheets') {
    this.removeExistingNotification();
    
    const notification = document.createElement('div');
    notification.id = 'export-notification';
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="icon-check-circle text-lg"></div>
        <div>
          <p class="font-medium">Export Successful!</p>
          <p class="text-sm opacity-90">${method === 'csv' ? 'Downloaded as CSV file' : 'Created Google Sheet'}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => this.removeExistingNotification(), 3000);
  },

  showErrorNotification() {
    this.removeExistingNotification();
    
    const notification = document.createElement('div');
    notification.id = 'export-notification';
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="icon-x-circle text-lg"></div>
        <div>
          <p class="font-medium">Export Failed</p>
          <p class="text-sm opacity-90">Please try again</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => this.removeExistingNotification(), 4000);
  },

  removeExistingNotification() {
    const existing = document.getElementById('export-notification');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
  },

  // Future: Real Google Sheets API integration
  async authenticateWithGoogle() {
    // This would handle OAuth flow with Google
    throw new Error('Google authentication not implemented in demo');
  },

  async createSpreadsheet(title, data) {
    // This would create actual Google Sheets
    throw new Error('Google Sheets API not implemented in demo');
  }
};