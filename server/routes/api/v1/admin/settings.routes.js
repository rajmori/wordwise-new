import express from 'express';
import { checkPermission } from '../../../middleware/rbac.js';
import { logAudit } from '../../../utils/audit.js';

const router = express.Router();

// Memory-backed system configs representing P2 feature flags and tenant parameters
let systemSettings = {
    maintenanceMode: false,
    allowPublicRegistration: true,
    stripeEnabled: true,
    razorpayEnabled: true,
    moodleImportAllowed: true,
    openEdxImportAllowed: true,
    tenants: [
        { id: 'tenant-default', name: 'WordWise Primary SaaS', status: 'active' }
    ]
};

/**
 * GET / - Retrieve all system settings, tenant details, and feature flags
 */
router.get('/', checkPermission('settings:read'), (req, res) => {
    res.json({
        success: true,
        settings: systemSettings
    });
});

/**
 * PUT / - Modify configurations & feature flags (restricted to super_admin or authorized roles)
 */
router.put('/', checkPermission('settings:write'), async (req, res) => {
    const newSettings = req.body;
    
    const oldSettings = { ...systemSettings };
    systemSettings = {
        ...systemSettings,
        ...newSettings,
        // Preserve stable structures unless explicitly customized
        tenants: newSettings.tenants || systemSettings.tenants
    };

    // Log the configuration changes
    await logAudit(
        req.user.id,
        'settings:update',
        'SystemSettings',
        'global',
        {
            correlationId: req.correlationId,
            old: oldSettings,
            new: systemSettings
        }
    );

    res.json({
        success: true,
        message: 'System configurations and feature flags updated successfully',
        settings: systemSettings
    });
});

export default router;
