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

/* -------------------------------- types -------------------------------- */

interface Provider {
  id: string;
  name: string;
  type: string;
}

interface SignInProps {
  providers: Record<string, Provider>;
  callbackUrl: string;
}

/* -------------------------------- page -------------------------------- */

export default function SignIn({ providers, callbackUrl }: SignInProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [credentialsLoading, setCredentialsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  /* ----------------------------- helpers ----------------------------- */

  const normalizeCallbackUrl = () => {
    if (!callbackUrl) return "/";
    if (callbackUrl.startsWith("http")) return callbackUrl;
    if (callbackUrl.startsWith("/")) return callbackUrl;
    return "/";
  };

  /* ----------------------------- OAuth ----------------------------- */

  const handleOAuthSignIn = async (providerId: string) => {
    setLoading(providerId);

    await signIn(providerId, {
      callbackUrl: normalizeCallbackUrl(),
    });
    // IMPORTANT:
    // Do NOT handle redirect manually
    // NextAuth handles OAuth redirects internally
  };

  /* ----------------------------- Credentials ----------------------------- */

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialsLoading(true);

    try {
      if (isLogin) {
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          toast({
            title: "Error",
            description: result.error || "Invalid credentials",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Signed in successfully",
          });

          router.push(normalizeCallbackUrl());
        }
      } else {
        // Register
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Registration failed");
        }

        toast({
          title: "Account created",
          description: "You can now sign in",
        });

        setIsLogin(true);
        setFormData({ name: "", email: "", password: "" });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setCredentialsLoading(false);
    }
  };

  /* ----------------------------- UI helpers ----------------------------- */

  const getProviderIcon = (id: string) => {
    if (id === "google") return <Mail className="h-5 w-5" />;
    if (id === "github") return <Github className="h-5 w-5" />;
    return null;
  };

  const oAuthProviders = Object.values(providers || {}).filter(
    (p) => p.id !== "credentials"
  );

  /* ----------------------------- render ----------------------------- */

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Head>
        <title>Sign In – Shoowflix</title>
        <meta
          name="description"
          content="Sign in to Shoowflix to save favorites and continue watching"
        />
      </Head>

      <div className="w-full max-w-md">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shoowflix
          </Button>
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isLogin ? "Welcome back" : "Create account"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to continue"
                : "Create an account to start watching"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* OAuth */}
            {oAuthProviders.map((provider) => (
              <Button
                key={provider.id}
                variant="outline"
                className="w-full"
                onClick={() => handleOAuthSignIn(provider.id)}
                disabled={loading === provider.id}
              >
                {loading === provider.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting…
                  </>
                ) : (
                  <>
                    {getProviderIcon(provider.id)}
                    <span className="ml-3">Continue with {provider.name}</span>
                  </>
                )}
              </Button>
            ))}

            {oAuthProviders.length > 0 && (
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 bg-background px-2 text-xs text-muted-foreground">
                  OR
                </span>
              </div>
            )}

            {/* Credentials */}
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              )}

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
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
              >
                {credentialsLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <Button
              variant="link"
              className="w-full"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ----------------------------- SSR ----------------------------- */

export const getServerSideProps: GetServerSideProps<SignInProps> = async (
  ctx
) => {
  const session = await getSession(ctx);

  const rawCallback =
    typeof ctx.query.callbackUrl === "string" ? ctx.query.callbackUrl : "/";

  const safeCallback = rawCallback.startsWith("/") ? rawCallback : "/";

  if (session) {
    return {
      redirect: {
        destination: safeCallback,
        permanent: false,
      },
    };
  }

  const providers = await getProviders();

  return {
    props: {
      providers: providers ?? {},
      callbackUrl: safeCallback,
    },
  };
};
