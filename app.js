class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">We're sorry, but something unexpected happened.</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-black"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  try {
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(true);
    const [conversations, setConversations] = React.useState([]);
    const [showAddModal, setShowAddModal] = React.useState(false);

    React.useEffect(() => {
      // Load initial mock data
      const mockConversations = ConversationStore.getConversations();
      setConversations(mockConversations);
    }, []);

    const handleDeleteItem = (id) => {
      ConversationStore.deleteConversation(id);
      setConversations(ConversationStore.getConversations());
    };

    const handleAddItem = (question, answer) => {
      ConversationStore.addConversation(question, answer);
      setConversations(ConversationStore.getConversations());
      setShowAddModal(false);
    };

    const toggleDrawer = () => {
      setIsDrawerOpen(!isDrawerOpen);
    };

    return (
      <div className="min-h-screen flex bg-gray-50" data-name="app" data-file="app.js">
        {/* Mock Chat Interface */}
        <div className="flex-1">
          <MockChatInterface 
            onToggleDrawer={toggleDrawer}
            isDrawerOpen={isDrawerOpen}
          />
        </div>

        {/* Navigation Drawer */}
        {isDrawerOpen && (
          <DrawerPanel 
            conversations={conversations}
            onDeleteItem={handleDeleteItem}
            onAddItem={() => setShowAddModal(true)}
            onClose={() => setIsDrawerOpen(false)}
          />
        )}

        {/* Add Item Modal */}
        {showAddModal && (
          <AddItemModal 
            onAdd={handleAddItem}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error('App component error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);