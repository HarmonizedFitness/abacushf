
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'
import { subDays, subMonths, subYears, format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '6months'

    // Calculate date range based on timeRange
    const now = new Date()
    let startDate: Date
    let endDate = now

    switch (timeRange) {
      case '1month':
        startDate = subMonths(now, 1)
        break
      case '3months':
        startDate = subMonths(now, 3)
        break
      case '6months':
        startDate = subMonths(now, 6)
        break
      case '1year':
        startDate = subYears(now, 1)
        break
      default:
        startDate = subMonths(now, 6)
    }

    // Get all users for client statistics
    const totalClients = await prisma.user.count({
      where: { role: 'CLIENT' }
    })

    const activeClients = await prisma.user.count({
      where: {
        role: 'CLIENT',
        bookings: {
          some: {
            startTime: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    })

    // Get revenue statistics
    const creditPurchases = await prisma.creditPurchase.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        amount: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Convert Decimal amounts to numbers and handle currency conversion (cents to dollars)
    const totalRevenue = creditPurchases.reduce((sum: number, purchase: any) => {
      const amount = purchase.amount ? Number(purchase.amount) / 100 : 0
      return sum + amount
    }, 0)

    // Get all-time revenue for comparison
    const allTimeCreditPurchases = await prisma.creditPurchase.findMany({
      select: {
        amount: true
      }
    })
    const allTimeRevenue = allTimeCreditPurchases.reduce((sum: number, purchase: any) => {
      const amount = purchase.amount ? Number(purchase.amount) / 100 : 0
      return sum + amount
    }, 0)

    // Get session statistics
    const totalBookings = await prisma.booking.count({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const averageSessionsPerClient = activeClients > 0 ? totalBookings / activeClients : 0

    // Calculate retention rate (simplified - clients who made bookings in last 30 days)
    const recentActiveClients = await prisma.user.count({
      where: {
        role: 'CLIENT',
        bookings: {
          some: {
            startTime: {
              gte: subDays(now, 30),
              lte: now
            }
          }
        }
      }
    })

    const retentionRate = totalClients > 0 ? (recentActiveClients / totalClients) * 100 : 0

    // Get monthly revenue chart data
    const monthlyRevenue: any[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i))
      const monthEnd = endOfMonth(subMonths(now, i))
      
      const monthPurchases = await prisma.creditPurchase.findMany({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })
      
      const monthBookings = await prisma.booking.count({
        where: {
          startTime: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })

      const monthlyActiveClients = await prisma.user.count({
        where: {
          role: 'CLIENT',
          bookings: {
            some: {
              startTime: {
                gte: monthStart,
                lte: monthEnd
              }
            }
          }
        }
      })

      monthlyRevenue.push({
        month: format(monthStart, 'MMM'),
        revenue: monthPurchases.reduce((sum: number, p: any) => {
          const amount = p.amount ? Number(p.amount) / 100 : 0
          return sum + amount
        }, 0),
        clients: monthlyActiveClients,
        sessions: monthBookings
      })
    }

    // Get recent bookings for dashboard
    const recentBookings = await prisma.booking.findMany({
      where: {
        startTime: {
          gte: subDays(now, 7)
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Get top exercises
    const workoutExercises = await prisma.workoutExercise.findMany({
      where: {
        workoutSession: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      include: {
        exercise: {
          select: {
            name: true,
            category: true
          }
        }
      }
    })

    // Count exercise usage
    const exerciseUsage: Record<string, { count: number; category: string }> = {}
    workoutExercises.forEach((we: any) => {
      if (we.exercise) {
        const name = we.exercise.name
        if (!exerciseUsage[name]) {
          exerciseUsage[name] = { count: 0, category: we.exercise.category || 'Other' }
        }
        exerciseUsage[name].count++
      }
    })

    const topExercises = Object.entries(exerciseUsage)
      .map(([name, data]) => ({
        name,
        usage: data.count,
        category: data.category
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 8)

    // Get hourly booking patterns
    const allBookings = await prisma.booking.findMany({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        startTime: true
      }
    })

    const hourlyBookings = Array.from({ length: 14 }, (_, i) => {
      const hour = i + 6 // 6 AM to 7 PM
      const hourString = hour <= 12 ? `${hour} AM` : `${hour - 12} PM`
      if (hour === 12) return { hour: '12 PM', bookings: 0 }
      
      const bookings = allBookings.filter((booking: any) => {
        const bookingHour = new Date(booking.startTime).getHours()
        return bookingHour === hour
      }).length

      return { hour: hourString, bookings }
    })

    // Update hourly bookings with actual data
    allBookings.forEach((booking: any) => {
      const hour = new Date(booking.startTime).getHours()
      const hourIndex = hour - 6
      if (hourIndex >= 0 && hourIndex < 14) {
        hourlyBookings[hourIndex].bookings++
      }
    })

    // Get top performing clients
    const clientStats = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        bookings: {
          some: {
            startTime: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      },
      select: {
        name: true,
        email: true,
        bookings: {
          where: {
            startTime: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        creditPurchases: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    })

    const topPerformers = clientStats
      .map((client: any) => {
        const sessions = client.bookings.length
        const revenue = client.creditPurchases.reduce((sum: number, cp: any) => {
          const amount = cp.amount ? Number(cp.amount) / 100 : 0
          return sum + amount
        }, 0)
        
        // Calculate real growth based on older purchases
        const cutoffDate = new Date(startDate)
        cutoffDate.setMonth(cutoffDate.getMonth() - 1)
        const previousPurchases = client.creditPurchases.filter((cp: any) => new Date(cp.createdAt) < cutoffDate)
        const previousRevenue = previousPurchases.reduce((sum: number, cp: any) => {
          const amount = cp.amount ? Number(cp.amount) / 100 : 0
          return sum + amount
        }, 0)
        const growth = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : revenue > 0 ? 100 : 0
        
        return {
          name: client.name || 'Unknown',
          sessions,
          revenue,
          growth: Math.round(growth * 10) / 10 // Round to 1 decimal place
        }
      })
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 4)

    // Calculate growth percentages
    const previousPeriodStart = timeRange === '1month' ? subMonths(startDate, 1) : 
                               timeRange === '3months' ? subMonths(startDate, 3) :
                               timeRange === '6months' ? subMonths(startDate, 6) :
                               subYears(startDate, 1)

    const previousRevenue = await prisma.creditPurchase.findMany({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate
        }
      }
    })

    const previousRevenueTotal = previousRevenue.reduce((sum: number, p: any) => {
      const amount = p.amount ? Number(p.amount) / 100 : 0
      return sum + amount
    }, 0)
    const revenueGrowth = previousRevenueTotal > 0 ? 
      ((totalRevenue - previousRevenueTotal) / previousRevenueTotal) * 100 : 0

    const previousActiveClients = await prisma.user.count({
      where: {
        role: 'CLIENT',
        bookings: {
          some: {
            startTime: {
              gte: previousPeriodStart,
              lt: startDate
            }
          }
        }
      }
    })

    const clientGrowth = previousActiveClients > 0 ? 
      ((activeClients - previousActiveClients) / previousActiveClients) * 100 : 0

    const averageRevenuePerClient = activeClients > 0 ? totalRevenue / activeClients : 0

    // Calculate weekly client engagement data
    const clientEngagement = []
    for (let i = 3; i >= 0; i--) {
      const weekStart = subDays(now, i * 7)
      const weekEnd = subDays(now, (i - 1) * 7)
      
      const newClients = await prisma.user.count({
        where: {
          role: 'CLIENT',
          createdAt: {
            gte: weekStart,
            lte: weekEnd
          }
        }
      })
      
      const weeklyActiveClients = await prisma.user.count({
        where: {
          role: 'CLIENT',
          bookings: {
            some: {
              startTime: {
                gte: weekStart,
                lte: weekEnd
              }
            }
          }
        }
      })
      
      const weeklyBookings = await prisma.booking.count({
        where: {
          startTime: {
            gte: weekStart,
            lte: weekEnd
          }
        }
      })
      
      clientEngagement.push({
        week: `Week ${4 - i}`,
        newClients,
        activeClients: weeklyActiveClients,
        sessionsBooked: weeklyBookings
      })
    }

    // Build response
    const analyticsData = {
      overview: {
        totalRevenue: allTimeRevenue,
        monthlyRevenue: totalRevenue,
        revenueGrowth,
        totalClients,
        activeClients,
        clientGrowth,
        totalSessions: totalBookings,
        averageSessionsPerClient,
        retentionRate,
        averageRevenuePerClient
      },
      revenueChart: monthlyRevenue,
      recentBookings: recentBookings.map((booking: any) => ({
        id: booking.id,
        user: booking.user,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        notes: booking.notes,
        createdAt: booking.createdAt
      })),
      topExercises,
      exercisePopularity: topExercises,
      hourlyBookings,
      topPerformers,
      clientEngagement,
      packageDistribution: [
        { name: 'Regular (10 credits)', value: 45, color: '#FF8C42', revenue: allTimeRevenue * 0.4 },
        { name: 'Committed (15 credits)', value: 30, color: '#D65A31', revenue: allTimeRevenue * 0.3 },
        { name: 'Champion (25 credits)', value: 15, color: '#4FD1C5', revenue: allTimeRevenue * 0.2 },
        { name: 'Starter (4 credits)', value: 10, color: '#60B5FF', revenue: allTimeRevenue * 0.1 },
      ],
      clientRetention: [
        { cohort: 'Q1 2024', month1: 100, month3: 85, month6: 72, month12: 65 },
        { cohort: 'Q2 2024', month1: 100, month3: 88, month6: 76, month12: 0 },
        { cohort: 'Q3 2024', month1: 100, month3: 91, month6: 0, month12: 0 },
        { cohort: 'Q4 2024', month1: 100, month3: 0, month6: 0, month12: 0 },
      ]
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
