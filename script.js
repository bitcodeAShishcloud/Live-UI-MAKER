// ==================== STATE MANAGEMENT ====================
const DEFAULT_FILES = [
    { id: 1, name: 'index.html', type: 'html', content: '<!DOCTYPE html>\n<html>\n<head>\n    <title>My App</title>\n</head>\n<body>\n    <h1>Hello World! 🚀</h1>\n    <p>Welcome to Live Compiler Pro</p>\n    <button onclick="sayHello()">Click Me</button>\n    <div id="output"></div>\n</body>\n</html>' },
    { id: 2, name: 'styles.css', type: 'css', content: 'body {\n    font-family: Arial, sans-serif;\n    padding: 40px;\n    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n    color: white;\n    min-height: 100vh;\n}\n\nh1 {\n    font-size: 2.5rem;\n    margin-bottom: 15px;\n}\n\nbutton {\n    padding: 12px 24px;\n    background: white;\n    color: #667eea;\n    border: none;\n    border-radius: 6px;\n    cursor: pointer;\n    font-size: 1rem;\n    font-weight: 600;\n    transition: transform 0.2s;\n}\n\nbutton:hover {\n    transform: scale(1.05);\n}' },
    { id: 3, name: 'script.js', type: 'js', content: 'function sayHello() {\n    console.log("Hello from Live Compiler! 🎉");\n    document.getElementById("output").innerHTML = \n        "<p style=\\\'color: #4caf50; margin-top: 20px;\\\'>Button clicked! Check console.</p>";\n}\n\nconsole.log("Script loaded successfully ✅");\nconsole.warn("This is a warning ⚠️");\nconsole.error("This is an error ❌");' }
];

const APP_STATE_KEY = 'liveCompilerProStateV1';
const APP_STATE_TTL_MS = 30 * 60 * 1000;

function getDefaultFilesCopy() {
    return JSON.parse(JSON.stringify(DEFAULT_FILES));
}

const state = {
    files: getDefaultFilesCopy(),
    activeFileId: 1,
    selectedFileType: 'html',
    consoleVisible: true,
    sidebarVisible: true,
    autoRun: true,
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
    react: { icon: 'fa-react', color: 'var(--react-color)', extension: '.jsx', tabSize: 4 },
    node: { icon: 'fa-node-js', color: 'var(--node-color)', extension: '.js', tabSize: 4 },
    c: { icon: 'fa-c', color: 'var(--c-color)', extension: '.c', tabSize: 4 },
    cpp: { icon: 'fa-code', color: 'var(--cpp-color)', extension: '.cpp', tabSize: 4 },
    csharp: { icon: 'fa-code', color: 'var(--csharp-color)', extension: '.cs', tabSize: 4 },
    java: { icon: 'fa-java', color: 'var(--java-color)', extension: '.java', tabSize: 4 },
    json: { icon: 'fa-brackets-curly', color: 'var(--warning)', extension: '.json', tabSize: 2 },
    markdown: { icon: 'fa-markdown', color: 'var(--text-primary)', extension: '.md', tabSize: 2 }
};

// File type groups for sidebar
const fileGroups = {
    'Web': ['html', 'css', 'js', 'react', 'node'],
    'Backend': ['python', 'java', 'node'],
    'System': ['c', 'cpp', 'csharp'],
    'Other': ['json', 'markdown']
};

// Width constraints for resizable sidebar
const SIDEBAR_MIN_WIDTH = 180;
const SIDEBAR_MAX_WIDTH = 420;
const ACTIVITY_BAR_WIDTH = 52;

// ==================== DOM ELEMENTS ====================
const fileTabsContainer = document.getElementById('fileTabs');
const addFileBtn = document.getElementById('addFileBtn');
const editorTabsContainer = document.getElementById('editorTabs');
const editorContent = document.getElementById('editorContent');
const previewFrame = document.getElementById('previewFrame');
const previewArea = document.getElementById('previewArea');
const mainResizer = document.getElementById('resizer');
const previewToggleIcon = document.getElementById('previewToggleIcon');
const consoleOutput = document.getElementById('consoleOutput');
const consolePanel = document.getElementById('consolePanel');
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

function persistStateNow() {
    const payload = {
        savedAt: Date.now(),
        state: {
            files: state.files,
            activeFileId: state.activeFileId,
            selectedFileType: state.selectedFileType,
            consoleVisible: state.consoleVisible,
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
        if (typeof savedState.autoRun === 'boolean') state.autoRun = savedState.autoRun;
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
    setupSidebarResizer();
    setupResizer();
    setupKeyboardShortcuts();

    if (!state.consoleVisible) {
        consolePanel.classList.add('collapsed');
        const icon = document.getElementById('consoleToggleIcon');
        icon.className = 'fas fa-chevron-up';
    }

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
        jsx: 'react',
        tsx: 'react',
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
             onclick="switchFile(${file.id})">
            <i class="fab ${getLanguageIcon(file.type)}" 
               style="color: ${getLanguageColor(file.type)};"></i>
            <span>${file.name}</span>
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
        react: 'import React from "react";\n\nfunction Component() {\n    return (\n        <div>\n            \n        </div>\n    );\n}\n\nexport default Component;',
        node: 'const express = require("express");\nconst app = express();\n\napp.get("/", (req, res) => {\n    res.send("Hello World!");\n});\n\napp.listen(3000);',
        c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
        cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
        csharp: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}',
        java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
        json: '{\n    "key": "value"\n}',
        markdown: '# Title\n\n## Section\n\n- Item 1\n- Item 2'
    };
    return defaults[type] || '// Your code here\n';
}

// ==================== CODE COMPILATION ====================
let debounceTimer = null;

function onCodeChange(fileId) {
    const file = state.files.find(f => f.id === fileId);
    if (file) {
        file.content = document.getElementById(`code-${fileId}`).value;
    }

    // Debounce - wait 1 second after last keystroke
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        if (state.autoRun) {
            updatePreview();
            showToast('Auto-compiled', 'success');
        }
    }, 1000);

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
        consolePanel.classList.remove('collapsed');
        const icon = document.getElementById('consoleToggleIcon');
        icon.className = 'fas fa-chevron-down';
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

function toggleConsole() {
    state.consoleVisible = !state.consoleVisible;
    consolePanel.classList.toggle('collapsed', !state.consoleVisible);
    
    const icon = document.getElementById('consoleToggleIcon');
    icon.className = state.consoleVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
    schedulePersistState();
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
        
        // F5 - Refresh preview
        if (e.key === 'F5') {
            e.preventDefault();
            refreshPreview();
        }
        
        // Escape - Close modal
        if (e.key === 'Escape') {
            closeAddFileModal();
        }
    });
}

// ==================== START APPLICATION ====================
init();
