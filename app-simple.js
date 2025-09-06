// Simple Vanilla JS App - No React Dependencies
console.log('🏠 HTML loaded successfully');
console.log('🎨 App script loaded!');

// Simple conversation store
const ConversationStore = {
  conversations: [],
  
  getConversations() {
    return this.conversations;
  },
  
  addConversation(question, answer) {
    const newConv = {
      id: Date.now(),
      question,
      answer,
      timestamp: new Date().toISOString()
    };
    this.conversations.push(newConv);
    this.renderConversations();
    return newConv;
  },
  
  deleteConversation(id) {
    this.conversations = this.conversations.filter(conv => conv.id !== id);
    this.renderConversations();
  },
  
  setConversations(conversations) {
    console.log('📝 Setting conversations:', conversations.length);
    this.conversations = conversations;
    this.renderConversations();
  },
  
  renderConversations() {
    const container = document.getElementById('conversations-list');
    if (!container) {
      console.log('❌ Conversations container not found');
      return;
    }
    
    container.innerHTML = '';
    
    if (this.conversations.length === 0) {
      container.innerHTML = '<div class="p-4 text-gray-500 text-center">No conversations found</div>';
      return;
    }
    
    this.conversations.forEach(conv => {
      const item = document.createElement('div');
      item.className = 'nav-item border-b border-gray-100 p-3 cursor-pointer hover:bg-gray-50';
      item.setAttribute('data-conversation-id', conv.id);
      item.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <h4 class="font-medium text-sm" style="font-weight: 500; font-size: 14px;">
            ${conv.question.substring(0, 50)}${conv.question.length > 50 ? '...' : ''}
          </h4>
          <button class="delete-btn text-red-600 hover:text-red-800" data-id="${conv.id}">×</button>
        </div>
        <p class="text-xs text-gray-600" style="font-size: 12px; color: #6b7280;">
          ${conv.answer.substring(0, 80)}${conv.answer.length > 80 ? '...' : ''}
        </p>
        <span class="text-xs text-gray-400" style="font-size: 11px; color: #9ca3af;">
          ${new Date(conv.timestamp).toLocaleDateString()}
        </span>
      `;
      
      // Add click handler for item
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-btn')) {
          this.handleItemClick(conv.id);
        }
      });
      
      container.appendChild(item);
    });
    
    // Add delete handlers
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(e.target.dataset.id);
        this.deleteConversation(id);
      });
    });
  },
  
  handleItemClick(conversationId) {
    console.log('🖱️ Clicked conversation:', conversationId);
    
    // Add visual feedback to clicked item
    const clickedItem = document.querySelector(`[data-conversation-id="${conversationId}"]`);
    if (clickedItem) {
      const originalStyle = {
        backgroundColor: clickedItem.style.backgroundColor,
        transform: clickedItem.style.transform,
        transition: clickedItem.style.transition
      };
      
      // Animate clicked item
      clickedItem.style.transition = 'all 0.2s ease-in-out';
      clickedItem.style.backgroundColor = '#e0e7ff';
      clickedItem.style.transform = 'scale(0.98)';
      
      setTimeout(() => {
        clickedItem.style.backgroundColor = '#f0f9ff';
        clickedItem.style.transform = 'scale(1)';
      }, 100);
      
      setTimeout(() => {
        clickedItem.style.backgroundColor = originalStyle.backgroundColor;
        clickedItem.style.transform = originalStyle.transform;
        clickedItem.style.transition = originalStyle.transition;
      }, 800);
    }
    
    if (window.parent) {
      window.parent.postMessage({
        type: 'SCROLL_TO_CONVERSATION',
        conversationId: conversationId
      }, '*');
    }
  }
};

// Initialize the app
function initApp() {
  console.log('🚀 Initializing app...');
  
  const root = document.getElementById('root');
  if (!root) {
    console.error('❌ Root element not found');
    return;
  }
  
  root.innerHTML = `
    <div class="h-full flex flex-col bg-white" style="height: 100%; display: flex; flex-direction: column; background: white; border-left: 1px solid #e5e7eb;">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 flex justify-between items-center" style="padding: 16px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
        <h2 class="text-lg font-bold" style="font-size: 18px; font-weight: 700;">Chat Navigator</h2>
        <button id="close-btn" style="background: none; border: none; cursor: pointer; font-size: 16px;">×</button>
      </div>
      
      <!-- Add button -->
      <div class="p-3" style="padding: 12px;">
        <button id="add-btn" class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700" 
                style="width: 100%; padding: 8px 16px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
          + Add Item
        </button>
      </div>
      
      <!-- Conversations list -->
      <div id="conversations-list" class="flex-1 overflow-y-auto" style="flex: 1; overflow-y: auto;">
        <div class="p-4 text-gray-500 text-center">Loading conversations...</div>
      </div>
    </div>
    
    <!-- Add Modal -->
    <div id="add-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
         style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 50;">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4" style="background: white; border-radius: 8px; padding: 24px; max-width: 28rem; width: 100%; margin: 0 16px;">
        <h3 class="text-lg font-bold mb-4" style="font-size: 18px; font-weight: 700; margin-bottom: 16px;">Add New Item</h3>
        <form id="add-form">
          <div class="mb-4" style="margin-bottom: 16px;">
            <label class="block text-sm font-medium mb-2" style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px;">Question</label>
            <input type="text" id="question-input" class="w-full p-2 border rounded" 
                   style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;" 
                   placeholder="Enter your question...">
          </div>
          <div class="mb-4" style="margin-bottom: 16px;">
            <label class="block text-sm font-medium mb-2" style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px;">Answer</label>
            <textarea id="answer-input" class="w-full p-2 border rounded h-24" 
                      style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; height: 96px; resize: vertical;" 
                      placeholder="Enter the answer..."></textarea>
          </div>
          <div class="flex justify-end space-x-2" style="display: flex; justify-content: flex-end; gap: 8px;">
            <button type="button" id="cancel-btn" class="px-4 py-2 border rounded" 
                    style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer;">
              Cancel
            </button>
            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded" 
                    style="padding: 8px 16px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer;">
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // Add event listeners
  document.getElementById('close-btn').addEventListener('click', () => {
    if (window.parent) {
      window.parent.postMessage('close', '*');
    }
  });
  
  document.getElementById('add-btn').addEventListener('click', () => {
    const modal = document.getElementById('add-modal');
    modal.style.display = 'flex';
  });
  
  document.getElementById('cancel-btn').addEventListener('click', () => {
    const modal = document.getElementById('add-modal');
    modal.style.display = 'none';
  });
  
  document.getElementById('add-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const question = document.getElementById('question-input').value.trim();
    const answer = document.getElementById('answer-input').value.trim();
    
    if (question && answer) {
      ConversationStore.addConversation(question, answer);
      document.getElementById('question-input').value = '';
      document.getElementById('answer-input').value = '';
      document.getElementById('add-modal').style.display = 'none';
    }
  });
  
  console.log('✅ App initialized successfully!');
  
  // Initial render
  ConversationStore.renderConversations();
}

// Listen for messages from content script
window.addEventListener('message', (event) => {
  console.log('📨 Message received:', {
    type: event.data.type,
    source: event.data.source,
    timestamp: event.data.timestamp,
    origin: event.origin
  });
  
  if (event.data.type === 'UPDATE_CONVERSATIONS' && event.data.source === 'ai-chat-navigator') {
    const newConversations = event.data.conversations || [];
    console.log('📥 Processing conversation update:', {
      count: newConversations.length,
      timestamp: new Date(event.data.timestamp).toLocaleTimeString(),
      conversations: newConversations.map(c => ({
        id: c.id,
        questionLength: c.question.length,
        answerLength: c.answer.length
      }))
    });
    
    ConversationStore.setConversations(newConversations);
    
    // Send confirmation back to content script
    try {
      window.parent.postMessage({
        type: 'CONVERSATIONS_RECEIVED',
        count: newConversations.length,
        timestamp: Date.now()
      }, '*');
      console.log('✅ Sent confirmation to content script');
    } catch (error) {
      console.log('⚠️ Could not send confirmation:', error.message);
    }
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 HTML DOM ready');
    initApp();
  });
} else {
  console.log('📄 HTML DOM ready');
  initApp();
}

console.log('📋 App script fully loaded!');