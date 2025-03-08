import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type LeaderboardEntry = Database['public']['Tables']['leaderboard']['Row'];

interface LeaderboardDisplayProps {
  onClose: () => void;
}

export default function LeaderboardDisplay({ onClose }: LeaderboardDisplayProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('leaderboard')
          .select('*')
          .order('score', { ascending: false })
          .limit(100);

        if (error) throw error;
        setLeaderboardData(data || []);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border-2 border-yellow-500 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] relative">
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-3xl font-bold text-center text-yellow-400 mb-6">TOP SCORES</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-10">
            {error}
          </div>
        ) : leaderboardData.length === 0 ? (
          <div className="text-center text-white py-10">
            No scores yet. Be the first to make the leaderboard!
          </div>
        ) : (
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-white">
              <thead className="bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-right">Wave</th>
                  <th className="px-4 py-2 text-right">Score</th>
                  <th className="px-4 py-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((entry, index) => (
                  <tr 
                    key={entry.id} 
                    className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'} ${index < 3 ? 'text-yellow-400 font-bold' : ''}`}
                  >
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">{entry.name}</td>
                    <td className="px-4 py-2 text-right">{entry.wave}</td>
                    <td className="px-4 py-2 text-right">{entry.score.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 