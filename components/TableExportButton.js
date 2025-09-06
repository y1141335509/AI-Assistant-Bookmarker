function TableExportButton({ tableData, conversationId }) {
  try {
    const [isExporting, setIsExporting] = React.useState(false);

    const handleExportToSheets = async () => {
      setIsExporting(true);
      try {
        await GoogleSheetsExporter.exportTable(tableData, `AI_Conversation_Table_${conversationId || Date.now()}`);
      } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export to Google Sheets. Please try again.');
      } finally {
        setIsExporting(false);
      }
    };

    React.useEffect(() => {
      // Add hover effect to nearby tables
      const addTableHoverEffect = () => {
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
          const button = table.parentElement?.querySelector('.table-export-btn');
          if (button) {
            table.addEventListener('mouseenter', () => {
              button.style.opacity = '1';
            });
            table.addEventListener('mouseleave', () => {
              button.style.opacity = '0.7';
            });
          }
        });
      };
      
      setTimeout(addTableHoverEffect, 100);
    }, []);

    return (
      <button 
        onClick={handleExportToSheets}
        disabled={isExporting}
        className="table-export-btn inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors opacity-70 hover:opacity-100"
        title="Export table to Google Sheets"
        data-name="table-export-button" 
        data-file="components/TableExportButton.js"
      >
        {isExporting ? (
          <>
            <div className="animate-spin w-3 h-3 border border-green-600 border-t-transparent rounded-full"></div>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <div className="icon-table text-sm text-green-600"></div>
            <span>Export to Sheets</span>
          </>
        )}
      </button>
    );
  } catch (error) {
    console.error('TableExportButton component error:', error);
    return null;
  }
}