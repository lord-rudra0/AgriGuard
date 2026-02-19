import MessageBubble from '../../components/chat/MessageBubble';
import Composer from '../../components/chat/Composer';
import { getChatTitle } from './chatUtils';

const ChatMainPanel = ({
  selectedChat,
  setSelectedChat,
  mounted,
  headerMenuOpen,
  setHeaderMenuOpen,
  headerMenuRef,
  deleteChat,
  setShowMembers,
  setShowAddMember,
  isTyping,
  loadingMessages,
  messages,
  activeMessageId,
  setActiveMessageId,
  deleteMessage,
  user,
  messagesEndRef,
  handleMouseDown,
  isResizing,
  input,
  handleInputChange,
  sendMessage,
  handleUpload,
  setAskAIActive,
  askAIActive,
  attachedMedia,
  removeAttachment,
  sending,
  presence
}) => (
  <main className={`relative z-10 ${selectedChat ? 'flex' : 'hidden'} md:flex flex-1 flex-col overflow-x-hidden overflow-y-auto no-scrollbar`}>
    <div className="flex-1 flex flex-col md:px-6 md:pb-6 md:pt-0 min-h-0">
      {selectedChat ? (
        <>
          <div className={`flex items-center justify-between transition-all duration-500 ease-out transform sticky top-0 z-30 px-4 py-3 md:px-0 md:py-0 bg-white/60 dark:bg-white/5 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 md:bg-transparent md:border-b-0 md:pt-4 md:mb-2 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
            <div className="font-bold text-lg md:text-2xl mb-0.5 text-gray-900 dark:text-white flex items-center gap-2 filter drop-shadow-md">
              <button
                className="md:hidden mr-1 inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 active:scale-95 hover:bg-gray-200 dark:hover:bg-white/20"
                onClick={() => setSelectedChat(null)}
                aria-label="Back to chats"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              {selectedChat.type === 'one-to-one' ? (
                <>
                  <span className="text-gray-900 dark:bg-gradient-to-r dark:from-emerald-300 dark:via-emerald-200 dark:to-amber-300 dark:bg-clip-text dark:text-transparent font-bold">{getChatTitle(selectedChat, user)}</span>
                  {(() => {
                    const otherId = (selectedChat.members || []).map((m) => (typeof m === 'object' ? m._id : m)).find((id) => String(id) !== String(user?._id));
                    const isOnline = otherId ? !!presence.get(String(otherId)) : false;
                    return (
                      <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${isOnline ? 'text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-500/30' : 'text-gray-500 border-gray-200 dark:text-gray-400 dark:border-white/10'}`}>
                        <span className="relative w-3 h-3 mr-1.5 inline-flex items-center justify-center">
                          {isOnline && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/60 animate-ping"></span>}
                          <span className={`relative inline-block w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                        </span>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    );
                  })()}
                </>
              ) : (
                <span className="text-gray-900 dark:bg-gradient-to-r dark:from-emerald-300 dark:via-emerald-200 dark:to-amber-300 dark:bg-clip-text dark:text-transparent font-bold">{getChatTitle(selectedChat, user)}</span>
              )}
            </div>
            <div className="relative" ref={headerMenuRef}>
              <button
                onClick={() => setHeaderMenuOpen((v) => !v)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white hover:bg-white/80 dark:hover:bg-white/10 active:scale-95 backdrop-blur-md"
                title="More"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 6.75a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM12 13.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM12 20.25a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" /></svg>
              </button>
              {headerMenuOpen && (
                <div role="menu" className="absolute right-0 mt-2 w-44 rounded-xl overflow-hidden border border-white/60 dark:border-gray-700/60 shadow-lg bg-white dark:bg-gray-900 z-30">
                  {selectedChat.type === 'group' && (
                    <>
                      <button className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-gray-800/60 text-gray-800 dark:text-gray-100" onClick={() => { setShowMembers(true); setHeaderMenuOpen(false); }}>Members</button>
                      <button className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-gray-800/60 text-gray-800 dark:text-gray-100" onClick={() => { setShowAddMember(true); setHeaderMenuOpen(false); }}>Add member</button>
                      <div className="h-px bg-gray-200 dark:bg-gray-700" />
                    </>
                  )}
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-rose-50 dark:hover:bg-red-900/20 text-rose-600 dark:text-rose-400" onClick={() => { deleteChat(); setHeaderMenuOpen(false); }}>Delete chat</button>
                </div>
              )}
            </div>
          </div>
          {isTyping ? <div className="text-xs mb-2 bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent font-medium animate-pulse">{isTyping} is typing…</div> : <div className="h-2" />}
          <div className={`chat-messages-container flex-1 min-h-0 overflow-y-auto no-scrollbar overflow-x-hidden pb-24 md:pb-6 md:rounded-[24px] md:shadow-2xl md:p-6 p-3 mb-2 md:mb-4 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-gray-200/50 dark:shadow-black/20 transition-all duration-500 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {loadingMessages ? (
              <div className="text-gray-500 dark:text-gray-400 text-center mt-8">Loading messages…</div>
            ) : messages.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400 text-center mt-8">No messages yet.</div>
            ) : (
              <ul className="space-y-3">
                {messages.map((msg, idx) => {
                  const msgId = msg._id || idx;
                  const me = msg.type === 'ai' ? false : (msg.sender?._id === user?._id);
                  const showActions = activeMessageId === msgId;
                  const memberIds = (selectedChat?.members || []).map((m) => (typeof m === 'object' ? m._id : m)).filter(Boolean);
                  const totalOthers = memberIds.filter((id) => String(id) !== String(user?._id)).length;
                  const seenBy = Array.isArray(msg.seenBy) ? msg.seenBy : [];
                  const seenByIds = seenBy.map((s) => (typeof s === 'object' && s?._id) ? s._id : s).filter(Boolean);
                  const seenCount = seenByIds.filter((id) => String(id) !== String(user?._id)).length;
                  return (
                    <li key={`${msgId}-${idx}`} className={`group cursor-pointer transition-all duration-500 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`} style={{ transitionDelay: `${Math.min(idx, 12) * 35}ms` }} onClick={() => setActiveMessageId((prev) => (prev === msgId ? null : msgId))}>
                      <MessageBubble
                        me={me}
                        author={msg.type === 'ai' ? 'ASKAI' : (msg.sender?.name || 'User')}
                        content={msg.content}
                        type={msg.type}
                        mediaUrl={msg.mediaUrl}
                        mediaType={msg.mediaType}
                        time={msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        seenCount={me ? seenCount : 0}
                        totalOthers={me ? totalOthers : 0}
                      />
                      <div className={`transition-opacity duration-150 mt-1 ${showActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {(msg.sender?._id === user?._id) && (
                          <button className="inline-flex items-center px-2.5 py-1.5 text-sm text-red-700 border border-red-200 rounded-md hover:bg-red-50 dark:text-red-400 dark:border-red-700/40 dark:hover:bg-red-900/20" onClick={(e) => { e.stopPropagation(); deleteMessage(msg._id); }}>Delete message</button>
                        )}
                      </div>
                    </li>
                  );
                })}
                <div ref={messagesEndRef} />
              </ul>
            )}
          </div>

          <div className={`hidden md:block w-full h-2 bg-transparent hover:bg-emerald-500/20 cursor-ns-resize transition-all duration-500 ease-out transform relative group mb-2 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`} onMouseDown={handleMouseDown}>
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center"><div className="w-12 h-1 bg-gray-300 rounded-full group-hover:bg-emerald-500 transition-colors duration-200"></div></div>
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-xs text-gray-400 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">{isResizing ? 'Resizing...' : 'Drag to resize'}</div>
          </div>

          <div className={`transition-all duration-500 ease-out transform sticky bottom-0 z-40 md:static md:bottom-auto px-3 md:px-0 pt-2 md:pt-0 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`} style={{ transitionDelay: '120ms' }}>
            <Composer
              value={input}
              onChange={handleInputChange}
              onSend={sendMessage}
              onUpload={handleUpload}
              onInsertAskAI={() => setAskAIActive(true)}
              askAIActive={askAIActive}
              attachedMedia={attachedMedia}
              onRemoveAttachment={removeAttachment}
              uploading={sending}
              onRemoveAskAI={() => setAskAIActive(false)}
            />
          </div>
        </>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-gray-500 dark:text-gray-400">Select a chat to start messaging</div>
      )}
    </div>
  </main>
);

export default ChatMainPanel;
