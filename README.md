# HTML Transformer

A web application that transforms HTML content while preserving similar styling. Perfect for converting content from sources like WeChat articles while maintaining their visual appearance.

## Features

- **Page Style Translation**: Extract and translate styling from URLs (especially WeChat articles)
- **Dual Pane Interface**: Source HTML on the left, transformed result on the right
- **Style Preservation**: Automatically extracts and applies similar styling from source to target content
- **Live Preview**: Toggle between code view and live preview of transformed HTML
- **Export Options**: Copy to clipboard or download as HTML file
- **Auto-save**: Automatically saves your work to browser localStorage

## Tech Stack

- **Backend**: Python with FastAPI
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Dependencies**: BeautifulSoup4, Requests, Jinja2
- **Package Management**: UV with pyproject.toml

## Setup

### Prerequisites
- Python 3.11+
- UV package manager

### Installation

1. **Clone/Download the project**

2. **Install UV** (if not already installed):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

3. **Setup virtual environment and install dependencies**:
   ```bash
   uv venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   uv pip install -e .
   ```

4. **Run the application**:
   ```bash
   python main.py
   ```

5. **Open your browser** and navigate to:
   ```
   http://localhost:8000
   ```

## Usage

### Basic Workflow

1. **Input Source**: 
   - Enter a URL (like a WeChat article) in the URL field and click \"Translate Page Style\"
   - OR paste HTML directly into the \"Source HTML\" textarea

2. **Add Target Content**: 
   - Enter the content you want to transform in the "Target Content" textarea

3. **Transform**: 
   - Click "Transform HTML" to process the content

4. **View Results**: 
   - See the transformed HTML in the right pane
   - Toggle between code view and live preview
   - Copy or download the result

### Features in Detail

- **Page Style Translation**: Supports translating styles from any public URL, optimized for WeChat articles
- **Style Extraction**: Automatically extracts CSS rules, inline styles, classes, and IDs
- **Smart Styling**: Applies the most common styles from source to similar elements in target
- **Format HTML**: Clean up and format your source HTML for better readability
- **Auto-save**: Your work is automatically saved and restored when you return

## API Endpoints

### POST /fetch-url
Translates page style by fetching HTML content from a given URL.

**Parameters:**
- `url` (form data): The URL to fetch

**Response:**
```json
{
    \"success\": true,
    \"html\": \"<!-- HTML content with extracted styles -->\"
}
```

### POST /transform
Transforms target content to match source HTML styling.

**Parameters:**
- `source_html` (form data): The source HTML with styling
- `target_content` (form data): The content to be transformed

**Response:**
```json
{
    "success": true,
    "transformed_html": "<!-- transformed HTML -->"
}
```

## Development

### Project Structure
```
html-transformer/
├── main.py              # FastAPI application
├── pyproject.toml       # Project configuration and dependencies
├── templates/
│   └── index.html       # Main application template
├── static/
│   ├── css/
│   │   └── style.css    # Application styles
│   └── js/
│       └── app.js       # Frontend JavaScript
└── README.md
```

### Running in Development Mode
```bash
python main.py
```

The application will start with auto-reload enabled, so changes to Python files will automatically restart the server.

### Adding Dependencies
```bash
uv add package-name
```

## Common Use Cases

1. **WeChat Article Transformation**: Convert WeChat article content while maintaining their styling
2. **Content Migration**: Move content between different platforms while preserving appearance
3. **Style Template Creation**: Extract styling from one piece of content to apply to another
4. **HTML Cleanup**: Format and clean up HTML while preserving essential styling

## Troubleshooting

### URL Fetching Issues
- Ensure the URL is publicly accessible
- Some sites may block automated requests
- Try copying the HTML directly if URL fetching fails

### Styling Issues
- The transformer works best with inline styles and embedded CSS
- External stylesheets are not fetched automatically
- Complex CSS selectors may not be preserved perfectly

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- JavaScript must be enabled
- LocalStorage used for auto-save feature

## License

MIT License - feel free to use and modify as needed.