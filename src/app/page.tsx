"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { SupabaseProvider, useSupabase } from "@/supabase";

function LoginPageContent() {
  const router = useRouter();
  const { client, user, isLoading: isUserLoading } = useSupabase();
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState(process.env.NEXT_PUBLIC_DEFAULT_LOGIN_EMAIL || "");
  const [password, setPassword] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "ok" | "error">("checking");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : "nao configurado";

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace("/admin/dashboard");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    let active = true;

    client.auth
      .getSession()
      .then(({ error }) => {
        if (!active) return;
        setConnectionStatus(error ? "error" : "ok");
      })
      .catch(() => {
        if (!active) return;
        setConnectionStatus("error");
      });

    return () => {
      active = false;
    };
  }, [client]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Informe email e senha.");
      setErrorDetails(null);
      return;
    }

    setIsLoggingIn(true);
    setError(null);
    setErrorDetails(null);
    setInfo(null);

    try {
      const { error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        throw error;
      }
    } catch (err: any) {
      const msg = typeof err?.message === "string" ? err.message : "Falha no login.";
      const code = typeof err?.code === "string" ? err.code : null;
      const lowered = msg.toLowerCase();
      const isInvalidCredentials =
        code === "invalid_credentials" ||
        lowered.includes("invalid login credentials") ||
        lowered.includes("invalid credentials");

      setError(
        isInvalidCredentials
          ? "Email ou senha invalidos para este projeto Supabase."
          : `Erro de autenticacao: ${msg}`
      );
      setErrorDetails(code ? `codigo: ${code}` : msg);
      setIsLoggingIn(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Informe email e senha.");
      setErrorDetails(null);
      return;
    }
    if (password.trim().length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      setErrorDetails(null);
      return;
    }

    setIsLoggingIn(true);
    setError(null);
    setErrorDetails(null);
    setInfo(null);

    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) {
        throw error;
      }

      // Se "Confirm email" estiver ligado no Supabase, a session pode ser null.
      if (!data.session) {
        setInfo("Conta criada! Verifique seu email para confirmar e depois faça login.");
        setMode("login");
        setIsLoggingIn(false);
      }
      // Se vier session, o useEffect vai redirecionar automaticamente.
    } catch (err: any) {
      const msg = typeof err?.message === "string" ? err.message : "Falha ao criar conta.";
      setError(`Erro ao criar conta: ${msg}`);
      setErrorDetails(typeof err?.code === "string" ? `codigo: ${err.code}` : msg);
      setIsLoggingIn(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError("Informe o email para recuperar a senha.");
      setErrorDetails(null);
      return;
    }

    setIsLoggingIn(true);
    setError(null);
    setErrorDetails(null);
    setInfo(null);

    try {
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
      });
      if (error) {
        throw error;
      }
      setInfo("Enviamos as instrucoes de recuperacao para o email informado.");
      setMode("login");
    } catch (err: any) {
      const msg = typeof err?.message === "string" ? err.message : "Falha ao solicitar recuperacao.";
      setError(`Erro ao recuperar senha: ${msg}`);
      setErrorDetails(typeof err?.code === "string" ? `codigo: ${err.code}` : msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Verificando sessao...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Doce Caixa</CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Entre com sua conta para acessar o painel."
              : mode === "signup"
                ? "Crie sua conta para comecar a usar o sistema."
                : "Informe seu email para receber as instrucoes."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={mode === "login" ? "default" : "outline"}
              onClick={() => {
                setMode("login");
                setError(null);
                setInfo(null);
              }}
              disabled={isLoggingIn}
            >
              Entrar
            </Button>
            <Button
              type="button"
              variant={mode === "signup" ? "default" : "outline"}
              onClick={() => {
                setMode("signup");
                setError(null);
                setInfo(null);
              }}
              disabled={isLoggingIn}
            >
              Criar conta
            </Button>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoggingIn}
              autoComplete="email"
            />
          </div>
          {mode !== "reset" && (
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoggingIn}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (mode === "login") {
                      handleLogin();
                    } else {
                      handleSignUp();
                    }
                  }
                }}
              />
            </div>
          )}
          <Button
            type="button"
            variant="link"
            className="h-auto justify-self-start p-0 text-xs"
            onClick={() => {
              setMode(mode === "reset" ? "login" : "reset");
              setError(null);
              setInfo(null);
            }}
            disabled={isLoggingIn}
          >
            {mode === "reset" ? "Voltar para login" : "Esqueci minha senha"}
          </Button>
          {info && <p className="text-sm font-medium text-muted-foreground">{info}</p>}
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          {errorDetails && <p className="text-xs text-muted-foreground">Detalhe tecnico: {errorDetails}</p>}
          <div className="rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
            <p>Projeto Supabase: {supabaseHost}</p>
            <p>
              Conexao auth:{" "}
              {connectionStatus === "checking"
                ? "verificando"
                : connectionStatus === "ok"
                  ? "ok"
                  : "falhou"}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={
              mode === "login"
                ? handleLogin
                : mode === "signup"
                  ? handleSignUp
                  : handlePasswordReset
            }
            disabled={isLoggingIn}
          >
            {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Recuperar senha"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <SupabaseProvider>
      <LoginPageContent />
    </SupabaseProvider>
  );
}
