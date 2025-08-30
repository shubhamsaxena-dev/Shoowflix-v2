import { useState } from 'react'
import { getProviders, signIn, getSession } from 'next-auth/react'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Provider {
  id: string
  name: string
  type: string
  signinUrl: string
  callbackUrl: string
}

interface SignInProps {
  providers: Record<string, Provider>
}

export default function SignIn({ providers }: SignInProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const { callbackUrl } = router.query

  const handleSignIn = async (providerId: string) => {
    setLoading(providerId)
    try {
      await signIn(providerId, { callbackUrl: callbackUrl as string || '/' })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Head>
        <title>Sign In - Shoowflix</title>
        <meta name="description" content="Sign in to your Shoowflix account" />
      </Head>

      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-white hover:text-gray-300" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shoowflix
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-4">Welcome to Shoowflix</h1>
            <p className="text-gray-400 mb-8">New or existing user?</p>
          </div>

          <div className="space-y-4">
            {Object.values(providers || {}).filter(p => p.id !== 'credentials').map((provider) => (
              <Button
                key={provider.name}
                variant="outline"
                className="w-full bg-white text-black hover:bg-gray-100 border-white"
                onClick={() => handleSignIn(provider.id)}
                disabled={loading === provider.id}
                data-testid={`button-signin-${provider.id}`}
              >
                {loading === provider.id ? (
                  'Signing in...'
                ) : (
                  `Continue with ${provider.name}`
                )}
              </Button>
            ))}
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>
              By signing in, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)

  // Redirect if already authenticated
  if (session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  const providers = await getProviders()

  return {
    props: {
      providers: providers ?? {},
    },
  }
}