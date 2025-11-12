import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from './types';
import { getAdvice, getSuggestedQuestions } from './services/geminiService';
import { CATEGORIES } from './constants';

// --- Helper Components (defined outside App to prevent re-creation on re-renders) ---

interface SidebarProps {
  onCategorySelect: (prompt: string, isNewConversation: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCategorySelect, isMobileMenuOpen, setIsMobileMenuOpen }) => (
  <aside className={`bg-slate-800 text-white p-6 fixed md:relative h-full w-64 md:w-72 transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-30 flex flex-col justify-between`}>
    <div>
        <div className="flex justify-between items-center mb-10">
            <a href="#home" className="text-3xl font-bold text-sky-400">مساعدك الذكي</a>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        <nav>
        <p className="px-3 text-sm font-semibold text-slate-400 mb-2">ابدأ محادثة جديدة</p>
          <ul>
            {CATEGORIES.map((category) => (
              <li key={category.name} className="mb-2">
                <button
                  onClick={() => {
                    onCategorySelect(category.prompt, true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-right flex items-center p-3 rounded-lg hover:bg-slate-700 transition-colors duration-200"
                >
                  <span className="text-sky-400 ml-4">{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
    </div>
    <nav>
        <ul>
             <li className="mb-2">
                <a
                  href="#privacy"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-right flex items-center p-3 rounded-lg hover:bg-slate-700 transition-colors duration-200"
                >
                  <span className="text-sky-400 ml-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </span>
                  <span>سياسة الخصوصية</span>
                </a>
            </li>
        </ul>
    </nav>
  </aside>
);


interface MessageProps {
    message: ChatMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
    const isModel = message.role === 'model';
    return (
        <div className={`flex items-start gap-4 my-4 ${isModel ? '' : 'flex-row-reverse'}`}>
            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isModel ? 'bg-slate-700' : 'bg-sky-500'}`}>
                {isModel ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                )}
            </div>
            <div className={`p-4 rounded-lg max-w-xl ${isModel ? 'bg-slate-200 text-slate-800' : 'bg-sky-100 text-slate-800'}`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
        </div>
    );
};

interface ChatWindowProps {
    messages: ChatMessage[];
    isLoading: boolean;
    suggestedQuestions: string[];
    onSendMessage: (message: string, isNewConversation: boolean) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, suggestedQuestions, onSendMessage }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    return (
        <div className="flex-1 p-6 overflow-y-auto">
            {messages.length === 0 && !isLoading ? (
                <div className="text-center text-slate-500 h-full flex flex-col justify-center items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    <h2 className="text-2xl font-semibold">مرحباً بك في مساعدك الذكي</h2>
                    <p className="mt-4 mb-6">اختر أحد المواضيع من القائمة للبدء، أو اكتب سؤالك في الأسفل.</p>
                     <div className="flex flex-wrap justify-center gap-3">
                        {CATEGORIES.slice(1, 4).map(cat => (
                            <button
                                key={cat.name}
                                onClick={() => onSendMessage(cat.prompt, true)}
                                className="bg-slate-200 text-slate-700 px-4 py-2 rounded-full hover:bg-slate-300 transition-colors"
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                messages.map((msg, index) => <Message key={index} message={msg} />)
            )}
            {isLoading && (
                <div className="flex items-start gap-4 my-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-200 text-slate-800 flex items-center">
                        <span className="animate-pulse">يفكر...</span>
                    </div>
                </div>
            )}
            {!isLoading && suggestedQuestions.length > 0 && messages.length > 0 && (
                 <div className="flex flex-wrap justify-start gap-2 mt-4 ml-14">
                    {suggestedQuestions.map((q, i) => (
                        <button
                            key={i}
                            onClick={() => onSendMessage(q, false)}
                            className="bg-sky-100 text-sky-800 text-sm px-3 py-1.5 rounded-full hover:bg-sky-200 transition-colors animate-fade-in"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            )}
            <div ref={scrollRef} />
        </div>
    );
};


interface MessageInputProps {
    onSendMessage: (message: string, isNewConversation: boolean) => void;
    isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim(), false);
            setInput('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    return (
        <div className="p-6 bg-white border-t border-slate-200">
            <form onSubmit={handleSubmit} className="flex items-center gap-4 bg-slate-100 rounded-xl p-2">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب سؤالك أو استفسارك هنا..."
                    className="flex-1 bg-transparent p-2 resize-none focus:outline-none max-h-40"
                    rows={1}
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="bg-sky-500 text-white rounded-lg p-3 hover:bg-sky-600 disabled:bg-sky-300 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

// --- Main App Component ---

export default function App() {
  const [page, setPage] = useState(window.location.hash.substring(1) || 'home');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  useEffect(() => {
    const handleHashChange = () => {
      const newPage = window.location.hash.substring(1) || 'home';
      setPage(newPage);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);


  const handleSendMessage = useCallback(async (message: string, isNewConversation: boolean) => {
    // Switch to the chat page if a message is sent
    if (window.location.hash !== '#home' && window.location.hash !== '') {
        window.location.hash = 'home';
    }

    setSuggestedQuestions([]);
    setIsLoading(true);
    setMessages(prev => {
        const newMessages = isNewConversation ? [] : prev;
        return [...newMessages, { role: 'user', content: message }];
    });

    const aiResponse = await getAdvice(message);

    setMessages(prev => [...prev, { role: 'model', content: aiResponse }]);
    setIsLoading(false);

    if (!aiResponse.startsWith("عفوًا، حدث خطأ")) {
      const suggestions = await getSuggestedQuestions(message, aiResponse);
      setSuggestedQuestions(suggestions);
    }
  }, []);
  
  const renderPage = () => {
    switch (page) {
      case 'privacy':
        return (
          <main className="flex-1 flex flex-col h-full relative">
            <header className="md:hidden p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                <h1 className="text-xl font-bold text-sky-500">سياسة الخصوصية</h1>
                <button onClick={() => setIsMobileMenuOpen(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </header>
            <div className="p-6 md:p-10 overflow-y-auto bg-slate-50 flex-1">
                <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
                    <h1 className="text-3xl font-bold text-slate-800 mb-6 border-b pb-4">سياسة الخصوصية وحقوق المستخدم</h1>
                    <div className="space-y-4 text-lg text-slate-700">
                        <p>نحن في "مساعدك الذكي" نولي أهمية قصوى لخصوصيتك وأمان بياناتك. نلتزم بتوفير تجربة آمنة وموثوقة لجميع مستخدمينا. توضح هذه الصفحة حقوقك وكيفية تعاملنا مع بياناتك.</p>
                        <h2 className="text-2xl font-semibold text-sky-600 pt-4">خصوصية المحادثات</h2>
                        <p><strong>جميع محادثاتك مع "مساعدك الذكي" خاصة ومحفوظة بشكل آمن.</strong> لا يمكن لأي شخص آخر الاطلاع على محتوى محادثاتك. يتم استخدام هذه المحادثات فقط لغرض تحسين جودة الخدمة المقدمة لك وتخصيص تجربتك، ولا تتم مشاركتها مع أي طرف ثالث.</p>
                        <h2 className="text-2xl font-semibold text-sky-600 pt-4">أمان البيانات</h2>
                        <p>نستخدم أحدث تقنيات التشفير لحماية بياناتك أثناء نقلها وتخزينها. يتم التعامل مع جميع المعلومات بسرية تامة وفقًا لأعلى معايير الأمان العالمية.</p>
                        <h2 className="text-2xl font-semibold text-sky-600 pt-4">حقوقك</h2>
                        <ul className="list-disc list-inside space-y-2 pr-4">
                            <li><strong>حق الوصول:</strong> يمكنك الوصول إلى سجل محادثاتك في أي وقت.</li>
                            <li><strong>التحكم:</strong> لديك التحكم الكامل في بدء وإنهاء المحادثات.</li>
                            <li><strong>الشفافية:</strong> نلتزم بالشفافية الكاملة حول كيفية استخدام بياناتك.</li>
                        </ul>
                        <p className="pt-6">شكرًا لثقتك في "مساعدك الذكي". نحن هنا لمساعدتك مع الحفاظ على خصوصيتك وأمانك.</p>
                    </div>
                    <div className="text-center mt-8">
                        <a href="#home" className="bg-sky-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-600 transition-colors duration-200">العودة إلى المحادثة</a>
                    </div>
                </div>
            </div>
        </main>
        );
      case 'home':
      default:
        return (
           <main className="flex-1 flex flex-col h-full relative">
            <header className="md:hidden p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                <h1 className="text-xl font-bold text-sky-500">مساعدك الذكي</h1>
                <button onClick={() => setIsMobileMenuOpen(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </header>
            <ChatWindow 
                messages={messages} 
                isLoading={isLoading} 
                suggestedQuestions={suggestedQuestions}
                onSendMessage={handleSendMessage}
            />
            <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </main>
        );
    }
  };


  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden">
        <Sidebar onCategorySelect={handleSendMessage} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        {renderPage()}
    </div>
  );
}