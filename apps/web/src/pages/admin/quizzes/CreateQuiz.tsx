import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  PlusCircle,
  Trash2,
  Settings,
  HelpCircle,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";
import { toast } from "react-hot-toast";
import QuizService, {
  type QuizPayload,
  type QuizQuestion,
} from "../../../services/QuizService";
import ClassService, { type ClassData } from "../../../services/ClassService"; // <-- IMPORT ADDED
import RichTextEditor from "../../../components/editor/RichTextEditor";

const CreateQuiz: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // State to hold dynamic classes from the backend
  const [availableClasses, setAvailableClasses] = useState<ClassData[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  // Fetch classes on component mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        const response = await ClassService.getAllClasses();

        // Match your ClassResponse interface logic
        if (response && response.classes) {
          setAvailableClasses(response.classes);
        } else if (Array.isArray(response)) {
          // Fallback just in case the backend returns an array directly
          setAvailableClasses(response);
        }
      } catch (error) {
        toast.error("Failed to load classes for the dropdown.");
        console.error("Error fetching classes:", error);
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);

  // Initial State matching QuizPayload
  const [quizData, setQuizData] = useState<QuizPayload>({
    title: "",
    description: "",
    class: [], // Will be filled from dropdown (support multiple classes)
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
    questions: [
      {
        questionText: "",
        questionType: "mcq",
        points: 1,
        explanation: "",
        options: [
          { optionText: "", isCorrect: true },
          { optionText: "", isCorrect: false },
        ],
      },
    ],
  });

  // --- Handlers for Basic Info ---
  const handleBasicInfoChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const target = e.target as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;
    const { name, type } = target as HTMLInputElement;

    // Handle multi-select for classes
    if (
      name === "class" &&
      target instanceof HTMLSelectElement &&
      target.multiple
    ) {
      const selected = Array.from(target.selectedOptions).map((o) => o.value);
      setQuizData((prev) => ({ ...prev, class: selected }));
      return;
    }

    const value =
      type === "number"
        ? Number((target as HTMLInputElement).value)
        : (target as any).value;
    setQuizData((prev) => ({ ...prev, [name]: value }));
  };

  // Toggle class selection (checkbox list)
  const handleToggleClass = (clsId: string) => {
    setQuizData((prev) => {
      const prevClasses = Array.isArray(prev.class)
        ? [...(prev.class as string[])]
        : prev.class
          ? [prev.class as string]
          : [];
      const idx = prevClasses.indexOf(clsId);
      if (idx === -1) prevClasses.push(clsId);
      else prevClasses.splice(idx, 1);
      return { ...prev, class: prevClasses };
    });
  };

  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked, value, type } = e.target;
    setQuizData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings!,
        [name]: type === "checkbox" ? checked : Number(value),
      },
    }));
  };

  // --- Handlers for Dynamic Questions ---
  const addQuestion = () => {
    setQuizData((prev) => ({
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
            { optionText: "", isCorrect: false },
          ],
        },
      ],
    }));
  };

  const removeQuestion = (qIndex: number) => {
    setQuizData((prev) => {
      const updatedQs = [...prev.questions!];
      updatedQs.splice(qIndex, 1);
      return { ...prev, questions: updatedQs };
    });
  };

  const handleQuestionChange = (
    qIndex: number,
    field: keyof QuizQuestion,
    value: any,
  ) => {
    setQuizData((prev) => {
      const updatedQs = [...prev.questions!];

      // Auto-format the options array if the question type changes
      if (field === "questionType") {
        if (value === "mcq") {
          const firstCorrectIndex = updatedQs[qIndex].options.findIndex(
            (opt) => opt.isCorrect,
          );
          if (firstCorrectIndex !== -1) {
            updatedQs[qIndex].options = updatedQs[qIndex].options.map(
              (opt, i) => ({
                ...opt,
                isCorrect: i === firstCorrectIndex,
              }),
            );
          }
        } else if (value === "true-false") {
          updatedQs[qIndex].options = [
            { optionText: "True", isCorrect: true },
            { optionText: "False", isCorrect: false },
          ];
        } else if (value === "short-answer") {
          updatedQs[qIndex].options = [
            {
              optionText: updatedQs[qIndex].options[0]?.optionText || "",
              isCorrect: true,
            },
          ];
        }
      }

      updatedQs[qIndex] = { ...updatedQs[qIndex], [field]: value };
      return { ...prev, questions: updatedQs };
    });
  };

  // --- Handlers for Dynamic Options ---
  const addOption = (qIndex: number) => {
    setQuizData((prev) => {
      const updatedQs = [...prev.questions!];
      updatedQs[qIndex].options.push({ optionText: "", isCorrect: false });
      return { ...prev, questions: updatedQs };
    });
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    setQuizData((prev) => {
      const updatedQs = [...prev.questions!];
      updatedQs[qIndex].options.splice(optIndex, 1);
      return { ...prev, questions: updatedQs };
    });
  };

  const handleOptionTextChange = (
    qIndex: number,
    optIndex: number,
    text: string,
  ) => {
    setQuizData((prev) => {
      const updatedQs = [...prev.questions!];
      updatedQs[qIndex].options[optIndex].optionText = text;
      return { ...prev, questions: updatedQs };
    });
  };

  const handleSetCorrectOption = (
    qIndex: number,
    optIndex: number,
    checked: boolean,
  ) => {
    setQuizData((prev) => {
      const updatedQs = [...prev.questions!];
      const qType = updatedQs[qIndex].questionType;

      if (qType === "mcq" || qType === "true-false") {
        // Only one option can be correct
        updatedQs[qIndex].options = updatedQs[qIndex].options.map((opt, i) => ({
          ...opt,
          isCorrect: i === optIndex,
        }));
      } else {
        // Multi-select allows independent checkbox state per option
        updatedQs[qIndex].options[optIndex].isCorrect = checked;
      }
      return { ...prev, questions: updatedQs };
    });
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const classesSelected = Array.isArray(quizData.class)
      ? quizData.class.length > 0
      : !!quizData.class;
    if (!classesSelected) {
      toast.error("Please select at least one class/batch for this quiz.");
      return;
    }

    try {
      setLoading(true);
      const response = await QuizService.createQuiz(quizData);
      if (response.success) {
        toast.success("Quiz created successfully!");
        navigate("/admin/quizzes");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create quiz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-screen">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
        {/* Header Actions */}
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 py-4">
          <button
            type="button"
            onClick={() => navigate("/admin/quizzes")}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition flex-shrink-0"
            title="Back"
          >
            <ChevronLeft size={23} style={{ color: "#0A5B70" }} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Create New Quiz
            </h1>
            <p className="font-semibold text-gray-700 text-sm">
              Design your SL Accounting assessment
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN - Settings & Details */}
          <div className="space-y-6 lg:col-span-1">
            {/* Basic Details Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h2
                className="text-lg font-semibold uppercase flex items-center gap-2 mb-4 pb-3 border-b border-gray-200"
                style={{ color: "#0A5B70" }}
              >
                <Settings size={18} style={{ color: "#0A5B70" }} /> General Info
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Quiz Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    name="title"
                    value={quizData.title}
                    onChange={handleBasicInfoChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Term 1: Final Accounts"
                  />
                </div>

                {/* DYNAMIC CLASS SELECTION */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Target Class/Batch <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {loadingClasses ? (
                      <p className="text-sm text-gray-500">
                        Loading classes...
                      </p>
                    ) : availableClasses.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No classes available
                      </p>
                    ) : (
                      availableClasses.map((cls) => {
                        const checked = Array.isArray(quizData.class)
                          ? (quizData.class as string[]).includes(cls._id)
                          : quizData.class === cls._id;
                        return (
                          <label
                            key={cls._id}
                            className="flex items-center gap-3"
                          >
                            <input
                              type="checkbox"
                              name="class"
                              value={cls._id}
                              checked={checked}
                              onChange={() => handleToggleClass(cls._id)}
                              disabled={loadingClasses}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">
                              {cls.name}{" "}
                              {cls.batch
                                ? `(${typeof cls.batch === "string" ? cls.batch : cls.batch.name})`
                                : ""}{" "}
                              - {cls.type}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Duration (mins)
                    </label>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Pass Mark (%)
                    </label>
                    <input
                      required
                      type="number"
                      name="passingPercentage"
                      min="0"
                      max="100"
                      value={quizData.passingPercentage}
                      onChange={handleBasicInfoChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Quiz Type
                  </label>
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
              <h2
                className="text-lg font-semibold uppercase flex items-center gap-2 mb-4 pb-3 border-b border-gray-200"
                style={{ color: "#0A5B70" }}
              >
                Exam Rules
              </h2>

              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="shuffleQuestions"
                    checked={quizData.settings?.shuffleQuestions}
                    onChange={handleSettingChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    Shuffle Questions
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="shuffleOptions"
                    checked={quizData.settings?.shuffleOptions}
                    onChange={handleSettingChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Shuffle Options</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="allowBacktrack"
                    checked={quizData.settings?.allowBacktrack}
                    onChange={handleSettingChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    Allow Backtracking
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="showResultImmediately"
                    checked={quizData.settings?.showResultImmediately}
                    onChange={handleSettingChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    Show Results Immediately
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Question Builder */}
          <div className="lg:col-span-2 space-y-6">
            {quizData.questions?.map((q, qIndex) => (
              <div
                key={qIndex}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative group"
              >
                {/* Question Header */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                  <h3
                    className="font-bold text-lg uppercase"
                    style={{ color: "#0A5B70" }}
                  >
                    Question {qIndex + 1}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Question"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Question Text & Points & Type */}
                <div className="grid grid-cols-12 gap-4 mb-4">
                  <div className="col-span-12 md:col-span-12">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Question Text
                    </label>
                    <RichTextEditor
                      content={q.questionText}
                      onChange={(value) =>
                        handleQuestionChange(qIndex, "questionText", value)
                      }
                    />
                  </div>

                  {/* --- NEW: Question Type Selector --- */}
                  <div className="col-span-6 md:col-span-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Question Type
                    </label>
                    <select
                      value={q.questionType}
                      onChange={(e) =>
                        handleQuestionChange(
                          qIndex,
                          "questionType",
                          e.target.value,
                        )
                      }
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="mcq">Multiple Choice</option>
                      <option value="multi-select">Multiple Select</option>
                      <option value="true-false">True / False</option>
                      <option value="short-answer">Short Answer</option>
                    </select>
                  </div>

                  <div className="col-span-6 md:col-span-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Points
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={q.points}
                      onChange={(e) =>
                        handleQuestionChange(
                          qIndex,
                          "points",
                          Number(e.target.value),
                        )
                      }
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Options Builder */}
                <div className="space-y-3 mb-4 border-t border-gray-100 pt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Answers
                  </label>

                  {q.questionType === "short-answer" ? (
                    // SHORT ANSWER UI: Just a single text input for the correct answer
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-500 text-white flex-shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <input
                        required
                        type="text"
                        value={q.options[0]?.optionText || ""}
                        onChange={(e) =>
                          handleOptionTextChange(qIndex, 0, e.target.value)
                        }
                        placeholder="Type the exact correct answer here..."
                        className="flex-1 p-2 border border-green-400 bg-green-50 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    // MCQ, MULTI-SELECT, and TRUE/FALSE UI
                    <>
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-3">
                          <input
                            type={
                              q.questionType === "multi-select"
                                ? "checkbox"
                                : "radio"
                            }
                            name={`correct-option-${qIndex}`}
                            checked={opt.isCorrect}
                            onChange={(e) =>
                              handleSetCorrectOption(
                                qIndex,
                                optIndex,
                                e.target.checked,
                              )
                            }
                            className="w-5 h-5 accent-blue-600 cursor-pointer"
                            title="Mark as correct answer"
                          />
                          <input
                            required
                            type="text"
                            value={opt.optionText}
                            onChange={(e) =>
                              handleOptionTextChange(
                                qIndex,
                                optIndex,
                                e.target.value,
                              )
                            }
                            placeholder={`Option ${optIndex + 1}`}
                            disabled={q.questionType === "true-false"} // Lock text for True/False
                            className={`flex-1 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${
                              opt.isCorrect
                                ? "border-green-400 bg-green-50"
                                : "border-gray-300"
                            } ${q.questionType === "true-false" ? "bg-gray-100 text-gray-600" : ""}`}
                          />
                          {q.questionType !== "true-false" && (
                            <button
                              type="button"
                              onClick={() => removeOption(qIndex, optIndex)}
                              disabled={q.options.length <= 2}
                              className="text-gray-400 hover:text-red-500 disabled:opacity-30 p-1"
                            >
                              <X size={18} />
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Only allow adding options if it's not True/False */}
                      {q.questionType !== "true-false" && (
                        <button
                          type="button"
                          onClick={() => addOption(qIndex)}
                          className="text-sm flex items-center gap-1 mt-2 font-medium hover:opacity-80"
                          style={{ color: "#0A5B70" }}
                        >
                          <PlusCircle size={16} /> Add Option
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Accounting Explanation */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <HelpCircle size={16} className="text-gray-400" />
                    Explanation / Double Entry Logic (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={q.explanation || ""}
                    onChange={(e) =>
                      handleQuestionChange(
                        qIndex,
                        "explanation",
                        e.target.value,
                      )
                    }
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
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl hover:bg-blue-50 transition flex flex-col items-center justify-center gap-2 font-medium"
              style={{ color: "#0A5B70", borderColor: "#0A5B70" }}
            >
              <PlusCircle size={24} />
              Add Another Question
            </button>
            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/admin/quizzes")}
                className="px-10 py-2 border border-gray-300 font-bold text-gray-700 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-2 bg-[#0A5B70] hover:bg-[#08475A] font-bold text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateQuiz;
