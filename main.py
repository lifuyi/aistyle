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
from typing import Optional, Dict, Tuple
import markdown

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
    
    def detect_content_type(self, content: str) -> Tuple[str, str]:
        """
        Detect if content is Markdown or plain text
        Returns: (content_type, processed_content)
        """
        if not content.strip():
            return "empty", ""
        
        # Common Markdown patterns
        markdown_patterns = [
            r'^#{1,6}\s+',  # Headers
            r'^\*{1,2}.+\*{1,2}$',  # Bold/italic
            r'^\*\s+.+',  # Unordered list
            r'^\d+\.\s+.+',  # Ordered list
            r'^\s*>\s+.+',  # Blockquote
            r'^\s*```',  # Code block
            r'^\s*-{3,}',  # Horizontal rule
            r'\[.+\]\(.+\)',  # Link
            r'!\[.*\]\(.+\)',  # Image
            r'`[^`]+`',  # Inline code
        ]
        
        markdown_score = 0
        lines = content.split('\n')
        
        for line in lines:
            if not line.strip():
                continue
            for pattern in markdown_patterns:
                if re.search(pattern, line, re.MULTILINE):
                    markdown_score += 1
                    break
        
        # If more than 20% of non-empty lines match Markdown patterns, consider it Markdown
        non_empty_lines = [line for line in lines if line.strip()]
        if non_empty_lines and (markdown_score / len(non_empty_lines)) > 0.2:
            return "markdown", content
        
        return "plain_text", content
    
    def convert_text_to_markdown(self, text: str) -> str:
        """
        Convert plain text to markdown using an external API
        """
        try:
            # Using a simple text-to-markdown conversion service
            # In a real implementation, you might use OpenAI API or similar
            # For now, we'll do basic conversion locally
            
            # Basic text to markdown conversion
            lines = text.split('\n')
            markdown_lines = []
            
            for line in lines:
                stripped_line = line.strip()
                if not stripped_line:
                    markdown_lines.append("")  # Preserve empty lines
                    continue
                
                # Convert numbered lists
                if re.match(r'^\d+\.\s+', stripped_line):
                    markdown_lines.append(stripped_line)
                # Convert bullet points
                elif stripped_line.startswith('•') or stripped_line.startswith('-') or stripped_line.startswith('*'):
                    markdown_lines.append(f"- {stripped_line[1:].strip()}")
                # Convert potential headers (all caps or short lines)
                elif len(stripped_line) < 50 and stripped_line.isupper():
                    markdown_lines.append(f"## {stripped_line.title()}")
                # Regular paragraph
                else:
                    markdown_lines.append(stripped_line)
            
            return '\n'.join(markdown_lines)
            
        except Exception as e:
            logger.error(f"Error converting text to markdown: {e}")
            # Fallback to original text if conversion fails
            return text
    
    def process_target_content(self, content: str) -> Tuple[str, str]:
        """
        Process target content based on its type
        Returns: (content_type, processed_html)
        """
        content_type, processed_content = self.detect_content_type(content)
        
        if content_type == "markdown":
            # Convert Markdown to HTML
            html_content = markdown.markdown(
                processed_content,
                extensions=['tables', 'fenced_code', 'codehilite', 'toc']
            )
            return "markdown", html_content
        elif content_type == "plain_text":
            # Convert plain text to markdown first, then to HTML
            markdown_content = self.convert_text_to_markdown(processed_content)
            html_content = markdown.markdown(
                markdown_content,
                extensions=['tables', 'fenced_code', 'codehilite', 'toc']
            )
            return "plain_text", html_content
        else:
            return "empty", ""
    
    def fetch_html_from_url(self, url: str) -> str:
        """Translate page style from a given URL"""
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
    
    def transform_html(self, source_html: str, target_content: str) -> Dict[str, str]:
        """Transform target content to match source styling"""
        source_soup = BeautifulSoup(source_html, 'html.parser')
        
        # Process target content based on its type
        content_type, processed_html = self.process_target_content(target_content)
        target_soup = BeautifulSoup(processed_html, 'html.parser')
        
        # Extract styles from source
        source_styles = self.extract_styles(source_soup)
        
        # Apply similar styling to target
        transformed_soup = self.apply_similar_styling(target_soup, source_styles)
        
        return {
            "transformed_html": str(transformed_soup),
            "content_type": content_type,
            "processing_strategy": self.get_processing_strategy(content_type)
        }
    
    def get_processing_strategy(self, content_type: str) -> str:
        """Get the processing strategy description based on content type"""
        strategies = {
            "markdown": "Markdown to HTML conversion with syntax highlighting",
            "plain_text": "Plain text to HTML paragraphs conversion",
            "empty": "Empty content detected"
        }
        return strategies.get(content_type, "Unknown content type")
    
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
    """Translate page style from a given URL"""
    try:
        html_content = transformer.fetch_html_from_url(url)
        return {"success": True, "html": html_content}
    except HTTPException as e:
        return {"success": False, "error": str(e.detail)}


@app.post("/process-source")
async def process_source_text(source_text: str = Form(...)):
    """Process source text and return appropriate markdown for Target Content"""
    try:
        if not source_text.strip():
            return {"success": False, "error": "Source text is required"}
        
        content_type, _ = transformer.detect_content_type(source_text)
        
        if content_type == "markdown":
            # Already markdown, return as is
            processed_content = source_text
        elif content_type == "plain_text":
            # Convert plain text to markdown
            processed_content = transformer.convert_text_to_markdown(source_text)
        else:
            processed_content = source_text
        
        return {
            "success": True, 
            "content_type": content_type,
            "processed_content": processed_content
        }
    
    except Exception as e:
        logger.error(f"Error processing source text: {e}")
        return {"success": False, "error": f"Processing error: {str(e)}"}


@app.post("/transform")
async def transform_html(
    source_html: str = Form(...),
    target_content: str = Form(...)
):
    """Transform target content to match source HTML styling"""
    try:
        if not source_html.strip() or not target_content.strip():
            return {"success": False, "error": "Both source HTML and target content are required"}
        
        result = transformer.transform_html(source_html, target_content)
        
        # Add the original content and the processed markdown for editing
        content_type, _ = transformer.detect_content_type(target_content)
        if content_type == "plain_text":
            processed_markdown = transformer.convert_text_to_markdown(target_content)
            result["original_content"] = target_content
            result["processed_markdown"] = processed_markdown
        else:
            result["original_content"] = target_content
            result["processed_markdown"] = target_content
        
        return {"success": True, **result}
    
    except Exception as e:
        logger.error(f"Error transforming HTML: {e}")
        return {"success": False, "error": f"Transformation error: {str(e)}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)