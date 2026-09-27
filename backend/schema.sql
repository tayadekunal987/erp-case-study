-- ==========================================
-- ERP CASE STUDY - DATABASE SCHEMA
-- PostgreSQL
-- ==========================================

-- ==========================================
-- 1. USERS
-- ==========================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('ADMIN', 'SALES_USER')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- 2. CUSTOMERS
-- ==========================================

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    city VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- 3. PRODUCTS
-- ==========================================

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    product_code VARCHAR(50) NOT NULL UNIQUE,
    product_name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(30) NOT NULL,
    base_price NUMERIC(12, 2) NOT NULL
        CHECK (base_price >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- 4. INVENTORY
-- ==========================================

CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL UNIQUE
        REFERENCES products(id),

    physical_quantity INTEGER NOT NULL DEFAULT 0
        CHECK (physical_quantity >= 0),

    reserved_quantity INTEGER NOT NULL DEFAULT 0
        CHECK (reserved_quantity >= 0),

    available_quantity INTEGER
        GENERATED ALWAYS AS
        (physical_quantity - reserved_quantity) STORED,

    CHECK (reserved_quantity <= physical_quantity),

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- 5. ENQUIRIES
-- ==========================================

CREATE TABLE enquiries (
    id SERIAL PRIMARY KEY,
    enquiry_number VARCHAR(50) NOT NULL UNIQUE,

    customer_id INTEGER NOT NULL
        REFERENCES customers(id),

    enquiry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    required_date DATE,

    notes TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'NEW'
        CHECK (status IN ('NEW', 'QUOTED', 'WON', 'LOST')),

    created_by INTEGER
        REFERENCES users(id),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- 6. ENQUIRY ITEMS
-- ==========================================

CREATE TABLE enquiry_items (
    id SERIAL PRIMARY KEY,

    enquiry_id INTEGER NOT NULL
        REFERENCES enquiries(id)
        ON DELETE CASCADE,

    product_id INTEGER NOT NULL
        REFERENCES products(id),

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    UNIQUE (enquiry_id, product_id)
);


-- ==========================================
-- 7. QUOTATIONS
-- ==========================================

CREATE TABLE quotations (
    id SERIAL PRIMARY KEY,

    quotation_number VARCHAR(50) NOT NULL UNIQUE,

    enquiry_id INTEGER NOT NULL
        REFERENCES enquiries(id),

    customer_id INTEGER NOT NULL
        REFERENCES customers(id),

    valid_until DATE,

    grand_total NUMERIC(14, 2) NOT NULL DEFAULT 0
        CHECK (grand_total >= 0),

    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED')),

    created_by INTEGER
        REFERENCES users(id),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- 8. QUOTATION ITEMS
-- ==========================================

CREATE TABLE quotation_items (
    id SERIAL PRIMARY KEY,

    quotation_id INTEGER NOT NULL
        REFERENCES quotations(id)
        ON DELETE CASCADE,

    product_id INTEGER NOT NULL
        REFERENCES products(id),

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    unit_price NUMERIC(12, 2) NOT NULL
        CHECK (unit_price >= 0),

    discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 0
        CHECK (discount_pct >= 0 AND discount_pct <= 100),

    gst_pct NUMERIC(5, 2) NOT NULL DEFAULT 0
        CHECK (gst_pct >= 0 AND gst_pct <= 100),

    line_amount NUMERIC(14, 2) NOT NULL DEFAULT 0
        CHECK (line_amount >= 0),

    UNIQUE (quotation_id, product_id)
);


-- ==========================================
-- 9. SALES ORDERS
-- ==========================================

CREATE TABLE sales_orders (
    id SERIAL PRIMARY KEY,

    order_number VARCHAR(50) NOT NULL UNIQUE,

    quotation_id INTEGER NOT NULL UNIQUE
        REFERENCES quotations(id),

    customer_id INTEGER NOT NULL
        REFERENCES customers(id),

    order_date DATE NOT NULL DEFAULT CURRENT_DATE,

    total_amount NUMERIC(14, 2) NOT NULL
        CHECK (total_amount >= 0),

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (
            status IN (
                'PENDING',
                'CONFIRMED',
                'DISPATCHED',
                'CANCELLED'
            )
        ),

    created_by INTEGER
        REFERENCES users(id),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- 10. SALES ORDER ITEMS
-- ==========================================

CREATE TABLE sales_order_items (
    id SERIAL PRIMARY KEY,

    sales_order_id INTEGER NOT NULL
        REFERENCES sales_orders(id)
        ON DELETE CASCADE,

    product_id INTEGER NOT NULL
        REFERENCES products(id),

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    unit_price NUMERIC(12, 2) NOT NULL
        CHECK (unit_price >= 0),

    line_amount NUMERIC(14, 2) NOT NULL
        CHECK (line_amount >= 0),

    UNIQUE (sales_order_id, product_id)
);


-- ==========================================
-- 11. DISPATCHES
-- ==========================================

CREATE TABLE dispatches (
    id SERIAL PRIMARY KEY,

    dispatch_number VARCHAR(50) NOT NULL UNIQUE,

    sales_order_id INTEGER NOT NULL UNIQUE
        REFERENCES sales_orders(id),

    dispatch_date DATE NOT NULL DEFAULT CURRENT_DATE,

    vehicle_number VARCHAR(50) NOT NULL,

    driver_name VARCHAR(100) NOT NULL,

    created_by INTEGER
        REFERENCES users(id),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- 12. DISPATCH ITEMS
-- ==========================================

CREATE TABLE dispatch_items (
    id SERIAL PRIMARY KEY,

    dispatch_id INTEGER NOT NULL
        REFERENCES dispatches(id)
        ON DELETE CASCADE,

    sales_order_item_id INTEGER NOT NULL
        REFERENCES sales_order_items(id),

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    UNIQUE (dispatch_id, sales_order_item_id)
);


-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX idx_enquiries_customer
    ON enquiries(customer_id);

CREATE INDEX idx_quotations_enquiry
    ON quotations(enquiry_id);

CREATE INDEX idx_sales_orders_customer
    ON sales_orders(customer_id);

CREATE INDEX idx_sales_order_items_order
    ON sales_order_items(sales_order_id);

CREATE INDEX idx_dispatch_items_dispatch
    ON dispatch_items(dispatch_id);