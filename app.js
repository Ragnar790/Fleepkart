const cartBtn = document.querySelector('.cart-btn');
const closeCartBtn = document.querySelector('.close-cart');
const clearCartBtn = document.querySelector('.clear-cart');
const cartDOM = document.querySelector('.cart');
const cartOverlay = document.querySelector('.cart-overlay');
const cartItems = document.querySelector('.cart-items');
const cartTotal = document.querySelector('.cart-total');
const cartContent = document.querySelector('.cart-content');
const productsDOM = document.querySelector('.products-center');

//CART
let cart = [];
//BUTTONS
let buttonsDOM = [];

//GET THE PRODUCTS
class Products {
  async getProducts() {
    try {
      let result = await fetch('products.json');
      let data = await result.json();
      let products = data.items;
      products = products.map((item) => {
        const { title, price } = item.fields;
        const { id } = item.sys;
        const image = item.fields.image.fields.file.url;
        return { title, price, id, image };
      });
      return products;
    } catch (error) {
      console.log(error);
    }
  }
}

// DISPLAY PRODUCTS
class UI {
  displayProducts(products) {
    let result = '';
    products.forEach((product) => {
      result += `
        <!-- SINGLE PRODUCT  -->
        <article class="product">
          <div class="img-container">
            <img src=${product.image} alt="" class="product-img" />
            <button class="bag-btn" data-id=${product.id}>
              <i class="fas fa-shopping-cart"></i>
              Add to cart
            </button>
          </div>
          <h3>${product.title}</h3>
          <h4>${product.price}</h4>
        </article>
        <!--END OF SINGLE PRODUCT  -->
        `;
      productsDOM.innerHTML = result;
    });
  }
  getBagBtns() {
    const buttons = [...document.querySelectorAll('.bag-btn')];
    buttonsDOM = buttons;
    buttons.forEach((button) => {
      const id = button.dataset.id;
      //checking if item with this id is already in the cart or not
      let inCart = cart.find((item) => item.id === id);
      //if present
      if (inCart) {
        button.innerText = 'In cart';
        button.disabled = true;
      }
      button.addEventListener('click', (event) => {
        event.target.innerText = 'In cart';
        event.target.disabled = true;
        //get product from products (local storage)
        let cartItem = { ...Storage.getProduct(id), amount: 1 };
        //add product to the cart
        cart = [...cart, cartItem];
        //save cart in local storage
        Storage.saveCart(cart);
        //set cart values (calculation part in the cart)
        this.setCartValues(cart);
        //display item in the cart
        this.addToCart(cartItem);
        //show the cart
        this.showCart();
      });
    });
  }
  setCartValues(cart) {
    let totalItems = 0;
    let totalAmt = 0;
    cart.map((item) => {
      totalItems += item.amount;
      totalAmt += item.price * item.amount;
    });
    cartItems.innerText = totalItems;
    cartTotal.innerText = parseFloat(totalAmt.toFixed(2));
  }
  addToCart(item) {
    const div = document.createElement('div');
    div.classList.add('cart-item');
    div.innerHTML = `<img src=${item.image} alt="" />
    <div>
      <h4>${item.title}</h4>
      <h5>$${item.price}</h5>
      <span class="remove-item" data-id=${item.id}>Remove</span>
    </div>
    <div>
      <i class="fas fa-chevron-up" data-id=${item.id}></i>
      <p class="item-amount">${item.amount}</p>
      <i class="fas fa-chevron-down" data-id=${item.id}></i>
    </div>`;
    cartContent.appendChild(div);
  }
  showCart() {
    cartOverlay.classList.add('transparentBcg');
    cartDOM.classList.add('showCart');
  }
  setUpApp() {
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populateCart(cart);
    cartBtn.addEventListener('click', this.showCart);
    closeCartBtn.addEventListener('click', this.hideCart);
  }
  populateCart(cart) {
    cart.forEach((item) => this.addToCart(item));
  }
  hideCart() {
    cartOverlay.classList.remove('transparentBcg');
    cartDOM.classList.remove('showCart');
  }
  cartLogic() {
    //clear cart
    clearCartBtn.addEventListener('click', () => {
      this.clearCart();
    });
    //cart functionality - remove, increase and decrease amount of an item in the cart
    cartContent.addEventListener('click', (event) => {
      //remove item
      if (event.target.classList.contains('remove-item')) {
        let removeItem = event.target;
        //event.target gives me the dom element of the button that was clicked (in this case, the remove button)
        //we want to remove the whole item
        //so we move up to the dom element containing the item (in this case, it is in two parent elements above)
        //then remove the dom element (which is the whole item) from cartContent
        cartContent.removeChild(removeItem.parentElement.parentElement);
        let id = removeItem.dataset.id;
        this.removeItem(id);
      }
      // increase item amount
      else if (event.target.classList.contains('fa-chevron-up')) {
        let addAmount = event.target;
        let id = addAmount.dataset.id;
        let tempItem = cart.find((item) => item.id === id);
        tempItem.amount = tempItem.amount + 1;
        //saving the modified cart in local storage and running the calculation function (setCartValues) with the modified cart
        Storage.saveCart(cart);
        this.setCartValues(cart);
        //displaying new amount
        addAmount.nextElementSibling.innerText = tempItem.amount;
      }
      //decrease item amount
      else if (event.target.classList.contains('fa-chevron-down')) {
        let reduceAmount = event.target;
        let id = reduceAmount.dataset.id;
        let tempItem = cart.find((item) => item.id === id);
        if (tempItem.amount > 1) {
          tempItem.amount = tempItem.amount - 1;
        }
        Storage.saveCart(cart);
        this.setCartValues(cart);
        reduceAmount.previousElementSibling.innerText = tempItem.amount;
      }
    });
  }
  clearCart() {
    //storing the id of all the items in the cart
    let cartItems = cart.map((item) => item.id);
    //taking each id and removing it
    cartItems.forEach((id) => this.removeItem(id));
    //removing all items from the DOM
    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }
    this.hideCart();
  }
  removeItem(id) {
    //removing item with passed id from the cart
    //filtering the cart - keeping only the items whose id is different from the passed id
    cart = cart.filter((item) => item.id !== id);
    //calling already defined functions
    this.setCartValues(cart);
    Storage.saveCart(cart);
    //get the DOM element of the button with a given id
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to cart`;
  }
  getSingleButton(id) {
    //getting the id of the button that was clicked
    //then returning the DOM element of that button
    return buttonsDOM.find((button) => button.dataset.id === id);
  }
}

//LOCAL STORAGE
class Storage {
  static saveProducts(products) {
    localStorage.setItem('products', JSON.stringify(products));
  }
  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem('products'));
    return products.find((product) => product.id === id);
  }
  static saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
  }
  static getCart() {
    //if cart in local storage is empty, return empty array
    //else return the cart
    return localStorage.getItem('cart')
      ? JSON.parse(localStorage.getItem('cart'))
      : [];
  }
}

//ON DOM LOAD
document.addEventListener('DOMContentLoaded', () => {
  const ui = new UI();
  const products = new Products();
  ui.setUpApp();
  //GET ALL PRODUCTS
  products
    .getProducts()
    .then((products) => {
      ui.displayProducts(products);
      Storage.saveProducts(products);
    })
    .then(() => {
      ui.getBagBtns();
      ui.cartLogic();
    });
});
