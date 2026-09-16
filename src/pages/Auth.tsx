import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';

const emailSchema = z.string().trim().email({ message: 'Adresse email invalide' }).max(255);
const passwordSchema = z
  .string()
  .min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  .max(72, { message: 'Mot de passe trop long' });
const nameSchema = z.string().trim().min(2, { message: 'Nom trop court' }).max(100);

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const redirectTo = (location.state as { from?: string } | null)?.from || '/aujourdhui';

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [submitting, setSubmitting] = useState(false);

  // Sign in
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign up
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) navigate(redirectTo, { replace: true });
  }, [user, authLoading, navigate, redirectTo]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Format validation
    const emailParse = emailSchema.safeParse(signInEmail);
    if (!emailParse.success) {
      toast({ title: 'Email invalide', description: emailParse.error.issues[0].message, variant: 'destructive' });
      return;
    }
    if (!signInPassword) {
      toast({ title: 'Mot de passe requis', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    // 2. Attempt authentication
    const { error } = await supabase.auth.signInWithPassword({
      email: emailParse.data,
      password: signInPassword,
    });
    setSubmitting(false);

    if (error) {
      // 3. Map errors to clear messages
      const msg = error.message.toLowerCase();
      if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        toast({ title: 'Identifiants incorrects', description: 'Email ou mot de passe invalide.', variant: 'destructive' });
      } else if (msg.includes('email not confirmed')) {
        toast({ title: 'Email non confirmé', description: 'Vérifiez votre boîte mail.', variant: 'destructive' });
      } else {
        toast({ title: 'Échec de connexion', description: error.message, variant: 'destructive' });
      }
      return;
    }

    toast({ title: 'Bienvenue', description: 'Connexion réussie.' });
    navigate(redirectTo, { replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameParse = nameSchema.safeParse(signUpName);
    if (!nameParse.success) {
      toast({ title: 'Nom invalide', description: nameParse.error.issues[0].message, variant: 'destructive' });
      return;
    }
    const emailParse = emailSchema.safeParse(signUpEmail);
    if (!emailParse.success) {
      toast({ title: 'Email invalide', description: emailParse.error.issues[0].message, variant: 'destructive' });
      return;
    }
    const pwParse = passwordSchema.safeParse(signUpPassword);
    if (!pwParse.success) {
      toast({ title: 'Mot de passe invalide', description: pwParse.error.issues[0].message, variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: emailParse.data,
      password: pwParse.data,
      options: {
        emailRedirectTo: `${window.location.origin}/aujourdhui`,
        data: { full_name: nameParse.data },
      },
    });
    setSubmitting(false);

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('user already')) {
        toast({ title: 'Compte déjà existant', description: 'Connectez-vous avec votre mot de passe.', variant: 'destructive' });
        setTab('signin');
        setSignInEmail(emailParse.data);
      } else if (msg.includes('pwned') || msg.includes('compromised')) {
        toast({ title: 'Mot de passe compromis', description: 'Ce mot de passe a fuité. Choisissez-en un autre.', variant: 'destructive' });
      } else {
        toast({ title: 'Inscription échouée', description: error.message, variant: 'destructive' });
      }
      return;
    }

    toast({ title: 'Compte créé', description: 'Vous êtes maintenant connecté.' });
    navigate('/aujourdhui', { replace: true });
  };

  return (
    <div className="min-h-screen bg-paper-soft flex flex-col">
      <header className="container-atr py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-charcoal hover:text-crimson transition-colors">
          <ArrowLeft size={16} /> Retour à l'accueil
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md bg-white border border-border rounded-sm shadow-sm p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-crimson text-2xl">✦</span>
            <span className="font-serif-display text-2xl text-charcoal">RecovTN</span>
          </div>
          <h1 className="text-xl font-medium text-charcoal mb-1">Accès à la plateforme</h1>
          <p className="text-sm text-slate mb-6">Gestion du recouvrement bancaire</p>

          <Tabs value={tab} onValueChange={(v) => setTab(v as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Créer un compte</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="si-email">Email professionnel</Label>
                  <Input
                    id="si-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="si-password">Mot de passe</Label>
                  <Input
                    id="si-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Se connecter
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="su-name">Nom complet</Label>
                  <Input
                    id="su-name"
                    type="text"
                    autoComplete="name"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">Email professionnel</Label>
                  <Input
                    id="su-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-password">Mot de passe</Label>
                  <Input
                    id="su-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                  />
                  <p className="text-xs text-slate">Minimum 8 caractères. Évitez les mots de passe déjà compromis.</p>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Créer mon compte
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
