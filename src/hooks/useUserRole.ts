import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'moderator' | 'user' | 'viewer';

interface UserRoleState {
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isUser: boolean;
  isViewer: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewOnly: boolean;
}

export function useUserRole(): UserRoleState {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          // Default to 'user' if no role found
          setRole('user');
        } else if (data) {
          setRole(data.role as AppRole);
        } else {
          // No role found, default to user
          setRole('user');
        }
      } catch (err) {
        console.error('Error in useUserRole:', err);
        setRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  const isAdmin = role === 'admin';
  const isModerator = role === 'moderator';
  const isUser = role === 'user';
  const isViewer = role === 'viewer';

  // Permission helpers
  const canCreate = isAdmin || isModerator || isUser;
  const canEdit = isAdmin || isModerator || isUser;
  const canDelete = isAdmin || isModerator;
  const canViewOnly = isViewer;

  return {
    role,
    loading,
    isAdmin,
    isModerator,
    isUser,
    isViewer,
    canCreate,
    canEdit,
    canDelete,
    canViewOnly,
  };
}
