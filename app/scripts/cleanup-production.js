"use strict";
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
 * Production database cleanup script
 * Removes all demo data and prepares database for production use
 */
function cleanupForProduction() {
    return __awaiter(this, void 0, void 0, function () {
        var demoEmailPatterns, preserveAdminEmails, demoUsers, demoUserIds_1, remainingUsers, remainingBookings, remainingSessions, remainingPurchases, remainingNotifications, error_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🧹 Starting production database cleanup...');
                    // Safety check - require explicit confirmation for production
                    if (environment_1.Environment.isProduction() && process.env.CONFIRM_PRODUCTION_CLEANUP !== 'true') {
                        console.log('⚠️  PRODUCTION ENVIRONMENT DETECTED!');
                        console.log('⚠️  This will permanently delete demo data!');
                        console.log('⚠️  To proceed, set CONFIRM_PRODUCTION_CLEANUP=true');
                        process.exit(0);
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, , 10]);
                    demoEmailPatterns = [
                        'alice@fitness.com',
                        'bob@fitness.com',
                        'carol@fitness.com',
                        'demo.client1@harmonized.dev',
                        'demo.client2@harmonized.dev',
                        '%@test.com',
                        '%demo%',
                        '%test%'
                    ];
                    preserveAdminEmails = [
                        'john@doe.com',
                        'admin@harmonized.com'
                    ];
                    console.log('🔍 Identifying demo data...');
                    return [4 /*yield*/, prisma.user.findMany({
                            where: {
                                OR: [
                                    { email: { in: ['alice@fitness.com', 'bob@fitness.com', 'carol@fitness.com'] } },
                                    { email: { contains: 'demo' } },
                                    { email: { contains: 'test' } },
                                    { AND: [
                                            { role: 'CLIENT' },
                                            { email: { not: { in: preserveAdminEmails } } }
                                        ] }
                                ]
                            },
                            select: { id: true, email: true, name: true, role: true }
                        })];
                case 2:
                    demoUsers = _a.sent();
                    console.log("\uD83D\uDCCB Found ".concat(demoUsers.length, " demo users to remove:"));
                    demoUsers.forEach(function (user) {
                        console.log("  - ".concat(user.email, " (").concat(user.role, ") - ").concat(user.name));
                    });
                    if (demoUsers.length === 0) {
                        console.log('✅ No demo users found. Database appears clean.');
                        return [2 /*return*/];
                    }
                    demoUserIds_1 = demoUsers.map(function (u) { return u.id; });
                    // Start cleanup transaction
                    console.log('🗑️  Starting cleanup transaction...');
                    return [4 /*yield*/, prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var deletedSets, deletedWorkoutExercises, deletedGroups, deletedSessions, deletedPRs, deletedProgress, deletedNotifications, deletedBookings, deletedPurchases, deletedAuthSessions, deletedAccounts, deletedUsers, deletedDemoExercises, deletedDemoNotifications;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, tx.workoutSet.deleteMany({
                                            where: {
                                                workoutExercise: {
                                                    workoutSession: {
                                                        userId: { in: demoUserIds_1 }
                                                    }
                                                }
                                            }
                                        })];
                                    case 1:
                                        deletedSets = _a.sent();
                                        console.log("  \u2705 Deleted ".concat(deletedSets.count, " workout sets"));
                                        return [4 /*yield*/, tx.workoutExercise.deleteMany({
                                                where: {
                                                    workoutSession: {
                                                        userId: { in: demoUserIds_1 }
                                                    }
                                                }
                                            })];
                                    case 2:
                                        deletedWorkoutExercises = _a.sent();
                                        console.log("  \u2705 Deleted ".concat(deletedWorkoutExercises.count, " workout exercises"));
                                        return [4 /*yield*/, tx.workoutExerciseGroup.deleteMany({
                                                where: {
                                                    workoutSession: {
                                                        userId: { in: demoUserIds_1 }
                                                    }
                                                }
                                            })];
                                    case 3:
                                        deletedGroups = _a.sent();
                                        console.log("  \u2705 Deleted ".concat(deletedGroups.count, " workout exercise groups"));
                                        return [4 /*yield*/, tx.workoutSession.deleteMany({
                                                where: { userId: { in: demoUserIds_1 } }
                                            })];
                                    case 4:
                                        deletedSessions = _a.sent();
                                        console.log("  \u2705 Deleted ".concat(deletedSessions.count, " workout sessions"));
                                        return [4 /*yield*/, tx.personalRecord.deleteMany({
                                                where: { userId: { in: demoUserIds_1 } }
                                            })];
                                    case 5:
                                        deletedPRs = _a.sent();
                                        console.log("  \u2705 Deleted ".concat(deletedPRs.count, " personal records"));
                                        return [4 /*yield*/, tx.progressEntry.deleteMany({
                                                where: { userId: { in: demoUserIds_1 } }
                                            })];
                                    case 6:
                                        deletedProgress = _a.sent();
                                        console.log("  \u2705 Deleted ".concat(deletedProgress.count, " progress entries"));
                                        return [4 /*yield*/, tx.notification.deleteMany({
                                                where: { userId: { in: demoUserIds_1 } }
                                            })];
                                    case 7:
                                        deletedNotifications = _a.sent();
                                        console.log("  \u2705 Deleted ".concat(deletedNotifications.count, " notifications"));
                                        return [4 /*yield*/, tx.booking.deleteMany({
                                                where: { userId: { in: demoUserIds_1 } }
                                            })];
                                    case 8:
                                        deletedBookings = _a.sent();
                                        console.log("  \u2705 Deleted ".concat(deletedBookings.count, " bookings"));
                                        return [4 /*yield*/, tx.creditPurchase.deleteMany({
                                                where: { userId: { in: demoUserIds_1 } }
                                            })];
                                    case 9:
                                        deletedPurchases = _a.sent();
                                        console.log("  \u2705 Deleted ".concat(deletedPurchases.count, " credit purchases"));
                                        return [4 /*yield*/, tx.session.deleteMany({
                                                where: { userId: { in: demoUserIds_1 } }
                                            })];
                                    case 10:
                                        deletedAuthSessions = _a.sent();
                                        console.log("  \u2705 Deleted ".concat(deletedAuthSessions.count, " auth sessions"));
                                        return [4 /*yield*/, tx.account.deleteMany({
                                                where: { userId: { in: demoUserIds_1 } }
                                            })];
                                    case 11:
                                        deletedAccounts = _a.sent();
                                        console.log("  \u2705 Deleted ".concat(deletedAccounts.count, " accounts"));
                                        return [4 /*yield*/, tx.user.deleteMany({
                                                where: { id: { in: demoUserIds_1 } }
                                            })];
                                    case 12:
                                        deletedUsers = _a.sent();
                                        console.log("  \u2705 Deleted ".concat(deletedUsers.count, " demo users"));
                                        return [4 /*yield*/, tx.exercise.deleteMany({
                                                where: {
                                                    OR: [
                                                        { name: { contains: 'demo' } },
                                                        { name: { contains: 'test' } },
                                                        { description: { contains: 'demo' } },
                                                        { description: { contains: 'test' } }
                                                    ]
                                                }
                                            })];
                                    case 13:
                                        deletedDemoExercises = _a.sent();
                                        if (deletedDemoExercises.count > 0) {
                                            console.log("  \u2705 Deleted ".concat(deletedDemoExercises.count, " demo exercises"));
                                        }
                                        return [4 /*yield*/, tx.notification.deleteMany({
                                                where: {
                                                    OR: [
                                                        { message: { contains: 'Alice Johnson' } },
                                                        { message: { contains: 'Bob Smith' } },
                                                        { message: { contains: 'Carol Williams' } },
                                                        { message: { contains: 'demo' } },
                                                        { message: { contains: 'test' } },
                                                        { title: { contains: 'demo' } },
                                                        { title: { contains: 'test' } }
                                                    ]
                                                }
                                            })];
                                    case 14:
                                        deletedDemoNotifications = _a.sent();
                                        if (deletedDemoNotifications.count > 0) {
                                            console.log("  \u2705 Deleted ".concat(deletedDemoNotifications.count, " demo notifications"));
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 3:
                    _a.sent();
                    console.log('🎉 Production cleanup completed successfully!');
                    console.log('✅ Database is now ready for production use');
                    return [4 /*yield*/, prisma.user.count()];
                case 4:
                    remainingUsers = _a.sent();
                    return [4 /*yield*/, prisma.booking.count()];
                case 5:
                    remainingBookings = _a.sent();
                    return [4 /*yield*/, prisma.workoutSession.count()];
                case 6:
                    remainingSessions = _a.sent();
                    return [4 /*yield*/, prisma.creditPurchase.count()];
                case 7:
                    remainingPurchases = _a.sent();
                    return [4 /*yield*/, prisma.notification.count()];
                case 8:
                    remainingNotifications = _a.sent();
                    console.log('\n📊 Remaining data after cleanup:');
                    console.log("  - Users: ".concat(remainingUsers));
                    console.log("  - Bookings: ".concat(remainingBookings));
                    console.log("  - Workout Sessions: ".concat(remainingSessions));
                    console.log("  - Credit Purchases: ".concat(remainingPurchases));
                    console.log("  - Notifications: ".concat(remainingNotifications));
                    return [3 /*break*/, 10];
                case 9:
                    error_1 = _a.sent();
                    console.error('❌ Cleanup failed:', error_1);
                    throw error_1;
                case 10: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 5]);
                    return [4 /*yield*/, cleanupForProduction()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 2:
                    error_2 = _a.sent();
                    console.error('❌ Production cleanup failed:', error_2);
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
exports.default = cleanupForProduction;
