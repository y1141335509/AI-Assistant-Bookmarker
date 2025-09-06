function AddItemModal({ onAdd, onClose }) {
  try {
    const [question, setQuestion] = React.useState('');
    const [answer, setAnswer] = React.useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      if (question.trim() && answer.trim()) {
        onAdd(question.trim(), answer.trim());
        setQuestion('');
        setAnswer('');
      }
    };

    const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleBackdropClick}
        data-name="add-item-modal" 
        data-file="components/AddItemModal.js"
      >
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Add Q&A Pair</h3>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <div className="icon-x text-lg text-[var(--text-secondary)]"></div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter the question you asked..."
                className="w-full p-3 border border-[var(--border-color)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Answer
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter the AI's answer..."
                className="w-full p-3 border border-[var(--border-color)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                rows={4}
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={!question.trim() || !answer.trim()}
              >
                Add Item
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  } catch (error) {
    console.error('AddItemModal component error:', error);
    return null;
  }
}