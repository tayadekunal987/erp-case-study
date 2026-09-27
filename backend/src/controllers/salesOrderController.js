const pool = require("../config/db");


// =====================================================
// CONVERT ACCEPTED QUOTATION TO SALES ORDER
// =====================================================

const convertQuotationToOrder = async (req, res) => {

    const client = await pool.connect();

    try {

        const { quotationId } = req.params;

        await client.query("BEGIN");

        const quotationResult = await client.query(
            `SELECT
                id,
                enquiry_id,
                customer_id,
                status,
                quotation_number,
                grand_total
             FROM quotations
             WHERE id = $1
             FOR UPDATE`,
            [quotationId]
        );

        if (quotationResult.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                message:
                    "Quotation not found"
            });

        }

        const quotation =
            quotationResult.rows[0];

        if (quotation.status !== "ACCEPTED") {

            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "Only accepted quotations can create a sales order"
            });

        }

        // Prevent duplicate order
        const existingOrder = await client.query(
            `SELECT id
             FROM sales_orders
             WHERE quotation_id = $1`,
            [quotationId]
        );

        if (existingOrder.rows.length > 0) {

            await client.query("ROLLBACK");

            return res.status(409).json({
                message:
                    "Sales order already exists for this quotation",
                salesOrderId:
                    existingOrder.rows[0].id
            });

        }

        // Generate sales order number
        const orderNumber = `SO-${quotation.quotation_number.replace(/^QT-/, "")}-${Date.now().toString().slice(-4)}`;

        // Create sales order
        const orderResult = await client.query(
            `INSERT INTO sales_orders
                (
                    order_number,
                    quotation_id,
                    customer_id,
                    order_date,
                    total_amount,
                    status,
                    created_by
                )
             VALUES
                ($1, $2, $3, CURRENT_DATE, $4, 'PENDING', $5)
             RETURNING id, order_number`,
            [
                orderNumber,
                quotationId,
                quotation.customer_id,
                Number(quotation.grand_total) || 0,
                req.user?.userId || null
            ]
        );

        const salesOrderId =
            orderResult.rows[0].id;

        // Get quotation items
        const itemsResult = await client.query(
            `SELECT
                product_id,
                quantity,
                unit_price,
                line_amount
             FROM quotation_items
             WHERE quotation_id = $1`,
            [quotationId]
        );

        for (const item of itemsResult.rows) {
            const lineAmount = item.line_amount !== null && item.line_amount !== undefined
                ? Number(item.line_amount)
                : Number(item.quantity) * Number(item.unit_price);

            await client.query(
                `INSERT INTO sales_order_items
                    (
                        sales_order_id,
                        product_id,
                        quantity,
                        unit_price,
                        line_amount
                    )
                 VALUES
                    ($1, $2, $3, $4, $5)`,
                [
                    salesOrderId,
                    item.product_id,
                    item.quantity,
                    item.unit_price,
                    lineAmount
                ]
            );

        }

        await client.query("COMMIT");

        res.status(201).json({
            message:
                "Sales order created successfully",
            salesOrderId,
            orderNumber
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error(error);

        if (error.code === "23505") {

            return res.status(409).json({
                message:
                    "Sales order already exists for this quotation"
            });

        }

        res.status(500).json({
            message:
                "Failed to create sales order"
        });

    } finally {

        client.release();

    }
};


// =====================================================
// GET SALES ORDERS
// =====================================================

const getSalesOrders = async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                so.id,
                so.order_number,
                so.quotation_id,
                so.customer_id,
                c.company_name,
                so.order_date,
                so.total_amount,
                so.status,
                so.created_at
            FROM sales_orders so
            JOIN customers c
                ON so.customer_id = c.id
            ORDER BY so.id DESC
        `);

        res.json({
            salesOrders: result.rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message:
                "Failed to fetch sales orders"
        });

    }
};


// =====================================================
// GET SALES ORDER BY ID (WITH ITEMS)
// =====================================================

const getSalesOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const orderResult = await pool.query(
            `SELECT
                so.id,
                so.quotation_id,
                so.customer_id,
                c.company_name,
                c.contact_person,
                c.mobile,
                c.email,
                c.city,
                so.status,
                so.created_at
             FROM sales_orders so
             JOIN customers c ON so.customer_id = c.id
             WHERE so.id = $1`,
            [id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                message: "Sales order not found"
            });
        }

        const itemsResult = await pool.query(
            `SELECT
                soi.id,
                soi.product_id,
                soi.quantity,
                soi.unit_price,
                p.product_code,
                p.product_name,
                p.unit
             FROM sales_order_items soi
             JOIN products p ON soi.product_id = p.id
             WHERE soi.sales_order_id = $1`,
            [id]
        );

        res.json({
            salesOrder: orderResult.rows[0],
            items: itemsResult.rows
        });
    } catch (error) {
        console.error("Get sales order by id error:", error);
        res.status(500).json({
            message: "Failed to fetch sales order details"
        });
    }
};


// =====================================================
// CONFIRM SALES ORDER + RESERVE INVENTORY
// =====================================================

const confirmSalesOrder = async (req, res) => {

    const client = await pool.connect();

    try {

        const { id } = req.params;

        await client.query("BEGIN");

        const orderResult = await client.query(
            `SELECT id, status
             FROM sales_orders
             WHERE id = $1
             FOR UPDATE`,
            [id]
        );

        if (orderResult.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                message:
                    "Sales order not found"
            });

        }

        const order = orderResult.rows[0];

        if (order.status !== "PENDING") {

            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "Only PENDING sales orders can be confirmed"
            });

        }

        const itemsResult = await client.query(
            `SELECT
                product_id,
                quantity
             FROM sales_order_items
             WHERE sales_order_id = $1
             ORDER BY product_id
             FOR UPDATE`,
            [id]
        );

        // Lock inventory rows
        for (const item of itemsResult.rows) {

            const inventoryResult =
                await client.query(
                    `SELECT
                        product_id,
                        physical_quantity,
                        reserved_quantity,
                        available_quantity
                     FROM inventory
                     WHERE product_id = $1
                     FOR UPDATE`,
                    [item.product_id]
                );

            if (inventoryResult.rows.length === 0) {

                throw new Error(
                    `Inventory not found for product ${item.product_id}`
                );

            }

            const inventory =
                inventoryResult.rows[0];

            if (
                Number(inventory.available_quantity) <
                Number(item.quantity)
            ) {

                throw new Error(
                    `Insufficient stock for product ${item.product_id}`
                );

            }
        }

        // All inventory is available
        for (const item of itemsResult.rows) {

            await client.query(
                `UPDATE inventory
                 SET reserved_quantity =
                     reserved_quantity + $1
                 WHERE product_id = $2`,
                [
                    item.quantity,
                    item.product_id
                ]
            );

        }

        await client.query(
            `UPDATE sales_orders
             SET status = 'CONFIRMED'
             WHERE id = $1`,
            [id]
        );

        await client.query("COMMIT");

        res.json({
            message:
                "Sales order confirmed and inventory reserved successfully"
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error(error);

        res.status(400).json({
            message:
                error.message ||
                "Failed to confirm sales order"
        });

    } finally {

        client.release();

    }
};


// =====================================================
// CANCEL SALES ORDER
// =====================================================

const cancelSalesOrder = async (req, res) => {

    const client = await pool.connect();

    try {

        const { id } = req.params;

        await client.query("BEGIN");

        const orderResult = await client.query(
            `SELECT id, status
             FROM sales_orders
             WHERE id = $1
             FOR UPDATE`,
            [id]
        );

        if (orderResult.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                message:
                    "Sales order not found"
            });

        }

        const order = orderResult.rows[0];

        if (
            order.status !== "PENDING" &&
            order.status !== "CONFIRMED"
        ) {

            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "This sales order cannot be cancelled"
            });

        }

        // If confirmed, release reservation
        if (order.status === "CONFIRMED") {

            const itemsResult = await client.query(
                `SELECT
                    product_id,
                    quantity
                 FROM sales_order_items
                 WHERE sales_order_id = $1`,
                [id]
            );

            for (const item of itemsResult.rows) {

                await client.query(
                    `UPDATE inventory
                     SET reserved_quantity =
                         reserved_quantity - $1
                     WHERE product_id = $2
                     AND reserved_quantity >= $1`,
                    [
                        item.quantity,
                        item.product_id
                    ]
                );

            }

        }

        await client.query(
            `UPDATE sales_orders
             SET status = 'CANCELLED'
             WHERE id = $1`,
            [id]
        );

        await client.query("COMMIT");

        res.json({
            message:
                "Sales order cancelled successfully"
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error(error);

        res.status(500).json({
            message:
                "Failed to cancel sales order"
        });

    } finally {

        client.release();

    }
};


module.exports = {
    convertQuotationToOrder,
    getSalesOrders,
    getSalesOrderById,
    confirmSalesOrder,
    cancelSalesOrder
};