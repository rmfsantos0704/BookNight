import { Link } from 'react-router-dom';

function Icon({ path, className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS = {
  workspace: 'M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z',
  save: 'M12 4v12m0 0 5-5m-5 5-5-5M5 19h14',
  board: 'M4 5h7v6H4V5Zm9 0h7v10h-7V5ZM4 13h7v6H4v-6Z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM21 21l-4.35-4.35',
  duplicate: 'm9 12 2 2 4-4M5 6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v13l-6.5-3L5 19V6Z',
  digest: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9ZM13.73 21a2 2 0 0 1-3.46 0',
  lock: 'M6 11V7a6 6 0 0 1 12 0v4M5 11h14v10H5V11Zm7 4v3',
  extension: 'M5 8h3V5a2 2 0 1 1 4 0v3h4V5a2 2 0 1 1 4 0v3h-2v4h2a2 2 0 1 1 0 4h-2v4H8v-4H5a2 2 0 1 1 0-4h3V8H5V8Z',
};

const SECTIONS = [
  {
    icon: 'workspace',
    title: 'Workspaces',
    body: "Everything in Booknight lives inside a workspace - think of it as one board per project, topic, or team. Create as many as you like from the sidebar. Only the owner can rename, delete, or manage who else has access, but any member can save and browse bookmarks inside it.",
  },
  {
    icon: 'save',
    title: 'Saving a link',
    body: "Paste any URL into the capture bar at the top of a workspace and hit Save. It shows up immediately as a placeholder card - within a few minutes, Booknight fetches the page's title, description, and preview image automatically and fills the card in.",
  },
  {
    icon: 'extension',
    title: 'The browser extension',
    body: "Install the Booknight extension and you can save whatever tab you're currently on with one click, without switching over to the web app at all. Sign in once, pick a workspace, and it remembers your choice for next time.",
  },
  {
    icon: 'board',
    title: 'Your board',
    body: 'Saved links appear as cards in a grid - bookmarks with a captured preview image get a larger tile than text-only ones. Click Edit on any card to adjust its title, description, or tags; click Remove to delete it.',
  },
  {
    icon: 'search',
    title: 'Search',
    body: "The search bar above your board looks across titles, tags, and descriptions - it tolerates typos and matches partial words as you type, so you don't need to remember an exact title to find something again.",
  },
  {
    icon: 'duplicate',
    title: 'Duplicate detection',
    body: "If you try to save a link that's already in that workspace - even a slightly different version of the same URL (tracking parameters, http vs https, a trailing slash) - Booknight lets you know instead of silently creating a second copy. You can still save it anyway if you want a duplicate on purpose.",
  },
  {
    icon: 'digest',
    title: 'Digest notifications',
    body: 'From a workspace\'s settings, the owner can set up a digest - a summary of newly-saved links delivered daily or weekly by email, Telegram, or Discord. Great for keeping a team or study group in sync without anyone needing to check the board directly.',
  },
  {
    icon: 'lock',
    title: 'Account security',
    body: 'New accounts are confirmed with a 6-digit code sent to your email before you can sign in. Forgot your password? Use the link on the sign-in page to reset it, also via a one-time emailed link.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-canvas px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link to="/board" className="text-sm text-ink/50 hover:text-accent">
          ← Back to your board
        </Link>

        <h1 className="font-display text-3xl text-ink mt-4 mb-2">How Booknight works</h1>
        <p className="text-ink/60 mb-10">
          A quick tour of the pieces - save this page for later if you want to come back to it.
        </p>

        <div className="space-y-8">
          {SECTIONS.map((section) => (
            <div key={section.title} className="flex gap-4">
              <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-card bg-accent-soft text-accent">
                <Icon path={ICONS[section.icon]} />
              </div>
              <div>
                <h2 className="font-display text-lg text-ink mb-1">{section.title}</h2>
                <p className="text-sm leading-relaxed text-ink/70">{section.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-line pt-6">
          <Link
            to="/board"
            className="inline-block rounded-card bg-accent text-canvas text-sm font-medium px-4 py-2"
          >
            Back to your board
          </Link>
        </div>
      </div>
    </div>
  );
}