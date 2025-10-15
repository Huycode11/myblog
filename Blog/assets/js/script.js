const CONFIG = {
    autoSlideInterval: 4000, // 4 giây
    transitionDuration: 1200, // 1.2 giây
    pauseOnHover: true,
    enableKeyboard: true,
    enableTouch: true,
    showProgressBar: true
};

class CarouselManager {
    constructor() {
        this.currentSlideIndex = 0;
        this.slides = document.querySelectorAll('.slide');
        this.dots = document.querySelectorAll('.dot');
        this.totalSlides = this.slides.length;
        this.autoSlideTimer = null;
        this.isUserInteracting = false;
        this.progressBar = null;
        
        this.init();
    }

    init() {
        this.createProgressBar();
        this.bindEvents();
        this.startAutoSlide();
        this.preloadSlides();
    }

    createProgressBar() {
        if (CONFIG.showProgressBar) {
            this.progressBar = document.createElement('div');
            this.progressBar.className = 'progress-bar';
            document.body.appendChild(this.progressBar);
        }
    }

    preloadSlides() {
        // Thêm class để trigger animation cho slide đầu tiên
        setTimeout(() => {
            this.slides[0].classList.add('active');
        }, 100);
    }

    showSlide(index, direction = 'next') {
        // Reset tất cả animations
        this.slides.forEach(slide => {
            const content = slide.querySelector('.slide-content');
            if (content) {
                content.style.animation = 'none';
                content.offsetHeight; // Trigger reflow
            }
        });

        // Remove active class từ tất cả
        this.slides.forEach(slide => slide.classList.remove('active'));
        this.dots.forEach(dot => dot.classList.remove('active'));

        // Add active class cho slide hiện tại
        this.slides[index].classList.add('active');
        this.dots[index].classList.add('active');

        // Trigger animation cho content
        setTimeout(() => {
            const activeContent = this.slides[index].querySelector('.slide-content');
            if (activeContent) {
                const h1 = activeContent.querySelector('h1');
                const p = activeContent.querySelector('p');
                const btnGroup = activeContent.querySelector('.btn-group');

                if (h1) {
                    h1.style.animation = 'slideInLeft 1s cubic-bezier(0.4, 0, 0.2, 1) forwards';
                }
                if (p) {
                    p.style.animation = 'slideInLeft 1s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards';
                }
                if (btnGroup) {
                    btnGroup.style.animation = 'slideInLeft 1s cubic-bezier(0.4, 0, 0.2, 1) 0.6s forwards';
                }
            }
        }, 50);

        this.updateProgressBar();
    }

    changeSlide(direction) {
        this.isUserInteracting = true;
        
        if (direction === 1) {
            this.currentSlideIndex = (this.currentSlideIndex + 1) % this.totalSlides;
        } else {
            this.currentSlideIndex = (this.currentSlideIndex - 1 + this.totalSlides) % this.totalSlides;
        }

        this.showSlide(this.currentSlideIndex, direction === 1 ? 'next' : 'prev');
        this.resetAutoSlide();
    }

    goToSlide(index) {
        this.isUserInteracting = true;
        this.currentSlideIndex = index;
        this.showSlide(this.currentSlideIndex);
        this.resetAutoSlide();
    }

    startAutoSlide() {
        if (this.autoSlideTimer) {
            clearInterval(this.autoSlideTimer);
        }

        this.autoSlideTimer = setInterval(() => {
            if (!this.isUserInteracting) {
                this.currentSlideIndex = (this.currentSlideIndex + 1) % this.totalSlides;
                this.showSlide(this.currentSlideIndex, 'next');
            }
        }, CONFIG.autoSlideInterval);
    }

    stopAutoSlide() {
        if (this.autoSlideTimer) {
            clearInterval(this.autoSlideTimer);
            this.autoSlideTimer = null;
        }
    }

    resetAutoSlide() {
        this.stopAutoSlide();
        // Reset user interaction flag sau 1 giây
        setTimeout(() => {
            this.isUserInteracting = false;
        }, 1000);
        this.startAutoSlide();
    }

    updateProgressBar() {
        if (this.progressBar) {
            const progress = ((this.currentSlideIndex + 1) / this.totalSlides) * 100;
            this.progressBar.style.width = `${progress}%`;
        }
    }

    bindEvents() {
        const carousel = document.querySelector('.carousel-container');
        
        // Navigation Arrows
        const prevBtn = document.querySelector('.nav-arrow.prev');
        const nextBtn = document.querySelector('.nav-arrow.next');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.changeSlide(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.changeSlide(1));

        // Dots Navigation
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });

        // Hover Events
        if (CONFIG.pauseOnHover && carousel) {
            carousel.addEventListener('mouseenter', () => {
                this.isUserInteracting = true;
                this.stopAutoSlide();
            });

            carousel.addEventListener('mouseleave', () => {
                this.isUserInteracting = false;
                this.startAutoSlide();
            });
        }

        // Keyboard Navigation
        if (CONFIG.enableKeyboard) {
            document.addEventListener('keydown', (e) => {
                switch(e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.changeSlide(-1);
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.changeSlide(1);
                        break;
                    case ' ': // Spacebar
                        e.preventDefault();
                        this.isUserInteracting ? this.startAutoSlide() : this.stopAutoSlide();
                        this.isUserInteracting = !this.isUserInteracting;
                        break;
                }
            });
        }

        // Touch/Swipe Events
        if (CONFIG.enableTouch && carousel) {
            this.setupTouchEvents(carousel);
        }

        // Window Visibility API - Pause khi tab không active
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoSlide();
            } else if (!this.isUserInteracting) {
                this.startAutoSlide();
            }
        });

        // Resize Event
        window.addEventListener('resize', this.debounce(() => {
            this.showSlide(this.currentSlideIndex);
        }, 250));
    }

    setupTouchEvents(carousel) {
        let startX = 0;
        let startY = 0;
        let startTime = 0;
        const minSwipeDistance = 50;
        const maxSwipeTime = 300;

        carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
        }, { passive: true });

        carousel.addEventListener('touchmove', (e) => {
            // Prevent scrolling during swipe
            const deltaX = Math.abs(e.touches[0].clientX - startX);
            const deltaY = Math.abs(e.touches[0].clientY - startY);
            
            if (deltaX > deltaY) {
                e.preventDefault();
            }
        }, { passive: false });

        carousel.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const endTime = Date.now();

            const deltaX = startX - endX;
            const deltaY = Math.abs(startY - endY);
            const deltaTime = endTime - startTime;

            // Check if it's a valid swipe
            if (Math.abs(deltaX) > minSwipeDistance && 
                deltaY < 100 && 
                deltaTime < maxSwipeTime) {
                
                if (deltaX > 0) {
                    this.changeSlide(1); // Swipe left - next slide
                } else {
                    this.changeSlide(-1); // Swipe right - previous slide
                }
            }

            // Reset values
            startX = 0;
            startY = 0;
            startTime = 0;
        }, { passive: true });
    }

    // Utility function để debounce events
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Public methods để control từ bên ngoài
    play() {
        this.isUserInteracting = false;
        this.startAutoSlide();
    }

    pause() {
        this.isUserInteracting = true;
        this.stopAutoSlide();
    }

    next() {
        this.changeSlide(1);
    }

    prev() {
        this.changeSlide(-1);
    }

    goto(index) {
        if (index >= 0 && index < this.totalSlides) {
            this.goToSlide(index);
        }
    }

    destroy() {
        this.stopAutoSlide();
        if (this.progressBar) {
            this.progressBar.remove();
        }
        // Remove all event listeners would need more complex implementation
    }
}

// Global functions để backward compatibility
let carouselInstance = null;

function changeSlide(direction) {
    if (carouselInstance) {
        carouselInstance.changeSlide(direction);
    }
}

function currentSlide(index) {
    if (carouselInstance) {
        carouselInstance.goToSlide(index - 1); // Convert to 0-based index
    }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    carouselInstance = new CarouselManager();
    
    // Expose instance globally for debugging
    window.carousel = carouselInstance;
});

// Handle page visibility for better performance
document.addEventListener('visibilitychange', () => {
    if (carouselInstance) {
        if (document.hidden) {
            carouselInstance.pause();
        } else {
            // Resume after a short delay
            setTimeout(() => {
                if (!carouselInstance.isUserInteracting) {
                    carouselInstance.play();
                }
            }, 500);
        }
    }
});

// Performance optimization - Reduce animations on low-end devices
if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    CONFIG.transitionDuration = 800;
    CONFIG.autoSlideInterval = 5000;
}

// Console info for developers
console.log('🎠 Carousel initialized with config:', CONFIG);
console.log('🎮 Controls: Arrow keys, Space (pause/play), Swipe, Click dots/arrows');
console.log('🔧 Global controls: window.carousel.play(), .pause(), .next(), .prev(), .goto(index)');

