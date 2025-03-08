import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardFormProps {
  score: number;
  wave: number;
  onClose: () => void;
  onSubmit: () => void;
}

export default function LeaderboardForm({ score, wave, onClose, onSubmit }: LeaderboardFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email) {
      setError('Name and email are required');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Convert age to number or null
      const ageValue = age ? parseInt(age, 10) : null;
      
      const { error } = await supabase
        .from('leaderboard')
        .insert([
          { 
            name, 
            email, 
            gender: gender || null, 
            age: ageValue, 
            score, 
            wave 
          }
        ]);
        
      if (error) throw error;
      
      setSuccess(true);
      // After 2 seconds, close the form and continue
      setTimeout(() => {
        onSubmit();
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting to leaderboard:', err);
      setError('Failed to submit score. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border-2 border-purple-500 rounded-lg p-6 max-w-md w-full relative">
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {success ? (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-green-400 mb-4">Score Submitted!</h2>
            <p className="text-white">Your score has been added to the leaderboard.</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-center text-purple-400 mb-6">YOU ARE ON THE LEADERBOARD!</h2>
            <p className="text-center text-white mb-6">
              Score: <span className="font-bold text-yellow-400">{score}</span> | 
              Wave: <span className="font-bold text-yellow-400">{wave}</span>
            </p>
            
            {error && (
              <div className="bg-red-900 text-white p-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-white mb-1">Name *</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded p-2"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-white mb-1">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded p-2"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="gender" className="block text-white mb-1">Gender (Optional)</label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded p-2"
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label htmlFor="age" className="block text-white mb-1">Age (Optional)</label>
                <input
                  type="number"
                  id="age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="1"
                  max="120"
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded p-2"
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2 px-4 rounded font-bold ${
                  isSubmitting 
                    ? 'bg-purple-700 text-gray-300' 
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Score'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
} 