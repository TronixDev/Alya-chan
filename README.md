<div align="center">

# 🌸 Alya-chan

[![Discord Bot](https://img.shields.io/badge/Discord-Bot-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.dev/)
[![Bun](https://img.shields.io/badge/Bun-F472B6?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Turso](https://img.shields.io/badge/Turso-4FF8D2?style=for-the-badge&logo=turso&logoColor=black)](https://turso.tech/)
[![License](https://img.shields.io/badge/License-AGPL--3.0-blue?style=for-the-badge)](LICENSE)

**A versatile, feature-rich Discord bot built with [Seyfert](https://github.com/tiramisulabs/Seyfert)**

*Music, moderation, DNS utilities, chatbot, and guild tools in one bot.*

[🚀 Invite Bot](https://discord.com/oauth2/authorize?client_id=1260252174861074442) • [🔥 Vote Bot](https://top.gg/bot/1260252174861074442/vote) • [💬 Support Server](https://discord.gg/pTbFUFdppU)

</div>

---

## ✨ Features

<div align="center">

| 🎶 **Music** | 🛡️ **Moderation** | 🔧 **System & Utility** |
|:---:|:---:|:---:|
| Lavalink playback | Ban, kick, timeout, softban | DNS over Discord (`dig`, `multi-dig`, `whois`) |
| Queue and playlist controls | Nickname, lock/unlock, slowmode | Chatbot and global chat configuration |
| Multi-source support | Emoji/sticker management | Locale, prefix, and guild configuration |

</div>

### 🎵 Music Features
- High-quality playback with Lavalink
- Queue management, loop, shuffle, seek, and replay
- Playlist tools and now-playing utilities
- Prefix and slash command support

### 🛡️ Moderation Features
- Member moderation commands (`ban`, `unban`, `kick`, `timeout`, `softban`)
- Channel moderation commands (`lock`, `unlock`, `slowmode`)
- Utility moderation commands (`nick`, emoji/sticker add-rename-remove-steal)
- Components V2 responses for modern Discord UI output

### 🔧 Utility & System Features
- DNS tools (`dig`, `multi-dig`) and WHOIS lookup
- Guild chatbot and global chat setup
- Multi-language support (default `en-US`)
- Optional premium and Top.gg integration

---

## 🚀 Quick Start

### 📋 Prerequisites

<div align="center">

| Requirement | Version | Download |
|:---:|:---:|:---:|
| **Bun** | `>= 1.2.0` | [Download](https://bun.sh/) |
| **Discord Bot** | - | [Create Bot](https://discord.com/developers/applications) |
| **Turso / libSQL** | - | [Get Database](https://turso.tech/) |
| **Lavalink Node** | - | Required for music commands |

</div>

### 🛠️ Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/TronixDev/Alya-chan.git
   cd Alya-chan
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Configure Environment Variables**

   Copy `.env.example` to `.env` and fill values:

   ```env
   TOKEN=your_discord_bot_token
   DATABASE_URL=libsql://your-database-name.turso.io
   DATABASE_PASSWORD=your-turso-token
   OPENROUTER_API_KEY=your_openrouter_key_optional
   LASTFM_API_KEY=your_lastfm_key_or_multiple_separated_by_comma
   ```

4. **Configure Bot Files**
   - `src/config/config.ts`
   - `src/config/nodes.ts`
   - `src/config/emoji.ts`

5. **Run the Bot**
   ```bash
   bun run dev
   ```

---

## ⚙️ Scripts

| Script | Description |
|:---:|:---|
| `bun run dev` | Run bot in watch mode |
| `bun run start` | Run bot normally |
| `bun run build` | Build with tsup |
| `bun run lint` | Lint source with Biome |
| `bun run lint:fix` | Lint with auto-fixes |
| `bun run type-check` | TypeScript type checking |
| `bun run format` | Format/check source |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Run Drizzle migrations |
| `bun run db:push` | Push schema changes |
| `bun run db:studio` | Open Drizzle Studio |

---

## 📁 Project Structure

```txt
src/
  commands/        # Bot commands (Music, Moderations, Utils, Configurations, etc.)
  middlewares/     # Global and command middleware
  config/          # Runtime config, emojis, nodes
  db/              # Database schema and access layer
  locales/         # Localization files
  utils/           # Shared utilities
```

---

## 👥 Contributors

<div align="center">

| Avatar | Contributor | Role |
|:---:|:---:|:---:|
| [<img src="https://github.com/idMJA.png" width="50" style="border-radius: 50%;">](https://github.com/idMJA) | **[iaMJ](https://github.com/idMJA)** | Creator |
| [<img src="https://github.com/88JC.png" width="50" style="border-radius: 50%;">](https://github.com/88JC) | **[kydo](https://github.com/88JC)** | Bug Hunter |
| ⭐ | **[stelle-music](https://github.com/Ganyu-Studios/stelle-music)** | Code Adaptation |

</div>

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run lint and type-check
5. Open a pull request

---

## 📞 Support

If you need help:

- [Discord Support Server](https://discord.gg/pTbFUFdppU)
- [Issues](https://github.com/TronixDev/Alya-chan/issues)

---

## 📄 License

This project is licensed under [AGPL-3.0](LICENSE).
