import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, Users, HelpCircle, FileText, Cpu, Trash2, Edit, Plus, Check, X, Search, Filter } from 'lucide-react';
import Toast from '../components/Toast';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, topics, questions

  // State lists
  const [users, setUsers] = useState([]);
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Topic Form states
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [editingTopicId, setEditingTopicId] = useState(null);

  // Question Form states
  const [questionText, setQuestionText] = useState('');
  const [questionDifficulty, setQuestionDifficulty] = useState('Beginner');
  const [questionTopicId, setQuestionTopicId] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  // Filters for Questions tab
  const [filterTopic, setFilterTopic] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Get system metrics
      const analyticsRes = await axios.get('/api/admin/analytics');
      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.data);
      }

      // Get users list
      const usersRes = await axios.get('/api/admin/users');
      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
      }

      // Get topics
      const topicsRes = await axios.get('/api/topics');
      if (topicsRes.data.success) {
        setTopics(topicsRes.data.data);
        if (topicsRes.data.data.length > 0 && !questionTopicId) {
          setQuestionTopicId(topicsRes.data.data[0]._id);
        }
      }

      // Get all questions
      const questionsRes = await axios.get('/api/questions');
      if (questionsRes.data.success) {
        setQuestions(questionsRes.data.data);
      }

    } catch (err) {
      console.error('Error fetching admin data:', err);
      setToast({ message: 'Failed to sync database logs. Admin endpoints restricted.', type: 'warning' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // --- CRUD TOPIC OPERATIONS ---

  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    if (!topicTitle || !topicDesc) {
      setToast({ message: 'Please enter title and description', type: 'error' });
      return;
    }

    try {
      if (editingTopicId) {
        // Update Topic
        const res = await axios.put(`/api/admin/topic/${editingTopicId}`, {
          title: topicTitle,
          description: topicDesc
        });
        if (res.data.success) {
          setToast({ message: 'Topic updated successfully', type: 'success' });
        }
      } else {
        // Create Topic
        const res = await axios.post('/api/admin/topic', {
          title: topicTitle,
          description: topicDesc
        });
        if (res.data.success) {
          setToast({ message: 'New topic added to pool', type: 'success' });
        }
      }

      // Reset Form and reload
      setTopicTitle('');
      setTopicDesc('');
      setEditingTopicId(null);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setToast({ message: err.response?.data?.message || 'Topic operation failed', type: 'error' });
    }
  };

  const handleEditTopic = (topic) => {
    setEditingTopicId(topic._id);
    setTopicTitle(topic.title);
    setTopicDesc(topic.description);
  };

  const handleDeleteTopic = async (id) => {
    if (window.confirm('WARNING: Deleting a topic will permanently delete all associated questions. Do you wish to continue?')) {
      try {
        const res = await axios.delete(`/api/admin/topic/${id}`);
        if (res.data.success) {
          setToast({ message: 'Topic and associated questions deleted', type: 'success' });
          fetchAdminData();
        }
      } catch (err) {
        console.error(err);
        setToast({ message: 'Failed to delete topic', type: 'error' });
      }
    }
  };

  const handleCancelTopicEdit = () => {
    setEditingTopicId(null);
    setTopicTitle('');
    setTopicDesc('');
  };

  // --- CRUD QUESTION OPERATIONS ---

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!questionText || !questionTopicId || !questionDifficulty) {
      setToast({ message: 'Please enter all question fields', type: 'error' });
      return;
    }

    try {
      if (editingQuestionId) {
        // Update Question
        const res = await axios.put(`/api/admin/question/${editingQuestionId}`, {
          question: questionText,
          difficulty: questionDifficulty,
          topicId: questionTopicId
        });
        if (res.data.success) {
          setToast({ message: 'Question text updated', type: 'success' });
        }
      } else {
        // Add Question
        const res = await axios.post('/api/admin/question', {
          question: questionText,
          difficulty: questionDifficulty,
          topicId: questionTopicId
        });
        if (res.data.success) {
          setToast({ message: 'New question added successfully', type: 'success' });
        }
      }

      setQuestionText('');
      setEditingQuestionId(null);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setToast({ message: 'Question operation failed', type: 'error' });
    }
  };

  const handleEditQuestion = (q) => {
    setEditingQuestionId(q._id);
    setQuestionText(q.question);
    setQuestionDifficulty(q.difficulty);
    setQuestionTopicId(q.topicId);
  };

  const handleDeleteQuestion = async (id) => {
    if (window.confirm('Delete this question permanently?')) {
      try {
        const res = await axios.delete(`/api/admin/question/${id}`);
        if (res.data.success) {
          setToast({ message: 'Question deleted successfully', type: 'success' });
          fetchAdminData();
        }
      } catch (err) {
        console.error(err);
        setToast({ message: 'Failed to delete question', type: 'error' });
      }
    }
  };

  const handleCancelQuestionEdit = () => {
    setEditingQuestionId(null);
    setQuestionText('');
  };

  // Filter/Search computations for questions table
  const filteredQuestions = questions.filter((q) => {
    const matchesTopic = filterTopic === 'all' || q.topicId === filterTopic;
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesDifficulty && matchesSearch;
  });

  if (loading && users.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none space-y-6 bg-white dark:bg-dark-bg transition-colors duration-300 min-h-[80vh]">
        <div className="h-10 w-48 bg-gray-200 dark:bg-dark-card animate-shimmer rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100 dark:bg-dark-card animate-shimmer"></div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback defaults
  const dispMetrics = analytics || { totalUsers: 0, totalInterviews: 0, totalQuestions: 0, averageScore: 0 };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none relative bg-white dark:bg-dark-bg transition-colors duration-300 min-h-screen">
      
      {/* Header banner */}
      <div className="flex justify-between items-center border-b border-brand-border dark:border-dark-border pb-6">
        <div>
          <h1 className="font-outfit font-extrabold text-3xl text-brand-charcoal dark:text-dark-text flex items-center gap-2.5">
            <ShieldAlert className="text-brand-purple dark:text-dark-purple" size={30} />
            <span>Administrator Dashboard</span>
          </h1>
          <p className="text-brand-slate dark:text-dark-muted text-sm">Review metrics, manage questions, and modify topics.</p>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-brand-border dark:border-dark-border gap-2">
        {[
          { id: 'analytics', name: 'Metrics & Users', icon: Users },
          { id: 'topics', name: 'Manage Topics', icon: Cpu },
          { id: 'questions', name: 'Manage Questions', icon: HelpCircle }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all ${
                active
                  ? 'border-brand-purple dark:border-dark-purple text-brand-purple dark:text-dark-purple'
                  : 'border-transparent text-brand-slate dark:text-dark-muted hover:text-brand-charcoal dark:hover:text-dark-text'
              }`}
            >
              <Icon size={16} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* --- TAB CONTENT 1: ANALYTICS & USERS --- */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fade-in">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 shadow-premium dark:shadow-dark-card">
              <p className="text-xs font-bold text-brand-slate dark:text-dark-muted uppercase tracking-wider mb-2">Total Users</p>
              <span className="text-4xl font-extrabold font-outfit text-brand-charcoal dark:text-dark-text">{dispMetrics.totalUsers}</span>
            </div>
            <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 shadow-premium dark:shadow-dark-card">
              <p className="text-xs font-bold text-brand-slate dark:text-dark-muted uppercase tracking-wider mb-2">Total Mock Exams</p>
              <span className="text-4xl font-extrabold font-outfit text-brand-charcoal dark:text-dark-text">{dispMetrics.totalInterviews}</span>
            </div>
            <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 shadow-premium dark:shadow-dark-card">
              <p className="text-xs font-bold text-brand-slate dark:text-dark-muted uppercase tracking-wider mb-2">Total Question Pool</p>
              <span className="text-4xl font-extrabold font-outfit text-brand-charcoal dark:text-dark-text">{dispMetrics.totalQuestions}</span>
            </div>
            <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 shadow-premium dark:shadow-dark-card">
              <p className="text-xs font-bold text-brand-slate dark:text-dark-muted uppercase tracking-wider mb-2">System Average Score</p>
              <span className="text-4xl font-extrabold font-outfit text-brand-charcoal dark:text-dark-text">{dispMetrics.averageScore}%</span>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 shadow-premium dark:shadow-dark-card overflow-hidden">
            <h3 className="font-outfit font-extrabold text-lg text-brand-charcoal dark:text-dark-text mb-4">Registered Students</h3>
            
            <div className="overflow-x-auto rounded-2xl border border-brand-border dark:border-dark-border">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-surface dark:bg-dark-surface text-brand-slate dark:text-dark-muted border-b border-brand-border dark:border-dark-border font-bold text-xs uppercase tracking-wider">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border dark:divide-dark-border text-xs">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-brand-surface/30 dark:hover:bg-dark-surface/30">
                      <td className="p-4 font-semibold text-brand-charcoal dark:text-dark-text">{u.name}</td>
                      <td className="p-4 text-brand-slate dark:text-dark-muted">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded font-bold capitalize ${
                          u.role === 'admin' ? 'bg-brand-purple-light dark:bg-dark-purple/20 text-brand-purple dark:text-dark-purple' : 'bg-brand-glowBlue dark:bg-dark-blue/20 text-brand-blue dark:text-dark-blue'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-brand-slate dark:text-dark-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 2: MANAGE TOPICS --- */}
      {activeTab === 'topics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Topic Form */}
          <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 shadow-premium dark:shadow-dark-card h-fit space-y-4">
            <h3 className="font-outfit font-bold text-lg text-brand-charcoal dark:text-dark-text">
              {editingTopicId ? 'Edit Track' : 'Create Track'}
            </h3>
            
            <form onSubmit={handleTopicSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-charcoal dark:text-dark-text uppercase tracking-wider mb-2">Topic Title</label>
                <input
                  type="text"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  placeholder="e.g. Kotlin"
                  className="w-full px-3 py-2.5 rounded-xl border border-brand-border dark:border-dark-border outline-none focus:border-brand-purple dark:focus:border-dark-purple bg-white dark:bg-dark-surface text-sm text-brand-charcoal dark:text-dark-text transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-charcoal dark:text-dark-text uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={topicDesc}
                  onChange={(e) => setTopicDesc(e.target.value)}
                  placeholder="Describe track conceptual guidelines..."
                  className="w-full h-32 px-3 py-2.5 rounded-xl border border-brand-border dark:border-dark-border outline-none focus:border-brand-purple dark:focus:border-dark-purple bg-white dark:bg-dark-surface text-sm text-brand-charcoal dark:text-dark-text resize-none leading-relaxed transition-colors"
                  required
                ></textarea>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover text-white font-semibold text-xs shadow-premium dark:shadow-neon-purple transition-all"
                >
                  {editingTopicId ? 'Save Changes' : 'Add Topic'}
                </button>
                {editingTopicId && (
                  <button
                    type="button"
                    onClick={handleCancelTopicEdit}
                    className="px-3.5 py-2.5 rounded-xl border border-brand-border dark:border-dark-border text-brand-slate dark:text-dark-muted text-xs"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Topics List Table */}
          <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 shadow-premium dark:shadow-dark-card lg:col-span-2 space-y-4">
            <h3 className="font-outfit font-extrabold text-lg text-brand-charcoal dark:text-dark-text">Interview Tracks</h3>
            
            <div className="space-y-3">
              {topics.map((t) => (
                <div key={t._id} className="flex justify-between items-center p-4 border border-brand-border dark:border-dark-border rounded-2xl bg-brand-surface/40 dark:bg-dark-surface/40 gap-4">
                  <div>
                    <h4 className="font-bold text-brand-charcoal dark:text-dark-text text-sm leading-none">{t.title}</h4>
                    <p className="text-xs text-brand-slate dark:text-dark-muted leading-relaxed mt-1">{t.description}</p>
                    <span className="text-[10px] text-brand-purple dark:text-dark-purple font-bold block mt-1.5">{t.questionCount || 0} Questions Seeded</span>
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleEditTopic(t)}
                      className="p-2 hover:bg-brand-purple-light dark:hover:bg-dark-purple/20 text-brand-slate dark:text-dark-muted hover:text-brand-purple dark:hover:text-dark-purple rounded-xl transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteTopic(t._id)}
                      className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-brand-slate dark:text-dark-muted hover:text-rose-500 dark:hover:text-rose-400 rounded-xl transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 3: MANAGE QUESTIONS --- */}
      {activeTab === 'questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Question Form */}
          <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 shadow-premium dark:shadow-dark-card h-fit space-y-4">
            <h3 className="font-outfit font-bold text-lg text-brand-charcoal dark:text-dark-text">
              {editingQuestionId ? 'Edit Question' : 'Create Question'}
            </h3>
            
            <form onSubmit={handleQuestionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-charcoal dark:text-dark-text uppercase tracking-wider mb-2">Select Topic Track</label>
                <select
                  value={questionTopicId}
                  onChange={(e) => setQuestionTopicId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-brand-border dark:border-dark-border outline-none focus:border-brand-purple dark:focus:border-dark-purple bg-white dark:bg-dark-surface text-sm text-brand-charcoal dark:text-dark-text cursor-pointer transition-colors"
                  required
                >
                  {topics.map((t) => (
                    <option key={t._id} value={t._id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-charcoal dark:text-dark-text uppercase tracking-wider mb-2">Difficulty</label>
                <select
                  value={questionDifficulty}
                  onChange={(e) => setQuestionDifficulty(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-brand-border dark:border-dark-border outline-none focus:border-brand-purple dark:focus:border-dark-purple bg-white dark:bg-dark-surface text-sm text-brand-charcoal dark:text-dark-text cursor-pointer transition-colors"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-charcoal dark:text-dark-text uppercase tracking-wider mb-2">Question Text</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="e.g. Explain memory leakage in React applications..."
                  className="w-full h-32 px-3 py-2.5 rounded-xl border border-brand-border dark:border-dark-border outline-none focus:border-brand-purple dark:focus:border-dark-purple bg-white dark:bg-dark-surface text-sm text-brand-charcoal dark:text-dark-text resize-none leading-relaxed transition-colors"
                  required
                ></textarea>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-purple dark:bg-dark-purple hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover text-white font-semibold text-xs shadow-premium dark:shadow-neon-purple transition-all"
                >
                  {editingQuestionId ? 'Save Changes' : 'Add Question'}
                </button>
                {editingQuestionId && (
                  <button
                    type="button"
                    onClick={handleCancelQuestionEdit}
                    className="px-3.5 py-2.5 rounded-xl border border-brand-border dark:border-dark-border text-brand-slate dark:text-dark-muted text-xs"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Questions Search/Filter & List Table */}
          <div className="bg-white dark:bg-dark-card border border-brand-border dark:border-dark-border rounded-3xl p-6 shadow-premium dark:shadow-dark-card lg:col-span-2 space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-outfit font-extrabold text-lg text-brand-charcoal dark:text-dark-text">Questions Bank</h3>
              <span className="text-xs font-semibold text-brand-slate dark:text-dark-muted">{filteredQuestions.length} Questions Filtered</span>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-y border-brand-border dark:border-dark-border py-4">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-slate dark:text-dark-muted pointer-events-none">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Search question text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-brand-border dark:border-dark-border rounded-xl outline-none focus:border-brand-purple dark:focus:border-dark-purple text-xs text-brand-charcoal dark:text-dark-text bg-white dark:bg-dark-surface transition-colors"
                />
              </div>

              <div className="relative">
                <select
                  value={filterTopic}
                  onChange={(e) => setFilterTopic(e.target.value)}
                  className="w-full px-3 py-2.5 border border-brand-border dark:border-dark-border rounded-xl outline-none focus:border-brand-purple dark:focus:border-dark-purple text-xs text-brand-charcoal dark:text-dark-text bg-white dark:bg-dark-surface cursor-pointer transition-colors"
                >
                  <option value="all">All Topics</option>
                  {topics.map((t) => (
                    <option key={t._id} value={t._id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="w-full px-3 py-2.5 border border-brand-border dark:border-dark-border rounded-xl outline-none focus:border-brand-purple dark:focus:border-dark-purple text-xs text-brand-charcoal dark:text-dark-text bg-white dark:bg-dark-surface cursor-pointer transition-colors"
                >
                  <option value="all">All Difficulties</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Questions Table */}
            <div className="overflow-x-auto rounded-2xl border border-brand-border dark:border-dark-border">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-surface dark:bg-dark-surface text-brand-slate dark:text-dark-muted border-b border-brand-border dark:border-dark-border font-bold text-xs uppercase tracking-wider">
                    <th className="p-4">Topic</th>
                    <th className="p-4 w-[60%]">Question</th>
                    <th className="p-4">Difficulty</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border dark:divide-dark-border text-xs">
                  {filteredQuestions.map((q) => {
                    const topicObj = topics.find((t) => t._id === q.topicId);
                    return (
                      <tr key={q._id} className="hover:bg-brand-surface/30 dark:hover:bg-dark-surface/30">
                        <td className="p-4 font-semibold text-brand-charcoal dark:text-dark-text">{topicObj ? topicObj.title : 'Unknown'}</td>
                        <td className="p-4 text-brand-slate dark:text-dark-muted leading-relaxed">{q.question}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            q.difficulty === 'Beginner' ? 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400' :
                            q.difficulty === 'Intermediate' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                          }`}>
                            {q.difficulty}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleEditQuestion(q)}
                              className="p-2 hover:bg-brand-purple-light dark:hover:bg-dark-purple/20 text-brand-slate dark:text-dark-muted hover:text-brand-purple dark:hover:text-dark-purple rounded-xl transition-colors"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q._id)}
                              className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-brand-slate dark:text-dark-muted hover:text-rose-500 dark:hover:text-rose-400 rounded-xl transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredQuestions.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center p-8 text-brand-slate dark:text-dark-muted bg-brand-surface/20 dark:bg-dark-surface/20">
                        No matching questions found in pool.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AdminDashboard;
