
    const categoryBtns = document.querySelectorAll('.category-btn');
    const cartIcon = document.getElementById('cartIcon');
    const cartModal = document.getElementById('cartModal');
    const closeCart = document.getElementById('closeCart');
    const cartItems = document.getElementById('cartItems');
   const cartSummary = document.getElementById('cartSummary');
   const cartCount = document.getElementById('cartCount');
    const toast = document.getElementById('toast');



   localStorage.setItem('lab-cart', JSON.stringify(cart));


function updateCart() {
    cartCount.textContent = cart.length; // عدد العناصر وليس الكمية
    
    cartItems.innerHTML = ''; // تفريغ السابق
    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
       
        cartItems.appendChild(itemDiv);
    });

    cartTotal.textContent = `${total} LE`;
    cartSummary.style.display = 'block';

    saveCart(); // حفظ التحديثات
    displayTests(testsData); // تحديث أزرار الإضافة
}

function removeFromLocalCart(e) {
    const id = parseInt(e.target.getAttribute('data-id'));
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCart();
}

loadCart();               // استرجاع العربة من التخزين
displayTests(testsData);  // عرض التحاليل في الصفحة
updateCart();             // تحديث واجهة العربة

