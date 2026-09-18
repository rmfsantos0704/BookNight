import { Link } from 'react-router-dom';

// TODO: replace with your actual GitHub Release asset URL once published,
// e.g. https://github.com/<you>/<repo>/releases/download/v1.0.0/booknight-extension-v1.0.0.zip
const DOWNLOAD_URL = 'https://github.com/rmfsantos0704/BookNight/releases/tag/v1.0.0';

const STEPS = [
  {
    title: 'Download the extension',
    body: 'Click the download button above. Your browser saves a .zip file - note where it lands (usually your Downloads folder).',
  },
  {
    title: 'Extract the zip',
    body: "Right-click the downloaded file and choose 'Extract All' (Windows) or double-click it (Mac). You'll get a folder containing manifest.json and a few other files.",
  },
  {
    title: 'Open your browser\'s extensions page',
    body: 'In Chrome or Edge, go to chrome://extensions (or edge://extensions). You can paste that directly into your address bar.',
  },
  {
    title: 'Turn on Developer mode',
    body: "Find the 'Developer mode' toggle, usually in the top-right corner of the page, and switch it on. This is required to install an extension from a file instead of the Web Store.",
  },
  {
    title: "Click 'Load unpacked'",
    body: 'A new button appears once Developer mode is on. Click it, then select the folder you extracted in step 2 (the one containing manifest.json, not the zip file itself).',
  },
  {
    title: "Pin it and sign in",
    body: "Booknight now appears in your extensions list. Click the puzzle-piece icon in your toolbar and pin it for easy access. Click it, sign in with your Booknight account, and you're ready to save pages with one click.",
  },
];

export default function DownloadExtensionPage() {
  return (
    <div className="min-h-screen bg-canvas px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link to="/board" className="text-sm text-ink/50 hover:text-accent">
          ← Back to your board
        </Link>

        <h1 className="font-display text-3xl text-ink mt-4 mb-2">Get the browser extension</h1>
        <p className="text-ink/60 mb-6">
          Save any page to your workspace in one click, without opening the web app first.
        </p>

        <a
          href={DOWNLOAD_URL}
          className="inline-block rounded-card bg-accent text-canvas text-sm font-medium px-5 py-2.5 mb-2"
        >
          Download for Chrome / Edge
        </a>
        <p className="text-xs text-ink/40 mb-10">
          Not on the Chrome Web Store yet - this installs directly from a downloaded file. Takes about a minute.
        </p>

        <h2 className="font-display text-xl text-ink mb-4">Installation</h2>
        <ol className="space-y-5">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent text-sm font-semibold">
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-ink text-sm mb-0.5">{step.title}</p>
                <p className="text-sm text-ink/60 leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-card border border-line bg-white/40 p-4">
          <p className="text-sm text-ink/70">
            <span className="font-medium text-ink">Heads up:</span> since this isn't installed through
            the Chrome Web Store, your browser may show a one-time warning about "Developer mode
            extensions" when it starts up. That's expected - it's just Chrome flagging that the
            extension didn't come from the Store, not a sign anything's wrong.
          </p>
        </div>

        <div className="mt-8">
          <Link to="/how-it-works" className="text-sm text-accent hover:underline">
            See how the rest of Booknight works →
          </Link>
        </div>
      </div>
    </div>
  );
}