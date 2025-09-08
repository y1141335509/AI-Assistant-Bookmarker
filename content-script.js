// AI Chat Navigator Content Script - Simple Version
(function() {
    'use strict';
    
    console.log('AI Chat Navigator loaded on:', window.location.hostname);
    
    let currentConversations = [];
    let isInjected = false;
    
    // Robust conversation extraction for ChatGPT
    function extractChatGPT() {
        console.log('🤖 ChatGPT: Starting extraction...');
        const conversations = [];
        
        // Try the most specific and reliable approach first
        try {
            // Method 1: Use data-message-author-role (most reliable for 2024+ ChatGPT)
            const messageElements = document.querySelectorAll('[data-message-author-role]');
            if (messageElements.length > 0) {
                console.log(`ChatGPT: Found ${messageElements.length} messages with data-message-author-role`);
                const extracted = extractFromDataMessageRole(Array.from(messageElements));
                if (extracted.length > 0) {
                    console.log(`ChatGPT: Successfully extracted ${extracted.length} conversations using data-message-author-role`);
                    return extracted;
                }
            }
            
            // Method 2: Use conversation turn pattern
            const turnElements = document.querySelectorAll('[data-testid*="conversation-turn"]');
            if (turnElements.length > 0) {
                console.log(`ChatGPT: Found ${turnElements.length} conversation turns`);
                const extracted = extractFromConversationTurns(Array.from(turnElements));
                if (extracted.length > 0) {
                    console.log(`ChatGPT: Successfully extracted ${extracted.length} conversations using conversation turns`);
                    return extracted;
                }
            }
            
            // Method 3: Fallback to group elements in main content area only
            console.log('ChatGPT: Trying fallback group extraction...');
            return extractChatGPTFallback();
            
        } catch (error) {
            console.error('ChatGPT extraction error:', error);
            return [];
        }
    }
    
    // Extract using data-message-author-role (most reliable method)
    function extractFromDataMessageRole(elements) {
        const conversations = [];
        let currentPair = { question: '', answer: '', questionElement: null, answerElement: null };
        
        elements.forEach((element, index) => {
            const role = element.getAttribute('data-message-author-role');
            const text = extractTextFromElement(element);
            
            // Skip empty or very short content
            if (!text || text.length < 5) return;
            
            // Skip navigation-like content
            if (isNavigationContent(text)) {
                console.log('🚫 Skipping navigation content:', text.substring(0, 50));
                return;
            }
            
            console.log(`ChatGPT: Message ${index}: role=${role}, text="${text.substring(0, 60)}..."`);
            
            if (role === 'user') {
                // Save previous complete pair
                if (currentPair.question && currentPair.answer) {
                    if (!isDuplicateConversation(conversations, currentPair.question, currentPair.answer)) {
                        conversations.push({
                            id: conversations.length + 1,
                            question: currentPair.question,
                            answer: currentPair.answer,
                            timestamp: new Date().toISOString(),
                            questionElement: currentPair.questionElement,
                            answerElement: currentPair.answerElement
                        });
                    }
                }
                
                // Start new pair
                currentPair = {
                    question: text,
                    answer: '',
                    questionElement: element,
                    answerElement: null
                };
                
            } else if (role === 'assistant' && currentPair.question) {
                // Add assistant response to current pair
                currentPair.answer = text;
                currentPair.answerElement = element;
            }
        });
        
        // Add final pair
        if (currentPair.question && currentPair.answer) {
            if (!isDuplicateConversation(conversations, currentPair.question, currentPair.answer)) {
                conversations.push({
                    id: conversations.length + 1,
                    question: currentPair.question,
                    answer: currentPair.answer,
                    timestamp: new Date().toISOString(),
                    questionElement: currentPair.questionElement,
                    answerElement: currentPair.answerElement
                });
            }
        }
        
        return conversations;
    }
    
    // Extract using conversation turn elements
    function extractFromConversationTurns(elements) {
        const conversations = [];
        let currentPair = { question: '', answer: '', questionElement: null, answerElement: null };
        
        elements.forEach((element, index) => {
            const text = extractTextFromElement(element);
            
            // Skip empty or navigation content
            if (!text || text.length < 5 || isNavigationContent(text)) return;
            
            // Determine if this is a user or assistant message by looking at child elements
            const isUser = isUserMessage(element, 'chatgpt');
            
            console.log(`ChatGPT Turn ${index}: isUser=${isUser}, text="${text.substring(0, 60)}..."`);
            
            if (isUser) {
                // Save previous pair
                if (currentPair.question && currentPair.answer) {
                    if (!isDuplicateConversation(conversations, currentPair.question, currentPair.answer)) {
                        conversations.push({
                            id: conversations.length + 1,
                            question: currentPair.question,
                            answer: currentPair.answer,
                            timestamp: new Date().toISOString(),
                            questionElement: currentPair.questionElement,
                            answerElement: currentPair.answerElement
                        });
                    }
                }
                
                currentPair = {
                    question: text,
                    answer: '',
                    questionElement: element,
                    answerElement: null
                };
            } else if (currentPair.question) {
                currentPair.answer = text;
                currentPair.answerElement = element;
            }
        });
        
        // Add final pair
        if (currentPair.question && currentPair.answer) {
            if (!isDuplicateConversation(conversations, currentPair.question, currentPair.answer)) {
                conversations.push({
                    id: conversations.length + 1,
                    question: currentPair.question,
                    answer: currentPair.answer,
                    timestamp: new Date().toISOString(),
                    questionElement: currentPair.questionElement,
                    answerElement: currentPair.answerElement
                });
            }
        }
        
        return conversations;
    }
    
    // Check if content looks like navigation/menu items
    function isNavigationContent(text) {
        const navigationPatterns = [
            /^(Chat history|New chat|Search chats|Library|Sora|GPT|Life Coach|No psycho)/i,
            /^[\d\/\-\.]+$/, // Date patterns like "9/6/2025" or "2024-01-01"
            /^[⇧⌘⌃⌥]+[A-Z\d]$/i, // Keyboard shortcuts like "⇧⌘O"
            /^[×☕🔍📋➕✕]+$/u, // Special characters/icons only
            /^(Chat\s+history|New\s+chat|Search\s+chats|Copy\s+link|Share|Delete|Rename)/i,
            /^[A-Z]{2,}\s*[×✕]?\s*$/i, // Short uppercase words with optional close button
            /^(Today|Yesterday|Previous \d+ Days|Last \d+ days)/i, // Date headers
            /^(Settings|Help|Logout|Sign out|Profile|Account)/i, // Settings/menu items
            /^\s*[•·‣▸►]\s*/, // Bullet points or arrows (likely navigation)
            /^(Upgrade|Subscribe|Pro|Plus)/i // Subscription/upgrade prompts
        ];
        
        return navigationPatterns.some(pattern => pattern.test(text.trim()));
    }
    
    // Check for duplicate conversations
    function isDuplicateConversation(conversations, question, answer) {
        return conversations.some(conv => 
            conv.question.trim().substring(0, 100) === question.trim().substring(0, 100) && 
            conv.answer.trim().substring(0, 100) === answer.trim().substring(0, 100)
        );
    }
    
    // Fallback extraction method  
    function extractChatGPTFallback() {
        console.log('ChatGPT: Using fallback extraction method...');
        const conversations = [];
        
        // Enhanced selectors for fallback - focus on main content area
        const messageSelectors = [
            'main .group.w-full.text-token-text-primary',
            'main .group.w-full.text-gray-800', 
            'main .group.w-full',
            'main div.group',
            'main [class*="message"]',
            'main article',
            'main [role="article"]'
        ];
        
        let messages = [];
        let workingSelector = null;
        
        // Try each selector to find the best one for fallback
        for (const selector of messageSelectors) {
            const found = document.querySelectorAll(selector);
            console.log(`ChatGPT Fallback: "${selector}": ${found.length} elements`);
            
            if (found.length > 0) {
                const filtered = Array.from(found).filter(el => {
                    const text = extractTextFromElement(el);
                    return text.length > 10 && text.length < 50000 && !isNavigationContent(text) && 
                           !el.closest('nav') && !el.closest('[class*="sidebar"]');
                });
                
                if (filtered.length > messages.length) {
                    messages = filtered;
                    workingSelector = selector;
                }
            }
        }
        
        if (messages.length === 0) {
            console.log('ChatGPT Fallback: No suitable messages found');
            return conversations;
        }

        console.log(`ChatGPT Fallback: Using ${workingSelector} with ${messages.length} messages`);
        
        // Simple sequential pairing for fallback
        let currentPair = { question: '', answer: '', questionElement: null, answerElement: null };
        
        messages.forEach((message, index) => {
            const text = extractTextFromElement(message);
            if (!text || text.length < 10 || isNavigationContent(text)) return;
            
            const isUser = isUserMessage(message, 'chatgpt');
            console.log(`ChatGPT Fallback ${index}: isUser=${isUser}, text="${text.substring(0, 50)}..."`);
            
            if (isUser) {
                // Save previous pair
                if (currentPair.question && currentPair.answer && 
                    !isDuplicateConversation(conversations, currentPair.question, currentPair.answer)) {
                    conversations.push({
                        id: conversations.length + 1,
                        question: currentPair.question,
                        answer: currentPair.answer,
                        timestamp: new Date().toISOString(),
                        questionElement: currentPair.questionElement,
                        answerElement: currentPair.answerElement
                    });
                }
                
                currentPair = {
                    question: text,
                    answer: '',
                    questionElement: message,
                    answerElement: null
                };
            } else if (currentPair.question) {
                currentPair.answer = text;
                currentPair.answerElement = message;
            }
        });
        
        // Add final pair
        if (currentPair.question && currentPair.answer && 
            !isDuplicateConversation(conversations, currentPair.question, currentPair.answer)) {
            conversations.push({
                id: conversations.length + 1,
                question: currentPair.question,
                answer: currentPair.answer,
                timestamp: new Date().toISOString(),
                questionElement: currentPair.questionElement,
                answerElement: currentPair.answerElement
            });
        }
        
        console.log(`ChatGPT Fallback: Extracted ${conversations.length} conversations`);
        
        return conversations;
    }
    
    // Robust conversation extraction for Claude
    function extractClaude() {
        console.log('🤖 Claude: Starting extraction...');
        const conversations = [];
        
        // Claude's message structure - completely updated for 2024-2025 interface
        const messageSelectors = [
            // Modern Claude interface (Dec 2024 - Jan 2025)
            'div[data-testid="conversation-turn"]',
            'div[data-is-streaming]',
            'div[class*="font-user-message"]',
            'div[class*="font-claude-message"]', 
            'div[class*="font-assistant-message"]',
            // Alternative modern patterns
            '[data-testid*="message"]',
            '[data-testid*="turn"]',
            '[data-testid*="conversation"]',
            'div[role="region"]',
            // Content-based selectors with higher specificity
            'div.prose',
            'div[class*="prose"]',
            'div[class*="markdown"]',
            // User-specific patterns
            'div[class*="user"]',
            'div[class*="human"]',
            'div[class*="Human"]',
            // Assistant-specific patterns
            'div[class*="claude"]',
            'div[class*="Claude"]',
            'div[class*="assistant"]',
            'div[class*="Assistant"]',
            // Generic but targeted
            'div[class*="message"]',
            'div[role="article"]',
            'article div',
            // Chat container patterns
            'div[class*="chat"]',
            'div[class*="conversation"]',
            // Very broad but filtered later
            'main > div > div',
            'main div[class]',
            // Last resort - any div with substantial text
            'div'
        ];
        
        let messages = [];
        let workingSelector = null;
        
        // Try each selector and pick the best one
        let bestMessages = [];
        let bestSelector = null;
        let bestScore = 0;
        
        for (const selector of messageSelectors) {
            const found = document.querySelectorAll(selector);
            console.log(`Claude: Selector "${selector}": found ${found.length} elements`);
            
            if (found.length > 0) {
                // Filter and score potential messages
                const filtered = Array.from(found).filter(el => {
                    const text = extractTextFromElement(el);
                    // More lenient filtering - any element with some text
                    return text.length > 5 && text.length < 10000;
                });
                
                if (filtered.length > 0) {
                    // Score based on likely message patterns
                    let score = filtered.length;
                    
                    // Boost score for elements that look like user/AI messages
                    const pairsFound = filtered.filter(el => {
                        const className = el.className || '';
                        const dataAttrs = Array.from(el.attributes).map(attr => attr.name + '=' + attr.value).join(' ');
                        return (
                            className.includes('user') ||
                            className.includes('claude') ||
                            className.includes('message') ||
                            dataAttrs.includes('message') ||
                            dataAttrs.includes('user') ||
                            dataAttrs.includes('assistant')
                        );
                    }).length;
                    
                    score += pairsFound * 10; // Heavily weight elements that look like messages
                    
                    console.log(`Claude: "${selector}" scored ${score} (${filtered.length} elements, ${pairsFound} message-like)`);
                    
                    if (score > bestScore) {
                        bestMessages = filtered;
                        bestSelector = selector;
                        bestScore = score;
                    }
                }
            }
        }
        
        messages = bestMessages;
        workingSelector = bestSelector;

        if (messages.length === 0) {
            console.log('Claude: No messages found with any selector');
            return conversations;
        }

        console.log(`Claude: Processing ${messages.length} message elements`);
        let currentPair = { question: '', answer: '' };
        
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            const isUser = isUserMessage(message, 'claude');
            const text = extractTextFromElement(message);
            
            console.log(`Claude: Message ${i}: isUser=${isUser}, textLength=${text.length}, text="${text.substring(0, 50)}..."`);
            
            if (text.trim() && text.length > 5) { // Lowered threshold like ChatGPT
                if (isUser) {
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
                        console.log(`Claude: ✅ Saved conversation pair ${conversations.length}`);
                    }
                    // Start new pair
                    currentPair = { question: text, answer: '', questionElement: message };
                    console.log(`Claude: 👤 Started new user question: "${text.substring(0, 50)}..."`);
                } else if (currentPair.question) {
                    // This is Claude response
                    currentPair.answer = text;
                    currentPair.answerElement = message;
                    console.log(`Claude: 🤖 Added Claude answer: "${text.substring(0, 50)}..."`);
                }
            } else if (text.trim()) {
                console.log(`Claude: ⚠️ Skipped short text (${text.length} chars): "${text}"`);
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
        }
        
        console.log(`Claude: Extracted ${conversations.length} conversations`);
        return conversations;
    }

    // Helper function to detect user messages
    function isUserMessage(element, site) {
        const className = element.className || '';
        const dataAttrs = Array.from(element.attributes).map(attr => attr.name + '=' + attr.value).join(' ');
        
        switch (site) {
            case 'chatgpt':
                return (
                    dataAttrs.includes('user') ||
                    dataAttrs.includes('data-message-author-role=user') ||
                    className.includes('user') ||
                    element.querySelector('[data-message-author-role="user"]') ||
                    element.closest('[data-message-author-role="user"]') ||
                    element.hasAttribute('data-message-author-role') && element.getAttribute('data-message-author-role') === 'user'
                );
                
            case 'claude':
                const isClaudeUser = (
                    // Modern Claude patterns (2024-2025)
                    className.includes('font-user-message') ||
                    className.includes('user') ||
                    className.includes('Human') ||
                    className.includes('human') ||
                    // Data attribute patterns
                    dataAttrs.includes('user') ||
                    dataAttrs.includes('User') ||
                    dataAttrs.includes('Human') ||
                    dataAttrs.includes('human') ||
                    dataAttrs.includes('user-message') ||
                    dataAttrs.includes('data-testid="user') ||
                    // Element relationship patterns
                    element.querySelector('[class*="user"]') ||
                    element.querySelector('[class*="User"]') ||
                    element.querySelector('[class*="font-user"]') ||
                    element.querySelector('[class*="human"]') ||
                    element.querySelector('[class*="Human"]') ||
                    element.closest('[data-testid*="user"]') ||
                    element.closest('[class*="user"]') ||
                    // Parent/child relationship checks
                    (element.parentElement && (
                        element.parentElement.className.includes('user') ||
                        element.parentElement.className.includes('Human') ||
                        Array.from(element.parentElement.attributes).some(attr => 
                            attr.value.includes('user') || attr.value.includes('Human')
                        )
                    )) ||
                    // Text content heuristics for user messages
                    (() => {
                        const text = extractTextFromElement(element);
                        const shortText = text.length < 300;
                        const hasQuestionMarks = (text.match(/\?/g) || []).length > 0;
                        const startsWithQuestion = /^(what|how|why|when|where|can you|could you|please|help|explain|tell me)/i.test(text.trim());
                        return shortText && (hasQuestionMarks || startsWithQuestion);
                    })()
                );
                console.log(`Claude user check: ${isClaudeUser} (class: ${className.substring(0, 50)}, attrs: ${dataAttrs.substring(0, 50)})`);
                return isClaudeUser;

            case 'gemini':
                const isGeminiUser = (
                    // Modern Gemini patterns (2024-2025)
                    className.includes('user') ||
                    className.includes('User') ||
                    className.includes('human') ||
                    className.includes('Human') ||
                    className.includes('user-input') ||
                    // Data attribute patterns
                    dataAttrs.includes('user') ||
                    dataAttrs.includes('User') ||
                    dataAttrs.includes('human') ||
                    dataAttrs.includes('Human') ||
                    dataAttrs.includes('user-query') ||
                    dataAttrs.includes('user-input') ||
                    dataAttrs.includes('data-message-author-role=user') ||
                    dataAttrs.includes('data-testid="user') ||
                    // Element relationship patterns
                    element.querySelector('[data-test-id="user-query"]') ||
                    element.querySelector('[class*="user"]') ||
                    element.querySelector('[class*="User"]') ||
                    element.querySelector('[class*="human"]') ||
                    element.querySelector('[class*="Human"]') ||
                    element.querySelector('user-input-text') ||
                    element.closest('[data-testid*="user"]') ||
                    element.closest('[class*="user"]') ||
                    element.closest('[data-test-id*="user"]') ||
                    element.hasAttribute('data-message-author-role') && element.getAttribute('data-message-author-role') === 'user' ||
                    // Parent/child relationship checks
                    (element.parentElement && (
                        element.parentElement.className.includes('user') ||
                        element.parentElement.className.includes('User') ||
                        element.parentElement.className.includes('human') ||
                        element.parentElement.className.includes('Human') ||
                        Array.from(element.parentElement.attributes).some(attr => 
                            attr.value.includes('user') || attr.value.includes('User') || attr.value.includes('human') || attr.value.includes('Human')
                        )
                    )) ||
                    // Text content heuristics for user messages
                    (() => {
                        const text = extractTextFromElement(element);
                        const shortText = text.length < 300;
                        const hasQuestionMarks = (text.match(/\?/g) || []).length > 0;
                        const startsWithQuestion = /^(what|how|why|when|where|can you|could you|please|help|explain|tell me|show me|generate|create)/i.test(text.trim());
                        return shortText && (hasQuestionMarks || startsWithQuestion);
                    })()
                );
                console.log(`Gemini user check: ${isGeminiUser} (class: ${className.substring(0, 50)}, attrs: ${dataAttrs.substring(0, 50)})`);
                return isGeminiUser;
                
            case 'you':
                return (
                    className.includes('user') ||
                    className.includes('human') ||
                    className.includes('user-message') ||
                    dataAttrs.includes('user') ||
                    dataAttrs.includes('human')
                );
                
            case 'bing':
                return (
                    className.includes('user') ||
                    className.includes('human') ||
                    dataAttrs.includes('user') ||
                    element.closest('[data-author="user"]')
                );
                
            default:
                // Generic fallback for unsupported sites
                return (
                    className.includes('user') ||
                    className.includes('human') ||
                    dataAttrs.includes('user') ||
                    dataAttrs.includes('human')
                );
        }
    }

    // Helper function to extract clean text
    function extractTextFromElement(element) {
        // Remove script tags and other unwanted elements
        const clone = element.cloneNode(true);
        const unwantedElements = clone.querySelectorAll('script, style, button, .copy-button, [class*="copy"]');
        unwantedElements.forEach(el => el.remove());
        
        return clone.textContent || clone.innerText || '';
    }

    // Helper function to sanitize text for serialization
    function sanitizeText(text) {
        if (typeof text !== 'string') {
            text = String(text || '');
        }
        
        // Remove any characters that might cause serialization issues
        return text
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
            .replace(/\uFEFF/g, '') // Remove BOM
            .trim();
    }
    
    // Extract conversations from Gemini/Bard
    function extractGemini() {
        console.log('🤖 Gemini: Starting extraction...');
        const conversations = [];
        
        // Modern Gemini selectors (updated for current interface 2024-2025)
        const messageSelectors = [
            // Latest Gemini interface patterns (Dec 2024 - Jan 2025)
            'div[data-message-author-role]',
            'div[data-message-id]',
            'div[class*="conversation-turn"]',
            'div[role="presentation"]',
            'message-content',
            'model-response-text',
            'user-input-text',
            // Response container patterns
            'div[class*="response"]',
            'div[class*="user-input"]',
            'div[class*="model-response"]',
            'div[class*="gemini-response"]',
            'div[class*="bard-response"]',
            // Test ID patterns
            '[data-testid*="message"]',
            '[data-testid*="conversation"]',
            '[data-testid*="user"]',
            '[data-testid*="model"]',
            '[data-testid*="response"]',
            '[data-testid*="input"]',
            '[data-testid*="turn"]',
            // Legacy Google patterns
            '[data-test-id="user-query"]',
            '[data-test-id="bot-response"]',
            '[data-test-id="model-response"]',
            'div.user-query',
            'div.bot-response',
            'div.model-response',
            // Role-based selectors
            '[role="article"]',
            '[role="region"]',
            '[role="group"]',
            // Class-based patterns
            'div[class*="user"]',
            'div[class*="User"]',
            'div[class*="model"]',
            'div[class*="Model"]',
            'div[class*="assistant"]',
            'div[class*="Assistant"]',
            'div[class*="gemini"]',
            'div[class*="Gemini"]',
            'div[class*="bard"]',
            'div[class*="Bard"]',
            'div[class*="message"]',
            'div[class*="Message"]',
            'div[class*="chat"]',
            'div[class*="Chat"]',
            'div[class*="conversation"]',
            'div[class*="Conversation"]',
            '.conversation-turn',
            '.message',
            // Broader content patterns
            'main div[class]',
            'main > div > div',
            'article > div',
            '[class*="content"]',
            // Last resort - any substantial div
            'div'
        ];
        
        let messages = [];
        let workingSelector = null;
        
        // Try each selector and pick the best one (same strategy as Claude)
        let bestMessages = [];
        let bestSelector = null;
        let bestScore = 0;
        
        for (const selector of messageSelectors) {
            const found = document.querySelectorAll(selector);
            console.log(`Gemini: Selector "${selector}": found ${found.length} elements`);
            
            if (found.length > 0) {
                // Filter and score potential messages
                const filtered = Array.from(found).filter(el => {
                    const text = extractTextFromElement(el);
                    // More lenient filtering - any element with some text
                    return text.length > 5 && text.length < 10000;
                });
                
                if (filtered.length > 0) {
                    // Score based on likely message patterns
                    let score = filtered.length;
                    
                    // Boost score for elements that look like user/AI messages
                    const pairsFound = filtered.filter(el => {
                        const className = el.className || '';
                        const dataAttrs = Array.from(el.attributes).map(attr => attr.name + '=' + attr.value).join(' ');
                        return (
                            className.includes('user') ||
                            className.includes('model') ||
                            className.includes('gemini') ||
                            className.includes('bard') ||
                            className.includes('assistant') ||
                            className.includes('message') ||
                            className.includes('response') ||
                            dataAttrs.includes('message') ||
                            dataAttrs.includes('user') ||
                            dataAttrs.includes('model') ||
                            dataAttrs.includes('assistant') ||
                            dataAttrs.includes('response')
                        );
                    }).length;
                    
                    score += pairsFound * 10; // Heavily weight elements that look like messages
                    
                    console.log(`Gemini: "${selector}" scored ${score} (${filtered.length} elements, ${pairsFound} message-like)`);
                    
                    if (score > bestScore) {
                        bestMessages = filtered;
                        bestSelector = selector;
                        bestScore = score;
                    }
                }
            }
        }
        
        messages = bestMessages;
        workingSelector = bestSelector;
        
        if (messages.length > 0) {
            // Process unified messages (similar to ChatGPT/Claude approach)
            console.log(`Gemini: Processing ${messages.length} unified message elements`);
            let currentPair = { question: '', answer: '' };
            
            for (let i = 0; i < messages.length; i++) {
                const message = messages[i];
                const isUser = isUserMessage(message, 'gemini');
                const text = extractTextFromElement(message);
                
                console.log(`Gemini: Message ${i}: isUser=${isUser}, textLength=${text.length}, text="${text.substring(0, 50)}..."`);
                
                if (text.trim() && text.length > 5) { // Lowered threshold
                    if (isUser) {
                        if (currentPair.question && currentPair.answer) {
                            conversations.push({
                                id: conversations.length + 1,
                                question: currentPair.question,
                                answer: currentPair.answer,
                                timestamp: new Date().toISOString(),
                                questionElement: currentPair.questionElement,
                                answerElement: currentPair.answerElement
                            });
                            console.log(`Gemini: ✅ Saved conversation pair ${conversations.length}`);
                        }
                        currentPair = { question: text, answer: '', questionElement: message };
                        console.log(`Gemini: 👤 Started new user question: "${text.substring(0, 50)}..."`);
                    } else if (currentPair.question) {
                        currentPair.answer = text;
                        currentPair.answerElement = message;
                        console.log(`Gemini: 🤖 Added Gemini answer: "${text.substring(0, 50)}..."`);
                    }
                } else if (text.trim()) {
                    console.log(`Gemini: ⚠️ Skipped short text (${text.length} chars): "${text}"`);
                }
            }
            
            if (currentPair.question && currentPair.answer) {
                conversations.push({
                    id: conversations.length + 1,
                    question: currentPair.question,
                    answer: currentPair.answer,
                    timestamp: new Date().toISOString(),
                    questionElement: currentPair.questionElement,
                    answerElement: currentPair.answerElement
                });
            }
        } else {
            // Fallback: try separate user/bot message extraction
            console.log('Gemini: Trying separate user/bot message extraction');
            let userMessages = [];
            let botMessages = [];
            
            const userSelectors = ['[data-test-id="user-query"]', '.user-query', '[class*="user"]'];
            const botSelectors = ['[data-test-id="bot-response"]', '.bot-response', '[class*="model-response"]', '[class*="assistant"]'];
            
            for (const selector of userSelectors) {
                userMessages = document.querySelectorAll(selector);
                if (userMessages.length > 0) {
                    console.log(`Gemini: Found ${userMessages.length} user messages with: ${selector}`);
                    break;
                }
            }
            
            for (const selector of botSelectors) {
                botMessages = document.querySelectorAll(selector);
                if (botMessages.length > 0) {
                    console.log(`Gemini: Found ${botMessages.length} bot messages with: ${selector}`);
                    break;
                }
            }
            
            const minLength = Math.min(userMessages.length, botMessages.length);
            
            for (let i = 0; i < minLength; i++) {
                const question = extractTextFromElement(userMessages[i]);
                const answer = extractTextFromElement(botMessages[i]);
                
                if (question.trim() && answer.trim() && question.length > 10 && answer.length > 10) {
                    conversations.push({
                        id: i + 1,
                        question,
                        answer,
                        timestamp: new Date().toISOString(),
                        questionElement: userMessages[i],
                        answerElement: botMessages[i]
                    });
                }
            }
        }
        
        console.log(`Gemini: Extracted ${conversations.length} conversations`);
        return conversations;
    }

    // Extract conversations from You.com
    function extractYouCom() {
        console.log('🤖 You.com: Starting extraction...');
        const conversations = [];
        
        const messageSelectors = [
            '[data-testid*="message"]',
            '.chat-message',
            '[class*="message"]',
            '.user-message',
            '.bot-message',
            '.ai-message'
        ];
        
        let messages = [];
        for (const selector of messageSelectors) {
            messages = document.querySelectorAll(selector);
            if (messages.length > 0) {
                console.log(`You.com: Found ${messages.length} messages with: ${selector}`);
                break;
            }
        }
        
        if (messages.length === 0) {
            console.log('You.com: No messages found');
            return conversations;
        }
        
        let currentPair = { question: '', answer: '' };
        
        messages.forEach((message) => {
            const isUser = isUserMessage(message, 'you');
            const text = extractTextFromElement(message);
            
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
        });
        
        if (currentPair.question && currentPair.answer) {
            conversations.push({
                id: conversations.length + 1,
                question: currentPair.question,
                answer: currentPair.answer,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`You.com: Extracted ${conversations.length} conversations`);
        return conversations;
    }

    // Universal extraction method that works across platforms
    function extractUniversal() {
        console.log('🌍 Universal extraction starting...');
        const conversations = [];
        
        // Try all possible message selectors across all platforms
        const allSelectors = [
            // ChatGPT
            '[data-message-author-role]',
            '[data-testid^="conversation-turn"]',
            '.group.w-full',
            '.group',
            // Claude  
            '[data-testid*="message"]',
            'div[class*="font-user-message"]',
            'div[class*="font-claude-message"]',
            'div[class*="font-user"]',
            'div[class*="font-claude"]',
            '.prose',
            // Gemini
            'div[data-message-author-role]',
            'message-content',
            'model-response-text',
            '[data-testid*="user"]',
            '[data-testid*="model"]',
            // Generic
            '[class*="message"]',
            '[role="article"]',
            'article'
        ];
        
        let allMessages = [];
        let workingSelector = null;
        
        // Try each selector and collect all potential messages
        for (const selector of allSelectors) {
            const found = document.querySelectorAll(selector);
            if (found.length > 0) {
                console.log(`Universal: "${selector}": ${found.length} elements`);
                
                // Filter for elements with substantial text content
                const filtered = Array.from(found).filter(el => {
                    const text = extractTextFromElement(el);
                    return text.length > 10 && text.length < 10000; // Reasonable text length
                });
                
                if (filtered.length > allMessages.length) {
                    allMessages = filtered;
                    workingSelector = selector;
                }
            }
        }
        
        if (allMessages.length === 0) {
            console.log('Universal: No messages found with any selector');
            return conversations;
        }
        
        console.log(`Universal: Using ${workingSelector} with ${allMessages.length} messages`);
        
        // Universal message processing
        let currentPair = { question: '', answer: '' };
        let lastWasUser = false;
        
        for (let i = 0; i < allMessages.length; i++) {
            const message = allMessages[i];
            const text = extractTextFromElement(message);
            
            if (text.length < 5) continue; // Skip very short texts
            
            // Universal user detection
            const isUser = isUserMessageUniversal(message, text);
            
            console.log(`Universal: Message ${i}: isUser=${isUser}, textLength=${text.length}, text="${text.substring(0, 30)}..."`);
            
            if (isUser) {
                // Save previous pair if complete
                if (currentPair.question && currentPair.answer) {
                    conversations.push({
                        id: conversations.length + 1,
                        question: currentPair.question,
                        answer: currentPair.answer,
                        timestamp: new Date().toISOString(),
                        questionElement: currentPair.questionElement,
                        answerElement: currentPair.answerElement
                    });
                    console.log(`Universal: ✅ Saved pair ${conversations.length}`);
                }
                
                // Start new pair
                currentPair = { question: text, answer: '', questionElement: message };
                lastWasUser = true;
                console.log(`Universal: 👤 New question: "${text.substring(0, 30)}..."`);
                
            } else if (currentPair.question && lastWasUser) {
                // This should be an AI response
                currentPair.answer = text;
                currentPair.answerElement = message;
                lastWasUser = false;
                console.log(`Universal: 🤖 AI response: "${text.substring(0, 30)}..."`);
            }
        }
        
        // Save final pair
        if (currentPair.question && currentPair.answer) {
            conversations.push({
                id: conversations.length + 1,
                question: currentPair.question,
                answer: currentPair.answer,
                timestamp: new Date().toISOString(),
                questionElement: currentPair.questionElement,
                answerElement: currentPair.answerElement
            });
            console.log(`Universal: ✅ Saved final pair ${conversations.length}`);
        }
        
        console.log(`Universal: Extracted ${conversations.length} conversations`);
        return conversations;
    }
    
    // Universal user message detection
    function isUserMessageUniversal(element, text) {
        const className = element.className || '';
        const dataAttrs = Array.from(element.attributes).map(attr => attr.name + '=' + attr.value).join(' ');
        
        // Check for user indicators across all platforms
        const userIndicators = [
            // Data attributes
            dataAttrs.includes('data-message-author-role=user'),
            dataAttrs.includes('user'),
            dataAttrs.includes('human'),
            dataAttrs.includes('Human'),
            // Classes
            className.includes('user'),
            className.includes('human'),
            className.includes('Human'),
            className.includes('font-user'),
            // Element checks
            element.querySelector && element.querySelector('[data-message-author-role="user"]'),
            element.closest && element.closest('[data-testid*="user"]'),
            element.hasAttribute && element.hasAttribute('data-message-author-role') && element.getAttribute('data-message-author-role') === 'user'
        ];
        
        const isUser = userIndicators.some(indicator => indicator);
        
        // Additional heuristics based on text patterns
        if (!isUser && text.length < 200) {
            // Short messages are more likely to be user questions
            const questionPatterns = /^(what|how|why|when|where|can you|could you|please|help|explain)/i;
            if (questionPatterns.test(text.trim())) {
                return true;
            }
        }
        
        return isUser;
    }

    // Main extraction function with fallbacks
    function extractConversations() {
        const hostname = window.location.hostname;
        console.log('🌐 Extracting conversations from:', hostname);
        
        let conversations = [];
        
        // Try platform-specific extraction first
        if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
            conversations = extractChatGPT();
        } else if (hostname.includes('claude.ai')) {
            conversations = extractClaude();
        } else if (hostname.includes('bard.google.com') || hostname.includes('gemini.google.com')) {
            conversations = extractGemini();
        } else if (hostname.includes('you.com')) {
            conversations = extractYouCom();
        }
        
        // If platform-specific extraction failed, try universal method
        if (conversations.length === 0) {
            console.log('🔄 Platform-specific extraction failed, trying universal method...');
            conversations = extractUniversal();
        }
        
        if (conversations.length === 0) {
            console.log('🚫 No conversations found with any method');
        }
        
        return conversations;
    }
    
    // Inject export buttons next to tables in the AI chat interface
    function injectTableExportButtons() {
        console.log('🔍 Looking for AI-generated tables to add export buttons...');
        
        // Find HTML tables that are likely AI-generated (not part of the UI)
        const tables = document.querySelectorAll('table');
        
        tables.forEach((table, index) => {
            // Skip if export button already exists
            if (table.parentElement?.querySelector('.ai-table-export-btn')) {
                return;
            }
            
            // Only process tables with actual data (more than just headers)
            const rows = table.querySelectorAll('tr');
            if (rows.length < 2) return;
            
            // Skip tables that are likely part of the UI (navigation, controls, etc.)
            if (isUITable(table)) {
                return;
            }
            
            addExportButtonToTable(table, extractTableData(table), `table_${index + 1}`);
        });
        
        // Find table-like content in AI responses (look in AI message containers)
        const aiMessageContainers = findAIMessageContainers();
        
        aiMessageContainers.forEach((container, containerIndex) => {
            // Look for markdown tables, CSV-like content, TSV content in AI responses
            const textContent = container.textContent || '';
            
            // Find pre/code elements within AI responses that contain table data
            const codeElements = container.querySelectorAll('pre, code');
            codeElements.forEach((codeElement, index) => {
                // Skip if export button already exists
                if (codeElement.parentElement?.querySelector('.ai-table-export-btn')) {
                    return;
                }
                
                const text = codeElement.textContent || '';
                const tableData = extractTableFromText(text);
                
                if (tableData && tableData.length > 1) {
                    console.log(`✅ Found table in AI response ${containerIndex + 1}, element ${index + 1}:`, tableData.slice(0, 2));
                    addExportButtonToElement(codeElement, tableData, `ai_table_${containerIndex + 1}_${index + 1}`);
                }
            });
            
            // Look for markdown-style tables directly in text content (not in code blocks)
            const markdownTables = findMarkdownTablesInText(container);
            markdownTables.forEach((tableInfo, index) => {
                if (tableInfo.tableData && tableInfo.tableData.length > 1) {
                    console.log(`✅ Found markdown table in AI response ${containerIndex + 1}, table ${index + 1}:`, tableInfo.tableData.slice(0, 2));
                    addExportButtonToElement(tableInfo.element, tableInfo.tableData, `md_table_${containerIndex + 1}_${index + 1}`);
                }
            });
        });
    }
    
    // Check if a table is likely part of the UI (navigation, controls, etc.)
    function isUITable(table) {
        // Check for common UI table classes or attributes
        const uiClasses = ['nav', 'menu', 'sidebar', 'header', 'footer', 'toolbar', 'controls'];
        const tableClasses = table.className.toLowerCase();
        const tableId = table.id.toLowerCase();
        
        // Skip tables with UI-related classes or IDs
        if (uiClasses.some(cls => tableClasses.includes(cls) || tableId.includes(cls))) {
            return true;
        }
        
        // Skip very small tables (likely UI elements)
        const rows = table.querySelectorAll('tr');
        const cells = table.querySelectorAll('td, th');
        if (rows.length <= 1 || cells.length <= 2) {
            return true;
        }
        
        // Skip tables with buttons, links, or form elements (likely UI)
        const interactiveElements = table.querySelectorAll('button, a, input, select, textarea');
        if (interactiveElements.length > 0) {
            return true;
        }
        
        // Check if table is inside a known UI container
        const uiContainers = table.closest('.sidebar, .nav, .menu, .header, .footer, .toolbar');
        if (uiContainers) {
            return true;
        }
        
        return false;
    }
    
    // Find AI message containers based on current platform
    function findAIMessageContainers() {
        const hostname = window.location.hostname;
        let aiMessageSelectors = [];
        
        if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
            // ChatGPT selectors for AI messages
            aiMessageSelectors = [
                '[data-message-author-role="assistant"]',
                '.group.w-full.text-token-text-primary[data-testid]',
                '.markdown.prose'
            ];
        } else if (hostname.includes('claude.ai')) {
            // Claude selectors for AI messages
            aiMessageSelectors = [
                '[data-is-streaming="false"]',
                '.font-user-message',
                '.prose'
            ];
        } else if (hostname.includes('gemini.google.com') || hostname.includes('bard.google.com')) {
            // Gemini/Bard selectors
            aiMessageSelectors = [
                '[data-response-type="assistant"]',
                '.model-response-text',
                '.response-container'
            ];
        } else {
            // Generic selectors for other AI platforms
            aiMessageSelectors = [
                '.assistant-message',
                '.ai-response',
                '.bot-message',
                '.response',
                '.markdown',
                '.prose'
            ];
        }
        
        // Collect all matching elements
        const containers = [];
        aiMessageSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    // Only add if not already in containers
                    if (!containers.includes(el)) {
                        containers.push(el);
                    }
                });
            } catch (e) {
                // Ignore invalid selectors
            }
        });
        
        return containers;
    }
    
    // Find markdown tables directly in text content (not wrapped in code blocks)
    function findMarkdownTablesInText(container) {
        const tables = [];
        const textContent = container.textContent || '';
        
        // Look for markdown table patterns
        const markdownTableRegex = /(?:^|\n)((?:\|[^\n]*\|[\n\r]*)+)/gm;
        let match;
        
        while ((match = markdownTableRegex.exec(textContent)) !== null) {
            const tableText = match[1].trim();
            const tableData = parseMarkdownTableFromText(tableText);
            
            if (tableData && tableData.length > 1) {
                // Find the DOM element that contains this table
                const textNodes = getTextNodes(container);
                const containingElement = findElementContainingText(textNodes, tableText.substring(0, 50));
                
                if (containingElement) {
                    tables.push({
                        element: containingElement,
                        tableData: tableData,
                        text: tableText
                    });
                }
            }
        }
        
        return tables;
    }
    
    // Helper function to get all text nodes in an element
    function getTextNodes(element) {
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        return textNodes;
    }
    
    // Helper function to find element containing specific text
    function findElementContainingText(textNodes, searchText) {
        for (const node of textNodes) {
            if (node.textContent.includes(searchText)) {
                return node.parentElement;
            }
        }
        return null;
    }
    
    // Extract table data from text content (handles various formats)
    function extractTableFromText(text) {
        if (!text || text.trim().length === 0) return null;
        
        // HTML table in code block
        if (/<table[\s\S]*?<\/table>/i.test(text)) {
            const result = parseHTMLTableFromText(text);
            if (result && result.length > 1) return result;
        }
        
        // Markdown table (priority over other formats as it's explicit)
        if (/\|[\s\S]*?\|/m.test(text)) {
            const result = parseMarkdownTableFromText(text);
            if (result && result.length > 1 && result[0].length > 1) return result;
        }
        
        // TSV format (check before CSV as tabs are more explicit separators)
        if (text.includes('\t')) {
            const result = parseTSVFromText(text);
            if (result && result.length > 1 && result[0].length > 1) return result;
        }
        
        // CSV format (most common, check last to avoid false positives)
        if (text.includes(',')) {
            const result = parseCSVFromText(text);
            if (result && result.length > 1 && result[0].length > 1) return result;
        }
        
        // Simple space-separated tables (as last resort)
        const result = parseSpaceSeparatedTable(text);
        if (result && result.length > 1 && result[0].length > 1) return result;
        
        return null;
    }
    
    // Parse HTML table from text content
    function parseHTMLTableFromText(text) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const table = doc.querySelector('table');
        
        if (!table) return null;
        
        const rows = Array.from(table.querySelectorAll('tr'));
        return rows.map(row => 
            Array.from(row.querySelectorAll('td, th')).map(cell => 
                cell.textContent.trim()
            )
        ).filter(row => row.length > 0);
    }
    
    // Parse markdown table from text
    function parseMarkdownTableFromText(text) {
        const lines = text.split('\n').filter(line => line.includes('|'));
        return lines
            .filter(line => !line.match(/^\s*\|[\s\-\|:]+\|\s*$/)) // Skip separator lines
            .map(line => 
                line.split('|')
                    .map(cell => cell.trim())
                    .filter(cell => cell !== '')
            ).filter(row => row.length > 0);
    }
    
    // Parse CSV from text with better handling of quoted values
    function parseCSVFromText(text) {
        const lines = text.split('\n').filter(line => line.trim() && line.includes(','));
        
        // Check if this looks like a proper table (consistent column count)
        if (lines.length < 2) return null;
        
        const rows = lines.map(line => {
            // Simple CSV parser that handles quoted values
            const cells = [];
            let current = '';
            let inQuotes = false;
            let i = 0;
            
            while (i < line.length) {
                const char = line[i];
                
                if (char === '"' && !inQuotes) {
                    inQuotes = true;
                } else if (char === '"' && inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else if (char === '"' && inQuotes) {
                    inQuotes = false;
                } else if (char === ',' && !inQuotes) {
                    cells.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
                i++;
            }
            cells.push(current.trim());
            
            return cells.map(cell => cell.replace(/^"|"$/g, ''));
        });
        
        // Validate that it looks like a table (similar column counts)
        const firstRowLength = rows[0].length;
        const validRows = rows.filter(row => Math.abs(row.length - firstRowLength) <= 1);
        
        return validRows.length >= 2 ? validRows : null;
    }
    
    // Parse TSV from text
    function parseTSVFromText(text) {
        const lines = text.split('\n').filter(line => line.trim() && line.includes('\t'));
        
        if (lines.length < 2) return null;
        
        const rows = lines.map(line => line.split('\t').map(cell => cell.trim()));
        
        // Validate column consistency
        const firstRowLength = rows[0].length;
        const validRows = rows.filter(row => Math.abs(row.length - firstRowLength) <= 1);
        
        return validRows.length >= 2 && firstRowLength >= 2 ? validRows : null;
    }
    
    // Parse space-separated tables (for simple aligned tables)
    function parseSpaceSeparatedTable(text) {
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        
        if (lines.length < 2) return null;
        
        // Look for lines that have multiple "words" separated by multiple spaces
        const potentialTableLines = lines.filter(line => {
            // Must have at least 2 groups of 2+ spaces, indicating columns
            const spaceGroups = line.match(/\s{2,}/g);
            return spaceGroups && spaceGroups.length >= 1;
        });
        
        if (potentialTableLines.length < 2) return null;
        
        const rows = potentialTableLines.map(line => {
            // Split on multiple spaces (2 or more)
            return line.split(/\s{2,}/).map(cell => cell.trim()).filter(cell => cell.length > 0);
        });
        
        // Check for consistency in column count
        const avgColCount = rows.reduce((sum, row) => sum + row.length, 0) / rows.length;
        const validRows = rows.filter(row => Math.abs(row.length - avgColCount) <= 1);
        
        return validRows.length >= 2 && avgColCount >= 2 ? validRows : null;
    }
    
    // Add export button to a table element
    function addExportButtonToTable(table, tableData, filename) {
        const exportBtn = createExportButton(tableData, filename);
        
        // Insert button after the table
        if (table.parentElement) {
            table.parentElement.insertBefore(exportBtn, table.nextSibling);
            console.log(`✅ Added export button for table: ${filename}`);
        }
    }
    
    // Add export button to any element (like code blocks)
    function addExportButtonToElement(element, tableData, filename) {
        const exportBtn = createExportButton(tableData, filename);
        
        // Insert button after the element
        if (element.parentElement) {
            element.parentElement.insertBefore(exportBtn, element.nextSibling);
            console.log(`✅ Added export button for code block table: ${filename}`);
        }
    }
    
    // Create export button with consistent styling and functionality
    function createExportButton(tableData, filename) {
        const exportBtn = document.createElement('button');
        exportBtn.className = 'ai-table-export-btn';
        exportBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
            Export to Sheets
        `;
            
        // Style the button
        exportBtn.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin: 8px 0;
            padding: 6px 12px;
            background-color: #10b981;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            opacity: 0.8;
            position: relative;
            z-index: 1000;
        `;
        
        // Add hover effect
        exportBtn.addEventListener('mouseenter', () => {
            exportBtn.style.backgroundColor = '#059669';
            exportBtn.style.opacity = '1';
            exportBtn.style.transform = 'translateY(-1px)';
        });
        
        exportBtn.addEventListener('mouseleave', () => {
            exportBtn.style.backgroundColor = '#10b981';
            exportBtn.style.opacity = '0.8';
            exportBtn.style.transform = 'translateY(0)';
        });
        
        // Add click handler
        exportBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                if (!tableData || tableData.length === 0) {
                    alert('No table data to export');
                    return;
                }
                
                // Show loading state
                const originalText = exportBtn.innerHTML;
                exportBtn.innerHTML = `
                    <div style="width: 16px; height: 16px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    Exporting...
                `;
                exportBtn.style.pointerEvents = 'none';
                
                // Add spin animation if not exists
                if (!document.querySelector('#spin-animation')) {
                    const style = document.createElement('style');
                    style.id = 'spin-animation';
                    style.textContent = `
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                // Export as CSV
                await exportTableAsCSV(tableData, filename);
                
                // Show success state
                exportBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                    Exported!
                `;
                exportBtn.style.backgroundColor = '#059669';
                
                // Reset after 2 seconds
                setTimeout(() => {
                    exportBtn.innerHTML = originalText;
                    exportBtn.style.backgroundColor = '#10b981';
                    exportBtn.style.pointerEvents = 'auto';
                }, 2000);
                
            } catch (error) {
                console.error('Export failed:', error);
                
                // Show error state
                exportBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    Failed
                `;
                exportBtn.style.backgroundColor = '#dc2626';
                
                // Reset after 2 seconds
                setTimeout(() => {
                    exportBtn.innerHTML = originalText;
                    exportBtn.style.backgroundColor = '#10b981';
                    exportBtn.style.pointerEvents = 'auto';
                }, 2000);
            }
        });
        
        return exportBtn;
    }
    
    // Extract table data from DOM table element
    function extractTableData(table) {
        const rows = Array.from(table.querySelectorAll('tr'));
        return rows.map(row => 
            Array.from(row.querySelectorAll('td, th')).map(cell => 
                cell.textContent.trim()
            )
        ).filter(row => row.length > 0);
    }
    
    // Export table data as CSV file
    async function exportTableAsCSV(tableData, filename) {
        const csvContent = tableData.map(row => 
            row.map(cell => {
                // Escape quotes and wrap in quotes if contains comma
                const escaped = String(cell).replace(/"/g, '""');
                return escaped.includes(',') ? `"${escaped}"` : escaped;
            }).join(',')
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        // Show success notification
        showExportNotification('Table exported successfully!', 'success');
    }
    
    // Show export notification
    function showExportNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            background-color: ${type === 'success' ? '#10b981' : '#dc2626'};
            color: white;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            opacity: 0;
            transform: translateX(20px);
            transition: all 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Update conversations and send to iframe with retry mechanism
    function updateConversations(retryCount = 0) {
        const maxRetries = 3;
        const conversations = extractConversations();
        currentConversations = conversations;
        
        const iframe = document.querySelector('#ai-chat-navigator-extension iframe');
        console.log(`📤 Attempt ${retryCount + 1}: Sending ${conversations.length} conversations to iframe. Iframe found:`, !!iframe);
        
        if (!iframe) {
            console.log('❌ No iframe found');
            return;
        }

        if (!iframe.contentWindow) {
            console.log('❌ Iframe contentWindow not available');
            if (retryCount < maxRetries) {
                console.log(`🔄 Retrying in 1 second... (${retryCount + 1}/${maxRetries})`);
                setTimeout(() => updateConversations(retryCount + 1), 1000);
            }
            return;
        }
        
        try {
            // Ultra-safe data cleaning with multiple fallback strategies
            const cleanConversations = [];
            
            for (let i = 0; i < conversations.length; i++) {
                const conv = conversations[i];
                
                try {
                    // Extract only primitive values, no objects or DOM elements
                    let cleanQuestion = '';
                    let cleanAnswer = '';
                    let cleanId = i + 1;
                    let cleanTimestamp = new Date().toISOString();
                    
                    // Extra-safe text extraction
                    if (conv.question) {
                        cleanQuestion = String(conv.question);
                        // Remove any potential problematic characters
                        cleanQuestion = cleanQuestion
                            .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
                            .replace(/[\uFEFF\u200B-\u200D\u2060]/g, '') // Remove zero-width chars
                            .replace(/\uFFFD/g, '') // Remove replacement chars
                            .trim();
                    }
                    
                    if (conv.answer) {
                        cleanAnswer = String(conv.answer);
                        cleanAnswer = cleanAnswer
                            .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
                            .replace(/[\uFEFF\u200B-\u200D\u2060]/g, '')
                            .replace(/\uFFFD/g, '')
                            .trim();
                    }
                    
                    if (conv.id && typeof conv.id === 'number') {
                        cleanId = conv.id;
                    }
                    
                    if (conv.timestamp && typeof conv.timestamp === 'string') {
                        cleanTimestamp = conv.timestamp;
                    }
                    
                    // Only include conversations with valid Q&A
                    if (cleanQuestion.length > 0 && cleanAnswer.length > 0) {
                        const cleanConv = {
                            id: cleanId,
                            question: cleanQuestion,
                            answer: cleanAnswer,
                            timestamp: cleanTimestamp
                        };
                        
                        // Test serialization before adding
                        JSON.stringify(cleanConv);
                        cleanConversations.push(cleanConv);
                    }
                    
                } catch (convError) {
                    console.warn(`⚠️ Skipping conversation ${i} due to cleaning error:`, convError.message);
                    continue;
                }
            }

            if (cleanConversations.length === 0) {
                console.log('⚠️ No valid conversations after cleaning');
                return;
            }

            console.log(`✅ Cleaned ${cleanConversations.length} conversations successfully`);

            // Ultra-safe message sending with multiple error handling layers
            const messageData = {
                type: 'UPDATE_CONVERSATIONS',
                conversations: cleanConversations,
                timestamp: Date.now(),
                source: 'ai-chat-navigator'
            };
            
            // Final serialization test
            const serializedData = JSON.stringify(messageData);
            console.log(`📤 Sending ${serializedData.length} characters to iframe`);
            
            iframe.contentWindow.postMessage(messageData, '*');
            
            console.log('✅ Message sent successfully:', {
                conversations: conversations.length,
                timestamp: new Date().toLocaleTimeString()
            });
            
            // Wait for confirmation from iframe (handled by message listener)
            const confirmationTimeout = setTimeout(() => {
                if (retryCount < maxRetries) {
                    console.log('⚠️ No confirmation received, retrying...');
                    updateConversations(retryCount + 1);
                }
            }, 3000);
            
            // Clear timeout if confirmation is received
            window.pendingConfirmations = window.pendingConfirmations || new Map();
            window.pendingConfirmations.set(Date.now(), confirmationTimeout);
            
        } catch (error) {
            console.error('❌ Error sending message:', error);
            console.error('Error details:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });
            if (retryCount < maxRetries) {
                console.log(`🔄 Retrying in 2 seconds... (${retryCount + 1}/${maxRetries})`);
                setTimeout(() => updateConversations(retryCount + 1), 2000);
            }
        }
    }

    // Scroll to a specific conversation with enhanced navigation and smooth transitions
    function scrollToConversation(conversationId) {
        console.log('🎯 Attempting to scroll to conversation:', conversationId);
        const conversations = currentConversations;
        const conversation = conversations.find(c => c.id === conversationId);
        
        if (conversation && conversation.questionElement) {
            console.log('📍 Found conversation element, starting smooth transition...');
            
            // Get current scroll position for smooth transition
            const startPosition = window.pageYOffset;
            const elementPosition = conversation.questionElement.offsetTop;
            const offsetPosition = elementPosition - (window.innerHeight / 2) + (conversation.questionElement.offsetHeight / 2);
            
            // Smooth scroll animation
            const duration = 800; // 0.8 seconds
            let start = null;
            
            function smoothScrollAnimation(currentTime) {
                if (start === null) start = currentTime;
                const timeElapsed = currentTime - start;
                const progress = Math.min(timeElapsed / duration, 1);
                
                // Easing function for smooth acceleration/deceleration
                const ease = progress < 0.5 
                    ? 2 * progress * progress 
                    : -1 + (4 - 2 * progress) * progress;
                
                window.scrollTo(0, startPosition + (offsetPosition - startPosition) * ease);
                
                if (progress < 1) {
                    requestAnimationFrame(smoothScrollAnimation);
                } else {
                    // Animation complete - start highlighting
                    startHighlightAnimation();
                }
            }
            
            function startHighlightAnimation() {
                const element = conversation.questionElement;
                const originalStyle = {
                    backgroundColor: element.style.backgroundColor,
                    transition: element.style.transition,
                    boxShadow: element.style.boxShadow,
                    transform: element.style.transform,
                    border: element.style.border
                };
                
                // Dramatic highlight animation with scaling and pulsing
                element.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                element.style.backgroundColor = '#fff3cd';
                element.style.boxShadow = '0 0 30px rgba(255, 193, 7, 0.7), 0 0 60px rgba(255, 193, 7, 0.3)';
                element.style.transform = 'scale(1.02)';
                element.style.border = '2px solid #fbbf24';
                
                // Pulse effect
                setTimeout(() => {
                    element.style.transform = 'scale(1.01)';
                    element.style.boxShadow = '0 0 20px rgba(255, 193, 7, 0.5)';
                }, 300);
                
                setTimeout(() => {
                    element.style.transform = 'scale(1.02)';
                    element.style.boxShadow = '0 0 25px rgba(255, 193, 7, 0.6)';
                }, 600);
                
                // Also highlight the answer with coordinated animation
                if (conversation.answerElement) {
                    setTimeout(() => {
                        const answerElement = conversation.answerElement;
                        const originalAnswerStyle = {
                            backgroundColor: answerElement.style.backgroundColor,
                            transition: answerElement.style.transition,
                            boxShadow: answerElement.style.boxShadow,
                            transform: answerElement.style.transform
                        };
                        
                        answerElement.style.transition = 'all 0.5s ease-in-out';
                        answerElement.style.backgroundColor = '#e7f3ff';
                        answerElement.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.3)';
                        answerElement.style.transform = 'scale(1.005)';
                        
                        setTimeout(() => {
                            answerElement.style.backgroundColor = originalAnswerStyle.backgroundColor;
                            answerElement.style.transition = originalAnswerStyle.transition;
                            answerElement.style.boxShadow = originalAnswerStyle.boxShadow;
                            answerElement.style.transform = originalAnswerStyle.transform;
                        }, 2500);
                    }, 400);
                }
                
                // Remove highlight after delay with smooth fade out
                setTimeout(() => {
                    element.style.transition = 'all 0.8s ease-out';
                    element.style.backgroundColor = originalStyle.backgroundColor;
                    element.style.boxShadow = originalStyle.boxShadow;
                    element.style.transform = originalStyle.transform;
                    element.style.border = originalStyle.border;
                    
                    // Final cleanup
                    setTimeout(() => {
                        element.style.transition = originalStyle.transition;
                    }, 800);
                }, 2000);
            }
            
            // Start the smooth scroll animation
            requestAnimationFrame(smoothScrollAnimation);
            
            // Try to focus the element for accessibility
            setTimeout(() => {
                try {
                    if (conversation.questionElement.tabIndex < 0) {
                        conversation.questionElement.tabIndex = -1;
                    }
                    conversation.questionElement.focus();
                } catch (error) {
                    console.log('Could not focus element:', error.message);
                }
            }, duration + 100);
            
            console.log('✅ Started smooth scroll transition');
        } else {
            console.log('❌ Could not find conversation element for ID:', conversationId);
            
            // Fallback: try to re-extract conversations and find the element
            console.log('🔄 Attempting to re-extract conversations...');
            const freshConversations = extractConversations();
            const freshConversation = freshConversations.find(c => c.id === conversationId);
            
            if (freshConversation && freshConversation.questionElement) {
                console.log('✅ Found conversation in fresh extraction, using fallback scroll...');
                freshConversation.questionElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            } else {
                console.log('❌ Conversation not found even after re-extraction');
            }
        }
    }
    
    // Create and inject the extension UI
    function injectNavigator() {
        if (document.querySelector('#ai-chat-navigator-extension')) {
            return;
        }
        
        // Create container
        const container = document.createElement('div');
        container.id = 'ai-chat-navigator-extension';
        container.style.cssText = `
            position: fixed;
            top: 0;
            right: 0;
            width: 400px;
            height: 100%;
            background: white;
            border-left: 1px solid #e5e7eb;
            box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.innerHTML = '📋';
        toggleButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: #4f46e5;
            color: white;
            border: none;
            border-radius: 25px;
            font-size: 20px;
            cursor: pointer;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        
        // Toggle functionality
        let isOpen = false;
        toggleButton.addEventListener('click', () => {
            isOpen = !isOpen;
            container.style.transform = isOpen ? 'translateX(0)' : 'translateX(100%)';
            toggleButton.style.right = isOpen ? '420px' : '20px';
        });
        
        // Create iframe for React app
        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
        `;
        iframe.src = chrome.runtime.getURL('index.html');
        
        container.appendChild(iframe);
        document.body.appendChild(container);
        document.body.appendChild(toggleButton);
        
        // Send conversations when iframe loads
        iframe.onload = () => {
            console.log('📱 Iframe loaded, sending conversations...');
            
            setTimeout(() => {
                console.log('⏰ Delayed conversation update starting...');
                updateConversations();
            }, 1000); // Increased delay to ensure app is ready
            
            // Listen for messages from iframe (only set up once)
            if (!window.aiChatNavigatorMessageListener) {
                window.aiChatNavigatorMessageListener = (event) => {
                    console.log('📨 Content script received message:', event.data);
                    
                    if (event.data.type === 'CONVERSATIONS_RECEIVED') {
                        console.log('✅ Iframe confirmed receiving conversations:', event.data.count);
                        
                        // Clear any pending confirmation timeouts
                        if (window.pendingConfirmations) {
                            window.pendingConfirmations.forEach((timeout, timestamp) => {
                                clearTimeout(timeout);
                            });
                            window.pendingConfirmations.clear();
                        }
                    } else if (event.data.type === 'SCROLL_TO_CONVERSATION') {
                        console.log('🖱️ Scroll to conversation requested:', event.data.conversationId);
                        scrollToConversation(event.data.conversationId);
                    } else if (event.data.type === 'GET_PAGE_CONVERSATIONS') {
                        console.log('📄 Page conversations requested');
                        // Send current page conversations to iframe
                        const conversations = extractConversations();
                        const iframe = document.querySelector('#ai-chat-navigator-extension iframe');
                        if (iframe && iframe.contentWindow) {
                            iframe.contentWindow.postMessage({
                                type: 'PAGE_CONVERSATIONS_RESPONSE',
                                conversations: conversations.map(conv => ({
                                    question: conv.question,
                                    answer: conv.answer,
                                    timestamp: conv.timestamp
                                }))
                            }, '*');
                            console.log(`📄 Sent ${conversations.length} conversations to iframe`);
                        }
                    } else if (event.data === 'close') {
                        console.log('❌ Close drawer requested');
                        const container = document.querySelector('#ai-chat-navigator-extension');
                        const toggleBtns = document.querySelectorAll('button');
                        let toggleBtn = null;
                        
                        // Find the toggle button by looking for the one with the clipboard emoji
                        for (const btn of toggleBtns) {
                            if (btn.innerHTML === '📋' && btn.style.position === 'fixed') {
                                toggleBtn = btn;
                                break;
                            }
                        }
                        
                        if (container && toggleBtn) {
                            container.style.transform = 'translateX(100%)';
                            toggleBtn.style.right = '20px';
                            console.log('✅ Drawer closed');
                        }
                    }
                };
                
                window.addEventListener('message', window.aiChatNavigatorMessageListener);
                console.log('📡 Message listener set up');
            }
        };
    }
    
    // Pre-load existing conversations on page load
    function preloadExistingConversations() {
        console.log('🔄 Pre-loading existing conversations...');
        
        // Multiple attempts to ensure page is fully loaded
        const attemptExtraction = (attemptNumber) => {
            console.log(`📖 Pre-load attempt ${attemptNumber}/5`);
            const conversations = extractConversations();
            
            if (conversations.length > 0) {
                console.log(`✅ Pre-loaded ${conversations.length} existing conversations`);
                currentConversations = conversations;
                
                // Send to iframe if it's ready
                const iframe = document.querySelector('#ai-chat-navigator-extension iframe');
                if (iframe && iframe.contentWindow) {
                    updateConversations();
                }
                return true;
            } else if (attemptNumber < 5) {
                // Try again with increasing delays
                const delay = attemptNumber * 1000;
                setTimeout(() => attemptExtraction(attemptNumber + 1), delay);
            } else {
                console.log('📭 No existing conversations found after 5 attempts');
            }
            return false;
        };
        
        // Start immediate extraction for already loaded content
        if (document.readyState === 'complete') {
            attemptExtraction(1);
        } else {
            // Wait for page to load completely
            window.addEventListener('load', () => {
                setTimeout(() => attemptExtraction(1), 500);
            });
            
            // Also try when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => attemptExtraction(1), 1000);
                });
            }
        }
    }

    // Add quick-add buttons to conversations on the page
    function addQuickAddButtons() {
        console.log('➕ Adding quick-add buttons to conversations...');
        
        // Find conversation elements that don't already have buttons
        const conversations = extractConversations();
        
        conversations.forEach((conv, index) => {
            if (conv.questionElement && !conv.questionElement.querySelector('.quick-add-btn')) {
                const addBtn = document.createElement('button');
                addBtn.className = 'quick-add-btn';
                addBtn.innerHTML = '➕';
                addBtn.title = 'Add to drawer';
                
                addBtn.style.cssText = `
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 24px;
                    height: 24px;
                    background: #4f46e5;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    font-size: 12px;
                    cursor: pointer;
                    opacity: 0.7;
                    transition: all 0.2s ease;
                    z-index: 1001;
                    display: none;
                `;
                
                // Show button on hover
                const container = conv.questionElement.closest('[data-message-author-role], [data-testid*="conversation-turn"], .group') || conv.questionElement;
                container.style.position = 'relative';
                
                container.addEventListener('mouseenter', () => {
                    addBtn.style.display = 'flex';
                    addBtn.style.alignItems = 'center';
                    addBtn.style.justifyContent = 'center';
                });
                
                container.addEventListener('mouseleave', () => {
                    addBtn.style.display = 'none';
                });
                
                addBtn.addEventListener('mouseenter', () => {
                    addBtn.style.opacity = '1';
                    addBtn.style.transform = 'scale(1.1)';
                });
                
                addBtn.addEventListener('mouseleave', () => {
                    addBtn.style.opacity = '0.7';
                    addBtn.style.transform = 'scale(1)';
                });
                
                // Click handler
                addBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Send to iframe to add to drawer
                    const iframe = document.querySelector('#ai-chat-navigator-extension iframe');
                    if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.postMessage({
                            type: 'ADD_CONVERSATION_TO_DRAWER',
                            conversation: {
                                id: conv.id || `quick_${Date.now()}`,
                                question: conv.question,
                                answer: conv.answer,
                                timestamp: conv.timestamp || new Date().toISOString()
                            }
                        }, '*');
                    }
                    
                    // Visual feedback
                    addBtn.innerHTML = '✓';
                    addBtn.style.backgroundColor = '#10b981';
                    setTimeout(() => {
                        addBtn.innerHTML = '➕';
                        addBtn.style.backgroundColor = '#4f46e5';
                    }, 1500);
                });
                
                container.appendChild(addBtn);
                console.log(`✅ Added quick-add button to conversation ${index + 1}`);
            }
        });
    }

    // Start monitoring for conversation changes with enhanced pre-loading
    function startMonitoring() {
        // Pre-load existing conversations first
        preloadExistingConversations();
        
        // Continue with regular monitoring
        setTimeout(() => {
            updateConversations();
            // Add quick-add buttons after conversations are loaded
            setTimeout(() => addQuickAddButtons(), 1000);
        }, 3000); // Slightly longer initial delay to allow pre-loading
        
        // Monitor for changes with enhanced detection for all platforms
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            let shouldCheckTables = false;
            let changeDescription = '';
            
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if any added nodes might be new messages or tables
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check for tables
                            if (node.matches && node.matches('table') || 
                                node.querySelector && node.querySelector('table')) {
                                shouldCheckTables = true;
                            }
                            
                            // Comprehensive message pattern detection for all platforms
                            const hasMessagePattern = (
                                node.matches && (
                                    // ChatGPT patterns
                                    node.matches('[data-message-author-role]') ||
                                    node.matches('[data-testid*="conversation-turn"]') ||
                                    node.matches('main .group.w-full') ||
                                    node.matches('main .group') ||
                                    // Claude patterns
                                    node.matches('[data-testid*="message"]') ||
                                    node.matches('div[class*="font-user"]') ||
                                    node.matches('div[class*="font-claude"]') ||
                                    node.matches('.prose') ||
                                    // Gemini patterns  
                                    node.matches('div[data-message-author-role]') ||
                                    node.matches('message-content') ||
                                    node.matches('model-response-text') ||
                                    // Generic patterns
                                    node.matches('[class*="message"]') ||
                                    node.matches('[role="article"]')
                                )
                            ) || (
                                node.querySelector && (
                                    // ChatGPT patterns
                                    node.querySelector('[data-message-author-role]') ||
                                    node.querySelector('[data-testid*="conversation-turn"]') ||
                                    node.querySelector('main .group.w-full') ||
                                    node.querySelector('main .group') ||
                                    // Claude patterns
                                    node.querySelector('[data-testid*="message"]') ||
                                    node.querySelector('div[class*="font-user"]') ||
                                    node.querySelector('div[class*="font-claude"]') ||
                                    node.querySelector('.prose') ||
                                    // Gemini patterns
                                    node.querySelector('div[data-message-author-role]') ||
                                    node.querySelector('message-content') ||
                                    node.querySelector('model-response-text') ||
                                    // Generic patterns
                                    node.querySelector('[class*="message"]') ||
                                    node.querySelector('[role="article"]')
                                )
                            );
                            
                            if (hasMessagePattern) {
                                shouldUpdate = true;
                                changeDescription = `New message detected: ${node.tagName} with class "${node.className?.substring(0, 50)}"`;
                                // Also check for tables in new messages
                                shouldCheckTables = true;
                                break;
                            }
                        }
                    }
                    if (shouldUpdate) break;
                }
            }
            
            // Handle table monitoring
            if (shouldCheckTables) {
                clearTimeout(window.tableCheckTimer);
                window.tableCheckTimer = setTimeout(() => {
                    console.log('📊 Checking for new tables...');
                    injectTableExportButtons();
                }, 1000);
            }
            
            if (shouldUpdate) {
                // Debounce updates to avoid excessive calls
                clearTimeout(window.conversationUpdateTimer);
                window.conversationUpdateTimer = setTimeout(() => {
                    console.log('🔄 Detected conversation changes:', changeDescription);
                    updateConversations();
                    // Also check for tables and add buttons after conversation updates
                    setTimeout(() => {
                        injectTableExportButtons();
                        addQuickAddButtons();
                    }, 500);
                }, 1500); // Slightly longer delay to ensure content is fully rendered
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false
        });
        
        // Periodic check with longer interval
        setInterval(() => {
            const currentCount = currentConversations.length;
            updateConversations();
            
            // Also periodically check for tables and add buttons
            injectTableExportButtons();
            addQuickAddButtons();
            
            // Log only if count changed
            setTimeout(() => {
                if (currentConversations.length !== currentCount) {
                    console.log(`📊 Periodic check: ${currentCount} → ${currentConversations.length} conversations`);
                }
            }, 500);
        }, 10000); // Reduced frequency to 10 seconds
    }
    
    // Initialize everything with enhanced loading
    function initialize() {
        console.log('🚀 AI Chat Navigator: Initializing on', window.location.hostname);
        
        // Inject UI first
        setTimeout(() => {
            injectNavigator();
            
            // Start monitoring after UI is ready
            setTimeout(() => {
                startMonitoring();
                // Initial table detection
                setTimeout(() => {
                    console.log('🔄 Running initial table detection...');
                    injectTableExportButtons();
                }, 2000);
            }, 500);
        }, 1000);
        
        // Also try pre-loading conversations immediately if page is already loaded
        if (document.readyState === 'complete') {
            setTimeout(() => {
                console.log('🔄 Page already complete, attempting immediate pre-load...');
                preloadExistingConversations();
            }, 2000);
        }
    }
    
    // Start when page is ready with multiple entry points
    if (document.readyState === 'loading') {
        console.log('📄 DOM still loading, waiting...');
        document.addEventListener('DOMContentLoaded', initialize);
    } else if (document.readyState === 'interactive') {
        console.log('📄 DOM interactive, initializing...');
        initialize();
    } else {
        console.log('📄 DOM complete, initializing immediately...');
        initialize();
    }
    
    // Auto-run aggressive debugging after page loads to understand what text is available
    setTimeout(() => {
        if (window.findAllTextElements) {
            console.log('🔍 AUTO-RUNNING AGGRESSIVE DEBUG:');
            window.findAllTextElements();
        }
        
        if (window.debugAIChatNavigator) {
            console.log('🔍 AUTO-RUNNING STANDARD DEBUG:');
            window.debugAIChatNavigator();
        }
    }, 5000); // Wait 5 seconds for page to fully load
    
    // Additional safety net for SPA navigation
    let lastUrl = window.location.href;
    setInterval(() => {
        if (window.location.href !== lastUrl) {
            console.log('🔄 URL changed, re-initializing...');
            lastUrl = window.location.href;
            
            // Clear any existing timers
            if (window.conversationUpdateTimer) {
                clearTimeout(window.conversationUpdateTimer);
            }
            
            // Re-initialize after a short delay
            setTimeout(initialize, 2000);
        }
    }, 3000);
    
    // Aggressive debugging function to find ANY text content
    window.findAllTextElements = function() {
        console.log('🔍 AGGRESSIVE DEBUG: Finding all text elements...');
        
        // Get all elements with text content
        const allElements = document.querySelectorAll('*');
        const textElements = [];
        
        for (let el of allElements) {
            const text = (el.textContent || '').trim();
            if (text.length > 20 && text.length < 2000) {
                // Skip if text is the same as parent (avoid duplicates)
                const parentText = (el.parentElement?.textContent || '').trim();
                if (text !== parentText || !el.parentElement) {
                    textElements.push({
                        element: el,
                        text: text,
                        tagName: el.tagName,
                        className: el.className,
                        id: el.id,
                        attributes: Array.from(el.attributes).map(a => `${a.name}="${a.value}"`).join(' ')
                    });
                }
            }
        }
        
        console.log(`Found ${textElements.length} elements with substantial text`);
        
        // Group by likely patterns
        const userLike = textElements.filter(el => 
            el.className.includes('user') || 
            el.attributes.includes('user') ||
            el.text.match(/^(what|how|why|can you|please|help me)/i)
        );
        
        const aiLike = textElements.filter(el => 
            el.text.length > 100 && 
            !el.className.includes('user') &&
            !el.attributes.includes('user')
        );
        
        console.log(`Potentially user messages: ${userLike.length}`);
        userLike.slice(0, 3).forEach((el, i) => {
            console.log(`User ${i}:`, el.text.substring(0, 100), el);
        });
        
        console.log(`Potentially AI messages: ${aiLike.length}`);
        aiLike.slice(0, 3).forEach((el, i) => {
            console.log(`AI ${i}:`, el.text.substring(0, 100), el);
        });
        
        return { all: textElements, user: userLike, ai: aiLike };
    };

    // ChatGPT-specific debugging function
    window.debugChatGPTExtraction = function() {
        console.log('🔍 ChatGPT Extraction Debug:');
        console.log('Current URL:', window.location.href);
        
        // Check for data-message-author-role elements
        const roleElements = document.querySelectorAll('[data-message-author-role]');
        console.log(`Found ${roleElements.length} elements with data-message-author-role:`);
        Array.from(roleElements).slice(0, 5).forEach((el, i) => {
            const role = el.getAttribute('data-message-author-role');
            const text = el.textContent?.trim().substring(0, 100) || '';
            console.log(`  ${i}: role=${role}, text="${text}..."`);
        });
        
        // Check for conversation turn elements
        const turnElements = document.querySelectorAll('[data-testid*="conversation-turn"]');
        console.log(`Found ${turnElements.length} conversation turn elements:`);
        Array.from(turnElements).slice(0, 3).forEach((el, i) => {
            const text = el.textContent?.trim().substring(0, 100) || '';
            console.log(`  ${i}: text="${text}..."`);
        });
        
        // Check navigation content detection
        const allText = Array.from(document.querySelectorAll('*')).map(el => {
            const text = el.textContent?.trim() || '';
            if (text.length > 5 && text.length < 200) {
                return { element: el, text, isNav: isNavigationContent(text) };
            }
        }).filter(Boolean);
        
        const navItems = allText.filter(item => item.isNav);
        console.log(`Navigation items detected: ${navItems.length}`);
        navItems.slice(0, 10).forEach((item, i) => {
            console.log(`  ${i}: "${item.text.substring(0, 50)}..."`);
        });
        
        // Test extraction methods
        console.log('Testing extraction methods:');
        
        // Method 1: data-message-author-role
        if (roleElements.length > 0) {
            const result1 = extractFromDataMessageRole(Array.from(roleElements));
            console.log(`Method 1 (data-message-author-role): ${result1.length} conversations`);
        }
        
        // Method 2: conversation turns
        if (turnElements.length > 0) {
            const result2 = extractFromConversationTurns(Array.from(turnElements));
            console.log(`Method 2 (conversation turns): ${result2.length} conversations`);
        }
        
        // Method 3: fallback
        const result3 = extractChatGPTFallback();
        console.log(`Method 3 (fallback): ${result3.length} conversations`);
        
        return {
            roleElements: roleElements.length,
            turnElements: turnElements.length,
            navigationItems: navItems.length,
            url: window.location.href
        };
    };

    // Debug function for testing - available in console as window.debugAIChatNavigator()
    window.debugAIChatNavigator = function() {
        console.log('🔍 AI Chat Navigator Debug Info:');
        console.log('Current URL:', window.location.href);
        console.log('Extension container:', !!document.querySelector('#ai-chat-navigator-extension'));
        console.log('Current conversations:', currentConversations.length);
        
        // Test extraction with detailed debugging
        console.log('Testing extraction...');
        const testConversations = extractConversations();
        console.log('Fresh extraction result:', testConversations.length, 'conversations');
        
        if (testConversations.length > 0) {
            testConversations.forEach((conv, idx) => {
                console.log(`Conversation ${idx + 1}:`, {
                    id: conv.id,
                    question: conv.question.substring(0, 50) + '...',
                    answer: conv.answer.substring(0, 50) + '...',
                    hasElements: !!(conv.questionElement && conv.answerElement)
                });
            });
        } else {
            // Deep debugging for failed extractions
            console.log('🔍 Deep debugging - no conversations found');
            
            // Test selectors for current site
            const hostname = window.location.hostname;
            if (hostname.includes('chatgpt.com')) {
                console.log('Testing ChatGPT selectors:');
                const selectors = [
                    '[data-message-author-role]',
                    '[data-testid^="conversation-turn"]',
                    '[data-testid*="conversation-turn"]',
                    '.group.w-full.text-token-text-primary',
                    '.group.w-full',
                    '.group'
                ];
                
                selectors.forEach(sel => {
                    const elements = document.querySelectorAll(sel);
                    console.log(`"${sel}": ${elements.length} elements`);
                    if (elements.length > 0 && elements.length < 10) {
                        Array.from(elements).slice(0, 3).forEach((el, i) => {
                            console.log(`  ${i}: "${el.textContent?.substring(0, 100)}..."`, el);
                        });
                    }
                });
            } else if (hostname.includes('claude.ai')) {
                console.log('Testing Claude selectors:');
                const selectors = [
                    '[data-testid*="message"]',
                    'div[class*="font-user"]',
                    'div[class*="font-claude"]',
                    '.prose',
                    'div[class*="message"]'
                ];
                
                selectors.forEach(sel => {
                    const elements = document.querySelectorAll(sel);
                    console.log(`"${sel}": ${elements.length} elements`);
                    if (elements.length > 0 && elements.length < 20) {
                        Array.from(elements).slice(0, 3).forEach((el, i) => {
                            console.log(`  ${i}: "${el.textContent?.substring(0, 100)}..."`, el);
                        });
                    }
                });
            } else if (hostname.includes('gemini.google.com')) {
                console.log('Testing Gemini selectors:');
                const selectors = [
                    '[data-testid*="message"]',
                    '[role="presentation"]',
                    '[class*="user"]',
                    '[class*="model-response"]',
                    '.message'
                ];
                
                selectors.forEach(sel => {
                    const elements = document.querySelectorAll(sel);
                    console.log(`"${sel}": ${elements.length} elements`);
                    if (elements.length > 0 && elements.length < 20) {
                        Array.from(elements).slice(0, 3).forEach((el, i) => {
                            console.log(`  ${i}: "${el.textContent?.substring(0, 100)}..."`, el);
                        });
                    }
                });
            }
        }
        
        // Test iframe communication
        const iframe = document.querySelector('#ai-chat-navigator-extension iframe');
        console.log('Iframe found:', !!iframe);
        if (iframe) {
            console.log('Iframe contentWindow:', !!iframe.contentWindow);
            console.log('Iframe src:', iframe.src);
        }
        
        return {
            conversations: testConversations,
            currentCount: currentConversations.length,
            hasIframe: !!iframe,
            url: window.location.href
        };
    };

    // Manual refresh function for users
    window.refreshAIChatNavigator = function() {
        console.log('🔄 Manual refresh triggered...');
        updateConversations();
        console.log('✅ Refresh completed');
    };
    
})();