import { useState } from 'react';
import { Gavel, Calendar, Users, Clock, Plus, Search, CheckCircle2, User, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface LegalEvent {
  id: string;
  title: string;
  date: string;
  type: 'audience' | 'deadline' | 'visit' | 'judgment';
  status: 'pending' | 'completed' | 'cancelled';
}

interface LegalPartner {
  id: string;
  name: string;
  type: 'avocat' | 'huissier';
  email: string;
  phone: string;
  activeCases: number;
}

const mockEvents: LegalEvent[] = [
  { id: '1', title: 'Audience TPI Tunis — Dossier ALPHA', date: '2024-03-25', type: 'audience', status: 'pending' },
  { id: '2', title: 'Délai appel jugement Ben Salem', date: '2024-03-28', type: 'deadline', status: 'pending' },
  { id: '3', title: 'Visite huissier — Global Tech', date: '2024-04-01', type: 'visit', status: 'pending' },
  { id: '4', title: 'Jugement rendu — Karim Enterprises', date: '2024-03-10', type: 'judgment', status: 'completed' },
  { id: '5', title: 'Audience Cour d\'Appel — Mediteranee', date: '2024-04-05', type: 'audience', status: 'pending' },
];

const mockPartners: LegalPartner[] = [
  { id: '1', name: 'Maître Slim Belhaj', type: 'avocat', email: 'slim.belhaj@avocats.tn', phone: '+216 71 234 567', activeCases: 12 },
  { id: '2', name: 'Maître Amel Trabelsi', type: 'avocat', email: 'amel.trabelsi@avocats.tn', phone: '+216 71 345 678', activeCases: 8 },
  { id: '3', name: 'Huissier Mohamed Karray', type: 'huissier', email: 'karray.huissier@tn', phone: '+216 71 456 789', activeCases: 15 },
];

const typeColors: Record<string, string> = {
  audience: 'text-sky bg-sky/10',
  deadline: 'text-red-500 bg-red-50',
  visit: 'text-gold bg-gold/10',
  judgment: 'text-green-500 bg-green-50',
};

const typeLabels: Record<string, string> = {
  audience: 'Audience',
  deadline: 'Délai',
  visit: 'Visite',
  judgment: 'Jugement',
};

export default function LegalTracking() {
  const [activeTab, setActiveTab] = useState<'agenda' | 'partners'>('agenda');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-navy tracking-tight font-syne">Gestion Des Dossiers Contentieux</h1>
          <p className="text-muted-foreground mt-1">Agenda judiciaire et gestion des intervenants juridiques.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-sky text-white rounded-xl text-sm font-bold hover:bg-sky/90 transition-all shadow-lg shadow-sky/20">
          <Plus size={18} />
          Nouvel événement
        </button>
      </div>

      <div className="flex gap-2">
        {[
          { key: 'agenda', label: 'Agenda Judiciaire', icon: Calendar },
          { key: 'partners', label: 'Intervenants', icon: Users },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'agenda' | 'partners')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === tab.key ? "bg-navy text-white" : "bg-card border border-border text-muted-foreground hover:bg-mist"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'agenda' ? (
        <div className="space-y-4">
          {mockEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl p-6 border border-border hover:shadow-md transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", typeColors[event.type])}>
                  {event.type === 'audience' && <Gavel size={20} />}
                  {event.type === 'deadline' && <Clock size={20} />}
                  {event.type === 'visit' && <User size={20} />}
                  {event.type === 'judgment' && <CheckCircle2 size={20} />}
                </div>
                <div>
                  <p className="font-bold text-navy text-sm">{event.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} />{event.date}</span>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest", typeColors[event.type])}>
                      {typeLabels[event.type]}
                    </span>
                  </div>
                </div>
              </div>
              <div className={cn(
                "text-xs font-bold px-3 py-1 rounded-full",
                event.status === 'completed' ? 'text-green-500 bg-green-50' : event.status === 'cancelled' ? 'text-red-500 bg-red-50' : 'text-gold bg-gold/10'
              )}>
                {event.status === 'completed' ? 'Terminé' : event.status === 'cancelled' ? 'Annulé' : 'En attente'}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockPartners.map((partner, i) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-3xl p-6 border border-border hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-navy flex items-center justify-center text-white font-bold">
                  {partner.name[0]}
                </div>
                <div>
                  <p className="font-bold text-navy text-sm">{partner.name}</p>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    partner.type === 'avocat' ? 'text-sky' : 'text-gold'
                  )}>
                    {partner.type}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Mail size={14} />{partner.email}</div>
                <div className="flex items-center gap-2"><Phone size={14} />{partner.phone}</div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <span className="text-xs font-bold text-navy">{partner.activeCases} dossiers actifs</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
