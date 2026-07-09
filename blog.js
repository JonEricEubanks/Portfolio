/**
 * Blog Management System
 * Handles blog post creation, editing, storage (localStorage), and rendering
 */

class BlogManager {
    constructor() {
        this.posts = [];
        this.currentEditId = null;
        this.storageKey = 'portfolio-blog-posts';
        this.currentFilter = 'all';
        this.postsPerPage = 6;
        this.currentPage = 1;
        
        // Auth configuration (server-side validation)
        this._authKey = 'portfolio_analytics_session';
        this._authToken = 'portfolio_auth_token';
        
        // Autosave configuration
        this.autosaveKey = 'portfolio-blog-draft';
        this.autosaveInterval = null;
        this.lastSavedContent = '';
        
        this.initializeElements();
        this.initializeAuth();
        this.initializeSecretAccess();
        this.initializeEventListeners();
        this.initializeImageUpload();
        
        // Load posts asynchronously, render from localStorage first for speed
        this.loadPostsFromCache();
        this.loadPosts(); // Then fetch from GitHub
    }
    
    // Load from localStorage for instant display
    loadPostsFromCache() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            this.posts = stored ? JSON.parse(stored) : [];
            this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
            this.renderPosts();
        } catch (error) {
            this.posts = [];
        }
    }
    
    // Check if authenticated
    isAuthenticated() {
        const token = sessionStorage.getItem(this._authToken) || localStorage.getItem(this._authToken);
        return !!token;
    }
    
    // Initialize auth modal
    initializeAuth() {
        this.authModal = document.getElementById('analytics-config-modal');
        this.authForm = document.getElementById('config-auth-form');
        this.authError = document.getElementById('config-error');
        this.authClose = document.getElementById('config-close');
        this.authOverlay = this.authModal?.querySelector('.config-overlay');
        
        // Auth form submission
        this.authForm?.addEventListener('submit', (e) => this.handleAuth(e));
        
        // Password visibility toggle
        const togglePassword = document.getElementById('toggle-password');
        const passwordInput = document.getElementById('config-key');
        togglePassword?.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            togglePassword.classList.toggle('showing', isPassword);
            togglePassword.title = isPassword ? 'Hide password' : 'Show password';
        });
        
        // Close modal
        this.authClose?.addEventListener('click', () => this.closeAuthModal());
        this.authOverlay?.addEventListener('click', () => this.closeAuthModal());
        
        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.authModal?.style.display === 'flex') {
                this.closeAuthModal();
            }
        });
    }
    
    showAuthModal() {
        this.authModal.style.display = 'flex';
        this.authError.textContent = '';
        document.getElementById('config-user').focus();
    }
    
    closeAuthModal() {
        this.authModal.style.display = 'none';
        this.authForm?.reset();
        this.authError.textContent = '';
    }
    
    async handleAuth(e) {
        e.preventDefault();
        const user = document.getElementById('config-user').value.trim();
        const key = document.getElementById('config-key').value;
        const remember = document.getElementById('config-remember').checked;
        
        // Show loading state
        const submitBtn = this.authForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Verifying...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: user, password: key })
            });
            
            const data = await response.json();
            
            if (data.success) {
                const storage = remember ? localStorage : sessionStorage;
                storage.setItem(this._authToken, data.token);
                this.closeAuthModal();
                this.openAdminPanel();
            } else {
                this.authError.textContent = data.error || 'Invalid credentials';
                this.authError.classList.add('shake');
                setTimeout(() => this.authError.classList.remove('shake'), 500);
            }
        } catch (error) {
            this.authError.textContent = 'Authentication failed. Please try again.';
            this.authError.classList.add('shake');
            setTimeout(() => this.authError.classList.remove('shake'), 500);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    logout() {
        sessionStorage.removeItem(this._authToken);
        localStorage.removeItem(this._authToken);
        this.closeAdminPanel();
    }

    initializeElements() {
        // Admin panel elements
        this.adminPanel = document.getElementById('blog-admin-panel');
        this.adminToggle = document.getElementById('admin-toggle');
        this.closeAdmin = document.getElementById('close-admin');
        this.adminOverlay = this.adminPanel?.querySelector('.admin-overlay');
        
        // Form elements
        this.postForm = document.getElementById('blog-post-form');
        this.postId = document.getElementById('post-id');
        this.postTitle = document.getElementById('post-title');
        this.postCategory = document.getElementById('post-category');
        this.postExcerpt = document.getElementById('post-excerpt');
        this.postContent = document.getElementById('post-content');
        this.postTags = document.getElementById('post-tags');
        this.postImage = document.getElementById('post-image');
        this.cancelBtn = document.getElementById('cancel-post');
        this.exportBtn = document.getElementById('export-posts');
        
        // Status & scheduling elements
        this.postStatus = document.getElementById('post-status');
        this.postSchedule = document.getElementById('post-schedule');
        this.scheduleGroup = document.getElementById('schedule-group');
        this.submitBtn = document.getElementById('submit-btn');
        
        // Image upload elements
        this.imageUploadArea = document.getElementById('image-upload-area');
        this.imageFileInput = document.getElementById('post-image-file');
        this.uploadPlaceholder = document.getElementById('upload-placeholder');
        this.imagePreview = document.getElementById('image-preview');
        this.previewImg = document.getElementById('preview-img');
        this.removeImageBtn = document.getElementById('remove-image-btn');
        this.uploadStatus = document.getElementById('upload-status');
        
        // Display elements
        this.postsContainer = document.getElementById('blog-posts-container');
        this.adminPostsContainer = document.getElementById('admin-posts-container');
        this.emptyState = document.getElementById('empty-blog-state');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        
        // Markdown toolbar & preview elements
        this.markdownToolbar = document.getElementById('markdown-toolbar');
        this.previewContainer = document.getElementById('preview-container');
        this.contentWrapper = document.getElementById('content-wrapper');
        this.previewButtons = document.querySelectorAll('.preview-btn');
        
        // Reading progress
        this.readingProgressContainer = null;
        
        // Secret admin access
        this.blogTitle = document.getElementById('blog-title');
        this.clickCount = 0;
        this.clickTimer = null;
        
        // AI excerpt generation
        this.generateExcerptBtn = document.getElementById('generate-excerpt-btn');
        this.excerptStatus = document.getElementById('excerpt-status');
    }
    
    initializeSecretAccess() {
        // Triple-click on Blog title to reveal admin button
        this.blogTitle?.addEventListener('click', () => {
            this.clickCount++;
            
            if (this.clickTimer) clearTimeout(this.clickTimer);
            
            this.clickTimer = setTimeout(() => {
                if (this.clickCount >= 3) {
                    this.revealAdminButton();
                }
                this.clickCount = 0;
            }, 400);
        });
        
        // Keyboard shortcut: Ctrl+Shift+A
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                this.revealAdminButton();
            }
        });
    }
    
    revealAdminButton() {
        if (this.adminToggle) {
            this.adminToggle.style.display = 'flex';
            this.adminToggle.classList.add('revealed');
            
            // Auto-hide after 10 seconds if not used
            setTimeout(() => {
                if (!this.adminPanel?.style.display || this.adminPanel.style.display === 'none') {
                    this.adminToggle.style.display = 'none';
                    this.adminToggle.classList.remove('revealed');
                }
            }, 10000);
        }
    }

    initializeEventListeners() {
        // Admin panel toggle - require auth
        this.adminToggle?.addEventListener('click', () => {
            if (this.isAuthenticated()) {
                this.openAdminPanel();
            } else {
                this.showAuthModal();
            }
        });
        this.closeAdmin?.addEventListener('click', () => this.closeAdminPanel());
        this.adminOverlay?.addEventListener('click', () => this.closeAdminPanel());
        this.cancelBtn?.addEventListener('click', () => this.closeAdminPanel());
        
        // Form submission
        this.postForm?.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Export functionality
        this.exportBtn?.addEventListener('click', () => this.exportPosts());
        
        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => this.filterPosts(btn.dataset.filter));
        });
        
        // AI excerpt generation
        this.generateExcerptBtn?.addEventListener('click', () => this.generateExcerpt());
        
        // Post status change - show/hide schedule field
        this.postStatus?.addEventListener('change', () => this.handleStatusChange());
        
        // Paste image into content area
        this.postContent?.addEventListener('paste', (e) => this.handleContentPaste(e));
        
        // Autosave: track form changes
        [this.postTitle, this.postContent, this.postCategory, this.postTags].forEach(el => {
            el?.addEventListener('input', () => this.triggerAutosave());
        });
        
        // Markdown toolbar buttons
        this.markdownToolbar?.querySelectorAll('.md-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleMarkdownAction(btn.dataset.action));
        });
        
        // Preview toggle
        this.previewButtons?.forEach(btn => {
            btn.addEventListener('click', () => this.togglePreviewMode(btn.dataset.mode));
        });
        
        // Update preview on content change
        this.postContent?.addEventListener('input', () => this.updatePreview());
        
        // Keyboard shortcuts for markdown
        this.postContent?.addEventListener('keydown', (e) => this.handleMarkdownShortcuts(e));
    }
    
    // ============================================
    // Autosave System
    // ============================================
    startAutosave() {
        // Clear any existing interval
        this.stopAutosave();
        
        // Save every 30 seconds
        this.autosaveInterval = setInterval(() => {
            this.autosaveDraft();
        }, 30000);
        
        // Load any existing draft
        this.loadDraft();
    }
    
    stopAutosave() {
        if (this.autosaveInterval) {
            clearInterval(this.autosaveInterval);
            this.autosaveInterval = null;
        }
    }
    
    triggerAutosave() {
        // Debounced autosave on input
        if (this.autosaveTimeout) clearTimeout(this.autosaveTimeout);
        this.autosaveTimeout = setTimeout(() => {
            this.autosaveDraft();
        }, 3000); // Save 3 seconds after user stops typing
    }
    
    autosaveDraft() {
        const draft = this.getDraftData();
        
        // Only save if content has changed
        const currentContent = JSON.stringify(draft);
        if (currentContent === this.lastSavedContent) return;
        
        // Don't save empty drafts
        if (!draft.title && !draft.content) return;
        
        try {
            localStorage.setItem(this.autosaveKey, JSON.stringify({
                ...draft,
                savedAt: new Date().toISOString()
            }));
            this.lastSavedContent = currentContent;
            this.showAutosaveIndicator();
        } catch (error) {
            console.error('Autosave failed:', error);
        }
    }
    
    getDraftData() {
        return {
            id: this.postId?.value || '',
            title: this.postTitle?.value || '',
            category: this.postCategory?.value || '',
            content: this.postContent?.value || '',
            tags: this.postTags?.value || '',
            image: this.postImage?.value || ''
        };
    }
    
    loadDraft() {
        try {
            const saved = localStorage.getItem(this.autosaveKey);
            if (!saved) return;
            
            const draft = JSON.parse(saved);
            
            // Only load draft if form is empty (not editing existing post)
            if (this.postId?.value) return;
            
            // Check if draft has content
            if (!draft.title && !draft.content) return;
            
            // Ask user if they want to restore draft
            const savedTime = draft.savedAt ? new Date(draft.savedAt).toLocaleString() : 'Unknown time';
            if (confirm(`Found unsaved draft from ${savedTime}. Would you like to restore it?`)) {
                this.restoreDraft(draft);
            } else {
                this.clearDraft();
            }
        } catch (error) {
            console.error('Failed to load draft:', error);
        }
    }
    
    restoreDraft(draft) {
        if (draft.title) this.postTitle.value = draft.title;
        if (draft.category) this.postCategory.value = draft.category;
        if (draft.content) this.postContent.value = draft.content;
        if (draft.tags) this.postTags.value = draft.tags;
        if (draft.image) this.showImagePreview(draft.image);
        
        this.lastSavedContent = JSON.stringify(draft);
        this.showAutosaveIndicator('Draft restored');
    }
    
    clearDraft() {
        localStorage.removeItem(this.autosaveKey);
        this.lastSavedContent = '';
    }
    
    showAutosaveIndicator(message = 'Draft saved') {
        // Create or update autosave indicator
        let indicator = document.getElementById('autosave-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'autosave-indicator';
            indicator.className = 'autosave-indicator';
            this.adminPanel?.querySelector('.admin-header')?.appendChild(indicator);
        }
        
        indicator.textContent = `✓ ${message}`;
        indicator.classList.add('show');
        
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 2000);
    }
    
    // ============================================
    // Markdown Toolbar
    // ============================================
    handleMarkdownAction(action) {
        const textarea = this.postContent;
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selected = text.substring(start, end);
        
        let insertion = '';
        let cursorOffset = 0;
        
        switch (action) {
            case 'bold':
                insertion = `**${selected || 'bold text'}**`;
                cursorOffset = selected ? 0 : -2;
                break;
            case 'italic':
                insertion = `*${selected || 'italic text'}*`;
                cursorOffset = selected ? 0 : -1;
                break;
            case 'strikethrough':
                insertion = `~~${selected || 'strikethrough'}~~`;
                cursorOffset = selected ? 0 : -2;
                break;
            case 'h1':
                insertion = `\n# ${selected || 'Heading 1'}\n`;
                break;
            case 'h2':
                insertion = `\n## ${selected || 'Heading 2'}\n`;
                break;
            case 'h3':
                insertion = `\n### ${selected || 'Heading 3'}\n`;
                break;
            case 'link':
                const url = selected.startsWith('http') ? selected : 'https://example.com';
                insertion = `[${selected || 'link text'}](${url})`;
                break;
            case 'image':
                const imgUrl = prompt('Enter image URL:', selected.startsWith('http') ? selected : 'https://');
                if (imgUrl) {
                    const altText = prompt('Enter alt text (description):', 'Image') || 'Image';
                    insertion = `![${altText}](${imgUrl})`;
                } else {
                    return; // User cancelled
                }
                break;
            case 'code':
                insertion = `\`${selected || 'code'}\``;
                cursorOffset = selected ? 0 : -1;
                break;
            case 'codeblock':
                insertion = `\n\`\`\`\n${selected || 'code here'}\n\`\`\`\n`;
                break;
            case 'ul':
                insertion = selected ? selected.split('\n').map(line => `- ${line}`).join('\n') : '- List item';
                break;
            case 'ol':
                insertion = selected ? selected.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n') : '1. List item';
                break;
            case 'quote':
                insertion = selected ? selected.split('\n').map(line => `> ${line}`).join('\n') : '> Quote';
                break;
            default:
                return;
        }
        
        // Insert text
        textarea.value = text.substring(0, start) + insertion + text.substring(end);
        
        // Set cursor position
        const newPos = start + insertion.length + cursorOffset;
        textarea.setSelectionRange(newPos, newPos);
        textarea.focus();
        
        // Trigger autosave
        this.triggerAutosave();
    }
    
    handleMarkdownShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    this.handleMarkdownAction('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    this.handleMarkdownAction('italic');
                    break;
                case 'k':
                    e.preventDefault();
                    this.handleMarkdownAction('link');
                    break;
            }
        }
    }
    
    // ============================================
    // Preview Mode
    // ============================================
    togglePreviewMode(mode) {
        const isPreview = mode === 'preview';
        
        // Update buttons
        this.previewButtons?.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Toggle preview/edit view
        if (isPreview) {
            this.contentWrapper?.classList.add('preview-mode');
            this.previewContainer.classList.add('active');
            this.updatePreview();
        } else {
            this.contentWrapper?.classList.remove('preview-mode');
            this.previewContainer.classList.remove('active');
            this.postContent?.focus();
        }
    }
    
    updatePreview() {
        if (!this.previewContainer || !this.previewContainer.classList.contains('active')) return;
        
        const content = this.postContent?.value || '';
        this.previewContainer.innerHTML = this.formatContent(content);
    }
    
    // ============================================
    // Reading Time Calculation
    // ============================================
    calculateReadingTime(text) {
        const wordsPerMinute = 200;
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        const minutes = Math.ceil(words / wordsPerMinute);
        return minutes < 1 ? '< 1 min read' : `${minutes} min read`;
    }
    
    // ============================================
    // Reading Progress Bar
    // ============================================
    initReadingProgress() {
        // Create progress bar if not exists
        if (!this.readingProgressContainer) {
            this.readingProgressContainer = document.createElement('div');
            this.readingProgressContainer.className = 'reading-progress-container';
            this.readingProgressContainer.innerHTML = '<div class="reading-progress-bar"></div>';
            document.body.appendChild(this.readingProgressContainer);
        }
    }
    
    showReadingProgress() {
        this.initReadingProgress();
        this.readingProgressContainer.classList.add('visible');
        
        // The blog reader scrolls internally, so we attach to the reader element
        const reader = document.getElementById('blogReader');
        if (reader) {
            this.scrollHandler = () => this.updateReadingProgress();
            reader.addEventListener('scroll', this.scrollHandler);
        }
    }
    
    hideReadingProgress() {
        this.readingProgressContainer?.classList.remove('visible');
        
        const reader = document.getElementById('blogReader');
        if (reader && this.scrollHandler) {
            reader.removeEventListener('scroll', this.scrollHandler);
        }
    }
    
    updateReadingProgress() {
        const reader = document.getElementById('blogReader');
        if (!reader) return;
        
        // Calculate scroll progress based on reader's scroll position
        const scrollTop = reader.scrollTop;
        const scrollHeight = reader.scrollHeight - reader.clientHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        
        const bar = this.readingProgressContainer?.querySelector('.reading-progress-bar');
        if (bar) {
            bar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }
    }
    
    async handleContentPaste(e) {
        const items = e.clipboardData?.items;
        if (!items) return;
        
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    await this.insertImageIntoContent(file);
                }
                return;
            }
        }
    }
    
    async insertImageIntoContent(file) {
        // Show uploading indicator in content
        const cursorPos = this.postContent.selectionStart;
        const textBefore = this.postContent.value.substring(0, cursorPos);
        const textAfter = this.postContent.value.substring(cursorPos);
        
        const placeholder = '\n[⏳ Processing image...]\n';
        this.postContent.value = textBefore + placeholder + textAfter;
        
        try {
            // Convert image to Base64 data URL
            const base64 = await this.fileToBase64(file);
            
            // Replace placeholder with actual image markdown using data URL
            this.postContent.value = textBefore + `\n![Screenshot](${base64})\n` + textAfter;
            
            // Trigger autosave
            this.triggerAutosave();
        } catch (error) {
            // Remove placeholder on error
            this.postContent.value = textBefore + '\n[❌ Image processing failed]\n' + textAfter;
            console.error('Image processing error:', error);
        }
    }
    
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    initializeImageUpload() {
        if (!this.imageUploadArea) return;
        
        // File input change
        this.imageFileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleImageUpload(file);
        });
        
        // Drag and drop
        this.imageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.imageUploadArea.classList.add('drag-over');
        });
        
        this.imageUploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.imageUploadArea.classList.remove('drag-over');
        });
        
        this.imageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.imageUploadArea.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImageUpload(file);
            }
        });
        
        // Remove image button
        this.removeImageBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.clearImagePreview();
        });
    }
    
    async handleImageUpload(file) {
        // Validate file size (2MB for featured image to keep localStorage manageable)
        if (file.size > 2 * 1024 * 1024) {
            this.showUploadStatus('File too large. Maximum size is 2MB for featured images.', 'error');
            return;
        }
        
        // Show processing status
        this.showUploadStatus('Processing...', 'uploading');
        
        try {
            // Convert to Base64 data URL
            const base64 = await this.fileToBase64(file);
            
            // Show preview
            this.previewImg.src = base64;
            this.uploadPlaceholder.style.display = 'none';
            this.imagePreview.style.display = 'block';
            
            // Store the base64 data URL as the image value
            this.postImage.value = base64;
            this.showUploadStatus('Image ready!', 'success');
        } catch (error) {
            console.error('Image processing error:', error);
            this.showUploadStatus('Processing failed. Please try again.', 'error');
            this.clearImagePreview();
        }
    }
    
    showUploadStatus(message, type) {
        if (!this.uploadStatus) return;
        this.uploadStatus.textContent = message;
        this.uploadStatus.className = 'upload-status ' + type;
        
        // Clear success/error messages after 3 seconds
        if (type !== 'uploading') {
            setTimeout(() => {
                this.uploadStatus.textContent = '';
                this.uploadStatus.className = 'upload-status';
            }, 3000);
        }
    }
    
    clearImagePreview() {
        this.postImage.value = '';
        this.imageFileInput.value = '';
        this.previewImg.src = '';
        this.uploadPlaceholder.style.display = 'flex';
        this.imagePreview.style.display = 'none';
        this.uploadStatus.textContent = '';
        this.uploadStatus.className = 'upload-status';
    }
    
    showImagePreview(imagePath) {
        if (!imagePath) {
            this.clearImagePreview();
            return;
        }
        this.previewImg.src = imagePath;
        this.postImage.value = imagePath;
        this.uploadPlaceholder.style.display = 'none';
        this.imagePreview.style.display = 'block';
    }
    
    filterPosts(category) {
        this.currentFilter = category;
        this.currentPage = 1; // Reset to first page when filtering
        
        // Update active button and accessibility
        this.filterButtons.forEach(btn => {
            const isActive = btn.dataset.filter === category;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive);
        });
        
        this.renderPosts();
    }
    
    goToPage(page) {
        this.currentPage = page;
        this.renderPosts();
        // Scroll to blog section
        document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    openAdminPanel() {
        this.adminPanel.style.display = 'flex';
        this.renderAdminPosts();
        // Reset form for new post
        if (!this.currentEditId) {
            this.postForm.reset();
            this.clearImagePreview();
            this.postId.value = '';
            this.handleStatusChange(); // Reset schedule visibility
        }
        // Start autosave
        this.startAutosave();
        // Check for scheduled posts that should be published
        this.checkScheduledPosts();
    }
    
    handleStatusChange() {
        const status = this.postStatus?.value || 'published';
        
        // Show/hide schedule field
        if (this.scheduleGroup) {
            this.scheduleGroup.style.display = status === 'scheduled' ? 'block' : 'none';
        }
        
        // Update submit button text
        if (this.submitBtn) {
            switch (status) {
                case 'draft':
                    this.submitBtn.textContent = '💾 Save Draft';
                    break;
                case 'scheduled':
                    this.submitBtn.textContent = '📅 Schedule Post';
                    break;
                default:
                    this.submitBtn.textContent = '📢 Publish Post';
            }
        }
    }
    
    checkScheduledPosts() {
        const now = new Date();
        let hasChanges = false;
        
        this.posts.forEach(post => {
            if (post.status === 'scheduled' && post.scheduledDate) {
                const scheduledTime = new Date(post.scheduledDate);
                if (scheduledTime <= now) {
                    post.status = 'published';
                    post.date = post.scheduledDate;
                    hasChanges = true;
                }
            }
        });
        
        if (hasChanges) {
            this.savePosts();
            this.renderPosts();
        }
    }

    closeAdminPanel() {
        this.adminPanel.style.display = 'none';
        this.currentEditId = null;
        this.postForm.reset();
        this.postId.value = '';
        this.clearImagePreview();
        this.clearExcerptStatus();
        // Stop autosave
        this.stopAutosave();
    }
    
    async generateExcerpt() {
        const title = this.postTitle.value.trim();
        const content = this.postContent.value.trim();
        
        if (!title && !content) {
            this.showExcerptStatus('Please add a title or content first.', 'error');
            return;
        }
        
        if (!content || content.length < 20) {
            this.showExcerptStatus('Please write more content first (at least a paragraph).', 'error');
            return;
        }
        
        // Show loading state
        this.generateExcerptBtn.disabled = true;
        this.generateExcerptBtn.innerHTML = '⏳ Generating...';
        this.showExcerptStatus('Creating excerpt...', 'loading');
        
        try {
            // Try AI first
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Write ONE compelling sentence summarizing this blog post. Keep it engaging, professional, and under 120 characters.

Title: ${title}

Content: ${content.substring(0, 1500)}

Respond with ONLY one sentence, no quotes, no explanation.`
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Clean up the response and set it
            let excerpt = data.response.trim();
            // Remove quotes if AI added them
            excerpt = excerpt.replace(/^["']|["']$/g, '');
            
            this.postExcerpt.value = excerpt;
            this.showExcerptStatus('✓ Excerpt generated with AI!', 'success');
            
        } catch (error) {
            console.log('AI unavailable, using smart fallback:', error.message);
            
            // Fallback: Create a smart excerpt from content
            const excerpt = this.createSmartExcerpt(content, title);
            this.postExcerpt.value = excerpt;
            this.showExcerptStatus('✓ Excerpt created!', 'success');
        } finally {
            this.generateExcerptBtn.disabled = false;
            this.generateExcerptBtn.innerHTML = '✨ Auto-generate';
        }
    }
    
    createSmartExcerpt(content, title) {
        // Clean up content - remove extra whitespace, markdown, etc.
        let text = content
            .replace(/#{1,6}\s/g, '') // Remove markdown headers
            .replace(/\*\*|__/g, '') // Remove bold
            .replace(/\*|_/g, '') // Remove italic
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/`[^`]+`/g, '') // Remove inline code
            .replace(/\n+/g, ' ') // Replace newlines with spaces
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        
        // Find first sentence ending with . ! or ?
        const firstSentenceMatch = text.match(/^[^.!?]+[.!?]/);
        let excerpt = '';
        
        if (firstSentenceMatch && firstSentenceMatch[0].length >= 30) {
            excerpt = firstSentenceMatch[0].trim();
        } else {
            // Fallback: get first 100 chars and end at word boundary
            excerpt = text.substring(0, 100);
            const lastSpace = excerpt.lastIndexOf(' ');
            if (lastSpace > 40) {
                excerpt = excerpt.substring(0, lastSpace);
            }
            if (!excerpt.match(/[.!?]$/)) {
                excerpt += '...';
            }
        }
        
        // Trim to max length (100 chars for single sentence)
        if (excerpt.length > 100) {
            excerpt = excerpt.substring(0, 97) + '...';
        }
        
        return excerpt;
    }
    
    showExcerptStatus(message, type) {
        if (!this.excerptStatus) return;
        this.excerptStatus.textContent = message;
        this.excerptStatus.className = 'form-hint excerpt-status ' + type;
        
        if (type === 'success' || type === 'error') {
            setTimeout(() => this.clearExcerptStatus(), 4000);
        }
    }
    
    clearExcerptStatus() {
        if (this.excerptStatus) {
            this.excerptStatus.textContent = '';
            this.excerptStatus.className = 'form-hint';
        }
    }

    async loadPosts() {
        try {
            // Only fetch from GitHub API
            const response = await fetch('/api/posts', { cache: 'no-store' });
            if (response.ok) {
                const posts = await response.json();
                if (Array.isArray(posts)) {
                    this.posts = posts;
                    console.log('Loaded', posts.length, 'posts from GitHub');
                } else {
                    this.posts = [];
                    console.log('Invalid API response, using empty array');
                }
            } else {
                this.posts = [];
                console.log('API failed, using empty array');
            }
            // Sort by date, newest first
            this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
            this.renderPosts();
        } catch (error) {
            console.error('Error loading posts:', error);
            this.posts = [];
            this.renderPosts();
        }
    }

    async savePosts(savedPost) {
        // Try localStorage (best-effort, may hit quota)
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.posts));
        } catch (storageError) {
            console.warn('localStorage quota exceeded, clearing old data:', storageError);
            try {
                localStorage.removeItem(this.storageKey);
                localStorage.setItem(this.storageKey, JSON.stringify(this.posts));
            } catch (e) {
                console.warn('localStorage still full after cleanup, skipping local save');
            }
        }

        // Save to GitHub if authenticated — send only the single post
        if (this.isAuthenticated() && savedPost) {
            try {
                const token = sessionStorage.getItem(this._authToken) || localStorage.getItem(this._authToken);
                const response = await fetch('/api/posts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ post: savedPost })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    const detail = errData.error || `HTTP ${response.status}`;
                    console.error('Failed to save to GitHub:', errData);
                    alert(`Failed to save post to GitHub.\nServer error: ${detail}\nChanges saved locally only.`);
                } else {
                    // Update local state immediately — raw.githubusercontent.com CDN
                    // caches up to 5 min after a write, so re-fetching would show stale data.
                    const idx = this.posts.findIndex(p => p.id === savedPost.id);
                    if (idx !== -1) {
                        this.posts[idx] = savedPost;
                    } else {
                        this.posts.unshift(savedPost);
                    }
                    this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
                    this.renderPosts();
                }
            } catch (error) {
                console.error('Error saving posts to GitHub:', error);
                alert('Failed to save post to GitHub. Changes saved locally only.');
            }
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const content = this.postContent.value.trim();
        const status = this.postStatus?.value || 'published';
        const scheduledDate = this.postSchedule?.value || null;
        
        // Validate scheduled date
        if (status === 'scheduled' && !scheduledDate) {
            alert('Please select a date and time for scheduled posts.');
            return;
        }
        
        // Use AI-generated excerpt if available, otherwise auto-generate from content
        const storedExcerpt = this.postExcerpt?.value.trim();
        const autoExcerpt = storedExcerpt || this.createSmartExcerpt(content, this.postTitle.value.trim());
        
        const post = {
            id: this.postId.value || this.generateId(),
            title: this.postTitle.value.trim(),
            category: this.postCategory.value,
            excerpt: autoExcerpt,
            content: content,
            tags: this.postTags.value.split(',').map(tag => tag.trim()).filter(tag => tag),
            image: this.postImage?.value.trim() || '',
            status: status,
            scheduledDate: status === 'scheduled' ? scheduledDate : null,
            date: status === 'published' ? new Date().toISOString() : (status === 'scheduled' ? scheduledDate : null),
            updated: new Date().toISOString()
        };

        if (this.postId.value) {
            // Update existing post
            const index = this.posts.findIndex(p => p.id === this.postId.value);
            if (index !== -1) {
                // Keep original date if already published
                if (this.posts[index].status === 'published' && status === 'published') {
                    post.date = this.posts[index].date;
                }
                this.posts[index] = post;
            }
        } else {
            // Add new post
            this.posts.unshift(post); // Add to beginning
        }

        this.savePosts(post);
        this.renderPosts();
        
        // Clear draft on successful publish
        this.clearDraft();
        
        this.closeAdminPanel();
        
        // Show appropriate message
        const messages = {
            'published': '📢 Post published!',
            'draft': '📝 Draft saved!',
            'scheduled': `📅 Post scheduled for ${new Date(scheduledDate).toLocaleString()}`
        };
        
        // Scroll to blog section (only for published posts)
        if (status === 'published') {
            document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth' });
        }
    }

    generateId() {
        return 'post-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    editPost(id) {
        const post = this.posts.find(p => p.id === id);
        if (!post) return;

        this.currentEditId = id;
        this.postId.value = post.id;
        this.postTitle.value = post.title;
        this.postCategory.value = post.category;
        this.postExcerpt.value = post.excerpt;
        this.postContent.value = post.content;
        this.postTags.value = post.tags.join(', ');
        
        // Populate status and schedule
        if (this.postStatus) {
            this.postStatus.value = post.status || 'published';
        }
        if (this.postSchedule && post.scheduledDate) {
            this.postSchedule.value = post.scheduledDate.slice(0, 16); // Format for datetime-local
        }
        this.handleStatusChange();
        
        // Show existing image if present
        this.showImagePreview(post.image || '');
        
        this.openAdminPanel();
    }

    deletePost(id) {
        const post = this.posts.find(p => p.id === id);
        if (!post) return;
        
        // Create custom delete confirmation modal
        const modal = document.createElement('div');
        modal.className = 'delete-modal';
        modal.innerHTML = `
            <div class="delete-modal-overlay"></div>
            <div class="delete-modal-content">
                <div class="delete-modal-icon">🗑️</div>
                <h3 class="delete-modal-title">Delete Post?</h3>
                <p class="delete-modal-text">Are you sure you want to delete "<strong>${this.escapeHtml(post.title)}</strong>"?</p>
                <p class="delete-modal-warning">This action cannot be undone.</p>
                <div class="delete-modal-actions">
                    <button class="delete-modal-cancel">Cancel</button>
                    <button class="delete-modal-confirm">Delete Post</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Animate in
        requestAnimationFrame(() => modal.classList.add('active'));
        
        // Handle cancel
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 200);
        };
        
        modal.querySelector('.delete-modal-overlay').onclick = closeModal;
        modal.querySelector('.delete-modal-cancel').onclick = closeModal;
        
        // Handle confirm delete
        modal.querySelector('.delete-modal-confirm').onclick = async () => {
            const deletedId = id;
            this.posts = this.posts.filter(p => p.id !== id);
            this.savePosts();
            this.renderPosts();
            this.renderAdminPosts();
            closeModal();

            // Also delete from GitHub
            if (this.isAuthenticated()) {
                try {
                    const token = sessionStorage.getItem(this._authToken) || localStorage.getItem(this._authToken);
                    const response = await fetch('/api/posts', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ postId: deletedId })
                    });
                    if (!response.ok) {
                        console.warn('Failed to delete from GitHub:', await response.json().catch(() => ({})));
                    }
                } catch (error) {
                    console.warn('Error deleting from GitHub:', error);
                }
            }
        };
    }

    renderPosts() {
        // Check for scheduled posts that should now be published
        this.checkScheduledPosts();
        
        // Filter posts - only show published posts to public
        let filteredPosts = this.posts.filter(p => p.status === 'published' || !p.status);
        
        // Apply category filter
        if (this.currentFilter !== 'all') {
            filteredPosts = filteredPosts.filter(p => p.category === this.currentFilter);
        }
        
        // Sort by date (newest first)
        filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (filteredPosts.length === 0) {
            this.emptyState.style.display = 'block';
            // Update empty state message based on filter
            const emptyMsg = this.emptyState.querySelector('p');
            if (emptyMsg) {
                emptyMsg.textContent = this.currentFilter === 'all'
                    ? 'No posts yet. Check back soon!'
                    : `No posts in ${this.getCategoryLabel(this.currentFilter)} yet.`;
            }
            // Clear any existing posts
            const cards = this.postsContainer.querySelectorAll('.blog-card');
            cards.forEach(card => card.remove());
            // Remove pagination if exists
            const existingPagination = this.postsContainer.parentElement.querySelector('.blog-pagination');
            if (existingPagination) existingPagination.remove();
            return;
        }

        this.emptyState.style.display = 'none';
        
        // Calculate pagination
        const totalPages = Math.ceil(filteredPosts.length / this.postsPerPage);
        const startIndex = (this.currentPage - 1) * this.postsPerPage;
        const endIndex = startIndex + this.postsPerPage;
        const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
        
        this.postsContainer.innerHTML = paginatedPosts.map(post => `
            <div class="blog-card glass-morphism" data-post-id="${post.id}" data-category="${post.category}" onclick="blogManager.openPost('${post.id}')" style="cursor: pointer;">
                <div class="blog-card-image ${post.image ? '' : 'no-image'}">
                    ${post.image 
                        ? `<img src="${this.escapeHtml(post.image)}" alt="${this.escapeHtml(post.title)}" onerror="this.parentElement.classList.add('no-image'); this.style.display='none'; this.parentElement.innerHTML='${this.getCategoryIcon(post.category)}';">
                           <div class="image-overlay"></div>`
                        : this.getCategoryIcon(post.category)
                    }
                </div>
                <div class="blog-card-body">
                    <div class="blog-card-header">
                        <span class="blog-category category-${post.category}">${this.getCategoryLabel(post.category)}</span>
                        <span class="blog-date">${this.formatDate(post.date)}</span>
                    </div>
                    <h3 class="blog-title">${this.escapeHtml(post.title)}</h3>
                    ${post.excerpt ? `<p class="blog-excerpt">${this.escapeHtml(post.excerpt)}</p>` : ''}
                    <div class="blog-footer">
                        <div class="blog-stats">
                            <span class="blog-stat likes-stat" title="Likes">
                                <span class="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></span>
                                <span class="stat-count">${post.likes || 0}</span>
                            </span>
                            <span class="blog-stat comments-stat" title="Comments">
                                <span class="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
                                <span class="stat-count">${post.comments?.length || 0}</span>
                            </span>
                        </div>
                        <span class="read-more-btn">
                            Read More <span class="arrow">→</span>
                        </span>
                    </div>
                </div>
            </div>
        `).join('') + this.emptyState.outerHTML;
        
        // Re-get empty state reference since we rebuilt the HTML
        this.emptyState = document.getElementById('empty-blog-state');
        
        // Render pagination if more than one page
        this.renderPagination(totalPages, filteredPosts.length);
    }
    
    renderPagination(totalPages, totalPosts) {
        // Remove existing pagination
        const existingPagination = this.postsContainer.parentElement.querySelector('.blog-pagination');
        if (existingPagination) existingPagination.remove();
        
        // Don't show pagination if only one page
        if (totalPages <= 1) return;
        
        const paginationHTML = `
            <div class="blog-pagination">
                <button class="pagination-btn pagination-prev ${this.currentPage === 1 ? 'disabled' : ''}" 
                        onclick="blogManager.goToPage(${this.currentPage - 1})" 
                        ${this.currentPage === 1 ? 'disabled' : ''}>
                    <span>←</span> Previous
                </button>
                <div class="pagination-info">
                    <span class="pagination-current">Page ${this.currentPage}</span>
                    <span class="pagination-separator">of</span>
                    <span class="pagination-total">${totalPages}</span>
                </div>
                <button class="pagination-btn pagination-next ${this.currentPage === totalPages ? 'disabled' : ''}" 
                        onclick="blogManager.goToPage(${this.currentPage + 1})"
                        ${this.currentPage === totalPages ? 'disabled' : ''}>
                    Next <span>→</span>
                </button>
            </div>
        `;
        
        this.postsContainer.insertAdjacentHTML('afterend', paginationHTML);
    }
    
    getCategoryIcon(category) {
        const icons = {
            'power-platform': '⚡',
            'ai-copilot': '🤖',
            'dashboards': '📊',
            'gis-gov': '🏛️',
            'career-tutorials': '🎯'
        };
        return icons[category] || '✍️';
    }

    renderAdminPosts() {
        if (!this.adminPostsContainer) return;

        if (this.posts.length === 0) {
            this.adminPostsContainer.innerHTML = '<p class="no-posts">No posts yet</p>';
            return;
        }

        this.adminPostsContainer.innerHTML = this.posts.map(post => {
            const status = post.status || 'published';
            const statusBadge = this.getStatusBadge(status, post.scheduledDate);
            
            return `
                <div class="admin-post-item">
                    <div class="admin-post-info">
                        <strong>${this.escapeHtml(post.title)}</strong>
                        ${statusBadge}
                        <span class="admin-post-date">${post.date ? this.formatDate(post.date) : 'Not published'}</span>
                    </div>
                    <div class="admin-post-actions">
                        <button class="btn-edit" onclick="blogManager.editPost('${post.id}')">Edit</button>
                        <button class="btn-delete" onclick="blogManager.deletePost('${post.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    getStatusBadge(status, scheduledDate) {
        const badges = {
            'draft': '<span class="post-status-badge draft">📝 Draft</span>',
            'scheduled': `<span class="post-status-badge scheduled">📅 ${scheduledDate ? new Date(scheduledDate).toLocaleDateString() : 'Scheduled'}</span>`,
            'published': ''
        };
        return badges[status] || '';
    }

    openPost(id) {
        const post = this.posts.find(p => p.id === id);
        if (!post) return;

        // Use full-page blog reader (better for tutorials!)
        const reader = document.getElementById('blogReader');
        const readerCategory = document.getElementById('readerCategory');
        const readerDate = document.getElementById('readerDate');
        const readerTitle = document.getElementById('readerTitle');
        const readerTitleBar = document.getElementById('readerTitleBar');
        const readerFeatured = document.getElementById('readerFeatured');
        const readerBody = document.getElementById('readerBody');
        const readerTags = document.getElementById('readerTags');
        const closeBtn = document.getElementById('closeBlogReader');
        const shareBtn = document.getElementById('sharePost');

        // Populate reader
        readerCategory.textContent = this.getCategoryLabel(post.category);
        readerCategory.className = `blog-reader-category category-${post.category}`;
        
        // Add reading time
        const readingTime = this.calculateReadingTime(post.content);
        readerDate.innerHTML = `${this.formatDate(post.date)} <span class="reading-time"><span class="reading-time-icon">📖</span>${readingTime}</span>`;
        
        readerTitle.textContent = post.title;
        readerTitleBar.textContent = post.title;
        
        // Featured image
        if (post.image) {
            readerFeatured.innerHTML = `<img src="${this.escapeHtml(post.image)}" alt="${this.escapeHtml(post.title)}">`;
            readerFeatured.style.display = 'block';
        } else {
            readerFeatured.style.display = 'none';
        }
        
        // Content with markdown-like formatting
        readerBody.innerHTML = this.formatContent(post.content);
        
        // Apply Prism.js syntax highlighting
        if (typeof Prism !== 'undefined') {
            Prism.highlightAllUnder(readerBody);
        }
        
        // Tags
        if (post.tags && post.tags.length > 0) {
            readerTags.innerHTML = post.tags.map(tag => 
                `<span class="blog-tag">${this.escapeHtml(tag)}</span>`
            ).join('');
        } else {
            readerTags.innerHTML = '';
        }
        
        // Set up engagement section (likes & comments)
        this.setupEngagement(post);
        
        // Add related posts
        this.addRelatedPosts(post, readerBody);

        // Show reader
        reader.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Show reading progress bar
        this.showReadingProgress();
        
        // Scroll to top of reader
        reader.scrollTop = 0;
        
        // Close handler
        const closeReader = () => {
            reader.classList.remove('active');
            document.body.style.overflow = '';
            // Hide reading progress
            this.hideReadingProgress();
            // Clean up event listeners
            document.removeEventListener('keydown', this._readerEscHandler);
            window.removeEventListener('popstate', this._readerPopStateHandler);
            this._readerEscHandler = null;
            this._readerPopStateHandler = null;
            // Scroll back to blog section
            setTimeout(() => {
                document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        };
        
        closeBtn.onclick = closeReader;
        
        // Share functionality
        shareBtn.onclick = () => {
            if (navigator.share) {
                navigator.share({
                    title: post.title,
                    text: post.excerpt || `Check out this article: ${post.title}`,
                    url: window.location.href
                });
            } else {
                // Copy URL fallback
                navigator.clipboard?.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        };
        
        // Remove any existing reader keyboard/popstate handlers before adding new ones
        if (this._readerEscHandler) document.removeEventListener('keydown', this._readerEscHandler);
        if (this._readerPopStateHandler) window.removeEventListener('popstate', this._readerPopStateHandler);
        
        // ESC key to close
        this._readerEscHandler = (e) => {
            if (e.key === 'Escape') closeReader();
        };
        document.addEventListener('keydown', this._readerEscHandler);
        
        // Browser back button support
        history.pushState({ blogPost: id }, post.title, `#blog-${id}`);
        
        this._readerPopStateHandler = () => {
            if (reader.classList.contains('active')) closeReader();
        };
        window.addEventListener('popstate', this._readerPopStateHandler);
    }

    formatContent(content) {
        // Step 1: Extract and protect code blocks FIRST to prevent inner content being transformed
        const codeBlocks = [];
        const inlineCodes = [];

        let html = content.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || 'plaintext';
            const langClass = `language-${language}`;
            const idx = codeBlocks.length;
            codeBlocks.push(`<pre class="${langClass}"><code class="${langClass}">${this.escapeHtml(code.trim())}</code></pre>`);
            return `__CODEBLOCK_${idx}__`;
        });

        // Step 2: Extract inline code (XSS-safe)
        html = html.replace(/`([^`]+)`/g, (match, code) => {
            const idx = inlineCodes.length;
            inlineCodes.push(`<code>${this.escapeHtml(code)}</code>`);
            return `__INLINECODE_${idx}__`;
        });

        // Step 3: Headers
        html = html
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>');

        // Step 4: Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
            '<img src="$2" alt="$1" class="content-image" loading="lazy">');

        // Step 5: Bold & Italic
        html = html
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Step 6: Strikethrough
        html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

        // Step 7: Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // Step 8: Blockquotes (single-line; collapse consecutive lines into one block)
        html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
        html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br>');

        // Step 9: Ordered list items (mark so we can wrap them)
        html = html.replace(/^\d+\. (.+)$/gm, '<li data-ol>$1</li>');

        // Step 10: Unordered list items
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');

        // Step 11: Wrap in paragraphs (split on blank lines)
        html = html.split('\n\n').map(para => {
            para = para.trim();
            if (!para) return '';

            // Already a block-level element or code placeholder
            const isBlock = /^<(h[1-6]|pre|blockquote|ul|ol|img)/i.test(para) ||
                            para.startsWith('__CODEBLOCK_');
            if (isBlock) return para;

            if (para.includes('<li data-ol>')) {
                return `<ol>${para.replace(/<li data-ol>/g, '<li>')}</ol>`;
            }
            if (para.includes('<li>')) {
                return `<ul>${para}</ul>`;
            }
            return `<p>${para.replace(/\n/g, '<br>')}</p>`;
        }).join('');

        // Step 12: Restore code blocks and inline codes
        codeBlocks.forEach((block, i) => {
            html = html.split(`__CODEBLOCK_${i}__`).join(block);
        });
        inlineCodes.forEach((code, i) => {
            html = html.split(`__INLINECODE_${i}__`).join(code);
        });

        return html;
    }

    getCategoryLabel(category) {
        const labels = {
            'power-platform': 'Power Platform',
            'ai-copilot': 'AI & Copilot',
            'dashboards': 'Dashboards',
            'gis-gov': 'GIS & Gov',
            'career-tutorials': 'Career & Tutorials'
        };
        return labels[category] || category;
    }

    formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    exportPosts() {
        const dataStr = JSON.stringify(this.posts, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `blog-posts-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        alert('Blog posts exported successfully!');
    }

    // Method to import posts from JSON (can be called manually from console)
    importPosts(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            if (Array.isArray(imported)) {
                this.posts = imported;
                this.savePosts();
                this.renderPosts();
                this.renderAdminPosts();
                alert('Posts imported successfully!');
            }
        } catch (error) {
            console.error('Error importing posts:', error);
            alert('Failed to import posts. Invalid JSON format.');
        }
    }

    // Get posts for AI chat context
    getPostsForContext() {
        return this.posts.map(post => ({
            title: post.title,
            category: post.category,
            excerpt: post.excerpt,
            date: this.formatDate(post.date),
            tags: post.tags
        }));
    }
    
    // ============================================
    // Related Posts
    // ============================================
    addRelatedPosts(currentPost, container) {
        // Find related posts (same category, excluding current)
        const related = this.posts
            .filter(p => p.id !== currentPost.id && p.category === currentPost.category)
            .slice(0, 3);
        
        // If not enough from same category, add recent posts
        if (related.length < 3) {
            const moreNeeded = 3 - related.length;
            const additionalPosts = this.posts
                .filter(p => p.id !== currentPost.id && !related.find(r => r.id === p.id))
                .slice(0, moreNeeded);
            related.push(...additionalPosts);
        }
        
        if (related.length === 0) return;
        
        // Create related posts section
        const relatedSection = document.createElement('div');
        relatedSection.className = 'related-posts-section';
        relatedSection.innerHTML = `
            <h4 class="related-posts-title">📚 Related Posts</h4>
            <div class="related-posts-grid">
                ${related.map(post => `
                    <div class="related-post-card" onclick="blogManager.openPost('${post.id}')">
                        <div class="related-post-title">${this.escapeHtml(post.title)}</div>
                        <div class="related-post-meta">
                            ${this.getCategoryLabel(post.category)} • ${this.formatDate(post.date)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.appendChild(relatedSection);
    }
    
    // ============================================
    // Engagement System (Likes & Comments)
    // ============================================
    setupEngagement(post) {
        const likeButton = document.getElementById('likeButton');
        const likeCount = document.getElementById('likeCount');
        const commentCountDisplay = document.getElementById('commentCountDisplay');
        const commentsCount = document.getElementById('commentsCount');
        const commentForm = document.getElementById('commentForm');
        const commentsList = document.getElementById('commentsList');
        
        if (!likeButton || !commentForm || !commentsList) return;
        
        // Store current post ID for engagement actions
        this.currentPostId = post.id;
        
        // Update like count display
        if (likeCount) likeCount.textContent = post.likes || 0;
        
        // Update comment counts
        const commentTotal = post.comments?.length || 0;
        if (commentCountDisplay) commentCountDisplay.textContent = commentTotal;
        if (commentsCount) commentsCount.textContent = commentTotal;
        
        // Reset like button state
        likeButton.classList.remove('liked');
        
        // Set up like button handler
        likeButton.onclick = () => this.handleLike(post.id);
        
        // Set up comment form handler
        commentForm.onsubmit = (e) => this.handleCommentSubmit(e, post.id);
        
        // Render existing comments (newest first)
        this.renderComments(post.comments || []);
    }
    
    async handleLike(postId) {
        const likeButton = document.getElementById('likeButton');
        const likeCount = document.getElementById('likeCount');
        
        // Disable button while processing
        likeButton.disabled = true;
        likeButton.classList.add('liking');
        
        try {
            const response = await fetch('/api/like', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ postId })
            });
            
            const data = await response.json();
            console.log('Like API response:', response.status, data);
            
            if (data.success) {
                // Update UI
                likeCount.textContent = data.likes;
                likeButton.classList.add('liked');
                
                // Update local post data
                const post = this.posts.find(p => p.id === postId);
                if (post) {
                    post.likes = data.likes;
                    this.savePostsToCache();
                    this.renderPosts(); // Update card counts
                }
                
                this.showToast('Thanks for the like!');
            } else {
                console.error('Like failed:', data);
                this.showToast(data.error || 'Could not add like. Try again!', 'error');
            }
        } catch (error) {
            console.error('Like error:', error);
            this.showToast('Could not add like. Try again!', 'error');
        } finally {
            likeButton.disabled = false;
            likeButton.classList.remove('liking');
        }
    }
    
    async handleCommentSubmit(e, postId) {
        e.preventDefault();
        
        const nameInput = document.getElementById('commentName');
        const contentInput = document.getElementById('commentContent');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        const name = nameInput.value.trim();
        const content = contentInput.value.trim();
        
        if (!name || !content) {
            this.showToast('Please fill in your name and comment!', 'error');
            return;
        }
        
        // Disable form while submitting
        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting...';
        
        try {
            const response = await fetch('/api/comment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ postId, name, content })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update comment counts
                const commentCountDisplay = document.getElementById('commentCountDisplay');
                const commentsCount = document.getElementById('commentsCount');
                if (commentCountDisplay) commentCountDisplay.textContent = data.totalComments;
                if (commentsCount) commentsCount.textContent = data.totalComments;
                
                // Add new comment to top of list
                this.addCommentToList(data.comment);
                
                // Update local post data
                const post = this.posts.find(p => p.id === postId);
                if (post) {
                    if (!post.comments) post.comments = [];
                    post.comments.unshift(data.comment);
                    this.savePostsToCache();
                    this.renderPosts(); // Update card counts
                }
                
                // Clear form
                nameInput.value = '';
                contentInput.value = '';
                
                this.showToast('Comment posted!');
            } else {
                this.showToast(data.error || 'Could not post comment. Try again!', 'error');
            }
        } catch (error) {
            console.error('Comment error:', error);
            this.showToast('Could not post comment. Try again!', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Post Comment';
        }
    }
    
    renderComments(comments) {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to share your thoughts!</p>';
            return;
        }
        
        commentsList.innerHTML = comments.map(comment => this.createCommentHTML(comment)).join('');
    }
    
    addCommentToList(comment) {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;
        
        // Remove "no comments" message if present
        const noComments = commentsList.querySelector('.no-comments');
        if (noComments) noComments.remove();
        
        // Add new comment at top
        const commentHTML = this.createCommentHTML(comment);
        commentsList.insertAdjacentHTML('afterbegin', commentHTML);
        
        // Animate new comment
        const newComment = commentsList.firstElementChild;
        newComment.classList.add('comment-new');
        setTimeout(() => newComment.classList.remove('comment-new'), 500);
    }
    
    createCommentHTML(comment) {
        const date = new Date(comment.createdAt);
        const timeAgo = this.getTimeAgo(date);
        const initial = comment.name.charAt(0).toUpperCase();
        
        return `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">
                        <div class="comment-avatar">${initial}</div>
                        <span class="comment-name">${this.escapeHtml(comment.name)}</span>
                    </span>
                    <span class="comment-date">${timeAgo}</span>
                </div>
                <p class="comment-content">${this.escapeHtml(comment.content)}</p>
            </div>
        `;
    }
    
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        const intervals = [
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'week', seconds: 604800 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 }
        ];
        
        for (const interval of intervals) {
            const count = Math.floor(seconds / interval.seconds);
            if (count >= 1) {
                return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
            }
        }
        
        return 'Just now';
    }
    
    savePostsToCache() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.posts));
        } catch (error) {
            console.error('Failed to save to cache:', error);
        }
    }
    
    showToast(message, type = 'success') {
        // Remove existing toast
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) existingToast.remove();
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Hide and remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize blog manager when DOM is loaded
let blogManager;
document.addEventListener('DOMContentLoaded', function() {
    blogManager = new BlogManager();
    
    // Make it globally accessible for inline onclick handlers
    window.blogManager = blogManager;
});
