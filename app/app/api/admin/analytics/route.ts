
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'
import { subDays, subMonths, subYears, format, startOfMonth, endOfMonth, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns'

export const dynamic = 'force-dynamic'

// Helper function to calculate client accomplishments
async function calculateClientAccomplishments(startDate: Date, endDate: Date) {
  try {
    // Get top attendance achievers
    const attendanceAchievers = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        bookings: {
          some: {
            status: 'COMPLETED',
            startTime: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      },
      select: {
        name: true,
        bookings: {
          where: {
            status: 'COMPLETED',
            startTime: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    })

    const topAttendance = attendanceAchievers
      .map(user => ({
        name: user.name || 'Unknown',
        sessions: user.bookings.length,
        type: 'attendance'
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 3)

    // Get personal record improvements
    const prImprovements = await prisma.personalRecord.findMany({
      where: {
        achievedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        exercise: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        weight: 'desc'
      },
      take: 5
    })

    const topPRs = prImprovements.map(pr => ({
      name: pr.user.name || 'Unknown',
      achievement: `${pr.exercise.name}: ${pr.weight ? Number(pr.weight) : 0} lbs`,
      type: 'personal_record',
      value: pr.weight ? Number(pr.weight) : 0
    }))

    // Get most improved clients (based on PR increases)
    const userPRProgress = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        personalRecords: {
          some: {
            achievedAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      },
      select: {
        name: true,
        personalRecords: {
          where: {
            achievedAt: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            exercise: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    const mostImproved = userPRProgress
      .map(user => {
        const totalWeight = user.personalRecords.reduce((sum, pr) => sum + (pr.weight ? Number(pr.weight) : 0), 0)
        const avgWeight = user.personalRecords.length > 0 ? totalWeight / user.personalRecords.length : 0
        return {
          name: user.name || 'Unknown',
          avgPR: Math.round(avgWeight),
          improvements: user.personalRecords.length,
          type: 'improvement'
        }
      })
      .sort((a, b) => b.avgPR - a.avgPR)
      .slice(0, 3)

    return {
      topAttendance,
      topPRs,
      mostImproved
    }
  } catch (error) {
    console.error('Error calculating client accomplishments:', error)
    return {
      topAttendance: [],
      topPRs: [],
      mostImproved: []
    }
  }
}

// Helper function to calculate real package distribution
async function calculatePackageDistribution(startDate: Date, endDate: Date) {
  try {
    const packageStats = await prisma.creditPurchase.groupBy({
      by: ['packageName'],
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        packageName: true
      },
      _sum: {
        amount: true
      }
    })

    const total = packageStats.reduce((sum, pkg) => sum + pkg._count.packageName, 0)
    
    const colors = ['#FF8C42', '#D65A31', '#4FD1C5', '#60B5FF', '#9F7AEA', '#68D391']
    
    return packageStats.map((pkg, index) => ({
      name: pkg.packageName,
      value: total > 0 ? Math.round((pkg._count.packageName / total) * 100) : 0,
      color: colors[index % colors.length],
      revenue: pkg._sum.amount ? Number(pkg._sum.amount) / 100 : 0,
      count: pkg._count.packageName
    }))
  } catch (error) {
    console.error('Error calculating package distribution:', error)
    return []
  }
}

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

    // Get revenue statistics with proper filtering
    const creditPurchases = await prisma.creditPurchase.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        amount: true,
        credits: true,
        packageName: true,
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
      where: { status: 'COMPLETED' },
      select: {
        amount: true
      }
    })
    const allTimeRevenue = allTimeCreditPurchases.reduce((sum: number, purchase: any) => {
      const amount = purchase.amount ? Number(purchase.amount) / 100 : 0
      return sum + amount
    }, 0)

    // Get completed sessions revenue (sessions that have been used/completed)
    const completedBookings = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        startTime: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: {
          select: {
            creditPurchases: {
              where: { status: 'COMPLETED' },
              select: {
                amount: true,
                credits: true
              }
            }
          }
        }
      }
    })

    // Calculate completed session revenue (estimate based on credits used)
    const completedSessionRevenue = completedBookings.reduce((sum: number, booking: any) => {
      const userPurchases = booking.user.creditPurchases
      if (userPurchases.length > 0) {
        // Calculate average price per credit for this user
        const totalCredits = userPurchases.reduce((sum: number, cp: any) => sum + cp.credits, 0)
        const totalSpent = userPurchases.reduce((sum: number, cp: any) => sum + (Number(cp.amount) / 100), 0)
        const avgPricePerCredit = totalCredits > 0 ? totalSpent / totalCredits : 0
        return sum + (avgPricePerCredit * booking.creditsUsed)
      }
      return sum
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

    const totalCompletedSessions = await prisma.booking.count({
      where: {
        status: 'COMPLETED',
        startTime: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const averageSessionsPerClient = activeClients > 0 ? totalBookings / activeClients : 0

    // Calculate completion rate instead of retention rate
    const completionRate = totalBookings > 0 ? (totalCompletedSessions / totalBookings) * 100 : 0

    // Calculate client accomplishments (replace retention rate)
    const clientAccomplishments = await calculateClientAccomplishments(startDate, endDate)

    // Get real package distribution from completed purchases
    const packageDistribution = await calculatePackageDistribution(startDate, endDate)

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

    // Get hourly booking patterns - fixed logic
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

    // Initialize hourly booking array for 6 AM to 8 PM (15 hours)
    const hourlyBookings = Array.from({ length: 15 }, (_, i) => {
      const hour = i + 6 // 6 AM to 8 PM
      let hourString: string
      
      if (hour === 12) {
        hourString = '12 PM'
      } else if (hour < 12) {
        hourString = `${hour} AM`
      } else {
        hourString = `${hour - 12} PM`
      }
      
      return { hour: hourString, bookings: 0 }
    })

    // Count bookings by hour
    allBookings.forEach((booking: any) => {
      const hour = new Date(booking.startTime).getHours()
      const hourIndex = hour - 6 // Convert to array index
      if (hourIndex >= 0 && hourIndex < 15) {
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

    // Build response with real data
    const analyticsData = {
      overview: {
        totalRevenue: allTimeRevenue,
        monthlyRevenue: totalRevenue,
        completedSessionRevenue, // New metric
        revenueGrowth,
        totalClients,
        activeClients,
        clientGrowth,
        totalSessions: totalBookings,
        totalCompletedSessions, // New metric
        averageSessionsPerClient,
        completionRate, // Replaces retentionRate
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
      packageDistribution, // Now uses real data
      clientAccomplishments // Replaces clientRetention
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
