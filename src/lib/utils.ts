import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { TeamType } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converte o tipo de equipe para nome legível em português
 */
export function getTeamTypeLabel(teamType: TeamType | string | undefined | null): string {
  if (!teamType) return 'Sem Equipe';
  
  const labels: Record<string, string> = {
    'iniciante': 'Iniciante',
    'intermediario': 'Intermediário',
    'avancado': 'Avançado',
    'sem_equipe': 'Sem Equipe',
    // Compatibilidade com valores antigos
    'equipe_a': 'Avançado',
    'equipe_b': 'Iniciante',
  };
  
  return labels[teamType] || 'Sem Equipe';
}

/**
 * Obtém a descrição do tipo de equipe
 */
export function getTeamTypeDescription(teamType: TeamType | string | undefined | null): string {
  if (!teamType) return 'Sem equipe definida';
  
  const descriptions: Record<string, string> = {
    'iniciante': 'Nível iniciante - Suporte e aprendizado',
    'intermediario': 'Nível intermediário - Experiência moderada',
    'avancado': 'Nível avançado - Prioridade máxima',
    'sem_equipe': 'Sem equipe definida',
    // Compatibilidade com valores antigos
    'equipe_a': 'Nível avançado - Prioridade máxima',
    'equipe_b': 'Nível iniciante - Suporte',
  };
  
  return descriptions[teamType] || 'Sem equipe definida';
}
