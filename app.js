// GORAKH WRITES - Main Application JavaScript

// Fix for mobile scroll issue - Global state management
let isStoryLoading = false;
let currentlyLoadedStory = null;
let storiesData = [];
let filteredStories = [];

// Story file list - Add new story filenames here when you create them
const storyFiles = [
    'consciousness.json',
    'conflict.json',
    'TheGreed-Compass.json',
    'Stillness.json',
    'Haunting.json'
];

// Load all stories from JSON files
async function loadAllStories() {
    const loadedStories = [];
    
    for (const filename of storyFiles) {
        try {
            const response = await fetch(`./stories/${filename}`);
            const story = await response.json();
            loadedStories.push(story);
            console.log(`✅ Loaded: ${story.title}`);
        } catch (error) {
            console.error(`❌ Failed to load: ${filename}`, error);
        }
    }
    
    return loadedStories;
}

// Initialize stories
async function initializeStories() {
    const storyList = document.getElementById('story-list');
    if (storyList) {
        storyList.innerHTML = '<div class="text-center p-3"><div class="spinner-border spinner-border-sm" role="status"></div><p class="mt-2">Loading stories...</p></div>';
    }
    
    storiesData = await loadAllStories();
    filteredStories = [...storiesData];
    
    // Update story count
    const storyCount = document.getElementById('story-count');
    if (storyCount) storyCount.textContent = storiesData.length;
    
    console.log(`📚 Total stories loaded: ${storiesData.length}`);
}

// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        updateThemeIcon('dark');
    }
}

function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('theme-icon');
    if (theme === 'dark') {
        themeIcon.classList.remove('bi-sun-fill');
        themeIcon.classList.add('bi-moon-fill');
    } else {
        themeIcon.classList.remove('bi-moon-fill');
        themeIcon.classList.add('bi-sun-fill');
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark ? 'dark' : 'light');
}

// Fixed displayStory function to prevent reloading
async function displayStory(storyData) {
    if (currentlyLoadedStory === storyData.file || isStoryLoading) {
        return;
    }
    
    isStoryLoading = true;
    currentlyLoadedStory = storyData.file;
    
    const contentDiv = document.getElementById('story-content');
    
    contentDiv.innerHTML = '<div class="d-flex justify-content-center p-4"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    setTimeout(() => {
        contentDiv.innerHTML = storyData.content;
        isStoryLoading = false;
        
        contentDiv.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }, 300);
}

// Story navigation rendering
function renderStories(stories = filteredStories) {
    const storyList = document.getElementById('story-list');
    const storyCount = document.getElementById('story-count');
    if (!storyList) return;
    
    storyList.innerHTML = '';
    if (storyCount) storyCount.textContent = stories.length;
    
    stories.forEach((story, index) => {
        const publishedDate = new Date(story.publishedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const storyItem = document.createElement('div');
        storyItem.className = `story-nav-item ${index === 0 ? 'active' : ''}`;
        
        storyItem.innerHTML = `
            <div class="d-flex flex-column">
                <div class="story-title fw-semibold text-primary mb-1">${story.title}</div>
                <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="genre-badge genre-${story.genre.toLowerCase().replace(/[^a-z0-9]/g, '-')}">${story.genre}</span>
                </div>
                <small class="text-muted">
                    <i class="bi bi-calendar3"></i> ${publishedDate}
                </small>
            </div>
        `;
        
        storyList.appendChild(storyItem);
    });
    
    updateStoryNavigation();
}

// Fixed story navigation event handlers
function updateStoryNavigation() {
    const storyNavItems = document.querySelectorAll('.story-nav-item');
    storyNavItems.forEach((item, index) => {
        item.replaceWith(item.cloneNode(true));
    });
    
    const newStoryNavItems = document.querySelectorAll('.story-nav-item');
    newStoryNavItems.forEach((item, index) => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (isStoryLoading) return;
            
            newStoryNavItems.forEach(navItem => navItem.classList.remove('active'));
            this.classList.add('active');
            
            displayStory(filteredStories[index]);
        });
    });
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('story-search');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            filterStories(query);
        });
    }
}

function filterStories(query = '', selectedGenre = '') {
    filteredStories = storiesData.filter(story => {
        const matchesSearch = !query || 
            story.title.toLowerCase().includes(query) || 
            story.genre.toLowerCase().includes(query);
        
        const matchesGenre = !selectedGenre || selectedGenre === 'all' || 
            story.genre === selectedGenre;
        
        return matchesSearch && matchesGenre;
    });
    
    renderStories(filteredStories);
    
    if (filteredStories.length > 0) {
        currentlyLoadedStory = null;
        displayStory(filteredStories[0]);
    }
}

// Genre filtering
function initializeGenreFilter() {
    const genreFilter = document.getElementById('genre-filter');
    if (genreFilter) {
        const genres = [...new Set(storiesData.map(story => story.genre))];
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            genreFilter.appendChild(option);
        });
        
        genreFilter.addEventListener('change', function(e) {
            const searchQuery = document.getElementById('story-search')?.value.toLowerCase() || '';
            filterStories(searchQuery, e.target.value);
        });
    }
}

// Sorting functionality
function initializeSorting() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function(e) {
            sortStories(e.target.value);
        });
    }
}

function sortStories(sortBy) {
    switch (sortBy) {
        case 'title-asc':
            filteredStories.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'title-desc':
            filteredStories.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'date-desc':
            filteredStories.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
            break;
        case 'date-asc':
            filteredStories.sort((a, b) => new Date(a.publishedDate) - new Date(b.publishedDate));
            break;
        case 'genre':
            filteredStories.sort((a, b) => a.genre.localeCompare(b.genre));
            break;
        default:
            filteredStories.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
    }
    
    renderStories(filteredStories);
    
    if (filteredStories.length > 0) {
        currentlyLoadedStory = null;
        displayStory(filteredStories[0]);
    }
}

// Navigation between home and contact
function showHomePage() {
    const homeContent = document.getElementById('home-content');
    const contactContent = document.getElementById('contact-content');
    
    if (homeContent) {
        homeContent.style.display = 'block';
        homeContent.classList.remove('d-none');
    }
    if (contactContent) {
        contactContent.style.display = 'none';
        contactContent.classList.add('d-none');
    }
    
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const homeNavBtn = document.getElementById('home-nav-btn');
    if (homeNavBtn) homeNavBtn.classList.add('active');
}

function showContactPage() {
    const homeContent = document.getElementById('home-content');
    const contactContent = document.getElementById('contact-content');
    
    if (homeContent) {
        homeContent.style.display = 'none';
        homeContent.classList.add('d-none');
    }
    if (contactContent) {
        contactContent.style.display = 'block';
        contactContent.classList.remove('d-none');
    }
    
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const contactNavBtn = document.getElementById('contact-nav-btn');
    if (contactNavBtn) contactNavBtn.classList.add('active');
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize theme
    initializeTheme();
    
    // Theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Load stories first
    await initializeStories();
    
    // Navigation buttons
    const homeNavBtn = document.getElementById('home-nav-btn');
    const contactNavBtn = document.getElementById('contact-nav-btn');
    
    if (homeNavBtn) {
        homeNavBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showHomePage();
        });
    }
    
    if (contactNavBtn) {
        contactNavBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showContactPage();
        });
    }
    
    // Initialize search and filters
    initializeSearch();
    initializeGenreFilter();
    initializeSorting();
    
    // Initial render
    renderStories();
    
    // Load first story
    if (filteredStories.length > 0) {
        displayStory(filteredStories[0]);
    }
    
    // Start with home page
    showHomePage();
});
