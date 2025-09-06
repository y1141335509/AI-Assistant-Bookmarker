// Conversation Extractor for different AI chat sites
class ConversationExtractor {
    constructor() {
        this.siteDetectors = {
            'chatgpt.com': this.extractChatGPT.bind(this),
            'chat.openai.com': this.extractChatGPT.bind(this),
            'claude.ai': this.extractClaude.bind(this),
            'bard.google.com': this.extractBard.bind(this),
            'gemini.google.com': this.extractBard.bind(this),
            'you.com': this.extractYouCom.bind(this),
            'bing.com': this.extractBing.bind(this)
        };
    }

    getCurrentSite() {
        const hostname = window.location.hostname;
        for (const site of Object.keys(this.siteDetectors)) {
            if (hostname.includes(site)) {
                return site;
            }
        }
        return null;
    }

    extractConversations() {
        const site = this.getCurrentSite();
        if (site && this.siteDetectors[site]) {
            return this.siteDetectors[site]();
        }
        return [];
    }

    extractChatGPT() {
        console.log('=== ChatGPT Extraction Debug ===');
        const conversations = [];
        
        // Debug: Show what's on the page
        console.log('Page title:', document.title);
        console.log('URL:', window.location.href);
        
        // Try multiple selectors for ChatGPT's evolving structure
        const messageSelectors = [
            '[data-message-author-role]',
            '[data-testid^="conversation-turn"]', 
            '[data-testid*="conversation-turn"]',
            '.group.w-full.text-token-text-primary',
            '.group.w-full',
            '[class*="conversation-turn"]',
            '.group',
            'article',
            '[role="article"]'
        ];
        
        let messages = [];
        let workingSelector = null;
        
        // Try each selector and log results
        for (const selector of messageSelectors) {
            const found = document.querySelectorAll(selector);
            console.log(`Selector "${selector}": found ${found.length} elements`);
            if (found.length > 0 && !workingSelector) {
                messages = found;
                workingSelector = selector;
                console.log(`Using selector: ${selector}`);
                break;
            }
        }
        
        if (messages.length === 0) {
            console.log('No messages found with any selector');
            // Try a very broad search
            const allDivs = document.querySelectorAll('div');
            console.log(`Total divs on page: ${allDivs.length}`);
            
            // Look for potential message containers
            const potentialMessages = Array.from(allDivs).filter(div => {
                const text = div.textContent || '';
                return text.length > 50 && text.length < 5000;
            });
            console.log(`Potential message containers: ${potentialMessages.length}`);
            return conversations;
        }

        console.log(`Processing ${messages.length} message elements`);
        let currentPair = { question: '', answer: '' };
        
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            const isUser = this.isUserMessage(message, 'chatgpt');
            const text = this.extractTextFromElement(message);
            
            console.log(`Message ${i}: isUser=${isUser}, textLength=${text.length}, text="${text.substring(0, 100)}..."`);
            
            if (text.trim() && text.length > 10) { // Filter out very short texts
                if (isUser) {
                    console.log(`Found user message: "${text.substring(0, 50)}..."`);
                    // If we have a previous pair, save it
                    if (currentPair.question && currentPair.answer) {
                        conversations.push({
                            id: conversations.length + 1,
                            question: currentPair.question,
                            answer: currentPair.answer,
                            timestamp: new Date().toISOString(),
                            questionElement: currentPair.questionElement,
                            answerElement: currentPair.answerElement
                        });
                        console.log(`Saved conversation pair ${conversations.length}`);
                    }
                    // Start new pair
                    currentPair = { question: text, answer: '', questionElement: message };
                } else if (currentPair.question) {
                    console.log(`Found AI response: "${text.substring(0, 50)}..."`);
                    // This is AI response
                    currentPair.answer = text;
                    currentPair.answerElement = message;
                }
            }
        }
        
        // Add the last pair if complete
        if (currentPair.question && currentPair.answer) {
            conversations.push({
                id: conversations.length + 1,
                question: currentPair.question,
                answer: currentPair.answer,
                timestamp: new Date().toISOString(),
                questionElement: currentPair.questionElement,
                answerElement: currentPair.answerElement
            });
            console.log(`Saved final conversation pair ${conversations.length}`);
        }
        
        console.log(`ChatGPT: Final result - ${conversations.length} conversations extracted`);
        console.log('Conversations:', conversations);
        return conversations;
    }

    extractClaude() {
        console.log('=== Claude Extraction Debug ===');
        const conversations = [];
        
        // Claude's message structure - updated selectors
        const messageSelectors = [
            '[data-testid*="message"]',
            '.font-claude-message',
            '.font-user-message',
            'div[class*="font-user-message"]',
            'div[class*="font-claude-message"]',
            'div[data-testid="user-message"]',
            'div[data-testid="claude-message"]',
            '.prose',
            'div[class*="message"]'
        ];
        
        let messages = [];
        for (const selector of messageSelectors) {
            messages = document.querySelectorAll(selector);
            if (messages.length > 0) {
                console.log(`Claude: Found ${messages.length} messages with selector: ${selector}`);
                break;
            }
        }

        let currentPair = { question: '', answer: '' };
        
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            const isUser = this.isUserMessage(message, 'claude');
            const text = this.extractTextFromElement(message);
            
            if (text.trim() && text.length > 10) {
                if (isUser) {
                    if (currentPair.question && currentPair.answer) {
                        conversations.push({
                            id: conversations.length + 1,
                            question: currentPair.question,
                            answer: currentPair.answer,
                            timestamp: new Date().toISOString()
                        });
                    }
                    currentPair = { question: text, answer: '' };
                } else if (currentPair.question) {
                    currentPair.answer = text;
                }
            }
        }
        
        if (currentPair.question && currentPair.answer) {
            conversations.push({
                id: conversations.length + 1,
                question: currentPair.question,
                answer: currentPair.answer,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`Claude: Extracted ${conversations.length} conversations`);
        return conversations;
    }

    extractBard() {
        const conversations = [];
        
        // Bard/Gemini message structure
        const userMessages = document.querySelectorAll('[data-test-id="user-query"], .user-query, [class*="user"]');
        const botMessages = document.querySelectorAll('[data-test-id="bot-response"], .bot-response, [class*="model-response"]');
        
        const minLength = Math.min(userMessages.length, botMessages.length);
        
        for (let i = 0; i < minLength; i++) {
            const question = this.extractTextFromElement(userMessages[i]);
            const answer = this.extractTextFromElement(botMessages[i]);
            
            if (question.trim() && answer.trim()) {
                conversations.push({
                    id: i + 1,
                    question,
                    answer,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        return conversations;
    }

    extractYouCom() {
        const conversations = [];
        
        // You.com structure - look for chat messages
        const messages = document.querySelectorAll('[data-testid*="message"], .chat-message, [class*="message"]');
        
        let currentPair = { question: '', answer: '' };
        
        messages.forEach((message, index) => {
            const isUser = this.isUserMessage(message, 'you');
            const text = this.extractTextFromElement(message);
            
            if (text.trim()) {
                if (isUser) {
                    if (currentPair.question && currentPair.answer) {
                        conversations.push({
                            id: conversations.length + 1,
                            question: currentPair.question,
                            answer: currentPair.answer,
                            timestamp: new Date().toISOString()
                        });
                    }
                    currentPair = { question: text, answer: '' };
                } else if (currentPair.question) {
                    currentPair.answer = text;
                }
            }
        });
        
        if (currentPair.question && currentPair.answer) {
            conversations.push({
                id: conversations.length + 1,
                question: currentPair.question,
                answer: currentPair.answer,
                timestamp: new Date().toISOString()
            });
        }
        
        return conversations;
    }

    extractBing() {
        const conversations = [];
        
        // Bing Chat structure
        const messages = document.querySelectorAll('.ac-textBlock, [class*="message"], [class*="response"]');
        
        let currentPair = { question: '', answer: '' };
        
        messages.forEach((message) => {
            const isUser = this.isUserMessage(message, 'bing');
            const text = this.extractTextFromElement(message);
            
            if (text.trim()) {
                if (isUser) {
                    if (currentPair.question && currentPair.answer) {
                        conversations.push({
                            id: conversations.length + 1,
                            question: currentPair.question,
                            answer: currentPair.answer,
                            timestamp: new Date().toISOString()
                        });
                    }
                    currentPair = { question: text, answer: '' };
                } else if (currentPair.question) {
                    currentPair.answer = text;
                }
            }
        });
        
        if (currentPair.question && currentPair.answer) {
            conversations.push({
                id: conversations.length + 1,
                question: currentPair.question,
                answer: currentPair.answer,
                timestamp: new Date().toISOString()
            });
        }
        
        return conversations;
    }

    isUserMessage(element, site) {
        const text = element.textContent || '';
        const className = element.className || '';
        const dataAttrs = Array.from(element.attributes).map(attr => attr.name + '=' + attr.value).join(' ');
        
        console.log(`Checking if user message - Site: ${site}, Class: ${className}, Data: ${dataAttrs.substring(0, 100)}`);
        
        // Site-specific user message detection
        switch (site) {
            case 'chatgpt':
                const isChatGPTUser = (
                    dataAttrs.includes('user') ||
                    dataAttrs.includes('data-message-author-role=user') ||
                    className.includes('user') ||
                    element.querySelector('[data-message-author-role="user"]') ||
                    element.closest('[data-message-author-role="user"]') ||
                    element.hasAttribute('data-message-author-role') && element.getAttribute('data-message-author-role') === 'user'
                );
                console.log(`ChatGPT user check: ${isChatGPTUser}`);
                return isChatGPTUser;
                
            case 'claude':
                const isClaudeUser = (
                    className.includes('user') ||
                    className.includes('Human') ||
                    className.includes('font-user-message') ||
                    dataAttrs.includes('user') ||
                    dataAttrs.includes('Human') ||
                    element.querySelector('[class*="user"]') ||
                    element.querySelector('[class*="font-user-message"]')
                );
                console.log(`Claude user check: ${isClaudeUser}`);
                return isClaudeUser;
                
            case 'you':
            case 'bing':
                return (
                    className.includes('user') ||
                    className.includes('human') ||
                    dataAttrs.includes('user')
                );
                
            default:
                return false;
        }
    }

    extractTextFromElement(element) {
        // Remove script tags and other unwanted elements
        const clone = element.cloneNode(true);
        const unwantedElements = clone.querySelectorAll('script, style, button, .copy-button, [class*="copy"]');
        unwantedElements.forEach(el => el.remove());
        
        return clone.textContent || clone.innerText || '';
    }

    // Monitor for new messages with improved detection
    startMonitoring(callback) {
        let lastConversationCount = 0;
        let isInitialLoad = true;
        
        const checkForChanges = () => {
            const conversations = this.extractConversations();
            
            // Always call callback on initial load or when count changes
            if (isInitialLoad || conversations.length !== lastConversationCount) {
                console.log(`Conversation change detected: ${conversations.length} conversations`);
                lastConversationCount = conversations.length;
                isInitialLoad = false;
                callback(conversations);
            }
        };
        
        // Initial extraction with delay to allow page to load
        setTimeout(() => {
            checkForChanges();
        }, 1000);
        
        // Monitor for DOM changes
        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;
            
            for (const mutation of mutations) {
                // Check if new nodes were added that might be messages
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if the added node or its children might be messages
                            const possibleMessage = node.querySelector ? (
                                node.querySelector('[data-message-author-role], [data-testid*="message"], .font-claude-message, .font-user-message, .group') ||
                                node.matches('[data-message-author-role], [data-testid*="message"], .font-claude-message, .font-user-message, .group')
                            ) : false;
                            
                            if (possibleMessage) {
                                shouldCheck = true;
                                break;
                            }
                        }
                    }
                }
            }
            
            if (shouldCheck) {
                // Debounce the check to avoid excessive calls
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(checkForChanges, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false
        });
        
        // Also check periodically for any missed changes
        const intervalId = setInterval(checkForChanges, 5000);
        
        // Return cleanup function
        return () => {
            observer.disconnect();
            clearInterval(intervalId);
            clearTimeout(this.debounceTimer);
        };
    }
    
    // Scroll to a specific conversation
    scrollToConversation(conversationId) {
        const conversations = this.extractConversations();
        const conversation = conversations.find(c => c.id === conversationId);
        
        if (conversation && conversation.questionElement) {
            conversation.questionElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            
            // Highlight the question temporarily
            const originalStyle = conversation.questionElement.style.backgroundColor;
            conversation.questionElement.style.backgroundColor = '#fff3cd';
            setTimeout(() => {
                conversation.questionElement.style.backgroundColor = originalStyle;
            }, 2000);
        }
    }
    
    // Debug function to test selectors manually
    debugSelectors() {
        console.log('=== Manual Debug Test ===');
        console.log('Current URL:', window.location.href);
        console.log('Page title:', document.title);
        
        const testSelectors = [
            '[data-message-author-role]',
            '[data-testid*="conversation"]',
            '[data-testid*="message"]',
            '.group.w-full',
            '.group',
            'article',
            '[role="article"]',
            '.prose',
            '.font-claude-message',
            '.font-user-message'
        ];
        
        testSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            console.log(`"${selector}": ${elements.length} elements`);
            if (elements.length > 0 && elements.length < 20) {
                Array.from(elements).slice(0, 3).forEach((el, i) => {
                    const text = el.textContent?.substring(0, 100) || '';
                    console.log(`  ${i}: "${text}..."`);
                });
            }
        });
        
        // Try extraction
        const conversations = this.extractConversations();
        console.log('Extracted conversations:', conversations);
        return conversations;
    }
}

// Make available globally
window.ConversationExtractor = ConversationExtractor;

// Also make debug function available globally
window.debugConversations = function() {
    if (window.conversationExtractor) {
        return window.conversationExtractor.debugSelectors();
    } else if (window.ConversationExtractor) {
        const extractor = new window.ConversationExtractor();
        return extractor.debugSelectors();
    } else {
        console.log('ConversationExtractor not available');
    }
};