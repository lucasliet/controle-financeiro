import { updateCharts } from './charts.js';
import { populateMonthYearSelector, updateStatementList } from './ui.js';

const menuToggle = document.getElementById('menu-toggle');
const drawer = document.getElementById('drawer');
const overlay = document.getElementById('overlay');
const navLinks = document.querySelectorAll('.nav-link');
const views = document.querySelectorAll('.view');


let touchStartX = 0;
let touchCurrentX = 0;
let isDraggingDrawer = false;
let drawerIsOpenAtDragStart = false; 
const edgeThreshold = 50; 
const openThreshold = 80; 

function openDrawer() {
    
    drawer.style.transition = 'transform 0.3s ease-in-out';
    overlay.style.transition = 'opacity 0.3s ease-in-out';
    
    drawer.style.transform = '';
    overlay.style.opacity = '';
    
    drawer.classList.add('open');
    overlay.classList.add('active');
    menuToggle.classList.add('active');
    
    setTimeout(() => {
        drawer.style.transition = '';
        overlay.style.transition = '';
    }, 300); 
}

function closeDrawer() {
    
    drawer.style.transition = 'transform 0.3s ease-in-out';
    overlay.style.transition = 'opacity 0.3s ease-in-out';
    
    drawer.style.transform = '';
    overlay.style.opacity = '';
    
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    menuToggle.classList.remove('active');
    
    setTimeout(() => {
        drawer.style.transition = '';
        overlay.style.transition = '';
    }, 300); 
}

export function switchView(viewId) {
    views.forEach(view => {
        view.classList.toggle('active-view', view.id === viewId);
        view.classList.toggle('hidden-view', view.id !== viewId);
    });

    
    if (viewId === 'charts-view') {
        setTimeout(updateCharts, 50);
    } else if (viewId === 'statement-view') {
        
        populateMonthYearSelector();
        const monthYearSelect = document.getElementById('monthYearSelect');
        if (monthYearSelect.value) { 
            updateStatementList(monthYearSelect.value);
        } else {
             
             const statementList = document.getElementById('statementTransactions');
             if(statementList) statementList.innerHTML = '<li>Nenhuma transação registrada ainda.</li>';
        }
    }
    

    closeDrawer();
}


function handleTouchStart(event) {
    touchStartX = event.touches[0].clientX;
    touchCurrentX = touchStartX; 
    drawerIsOpenAtDragStart = drawer.classList.contains('open');

    if (drawerIsOpenAtDragStart) {
        
        isDraggingDrawer = true;
        drawer.style.transition = 'none';
        overlay.style.transition = 'none';
    } else {
        
        if (touchStartX <= edgeThreshold) {
            isDraggingDrawer = true;
            drawer.style.transition = 'none';
            overlay.style.transition = 'none';
        } else {
            isDraggingDrawer = false;
        }
    }
}

function handleTouchMove(event) {
    if (!isDraggingDrawer) return;

    touchCurrentX = event.touches[0].clientX;
    let diffX = touchCurrentX - touchStartX;
    const drawerWidth = drawer.offsetWidth;

    if (drawerIsOpenAtDragStart) { 
        
        
        let targetX = Math.max(-drawerWidth, Math.min(0, diffX));
        drawer.style.transform = `translateX(${targetX}px)`;
        
        overlay.style.opacity = Math.max(0, 0.5 * (1 + targetX / drawerWidth));
    } else { 
        
        
        let effectiveMove = Math.max(0, Math.min(drawerWidth, diffX));
        drawer.style.transform = `translateX(${-drawerWidth + effectiveMove}px)`;
        overlay.classList.add('active'); 
        
        overlay.style.opacity = Math.min(0.5, 0.5 * (effectiveMove / drawerWidth));
    }

    
    if (event.cancelable) {
        event.preventDefault();
    }
}


function handleTouchEnd(event) {
    if (!isDraggingDrawer) return;

    
    const diffX = touchCurrentX - touchStartX;
    

    isDraggingDrawer = false; 

    if (drawerIsOpenAtDragStart) { 
        if (diffX < -openThreshold) { 
            closeDrawer();
        } else { 
            openDrawer(); 
        }
    } else { 
        if (diffX > openThreshold) {
            openDrawer();
        } else {
            
            closeDrawer(); 
        }
    }
    
    
}

export function initializeNavigation() {
    menuToggle.addEventListener('click', () => {
        
        drawer.classList.contains('open') ? closeDrawer() : openDrawer();
    });

    overlay.addEventListener('click', closeDrawer);

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = link.getAttribute('data-view');
            switchView(viewId);
            
        });
    });

    document.body.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.body.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.body.addEventListener('touchend', handleTouchEnd);
    document.body.addEventListener('touchcancel', handleTouchEnd);
}
