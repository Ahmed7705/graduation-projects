/**
 * Graduation Projects Platform - Core Interactive Engine
 * Handles rendering, filtering, searching, bookmarking, modal, and animations
 */

// Category metadata definitions with modern iconography and color themes
const CATEGORY_META = {
  'الذكاء الاصطناعي والأمن الرقمي': {
    icon: 'shield-check',
    accent: '#2563eb',
    bg: '#eff6ff',
    hint: 'كشف احتيال، فحص وسائط، وأمن سيبراني'
  },
  'الحج والعمرة والسياحة': {
    icon: 'compass',
    accent: '#0d9488',
    bg: '#f0fdfa',
    hint: 'إرشاد ذكي، خرائط تفاعلية، وتجارب سياحية'
  },
  'المفقودون وإدارة الأحداث والطوارئ': {
    icon: 'siren',
    accent: '#ea580c',
    bg: '#fff7ed',
    hint: 'مطابقة صور، إدارة حشود، وتوجيه طوارئ'
  },
  'الزراعة والبيئة': {
    icon: 'sprout',
    accent: '#15803d',
    bg: '#f0fdf4',
    hint: 'حساسات IoT، سقي ذكي، وجودة الهواء'
  },
  'التجارة الإلكترونية والمزادات': {
    icon: 'shopping-bag',
    accent: '#7c3aed',
    bg: '#f5f3ff',
    hint: 'مزادات فورية، كشف تلاعب، وأنظمة توصية'
  },
  'السيارات والنقل': {
    icon: 'car',
    accent: '#0284c7',
    bg: '#f0f9ff',
    hint: 'كشف نعاس، مسارات توصيل، وتشخيص صوتي'
  },
  'أنظمة الأعمال والخدمات': {
    icon: 'briefcase',
    accent: '#e11d48',
    bg: '#fff1f2',
    hint: 'تحليل فواتير OCR، إدارة مخزون، وضمانات'
  },
  'أفكار تقنية مختلفة وقوية': {
    icon: 'code-2',
    accent: '#d97706',
    bg: '#fffbeb',
    hint: 'بحث بالملفات RAG، توليد SQL، واختبار كود'
  }
};

// State Store
const state = {
  activeCategory: 'الكل',
  searchQuery: '',
  selectedLevel: 'all',
  favoritesOnly: false,
  favorites: new Set(JSON.parse(localStorage.getItem('grad_favs_v2') || '[]')),
  currentModalProject: null
};

// Helper Selectors
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

// Safely resolve projects list
const ALL_PROJECTS = (typeof PROJECTS !== 'undefined' ? PROJECTS : (typeof window !== 'undefined' && window.PROJECTS) ? window.PROJECTS : []);

// Unique categories list
const categories = ['الكل', ...new Set(ALL_PROJECTS.map(p => p.category))];

/**
 * Initialize the Application
 */
function initApp() {
  renderCategoryCards();
  renderCategoryPills();
  renderProjects();
  setupEventListeners();
  updateFavoritesBadges();
  
  // Update year
  const yearEl = $('#currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Create Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }
}

/**
 * Render the 8 Interactive Category Cards
 */
function renderCategoryCards() {
  const container = $('#categoryGrid');
  if (!container) return;

  const realCats = categories.filter(c => c !== 'الكل');
  
  container.innerHTML = realCats.map((cat, idx) => {
    const meta = CATEGORY_META[cat] || { icon: 'folder', accent: '#2563eb', bg: '#eff6ff', hint: 'أفكار ومشاريع متخصصة' };
    const count = ALL_PROJECTS.filter(p => p.category === cat).length;
    const isCurrentActive = state.activeCategory === cat;

    return `
      <div class="category-card ${isCurrentActive ? 'active' : ''}" 
           data-cat="${cat}"
           style="--cat-accent: ${meta.accent}; --cat-bg: ${meta.bg};">
        <div class="cat-card-top">
          <div class="cat-card-icon">
            <i data-lucide="${meta.icon}"></i>
          </div>
          <span class="cat-count-badge">${count} فكرة</span>
        </div>
        <div class="cat-card-info">
          <h3>${cat}</h3>
          <p>${meta.hint}</p>
        </div>
      </div>
    `;
  }).join('');

  // Add click listeners to category cards
  $$('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const targetCat = card.getAttribute('data-cat');
      selectCategory(targetCat);
      const projectsSec = $('#projects');
      if (projectsSec) {
        projectsSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/**
 * Render Horizontal Scrollable Filter Pills
 */
function renderCategoryPills() {
  const container = $('#categoryFilters');
  if (!container) return;

  container.innerHTML = categories.map(cat => {
    const isAll = cat === 'الكل';
    const count = isAll ? ALL_PROJECTS.length : ALL_PROJECTS.filter(p => p.category === cat).length;
    const isActive = state.activeCategory === cat;

    return `
      <button class="category-pill ${isActive ? 'active' : ''}" data-cat="${cat}">
        <span>${isAll ? 'جميع المشاريع' : cat}</span>
        <span class="pill-count">${count}</span>
      </button>
    `;
  }).join('');

  $$('.category-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const targetCat = pill.getAttribute('data-cat');
      selectCategory(targetCat);
    });
  });
}

/**
 * Switch Active Category and Re-render
 */
function selectCategory(cat) {
  state.activeCategory = cat;
  
  // Sync category cards active state
  $$('.category-card').forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-cat') === cat);
  });

  // Sync pills active state
  $$('.category-pill').forEach(p => {
    p.classList.toggle('active', p.getAttribute('data-cat') === cat);
  });

  renderProjects();
}

/**
 * Filter Projects based on current state
 */
function getFilteredProjects() {
  const query = state.searchQuery.trim().toLowerCase();

  return ALL_PROJECTS.filter(project => {
    // 1. Category Filter
    if (state.activeCategory !== 'الكل' && project.category !== state.activeCategory) {
      return false;
    }

    // 2. Favorites Filter
    if (state.favoritesOnly && !state.favorites.has(project.id)) {
      return false;
    }

    // 3. Level Filter
    if (state.selectedLevel !== 'all' && project.level !== state.selectedLevel) {
      return false;
    }

    // 4. Search Query Match
    if (query) {
      const matchTitle = project.title.toLowerCase().includes(query);
      const matchDesc = project.description.toLowerCase().includes(query);
      const matchCat = project.category.toLowerCase().includes(query);
      const matchTags = (project.tags || []).some(t => t.toLowerCase().includes(query));
      const matchId = String(project.id) === query || `#${project.id}` === query;
      
      if (!matchTitle && !matchDesc && !matchCat && !matchTags && !matchId) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Render Project Cards Grid
 */
function renderProjects() {
  const grid = $('#projectsGrid');
  const emptyState = $('#emptyState');
  const resultsCount = $('#resultsCount');
  const activeBadge = $('#activeCategoryBadge');

  if (!grid) return;

  const data = getFilteredProjects();

  // Results Count Text
  if (resultsCount) {
    resultsCount.textContent = `يعرض ${data.length} فكرة من أصل 90`;
  }

  // Active Category indicator
  if (activeBadge) {
    activeBadge.textContent = state.favoritesOnly 
      ? 'التصفية: الأفكار المفضلة فقط' 
      : `المجال: ${state.activeCategory === 'الكل' ? 'جميع المشاريع' : state.activeCategory}`;
  }

  // Empty State Toggle
  if (emptyState) {
    emptyState.classList.toggle('hidden', data.length > 0);
  }

  // Render Cards HTML
  grid.innerHTML = data.map((project, idx) => {
    const meta = CATEGORY_META[project.category] || { accent: '#2563eb', bg: '#eff6ff' };
    const isSaved = state.favorites.has(project.id);
    const tags = (project.tags || []).slice(0, 3);
    const idFormatted = String(project.id).padStart(2, '0');

    return `
      <article class="project-card" data-id="${project.id}" style="animation-delay: ${Math.min(idx * 25, 200)}ms">
        <div class="pcard-header">
          <span class="pcard-category-tag" style="--tag-color: ${meta.accent}; --tag-bg: ${meta.bg};">
            ${project.category}
          </span>
          <div class="pcard-top-actions">
            <span class="pcard-id">#${idFormatted}</span>
            <button class="pcard-bookmark-btn ${isSaved ? 'saved' : ''}" 
                    data-id="${project.id}" 
                    title="${isSaved ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}"
                    aria-label="حفظ الفكرة">
              <i data-lucide="${isSaved ? 'bookmark-check' : 'bookmark'}"></i>
            </button>
          </div>
        </div>

        <h3 class="pcard-title">${project.title}</h3>
        <p class="pcard-desc">${project.description}</p>

        <div class="pcard-tags">
          ${tags.map(tag => `<span class="pcard-tag">${tag}</span>`).join('')}
        </div>

        <div class="pcard-footer">
          <span class="pcard-more-link">
            <span>عرض التفاصيل والتقنيات</span>
          </span>
          <span class="pcard-arrow-badge">
            <i data-lucide="arrow-left"></i>
          </span>
        </div>
      </article>
    `;
  }).join('');

  // Attach card click handlers
  $$('.project-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Prevent opening modal when clicking bookmark button
      if (e.target.closest('.pcard-bookmark-btn')) {
        return;
      }
      const id = parseInt(card.getAttribute('data-id'), 10);
      openProjectModal(id);
    });
  });

  // Attach bookmark handlers inside cards
  $$('.pcard-bookmark-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute('data-id'), 10);
      toggleFavorite(id);
    });
  });

  // Re-generate Lucide icons for fresh cards
  if (window.lucide) {
    lucide.createIcons();
  }
}

/**
 * Toggle Project in Favorites
 */
function toggleFavorite(id) {
  const project = ALL_PROJECTS.find(p => p.id === id);
  if (!project) return;

  if (state.favorites.has(id)) {
    state.favorites.delete(id);
    showToast(`تمت إزالة المشروع #${id} من المفضلة`, 'bookmark-x');
  } else {
    state.favorites.add(id);
    showToast(`تم حفظ المشروع #${id} في المفضلة!`, 'bookmark-check');
  }

  // Persist to localStorage
  localStorage.setItem('grad_favs_v2', JSON.stringify([...state.favorites]));

  updateFavoritesBadges();
  renderProjects();

  // If currently viewing modal for this project, update modal state
  if (state.currentModalProject && state.currentModalProject.id === id) {
    updateModalFavButton(state.favorites.has(id));
  }
}

/**
 * Update Favorites Counter Badges in Navigation & Toolbar
 */
function updateFavoritesBadges() {
  const count = state.favorites.size;
  const navBadge = $('#navFavBadge');
  const mobileBadge = $('#mobileFavBadge');
  const toolbarMiniCount = $('#favMiniCount');

  if (navBadge) navBadge.textContent = count;
  if (mobileBadge) mobileBadge.textContent = count;
  if (toolbarMiniCount) toolbarMiniCount.textContent = count;
}

/**
 * Open Project Details Modal
 */
function openProjectModal(id) {
  const project = ALL_PROJECTS.find(p => p.id === id);
  if (!project) return;

  state.currentModalProject = project;
  const modal = $('#projectModal');
  if (!modal) return;

  const idFormatted = String(project.id).padStart(2, '0');
  const isSaved = state.favorites.has(project.id);

  // Set Modal Fields
  $('#modalCategory').textContent = project.category;
  $('#modalId').textContent = `#${idFormatted}`;
  $('#modalTitle').textContent = project.title;
  $('#modalDesc').textContent = project.description;
  $('#modalCatDetail').textContent = project.category;
  $('#modalLevelDetail').textContent = project.level || 'متوسط إلى متقدم';
  $('#modalTeamDetail').textContent = project.team || '2 - 4 طلاب';
  $('#modalNumberDetail').textContent = `#${idFormatted} من أصل 90`;

  // Render Tags
  const tagsContainer = $('#modalTags');
  if (tagsContainer) {
    const tags = project.tags && project.tags.length ? project.tags : ['البرمجة', 'قواعد البيانات', 'واجهة مستخدم'];
    tagsContainer.innerHTML = tags.map(t => `<span class="modal-tag-pill">${t}</span>`).join('');
  }

  // Update Favorite Button in modal
  updateModalFavButton(isSaved);

  // Pre-fill WhatsApp link with precise project inquiry
  const waText = `مرحباً، أود الاستفسار ومناقشة فكرة مشروع التخرج رقم #${idFormatted}: "${project.title}" (${project.category}).`;
  const waUrl = `https://api.whatsapp.com/send/?phone=967770545327&text=${encodeURIComponent(waText)}&type=phone_number&app_absent=0`;
  const waLink = $('#modalWhatsappLink');
  if (waLink) waLink.href = waUrl;

  // Show Modal
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  if (window.lucide) lucide.createIcons();
}

/**
 * Close Modal
 */
function closeProjectModal() {
  const modal = $('#projectModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

/**
 * Update Modal Favorite Button Visual
 */
function updateModalFavButton(isSaved) {
  const favBtn = $('#modalFavBtn');
  const favIcon = $('#modalFavIcon');
  if (!favBtn) return;

  favBtn.classList.toggle('saved', isSaved);
  favBtn.title = isSaved ? 'إزالة من المفضلة' : 'حفظ في المفضلة';
  if (favIcon) {
    favIcon.setAttribute('data-lucide', isSaved ? 'bookmark-check' : 'bookmark');
    if (window.lucide) lucide.createIcons();
  }
}

/**
 * Copy Project Info to Clipboard
 */
function copyCurrentProjectDetails() {
  const p = state.currentModalProject;
  if (!p) return;

  const idFormatted = String(p.id).padStart(2, '0');
  const textToCopy = `مشروع تخرج #${idFormatted}: ${p.title}
المجال: ${p.category}
الوصف: ${p.description}
التقنيات المقترحة: ${(p.tags || []).join('، ')}
للتواصل والمناقشة: +967 770 545 327`;

  navigator.clipboard.writeText(textToCopy).then(() => {
    showToast('تم نسخ ملخص الفكرة إلى الحافظة!', 'check');
  }).catch(() => {
    showToast('فشل النسخ التلقائي، يمكنك نسخه يدوياً', 'alert-circle');
  });
}

/**
 * Pick and Open a Random Graduation Project Idea
 */
function pickRandomIdea() {
  const randomIndex = Math.floor(Math.random() * ALL_PROJECTS.length);
  const randomProject = ALL_PROJECTS[randomIndex];
  openProjectModal(randomProject.id);
  showToast(`فكرة ملهمة: #${randomProject.id} ${randomProject.title}`, 'sparkles');
}

/**
 * Show Toast Notification
 */
function showToast(message, icon = 'check') {
  const container = $('#toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <i data-lucide="${icon}" class="toast-icon"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 260);
  }, 3200);
}

/**
 * Mobile Navigation Drawer Controls
 */
function openMobileMenu() {
  const drawer = $('#mobileDrawer');
  if (drawer) drawer.classList.add('open');
}

function closeMobileMenu() {
  const drawer = $('#mobileDrawer');
  if (drawer) drawer.classList.remove('open');
}


/**
 * Attach All Global Event Listeners
 */
function setupEventListeners() {
  // Search inputs synchronization
  const heroSearch = $('#heroQuickSearch');
  const heroClear = $('#heroClearBtn');
  const projectSearch = $('#projectSearch');
  const projectClear = $('#clearSearchBtn');

  const onSearchChange = (val) => {
    state.searchQuery = val;
    if (heroSearch) heroSearch.value = val;
    if (projectSearch) projectSearch.value = val;

    if (heroClear) heroClear.classList.toggle('hidden', !val);
    if (projectClear) projectClear.classList.toggle('hidden', !val);

    renderProjects();
  };

  if (heroSearch) {
    heroSearch.addEventListener('input', (e) => onSearchChange(e.target.value));
  }
  if (projectSearch) {
    projectSearch.addEventListener('input', (e) => onSearchChange(e.target.value));
  }

  // Clear search buttons
  if (heroClear) {
    heroClear.addEventListener('click', () => onSearchChange(''));
  }
  if (projectClear) {
    projectClear.addEventListener('click', () => onSearchChange(''));
  }

  // Hero Search Button scroll to results
  const heroBtn = $('#heroSearchBtn');
  if (heroBtn) {
    heroBtn.addEventListener('click', () => {
      const sec = $('#projects');
      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      if (projectSearch) projectSearch.focus();
    });
  }

  // Reset Filters Buttons
  const resetBtn = $('#resetFiltersBtn');
  const emptyResetBtn = $('#emptyResetBtn');
  const handleReset = () => {
    state.activeCategory = 'الكل';
    state.searchQuery = '';
    state.selectedLevel = 'all';
    state.favoritesOnly = false;
    
    if (heroSearch) heroSearch.value = '';
    if (projectSearch) projectSearch.value = '';
    if (heroClear) heroClear.classList.add('hidden');
    if (projectClear) projectClear.classList.add('hidden');
    
    const favBtn = $('#filterFavoritesOnly');
    if (favBtn) favBtn.classList.remove('active');

    const levelSel = $('#levelFilter');
    if (levelSel) levelSel.value = 'all';

    selectCategory('الكل');
    showToast('تمت إعادة ضبط التصفية وعرض كافة المشاريع', 'rotate-ccw');
  };

  if (resetBtn) resetBtn.addEventListener('click', handleReset);
  if (emptyResetBtn) emptyResetBtn.addEventListener('click', handleReset);

  // Favorites-only filter button in toolbar
  const filterFavBtn = $('#filterFavoritesOnly');
  if (filterFavBtn) {
    filterFavBtn.addEventListener('click', () => {
      state.favoritesOnly = !state.favoritesOnly;
      filterFavBtn.classList.toggle('active', state.favoritesOnly);
      filterFavBtn.setAttribute('aria-pressed', state.favoritesOnly);
      renderProjects();
    });
  }

  // Favorites button in Header Nav
  const navFavBtn = $('#navFavoritesBtn');
  if (navFavBtn) {
    navFavBtn.addEventListener('click', () => {
      state.favoritesOnly = true;
      if (filterFavBtn) {
        filterFavBtn.classList.add('active');
        filterFavBtn.setAttribute('aria-pressed', 'true');
      }
      renderProjects();
      const sec = $('#projects');
      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Mobile Favorites Button
  const mobileFavBtn = $('#mobileFavBtn');
  if (mobileFavBtn) {
    mobileFavBtn.addEventListener('click', () => {
      closeMobileMenu();
      state.favoritesOnly = true;
      if (filterFavBtn) {
        filterFavBtn.classList.add('active');
        filterFavBtn.setAttribute('aria-pressed', 'true');
      }
      renderProjects();
      const sec = $('#projects');
      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Level / Difficulty select
  const levelSelect = $('#levelFilter');
  if (levelSelect) {
    levelSelect.addEventListener('change', (e) => {
      state.selectedLevel = e.target.value;
      renderProjects();
    });
  }

  // Random Idea triggers
  const randomNavBtn = $('#randomIdeaBtn');
  const randomMobileBtn = $('#mobileRandomBtn');
  const exploreRandomBtn = $('#exploreRandomBtn');

  if (randomNavBtn) randomNavBtn.addEventListener('click', pickRandomIdea);
  if (randomMobileBtn) randomMobileBtn.addEventListener('click', () => {
    closeMobileMenu();
    pickRandomIdea();
  });
  if (exploreRandomBtn) exploreRandomBtn.addEventListener('click', pickRandomIdea);

  // Modal Buttons
  const modalClose = $('#modalCloseBtn');
  const modalFav = $('#modalFavBtn');
  const modalCopy = $('#modalCopyBtn');
  const modal = $('#projectModal');

  if (modalClose) modalClose.addEventListener('click', closeProjectModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeProjectModal();
    });
  }
  if (modalFav) {
    modalFav.addEventListener('click', () => {
      if (state.currentModalProject) {
        toggleFavorite(state.currentModalProject.id);
      }
    });
  }
  if (modalCopy) {
    modalCopy.addEventListener('click', copyCurrentProjectDetails);
  }

  // Escape key to close modal or mobile drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProjectModal();
      closeMobileMenu();
    }
  });

  // Mobile menu buttons
  const mobileBtn = $('#mobileMenuBtn');
  const mobileClose = $('#mobileCloseBtn');
  if (mobileBtn) mobileBtn.addEventListener('click', openMobileMenu);
  if (mobileClose) mobileClose.addEventListener('click', closeMobileMenu);
}

// Kick off when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
