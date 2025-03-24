// Global variables
let currentPage = 1;
let totalPages = 1;
let newsItems = [];
let selectedNewsId = null;

// Initialize everything when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Fetch initial news data
    fetchNews(1);
    
    // Set up search form submission
    document.getElementById('filter-form').addEventListener('submit', function(e) {
        e.preventDefault();
        fetchNews(1);
    });
    
    // Set up event listeners for edit and delete buttons
    document.addEventListener('click', function(e) {
        // Check if edit button was clicked
        if (e.target.matches('.edit-news-btn') || e.target.closest('.edit-news-btn')) {
            const newsId = e.target.closest('.edit-news-btn').dataset.newsId;
            editNews(newsId);
        }
        
        // Check if delete button was clicked
        if (e.target.matches('.delete-news-btn') || e.target.closest('.delete-news-btn')) {
            const newsId = e.target.closest('.delete-news-btn').dataset.newsId;
            showDeleteModal(newsId);
        }
    });
    
    // Set up save news button
    document.getElementById('saveNewsBtn').addEventListener('click', saveNews);
    
    // Set up confirm delete button
    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteNews);
});

// Fetch news from the API
function fetchNews(page = 1) {
    currentPage = page;
    
    // Get filter values
    const search = document.getElementById('search-input').value;
    const date = document.getElementById('date-filter').value;
    const sentiment = document.getElementById('sentiment-select').value;
    
    let url = `/api/admin/news/?page=${page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (date) url += `&date=${encodeURIComponent(date)}`;
    if (sentiment) url += `&sentiment=${encodeURIComponent(sentiment)}`;
    
    // Show loading state
    document.getElementById('news-grid').innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-success" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            newsItems = data.news;
            totalPages = data.total_pages;
            
            renderNews();
            updatePagination();
            updateAppliedFilters(search, date, sentiment);
        })
        .catch(error => {
            console.error('Error fetching news:', error);
            document.getElementById('news-grid').innerHTML = '<div class="col-12 text-center py-5"><div class="alert alert-danger">Failed to load news. Please try again.</div></div>';
        });
}

// Render news cards
function renderNews() {
    const newsGrid = document.getElementById('news-grid');
    newsGrid.innerHTML = '';
    
    if (newsItems.length === 0) {
        newsGrid.innerHTML = '<div class="col-12 text-center py-5"><div class="alert alert-info">No news articles found.</div></div>';
        return;
    }
    
    newsItems.forEach(news => {
        const sentimentClass = getSentimentClass(news.sentiment);
        const sentimentIcon = getSentimentIcon(news.sentiment);
        
        const newsCard = document.createElement('div');
        newsCard.className = 'col';
        newsCard.innerHTML = `
            <div class="card h-100 shadow-sm transition-hover">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span class="text-muted small">${news.published_date}</span>
                    <span class="${sentimentClass} fw-semibold">${sentimentIcon} ${news.sentiment}</span>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${news.title}</h5>
                    <p class="card-text">${news.summary}</p>
                </div>
                <div class="card-footer d-flex justify-content-between">
                    <a href="/article/${news.id}/" class="btn btn-sm btn-outline-primary">Read More</a>
                    <div>
                        <button class="btn btn-sm btn-warning edit-news-btn" data-news-id="${news.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger delete-news-btn" data-news-id="${news.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        newsGrid.appendChild(newsCard);
    });
}

// Update pagination controls
function updatePagination() {
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
    
    // Update prev/next buttons
    const prevPageItem = document.getElementById('prev-page-item');
    const nextPageItem = document.getElementById('next-page-item');
    
    prevPageItem.classList.toggle('disabled', currentPage <= 1);
    nextPageItem.classList.toggle('disabled', currentPage >= totalPages);
}

// Update applied filters display
function updateAppliedFilters(search, date, sentiment) {
    const appliedFilters = document.getElementById('applied-filters');
    appliedFilters.innerHTML = '';
    
    if (search || date || sentiment) {
        appliedFilters.innerHTML += '<div class="me-2">Active filters:</div>';
        
        if (search) {
            appliedFilters.innerHTML += `<span class="badge bg-success">Search: ${search}</span>`;
        }
        
        if (date) {
            appliedFilters.innerHTML += `<span class="badge bg-success">Date: ${date}</span>`;
        }
        
        if (sentiment) {
            appliedFilters.innerHTML += `<span class="badge bg-success">Sentiment: ${sentiment}</span>`;
        }
    }
}

// Get CSS class for sentiment
function getSentimentClass(sentiment) {
    switch (sentiment) {
        case 'Positive':
            return 'text-success';
        case 'Negative':
            return 'text-danger';
        case 'Neutral':
            return 'text-warning';
        default:
            return 'text-muted';
    }
}

// Get icon for sentiment
function getSentimentIcon(sentiment) {
    switch (sentiment) {
        case 'Positive':
            return '😊';
        case 'Negative':
            return '😠';
        case 'Neutral':
            return '😐';
        default:
            return '❓';
    }
}

// Edit news
function editNews(newsId) {
    const news = newsItems.find(n =>