
"use client";

import React, { Suspense, useEffect } from 'react';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  NotebookPen,
  CakeSlice,
  User,
  Terminal,
  Calculator,
  Activity,
  House,
  LogOut,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarTrigger, SidebarProvider } from '@/components/ui/sidebar';
import { ActiveLink } from '@/app/admin/active-link';
import DynamicHeader from '@/app/admin/dynamic-header';
import { useUser, useAuth } from '@/firebase';
import { SidebarInset } from '@/components/ui/sidebar';
import { SyncStatusBadge } from '@/components/admin/sync-status-badge';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import Loading from '@/app/admin/loading';

const primaryNav = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/recipes", label: "Receitas", icon: NotebookPen },
    { href: "/admin/inventory", label: "Estoque", icon: Warehouse },
    { href: "/admin/orders", label: "Vendas", icon: Terminal },
    { href: "/admin/cash-flow", label: "Financeiro", icon: DollarSign },
];

const secondaryNav = [
    { href: "/admin/products", label: "Produtos", icon: Package },
    { href: "/admin/calculator", label: "Calculadora", icon: Calculator },
    { href: "/admin/operations", label: "Operações", icon: Activity },
];

export default function AdminPanel({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { user } = useUser();
    const auth = useAuth();
    const router = useRouter();

    useEffect(() => {
        console.time(`Page Transition to ${pathname}`);
        return () => {
            console.timeEnd(`Page Transition to ${pathname}`);
        };
    }, [pathname]);


    const handleSignOut = async () => {
        if (auth) {
            await signOut(auth);
        }
        router.push('/');
    }

    return (
        <div className="h-full">
            <SidebarProvider>
                <div className="group/sidebar-wrapper flex h-full w-full">
                    <Sidebar>
                        <SidebarHeader>
                            <div className="flex items-center gap-3 p-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                    <CakeSlice className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-headline text-xl font-bold text-foreground">Doce Caixa</span>
                                    <span className="text-xs text-muted-foreground">Painel PRO</span>
                                </div>
                            </div>
                        </SidebarHeader>
                        <SidebarContent>
                            <div className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/60">
                                Menu principal
                            </div>
                            <SidebarMenu>
                                {primaryNav.map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <ActiveLink href={item.href}>
                                            <item.icon />
                                            {item.label}
                                        </ActiveLink>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                            <Separator className="my-2 bg-sidebar-border/60" />
                            <div className="px-3 pt-1 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/60">
                                Mais ferramentas
                            </div>
                            <SidebarMenu>
                                {secondaryNav.map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <ActiveLink href={item.href}>
                                            <item.icon />
                                            {item.label}
                                        </ActiveLink>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarContent>
                        <SidebarFooter>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                <Button onClick={handleSignOut} variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-xl">
                                    <LogOut />
                                    Sair do Painel
                                </Button>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarFooter>
                    </Sidebar>
                    <SidebarInset>
                        <header className="flex h-20 items-center justify-between px-4 sm:px-6 md:px-8 border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-30">
                            <div className="flex items-center gap-2">
                                <SidebarTrigger className="md:hidden"/>
                                {pathname !== '/admin/dashboard' && (
                                <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                                    <Link href="/admin/dashboard"><House className="h-5 w-5"/></Link>
                                </Button>
                                )}
                            </div>
                            <div className="flex-1 flex justify-center">
                                <DynamicHeader />
                            </div>
                            <div className="flex items-center justify-end gap-4">
                                <SyncStatusBadge />
                                <Avatar className="h-10 w-10 border-2 border-primary/50 shadow-md">
                                    <AvatarFallback className="bg-muted text-foreground font-bold">
                                        {user?.email ? user.email.charAt(0).toUpperCase() : <User />}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        </header>
                         <main className="flex flex-1 flex-col">
                            <div className="flex flex-1 p-4 pb-28 sm:p-6 md:p-8 w-full min-w-0 md:pb-8">
                                <Suspense fallback={<Loading />}>
                                    {children}
                                </Suspense>
                            </div>
                        </main>
                        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm pb-safe md:hidden">
                            <div className="grid grid-cols-5 gap-1 px-1 py-2">
                                {primaryNav.map((item) => {
                                    const isActive = pathname.startsWith(item.href);
                                    return (
                                        <Button
                                            key={item.href}
                                            asChild
                                            variant={isActive ? "default" : "ghost"}
                                            size="sm"
                                            className="h-16 flex-col gap-1 rounded-xl text-[11px]"
                                        >
                                            <Link href={item.href}>
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.label}</span>
                                            </Link>
                                        </Button>
                                    );
                                })}
                            </div>
                        </nav>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    );
}
