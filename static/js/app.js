// HTML Transformer Frontend Logic
class HTMLTransformerApp {
    constructor() {
        console.log('HTMLTransformerApp constructor called');
        
        this.elements = {
            sourceUrl: document.getElementById('source-url'),
            fetchBtn: document.getElementById('fetch-btn'),
            sourceHtml: document.getElementById('source-html'),
            targetContent: document.getElementById('target-content'),
            transformBtn: document.getElementById('transform-btn'),
            resultContainer: document.getElementById('result-container'),
            resultPreview: document.getElementById('result-preview'),
            previewFrame: document.getElementById('preview-frame'),
            loading: document.getElementById('loading'),
            status: document.getElementById('status'),
            clearSource: document.getElementById('clear-source'),
            addToTarget: document.getElementById('add-to-target'),
            copyResult: document.getElementById('copy-result'),
            downloadResult: document.getElementById('download-result')
        };
        
        console.log('Elements selected:', this.elements);
        
        // Check if any elements are missing
        for (const [key, element] of Object.entries(this.elements)) {
            if (!element) {
                console.error(`Element with ID ${key} not found!`);
            }
        }
        
        this.lastTransformedHtml = '';
        
        this.bindEvents();
        this.loadFromLocalStorage();
        
        console.log('HTMLTransformerApp constructor completed');
    }

    bindEvents() {
        this.elements.fetchBtn.addEventListener('click', () => this.translatePageStyle());
        this.elements.transformBtn.addEventListener('click', () => this.transformHtml());
        this.elements.clearSource.addEventListener('click', () => this.clearSource());
        this.elements.addToTarget.addEventListener('click', () => this.addToTarget());
        this.elements.copyResult.addEventListener('click', () => this.copyResult());
        this.elements.downloadResult.addEventListener('click', () => this.downloadResult());
        
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
        // Show the rendered preview
        this.elements.resultPreview.style.display = 'block';
        
        // Update preview
        this.updatePreview(html);
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

    async addToTarget() {
        const sourceText = this.elements.sourceHtml.value.trim();
        
        console.log('Add to target called with sourceText:', sourceText);
        
        if (!sourceText) {
            this.showStatus('Please enter source text', 'error');
            return;
        }

        this.showLoading(true);
        
        try {
            const formData = new FormData();
            formData.append('source_text', sourceText);
            
            console.log('Sending request to /process-source');
            
            const response = await fetch('/process-source', {
                method: 'POST',
                body: formData
            });
            
            console.log('Received response from /process-source:', response);
            
            const result = await response.json();
            
            console.log('Parsed result:', result);
            
            if (result.success) {
                // Append to target content with a newline if there's existing content
                const currentTarget = this.elements.targetContent.value;
                console.log('Current target content:', currentTarget);
                console.log('Processed content to add:', result.processed_content);
                
                if (currentTarget.trim()) {
                    this.elements.targetContent.value = currentTarget + '\n\n' + result.processed_content;
                } else {
                    this.elements.targetContent.value = result.processed_content;
                }
                
                console.log('Updated target content:', this.elements.targetContent.value);
                
                this.saveToLocalStorage();
                this.showStatus(`Added ${result.content_type} content to Target`, 'success');
            } else {
                this.showStatus(`Error: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Add to target error:', error);
            this.showStatus('Network error occurred', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    

    async copyResult() {
        if (!this.lastTransformedHtml) {
            this.showStatus('No result to copy', 'error');
            return;
        }
        
        try {
            // Try to copy as rich media format (HTML) first
            if (navigator.clipboard && navigator.clipboard.write) {
                const clipboardItem = new ClipboardItem({
                    'text/html': new Blob([this.lastTransformedHtml], { type: 'text/html' }),
                    'text/plain': new Blob([this.lastTransformedHtml], { type: 'text/plain' })
                });
                await navigator.clipboard.write([clipboardItem]);
                this.showStatus('Rich media content copied to clipboard!', 'success');
            } else {
                // Fallback to plain text for compatibility
                await navigator.clipboard.writeText(this.lastTransformedHtml);
                this.showStatus('HTML content copied to clipboard!', 'success');
            }
        } catch (error) {
            console.log('Clipboard API failed, trying fallback:', error);
            // Enhanced fallback for Debian/Linux systems
            this.debianCompatibleCopy(this.lastTransformedHtml);
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

    debianCompatibleCopy(html) {
        // Enhanced fallback that works better on Debian/Linux systems
        
        // Method 1: Try execCommand with HTML content in a div
        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            tempDiv.style.position = 'fixed';
            tempDiv.style.left = '-999999px';
            tempDiv.style.top = '-999999px';
            tempDiv.contentEditable = true;
            document.body.appendChild(tempDiv);
            
            // Select the content
            const range = document.createRange();
            range.selectNodeContents(tempDiv);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Try to copy as rich content
            const successful = document.execCommand('copy');
            document.body.removeChild(tempDiv);
            
            if (successful) {
                this.showStatus('Rich content copied to clipboard!', 'success');
                return;
            }
        } catch (error) {
            console.log('Rich content copy failed:', error);
        }
        
        // Method 2: Fallback to plain text copy
        try {
            const textArea = document.createElement('textarea');
            textArea.value = html;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                this.showStatus('HTML code copied to clipboard!', 'success');
            } else {
                this.showManualCopyDialog(html);
            }
        } catch (error) {
            console.log('Text copy also failed:', error);
            this.showManualCopyDialog(html);
        }
    }
    
    showManualCopyDialog(html) {
        // Show a dialog with the HTML for manual copying
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white; padding: 20px; border-radius: 8px;
            max-width: 80%; max-height: 80%; overflow: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        dialog.innerHTML = `
            <h3>Copy HTML Manually</h3>
            <p>Please select all and copy the content below:</p>
            <textarea readonly style="width: 100%; height: 300px; font-family: monospace; font-size: 12px;">${html}</textarea>
            <div style="margin-top: 10px; text-align: right;">
                <button onclick="this.closest('.manual-copy-modal').remove()" style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
            </div>
        `;
        
        modal.className = 'manual-copy-modal';
        modal.appendChild(dialog);
        document.body.appendChild(modal);
        
        // Auto-select the textarea content
        const textarea = dialog.querySelector('textarea');
        textarea.focus();
        textarea.select();
        
        this.showStatus('Manual copy dialog opened', 'error');
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
    console.log('DOM loaded, initializing HTMLTransformerApp');
    new HTMLTransformerApp();
    console.log('HTMLTransformerApp initialized');
});