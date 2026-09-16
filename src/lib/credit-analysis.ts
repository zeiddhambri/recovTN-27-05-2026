// Shared response types for the AI credit engines
// (Supabase edge functions `credit-decision` and `ifrs9-engine`).
// Every field is optional: the model may omit sections when data is missing.

export interface PilierAnalyse {
  id: number | string;
  nom: string;
  ponderation?: number;
  score_numerique: number;
  score_qualitatif?: string;
  analyse?: string;
  justification?: string;
  indicateurs_cles?: Record<string, string | number>;
}

export interface RedFlagAnalyse {
  niveau?: string;
  type?: string;
  impact_score?: string | number;
  description?: string;
}

export interface FacteurFavorable {
  type?: string;
  impact_score?: string | number;
  description?: string;
}

export interface ConditionSuggeree {
  priorite?: string;
  type?: string;
  description?: string;
  /** IFRS 9 engine only: accounting rationale attached to the condition. */
  lien_ifrs9?: string;
}

export interface ScoringGlobal {
  score?: number;
  calcul_detail?: string;
  niveau_confiance?: number;
  pd_estimee?: string;
  lgd_estimee?: string;
}

export interface AuditTrail {
  version_moteur?: string;
  timestamp_analyse?: string;
  logique_decisionnelle?: string;
  conformite?: string;
  hypotheses_appliquees?: string[];
}

export interface DonneesAnalysees {
  donnees_manquantes?: string[];
  variables_forward_looking?: string[];
}

export interface ResumeAnalyse {
  niveau_risque_global?: string;
  recommandation_synthetique?: string;
  bucket_anticipe?: string;
  sppi_statut?: string;
  evaluation_comptable?: string;
}

export interface RecommandationAnalyse {
  decision?: string;
  escalade_requise?: boolean;
}

export interface Ifrs9Bloc {
  test_sppi?: { resultat?: string; consequence_comptable?: string; clauses_evaluees?: string[] };
  classification_bucket?: { bucket?: string; horizon_ecl?: string; justification?: string; impact_provisionnement?: string };
  asrc?: { sicr_detecte?: boolean; justification?: string; retard_jours?: number; indicateurs?: string[] };
  forward_looking?: { scenario_central?: string; scenario_baissier?: string; scenario_haussier?: string; impact_pd?: string };
  modifications?: { restructuration_detectee?: boolean; test_decomptabilisation?: string; impact_resultat?: string };
}

export interface CreditAnalysis {
  resume?: ResumeAnalyse;
  recommandation?: RecommandationAnalyse;
  scoring_global?: ScoringGlobal;
  piliers?: PilierAnalyse[];
  red_flags?: RedFlagAnalyse[];
  facteurs_favorables?: FacteurFavorable[];
  conditions_suggerees?: ConditionSuggeree[];
  donnees_analysees?: DonneesAnalysees;
  audit_trail?: AuditTrail;
  /** Only present for the IFRS 9 engine. */
  ifrs9?: Ifrs9Bloc;
}
