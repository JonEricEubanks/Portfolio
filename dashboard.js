/**
 * Dashboard Mode functionality
 * Transforms the portfolio into an interactive data dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const dashboardToggle = document.getElementById('dashboard-toggle');
  const body = document.body;
  const portfolioCards = document.querySelectorAll('.link-container');
  const careerMetrics = document.getElementById('career-metrics');
  
  // Dashboard background elements
  const dashboardBackground = document.getElementById('dashboard-background');
  const dataParticles = document.querySelector('.data-particles');
  
  // Intersection Observer for mobile KPI indicators
  let cardObserver;
  
  // Toggle dashboard mode
  dashboardToggle.addEventListener('click', function() {
    // Toggle dashboard mode class
    body.classList.toggle('dashboard-mode');
    dashboardToggle.classList.toggle('active');
    
    // Toggle between "Spotlight" and "Normal" text
    const toggleText = dashboardToggle.querySelector('.toggle-text');
    if (body.classList.contains('dashboard-mode')) {
      toggleText.textContent = 'Normal';
      initDashboardMode();
    } else {
      toggleText.textContent = 'Spotlight';
      resetNormalMode();
    }
  });
  
  // Initialize dashboard mode
  function initDashboardMode() {
    // Animate in career metrics panel
    setTimeout(() => {
      animateCounters();
    }, 300);
    
    // Create data visualization for each card
    portfolioCards.forEach(card => {
      // Add missing KPI indicators for cards that don't have them
      addMissingKpiIndicators(card);
      
      // Animate KPIs immediately on load
      const kpiIndicator = card.querySelector('.kpi-indicator');
      if (kpiIndicator) {
        const kpiValue = kpiIndicator.querySelector('.kpi-value');
        const targetValue = card.getAttribute('data-kpi-value');
        const prefix = card.getAttribute('data-kpi-prefix') || '';
        const suffix = card.getAttribute('data-kpi-suffix') || '';
        if (kpiValue && targetValue) {
          animateKpiValue(kpiValue, targetValue, prefix, suffix);
        }
      }
    });
    
    // Create background data particles
    createDataParticles();
    
    // Initialize intersection observer for mobile
    initMobileKpiObserver();
  }
  
  // Initialize the intersection observer for mobile KPI indicators
  function initMobileKpiObserver() {
    // Disconnect any existing observer
    if (cardObserver) {
      cardObserver.disconnect();
    }
    
    // Only set up the observer if we're in dashboard mode and on a smaller screen
    if (body.classList.contains('dashboard-mode') && window.innerWidth <= 768) {
      cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const card = entry.target;
            const kpiIndicator = card.querySelector('.kpi-indicator');
            
            if (kpiIndicator) {
              // Show KPI indicator
              kpiIndicator.style.opacity = '1';
              kpiIndicator.style.transform = 'translateY(0)';
              
              // Animate value
              const kpiValue = kpiIndicator.querySelector('.kpi-value');
              const targetValue = card.getAttribute('data-kpi-value');
              const prefix = card.getAttribute('data-kpi-prefix') || '';
              const suffix = card.getAttribute('data-kpi-suffix') || '';
              
              if (kpiValue && targetValue) {
                animateKpiValue(kpiValue, targetValue, prefix, suffix);
              }
              
              // Hide after 2 seconds
              setTimeout(() => {
                if (kpiIndicator) {
                  kpiIndicator.style.opacity = '0';
                  kpiIndicator.style.transform = 'translateY(100%)';
                }
              }, 2000);
            }
          }
        });
      }, {
        threshold: 0.7, // Trigger when 70% of card is visible
        rootMargin: '-10% 0px' // Slightly reduce the effective viewport
      });
      
      // Observe all portfolio cards
      portfolioCards.forEach(card => {
        cardObserver.observe(card);
      });
    }
  }
  
  // Add missing KPI indicators to cards based on title matching
  function addMissingKpiIndicators(card) {
    // Skip cards that already have KPI indicators
    if (card.querySelector('.kpi-indicator')) return;
    
    const cardTitle = card.getAttribute('data-modal-title');
    if (!cardTitle) return;
    
    // Project spotlight data mapping - EXACT matches to data-modal-title values
    const projectData = {
      "Brookfield Block Party Request Process": { 
        icon: "⏱️", 
        value: "55", 
        title: "Hours Saved Annually", 
        suffix: "+"
      },
      "VBG & VNB Power Bi Dashboard Demos": { 
        icon: "📊", 
        value: "237", 
        title: "Service Insights Generated" 
      },
      "Buffalo Grove Project 25 Dashboard": { 
        icon: "💰", 
        value: "7.2", 
        title: "Construction Project Oversight",
        prefix: "$",
        suffix: "M"
      },
      "Glencoe Water Service Record Inventory App": { 
        icon: "💧", 
        value: "3,200", 
        title: "Water Service Records Managed",
        suffix: "+"
      },
      "Demo MGP Service Desk Ticket App": { 
        icon: "🖥️", 
        value: "20", 
        title: "Tickets Tracked Across Categories",
        suffix: "+"
      },
      "Sharepoint Intranet Design Development": { 
        icon: "🏠", 
        value: "5", 
        title: "Community Sites Centralized",
        suffix: "+"
      },
      "(LISA) Land Info Service Agent on GIS Data": { 
        icon: "🤖", 
        value: "3,600", 
        title: "Property Queries Automated via AI",
        suffix: "+"
      },
      "Microsofts Best in Automation ELM App": { 
        icon: "🏆", 
        value: "6", 
        title: "Municipal Communities Implemented" 
      },
      "Power BI Emergency Rental Assistance Dashboard": { 
        icon: "💵", 
        value: "53", 
        title: "in Rental Aid Tracked",
        prefix: "$",
        suffix: "M"
      },
      "Power BI Priority Repair Assistance Dashboard": { 
        icon: "🛠️", 
        value: "12", 
        title: "in Home Repairs Oversight",
        prefix: "$",
        suffix: "M"
      },
      "Smartsheet Neighborhood Improvement Dashboard": { 
        icon: "🌆", 
        value: "13.9", 
        title: "Community Investments Tracked",
        prefix: "$",
        suffix: "M"
      },
      "Stop Six: Transformation Newsletter": { 
        icon: "📰", 
        value: "49", 
        title: "in Neighborhood Improvements",
        prefix: "$",
        suffix: "M"
      },
      "Fort Worth Cares: Aid Mapping Portfolio": { 
        icon: "📍", 
        value: "68", 
        title: "Federal Relief Visualized",
        prefix: "$",
        suffix: "M"
      },
      "Public Engagement Report for District 11": {
        icon: "📍",
        value: "10",
        title: "Events Mapped & Analyzed",
        suffix: "+"
      },
      "Smartsheet Rental Assistance Dashboard": {
        icon: "💰",
        value: "25,000",
        title: "Applications Processed",
        suffix: "+"
      },
      "Smartsheet Alleyway Maintenance Dashboard": {
        icon: "🛣️",
        value: "132",
        title: "Miles of Alleyways Maintained"
      },
      "Smartsheet First Responder Covid19 Dashboard": {
        icon: "🚑",
        value: "3,265",
        title: "Testing Submissions Tracked"
      },
      // --- GIS INSIGHTS BANNERS ---
  "Fort Worth Housing Equity Insight Analysis": {
    icon: "🏘️",
    value: "100,000",
    title: "Cost Burdened Households",
    suffix: "+"
  },
  "Fort Worth CDBG Evolution: Decade Mapped": {
    icon: "🗺️",
    value: "10",
    title: "Years of Change Visualized",
    suffix: "+"
  },
  "Marine Area Sidewalk Condition & Average Daily Traffic Count": {
    icon: "🚶",
    value: "50",
    title: "Sidewalk Segments Evaluated",
    suffix: "+"
  },
  "District 4: Dynamic Demographics Mapped": {
    icon: "👥",
    value: "25",
    title: "Demographic Layers Analyzed",
    suffix: "+"
  },
  "Fort Worth Food Access Mapping Insights": {
    icon: "🍎",
    value: "40",
    title: "Meal Sites & Food Deserts Mapped",
    suffix: "+"
  },
  "Alleyway Qualification: Mapping Insights": {
    icon: "🛣️",
    value: "132",
    title: "Miles of Alleyways Qualified"
  },
  "Empower Fort Worth: Neighborhood Incentives": {
    icon: "📈",
    value: "8",
    title: "Empowerment Zones Mapped",
    suffix: "+"
  }
    };
    
    // Use exact match instead of substring matching
    const matchedProject = projectData[cardTitle];
    
    if (matchedProject) {
      // Create and append KPI indicator
      const kpiIndicator = document.createElement('div');
      kpiIndicator.className = 'kpi-indicator';
      
      const prefix = matchedProject.prefix || '';
      const suffix = matchedProject.suffix || '';
      
      kpiIndicator.innerHTML = `
  <div class="kpi-row">
    <span class="kpi-icon">${matchedProject.icon}</span>
    <span class="kpi-value">${prefix}0${suffix}</span>
  </div>
  <span class="kpi-title">${matchedProject.title}</span>
`;

      
      card.appendChild(kpiIndicator);
      
      // Set data attributes for animation
      card.setAttribute('data-kpi-title', matchedProject.title);
      card.setAttribute('data-kpi-value', matchedProject.value.replace(/,/g, ''));
      card.setAttribute('data-kpi-icon', matchedProject.icon);
      card.setAttribute('data-kpi-prefix', prefix);
      card.setAttribute('data-kpi-suffix', suffix);
      
      // Add event listeners for animation
      const kpiValue = kpiIndicator.querySelector('.kpi-value');
      card.addEventListener('mouseenter', () => {
        animateKpiValue(kpiValue, matchedProject.value, prefix, suffix);
      });
      
      card.addEventListener('mouseleave', () => {
        kpiValue.textContent = `${prefix}0${suffix}`;
      });
    }
  }
  
  // Enhanced KPI value animation with support for commas and prefixes/suffixes
  function animateKpiValue(element, targetValue, prefix = '', suffix = '') {
    // Handle values with commas (like 3,200)
    const rawValue = targetValue.toString().replace(/,/g, '');
    const target = parseFloat(rawValue);
    let current = 0;
    const increment = target / 50; // Adjust for animation speed
    
    const updateValue = () => {
      if (current < target) {
        current = Math.min(current + increment, target);
        
        // Format number with commas if original had commas
        let formattedValue = current;
        if (targetValue.includes(',')) {
          formattedValue = Math.round(current).toLocaleString();
        } else if (target % 1 !== 0) {
          // Handle decimal values
          formattedValue = current.toFixed(1);
        } else {
          formattedValue = Math.round(current).toString();
        }
        
        element.textContent = `${prefix}${formattedValue}${suffix}`;
        requestAnimationFrame(updateValue);
      } else {
        element.textContent = `${prefix}${targetValue}${suffix}`;
      }
    };
    
    updateValue();
  }
  
  // Reset to normal mode
  function resetNormalMode() {
    // Clear visualizations
    document.querySelectorAll('.viz-svg').forEach(svg => {
      svg.innerHTML = '';
    });
    
    // Clear data particles
    dataParticles.innerHTML = '';
    
    // Disconnect observer
    if (cardObserver) {
      cardObserver.disconnect();
      cardObserver = null;
    }
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
});
