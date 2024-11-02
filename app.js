
// Products database
const products = {
    A1: { name: 'Popcorn', price: 30, image: 'https://th.bing.com/th/id/OIP.ZK6-GhjHxYsN1wt1_220eAAAAA?pid=ImgDet&w=205&h=262&c=7&dpr=1.9' },
    A2: { name: 'Classic Salted Chips', price: 20, image: 'https://th.bing.com/th/id/OIP.EEh77uoANtmIdvRtH1FsLgHaHa?rs=1&pid=ImgDetMain' },
    A3: { name: 'Candy', price: 20, image: 'https://img.freepik.com/premium-photo/lollipop-candy-white-background_349893-3042.jpg' },
    A4: { name: 'Chocolate', price: 50, image: 'snickers.jpeg' },
    A5: { name: 'Mineral Water', price: 20, image: 'bisleri.jpeg' },
    A6: { name: 'Orange Juice', price: 30, image: 'https://th.bing.com/th/id/OIP.6MzqZY27MVaceYY1RADJ5wHaHa?w=186&h=186&c=7&r=0&o=5&dpr=1.9&pid=1.7' },
    B1: { name: 'Coke', price: 40, image: 'https://th.bing.com/th/id/OIP.3pHEou4yUc6KbQ2DcsSy1wHaID?w=180&h=196&c=7&r=0&o=5&dpr=1.9&pid=1.7' },
    B2: { name: 'Coffee', price: 70, image: 'https://th.bing.com/th/id/OIP.h_bCEkHHT_Mdpqcnp7jG1QHaHa?pid=ImgDet&w=205&h=205&c=7&dpr=1.9' },
    B3: { name: 'Cookies', price: 25, image: 'cookies.jpeg' },
    B4: { name: 'Masala Chips', price: 35, image: 'https://th.bing.com/th/id/OIP.UmW3lUJ41EM01QTpjeQC8gAAAA?w=196&h=196&c=7&r=0&o=5&dpr=1.9&pid=1.7' },
    B5: { name: 'Ice Cream', price: 40, image: 'https://th.bing.com/th/id/OIP.1aMjDvWyhhwXiD6i_X9f1wHaHa?w=185&h=185&c=7&dpr=1.9' },
    B6: { name: 'American Onion Chips', price: 20, image: 'https://th.bing.com/th/id/OIP.uMt-G2jzJO2eweAJu3QTFwHaHa?w=215&h=215&c=7&r=0&o=5&dpr=1.9&pid=1.7' }
};

// Valid denominations
const validDenominations = new Set([5, 10, 20, 50, 100, 200, 500]);

// Initialize state
let balance = 0;
let cart = [];

// DOM elements
const balanceElem = document.getElementById('balance');
const messageElem = document.getElementById('message');
const cartElem = document.getElementById('cart');
const insertBtn = document.querySelector('.insert-btn');
const processPurchaseBtn = document.getElementById('process-purchase');
const resetCartBtn = document.getElementById('reset-cart');

// Update balance display
function updateBalance() {
    balanceElem.textContent = `Balance: ₹${balance}`;
}

// Add coins to balance and update the notes table
insertBtn.addEventListener('click', () => {
    const amount = parseInt(document.querySelector('.coin-input input').value, 10);
    
    if (isNaN(amount) || amount <= 0) {
        messageElem.textContent = 'Please enter a valid amount.';
        return;
    }
    
    if (!validDenominations.has(amount)) {
        messageElem.textContent = 'Please insert valid denominations (5, 10, 20, 50, 100, 200, 500).';
        return;
    }
    
    // Update balance and reset input field
    balance += amount;
    document.querySelector('.coin-input input').value = '';
    messageElem.textContent = '';
    updateBalance();
    
    // Send the inserted amount to the backend to update the notes
    fetch('update_notes.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insertedAmount: amount })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Note count updated successfully');
        } else {
            console.error('Error updating note count');
        }
    })
    .catch(error => console.error('Error:', error));
});

// Select product
document.querySelectorAll('.select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const itemCode = btn.getAttribute('data-item');
        const product = products[itemCode];
        
        if (!product) {
            messageElem.textContent = 'Product not found.';
            return;
        }

        if (balance < product.price) {
            messageElem.textContent = 'Insufficient balance.';
            return;
        }

        // Add product to cart
        cart.push(product);
        balance -= product.price;
        updateBalance();

        // Update cart display
        cartElem.innerHTML = cart.map(item => `${item.name} - ₹${item.price}`).join('<br>');
        messageElem.textContent = '';
    });
});

// Reset cart
resetCartBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        messageElem.textContent = 'Cart is already empty.';
        return;
    }

    // Calculate total value of the cart
    const totalCartValue = cart.reduce((sum, item) => sum + item.price, 0);

    // Return total cart value to the user
    balance += totalCartValue;

    // Clear the cart
    cart = [];
    cartElem.textContent = 'Cart is empty.';
    messageElem.textContent = 'Cart has been reset and amount returned to balance.';

    // Update balance display
    updateBalance();
});

// Process purchase and return change
processPurchaseBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        messageElem.textContent = 'Cart is empty.';
        return;
    }

    if (balance < 0) {
        messageElem.textContent = 'Error in transaction. Please try again.';
        return;
    }

    // Return change if applicable
    let changeToReturn = {};
    if (balance > 0) {
        changeToReturn = calculateChange(balance); // Update balance before storing transaction

        // Send the change info to the backend
        fetch('update_notes.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ change: changeToReturn })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Change returned successfully');
                balance = 0;  // Reset balance after change is returned
                updateBalance();  // Update balance display to show 0
            } else {
                console.error('Error returning change');
            }
        })
        .catch(error => console.error('Error:', error));
    }

    // Prepare data for storage after change calculation
    const transactionData = {
        cart: cart.map(item => ({ name: item.name, price: item.price })),
        totalAmount: cart.reduce((sum, item) => sum + item.price, 0),
        remainingBalance: balance // Now the balance will be 0 after change
    };

    // Make an AJAX request to store the transaction
    fetch('store_transaction.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            cartElem.textContent = `Happy Food! Your Balance: ₹${balance}`;
            messageElem.textContent = 'Thank you for your purchase! Visit again!';

            // Clear cart and reset balance after delay
            setTimeout(() => {
                balance = 0;
                updateBalance();
                cartElem.textContent = ''; // Optionally clear cart display
            }, 3000); // 3 seconds delay
        } else {
            messageElem.textContent = 'Error in storing transaction.';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        messageElem.textContent = 'Error in storing transaction.';
    });
});

// Function to calculate the change to return
function calculateChange(balance) {
    const change = {};
    const denominations = [500, 200, 100, 50, 20, 10, 5];

    for (const denom of denominations) {
        if (balance >= denom) {
            const count = Math.floor(balance / denom);
            balance -= count * denom;
            change[denom] = count;
        }
    }

    return change;
}
// Function to handle canceling the transaction
function cancelTransaction() {
    if (balance > 0) {
        fetch('update_notes.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cancelAmount: balance })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                cart = []; // Clear cart
                balance = 0; // Reset balance
                updateBalance();
                cartElem.textContent = 'Cart is empty.';
                messageElem.textContent = 'Transaction canceled. Balance returned.';
            } else {
                messageElem.textContent = 'Error canceling transaction.';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            messageElem.textContent = 'Error canceling transaction.';
        });
    } else {
        messageElem.textContent = 'No balance to return.';
    }
}

// Attach cancelTransaction function to the Cancel button
document.getElementById('cancel-transaction').addEventListener('click', cancelTransaction); 