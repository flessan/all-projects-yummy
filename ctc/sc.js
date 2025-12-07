/*
  Code Text Cleaner Pro - GitHub Dark Mode Edition
  Features: text utils, code cleaner, html decoder, combine/split, regex tester, find/replace, drag & drop, syntax highlighting
  Author: Thio Saputra
*/

(() => {
  // --- State Management
  const state = {
    currentTool: 'text',
    theme: 'dark',
    findReplace: {
      isActive: false,
      currentMatch: -1,
      matches: []
    },
    autoSave: {
      enabled: true,
      interval: 30000, // 30 seconds
      lastSaved: null
    },
    settings: {
      wordWrap: true,
      lineNumbers: true,
      autoSave: true
    }
  };

  // --- Utility Functions
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const toastEl = $('#toast');
  
  // Safe localStorage wrapper
  const storage = (() => {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return localStorage;
    } catch (e) {
      return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      };
    }
  })();
  
  // Toast notification system
  function toast(msg, type = 'info', timeout = 3000) {
    toastEl.textContent = msg;
    toastEl.className = 'toast';
    toastEl.classList.add(type);
    toastEl.classList.remove('hidden');
    setTimeout(() => toastEl.classList.add('show'), 10);
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.classList.add('hidden'), 250);
    }, timeout);
  }

  // --- Navigation
  const navItems = $$('.nav-item');
  
  function switchTool(tool) {
    state.currentTool = tool;
    
    // Update active state
    navItems.forEach(item => item.classList.remove('active'));
    $(`.nav-item[data-tool="${tool}"]`).classList.add('active');
    
    // Show corresponding panel
    $$('.panel').forEach(panel => panel.classList.toggle('active', panel.dataset.tool === tool));
    
    // Save current tool to storage
    storage.setItem('ctcpro:currentTool', tool);
  }
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tool = item.dataset.tool;
      switchTool(tool);
    });
  });

  // --- Theme Management
  const themeToggle = $('#themeToggle');
  
  function toggleTheme() {
    const body = document.body;
    const isDark = !body.classList.contains('light-theme');
    
    if (isDark) {
      body.classList.remove('light-theme');
      state.theme = 'dark';
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      toast('Switched to dark theme', 'success');
    } else {
      body.classList.add('light-theme');
      state.theme = 'light';
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      toast('Switched to light theme', 'success');
    }
    
    storage.setItem('ctcpro:theme', state.theme);
  }
  
  themeToggle.addEventListener('click', toggleTheme);
  
  // Load saved theme
  const savedTheme = storage.getItem('ctcpro:theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    state.theme = 'light';
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }

  // --- Line numbers functionality
  function updateLineNumbers(textarea, lineNumbersId) {
    const lineNumbers = $(lineNumbersId);
    if (!lineNumbers) return;
    
    const lines = textarea.value.split('\n').length;
    let numbers = '';
    for (let i = 1; i <= lines; i++) {
      numbers += i + '\n';
    }
    lineNumbers.textContent = numbers;
    
    // Adjust width based on number of digits
    const digitCount = lines.toString().length;
    const width = Math.max(40, digitCount * 8 + 20);
    lineNumbers.style.width = width + 'px';
    
    // Adjust padding of editor
    textarea.style.paddingLeft = width + 10 + 'px';
  }

  // Setup line numbers for all textareas
  const textareas = $$('textarea.editor');
  
  textareas.forEach(textarea => {
    const lineNumbersId = textarea.id + 'LineNumbers';
    const lineNumbers = $(lineNumbersId);
    
    if (lineNumbers) {
      // Initial update
      updateLineNumbers(textarea, lineNumbersId);
      
      // Update on input
      textarea.addEventListener('input', () => {
        updateLineNumbers(textarea, lineNumbersId);
      });
      
      // Sync scroll
      textarea.addEventListener('scroll', () => {
        lineNumbers.scrollTop = textarea.scrollTop;
      });
    }
  });

  // --- Find and Replace functionality
  const findReplaceBtn = $('#findReplaceBtn');
  const findReplaceContainer = $('#findReplaceContainer');
  const closeFindReplace = $('#closeFindReplace');
  const findInput = $('#findInput');
  const replaceInput = $('#replaceInput');
  const findNextBtn = $('#findNextBtn');
  const findPrevBtn = $('#findPrevBtn');
  const replaceBtn = $('#replaceBtn');
  const replaceAllBtn = $('#replaceAllBtn');
  const findReplaceInfo = $('#findReplaceInfo');
  
  let currentEditor = null;
  let highlightedEditor = null;
  
  function showFindReplace() {
    findReplaceContainer.style.display = 'block';
    findInput.focus();
    state.findReplace.isActive = true;
    
    // Set current editor based on active panel
    const activePanel = $('.panel.active');
    if (activePanel) {
      const editor = activePanel.querySelector('textarea.editor:not([readonly])');
      if (editor) {
        currentEditor = editor;
      }
    }
  }
  
  function hideFindReplace() {
    findReplaceContainer.style.display = 'none';
    state.findReplace.isActive = false;
    
    // Remove highlights if any
    if (highlightedEditor) {
      removeHighlights(highlightedEditor);
      highlightedEditor = null;
    }
  }
  
  function highlightMatches(editor, searchTerm) {
    if (!editor || !searchTerm) return 0;
    
    // Remove previous highlights
    removeHighlights(editor);
    
    const text = editor.value;
    const regex = new RegExp(escapeRegExp(searchTerm), 'g');
    const matches = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    if (matches.length > 0) {
      // Store matches in state
      state.findReplace.matches = matches;
      
      // Create a wrapper div to contain the highlighted content
      const wrapper = document.createElement('div');
      wrapper.className = 'editor-highlight-wrapper';
      wrapper.style.position = 'relative';
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      
      // Create a pre element to maintain formatting
      const pre = document.createElement('pre');
      pre.className = 'editor-highlight-pre';
      pre.style.position = 'absolute';
      pre.style.top = '0';
      pre.style.left = '0';
      pre.style.width = '100%';
      pre.style.height = '100%';
      pre.style.margin = '0';
      pre.style.padding = '0';
      pre.style.overflow = 'hidden';
      pre.style.pointerEvents = 'none';
      pre.style.zIndex = '1';
      pre.style.whiteSpace = 'pre-wrap';
      pre.style.wordBreak = 'break-all';
      
      // Clone the textarea's styles
      const computedStyle = getComputedStyle(editor);
      pre.style.fontFamily = computedStyle.fontFamily;
      pre.style.fontSize = computedStyle.fontSize;
      pre.style.lineHeight = computedStyle.lineHeight;
      pre.style.paddingTop = computedStyle.paddingTop;
      pre.style.paddingLeft = computedStyle.paddingLeft;
      
      // Create spans for each line
      const lines = text.split('\n');
      let html = '';
      let charIndex = 0;
      
      lines.forEach((line, lineIndex) => {
        html += `<div class="highlight-line" style="height: ${parseInt(computedStyle.lineHeight)}px; min-height: ${parseInt(computedStyle.lineHeight)}px;">`;
        
        // Add highlights for this line
        let lineStart = charIndex;
        let lineEnd = lineStart + line.length;
        
        let lastIndex = 0;
        let highlighted = false;
        
        matches.forEach(match => {
          if (match.start >= lineStart && match.end <= lineEnd) {
            const startPos = match.start - lineStart;
            const endPos = match.end - lineStart;
            
            // Add text before highlight
            if (startPos > lastIndex) {
              html += `<span>${escapeHtml(line.substring(lastIndex, startPos))}</span>`;
            }
            
            // Add highlight
            html += `<span class="highlight-match" style="background-color: rgba(255, 230, 0, 0.3);">${escapeHtml(line.substring(startPos, endPos))}</span>`;
            
            lastIndex = endPos;
            highlighted = true;
          }
        });
        
        // Add remaining text if any
        if (lastIndex < line.length) {
          html += `<span>${escapeHtml(line.substring(lastIndex))}</span>`;
        }
        
        // If no highlights in this line, add the whole line
        if (!highlighted) {
          html += `<span>${escapeHtml(line)}</span>`;
        }
        
        html += `</div>`;
        charIndex += line.length + 1; // +1 for the newline character
      });
      
      pre.innerHTML = html;
      wrapper.appendChild(pre);
      
      // Insert the wrapper before the editor
      editor.parentNode.insertBefore(wrapper, editor);
      
      // Store reference to highlighted editor
      highlightedEditor = editor;
      
      return matches.length;
    }
    
    return 0;
  }
  
  function removeHighlights(editor) {
    const wrapper = editor.parentNode.querySelector('.editor-highlight-wrapper');
    if (wrapper) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function findInEditor(direction = 'next') {
    if (!currentEditor || !findInput.value) return;
    
    const searchText = findInput.value;
    const text = currentEditor.value;
    const currentIndex = currentEditor.selectionStart;
    
    // Highlight all matches
    const matchCount = highlightMatches(currentEditor, searchText);
    
    let matchIndex = -1;
    let match;
    
    if (direction === 'next') {
      // Find next match after current cursor position
      for (let i = 0; i < state.findReplace.matches.length; i++) {
        if (state.findReplace.matches[i].start >= currentIndex) {
          matchIndex = i;
          break;
        }
      }
      
      // If no match found after cursor, wrap around to first match
      if (matchIndex === -1 && state.findReplace.matches.length > 0) {
        matchIndex = 0;
      }
    } else {
      // Find previous match before current cursor position
      for (let i = state.findReplace.matches.length - 1; i >= 0; i--) {
        if (state.findReplace.matches[i].start < currentIndex) {
          matchIndex = i;
          break;
        }
      }
      
      // If no match found before cursor, wrap around to last match
      if (matchIndex === -1 && state.findReplace.matches.length > 0) {
        matchIndex = state.findReplace.matches.length - 1;
      }
    }
    
    if (matchIndex !== -1) {
      match = state.findReplace.matches[matchIndex];
      currentEditor.focus();
      currentEditor.setSelectionRange(match.start, match.end);
      
      // Scroll to match
      const lineHeight = parseInt(getComputedStyle(currentEditor).lineHeight);
      const cursorLine = text.substring(0, match.start).split('\n').length - 1;
      const visibleLines = Math.floor(currentEditor.clientHeight / lineHeight);
      const scrollTop = cursorLine * lineHeight - Math.floor(visibleLines / 2) * lineHeight;
      
      currentEditor.scrollTop = Math.max(0, scrollTop);
      
      state.findReplace.currentMatch = matchIndex;
      findReplaceInfo.textContent = `Match ${matchIndex + 1} of ${matchCount}`;
    } else {
      findReplaceInfo.textContent = 'No matches found';
    }
  }
  
  function replaceInEditor() {
    if (!currentEditor || !findInput.value) return;
    
    const searchText = findInput.value;
    const replaceText = replaceInput.value;
    const selectionStart = currentEditor.selectionStart;
    const selectionEnd = currentEditor.selectionEnd;
    const selectedText = currentEditor.value.substring(selectionStart, selectionEnd);
    
    if (selectedText === searchText) {
      const before = currentEditor.value.substring(0, selectionStart);
      const after = currentEditor.value.substring(selectionEnd);
      currentEditor.value = before + replaceText + after;
      
      // Update cursor position
      const newCursorPos = selectionStart + replaceText.length;
      currentEditor.setSelectionRange(newCursorPos, newCursorPos);
      
      // Re-highlight matches
      highlightMatches(currentEditor, searchText);
      
      findReplaceInfo.textContent = 'Replaced 1 occurrence';
    } else {
      findReplaceInfo.textContent = 'No match at cursor position';
    }
  }
  
  function replaceAllInEditor() {
    if (!currentEditor || !findInput.value) return;
    
    const searchText = findInput.value;
    const replaceText = replaceInput.value;
    const regex = new RegExp(escapeRegExp(searchText), 'g');
    const originalValue = currentEditor.value;
    const newValue = originalValue.replace(regex, replaceText);
    
    if (originalValue !== newValue) {
      currentEditor.value = newValue;
      const matchCount = (originalValue.match(regex) || []).length;
      
      // Re-highlight matches
      highlightMatches(currentEditor, searchText);
      
      findReplaceInfo.textContent = `Replaced ${matchCount} occurrences`;
    } else {
      findReplaceInfo.textContent = 'No matches found';
    }
  }
  
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  findReplaceBtn.addEventListener('click', showFindReplace);
  closeFindReplace.addEventListener('click', hideFindReplace);
  findNextBtn.addEventListener('click', () => findInEditor('next'));
  findPrevBtn.addEventListener('click', () => findInEditor('prev'));
  replaceBtn.addEventListener('click', replaceInEditor);
  replaceAllBtn.addEventListener('click', replaceAllInEditor);
  
  // Keyboard shortcuts for find/replace
  findInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        findInEditor('prev');
      } else {
        findInEditor('next');
      }
    } else if (e.key === 'Escape') {
      hideFindReplace();
    }
  });
  
  replaceInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      replaceInEditor();
    } else if (e.key === 'Escape') {
      hideFindReplace();
    }
  });

  // --- Clipboard helper function
  function copyToClipboard(text) {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      return new Promise((resolve, reject) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const result = document.execCommand('copy');
          if (result) {
            resolve();
          } else {
            reject(new Error('Unable to copy'));
          }
        } catch (e) {
          reject(e);
        } finally {
          document.body.removeChild(textArea);
        }
      });
    }
  }

  // --- Drag & Drop functionality
  function setupDragAndDrop() {
    const dropTargets = $$('.editor');
    
    dropTargets.forEach(target => {
      target.addEventListener('dragover', (e) => {
        e.preventDefault();
        target.classList.add('drag-over');
      });
      
      target.addEventListener('dragleave', () => {
        target.classList.remove('drag-over');
      });
      
      target.addEventListener('drop', (e) => {
        e.preventDefault();
        target.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          const file = files[0];
          const reader = new FileReader();
          
          reader.onload = (event) => {
            target.value = event.target.result;
            
            // Update line numbers
            const lineNumbersId = target.id + 'LineNumbers';
            updateLineNumbers(target, lineNumbersId);
            
            // Show success message
            toast(`File "${file.name}" loaded successfully`, 'success');
          };
          
          reader.onerror = () => {
            toast('Error reading file', 'error');
          };
          
          reader.readAsText(file);
        }
      });
    });
  }

  // Initialize drag and drop
  setupDragAndDrop();

  // --- Auto-save functionality
  function setupAutoSave() {
    if (!state.settings.autoSave) return;
    
    setInterval(() => {
      const activePanel = $('.panel.active');
      if (!activePanel) return;
      
      const editors = activePanel.querySelectorAll('textarea.editor:not([readonly])');
      const data = {};
      
      editors.forEach(editor => {
        data[editor.id] = editor.value;
      });
      
      storage.setItem('ctcpro:autosave:' + state.currentTool, JSON.stringify(data));
      state.autoSave.lastSaved = new Date();
    }, state.autoSave.interval);
  }
  
  function loadAutoSavedData() {
    const data = storage.getItem('ctcpro:autosave:' + state.currentTool);
    if (!data) return;
    
    try {
      const parsedData = JSON.parse(data);
      
      Object.keys(parsedData).forEach(editorId => {
        const editor = $(`#${editorId}`);
        if (editor && !editor.value) {
          editor.value = parsedData[editorId];
          
          // Update line numbers
          const lineNumbersId = editorId + 'LineNumbers';
          updateLineNumbers(editor, lineNumbersId);
        }
      });
    } catch (e) {
      console.error('Error loading auto-saved data:', e);
    }
  }

  // Initialize auto-save
  setupAutoSave();

  // Load auto-saved data when switching tools
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      setTimeout(loadAutoSavedData, 100);
    });
  });

  // --- TEXT TOOLS
  const inputText = $('#inputText');
  const outputText = $('#outputText');
  const wordCount = $('#wordCount');
  const charCount = $('#charCount');
  const lineCount = $('#lineCount');
  
  function updateCounts(txt) {
    const chars = txt.length;
    const words = (txt.trim().match(/\S+/g) || []).length;
    const lines = txt.split('\n').length;
    
    charCount.textContent = chars;
    wordCount.textContent = words;
    lineCount.textContent = lines;
  }

  function transformText(action) {
    let t = inputText.value;
    
    switch (action) {
      case 'lower':
        t = t.toLowerCase();
        break;
      case 'upper':
        t = t.toUpperCase();
        break;
      case 'title':
        t = t.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        break;
      case 'trimspaces':
        t = t.replace(/[ \t]{2,}/g, ' ');
        break;
      case 'reverse':
        t = t.split('').reverse().join('');
        break;
      case 'sort':
        t = t.split('\n').sort().join('\n');
        break;
      case 'removeEmptyLines':
        t = t.replace(/^\s*\n/gm, '').replace(/\n\s*$/gm, '');
        break;
      case 'removeDuplicateLines':
        const lines = t.split('\n');
        const uniqueLines = [...new Set(lines)];
        t = uniqueLines.join('\n');
        break;
      case 'addLineNumbers':
        t = t.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n');
        break;
      case 'camelCase':
        t = t.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
          return index === 0 ? word.toLowerCase() : word.toUpperCase();
        }).replace(/\s+/g, '');
        break;
      case 'snake_case':
        t = t.replace(/\s+/g, '_').toLowerCase();
        break;
      case 'kebab-case':
        t = t.replace(/\s+/g, '-').toLowerCase();
        break;
      case 'PascalCase':
        t = t.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
          return word.toUpperCase();
        }).replace(/\s+/g, '');
        break;
    }
    
    outputText.value = t;
    updateCounts(t);
    toast('Transformation complete', 'success');
  }

  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => transformText(btn.dataset.action));
  });

  inputText.addEventListener('input', e => {
    updateCounts(inputText.value);
  });

  $('#copyOutput').addEventListener('click', async () => {
    try {
      await copyToClipboard(outputText.value || inputText.value);
      toast('Copied to clipboard', 'success');
    } catch (e) {
      toast('Failed to copy', 'error');
    }
  });

  $('#downloadTxt').addEventListener('click', () => {
    const txt = outputText.value || inputText.value;
    if (!txt) return toast('No text to download', 'warning');
    
    const encoding = $('#textEncoding')?.value || 'utf-8';
    downloadBlob(txt, 'text/plain;charset=' + encoding, 'output.txt');
    toast('Downloading output.txt', 'success');
  });

  // prettify JSON
  $('#prettyJson').addEventListener('click', () => {
    const s = inputText.value.trim();
    if (!s) return toast('Enter JSON in input', 'warning');
    try {
      const obj = JSON.parse(s);
      outputText.value = JSON.stringify(obj, null, 2);
      updateCounts(outputText.value);
      toast('JSON prettified successfully', 'success');
    } catch (e) {
      toast('Invalid JSON: ' + e.message, 'error');
    }
  });

  // Base64 encode
  $('#base64Encode').addEventListener('click', () => {
    const s = inputText.value.trim();
    if (!s) return toast('Enter text to encode', 'warning');
    try {
      outputText.value = btoa(unescape(encodeURIComponent(s)));
      updateCounts(outputText.value);
      toast('Text encoded to Base64', 'success');
    } catch (e) {
      toast('Encoding failed', 'error');
    }
  });

  // Base64 decode
  $('#base64Decode').addEventListener('click', () => {
    const s = inputText.value.trim();
    if (!s) return toast('Enter Base64 to decode', 'warning');
    try {
      outputText.value = decodeURIComponent(escape(atob(s)));
      updateCounts(outputText.value);
      toast('Base64 decoded successfully', 'success');
    } catch (e) {
      toast('Invalid Base64', 'error');
    }
  });

  // URL encode
  $('#urlEncode').addEventListener('click', () => {
    const s = inputText.value.trim();
    if (!s) return toast('Enter text to encode', 'warning');
    try {
      outputText.value = encodeURIComponent(s);
      updateCounts(outputText.value);
      toast('Text URL encoded', 'success');
    } catch (e) {
      toast('Encoding failed', 'error');
    }
  });

  // URL decode
  $('#urlDecode').addEventListener('click', () => {
    const s = inputText.value.trim();
    if (!s) return toast('Enter URL to decode', 'warning');
    try {
      outputText.value = decodeURIComponent(s);
      updateCounts(outputText.value);
      toast('URL decoded', 'success');
    } catch (e) {
      toast('Invalid URL encoding', 'error');
    }
  });

  // Paste functionality
  $('#pasteText').addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      inputText.value = text;
      updateCounts(text);
      toast('Text pasted from clipboard', 'success');
    } catch (e) {
      toast('Failed to paste', 'error');
    }
  });

  // --- CODE CLEANER
  const codeInput = $('#codeInput');
  const codeOutput = $('#codeOutput');
  
  function removeCommentsCSSJS(s) {
    // Remove multi-line comments (/* ... */)
    s = s.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove single-line comments (// ...)
    s = s.replace(/(^|\n)\s*\/\/.*$/gm, '');
    return s;
  }
  
  function minifyHTML(html) {
    // Remove HTML comments
    html = html.replace(/<!--[\s\S]*?-->/g, '');
    // Remove whitespace between tags
    html = html.replace(/>\s+</g, '><');
    // Remove multiple spaces
    html = html.replace(/\s{2,}/g, ' ');
    return html.trim();
  }
  
  function cleanCSS(s) {
    s = removeCommentsCSSJS(s);
    // Remove multiple spaces and newlines
    s = s.replace(/\s+/g, ' ');
    // Remove spaces around special characters
    s = s.replace(/\s*([{}:;,])\s*/g, '$1');
    return s.trim();
  }
  
  function cleanJS(s) {
    s = removeCommentsCSSJS(s);
    // Remove multiple spaces and newlines, but keep some structure
    s = s.replace(/\n\s*/g, '\n');
    s = s.replace(/;\s*/g, ';\n');
    return s.trim();
  }
  
  function formatHTMLbasic(s) {
    // Add line breaks between tags
    s = s.replace(/></g, '>\n<');
    // Remove multiple empty lines
    s = s.replace(/\n\s*\n/g, '\n');
    return s.trim();
  }
  
  function formatCSS(css) {
    // Add line breaks after rules and properties
    css = css.replace(/}/g, '}\n');
    css = css.replace(/{/g, ' {\n  ');
    css = css.replace(/;/g, ';\n  ');
    // Remove empty lines
    css = css.replace(/\n\s+\n/g, '\n');
    return css.trim();
  }
  
  function formatJS(js) {
    // Add line breaks after braces and semicolons
    js = js.replace(/{/g, ' {\n  ');
    js = js.replace(/}/g, '\n}');
    js = js.replace(/;/g, ';\n');
    return js.trim();
  }

  $('[data-code-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const act = btn.dataset.codeAction;
      let src = codeInput.value;
      let out = '';
      
      switch (act) {
        case 'minify-html':
          out = minifyHTML(src);
          break;
        case 'minify-css':
          out = cleanCSS(src);
          break;
        case 'minify-js':
          out = cleanJS(src);
          break;
        case 'remove-comments':
          out = removeCommentsCSSJS(src);
          break;
      }
      
      codeOutput.value = out;
      // Update line numbers for output
      updateLineNumbers(codeOutput, 'codeOutputLineNumbers');
      toast('Operation completed', 'success');
    });
  });

  $('#formatHtml').addEventListener('click', () => {
    codeOutput.value = formatHTMLbasic(codeInput.value);
    // Update line numbers for output
    updateLineNumbers(codeOutput, 'codeOutputLineNumbers');
    toast('HTML formatted', 'success');
  });

  $('#formatCss').addEventListener('click', () => {
    codeOutput.value = formatCSS(codeInput.value);
    // Update line numbers for output
    updateLineNumbers(codeOutput, 'codeOutputLineNumbers');
    toast('CSS formatted', 'success');
  });

  $('#formatJs').addEventListener('click', () => {
    codeOutput.value = formatJS(codeInput.value);
    // Update line numbers for output
    updateLineNumbers(codeOutput, 'codeOutputLineNumbers');
    toast('JavaScript formatted', 'success');
  });

  $('#beautifyJson').addEventListener('click', () => {
    const s = codeInput.value.trim();
    if (!s) return toast('Enter JSON in input', 'warning');
    try {
      const obj = JSON.parse(s);
      codeOutput.value = JSON.stringify(obj, null, 2);
      // Update line numbers for output
      updateLineNumbers(codeOutput, 'codeOutputLineNumbers');
      toast('JSON beautified successfully', 'success');
    } catch (e) {
      toast('Invalid JSON: ' + e.message, 'error');
    }
  });

  $('#copyCode').addEventListener('click', async () => {
    try {
      await copyToClipboard(codeOutput.value || codeInput.value);
      toast('Copied to clipboard', 'success');
    } catch (e) {
      toast('Failed to copy', 'error');
    }
  });

  $('#downloadCode').addEventListener('click', () => {
    const txt = codeOutput.value || codeInput.value;
    if (!txt) return toast('No code to download', 'warning');
    
    // try to guess extension
    let ext = 'txt';
    const sample = txt.slice(0, 200).toLowerCase();
    if (sample.includes('<html') || sample.includes('<!doctype')) ext = 'html';
    else if (sample.includes('{') && sample.includes('}')) ext = 'js';
    else if (sample.includes('{') && sample.includes('color')) ext = 'css';
    
    const encoding = $('#codeEncoding')?.value || 'utf-8';
    downloadBlob(txt, 'text/plain;charset=' + encoding, `code.${ext}`);
    toast('Downloading code.' + ext, 'success');
  });

  // Paste functionality for code
  $('#pasteCode').addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      codeInput.value = text;
      // Update line numbers for input
      updateLineNumbers(codeInput, 'codeInputLineNumbers');
      toast('Code pasted from clipboard', 'success');
    } catch (e) {
      toast('Failed to paste', 'error');
    }
  });

  // preview iframe for code
  $('#previewCode').addEventListener('click', () => {
    const src = codeOutput.value || codeInput.value;
    if (!src) return toast('No code to preview', 'warning');
    
    const previewWrap = $('#previewWrap');
    const iframe = $('#previewFrame');
    
    // if html fragment, wrap minimal
    let doc = src;
    if (!/<html/i.test(src)) {
      doc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${src}</body></html>`;
    }
    
    iframe.srcdoc = doc;
    previewWrap.classList.remove('hidden');
    toast('Preview ready', 'success');
  });

  $('#closePreview').addEventListener('click', () => {
    $('#previewWrap').classList.add('hidden');
    $('#previewFrame').srcdoc = 'about:blank';
  });

  // --- HTML ENTITY DECODER / ENCODER
  const encoded = $('#encoded');
  const decoded = $('#decoded');
  
  $('#decodeBtn').addEventListener('click', () => {
    decoded.value = decodeHTMLEntities(encoded.value);
    // Update line numbers for decoded output
    updateLineNumbers(decoded, 'decodedLineNumbers');
    toast('Decode complete', 'success');
  });
  
  $('#encodeBtn').addEventListener('click', () => {
    encoded.value = encodeHTMLEntities(decoded.value || encoded.value);
    // Update line numbers for encoded output
    updateLineNumbers(encoded, 'encodedLineNumbers');
    toast('Encode complete', 'success');
  });
  
  $('#copyDecoded').addEventListener('click', async () => {
    try {
      await copyToClipboard(decoded.value);
      toast('Copied to clipboard', 'success');
    } catch (e) {
      toast('Failed to copy', 'error');
    }
  });
  
  function decodeHTMLEntities(text) {
    // Create a temporary textarea element
    const txt = document.createElement('textarea');
    txt.innerHTML = text;
    return txt.value;
  }
  
  function encodeHTMLEntities(text) {
    // Create a temporary textarea element
    const txt = document.createElement('textarea');
    txt.textContent = text;
    return txt.innerHTML;
  }

  // --- COMBINE
  const combineHtml = $('#combineHtml');
  const combineCss = $('#combineCss');
  const combineJs = $('#combineJs');
  const combinedOutput = $('#combinedOutput');
  
  $('#combineBtn').addEventListener('click', () => {
    const htmlRaw = combineHtml.value || '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1"/>\n<title>Combined</title>\n</head>\n<body>\n</body>\n</html>';
    let doc;
    
    try {
      if (/<html/i.test(htmlRaw)) {
        doc = htmlRaw;
        
        // Add CSS if provided
        if (combineCss.value.trim()) {
          if (/<\/head>/i.test(doc)) {
            doc = doc.replace(/<\/head>/i, `  <style>\n${combineCss.value}\n  </style>\n</head>`);
          } else {
            // If no head tag, create one
            doc = doc.replace(/<html[^>]*>/i, '$&\n<head>\n  <style>\n' + combineCss.value + '\n  </style>\n</head>');
          }
        }
        
        // Add JS if provided
        if (combineJs.value.trim()) {
          if (/<\/body>/i.test(doc)) {
            doc = doc.replace(/<\/body>/i, `  <script>\n${combineJs.value}\n  </script>\n</body>`);
          } else {
            // If no body closing tag, add one
            doc += `\n<script>\n${combineJs.value}\n</script>\n</body>`;
          }
        }
      } else {
        // If not a full HTML document, create one
        doc = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1"/>\n<title>Combined</title>`;
        
        if (combineCss.value.trim()) {
          doc += `\n<style>\n${combineCss.value}\n</style>`;
        }
        
        doc += `\n</head>\n<body>\n${htmlRaw}`;
        
        if (combineJs.value.trim()) {
          doc += `\n<script>\n${combineJs.value}\n</script>`;
        }
        
        doc += `\n</body>\n</html>`;
      }
    } catch (e) {
      doc = htmlRaw;
      console.error('Error combining code:', e);
    }
    
    combinedOutput.value = doc;
    // Update line numbers for combined output
    updateLineNumbers(combinedOutput, 'combinedOutputLineNumbers');
    toast('Combine complete', 'success');
  });

  $('#copyCombined').addEventListener('click', async () => {
    try {
      await copyToClipboard(combinedOutput.value);
      toast('Combined code copied', 'success');
    } catch (e) {
      toast('Failed to copy', 'error');
    }
  });

  $('#downloadCombined').addEventListener('click', () => {
    const html = combinedOutput.value;
    if (!html) return toast('No combined code to download', 'warning');
    
    const encoding = $('#combinedEncoding')?.value || 'utf-8';
    downloadBlob(html, 'text/html;charset=' + encoding, 'combined.html');
    toast('Downloading combined.html', 'success');
  });

  // combined preview
  $('#previewCombined').addEventListener('click', () => {
    const html = combinedOutput.value;
    if (!html) return toast('No combined code to preview', 'warning');
    
    const wrap = $('#previewCombinedWrap');
    const ifr = $('#previewCombined');
    ifr.srcdoc = html;
    wrap.classList.remove('hidden');
    toast('Combined preview ready', 'success');
  });

  $('#closeCombinedPreview').addEventListener('click', () => {
    $('#previewCombinedWrap').classList.add('hidden');
    $('#previewCombined').srcdoc = 'about:blank';
  });

  // --- SPLIT
  const splitInput = $('#splitInput');
  const splitHtml = $('#splitHtml');
  const splitCss = $('#splitCss');
  const splitJs = $('#splitJs');
  
  $('#splitBtn').addEventListener('click', () => {
    const src = splitInput.value;
    if (!src) return toast('Enter HTML containing <style> / <script>', 'warning');
    
    // Extract CSS from style tags
    const styleMatches = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
    let css = styleMatches.map(m => m[1]).join('\n\n').trim();
    
    // Extract JavaScript from script tags
    const scriptMatches = [...src.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
    let js = scriptMatches.map(m => m[1]).join('\n\n').trim();
    
    // Remove style and script tags from HTML
    let htmlClean = src
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    
    // Update the output fields
    splitCss.value = css;
    splitJs.value = js;
    splitHtml.value = htmlClean.trim();
    
    // Update line numbers for all outputs
    updateLineNumbers(splitHtml, 'splitHtmlLineNumbers');
    updateLineNumbers(splitCss, 'splitCssLineNumbers');
    updateLineNumbers(splitJs, 'splitJsLineNumbers');
    
    toast('Split complete', 'success');
  });

  $('#downloadHtml').addEventListener('click', () => {
    const t = splitHtml.value;
    if (!t) return toast('No HTML to download', 'warning');
    
    const encoding = $('#splitEncoding')?.value || 'utf-8';
    downloadBlob(t, 'text/html;charset=' + encoding, 'split.html');
    toast('Downloading split.html', 'success');
  });

  $('#downloadCss').addEventListener('click', () => {
    const t = splitCss.value;
    if (!t) return toast('No CSS to download', 'warning');
    
    const encoding = $('#splitEncoding')?.value || 'utf-8';
    downloadBlob(t, 'text/css;charset=' + encoding, 'styles.css');
    toast('Downloading styles.css', 'success');
  });

  $('#downloadJs').addEventListener('click', () => {
    const t = splitJs.value;
    if (!t) return toast('No JavaScript to download', 'warning');
    
    const encoding = $('#splitEncoding')?.value || 'utf-8';
    downloadBlob(t, 'application/javascript;charset=' + encoding, 'script.js');
    toast('Downloading script.js', 'success');
  });

  // --- REGEX TESTER
  const regexPattern = $('#regexPattern');
  const regexTestText = $('#regexTestText');
  const regexResult = $('#regexResult');
  const regexMatchCount = $('#regexMatchCount');
  const regexTestTime = $('#regexTestTime');
  const regexFlags = $$('.regex-flag');
  
  let selectedFlags = new Set();
  
  // Toggle regex flags
  regexFlags.forEach(flag => {
    flag.addEventListener('click', () => {
      const flagValue = flag.dataset.flag;
      if (selectedFlags.has(flagValue)) {
        selectedFlags.delete(flagValue);
        flag.classList.remove('active');
      } else {
        selectedFlags.add(flagValue);
        flag.classList.add('active');
      }
    });
  });
  
  $('#testRegex').addEventListener('click', () => {
    const pattern = regexPattern.value;
    const text = regexTestText.value;
    
    if (!pattern) {
      toast('Please enter a regex pattern', 'warning');
      return;
    }
    
    const startTime = performance.now();
    
    try {
      const flags = Array.from(selectedFlags).join('');
      const regex = new RegExp(pattern, flags);
      
      // Find all matches
      const matches = [];
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push(match);
      }
      
      const endTime = performance.now();
      const testTime = (endTime - startTime).toFixed(2);
      
      // Highlight matches
      let highlightedText = text;
      if (matches.length > 0) {
        // Create a copy of the text to highlight
        let lastIndex = 0;
        let result = '';
        
        matches.forEach(match => {
          // Add text before the match
          result += escapeHtml(text.substring(lastIndex, match.index));
          
          // Add the highlighted match
          result += `<span class="regex-match">${escapeHtml(match[0])}</span>`;
          
          // Update the last index
          lastIndex = match.index + match[0].length;
        });
        
        // Add remaining text after the last match
        result += escapeHtml(text.substring(lastIndex));
        
        highlightedText = result;
      }
      
      regexResult.innerHTML = highlightedText || '<div class="empty-state">No matches found</div>';
      regexMatchCount.textContent = matches.length;
      regexTestTime.textContent = testTime + 'ms';
      
      toast('Regex test completed', 'success');
    } catch (e) {
      regexResult.innerHTML = `<div style="color: var(--accent-danger);">Invalid regex: ${e.message}</div>`;
      regexMatchCount.textContent = '0';
      regexTestTime.textContent = '0ms';
      toast('Invalid regex pattern', 'error');
    }
  });
  
  $('#clearRegex').addEventListener('click', () => {
    regexPattern.value = '';
    regexTestText.value = '';
    regexResult.innerHTML = '<div class="empty-state">Enter a regex pattern and click "Test" to see matches</div>';
    regexMatchCount.textContent = '0';
    regexTestTime.textContent = '0ms';
    selectedFlags.clear();
    regexFlags.forEach(flag => flag.classList.remove('active'));
    toast('Regex tester cleared', 'success');
  });
  
  $('#copyRegexResult').addEventListener('click', async () => {
    try {
      const resultText = regexResult.innerText;
      await copyToClipboard(resultText);
      toast('Regex result copied', 'success');
    } catch (e) {
      toast('Failed to copy', 'error');
    }
  });

  // --- TEXT COMPARISON TOOL
  const compareText1 = $('#compareText1');
  const compareText2 = $('#compareText2');
  const compareResult = $('#compareResult');
  const compareStats = $('#compareStats');
  
  $('#compareBtn').addEventListener('click', () => {
    const text1 = compareText1.value;
    const text2 = compareText2.value;
    
    if (!text1 || !text2) {
      toast('Please enter text in both fields', 'warning');
      return;
    }
    
    const diff = diffText(text1, text2);
    
    // Display diff
    compareResult.innerHTML = diff;
    
    // Calculate stats
    const lines1 = text1.split('\n').length;
    const lines2 = text2.split('\n').length;
    const chars1 = text1.length;
    const chars2 = text2.length;
    
    compareStats.innerHTML = `
      <div class="stat">
        <span class="stat-label">Text 1:</span>
        <span>${lines1} lines, ${chars1} chars</span>
      </div>
      <div class="stat">
        <span class="stat-label">Text 2:</span>
        <span>${lines2} lines, ${chars2} chars</span>
      </div>
    `;
    
    toast('Comparison complete', 'success');
  });
  
  function diffText(text1, text2) {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    
    const maxLines = Math.max(lines1.length, lines2.length);
    let result = '';
    
    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';
      
      if (line1 === line2) {
        // Lines are the same
        result += `<div class="diff-line same">${escapeHtml(line1)}</div>`;
      } else {
        // Lines are different
        if (line1) {
          result += `<div class="diff-line removed">- ${escapeHtml(line1)}</div>`;
        }
        if (line2) {
          result += `<div class="diff-line added">+ ${escapeHtml(line2)}</div>`;
        }
      }
    }
    
    return result;
  }

  // --- SYNTAX HIGHLIGHTING
  function applySyntaxHighlighting(textarea, language) {
    if (!textarea || !language) return;
    
    const code = textarea.value;
    let highlightedCode = '';
    
    switch (language) {
      case 'javascript':
      case 'js':
        highlightedCode = highlightJavaScript(code);
        break;
      case 'html':
        highlightedCode = highlightHTML(code);
        break;
      case 'css':
        highlightedCode = highlightCSS(code);
        break;
      case 'json':
        highlightedCode = highlightJSON(code);
        break;
      default:
        highlightedCode = escapeHtml(code);
    }
    
    // Create or update the highlighted display
    let highlightContainer = textarea.nextElementSibling;
    
    if (!highlightContainer || !highlightContainer.classList.contains('syntax-highlight')) {
      highlightContainer = document.createElement('div');
      highlightContainer.className = 'syntax-highlight';
      textarea.parentNode.insertBefore(highlightContainer, textarea.nextSibling);
    }
    
    // Copy textarea styles to highlight container
    const computedStyle = getComputedStyle(textarea);
    highlightContainer.style.width = computedStyle.width;
    highlightContainer.style.height = computedStyle.height;
    highlightContainer.style.fontFamily = computedStyle.fontFamily;
    highlightContainer.style.fontSize = computedStyle.fontSize;
    highlightContainer.style.lineHeight = computedStyle.lineHeight;
    highlightContainer.style.paddingTop = computedStyle.paddingTop;
    highlightContainer.style.paddingLeft = computedStyle.paddingLeft;
    highlightContainer.style.paddingRight = computedStyle.paddingRight;
    highlightContainer.style.paddingBottom = computedStyle.paddingBottom;
    highlightContainer.style.border = computedStyle.border;
    highlightContainer.style.borderRadius = computedStyle.borderRadius;
    highlightContainer.style.overflow = 'auto';
    highlightContainer.style.whiteSpace = 'pre-wrap';
    highlightContainer.style.wordBreak = 'break-all';
    highlightContainer.style.position = 'absolute';
    highlightContainer.style.top = textarea.offsetTop + 'px';
    highlightContainer.style.left = textarea.offsetLeft + 'px';
    highlightContainer.style.zIndex = '1';
    highlightContainer.style.pointerEvents = 'none';
    highlightContainer.style.backgroundColor = 'transparent';
    
    highlightContainer.innerHTML = highlightedCode;
    
    // Make textarea transparent so highlighted code shows through
    textarea.style.color = 'transparent';
    textarea.style.caretColor = 'auto'; // Keep cursor visible
    textarea.style.zIndex = '2';
    textarea.style.position = 'relative';
    
    // Sync scrolling
    textarea.addEventListener('scroll', () => {
      highlightContainer.scrollTop = textarea.scrollTop;
      highlightContainer.scrollLeft = textarea.scrollLeft;
    });
  }
  
  function highlightJavaScript(code) {
    // Simple JavaScript syntax highlighting
    return code
      .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>') // Single-line comments
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>') // Multi-line comments
      .replace(/(\b(function|var|let|const|if|else|for|while|do|switch|case|break|continue|return|try|catch|finally|class|extends|import|export|default|async|await|from|as|new|this|super|typeof|instanceof|in|of|true|false|null|undefined|void|with|debugger|delete)\b)/g, '<span class="keyword">$1</span>') // Keywords
      .replace(/(\b(console|Math|Array|Object|String|Number|Boolean|Date|RegExp|Promise|Set|Map|WeakSet|WeakMap|Symbol|JSON|parseInt|parseFloat|isNaN|isFinite|eval|decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|escape|unescape|setTimeout|setInterval|clearTimeout|clearInterval)\b)/g, '<span class="builtin">$1</span>') // Built-in objects and functions
      .replace(/(`.*?`)/g, '<span class="string">$1</span>') // Template literals
      .replace(/('.*?'|".*?")/g, '<span class="string">$1</span>') // Strings
      .replace(/(\b\d+\.?\d*|\.\d+\b)/g, '<span class="number">$1</span>') // Numbers
      .replace(/([+\-*/%=&|<>!~^?:;,.()[\]{}])/g, '<span class="operator">$1</span>'); // Operators and punctuation
  }
  
  function highlightHTML(code) {
    // Simple HTML syntax highlighting
    return code
      .replace(/(<!--[\s\S]*?-->)/g, '<span class="comment">$1</span>') // Comments
      .replace(/(&lt;\/?[a-zA-Z0-9]+&gt;)/g, '<span class="tag">$1</span>') // Tags
      .replace(/(&lt;[a-zA-Z0-9]+)(\s+[^&gt;]*?)?(&gt;)/g, '<span class="tag">$1</span><span class="attribute">$2</span><span class="tag">$3</span>') // Tags with attributes
      .replace(/([a-zA-Z0-9-]+)=(&quot;.*?&quot;|'.*?'|[^\s&gt;]+)/g, '<span class="attribute-name">$1</span>=<span class="attribute-value">$2</span>') // Attributes
      .replace(/(&amp;[a-zA-Z0-9#]+;)/g, '<span class="entity">$1</span>'); // Entities
  }
  
  function highlightCSS(code) {
    // Simple CSS syntax highlighting
    return code
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>') // Comments
      .replace(/(@[a-zA-Z-]+\b)/g, '<span class="at-rule">$1</span>') // At-rules
      .replace(/([a-zA-Z-]+\s*)(?=:)/g, '<span class="property">$1</span>') // Properties
      .replace(/(:\s*)([^;{}]+)/g, '$1<span class="value">$2</span>') // Values
      .replace(/([.#]?[a-zA-Z][a-zA-Z0-9_-]*)(?=\s*{)/g, '<span class="selector">$1</span>') // Selectors
      .replace(/(\{|\}|;|,)/g, '<span class="punctuation">$1</span>'); // Punctuation
  }
  
  function highlightJSON(code) {
    // Simple JSON syntax highlighting
    return code
      .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>') // Single-line comments (non-standard but common)
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>') // Multi-line comments (non-standard but common)
      .replace(/(".*?")(?=\s*:)/g, '<span class="key">$1</span>') // Keys
      .replace(/(:\s*)(".*?"|'.*?'|\d+\.?\d*|true|false|null)/g, '$1<span class="value">$2</span>') // Values
      .replace(/(\{|\}|\[|\]|,)/g, '<span class="punctuation">$1</span>'); // Punctuation
  }
  
  // Apply syntax highlighting to code editors
  function setupSyntaxHighlighting() {
    // Apply to code input/output when they change
    codeInput?.addEventListener('input', () => {
      applySyntaxHighlighting(codeInput, 'javascript');
    });
    
    codeOutput?.addEventListener('input', () => {
      applySyntaxHighlighting(codeOutput, 'javascript');
    });
    
    // Initial highlighting
    if (codeInput?.value) {
      applySyntaxHighlighting(codeInput, 'javascript');
    }
    
    if (codeOutput?.value) {
      applySyntaxHighlighting(codeOutput, 'javascript');
    }
  }
  
  // Initialize syntax highlighting
  setupSyntaxHighlighting();

  // --- Individual word wrap toggles for each editor
  function setupWordWrapToggle(buttonId, textareaId) {
    $(buttonId)?.addEventListener('click', () => {
      const textarea = $(textareaId);
      if (!textarea) return;
      
      textarea.classList.toggle('word-wrap');
      const isWrapped = textarea.classList.contains('word-wrap');
      toast(isWrapped ? 'Word wrap enabled' : 'Word wrap disabled', 'success');
      
      // Save setting
      state.settings.wordWrap = isWrapped;
      storage.setItem('ctcpro:settings', JSON.stringify(state.settings));
    });
  }
  
  setupWordWrapToggle('#toggleWordWrap', 'inputText');
  setupWordWrapToggle('#toggleCodeWordWrap', 'codeInput');
  setupWordWrapToggle('#toggleDecoderWordWrap', 'encoded');
  setupWordWrapToggle('#toggleCombineHtmlWordWrap', 'combineHtml');
  setupWordWrapToggle('#toggleCombineCssWordWrap', 'combineCss');
  setupWordWrapToggle('#toggleCombineJsWordWrap', 'combineJs');
  setupWordWrapToggle('#toggleCombinedOutputWordWrap', 'combinedOutput');
  setupWordWrapToggle('#toggleSplitInputWordWrap', 'splitInput');
  setupWordWrapToggle('#toggleSplitHtmlWordWrap', 'splitHtml');
  setupWordWrapToggle('#toggleSplitCssWordWrap', 'splitCss');
  setupWordWrapToggle('#toggleSplitJsWordWrap', 'splitJs');

  // --- Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + F: Find/Replace
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      showFindReplace();
    }
    
    // Ctrl/Cmd + T: Toggle Theme
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
      e.preventDefault();
      toggleTheme();
    }
    
    // Ctrl/Cmd + S: Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      const activePanel = $('.panel.active');
      if (activePanel) {
        const downloadBtn = activePanel.querySelector('[id^="download"]');
        if (downloadBtn) {
          downloadBtn.click();
        }
      }
    }
    
    // Escape: Close modals
    if (e.key === 'Escape') {
      if (state.findReplace.isActive) {
        hideFindReplace();
      }
      
      // Close any open preview
      const previewWraps = $$('.preview-container:not(.hidden)');
      previewWraps.forEach(wrap => {
        const closeBtn = wrap.querySelector('[id^="close"]');
        if (closeBtn) closeBtn.click();
      });
    }
    
    // Ctrl/Cmd + H: Show keyboard shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
      e.preventDefault();
      $('#shortcutsModal').classList.remove('hidden');
    }
  });

  // --- Keyboard Shortcuts Modal
  $('#closeShortcuts').addEventListener('click', () => {
    $('#shortcutsModal').classList.add('hidden');
  });

  // --- Settings Modal
  $('#settingsBtn').addEventListener('click', () => {
    $('#settingsModal').classList.remove('hidden');
    
    // Load current settings
    $('#autoSaveToggle').checked = state.settings.autoSave;
    $('#wordWrapToggle').checked = state.settings.wordWrap;
    $('#lineNumbersToggle').checked = state.settings.lineNumbers;
  });

  $('#closeSettings').addEventListener('click', () => {
    $('#settingsModal').classList.add('hidden');
  });

  $('#saveSettings').addEventListener('click', () => {
    // Update settings
    state.settings.autoSave = $('#autoSaveToggle').checked;
    state.settings.wordWrap = $('#wordWrapToggle').checked;
    state.settings.lineNumbers = $('#lineNumbersToggle').checked;
    
    // Save to storage
    storage.setItem('ctcpro:settings', JSON.stringify(state.settings));
    
    // Apply settings
    textareas.forEach(textarea => {
      if (state.settings.wordWrap) {
        textarea.classList.add('word-wrap');
      } else {
        textarea.classList.remove('word-wrap');
      }
    });
    
    const lineNumbers = $$('.line-numbers');
    lineNumbers.forEach(lineNumber => {
      lineNumber.style.display = state.settings.lineNumbers ? 'block' : 'none';
    });
    
    toast('Settings saved', 'success');
    $('#settingsModal').classList.add('hidden');
  });

  // --- Preview Device Mode
  $('#deviceMode').addEventListener('change', (e) => {
    const mode = e.target.value;
    const previewFrame = $('#previewFrame');
    
    switch (mode) {
      case 'desktop':
        previewFrame.style.width = '100%';
        previewFrame.style.height = '500px';
        break;
      case 'tablet':
        previewFrame.style.width = '768px';
        previewFrame.style.height = '1024px';
        break;
      case 'mobile':
        previewFrame.style.width = '375px';
        previewFrame.style.height = '667px';
        break;
    }
  });

  // --- Load saved settings
  const savedSettings = storage.getItem('ctcpro:settings');
  if (savedSettings) {
    try {
      state.settings = JSON.parse(savedSettings);
      
      // Apply settings
      textareas.forEach(textarea => {
        if (state.settings.wordWrap) {
          textarea.classList.add('word-wrap');
        } else {
          textarea.classList.remove('word-wrap');
        }
      });
      
      const lineNumbers = $$('.line-numbers');
      lineNumbers.forEach(lineNumber => {
        lineNumber.style.display = state.settings.lineNumbers ? 'block' : 'none';
      });
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }

  // --- Load saved tool
  const savedTool = storage.getItem('ctcpro:currentTool');
  if (savedTool) {
    switchTool(savedTool);
  }

  // utility: download blob
  function downloadBlob(text, type, filename) {
    const blob = new Blob([text], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // expose some useful things to global for debugging (optional)
  window.ctc = {
    downloadBlob,
    minifyHTML,
    cleanCSS,
    cleanJS,
    toast,
    state,
    switchTool,
    applySyntaxHighlighting
  };
})();