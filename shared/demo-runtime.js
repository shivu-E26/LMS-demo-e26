(() => {
  'use strict';

  const ROLE_NAMES = {
    publisher: 'Publisher',
    institution: 'Institution Admin',
    hod: 'HOD / Department Manager',
    lecturer: 'Lecturer / Instructor',
    student: 'Student'
  };
  const ROLE_USERS = {
    publisher: 'Braczero Publisher Admin',
    institution: 'Institution Admin',
    hod: 'Dr. Sarah Morgan',
    lecturer: 'Dr. Aris Thomas',
    student: 'Alex Carter'
  };
  const PAGE_ROLES = {
    'publisher_dashboard.html': ['publisher'],
    'publisher_catalog.html': ['publisher'],
    'publisher_catalog_mobile.html': ['publisher'],
    'publishing_studio.html': ['publisher'],
    'publishing_studio_mobile.html': ['publisher'],
    'institution_licensing.html': ['publisher', 'institution'],
    'license_management.html': ['publisher', 'institution'],
    'institution_dashboard.html': ['institution'],
    'institution_departments.html': ['institution', 'hod'],
    'institution_programs.html': ['institution', 'hod'],
    'institution_students.html': ['institution', 'hod', 'lecturer'],
    'hod_dashboard.html': ['hod'],
    'hod_courses.html': ['hod'],
    'hod_programs.html': ['hod'],
    'lecturer_dashboard.html': ['lecturer'],
    'my_courses.html': ['student', 'lecturer'],
    'student_dashboard.html': ['student'],
    'ebook_reader.html': ['student'],
    'ebook_reader_mobile.html': ['student'],
    'student_notes.html': ['student'],
    'student_notes_mobile.html': ['student'],
    'student_assignments.html': ['student'],
    'student_assignments_mobile.html': ['student']
  };

  // Only existing screens appear in role navigation. Missing destinations are not fabricated.
  const ROLE_NAVIGATION = {
    publisher: [
      { section: 'Publisher Workspace', items: [
        ['Dashboard', 'publisher_dashboard.html', 'dashboard'],
        ['Catalog', 'publisher_catalog.html', 'menu_book'],
        ['Publishing Studio', 'publishing_studio.html', 'edit_note']
      ]},
      { section: 'Distribution', items: [
        ['Institutions', 'institution_licensing.html', 'account_balance'],
        ['Licenses', 'license_management.html', 'verified']
      ]}
    ],
    institution: [
      { section: 'Institution', items: [
        ['Dashboard', 'institution_dashboard.html', 'dashboard'],
        ['Departments', 'institution_departments.html', 'domain'],
        ['Programs', 'institution_programs.html', 'schema'],
        ['Courses', 'institution_programs.html', 'menu_book'],
        ['Lecturers', 'institution_departments.html', 'supervisor_account'],
        ['Students', 'institution_students.html', 'school']
      ]},
      { section: 'Content & Licensing', items: [
        ['Publisher Library', 'institution_licensing.html', 'local_library'],
        ['Seat Allocation', 'license_management.html', 'verified']
      ]}
    ],
    hod: [
      { section: 'Department Workspace', items: [
        ['Dashboard', 'hod_dashboard.html', 'dashboard'],
        ['Programs', 'hod_programs.html', 'schema'],
        ['Courses', 'hod_courses.html', 'menu_book'],
        ['Lecturers', 'institution_departments.html', 'supervisor_account'],
        ['Students', 'institution_students.html', 'school']
      ]}
    ],
    lecturer: [
      { section: 'Teaching', items: [
        ['Dashboard', 'lecturer_dashboard.html', 'dashboard'],
        ['My Courses', 'my_courses.html', 'auto_stories'],
        ['Students', 'institution_students.html', 'groups']
      ]}
    ],
    student: [
      { section: 'Academic Workspace', items: [
        ['Dashboard', 'student_dashboard.html', 'dashboard'],
        ['My Courses', 'my_courses.html', 'school'],
        ['My E-books', 'ebook_reader.html', 'menu_book'],
        ['Assignments', 'student_assignments.html', 'assignment']
      ]},
      { section: 'Personal Library', items: [
        ['My Notes / Personal Studybook', 'student_notes.html', 'edit_note']
      ]}
    ]
  };

  const page = location.pathname.split('/').pop() || 'index.html';
  if (page === 'index.html') return;
  let selectedRole = new URLSearchParams(location.search).get('e26_demo_role');
  if (!selectedRole) { try { selectedRole = localStorage.getItem('e26_demo_role'); } catch { /* file preview may restrict storage */ } }
  if (selectedRole) { try { localStorage.setItem('e26_demo_role', selectedRole); } catch { /* URL role state also supports file previews */ } }
  const acceptedRoles = PAGE_ROLES[page] || [];
  if (!selectedRole || !acceptedRoles.includes(selectedRole)) {
    document.body.innerHTML = `<main class="e26-access-wall"><section class="e26-access-card" role="alert"><img class="e26-brand-mark" src="shared/braczero-logo.svg" alt="Braczero" /><h1>Demo Role Access</h1><p>${selectedRole ? 'This screen is not part of the selected role workspace.' : 'Choose a demo role to open this screen.'}</p><a href="index.html">Return to Role Launcher</a></section></main>`;
    return;
  }

  document.body.dataset.role = selectedRole;
  const currentRoleLabel = ROLE_NAMES[selectedRole];
  const currentUser = ROLE_USERS[selectedRole];
  const accessible = new Set(Object.entries(PAGE_ROLES).filter(([, roles]) => roles.includes(selectedRole)).map(([name]) => name));

  document.querySelectorAll('.e26-brand-mark').forEach(mark => {
    const parent=mark.parentElement;
    const next=mark.nextElementSibling;
    if (!parent || next && /\bBraczero\b/i.test(next.textContent)) return;
    const title=document.createElement('span');
    title.className='e26-brand-name';
    title.textContent='Braczero';
    mark.after(title);
  });

  function renderSidebar() {
    const nav = document.querySelector('aside nav');
    if (!nav) return;
    const template = nav.querySelector('a');
    const linkClass = template?.className || 'flex items-center gap-2 px-3 py-2 rounded-lg';
    const activeClass = nav.dataset.activeClasses || 'bg-secondary text-on-secondary font-body-medium rounded-lg';
    nav.replaceChildren();
    ROLE_NAVIGATION[selectedRole].forEach(group => {
      const heading = document.createElement('div');
      heading.className = 'e26-sidebar-group';
      heading.textContent = group.section;
      nav.append(heading);
      group.items.forEach(([label, href, icon]) => {
        const link = document.createElement('a');
        link.href = href;
        link.className = linkClass;
        link.innerHTML = `<span class="material-symbols-outlined text-[18px]" aria-hidden="true">${icon}</span><span>${label}</span>`;
        if (href === page) {
          link.setAttribute('aria-current', 'page');
          link.classList.add(...activeClass.split(/\s+/).filter(Boolean));
        }
        nav.append(link);
      });
    });
  }
  renderSidebar();

  // The available course-roster source page is lecturer-oriented; give the student role a private course library view instead of exposing instructor roster controls.
  if (page === 'my_courses.html' && selectedRole === 'student') {
    const subbrand=[...document.querySelectorAll('aside span')].find(el=>/Faculty & Instructor Portal/i.test(el.textContent));
    if(subbrand) subbrand.textContent='Student Workspace';
    const footer=[...document.querySelectorAll('aside span')].find(el=>/Faculty Active/i.test(el.textContent));
    if(footer) footer.textContent='Academic Term 2025–2026';
    const main=document.querySelector('main');
    if(main){
      main.className='w-full min-h-screen pt-20 px-gutter pb-space-xl bg-background';
      main.innerHTML=`<div class="max-w-6xl mx-auto flex flex-col gap-space-lg"><header class="flex flex-wrap items-end justify-between gap-space-md"><div><p class="font-label-mono text-label-mono text-secondary uppercase tracking-wider">Academic Term 2025–2026</p><h1 class="font-display-hero text-display-hero text-primary font-bold">My Courses</h1><p class="font-body-regular text-body-regular text-on-surface-variant mt-1">Your enrolled courses and assigned e-books.</p></div><a href="student_assignments.html" class="px-4 py-2 rounded-lg bg-primary text-on-primary font-body-medium text-body-medium">View Assignments</a></header><section class="grid grid-cols-1 lg:grid-cols-2 gap-space-md" aria-label="Enrolled courses"><article class="rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-sm overflow-hidden"><div class="p-space-md"><div class="flex items-center justify-between gap-3"><span class="font-label-mono text-label-mono text-secondary font-semibold">ECON-301</span><span class="px-2 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-container text-xs font-semibold">In progress</span></div><h2 class="font-headline-lg text-headline-lg text-primary mt-3">Global Macroeconomics</h2><p class="font-body-regular text-body-regular text-on-surface-variant mt-1">Business Management: Strategy &amp; Leadership in Practice</p><div class="mt-5 flex items-center gap-3"><div class="h-2 flex-1 rounded-full bg-surface-container"><div class="h-full rounded-full bg-secondary" style="width:52%"></div></div><span class="font-label-mono text-label-mono text-on-surface-variant">52%</span></div><a href="ebook_reader.html" class="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-on-secondary font-body-medium text-body-medium">Open E-book <span aria-hidden="true">→</span></a></div></article><article class="rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-sm overflow-hidden"><div class="p-space-md"><div class="flex items-center justify-between gap-3"><span class="font-label-mono text-label-mono text-secondary font-semibold">FIN-302</span><span class="px-2 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold">Available</span></div><h2 class="font-headline-lg text-headline-lg text-primary mt-3">Corporate Finance</h2><p class="font-body-regular text-body-regular text-on-surface-variant mt-1">Publisher course materials and assigned resources</p><a href="ebook_reader.html" class="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container text-primary font-body-medium text-body-medium">Open Course <span aria-hidden="true">→</span></a></div></article></section></div>`;
    }
  }

  if (page === 'institution_students.html' && (selectedRole === 'hod' || selectedRole === 'lecturer')) {
    const main=document.querySelector('main');
    const heading=selectedRole==='hod'?'Department Students':'My Students';
    const detail=selectedRole==='hod'?'Business & Management Department · Academic Term 2025–2026':'ECON-301 Global Macroeconomics · Academic Term 2025–2026';
    if(main){main.innerHTML=`<div class="max-w-6xl mx-auto flex flex-col gap-space-md"><header><p class="font-label-mono text-label-mono text-secondary uppercase tracking-wider">${selectedRole==='hod'?'Department Workspace':'Teaching Workspace'}</p><h1 class="font-display-hero text-display-hero text-primary font-bold">${heading}</h1><p class="font-body-regular text-body-regular text-on-surface-variant mt-1">${detail}</p></header><section class="rounded-xl bg-surface-container-lowest border border-outline-variant/40 p-space-md"><h2 class="font-headline-lg text-headline-lg text-primary">Enrolled Learners</h2><div class="mt-space-sm divide-y divide-outline-variant/40"><div class="py-3 flex flex-wrap items-center justify-between gap-3"><div><strong class="text-on-surface">Alex Carter</strong><p class="text-sm text-on-surface-variant">ECON-301 · Reading progress 52%</p></div><span class="text-xs text-on-surface-variant">Course participant</span></div></div></section></div>`;}
  }

  if (page === 'institution_departments.html' && selectedRole === 'hod') {
    const main=document.querySelector('main');
    if(main)main.innerHTML=`<div class="max-w-6xl mx-auto flex flex-col gap-space-md"><header><p class="font-label-mono text-label-mono text-secondary uppercase tracking-wider">Department Workspace</p><h1 class="font-display-hero text-display-hero text-primary font-bold">Department Lecturers</h1><p class="font-body-regular text-body-regular text-on-surface-variant mt-1">Business &amp; Management Department · Academic Term 2025–2026</p></header><section class="rounded-xl bg-surface-container-lowest border border-outline-variant/40 p-space-md"><h2 class="font-headline-lg text-headline-lg text-primary">Teaching Team</h2><div class="mt-space-sm rounded-lg bg-surface-container-low p-space-md"><strong class="text-on-surface">Dr. Aris Thomas</strong><p class="text-sm text-on-surface-variant">Lecturer / Instructor · ECON-301 Global Macroeconomics</p></div></section></div>`;
  }

  if (page === 'institution_programs.html' && selectedRole === 'hod') {
    const title=[...document.querySelectorAll('h1,h2')].find(el=>/academic departments|programs/i.test(el.textContent));
    if(title)title.textContent='Department Programs';
    const context=[...document.querySelectorAll('p')].find(el=>/oversee university faculties/i.test(el.textContent));
    if(context)context.textContent='Manage programs within the Business & Management Department.';
  }

  // Strip cross-role page links from in-page cards and mobile navigation.
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || /^(?:[a-z]+:|\/\/)/i.test(href)) return;
    const target = href.split(/[?#]/, 1)[0].split('/').pop();
    if (PAGE_ROLES[target] && !accessible.has(target) && !link.closest('aside nav')) {
      const item = link.closest('li');
      if (item) item.remove(); else link.remove();
    }
  });
  document.querySelectorAll('nav a[href="#"]').forEach(link => {
    if (link.closest('aside nav')) return;
    const bottomNav = link.closest('nav')?.className.includes('bottom-0');
    if (bottomNav) link.remove();
    else link.addEventListener('click', event => { event.preventDefault(); toastPlaceholder(link); });
  });

  // Carry the selected role in page URLs as well as localStorage so file:// previews keep the role across screens.
  document.querySelectorAll('a[href]').forEach(link => {
    const href=link.getAttribute('href');
    if(!href || href.startsWith('#') || /^(?:[a-z]+:|\/\/)/i.test(href)) return;
    const target=href.split(/[?#]/,1)[0].split('/').pop();
    if(!target || target==='index.html') return;
    const url=new URL(href,location.href);
    url.searchParams.set('e26_demo_role',selectedRole);
    link.href=url.pathname.split('/').pop()+url.search+url.hash;
  });

  function toastPlaceholder(link) {
    const label=(link.innerText||'This view').replace(/\s+/g,' ').trim();
    let node=document.querySelector('.e26-toast');
    if(!node){node=document.createElement('div');node.className='e26-toast';node.setAttribute('role','status');node.setAttribute('aria-live','polite');document.body.append(node);}
    node.textContent=`${label} is a reader control in this demo.`;node.hidden=false;
    clearTimeout(window.__e26ToastTimer);window.__e26ToastTimer=setTimeout(()=>{node.hidden=true;},2600);
  }

  if (page.endsWith('_dashboard.html')) {
    const identity = document.createElement('aside');
    identity.className = 'e26-role-switcher';
    identity.innerHTML = `<span>${currentUser} · ${currentRoleLabel}<small>Academic Term 2025–2026</small></span><a href="index.html">Switch Demo Role</a>`;
    document.body.append(identity);
  }

  let toastTimer;
  function toast(message) {
    let node = document.querySelector('.e26-toast');
    if (!node) {
      node = document.createElement('div');
      node.className = 'e26-toast';
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      document.body.append(node);
    }
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { node.hidden = true; }, 2800);
  }

  // Make otherwise inert controls acknowledge the click without pretending to persist server data.
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button && !button.dataset.demoHandled && !button.dataset.demoAction && !button.hasAttribute('onclick') && !event.defaultPrevented) {
      const label = (button.getAttribute('aria-label') || button.innerText || 'This control').trim().replace(/\s+/g, ' ');
      toast(`${label}: this screen is a frontend demo; no server data was changed.`);
      return;
    }
    const placeholder = event.target.closest('a[href="#"]');
    if (placeholder && !event.defaultPrevented && !placeholder.closest('nav, aside')) {
      toast('This option is not included in the current demo screens.');
    }
  });

  window.BraczeroDemo = {
    role: selectedRole,
    roles: ROLE_NAMES,
    pages: PAGE_ROLES,
    navigation: ROLE_NAVIGATION,
    toast,
    url(file, query = '') { const params=new URLSearchParams(query.replace(/^\?/,'').replace(/&$/,''));params.set('e26_demo_role',selectedRole);return `${file}?${params.toString()}`; },
    go(file, query = '') { location.href=this.url(file,query); },
    save(key, value) { try { localStorage.setItem(`e26:${selectedRole}:${key}`, JSON.stringify(value)); } catch { toast('Browser storage is unavailable in this preview.'); } },
    load(key, fallback) {
      try { const value = localStorage.getItem(`e26:${selectedRole}:${key}`); return value ? JSON.parse(value) : fallback; }
      catch { return fallback; }
    }
  };
})();
