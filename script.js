// ==================== STATE MANAGEMENT ====================
const DEFAULT_FILES = [
    { id: 1, name: 'index.html', type: 'html', content: '<!DOCTYPE html>\n<html>\n<head>\n    <title>My App</title>\n</head>\n<body>\n    <h1>Hello World! 🚀</h1>\n    <p>Welcome to Live Compiler Pro</p>\n    <button onclick="sayHello()">Click Me</button>\n    <div id="output"></div>\n</body>\n</html>' },
    { id: 2, name: 'styles.css', type: 'css', content: 'body {\n    font-family: Arial, sans-serif;\n    padding: 40px;\n    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n    color: white;\n    min-height: 100vh;\n}\n\nh1 {\n    font-size: 2.5rem;\n    margin-bottom: 15px;\n}\n\nbutton {\n    padding: 12px 24px;\n    background: white;\n    color: #667eea;\n    border: none;\n    border-radius: 6px;\n    cursor: pointer;\n    font-size: 1rem;\n    font-weight: 600;\n    transition: transform 0.2s;\n}\n\nbutton:hover {\n    transform: scale(1.05);\n}' },
    { id: 3, name: 'script.js', type: 'js', content: 'function sayHello() {\n    console.log("Hello from Live Compiler! 🎉");\n    document.getElementById("output").innerHTML = \n        "<p style=\\\'color: #4caf50; margin-top: 20px;\\\'>Button clicked! Check console.</p>";\n}\n\nconsole.log("Script loaded successfully ✅");\nconsole.warn("This is a warning ⚠️");\nconsole.error("This is an error ❌");' }
];

const APP_STATE_KEY = 'liveCompilerProStateV1';
const APP_STATE_TTL_MS = 30 * 60 * 1000;
const PRETTIER_CORE_URL = 'https://unpkg.com/prettier@3.2.5/standalone.js';
const PRETTIER_HTML_PARSER_URL = 'https://unpkg.com/prettier@3.2.5/plugins/html.js';
const PRETTIER_BABEL_PARSER_URL = 'https://unpkg.com/prettier@3.2.5/plugins/babel.js';
const PRETTIER_POSTCSS_PARSER_URL = 'https://unpkg.com/prettier@3.2.5/plugins/postcss.js';
const PRETTIER_MARKDOWN_PARSER_URL = 'https://unpkg.com/prettier@3.2.5/plugins/markdown.js';

function getDefaultFilesCopy() {
    return JSON.parse(JSON.stringify(DEFAULT_FILES));
}

const state = {
    files: getDefaultFilesCopy(),
    activeFileId: 1,
    selectedFileType: 'html',
    consoleVisible: true,
    consoleHeight: 200,
    consoleExpanded: false,
    sidebarVisible: true,
    autoRun: false,
    sectionCollapsed: {},
    sidebarWidth: 250,
    previewVisible: true,
    previewWidthPercent: 50,
    activeSidebarTab: 'files'
};

// Language configurations
const languageConfig = {
    html: { icon: 'fa-html5', color: 'var(--html-color)', extension: '.html', tabSize: 4 },
    css: { icon: 'fa-css3-alt', color: 'var(--css-color)', extension: '.css', tabSize: 4 },
    js: { icon: 'fa-js', color: 'var(--js-color)', extension: '.js', tabSize: 4 },
    python: { icon: 'fa-python', color: 'var(--python-color)', extension: '.py', tabSize: 4 },
    json: { icon: 'fa-brackets-curly', color: 'var(--warning)', extension: '.json', tabSize: 2 },
    markdown: { icon: 'fa-markdown', color: 'var(--text-primary)', extension: '.md', tabSize: 2 }
};

// File type groups for sidebar
const fileGroups = {
    'Web': ['html', 'css', 'js'],
    'Backend': ['python'],
    'Other': ['json', 'markdown']
};

// HTML tags for auto-wrap helper
const HTML_TAG_SET = new Set([
    '!doctype', 'a', 'abbr', 'acronym', 'address', 'applet', 'area', 'article', 'aside', 'audio', 'b', 'base',
    'basefont', 'bdi', 'bdo', 'bgsound', 'big', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption',
    'center', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog',
    'dir', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form',
    'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i',
    'iframe', 'img', 'input', 'ins', 'isindex', 'kbd', 'keygen', 'label', 'legend', 'li', 'link', 'main',
    'mark', 'marquee', 'menuitem', 'meta', 'meter', 'nav', 'nobr', 'noembed', 'noscript', 'object', 'optgroup',
    'option', 'output', 'p', 'param', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script',
    'section', 'small', 'source', 'spacer', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup',
    'svg', 'table', 'tbody', 'td', 'template', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'tt',
    'u', 'var', 'video', 'wbr', 'xmp'
]);

const HTML_VOID_TAGS = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr','basefont','bgsound','frame','isindex','keygen','menuitem','spacer']);

// Per-file undo/redo history
const historyStore = {};
let isRestoringHistory = false;

// Width constraints for resizable sidebar
const SIDEBAR_MIN_WIDTH = 180;
const SIDEBAR_MAX_WIDTH = 420;
const ACTIVITY_BAR_WIDTH = 52;
const CONSOLE_MIN_HEIGHT = 120;
const CONSOLE_MAX_RATIO = 0.75;
const DEFAULT_CONSOLE_HEIGHT = 200;
const CONSOLE_KEYSTEP = 12;
const CONSOLE_KEYSTEP_FAST = 40;

// ==================== DOM ELEMENTS ====================
const fileTabsContainer = document.getElementById('fileTabs');
const addFileBtn = document.getElementById('addFileBtn');
const editorTabsContainer = document.getElementById('editorTabs');
const editorContent = document.getElementById('editorContent');
const previewFrame = document.getElementById('previewFrame');
const previewArea = document.getElementById('previewArea');
const mainResizer = document.getElementById('resizer');
const previewToggleIcon = document.getElementById('previewToggleIcon');
const consoleFocusIcon = document.getElementById('consoleFocusIcon');
const consoleOutput = document.getElementById('consoleOutput');
const consolePanel = document.getElementById('consolePanel');
const consoleResizer = document.getElementById('consoleResizer');
const consoleResizeHint = document.getElementById('consoleResizeHint');
const addFileModal = document.getElementById('addFileModal');
const importFileInput = document.getElementById('importFileInput');
const filesPanel = document.getElementById('filesPanel');
const importPanel = document.getElementById('importPanel');
const activityFilesBtn = document.getElementById('activityFilesBtn');
const activityImportBtn = document.getElementById('activityImportBtn');
const sidebar = document.getElementById('sidebar');
const leftSidebar = document.getElementById('leftSidebar');
const sidebarResizer = document.getElementById('sidebarResizer');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const editorArea = document.querySelector('.editor-area');
let pyodideReadyPromise = null;
let persistTimer = null;
let prettierReadyPromise = null;
let blackReadyPromise = null;

function setupModalDismiss() {
    const infoModal = document.getElementById('infoModal');
    if (infoModal) {
        infoModal.addEventListener('click', (event) => {
            if (event.target === infoModal) {
                closeInfoModal();
            }
        });
    }

    const addModal = document.getElementById('addFileModal');
    if (addModal) {
        addModal.addEventListener('click', (event) => {
            if (event.target === addModal) {
                closeAddFileModal();
            }
        });
    }
}

function persistStateNow() {
    const payload = {
        savedAt: Date.now(),
        state: {
            files: state.files,
            activeFileId: state.activeFileId,
            selectedFileType: state.selectedFileType,
            consoleVisible: state.consoleVisible,
            consoleHeight: state.consoleHeight,
            consoleExpanded: state.consoleExpanded,
            autoRun: state.autoRun,
            sectionCollapsed: state.sectionCollapsed,
            sidebarWidth: state.sidebarWidth,
            sidebarVisible: state.sidebarVisible,
            previewVisible: state.previewVisible,
            previewWidthPercent: state.previewWidthPercent,
            activeSidebarTab: state.activeSidebarTab
        }
    };

    try {
        localStorage.setItem(APP_STATE_KEY, JSON.stringify(payload));
    } catch (err) {
        // Ignore quota/privacy errors
    }
}

function schedulePersistState() {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
        persistStateNow();
    }, 600);
}

function restoreStateFromStorage() {
    try {
        const raw = localStorage.getItem(APP_STATE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        const savedAt = Number(parsed?.savedAt || 0);
        const savedState = parsed?.state;

        if (!savedState || !savedAt || (Date.now() - savedAt > APP_STATE_TTL_MS)) {
            localStorage.removeItem(APP_STATE_KEY);
            return;
        }

        if (Array.isArray(savedState.files) && savedState.files.length) {
            state.files = savedState.files;
        }

        if (typeof savedState.activeFileId === 'number') state.activeFileId = savedState.activeFileId;
        if (typeof savedState.selectedFileType === 'string') state.selectedFileType = savedState.selectedFileType;
        if (typeof savedState.consoleVisible === 'boolean') state.consoleVisible = savedState.consoleVisible;
        if (typeof savedState.consoleHeight === 'number') state.consoleHeight = savedState.consoleHeight;
        if (typeof savedState.consoleExpanded === 'boolean') state.consoleExpanded = savedState.consoleExpanded;
        // Force manual-run mode regardless of previously persisted value.
        state.autoRun = false;
        if (savedState.sectionCollapsed && typeof savedState.sectionCollapsed === 'object') {
            state.sectionCollapsed = savedState.sectionCollapsed;
        }
        if (typeof savedState.sidebarWidth === 'number') state.sidebarWidth = savedState.sidebarWidth;
        if (typeof savedState.sidebarVisible === 'boolean') state.sidebarVisible = savedState.sidebarVisible;
        if (typeof savedState.previewVisible === 'boolean') state.previewVisible = savedState.previewVisible;
        if (typeof savedState.previewWidthPercent === 'number') state.previewWidthPercent = savedState.previewWidthPercent;
        if (savedState.activeSidebarTab === 'files' || savedState.activeSidebarTab === 'import') {
            state.activeSidebarTab = savedState.activeSidebarTab;
        }
    } catch (err) {
        localStorage.removeItem(APP_STATE_KEY);
    }
}

function resetWorkspaceToDefaults() {
    state.files = getDefaultFilesCopy();
    state.activeFileId = state.files[0].id;
    state.selectedFileType = 'html';
    state.sectionCollapsed = {};
}

// ==================== INITIALIZATION ====================
function init() {
    restoreStateFromStorage();
    applySidebarWidth(state.sidebarWidth);
    switchSidebarTab(state.activeSidebarTab, true);
    renderFileTabs();
    renderEditorTabs();
    renderEditors();
    setupAutoRun();
    setupConsoleIntercept();
    updatePreview();
    applyPreviewLayout();
    applyConsoleHeight();
    setupSidebarResizer();
    setupResizer();
    setupConsoleResizer();
    setupKeyboardShortcuts();
    setupModalDismiss();
    updateConsoleToggleIcon();
    updateConsoleFocusIcon();
    window.addEventListener('resize', applyConsoleHeight);

    window.addEventListener('beforeunload', () => {
        persistStateNow();
    });
    
    // Select default file type
    selectFileType(state.selectedFileType || 'html');
}

// ==================== FILE TYPE SELECTION ====================
function selectFileType(type) {
    state.selectedFileType = type;
    
    // Update UI
    document.querySelectorAll('.file-type-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.type === type) {
            option.classList.add('selected');
        }
    });
}

// ==================== SIDEBAR HELPERS ====================
function applySidebarWidth(width) {
    const clamped = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, width));
    state.sidebarWidth = clamped;
    applySidebarLayout();
    schedulePersistState();
}

function getLeftSidebarWidth() {
    return ACTIVITY_BAR_WIDTH + (state.sidebarVisible ? state.sidebarWidth : 0);
}

function applySidebarLayout() {
    const totalWidth = getLeftSidebarWidth();
    leftSidebar.style.width = `${totalWidth}px`;
    leftSidebar.style.minWidth = `${ACTIVITY_BAR_WIDTH}px`;

    sidebar.classList.toggle('hidden', !state.sidebarVisible);
    sidebarResizer.classList.toggle('hidden', !state.sidebarVisible);

    if (state.sidebarVisible) {
        sidebar.style.width = `${state.sidebarWidth}px`;
    }
}

function switchSidebarTab(tab, forceOpen = false) {
    const clickedActiveTab = state.activeSidebarTab === tab;

    if (clickedActiveTab && !forceOpen) {
        state.sidebarVisible = !state.sidebarVisible;
    } else {
        state.activeSidebarTab = tab;
        state.sidebarVisible = true;
    }

    const isFiles = tab === 'files';

    filesPanel.classList.toggle('active', isFiles);
    importPanel.classList.toggle('active', !isFiles);
    activityFilesBtn.classList.toggle('active', isFiles);
    activityImportBtn.classList.toggle('active', !isFiles);

    applySidebarLayout();

    if (addFileBtn) {
        addFileBtn.style.display = isFiles ? 'flex' : 'none';
    }

    schedulePersistState();
}

function openImportPicker() {
    if (!importFileInput) return;
    importFileInput.value = '';
    importFileInput.click();
}

function detectFileTypeByName(fileName) {
    const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
    const map = {
        html: 'html',
        htm: 'html',
        css: 'css',
        js: 'js',
        mjs: 'js',
        py: 'python',
        jsx: 'js',
        tsx: 'js',
        json: 'json',
        md: 'markdown',
        markdown: 'markdown',
        c: 'c',
        cpp: 'cpp',
        cxx: 'cpp',
        cs: 'csharp',
        java: 'java'
    };
    return map[ext] || 'js';
}

function importFiles(event) {
    const inputFiles = Array.from(event?.target?.files || []);
    if (!inputFiles.length) return;

    let importedCount = 0;
    let pending = inputFiles.length;

    inputFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
            const content = typeof reader.result === 'string' ? reader.result : '';
            const fileType = detectFileTypeByName(file.name);

            const newFile = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                name: file.name,
                type: fileType,
                content
            };

            state.files.push(newFile);
            importedCount += 1;

            if (fileType === 'markdown') {
                openMarkdownCompiler(content, file.name);
            }

            pending -= 1;
            if (pending === 0) {
                state.activeFileId = state.files[state.files.length - 1].id;
                renderFileTabs();
                renderEditorTabs();
                renderEditors();
                updatePreview();
                switchSidebarTab('files');
                showToast(`Imported ${importedCount} file${importedCount > 1 ? 's' : ''}`, 'success');
                schedulePersistState();
            }
        };

        reader.onerror = () => {
            pending -= 1;
            if (pending === 0) {
                if (importedCount > 0) {
                    state.activeFileId = state.files[state.files.length - 1].id;
                    renderFileTabs();
                    renderEditorTabs();
                    renderEditors();
                    updatePreview();
                    switchSidebarTab('files');
                    showToast(`Imported ${importedCount} file${importedCount > 1 ? 's' : ''}`, 'success');
                    schedulePersistState();
                } else {
                    showToast('Failed to import selected files', 'error');
                }
            }
        };

        reader.readAsText(file);
    });
}

function openMarkdownCompiler(content = '', fileName = 'markdown.md') {
    const payload = {
        name: fileName,
        content: content,
        savedAt: Date.now()
    };
    try {
        sessionStorage.setItem('mdLivePayload', JSON.stringify(payload));
    } catch (err) {
        // If storage fails, continue and open page; user can paste manually.
    }
    window.open('md.html', '_blank');
}

// ==================== FILE TABS ====================
function renderFileTabs() {
    // Group files by category
    const groupedFiles = {};
    
    Object.keys(fileGroups).forEach(group => {
        groupedFiles[group] = state.files.filter(f => 
            fileGroups[group].includes(f.type)
        );
    });

    fileTabsContainer.innerHTML = Object.entries(groupedFiles).map(([group, files]) => {
        if (files.length === 0) return '';
        
        const isCollapsed = state.sectionCollapsed[group] || false;
        
        return `
            <div class="file-section">
                <div class="file-section-header ${isCollapsed ? 'collapsed' : ''}" 
                     onclick="toggleSection('${group}')">
                    <i class="fas fa-chevron-down"></i>
                    <span>${group}</span>
                    <span style="margin-left:auto;font-size:0.65rem;color:var(--text-secondary);">${files.length}</span>
                </div>
                <div class="file-section-content ${isCollapsed ? 'collapsed' : ''}">
                    ${files.map(file => `
                        <div class="file-tab ${file.id === state.activeFileId ? 'active' : ''}" 
                             onclick="switchFile(${file.id})">
                            <i class="fab ${getLanguageIcon(file.type)}" 
                               style="color: ${getLanguageColor(file.type)};"></i>
                            <span class="file-name">${file.name}</span>
                            <i class="fas fa-times close-tab" 
                               onclick="event.stopPropagation(); deleteFile(${file.id})"></i>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function toggleSection(group) {
    state.sectionCollapsed[group] = !state.sectionCollapsed[group];
    renderFileTabs();
    schedulePersistState();
}

function getLanguageIcon(type) {
    const icons = {
        html: 'fa-html5',
        css: 'fa-css3-alt',
        js: 'fa-js',
        python: 'fa-python',
        react: 'fa-react',
        node: 'fa-node-js',
        c: 'fa-c',
        cpp: 'fa-code',
        csharp: 'fa-code',
        java: 'fa-java',
        json: 'fa-brackets-curly',
        markdown: 'fa-markdown'
    };
    return icons[type] || 'fa-file';
}

function getLanguageColor(type) {
    return languageConfig[type]?.color || 'var(--text-secondary)';
}

// ==================== EDITOR TABS ====================
function renderEditorTabs() {
    editorTabsContainer.innerHTML = state.files.map(file => `
        <div class="editor-tab ${file.id === state.activeFileId ? 'active' : ''}"
             role="tab"
             aria-selected="${file.id === state.activeFileId}"
             tabindex="${file.id === state.activeFileId ? '0' : '-1'}"
             onclick="switchFile(${file.id})">
            <i class="fab ${getLanguageIcon(file.type)}" 
               style="color: ${getLanguageColor(file.type)};"></i>
            <span>${file.name}</span>
            <i class="fas fa-download close-editor-tab" 
               title="Export file"
               onclick="event.stopPropagation(); exportFile(${file.id})"></i>
            <i class="fas fa-times close-editor-tab" 
               onclick="event.stopPropagation(); closeEditorTab(${file.id})"></i>
        </div>
    `).join('');
}

function closeEditorTab(fileId) {
    if (state.files.length <= 1) {
        showToast('Cannot close the last file', 'warning');
        return;
    }
    deleteFile(fileId);
}

function exportFile(fileId) {
    const file = state.files.find(f => f.id === fileId);
    if (!file) return;

    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name || 'download.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${file.name}`, 'success');
}

// ==================== EDITORS ====================
function renderEditors() {
    editorContent.innerHTML = state.files.map(file => `
        <div class="code-editor ${file.id === state.activeFileId ? 'active' : ''}" 
             id="editor-${file.id}">
            <div class="editor-wrapper">
                <div class="line-numbers" id="lines-${file.id}"></div>
                <textarea id="code-${file.id}" 
                          data-type="${file.type}"
                          oninput="updateLineNumbers(${file.id}); onCodeChange(${file.id})"
                          onscroll="syncScroll(${file.id})"
                          onkeydown="handleTabKey(event, ${file.id})"
                          spellcheck="false">${escapeHtml(file.content)}</textarea>
            </div>
        </div>
    `).join('');
    
    state.files.forEach(file => {
        updateLineNumbers(file.id);
        primeHistory(file.id, file.content);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateLineNumbers(fileId) {
    const textarea = document.getElementById(`code-${fileId}`);
    const linesDiv = document.getElementById(`lines-${fileId}`);
    const lines = textarea.value.split('\n').length;
    linesDiv.innerHTML = Array(lines).fill(0).map((_, i) => i + 1).join('<br>');
}

function syncScroll(fileId) {
    const textarea = document.getElementById(`code-${fileId}`);
    const linesDiv = document.getElementById(`lines-${fileId}`);
    linesDiv.scrollTop = textarea.scrollTop;
}

// ==================== VS CODE STYLE TAB HANDLING ====================
function handleTabKey(event, fileId) {
    const textarea = document.getElementById(`code-${fileId}`);
    const file = state.files.find(f => f.id === fileId);
    const tabSize = languageConfig[file?.type]?.tabSize || 4;

    // Tab key - insert spaces
    if (event.key === 'Tab') {
        event.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const spaces = ' '.repeat(tabSize);
        
        textarea.value = textarea.value.substring(0, start) + spaces + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + tabSize;
        onCodeChange(fileId);
    }

    // Enter key - maintain indentation
    if (event.key === 'Enter') {
        event.preventDefault();
        const start = textarea.selectionStart;
        const value = textarea.value;
        
        // Find current line's indentation
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const currentLine = value.substring(lineStart, start);
        const indentation = currentLine.match(/^(\s*)/)[0];

        // Auto-wrap bare tag names into <tag></tag>
        const trimmed = currentLine.trim();
        const tagMatch = trimmed.match(/^([A-Za-z][\w-]*)$/);
        if (tagMatch && HTML_TAG_SET.has(tagMatch[1].toLowerCase())) {
            const tag = tagMatch[1];
            const isVoid = HTML_VOID_TAGS.has(tag.toLowerCase());
            const openTag = `<${tag}>`;
            const closeTag = isVoid ? '' : `</${tag}>`;
            const innerIndent = indentation + ' '.repeat(tabSize);

            const before = value.substring(0, lineStart);
            const after = value.substring(start);
            const newContent = isVoid
                ? `${before}${indentation}${openTag}${after}`
                : `${before}${indentation}${openTag}\n${innerIndent}\n${indentation}${closeTag}${after}`;

            textarea.value = newContent;
            const cursorPos = isVoid
                ? (before + indentation + openTag).length
                : (before + indentation + openTag + '\n' + innerIndent).length;
            textarea.selectionStart = textarea.selectionEnd = cursorPos;
            updateLineNumbers(fileId);
            onCodeChange(fileId);
            return;
        }
        
        // Check for auto-indent (if line ends with { or similar)
        const prevChar = value[start - 1];
        const nextChar = value[start];
        let additionalIndent = '';
        
        if (prevChar === '{' || prevChar === ':' || prevChar === '(') {
            additionalIndent = ' '.repeat(tabSize);
        }
        
        // Insert new line with indentation
        const newLine = '\n' + indentation + additionalIndent;
        textarea.value = value.substring(0, start) + newLine + value.substring(start);
        
        // Set cursor position
        const newCursorPos = start + newLine.length;
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
        
        // Handle auto-close brackets
        if (prevChar === '{' && nextChar === '}') {
            // Move cursor inside the brackets
            textarea.selectionStart = textarea.selectionEnd = start + 1;
        }
        
        updateLineNumbers(fileId);
        onCodeChange(fileId);
    }

    // Auto-close brackets and quotes
    const pairs = { '(': ')', '{': '}', '[': ']', '"': '"', "'": "'", '`': '`' };
    if (pairs[event.key]) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        if (selectedText) {
            // Wrap selection
            event.preventDefault();
            textarea.value = textarea.value.substring(0, start) + 
                event.key + selectedText + pairs[event.key] + 
                textarea.value.substring(end);
            textarea.selectionStart = start + 1;
            textarea.selectionEnd = end + 1;
            onCodeChange(fileId);
        }
    }

    // Auto-close HTML/JSX tags on '>'
    if (event.key === '>' && (file?.type === 'html' || file?.type === 'react')) {
        const cursor = textarea.selectionStart;
        const before = textarea.value.substring(0, cursor);
        const match = before.match(/<([A-Za-z][\w-]*)([^<>]*?)$/);
        const voidTags = ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'];

        if (match) {
            const tagName = match[1];
            const attrs = match[2] || '';
            const isClosing = match[0].includes('</');
            const selfClosed = attrs.trim().endsWith('/') || voidTags.includes(tagName.toLowerCase());

            if (!isClosing && !selfClosed) {
                event.preventDefault();
                const closing = `</${tagName}>`;
                const newValue = `${before}>${closing}${textarea.value.substring(cursor)}`;
                textarea.value = newValue;
                const newPos = cursor + 1; // place cursor between open and close
                textarea.selectionStart = textarea.selectionEnd = newPos;
                updateLineNumbers(fileId);
                onCodeChange(fileId);
            }
        }
    }
}

// ==================== FORMATTER ====================
async function formatCurrentFile() {
    const file = state.files.find(f => f.id === state.activeFileId);
    if (!file) return;

    const formatted = await formatContent(file.type, file.content);
    if (formatted == null) {
        showToast('Formatting not available for this file type', 'warning');
        return;
    }

    file.content = formatted;
    const textarea = document.getElementById(`code-${file.id}`);
    if (textarea) {
        textarea.value = formatted;
        updateLineNumbers(file.id);
    }

    updatePreview();
    showToast('Formatted', 'success');
    recordHistory(file.id);
    schedulePersistState();
}

async function formatContent(type, content) {
    if (!content) return content;
    const clean = content.replace(/\r\n/g, '\n');

    // Try Prettier first
    const prettierResult = await formatWithPrettier(type, clean);
    if (prettierResult !== null) return prettierResult;

    if (type === 'python') {
        const pythonResult = await formatPythonWithBlack(clean);
        if (pythonResult !== null) return pythonResult;
    }

    // Fallback lightweight formatter if Prettier unavailable
    if (type === 'js' || type === 'css' || type === 'react' || type === 'node' || type === 'c' || type === 'cpp' || type === 'csharp' || type === 'java') {
        return formatBraced(clean, 4);
    }
    if (type === 'html') {
        return formatHtml(clean, 2);
    }
    return null;
}

function formatBraced(content, indentSize = 4) {
    const lines = content.split('\n');
    let indent = 0;
    const result = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';

        const closing = /^([}\]]|\)\s*;?|case\b|default\b)/.test(trimmed);
        if (closing) {
            indent = Math.max(indent - 1, 0);
        }

        const indented = ' '.repeat(indent * indentSize) + trimmed;

        const openCount = (trimmed.match(/[({\[]/g) || []).length;
        const closeCount = (trimmed.match(/[)}\]]/g) || []).length;
        indent += Math.max(openCount - closeCount, 0);

        return indented;
    });

    return result.join('\n');
}

function formatHtml(content, indentSize = 2) {
    const tokens = content.split(/(<[^>]+>)/g).filter(t => t.trim() !== '');
    const voidTags = ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'];
    let indent = 0;
    const out = tokens.map(tok => {
        const trimmed = tok.trim();
        const isClosing = /^<\//.test(trimmed);
        const tagName = trimmed.match(/^<\/?\s*([a-zA-Z0-9-]+)/)?.[1]?.toLowerCase();
        const isVoid = voidTags.includes(tagName) || /\/>$/.test(trimmed) || /^<!/.test(trimmed) || /^<script/i.test(trimmed) || /^<style/i.test(trimmed);

        if (isClosing) {
            indent = Math.max(indent - 1, 0);
        }

        const line = ' '.repeat(indent * indentSize) + trimmed;

        if (!isClosing && !isVoid && /^<[^>]+>$/.test(trimmed)) {
            indent += 1;
        }

        return line;
    });

    return out.join('\n');
}

// ==================== HISTORY (UNDO/REDO) ====================
function primeHistory(fileId, initialContent = '') {
    if (!historyStore[fileId]) {
        historyStore[fileId] = {
            stack: [{ content: initialContent, selectionStart: 0, selectionEnd: 0 }],
            pointer: 0
        };
    }
}

function recordHistory(fileId) {
    primeHistory(fileId);
    const textarea = document.getElementById(`code-${fileId}`);
    if (!textarea) return;
    const entry = {
        content: textarea.value,
        selectionStart: textarea.selectionStart,
        selectionEnd: textarea.selectionEnd
    };
    const hist = historyStore[fileId];
    const current = hist.stack[hist.pointer];
    if (current && current.content === entry.content && current.selectionStart === entry.selectionStart && current.selectionEnd === entry.selectionEnd) {
        return;
    }

    if (hist.pointer < hist.stack.length - 1) {
        hist.stack = hist.stack.slice(0, hist.pointer + 1);
    }

    hist.stack.push(entry);
    hist.pointer = hist.stack.length - 1;

    const MAX_HISTORY = 200;
    if (hist.stack.length > MAX_HISTORY) {
        hist.stack.shift();
        hist.pointer = hist.stack.length - 1;
    }
}

function applyHistoryEntry(fileId, entry) {
    const textarea = document.getElementById(`code-${fileId}`);
    if (!textarea) return;
    isRestoringHistory = true;
    textarea.value = entry.content;
    textarea.selectionStart = entry.selectionStart;
    textarea.selectionEnd = entry.selectionEnd;
    const file = state.files.find(f => f.id === fileId);
    if (file) file.content = entry.content;
    updateLineNumbers(fileId);
    updatePreview();
    schedulePersistState();
    isRestoringHistory = false;
}

function undoInEditor(fileId) {
    const hist = historyStore[fileId];
    if (!hist || hist.pointer <= 0) return false;
    hist.pointer -= 1;
    applyHistoryEntry(fileId, hist.stack[hist.pointer]);
    return true;
}

function redoInEditor(fileId) {
    const hist = historyStore[fileId];
    if (!hist || hist.pointer >= hist.stack.length - 1) return false;
    hist.pointer += 1;
    applyHistoryEntry(fileId, hist.stack[hist.pointer]);
    return true;
}

// ==================== FILE OPERATIONS ====================
function switchFile(fileId) {
    state.activeFileId = fileId;
    renderFileTabs();
    renderEditorTabs();
    renderEditors();
    schedulePersistState();
}

function deleteFile(fileId) {
    if (state.files.length <= 1) {
        showToast('Cannot delete the last file!', 'warning');
        return;
    }
    if (confirm('Are you sure you want to delete this file?')) {
        state.files = state.files.filter(f => f.id !== fileId);
        if (state.activeFileId === fileId) {
            state.activeFileId = state.files[0].id;
        }
        delete historyStore[fileId];
        renderFileTabs();
        renderEditorTabs();
        renderEditors();
        updatePreview();
        showToast('File deleted', 'success');
        schedulePersistState();
    }
}

function openAddFileModal() {
    addFileModal.classList.add('active');
    document.getElementById('newFileName').focus();
    selectFileType('html');
}

function closeAddFileModal() {
    addFileModal.classList.remove('active');
    document.getElementById('newFileName').value = '';
}

function openInfoModal() {
    const modal = document.getElementById('infoModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeInfoModal() {
    const modal = document.getElementById('infoModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function createNewFile() {
    const nameInput = document.getElementById('newFileName');
    let fileName = nameInput.value.trim();
    const fileType = state.selectedFileType;
    const config = languageConfig[fileType];

    if (!fileName) {
        showToast('Please enter a file name', 'warning');
        return;
    }

    // Auto-add extension if not present
    if (!fileName.includes('.')) {
        fileName = `${fileName}${config.extension}`;
    }

    const newFile = {
        id: Date.now(),
        name: fileName,
        type: fileType,
        content: getDefaultContent(fileType)
    };

    state.files.push(newFile);
    state.activeFileId = newFile.id;
    primeHistory(newFile.id, newFile.content);
    if (fileType === 'markdown') {
        openMarkdownCompiler(newFile.content, newFile.name);
    }
    
    closeAddFileModal();
    renderFileTabs();
    renderEditorTabs();
    renderEditors();
    updatePreview();
    showToast(`Created ${fileName}`, 'success');
    schedulePersistState();
}

function getDefaultContent(type) {
    const defaults = {
        html: '<!DOCTYPE html>\n<html>\n<head>\n    <title>New Page</title>\n</head>\n<body>\n    <!-- Your content here -->\n</body>\n</html>',
        css: '/* Styles here */\n\n.selector {\n    \n}',
        js: '// JavaScript code here\n\n',
        python: '# Python code here\n\ndef main():\n    \n\nif __name__ == "__main__":\n    main()',
        json: '{\n    "key": "value"\n}',
        markdown: '# Title\n\n## Section\n\n- Item 1\n- Item 2'
    };
    return defaults[type] || '// Your code here\n';
}

// ==================== CODE COMPILATION ====================
function onCodeChange(fileId) {
    if (isRestoringHistory) return;
    const file = state.files.find(f => f.id === fileId);
    if (file) {
        file.content = document.getElementById(`code-${fileId}`).value;
    }

    recordHistory(fileId);
    schedulePersistState();
}

function updatePreview() {
    const htmlFile = state.files.find(f => f.type === 'html');
    const cssFiles = state.files.filter(f => f.type === 'css');
    const jsFiles = state.files.filter(f => f.type === 'js');

    let html = htmlFile ? htmlFile.content : '<h1>No HTML file</h1>';
    let css = cssFiles.map(f => f.content).join('\n');
    let js = jsFiles.map(f => f.content).join('\n');

    const source = `
        <!DOCTYPE html>
        <html>
            <head>
                <style>${css}</style>
            </head>
            <body>
                ${html}
                <script>
                    // Intercept console methods
                    const originalLog = console.log;
                    const originalWarn = console.warn;
                    const originalError = console.error;
                    const originalInfo = console.info;
                    
                    console.log = function(...args) {
                        window.parent.postMessage({type: 'console', level: 'log', args: args}, '*');
                        originalLog.apply(console, args);
                    };
                    
                    console.warn = function(...args) {
                        window.parent.postMessage({type: 'console', level: 'warn', args: args}, '*');
                        originalWarn.apply(console, args);
                    };
                    
                    console.error = function(...args) {
                        window.parent.postMessage({type: 'console', level: 'error', args: args}, '*');
                        originalError.apply(console, args);
                    };
                    
                    console.info = function(...args) {
                        window.parent.postMessage({type: 'console', level: 'info', args: args}, '*');
                        originalInfo.apply(console, args);
                    };
                    
                    // Error handler
                    window.onerror = function(msg, url, line) {
                        window.parent.postMessage({type: 'console', level: 'error', args: [msg + ' (Line: ' + line + ')']}, '*');
                    };
                    
                    ${js}
                <\/script>
            </body>
        </html>
    `;

    const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    doc.open();
    doc.write(source);
    doc.close();
}

async function runCode() {
    ensureOutputPanelsVisible();
    updatePreview();
    await runPythonBackend();
    showToast('Code executed!', 'success');
}

function refreshPreview() {
    updatePreview();
    showToast('Preview refreshed', 'success');
}

function openInNewTab() {
    const htmlFile = state.files.find(f => f.type === 'html');
    const cssFiles = state.files.filter(f => f.type === 'css');
    const jsFiles = state.files.filter(f => f.type === 'js');

    let html = htmlFile ? htmlFile.content : '';
    let css = cssFiles.map(f => f.content).join('\n');
    let js = jsFiles.map(f => f.content).join('\n');

    const source = `
        <!DOCTYPE html>
        <html>
            <head>
                <style>${css}</style>
            </head>
            <body>
                ${html}
                <script>${js}<\/script>
            </body>
        </html>
    `;

    const blob = new Blob([source], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    showToast('Opened in new tab', 'success');
}

function ensureOutputPanelsVisible() {
    if (!state.previewVisible) {
        state.previewVisible = true;
        applyPreviewLayout();
    }

    if (!state.consoleVisible) {
        state.consoleVisible = true;
        applyConsoleHeight();
        updateConsoleToggleIcon();
    }
}

// ==================== PREVIEW VISIBILITY ====================
function applyPreviewLayout() {
    if (state.previewVisible) {
        previewArea.classList.remove('hidden');
        mainResizer.classList.remove('hidden');
        editorArea.classList.remove('full-width');

        const editorWidth = 100 - state.previewWidthPercent;
        editorArea.style.width = `${editorWidth}%`;
        previewArea.style.width = `${state.previewWidthPercent}%`;
    } else {
        previewArea.classList.add('hidden');
        mainResizer.classList.add('hidden');
        editorArea.classList.add('full-width');

        editorArea.style.width = '100%';
        previewArea.style.width = '0%';
    }

    updatePreviewToggleIcon();
    updatePreviewToggleAria();
    applyConsoleHeight();
}

function togglePreviewArea() {
    state.previewVisible = !state.previewVisible;
    applyPreviewLayout();
    showToast(state.previewVisible ? 'Preview shown' : 'Preview hidden', 'info');
    schedulePersistState();
}

function updatePreviewToggleIcon() {
    if (!previewToggleIcon) return;
    previewToggleIcon.className = state.previewVisible ? 'fas fa-eye' : 'fas fa-eye-slash';
}

function updatePreviewToggleAria() {
    const previewToggleButton = document.getElementById('previewToggleButton');
    if (previewToggleButton) {
        previewToggleButton.setAttribute('aria-pressed', String(state.previewVisible));
    }
}

// ==================== PYTHON BACKEND ====================
async function loadPyodideOnce() {
    if (pyodideReadyPromise) return pyodideReadyPromise;

    pyodideReadyPromise = new Promise((resolve, reject) => {
        addConsoleLog('info', ['Loading Pyodide (Python runtime)...']);
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        script.onload = async () => {
            try {
                const pyodide = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/' });
                addConsoleLog('success', ['Pyodide ready']);
                resolve(pyodide);
            } catch (err) {
                addConsoleLog('error', ['Pyodide init failed', String(err)]);
                reject(err);
            }
        };
        script.onerror = () => {
            addConsoleLog('error', ['Failed to load Pyodide script']);
            reject(new Error('Pyodide script load failed'));
        };
        document.head.appendChild(script);
    });

    return pyodideReadyPromise;
}

async function runPythonBackend() {
    const pythonFiles = state.files.filter(f => f.type === 'python');
    if (!pythonFiles.length) return; // Nothing to run

    const code = pythonFiles.map(f => f.content).join('\n\n');
    if (!code.trim()) return;

    let pyodide;
    try {
        pyodide = await loadPyodideOnce();
    } catch (err) {
        // Loading already logged; stop here
        return;
    }

    const consoleBridge = `import sys, js\n\nclass _Writer:\n    def __init__(self, level):\n        self.level = level\n    def write(self, s):\n        if s.strip():\n            js.addConsoleLog(self.level, [s])\n    def flush(self):\n        pass\n\nsys.stdout = _Writer('log')\nsys.stderr = _Writer('error')\n`;

    try {
        const result = await pyodide.runPythonAsync(consoleBridge + '\n' + code);
        if (typeof result !== 'undefined') {
            addConsoleLog('log', ['Python result:', String(result)]);
        }
    } catch (err) {
        addConsoleLog('error', ['Python error:', String(err)]);
    }
}

// ==================== CONSOLE ====================
function setupConsoleIntercept() {
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'console') {
            addConsoleLog(event.data.level, event.data.args);
        }
    });
}

function addConsoleLog(level, args) {
    const timestamp = new Date().toLocaleTimeString();
    const message = args.map(arg => {
        if (typeof arg === 'object') {
            try {
                return JSON.stringify(arg, null, 2);
            } catch (e) {
                return String(arg);
            }
        }
        return String(arg);
    }).join(' ');

    const logElement = document.createElement('div');
    logElement.className = `console-log ${level}`;
    logElement.innerHTML = `
        <span class="timestamp">[${timestamp}]</span>
        <span>${escapeHtml(message)}</span>
    `;
    
    consoleOutput.appendChild(logElement);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function applyConsoleHeight() {
    if (!consolePanel || !consoleResizer) return;
    if (!state.previewVisible) {
        consolePanel.style.height = '0px';
        consolePanel.classList.add('collapsed');
        consoleResizer.classList.add('hidden');
        consoleResizer.classList.remove('active');
        updateConsoleResizerAria(CONSOLE_MIN_HEIGHT, CONSOLE_MIN_HEIGHT, CONSOLE_MIN_HEIGHT);
        hideConsoleHint();
        return;
    }

    previewArea.classList.toggle('console-only', state.consoleExpanded);

    if (state.consoleExpanded) {
        consolePanel.style.height = '100%';
        consolePanel.classList.remove('collapsed');
        consoleResizer.classList.add('hidden');
        hideConsoleHint();
        updateConsoleResizerAria(100, 0, 100);
        return;
    }

    const maxHeight = getConsoleMaxHeight();
    const clamped = Math.min(maxHeight, Math.max(CONSOLE_MIN_HEIGHT, state.consoleHeight || DEFAULT_CONSOLE_HEIGHT));
    state.consoleHeight = clamped;

    const visible = state.consoleVisible;
    consolePanel.style.height = visible ? `${clamped}px` : '0px';
    consolePanel.classList.toggle('collapsed', !visible);
    consoleResizer.classList.toggle('hidden', !visible);
    if (!visible) {
        consoleResizer.classList.remove('active');
    }

    updateConsoleResizerAria(clamped, CONSOLE_MIN_HEIGHT, maxHeight);
    positionConsoleHint(clamped);
}

function setupConsoleResizer() {
    if (!consoleResizer) return;
    let isResizing = false;
    let startY = 0;
    let startHeight = DEFAULT_CONSOLE_HEIGHT;

    consoleResizer.addEventListener('mousedown', (e) => {
        if (!state.consoleVisible) return;
        isResizing = true;
        startY = e.clientY;
        startHeight = state.consoleHeight || DEFAULT_CONSOLE_HEIGHT;
        document.body.style.cursor = 'row-resize';
        consoleResizer.classList.add('active');
        showConsoleHint(startHeight);
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing || !state.consoleVisible) return;
        const delta = startY - e.clientY;
        const target = startHeight + delta;
        const maxHeight = getConsoleMaxHeight();
        const newHeight = Math.max(CONSOLE_MIN_HEIGHT, Math.min(maxHeight, target));
        state.consoleHeight = newHeight;
        applyConsoleHeight();
    });

    document.addEventListener('mouseup', () => {
        if (!isResizing) return;
        isResizing = false;
        document.body.style.cursor = 'default';
        consoleResizer.classList.remove('active');
        hideConsoleHint();
        schedulePersistState();
    });

    consoleResizer.addEventListener('dblclick', () => {
        state.consoleHeight = Math.min(getConsoleMaxHeight(), DEFAULT_CONSOLE_HEIGHT);
        applyConsoleHeight();
        schedulePersistState();
    });

    consoleResizer.addEventListener('keydown', (e) => {
        if (!state.consoleVisible) return;
        const fast = e.shiftKey;
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            adjustConsoleHeightBy(fast ? CONSOLE_KEYSTEP_FAST : CONSOLE_KEYSTEP);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            adjustConsoleHeightBy(fast ? -CONSOLE_KEYSTEP_FAST : -CONSOLE_KEYSTEP);
        } else if (e.key === 'Home') {
            e.preventDefault();
            state.consoleHeight = CONSOLE_MIN_HEIGHT;
            applyConsoleHeight();
            schedulePersistState();
        } else if (e.key === 'End') {
            e.preventDefault();
            state.consoleHeight = getConsoleMaxHeight();
            applyConsoleHeight();
            schedulePersistState();
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            state.consoleHeight = Math.min(getConsoleMaxHeight(), DEFAULT_CONSOLE_HEIGHT);
            applyConsoleHeight();
            schedulePersistState();
        }
    });
}

function toggleConsole() {
    state.consoleVisible = !state.consoleVisible;
    if (!state.consoleVisible) {
        state.consoleExpanded = false;
    }
    applyConsoleHeight();
    updateConsoleToggleIcon();
    updateConsoleFocusIcon();
    schedulePersistState();
}

function updateConsoleToggleIcon() {
    const icon = document.getElementById('consoleToggleIcon');
    if (icon) {
        icon.className = state.consoleVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
    }
    document.querySelectorAll('.console-toggle-btn').forEach(btn => {
        btn.setAttribute('aria-pressed', String(state.consoleVisible));
    });
}

function toggleConsoleFocus() {
    if (!state.consoleVisible) {
        state.consoleVisible = true;
    }
    state.consoleExpanded = !state.consoleExpanded;
    applyConsoleHeight();
    updateConsoleFocusIcon();
    schedulePersistState();
}

function updateConsoleFocusIcon() {
    const btn = document.getElementById('consoleFocusButton');
    if (btn) {
        btn.setAttribute('aria-pressed', String(state.consoleExpanded));
    }
    if (consoleFocusIcon) {
        consoleFocusIcon.className = state.consoleExpanded ? 'fas fa-compress-alt' : 'fas fa-expand-alt';
    }
}

function adjustConsoleHeightBy(delta) {
    const maxHeight = getConsoleMaxHeight();
    const next = Math.min(maxHeight, Math.max(CONSOLE_MIN_HEIGHT, (state.consoleHeight || DEFAULT_CONSOLE_HEIGHT) + delta));
    state.consoleHeight = next;
    applyConsoleHeight();
    schedulePersistState();
}

function getConsoleMaxHeight() {
    const headerHeight = document.querySelector('.preview-header')?.offsetHeight || 0;
    const resizerHeight = consoleResizer?.offsetHeight || 0;
    const areaHeight = previewArea?.clientHeight || 0;
    const available = Math.max(0, areaHeight - headerHeight - resizerHeight - 24);
    return Math.max(CONSOLE_MIN_HEIGHT, available * CONSOLE_MAX_RATIO);
}

function updateConsoleResizerAria(value, min, max) {
    if (!consoleResizer) return;
    consoleResizer.setAttribute('aria-valuenow', Math.round(value));
    consoleResizer.setAttribute('aria-valuemin', Math.round(min));
    consoleResizer.setAttribute('aria-valuemax', Math.round(max));
}

async function loadPrettierOnce() {
    if (prettierReadyPromise) return prettierReadyPromise;

    const loadScript = (src) => new Promise((resolve, reject) => {
        const existing = Array.from(document.scripts).find(s => s.src === src);
        if (existing) {
            if (existing.dataset.loaded === 'true') return resolve();
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)));
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.dataset.loaded = 'false';
        script.onload = () => {
            script.dataset.loaded = 'true';
            resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
    });

    prettierReadyPromise = (async () => {
        await loadScript(PRETTIER_CORE_URL);
        await loadScript(PRETTIER_HTML_PARSER_URL);
        await loadScript(PRETTIER_BABEL_PARSER_URL);
        await loadScript(PRETTIER_POSTCSS_PARSER_URL);
        await loadScript(PRETTIER_MARKDOWN_PARSER_URL);

        if (!globalThis.prettier || !globalThis.prettier.format || !globalThis.prettierPlugins) {
            throw new Error('Prettier failed to initialize');
        }
        return globalThis.prettier;
    })();

    try {
        return await prettierReadyPromise;
    } catch (err) {
        prettierReadyPromise = null;
        return Promise.reject(err);
    }
}

async function formatWithPrettier(type, content) {
    const parserMap = {
        html: 'html',
        css: 'css',
        js: 'babel',
        json: 'json',
        react: 'babel',
        markdown: 'markdown'
    };

    const parser = parserMap[type];
    if (!parser) return null;

    try {
        const prettier = await loadPrettierOnce();
        const tabWidth = languageConfig[type]?.tabSize || 2;
        return prettier.format(content, {
            parser,
            plugins: globalThis.prettierPlugins,
            tabWidth,
            useTabs: false,
            bracketSpacing: true,
            semi: true
        });
    } catch (err) {
        addConsoleLog('warn', ['Prettier format failed, using fallback formatter.', String(err?.message || err)]);
        return null;
    }
}

async function ensureBlackLoaded(pyodide) {
    if (blackReadyPromise) return blackReadyPromise;
    blackReadyPromise = (async () => {
        await pyodide.loadPackage('micropip');
        await pyodide.runPythonAsync(
            "import micropip\nawait micropip.install('black==23.12.1')"
        );
    })();

    try {
        return await blackReadyPromise;
    } catch (err) {
        blackReadyPromise = null;
        throw err;
    }
}

async function formatPythonWithBlack(content) {
    try {
        const pyodide = await loadPyodideOnce();
        await ensureBlackLoaded(pyodide);
        const pyCode = `import black\nfrom black.mode import Mode\nresult = black.format_str(${JSON.stringify(content)}, mode=Mode())`;
        const result = await pyodide.runPythonAsync(pyCode + "\nresult");
        return typeof result === 'string' ? result : String(result);
    } catch (err) {
        addConsoleLog('warn', ['Black formatting failed, falling back.', String(err?.message || err)]);
        return null;
    }
}

function showConsoleHint(height) {
    if (!consoleResizeHint || !state.consoleVisible) return;
    consoleResizeHint.textContent = `${Math.round(height)} px`;
    consoleResizeHint.classList.add('visible');
    positionConsoleHint(height);
}

function hideConsoleHint() {
    if (!consoleResizeHint) return;
    consoleResizeHint.classList.remove('visible');
}

function positionConsoleHint(height) {
    if (!consoleResizeHint || !previewArea) return;
    const resizerHeight = consoleResizer?.offsetHeight || 0;
    const areaHeight = previewArea.clientHeight || 0;
    const offsetFromBottom = (state.consoleVisible ? height : 0) + resizerHeight + 8;
    const top = Math.max(8, areaHeight - offsetFromBottom);
    consoleResizeHint.style.top = `${top}px`;
}

function clearConsole() {
    consoleOutput.innerHTML = '';
    showToast('Console cleared', 'success');
}

// ==================== AUTO-RUN ====================
function setupAutoRun() {
    // Auto-run is handled by debounce on code change
}

// ==================== TOAST NOTIFICATION ====================
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = `toast ${type} show`;
    
    const icon = toast.querySelector('i');
    icon.className = type === 'success' ? 'fas fa-check-circle' :
                    type === 'error' ? 'fas fa-exclamation-circle' :
                    type === 'warning' ? 'fas fa-exclamation-triangle' :
                    'fas fa-info-circle';
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// ==================== CLEAR ALL ====================
function clearAll() {
    if (confirm('Are you sure you want to clear all code?')) {
        resetWorkspaceToDefaults();
        localStorage.removeItem(APP_STATE_KEY);
        renderEditors();
        renderFileTabs();
        renderEditorTabs();
        updatePreview();
        clearConsole();
        schedulePersistState();
        showToast('All files cleared', 'success');
    }
}

// ==================== RESIZER (Editor/Preview) ====================
function setupResizer() {
    let isResizing = false;

    mainResizer.addEventListener('mousedown', () => {
        if (!state.previewVisible) return;
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        mainResizer.style.background = 'var(--accent)';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing || !state.previewVisible) return;
        
        const containerWidth = document.querySelector('.main-container').clientWidth;
        const sidebarWidth = getLeftSidebarWidth();
        const availableWidth = containerWidth - sidebarWidth;
        if (availableWidth <= 0) return;

        const newEditorWidth = (((e.clientX - sidebarWidth) / availableWidth) * 100);
        
        if (newEditorWidth > 20 && newEditorWidth < 80) {
            editorArea.style.width = `${newEditorWidth}%`;
            previewArea.style.width = `${100 - newEditorWidth}%`;
            state.previewWidthPercent = 100 - newEditorWidth;
        }
    });

    document.addEventListener('mouseup', () => {
        isResizing = false;
        document.body.style.cursor = 'default';
        mainResizer.style.background = 'var(--border-color)';
    });

    mainResizer.addEventListener('dblclick', () => {
        if (!state.previewVisible) return;
        state.previewWidthPercent = 50;
        applyPreviewLayout();
    });
}

// ==================== RESIZER (Sidebar) ====================
function setupSidebarResizer() {
    let isResizing = false;

    sidebarResizer.addEventListener('mousedown', () => {
        if (!state.sidebarVisible) return;
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        sidebarResizer.classList.add('active');
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const panelWidth = e.clientX - ACTIVITY_BAR_WIDTH;
        applySidebarWidth(panelWidth);
    });

    document.addEventListener('mouseup', () => {
        if (!isResizing) return;
        isResizing = false;
        document.body.style.cursor = 'default';
        sidebarResizer.classList.remove('active');
    });
}

// ==================== KEYBOARD SHORTCUTS ====================
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const target = e.target;

        // Ctrl/Cmd + Z - Undo
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
            const handled = tryHistoryAction(target, 'undo');
            if (handled) {
                e.preventDefault();
                return;
            }
        }

        // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y - Redo
        if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key.toLowerCase() === 'z') || e.key.toLowerCase() === 'y')) {
            const handled = tryHistoryAction(target, 'redo');
            if (handled) {
                e.preventDefault();
                return;
            }
        }

        // Ctrl/Cmd + B - Toggle current sidebar panel (VS Code style)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            switchSidebarTab(state.activeSidebarTab);
        }

        // Ctrl/Cmd + S - Run code
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            runCode();
        }
        
        // Ctrl/Cmd + Enter - Run code
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            runCode();
        }

        // Ctrl/Cmd + Shift + P - Toggle preview
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            togglePreviewArea();
        }

        // Ctrl/Cmd + Shift + F - Format current file
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            formatCurrentFile();
        }
        
        // F5 - Refresh preview
        if (e.key === 'F5') {
            e.preventDefault();
            refreshPreview();
        }
        
        // Escape - Close modal
        if (e.key === 'Escape') {
            closeAddFileModal();
            closeInfoModal();
        }
    });
}

function tryHistoryAction(target, action) {
    if (!(target instanceof HTMLTextAreaElement) || !target.id.startsWith('code-')) return false;
    const fileId = Number(target.id.replace('code-', ''));
    return action === 'undo' ? undoInEditor(fileId) : redoInEditor(fileId);
}

// ==================== START APPLICATION ====================
init();
