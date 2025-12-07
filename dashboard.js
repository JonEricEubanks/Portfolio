/**
 * Dashboard Mode functionality
 * Transforms the portfolio into an interactive data dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize navigation functionality
  initNavigation();
  
  // Elements
  const dashboardToggle = document.getElementById('dashboard-toggle');
  const body = document.body;
  const portfolioCards = document.querySelectorAll('.link-container');
  const careerMetrics = document.getElementById('career-metrics');
  
  // Dashboard background elements
  const dashboardBackground = document.getElementById('dashboard-background');
  const dataParticles = document.querySelector('.data-particles');
  
  // Check if essential elements exist
  if (!dashboardToggle) {
    console.error('Dashboard toggle button not found!');
    return;
  }
  
  console.log('Dashboard elements loaded successfully');
  
  // Clean variables - no observers needed
  let cardObserver = null;
  
  // Toggle dashboard mode
  dashboardToggle.addEventListener('click', function() {
    console.log('Dashboard toggle clicked!');
    
    // Toggle dashboard mode class
    body.classList.toggle('dashboard-mode');
    dashboardToggle.classList.toggle('active');
    
    // Toggle between "Spotlight" and "Normal" text
    const toggleText = dashboardToggle.querySelector('.btn-text');
    if (body.classList.contains('dashboard-mode')) {
      toggleText.textContent = 'Normal';
      initDashboardMode();
    } else {
      toggleText.textContent = 'Spotlight';
      
      // Immediately hide any visible KPI indicators
      document.querySelectorAll('.kpi-indicator').forEach(indicator => {
        indicator.style.opacity = '0';
        indicator.style.transform = 'translateY(100%)';
      });
      
      resetNormalMode();
      
      // Add KPI indicators for normal mode too (if not already present)
      portfolioCards.forEach(card => {
        addKpiIndicator(card);
      });
      
      // Initialize mobile KPI observer for normal mode too
      initMobileKpiObserver();
    }
  });
  
  // Initialize dashboard mode
  function initDashboardMode() {
    // Animate in career metrics panel
    setTimeout(() => {
      animateCounters();
    }, 300);
    
    // Add KPI indicators to cards that have data attributes
    portfolioCards.forEach(card => {
      addKpiIndicator(card);
    });
    
    // Create background data particles
    createDataParticles();
    
    // Initialize mobile KPI observer
    initMobileKpiObserver();
  }
  
  // No initialization needed - CSS handles everything just like normal mode
  function initMobileKpiObserver() {
    // Only initialize mobile KPI observer on mobile devices
    if (window.innerWidth <= 768) {
      setupMobileKpiObserver();
    }
  }
  
  // Set up intersection observer for mobile KPI auto-show
  function setupMobileKpiObserver() {
    const options = {
      root: null,
      rootMargin: '-40% 0px -40% 0px', // Card needs to be centered in viewport
      threshold: 0.5
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const card = entry.target;
        const kpiIndicator = card.querySelector('.kpi-indicator');
        
        if (entry.isIntersecting && kpiIndicator) {
          // Show KPI for 3 seconds when card is centered
          kpiIndicator.classList.add('mobile-auto-show');
          
          // Remove the class after 3 seconds
          setTimeout(() => {
            kpiIndicator.classList.remove('mobile-auto-show');
          }, 3000);
        }
      });
    }, options);
    
    // Observe all cards with KPI data
    portfolioCards.forEach(card => {
      if (card.hasAttribute('data-kpi-icon')) {
        observer.observe(card);
      }
    });
  }
  
  // Add KPI indicator to a card based on its data attributes
  function addKpiIndicator(card) {
    // Skip if card already has a KPI indicator
    if (card.querySelector('.kpi-indicator')) return;
    
    // Get KPI data from data attributes
    const icon = card.getAttribute('data-kpi-icon');
    const value = card.getAttribute('data-kpi-value');
    const title = card.getAttribute('data-kpi-title');
    const prefix = card.getAttribute('data-kpi-prefix') || '';
    const suffix = card.getAttribute('data-kpi-suffix') || '';
    
    // Only create KPI if we have the required data
    if (!icon || !value || !title) return;
    
    // Create KPI indicator element
    const kpiIndicator = document.createElement('div');
    kpiIndicator.className = 'kpi-indicator';
    
    // Parse the numeric value for animation
    const numericValue = parseFloat(value.replace(/[^\d.]/g, ''));
    
    kpiIndicator.innerHTML = `
      <div class="kpi-row">
        <span class="kpi-icon">${icon}</span>
        <span class="kpi-value" data-target="${numericValue}" data-prefix="${prefix}" data-suffix="${suffix}">0</span>
      </div>
      <span class="kpi-title">${title}</span>
    `;
    
    // Add to card
    card.appendChild(kpiIndicator);
    
    // Set up counter animation triggers
    const kpiValueSpan = kpiIndicator.querySelector('.kpi-value');
    let animationTriggered = false;
    
    // Function to trigger counter animation
    const triggerAnimation = () => {
      if (!animationTriggered) {
        animationTriggered = true;
        animateKpiCounter(kpiValueSpan, numericValue, prefix, suffix);
        
        // Reset after animation completes
        setTimeout(() => {
          animationTriggered = false;
        }, 2000);
      }
    };
    
    // Add hover event listeners for desktop
    card.addEventListener('mouseenter', triggerAnimation);
    
    // Add intersection observer for mobile auto-show
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && window.innerWidth <= 768) {
          triggerAnimation();
        }
      });
    }, {
      root: null,
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0.5
    });
    
    observer.observe(card);
  }
  
  // Animate KPI counter from 0 to target value
  function animateKpiCounter(element, target, prefix = '', suffix = '') {
    const duration = 1500; // 1.5 seconds
    const startTime = performance.now();
    const startValue = 0;
    
    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easeOutQuart easing for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (target - startValue) * easeProgress;
      
      // Format the number based on target value
      let displayValue;
      if (target >= 1000) {
        displayValue = Math.round(currentValue).toLocaleString();
      } else if (target % 1 !== 0) {
        // Handle decimal values
        displayValue = currentValue.toFixed(1);
      } else {
        displayValue = Math.round(currentValue);
      }
      
      element.textContent = `${prefix}${displayValue}${suffix}`;
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    }
    
    requestAnimationFrame(updateCounter);
  }
  
  // Reset to normal mode
  function resetNormalMode() {
    // Clear visualizations
    document.querySelectorAll('.viz-svg').forEach(svg => {
      svg.innerHTML = '';
    });
    
    // Clear data particles
    if (dataParticles) {
      dataParticles.innerHTML = '';
    }
    
    // Remove all KPI indicators
    document.querySelectorAll('.kpi-indicator').forEach(indicator => {
      indicator.remove();
    });
  }
  
  // Animate counter elements with support for decimal values
  function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    const speed = 200; // The lower the faster
    
    counters.forEach(counter => {
      const target = parseFloat(counter.getAttribute('data-target'));
      const hasDecimal = target % 1 !== 0;
      const increment = target / speed;
      
      const updateCount = () => {
        const count = parseFloat(counter.innerText);
        if (count < target) {
          // Handle decimal values differently
          if (hasDecimal) {
            counter.innerText = (Math.min(count + increment, target)).toFixed(1);
          } else {
            counter.innerText = Math.ceil(count + increment);
          }
          setTimeout(updateCount, 1);
        } else {
          counter.innerText = hasDecimal ? target.toFixed(1) : target;
        }
      };
      
      updateCount();
    });
  }
  
  // Create bar chart visualization
  function createBarChart(svg) {
    const numBars = 5 + Math.floor(Math.random() * 3);
    const barWidth = 100 / (numBars * 2);
    
    for (let i = 0; i < numBars; i++) {
      const height = 20 + Math.random() * 60;
      const x = i * (barWidth * 2) + barWidth / 2;
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', 100 - height);
      rect.setAttribute('width', barWidth);
      rect.setAttribute('height', height);
      rect.setAttribute('fill', 'rgba(0, 183, 195, 0.7)');
      rect.setAttribute('rx', '2');
      
      // Animation
      const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animate.setAttribute('attributeName', 'height');
      animate.setAttribute('from', '0');
      animate.setAttribute('to', height);
      animate.setAttribute('dur', '1s');
      animate.setAttribute('fill', 'freeze');
      
      const animateY = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animateY.setAttribute('attributeName', 'y');
      animateY.setAttribute('from', '100');
      animateY.setAttribute('to', 100 - height);
      animateY.setAttribute('dur', '1s');
      animateY.setAttribute('fill', 'freeze');
      
      rect.appendChild(animate);
      rect.appendChild(animateY);
      svg.appendChild(rect);
    }
  }
  
  // Create line chart visualization
  function createLineChart(svg) {
    const numPoints = 10;
    const points = [];
    
    for (let i = 0; i < numPoints; i++) {
      const x = i * (100 / (numPoints - 1));
      const y = 20 + Math.random() * 60;
      points.push(`${x},${y}`);
    }
    
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', points.join(' '));
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', 'rgba(0, 120, 212, 0.8)');
    polyline.setAttribute('stroke-width', '2');
    
    // Animation
    const length = polyline.getTotalLength();
    polyline.setAttribute('stroke-dasharray', length);
    polyline.setAttribute('stroke-dashoffset', length);
    
    const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animate.setAttribute('attributeName', 'stroke-dashoffset');
    animate.setAttribute('from', length);
    animate.setAttribute('to', '0');
    animate.setAttribute('dur', '1.5s');
    animate.setAttribute('fill', 'freeze');
    
    polyline.appendChild(animate);
    svg.appendChild(polyline);
    
    // Add dots at each point
    points.forEach(point => {
      const [x, y] = point.split(',');
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', '2');
      circle.setAttribute('fill', 'rgba(80, 230, 255, 0.9)');
      
      const animateOpacity = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animateOpacity.setAttribute('attributeName', 'opacity');
      animateOpacity.setAttribute('from', '0');
      animateOpacity.setAttribute('to', '1');
      animateOpacity.setAttribute('dur', '1.5s');
      animateOpacity.setAttribute('fill', 'freeze');
      
      circle.appendChild(animateOpacity);
      svg.appendChild(circle);
    });
  }
  
  // Create pie chart visualization
  function createPieChart(svg) {
    const cx = 50;
    const cy = 50;
    const r = 40;
    
    const numSlices = 3 + Math.floor(Math.random() * 3);
    const slices = [];
    
    let startAngle = 0;
    let total = 0;
    
    // Generate random values that sum to 100
    for (let i = 0; i < numSlices; i++) {
      slices.push(10 + Math.random() * 30);
      total += slices[i];
    }
    
    // Normalize to get percentages
    slices.forEach((slice, i) => {
      slices[i] = (slice / total) * 100;
    });
    
    // Create pie slices
    slices.forEach((slice, i) => {
      const angle = (slice / 100) * 360;
      const endAngle = startAngle + angle;
      
      // Calculate SVG arc path
      const x1 = cx + r * Math.cos(Math.PI * startAngle / 180);
      const y1 = cy + r * Math.sin(Math.PI * startAngle / 180);
      const x2 = cx + r * Math.cos(Math.PI * endAngle / 180);
      const y2 = cy + r * Math.sin(Math.PI * endAngle / 180);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`);
      path.setAttribute('fill', `rgba(${Math.floor(Math.random() * 100 + 100)}, ${Math.floor(Math.random() * 150 + 50)}, ${Math.floor(Math.random() * 100 + 150)}, 0.7)`);
      path.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
      path.setAttribute('stroke-width', '1');
      
      // Animation
      const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animate.setAttribute('attributeName', 'opacity');
      animate.setAttribute('from', '0');
      animate.setAttribute('to', '1');
      animate.setAttribute('dur', `${0.3 + i * 0.2}s`);
      animate.setAttribute('fill', 'freeze');
      
      path.appendChild(animate);
      svg.appendChild(path);
      
      startAngle = endAngle;
    });
  }
  
  // Create data particles for background
  function createDataParticles() {
    dataParticles.innerHTML = '';
    
    // Number of particles based on screen size
    const numParticles = Math.min(Math.floor(window.innerWidth / 15), 100);
    
    for (let i = 0; i < numParticles; i++) {
      const particle = document.createElement('div');
      particle.classList.add('data-particle');
      
      // Random position
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      
      // Random particle type
      const particleType = Math.floor(Math.random() * 3);
      let particleClass = 'particle-dot';
      
      if (particleType === 1) particleClass = 'particle-line';
      if (particleType === 2) particleClass = 'particle-square';
      
      particle.classList.add(particleClass);
      
      // Random size
      const size = 3 + Math.random() * 5;
      
      // Random colors from dashboard theme
      const colors = ['#0078d4', '#50e6ff', '#0099bc', 'rgba(255, 255, 255, 0.7)'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Apply styles
      particle.style.left = `${x}%`;
      particle.style.top = `${y}%`;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.backgroundColor = color;
      
      // Add animation
      const duration = 15 + Math.random() * 30;
      const delay = Math.random() * 10;
      
      particle.style.animation = `floatParticle ${duration}s linear ${delay}s infinite`;
      
      dataParticles.appendChild(particle);
    }
    
    // Add CSS for particle animation if it doesn't exist yet
    if (!document.getElementById('particle-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'particle-styles';
      styleSheet.innerHTML = `
        .data-particle {
          position: absolute;
          border-radius: 50%;
          opacity: 0.5;
          pointer-events: none;
        }
        
        .particle-dot {
          border-radius: 50%;
        }
        
        .particle-line {
          width: 20px !important;
          height: 2px !important;
          border-radius: 0;
        }
        
        .particle-square {
          border-radius: 2px;
        }
        
        @keyframes floatParticle {
          0% {
            transform: translate(0, 0);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
          }
          90% {
            opacity: 0.5;
          }
          100% {
            transform: translate(${Math.random() > 0.5 ? '+' : '-'}${50 + Math.random() * 100}px, ${Math.random() > 0.5 ? '+' : '-'}${50 + Math.random() * 100}px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(styleSheet);
    }
  }
  
  // Update observer on window resize
  window.addEventListener('resize', () => {
    if (body.classList.contains('dashboard-mode')) {
      initMobileKpiObserver();
    }
  });
  
  // Initialize KPIs and mobile observer for normal mode on page load
  portfolioCards.forEach(card => {
    addKpiIndicator(card);
  });
  initMobileKpiObserver();
});

/**
 * Navigation functionality for header pills
 */
function initNavigation() {
  // Mobile navigation toggle
  const navToggle = document.querySelector('.nav-toggle');
  const primaryNav = document.getElementById('primary-nav');
  
  if (navToggle && primaryNav) {
    // Toggle function
    function toggleMenu(e) {
      if (e) e.stopPropagation(); // Prevent document click from immediately closing it
      
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      const newState = !isExpanded;
      
      navToggle.setAttribute('aria-expanded', newState);
      primaryNav.setAttribute('aria-hidden', !newState);
      
      // Also toggle the 'open' class for CSS animations if needed
      if (newState) {
        primaryNav.classList.add('open');
        navToggle.classList.add('active');
      } else {
        primaryNav.classList.remove('open');
        navToggle.classList.remove('active');
      }
    }

    // Toggle click listener
    navToggle.addEventListener('click', toggleMenu);

    // Close navigation when clicking a link
    const navLinks = primaryNav.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        primaryNav.setAttribute('aria-hidden', 'true');
        primaryNav.classList.remove('open');
        navToggle.classList.remove('active');
      });
    });

    // Close navigation when clicking outside
    document.addEventListener('click', (e) => {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      
      // Only try to close if it's open
      if (isExpanded && !primaryNav.contains(e.target) && !navToggle.contains(e.target)) {
        navToggle.setAttribute('aria-expanded', 'false');
        primaryNav.setAttribute('aria-hidden', 'true');
        primaryNav.classList.remove('open');
        navToggle.classList.remove('active');
      }
    });
  }

  // Active navigation highlighting on scroll
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.modern-nav-item');

  function highlightNavOnScroll() {
    // Use a larger offset (30% of viewport height) to highlight sections earlier
    const scrollPos = window.scrollY + (window.innerHeight * 0.3);

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        navItems.forEach(item => {
          item.classList.remove('active');
          if (item.getAttribute('href') === `#${sectionId}`) {
            item.classList.add('active');
          }
        });
      }
    });
  }

  // Run on scroll
  window.addEventListener('scroll', highlightNavOnScroll);
  // Run on load
  highlightNavOnScroll();

  // Portfolio filter navigation (if exists)
  const navPills = document.querySelectorAll('.nav-pill');
  const portfolioCards = document.querySelectorAll('.link-container');
  
  navPills.forEach(pill => {
    pill.addEventListener('click', function() {
      // Remove active class from all pills
      navPills.forEach(p => p.classList.remove('active'));
      
      // Add active class to clicked pill
      this.classList.add('active');
      
      // Get filter value
      const filter = this.dataset.filter;
      
      // Filter cards
      filterPortfolioCards(filter, portfolioCards);
    });
  });
}

/**
 * Filter portfolio cards based on category
 */
function filterPortfolioCards(filter, cards) {
  cards.forEach(card => {
    // Get card category from data attributes or content
    const cardCategories = getCardCategories(card);
    
    if (filter === 'all' || cardCategories.includes(filter)) {
      card.style.display = 'block';
      card.style.opacity = '1';
      card.style.transform = 'scale(1)';
    } else {
      card.style.opacity = '0.3';
      card.style.transform = 'scale(0.95)';
    }
  });
}

/**
 * Determine card categories based on content
 */
function getCardCategories(card) {
  const categories = [];
  const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
  const description = card.querySelector('p')?.textContent.toLowerCase() || '';
  const content = (title + ' ' + description).toLowerCase();
  
  // Categorize based on content keywords
  if (content.includes('dashboard') || content.includes('chart') || content.includes('metric') || 
      content.includes('report') || content.includes('data') || content.includes('analytics')) {
    categories.push('dashboards');
  }
  
  if (content.includes('gis') || content.includes('map') || content.includes('spatial') || 
      content.includes('geographic') || content.includes('location')) {
    categories.push('gis');
  }
  
  if (content.includes('certification') || content.includes('certified') || content.includes('exam') ||
      content.includes('credential') || content.includes('course')) {
    categories.push('certifications');
  }
  
  // Everything else is low code development
  if (categories.length === 0 || content.includes('app') || content.includes('form') || 
      content.includes('automation') || content.includes('workflow') || content.includes('power')) {
    categories.push('all'); // Low code falls under main category
  }
  
  return categories;
}
