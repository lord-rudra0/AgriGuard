export const AddMemberModal = ({
  showAddMember,
  adding,
  addInput,
  setAddInput,
  setShowAddMember,
  addMember
}) => {
  if (!showAddMember) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Add member</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Enter Email, Username, or Phone</p>
        <input
          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          value={addInput}
          onChange={(e) => setAddInput(e.target.value)}
          placeholder="Email / Username / Phone"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-3 py-1.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            onClick={() => { if (!adding) { setShowAddMember(false); setAddInput(''); } }}
            disabled={adding}
          >
            Cancel
          </button>
          <button
            className={`px-3 py-1.5 rounded text-white ${adding ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
            disabled={adding || !addInput.trim()}
            onClick={addMember}
          >
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const MembersModal = ({ showMembers, selectedChat, setShowMembers, user }) => {
  if (!showMembers || !selectedChat) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Group Members</h3>
          <button
            className="text-sm px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            onClick={() => setShowMembers(false)}
          >
            Close
          </button>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {(selectedChat.members || []).map((m) => {
            const id = typeof m === 'object' ? m._id : m;
            const name = typeof m === 'object' ? (m.name || m.username || m.email || id) : id;
            const meta = typeof m === 'object' ? (m.username || m.email || '') : '';
            const isMe = id === user?._id;
            return (
              <li key={id} className="py-2">
                <div className="text-sm text-gray-900 dark:text-white">{name}{isMe ? ' (You)' : ''}</div>
                {meta ? <div className="text-xs text-gray-500 dark:text-gray-400">{meta}</div> : null}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
