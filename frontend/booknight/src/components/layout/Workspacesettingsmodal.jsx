import { useState, useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useBoardStore } from '../../store/useBoardStore';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

const CHANNEL_LABELS = { email: 'Email', telegram: 'Telegram', discord: 'Discord' };
const DESTINATION_HINTS = {
  email: 'you@example.com',
  telegram: 'Telegram chat ID (message @userinfobot to find yours)',
  discord: 'Discord channel webhook URL',
};

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

  const [digests, setDigests] = useState([]);
  const [loadingDigests, setLoadingDigests] = useState(false);
  const [digestChannel, setDigestChannel] = useState('email');
  const [digestFrequency, setDigestFrequency] = useState('daily');
  const [digestDestination, setDigestDestination] = useState('');
  const [addingDigest, setAddingDigest] = useState(false);
  const [digestError, setDigestError] = useState('');

  const loadDigests = async (workspaceId) => {
    setLoadingDigests(true);
    try {
      const data = await api.listDigests(workspaceId);
      setDigests(data.digests);
    } catch {
      // Non-owners get a 403 here, which is fine - just show no digests.
      setDigests([]);
    } finally {
      setLoadingDigests(false);
    }
  };

  useEffect(() => {
    if (managingWorkspaceId) {
      loadWorkspaceDetail(managingWorkspaceId);
      loadDigests(managingWorkspaceId);
      setConfirmingDelete(false);
      setMemberError('');
      setDeleteError('');
      setDigestError('');
    } else {
      clearWorkspaceDetail();
      setDigests([]);
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

  const handleAddDigest = async (e) => {
    e.preventDefault();
    if (!digestDestination.trim()) return;
    setAddingDigest(true);
    setDigestError('');
    try {
      const data = await api.createDigest(managingWorkspaceId, {
        channel: digestChannel,
        frequency: digestFrequency,
        destination: digestDestination.trim(),
      });
      setDigests((prev) => [data.digest, ...prev]);
      setDigestDestination('');
    } catch (err) {
      setDigestError(err.message);
    } finally {
      setAddingDigest(false);
    }
  };

  const handleToggleDigest = async (digest) => {
    try {
      const data = await api.updateDigest(managingWorkspaceId, digest._id, { enabled: !digest.enabled });
      setDigests((prev) => prev.map((d) => (d._id === digest._id ? data.digest : d)));
    } catch (err) {
      setDigestError(err.message);
    }
  };

  const handleDeleteDigest = async (digestId) => {
    try {
      await api.deleteDigest(managingWorkspaceId, digestId);
      setDigests((prev) => prev.filter((d) => d._id !== digestId));
    } catch (err) {
      setDigestError(err.message);
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
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-card bg-canvas border border-line p-6"
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

            {/* Digests */}
            {isOwner && (
              <div className="space-y-2 border-t border-line pt-4">
                <p className="text-sm text-ink/70">Digest notifications</p>
                <p className="text-xs text-ink/50">
                  Get a summary of new links pushed to email, Telegram, or Discord on a schedule.
                </p>

                {loadingDigests ? (
                  <p className="text-sm text-ink/40">Loading…</p>
                ) : (
                  <ul className="space-y-1.5">
                    {digests.length === 0 && (
                      <li className="text-sm text-ink/40">No digests set up yet.</li>
                    )}
                    {digests.map((digest) => (
                      <li key={digest._id} className="flex items-center justify-between text-sm gap-2">
                        <span className="text-ink truncate">
                          <span className="font-medium">{CHANNEL_LABELS[digest.channel]}</span>
                          {' · '}
                          {digest.frequency}
                          {' · '}
                          <span className="text-ink/50">{digest.destination}</span>
                        </span>
                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={digest.enabled}
                            aria-label={`${digest.enabled ? 'Disable' : 'Enable'} this digest`}
                            onClick={() => handleToggleDigest(digest)}
                            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 ${
                              digest.enabled ? 'bg-accent' : 'bg-line-dark/40'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${
                                digest.enabled ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => handleDeleteDigest(digest._id)}
                            className="text-xs text-ink/40 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <form onSubmit={handleAddDigest} className="space-y-2 pt-1">
                  <div className="flex gap-2">
                    <select
                      value={digestChannel}
                      onChange={(e) => setDigestChannel(e.target.value)}
                      className="rounded-card border border-line bg-white/60 px-2 py-2 text-sm text-ink outline-none focus-visible:border-accent"
                    >
                      <option value="email">Email</option>
                      <option value="telegram">Telegram</option>
                      <option value="discord">Discord</option>
                    </select>
                    <select
                      value={digestFrequency}
                      onChange={(e) => setDigestFrequency(e.target.value)}
                      className="rounded-card border border-line bg-white/60 px-2 py-2 text-sm text-ink outline-none focus-visible:border-accent"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={digestDestination}
                      onChange={(e) => setDigestDestination(e.target.value)}
                      placeholder={DESTINATION_HINTS[digestChannel]}
                      className="flex-1 rounded-card border border-line bg-white/60 px-3 py-2 text-sm text-ink outline-none focus-visible:border-accent"
                    />
                    <button
                      type="submit"
                      disabled={addingDigest || !digestDestination.trim()}
                      className="rounded-card bg-graphite text-canvas text-sm font-medium px-3 disabled:opacity-50"
                    >
                      {addingDigest ? 'Adding…' : 'Add'}
                    </button>
                  </div>
                </form>
                {digestError && <p className="text-sm text-red-600">{digestError}</p>}
              </div>
            )}

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