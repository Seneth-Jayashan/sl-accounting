import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Save,
  X,
  Plus,
  Trash2,
  Settings,
  HelpCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ChevronDown,
  ListChecks,
  Award,
  Check,
} from "lucide-react";
import { toast } from "react-hot-toast";
import QuizService, {
  type QuizPayload,
  type QuizQuestion,
} from "../../../services/QuizService";
import ClassService, { type ClassData } from "../../../services/ClassService";
import RichTextEditor from "../../../components/editor/RichTextEditor";

// --- Toggle Switch Helper ---

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-brand-prussian">{label}</p>
        {description && (
          <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${checked ? "bg-brand-cerulean" : "bg-slate-300"
          }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${checked ? "translate-x-4" : "translate-x-0"
            }`}
        />
      </button>
    </div>
  );
}

// --- Skeleton Loader ---

function UpdateQuizSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse pb-16">
      <div className="flex items-center justify-between py-3 border-b border-slate-200/70">
        <div className="space-y-2">
          <div className="h-7 w-44 bg-slate-200 rounded-lg" />
          <div className="h-4 w-56 bg-slate-100 rounded-md" />
        </div>
        <div className="flex gap-2.5">
          <div className="h-10 w-24 bg-slate-100 rounded-xl" />
          <div className="h-10 w-32 bg-slate-200 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="h-96 bg-white rounded-2xl border border-slate-100" />
          <div className="h-56 bg-white rounded-2xl border border-slate-100" />
        </div>
        <div className="lg:col-span-8 space-y-5">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-80 bg-white rounded-2xl border border-slate-100"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

const UpdateQuiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [availableClasses, setAvailableClasses] = useState<ClassData[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [quizData, setQuizData] = useState<QuizPayload>({
    title: "",
    description: "",
    class: [],
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
    questions: [],
  });

  // Fetch Classes and Existing Quiz Data
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!id) return;

      try {
        setInitialLoading(true);

        const [classRes, quizRes] = await Promise.all([
          ClassService.getAllClasses(),
          QuizService.getQuizById(id),
        ]);

        if (classRes && classRes.classes) {
          setAvailableClasses(classRes.classes);
        } else if (Array.isArray(classRes)) {
          setAvailableClasses(classRes);
        }

        if (quizRes.success && quizRes.data) {
          const fetchedQuiz: any = quizRes.data;

          let classValue: any = [];
          if (Array.isArray(fetchedQuiz.class)) {
            classValue = fetchedQuiz.class.map((c: any) =>
              typeof c === "object" && c !== null ? c._id : c
            );
          } else if (fetchedQuiz.class) {
            classValue = [
              typeof fetchedQuiz.class === "object" && fetchedQuiz.class !== null
                ? fetchedQuiz.class._id
                : fetchedQuiz.class,
            ];
          }

          setQuizData({
            title: fetchedQuiz.title || "",
            description: fetchedQuiz.description || "",
            class: classValue,
            duration: fetchedQuiz.duration || 60,
            quizType: fetchedQuiz.quizType || "live",
            passingPercentage: fetchedQuiz.passingPercentage ?? 40,
            isPublished: Boolean(fetchedQuiz.isPublished),
            ...(fetchedQuiz.isPublic !== undefined
              ? { isPublic: Boolean(fetchedQuiz.isPublic) }
              : {}),
            settings: fetchedQuiz.settings || {
              shuffleQuestions: true,
              shuffleOptions: true,
              allowBacktrack: true,
              maxAttempts: 1,
              showResultImmediately: false,
            },
            questions: fetchedQuiz.questions || [],
          } as QuizPayload);
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

  // Derived Totals
  const totalQuestions = quizData.questions?.length || 0;
  const totalPoints = useMemo(
    () =>
      (quizData.questions || []).reduce(
        (sum, q) => sum + (Number(q.points) || 0),
        0
      ),
    [quizData.questions]
  );
  const selectedClassCount = Array.isArray(quizData.class)
    ? quizData.class.length
    : quizData.class
      ? 1
      : 0;

  // --- Handlers for Basic Info ---
  const handleBasicInfoChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const target = e.target;
    const { name, type } = target as HTMLInputElement;

    if (name === "class" && target instanceof HTMLSelectElement && target.multiple) {
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

  const handleToggleSetting = (
    key: keyof NonNullable<QuizPayload["settings"]>,
    value: boolean
  ) => {
    setQuizData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings!,
        [key]: value,
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
    if ((quizData.questions?.length || 0) <= 1) return;
    setQuizData((prev) => {
      const updatedQs = [...prev.questions!];
      updatedQs.splice(qIndex, 1);
      return { ...prev, questions: updatedQs };
    });
  };

  const handleQuestionChange = (
    qIndex: number,
    field: keyof QuizQuestion,
    value: any
  ) => {
    setQuizData((prev) => {
      const updatedQs = [...prev.questions!];
      const current = { ...updatedQs[qIndex] };

      if (field === "questionType") {
        if (value === "true-false") {
          current.options = [
            { optionText: "True", isCorrect: true },
            { optionText: "False", isCorrect: false },
          ];
        } else if (value === "short-answer") {
          current.options = [
            {
              optionText: current.options[0]?.optionText || "",
              isCorrect: true,
            },
          ];
        } else if (current.options.length < 2) {
          current.options = [
            { optionText: current.options[0]?.optionText || "", isCorrect: true },
            { optionText: "", isCorrect: false },
          ];
        }
      }

      updatedQs[qIndex] = { ...current, [field]: value };
      return { ...prev, questions: updatedQs };
    });
  };

  // --- Handlers for Dynamic Options ---
  const addOption = (qIndex: number) => {
    setQuizData((prev) => {
      const updatedQs = [...prev.questions!];
      updatedQs[qIndex] = {
        ...updatedQs[qIndex],
        options: [...updatedQs[qIndex].options, { optionText: "", isCorrect: false }],
      };
      return { ...prev, questions: updatedQs };
    });
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    setQuizData((prev) => {
      const updatedQs = [...prev.questions!];
      const nextOpts = [...updatedQs[qIndex].options];
      nextOpts.splice(optIndex, 1);
      updatedQs[qIndex] = { ...updatedQs[qIndex], options: nextOpts };
      return { ...prev, questions: updatedQs };
    });
  };

  const handleOptionTextChange = (
    qIndex: number,
    optIndex: number,
    text: string
  ) => {
    setQuizData((prev) => {
      const updatedQs = [...prev.questions!];
      const nextOpts = [...updatedQs[qIndex].options];
      nextOpts[optIndex] = { ...nextOpts[optIndex], optionText: text };
      updatedQs[qIndex] = { ...updatedQs[qIndex], options: nextOpts };
      return { ...prev, questions: updatedQs };
    });
  };

  const handleSetCorrectOption = (qIndex: number, optIndex: number) => {
    setQuizData((prev) => {
      const updatedQs = [...prev.questions!];
      const qType = updatedQs[qIndex].questionType;

      if (qType === "mcq" || qType === "true-false") {
        updatedQs[qIndex] = {
          ...updatedQs[qIndex],
          options: updatedQs[qIndex].options.map((opt, i) => ({
            ...opt,
            isCorrect: i === optIndex,
          })),
        };
      } else {
        const nextOpts = [...updatedQs[qIndex].options];
        nextOpts[optIndex] = {
          ...nextOpts[optIndex],
          isCorrect: !nextOpts[optIndex].isCorrect,
        };
        updatedQs[qIndex] = { ...updatedQs[qIndex], options: nextOpts };
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

  if (initialLoading) return <UpdateQuizSkeleton />;

  return (
    <div className="max-w-6xl mx-auto pb-28 md:pb-16">
      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        {/* STICKY TOP BAR */}
        <header className="sticky top-0 z-30 -mx-2 px-2 py-3 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/quizzes")}
              className="p-2 rounded-xl bg-white border border-slate-200/80 text-slate-500 hover:text-brand-prussian shadow-sm transition-colors"
              title="Back to Quizzes"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-brand-prussian tracking-tight leading-tight">
                  Edit Quiz
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-aliceBlue text-brand-cerulean ring-1 ring-brand-cerulean/20">
                  Editing
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <ListChecks className="w-3.5 h-3.5 text-brand-cerulean" />
                  <strong className="text-brand-prussian">{totalQuestions}</strong>{" "}
                  {totalQuestions === 1 ? "Question" : "Questions"}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <strong className="text-brand-prussian">{totalPoints}</strong>{" "}
                  Total Pts
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => navigate("/admin/quizzes")}
              disabled={loading}
              className="px-4 py-2.5 bg-white border border-slate-200/80 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-prussian hover:bg-brand-cerulean text-white rounded-xl transition-all text-xs font-semibold shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? "Updating..." : "Update Quiz"}</span>
            </button>
          </div>
        </header>

        {/* MAIN 2-COLUMN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: SETTINGS & DETAILS */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* General Info Card */}
            <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/70 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-brand-prussian">
                    General Info
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Title, target classes & timing
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Quiz Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    name="title"
                    value={quizData.title}
                    onChange={handleBasicInfoChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-brand-prussian placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none transition-all"
                  />
                </div>

                {/* Target Classes */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Target Classes <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-semibold text-brand-cerulean bg-brand-aliceBlue px-2 py-0.5 rounded-md tabular-nums">
                      {selectedClassCount} selected
                    </span>
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1.5 p-2 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                    {loadingClasses ? (
                      <div className="flex items-center justify-center py-6 text-xs text-slate-400 gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-brand-cerulean" />
                        Loading classes...
                      </div>
                    ) : availableClasses.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">
                        No classes available
                      </p>
                    ) : (
                      availableClasses.map((cls) => {
                        const checked = Array.isArray(quizData.class)
                          ? (quizData.class as string[]).includes(cls._id)
                          : quizData.class === cls._id;
                        const batchName = cls.batch
                          ? typeof cls.batch === "string"
                            ? cls.batch
                            : (cls.batch as any).name
                          : null;

                        return (
                          <label
                            key={cls._id}
                            className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${checked
                                ? "bg-white ring-1 ring-brand-cerulean/30 shadow-sm"
                                : "hover:bg-white/70"
                              }`}
                          >
                            <input
                              type="checkbox"
                              name="class"
                              value={cls._id}
                              checked={checked}
                              onChange={() => handleToggleClass(cls._id)}
                              className="mt-0.5 w-4 h-4 rounded text-brand-cerulean border-slate-300 focus:ring-brand-cerulean"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-brand-prussian truncate">
                                {cls.name}
                              </p>
                              <p className="text-[10px] text-slate-400 capitalize">
                                {batchName ? `${batchName} • ` : ""}
                                {cls.type}
                              </p>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Duration & Pass Mark */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Duration (min)
                    </label>
                    <input
                      required
                      type="number"
                      name="duration"
                      min="1"
                      value={quizData.duration}
                      onChange={handleBasicInfoChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-brand-prussian tabular-nums focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-brand-prussian tabular-nums focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                    />
                  </div>
                </div>

                {/* Quiz Type */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Quiz Type
                  </label>
                  <div className="relative">
                    <select
                      name="quizType"
                      value={quizData.quizType}
                      onChange={handleBasicInfoChange}
                      className="w-full appearance-none pl-3.5 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-brand-prussian focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none cursor-pointer"
                    >
                      <option value="live">Live Exam</option>
                      <option value="schedule">Scheduled Exam</option>
                      <option value="practice">Practice Quiz</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Public Exam Toggle */}
                <div className="pt-2 border-t border-slate-100">
                  <ToggleRow
                    label="Public Exam"
                    description="Any registered student can participate without payment."
                    checked={Boolean((quizData as any).isPublic)}
                    onChange={(val) =>
                      setQuizData((prev: any) => ({ ...prev, isPublic: val }))
                    }
                  />
                </div>
              </div>
            </section>

            {/* Exam Rules Card */}
            <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/70 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-brand-prussian">
                    Exam Rules
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Randomization & student feedback
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                <ToggleRow
                  label="Shuffle Questions"
                  checked={Boolean(quizData.settings?.shuffleQuestions)}
                  onChange={(val) => handleToggleSetting("shuffleQuestions", val)}
                />
                <ToggleRow
                  label="Shuffle Options"
                  checked={Boolean(quizData.settings?.shuffleOptions)}
                  onChange={(val) => handleToggleSetting("shuffleOptions", val)}
                />
                <ToggleRow
                  label="Allow Backtracking"
                  checked={Boolean(quizData.settings?.allowBacktrack)}
                  onChange={(val) => handleToggleSetting("allowBacktrack", val)}
                />
                <ToggleRow
                  label="Show Results Immediately"
                  checked={Boolean(quizData.settings?.showResultImmediately)}
                  onChange={(val) =>
                    handleToggleSetting("showResultImmediately", val)
                  }
                />
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: QUESTION BUILDER */}
          <div className="lg:col-span-8 space-y-5">
            {quizData.questions?.map((q, qIndex) => (
              <div
                key={qIndex}
                className="bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden"
              >
                {/* Question Card Header */}
                <div className="px-5 sm:px-6 py-3.5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-prussian text-white text-xs font-bold tabular-nums shadow-sm">
                      Q{qIndex + 1}
                    </span>
                    <span className="text-sm font-bold text-brand-prussian">
                      Question {qIndex + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Question Type */}
                    <div className="relative">
                      <select
                        value={q.questionType}
                        onChange={(e) =>
                          handleQuestionChange(
                            qIndex,
                            "questionType",
                            e.target.value
                          )
                        }
                        className="appearance-none bg-white border border-slate-200/80 rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold text-brand-prussian focus:border-brand-cerulean outline-none cursor-pointer"
                      >
                        <option value="mcq">Multiple Choice</option>
                        <option value="multi-select">Multiple Select</option>
                        <option value="true-false">True / False</option>
                        <option value="short-answer">Short Answer</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Points */}
                    <div className="flex items-center bg-white border border-slate-200/80 rounded-lg px-2.5 py-1">
                      <input
                        type="number"
                        min="1"
                        value={q.points}
                        onChange={(e) =>
                          handleQuestionChange(
                            qIndex,
                            "points",
                            Number(e.target.value)
                          )
                        }
                        className="w-10 text-xs font-bold text-brand-prussian text-center outline-none tabular-nums"
                        title="Points"
                      />
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">
                        pts
                      </span>
                    </div>

                    {/* Remove Question */}
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      disabled={totalQuestions <= 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={
                        totalQuestions <= 1
                          ? "At least one question is required"
                          : "Delete Question"
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Card Body */}
                <div className="p-5 sm:p-6 space-y-5">
                  {/* Rich Text Question Prompt */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Question Prompt
                    </label>
                    <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-white">
                      <RichTextEditor
                        content={q.questionText}
                        onChange={(value) =>
                          handleQuestionChange(qIndex, "questionText", value)
                        }
                      />
                    </div>
                  </div>

                  {/* Answers / Options */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {q.questionType === "short-answer"
                        ? "Correct Answer"
                        : q.questionType === "multi-select"
                          ? "Answer Options (Select all correct)"
                          : "Answer Options (Select one correct)"}
                    </label>

                    {q.questionType === "short-answer" ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0">
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <input
                          required
                          type="text"
                          value={q.options[0]?.optionText || ""}
                          onChange={(e) =>
                            handleOptionTextChange(qIndex, 0, e.target.value)
                          }
                          placeholder="Type the exact correct answer here..."
                          className="flex-1 px-3.5 py-2.5 border border-emerald-300 bg-emerald-50/60 rounded-xl text-sm font-medium text-emerald-950 placeholder:text-emerald-700/50 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {q.options.map((opt, optIndex) => {
                          const letter = String.fromCharCode(65 + optIndex);
                          return (
                            <div
                              key={optIndex}
                              className="flex items-center gap-2.5"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleSetCorrectOption(qIndex, optIndex)
                                }
                                title="Mark as correct answer"
                                className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-bold shrink-0 transition-all ${opt.isCorrect
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                    : "bg-slate-50 text-slate-500 border-slate-200 hover:border-brand-cerulean hover:text-brand-cerulean"
                                  }`}
                              >
                                {opt.isCorrect ? (
                                  <Check className="w-4 h-4 stroke-[2.5]" />
                                ) : (
                                  letter
                                )}
                              </button>

                              <input
                                required
                                type="text"
                                value={opt.optionText}
                                onChange={(e) =>
                                  handleOptionTextChange(
                                    qIndex,
                                    optIndex,
                                    e.target.value
                                  )
                                }
                                placeholder={`Option ${letter}`}
                                disabled={q.questionType === "true-false"}
                                className={`flex-1 px-3.5 py-2 border rounded-xl text-sm font-medium outline-none transition-all ${opt.isCorrect
                                    ? "border-emerald-300 bg-emerald-50/50 text-emerald-950 focus:bg-white focus:border-emerald-500"
                                    : "border-slate-200/80 bg-slate-50 text-brand-prussian focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20"
                                  } ${q.questionType === "true-false"
                                    ? "cursor-not-allowed opacity-80"
                                    : ""
                                  }`}
                              />

                              {q.questionType !== "true-false" && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(qIndex, optIndex)}
                                  disabled={q.options.length <= 2}
                                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                                  title="Remove option"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}

                        {q.questionType !== "true-false" && (
                          <button
                            type="button"
                            onClick={() => addOption(qIndex)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-cerulean hover:text-brand-prussian bg-brand-aliceBlue/60 hover:bg-brand-aliceBlue px-3 py-1.5 rounded-lg transition-colors mt-1"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            Add Option
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Explanation */}
                  <div className="pt-4 border-t border-slate-100 space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <HelpCircle className="w-3.5 h-3.5 text-brand-cerulean" />
                      Explanation / Double Entry Logic{" "}
                      <span className="text-slate-400 font-normal normal-case">
                        (Optional)
                      </span>
                    </label>
                    <textarea
                      rows={2}
                      value={q.explanation || ""}
                      onChange={(e) =>
                        handleQuestionChange(
                          qIndex,
                          "explanation",
                          e.target.value
                        )
                      }
                      placeholder="e.g., Dr. Profit & Loss A/C, Cr. Provision for Bad Debts A/C"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none resize-none transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Add Question CTA */}
            <button
              type="button"
              onClick={addQuestion}
              className="w-full py-5 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:text-brand-cerulean hover:border-brand-cerulean hover:bg-brand-aliceBlue/25 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              Add Question #{totalQuestions + 1}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UpdateQuiz;