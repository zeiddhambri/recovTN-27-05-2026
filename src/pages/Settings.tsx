import { useEffect, useState } from 'react';
import { Users, Shield, UserCog, Search, Scale, Zap, Bell, AlertTriangle, FileWarning, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import DemoBanner from '@/components/DemoBanner';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: string;
}

const ROLES = [
  { value: 'admin', label: 'Administrateur', color: 'text-red-500 bg-red-50' },
  { value: 'recouvreur', label: 'Recouvreur', color: 'text-blue-600 bg-blue-50' },
  { value: 'gestionnaire contentieux', label: 'Gestionnaire Contentieux', color: 'text-purple-500 bg-purple-50' },
  { value: 'directeur', label: 'Directeur', color: 'text-orange-500 bg-orange-50' },
  { value: 'comite', label: 'Comité', color: 'text-emerald-500 bg-emerald-50' },
  { value: 'viewer', label: 'Lecteur', color: 'text-gray-500 bg-gray-50' },
];

/** Map Supabase `app_role` enum values to display roles. */
const DB_ROLE_MAP: Record<string, string> = {
  admin: 'admin',
  manager: 'directeur',
  agent: 'recouvreur',
};

const mockUsers: UserProfile[] = [
  { uid: '1', email: 'admin@recovtn.com', displayName: 'Admin Principal', role: 'admin' },
  { uid: '2', email: 'slim.mansour@recovtn.com', displayName: 'Slim Mansour', role: 'recouvreur' },
  { uid: '3', email: 'amel.ben@recovtn.com', displayName: 'Amel Ben Ali', role: 'gestionnaire contentieux' },
  { uid: '4', email: 'karim.dir@recovtn.com', displayName: 'Karim Directeur', role: 'directeur' },
  { uid: '5', email: 'comite@recovtn.com', displayName: 'Membre Comité', role: 'comite' },
];

export default function Settings() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [dossierCount, setDossierCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      setUsers([]);
      return;
    }
    (async () => {
      try {
        const [{ data: profiles }, { data: roles }, { count }] = await Promise.all([
          supabase.from('profiles').select('id, email, full_name'),
          supabase.from('user_roles').select('user_id, role'),
          supabase.from('dossiers').select('id', { count: 'exact', head: true }),
        ]);
        setDossierCount(count ?? 0);
        if (!profiles || profiles.length === 0) {
          setUsers([]);
          return;
        }
        const roleByUser = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
        setUsers(
          profiles.map((p) => ({
            uid: p.id,
            email: p.email,
            displayName: p.full_name || p.email,
            role: DB_ROLE_MAP[roleByUser.get(p.id) ?? ''] ?? 'viewer',
          }))
        );
      } catch {
        setUsers([]);
      }
    })();
  }, [user]);

  const isDemo = users !== null && users.length === 0;
  const displayed = isDemo ? mockUsers : (users ?? []);

  const filteredUsers = displayed.filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-navy tracking-tight font-syne">Paramètres d'administration</h1>
          <p className="text-muted-foreground mt-1">Gérez les utilisateurs et les rôles de votre organisation.</p>
        </div>
      </div>

      {isDemo && <DemoBanner text="Aucun utilisateur synchronisé — liste d'exemple affichée à titre illustratif." />}

      <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
        <Info size={18} className="shrink-0 mt-0.5" aria-hidden />
        <p>
          La modification des rôles est réservée à l'administrateur système et sera activée prochainement. Les rôles
          affichés sont en lecture seule.
        </p>
      </div>

      <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
              <Users size={20} className="text-white" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy font-syne">Gestion des utilisateurs</h2>
              <p className="text-xs text-muted-foreground">{displayed.length} utilisateurs enregistrés</p>
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="text"
              placeholder="Rechercher..."
              aria-label="Rechercher un utilisateur"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-mist border border-border text-sm focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                <th scope="col" className="text-left p-4">Utilisateur</th>
                <th scope="col" className="text-left p-4">Email</th>
                <th scope="col" className="text-left p-4">Rôle actuel</th>
                <th scope="col" className="text-left p-4">Modifier le rôle</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const currentRole = ROLES.find((r) => r.value === u.role);
                return (
                  <tr key={u.uid} className="border-b border-border hover:bg-mist transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold">
                          {(u.displayName[0] || '?').toUpperCase()}
                        </div>
                        <span className="font-bold text-sm text-navy">{u.displayName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{u.email}</td>
                    <td className="p-4">
                      <span className={cn('text-xs font-bold px-3 py-1 rounded-full', currentRole?.color ?? 'bg-muted text-muted-foreground')}>
                        {currentRole?.label ?? u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        value={u.role}
                        disabled
                        title="Modification des rôles bientôt disponible — contactez l'administrateur système."
                        aria-label={`Rôle de ${u.displayName} (lecture seule)`}
                        className="px-3 py-1.5 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed"
                      >
                        {ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-card rounded-3xl p-8 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-sky/10 flex items-center justify-center">
              <Shield size={20} className="text-sky" aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-navy font-syne">Rôles & Permissions</h3>
          </div>
          <div className="space-y-3">
            {ROLES.map((role) => (
              <div key={role.value} className="flex items-center justify-between p-3 bg-mist rounded-xl">
                <span className={cn('text-xs font-bold px-3 py-1 rounded-full', role.color)}>{role.label}</span>
                <span className="text-xs text-muted-foreground">
                  {displayed.filter((x) => x.role === role.value).length} utilisateur(s)
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-3xl p-8 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <UserCog size={20} className="text-amber-600" aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-navy font-syne">Organisation</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-mist rounded-xl">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Nom</p>
              <p className="text-sm font-bold text-navy">RecovTN — Organisation par défaut</p>
            </div>
            <div className="p-4 bg-mist rounded-xl">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Plan actif</p>
              <p className="text-sm font-bold text-sky">Évaluation</p>
            </div>
            <div className="p-4 bg-mist rounded-xl">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Dossiers</p>
              <p className="text-sm font-bold text-navy">{dossierCount === null ? '…' : dossierCount}</p>
            </div>
          </div>
        </div>
      </div>

      <LitigationTriggers />
    </div>
  );
}

// ═══════════════════════════════════════════
// LITIGATION TRIGGERS (persisted locally)
// ═══════════════════════════════════════════
const TRIGGERS_INITIAL = [
  {
    id: 'auto_open_case',
    icon: Scale,
    title: 'Ouverture automatique de dossier contentieux',
    description: 'Crée un dossier contentieux quand un débiteur passe en statut critique avec un retard > 90 jours.',
    enabled: true,
    conditions: { riskLevel: 'critique', daysOverdue: 90 },
  },
  {
    id: 'auto_mise_demeure',
    icon: FileWarning,
    title: 'Envoi automatique de la mise en demeure',
    description:
      "Génère et envoie la mise en demeure quand toutes les actions amiables sont épuisées et qu'aucune réponse n'a été reçue depuis 30 jours.",
    enabled: true,
    conditions: { actionsExhausted: true, noResponseDays: 30 },
  },
  {
    id: 'notify_lawyer_judgment',
    icon: Bell,
    title: "Notification de l'avocat sur jugement obtenu",
    description:
      "Alerte l'avocat assigné dès qu'un dossier passe en étape « Jugement obtenu » pour démarrer la phase d'exécution.",
    enabled: true,
    conditions: { stage: 'judgment_obtained' },
  },
  {
    id: 'escalate_hearing',
    icon: AlertTriangle,
    title: 'Escalade J-7 sans préparation',
    description:
      "Escalade au gestionnaire si une audience approche dans moins de 7 jours et qu'aucune note de préparation n'a été ajoutée.",
    enabled: false,
    conditions: { daysBeforeHearing: 7, requiresPrepNotes: true },
  },
];

const TRIGGERS_STORAGE_KEY = 'recovtn:litigation-triggers';

function loadTriggers() {
  try {
    const raw = localStorage.getItem(TRIGGERS_STORAGE_KEY);
    if (!raw) return TRIGGERS_INITIAL;
    const saved = JSON.parse(raw) as Record<string, boolean>;
    return TRIGGERS_INITIAL.map((t) => ({ ...t, enabled: saved[t.id] ?? t.enabled }));
  } catch {
    return TRIGGERS_INITIAL;
  }
}

function LitigationTriggers() {
  const [triggers, setTriggers] = useState(loadTriggers);

  const toggle = (id: string) => {
    const next = triggers.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x));
    setTriggers(next);
    try {
      localStorage.setItem(
        TRIGGERS_STORAGE_KEY,
        JSON.stringify(Object.fromEntries(next.map((t) => [t.id, t.enabled])))
      );
    } catch {
      /* storage unavailable — state still applies for this session */
    }
  };

  return (
    <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
      <div className="p-6 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--crimson))]/10 flex items-center justify-center">
          <Zap size={20} className="text-[hsl(var(--crimson))]" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-bold text-navy font-syne">Déclencheurs contentieux</h2>
          <p className="text-xs text-muted-foreground">
            Règles d'automatisation pour le module Litigation — enregistrées localement sur ce poste.
          </p>
        </div>
      </div>

      <div className="divide-y divide-border">
        {triggers.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.id} className="p-5 flex items-start gap-4">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  t.enabled ? 'bg-[hsl(var(--crimson))]/10 text-[hsl(var(--crimson))]' : 'bg-muted text-muted-foreground'
                )}
              >
                <Icon size={18} aria-hidden />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-sm text-navy">{t.title}</p>
                  <button
                    onClick={() => toggle(t.id)}
                    role="switch"
                    aria-checked={t.enabled}
                    aria-label={t.title}
                    className={cn(
                      'relative w-11 h-6 rounded-full transition flex-shrink-0',
                      t.enabled ? 'bg-[hsl(var(--crimson))]' : 'bg-muted'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
                        t.enabled ? 'translate-x-5' : 'translate-x-0.5'
                      )}
                    />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {Object.entries(t.conditions).map(([k, v]) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-mist text-[10px] font-bold text-navy"
                    >
                      {k} = <span className="text-[hsl(var(--crimson))]">{String(v)}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-mist border-t border-border flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {triggers.filter((t) => t.enabled).length} sur {triggers.length} déclencheurs actifs
        </span>
        <button
          onClick={() => toast({ title: 'Bientôt disponible', description: 'La création de déclencheurs personnalisés arrive prochainement.' })}
          className="font-bold text-[hsl(var(--crimson))] hover:underline"
        >
          + Nouveau déclencheur
        </button>
      </div>
    </div>
  );
}
