const pool = require("../config/db");


// =====================================================
// CREATE DISPATCH
// =====================================================

const createDispatch = async (req, res) => {

    const client = await pool.connect();

    try {

        const {
            salesOrderId,
            dispatchNumber,
            dispatchDate,
            vehicleNumber,
            driverName,
            products
        } = req.body;

        if (
            !salesOrderId ||
            !dispatchNumber ||
            !dispatchDate ||
            !products ||
            products.length === 0
        ) {

            return res.status(400).json({
                message:
                    "salesOrderId, dispatchNumber, dispatchDate and products are required"
            });

        }

        await client.query("BEGIN");

        const orderResult = await client.query(
            `SELECT id, status
             FROM sales_orders
             WHERE id = $1
             FOR UPDATE`,
            [salesOrderId]
        );

        if (orderResult.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                message:
                    "Sales order not found"
            });

        }

        const order =
            orderResult.rows[0];

        if (order.status !== "CONFIRMED") {

            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "Only CONFIRMED sales orders can be dispatched"
            });

        }

        // Prevent duplicate dispatch
        const existingDispatch =
            await client.query(
                `SELECT id
                 FROM dispatches
                 WHERE sales_order_id = $1`,
                [salesOrderId]
            );

        if (existingDispatch.rows.length > 0) {

            await client.query("ROLLBACK");

            return res.status(409).json({
                message:
                    "Dispatch already exists for this sales order"
            });

        }

        const dispatchResult =
            await client.query(
                `INSERT INTO dispatches
                    (
                        dispatch_number,
                        sales_order_id,
                        dispatch_date,
                        vehicle_number,
                        driver_name,
                        created_by
                    )
                 VALUES
                    ($1, $2, $3, $4, $5, $6)
                 RETURNING id`,
                [
                    dispatchNumber,
                    salesOrderId,
                    dispatchDate,
                    vehicleNumber,
                    driverName,
                    req.user?.userId || null
                ]
            );

        const dispatchId =
            dispatchResult.rows[0].id;

        for (const item of products) {

            const {
                productId,
                quantity
            } = item;

            if (!productId || !quantity || quantity <= 0) {

                throw new Error(
                    "Invalid dispatch product or quantity"
                );

            }

            // Find matching sales_order_item
            const soItemRes = await client.query(
                `SELECT id
                 FROM sales_order_items
                 WHERE sales_order_id = $1 AND product_id = $2`,
                [salesOrderId, productId]
            );

            if (soItemRes.rows.length === 0) {
                throw new Error(
                    `Product ${productId} is not part of sales order ${salesOrderId}`
                );
            }

            const salesOrderItemId = soItemRes.rows[0].id;

            const inventoryResult =
                await client.query(
                    `SELECT
                        product_id,
                        physical_quantity,
                        reserved_quantity
                     FROM inventory
                     WHERE product_id = $1
                     FOR UPDATE`,
                    [productId]
                );

            if (inventoryResult.rows.length === 0) {

                throw new Error(
                    `Inventory not found for product ${productId}`
                );

            }

            const inventory =
                inventoryResult.rows[0];

            if (
                Number(inventory.reserved_quantity) <
                Number(quantity)
            ) {

                throw new Error(
                    `Cannot dispatch more than reserved quantity for product ${productId}`
                );

            }

            if (
                Number(inventory.physical_quantity) <
                Number(quantity)
            ) {

                throw new Error(
                    `Cannot dispatch more than physical stock for product ${productId}`
                );

            }

            await client.query(
                `INSERT INTO dispatch_items
                    (
                        dispatch_id,
                        sales_order_item_id,
                        quantity
                    )
                 VALUES
                    ($1, $2, $3)`,
                [
                    dispatchId,
                    salesOrderItemId,
                    quantity
                ]
            );

            await client.query(
                `UPDATE inventory
                 SET
                    physical_quantity =
                        physical_quantity - $1,
                    reserved_quantity =
                        reserved_quantity - $1
                 WHERE product_id = $2`,
                [
                    quantity,
                    productId
                ]
            );
        }

        await client.query(
            `UPDATE sales_orders
             SET status = 'DISPATCHED'
             WHERE id = $1`,
            [salesOrderId]
        );

        await client.query("COMMIT");

        res.status(201).json({
            message:
                "Dispatch created successfully",
            dispatchId
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error(error);

        if (error.code === "23505") {

            return res.status(409).json({
                message:
                    "Dispatch number or sales order already exists"
            });

        }

        res.status(400).json({
            message:
                error.message ||
                "Failed to create dispatch"
        });

    } finally {

        client.release();

    }
};


// =====================================================
// GET DISPATCHES
// =====================================================

const getDispatches = async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                d.id,
                d.sales_order_id,
                d.dispatch_number,
                d.dispatch_date,
                d.vehicle_number,
                d.driver_name,
                d.created_at
            FROM dispatches d
            ORDER BY d.id DESC
        `);

        res.json({
            dispatches: result.rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message:
                "Failed to fetch dispatches"
        });

    }
};


module.exports = {
    createDispatch,
    getDispatches
};