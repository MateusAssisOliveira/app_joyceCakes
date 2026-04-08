'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw, Users, Building2, Database } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { useActiveTenant } from '@/hooks/use-active-tenant';
import {
  createTenant,
  getTenantMembers,
  importSyncServerDataToTenant,
  inviteTenantMemberByUid,
  listUserTenants,
  migrateLegacyDataToTenant,
  switchActiveTenant,
} from '@/services';
import type { Tenant, TenantMember, TenantRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TenantsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { activeTenantId } = useActiveTenant();
  const { toast } = useToast();
  const router = useRouter();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isCreatingTenant, setIsCreatingTenant] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isImportingSyncServer, setIsImportingSyncServer] = useState(false);

  const [newTenantName, setNewTenantName] = useState('');
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole, setInviteRole] = useState<TenantRole>('staff');
  const [migrationSummary, setMigrationSummary] = useState<string | null>(null);
  const [syncServerImportSummary, setSyncServerImportSummary] = useState<string | null>(null);

  const activeTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === activeTenantId) || null,
    [tenants, activeTenantId]
  );

  const reloadTenants = async () => {
    if (!user) return;
    setIsLoadingTenants(true);
    try {
      const nextTenants = await listUserTenants(firestore, user.uid);
      setTenants(nextTenants);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao carregar tenants', description: error.message });
    } finally {
      setIsLoadingTenants(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    reloadTenants();
  }, [user]);

  useEffect(() => {
    const run = async () => {
      if (!activeTenantId) {
        setMembers([]);
        return;
      }
      setIsLoadingMembers(true);
      try {
        const list = await getTenantMembers(firestore, activeTenantId);
        setMembers(list);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro ao carregar membros', description: error.message });
      } finally {
        setIsLoadingMembers(false);
      }
    };

    run();
  }, [activeTenantId]);

  const handleCreateTenant = async () => {
    if (!user) return;
    const normalizedName = newTenantName.trim();
    if (!normalizedName) {
      toast({ variant: 'destructive', title: 'Nome obrigatorio', description: 'Informe um nome para o tenant.' });
      return;
    }

    setIsCreatingTenant(true);
    try {
      await createTenant(firestore, user, normalizedName);
      setNewTenantName('');
      await reloadTenants();
      toast({ title: 'Tenant criado', description: `"${normalizedName}" foi criado com sucesso.` });
      router.refresh();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao criar tenant', description: error.message });
    } finally {
      setIsCreatingTenant(false);
    }
  };

  const handleSwitchTenant = async (tenantId: string) => {
    if (!user) return;
    try {
      await switchActiveTenant(firestore, user.uid, tenantId);
      toast({ title: 'Tenant ativo atualizado' });
      router.refresh();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao trocar tenant', description: error.message });
    }
  };

  const handleInviteMember = async () => {
    if (!activeTenantId) return;
    const normalizedUserId = inviteUserId.trim();
    if (!normalizedUserId) {
      toast({ variant: 'destructive', title: 'UID obrigatorio', description: 'Informe o UID do usuario.' });
      return;
    }

    setIsInviting(true);
    try {
      await inviteTenantMemberByUid(firestore, activeTenantId, normalizedUserId, inviteRole);
      setInviteUserId('');
      const list = await getTenantMembers(firestore, activeTenantId);
      setMembers(list);
      toast({ title: 'Membro adicionado', description: `UID ${normalizedUserId} agora faz parte do tenant.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao convidar membro', description: error.message });
    } finally {
      setIsInviting(false);
    }
  };

  const handleLegacyMigration = async () => {
    if (!user || !activeTenantId) return;

    setIsMigrating(true);
    try {
      const report = await migrateLegacyDataToTenant(firestore, user.uid, activeTenantId);
      const summary = `products:${report.products} supplies:${report.supplies} history:${report.suppliesPriceHistory} sheets:${report.technicalSheets} orders:${report.orders} cash:${report.cashRegisters} moves:${report.financialMovements}`;
      setMigrationSummary(summary);
      toast({ title: 'Migracao concluida', description: 'Dados legados migrados para o tenant ativo.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro na migracao', description: error.message });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSyncServerImport = async () => {
    if (!user || !activeTenantId) return;

    setIsImportingSyncServer(true);
    try {
      const report = await importSyncServerDataToTenant(firestore, user.uid, activeTenantId);
      const summary = `products:${report.products} supplies:${report.supplies} orders:${report.orders} sheets:${report.technicalSheets}`;
      setSyncServerImportSummary(summary);
      toast({ title: 'Importacao concluida', description: 'Dados do Sync Server importados para o tenant ativo.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro na importacao do sync server', description: error.message });
    } finally {
      setIsImportingSyncServer(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Tenant Ativo</CardTitle>
          <CardDescription>Troque entre tenants que voce participa.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {isLoadingTenants ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando tenants...</div>
          ) : (
            <>
              <Select value={activeTenantId || undefined} onValueChange={handleSwitchTenant}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2">
                {tenants.map((tenant) => (
                  <Badge key={tenant.id} variant={tenant.id === activeTenantId ? 'default' : 'outline'}>
                    {tenant.name}
                  </Badge>
                ))}
              </div>
              <Button variant="outline" onClick={reloadTenants} className="w-fit">
                <RefreshCw className="mr-2 h-4 w-4" /> Atualizar lista
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Tenant</CardTitle>
          <CardDescription>Crie uma nova empresa/operacao e torne-a ativa.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:max-w-md">
          <Label htmlFor="new-tenant-name">Nome</Label>
          <Input id="new-tenant-name" value={newTenantName} onChange={(e) => setNewTenantName(e.target.value)} placeholder="Ex: Joyce Cakes Filial 2" />
          <Button onClick={handleCreateTenant} disabled={isCreatingTenant}>
            {isCreatingTenant && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar tenant
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Membros do Tenant</CardTitle>
          <CardDescription>Convite por UID (sem email por enquanto).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label htmlFor="invite-user-id">UID do usuario</Label>
              <Input id="invite-user-id" value={inviteUserId} onChange={(e) => setInviteUserId(e.target.value)} placeholder="uid_do_usuario" />
            </div>
            <div>
              <Label htmlFor="invite-role">Papel</Label>
              <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as TenantRole)}>
                <SelectTrigger id="invite-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="staff">staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleInviteMember} disabled={!activeTenantId || isInviting} className="w-fit">
            {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Convidar membro
          </Button>

          {isLoadingMembers ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando membros...</div>
          ) : (
            <div className="grid gap-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded border p-2 text-sm">
                  <span>{member.userId}</span>
                  <Badge variant="outline">{member.role}</Badge>
                </div>
              ))}
              {members.length === 0 && <p className="text-sm text-muted-foreground">Nenhum membro encontrado.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Migracao de Dados Legados</CardTitle>
          <CardDescription>Migra dados de colecoes antigas para o tenant ativo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Button onClick={handleLegacyMigration} disabled={!activeTenantId || isMigrating} className="w-fit">
            {isMigrating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Executar migracao
          </Button>
          {migrationSummary && (
            <p className="text-sm text-muted-foreground">Resumo: {migrationSummary}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Dica: execute uma vez por tenant apos atualizar para o modelo SaaS.
          </p>
          {activeTenant && (
            <Badge variant="secondary" className="w-fit">Tenant alvo: {activeTenant.name}</Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Importar do Sync Server</CardTitle>
          <CardDescription>Importa dados do Postgres local via /api/sync para o tenant ativo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Button onClick={handleSyncServerImport} disabled={!activeTenantId || isImportingSyncServer} className="w-fit">
            {isImportingSyncServer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Importar do sync server
          </Button>
          {syncServerImportSummary && (
            <p className="text-sm text-muted-foreground">Resumo: {syncServerImportSummary}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Fonte: {process.env.NEXT_PUBLIC_SYNC_SERVER || 'http://localhost:4000'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
