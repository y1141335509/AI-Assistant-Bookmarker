const TableDetector = {
  // Detect if content contains table-like formats
  hasTable(content) {
    if (!content) return false;
    
    const patterns = [
      /<table[\s\S]*?<\/table>/i, // HTML table
      /\|[\s\S]*?\|/m, // Markdown table
      /[\w\s]+\t[\w\s]+/m, // TSV format
      /[\w\s]+,[\w\s]+/m, // CSV format
    ];
    
    return patterns.some(pattern => pattern.test(content));
  },

  // Extract structured data from various table formats
  extractTableData(content) {
    try {
      // Try HTML table first
      if (/<table[\s\S]*?<\/table>/i.test(content)) {
        return this.parseHTMLTable(content);
      }
      
      // Try markdown table
      if (/\|[\s\S]*?\|/m.test(content)) {
        return this.parseMarkdownTable(content);
      }
      
      // Try TSV format
      if (/[\w\s]+\t[\w\s]+/m.test(content)) {
        return this.parseTSV(content);
      }
      
      // Try CSV format
      if (/[\w\s]+,[\w\s]+/m.test(content)) {
        return this.parseCSV(content);
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting table data:', error);
      return null;
    }
  },

  parseHTMLTable(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('table');
    
    if (!table) return null;
    
    const rows = Array.from(table.querySelectorAll('tr'));
    return rows.map(row => 
      Array.from(row.querySelectorAll('td, th')).map(cell => 
        cell.textContent.trim()
      )
    );
  },

  parseMarkdownTable(content) {
    const lines = content.split('\n').filter(line => line.includes('|'));
    return lines.map(line => 
      line.split('|')
        .map(cell => cell.trim())
        .filter(cell => cell !== '')
    ).filter(row => row.length > 0);
  },

  parseTSV(content) {
    return content.split('\n')
      .filter(line => line.includes('\t'))
      .map(line => line.split('\t').map(cell => cell.trim()));
  },

  parseCSV(content) {
    return content.split('\n')
      .filter(line => line.includes(','))
      .map(line => line.split(',').map(cell => cell.trim()));
  }
};