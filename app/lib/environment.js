"use strict";
/**
 * Environment utilities for production readiness
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEnvironment = exports.withEnvironment = exports.Environment = void 0;
exports.Environment = {
    /**
     * Check if running in production
     */
    isProduction: function () { return process.env.NODE_ENV === 'production'; },
    /**
     * Check if running in development
     */
    isDevelopment: function () { return process.env.NODE_ENV === 'development'; },
    /**
     * Check if demo features should be enabled
     * Demo features are disabled in production unless explicitly enabled
     */
    isDemoEnabled: function () {
        var isProduction = exports.Environment.isProduction();
        var forceDemoInProduction = process.env.ENABLE_DEMO_FEATURES === 'true';
        return !isProduction || forceDemoInProduction;
    },
    /**
     * Check if seeding is allowed in current environment
     */
    isSeedingAllowed: function () {
        var isProduction = exports.Environment.isProduction();
        var allowProductionSeed = process.env.ALLOW_PRODUCTION_SEED === 'true';
        return !isProduction || allowProductionSeed;
    },
    /**
     * Get current environment name
     */
    getEnvironment: function () { return process.env.NODE_ENV || 'development'; },
    /**
     * Log environment-aware messages
     */
    log: {
        info: function (message) {
            if (!exports.Environment.isProduction()) {
                console.log("[".concat(exports.Environment.getEnvironment().toUpperCase(), "] ").concat(message));
            }
        },
        warn: function (message) {
            console.warn("[".concat(exports.Environment.getEnvironment().toUpperCase(), "] \u26A0\uFE0F  ").concat(message));
        },
        error: function (message) {
            console.error("[".concat(exports.Environment.getEnvironment().toUpperCase(), "] \u274C ").concat(message));
        },
        production: function (message) {
            if (exports.Environment.isProduction()) {
                console.log("[PRODUCTION] ".concat(message));
            }
        }
    }
};
/**
 * Higher-order component for environment-conditional rendering
 */
function withEnvironment(component, condition) {
    return function EnvironmentConditionalComponent(props) {
        if (!condition()) {
            return null;
        }
        var Component = component;
        return Component(props);
    };
}
exports.withEnvironment = withEnvironment;
/**
 * Hook for environment-conditional logic
 */
function useEnvironment() {
    return {
        isProduction: exports.Environment.isProduction(),
        isDevelopment: exports.Environment.isDevelopment(),
        isDemoEnabled: exports.Environment.isDemoEnabled(),
        environment: exports.Environment.getEnvironment(),
    };
}
exports.useEnvironment = useEnvironment;
