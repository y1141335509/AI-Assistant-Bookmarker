function ConversationItem({ conversation, onDelete }) {
  try {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const truncateText = (text, maxLength = 60) => {
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    const handleJumpTo = () => {
      // Scroll to the conversation anchor in the mock interface
      const element = document.getElementById(`conversation-${conversation.id}`);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        // Add highlight effect
        element.classList.add('bg-yellow-100');
        setTimeout(() => {
          element.classList.remove('bg-yellow-100');
        }, 2000);
      }
    };

    return (
      <div className="nav-item" data-name="conversation-item" data-file="components/ConversationItem.js">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* Question */}
            <div className="flex items-start gap-2 mb-2">
              <div className="icon-help-circle text-sm text-[var(--primary-color)] mt-0.5 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)] leading-tight">
                  {isExpanded ? conversation.question : truncateText(conversation.question)}
                </p>
              </div>
            </div>

            {/* Answer Preview */}
            <div className="flex items-start gap-2">
              <div className="icon-message-square text-sm text-[var(--accent-color)] mt-0.5 flex-shrink-0"></div>
              <div className="flex-1">
                <div className="text-xs text-[var(--text-secondary)] leading-tight">
                  {isExpanded ? (
                    <div>
                      <div dangerouslySetInnerHTML={{__html: conversation.answer}} />
                      {TableDetector.hasTable(conversation.answer) && (
                        <div className="mt-2">
                          <TableExportButton 
                            tableData={TableDetector.extractTableData(conversation.answer)}
                            conversationId={conversation.id}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>{truncateText(conversation.answer, 40)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-[var(--text-secondary)]">
                {new Date(conversation.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-[var(--primary-color)] hover:underline"
              >
                {isExpanded ? 'Less' : 'More'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1 ml-2">
            <button 
              onClick={handleJumpTo}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Jump to conversation"
            >
              <div className="icon-arrow-right text-sm text-[var(--primary-color)]"></div>
            </button>
            <button 
              onClick={() => onDelete(conversation.id)}
              className="p-1 hover:bg-red-50 rounded transition-colors"
              title="Delete item"
            >
              <div className="icon-trash-2 text-sm text-red-500"></div>
            </button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('ConversationItem component error:', error);
    return null;
  }
}