import ChatListItem from '../../components/chat/ChatListItem';

const NewChatModal = ({
  showNewChat,
  setShowNewChat,
  creating,
  newChatType,
  setNewChatType,
  newChatName,
  setNewChatName,
  newChatUserInput,
  setNewChatUserInput,
  createChat
}) => {
  if (!showNewChat) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Start a New Chat</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Chat Type</label>
          <select
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={newChatType}
            onChange={(e) => setNewChatType(e.target.value)}
          >
            <option value="one-to-one">One-to-One</option>
            <option value="group">Group</option>
          </select>
        </div>
        {newChatType === 'group' ? (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Group Name</label>
            <input
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              placeholder="Enter group name"
            />
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">User Email or Username</label>
            <input
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={newChatUserInput}
              onChange={(e) => setNewChatUserInput(e.target.value)}
              placeholder="Enter user email or username"
            />
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <button
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
            onClick={() => setShowNewChat(false)}
            disabled={creating}
          >
            Cancel
          </button>
          <button
            className={`px-3 py-1 rounded text-white ${creating ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 hover:scale-[1.02] active:scale-[0.99]'} shadow-sm ring-1 ring-black/5 transition-all duration-200 disabled:opacity-60`}
            disabled={creating || (newChatType === 'group' ? !newChatName : !newChatUserInput)}
            onClick={createChat}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

const ChatSidebar = ({
  selectedChat,
  setSelectedChat,
  chats,
  loadingChats,
  user,
  presence,
  mounted,
  showNewChat,
  setShowNewChat,
  creating,
  newChatType,
  setNewChatType,
  newChatName,
  setNewChatName,
  newChatUserInput,
  setNewChatUserInput,
  createChat
}) => (
  <aside className={`relative z-10 ${selectedChat ? 'hidden' : 'flex'} md:flex w-full md:w-80 overflow-x-hidden overflow-y-auto no-scrollbar h-[calc(100vh-4rem)] bg-white/60 dark:bg-white/5 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 flex-col shadow-2xl`}>
    <div className="p-4 flex items-center justify-between sticky top-0 z-10 bg-white/60 dark:bg-white/5 backdrop-blur-xl border-b border-gray-200 dark:border-white/10">
      <span className="font-bold text-lg text-gray-900 dark:text-white tracking-wide">Chats</span>
      <button
        className="ml-2 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20 transition-all hover:scale-105 active:scale-95"
        onClick={() => setShowNewChat(true)}
        title="New chat"
      >
        New
      </button>
    </div>

    <NewChatModal
      showNewChat={showNewChat}
      setShowNewChat={setShowNewChat}
      creating={creating}
      newChatType={newChatType}
      setNewChatType={setNewChatType}
      newChatName={newChatName}
      setNewChatName={setNewChatName}
      newChatUserInput={newChatUserInput}
      setNewChatUserInput={setNewChatUserInput}
      createChat={createChat}
    />

    {loadingChats ? (
      <div className="p-4 text-gray-400 flex items-center justify-center h-32">
        <span className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mr-2"></span>
        Loading...
      </div>
    ) : (
      <ul className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
        {chats.map((chat, idx) => {
          const otherIds = (chat.members || []).map((m) => m._id).filter((id) => id !== user?._id);
          const otherId = chat.type === 'one-to-one' ? otherIds[0] : null;
          const online = otherId ? !!presence.get(String(otherId)) : false;
          return (
            <ChatListItem
              key={`${chat._id}-${idx}`}
              chat={chat}
              active={selectedChat?._id === chat._id}
              currentUser={user}
              online={online}
              onClick={() => setSelectedChat(chat)}
              className={`transition-all duration-500 ease-out transform rounded-xl ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${Math.min(idx, 12) * 40}ms` }}
            />
          );
        })}
      </ul>
    )}
  </aside>
);

export default ChatSidebar;
