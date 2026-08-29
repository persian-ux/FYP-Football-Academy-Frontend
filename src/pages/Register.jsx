import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles, Trophy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import SpinningFootball from '@/components/common/SpinningFootball'
import { registerUser } from '@/redux/api/auth'
import { setCredentials, setError, clearError } from '@/redux/slices/authSlice'
import { cn } from '@/lib/utils'

const BACKGROUND_PICS = [
  {
    url: 'https://i.pinimg.com/736x/6b/30/72/6b3072c2678ce94202dbc824b8b6dd83.jpg',
    tag: 'MAGICIAN • PLAYMAKER',
    quote: 'You have to fight to reach your dream. You have to sacrifice and work hard for it.',
    athlete: 'Lionel Messi',
  },
  {
    url: 'https://i.pinimg.com/736x/34/6e/24/346e24e4924523712f0f3e0a9fdd9edc.jpg',
    tag: 'THE CYBORG • GOAL MACHINE',
    quote: 'Stay hungry, stay focused, and keep pushing beyond every limit.',
    athlete: 'Erling Haaland',
  },
]

export default function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth)

  const [activeSlide, setActiveSlide] = useState(0)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Auto-switch background pictures every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % BACKGROUND_PICS.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      setAgreedToTerms(checked)
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (error) dispatch(clearError())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})
    dispatch(clearError())

    // Validation
    const errors = {}
    if (!formData.first_name.trim()) errors.first_name = 'First name is required'
    if (!formData.last_name.trim()) errors.last_name = 'Last name is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    if (!formData.password) errors.password = 'Password is required'
    if (formData.password !== formData.password2) {
      errors.password2 = 'Passwords do not match'
    }
    if (!agreedToTerms) errors.terms = 'You must agree to the terms'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    try {
      const response = await registerUser({
        email: formData.email.trim(),
        password: formData.password,
        password2: formData.password2,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
      })

      if (response.success) {
        const tokens = response.data.tokens || {
          access: response.data.access,
          refresh: response.data.refresh,
        }
        const user = response.data.user || response.data

        localStorage.setItem('auth_tokens', JSON.stringify(tokens))
        localStorage.setItem('auth_user', JSON.stringify(user))

        dispatch(setCredentials({ user, tokens }))
        toast.success(response.message || 'Registration successful! Welcome to Sportsphere Academy.')
        navigate('/dashboard', { replace: true })
      } else {
        if (response.errors) {
          setFieldErrors(response.errors)
        }
        dispatch(setError(response.message || 'Registration failed'))
        toast.error(response.message || 'Registration failed')
      }
    } catch (err) {
      const errData = err.response?.data
      const message = errData?.message || err.message || 'Registration failed. Please try again.'

      if (errData?.errors) {
        setFieldErrors(errData.errors)
      }

      dispatch(setError(message))
      toast.error(message)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex bg-[#070b14] text-white overflow-hidden selection:bg-cyan-500 selection:text-slate-950">
      {/* Full-screen background for mobile and ambient glow */}
      <div className="absolute inset-0 z-0">
        {BACKGROUND_PICS.map((pic, idx) => (
          <div
            key={pic.url}
            className={cn(
              'absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out',
              activeSlide === idx ? 'opacity-25 lg:opacity-0 scale-100' : 'opacity-0 scale-105'
            )}
            style={{ backgroundImage: `url(${pic.url})` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/90 to-[#070b14]/80 backdrop-blur-xs lg:hidden" />
      </div>

      {/* Back to Home button */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-30 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur-xl transition-all duration-200 hover:border-cyan-500/40 hover:bg-slate-900/90 hover:text-white hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
      >
        <ArrowLeft className="size-3.5" />
        <span>Back to Home</span>
      </Link>

      {/* Left side — Cinematic Background Pictures Showcase */}
      <div className="hidden lg:relative lg:flex lg:w-7/12 flex-col justify-between overflow-hidden border-r border-white/10 p-12 xl:p-16">
        {/* Layered Crossfade Background Images */}
        {BACKGROUND_PICS.map((pic, idx) => (
          <div
            key={pic.url}
            className={cn(
              'absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out transform',
              activeSlide === idx
                ? 'opacity-100 scale-100 filter brightness-90'
                : 'opacity-0 scale-105 pointer-events-none'
            )}
            style={{ backgroundImage: `url(${pic.url})` }}
          />
        ))}

        {/* Cinematic Vignette & Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/40 to-[#070b14]/60 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#070b14] z-10 pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="grid size-11 place-items-center rounded-full border border-cyan-500/40 bg-cyan-950/60 shadow-[0_0_20px_rgba(6,182,212,0.3)] group-hover:border-cyan-400 transition-all">
              <SpinningFootball className="size-7" spinDuration="5s" />
            </div>
            <div className="leading-none">
              <span className="block text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                SPORT<span className="text-cyan-400">SPHERE</span>
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mt-0.5">
                Football Academy
              </span>
            </div>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-cyan-300 backdrop-blur-md">
            <Sparkles className="size-3.5" />
            Elite Athlete Portal
          </div>
        </div>

        {/* Middle / Bottom Content & Current Slide Tag */}
        <div className="relative z-20 max-w-xl my-auto pt-16">
          <div className="inline-flex items-center gap-2 rounded-lg bg-black/60 border border-cyan-500/40 px-3 py-1 text-xs font-mono font-bold tracking-widest text-cyan-300 mb-4 backdrop-blur-md shadow-lg">
            <Trophy className="size-3.5 text-cyan-400" />
            {BACKGROUND_PICS[activeSlide].tag}
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
            Join the{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Sportsphere Academy
            </span>
          </h1>

          <p className="mt-4 text-base xl:text-lg text-slate-200 font-medium leading-relaxed drop-shadow">
            &ldquo;{BACKGROUND_PICS[activeSlide].quote}&rdquo;
          </p>
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
            — {BACKGROUND_PICS[activeSlide].athlete}
          </p>

          {/* Quick Stats Matrix */}
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/15 pt-6 backdrop-blur-xs">
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3.5 backdrop-blur-md">
              <div className="text-2xl font-black text-cyan-400">50+</div>
              <div className="text-[11px] font-semibold text-slate-300 mt-0.5">Training Programs</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3.5 backdrop-blur-md">
              <div className="text-2xl font-black text-emerald-400">10k+</div>
              <div className="text-[11px] font-semibold text-slate-300 mt-0.5">Active Athletes</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3.5 backdrop-blur-md">
              <div className="text-2xl font-black text-purple-400">200+</div>
              <div className="text-[11px] font-semibold text-slate-300 mt-0.5">Expert Coaches</div>
            </div>
          </div>
        </div>

        {/* Bottom Slide Switcher Controls */}
        <div className="relative z-20 flex items-center justify-between pt-6 border-t border-white/10">
          <div className="flex items-center gap-2">
            {BACKGROUND_PICS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlide(idx)}
                className={cn(
                  'h-2 rounded-full transition-all duration-300 cursor-pointer',
                  activeSlide === idx
                    ? 'w-8 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                    : 'w-2 bg-white/30 hover:bg-white/60'
                )}
                aria-label={`Switch to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSlide((prev) => (prev === 0 ? BACKGROUND_PICS.length - 1 : prev - 1))}
              className="grid size-8 place-items-center rounded-full border border-white/15 bg-black/40 text-slate-300 hover:text-white hover:border-cyan-400 transition-all cursor-pointer backdrop-blur-md"
              aria-label="Previous slide"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveSlide((prev) => (prev + 1) % BACKGROUND_PICS.length)}
              className="grid size-8 place-items-center rounded-full border border-white/15 bg-black/40 text-slate-300 hover:text-white hover:border-cyan-400 transition-all cursor-pointer backdrop-blur-md"
              aria-label="Next slide"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Right side — Form */}
      <div className="relative z-20 flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          <Card className="border-white/15 bg-slate-900/80 backdrop-blur-2xl shadow-[0_15px_50px_rgba(0,0,0,0.7)] text-white">
            <CardContent className="p-8 sm:p-10">
              {/* Mobile logo */}
              <div className="lg:hidden flex flex-col items-center justify-center mb-6">
                <div className="grid size-14 place-items-center rounded-full border border-cyan-500/40 bg-cyan-950/60 shadow-[0_0_25px_rgba(6,182,212,0.4)] mb-3">
                  <SpinningFootball className="size-8" spinDuration="5s" />
                </div>
                <div className="text-lg font-black tracking-tight text-white">
                  SPORT<span className="text-cyan-400">SPHERE</span>
                </div>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-3xl font-black text-white tracking-tight">Create Account</h2>
                <p className="text-slate-400 mt-1.5 text-xs font-medium">
                  Sign up to get started with Sportsphere Academy
                </p>
              </div>

              {/* Error alert */}
              {error && (
                <Alert variant="destructive" className="mb-6 border-red-500/30 bg-red-950/40 text-red-300">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="mb-5">
                <GoogleSignInButton text="Sign up with Google" />
              </div>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                  <span className="bg-slate-900/90 px-3 text-slate-400">or register with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      First Name
                    </Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      placeholder="John"
                      value={formData.first_name}
                      onChange={handleChange}
                      className={`h-10 border-white/15 bg-slate-950/60 text-white placeholder:text-slate-500 focus-visible:border-cyan-500 ${fieldErrors.first_name ? 'border-destructive' : ''
                        }`}
                    />
                    {fieldErrors.first_name && (
                      <p className="text-xs text-destructive mt-1">{fieldErrors.first_name}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last_name" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Last Name
                    </Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      placeholder="Doe"
                      value={formData.last_name}
                      onChange={handleChange}
                      className={`h-10 border-white/15 bg-slate-950/60 text-white placeholder:text-slate-500 focus-visible:border-cyan-500 ${fieldErrors.last_name ? 'border-destructive' : ''
                        }`}
                    />
                    {fieldErrors.last_name && (
                      <p className="text-xs text-destructive mt-1">{fieldErrors.last_name}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={`h-10 border-white/15 bg-slate-950/60 text-white placeholder:text-slate-500 focus-visible:border-cyan-500 ${fieldErrors.email ? 'border-destructive' : ''
                      }`}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`h-10 border-white/15 bg-slate-950/60 text-white placeholder:text-slate-500 focus-visible:border-cyan-500 ${fieldErrors.password ? 'border-destructive' : ''
                      }`}
                  />
                  {fieldErrors.password && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password2" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Confirm Password
                  </Label>
                  <Input
                    id="password2"
                    name="password2"
                    type="password"
                    placeholder="Repeat your password"
                    value={formData.password2}
                    onChange={handleChange}
                    className={`h-10 border-white/15 bg-slate-950/60 text-white placeholder:text-slate-500 focus-visible:border-cyan-500 ${fieldErrors.password2 ? 'border-destructive' : ''
                      }`}
                  />
                  {fieldErrors.password2 && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.password2}</p>
                  )}
                </div>

                {/* Terms agreement */}
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950/60 text-cyan-500 focus:ring-cyan-500/50 cursor-pointer"
                  />
                  <Label htmlFor="terms" className="text-xs text-slate-400 cursor-pointer leading-relaxed">
                    I agree to the{' '}
                    <a href="#" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                      Privacy Policy
                    </a>
                  </Label>
                </div>
                {fieldErrors.terms && (
                  <p className="text-xs text-destructive">{fieldErrors.terms}</p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-11 mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2 text-slate-950 font-bold">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    'Create Academy Account'
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-slate-400 mt-5 font-medium">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


