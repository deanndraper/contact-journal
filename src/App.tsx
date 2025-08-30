import React, { useState, useEffect } from 'react';
import './App.css';
import { 
  apiService, 
  InteractionRecord, 
  AIFeedbackRecord, 
  JournalRecord, 
  CreateInteractionDTO, 
  AppConfig,
  InteractionType,
  ComfortLevel 
} from './api';

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
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [configLoading, setConfigLoading] = useState<boolean>(true);

  // Mapping functions between frontend IDs and backend labels (dynamic based on config)
  const mapInteractionTypeToBackend = (frontendId: string): string => {
    if (!config) return frontendId;
    const interaction = config.interactions.find(i => i.id === frontendId);
    return interaction?.label || frontendId;
  };

  const mapComfortLevelToBackend = (frontendId: string): string => {
    if (!config) return frontendId;
    const level = config.comfortLevels.find(l => l.id === frontendId);
    return level?.label || frontendId;
  };

  // Load application configuration
  const loadAppConfig = async () => {
    try {
      setConfigLoading(true);
      setError('');
      
      const appId = apiService.getAppIdFromUrl();
      const appConfig = await apiService.getAppConfig(appId);
      setConfig(appConfig);
    } catch (err) {
      console.error('Error loading app configuration:', err);
      setError('Failed to load app configuration');
    } finally {
      setConfigLoading(false);
    }
  };

  // Fetch user data and recent entries
  const fetchUserData = async (key: string, appId?: string) => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch user info
      const user = await apiService.getUser(key);
      setUserName(user.name);
      
      // Fetch all records (interactions + AI feedback)
      const allRecords = await apiService.getAllRecords(key, appId);
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

  // Load configuration and extract user key from URL on component mount
  useEffect(() => {
    const initializeApp = async () => {
      // First load the configuration
      await loadAppConfig();
      
      // Then extract and load user data
      const pathParts = window.location.pathname.split('/');
      const key = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
      
      if (key && key.length > 0) {
        setUserKey(key);
        // Get appId after config is loaded
        const appId = apiService.getAppIdFromUrl();
        await fetchUserData(key, appId);
      }
    };
    
    initializeApp();
  }, []);

  // Get configuration-based data or fallbacks
  const interactionTypes = config?.interactions || [];
  const comfortLevels = config?.comfortLevels || [];

  // Submit interaction to backend
  const submitInteraction = async () => {
    if (!userKey || !interactionType || !comfortLevel) {
      console.warn('Missing required fields:', { userKey, interactionType, comfortLevel });
      setError('Please select both an interaction type and comfort level');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      const mappedInteractionType = mapInteractionTypeToBackend(interactionType);
      const mappedComfortLevel = mapComfortLevelToBackend(comfortLevel);
      
      console.log('Submitting interaction:', {
        userKey,
        originalInteractionType: interactionType,
        mappedInteractionType,
        originalComfortLevel: comfortLevel,
        mappedComfortLevel,
        appId: config?.appId
      });
      
      const interactionData: CreateInteractionDTO = {
        interactionType: mappedInteractionType,
        comfortLevel: mappedComfortLevel,
        ...(notes && { notes }),
        ...(config && { appId: config.appId })
      };
      
      await apiService.createInteraction(userKey, interactionData);
      
      // Clear form after successful submission
      setInteractionType('');
      setComfortLevel('');
      setNotes('');
      
      // Refresh all records to show new interaction and AI feedback
      const allRecords = await apiService.getAllRecords(userKey, config?.appId);
      const recentRecords = allRecords.slice(-20).reverse();
      setRecentEntries(recentRecords);
      
    } catch (err: any) {
      console.error('Error submitting interaction:', err);
      console.error('Submission details:', {
        userKey,
        interactionType,
        comfortLevel,
        mappedInteractionType: mapInteractionTypeToBackend(interactionType),
        mappedComfortLevel: mapComfortLevelToBackend(comfortLevel),
        appId: config?.appId,
        notes
      });
      
      // Extract detailed error message
      const errorMessage = err.response?.data?.error || 
                          err.message || 
                          'Failed to save interaction. Please try again.';
      
      setError(`Error: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getComfortColor = (comfortLevel: string) => {
    // If it's a backend label, find by label; if it's frontend ID, find by ID
    const level = config?.comfortLevels.find(l => l.label === comfortLevel || l.id === comfortLevel);
    return level ? `bg-${level.color}` : 'bg-gray-300';
  };

  const getComfortLabel = (comfortLevel: string) => {
    // If it's already a label, return it; otherwise find by ID
    const level = config?.comfortLevels.find(l => l.id === comfortLevel);
    return level?.label || comfortLevel;
  };

  const getInteractionLabel = (interactionType: string) => {
    // If it's already a label, return it; otherwise find by ID
    const type = config?.interactions.find(t => t.id === interactionType);
    return type?.label || interactionType;
  };
  
  const getInteractionIcon = (interactionType: string) => {
    // Find by label (backend) or ID (frontend)
    const interaction = config?.interactions.find(i => i.label === interactionType || i.id === interactionType);
    return interaction?.icon || '💭';
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

  // Show loading state while configuration is loading
  if (configLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  // Show error state if configuration failed to load
  if (!config && error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-semibold text-red-800 mb-2">Configuration Error</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const welcomeMessage = config?.ui?.welcomeMessage?.replace('{userName}', userName) || `Welcome back, ${userName}`;
  
  // Theme mappings to avoid dynamic class generation issues
  const getThemeClasses = () => {
    const appId = config?.appId;
    
    if (appId === 'addiction-recovery') {
      return {
        background: 'bg-gradient-to-b from-green-50 to-blue-50',
        textColor: 'text-blue-600',
        buttonSelected: 'border-blue-600 bg-green-100 ring-2 ring-blue-400',
        buttonUnselected: 'border-gray-200 bg-white hover:border-green-200 hover:bg-gray-50',
        comfortSelected: 'border-blue-600 bg-green-50 ring-2 ring-blue-400',
        comfortUnselected: 'border-gray-200 bg-white hover:border-green-200 hover:bg-gray-50',
        submitButton: 'bg-blue-600 hover:bg-blue-700',
        focusRing: 'focus:ring-blue-400'
      };
    } else {
      // Default to social/purple theme
      return {
        background: 'bg-gradient-to-b from-blue-50 to-purple-50',
        textColor: 'text-purple-600',
        buttonSelected: 'border-purple-500 bg-purple-100 ring-2 ring-purple-300',
        buttonUnselected: 'border-gray-200 bg-white hover:border-purple-200 hover:bg-gray-50',
        comfortSelected: 'border-purple-500 bg-purple-50 ring-2 ring-purple-300',
        comfortUnselected: 'border-gray-200 bg-white hover:border-purple-200 hover:bg-gray-50',
        submitButton: 'bg-purple-500 hover:bg-purple-600',
        focusRing: 'focus:ring-purple-400'
      };
    }
  };
  
  const themeClasses = getThemeClasses();

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header with User Name */}
        <header className="mb-8 text-center">
          <div className="mb-4">
            <p className={`text-lg ${themeClasses.textColor} font-medium`}>
              {welcomeMessage}
            </p>
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            {config?.appName || 'Loading...'}
          </h1>
          <p className="text-sm text-gray-600">
            {config?.description || ''}
          </p>
        </header>

        {/* Interaction Type Selection */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-700 mb-4">
            {config?.ui?.interactionPrompt || 'What did you do?'}
          </h2>
          <div className="space-y-2">
            {interactionTypes.map((type) => {
              const isSelected = interactionType === type.id;
              const selectedClasses = themeClasses.buttonSelected;
              const unselectedClasses = themeClasses.buttonUnselected;
              
              return (
              <button
                key={type.id}
                onClick={() => setInteractionType(type.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center space-x-3 ${
                  isSelected ? selectedClasses : unselectedClasses
                }`}
              >
                <span className="text-2xl">{type.icon}</span>
                <span className="font-medium text-gray-700">{type.label}</span>
              </button>
              );
            })}
          </div>
        </section>

        {/* Comfort Level Selection */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-700 mb-4">
            {config?.ui?.comfortPrompt || 'How did you feel?'}
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            {comfortLevels.map((level, index) => (
              <button
                key={level.id}
                onClick={() => setComfortLevel(level.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  comfortLevel === level.id
                    ? themeClasses.comfortSelected
                    : themeClasses.comfortUnselected
                } ${comfortLevels.length === 5 && index === 2 ? 'col-span-2' : ''}`}
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
            {config?.ui?.notesPrompt || 'Add notes (optional)'}
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={config?.ui?.notesPlaceholder || 'Any thoughts...'}
            className={`w-full p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 ${themeClasses.focusRing} focus:border-transparent`}
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
            className={`w-full py-4 ${themeClasses.submitButton} text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md`}
            disabled={!interactionType || !comfortLevel || submitting}
          >
            {submitting ? 'Saving...' : (config?.ui?.submitButton || 'Save Entry')}
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
              {config?.ui?.recentEntriesTitle || 'Your Recent Entries'}
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