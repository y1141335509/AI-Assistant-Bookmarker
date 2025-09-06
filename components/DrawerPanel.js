function DrawerPanel({ conversations, onDeleteItem, onAddItem, onClose }) {
  try {
    return (
      <div className="extension-drawer h-screen flex flex-col" data-name="drawer-panel" data-file="components/DrawerPanel.js">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-[var(--secondary-color)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Conversation Navigator
            </h2>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <div className="icon-x text-lg text-[var(--text-secondary)]"></div>
            </button>
          </div>
          <button 
            onClick={onAddItem}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <div className="icon-plus text-sm"></div>
            Add Q&A
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-[var(--text-secondary)]">
              <div className="icon-message-circle text-3xl mb-2 mx-auto opacity-50"></div>
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Add your first Q&A pair</p>
            </div>
          ) : (
            conversations.map(conversation => (
              <ConversationItem 
                key={conversation.id}
                conversation={conversation}
                onDelete={onDeleteItem}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-[var(--secondary-color)]">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <div className="icon-info text-sm"></div>
            <span>Click items to jump to conversation</span>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('DrawerPanel component error:', error);
    return null;
  }
}