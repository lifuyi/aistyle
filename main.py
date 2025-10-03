"""
HTML Transformer Web Application
Transforms HTML content while preserving similar styling
"""

from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import requests
from bs4 import BeautifulSoup
import re
import logging
from typing import Optional
import aiofiles

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="HTML Transformer", version="0.1.0")

# Mount static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


class HTMLTransformer:
    """Core HTML transformation logic"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def fetch_html_from_url(self, url: str) -> str:
        """Fetch HTML content from a given URL"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            logger.error(f"Error fetching URL {url}: {e}")
            raise HTTPException(status_code=400, detail=f"Error fetching URL: {str(e)}")
    
    def extract_styles(self, soup: BeautifulSoup) -> dict:
        """Extract CSS styles from HTML"""
        styles = {
            'inline_styles': {},
            'css_rules': [],
            'classes': set(),
            'ids': set()
        }
        
        # Extract inline styles
        for element in soup.find_all(attrs={'style': True}):
            tag_name = element.name
            if tag_name not in styles['inline_styles']:
                styles['inline_styles'][tag_name] = []
            styles['inline_styles'][tag_name].append(element.get('style'))
        
        # Extract CSS from style tags
        for style_tag in soup.find_all('style'):
            if style_tag.string:
                styles['css_rules'].append(style_tag.string)
        
        # Extract classes and IDs
        for element in soup.find_all():
            if element.get('class'):
                styles['classes'].update(element.get('class'))
            if element.get('id'):
                styles['ids'].add(element.get('id'))
        
        return styles
    
    def transform_html(self, source_html: str, target_content: str) -> str:
        """Transform target content to match source styling"""
        source_soup = BeautifulSoup(source_html, 'html.parser')
        target_soup = BeautifulSoup(target_content, 'html.parser')
        
        # Extract styles from source
        source_styles = self.extract_styles(source_soup)
        
        # Apply similar styling to target
        transformed_soup = self.apply_similar_styling(target_soup, source_styles)
        
        return str(transformed_soup)
    
    def apply_similar_styling(self, target_soup: BeautifulSoup, source_styles: dict) -> BeautifulSoup:
        """Apply similar styling from source to target HTML"""
        
        # Create a style tag with extracted CSS
        if source_styles['css_rules']:
            style_tag = target_soup.new_tag('style')
            style_tag.string = '\n'.join(source_styles['css_rules'])
            
            # Add to head or create head if it doesn't exist
            if not target_soup.head:
                head = target_soup.new_tag('head')
                if target_soup.html:
                    target_soup.html.insert(0, head)
                else:
                    target_soup.insert(0, head)
            
            target_soup.head.append(style_tag)
        
        # Apply inline styles to similar elements
        for tag_name, styles_list in source_styles['inline_styles'].items():
            target_elements = target_soup.find_all(tag_name)
            if target_elements and styles_list:
                # Use the most common style for this tag
                most_common_style = max(set(styles_list), key=styles_list.count)
                for element in target_elements:
                    element['style'] = most_common_style
        
        return target_soup


# Initialize transformer
transformer = HTMLTransformer()


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Serve the main application page"""
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/fetch-url")
async def fetch_url(url: str = Form(...)):
    """Fetch HTML content from a given URL"""
    try:
        html_content = transformer.fetch_html_from_url(url)
        return {"success": True, "html": html_content}
    except HTTPException as e:
        return {"success": False, "error": str(e.detail)}


@app.post("/transform")
async def transform_html(
    source_html: str = Form(...),
    target_content: str = Form(...)
):
    """Transform target content to match source HTML styling"""
    try:
        if not source_html.strip() or not target_content.strip():
            return {"success": False, "error": "Both source HTML and target content are required"}
        
        transformed_html = transformer.transform_html(source_html, target_content)
        return {"success": True, "transformed_html": transformed_html}
    
    except Exception as e:
        logger.error(f"Error transforming HTML: {e}")
        return {"success": False, "error": f"Transformation error: {str(e)}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main_clean:app", host="0.0.0.0", port=8000, reload=True)