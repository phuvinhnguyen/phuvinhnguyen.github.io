// Main JavaScript for Personal Website

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeWebsite();
});

// Initialize website functionality
function initializeWebsite() {
    loadPersonalData();
    setupNavigation();
    setupContactForm();
    setupAnimations();
    setupMobileMenu();
}

// Load personal data from JSON files
async function loadPersonalData() {
    try {
        // Load profile data
        const profileResponse = await fetch('data/profile.json?v=' + Date.now());
        const profileData = await profileResponse.json();
        
        // Load about content from separate text file
        const aboutResponse = await fetch('data/about.txt?v=' + Date.now());
        const aboutContent = await aboutResponse.text();
        profileData.about = aboutContent;
        
        updateProfileData(profileData);

        // Load research interests
        const researchResponse = await fetch('data/research.json?v=' + Date.now());
        const researchData = await researchResponse.json();
        displayResearchInterests(researchData);

        // Load publications
        const publicationsResponse = await fetch('data/publications.json?v=' + Date.now());
        const publicationsData = await publicationsResponse.json();

        // Persist data for filtering
        window.PersonalWebsiteData = window.PersonalWebsiteData || {};
        window.PersonalWebsiteData.publications = publicationsData;
        window.PersonalWebsiteData.research = researchData;

        // Show featured publications by default
        displayPublications(publicationsData, { onlySelected: true, limit: 3 });

        // Load news
        const newsResponse = await fetch('data/news.json?v=' + Date.now());
        const newsData = await newsResponse.json();
        displayNews(newsData);

    } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to default content if JSON files don't exist
        loadDefaultContent();
    }
}

// Update profile data in the DOM
function updateProfileData(data) {
    // Update hero section
    if (data.name) document.getElementById('hero-name').textContent = data.name;
    if (data.title) document.getElementById('hero-title').textContent = data.title;
    if (data.description) document.getElementById('hero-description').textContent = data.description;
    if (data.profileImage) document.getElementById('profile-image').src = data.profileImage;

    // Update about section
    if (data.about) {
        const aboutElement = document.getElementById('about-description');
        aboutElement.innerHTML = data.about;
    }
    if (data.stats) {
        if (data.stats.publications) document.getElementById('publications-count').textContent = data.stats.publications;
        if (data.stats.projects) document.getElementById('projects-count').textContent = data.stats.projects;
        if (data.stats.experience) document.getElementById('years-experience').textContent = data.stats.experience;
    }

    // Update contact information
    if (data.contact) {
        if (data.contact.email) document.getElementById('contact-email').textContent = data.contact.email;
        if (data.contact.location) document.getElementById('contact-location').textContent = data.contact.location;
        if (data.contact.institution) document.getElementById('contact-institution').textContent = data.contact.institution;
        // Attach endpoint for contact form submissions if provided
        const contactForm = document.getElementById('contact-form');
        if (contactForm && data.contact.formEndpoint) {
            contactForm.dataset.endpoint = data.contact.formEndpoint;
        }
    }

    // Update social links
    if (data.social) {
        if (data.social.github) document.getElementById('github-link').href = data.social.github;
        if (data.social.linkedin) document.getElementById('linkedin-link').href = data.social.linkedin;
        if (data.social.facebook) document.getElementById('facebook-link').href = data.social.facebook;
        if (data.social.email) document.getElementById('email-link').href = `mailto:${data.social.email}`;
    }
}

// Display research interests
function displayResearchInterests(researchData) {
    const container = document.getElementById('research-interests');
    container.innerHTML = '';

    researchData.forEach(interest => {
        const researchItem = document.createElement('div');
        researchItem.className = 'research-item loading';
        researchItem.innerHTML = `
            <h3>${interest.title}</h3>
            <p>${interest.description}</p>
        `;

        // Click to filter publications by topic matching interest.title
        researchItem.style.cursor = 'pointer';
        researchItem.addEventListener('click', () => {
            const allPubs = (window.PersonalWebsiteData && window.PersonalWebsiteData.publications) || [];
            displayPublications(allPubs, { topics: [interest.title], onlySelected: false });
            showPublicationsFilterInfo(interest.title);
        });
        container.appendChild(researchItem);
    });

    // Trigger loading animation
    setTimeout(() => {
        const items = container.querySelectorAll('.research-item');
        items.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('loaded');
            }, index * 100);
        });
    }, 100);
}

// Display publications
function displayPublications(publicationsData, options = {}) {
    const { topics = null, onlySelected = false, limit = null } = options;

    const container = document.getElementById('publications-list');
    container.innerHTML = '';

    // Filter by selected flag
    let items = Array.isArray(publicationsData) ? publicationsData.slice() : [];
    if (onlySelected) {
        items = items.filter(p => p.selected === true);
    }

    // Filter by topics if provided
    if (topics && topics.length > 0) {
        const topicSet = new Set(topics.map(t => String(t).toLowerCase()));
        items = items.filter(p => {
            const pt = Array.isArray(p.topics) ? p.topics : [];
            return pt.some(tag => topicSet.has(String(tag).toLowerCase()));
        });
    }

    // Apply limit
    if (typeof limit === 'number' && limit > 0) {
        items = items.slice(0, limit);
    }

    // If filter yields nothing, show a friendly message
    if (items.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'publication-item';
        empty.innerHTML = '<p>No publications match this topic yet.</p>';
        container.appendChild(empty);
        return;
    }

    items.forEach(publication => {
        const publicationItem = document.createElement('div');
        publicationItem.className = 'publication-item loading';
        
        let linksHTML = '';
        if (publication.links) {
            linksHTML = '<div class="links">';
            if (publication.links.pdf) linksHTML += `<a href="${publication.links.pdf}" target="_blank">PDF</a>`;
            if (publication.links.code) linksHTML += `<a href="${publication.links.code}" target="_blank">Code</a>`;
            if (publication.links.demo) linksHTML += `<a href="${publication.links.demo}" target="_blank">Demo</a>`;
            linksHTML += '</div>';
        }

        publicationItem.innerHTML = `
            <h3>${publication.title}</h3>
            <div class="authors">${publication.authors}</div>
            <div class="venue">${publication.venue}</div>
            ${linksHTML}
        `;
        container.appendChild(publicationItem);
    });

    // Trigger loading animation
    setTimeout(() => {
        const items = container.querySelectorAll('.publication-item');
        items.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('loaded');
            }, index * 100);
        });
    }, 100);
}

// Helper to show current filter and a clear button
function showPublicationsFilterInfo(topicLabel) {
    let infoBar = document.getElementById('publications-filter-info');
    if (!infoBar) {
        const parent = document.querySelector('#publications .container');
        infoBar = document.createElement('div');
        infoBar.id = 'publications-filter-info';
        infoBar.className = 'pub-filter-info';
        parent.insertBefore(infoBar, document.getElementById('publications-list'));
    }
    infoBar.innerHTML = `
        <span class="label">Filtered by topic:</span>
        <span class="topic">${topicLabel}</span>
        <button class="clear" type="button">Clear</button>
    `;
    infoBar.querySelector('.clear').addEventListener('click', () => {
        // Restore featured default view
        const allPubs = (window.PersonalWebsiteData && window.PersonalWebsiteData.publications) || [];
        displayPublications(allPubs, { onlySelected: true, limit: 3 });
        infoBar.remove();
    });
}

// Display news items
function displayNews(newsData) {
    const container = document.getElementById('news-list');
    container.innerHTML = '';

    // Create a scrollable wrapper
    const scroller = document.createElement('div');
    scroller.className = 'news-scroller';
    container.appendChild(scroller);

    newsData.forEach(news => {
        const fullText = (news.description || '').trim();
        const shortText = truncateText(fullText, 140);

        const newsItem = document.createElement('div');
        newsItem.className = 'news-item loading';
        newsItem.setAttribute('title', fullText); // native tooltip fallback

        // Accessible hover expansion: short visible, full on hover
        newsItem.innerHTML = `
            <div class="news-line" aria-label="${fullText.replace(/"/g, '&quot;')}">
                <span class="date">${news.date}</span>
                <span class="sep">•</span>
                <span class="desc short">${shortText}</span>
                <span class="desc full">${fullText}</span>
            </div>
        `;

        scroller.appendChild(newsItem);
    });

    // Trigger loading animation
    setTimeout(() => {
        const items = container.querySelectorAll('.news-item');
        items.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('loaded');
            }, index * 50);
        });
    }, 50);
}

// Setup navigation functionality
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 70; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Update active nav link on scroll
    window.addEventListener('scroll', updateActiveNavLink);
}

// Update active navigation link based on scroll position
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// Setup mobile menu
function setupMobileMenu() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
}

// Setup contact form
function setupContactForm() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            const message = formData.get('message');
            
            // Simple form validation
            if (!name || !email || !message) {
                alert('Please fill in all fields.');
                return;
            }
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';

            const endpoint = this.dataset.endpoint || '';

            // Prefer configured endpoint (e.g., Formspree). Fallback to mailto if not set
            if (endpoint) {
                // Send as JSON; many services (e.g., Formspree) accept JSON
                fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        message
                    })
                }).then(async (res) => {
                    if (!res.ok) throw new Error('Request failed');
                    // Some providers return JSON
                    try { await res.json(); } catch (_) {}
                    alert('Thank you for your message! I\'ll get back to you soon.');
                    contactForm.reset();
                }).catch(() => {
                    alert('Sorry, there was a problem sending your message. Please try again later or email me directly.');
                }).finally(() => {
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                });
            } else {
                // Fallback: open mail client with prefilled content
                const to = document.getElementById('contact-email')?.textContent || '';
                const subject = encodeURIComponent('Website contact from ' + name);
                const body = encodeURIComponent(`From: ${name} <${email}>\n\n${message}`);
                window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        });
    }
}

// Setup scroll animations
function setupAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('loaded');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.section, .hero-content');
    animatedElements.forEach(el => {
        el.classList.add('loading');
        observer.observe(el);
    });
}

// Load default content if JSON files are not available
function loadDefaultContent() {
    // Set default profile data
    const defaultProfile = {
        name: "Your Name",
        title: "Your Title/Position",
        description: "Brief description about yourself and your work",
        about: "Your detailed about section content goes here. You can edit this in the data/profile.json file.",
        stats: {
            publications: 0,
            projects: 0,
            experience: 0
        },
        contact: {
            email: "your.email@example.com",
            location: "Your Location",
            institution: "Your Institution"
        },
        social: {
            github: "#",
            linkedin: "#",
            facebook: "#",
            email: "your.email@example.com"
        }
    };

    updateProfileData(defaultProfile);

    // Set default research interests
    const defaultResearch = [
        {
            title: "Research Area 1",
            description: "Description of your first research interest."
        },
        {
            title: "Research Area 2", 
            description: "Description of your second research interest."
        },
        {
            title: "Research Area 3",
            description: "Description of your third research interest."
        }
    ];

    displayResearchInterests(defaultResearch);

    // Set default publications
    const defaultPublications = [
        {
            title: "Sample Publication Title",
            authors: "Your Name, Co-author Name",
            venue: "Conference/Journal Name (Year)",
            links: {
                pdf: "#",
                code: "#"
            }
        }
    ];

    displayPublications(defaultPublications);

    // Set default news
    const defaultNews = [
        {
            date: "January 2024",
            title: "Welcome to my website!",
            description: "This is a sample news item. You can edit this in the data/news.json file."
        }
    ];

    displayNews(defaultNews);
}

// Utility function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Utility function to truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Export functions for potential external use
window.PersonalWebsite = {
    loadPersonalData,
    updateProfileData,
    displayResearchInterests,
    displayPublications,
    displayNews
};
