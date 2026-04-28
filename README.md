# ⚡ Live Code Compiler Pro

A powerful in-browser code playground with **real-time collaboration**, theme switching, code snippets, and live preview. Built with vanilla JavaScript - no backend required!

![Version](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-active-success)

## ✨ Features

### 🎨 **Core Features**
- **Multi-language Support**: HTML, CSS, JavaScript, Python, JSON, Markdown
- **Live Preview**: Real-time preview with console output
- **Smart Editor**: Auto-indentation, bracket matching, syntax highlighting
- **File Management**: Multi-file tabs, import/export, grouped sidebar
- **Undo/Redo**: Per-file history with Ctrl+Z / Ctrl+Shift+Z

### 🌓 **Theme Switcher**
- Toggle between dark and light modes
- Smooth transitions and persistent preferences
- Modern glassmorphism design

### 📚 **Code Snippets Library**
- 20+ pre-built templates
- HTML5 boilerplate, responsive cards, navigation bars
- CSS flexbox, grid, glassmorphism, animations
- JavaScript fetch API, DOM manipulation, local storage
- Python list comprehensions, decorators, classes
- One-click insertion into your project

### 🤝 **Live Collaboration** (NEW!)
Two collaboration modes:

#### **WebRTC P2P** (Cross-device)
- Real-time collaboration without a backend
- Share a 12-character room code
- Works across different devices and networks
- Powered by PeerJS with free signaling servers

#### **BroadcastChannel** (Same browser)
- Sync across multiple tabs instantly
- Perfect for testing and development
- One-click enable/disable

### 📦 **Export as ZIP**
- Download all files at once
- Complete project archive
- Easy sharing and backup

### ⌨️ **Keyboard Shortcuts**
- `Ctrl/Cmd + S` or `Ctrl/Cmd + Enter` - Run code
- `Ctrl/Cmd + Shift + P` - Toggle preview
- `Ctrl/Cmd + Shift + F` - Format current file
- `Ctrl/Cmd + B` - Toggle sidebar
- `F5` - Refresh preview
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y` - Redo

### 🎯 **Additional Features**
- Resizable sidebar and preview panels
- Console output with timestamps
- Python execution via Pyodide
- Markdown live preview
- Auto-save to localStorage
- Import local files
- Prettier code formatting

## 🚀 Quick Start

### Option 1: Local Development
```bash
# Clone the repository
git clone https://github.com/bitcodeAShishcloud/Live-UI-MAKER.git

# Navigate to folder
cd Live-UI-MAKER

# Start a local server (choose one):
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using VS Code
# Install "Live Server" extension and click "Go Live"
```

Visit `http://localhost:8000` in your browser.

### Option 2: Deploy to Vercel (Recommended for Collaboration)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Get instant URL: https://your-project.vercel.app
```

### Option 3: Deploy to Netlify
1. Go to [netlify.com/drop](https://app.netlify.com/drop)
2. Drag your project folder
3. Get instant URL: `https://your-app.netlify.app`

## 🤝 How to Use Collaboration

### Same Browser Tabs (Easiest)
1. Click **"Collab"** button in header
2. Switch to **"Same Browser"** tab
3. Click **"Enable Tab Sync"**
4. Open the same URL in another tab
5. Both tabs sync automatically!

### WebRTC P2P (Cross-device)
**Person 1 (Room Creator):**
1. Click **"Collab"** button
2. Click **"Create New Room"**
3. Copy the 12-character code
4. Share with collaborator

**Person 2 (Room Joiner):**
1. Click **"Collab"** button
2. Enter the room code
3. Click **"Join Room"**
4. Start coding together!

**Note:** WebRTC requires HTTPS. Deploy to Vercel/Netlify for cross-device collaboration.

## 📁 Project Structure

```
Live-UI-MAKER/
├── index.html          # Main app shell, UI components
├── script.js           # Core logic, collaboration, state management
├── styles.css          # Styling, themes, animations
├── md.html            # Markdown live preview helper
├── README.md          # Documentation
└── TEST_COLLABORATION.md  # Testing guide
```

## 🛠️ Technologies Used

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 with CSS Variables
- **Collaboration**: WebRTC + PeerJS, BroadcastChannel API
- **Code Formatting**: Prettier (CDN)
- **Python Runtime**: Pyodide (CDN)
- **Icons**: Font Awesome
- **Fonts**: Inter, Outfit, Fira Code
- **Export**: JSZip

## 🎨 Themes

- **Dark Mode** (Default): Modern dark theme with glassmorphism
- **Light Mode**: Clean light theme for daytime coding

Toggle with the moon/sun icon in the header.

## 📝 Code Snippets Categories

### HTML
- HTML5 Boilerplate
- Responsive Card
- Navigation Bar
- Contact Form

### CSS
- Flexbox Center
- Grid Layout
- Glassmorphism
- Button Hover Effects
- Gradient Text

### JavaScript
- Fetch API
- DOM Manipulation
- Local Storage
- Debounce Function
- Array Methods

### Python
- List Comprehension
- Dictionary Operations
- Function Decorators
- Class Examples

## 🔧 Configuration

The app uses localStorage for persistence:
- File contents and structure
- Theme preference
- Console visibility
- Sidebar width
- Panel sizes

Data expires after 30 minutes of inactivity.

## 🌐 Browser Support

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari (Limited collaboration support)
- ✅ Opera

**Note:** WebRTC collaboration requires modern browsers with WebRTC support.

## 🐛 Troubleshooting

### Collaboration Not Working?
1. Make sure you're using HTTPS (deploy to Vercel/Netlify)
2. Check browser console for errors (F12)
3. Try "Same Browser" tab sync first
4. Ensure both users have the same room code
5. Wait 5-10 seconds after creating room

### Console Errors?
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Check if all CDN resources loaded

### Features Not Loading?
1. Check internet connection (CDN dependencies)
2. Disable browser extensions
3. Try incognito/private mode

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Ashish Gupta**

- Portfolio: [bitcodeashishcloud.github.io/Ashish-Gupta](https://bitcodeashishcloud.github.io/Ashish-Gupta/)
- GitHub: [@bitcodeAShishcloud](https://github.com/bitcodeAShishcloud)
- LinkedIn: [Ashish Gupta](https://www.linkedin.com/in/ashish-gupta-037973259/)

## 🙏 Acknowledgments

- Font Awesome for icons
- Google Fonts for typography
- PeerJS for WebRTC simplification
- Prettier for code formatting
- Pyodide for Python in browser
- JSZip for file compression

## 📊 Stats

- **Lines of Code**: ~2,500+
- **File Size**: ~150KB (uncompressed)
- **Load Time**: < 2 seconds
- **Supported Languages**: 6
- **Code Snippets**: 20+
- **Keyboard Shortcuts**: 7

## 🔮 Future Features

- [ ] AI Code Assistant
- [ ] Git Integration
- [ ] Terminal Emulator
- [ ] Split View Editor
- [ ] Custom Themes
- [ ] Code Minifier
- [ ] Regex Tester
- [ ] Color Picker
- [ ] Multi-cursor Editing

## 📞 Support

If you encounter any issues or have questions:
1. Check the [TEST_COLLABORATION.md](TEST_COLLABORATION.md) guide
2. Open an issue on GitHub
3. Contact via LinkedIn

---

**⭐ Star this repo if you find it useful!**

Made with ❤️ by Ashish Gupta
