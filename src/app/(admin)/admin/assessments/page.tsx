'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';

interface User { id: string; name: string; email: string; }
interface QuestionOption { id: string; text: string; isCorrect?: boolean; }
interface Question {
  id: string;
  text: string;
  type: 'yes_no' | 'single_choice' | 'multiple_choice' | 'text';
  options?: QuestionOption[];
  correctAnswer?: string | string[];
  correctTextAnswer?: string;
  domain: string;
  weight: number;
  required?: boolean;
}
interface Assessment {
  id: string;
  title: string;
  description: string;
  status: string;
  questions?: Question[];
  assignedUsers?: string[];
  ownerId: string;
  ownerName?: string;
  createdAt: string;
}

const DOMAINS = ['General', 'Data Classification', 'Access Control', 'Network Security', 'Incident Response', 'Compliance', 'Risk Management'];

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'assigned'>('all');
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [form, setForm] = useState({ title: '', description: '', status: 'draft' });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState<{
    text: string; type: 'yes_no' | 'single_choice' | 'multiple_choice' | 'text';
    domain: string; weight: number; required: boolean;
    options: QuestionOption[]; correctAnswer: string | string[]; correctTextAnswer: string;
  }>({
    text: '', type: 'yes_no', domain: 'General', weight: 1, required: true,
    options: [{ id: '1', text: 'Yes', isCorrect: true }, { id: '2', text: 'No', isCorrect: false }],
    correctAnswer: '1', correctTextAnswer: ''
  });

  useEffect(() => {
    fetchAssessments();
    fetchUsers();
  }, []);

  const fetchAssessments = async () => {
    try {
      const res = await fetch('/api/assessments?admin=true');
      const data = await res.json();
      setAssessments(data.assessments || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers((data.users || []).filter((u: User & { role?: string }) => u.role !== 'admin'));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAssessment ? `/api/assessments/${editingAssessment.id}` : '/api/assessments';
      const method = editingAssessment ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        fetchAssessments();
        closeModal();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateStatus = async (id: string, status: string, assignedUsers?: string[]) => {
    try {
      const res = await fetch(`/api/assessments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, assignedUsers }),
      });
      if (res.ok) fetchAssessments();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteAssessment = async (id: string) => {
    if (!confirm('Delete this assessment?')) return;
    try {
      const res = await fetch(`/api/assessments/${id}`, { method: 'DELETE' });
      if (res.ok) setAssessments(assessments.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const openEdit = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setForm({ title: assessment.title, description: assessment.description, status: assessment.status });
    setShowModal(true);
  };

  const openAssign = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setSelectedUsers(assessment.assignedUsers || []);
    setShowAssignModal(true);
  };

  const openQuestions = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setQuestions(assessment.questions || []);
    setShowQuestionsModal(true);
  };

  const handleAssign = async () => {
    if (!editingAssessment) return;
    await updateStatus(editingAssessment.id, 'assigned', selectedUsers);
    setShowAssignModal(false);
    setEditingAssessment(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAssessment(null);
    setForm({ title: '', description: '', status: 'draft' });
  };

  const closeQuestionsModal = () => {
    setShowQuestionsModal(false);
    setEditingAssessment(null);
    setQuestions([]);
    resetQuestionForm();
  };

  const resetQuestionForm = () => {
    setEditingQuestion(null);
    setQuestionForm({
      text: '', type: 'yes_no', domain: 'General', weight: 1, required: true,
      options: [{ id: '1', text: 'Yes', isCorrect: true }, { id: '2', text: 'No', isCorrect: false }],
      correctAnswer: '1', correctTextAnswer: ''
    });
  };

  const handleQuestionTypeChange = (type: 'yes_no' | 'single_choice' | 'multiple_choice' | 'text') => {
    let options: QuestionOption[] = [];
    let correctAnswer: string | string[] = '';
    if (type === 'yes_no') {
      options = [{ id: '1', text: 'Yes', isCorrect: true }, { id: '2', text: 'No', isCorrect: false }];
      correctAnswer = '1';
    } else if (type === 'single_choice' || type === 'multiple_choice') {
      options = [{ id: '1', text: 'Option 1', isCorrect: false }, { id: '2', text: 'Option 2', isCorrect: false }];
      correctAnswer = type === 'multiple_choice' ? [] : '';
    }
    setQuestionForm({ ...questionForm, type, options, correctAnswer, correctTextAnswer: '' });
  };

  const addOption = () => {
    const newId = String(questionForm.options.length + 1);
    setQuestionForm({
      ...questionForm,
      options: [...questionForm.options, { id: newId, text: `Option ${newId}`, isCorrect: false }]
    });
  };

  const removeOption = (id: string) => {
    if (questionForm.options.length <= 2) return;
    const newOptions = questionForm.options.filter(o => o.id !== id);
    let newCorrectAnswer = questionForm.correctAnswer;
    if (Array.isArray(newCorrectAnswer)) {
      newCorrectAnswer = newCorrectAnswer.filter(a => a !== id);
    } else if (newCorrectAnswer === id) {
      newCorrectAnswer = '';
    }
    setQuestionForm({ ...questionForm, options: newOptions, correctAnswer: newCorrectAnswer });
  };

  const updateOption = (id: string, text: string) => {
    setQuestionForm({
      ...questionForm,
      options: questionForm.options.map(o => o.id === id ? { ...o, text } : o)
    });
  };

  const toggleCorrectAnswer = (id: string) => {
    if (questionForm.type === 'multiple_choice') {
      const arr = Array.isArray(questionForm.correctAnswer) ? questionForm.correctAnswer : [];
      const newArr = arr.includes(id) ? arr.filter(a => a !== id) : [...arr, id];
      setQuestionForm({
        ...questionForm,
        correctAnswer: newArr,
        options: questionForm.options.map(o => ({ ...o, isCorrect: newArr.includes(o.id) }))
      });
    } else {
      setQuestionForm({
        ...questionForm,
        correctAnswer: id,
        options: questionForm.options.map(o => ({ ...o, isCorrect: o.id === id }))
      });
    }
  };

  const saveQuestion = () => {
    if (!questionForm.text.trim()) return;
    const newQuestion: Question = {
      id: editingQuestion?.id || `q_${Date.now()}`,
      text: questionForm.text,
      type: questionForm.type,
      domain: questionForm.domain,
      weight: questionForm.weight,
      required: questionForm.required,
      options: questionForm.type !== 'text' ? questionForm.options : undefined,
      correctAnswer: questionForm.type !== 'text' ? questionForm.correctAnswer : undefined,
      correctTextAnswer: questionForm.type === 'text' ? questionForm.correctTextAnswer : undefined
    };
    if (editingQuestion) {
      setQuestions(questions.map(q => q.id === editingQuestion.id ? newQuestion : q));
    } else {
      setQuestions([...questions, newQuestion]);
    }
    resetQuestionForm();
  };

  const editQuestion = (q: Question) => {
    setEditingQuestion(q);
    setQuestionForm({
      text: q.text,
      type: q.type,
      domain: q.domain,
      weight: q.weight,
      required: q.required || false,
      options: q.options || [],
      correctAnswer: q.correctAnswer || '',
      correctTextAnswer: q.correctTextAnswer || ''
    });
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const saveAllQuestions = async () => {
    if (!editingAssessment) return;
    try {
      const res = await fetch(`/api/assessments/${editingAssessment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      });
      if (res.ok) { fetchAssessments(); closeQuestionsModal(); }
    } catch (error) { console.error('Error:', error); }
  };

  const filteredAssessments = filter === 'all' ? assessments : assessments.filter(a => a.status === filter);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-yellow-100 text-yellow-800',
      published: 'bg-blue-100 text-blue-800',
      assigned: 'bg-green-100 text-green-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = { yes_no: 'Yes/No', single_choice: 'Single Choice', multiple_choice: 'Multiple Choice', text: 'Text Input' };
    return labels[type] || type;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 Assessment Management</h1>
          <p className="text-gray-600">Create, manage, and assign assessments</p>
        </div>
        <button type="button" onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          + Create Assessment
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['all', 'draft', 'published', 'assigned'] as const).map((f) => (
          <button type="button" key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition
              ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? assessments.length : assessments.filter(a => a.status === f).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Questions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAssessments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{a.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{a.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <button type="button" onClick={() => openQuestions(a)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                      {a.questions?.length || 0} questions
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(a.status)}`}>{a.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {a.status === 'published' ? <span className="text-blue-600">All Users</span> :
                     a.assignedUsers?.length ? `${a.assignedUsers.length} user(s)` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button type="button" onClick={() => openEdit(a)} className="text-blue-600 hover:text-blue-800 text-sm px-2">Edit</button>
                    {a.status === 'draft' && (
                      <>
                        <button type="button" onClick={() => updateStatus(a.id, 'published')} className="text-green-600 hover:text-green-800 text-sm px-2">Publish</button>
                        <button type="button" onClick={() => openAssign(a)} className="text-purple-600 hover:text-purple-800 text-sm px-2">Assign</button>
                      </>
                    )}
                    {a.status !== 'draft' && (
                      <button type="button" onClick={() => updateStatus(a.id, 'draft', [])} className="text-yellow-600 hover:text-yellow-800 text-sm px-2">Draft</button>
                    )}
                    <button type="button" onClick={() => deleteAssessment(a.id)} className="text-red-600 hover:text-red-800 text-sm px-2">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAssessments.length === 0 && <div className="text-center py-12 text-gray-500">No assessments found</div>}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingAssessment ? 'Edit Assessment' : 'Create Assessment'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required
              placeholder="Assessment title" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={3}
              placeholder="Assessment description" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {editingAssessment ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign to Users">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Select users to assign this assessment to:</p>
          <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
            {users.map((user) => (
              <label key={user.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={selectedUsers.includes(user.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedUsers([...selectedUsers, user.id]);
                    else setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                  }}
                  className="w-4 h-4 text-blue-600 rounded" />
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </label>
            ))}
          </div>
          {users.length === 0 && <p className="text-center text-gray-500 py-4">No users available</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="button" onClick={handleAssign} disabled={selectedUsers.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
              Assign to {selectedUsers.length} User(s)
            </button>
          </div>
        </div>
      </Modal>

      {/* Questions Modal */}
      <Modal isOpen={showQuestionsModal} onClose={closeQuestionsModal} title={`Manage Questions - ${editingAssessment?.title || ''}`}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Question Form */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h4 className="font-medium text-sm">{editingQuestion ? 'Edit Question' : 'Add New Question'}</h4>
            <div>
              <label className="block text-sm font-medium mb-1">Question Text *</label>
              <input type="text" value={questionForm.text} onChange={(e) => setQuestionForm({...questionForm, text: e.target.value})}
                placeholder="Enter your question" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select value={questionForm.type} onChange={(e) => handleQuestionTypeChange(e.target.value as 'yes_no' | 'single_choice' | 'multiple_choice' | 'text')}
                  className="w-full px-3 py-2 border rounded-lg text-sm" title="Question Type">
                  <option value="yes_no">Yes/No</option>
                  <option value="single_choice">Single Choice</option>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="text">Text Input</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Domain</label>
                <select value={questionForm.domain} onChange={(e) => setQuestionForm({...questionForm, domain: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm" title="Domain">
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Weight (1-5)</label>
                <input type="number" min={1} max={5} value={questionForm.weight}
                  onChange={(e) => setQuestionForm({...questionForm, weight: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={questionForm.required}
                    onChange={(e) => setQuestionForm({...questionForm, required: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm">Required</span>
                </label>
              </div>
            </div>

            {/* Options for choice questions */}
            {(questionForm.type === 'single_choice' || questionForm.type === 'multiple_choice' || questionForm.type === 'yes_no') && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Options (mark correct answer)</label>
                  {questionForm.type !== 'yes_no' && (
                    <button type="button" onClick={addOption} className="text-blue-600 text-sm hover:text-blue-800">+ Add Option</button>
                  )}
                </div>
                <div className="space-y-2">
                  {questionForm.options.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input type={questionForm.type === 'multiple_choice' ? 'checkbox' : 'radio'}
                        checked={Array.isArray(questionForm.correctAnswer) ? questionForm.correctAnswer.includes(opt.id) : questionForm.correctAnswer === opt.id}
                        onChange={() => toggleCorrectAnswer(opt.id)}
                        className="w-4 h-4 text-green-600" />
                      <input type="text" value={opt.text} onChange={(e) => updateOption(opt.id, e.target.value)}
                        disabled={questionForm.type === 'yes_no'} placeholder="Option text"
                        className="flex-1 px-2 py-1 border rounded text-sm" />
                      {questionForm.type !== 'yes_no' && questionForm.options.length > 2 && (
                        <button type="button" onClick={() => removeOption(opt.id)} className="text-red-500 text-sm">✕</button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {questionForm.type === 'multiple_choice' ? 'Check all correct answers' : 'Select the correct answer'}
                </p>
              </div>
            )}

            {/* Expected answer for text questions */}
            {questionForm.type === 'text' && (
              <div>
                <label className="block text-sm font-medium mb-1">Expected Answer/Keywords</label>
                <input type="text" value={questionForm.correctTextAnswer}
                  onChange={(e) => setQuestionForm({...questionForm, correctTextAnswer: e.target.value})}
                  placeholder="Enter expected answer or keywords for verification"
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={saveQuestion} disabled={!questionForm.text.trim()}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                {editingQuestion ? 'Update Question' : 'Add Question'}
              </button>
              {editingQuestion && (
                <button type="button" onClick={resetQuestionForm} className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50">Cancel</button>
              )}
            </div>
          </div>

          {/* Questions List */}
          <div>
            <h4 className="font-medium text-sm mb-2">Questions ({questions.length})</h4>
            {questions.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No questions added yet</p>
            ) : (
              <div className="space-y-2">
                {questions.map((q, idx) => (
                  <div key={q.id} className="border rounded-lg p-3 bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{idx + 1}. {q.text}</div>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">{getTypeLabel(q.type)}</span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">{q.domain}</span>
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">Weight: {q.weight}</span>
                        </div>
                        {q.options && (
                          <div className="mt-2 text-xs text-gray-600">
                            Options: {q.options.map(o => (
                              <span key={o.id} className={`mr-2 ${o.isCorrect ? 'text-green-600 font-medium' : ''}`}>
                                {o.text}{o.isCorrect && ' ✓'}
                              </span>
                            ))}
                          </div>
                        )}
                        {q.correctTextAnswer && <div className="mt-1 text-xs text-green-600">Expected: {q.correctTextAnswer}</div>}
                      </div>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => editQuestion(q)} className="text-blue-600 text-sm px-2">Edit</button>
                        <button type="button" onClick={() => deleteQuestion(q.id)} className="text-red-600 text-sm px-2">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={closeQuestionsModal} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="button" onClick={saveAllQuestions} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Save All Questions
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

