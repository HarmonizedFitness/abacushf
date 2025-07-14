"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var environment_1 = require("../lib/environment");
var prisma = new client_1.PrismaClient();
/**
 * Comprehensive production setup and validation script
 */
function setupProduction() {
    return __awaiter(this, void 0, void 0, function () {
        var isProduction, allChecks, checks, demoUsers, adminUsers, exerciseCount, configCount, businessHours, dataStats_1, maxProductionData, dataClean_1, requiredEnvVars, missingEnvVars, testAdmin, error_1, error_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('🚀 Production Setup and Validation Script');
                    console.log('='.repeat(60));
                    isProduction = environment_1.Environment.isProduction();
                    console.log("Environment: ".concat(environment_1.Environment.getEnvironment()));
                    console.log("Production Mode: ".concat(isProduction ? 'YES' : 'NO'));
                    console.log('');
                    allChecks = true;
                    checks = [];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 18, , 19]);
                    // 1. Database Connection Test
                    console.log('🔌 Testing database connection...');
                    return [4 /*yield*/, prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT 1"], ["SELECT 1"])))];
                case 2:
                    _b.sent();
                    checks.push({ name: 'Database Connection', status: '✅ PASS' });
                    console.log('✅ Database connection successful');
                    // 2. Check for Demo Data
                    console.log('\n🧹 Checking for demo data...');
                    return [4 /*yield*/, prisma.user.findMany({
                            where: {
                                OR: [
                                    { email: { contains: 'alice@fitness.com' } },
                                    { email: { contains: 'bob@fitness.com' } },
                                    { email: { contains: 'carol@fitness.com' } }
                                ]
                            }
                        })];
                case 3:
                    demoUsers = _b.sent();
                    if (demoUsers.length === 0) {
                        checks.push({ name: 'Demo Data Cleanup', status: '✅ PASS - No demo users found' });
                        console.log('✅ No demo users found');
                    }
                    else {
                        checks.push({ name: 'Demo Data Cleanup', status: '❌ FAIL - Demo users still exist' });
                        console.log('❌ Demo users still exist:', demoUsers.map(function (u) { return u.email; }));
                        allChecks = false;
                    }
                    // 3. Essential Admin Account Check
                    console.log('\n👤 Checking admin accounts...');
                    return [4 /*yield*/, prisma.user.findMany({
                            where: { role: 'ADMIN' },
                            select: { email: true, name: true, isActive: true }
                        })];
                case 4:
                    adminUsers = _b.sent();
                    if (adminUsers.length > 0) {
                        checks.push({ name: 'Admin Accounts', status: "\u2705 PASS - ".concat(adminUsers.length, " admin(s) found") });
                        console.log('✅ Admin accounts found:');
                        adminUsers.forEach(function (admin) {
                            console.log("  - ".concat(admin.email, " (").concat(admin.name, ") - Active: ").concat(admin.isActive));
                        });
                    }
                    else {
                        checks.push({ name: 'Admin Accounts', status: '❌ FAIL - No admin accounts found' });
                        console.log('❌ No admin accounts found!');
                        allChecks = false;
                    }
                    // 4. Essential Exercise Library Check
                    console.log('\n💪 Checking exercise library...');
                    return [4 /*yield*/, prisma.exercise.count({ where: { isActive: true } })];
                case 5:
                    exerciseCount = _b.sent();
                    if (exerciseCount >= 5) {
                        checks.push({ name: 'Exercise Library', status: "\u2705 PASS - ".concat(exerciseCount, " exercises available") });
                        console.log("\u2705 Exercise library has ".concat(exerciseCount, " exercises"));
                    }
                    else {
                        checks.push({ name: 'Exercise Library', status: "\u274C FAIL - Only ".concat(exerciseCount, " exercises") });
                        console.log("\u274C Insufficient exercises: ".concat(exerciseCount));
                        allChecks = false;
                    }
                    // 5. Business Configuration Check
                    console.log('\n⚙️  Checking business configuration...');
                    return [4 /*yield*/, prisma.businessConfig.count()];
                case 6:
                    configCount = _b.sent();
                    return [4 /*yield*/, prisma.businessConfig.findMany({
                            where: { category: 'business_hours' }
                        })];
                case 7:
                    businessHours = _b.sent();
                    if (configCount >= 10 && businessHours.length >= 7) {
                        checks.push({ name: 'Business Configuration', status: "\u2705 PASS - ".concat(configCount, " configs, ").concat(businessHours.length, " business hours") });
                        console.log("\u2705 Business configuration complete: ".concat(configCount, " configs"));
                    }
                    else {
                        checks.push({ name: 'Business Configuration', status: "\u274C FAIL - Incomplete configuration" });
                        console.log("\u274C Incomplete business configuration");
                        allChecks = false;
                    }
                    // 6. Clean Data State Check
                    console.log('\n📊 Checking data state...');
                    _a = {};
                    return [4 /*yield*/, prisma.user.count()];
                case 8:
                    _a.users = _b.sent();
                    return [4 /*yield*/, prisma.booking.count()];
                case 9:
                    _a.bookings = _b.sent();
                    return [4 /*yield*/, prisma.workoutSession.count()];
                case 10:
                    _a.workoutSessions = _b.sent();
                    return [4 /*yield*/, prisma.creditPurchase.count()];
                case 11:
                    _a.creditPurchases = _b.sent();
                    return [4 /*yield*/, prisma.personalRecord.count()];
                case 12:
                    _a.personalRecords = _b.sent();
                    return [4 /*yield*/, prisma.notification.count()];
                case 13:
                    dataStats_1 = (_a.notifications = _b.sent(),
                        _a);
                    console.log('Current data state:');
                    Object.entries(dataStats_1).forEach(function (_a) {
                        var key = _a[0], count = _a[1];
                        console.log("  - ".concat(key, ": ").concat(count));
                    });
                    maxProductionData = {
                        users: 3,
                        bookings: 0,
                        workoutSessions: 0,
                        creditPurchases: isProduction ? 0 : 5,
                        personalRecords: 0,
                        notifications: 10 // System notifications are OK
                    };
                    dataClean_1 = true;
                    Object.entries(maxProductionData).forEach(function (_a) {
                        var key = _a[0], maxCount = _a[1];
                        if (dataStats_1[key] > maxCount) {
                            if (isProduction) {
                                console.log("\u26A0\uFE0F  Warning: ".concat(key, " count (").concat(dataStats_1[key], ") exceeds production limit (").concat(maxCount, ")"));
                                dataClean_1 = false;
                            }
                        }
                    });
                    if (dataClean_1 || !isProduction) {
                        checks.push({ name: 'Data State', status: '✅ PASS - Clean data state' });
                    }
                    else {
                        checks.push({ name: 'Data State', status: '⚠️  WARNING - Excessive data for production' });
                    }
                    // 7. Environment Variables Check
                    console.log('\n🔧 Checking environment variables...');
                    requiredEnvVars = [
                        'DATABASE_URL',
                        'NEXTAUTH_URL',
                        'NEXTAUTH_SECRET'
                    ];
                    missingEnvVars = requiredEnvVars.filter(function (envVar) { return !process.env[envVar]; });
                    if (missingEnvVars.length === 0) {
                        checks.push({ name: 'Environment Variables', status: '✅ PASS - All required variables set' });
                        console.log('✅ All required environment variables are set');
                    }
                    else {
                        checks.push({ name: 'Environment Variables', status: "\u274C FAIL - Missing: ".concat(missingEnvVars.join(', ')) });
                        console.log('❌ Missing environment variables:', missingEnvVars);
                        allChecks = false;
                    }
                    // 8. Test Authentication System
                    console.log('\n🔐 Testing authentication system...');
                    _b.label = 14;
                case 14:
                    _b.trys.push([14, 16, , 17]);
                    return [4 /*yield*/, prisma.user.findFirst({
                            where: {
                                email: 'john@doe.com',
                                role: 'ADMIN',
                                isActive: true
                            }
                        })];
                case 15:
                    testAdmin = _b.sent();
                    if (testAdmin) {
                        checks.push({ name: 'Authentication System', status: '✅ PASS - Admin account ready' });
                        console.log('✅ Authentication system ready');
                    }
                    else {
                        checks.push({ name: 'Authentication System', status: '❌ FAIL - No test admin found' });
                        console.log('❌ No test admin account found');
                        allChecks = false;
                    }
                    return [3 /*break*/, 17];
                case 16:
                    error_1 = _b.sent();
                    checks.push({ name: 'Authentication System', status: '❌ FAIL - Database error' });
                    console.log('❌ Authentication test failed:', error_1);
                    allChecks = false;
                    return [3 /*break*/, 17];
                case 17: return [3 /*break*/, 19];
                case 18:
                    error_2 = _b.sent();
                    console.error('❌ Setup validation failed:', error_2);
                    allChecks = false;
                    return [3 /*break*/, 19];
                case 19:
                    // Final Report
                    console.log('\n' + '='.repeat(60));
                    console.log('📋 PRODUCTION READINESS REPORT');
                    console.log('='.repeat(60));
                    checks.forEach(function (check) {
                        console.log("".concat(check.name.padEnd(25), " ").concat(check.status));
                    });
                    console.log('\n' + '='.repeat(60));
                    if (allChecks) {
                        console.log('🎉 PRODUCTION READY!');
                        console.log('✅ All checks passed. Application is ready for production deployment.');
                        if (!isProduction) {
                            console.log('\n📝 To deploy to production:');
                            console.log('1. Set NODE_ENV=production');
                            console.log('2. Run production database cleanup if needed');
                            console.log('3. Use production environment variables');
                            console.log('4. Build and deploy the application');
                        }
                    }
                    else {
                        console.log('⚠️  PRODUCTION READINESS ISSUES FOUND');
                        console.log('❌ Some checks failed. Review and fix issues before production deployment.');
                    }
                    console.log('='.repeat(60));
                    return [2 /*return*/, allChecks];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var success, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 5]);
                    return [4 /*yield*/, setupProduction()];
                case 1:
                    success = _a.sent();
                    process.exit(success ? 0 : 1);
                    return [3 /*break*/, 5];
                case 2:
                    error_3 = _a.sent();
                    console.error('❌ Production setup failed:', error_3);
                    process.exit(1);
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, prisma.$disconnect()];
                case 4:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Only run if called directly
if (require.main === module) {
    main();
}
exports.default = setupProduction;
var templateObject_1;
