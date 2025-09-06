const ConversationStore = {
  conversations: [
    {
      id: '1',
      question: 'What are the key principles of React development?',
      answer: 'React development follows several key principles: component-based architecture, declarative programming, virtual DOM for performance, unidirectional data flow, and reusability.',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
      id: '2', 
      question: 'How do I optimize React performance?',
      answer: 'To optimize React performance: use React.memo for functional components, implement useMemo and useCallback hooks, code splitting with lazy loading, optimize bundle size, avoid unnecessary re-renders, and use proper key props in lists.',
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    },
    {
      id: '3',
      question: 'Can you explain Chrome extension development?', 
      answer: 'Chrome extension development involves creating web applications that extend browser functionality. Key components include:<br><br><table border="1"><tr><th>Component</th><th>Purpose</th><th>Required</th></tr><tr><td>manifest.json</td><td>Extension configuration</td><td>Yes</td></tr><tr><td>background.js</td><td>Persistent functionality</td><td>Optional</td></tr><tr><td>content.js</td><td>Page interaction</td><td>Optional</td></tr><tr><td>popup.html</td><td>User interface</td><td>Optional</td></tr></table>',
      timestamp: new Date().toISOString(), // now
    }
  ],

  getConversations() {
    return [...this.conversations].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  },

  addConversation(question, answer) {
    const newConversation = {
      id: Date.now().toString(),
      question,
      answer,
      timestamp: new Date().toISOString()
    };
    this.conversations.push(newConversation);
    return newConversation;
  },

  deleteConversation(id) {
    this.conversations = this.conversations.filter(conv => conv.id !== id);
  },

  updateConversation(id, updates) {
    const index = this.conversations.findIndex(conv => conv.id === id);
    if (index !== -1) {
      this.conversations[index] = { ...this.conversations[index], ...updates };
      return this.conversations[index];
    }
    return null;
  }
};