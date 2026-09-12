"use client";

export function QuestionCards({
  questions,
  activeQuestion,
  onSelect,
  cascadeKey,
}: {
  questions: string[];
  activeQuestion?: string;
  onSelect: (question: string) => void;
  cascadeKey: string;
}) {
  const displayQuestions = questions.slice(0, 3);

  return (
    <div className="flex flex-col gap-3">
      {displayQuestions.map((q, i) => (
        <button
          key={`${cascadeKey}-${i}`}
          onClick={() => onSelect(q)}
          className={`rounded-full border px-4 py-3 min-h-14 text-left text-warm-off-white animate-cascade-in ${
            q === activeQuestion ? "border-ember text-ember" : "border-whisper-warm"
          }`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {q}
        </button>
      ))}
    </div>
  );
}
