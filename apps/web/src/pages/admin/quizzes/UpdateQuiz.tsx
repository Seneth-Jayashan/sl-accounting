import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Save, 
  X, 
  PlusCircle, 
  Trash2, 
  Settings, 
  HelpCircle, 
  CheckCircle2,
  Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
import QuizService, { type QuizPayload, type QuizQuestion } from "../../../services/QuizService";
import ClassService, { type ClassData } from "../../../services/ClassService";

const UpdateQuiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [availableClasses, setAvailableClasses] = useState<ClassData[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  // Initial State matching QuizPayload (will be overwritten by fetched data)
  const [quizData, setQuizData] = useState<QuizPayload>({
    title: "",
    description: "",
    class: "", 
    duration: 60,
    quizType: "live",
    passingPercentage: 40,
    isPublished: false,
    settings: {
      shuffleQuestions: true,
      shuffleOptions: true,
      allowBacktrack: true,
      maxAttempts: 1,
      showResultImmediately: false,
    },
    questions: []
  });

  // Fetch Classes and Existing Quiz Data
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!id) return;

      try {
        setInitialLoading(true);

        // 1. Fetch Classes for Dropdown
        const classRes = await ClassService.getAllClasses();
        if (classRes && classRes.classes) {
          setAvailableClasses(classRes.classes);
        } else if (Array.isArray(classRes)) {
          setAvailableClasses(classRes);
        }

        // 2. Fetch Existing Quiz
        const quizRes = await QuizService.getQuizById(id);
        if (quizRes.success && quizRes.data) {
          const fetchedQuiz = quizRes.data;
          
          // Handle populated class object (extract the ID string)
          const classId = typeof fetchedQuiz.class === 'object' && fetchedQuiz.class !== null
            ? (fetchedQuiz.class as any)._id 
            : fetchedQuiz.class;

          setQuizData({
            title: fetchedQuiz.title,
            description: fetchedQuiz.description,
            class: classId,
            duration: fetchedQuiz.duration,
            quizType: fetchedQuiz.quizType,
            passingPercentage: fetchedQuiz.passingPercentage,
            isPublished: fetchedQuiz.isPublished,
            settings: fetchedQuiz.settings,
            questions: fetchedQuiz.questions,
          });
        }
      } catch (error) {
        toast.error("Failed to load quiz details.");
        console.error("Error fetching data:", error);
        navigate("/admin/quizzes");
      } finally {
        setInitialLoading(false);
        setLoadingClasses(false);
      }
    };

    fetchInitialData();
  }, [id, navigate]);

  // --- Handlers for Basic Info ---
  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Convert to number if the input type is 'number'
    const parsedValue = type === "number" ? Number(value) : value;
    
    setQuizData(prev => ({ ...prev, [name]: parsedValue }));
  };
  
  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked, value, type } = e.target;
    setQuizData(prev => ({
      ...prev,
      settings: {
        ...prev.settings!,
        [name]: type === "checkbox" ? checked : Number(value)
      }
    }));
  };

  // --- Handlers for Dynamic Questions ---
  const addQuestion = () => {
    setQuizData(prev => ({
      ...prev,
      questions: [
        ...prev.questions!,
        {
          questionText: "",
          questionType: "mcq",
          points: 1,
          explanation: "",
          options: [
            { optionText: "", isCorrect: true },
            { optionText: "", isCorrect: false }
          ]
        }
      ]
    }));
  };

  const removeQuestion = (qIndex: number) => {
    setQuizData(prev => {
      const updatedQs = [...prev.questions!];
      updatedQs.splice(qIndex, 1);
      return { ...prev, questions: updatedQs };
    });
  };

  // FIX: Auto-format options array based on question type selection
  const handleQuestionChange = (qIndex: number, field: keyof QuizQuestion, value: any) => {
    setQuizData(prev => {
      const updatedQs = [...prev.questions!];
      
      if (field === "questionType") {
        if (value === "true-false") {
          updatedQs[qIndex].options = [
            { optionText: "True", isCorrect: true },
            { optionText: "False", isCorrect: false }
          ];
        } else if (value === "short-answer") {
          updatedQs[qIndex].options = [
            { optionText: updatedQs[qIndex].options[0]?.optionText || "", isCorrect: true }
          ];
        }
      }
      
      updatedQs[qIndex] = { ...updatedQs[qIndex], [field]: value };
      return { ...prev, questions: updatedQs };
    });
  };

  // --- Handlers for Dynamic Options ---
  const addOption = (qIndex: number) => {
    setQuizData(prev => {
      const updatedQs = [...prev.questions!];
      updatedQs[qIndex].options.push({ optionText: "", isCorrect: false });
      return { ...prev, questions: updatedQs };
    });
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    setQuizData(prev => {
      const updatedQs = [...prev.questions!];
      updatedQs[qIndex].options.splice(optIndex, 1);
      return { ...prev, questions: updatedQs };
    });
  };

  const handleOptionTextChange = (qIndex: number, optIndex: number, text: string) => {
    setQuizData(prev => {
      const updatedQs = [...prev.questions!];
      updatedQs[qIndex].options[optIndex].optionText = text;
      return { ...prev, questions: updatedQs };
    });
  };

  const handleSetCorrectOption = (qIndex: number, optIndex: number) => {
    setQuizData(prev => {
      const updatedQs = [...prev.questions!];
      const qType = updatedQs[qIndex].questionType;

      if (qType === "mcq" || qType === "true-false") {
        updatedQs[qIndex].options = updatedQs[qIndex].options.map((opt, i) => ({
          ...opt,
          isCorrect: i === optIndex
        }));
      } else {
        updatedQs[qIndex].options[optIndex].isCorrect = !updatedQs[qIndex].options[optIndex].isCorrect;
      }
      return { ...prev, questions: updatedQs };
    });
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizData.class) {
      toast.error("Please select a class/batch for this quiz.");
      return;
    }
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await QuizService.updateQuiz(id, quizData);
      if (response.success) {
        toast.success("Quiz updated successfully!");
        navigate("/admin/quizzes");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update quiz.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-gray-500 font-medium">Loading Quiz Data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen pb-24">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50 z-10 py-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Edit Quiz</h1>
            <p className="text-gray-500 text-sm">Update your SL Accounting assessment</p>
          </div>
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={() => navigate("/admin/quizzes")}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
            >
              <X size={18} /> Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} /> {loading ? "Updating..." : "Update Quiz"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN - Settings & Details */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Basic Details Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Settings size={18} className="text-blue-600"/> General Info
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title *</label>
                  <input 
                    required 
                    type="text" 
                    name="title"
                    value={quizData.title}
                    onChange={handleBasicInfoChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Class/Batch *</label>
                  <select 
                    required 
                    name="class"
                    value={quizData.class as string}
                    onChange={handleBasicInfoChange}
                    disabled={loadingClasses}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  >
                    <option value="" disabled>
                      {loadingClasses ? "Loading classes..." : "Select a class"}
                    </option>
                    {availableClasses.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name} {cls.batch ? `(${typeof cls.batch === 'string' ? cls.batch : (cls.batch as any).name})` : ''} - {cls.type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
                    <input 
                      required 
                      type="number" 
                      name="duration"
                      min="1"
                      value={quizData.duration}
                      onChange={handleBasicInfoChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pass Mark (%)</label>
                    <input 
                      required 
                      type="number" 
                      name="passingPercentage"
                      min="0" max="100"
                      value={quizData.passingPercentage}
                      onChange={handleBasicInfoChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Type</label>
                  <select 
                    name="quizType"
                    value={quizData.quizType}
                    onChange={handleBasicInfoChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="live">Live Exam</option>
                    <option value="schedule">Scheduled Exam</option>
                    <option value="practice">Practice Quiz</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Exam Rules Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <CheckCircle2 size={18} className="text-green-600"/> Exam Rules
              </h2>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input type="checkbox" name="shuffleQuestions" checked={quizData.settings?.shuffleQuestions} onChange={handleSettingChange} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">Shuffle Questions</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" name="shuffleOptions" checked={quizData.settings?.shuffleOptions} onChange={handleSettingChange} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">Shuffle Options</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" name="allowBacktrack" checked={quizData.settings?.allowBacktrack} onChange={handleSettingChange} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">Allow Backtracking</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" name="showResultImmediately" checked={quizData.settings?.showResultImmediately} onChange={handleSettingChange} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">Show Results Immediately</span>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Question Builder */}
          <div className="lg:col-span-2 space-y-6">
            
            {quizData.questions?.map((q, qIndex) => (
              <div key={qIndex} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative group">
                {/* Question Header */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-gray-800">Question {qIndex + 1}</h3>
                  <button 
                    type="button" 
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Question"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Question Text, Type & Points */}
                <div className="grid grid-cols-12 gap-4 mb-4">
                  <div className="col-span-12 md:col-span-6">
                    <label className="block text-xs text-gray-500 mb-1">Question Text</label>
                    <textarea 
                      required
                      rows={2}
                      value={q.questionText}
                      onChange={(e) => handleQuestionChange(qIndex, "questionText", e.target.value)}
                      placeholder="Type your accounting question here..."
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  </div>
                  
                  {/* FIX: Question Type Selector */}
                  <div className="col-span-6 md:col-span-3">
                    <label className="block text-xs text-gray-500 mb-1">Question Type</label>
                    <select
                      value={q.questionType}
                      onChange={(e) => handleQuestionChange(qIndex, "questionType", e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="mcq">Multiple Choice</option>
                      <option value="multi-select">Multiple Select</option>
                      <option value="true-false">True / False</option>
                      <option value="short-answer">Short Answer</option>
                    </select>
                  </div>

                  <div className="col-span-6 md:col-span-3">
                    <label className="block text-xs text-gray-500 mb-1">Points</label>
                    <input 
                      type="number" min="1"
                      value={q.points}
                      onChange={(e) => handleQuestionChange(qIndex, "points", Number(e.target.value))}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* FIX: Dynamic Options Builder */}
                <div className="space-y-3 mb-4 border-t border-gray-100 pt-4">
                  <label className="block text-sm font-medium text-gray-700">Answers</label>
                  
                  {q.questionType === "short-answer" ? (
                    // SHORT ANSWER UI
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-500 text-white flex-shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <input 
                        required
                        type="text"
                        value={q.options[0]?.optionText || ""}
                        onChange={(e) => handleOptionTextChange(qIndex, 0, e.target.value)}
                        placeholder="Type the exact correct answer here..."
                        className="flex-1 p-2 border border-green-400 bg-green-50 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    // MCQ, MULTI-SELECT, TRUE-FALSE UI
                    <>
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-3">
                          <input 
                            type={q.questionType === "multi-select" ? "checkbox" : "radio"}
                            name={`correct-option-${qIndex}`}
                            checked={opt.isCorrect}
                            onChange={() => handleSetCorrectOption(qIndex, optIndex)}
                            className="w-5 h-5 text-blue-600 cursor-pointer"
                            title="Mark as correct answer"
                          />
                          <input 
                            required
                            type="text"
                            value={opt.optionText}
                            onChange={(e) => handleOptionTextChange(qIndex, optIndex, e.target.value)}
                            placeholder={`Option ${optIndex + 1}`}
                            disabled={q.questionType === "true-false"}
                            className={`flex-1 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${
                              opt.isCorrect ? 'border-green-400 bg-green-50' : 'border-gray-300'
                            } ${q.questionType === "true-false" ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
                          />
                          {q.questionType !== "true-false" && (
                            <button 
                              type="button"
                              onClick={() => removeOption(qIndex, optIndex)}
                              disabled={q.options.length <= 2}
                              className="text-gray-400 hover:text-red-500 disabled:opacity-30 p-1"
                            >
                              <X size={18}/>
                            </button>
                          )}
                        </div>
                      ))}
                      
                      {q.questionType !== "true-false" && (
                        <button 
                          type="button"
                          onClick={() => addOption(qIndex)}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2 font-medium"
                        >
                          <PlusCircle size={16}/> Add Option
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Accounting Explanation */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <HelpCircle size={16} className="text-gray-400"/> 
                    Explanation / Double Entry Logic (Optional)
                  </label>
                  <textarea 
                    rows={2}
                    value={q.explanation || ""}
                    onChange={(e) => handleQuestionChange(qIndex, "explanation", e.target.value)}
                    placeholder="e.g. Dr. Profit & Loss A/C, Cr. Provision for Bad Debts A/C"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            ))}

            {/* Add New Question Button */}
            <button 
              type="button"
              onClick={addQuestion}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition flex flex-col items-center justify-center gap-2 font-medium"
            >
              <PlusCircle size={24} />
              Add Another Question
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UpdateQuiz;