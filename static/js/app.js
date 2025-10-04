// HTML Transformer Frontend Logic
class HTMLTransformerApp {
    constructor() {
        this.elements = {
            sourceUrl: document.getElementById('source-url'),
            fetchBtn: document.getElementById('fetch-btn'),
            sourceHtml: document.getElementById('source-html'),
            targetContent: document.getElementById('target-content'),
            transformBtn: document.getElementById('transform-btn'),
            resultHtml: document.getElementById('result-html'),
            resultContainer: document.getElementById('result-container'),
            resultCode: document.getElementById('result-code'),
            resultPreview: document.getElementById('result-preview'),
            previewFrame: document.getElementById('preview-frame'),
            loading: document.getElementById('loading'),
            status: document.getElementById('status'),
            clearSource: document.getElementById('clear-source'),
            clearTarget: document.getElementById('clear-target'),
            formatSource: document.getElementById('format-source'),
            copyResult: document.getElementById('copy-result'),
            downloadResult: document.getElementById('download-result'),
            previewToggle: document.getElementById('preview-toggle')
        };
        
        this.isPreviewMode = false;
        this.lastTransformedHtml = '';
        
        this.bindEvents();
        this.loadFromLocalStorage();
    }

    bindEvents() {
        this.elements.fetchBtn.addEventListener('click', () => this.translatePageStyle());
        this.elements.transformBtn.addEventListener('click', () => this.transformHtml());
        this.elements.clearSource.addEventListener('click', () => this.clearSource());
        this.elements.clearTarget.addEventListener('click', () => this.clearTarget());
        this.elements.formatSource.addEventListener('click', () => this.formatSource());
        this.elements.copyResult.addEventListener('click', () => this.copyResult());
        this.elements.downloadResult.addEventListener('click', () => this.downloadResult());
        this.elements.previewToggle.addEventListener('click', () => this.togglePreview());
        
        // Auto-save to localStorage
        this.elements.sourceHtml.addEventListener('input', () => this.saveToLocalStorage());
        this.elements.targetContent.addEventListener('input', () => this.saveToLocalStorage());
        this.elements.sourceUrl.addEventListener('input', () => this.saveToLocalStorage());
        
        // Enter key handling
        this.elements.sourceUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.translatePageStyle();
        });
    }

    async translatePageStyle() {
        const url = this.elements.sourceUrl.value.trim();
        
        if (!url) {
            this.showStatus('Please enter a URL', 'error');
            return;
        }

        if (!this.isValidUrl(url)) {
            this.showStatus('Please enter a valid URL', 'error');
            return;
        }

        this.showLoading(true);
        
        try {
            const formData = new FormData();
            formData.append('url', url);
            
            const response = await fetch('/fetch-url', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.elements.sourceHtml.value = result.html;
                this.showStatus('Page style translated successfully!', 'success');
                this.saveToLocalStorage();
            } else {
                this.showStatus(`Error: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Style translation error:', error);
            this.showStatus('Network error occurred', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async transformHtml() {
        const sourceHtml = this.elements.sourceHtml.value.trim();
        const targetContent = this.elements.targetContent.value.trim();
        
        if (!sourceHtml) {
            this.showStatus('Please provide source HTML', 'error');
            return;
        }
        
        if (!targetContent) {
            this.showStatus('Please provide target content', 'error');
            return;
        }

        this.showLoading(true);
        this.elements.transformBtn.disabled = true;
        
        try {
            const formData = new FormData();
            formData.append('source_html', sourceHtml);
            formData.append('target_content', targetContent);
            
            const response = await fetch('/transform', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.lastTransformedHtml = result.transformed_html;
                this.displayResult(result.transformed_html);
                this.showProcessingInfo(result.content_type, result.processing_strategy);
                this.showStatus('HTML transformed successfully!', 'success');
            } else {
                this.showStatus(`Transformation error: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Transform error:', error);
            this.showStatus('Network error occurred', 'error');
        } finally {
            this.showLoading(false);
            this.elements.transformBtn.disabled = false;
        }
    }

    displayResult(html) {
        // Display in code view
        this.elements.resultHtml.textContent = this.formatHtml(html);
        
        // Trigger Prism highlighting if available
        if (window.Prism) {
            Prism.highlightElement(this.elements.resultHtml);
        }
        
        // Update preview if in preview mode
        if (this.isPreviewMode) {
            this.updatePreview(html);
        }
    }

    togglePreview() {
        this.isPreviewMode = !this.isPreviewMode;
        
        if (this.isPreviewMode) {
            this.elements.resultCode.style.display = 'none';
            this.elements.resultPreview.style.display = 'flex';
            this.elements.previewToggle.textContent = 'Show Code';
            
            if (this.lastTransformedHtml) {
                this.updatePreview(this.lastTransformedHtml);
            }
        } else {
            this.elements.resultCode.style.display = 'flex';
            this.elements.resultPreview.style.display = 'none';
            this.elements.previewToggle.textContent = 'Toggle Preview';
        }
    }

    updatePreview(html) {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        this.elements.previewFrame.src = url;
        
        // Clean up previous URL
        this.elements.previewFrame.onload = () => {
            URL.revokeObjectURL(url);
        };
    }

    clearSource() {
        this.elements.sourceHtml.value = '';
        this.saveToLocalStorage();
        this.showStatus('Source cleared', 'success');
    }

    clearTarget() {
        this.elements.targetContent.value = '';
        this.saveToLocalStorage();
        this.showStatus('Target content cleared', 'success');
    }

    formatSource() {
        const html = this.elements.sourceHtml.value;
        if (html.trim()) {
            this.elements.sourceHtml.value = this.formatHtml(html);
            this.saveToLocalStorage();
            this.showStatus('HTML formatted', 'success');
        }
    }

    async copyResult() {
        if (!this.lastTransformedHtml) {
            this.showStatus('No result to copy', 'error');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(this.lastTransformedHtml);
            this.showStatus('Result copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            this.fallbackCopyToClipboard(this.lastTransformedHtml);
        }
    }

    downloadResult() {
        if (!this.lastTransformedHtml) {
            this.showStatus('No result to download', 'error');
            return;
        }
        
        const blob = new Blob([this.lastTransformedHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transformed_${new Date().getTime()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showStatus('File downloaded!', 'success');
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showStatus('Result copied to clipboard!', 'success');
        } catch (error) {
            this.showStatus('Copy failed - please copy manually', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    formatHtml(html) {
        // Simple HTML formatting
        return html
            .replace(/></g, '>\n<')
            .replace(/^\s+|\s+$/g, '')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map((line, index, array) => {
                const depth = this.getHtmlDepth(array.slice(0, index + 1));
                return '  '.repeat(Math.max(0, depth)) + line;
            })
            .join('\n');
    }

    getHtmlDepth(lines) {
        let depth = 0;
        for (const line of lines) {
            const openTags = (line.match(/<[^/][^>]*>/g) || []).length;
            const closeTags = (line.match(/<\/[^>]*>/g) || []).length;
            const selfClosing = (line.match(/<[^>]*\/>/g) || []).length;
            depth += openTags - closeTags - selfClosing;
        }
        return Math.max(0, depth);
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    showLoading(show) {
        this.elements.loading.classList.toggle('hidden', !show);
    }

    showStatus(message, type) {
        this.elements.status.textContent = message;
        this.elements.status.className = `status ${type}`;
        this.elements.status.classList.remove('hidden');
        
        setTimeout(() => {
            this.elements.status.classList.add('hidden');
        }, 3000);
    }
    
    showProcessingInfo(contentType, strategy) {
        // Create or update processing info display
        let infoElement = document.getElementById('processing-info');
        if (!infoElement) {
            infoElement = document.createElement('div');
            infoElement.id = 'processing-info';
            infoElement.className = 'processing-info';
            
            // Insert after the transform button
            const transformBtn = document.getElementById('transform-btn');
            transformBtn.parentNode.insertBefore(infoElement, transformBtn.nextSibling);
        }
        
        const contentTypeClass = contentType === 'markdown' ? 'markdown-type' : 
                                contentType === 'plain_text' ? 'plain-text-type' : 
                                'empty-type';
        
        infoElement.innerHTML = `
            <div class="info-header">Content Processing</div>
            <div class="info-item">
                <span class="label">Detected Type:</span>
                <span class="value ${contentTypeClass}">${contentType.replace('_', ' ').toUpperCase()}</span>
            </div>
            <div class="info-item">
                <span class="label">Strategy:</span>
                <span class="value">${strategy}</span>
            </div>
        `;
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (infoElement.parentNode) {
                infoElement.parentNode.removeChild(infoElement);
            }
        }, 10000);
    }

    saveToLocalStorage() {
        const data = {
            sourceUrl: this.elements.sourceUrl.value,
            sourceHtml: this.elements.sourceHtml.value,
            targetContent: this.elements.targetContent.value,
            timestamp: Date.now()
        };
        localStorage.setItem('htmlTransformerData', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('htmlTransformerData'));
            if (data && Date.now() - data.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
                this.elements.sourceUrl.value = data.sourceUrl || '';
                this.elements.sourceHtml.value = data.sourceHtml || '';
                this.elements.targetContent.value = data.targetContent || '';
            }
        } catch (error) {
            console.log('No previous data found');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HTMLTransformerApp();
});