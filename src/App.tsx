import React, { useState, useEffect } from 'react';
import './App.css';
import { apiService, InteractionRecord, AIFeedbackRecord, JournalRecord, CreateInteractionDTO } from './api';

function App() {
  const [comfortLevel, setComfortLevel] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [interactionType, setInteractionType] = useState<string>('');
  const [showRecentEntries, setShowRecentEntries] = useState<boolean>(false);
  const [userKey, setUserKey] = useState<string>('');
  const [userName, setUserName] = useState<string>('Guest');
  const [recentEntries, setRecentEntries] = useState<JournalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Mapping functions between frontend and backend
  const mapInteractionTypeToBackend = (frontendType: string): CreateInteractionDTO['interactionType'] => {
    const mapping: { [key: string]: CreateInteractionDTO['interactionType'] } = {
      'initiated': 'Initiated Conversation',
      'responded': 'Responded Positively',
      'met': 'Met New Person',
      'favor': 'Did a Favor',
      'listened': 'Listened Intently',
    };
    return mapping[frontendType] || 'Initiated Conversation';
  };

  const mapComfortLevelToBackend = (frontendLevel: string): CreateInteractionDTO['comfortLevel'] => {
    const mapping: { [key: string]: CreateInteractionDTO['comfortLevel'] } = {
      'very_comfortable': 'Very Comfortable',
      'comfortable': 'Comfortable',
      'neutral': 'Neutral',
      'slightly_uncomfortable': 'Somewhat Uncomfortable',
      'very_uncomfortable': 'Very Uncomfortable',
    };
    return mapping[frontendLevel] || 'Neutral';
  };

  // Fetch user data and recent entries
  const fetchUserData = async (key: string) => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch user info
      const user = await apiService.getUser(key);
      setUserName(user.name);
      
      // Fetch all records (interactions + AI feedback)
      const allRecords = await apiService.getAllRecords(key);
      // Get the last 20 records to show recent activity
      const recentRecords = allRecords.slice(-20).reverse();
      setRecentEntries(recentRecords);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data');
      // Fallback to placeholder names
      const placeholderNames: { [key: string]: string } = {
        'abc123': 'Sarah',
        'def456': 'Michael',
        'ghi789': 'Emma',
      };
      setUserName(placeholderNames[key] || 'Friend');
    } finally {
      setLoading(false);
    }
  };

  // Extract user key from URL on component mount
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const key = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
    
    if (key && key.length > 0) {
      setUserKey(key);
      fetchUserData(key);
    }
  }, []);

  const interactionTypes = [
    { id: 'initiated', label: 'Initiated Conversation', icon: '🗣️' },
    { id: 'responded', label: 'Responded Positively', icon: '😊' },
    { id: 'met', label: 'Met a New Person', icon: '🤝' },
    { id: 'favor', label: 'Did a Favor', icon: '💝' },
    { id: 'listened', label: 'Listened Intently', icon: '👂' },
  ];

  // Reordered with comfortable options first
  const comfortLevels = [
    { id: 'very_comfortable', label: 'Very Comfortable', color: 'bg-green-500', emoji: '😄' },
    { id: 'comfortable', label: 'Comfortable', color: 'bg-lime-400', emoji: '😊' },
    { id: 'neutral', label: 'Neutral', color: 'bg-yellow-400', emoji: '😐' },
    { id: 'slightly_uncomfortable', label: 'Slightly Uncomfortable', color: 'bg-orange-400', emoji: '😟' },
    { id: 'very_uncomfortable', label: 'Very Uncomfortable', color: 'bg-red-500', emoji: '😰' },
  ];

  // Submit interaction to backend
  const submitInteraction = async () => {
    if (!userKey || !interactionType || !comfortLevel) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      const interactionData: CreateInteractionDTO = {
        interactionType: mapInteractionTypeToBackend(interactionType),
        comfortLevel: mapComfortLevelToBackend(comfortLevel),
        ...(notes && { notes })
      };
      
      await apiService.createInteraction(userKey, interactionData);
      
      // Clear form after successful submission
      setInteractionType('');
      setComfortLevel('');
      setNotes('');
      
      // Refresh all records to show new interaction and AI feedback
      const allRecords = await apiService.getAllRecords(userKey);
      const recentRecords = allRecords.slice(-20).reverse();
      setRecentEntries(recentRecords);
      
    } catch (err) {
      console.error('Error submitting interaction:', err);
      setError('Failed to save interaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getComfortColor = (comfortId: string) => {
    const level = comfortLevels.find(l => l.id === comfortId);
    return level?.color || 'bg-gray-300';
  };

  const getComfortLabel = (comfortId: string) => {
    const level = comfortLevels.find(l => l.id === comfortId);
    return level?.label || 'Unknown';
  };

  const getInteractionLabel = (typeId: string) => {
    const type = interactionTypes.find(t => t.id === typeId);
    return type?.label || 'Unknown';
  };
  
  const getInteractionIcon = (backendType: string) => {
    const mapping: { [key: string]: string } = {
      'Initiated Conversation': '🗣️',
      'Responded Positively': '😊',
      'Met New Person': '🤝',
      'Did a Favor': '💝',
      'Listened Intently': '👂',
    };
    return mapping[backendType] || '💭';
  };
  
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header with User Name */}
        <header className="mb-8 text-center">
          <div className="mb-4">
            <p className="text-lg text-purple-600 font-medium">
              Welcome back, {userName}
            </p>
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Social Interaction Journal
          </h1>
          <p className="text-sm text-gray-600">
            Track your social experiences with compassion
          </p>
        </header>

        {/* Interaction Type Selection */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-700 mb-4">
            What did you do?
          </h2>
          <div className="space-y-2">
            {interactionTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setInteractionType(type.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center space-x-3 ${
                  interactionType === type.id
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-purple-200'
                }`}
              >
                <span className="text-2xl">{type.icon}</span>
                <span className="font-medium text-gray-700">{type.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Comfort Level Selection */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-700 mb-4">
            How comfortable did you feel?
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            {comfortLevels.map((level, index) => (
              <button
                key={level.id}
                onClick={() => setComfortLevel(level.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  comfortLevel === level.id
                    ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-300'
                    : 'border-gray-200 bg-white hover:border-purple-200'
                } ${index === 2 ? 'col-span-2' : ''}`}
              >
                <div className="text-2xl mb-2 text-center">{level.emoji}</div>
                <div className="text-sm font-medium text-gray-700 text-center">
                  {level.label}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Notes Section */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-700 mb-2">
            Add notes (optional)
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any thoughts about this interaction..."
            className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            rows={3}
          />
        </section>

        {/* Error Message */}
        {error && (
          <section className="mb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </section>
        )}

        {/* Submit Button */}
        <section className="mb-8">
          <button
            onClick={submitInteraction}
            className="w-full py-4 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            disabled={!interactionType || !comfortLevel || submitting}
          >
            {submitting ? 'Saving...' : 'Save Experience'}
          </button>
          {(!interactionType || !comfortLevel) && (
            <p className="text-sm text-gray-500 text-center mt-2">
              Please select an interaction type and comfort level
            </p>
          )}
        </section>

        {/* Recent Entries (Collapsible for Privacy) */}
        <section className="mb-8">
          <button
            onClick={() => setShowRecentEntries(!showRecentEntries)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-medium text-gray-700">
              Your Recent Entries
            </h2>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                showRecentEntries ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          
          {showRecentEntries && (
            <div className="mt-3 space-y-2">
              {loading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading entries...</p>
                </div>
              ) : recentEntries.length > 0 ? (
                recentEntries.map((entry) => {
                  // Check if this is an AI feedback record
                  if (entry.recordType === 'ai_feedback') {
                    const aiEntry = entry as AIFeedbackRecord;
                    return (
                      <div
                        key={aiEntry.id}
                        className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 shadow-sm border border-purple-200"
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-xl">💭</span>
                          <div className="flex-1">
                            <p className="text-sm text-purple-700 font-medium mb-1">
                              AI Insight
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {aiEntry.feedback}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatTimeAgo(aiEntry.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // Regular interaction record
                  const interaction = entry as InteractionRecord;
                  return (
                    <div
                      key={interaction.id}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{getInteractionIcon(interaction.interactionType)}</span>
                          <div>
                            <p className="font-medium text-gray-700 text-sm">
                              {interaction.interactionType}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimeAgo(interaction.timestamp)}
                            </p>
                            {interaction.notes && (
                              <p className="text-xs text-gray-600 mt-1 italic">
                                "{interaction.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs text-white ${
                          interaction.comfortLevel === 'Very Comfortable' ? 'bg-green-500' :
                          interaction.comfortLevel === 'Comfortable' ? 'bg-lime-400' :
                          interaction.comfortLevel === 'Neutral' ? 'bg-yellow-400' :
                          interaction.comfortLevel === 'Somewhat Uncomfortable' ? 'bg-orange-400' :
                          'bg-red-500'
                        }`}>
                          {interaction.comfortLevel}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No entries yet. Start tracking your interactions!
                </p>
              )}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default App;