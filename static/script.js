// State Management
let allReleaseNotes = [];
let filteredReleaseNotes = [];
let activeCategory = 'all';
let searchQuery = '';
let selectedUpdateId = null;

// DOM Elements
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const lastUpdatedTime = document.getElementById('last-updated-time');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const categoryFilterList = document.getElementById('category-filter-list');
const feedContainer = document.getElementById('feed-container');
const skeletonLoader = document.getElementById('skeleton-loader');
const emptyState = document.getElementById('empty-state');
const statusContainer = document.getElementById('status-container');
const statusMessage = document.getElementById('status-message');

// Tweet Composer DOM Elements
const tweetText = document.getElementById('tweet-text');
const tweetSourceBadge = document.getElementById('tweet-source-badge');
const tweetBtn = document.getElementById('tweet-btn');
const charCount = document.getElementById('char-count');
const charProgress = document.getElementById('char-progress');

// Progress Ring Configuration
const RING_RADIUS = 8;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ~50.265

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // Initialise SVG progress ring
    charProgress.style.strokeDasharray = `${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`;
    charProgress.style.strokeDashoffset = RING_CIRCUMFERENCE;
    
    // Fetch initial feed data
    fetchReleaseNotes(false);
    
    // Setup Event Listeners
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Refresh Button Click
    refreshBtn.addEventListener('click', () => {
        fetchReleaseNotes(true);
    });
    
    // Search Input Typing (Debounced-like response)
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        clearSearchBtn.style.display = searchQuery.length > 0 ? 'block' : 'none';
        filterAndRenderFeed();
    });
    
    // Clear Search Click
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        filterAndRenderFeed();
        searchInput.focus();
    });
    
    // Category Filter Chips
    categoryFilterList.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;
        
        // Update active class
        document.querySelectorAll('.filter-chip').forEach(btn => btn.classList.remove('active'));
        chip.classList.add('active');
        
        activeCategory = chip.dataset.category;
        filterAndRenderFeed();
    });
    
    // Tweet Textarea Input Changes
    tweetText.addEventListener('input', () => {
        updateTweetComposerMetrics();
        // Hide badge if the user starts modifying the auto-draft
        if (tweetSourceBadge.style.display !== 'none' && !tweetText.value.includes('#BigQuery')) {
            tweetSourceBadge.style.display = 'none';
        }
    });
    
    // Tweet Button Click
    tweetBtn.addEventListener('click', () => {
        const text = tweetText.value;
        if (text.length > 0 && text.length <= 280) {
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
            window.open(twitterUrl, '_blank', 'noopener,noreferrer');
        }
    });
}

// Fetch Release Notes from Flask API
async function fetchReleaseNotes(forceRefresh = false) {
    // Show spinner and skeleton loaders
    setLoadingState(true);
    hideStatus();
    
    let url = '/api/release-notes';
    if (forceRefresh) {
        url += '?refresh=true';
    }
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        allReleaseNotes = data.notes || [];
        
        // Update Last Checked timestamp
        if (data.last_fetched) {
            const fetchDate = new Date(data.last_fetched + 'Z'); // Parse as UTC
            const localTimeString = fetchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const localDateString = fetchDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
            lastUpdatedTime.textContent = `Last checked: ${localDateString} at ${localTimeString}`;
        }
        
        // Render Notes
        filterAndRenderFeed();
        
        // Show status warning if used cached fallback due to load error
        if (data.cached && forceRefresh) {
            showStatus('Unable to reach GCP feed. Showing cached release notes.', 'info');
        }
        
    } catch (error) {
        console.error('Error fetching release notes:', error);
        showStatus(`Error: ${error.message || 'Failed to retrieve release notes.'}`, 'error');
        
        // Render whatever we have in memory or show empty state
        if (allReleaseNotes.length === 0) {
            showEmptyState();
        }
    } finally {
        setLoadingState(false);
    }
}

// Set Loading & Spinner State
function setLoadingState(isLoading) {
    if (isLoading) {
        refreshIcon.classList.add('spin');
        refreshBtn.disabled = true;
        skeletonLoader.style.display = 'flex';
        feedContainer.style.display = 'none';
        emptyState.style.display = 'none';
    } else {
        refreshIcon.classList.remove('spin');
        refreshBtn.disabled = false;
        skeletonLoader.style.display = 'none';
    }
}

// Show Alert Status Header Messages
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusContainer.style.display = 'block';
    
    const icon = statusContainer.querySelector('.status-icon');
    if (type === 'error') {
        statusContainer.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        statusContainer.style.borderColor = 'var(--color-deprecation)';
        icon.className = 'fa-solid fa-circle-exclamation status-icon';
        icon.style.color = 'var(--color-deprecation)';
    } else {
        statusContainer.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        statusContainer.style.borderColor = 'var(--primary-color)';
        icon.className = 'fa-solid fa-circle-info status-icon';
        icon.style.color = 'var(--primary-color)';
    }
}

function hideStatus() {
    statusContainer.style.display = 'none';
}

function showEmptyState() {
    feedContainer.style.display = 'none';
    emptyState.style.display = 'block';
}

// Filter Feed and Render HTML
function filterAndRenderFeed() {
    filteredReleaseNotes = [];
    
    // Loop dates
    allReleaseNotes.forEach(dateGroup => {
        const filteredUpdates = dateGroup.updates.filter(update => {
            // Category check
            const categoryMatch = activeCategory === 'all' || 
                update.type.toLowerCase().trim() === activeCategory.toLowerCase().trim();
                
            // Search text check
            const searchMatch = !searchQuery || 
                update.type.toLowerCase().includes(searchQuery) || 
                update.description.toLowerCase().includes(searchQuery) ||
                dateGroup.date.toLowerCase().includes(searchQuery);
                
            return categoryMatch && searchMatch;
        });
        
        if (filteredUpdates.length > 0) {
            filteredReleaseNotes.push({
                ...dateGroup,
                updates: filteredUpdates
            });
        }
    });
    
    // Check if feed is empty
    if (filteredReleaseNotes.length === 0) {
        showEmptyState();
        return;
    }
    
    emptyState.style.display = 'none';
    feedContainer.style.display = 'block';
    
    // Clear and build feed HTML
    feedContainer.innerHTML = '';
    
    filteredReleaseNotes.forEach((dateGroup, dateIdx) => {
        // Create date group elements
        const dateGroupDiv = document.createElement('div');
        dateGroupDiv.className = 'date-group';
        
        // Date Header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'date-header-card';
        headerDiv.innerHTML = `
            <div class="date-title">
                <i class="fa-regular fa-calendar-days"></i>
                <span>${dateGroup.formatted_date}</span>
            </div>
            ${dateGroup.link ? `
                <a href="${dateGroup.link}" target="_blank" rel="noopener noreferrer" class="date-link">
                    <span>View Docs</span>
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
            ` : ''}
        `;
        dateGroupDiv.appendChild(headerDiv);
        
        // Sub-updates List
        dateGroup.updates.forEach((update, updateIdx) => {
            const uniqueId = `update-${dateIdx}-${updateIdx}`;
            const isSelected = selectedUpdateId === uniqueId;
            
            const cardDiv = document.createElement('div');
            cardDiv.className = `update-card ${isSelected ? 'selected' : ''}`;
            cardDiv.id = uniqueId;
            
            // Clean/Capitalized category string
            const categoryClass = getCategoryClass(update.type);
            
            cardDiv.innerHTML = `
                <div class="card-header-row">
                    <span class="category-badge ${categoryClass}">
                        ${getCategoryIcon(update.type)}
                        <span>${update.type}</span>
                    </span>
                    <div class="card-actions">
                        <button class="action-icon-btn btn-share-tweet" title="Load into Tweet Composer">
                            <i class="fa-brands fa-twitter"></i>
                        </button>
                    </div>
                </div>
                <div class="update-description">
                    ${update.description}
                </div>
            `;
            
            // Card Click: Load into tweet composer and toggle selection
            cardDiv.addEventListener('click', (e) => {
                // If clicked an anchor link, don't trigger tweet select
                if (e.target.tagName === 'A' || e.target.closest('a')) {
                    return;
                }
                
                selectUpdateForTweet(uniqueId, update, dateGroup);
            });
            
            // Twitter Action Button specifically (also triggers composer load)
            const twitterBtn = cardDiv.querySelector('.btn-share-tweet');
            twitterBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent duplicate card click event
                selectUpdateForTweet(uniqueId, update, dateGroup);
                // Scroll composer into view on mobile
                if (window.innerWidth <= 992) {
                    document.getElementById('tweet-composer').scrollIntoView({ behavior: 'smooth' });
                }
            });
            
            dateGroupDiv.appendChild(cardDiv);
        });
        
        feedContainer.appendChild(dateGroupDiv);
    });
}

// Selection handling
function selectUpdateForTweet(id, update, dateGroup) {
    selectedUpdateId = id;
    
    // Toggle active classes on cards
    document.querySelectorAll('.update-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedCard = document.getElementById(id);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    // Auto-generate tweet draft
    const tweetTextContent = generateTweetDraft(update, dateGroup);
    tweetText.value = tweetTextContent;
    tweetSourceBadge.style.display = 'block';
    
    // Update count metrics
    updateTweetComposerMetrics();
}

// Generate elegant tweet content from release note
function generateTweetDraft(update, dateGroup) {
    // Get text content and strip HTML tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = update.description;
    let cleanText = tempDiv.innerText || tempDiv.textContent || '';
    
    // Clean redundant spaces/newlines
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    // Build prefix
    const typeLabel = update.type.toUpperCase();
    const prefix = `📢 BigQuery ${typeLabel} (${dateGroup.formatted_date}):\n\n`;
    
    // Build tags and suffix
    const suffix = `\n\n#GoogleCloud #BigQuery #DataEngineering`;
    
    // Link if available
    const linkStr = dateGroup.link ? `\n👉 ${dateGroup.link}` : '';
    
    // Calculated size boundaries
    const wrapLength = 280;
    const reservedSpace = prefix.length + linkStr.length + suffix.length;
    const availableSpace = wrapLength - reservedSpace;
    
    if (cleanText.length > availableSpace) {
        // Truncate cleanText with ellipses
        cleanText = cleanText.substring(0, availableSpace - 3) + '...';
    }
    
    return `${prefix}${cleanText}${linkStr}${suffix}`;
}

// Update Tweet character calculations
function updateTweetComposerMetrics() {
    const len = tweetText.value.length;
    charCount.textContent = len;
    
    // Text validation styling
    if (len > 280) {
        charCount.className = 'char-count-error';
        tweetBtn.disabled = true;
    } else if (len >= 260) {
        charCount.className = 'char-count-warning';
        tweetBtn.disabled = false;
    } else {
        charCount.className = '';
        tweetBtn.disabled = len === 0;
    }
    
    // SVG Progress circle calculations
    const percentage = Math.min(len / 280, 1.0);
    const offset = RING_CIRCUMFERENCE - (percentage * RING_CIRCUMFERENCE);
    charProgress.style.strokeDashoffset = offset;
    
    // Color transitions for ring
    if (len > 280) {
        charProgress.style.stroke = 'var(--color-deprecation)';
    } else if (len >= 260) {
        charProgress.style.stroke = 'var(--accent-color)';
    } else {
        charProgress.style.stroke = 'var(--tweet-color)';
    }
}

// Category Class Helpers
function getCategoryClass(type) {
    const t = type.toLowerCase().trim();
    if (t.includes('announcement')) return 'category-announcement';
    if (t.includes('feature')) return 'category-feature';
    if (t.includes('deprecation')) return 'category-deprecation';
    if (t.includes('resolved')) return 'category-resolved';
    if (t.includes('breaking')) return 'category-breaking';
    return 'category-fallback';
}

function getCategoryIcon(type) {
    const t = type.toLowerCase().trim();
    if (t.includes('announcement')) return '<i class="fa-solid fa-bullhorn"></i>';
    if (t.includes('feature')) return '<i class="fa-solid fa-circle-plus"></i>';
    if (t.includes('deprecation')) return '<i class="fa-solid fa-triangle-exclamation"></i>';
    if (t.includes('resolved')) return '<i class="fa-solid fa-circle-check"></i>';
    if (t.includes('breaking')) return '<i class="fa-solid fa-circle-radiation"></i>';
    return '<i class="fa-solid fa-note-sticky"></i>';
}
