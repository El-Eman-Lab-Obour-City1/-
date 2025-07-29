 const packages = [
            {
                id: 1,
                name: "للأطمئنان على البنكرياس",
                image: "1.png",
                price: 350,
                category: "pancreas"
            },
            {
                id: 2,
                name: "عرض الاطمئنان على القلب والعضلات",
                image: "2.png",
                price: 250,
                category: "heart"
            },
            {
                id: 3,
                name: "للاطمئنان على العظام",
                image: "3.png",
                price: 450,
                category: "bones"
            },
            {
                id: 4,
                name: "عرض تحاليل فيتامينات الاعصاب",
                image: "4.png",
                price: 333,
                category: "vitamins"
            },
            {
                id: 5,
                name: "عرض تحاليل فقر الدم والضغط",
                image: "5.png",
                price: 333,
                category: "blood"
            },
            {
                id: 6,
                name: "صحة المرأة",
                image: "6.png",
                price: 800,
                category: "women"
            }
        ];
        
        // DOM Elements
        const packagesContainer = document.getElementById('packages-container');
        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotalElement = document.getElementById('cart-total');
        const cartCountElement = document.querySelector('.cart-count');
        const cartBtn = document.querySelector('.cart-btn');
        const cartSidebar = document.querySelector('.cart-sidebar');
        const closeCartBtn = document.querySelector('.close-cart');
        const overlay = document.querySelector('.overlay');
        const filterBtns = document.querySelectorAll('.filter-btn');
        const menuToggle = document.querySelector('.menu-toggle');
        const navList = document.querySelector('nav ul');
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');
        const noResults = document.getElementById('noResults');
        const cartFooter = document.getElementById('cart-footer');
        
        // Cart State
        let cart = [];
        let currentFilter = 'all';
        let currentSearch = '';
        
        // Initialize the page
        function init() {
            renderPackages();
            setupEventListeners();
            updateCart();
        }
        
        // Render packages with filter and search
        function renderPackages() {
            packagesContainer.innerHTML = '';
            
            const filteredPackages = packages.filter(pkg => {
                // Apply filter
                const filterMatch = currentFilter === 'all' || pkg.category === currentFilter;
                
                // Apply search
                const searchMatch = pkg.name.includes(currentSearch) || 
                                  pkg.price.toString().includes(currentSearch);
                
                return filterMatch && searchMatch;
            });
            
            if (filteredPackages.length === 0) {
                noResults.style.display = 'block';
            } else {
                noResults.style.display = 'none';
            }
            
            filteredPackages.forEach(pkg => {
                const packageElement = document.createElement('div');
                packageElement.className = 'package-card';
                packageElement.dataset.id = pkg.id;
                packageElement.dataset.category = pkg.category;
                
                packageElement.innerHTML = `
                    <img src="${pkg.image}" alt="${pkg.name}" class="package-image">
                  
                    
                    <button class="add-to-cart-btn">إضافة للسلة</button>
                `;
                
                packagesContainer.appendChild(packageElement);
            });
        }
        
        // Search function
        function handleSearch() {
            currentSearch = searchInput.value;
            renderPackages();
        }
        
        // Clear search
        function clearSearchInput() {
            searchInput.value = '';
            currentSearch = '';
            renderPackages();
        }
        
        // Setup event listeners
        function setupEventListeners() {
            // Filter buttons
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentFilter = btn.dataset.filter;
                    renderPackages();
                });
            });
            
            // Cart button
            cartBtn.addEventListener('click', toggleCart);
            
            // Close cart button
            closeCartBtn.addEventListener('click', toggleCart);
            
            // Overlay click
            overlay.addEventListener('click', toggleCart);
            
            // Add to cart (delegated event)
            packagesContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('add-to-cart-btn')) {
                    const packageElement = e.target.closest('.package-card');
                    const packageId = parseInt(packageElement.dataset.id);
                    addToCart(packageId);
                }
            });
            
            // Cart item actions (delegated events)
            cartItemsContainer.addEventListener('click', (e) => {
                const cartItemElement = e.target.closest('.cart-item');
                if (!cartItemElement) return;
                
                const packageId = parseInt(cartItemElement.dataset.id);
                
                if (e.target.classList.contains('remove-item')) {
                    removeFromCart(packageId);
                }
            });
            
            // Menu toggle
            menuToggle.addEventListener('click', () => {
                navList.classList.toggle('active');
            });
            
            // Search input events
            searchInput.addEventListener('input', handleSearch);
            
            // Clear search button
            clearSearch.addEventListener('click', clearSearchInput);
        }
        
        // Cart functions
        function addToCart(packageId) {
            const existingItem = cart.find(item => item.id === packageId);

            if (existingItem) {
                showToast("هذا التحليل موجود بالفعل في السلة.");
                return;
            }

            const packageToAdd = packages.find(pkg => pkg.id === packageId);
            cart.push({
                ...packageToAdd,
                quantity: 1
            });

            updateCart();
            animateCartButton();
            showToast("تمت إضافة التحليل إلى السلة ✅");
        }
        
        function removeFromCart(packageId) {
            cart = cart.filter(item => item.id !== packageId);
            updateCart();
        }
        
        function updateCart() {
            // Show/hide cart footer based on cart content
            if (cart.length === 0) {
                cartFooter.style.display = 'none';
                cartItemsContainer.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart" style="font-size: 2rem; margin-bottom: 1rem;"></i><p>سلة التسوق فارغة</p></div>';
            } else {
                cartFooter.style.display = 'block';
                cartItemsContainer.innerHTML = cart.map(item => `
                    <div class="cart-item" data-id="${item.id}">
                        <div class="cart-item-img">
                            <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div class="cart-item-details">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-price">${item.price} ريال</div>
                            <div class="cart-item-actions">
                                <span class="remove-item">إزالة</span>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
            
            // Update cart total
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartTotalElement.textContent = `${total} ريال`;
            
            // Update cart count
            const count = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCountElement.textContent = count;
            
            // Save to localStorage
            localStorage.setItem('lab-cart', JSON.stringify(cart));
        }
        
        // UI functions
        function toggleCart() {
            const isOpen = cartSidebar.classList.toggle('open');
            overlay.classList.toggle('active');
            document.body.style.overflow = isOpen ? 'hidden' : '';
            document.body.classList.toggle('cart-open', isOpen);
        }
        
        function animateCartButton() {
            cartBtn.classList.add('bounce');
            setTimeout(() => {
                cartBtn.classList.remove('bounce');
            }, 800);
        }
        
        function showToast(message) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
        
        function checkout() {
            if (cart.length === 0) {
                alert('سلة التسوق فارغة!');
                return;
            }
            
            // In a real app, you would redirect to checkout page
            // window.location.href = '/checkout';
        }
        
        // Load cart from localStorage
        function loadCart() {
            const savedCart = localStorage.getItem('lab-cart');
            if (savedCart) {
                cart = JSON.parse(savedCart);
                updateCart();
            }
        }
        
        // Initialize the app when splash screen finishes
        setTimeout(() => {
            document.getElementById('splash').style.display = 'none';
            loadCart();
            init();
        }, 2000);