import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Action, Service, Line, Team, Post, User, Factory, UserRole } from '@/types';

// Hooks for fetching data
export const useFactories = () => {
  return useQuery({
    queryKey: ['factories'],
    queryFn: async (): Promise<Factory[]> => {
      const { data, error } = await supabase.from('factories').select('*');
      if (error) throw error;
      return (data || []).map(f => ({ id: f.id, name: f.name }));
    },
  });
};

export const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: async (): Promise<Service[]> => {
      const { data, error } = await supabase.from('services').select('*, profiles:responsible_id(first_name, last_name)');
      if (error) throw error;
      return (data || []).map(s => ({
        id: s.id,
        name: s.name,
        responsibleId: s.responsible_id || undefined,
        responsibleName: s.profiles ? `${s.profiles.first_name} ${s.profiles.last_name}` : undefined,
      }));
    },
  });
};

export const useLines = () => {
  return useQuery({
    queryKey: ['lines'],
    queryFn: async (): Promise<Line[]> => {
      const { data, error } = await supabase.from('lines').select('*, services(name), profiles:supervisor_id(first_name, last_name)');
      if (error) throw error;
      return (data || []).map(l => ({
        id: l.id,
        name: l.name,
        serviceId: l.service_id,
        serviceName: l.services?.name || '',
        teamLeaderId: l.supervisor_id || undefined,
        teamLeaderName: l.profiles ? `${l.profiles.first_name} ${l.profiles.last_name}` : undefined,
      }));
    },
  });
};

export const useTeams = () => {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async (): Promise<Team[]> => {
      const { data, error } = await supabase.from('teams').select('*, lines(name), profiles:leader_id(first_name, last_name)');
      if (error) throw error;
      return (data || []).map(t => ({
        id: t.id,
        name: t.name,
        lineId: t.line_id,
        lineName: t.lines?.name || '',
        leaderId: t.leader_id || undefined,
        leaderName: t.profiles ? `${t.profiles.first_name} ${t.profiles.last_name}` : undefined,
      }));
    },
  });
};

export const usePosts = () => {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async (): Promise<Post[]> => {
      const { data, error } = await supabase.from('posts').select('*, teams(name, line_id, lines(name))');
      if (error) throw error;
      return (data || []).map(p => ({
        id: p.id,
        name: p.name,
        teamId: p.team_id,
        teamName: p.teams?.name || '',
        lineId: p.teams?.line_id || '',
        lineName: p.teams?.lines?.name || '',
      }));
    },
  });
};

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*');
      if (profilesError) throw profilesError;
      
      const { data: roles, error: rolesError } = await supabase.from('user_roles').select('*');
      if (rolesError) throw rolesError;
      
      const rolesMap = new Map<string, UserRole>();
      (roles || []).forEach(r => rolesMap.set(r.user_id, r.role as UserRole));
      
      return (profiles || []).map(p => ({
        id: p.id,
        email: p.email,
        firstName: p.first_name,
        lastName: p.last_name,
        phone: p.phone || undefined,
        avatarUrl: p.avatar_url || undefined,
        cvUrl: p.cv_url || undefined,
        dateOfBirth: p.date_of_birth || undefined,
        hireDate: p.hire_date || undefined,
        skills: p.skills || undefined,
        role: rolesMap.get(p.id) || 'operator',
        serviceId: p.service_id || undefined,
        lineId: p.line_id || undefined,
        teamId: p.team_id || undefined,
        postId: p.post_id || undefined,
        factoryId: p.factory_id || undefined,
        isActive: p.is_active,
        lastLoginAt: p.last_login_at || undefined,
        createdAt: p.created_at,
      }));
    },
  });
};

export const useActions = () => {
  const { data: users } = useUsers();
  const { data: services } = useServices();
  const { data: lines } = useLines();
  const { data: teams } = useTeams();
  const { data: posts } = usePosts();
  
  return useQuery({
    queryKey: ['actions', users, services, lines, teams, posts],
    queryFn: async (): Promise<Action[]> => {
      const { data, error } = await supabase.from('actions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const usersMap = new Map((users || []).map(u => [u.id, u]));
      const servicesMap = new Map((services || []).map(s => [s.id, s]));
      const linesMap = new Map((lines || []).map(l => [l.id, l]));
      const teamsMap = new Map((teams || []).map(t => [t.id, t]));
      const postsMap = new Map((posts || []).map(p => [p.id, p]));
      
      return (data || []).map(a => {
        const pilot = usersMap.get(a.pilot_id);
        const creator = usersMap.get(a.created_by_id);
        const service = a.service_id ? servicesMap.get(a.service_id) : undefined;
        const line = a.line_id ? linesMap.get(a.line_id) : undefined;
        const team = a.team_id ? teamsMap.get(a.team_id) : undefined;
        const post = a.post_id ? postsMap.get(a.post_id) : undefined;
        
        return {
          id: a.id,
          title: a.title,
          description: a.description,
          problem: a.problem,
          rootCause: a.root_cause || undefined,
          type: a.type as Action['type'],
          status: a.status as Action['status'],
          urgency: a.urgency as Action['urgency'],
          category5M: a.category_5m as Action['category5M'],
          pilotId: a.pilot_id,
          pilotName: pilot ? `${pilot.firstName} ${pilot.lastName}` : '',
          createdById: a.created_by_id,
          createdByName: creator ? `${creator.firstName} ${creator.lastName}` : '',
          serviceId: a.service_id || undefined,
          serviceName: service?.name,
          lineId: a.line_id || undefined,
          lineName: line?.name,
          teamId: a.team_id || undefined,
          teamName: team?.name,
          postId: a.post_id || undefined,
          postName: post?.name,
          dueDate: a.due_date,
          completedAt: a.completed_at || undefined,
          validatedAt: a.validated_at || undefined,
          progressPercent: a.progress_percent,
          efficiencyPercent: a.efficiency_percent || undefined,
          isEffective: a.is_effective || undefined,
          comments: a.comments || undefined,
          createdAt: a.created_at,
          updatedAt: a.updated_at,
          attachments: [],
        };
      });
    },
    enabled: !!users && !!services && !!lines && !!teams && !!posts,
  });
};

// ============ ACTION MUTATIONS ============

export const useAddAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (action: Omit<Action, 'id' | 'createdAt' | 'updatedAt' | 'pilotName' | 'createdByName' | 'serviceName' | 'lineName' | 'teamName' | 'postName' | 'attachments'>) => {
      const { error } = await supabase.from('actions').insert({
        title: action.title,
        description: action.description,
        problem: action.problem,
        root_cause: action.rootCause,
        type: action.type,
        status: action.status,
        urgency: action.urgency,
        category_5m: action.category5M,
        pilot_id: action.pilotId,
        created_by_id: action.createdById,
        service_id: action.serviceId || null,
        line_id: action.lineId || null,
        team_id: action.teamId || null,
        post_id: action.postId || null,
        due_date: action.dueDate,
        progress_percent: action.progressPercent || 0,
        efficiency_percent: action.efficiencyPercent,
        is_effective: action.isEffective,
        comments: action.comments,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['actions'] }),
  });
};

export const useUpdateAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Action> }) => {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.problem !== undefined) dbUpdates.problem = updates.problem;
      if (updates.rootCause !== undefined) dbUpdates.root_cause = updates.rootCause;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.urgency !== undefined) dbUpdates.urgency = updates.urgency;
      if (updates.category5M !== undefined) dbUpdates.category_5m = updates.category5M;
      if (updates.pilotId !== undefined) dbUpdates.pilot_id = updates.pilotId;
      if (updates.serviceId !== undefined) dbUpdates.service_id = updates.serviceId || null;
      if (updates.lineId !== undefined) dbUpdates.line_id = updates.lineId || null;
      if (updates.teamId !== undefined) dbUpdates.team_id = updates.teamId || null;
      if (updates.postId !== undefined) dbUpdates.post_id = updates.postId || null;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.progressPercent !== undefined) dbUpdates.progress_percent = updates.progressPercent;
      if (updates.efficiencyPercent !== undefined) dbUpdates.efficiency_percent = updates.efficiencyPercent;
      if (updates.isEffective !== undefined) dbUpdates.is_effective = updates.isEffective;
      if (updates.comments !== undefined) dbUpdates.comments = updates.comments;
      if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
      if (updates.validatedAt !== undefined) dbUpdates.validated_at = updates.validatedAt;
      
      const { error } = await supabase.from('actions').update(dbUpdates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['actions'] }),
  });
};

export const useDeleteAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('actions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['actions'] }),
  });
};

// ============ USER MUTATIONS ============

export const useAddUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: { 
      firstName: string; 
      lastName: string; 
      role: UserRole;
      lineId?: string;
      teamId?: string;
      postId?: string;
      isActive?: boolean;
    }): Promise<{ email: string; password: string }> => {
      // Generate email from first and last name
      const email = `${userData.firstName.toLowerCase()}.${userData.lastName.toLowerCase()}@entreprise.com`
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, '');
      
      // Generate random password
      const password = Math.random().toString(36).slice(-8) + 'A1!';
      
      // Call edge function to create user
      const { data, error } = await supabase.functions.invoke('create-users', {
        body: {
          users: [{
            email,
            password,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
          }]
        }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to create user');
      
      const result = data.results[0];
      if (result.status === 'error') throw new Error(result.error);
      
      // Update profile with additional info if needed
      if (userData.lineId || userData.teamId || userData.postId) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger
        
        const updates: Record<string, unknown> = {};
        if (userData.lineId) updates.line_id = userData.lineId;
        if (userData.teamId) updates.team_id = userData.teamId;
        if (userData.postId) updates.post_id = userData.postId;
        
        await supabase.from('profiles').update(updates).eq('id', result.userId);
      }
      
      return { email, password };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<User> }) => {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
      if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.cvUrl !== undefined) dbUpdates.cv_url = updates.cvUrl;
      if (updates.lineId !== undefined) dbUpdates.line_id = updates.lineId || null;
      if (updates.teamId !== undefined) dbUpdates.team_id = updates.teamId || null;
      if (updates.postId !== undefined) dbUpdates.post_id = updates.postId || null;
      if (updates.serviceId !== undefined) dbUpdates.service_id = updates.serviceId || null;
      
      const { error: profileError } = await supabase.from('profiles').update(dbUpdates).eq('id', id);
      if (profileError) throw profileError;
      
      // Update role if changed
      if (updates.role !== undefined) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: updates.role })
          .eq('user_id', id);
        if (roleError) throw roleError;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};

// ============ SERVICE MUTATIONS ============

export const useAddService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (service: Omit<Service, 'id'>) => {
      const { error } = await supabase.from('services').insert({
        name: service.name,
        responsible_id: service.responsibleId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Service> }) => {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.responsibleId !== undefined) dbUpdates.responsible_id = updates.responsibleId || null;
      
      const { error } = await supabase.from('services').update(dbUpdates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });
};

// ============ LINE MUTATIONS ============

export const useAddLine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (line: Omit<Line, 'id' | 'serviceName' | 'teamLeaderName'>) => {
      const { error } = await supabase.from('lines').insert({
        name: line.name,
        service_id: line.serviceId,
        supervisor_id: line.teamLeaderId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lines'] }),
  });
};

export const useUpdateLine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Line> }) => {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.serviceId !== undefined) dbUpdates.service_id = updates.serviceId;
      if (updates.teamLeaderId !== undefined) dbUpdates.supervisor_id = updates.teamLeaderId || null;
      
      const { error } = await supabase.from('lines').update(dbUpdates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lines'] }),
  });
};

export const useDeleteLine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lines').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lines'] }),
  });
};

// ============ TEAM MUTATIONS ============

export const useAddTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (team: Omit<Team, 'id' | 'lineName' | 'leaderName'>) => {
      const { error } = await supabase.from('teams').insert({
        name: team.name,
        line_id: team.lineId,
        leader_id: team.leaderId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Team> }) => {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.lineId !== undefined) dbUpdates.line_id = updates.lineId;
      if (updates.leaderId !== undefined) dbUpdates.leader_id = updates.leaderId || null;
      
      const { error } = await supabase.from('teams').update(dbUpdates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
};

// ============ POST MUTATIONS ============

export const useAddPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (post: Omit<Post, 'id' | 'teamName' | 'lineId' | 'lineName'>) => {
      const { error } = await supabase.from('posts').insert({
        name: post.name,
        team_id: post.teamId,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Post> }) => {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.teamId !== undefined) dbUpdates.team_id = updates.teamId;
      
      const { error } = await supabase.from('posts').update(dbUpdates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });
};
