
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Dumbbell, 
  Trophy, 
  Calendar, 
  Users, 
  CheckCircle,
  Star,
  ArrowRight,
  Play,
  Target,
  BarChart3,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-hf-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-hf-card bg-hf-dark/95 backdrop-blur supports-[backdrop-filter]:bg-hf-dark/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-orange rounded-lg">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-hf-text">Harmonized Fitness</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button className="btn-gradient" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-hf-orange/10 to-hf-orange-dark/10" />
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center space-y-8">
            <Badge className="bg-hf-card text-hf-text border-hf-orange/30">
              Premium Personal Training Platform
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-hf-text">
              Transform Your{' '}
              <span className="gradient-text">Fitness Journey</span>
            </h1>
            <p className="text-xl text-hf-text-secondary max-w-2xl mx-auto">
              Track workouts, book sessions, and achieve your goals with our comprehensive personal training platform designed for serious fitness enthusiasts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="btn-gradient text-lg px-8 py-4" asChild>
                <Link href="/signup">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-hf-text mb-4">
              Everything You Need to{' '}
              <span className="gradient-text">Excel</span>
            </h2>
            <p className="text-xl text-hf-text-secondary max-w-2xl mx-auto">
              Our platform combines cutting-edge technology with personalized training to help you reach your peak performance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Target className="h-8 w-8" />,
                title: "Smart Workout Tracking",
                description: "Log exercises, track sets and reps, monitor personal records with our intuitive interface."
              },
              {
                icon: <Calendar className="h-8 w-8" />,
                title: "Flexible Scheduling",
                description: "Book sessions easily with our smart calendar system that adapts to your trainer's availability."
              },
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: "Advanced Analytics",
                description: "Visualize your progress with detailed charts and insights to optimize your training."
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: "Personal Training",
                description: "Connect with certified trainers who provide personalized guidance and motivation."
              },
              {
                icon: <Trophy className="h-8 w-8" />,
                title: "Achievement System",
                description: "Earn badges and celebrate milestones as you progress through your fitness journey."
              },
              {
                icon: <Clock className="h-8 w-8" />,
                title: "Credit System",
                description: "Flexible credit-based booking system with tiered pricing for maximum value."
              }
            ].map((feature, index) => (
              <Card key={index} className="bg-hf-card border-hf-card hover:border-hf-orange/30 transition-all duration-300 card-hover">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-orange rounded-lg flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-hf-text">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-hf-text-secondary">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-hf-card/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-hf-text mb-4">
              <span className="gradient-text">Flexible</span> Pricing Plans
            </h2>
            <p className="text-xl text-hf-text-secondary max-w-2xl mx-auto">
              Choose the credit package that works best for your training schedule and goals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: "Starter",
                credits: "1-4 Sessions",
                price: "$85",
                priceUnit: "per session",
                popular: false,
                features: [
                  "Full workout tracking",
                  "Basic analytics",
                  "Schedule flexibility",
                  "Email support"
                ]
              },
              {
                name: "Regular",
                credits: "5-10 Sessions",
                price: "$80",
                priceUnit: "per session",
                popular: true,
                features: [
                  "Everything in Starter",
                  "Advanced analytics",
                  "Priority booking",
                  "Phone support"
                ]
              },
              {
                name: "Committed",
                credits: "11-19 Sessions",
                price: "$75",
                priceUnit: "per session",
                popular: false,
                features: [
                  "Everything in Regular",
                  "Nutrition guidance",
                  "Progress photos",
                  "Dedicated support"
                ]
              },
              {
                name: "Champion",
                credits: "20+ Sessions",
                price: "$65",
                priceUnit: "per session",
                popular: false,
                features: [
                  "Everything in Committed",
                  "Custom meal plans",
                  "1-on-1 consultations",
                  "Premium support"
                ]
              }
            ].map((plan, index) => (
              <Card key={index} className={`relative bg-hf-card border-hf-card hover:border-hf-orange/30 transition-all duration-300 card-hover ${plan.popular ? 'ring-2 ring-hf-orange' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-orange text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-hf-text">{plan.name}</CardTitle>
                  <div className="text-hf-text-secondary">{plan.credits}</div>
                  <div className="text-3xl font-bold text-hf-text">
                    {plan.price}
                    <span className="text-sm font-normal text-hf-text-secondary ml-1">
                      {plan.priceUnit}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-hf-text-secondary">
                        <CheckCircle className="h-4 w-4 text-hf-success mr-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-6 btn-gradient" asChild>
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-gradient-to-r from-hf-orange/10 to-hf-orange-dark/10 rounded-2xl p-12 border border-hf-orange/20">
            <h2 className="text-3xl md:text-4xl font-bold text-hf-text mb-4">
              Ready to Transform Your Fitness?
            </h2>
            <p className="text-xl text-hf-text-secondary mb-8">
              Join thousands of fitness enthusiasts who trust our platform to achieve their goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-gradient text-lg px-8 py-4" asChild>
                <Link href="/signup">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-hf-card bg-hf-dark">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-orange rounded-lg">
                <Dumbbell className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-hf-text">Harmonized Fitness</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/about" className="text-hf-text-secondary hover:text-hf-orange transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-hf-text-secondary hover:text-hf-orange transition-colors">
                Contact
              </Link>
              <Link href="/privacy" className="text-hf-text-secondary hover:text-hf-orange transition-colors">
                Privacy
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-hf-card text-center text-hf-text-secondary">
            <p>&copy; 2024 Harmonized Fitness. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
