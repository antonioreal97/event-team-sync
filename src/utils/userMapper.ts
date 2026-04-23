import { User } from '@/types';
import { normalizeTeamType } from '@/lib/teamDomain';

// Helper function to map Supabase user data to User type
export const mapSupabaseUserToUser = (dbUser: any): User => {
  const freelancerProfile = dbUser.freelancer_profile?.[0] || dbUser.freelancer_profiles?.[0];
  
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role as 'gestor' | 'freelancer',
    avatar: dbUser.avatar,
    isActive: dbUser.is_active,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
    teamType: freelancerProfile?.team_type
      ? normalizeTeamType(freelancerProfile.team_type)
      : undefined,
    phone: freelancerProfile?.phone,
    address: freelancerProfile?.address,
    city: freelancerProfile?.city,
    state: freelancerProfile?.state,
    cpf: freelancerProfile?.cpf,
    hourlyRate: freelancerProfile?.hourly_rate,
    dailyRate: freelancerProfile?.daily_rate,
    experienceLevel: (freelancerProfile?.experience_level as 'iniciante' | 'intermediario' | 'avancado' | 'expert') || 'iniciante',
    audioVisualRoles: (freelancerProfile?.audio_visual_roles as ('camera' | 'audio' | 'lighting' | 'director' | 'producer' | 'assistant' | 'technician' | 'streaming' | 'editing')[]) || [],
    bio: freelancerProfile?.bio,
    portfolio: freelancerProfile?.portfolio,
    linkedin: freelancerProfile?.linkedin,
    instagram: freelancerProfile?.instagram,
    website: freelancerProfile?.website,
    previousExperience: freelancerProfile?.previous_experience,
    certifications: freelancerProfile?.certifications || [],
    equipment: freelancerProfile?.equipment || [],
    languages: freelancerProfile?.languages || [],
    totalEventsAttended: freelancerProfile?.total_events_attended || 0,
    totalEarnings: freelancerProfile?.total_earnings || 0,
    averageRating: freelancerProfile?.average_rating,
  };
};

// Map only basic user fields for users without freelancer profiles
export const mapBasicUserToUser = (dbUser: any): User => {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role as 'gestor' | 'freelancer',
    avatar: dbUser.avatar,
    isActive: dbUser.is_active,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
    teamType: undefined,
    phone: undefined,
    address: undefined,
    city: undefined,
    state: undefined,
    cpf: undefined,
    hourlyRate: undefined,
    dailyRate: undefined,
    experienceLevel: 'iniciante',
    audioVisualRoles: [],
    bio: undefined,
    portfolio: undefined,
    linkedin: undefined,
    instagram: undefined,
    website: undefined,
    previousExperience: undefined,
    certifications: [],
    equipment: [],
    languages: [],
    totalEventsAttended: 0,
    totalEarnings: 0,
    averageRating: undefined,
  };
};
