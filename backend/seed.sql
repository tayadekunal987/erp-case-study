-- ==========================================
-- SAMPLE INDUSTRIAL PRODUCTS
-- ==========================================

INSERT INTO products
(product_code, product_name, category, unit, base_price)
VALUES
('IND-001', 'Industrial Product A', 'Mechanical Components', 'Piece', 1200.00),
('IND-002', 'Industrial Product B', 'Mechanical Components', 'Piece', 850.00),
('IND-003', 'Industrial Product C', 'Electrical Equipment', 'Piece', 2400.00),
('IND-004', 'Industrial Product D', 'Electrical Equipment', 'Piece', 1750.00),
('IND-005', 'Industrial Product E', 'Safety Equipment', 'Piece', 650.00),
('IND-006', 'Industrial Product F', 'Industrial Tools', 'Piece', 3200.00);


-- ==========================================
-- SAMPLE INVENTORY
-- ==========================================

INSERT INTO inventory
(product_id, physical_quantity, reserved_quantity)
SELECT id, 200, 20
FROM products
WHERE product_code = 'IND-001';

INSERT INTO inventory
(product_id, physical_quantity, reserved_quantity)
SELECT id, 150, 10
FROM products
WHERE product_code = 'IND-002';

INSERT INTO inventory
(product_id, physical_quantity, reserved_quantity)
SELECT id, 100, 15
FROM products
WHERE product_code = 'IND-003';

INSERT INTO inventory
(product_id, physical_quantity, reserved_quantity)
SELECT id, 250, 30
FROM products
WHERE product_code = 'IND-004';

INSERT INTO inventory
(product_id, physical_quantity, reserved_quantity)
SELECT id, 300, 50
FROM products
WHERE product_code = 'IND-005';

INSERT INTO inventory
(product_id, physical_quantity, reserved_quantity)
SELECT id, 80, 10
FROM products
WHERE product_code = 'IND-006';