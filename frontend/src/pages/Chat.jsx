import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import ChatSidebar from './chat/ChatSidebar';
import ChatMainPanel from './chat/ChatMainPanel';
import { AddMemberModal, MembersModal } from './chat/ChatModals';
import { useChatState } from './chat/useChatState';

const Chat = () => {
  const { socket, presence, joinChat, leaveChat, setTyping } = useSocket();
  const { user } = useAuth();
  const state = useChatState({ socket, joinChat, leaveChat, setTyping, user });

  return (
    <div className="relative h-full min-h-0 flex overflow-x-hidden overflow-y-hidden text-gray-900 dark:text-gray-100 selection:bg-emerald-500/30 bg-stone-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/20 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute top-[20%] -right-[5%] w-[40%] h-[40%] bg-amber-500/20 blur-[100px] rounded-full animate-float" />
        <div className="absolute bottom-[10%] left-[20%] w-[30%] h-[30%] bg-emerald-500/20 blur-[80px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[10%] w-[20%] h-[20%] bg-lime-500/10 blur-[60px] rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <ChatSidebar
        selectedChat={state.selectedChat}
        setSelectedChat={state.setSelectedChat}
        chats={state.chats}
        loadingChats={state.loadingChats}
        user={user}
        presence={presence}
        mounted={state.mounted}
        showNewChat={state.showNewChat}
        setShowNewChat={state.setShowNewChat}
        creating={state.creating}
        newChatType={state.newChatType}
        setNewChatType={state.setNewChatType}
        newChatName={state.newChatName}
        setNewChatName={state.setNewChatName}
        newChatUserInput={state.newChatUserInput}
        setNewChatUserInput={state.setNewChatUserInput}
        createChat={state.createChat}
      />

      <ChatMainPanel
        selectedChat={state.selectedChat}
        setSelectedChat={state.setSelectedChat}
        mounted={state.mounted}
        headerMenuOpen={state.headerMenuOpen}
        setHeaderMenuOpen={state.setHeaderMenuOpen}
        headerMenuRef={state.headerMenuRef}
        deleteChat={state.deleteChat}
        setShowMembers={state.setShowMembers}
        setShowAddMember={state.setShowAddMember}
        isTyping={state.isTyping}
        loadingMessages={state.loadingMessages}
        messages={state.messages}
        activeMessageId={state.activeMessageId}
        setActiveMessageId={state.setActiveMessageId}
        deleteMessage={state.deleteMessage}
        user={user}
        messagesEndRef={state.messagesEndRef}
        handleMouseDown={state.handleMouseDown}
        isResizing={state.isResizing}
        input={state.input}
        handleInputChange={state.handleInputChange}
        sendMessage={state.sendMessage}
        handleUpload={state.handleUpload}
        setAskAIActive={state.setAskAIActive}
        askAIActive={state.askAIActive}
        attachedMedia={state.attachedMedia}
        removeAttachment={state.removeAttachment}
        sending={state.sending}
        presence={presence}
      />

      <AddMemberModal
        showAddMember={state.showAddMember}
        adding={state.adding}
        addInput={state.addInput}
        setAddInput={state.setAddInput}
        setShowAddMember={state.setShowAddMember}
        addMember={state.addMember}
      />

      <MembersModal
        showMembers={state.showMembers}
        selectedChat={state.selectedChat}
        setShowMembers={state.setShowMembers}
        user={user}
      />
    </div>
  );
};

export default Chat;
