import { useState, useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useBoardStore } from '../../store/useBoardStore';
import { useAuth } from '../../context/AuthContext';

export default function WorkspaceSettingsModal() {
  const managingWorkspaceId = useUIStore((s) => s.managingWorkspaceId);
  const closeWorkspaceSettings = useUIStore((s) => s.closeWorkspaceSettings);
  const { user } = useAuth();

  const {
    workspaceDetail,
    loadingWorkspaceDetail,
    loadWorkspaceDetail,
    clearWorkspaceDetail,
    renameWorkspace,
    deleteWorkspace,
    addWorkspaceMember,
    removeWorkspaceMember,
  } = useBoardStore();

  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  const [memberEmail, setMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState('');

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (managingWorkspaceId) {
      loadWorkspaceDetail(managingWorkspaceId);
      setConfirmingDelete(false);
      setMemberError('');
      setDeleteError('');
    } else {
      clearWorkspaceDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managingWorkspaceId]);

  useEffect(() => {
    if (workspaceDetail) setName(workspaceDetail.name);
  }, [workspaceDetail?._id, workspaceDetail?.name]);

  if (!managingWorkspaceId) return null;

  const isOwner = workspaceDetail?.ownerId?._id === user?._id || workspaceDetail?.ownerId === user?._id;

  const handleRename = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === workspaceDetail.name) return;
    setSavingName(true);
    setNameError('');
    try {
      await renameWorkspace(managingWorkspaceId, name.trim());
    } catch (err) {
      setNameError(err.message);
    } finally {
      setSavingName(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    setAddingMember(true);
    setMemberError('');
    try {
      await addWorkspaceMember(managingWorkspaceId, memberEmail.trim());
      setMemberEmail('');
    } catch (err) {
      setMemberError(err.message);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await removeWorkspaceMember(managingWorkspaceId, memberId);
    } catch (err) {
      setMemberError(err.message);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteWorkspace(managingWorkspaceId);
      closeWorkspaceSettings();
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={closeWorkspaceSettings}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-settings-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-card bg-canvas border border-line p-6"
      >
        <h2 id="workspace-settings-title" className="font-display text-xl text-ink mb-5">
          Workspace settings
        </h2>

        {loadingWorkspaceDetail || !workspaceDetail ? (
          <p className="text-sm text-ink/50">Loading…</p>
        ) : (
          <div className="space-y-6">
            {!isOwner && (
              <p className="text-sm text-ink/50 bg-line/30 rounded-card px-3 py-2">
                Only the workspace owner can rename, delete, or manage members here.
              </p>
            )}

            {/* Rename */}
            <form onSubmit={handleRename} className="space-y-2">
              <label htmlFor="ws-name" className="block text-sm text-ink/70">Name</label>
              <div className="flex gap-2">
                <input
                  id="ws-name"
                  type="text"
                  value={name}
                  disabled={!isOwner}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 rounded-card border border-line bg-white/60 px-3 py-2 text-ink outline-none focus-visible:border-accent disabled:opacity-60"
                />
                {isOwner && (
                  <button
                    type="submit"
                    disabled={savingName || !name.trim() || name.trim() === workspaceDetail.name}
                    className="rounded-card bg-accent text-canvas text-sm font-medium px-3 disabled:opacity-50"
                  >
                    {savingName ? 'Saving…' : 'Save'}
                  </button>
                )}
              </div>
              {nameError && <p className="text-sm text-red-600">{nameError}</p>}
            </form>

            {/* Members */}
            <div className="space-y-2">
              <p className="text-sm text-ink/70">Members</p>
              <ul className="space-y-1.5">
                <li className="flex items-center justify-between text-sm">
                  <span className="text-ink">
                    {workspaceDetail.ownerId?.displayName || workspaceDetail.ownerId?.email}
                    <span className="text-ink/40 ml-1.5">(owner)</span>
                  </span>
                </li>
                {workspaceDetail.members
                  .filter((m) => m._id !== workspaceDetail.ownerId?._id)
                  .map((member) => (
                    <li key={member._id} className="flex items-center justify-between text-sm">
                      <span className="text-ink">{member.displayName || member.email}</span>
                      {isOwner && (
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="text-xs text-ink/40 hover:text-red-600"
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                {workspaceDetail.members.length <= 1 && (
                  <li className="text-sm text-ink/40">No other members yet.</li>
                )}
              </ul>

              {isOwner && (
                <form onSubmit={handleAddMember} className="flex gap-2 pt-1">
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="Add member by email"
                    className="flex-1 rounded-card border border-line bg-white/60 px-3 py-2 text-sm text-ink outline-none focus-visible:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={addingMember || !memberEmail.trim()}
                    className="rounded-card bg-graphite text-canvas text-sm font-medium px-3 disabled:opacity-50"
                  >
                    {addingMember ? 'Adding…' : 'Add'}
                  </button>
                </form>
              )}
              {memberError && <p className="text-sm text-red-600">{memberError}</p>}
            </div>

            {/* Delete */}
            {isOwner && (
              <div className="border-t border-line pt-4">
                {!confirmingDelete ? (
                  <button
                    onClick={() => setConfirmingDelete(true)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete this workspace
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-ink">
                      This permanently deletes the workspace and every bookmark in it. This can't be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="rounded-card bg-red-600 text-white text-sm font-medium px-3 py-1.5 disabled:opacity-60"
                      >
                        {deleting ? 'Deleting…' : 'Yes, delete it'}
                      </button>
                      <button
                        onClick={() => setConfirmingDelete(false)}
                        className="text-sm text-ink/60 hover:text-ink px-3 py-1.5"
                      >
                        Cancel
                      </button>
                    </div>
                    {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-5">
          <button onClick={closeWorkspaceSettings} className="text-sm text-ink/60 hover:text-ink">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}