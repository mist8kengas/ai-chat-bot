## ai-chat-bot

An AI bot that will talk to you using GPT-3

[Invite the bot](https://discord.com/api/oauth2/authorize?client_id=1060238290223116329&permissions=2048&scope=bot%20applications.commands)

Features:

- ~~Sentience~~

Requirements:

- Node.js v16 (v16.9.0 or newer)
- Node Package Manager (npm) v6 (recommended: v6.14.9 or newer)

Installation:

1. Clone this repository to a directory
2. Install packages by using `npm install`
3. Build the bot by running `npm build`
4. Configure bot by using `.env` file:
   | Value | Description |
   | --- | --- |
   | `OPENAI_KEY` | OpenAI API key (required) |
   | `CLIENT_ID` | Discord bot application token (required) |
   | `BOT_TOKEN` | Discord bot token (required) |
5. Run the bot by running `npm run start` in the directory

Usage:

- Type `/message-ai prompt:<prompt>` to talk to the bot where `<prompt>` is your message (maximum of 1,000 characters)
