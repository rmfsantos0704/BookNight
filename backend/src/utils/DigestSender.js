// Telegram: requires one app-wide bot (created once via @BotFather),
// TELEGRAM_BOT_TOKEN in .env. Each subscription's "destination" is the
// chat ID that bot should message (a user's own chat with the bot, or a
// group/channel the bot has been added to).
const sendTelegramDigest = async (chatId, text) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured on the server');
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', disable_web_page_preview: true }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Telegram API error (${res.status}): ${body}`);
  }
};

// Discord: no app-wide bot needed - each subscription's "destination" is a
// per-channel webhook URL the user creates themselves (Channel Settings >
// Integrations > Webhooks in Discord).
const sendDiscordDigest = async (webhookUrl, text) => {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Discord webhook error (${res.status}): ${body}`);
  }
};

module.exports = { sendTelegramDigest, sendDiscordDigest };