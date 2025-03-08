import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to check if the current user has admin privileges
 * 
 * @returns {Object} Object containing isAdmin state and loading state
 */
export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
        
        // Check if user is admin using the is_admin RPC function
        const { data: isAdminUser, error } = await supabase.rpc('is_admin', {
          user_id: user.id
        });
        
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
        
        setIsAdmin(!!isAdminUser);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminStatus();
  }, []);

  return { isAdmin, isLoading };
}; 