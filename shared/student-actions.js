(() => {
  const demo = window.BraczeroDemo;
  if (!demo || demo.role !== 'student') return;
  const page = location.pathname.split('/').pop();
  const notify = message => demo.toast(message);
  const get = (key, fallback) => demo.load(key, fallback);
  const put = (key, value) => demo.save(key, value);
  const goReader = (pageNum, mobile = false) => { demo.go(`${mobile ? 'ebook_reader_mobile.html' : 'ebook_reader.html'}`, `page=${encodeURIComponent(pageNum || get('reader-state', { page:126 }).page)}`); };

  function markHandled(node) { if (node) node.dataset.demoHandled = 'true'; }
  function buttonByText(re) {
    return [...document.querySelectorAll('button')].filter(button => re.test((button.innerText || '').replace(/\s+/g, ' ').trim()));
  }
  function storeAssignmentFiles(files) {
    if (!('indexedDB' in window)) return;
    const request=indexedDB.open('e26-client-demo',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('uploads');
    request.onsuccess=()=>{const tx=request.result.transaction('uploads','readwrite');tx.objectStore('uploads').put(files,'student-assignment');};
  }
  function restoreAssignmentFiles(done) {
    if (!('indexedDB' in window)) return;
    const request=indexedDB.open('e26-client-demo',1);
    request.onsuccess=()=>{const tx=request.result.transaction('uploads','readonly');const getFiles=tx.objectStore('uploads').get('student-assignment');getFiles.onsuccess=()=>done(getFiles.result||[]);};
  }

  if (page === 'ebook_reader.html') {
    const article = document.querySelector('article');
    if (!article) return;
    article.id = 'e26-reader-page';
    const state = get('reader-state', { html: null, notes: [], bookmarks: [], page: 126, progress: 52 });
    if (state.html) article.innerHTML = state.html;
    let currentPage = Number(new URLSearchParams(location.search).get('page')) || Number(state.page) || 126;
    currentPage = Math.max(1, Math.min(240, currentPage));
    let selection = '';
    let color = '#FEF08A';
    const pageInput = [...document.querySelectorAll('input')].find(input => input.value === '126' || input.type === 'text' && input.closest('nav'));
    const pageLabels = [...document.querySelectorAll('span')].filter(el => /^Codex Page \d+ \/ 240$/.test(el.textContent.trim()));
    const updatePage = (next, persist = true) => {
      currentPage = Math.max(1, Math.min(240, Number(next) || 1));
      if (pageInput) pageInput.value = currentPage;
      pageLabels.forEach(label => { label.textContent = `Codex Page ${currentPage} / 240`; });
      const pct = Math.min(100, Math.round(currentPage / 240 * 100));
      const progress = [...document.querySelectorAll('div')].find(el => String(el.className).includes('w-[72%]'));
      if (progress) progress.style.width = `${pct}%`;
      const pageNumLabel = [...document.querySelectorAll('span')].find(el => /^Page \d+ of 684$/.test(el.textContent.trim()));
      if (pageNumLabel) pageNumLabel.textContent = `Page ${currentPage} of 240`;
      if (persist) { state.page = currentPage; state.progress = pct; put('reader-state', state); }
    };
    updatePage(new URLSearchParams(location.search).get('page') || state.page, false);
    if (pageInput) {
      pageInput.addEventListener('keydown', event => { if (event.key === 'Enter') { updatePage(pageInput.value); notify(`Opened page ${currentPage}.`); } });
      pageInput.addEventListener('change', () => updatePage(pageInput.value));
    }
    document.querySelectorAll('button[title="Previous Page"],button[title="Next Page"]').forEach(button => {
      markHandled(button);
      button.addEventListener('click', () => updatePage(currentPage + (button.title === 'Next Page' ? 1 : -1)));
    });
    document.querySelectorAll('a[href="#"]').forEach(link => {
      const label = link.innerText.replace(/\s+/g, ' ').trim();
      const match = label.match(/Chapter\s+(\d+)|([4-6]\.\d)/i);
      if (!match) return;
      link.addEventListener('click', event => {
        event.preventDefault();
        const chapter = Number(match[1] || match[2].split('.')[0]);
        const subsection = Number(match[2]?.split('.')[1] || 1);
        const chapterPages={1:1,2:39,3:79,4:126,5:165,6:209};
        const pageForChapter = chapter === 4 && match[2] ? [126,138,149][Math.max(0,subsection-1)] : chapterPages[chapter]||1;
        updatePage(pageForChapter);
        notify(`Chapter ${chapter} opened on page ${pageForChapter}.`);
      });
    });

    const saveArticle = () => { state.html = article.innerHTML; state.page = currentPage; put('reader-state', state); };
    const colorSwatches = [...document.querySelectorAll('[title^="Highlight "]')];
    colorSwatches.forEach(swatch => {
      const label = swatch.title.split(' ').pop().toLowerCase();
      const palette = { yellow:'#FEF08A', green:'#BBF7D0', blue:'#BFDBFE', pink:'#FBCFE8' };
      swatch.addEventListener('mousedown', event => { event.preventDefault(); selection = window.getSelection()?.toString().trim() || selection; });
      swatch.addEventListener('click', () => {
        color = palette[label] || '#FEF08A';
        const selected = window.getSelection();
        if (!selected || !selected.rangeCount || !selected.toString().trim()) { notify('Select text in the book, then choose a highlight color.'); return; }
        const range = selected.getRangeAt(0);
        const mark = document.createElement('mark');
        mark.style.backgroundColor = color;
        mark.style.color = 'inherit';
        mark.dataset.e26Highlight = label;
        mark.dataset.page = String(currentPage);
        try { range.surroundContents(mark); }
        catch { const frag = range.extractContents(); mark.append(frag); range.insertNode(mark); }
        selection = selected.toString().trim();
        selected.removeAllRanges();
        saveArticle();
        notify(`${label[0].toUpperCase()+label.slice(1)} highlight saved on page ${currentPage}.`);
      });
    });

    const addNote = text => {
      const content = (text || selection || '').trim();
      const noteText = window.prompt(content ? `Add a private note for page ${currentPage}:` : `Add a private note for page ${currentPage}:`);
      if (noteText === null || !noteText.trim()) return;
      state.notes = state.notes || [];
      state.notes.unshift({ id: `note-${Date.now()}`, text: content || 'Page note', note: noteText.trim(), page: currentPage, color: color, date: new Date().toLocaleDateString() });
      saveArticle();
      put('reader-state', state);
      notify('Private note saved to your Personal Studybook.');
    };
    buttonByText(/^\s*(?:edit_note\s*)?Note\s*$/i).forEach(button => { markHandled(button); button.addEventListener('mousedown', () => { selection = window.getSelection()?.toString().trim() || selection; }); button.addEventListener('click', () => addNote(selection)); });
    [...document.querySelectorAll('button[title*="Sticky Note"]')].forEach(button => { markHandled(button); button.addEventListener('click', () => addNote('Page note')); });
    [...new Set([...document.querySelectorAll('button[title*="Bookmark"]'), ...buttonByText(/Bookmark/i)])].forEach(button => {
      if (button.innerText.includes('Bookmark') || /Bookmark/.test(button.title)) {
        markHandled(button); button.addEventListener('click', () => {
          state.bookmarks = state.bookmarks || [];
          if (!state.bookmarks.some(item => item.page === currentPage)) state.bookmarks.unshift({ page: currentPage, title: `Page ${currentPage}`, date: new Date().toLocaleDateString() });
          put('reader-state', state); notify(`Page ${currentPage} bookmarked.`);
        });
      }
    });
    const search = [...document.querySelectorAll('input')].find(input => /Search book text/i.test(input.placeholder));
    if (search) search.addEventListener('keydown', event => {
      if (event.key !== 'Enter' || !search.value.trim()) return;
      const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
      const term = search.value.trim().toLowerCase(); let node, found = false;
      while ((node = walker.nextNode())) {
        const idx = node.textContent.toLowerCase().indexOf(term);
        if (idx < 0) continue;
        const range = document.createRange(); range.setStart(node, idx); range.setEnd(node, idx + term.length);
        const mark = document.createElement('mark'); mark.style.backgroundColor = '#FEF08A';
        range.surroundContents(mark); mark.scrollIntoView({ behavior:'smooth', block:'center' }); found = true; break;
      }
      notify(found ? `Found “${search.value.trim()}” in this chapter.` : 'No match found in the current chapter.');
    });
    const fullScreen = [...document.querySelectorAll('button[title]')].find(button => /Fullscreen/.test(button.title));
    if (fullScreen) { markHandled(fullScreen); fullScreen.addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.()); }
    if(fullScreen?.parentElement){
      const focus=fullScreen.cloneNode(true);focus.title='Toggle Focus Mode';focus.setAttribute('aria-label','Toggle Focus Mode');focus.dataset.demoHandled='true';focus.innerHTML='<span class="material-symbols-outlined text-[20px]">center_focus_strong</span>';fullScreen.parentElement.insertBefore(focus,fullScreen);
      focus.addEventListener('click',()=>{document.body.classList.toggle('e26-focus-mode');focus.setAttribute('aria-pressed',String(document.body.classList.contains('e26-focus-mode')));notify(document.body.classList.contains('e26-focus-mode')?'Focus mode on. Press Escape to exit.':'Focus mode off.');});
      document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('e26-focus-mode')){document.body.classList.remove('e26-focus-mode');focus.setAttribute('aria-pressed','false');}});
    }
  }


  if (page === 'ebook_reader_mobile.html') {
    let state = get('reader-state', { notes: [], bookmarks: [], page:126, progress:52 });
    let highlights = get('reader-mobile-highlights', []);
    let currentPage = Number(new URLSearchParams(location.search).get('page')) || Number(state.page) || 126;
    const chapterText = document.querySelector('main') || document.body;
    const controls = [...document.querySelectorAll('button')];
    const update = n => { currentPage=Math.max(1,Math.min(240,Number(n)||1));state.page=currentPage;state.progress=Math.round(currentPage/240*100);put('reader-state',state);[...document.querySelectorAll('span')].filter(el=>/^p\. 126$/i.test(el.textContent.trim())).forEach(el=>el.textContent=`p. ${currentPage}`);notify(`Page ${currentPage} of 240`); };
    controls.forEach(button => {
      const label=(button.getAttribute('aria-label')||button.title||button.innerText||'').replace(/\s+/g,' ').trim();
      if (/Next Page/i.test(label) || /chevron_right/.test(label)) { markHandled(button);button.addEventListener('click',()=>update(currentPage+1)); }
      if (/Previous Page/i.test(label) || /chevron_left/.test(label)) { markHandled(button);button.addEventListener('click',()=>update(currentPage-1)); }
      if (/Toggle Bookmark|Page Bookmarked/i.test(label)) { markHandled(button);button.addEventListener('click',()=>{state.bookmarks=state.bookmarks||[];if(!state.bookmarks.some(x=>x.page===currentPage))state.bookmarks.unshift({page:currentPage,title:`Page ${currentPage}`});put('reader-state',state);notify(`Page ${currentPage} bookmarked.`);}); }
      const colorMatch=label.match(/Highlight (Yellow|Green|Blue|Pink)/i);
      if (colorMatch) { markHandled(button);button.addEventListener('click',()=>{
        const selected=window.getSelection();if(!selected||!selected.toString().trim()){notify('Select text in the book before highlighting.');return;}
        const colors={yellow:'#FEF08A',green:'#BBF7D0',blue:'#BFDBFE',pink:'#FBCFE8'};const range=selected.getRangeAt(0);const mark=document.createElement('mark');mark.style.backgroundColor=colors[colorMatch[1].toLowerCase()];try{range.surroundContents(mark);}catch{const frag=range.extractContents();mark.append(frag);range.insertNode(mark);}highlights.push({text:selected.toString().trim(),color:colors[colorMatch[1].toLowerCase()],page:currentPage});put('reader-mobile-highlights',highlights);notify(`${colorMatch[1]} highlight saved.`);
      }); }
      if (/^Note$/i.test(label) || /edit_note\s+Note/i.test(label)) { markHandled(button);button.addEventListener('click',()=>{const selected=window.getSelection()?.toString().trim()||'Page note';const value=window.prompt(`Add a private note for page ${currentPage}:`);if(value?.trim()){state.notes=state.notes||[];state.notes.unshift({id:`note-${Date.now()}`,text:selected,note:value.trim(),page:currentPage,date:new Date().toLocaleDateString()});put('reader-state',state);notify('Note saved to your Personal Studybook.');}}); }
      if (/Return to Library/i.test(label)) { markHandled(button);button.addEventListener('click',()=>demo.go('my_courses.html')); }
    });
    // Restore highlights by matching their saved text in the current reading view.
    highlights.forEach(item=>{const walker=document.createTreeWalker(chapterText,NodeFilter.SHOW_TEXT);let textNode;while((textNode=walker.nextNode())){const index=textNode.textContent.indexOf(item.text);if(index<0)continue;const range=document.createRange();range.setStart(textNode,index);range.setEnd(textNode,index+item.text.length);const mark=document.createElement('mark');mark.style.backgroundColor=item.color;try{range.surroundContents(mark);}catch{}break;}});
    [...document.querySelectorAll('span')].filter(el=>/^p\. 126$/i.test(el.textContent.trim())).forEach(el=>el.textContent=`p. ${currentPage}`);
  }

  if (page === 'student_notes.html' || page === 'student_notes_mobile.html') {
    const readerState = get('reader-state', { notes: [], bookmarks: [], page: 126 });
    document.querySelectorAll('button').forEach(button => {
      const label = (button.innerText || button.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
      const match = label.match(/Open in Book.*?p\.?\s*(\d+)/i);
      if (match) { markHandled(button); button.addEventListener('click', () => goReader(Number(match[1]), page === 'student_notes_mobile.html')); }
      if (/Resume Reader/i.test(label)) { markHandled(button); button.addEventListener('click', () => goReader(readerState.page)); }
    });
    document.querySelectorAll('a[href*="ebook_reader_mobile.html"]').forEach(link => {
      const match=(link.innerText||'').match(/p\.?\s*(\d+)/i);
      if (!match) return;
      link.addEventListener('click',event=>{event.preventDefault();goReader(Number(match[1]),true);});
    });
    const notes = readerState.notes || [];
    if (notes.length) {
      const section = document.createElement('section');
      section.className = 'e26-saved-notes';
      section.innerHTML = `<h2>Notes from your Reader</h2><p>Private to Alex Carter · ${notes.length} saved annotation${notes.length === 1 ? '' : 's'}</p>`;
      notes.forEach(note => {
        const card = document.createElement('article'); card.className = 'e26-saved-note';
        card.innerHTML = `<div><strong>Page ${note.page} · Business Management · Chapter 4</strong><p class="e26-quote"></p><p class="e26-note-copy"></p><p class="e26-note-meta">${note.color ? `Highlight color: ${note.color}` : 'Private note'} · ${note.date||'Saved in this browser'}</p><a href="${demo.url('ebook_reader.html',`page=${encodeURIComponent(note.page)}`)}">Open in Book →</a></div>`;
        card.querySelector('.e26-quote').textContent = note.text;
        card.querySelector('.e26-note-copy').textContent = note.note;
        card.querySelector('a').addEventListener('click',event=>{event.preventDefault();goReader(note.page);});
        section.append(card);
      });
      document.querySelector('main')?.prepend(section);
    }
    const bookmarks=readerState.bookmarks||[];
    if(bookmarks.length){
      const section=document.createElement('section');section.className='e26-saved-notes';
      section.innerHTML=`<h2>Bookmarks</h2><p>Saved pages in your private library · ${bookmarks.length} bookmark${bookmarks.length===1?'':'s'}</p>`;
      bookmarks.forEach(item=>{const row=document.createElement('article');row.className='e26-saved-note';row.innerHTML=`<strong>Business Management · Page ${item.page}</strong><p>${item.date||'Saved in this browser'}</p><a href="${demo.url('ebook_reader.html',`page=${encodeURIComponent(item.page)}`)}">Open in Book →</a>`;row.querySelector('a').addEventListener('click',event=>{event.preventDefault();goReader(item.page);});section.append(row);});
      document.querySelector('main')?.prepend(section);
    }
    const highlights = [...(readerState.html?.matchAll(/<mark[^>]*data-e26-highlight="([^"]+)"[^>]*>([\s\S]*?)<\/mark>/gi) || [])].map(match => ({ color: match[1], page: Number(match[0].match(/data-page="(\d+)"/)?.[1]) || readerState.page || 126, text: match[2].replace(/<[^>]*>/g, '').trim() })).filter(item => item.text);
    (get('reader-mobile-highlights', []) || []).forEach(item => highlights.push({ color: item.color, page: item.page || readerState.page || 126, text: item.text }));
    if (highlights.length) {
      const section = document.createElement('section'); section.className = 'e26-saved-notes';
      section.innerHTML = `<h2>Highlights</h2><p>Saved highlights from Business Management · ${highlights.length} item${highlights.length === 1 ? '' : 's'}</p>`;
      highlights.forEach(item => {
        const row = document.createElement('article'); row.className = 'e26-saved-note';
        row.innerHTML = `<strong>Business Management · Page ${item.page}</strong><p class="e26-quote"></p><p class="e26-note-meta">${item.color} highlight · Saved in this browser</p><a href="${demo.url('ebook_reader.html', `page=${encodeURIComponent(item.page)}`)}">Open in Book →</a>`;
        row.querySelector('.e26-quote').textContent = item.text;
        row.querySelector('a').addEventListener('click', event => { event.preventDefault(); goReader(item.page); });
        section.append(row);
      });
      document.querySelector('main')?.prepend(section);
    }
  }

  if (page === 'student_dashboard.html') {
    buttonByText(/Continue Reading/i).forEach(button => { markHandled(button); button.addEventListener('click', () => goReader(get('reader-state', { page:126 }).page)); });
    buttonByText(/Open Note/i).forEach(button => { markHandled(button); button.addEventListener('click', () => { demo.go('student_notes.html'); }); });
    buttonByText(/Submit Assignment|Resume Draft/i).forEach(button => { markHandled(button); button.addEventListener('click', () => { demo.go('student_assignments.html'); }); });
    buttonByText(/Continue Course/i).forEach(button => { markHandled(button); button.addEventListener('click', () => { demo.go('my_courses.html'); }); });
  }

  if (page === 'student_assignments.html' || page === 'student_assignments_mobile.html') {
    const storageKey = 'assignment-state';
    let state = get(storageKey, { status:'In Progress', note:'', files:[] });
    const noteField = document.querySelector('textarea');
    if (noteField) noteField.value = state.note || '';
    const uploadZone = [...document.querySelectorAll('div')].find(el => el.children.length < 6 && /Drag and drop your deliverable/i.test(el.innerText || ''));
    let stagedLabel = [...document.querySelectorAll('span')].find(el => /Rivera_Alex|Alex_Carter|No file attached/i.test(el.textContent));
    if (stagedLabel) stagedLabel.textContent = state.files?.length ? state.files.map(file => file.name).join(', ') : 'No file attached';
    restoreAssignmentFiles(files=>{
      if(state.files?.length || !files.length) return;
      state.files=files.map(file=>({name:file.name,size:file.size,type:file.type}));
      if(stagedLabel)stagedLabel.textContent=state.files.map(file=>file.name).join(', ');
      put(storageKey,state);
    });
    let fileInput;
    if (uploadZone) {
      fileInput = document.createElement('input'); fileInput.type='file'; fileInput.multiple=true; fileInput.accept='.pdf,.doc,.docx,.zip,.ipynb'; fileInput.hidden=true; uploadZone.append(fileInput);
      uploadZone.setAttribute('role','button'); uploadZone.setAttribute('tabindex','0');
      uploadZone.addEventListener('click', event => { if (event.target !== fileInput) fileInput.click(); });
      uploadZone.addEventListener('keydown', event => { if (event.key==='Enter' || event.key===' ') { event.preventDefault(); fileInput.click(); } });
      fileInput.addEventListener('change', () => {
        state.files = [...fileInput.files].map(file => ({ name:file.name, size:file.size, type:file.type }));
        storeAssignmentFiles([...fileInput.files]);
        if (stagedLabel) stagedLabel.textContent=state.files.map(file=>file.name).join(', ');
        notify(`${state.files.length} file${state.files.length===1?'':'s'} attached.`);
      });
    }
    buttonByText(/Open & Submit|Resume Draft|Quick Submission/i).forEach(button=>{
      markHandled(button);button.addEventListener('click',()=>{uploadZone?.scrollIntoView({behavior:'smooth',block:'center'});if(page==='student_assignments_mobile.html')buttonByText(/Attach/i).pop()?.focus();});
    });
    buttonByText(/Review Feedback|View Full Feedback & Rubric/i).forEach(button=>{
      markHandled(button);button.addEventListener('click',()=>{const rubric=[...document.querySelectorAll('details')].find(el=>/Grading Rubric|Feedback/i.test(el.innerText));if(rubric){rubric.open=true;rubric.scrollIntoView({behavior:'smooth',block:'center'});}else notify('Rubric and feedback are shown in the assignment details.');});
    });
    const saveButton = buttonByText(/Save Draft/i).pop();
    const submitButton = buttonByText(/Submit Assignment/i).pop();
    const persist = status => { state.note = noteField?.value || state.note || ''; if (status) state.status=status; put(storageKey,state); };
    if (saveButton) { markHandled(saveButton); saveButton.addEventListener('click', () => { persist('Draft saved'); notify('Draft saved in this browser.'); }); }
    if (submitButton) { markHandled(submitButton); submitButton.addEventListener('click', () => { persist('Submitted'); notify('Assignment submitted in the local demo.'); }); }
    if (noteField) noteField.addEventListener('input', () => { state.note=noteField.value; });
    if (state.status === 'Submitted') {
      const title = [...document.querySelectorAll('h1,h2,h3')].find(el=>/Submit Assignment/i.test(el.textContent));
      if (title) title.insertAdjacentHTML('afterend','<p class="e26-assignment-status" role="status">Submitted · saved in this browser</p>');
    }
    const search = [...document.querySelectorAll('input')].find(input=>/Search assignments/i.test(input.placeholder));
    if (search) search.addEventListener('input', () => {
      const query=search.value.toLowerCase().trim();
      [...document.querySelectorAll('main button')].filter(button=>/Open & Submit|Resume Draft|View Submission|Review Feedback/i.test(button.innerText)).forEach(button=>{
        const card=button.closest('article') || button.parentElement?.parentElement?.parentElement;
        if(card) card.hidden=!!query && !card.innerText.toLowerCase().includes(query);
      });
    });
    if (page === 'student_assignments_mobile.html') {
      const attach = buttonByText(/\bAttach\b/i).pop();
      if (attach) {
        const input=document.createElement('input');input.type='file';input.multiple=true;input.accept='.pdf,.doc,.docx,.zip,.ipynb';input.hidden=true;document.body.append(input);
        markHandled(attach);attach.addEventListener('click',()=>input.click());
        input.addEventListener('change',()=>{state.files=[...input.files].map(file=>({name:file.name,size:file.size,type:file.type}));storeAssignmentFiles([...input.files]);persist(state.status);notify(`${state.files.length} file${state.files.length===1?'':'s'} attached.`);});
      }
      buttonByText(/Confirm Dispatch/i).forEach(button=>{markHandled(button);button.addEventListener('click',()=>{persist('Submitted');notify('Assignment submitted in the local demo.');});});
    }
  }
})();
