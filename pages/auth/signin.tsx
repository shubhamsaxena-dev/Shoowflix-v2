import { useState } from 'react'
import { getProviders, signIn, getSession } from 'next-auth/react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { ArrowLeft, Mail, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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

  const handleSignIn = async (providerId: string) => {
    setLoading(providerId)
    try {
      await signIn(providerId, { callbackUrl: '/' })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setLoading(null)
    }
  }

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return <Mail className="h-5 w-5" />
      case 'github':
        return <Github className="h-5 w-5" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Head>
        <title>Sign In - Shoowflix</title>
        <meta name="description" content="Sign in to your Shoowflix account to save favorites and continue watching" />
      </Head>

      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shoowflix
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your account to save favorites and continue watching
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.values(providers || {}).map((provider) => (
              <Button
                key={provider.name}
                variant="outline"
                className="w-full"
                onClick={() => handleSignIn(provider.id)}
                disabled={loading === provider.id}
                data-testid={`button-signin-${provider.id}`}
              >
                {loading === provider.id ? (
                  <div className="flex items-center">
                    <div className="h-5 w-5 mr-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center">
                    {getProviderIcon(provider.id)}
                    <span className="ml-3">Continue with {provider.name}</span>
                  </div>
                )}
              </Button>
            ))}

            <div className="text-center text-sm text-muted-foreground">
              <p>
                By signing in, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </CardContent>
        </Card>
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