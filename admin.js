

// Import required Wix modules
import wixWindow from 'wix-window'; // For window operations
import wixData from 'wix-data'; // For database CRUD operations

// Logo URL configuration
let logo = `https://static.wixstatic.com/media/4a2e79_351f0a60259e4bf8805bb34f2eb943b1~mv2.png`;

// ========================================
// GLOBAL VARIABLES AND STATE MANAGEMENT
// ========================================

// Global variables for better state management
let isInitialized = false; // Prevents multiple initializations

/**
 * Main initialization function - runs when Wix page loads
 * Sets up the assessment management system and message listeners
 */
$w.onReady(() => {
    console.log('🚀 Wix page ready, initializing assessment management system...');

    // Initialize the system once
    initializeManagementSystem();

    /**
     * Message listener for communication with embedded iframe (admin.html)
     * The admin interface sends postMessages to this Wix page
     * This function routes those messages to appropriate database handlers
     */
    $w("#htmlComponent").onMessage((event) => {
        const { action, payload } = event.data;
        console.log('📨 Received action from admin interface:', action, 'with payload:', payload);

        // Handle different actions with error catching
        try {
            /**
             * Action router - handles different types of requests from admin interface
             * Each case corresponds to a specific database operation
             */
            switch (action) {
                // ========================================
                // ASSESSMENT MODULE ACTIONS
                // ========================================

            case 'loadAssessments':
                console.log('🔄 Loading assessments from database...');
                loadAssessments(); // Fetch all assessments and send to admin interface
                break;

            case 'loadMembers':
                console.log('👥 Loading members for assignment...');
                loadMembers(); // Fetch member list for assignment modal
                break;

            case 'loadRisks':
                console.log('🔄 Loading risks from database...');
                loadRisks(); // Fetch all risks and send to admin interface
                break;

            case 'loadAssets':
                console.log('🔄 Loading assets from database...');
                loadAssets(); // Fetch all assets and send to admin interface
                break;

            case 'loadFrameworks':
                console.log('🔄 Loading frameworks from database...');
                loadFrameworks(); // Fetch all frameworks and send to admin interface
                break;

            case 'loadDpias':
                console.log('🔄 Loading DPIAs from database...');
                loadDpias(); // Fetch all DPIAs and send to admin interface
                break;

            case 'loadReports':
                console.log('🔄 Loading reports from database...');
                loadReports(); // Fetch all assessment reports and send to admin interface
                break;



            case 'loadLogo':
                console.log('🎨 Loading logo URL...');
                loadLogo(); // Send logo URL to frontend
                break;

            case 'downloadReport':
                console.log('📥 Downloading report...');
                downloadReport(payload.reportId); // Download specific report
                break;

            case 'saveDraft':
                console.log('💾 Saving draft assessment...');
                saveAssessment(payload, 'draft'); // Save assessment with draft status
                break;

            case 'publishAssessment':
                console.log('🌐 Publishing assessment...');
                if (payload.id) {
                    // Update existing assessment to published status
                    updateAssessmentStatus(payload, 'published');
                } else {
                    // Create new assessment with published status
                    saveAssessment(payload, 'published');
                }
                break;

            case 'updateAssessment':
                console.log('✏️ Updating existing assessment...');
                updateAssessment(payload); // Update assessment data in database
                break;

            case 'assignAssessment':
                console.log('👤 Assigning assessment to users...');
                handleAssignmentAction(payload); // Handle assignment logic
                break;

            case 'deleteAssessment':
                console.log('🗑️ Deleting assessment...');
                deleteAssessment(payload.assessmentId); // Delete assessment from database
                break;

            case 'copyAssessment':
                console.log('📋 Copying assessment...');
                copyAssessment(payload.assessmentId, payload.assessmentData); // Copy assessment to create new draft
                break;

            case 'getAssessmentResults':
                console.log('📊 Getting assessment results...');
                getAssessmentResults(payload.assessmentId); // Get all results for an assessment
                break;

            case 'getAssessmentResultsForSubmission':
                console.log('📊 Getting assessment results for specific submission...');
                getAssessmentResultsForSubmission(payload.submissionId, payload.assessmentId); // Get results for specific submission
                break;

                // ========================================
                // RISK MODULE ACTIONS
                // ========================================

            case 'saveRiskDraft':
                console.log('💾 Saving draft risk...');
                saveRisk(payload, 'draft'); // Save risk with draft status
                break;

            case 'publishRisk':
                console.log('🌐 Publishing risk...');
                saveRisk(payload, 'published'); // Save risk with published status
                break;

            case 'updateRisk':
                console.log('✏️ Updating existing risk...');
                updateRisk(payload); // Update risk data in database
                break;

            case 'assignRisk':
                console.log('👥 Assigning risk...');
                saveRisk(payload, 'assigned'); // Save risk with assigned status
                break;

                // ========================================
                // ASSET MODULE ACTIONS
                // ========================================

            case 'saveAssetDraft':
                console.log('💾 Saving draft asset...');
                saveAsset(payload, 'draft'); // Save asset with draft status
                break;

            case 'publishAsset':
                console.log('🌐 Publishing asset...');
                saveAsset(payload, 'published'); // Save asset with published status
                break;

            case 'updateAsset':
                console.log('✏️ Updating existing asset...');
                updateAsset(payload); // Update asset data in database
                break;

            case 'assignAsset':
                console.log('👥 Assigning asset...');
                saveAsset(payload, 'assigned'); // Save asset with assigned status
                break;

                // ========================================
                // FRAMEWORK MODULE ACTIONS
                // ========================================

            case 'saveFrameworkDraft':
                console.log('💾 Saving draft framework...');
                saveFramework(payload, 'draft'); // Save framework with draft status
                break;

            case 'publishFramework':
                console.log('🌐 Publishing framework...');
                saveFramework(payload, 'published'); // Save framework with published status
                break;

            case 'updateFramework':
                console.log('✏️ Updating existing framework...');
                updateFramework(payload); // Update framework data in database
                break;

            case 'assignFramework':
                console.log('👥 Assigning framework...');
                saveFramework(payload, 'assigned'); // Save framework with assigned status
                break;

                // ========================================
                // DPIA MODULE ACTIONS
                // ========================================

            case 'saveDpiaDraft':
                console.log('💾 Saving draft DPIA...');
                saveDpia(payload, 'draft'); // Save DPIA with draft status
                break;

            case 'publishDpia':
                console.log('🌐 Publishing DPIA...');
                saveDpia(payload, 'published'); // Save DPIA with published status
                break;

            case 'updateDpia':
                console.log('✏️ Updating existing DPIA...');
                updateDpia(payload); // Update DPIA data in database
                break;

            case 'assignDpia':
                console.log('👥 Assigning DPIA...');
                saveDpia(payload, 'assigned'); // Save DPIA with assigned status
                break;

            default:
                console.warn('⚠️ Unknown action:', action);
            }
        } catch (error) {
            console.error('❌ Error handling action:', action, error);
            sendErrorResponse(action, error.message);
        }
    });
});

/**
 * Initialize the complete management system
 * This function loads all data from the database when the page first loads
 * It ensures that all modules (Assessments, Risks, Assets, Frameworks, DPIAs)
 * have their data available immediately when users switch between tabs
 */
function initializeManagementSystem() {
    if (isInitialized) return;

    console.log('🚀 Initializing complete management system...');

    // Load initial data for all modules from database
    loadMembers(); // Load users for assignment modal
    loadAssessments(); // Load assessments module data
    loadRisks(); // Load risks module data
    loadAssets(); // Load assets module data
    loadFrameworks(); // Load frameworks module data
    loadDpias(); // Load DPIAs module data
    loadReports(); // Load reports module data

    isInitialized = true;
    console.log('✅ Complete management system initialized successfully');
    console.log('📊 All modules loaded: Assessments, Risks, Assets, Frameworks, DPIAs, Reports');
}

// Handle assignment actions with better logic
function handleAssignmentAction(payload) {
    if (payload.assessment) {
        // Handle assignment from form (has assessment object)
        const assessmentData = payload.assessment;
        assessmentData.status = 'assigned';
        assessmentData.assignedUsers = payload.assignedUsers || [];
        assessmentData.assignedAt = new Date();

        if (assessmentData.id) {
            updateAssessment(assessmentData);
        } else {
            saveAssessment(assessmentData, 'assigned', payload.assignedUsers);
        }
    } else {
        // Handle direct assignment (payload is the assessment)
        payload.status = 'assigned';
        payload.assignedAt = new Date();
        updateAssessment(payload);
    }
}

// Update assessment status (for publish/assign actions from list)
function updateAssessmentStatus(data, newStatus) {
    console.log(`Updating assessment ${data.id} to status: ${newStatus}`);

    const updateData = {
        _id: data.id,
        status: newStatus,
        publishedAt: newStatus === 'published' ? new Date() : data.publishedAt,
        assignedAt: newStatus === 'assigned' ? new Date() : data.assignedAt,
        assignedUsers: data.assignedUsers || []
    };

    return wixData.update('Assessments', updateData)
        .then((result) => {
            console.log(`✅ Assessment status updated to ${newStatus}:`, result);

            sendSuccessResponse('assessmentUpdated', {
                ...updateData,
                id: result._id,
                updatedAt: result._updatedDate
            });

            loadAssessments();
        })
        .catch((err) => {
            console.error(`❌ Error updating assessment status to ${newStatus}:`, err);
            sendErrorResponse('assessmentUpdated', err.message);
        });
}

async function loadMembers() {
    console.log('📋 Loading all members from database...');

   await wixData.query('Members/PrivateMembersData')
        .limit(1000)
        .find()
        .then(results => {
            console.log(results.items,"all members")
            const members = results.items.map(member => ({
                id: member._id,
                name: `${member.firstName || ''} ${member.lastName || ''}`.trim(),
                email: member.loginEmail || ''
            }));

            $w('#htmlComponent').postMessage({
                action: 'loadMembers',
                payload: members
            });

            console.log('✅ All members loaded and sent to iframe:', members.length);
        })
        .catch(err => {
            console.error('❌ Error loading members:', err);

            $w('#htmlComponent').postMessage({
                action: 'loadMembers',
                payload: []
            });
        });
}

// Load logo URL and send to iframe
function loadLogo() {
    console.log('🎨 Sending logo URL to frontend...');

    const logoData = {
        logoUrl: logo,
        companyName: 'Cyber Wheelhouse',
        tagline: 'Information Security and Data Privacy Specialists'
    };

    $w('#htmlComponent').postMessage({
        action: 'logoLoaded',
        payload: logoData
    });

    console.log('✅ Logo data sent to frontend:', logoData);
}

// Load assessments from database and send to iframe
function loadAssessments() {
    console.log('📊 Loading assessments from database...');

    wixData.query('Assessments')
        .limit(1000)
        .descending('_createdDate') // Show newest first
        .find()
        .then(results => {
            const assessments = results.items.map(item => ({
                id: item._id,
                name: item.title || 'Untitled Assessment',
                description: item.description || 'No description',
                date: item.date,
                status: item.status || 'draft',
                questions: item.questions || [],
                assignedUsers: item.assignedUsers || [],
                createdAt: item._createdDate,
                updatedAt: item._updatedDate,
                publishedAt: item.publishedAt,
                assignedAt: item.assignedAt
            }));

            // Sort assessments by status priority (draft, published, assigned)
            const sortedAssessments = assessments.sort((a, b) => {
                const statusOrder = { 'draft': 1, 'published': 2, 'assigned': 3 };
                return statusOrder[a.status] - statusOrder[b.status];
            });

            $w('#htmlComponent').postMessage({
                action: 'assessmentsLoaded',
                payload: sortedAssessments
            });

            console.log('✅ Assessments loaded and sent to iframe:', sortedAssessments.length);
            console.log('📈 Assessment breakdown:', {
                draft: sortedAssessments.filter(a => a.status === 'draft').length,
                published: sortedAssessments.filter(a => a.status === 'published').length,
                assigned: sortedAssessments.filter(a => a.status === 'assigned').length
            });
        })
        .catch(err => {
            console.error('❌ Error loading assessments:', err);
            $w('#htmlComponent').postMessage({
                action: 'assessmentsLoaded',
                payload: []
            });
        });
}

// ========================================
// LOAD FUNCTIONS FOR ALL MODULES
// ========================================

// Load risks from database and send to iframe
function loadRisks() {
    console.log('📊 Loading risks from database...');

    wixData.query('RisksAdmin')
        .limit(1000)
        .descending('_createdDate') // Show newest first
        .find()
        .then(results => {
            const risks = results.items.map(item => ({
                id: item._id,
                name: item.name || 'Untitled Risk',
                category: item.category || 'Unknown',
                owner: item.owner || 'Unassigned',
                likelihood: item.likelihood || 'Unknown',
                impact: item.impact || 'Unknown',
                riskStatus: item.riskStatus || 'Active',
                level: item.level || 'Unknown',
                description: item.description || 'No description',
                controls: item.controls || '',
                status: item.status || 'draft',
                assignedUsers: item.assignedUsers || [],
                createdAt: item._createdDate,
                updatedAt: item._updatedDate,
                publishedAt: item.publishedAt,
                assignedAt: item.assignedAt
            }));

            $w('#htmlComponent').postMessage({
                action: 'risksLoaded',
                payload: risks
            });

            console.log('✅ Risks loaded and sent to iframe:', risks.length);
            console.log('📋 Risk items:', risks.map(r => ({ id: r.id, name: r.name, status: r.status })));
        })
        .catch(err => {
            console.error('❌ Error loading risks:', err);
            $w('#htmlComponent').postMessage({
                action: 'risksLoaded',
                payload: []
            });
        });
}

// Load assets from database and send to iframe
function loadAssets() {
    console.log('📊 Loading assets from database...');

    wixData.query('AssetsAdmin')
        .limit(1000)
        .descending('_createdDate')
        .find()
        .then(results => {
            const assets = results.items.map(item => ({
                id: item._id,
                name: item.name || 'Untitled Asset',
                type: item.type || 'Unknown',
                owner: item.owner || 'Unassigned',
                location: item.location || 'Unknown',
                criticality: item.criticality || 'Unknown',
                assetStatus: item.assetStatus || 'Active',
                classification: item.classification || 'Internal',
                description: item.description || 'No description',
                purpose: item.purpose || '',
                associatedRisks: item.associatedRisks || [],
                status: item.status || 'draft',
                assignedUsers: item.assignedUsers || [],
                createdAt: item._createdDate,
                updatedAt: item._updatedDate,
                publishedAt: item.publishedAt,
                assignedAt: item.assignedAt
            }));

            $w('#htmlComponent').postMessage({
                action: 'assetsLoaded',
                payload: assets
            });

            console.log('✅ Assets loaded and sent to iframe:', assets.length);
        })
        .catch(err => {
            console.error('❌ Error loading assets:', err);
            $w('#htmlComponent').postMessage({
                action: 'assetsLoaded',
                payload: []
            });
        });
}

// Load frameworks from database and send to iframe
function loadFrameworks() {
    console.log('📊 Loading frameworks from database...');

    wixData.query('FrameworksAdmin')
        .limit(1000)
        .descending('_createdDate')
        .find()
        .then(results => {
            const frameworks = results.items.map(item => ({
                id: item._id,
                name: item.name || 'Untitled Framework',
                description: item.description || 'No description',
                type: item.type || 'Custom',
                version: item.version || '',
                controls: item.controls || [],
                compliance: item.compliance || 0,
                frameworkStatus: item.frameworkStatus || 'Active',
                readiness: item.readiness || 'not-ready',
                status: item.status || 'draft',
                assignedUsers: item.assignedUsers || [],
                activities: item.activities || [],
                createdAt: item._createdDate,
                updatedAt: item._updatedDate,
                publishedAt: item.publishedAt,
                assignedAt: item.assignedAt
            }));

            $w('#htmlComponent').postMessage({
                action: 'frameworksLoaded',
                payload: frameworks
            });

            console.log('✅ Frameworks loaded and sent to iframe:', frameworks.length);
        })
        .catch(err => {
            console.error('❌ Error loading frameworks:', err);
            $w('#htmlComponent').postMessage({
                action: 'frameworksLoaded',
                payload: []
            });
        });
}

// Load DPIAs from database and send to iframe
function loadDpias() {
    console.log('📊 Loading DPIAs from database...');

    wixData.query('DPIAsAdmin')
        .limit(1000)
        .descending('_createdDate')
        .find()
        .then(results => {
            const dpias = results.items.map(item => ({
                id: item._id,
                name: item.name || 'Untitled DPIA',
                department: item.department || 'Unknown',
                date: item.date,
                risk: item.risk || 'Unknown',
                reviewer: item.reviewer || '',
                progress: item.progress || 0,
                activity: item.activity || 'No activity',
                dataCategories: item.dataCategories || 'No categories',
                riskAssessment: item.riskAssessment || 'No assessment',
                status: item.status || 'draft',
                assignedUsers: item.assignedUsers || [],
                createdAt: item._createdDate,
                updatedAt: item._updatedDate,
                publishedAt: item.publishedAt,
                assignedAt: item.assignedAt
            }));

            $w('#htmlComponent').postMessage({
                action: 'dpiasLoaded',
                payload: dpias
            });

            console.log('✅ DPIAs loaded and sent to iframe:', dpias.length);
        })
        .catch(err => {
            console.error('❌ Error loading DPIAs:', err);
            $w('#htmlComponent').postMessage({
                action: 'dpiasLoaded',
                payload: []
            });
        });
}

// Debug function to check submissions
function debugCheckSubmissions() {
    console.log('🔍 DEBUG: Checking all submissions in database...');

    wixData.query('AssessmentSubmissions')
        .find()
        .then(results => {
            console.log(`🔍 Found ${results.items.length} submissions:`);
            results.items.forEach((submission, index) => {
                console.log(`  Submission ${index + 1}:`, {
                    id: submission._id,
                    userId: submission.userId,
                    assessmentId: submission.assessmentId,
                    maturityScore: submission.maturityScore,
                    risksCount: submission.risksIdentified ? submission.risksIdentified.length : 0,
                    createdDate: submission._createdDate
                });
            });
        })
        .catch(err => {
            console.error('❌ Error checking submissions:', err);
        });
}

// Debug function to check reports
function debugCheckReports() {
    console.log('🔍 DEBUG: Checking all reports in database...');

    wixData.query('AssessmentReports')
        .find()
        .then(results => {
            console.log(`🔍 Found ${results.items.length} reports:`);
            results.items.forEach((report, index) => {
                console.log(`  Report ${index + 1}:`, {
                    id: report._id,
                    submissionId: report.submissionId,
                    userId: report.userId,
                    assessmentId: report.assessmentId,
                    overallScore: report.overallScore,
                    risksCount: report.identifiedRisks ? report.identifiedRisks.length : 0,
                    createdDate: report._createdDate
                });
            });
        })
        .catch(err => {
            console.error('❌ Error checking reports:', err);
        });
}

// Load reports from database and send to iframe
function loadReports() {
    console.log('📊 Loading assessment reports from database...');
    debugCheckSubmissions(); // Debug: check submissions
    debugCheckReports(); // Debug: check reports

    // First get all reports
    wixData.query('AssessmentReports')
        .limit(1000)
        .descending('_createdDate')
        .find()
        .then(reportResults => {
            console.log('📊 Found reports:', reportResults.items.length);

            // Get all unique assessment IDs from reports
            const assessmentIds = [...new Set(reportResults.items
                .map(item => item.assessmentId)
                .filter(id => id))];

            console.log('📊 Unique assessment IDs:', assessmentIds);

            // If no assessment IDs, return reports as-is
            if (assessmentIds.length === 0) {
                const reports = reportResults.items.map(item => ({
                    _id: item._id,
                    assessmentId: item.assessmentId,
                    assessmentTitle: item.assessmentTitle || 'Unknown Assessment',
                    userId: item.userId,
                    submissionId: item.submissionId || item.userId,
                    reportContent: item.reportContent,
                    overallScore: item.overallScore || 0,
                    domainScores: item.domainScores || {},
                    identifiedRisks: item.identifiedRisks || [],
                    generatedAt: item.generatedAt || item._createdDate,
                    reportType: item.reportType || 'assessment_completion'
                }));

                // Log each report's data for debugging
                reports.forEach((report, index) => {
                    console.log(`📊 Report ${index + 1}:`, {
                        id: report._id,
                        title: report.assessmentTitle,
                        score: report.overallScore,
                        risks: report.identifiedRisks.length,
                        userId: report.userId,
                        submissionId: report.submissionId
                    });
                });

                $w('#htmlComponent').postMessage({
                    action: 'reportsLoaded',
                    payload: reports
                });
                return;
            }

            // Get assessment details to get proper titles
            wixData.query('Assessments')
                .hasSome('_id', assessmentIds)
                .find()
                .then(assessmentResults => {
                    console.log('📊 Found assessments:', assessmentResults.items.length);

                    // Create a map of assessment ID to title
                    const assessmentTitles = {};
                    assessmentResults.items.forEach(assessment => {
                        assessmentTitles[assessment._id] = assessment.title || assessment.name || 'Untitled Assessment';
                    });

                    console.log('📊 Assessment titles map:', assessmentTitles);

                    // Map reports with proper assessment titles
                    const reports = reportResults.items.map(item => ({
                        _id: item._id,
                        assessmentId: item.assessmentId,
                        assessmentTitle: item.assessmentTitle ||
                                       assessmentTitles[item.assessmentId] ||
                                       'Unknown Assessment',
                        userId: item.userId,
                        submissionId: item.submissionId || item.userId,
                        reportContent: item.reportContent,
                        overallScore: item.overallScore || 0,
                        domainScores: item.domainScores || {},
                        identifiedRisks: item.identifiedRisks || [],
                        generatedAt: item.generatedAt || item._createdDate,
                        reportType: item.reportType || 'assessment_completion'
                    }));

                    // Log each report's data for debugging
                    reports.forEach((report, index) => {
                        console.log(`📊 Report ${index + 1}:`, {
                            id: report._id,
                            title: report.assessmentTitle,
                            score: report.overallScore,
                            risks: report.identifiedRisks.length,
                            userId: report.userId,
                            submissionId: report.submissionId
                        });
                    });

                    $w('#htmlComponent').postMessage({
                        action: 'reportsLoaded',
                        payload: reports
                    });

                    console.log('✅ Reports loaded with assessment titles:', reports.length);
                })
                .catch(assessmentErr => {
                    console.error('❌ Error loading assessment details:', assessmentErr);

                    // Fallback: return reports without proper titles
                    const reports = reportResults.items.map(item => ({
                        _id: item._id,
                        assessmentId: item.assessmentId,
                        assessmentTitle: item.assessmentTitle || 'Unknown Assessment',
                        userId: item.userId,
                        submissionId: item.submissionId || item.userId,
                        reportContent: item.reportContent,
                        overallScore: item.overallScore || 0,
                        domainScores: item.domainScores || {},
                        identifiedRisks: item.identifiedRisks || [],
                        generatedAt: item.generatedAt || item._createdDate,
                        reportType: item.reportType || 'assessment_completion'
                    }));

                    // Log each report's data for debugging
                    reports.forEach((report, index) => {
                        console.log(`📊 Report ${index + 1} (fallback):`, {
                            id: report._id,
                            title: report.assessmentTitle,
                            score: report.overallScore,
                            risks: report.identifiedRisks.length,
                            userId: report.userId,
                            submissionId: report.submissionId
                        });
                    });

                    $w('#htmlComponent').postMessage({
                        action: 'reportsLoaded',
                        payload: reports
                    });
                });
        })
        .catch(err => {
            console.error('❌ Error loading reports:', err);
            $w('#htmlComponent').postMessage({
                action: 'reportsLoaded',
                payload: []
            });
        });
}



// Download specific report
function downloadReport(reportId) {
    console.log('📥 Downloading report:', reportId);

    wixData.get('AssessmentReports', reportId)
        .then(report => {
            // Use hardcoded logo and company settings
            const settings = {
                logoUrl: logo,
                companyName: 'Cyber Wheelhouse',
                tagline: 'Information Security and Data Privacy Specialists'
            };

            // Create beautiful HTML report with logo
            const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Assessment Report - ${report.assessmentTitle || 'N/A'}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            .container {
                border-radius: 10px;
                max-width: 100%;
            }
        }
        .header {
            background: linear-gradient(135deg, #1e4f73 0%, #2c5f8a 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .logo {
            margin-bottom: 30px;
            text-align: center;
        }
        .logo-image {
            max-height: 120px;
            max-width: 300px;
            height: auto;
            width: auto;
            display: block;
            margin: 0 auto;
        }

        /* Mobile header and logo styles */
        @media (max-width: 768px) {
            .header {
                padding: 20px 15px;
            }
            .logo {
                margin-bottom: 20px;
            }
            .logo-image {
                max-height: 80px;
                max-width: 250px;
            }
            .logo-fallback {
                font-size: 20px !important;
            }
            .logo-fallback span {
                font-size: 12px !important;
            }
        }
        .report-title {
            font-size: 28px;
            margin: 0;
            font-weight: 300;
        }
        .content {
            padding: 40px;
        }
        .info-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 30px;
            border-left: 5px solid #1e4f73;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            align-items: center;
        }
        .info-label {
            font-weight: 600;
            color: #1e4f73;
        }
        .info-value {
            color: #555;
        }
        .score {
            background: #28a745;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
        }
        .report-content {
            background: white;
            padding: 30px;
            border-radius: 10px;
            border: 1px solid #e9ecef;
            white-space: pre-wrap;
            line-height: 1.8;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            border-top: 1px solid #e9ecef;
        }

        /* Additional mobile styles */
        @media (max-width: 768px) {
            .report-title {
                font-size: 22px;
            }
            .content {
                padding: 20px 15px;
            }
            .info-section {
                padding: 15px;
                margin-bottom: 20px;
            }
            .info-row {
                flex-direction: column;
                align-items: flex-start;
                gap: 5px;
                margin-bottom: 15px;
            }
            .report-content {
                padding: 20px 15px;
                font-size: 14px;
            }
            .footer {
                padding: 15px;
                font-size: 12px;
            }
        }

        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <img src="${settings.logoUrl}" alt="Cyber Wheelhouse" class="logo-image"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                     onload="this.style.display='block'; this.nextElementSibling.style.display='none';" />
                <div class="logo-fallback" style="display: none; color: white; font-size: 24px; font-weight: bold; margin: 20px 0;">
                    Cyber Wheelhouse<br>
                    <span style="font-size: 14px; font-weight: normal;">Information Security and Data Privacy Specialists</span>
                </div>
            </div>
            <h1 class="report-title">${report.assessmentTitle || 'Assessment Report'}</h1>
        </div>

        <div class="content">
            <div class="info-section">
                <div class="info-row">
                    <span class="info-label">Risks Identified:</span>
                    <span class="info-value">${(report.identifiedRisks && report.identifiedRisks.length) || 0}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Generated:</span>
                    <span class="info-value">${new Date(report.generatedAt).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Overall Score:</span>
                    <span class="score">${report.overallScore}/5</span>
                </div>
            </div>

            <div class="report-content">
${report.reportContent
    .replace(/#{1,6}\s*/g, '') // Remove markdown headers
    .replace(/---+/g, '') // Remove horizontal rules
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Convert **text** to <strong>text</strong>
    .replace(/\*([^*]+)\*/g, '<em>$1</em>') // Convert *text* to <em>text</em>
}
            </div>
        </div>

        <div class="footer">
            <p>Generated by Cyber Wheelhouse</p>
            <p style="font-size: 12px; color: #999;">This report is confidential and intended for authorised personnel only.</p>
        </div>
    </div>
</body>
</html>`;

            // Create a clean filename from the assessment title
            const cleanFilename = (report.assessmentTitle || 'Assessment-Report')
                .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .toLowerCase(); // Convert to lowercase

            // Send HTML report content to frontend for download
            $w('#htmlComponent').postMessage({
                action: 'downloadReportContent',
                payload: {
                    content: htmlContent,
                    filename: `assessment-report-${cleanFilename}.html`
                }
            });

            console.log('✅ HTML Report download content sent to frontend');
        })
        .catch(error => {
            console.error('❌ Error downloading report:', error);
            $w('#htmlComponent').postMessage({
                action: 'downloadReportContent',
                payload: {
                    content: '<html><body><h1>Error: Report not found</h1></body></html>',
                    filename: 'error.html'
                }
            });
        });
}

// Save assessment (create new)
function saveAssessment(data, status, assignedUsers = []) {
    console.log('💾 Saving assessment:', data.name, 'Status:', status, 'Assigned Users:', assignedUsers?.length || 0);

    // Validate assessment data
    const validation = validateAssessmentData(data);
    if (!validation.isValid) {
        console.error('❌ Validation failed:', validation.errors);
        sendErrorResponse('assessmentCreated', validation.errors.join(', '));
        return;
    }

    const assessment = {
        title: data.name.trim(),
        description: data.description.trim(),
        dayOfCompletion: data.dayOfCompletion,
        endDate: data.endDate,
        status: status,
        questions: data.questions || [],
        assignedUsers: status === 'assigned' ? assignedUsers : [],
        publishedAt: status === 'published' ? new Date() : null,
        assignedAt: status === 'assigned' ? new Date() : null
    };

    return wixData.insert('Assessments', assessment)
        .then((result) => {
            console.log(`✅ Assessment saved as "${status}":`, result._id);

            const responsePayload = {
                ...assessment,
                id: result._id,
                createdAt: result._createdDate,
                updatedAt: result._updatedDate
            };

            sendSuccessResponse('assessmentCreated', responsePayload);

            // Reload assessments to refresh the list
            loadAssessments();

            // Log statistics
            getAssessmentStats();
        })
        .catch((err) => {
            console.error('❌ Error saving assessment:', err);
            sendErrorResponse('assessmentCreated', err.message);
        });
}

// Update existing assessment
function updateAssessment(data) {
    console.log('✏️ Updating assessment:', data.name || data.id);

    if (!data.id) {
        console.error('❌ No assessment ID provided for update');
        sendErrorResponse('assessmentUpdated', 'Assessment ID is required for update');
        return;
    }

    // Validate assessment data if it has content fields
    if (data.name || data.description) {
        const validation = validateAssessmentData(data);
        if (!validation.isValid) {
            console.error('❌ Validation failed:', validation.errors);
            sendErrorResponse('assessmentUpdated', validation.errors.join(', '));
            return;
        }
    }

    const updateData = {
        _id: data.id, // Include the ID in the update object
        title: data.name?.trim(),
        description: data.description?.trim(),
        dayOfCompletion: data.dayOfCompletion,
        endDate: data.endDate,
        status: data.status,
        questions: data.questions || [],
        assignedUsers: data.assignedUsers || [],
        publishedAt: data.status === 'published' ? (data.publishedAt || new Date()) : data.publishedAt,
        assignedAt: data.status === 'assigned' ? (data.assignedAt || new Date()) : data.assignedAt
    };

    // Remove undefined fields to avoid overwriting with undefined
    Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
            delete updateData[key];
        }
    });

    return wixData.update('Assessments', updateData)
        .then((result) => {
            console.log('✅ Assessment updated successfully:', result._id);

            const responsePayload = {
                ...updateData,
                id: result._id,
                updatedAt: result._updatedDate
            };

            sendSuccessResponse('assessmentUpdated', responsePayload);

            // Reload assessments to refresh the list
            loadAssessments();

            // Log statistics
            getAssessmentStats();
        })
        .catch((err) => {
            console.error('❌ Error updating assessment:', err);
            sendErrorResponse('assessmentUpdated', err.message);
        });
}

// Delete assessment (optional function for future use)
function deleteAssessment(assessmentId) {
    console.log('Deleting assessment:', assessmentId);

    return wixData.remove('Assessments', assessmentId)
        .then(() => {
            console.log('Assessment deleted successfully');

            // Send success response back to iframe
            $w('#htmlComponent').postMessage({
                action: 'assessmentDeleted',
                success: true,
                payload: { id: assessmentId }
            });

            // Reload assessments to refresh the list
            loadAssessments();
        })
        .catch((err) => {
            console.error('Error deleting assessment:', err);

            // Send error response back to iframe
            $w('#htmlComponent').postMessage({
                action: 'assessmentDeleted',
                success: false,
                error: err.message
            });
        });
}

// Copy assessment to create a new draft
function copyAssessment(assessmentId, assessmentData) {
    console.log('📋 Copying assessment:', assessmentId);
    console.log('📋 Assessment data:', assessmentData);

    if (!assessmentId) {
        console.error('❌ No assessment ID provided for copying');
        sendErrorResponse('assessmentCopied', 'Assessment ID is required');
        return;
    }

    // First, get the full assessment data from the database to ensure we have all fields
    return wixData.get('Assessments', assessmentId)
        .then(originalAssessment => {
            console.log('📋 Retrieved original assessment:', originalAssessment);

            // Create a copy of the assessment with modifications
            const copiedAssessment = {
                title: `${originalAssessment.title || originalAssessment.name || 'Assessment'} - Copy`,
                name: `${originalAssessment.title || originalAssessment.name || 'Assessment'} - Copy`,
                description: originalAssessment.description || '',
                questions: originalAssessment.questions || [],
                status: 'draft', // Always create copies as drafts
                createdBy: originalAssessment.createdBy || 'admin',
                category: originalAssessment.category || 'General',
                estimatedTime: originalAssessment.estimatedTime || 0,
                difficulty: originalAssessment.difficulty || 'Medium',
                tags: originalAssessment.tags || [],
                // Remove user-specific data and IDs
                // Don't copy: _id, _createdDate, _updatedDate, assignedUsers, submissions
            };

            console.log('📋 Prepared copied assessment:', copiedAssessment);

            // Insert the copied assessment as a new record
            return wixData.insert('Assessments', copiedAssessment);
        })
        .then(insertResult => {
            console.log('✅ Assessment copied successfully:', insertResult);

            // Send success response back to iframe
            $w('#htmlComponent').postMessage({
                action: 'assessmentCopied',
                success: true,
                payload: {
                    originalId: assessmentId,
                    newAssessment: insertResult,
                    message: `Assessment copied successfully as "${insertResult.title}"`
                }
            });

            // Reload assessments to refresh the list and show the new copy
            loadAssessments();
        })
        .catch(err => {
            console.error('❌ Error copying assessment:', err);

            // Send error response back to iframe
            $w('#htmlComponent').postMessage({
                action: 'assessmentCopied',
                success: false,
                error: err.message || 'Failed to copy assessment'
            });
        });
}

// Get assessments by status (optional function for specific queries)
function getAssessmentsByStatus(status) {
    console.log('Loading assessments with status:', status);

    return wixData.query('Assessments')
        .eq('status', status)
        .limit(1000)
        .ascending('_createdDate')
        .find()
        .then(results => {
            const assessments = results.items.map(item => ({
                id: item._id,
                name: item.title,
                description: item.description,
                date: item.date,
                status: item.status,
                questions: item.questions || [],
                assignedUsers: item.assignedUsers || [],
                createdAt: item._createdDate,
                updatedAt: item._updatedDate,
                publishedAt: item.publishedAt,
                assignedAt: item.assignedAt
            }));

            $w('#htmlComponent').postMessage({
                action: 'assessmentsByStatusLoaded',
                payload: { status, assessments }
            });

            console.log(`${status} assessments loaded:`, assessments.length);
            return assessments;
        })
        .catch(err => {
            console.error(`Error loading ${status} assessments:`, err);
            $w('#htmlComponent').postMessage({
                action: 'assessmentsByStatusLoaded',
                payload: { status, assessments: [] }
            });
        });
}

// Helper function to send success responses
function sendSuccessResponse(action, payload = null) {
    $w('#htmlComponent').postMessage({
        action: action,
        success: true,
        payload: payload,
        timestamp: new Date().toISOString()
    });
}

// Helper function to send error responses
function sendErrorResponse(action, errorMessage) {
    $w('#htmlComponent').postMessage({
        action: action,
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
    });
}

// Validate assessment data before saving
function validateAssessmentData(data) {
    const errors = [];

    if (!data.name || data.name.trim() === '') {
        errors.push('Assessment name is required');
    }

    if (!data.description || data.description.trim() === '') {
        errors.push('Assessment description is required');
    }

    if (!data.dayOfCompletion) {
        errors.push('Day of Completion is required');
    }

    if (!data.endDate) {
        errors.push('End Date is required');
    }

    // Validate that end date is after day of completion
    if (data.dayOfCompletion && data.endDate) {
        const dayOfCompletion = new Date(data.dayOfCompletion);
        const endDate = new Date(data.endDate);
        if (endDate < dayOfCompletion) {
            errors.push('End Date must be after Day of Completion');
        }
    }

    if (data.questions && data.questions.length === 0) {
        errors.push('At least one question is required');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Get assessment statistics
function getAssessmentStats() {
    return wixData.query('Assessments')
        .find()
        .then(results => {
            const assessments = results.items;
            const stats = {
                total: assessments.length,
                draft: assessments.filter(a => a.status === 'draft').length,
                published: assessments.filter(a => a.status === 'published').length,
                assigned: assessments.filter(a => a.status === 'assigned').length,
                lastUpdated: new Date().toISOString()
            };

            console.log('📊 Assessment Statistics:', stats);
            return stats;
        })
        .catch(err => {
            console.error('❌ Error getting assessment stats:', err);
            return null;
        });
}

// ========================================
// ASSESSMENT RESULTS MANAGEMENT FUNCTIONS
// ========================================



/**
 * Get all results for a specific assessment
 * Called from admin.html when viewing assessment results
 * @param {string} assessmentId - The ID of the assessment to get results for
 */
function getAssessmentResults(assessmentId) {
    console.log('📊 Getting assessment results for:', assessmentId);

    if (!assessmentId) {
        console.error('❌ No assessment ID provided');
        sendErrorResponse('assessmentResultsLoaded', 'Assessment ID is required');
        return;
    }

    // Query all submissions for this assessment
    return wixData.query('AssessmentSubmissions')
        .eq('assessmentId', assessmentId)
        .descending('_createdDate')
        .find()
        .then(results => {
            console.log(`📊 Found ${results.items.length} submissions for assessment ${assessmentId}`);

            if (results.items.length === 0) {
                // No submissions found
                sendSuccessResponse('assessmentResultsLoaded', {
                    assessmentId: assessmentId,
                    responses: []
                });
                return;
            }

            // Get unique user IDs from submissions
            const userIds = [...new Set(results.items.map(submission => submission.userId))];
            console.log('👥 Getting user names for user IDs:', userIds);

            // Query Members/PrivateMembersData collection to get real user names
            const userQueries = userIds.map(userId =>
                wixData.query("Members/PrivateMembersData")
                    .eq("_id", userId)
                    .find()
                    .then(memberResult => ({
                        userId: userId,
                        name: memberResult.items.length > 0 ? memberResult.items[0].name : 'Unknown User'
                    }))
                    .catch(err => {
                        console.warn(`⚠️ Could not get name for user ${userId}:`, err);
                        return { userId: userId, name: 'Unknown User' };
                    })
            );

            // Wait for all user name queries to complete
            return Promise.all(userQueries).then(userNames => {
                // Create user name lookup map
                const userNameMap = {};
                userNames.forEach(user => {
                    userNameMap[user.userId] = user.name;
                });

                console.log('👥 User name mapping:', userNameMap);

                // Get assessment details for context
                return wixData.get('Assessments', assessmentId)
                    .then(assessment => {
                        // Format results for admin interface with real user names
                        const formattedResults = {
                            assessmentId: assessmentId,
                            assessmentTitle: assessment.title || assessment.name || 'Unknown Assessment',
                            description: assessment.description || 'No description available',
                            responses: results.items.map(submission => ({
                                userId: submission.userId,
                                userName: userNameMap[submission.userId] || submission.userName || 'Unknown User',
                                userEmail: submission.userEmail || '',
                                status: submission.status || 'completed',
                                progress: submission.progress || 100,
                                completed: submission.completed || 0,
                                totalQuestions: submission.totalQuestions || 0,
                                submittedAt: submission.submittedAt || submission._createdDate,
                                answers: submission.answers || [],
                                maturityScore: submission.maturityScore || 0,
                                risksIdentified: submission.risksIdentified || [],
                                domainScores: submission.domainScores || {}
                            }))
                        };

                        console.log('✅ Assessment results formatted with real user names:', formattedResults);

                        // Send results to admin interface
                        sendSuccessResponse('assessmentResultsLoaded', formattedResults);
                    })
                    .catch(assessmentErr => {
                        console.warn('⚠️ Could not get assessment details, using submission data only:', assessmentErr);

                        // Fallback: use data from submissions with real user names
                        const firstSubmission = results.items[0];
                        const formattedResults = {
                            assessmentId: assessmentId,
                            assessmentTitle: firstSubmission.assessmentTitle || 'Unknown Assessment',
                            description: 'Assessment details not available',
                            responses: results.items.map(submission => ({
                                userId: submission.userId,
                                userName: userNameMap[submission.userId] || submission.userName || 'Unknown User',
                                userEmail: submission.userEmail || '',
                                status: submission.status || 'completed',
                                progress: submission.progress || 100,
                                completed: submission.completed || 0,
                                totalQuestions: submission.totalQuestions || 0,
                                submittedAt: submission.submittedAt || submission._createdDate,
                                answers: submission.answers || [],
                                maturityScore: submission.maturityScore || 0,
                                risksIdentified: submission.risksIdentified || [],
                                domainScores: submission.domainScores || {}
                            }))
                        };

                        sendSuccessResponse('assessmentResultsLoaded', formattedResults);
                    });
            });
        })
        .catch(err => {
            console.error('❌ Error getting assessment results:', err);
            sendErrorResponse('assessmentResultsLoaded', err.message);
        });
}

/**
 * Get results for a specific submission
 * Called from admin.html when viewing results from a specific report
 * @param {string} submissionId - The ID of the submission to get results for
 * @param {string} assessmentId - The ID of the assessment
 */
function getAssessmentResultsForSubmission(submissionId, assessmentId) {
    console.log('📊 Getting assessment results for specific submission:', submissionId);

    if (!submissionId) {
        console.error('❌ No submission ID provided');
        sendErrorResponse('assessmentResultsLoaded', 'Submission ID is required');
        return;
    }

    // Get the specific submission
    return wixData.get('AssessmentSubmissions', submissionId)
        .then(submission => {
            console.log('📊 Found submission:', submission);

            if (!submission) {
                sendErrorResponse('assessmentResultsLoaded', 'Submission not found');
                return;
            }

            // Get user name
            const userId = submission.userId;
            return wixData.query("Members/PrivateMembersData")
                .eq("_id", userId)
                .find()
                .then(memberResult => {
                    const userName = memberResult.items.length > 0 ? memberResult.items[0].name : 'Unknown User';

                    // Get assessment details
                    return wixData.get('Assessments', assessmentId)
                        .then(assessment => {
                            // Format results for admin interface
                            const formattedResults = {
                                assessmentId: assessmentId,
                                assessmentTitle: assessment.title || assessment.name || 'Unknown Assessment',
                                description: assessment.description || 'No description available',
                                responses: [{
                                    userId: submission.userId,
                                    userName: userName,
                                    userEmail: submission.userEmail || '',
                                    status: submission.status || 'completed',
                                    progress: submission.progress || 100,
                                    completed: submission.completed || 0,
                                    totalQuestions: submission.totalQuestions || 0,
                                    submittedAt: submission.submittedAt || submission._createdDate,
                                    answers: submission.answers || [],
                                    maturityScore: submission.maturityScore || 0,
                                    risksIdentified: submission.risksIdentified || [],
                                    domainScores: submission.domainScores || {}
                                }]
                            };

                            console.log('✅ Assessment results for submission formatted:', formattedResults);
                            sendSuccessResponse('assessmentResultsLoaded', formattedResults);
                        })
                        .catch(assessmentErr => {
                            console.warn('⚠️ Could not get assessment details:', assessmentErr);

                            // Fallback: use submission data
                            const formattedResults = {
                                assessmentId: assessmentId,
                                assessmentTitle: submission.assessmentTitle || 'Unknown Assessment',
                                description: 'Assessment details not available',
                                responses: [{
                                    userId: submission.userId,
                                    userName: userName,
                                    userEmail: submission.userEmail || '',
                                    status: submission.status || 'completed',
                                    progress: submission.progress || 100,
                                    completed: submission.completed || 0,
                                    totalQuestions: submission.totalQuestions || 0,
                                    submittedAt: submission.submittedAt || submission._createdDate,
                                    answers: submission.answers || [],
                                    maturityScore: submission.maturityScore || 0,
                                    risksIdentified: submission.risksIdentified || [],
                                    domainScores: submission.domainScores || {}
                                }]
                            };

                            sendSuccessResponse('assessmentResultsLoaded', formattedResults);
                        });
                })
                .catch(memberErr => {
                    console.warn('⚠️ Could not get user details:', memberErr);

                    // Fallback: use submission data without user name lookup
                    return wixData.get('Assessments', assessmentId)
                        .then(assessment => {
                            const formattedResults = {
                                assessmentId: assessmentId,
                                assessmentTitle: assessment.title || assessment.name || 'Unknown Assessment',
                                description: assessment.description || 'No description available',
                                responses: [{
                                    userId: submission.userId,
                                    userName: submission.userName || 'Unknown User',
                                    userEmail: submission.userEmail || '',
                                    status: submission.status || 'completed',
                                    progress: submission.progress || 100,
                                    completed: submission.completed || 0,
                                    totalQuestions: submission.totalQuestions || 0,
                                    submittedAt: submission.submittedAt || submission._createdDate,
                                    answers: submission.answers || [],
                                    maturityScore: submission.maturityScore || 0,
                                    risksIdentified: submission.risksIdentified || [],
                                    domainScores: submission.domainScores || {}
                                }]
                            };

                            sendSuccessResponse('assessmentResultsLoaded', formattedResults);
                        })
                        .catch(assessmentErr => {
                            const formattedResults = {
                                assessmentId: assessmentId,
                                assessmentTitle: submission.assessmentTitle || 'Unknown Assessment',
                                description: 'Assessment details not available',
                                responses: [{
                                    userId: submission.userId,
                                    userName: submission.userName || 'Unknown User',
                                    userEmail: submission.userEmail || '',
                                    status: submission.status || 'completed',
                                    progress: submission.progress || 100,
                                    completed: submission.completed || 0,
                                    totalQuestions: submission.totalQuestions || 0,
                                    submittedAt: submission.submittedAt || submission._createdDate,
                                    answers: submission.answers || [],
                                    maturityScore: submission.maturityScore || 0,
                                    risksIdentified: submission.risksIdentified || [],
                                    domainScores: submission.domainScores || {}
                                }]
                            };

                            sendSuccessResponse('assessmentResultsLoaded', formattedResults);
                        });
                });
        })
        .catch(err => {
            console.error('❌ Error getting submission:', err);
            sendErrorResponse('assessmentResultsLoaded', err.message);
        });
}

// ========================================
// ASSESSMENT SCORING AND ANALYSIS FUNCTIONS
// ========================================

/**
 * Calculate overall maturity score from assessment answers
 * @param {Array} answers - Array of answer objects from assessment submission
 * @returns {number} Average maturity score (0-5)
 */
function calculateMaturityScore(answers) {
    if (!answers || answers.length === 0) return 0;

    let totalScore = 0;
    let maturityQuestions = 0;

    answers.forEach(answer => {
        const question = answer.question;
        const userAnswer = answer.answer;

        // Check if this is a maturity-type question
        if (question.answerType === 'maturity' && userAnswer !== null && userAnswer !== '') {
            const score = parseInt(userAnswer) || 0;
            totalScore += score;
            maturityQuestions++;
        }
    });

    // Return average maturity score
    return maturityQuestions > 0 ? Math.round((totalScore / maturityQuestions) * 10) / 10 : 0;
}

/**
 * Identify risks from assessment answers
 * @param {Array} answers - Array of answer objects from assessment submission
 * @returns {Array} Array of identified risks
 */
function identifyRisks(answers) {
    if (!answers || answers.length === 0) return [];

    const risks = [];

    answers.forEach((answer, index) => {
        const question = answer.question;
        const userAnswer = answer.answer;

        // Identify risks based on low maturity scores
        if (question.answerType === 'maturity' && userAnswer !== null) {
            const score = parseInt(userAnswer) || 0;
            if (score < 3) { // Scores below 3 are considered risks
                risks.push({
                    questionIndex: index,
                    questionText: question.questionText || question.text,
                    domain: question.domain || 'General',
                    score: score,
                    riskLevel: score <= 1 ? 'High' : 'Medium',
                    recommendation: getMaturityRecommendation(score, question.domain)
                });
            }
        }

        // Identify risks from specific answer patterns
        if (question.answerType === 'yesno' || question.answerType === 'single') {
            const riskAnswers = ['no', 'never', 'none', 'not implemented', 'not in place'];
            if (riskAnswers.some(riskAnswer =>
                String(userAnswer).toLowerCase().includes(riskAnswer.toLowerCase()))) {
                risks.push({
                    questionIndex: index,
                    questionText: question.questionText || question.text,
                    domain: question.domain || 'General',
                    answer: userAnswer,
                    riskLevel: 'Medium',
                    recommendation: 'Consider implementing appropriate controls for this area'
                });
            }
        }
    });

    return risks;
}

/**
 * Calculate domain-specific scores
 * @param {Array} answers - Array of answer objects from assessment submission
 * @returns {Object} Object with domain scores
 */
function calculateDomainScores(answers) {
    if (!answers || answers.length === 0) return {};

    const domainScores = {};
    const domainCounts = {};

    answers.forEach(answer => {
        const question = answer.question;
        const userAnswer = answer.answer;
        const domain = question.domain || 'General';

        // Initialize domain if not exists
        if (!domainScores[domain]) {
            domainScores[domain] = 0;
            domainCounts[domain] = 0;
        }

        // Calculate score based on answer type
        if (question.answerType === 'maturity' && userAnswer !== null) {
            const score = parseInt(userAnswer) || 0;
            domainScores[domain] += score;
            domainCounts[domain]++;
        } else if (question.answerType === 'yesno' && userAnswer !== null) {
            // Convert yes/no to score (Yes = 5, No = 0)
            const score = String(userAnswer).toLowerCase() === 'yes' ? 5 : 0;
            domainScores[domain] += score;
            domainCounts[domain]++;
        }
    });

    // Calculate averages
    Object.keys(domainScores).forEach(domain => {
        if (domainCounts[domain] > 0) {
            domainScores[domain] = Math.round((domainScores[domain] / domainCounts[domain]) * 10) / 10;
        }
    });

    return domainScores;
}

/**
 * Get maturity recommendation based on score and domain
 * @param {number} score - Maturity score (0-5)
 * @param {string} domain - Question domain
 * @returns {string} Recommendation text
 */
function getMaturityRecommendation(score, domain) {
    const recommendations = {
        0: 'Immediate action required - establish basic controls',
        1: 'Develop formal policies and procedures',
        2: 'Implement and document processes consistently'
    };

    const domainSpecific = {
        'Data Governance': {
            0: 'Establish data governance framework and assign data owners',
            1: 'Develop data classification and handling procedures',
            2: 'Implement data quality monitoring and controls'
        },
        'Security': {
            0: 'Implement basic security controls and access management',
            1: 'Develop security policies and incident response procedures',
            2: 'Establish security monitoring and regular assessments'
        },
        'Privacy': {
            0: 'Establish privacy program and conduct data mapping',
            1: 'Implement privacy by design and consent management',
            2: 'Develop privacy impact assessments and breach procedures'
        }
    };

    return domainSpecific[domain]?.[score] || recommendations[score] || 'Continue monitoring and improvement';
}

/**
 * Generate assessment report (optional enhancement)
 * @param {string} submissionId - ID of the submission record
 * @param {Object} submissionData - The submission data
 */
function generateAssessmentReport(submissionId, submissionData) {
    console.log('📄 Generating assessment report for submission:', submissionId);

    // This is a placeholder for report generation
    // In a full implementation, this would create a detailed report
    // and save it to the AssessmentReports collection

    const reportContent = `
Assessment Report
================

Assessment: ${submissionData.assessmentTitle}
User: ${submissionData.userName}
Completed: ${new Date(submissionData.submittedAt).toLocaleDateString()}

Overall Maturity Score: ${submissionData.maturityScore}/5
Risks Identified: ${submissionData.risksIdentified.length}

Domain Scores:
${Object.entries(submissionData.domainScores).map(([domain, score]) =>
    `- ${domain}: ${score}/5`).join('\n')}

Identified Risks:
${submissionData.risksIdentified.map((risk, index) =>
    `${index + 1}. ${risk.questionText} (${risk.riskLevel} Risk)`).join('\n')}
    `;

    // Save report to database (optional)
    const reportRecord = {
        submissionId: submissionId,
        assessmentId: submissionData.assessmentId,
        assessmentTitle: submissionData.assessmentTitle,
        userId: submissionData.userId,
        reportContent: reportContent,
        overallScore: submissionData.maturityScore,
        domainScores: submissionData.domainScores,
        identifiedRisks: submissionData.risksIdentified,
        generatedAt: new Date().toISOString(),
        reportType: 'assessment_completion'
    };

    return wixData.insert('AssessmentReports', reportRecord)
        .then(result => {
            console.log('✅ Assessment report generated:', result._id);
        })
        .catch(err => {
            console.warn('⚠️ Could not save assessment report:', err);
        });
}

// ========================================
// RISK MANAGEMENT DATABASE FUNCTIONS
// ========================================

/**
 * Saves a risk to the Wix database
 * @param {Object} data - Risk data from admin interface
 * @param {string} status - Status of the risk ('draft', 'published', 'assigned')
 */
function saveRisk(data, status) {
    console.log('💾 Saving risk to database:', data.name, 'Status:', status);

    // Prepare risk object for database insertion
    const risk = {
        name: data.name.trim(), // Risk name (required)
        category: data.category, // Risk category (Operational, Financial, etc.)
        owner: data.owner.trim(), // Person responsible for the risk
        likelihood: data.likelihood, // Probability of occurrence
        impact: data.impact, // Severity of impact
        riskStatus: data.status || 'Active', // Risk status (Active, Mitigated, etc.)
        level: data.level, // Calculated risk level
        description: data.description.trim(), // Detailed description
        controls: data.controls || '', // Existing control measures
        status: status, // Current workflow status (draft, published, assigned)
        assignedUsers: status === 'assigned' ? data.assignedUsers || [] : [], // Users assigned (if applicable)
        publishedAt: status === 'published' ? new Date() : null, // Timestamp when published
        assignedAt: status === 'assigned' ? new Date() : null // Timestamp when assigned
    };

    // Insert into Wix database
    return wixData.insert('RisksAdmin', risk)
        .then((result) => {
            console.log(`✅ Risk saved successfully as "${status}":`, result._id);

            // Prepare response payload with database-generated fields
            const responsePayload = {
                ...risk,
                id: result._id, // Database-generated ID
                createdAt: result._createdDate, // Database-generated creation timestamp
                updatedAt: result._updatedDate // Database-generated update timestamp
            };

            // Send success response back to admin interface
            sendSuccessResponse('riskCreated', responsePayload);

            // Reload risks to refresh the list
            loadRisks();
        })
        .catch((err) => {
            console.error('❌ Error saving risk to database:', err);
            // Send error response back to admin interface
            sendErrorResponse('riskCreated', err.message);
        });
}

// Update existing risk in database
function updateRisk(data) {
    console.log('✏️ Updating risk in database:', data.name, 'ID:', data.id);

    const updateData = {
        _id: data.id,
        name: data.name?.trim(),
        category: data.category,
        owner: data.owner?.trim(),
        likelihood: data.likelihood,
        impact: data.impact,
        riskStatus: data.riskStatus || data.status,
        level: data.level,
        description: data.description?.trim(),
        controls: data.controls || '',
        status: data.workflowStatus || data.status,
        assignedUsers: data.assignedUsers || [],
        publishedAt: data.status === 'published' ? (data.publishedAt || new Date()) : data.publishedAt,
        assignedAt: data.status === 'assigned' ? (data.assignedAt || new Date()) : data.assignedAt
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
            delete updateData[key];
        }
    });

    return wixData.update('RisksAdmin', updateData)
        .then((result) => {
            console.log('✅ Risk updated successfully:', result._id);

            const responsePayload = {
                ...updateData,
                id: result._id,
                updatedAt: result._updatedDate
            };

            sendSuccessResponse('riskUpdated', responsePayload);
            loadRisks();
        })
        .catch((err) => {
            console.error('❌ Error updating risk:', err);
            sendErrorResponse('riskUpdated', err.message);
        });
}

// ASSET MANAGEMENT FUNCTIONS
function saveAsset(data, status) {
    console.log('💾 Saving asset:', data.name, 'Status:', status);

    const asset = {
        name: data.name.trim(),
        type: data.type,
        owner: data.owner.trim(),
        location: data.location.trim(),
        criticality: data.criticality,
        assetStatus: data.status || 'Active',
        classification: data.classification,
        description: data.description.trim(),
        purpose: data.purpose || '',
        associatedRisks: data.associatedRisks || [],
        status: status,
        assignedUsers: status === 'assigned' ? data.assignedUsers || [] : [],
        publishedAt: status === 'published' ? new Date() : null,
        assignedAt: status === 'assigned' ? new Date() : null
    };

    return wixData.insert('AssetsAdmin', asset)
        .then((result) => {
            console.log(`✅ Asset saved as "${status}":`, result._id);

            const responsePayload = {
                ...asset,
                id: result._id,
                createdAt: result._createdDate,
                updatedAt: result._updatedDate
            };

            sendSuccessResponse('assetCreated', responsePayload);

            // Reload assets to refresh the list
            loadAssets();
        })
        .catch((err) => {
            console.error('❌ Error saving asset:', err);
            sendErrorResponse('assetCreated', err.message);
        });
}

// Update existing asset in database
function updateAsset(data) {
    console.log('✏️ Updating asset in database:', data.name, 'ID:', data.id);

    const updateData = {
        _id: data.id,
        name: data.name?.trim(),
        type: data.type,
        owner: data.owner?.trim(),
        location: data.location?.trim(),
        criticality: data.criticality,
        assetStatus: data.assetStatus || data.status,
        classification: data.classification,
        description: data.description?.trim(),
        purpose: data.purpose || '',
        associatedRisks: data.associatedRisks || [],
        status: data.workflowStatus || data.status,
        assignedUsers: data.assignedUsers || [],
        publishedAt: data.status === 'published' ? (data.publishedAt || new Date()) : data.publishedAt,
        assignedAt: data.status === 'assigned' ? (data.assignedAt || new Date()) : data.assignedAt
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
            delete updateData[key];
        }
    });

    return wixData.update('AssetsAdmin', updateData)
        .then((result) => {
            console.log('✅ Asset updated successfully:', result._id);

            const responsePayload = {
                ...updateData,
                id: result._id,
                updatedAt: result._updatedDate
            };

            sendSuccessResponse('assetUpdated', responsePayload);
            loadAssets();
        })
        .catch((err) => {
            console.error('❌ Error updating asset:', err);
            sendErrorResponse('assetUpdated', err.message);
        });
}

// FRAMEWORK MANAGEMENT FUNCTIONS
function saveFramework(data, status) {
    console.log('💾 Saving framework:', data.name, 'Status:', status);

    const framework = {
        name: data.name.trim(),
        description: data.description.trim(),
        type: data.type,
        version: data.version || '',
        controls: data.controls,
        compliance: data.compliance || 0,
        frameworkStatus: data.status || 'Active',
        readiness: data.readiness,
        status: status,
        assignedUsers: status === 'assigned' ? data.assignedUsers || [] : [],
        publishedAt: status === 'published' ? new Date() : null,
        assignedAt: status === 'assigned' ? new Date() : null
    };

    return wixData.insert('FrameworksAdmin', framework)
        .then((result) => {
            console.log(`✅ Framework saved as "${status}":`, result._id);

            const responsePayload = {
                ...framework,
                id: result._id,
                createdAt: result._createdDate,
                updatedAt: result._updatedDate
            };

            sendSuccessResponse('frameworkCreated', responsePayload);

            // Reload frameworks to refresh the list
            loadFrameworks();
        })
        .catch((err) => {
            console.error('❌ Error saving framework:', err);
            sendErrorResponse('frameworkCreated', err.message);
        });
}

// Update existing framework in database
function updateFramework(data) {
    console.log('✏️ Updating framework in database:', data.name, 'ID:', data.id);

    const updateData = {
        _id: data.id,
        name: data.name?.trim(),
        description: data.description?.trim(),
        type: data.type,
        version: data.version,
        controls: data.controls,
        compliance: data.compliance || 0,
        frameworkStatus: data.frameworkStatus || data.status,
        readiness: data.readiness,
        status: data.workflowStatus || data.status,
        assignedUsers: data.assignedUsers || [],
        publishedAt: data.status === 'published' ? (data.publishedAt || new Date()) : data.publishedAt,
        assignedAt: data.status === 'assigned' ? (data.assignedAt || new Date()) : data.assignedAt
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
            delete updateData[key];
        }
    });

    return wixData.update('FrameworksAdmin', updateData)
        .then((result) => {
            console.log('✅ Framework updated successfully:', result._id);

            const responsePayload = {
                ...updateData,
                id: result._id,
                updatedAt: result._updatedDate
            };

            sendSuccessResponse('frameworkUpdated', responsePayload);
            loadFrameworks();
        })
        .catch((err) => {
            console.error('❌ Error updating framework:', err);
            sendErrorResponse('frameworkUpdated', err.message);
        });
}

// DPIA MANAGEMENT FUNCTIONS
function saveDpia(data, status) {
    console.log('💾 Saving DPIA:', data.name, 'Status:', status);

    const dpia = {
        name: data.name.trim(),
        department: data.department.trim(),
        date: data.date,
        risk: data.risk,
        reviewer: data.reviewer || '',
        progress: data.progress || 0,
        activity: data.activity.trim(),
        dataCategories: data.dataCategories.trim(),
        riskAssessment: data.riskAssessment.trim(),
        status: status,
        assignedUsers: status === 'assigned' ? data.assignedUsers || [] : [],
        publishedAt: status === 'published' ? new Date() : null,
        assignedAt: status === 'assigned' ? new Date() : null
    };

    return wixData.insert('DPIAsAdmin', dpia)
        .then((result) => {
            console.log(`✅ DPIA saved as "${status}":`, result._id);

            const responsePayload = {
                ...dpia,
                id: result._id,
                createdAt: result._createdDate,
                updatedAt: result._updatedDate
            };

            sendSuccessResponse('dpiaCreated', responsePayload);

            // Reload DPIAs to refresh the list
            loadDpias();
        })
        .catch((err) => {
            console.error('❌ Error saving DPIA:', err);
            sendErrorResponse('dpiaCreated', err.message);
        });
}

// Update existing DPIA in database
function updateDpia(data) {
    console.log('✏️ Updating DPIA in database:', data.name, 'ID:', data.id);

    const updateData = {
        _id: data.id,
        name: data.name?.trim(),
        department: data.department?.trim(),
        date: data.date,
        risk: data.risk,
        reviewer: data.reviewer || '',
        progress: data.progress || 0,
        activity: data.activity?.trim(),
        dataCategories: data.dataCategories?.trim(),
        riskAssessment: data.riskAssessment?.trim(),
        status: data.status,
        assignedUsers: data.assignedUsers || [],
        publishedAt: data.status === 'published' ? (data.publishedAt || new Date()) : data.publishedAt,
        assignedAt: data.status === 'assigned' ? (data.assignedAt || new Date()) : data.assignedAt
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
            delete updateData[key];
        }
    });

    return wixData.update('DPIAsAdmin', updateData)
        .then((result) => {
            console.log('✅ DPIA updated successfully:', result._id);

            const responsePayload = {
                ...updateData,
                id: result._id,
                updatedAt: result._updatedDate
            };

            sendSuccessResponse('dpiaUpdated', responsePayload);
            loadDpias();
        })
        .catch((err) => {
            console.error('❌ Error updating DPIA:', err);
            sendErrorResponse('dpiaUpdated', err.message);
        });
}
