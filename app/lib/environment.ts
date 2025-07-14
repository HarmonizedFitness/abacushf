
/**
 * Environment utilities for production readiness
 */

export const Environment = {
  /**
   * Check if running in production
   */
  isProduction: () => process.env.NODE_ENV === 'production',

  /**
   * Check if running in development
   */
  isDevelopment: () => process.env.NODE_ENV === 'development',

  /**
   * Check if demo features should be enabled
   * Demo features are disabled in production unless explicitly enabled
   */
  isDemoEnabled: () => {
    const isProduction = Environment.isProduction()
    const forceDemoInProduction = process.env.ENABLE_DEMO_FEATURES === 'true'
    
    return !isProduction || forceDemoInProduction
  },

  /**
   * Check if seeding is allowed in current environment
   */
  isSeedingAllowed: () => {
    const isProduction = Environment.isProduction()
    const allowProductionSeed = process.env.ALLOW_PRODUCTION_SEED === 'true'
    
    return !isProduction || allowProductionSeed
  },

  /**
   * Get current environment name
   */
  getEnvironment: () => process.env.NODE_ENV || 'development',

  /**
   * Log environment-aware messages
   */
  log: {
    info: (message: string) => {
      if (!Environment.isProduction()) {
        console.log(`[${Environment.getEnvironment().toUpperCase()}] ${message}`)
      }
    },
    warn: (message: string) => {
      console.warn(`[${Environment.getEnvironment().toUpperCase()}] ⚠️  ${message}`)
    },
    error: (message: string) => {
      console.error(`[${Environment.getEnvironment().toUpperCase()}] ❌ ${message}`)
    },
    production: (message: string) => {
      if (Environment.isProduction()) {
        console.log(`[PRODUCTION] ${message}`)
      }
    }
  }
}

/**
 * Higher-order component for environment-conditional rendering
 */
export function withEnvironment<T = any>(
  component: any,
  condition: () => boolean
) {
  return function EnvironmentConditionalComponent(props: T) {
    if (!condition()) {
      return null
    }
    
    const Component = component
    return Component(props)
  }
}

/**
 * Hook for environment-conditional logic
 */
export function useEnvironment() {
  return {
    isProduction: Environment.isProduction(),
    isDevelopment: Environment.isDevelopment(),
    isDemoEnabled: Environment.isDemoEnabled(),
    environment: Environment.getEnvironment(),
  }
}
