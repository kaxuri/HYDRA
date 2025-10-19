# 🌀 Hydra — Watch Anything, Anywhere, Instantly

Hydra is a **modern, open-source streaming web application** that allows you to browse and watch movies and TV shows — **completely free**, without registration, and directly in your browser.  
Powered by public APIs, it provides seamless access to entertainment content with a beautiful, responsive, and fast interface.  

---

## ✨ Features

🎬 **Stream Instantly** — Play movies and series directly using the [vidsrc.to](https://vidsrc.to) API.  
🔍 **Smart Search** — Find movies or shows quickly with live suggestions powered by [imdbapi.dev](https://imdbapi.dev).  
📺 **Episode Browser** — Explore seasons and episodes of your favorite series with one click.  
📈 **Discover Mode** — Filter titles by genre, rating, or year and discover trending, top-rated, and most popular content.  
🎨 **Modern UI** — Elegant design built with TailwindCSS and shadcn/ui, fully responsive and dark-mode ready.  
💾 **URL Persistence** — Shareable URLs for every title and episode.  
⚙️ **No Back-End Required** — Pure Next.js client-side logic; data fetched directly from APIs.  

---

## 🧩 How It Works

Hydra doesn’t host or store any videos.  
Instead, it acts as a **content aggregator**, fetching metadata and video sources from external providers:

- 🎥 **[vidsrc.to](https://vidsrc.to)** → provides video embedding sources for movies and TV shows.  
- 🎞️ **[imdbapi.dev](https://imdbapi.dev)** → provides metadata like posters, ratings, plots, and genres.  

All data is dynamically fetched and rendered client-side, so users can explore, filter, and play content in real time.

---

## 🛠️ Tech Stack

| Category | Technology |
|-----------|-------------|
| ⚛️ Framework | [Next.js 15](https://nextjs.org) |
| 🎨 Styling | [TailwindCSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| 🧠 State | React Hooks + useDebounce |
| 📡 APIs | [vidsrc.to](https://vidsrc.to) & [imdbapi.dev](https://imdbapi.dev) |
| 📦 TypeScript | for full type safety |
| 🌗 Themes | [next-themes](https://github.com/pacocoursey/next-themes) |
| 🖼️ Images | Next.js Image Optimization |
| ⚙️ Deployment | Vercel / Docker ready |

---

## 🚀 Installation & Setup

Follow these simple steps to run Hydra locally:

```bash
# 1️⃣ Clone the repository
git clone https://github.com/kaxuri/hydra.git
cd hydra

# 2️⃣ Install dependencies
npm install

# 3️⃣ Run the development server
npm run dev

# 4️⃣ Open in your browser
http://localhost:3000
```

### Environment Variables

You don’t need any API keys — Hydra uses public endpoints from `imdbapi.dev` and `vidsrc.to`.

---

## 🔍 Discover Page

Hydra includes a **Discover** section that allows you to:
- Filter movies by genre, year, or rating  
- Sort by popularity, release date, or user rating  
- Browse endless content with `pageToken` pagination  

🎯 Everything updates instantly without reloading the page.

---

## 🧠 Philosophy

Hydra is built on three key principles:
1. **Freedom** — Stream without paywalls or subscriptions.  
2. **Speed** — Lightweight architecture with instant loading.  
3. **Transparency** — Fully open-source and API-driven.  

---

## ⚖️ Legal Disclaimer

Hydra does **not host, store, or upload** any video files.  
All videos are **embedded from third-party sources** such as `vidsrc.to`.  
If a video is unavailable or removed, it’s due to upstream providers.  
Hydra is strictly for educational and personal research purposes.

---

## 🧑‍💻 Contributing

Contributions are always welcome!  
If you want to improve the UI, fix bugs, or add new features:

```bash
# Fork the repo
# Create a new branch
git checkout -b feature/amazing-idea
# Commit changes
git commit -m "Added an awesome new feature"
# Push and open a PR 🎉
git push origin feature/amazing-idea
```

---

## 🌍 Deployment

Deploy easily using [Vercel](https://vercel.com):

1. Click **“Deploy”** on your GitHub repository  
2. Connect your repo  
3. Wait for the automatic build  
4. Enjoy Hydra online ⚡  

Alternatively, you can build manually:

```bash
npm run build
npm start
```

---

## 💡 Roadmap

✅ Search with live suggestions  
✅ Movie & Series support  
✅ Episode browser  
✅ Cast & Crew details  
✅ Genre-based filtering  
⬜ User watchlists  
⬜ AI-powered recommendations  
⬜ Offline mode  

---

## 🧙‍♂️ Author

Created with ❤️ by [Kaxuri](https://github.com/kaxuri)  
If you like this project, consider giving it a ⭐ on GitHub — it helps a lot!

---

## 🌀 Hydra — *Unlimited heads, unlimited content.*

> "Watch everything, know everything, with Hydra."
