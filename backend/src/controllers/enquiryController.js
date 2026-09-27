const pool = require("../config/db");

const createEnquiry = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            companyName,
            contactPerson,
            mobile,
            email,
            city,
            enquiryNumber,
            enquiryDate,
            requiredDate,
            products,
            notes
        } = req.body;

        // Basic validation
        if (
            !companyName ||
            !contactPerson ||
            !mobile ||
            !enquiryNumber ||
            !products ||
            products.length === 0
        ) {
            return res.status(400).json({
                message: "Required enquiry details are missing"
            });
        }

        await client.query("BEGIN");

        // Create customer
        const customerResult = await client.query(
            `INSERT INTO customers
            (company_name, contact_person, mobile, email, city)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id`,
            [
                companyName,
                contactPerson,
                mobile,
                email || null,
                city || null
            ]
        );

        const customerId = customerResult.rows[0].id;

        // Create enquiry
        const enquiryResult = await client.query(
            `INSERT INTO enquiries
            (
                enquiry_number,
                customer_id,
                enquiry_date,
                required_date,
                notes,
                status,
                created_by
            )
            VALUES ($1, $2, $3, $4, $5, 'NEW', $6)
            RETURNING *`,
            [
                enquiryNumber,
                customerId,
                enquiryDate || new Date(),
                requiredDate || null,
                notes || null,
                req.user.userId
            ]
        );

        const enquiry = enquiryResult.rows[0];

        // Add enquiry products
        for (const item of products) {
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                throw new Error("Invalid product or quantity");
            }

            await client.query(
                `INSERT INTO enquiry_items
                (enquiry_id, product_id, quantity)
                VALUES ($1, $2, $3)`,
                [
                    enquiry.id,
                    item.productId,
                    item.quantity
                ]
            );
        }

        await client.query("COMMIT");

        res.status(201).json({
            message: "Enquiry created successfully",
            enquiryId: enquiry.id,
            enquiryNumber: enquiry.enquiry_number
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Create enquiry error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "Enquiry number already exists"
            });
        }

        res.status(500).json({
            message: "Failed to create enquiry"
        });

    } finally {
        client.release();
    }
};


const getEnquiries = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                e.id,
                e.enquiry_number,
                e.enquiry_date,
                e.required_date,
                e.status,
                e.notes,
                c.company_name,
                c.contact_person,
                c.mobile,
                c.email,
                c.city
            FROM enquiries e
            JOIN customers c
                ON e.customer_id = c.id
            ORDER BY e.created_at DESC`
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Get enquiries error:", error);

        res.status(500).json({
            message: "Failed to fetch enquiries"
        });
    }
};


const getEnquiryById = async (req, res) => {
    try {
        const { id } = req.params;

        const enquiryResult = await pool.query(
            `SELECT
                e.*,
                c.company_name,
                c.contact_person,
                c.mobile,
                c.email,
                c.city
            FROM enquiries e
            JOIN customers c
                ON e.customer_id = c.id
            WHERE e.id = $1`,
            [id]
        );

        if (enquiryResult.rows.length === 0) {
            return res.status(404).json({
                message: "Enquiry not found"
            });
        }

        const itemsResult = await pool.query(
            `SELECT
                ei.id,
                ei.product_id,
                p.product_code,
                p.product_name,
                ei.quantity
            FROM enquiry_items ei
            JOIN products p
                ON ei.product_id = p.id
            WHERE ei.enquiry_id = $1`,
            [id]
        );

        res.json({
            enquiry: enquiryResult.rows[0],
            products: itemsResult.rows
        });

    } catch (error) {
        console.error("Get enquiry error:", error);

        res.status(500).json({
            message: "Failed to fetch enquiry"
        });
    }
};


module.exports = {
    createEnquiry,
    getEnquiries,
    getEnquiryById
};
