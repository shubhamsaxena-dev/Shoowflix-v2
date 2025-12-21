import { useState } from "react";
import { getProviders, signIn, getSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Mail, Github, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

interface SignInProps {
  providers: Record<string, Provider>;
  callbackUrl: string | null;
}

export default function SignIn({ providers, callbackUrl }: SignInProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const router = useRouter();
  const { toast } = useToast();

  const handleSignIn = async (providerId: string) => {
    setLoading(providerId);
    try {
      const redirectUrl = callbackUrl || "/";
      const result = await signIn(providerId, {
        redirect: false, // Disable auto-redirect
      });

      if (result?.ok) {
        // Manually redirect after successful sign-in
        router.push(redirectUrl);
      } else {
        toast({
          title: "Error",
          description: result?.error || "Sign in failed",
          variant: "destructive",
        });
        setLoading(null);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialsLoading(true);

    try {
      if (isLogin) {
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false, // Disable auto-redirect
        });

        if (result?.error) {
          toast({
            title: "Error",
            description: result.error || "Invalid credentials",
            variant: "destructive",
          });
          setCredentialsLoading(false);
        } else if (result?.ok) {
          toast({
            title: "Success",
            description: "Signed in successfully",
          });
          // Manually redirect after successful sign-in
          const redirectUrl = callbackUrl || "/";
          router.push(redirectUrl);
        }
      } else {
        // Register new user
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
          toast({
            title: "Account created",
            description: "You can now sign in.",
          });
          setIsLogin(true);
          setFormData({ name: "", email: "", password: "" });
        } else {
          toast({
            title: "Error",
            description: data?.error || "Registration failed",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCredentialsLoading(false);
    }
  };

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case "google":
        return <Mail className="h-5 w-5" />;
      case "github":
        return <Github className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const oAuthProviders = providers
    ? Object.values(providers).filter((p) => p.id !== "credentials")
    : [];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Head>
        <title>Sign In - Shoowflix</title>
        <meta
          name="description"
          content="Sign in to your Shoowflix account to save favorites and continue watching"
        />
      </Head>

      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/">
            <Button
              variant="ghost"
              className="mb-4"
              data-testid="button-back-home"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shoowflix
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">
              {isLogin ? "Welcome back" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to your account to save favorites and continue watching"
                : "Join Shoowflix to start watching movies and saving favorites"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* OAuth Providers */}
            {oAuthProviders.length > 0
              ? oAuthProviders.map((provider) => (
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
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        {getProviderIcon(provider.id)}
                        <span className="ml-3">
                          Continue with {provider.name}
                        </span>
                      </div>
                    )}
                  </Button>
                ))
              : null}

            {oAuthProviders.length > 0 && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    or
                  </span>
                </div>
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required={!isLogin}
                    data-testid="input-name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={
                      isLogin
                        ? "Enter your password"
                        : "Create a password (min 6 characters)"
                    }
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    minLength={6}
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={credentialsLoading}
                data-testid={`button-${isLogin ? "signin" : "signup"}`}
              >
                {credentialsLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isLogin ? "Signing In..." : "Creating Account..."}
                  </>
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Toggle between login/register */}
            <div className="text-center">
              <Button
                variant="link"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({ name: "", email: "", password: "" });
                }}
                data-testid="button-toggle-auth-mode"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                By signing in, you agree to our terms of service and privacy
                policy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<SignInProps> = async (
  context
) => {
  const session = await getSession(context);

  if (session) {
    return {
      redirect: {
        destination: (context.query.callbackUrl as string) || "/",
        permanent: false,
      },
    };
  }

  const providers = await getProviders();

  return {
    props: {
      providers: providers ?? {},
      callbackUrl: (context.query.callbackUrl as string) || null,
    },
  };
};
