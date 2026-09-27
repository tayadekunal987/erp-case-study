const pool = require("../config/db");


// =====================================================
// CREATE QUOTATION
// =====================================================

const createQuotation = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            enquiryId,
            quotationNumber,
            validUntil,
            products
        } = req.body;

        if (
            !enquiryId ||
            !quotationNumber ||
            !validUntil ||
            !products ||
            products.length === 0
        ) {
            return res.status(400).json({
                message:
                    "enquiryId, quotationNumber, validUntil and products are required"
            });
        }

        await client.query("BEGIN");

        const enquiryResult = await client.query(
            `SELECT id, customer_id, status
             FROM enquiries
             WHERE id = $1
             FOR UPDATE`,
            [enquiryId]
        );

        if (enquiryResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Enquiry not found"
            });
        }

        const enquiry = enquiryResult.rows[0];

        if (enquiry.status !== "NEW") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Quotation can only be created for a NEW enquiry"
            });
        }

        const quotationResult = await client.query(
            `INSERT INTO quotations
                (
                    quotation_number,
                    enquiry_id,
                    customer_id,
                    valid_until,
                    status
                )
             VALUES
                ($1, $2, $3, $4, 'DRAFT')
             RETURNING id`,
            [
                quotationNumber,
                enquiryId,
                enquiry.customer_id,
                validUntil
            ]
        );

        const quotationId = quotationResult.rows[0].id;

        let grandTotal = 0;

        for (const item of products) {

            const {
                productId,
                quantity,
                unitPrice,
                discountPercent = 0,
                gstPercent = 18
            } = item;

            if (!productId || !quantity || quantity <= 0) {
                throw new Error("Invalid product or quantity");
            }

            if (
                unitPrice < 0 ||
                discountPercent < 0 ||
                gstPercent < 0
            ) {
                throw new Error(
                    "Invalid price, discount or GST"
                );
            }

            const productResult = await client.query(
                `SELECT id
                 FROM products
                 WHERE id = $1`,
                [productId]
            );

            if (productResult.rows.length === 0) {
                throw new Error(
                    `Product ${productId} not found`
                );
            }

            const amountBeforeDiscount =
                quantity * unitPrice;

            const discountAmount =
                amountBeforeDiscount *
                (discountPercent / 100);

            const amountAfterDiscount =
                amountBeforeDiscount -
                discountAmount;

            const gstAmount =
                amountAfterDiscount *
                (gstPercent / 100);

            const lineAmount =
                amountAfterDiscount +
                gstAmount;

            grandTotal += lineAmount;

            await client.query(
                `INSERT INTO quotation_items
                    (
                        quotation_id,
                        product_id,
                        quantity,
                        unit_price,
                        discount_pct,
                        gst_pct,
                        line_amount
                    )
                 VALUES
                    ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    quotationId,
                    productId,
                    quantity,
                    unitPrice,
                    discountPercent,
                    gstPercent,
                    lineAmount
                ]
            );
        }

        await client.query(
            `UPDATE quotations
             SET grand_total = $1
             WHERE id = $2`,
            [
                grandTotal,
                quotationId
            ]
        );

        await client.query(
            `UPDATE enquiries
             SET status = 'QUOTED'
             WHERE id = $1`,
            [enquiryId]
        );

        await client.query("COMMIT");

        res.status(201).json({
            message: "Quotation created successfully",
            quotationId,
            grandTotal: Number(
                grandTotal.toFixed(2)
            )
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error(error);

        if (error.code === "23505") {
            return res.status(409).json({
                message:
                    "Quotation number already exists"
            });
        }

        res.status(500).json({
            message:
                error.message ||
                "Failed to create quotation"
        });

    } finally {
        client.release();
    }
};


// =====================================================
// UPDATE QUOTATION STATUS
// =====================================================

const updateQuotationStatus = async (req, res) => {

    try {

        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "SENT",
            "ACCEPTED",
            "REJECTED"
        ];

        if (!allowedStatuses.includes(status)) {

            return res.status(400).json({
                message:
                    "Invalid quotation status"
            });

        }

        const result = await pool.query(
            `UPDATE quotations
             SET status = $1
             WHERE id = $2
             RETURNING
                id,
                quotation_number,
                status`,
            [
                status,
                id
            ]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message:
                    "Quotation not found"
            });

        }

        res.json({
            message:
                "Quotation status updated successfully",
            quotation:
                result.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message:
                "Failed to update quotation status"
        });

    }
};


// =====================================================
// GET ALL QUOTATIONS
// =====================================================

const getQuotations = async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                q.id,
                q.quotation_number,
                q.enquiry_id,
                q.customer_id,
                c.company_name,
                q.valid_until,
                q.status,
                q.grand_total,
                q.created_at
            FROM quotations q
            JOIN customers c
                ON q.customer_id = c.id
            ORDER BY q.id DESC
        `);

        res.json({
            quotations: result.rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message:
                "Failed to fetch quotations"
        });

    }
};


module.exports = {
    createQuotation,
    updateQuotationStatus,
    getQuotations
};