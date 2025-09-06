function MockChatInterface({ onToggleDrawer, isDrawerOpen }) {
  try {
    return (
      <div className="h-screen flex flex-col bg-white" data-name="mock-chat" data-file="components/MockChatInterface.js">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[var(--secondary-color)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--primary-color)] rounded-lg flex items-center justify-center">
              <div className="icon-bot text-lg text-white"></div>
            </div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">AI Chat Assistant</h1>
          </div>
          
          <button 
            onClick={onToggleDrawer}
            className="btn-secondary flex items-center gap-2"
          >
            <div className="icon-panel-right text-sm"></div>
            {isDrawerOpen ? 'Hide Navigator' : 'Show Navigator'}
          </button>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Sample conversation */}
            <div className="space-y-4">
              <div className="flex justify-end" id="conversation-1">
                <div className="max-w-2xl bg-[var(--primary-color)] text-white p-4 rounded-lg">
                  <p>What are the key principles of React development?</p>
                </div>
              </div>
              
              <div className="flex justify-start">
                <div className="max-w-2xl bg-gray-100 p-4 rounded-lg">
                  <p>React development follows several key principles: component-based architecture, declarative programming, virtual DOM for performance, unidirectional data flow, and reusability. These principles help create maintainable and efficient applications.</p>
                </div>
              </div>

              <div className="flex justify-end" id="conversation-2">
                <div className="max-w-2xl bg-[var(--primary-color)] text-white p-4 rounded-lg">
                  <p>How do I optimize React performance?</p>
                </div>
              </div>
              
              <div className="flex justify-start">
                <div className="max-w-2xl bg-gray-100 p-4 rounded-lg">
                  <p>To optimize React performance: use React.memo for functional components, implement useMemo and useCallback hooks, code splitting with lazy loading, optimize bundle size, avoid unnecessary re-renders, and use proper key props in lists.</p>
                </div>
              </div>

              <div className="flex justify-end" id="conversation-3">
                <div className="max-w-2xl bg-[var(--primary-color)] text-white p-4 rounded-lg">
                  <p>Can you explain Chrome extension development?</p>
                </div>
              </div>
              
              <div className="flex justify-start">
                <div className="max-w-2xl bg-gray-100 p-4 rounded-lg">
                  <p className="mb-4">Chrome extension development involves creating web applications that extend browser functionality. Key components include:</p>
                  
                  {/* Sample table content */}
                  <div className="relative">
                    <table className="w-full border-collapse border border-gray-300 text-sm mb-2">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 p-2 text-left">Component</th>
                          <th className="border border-gray-300 p-2 text-left">Purpose</th>
                          <th className="border border-gray-300 p-2 text-left">Required</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-2">manifest.json</td>
                          <td className="border border-gray-300 p-2">Extension configuration</td>
                          <td className="border border-gray-300 p-2">Yes</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">background.js</td>
                          <td className="border border-gray-300 p-2">Persistent functionality</td>
                          <td className="border border-gray-300 p-2">Optional</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">content.js</td>
                          <td className="border border-gray-300 p-2">Page interaction</td>
                          <td className="border border-gray-300 p-2">Optional</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">popup.html</td>
                          <td className="border border-gray-300 p-2">User interface</td>
                          <td className="border border-gray-300 p-2">Optional</td>
                        </tr>
                      </tbody>
                    </table>
                    <TableExportButton 
                      tableData={[
                        ['Component', 'Purpose', 'Required'],
                        ['manifest.json', 'Extension configuration', 'Yes'],
                        ['background.js', 'Persistent functionality', 'Optional'],
                        ['content.js', 'Page interaction', 'Optional'],
                        ['popup.html', 'User interface', 'Optional']
                      ]}
                      conversationId="3"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 bg-[var(--secondary-color)]">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input 
              type="text" 
              placeholder="Type your message..."
              className="flex-1 p-3 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            />
            <button className="btn-primary">
              <div className="icon-send text-sm"></div>
            </button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('MockChatInterface component error:', error);
    return null;
  }
}