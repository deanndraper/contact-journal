import React from 'react';
import { useNavigate } from 'react-router-dom';

const Privacy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            How We Use Your Information
          </h1>
          <p className="text-gray-600">
            Understanding your data and privacy in therapeutic applications
          </p>
        </header>

        {/* Back Navigation */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to App</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          
          {/* Therapeutic Purpose Section */}
          <section className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Therapeutic Uses</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong>During Therapy Sessions:</strong> Your logged interactions and emotional states will be reviewed with your therapist to identify progress, patterns, and areas for growth. This real-time data helps create more personalized and effective treatment plans.
              </p>
              <p>
                <strong>Progress Tracking:</strong> We analyze your entries over time to show positive trends, improvements in comfort levels, and increasing frequency of healthy social behaviors or recovery milestones.
              </p>
              <p>
                <strong>Pattern Recognition:</strong> Our system identifies recurring themes in your experiences, helping you and your therapist understand triggers, successful coping strategies, and behavioral patterns that support your wellbeing.
              </p>
            </div>
          </section>

          {/* AI and Analysis Section */}
          <section className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">AI-Powered Insights</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong>Therapeutic Feedback:</strong> Our AI provides immediate, supportive responses to your entries, offering encouragement and gentle observations about your progress. This feedback is based on evidence-based therapeutic approaches.
              </p>
              <p>
                <strong>Trend Analysis:</strong> The system automatically identifies positive changes in your emotional states and behavioral patterns, helping you recognize progress you might not notice day-to-day.
              </p>
              <p>
                <strong>Personalized Suggestions:</strong> Based on your unique patterns, the AI may suggest specific activities, coping strategies, or topics to discuss with your therapist.
              </p>
            </div>
          </section>

          {/* Therapist Notifications Section */}
          <section className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 010-15v5h-5l5-5 5 5h-5V7a7.5 7.5 0 000 15v5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Therapist Communication</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong>Progress Updates:</strong> Your therapist receives summaries of your activity and progress between sessions, allowing them to better prepare for and personalize your appointments.
              </p>
              <p>
                <strong>Critical Alerts:</strong> If patterns suggest you may need additional support, your therapist will be notified to reach out or adjust your treatment approach.
              </p>
              <p>
                <strong>Collaborative Treatment:</strong> Your data helps create a collaborative environment where both you and your therapist are informed about your progress and challenges.
              </p>
            </div>
          </section>

          {/* Privacy Protections Section */}
          <section className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Your Privacy is Protected</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong>No Data Sales:</strong> We will never sell, rent, or commercialize your personal information. Your therapeutic data is strictly for your treatment and recovery.
              </p>
              <p>
                <strong>Limited Sharing:</strong> Your information is only shared with your designated therapist and authorized healthcare team members directly involved in your care.
              </p>
              <p>
                <strong>Secure Storage:</strong> All data is encrypted and stored securely with industry-standard protections. Access is logged and monitored for security.
              </p>
              <p>
                <strong>HIPAA Compliance:</strong> Our platform follows healthcare privacy regulations to ensure your medical information remains confidential and protected.
              </p>
            </div>
          </section>

          {/* Guidelines Section */}
          <section className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Important Guidelines</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong>Focus on Emotional States:</strong> This platform is designed for tracking feelings, comfort levels, and behavioral observations. Please share your emotional experiences and therapeutic progress.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium mb-2">⚠️ Please DO NOT Include:</p>
                <ul className="text-red-700 space-y-1 ml-4">
                  <li>• Passwords, PINs, or security codes</li>
                  <li>• Account numbers, credit card, or banking information</li>
                  <li>• Social security numbers or government IDs</li>
                  <li>• Phone numbers, addresses, or contact information</li>
                  <li>• Names of specific individuals (use initials or "my friend")</li>
                  <li>• Specific locations or identifying details</li>
                </ul>
              </div>
              <p>
                <strong>Emergency Support:</strong> This platform is not monitored in real-time. If you're experiencing a mental health emergency, please contact your therapist directly, call your local emergency services, or reach out to a crisis helpline.
              </p>
            </div>
          </section>

          {/* Data Control Section */}
          <section className="mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Your Data Rights</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong>Access and Review:</strong> You can review all your logged interactions and AI feedback at any time through this application.
              </p>
              <p>
                <strong>Data Deletion:</strong> You have the right to request deletion of your data. Contact your therapist or the technical support team to initiate this process.
              </p>
              <p>
                <strong>Treatment Continuity:</strong> If you choose to delete your data, please discuss with your therapist how this might affect your ongoing treatment and progress tracking.
              </p>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>
            This platform is designed to support your therapeutic journey with transparency and privacy protection.
          </p>
          <p>
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <p>
            Questions? Discuss with your therapist or contact technical support through your healthcare provider.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Privacy;