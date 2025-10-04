# HTML Transformer Web Application

✅ **COMPLETED** - Web app for translating page styles and transforming HTML content

## What was built:

### 🎯 Core Features
- **Page Style Translation**: Input WeChat URLs (or any URL) to translate page styling
- **Dual Pane Interface**: Source HTML input on left, transformed result on right  
- **Style Preservation**: Extracts CSS styles, inline styles, classes from source and applies to target content
- **Live Preview**: Toggle between code view and rendered preview
- **Export Options**: Copy to clipboard or download as HTML file

### 🛠️ Tech Stack
- **Backend**: Python FastAPI with uvicorn
- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **Dependencies**: BeautifulSoup4, Requests, Jinja2
- **Package Management**: UV with pyproject.toml ✅

### 📁 Project Structure
```
html-transformer/
├── main.py              # FastAPI application
├── pyproject.toml       # Dependencies & config  
├── templates/index.html # Main UI
├── static/css/style.css # Styling
├── static/js/app.js     # Frontend logic
├── setup.sh            # Setup script
├── run.py              # Quick start script
└── README.md           # Documentation
```

### 🚀 How to run:
1. `./setup.sh` - Sets up environment
2. `source .venv/bin/activate` - Activate venv
3. `python main.py` - Start server
4. Open http://localhost:8000

The app is fully functional and ready to translate page styles and transform HTML content!

