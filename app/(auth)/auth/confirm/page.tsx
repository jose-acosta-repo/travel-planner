'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plane, Loader2, CheckCircle, XCircle } from 'lucide-react'

function ConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const confirmEmail = async () => {
      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      if (!token_hash || !type) {
        setStatus('error')
        setMessage('Invalid confirmation link')
        return
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as 'signup' | 'recovery' | 'invite' | 'email',
      })

      if (error) {
        setStatus('error')
        setMessage(error.message || 'Failed to verify email')
      } else {
        setStatus('success')
        setMessage('Your email has been verified successfully!')
      }
    }

    confirmEmail()
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <Plane className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">TripPlanner</span>
          </Link>

          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <CardTitle>Verifying your email</CardTitle>
              <CardDescription>Please wait while we confirm your email address...</CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle>Email verified!</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-red-100 dark:bg-red-900 p-3">
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <CardTitle>Verification failed</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {status === 'success' && (
            <Button className="w-full" onClick={() => router.push('/login')}>
              Sign in to your account
            </Button>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <Button className="w-full" variant="outline" onClick={() => router.push('/register')}>
                Try registering again
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  )
}
