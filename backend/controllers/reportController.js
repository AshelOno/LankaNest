const ListingReport = require("../models/ListingReport");
const User = require("../models/User"); // Add User model to get reporter info
const Listing = require("../models/Listing"); // Add Listing model to get listing info
const { sendReportEmail } = require("../services/emailService");

exports.addReport = async (req, res) => {
    try {
        const { listingId, type, description } = req.body;
        const reporterId = req.userId;

        // Validate request body
        if (!reporterId || !listingId || !type || !description) {
            return res.status(400).json({ message: "userId, listingId, type, and description are required." });
        }

        const newReport = new ListingReport({
            reporterId,
            listingId,
            type,
            description,
        });
        await newReport.save();

        // Get reporter and listing information for the email
        const [reporter, listing] = await Promise.all([
            User.findById(reporterId).select('name email'),
            Listing.findById(listingId).select('propertyName')
        ]);

        // Send email notification
        if (reporter && listing) {
            await sendReportEmail(
                reporter.name || 'User',
                reporter.email,
                listing.propertyName || 'Unknown Listing',
                type,
                description
            );
        }

        res.status(201).json({
            success: true,
            message: "Report added successfully.",
            report: newReport,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while adding the report.",
            error: error.message
        });
    }
}

exports.getReport = async (req, res) => {
    try {
        // Fetch reports for the listing
        const reports = await ListingReport.find({})
            .populate("reporterId", "name email") // Populate reporter details
            .populate("listingId", "propertyName description") // Populate listing details
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Reports fetched successfully.",
            reports: reports,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching reports.",
            error: error.message
        });
    }
}

exports.resolveReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { action, adminNotes } = req.body;

        const report = await ListingReport.findById(reportId);
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found." });
        }

        if (action === 'flag') {
            report.status = 'resolved';
            // Flag the associated listing
            await Listing.findByIdAndUpdate(report.listingId, { isFlagged: true });
        } else if (action === 'dismiss') {
            report.status = 'dismissed';
        } else if (action === 'investigate') {
            report.status = 'investigating';
        }

        if (adminNotes) {
            report.adminNotes = adminNotes;
        }

        report.resolvedAt = Date.now();
        await report.save();

        res.status(200).json({
            success: true,
            message: `Report ${action}ed successfully.`,
            report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while resolving the report.",
            error: error.message
        });
    }
}
