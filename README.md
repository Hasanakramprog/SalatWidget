# Prayer Widget (SalatWidget)

An elegant, frameless, and transparent Islamic Prayer Times desktop widget for Windows 11. Built with Electron, React, and Tailwind CSS. 

## ✨ Features

- **Live Data Scraping:** Automatically fetches the latest prayer times from [Almanar](https://almanar.com.lb/salat/).
- **Always on Top (Pin):** Click the pin icon to keep the widget visible above all other windows.
- **Draggable Interface:** Click and drag anywhere on the widget to move it around your desktop.
- **Global Shortcut:** Quickly show or hide the widget from anywhere by pressing `Shift + S`.
- **Next Prayer Highlight:** Automatically highlights the upcoming prayer and provides a live countdown timer.
- **Auto-Start:** Automatically launches silently when you start Windows.
- **Modern UI:** Glassmorphism effects with a sleek, dark Arabic-themed design.

## 🚀 Installation & Usage

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run start
   ```

### Building for Production

To create a standalone executable for Windows:

```bash
npm run dist
```
This will output a `.exe` installer in the `release` folder.

## 🛠️ Tech Stack

- **Electron:** Desktop environment
- **React (Vite):** UI Framework and bundler
- **Tailwind CSS:** Styling
- **Cheerio:** Web scraping for prayer times

## 📝 License

This project is open-source and available under the MIT License.
