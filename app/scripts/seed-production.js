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
var bcrypt = require("bcryptjs");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var isProduction, allowProductionSeed, hashedPassword, adminUser, coreExercises, businessConfigs, clientPassword, clientUsers, demoPurchases;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Starting PRODUCTION database seeding...');
                    isProduction = process.env.NODE_ENV === 'production';
                    allowProductionSeed = process.env.ALLOW_PRODUCTION_SEED === 'true';
                    if (isProduction && !allowProductionSeed) {
                        console.log('⚠️  Production environment detected!');
                        console.log('⚠️  To seed production database, set ALLOW_PRODUCTION_SEED=true');
                        console.log('⚠️  This will create minimal essential data only.');
                        process.exit(0);
                    }
                    if (isProduction) {
                        console.log('🔒 PRODUCTION MODE: Creating minimal essential data only');
                    }
                    else {
                        console.log('🔧 DEVELOPMENT MODE: Creating full demo dataset');
                    }
                    return [4 /*yield*/, bcrypt.hash('johndoe123', 12)
                        // Create essential admin user (always required)
                    ];
                case 1:
                    hashedPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'john@doe.com' },
                            update: {},
                            create: {
                                email: 'john@doe.com',
                                name: 'System Admin',
                                password: hashedPassword,
                                role: 'ADMIN',
                                phone: '+1-555-0100',
                                fitnessGoals: 'System administration and client management',
                                isActive: true,
                            },
                        })];
                case 2:
                    adminUser = _a.sent();
                    console.log('✅ Created admin user:', adminUser.email);
                    return [4 /*yield*/, Promise.all([
                            // Chest exercises
                            prisma.exercise.upsert({
                                where: { id: 'bench-press' },
                                update: {},
                                create: {
                                    id: 'bench-press',
                                    name: 'Bench Press',
                                    description: 'Classic upper body exercise targeting chest, shoulders, and triceps',
                                    instructions: 'Lie on bench, grip bar with hands wider than shoulders, lower to chest, press up explosively',
                                    category: 'Chest',
                                    muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
                                    equipment: 'Barbell, Bench',
                                    imageUrl: 'https://barbend.com/wp-content/uploads/2022/03/Barbend-Featured-Image-1600x900-A-person-doing-a-bench-press.jpg',
                                    isActive: true,
                                },
                            }),
                            prisma.exercise.upsert({
                                where: { id: 'push-ups' },
                                update: {},
                                create: {
                                    id: 'push-ups',
                                    name: 'Push-ups',
                                    description: 'Bodyweight exercise for upper body strength',
                                    instructions: 'Start in plank position, lower body to ground, push back up',
                                    category: 'Chest',
                                    muscleGroups: ['Chest', 'Shoulders', 'Triceps', 'Core'],
                                    equipment: 'Bodyweight',
                                    imageUrl: 'https://i.ytimg.com/vi/k2YnU7UFAaE/maxresdefault.jpg',
                                    isActive: true,
                                },
                            }),
                            // Back exercises
                            prisma.exercise.upsert({
                                where: { id: 'deadlift' },
                                update: {},
                                create: {
                                    id: 'deadlift',
                                    name: 'Deadlift',
                                    description: 'Compound movement targeting posterior chain',
                                    instructions: 'Stand with feet hip-width apart, bend at hips and knees, grip bar, stand up tall',
                                    category: 'Back',
                                    muscleGroups: ['Back', 'Glutes', 'Hamstrings', 'Core'],
                                    equipment: 'Barbell',
                                    imageUrl: 'https://i.ytimg.com/vi/XxWcirHIwVo/maxresdefault.jpg',
                                    isActive: true,
                                },
                            }),
                            prisma.exercise.upsert({
                                where: { id: 'pull-ups' },
                                update: {},
                                create: {
                                    id: 'pull-ups',
                                    name: 'Pull-ups',
                                    description: 'Upper body pulling exercise',
                                    instructions: 'Hang from bar with arms extended, pull body up until chin over bar',
                                    category: 'Back',
                                    muscleGroups: ['Back', 'Biceps', 'Forearms'],
                                    equipment: 'Pull-up Bar',
                                    imageUrl: 'https://i.ytimg.com/vi/fOeXPLITq98/maxresdefault.jpg',
                                    isActive: true,
                                },
                            }),
                            // Leg exercises
                            prisma.exercise.upsert({
                                where: { id: 'squats' },
                                update: {},
                                create: {
                                    id: 'squats',
                                    name: 'Squats',
                                    description: 'Fundamental lower body exercise',
                                    instructions: 'Stand with feet shoulder-width apart, lower hips back and down, return to standing',
                                    category: 'Legs',
                                    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings', 'Calves'],
                                    equipment: 'Bodyweight or Barbell',
                                    imageUrl: 'https://i.ytimg.com/vi/X0qC1k0Zi6k/maxresdefault.jpg',
                                    isActive: true,
                                },
                            }),
                            prisma.exercise.upsert({
                                where: { id: 'lunges' },
                                update: {},
                                create: {
                                    id: 'lunges',
                                    name: 'Lunges',
                                    description: 'Unilateral leg exercise for strength and balance',
                                    instructions: 'Step forward into lunge position, lower back knee, push back to starting position',
                                    category: 'Legs',
                                    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings', 'Calves'],
                                    equipment: 'Bodyweight or Dumbbells',
                                    imageUrl: 'https://i.ytimg.com/vi/LRoSqkvpj10/maxresdefault.jpg',
                                    isActive: true,
                                },
                            }),
                            // Core exercises
                            prisma.exercise.upsert({
                                where: { id: 'plank' },
                                update: {},
                                create: {
                                    id: 'plank',
                                    name: 'Plank',
                                    description: 'Isometric core strengthening exercise',
                                    instructions: 'Hold push-up position with straight line from head to heels',
                                    category: 'Core',
                                    muscleGroups: ['Core', 'Shoulders', 'Glutes'],
                                    equipment: 'Bodyweight',
                                    imageUrl: 'https://barbend.com/wp-content/uploads/2022/05/shutterstock_1032306772-1.jpg',
                                    isActive: true,
                                },
                            }),
                        ])];
                case 3:
                    coreExercises = _a.sent();
                    console.log('✅ Created core exercises:', coreExercises.length);
                    return [4 /*yield*/, Promise.all([
                            // Business hours
                            prisma.businessConfig.upsert({
                                where: { key: 'business_hours_monday' },
                                update: {},
                                create: {
                                    key: 'business_hours_monday',
                                    value: JSON.stringify({ start: '07:00', end: '19:00', isOpen: true }),
                                    description: 'Monday business hours',
                                    category: 'business_hours',
                                },
                            }),
                            prisma.businessConfig.upsert({
                                where: { key: 'business_hours_tuesday' },
                                update: {},
                                create: {
                                    key: 'business_hours_tuesday',
                                    value: JSON.stringify({ start: '07:00', end: '19:00', isOpen: true }),
                                    description: 'Tuesday business hours',
                                    category: 'business_hours',
                                },
                            }),
                            prisma.businessConfig.upsert({
                                where: { key: 'business_hours_wednesday' },
                                update: {},
                                create: {
                                    key: 'business_hours_wednesday',
                                    value: JSON.stringify({ start: '07:00', end: '19:00', isOpen: true }),
                                    description: 'Wednesday business hours',
                                    category: 'business_hours',
                                },
                            }),
                            prisma.businessConfig.upsert({
                                where: { key: 'business_hours_thursday' },
                                update: {},
                                create: {
                                    key: 'business_hours_thursday',
                                    value: JSON.stringify({ start: '07:00', end: '19:00', isOpen: true }),
                                    description: 'Thursday business hours',
                                    category: 'business_hours',
                                },
                            }),
                            prisma.businessConfig.upsert({
                                where: { key: 'business_hours_friday' },
                                update: {},
                                create: {
                                    key: 'business_hours_friday',
                                    value: JSON.stringify({ start: '07:00', end: '19:00', isOpen: true }),
                                    description: 'Friday business hours',
                                    category: 'business_hours',
                                },
                            }),
                            prisma.businessConfig.upsert({
                                where: { key: 'business_hours_saturday' },
                                update: {},
                                create: {
                                    key: 'business_hours_saturday',
                                    value: JSON.stringify({ start: '09:00', end: '15:00', isOpen: true }),
                                    description: 'Saturday business hours',
                                    category: 'business_hours',
                                },
                            }),
                            prisma.businessConfig.upsert({
                                where: { key: 'business_hours_sunday' },
                                update: {},
                                create: {
                                    key: 'business_hours_sunday',
                                    value: JSON.stringify({ start: '09:00', end: '15:00', isOpen: false }),
                                    description: 'Sunday business hours',
                                    category: 'business_hours',
                                },
                            }),
                            // Session settings
                            prisma.businessConfig.upsert({
                                where: { key: 'default_session_duration' },
                                update: {},
                                create: {
                                    key: 'default_session_duration',
                                    value: '60',
                                    description: 'Default session duration in minutes',
                                    category: 'sessions',
                                },
                            }),
                            // Pricing tiers
                            prisma.businessConfig.upsert({
                                where: { key: 'pricing_tier_1' },
                                update: {},
                                create: {
                                    key: 'pricing_tier_1',
                                    value: JSON.stringify({ credits: '1-4', price: 85, name: 'Starter' }),
                                    description: 'Starter pricing tier',
                                    category: 'pricing',
                                },
                            }),
                            prisma.businessConfig.upsert({
                                where: { key: 'pricing_tier_2' },
                                update: {},
                                create: {
                                    key: 'pricing_tier_2',
                                    value: JSON.stringify({ credits: '5-10', price: 80, name: 'Regular' }),
                                    description: 'Regular pricing tier',
                                    category: 'pricing',
                                },
                            }),
                            prisma.businessConfig.upsert({
                                where: { key: 'pricing_tier_3' },
                                update: {},
                                create: {
                                    key: 'pricing_tier_3',
                                    value: JSON.stringify({ credits: '11-19', price: 75, name: 'Committed' }),
                                    description: 'Committed pricing tier',
                                    category: 'pricing',
                                },
                            }),
                            prisma.businessConfig.upsert({
                                where: { key: 'pricing_tier_4' },
                                update: {},
                                create: {
                                    key: 'pricing_tier_4',
                                    value: JSON.stringify({ credits: '20+', price: 65, name: 'Champion' }),
                                    description: 'Champion pricing tier',
                                    category: 'pricing',
                                },
                            }),
                        ])];
                case 4:
                    businessConfigs = _a.sent();
                    console.log('✅ Created business configurations:', businessConfigs.length);
                    if (!!isProduction) return [3 /*break*/, 8];
                    console.log('🔧 Adding demo data for development...');
                    return [4 /*yield*/, bcrypt.hash('password123', 12)
                        // Create demo client users (development only)
                    ];
                case 5:
                    clientPassword = _a.sent();
                    return [4 /*yield*/, Promise.all([
                            prisma.user.upsert({
                                where: { email: 'demo.client1@harmonized.dev' },
                                update: {},
                                create: {
                                    email: 'demo.client1@harmonized.dev',
                                    name: 'Demo Client One',
                                    password: clientPassword,
                                    role: 'CLIENT',
                                    phone: '+1-555-0001',
                                    fitnessGoals: 'General fitness and strength training',
                                    isActive: true,
                                },
                            }),
                            prisma.user.upsert({
                                where: { email: 'demo.client2@harmonized.dev' },
                                update: {},
                                create: {
                                    email: 'demo.client2@harmonized.dev',
                                    name: 'Demo Client Two',
                                    password: clientPassword,
                                    role: 'CLIENT',
                                    phone: '+1-555-0002',
                                    fitnessGoals: 'Weight loss and cardio improvement',
                                    isActive: true,
                                },
                            }),
                        ])];
                case 6:
                    clientUsers = _a.sent();
                    console.log('✅ Created demo client users:', clientUsers.map(function (u) { return u.email; }));
                    return [4 /*yield*/, Promise.all([
                            prisma.creditPurchase.create({
                                data: {
                                    userId: clientUsers[0].id,
                                    credits: 5,
                                    amount: 400.00,
                                    status: 'COMPLETED',
                                    packageName: 'Development Test Package',
                                    pricePerCredit: 80.00,
                                    stripePaymentIntentId: 'pi_demo_dev_001',
                                },
                            }),
                        ])];
                case 7:
                    demoPurchases = _a.sent();
                    console.log('✅ Created demo purchases:', demoPurchases.length);
                    _a.label = 8;
                case 8:
                    console.log('🎉 Database seeding completed!');
                    if (isProduction) {
                        console.log('✅ Production database ready with minimal essential data');
                    }
                    else {
                        console.log('✅ Development database ready with demo data');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
