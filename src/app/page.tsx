
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FirebaseClientProvider, useUser, useAuth } from "@/firebase";

function LoginPageContent() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Redireciona se o usuário já estiver logado
  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace("/admin/dashboard");
    }
  }, [user, isUserLoading, router]);

  const email = "test@docecaixa.com";
  const password = "password123";

  const handleLogin = async () => {
    if (!auth) return;
    setIsLoggingIn(true);
    setError(null);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // O useEffect cuidará do redirecionamento quando o estado do usuário for atualizado.
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          // O useEffect cuidará do redirecionamento.
        } catch (creationError: any) {
          setError(`Falha ao criar usuário de teste: ${creationError.message}`);
          setIsLoggingIn(false);
        }
      } else {
        setError(`Erro de autenticação: ${err.message}`);
        setIsLoggingIn(false);
      }
    }
    // Não definimos setIsLoggingIn(false) aqui, pois o redirecionamento deve acontecer.
    // Ele será setado como false se um erro ocorrer.
  };

  // Mostra um loader enquanto a verificação inicial de autenticação ocorre
  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Verificando sessão...</p>
      </div>
    );
  }

  // Se não estiver carregando e não houver usuário, mostra o formulário de login
  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Doce Caixa</CardTitle>
          <CardDescription>
            Use o login de teste para acessar o painel.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={email} readOnly disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" value={password} readOnly disabled />
          </div>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin} disabled={isLoggingIn}>
            {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// O provider precisa envolver a página para que os hooks do Firebase funcionem
export default function LoginPage() {
    return (
        <FirebaseClientProvider>
            <LoginPageContent />
        </FirebaseClientProvider>
    );
}
