import { useState, useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/useAppStore";
import {
  selectCurrentQuestion,
  selectQuizProgress,
  selectCurrentAttempt,
  selectIsQuizActive,
  answerQuestion,
  nextQuestion,
  finishQuiz,
  endQuiz,
} from "../store/quizzesSlice";
import { recordReview } from "../store/progressSlice";

export function QuizEngine() {
  const dispatch = useAppDispatch();
  const isActive = useAppSelector(selectIsQuizActive);
  const currentQuestion = useAppSelector(selectCurrentQuestion);
  const progress = useAppSelector(selectQuizProgress);
  const attempt = useAppSelector(selectCurrentAttempt);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [typingAnswer, setTypingAnswer] = useState("");
  const [animState, setAnimState] = useState<"enter" | "exit">("enter");
  const animTimerRef = useRef<number | null>(null);

  // Reset state when question changes and schedule enter animation
  useEffect(() => {
    setSelectedAnswer(currentQuestion?.userAnswer || null);
    setHasAnswered(currentQuestion?.userAnswer !== undefined);
    setTypingAnswer(currentQuestion?.userAnswer || "");

    // Clear any existing timers
    if (animTimerRef.current) {
      window.clearTimeout(animTimerRef.current);
      animTimerRef.current = null;
    }

    // Schedule the enter animation shortly after render to avoid synchronous setState in effect
    animTimerRef.current = window.setTimeout(() => {
      setAnimState("enter");
      animTimerRef.current = null;
    }, 50);

    return () => {
      if (animTimerRef.current) {
        window.clearTimeout(animTimerRef.current);
        animTimerRef.current = null;
      }
    };
  }, [currentQuestion]);

  const handleSelectAnswer = useCallback(
    (answer: string) => {
      if (hasAnswered) return;
      setSelectedAnswer(answer);
    },
    [hasAnswered],
  );

  const handleSubmitAnswer = useCallback(() => {
    if (!currentQuestion) return;

    const answer =
      attempt?.settings.quizType === "typing" ? typingAnswer : selectedAnswer;
    if (!answer) return;

    dispatch(answerQuestion(answer));
    setHasAnswered(true);

    // Record the review for progress tracking
    const isCorrect =
      attempt?.settings.quizType === "typing"
        ? typingAnswer.toLowerCase().trim() ===
          currentQuestion.correctAnswer.toLowerCase().trim()
        : answer === currentQuestion.correctAnswer;

    dispatch(
      recordReview({ entryId: currentQuestion.entryId, correct: isCorrect }),
    );
  }, [dispatch, currentQuestion, selectedAnswer, typingAnswer, attempt]);

  const handleNext = useCallback(() => {
    if (!attempt) return;

    if (progress.current < progress.total) {
      // start exit animation, then change question after animation duration
      setAnimState("exit");
      // clear existing timer if any
      if (animTimerRef.current) {
        window.clearTimeout(animTimerRef.current);
        animTimerRef.current = null;
      }
      animTimerRef.current = window.setTimeout(() => {
        dispatch(nextQuestion());
        setSelectedAnswer(null);
        setHasAnswered(false);
        setTypingAnswer("");
        // enter will be scheduled by the question-change effect
        animTimerRef.current = null;
      }, 300); // match CSS duration
    } else {
      dispatch(finishQuiz());
    }
  }, [dispatch, progress, attempt]);

  const handleQuit = useCallback(() => {
    if (
      confirm("Are you sure you want to quit? Your progress will not be saved.")
    ) {
      dispatch(endQuiz());
    }
  }, [dispatch]);

  if (!isActive || !currentQuestion || !attempt) {
    return null;
  }

  const isLastQuestion = progress.current === progress.total;
  const isTypingQuiz = attempt.settings.quizType === "typing";

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
      {/* Progress bar */}
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between text-xs sm:text-sm mb-2">
          <span>
            Question {progress.current} of {progress.total}
          </span>
          <span>{progress.percentage}%</span>
        </div>
        <progress
          className="progress progress-primary w-full"
          value={progress.percentage}
          max="100"
        ></progress>
      </div>

      {/* Question card */}
      <div
        className={`card bg-base-200 shadow-xl transform transition-all duration-300 ${
          animState === "enter"
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-6"
        }`}
      >
        <div className="card-body p-4 sm:p-6">
          <div className="badge badge-outline mb-2 text-xs sm:text-sm">
            {attempt.settings.quizType === "noun-to-phrase"
              ? "Choose the phrase"
              : attempt.settings.quizType === "phrase-to-translation"
                ? "Choose the translation"
                : "Type the phrase"}
          </div>

          <h2 className="card-title text-xl sm:text-2xl mb-4 sm:mb-6 break-words">
            {currentQuestion.question}
          </h2>

          {/* Multiple choice options */}
          {!isTypingQuiz && currentQuestion.options && (
            <div className="space-y-2 sm:space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.correctAnswer;
                const showResult = hasAnswered;

                let btnClass =
                  "btn btn-block justify-start text-left h-auto py-3 sm:py-4 px-3 sm:px-4";
                if (showResult) {
                  if (isCorrect) {
                    btnClass += " btn-success";
                  } else if (isSelected && !isCorrect) {
                    btnClass += " btn-error";
                  } else {
                    btnClass += " btn-outline";
                  }
                } else {
                  btnClass += isSelected ? " btn-primary" : " btn-outline";
                }

                return (
                  <button
                    key={index}
                    className={btnClass}
                    onClick={() => handleSelectAnswer(option)}
                    disabled={hasAnswered}
                  >
                    <span className="badge badge-outline mr-2 sm:mr-3 shrink-0">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1 text-sm sm:text-base break-words text-left">
                      {option}
                    </span>
                    {showResult && isCorrect && (
                      <span className="ml-2 shrink-0">✓</span>
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <span className="ml-2 shrink-0">✗</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Typing input */}
          {isTypingQuiz && (
            <div className="space-y-3 sm:space-y-4">
              <input
                type="text"
                className={`input input-bordered w-full text-base sm:text-lg ${
                  hasAnswered
                    ? currentQuestion.isCorrect
                      ? "input-success"
                      : "input-error"
                    : ""
                }`}
                placeholder="Type your answer..."
                value={typingAnswer}
                onChange={(e) => setTypingAnswer(e.target.value)}
                disabled={hasAnswered}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !hasAnswered && typingAnswer) {
                    handleSubmitAnswer();
                  }
                }}
              />
              {hasAnswered && !currentQuestion.isCorrect && (
                <div className="alert alert-info text-sm">
                  <span className="break-words">
                    Correct answer: {currentQuestion.correctAnswer}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Result feedback */}
          {hasAnswered && (
            <div
              className={`alert ${
                currentQuestion.isCorrect ? "alert-success" : "alert-error"
              } mt-3 sm:mt-4 text-sm sm:text-base`}
            >
              {currentQuestion.isCorrect ? (
                <span>Correct! Well done!</span>
              ) : (
                <span className="break-words">
                  Incorrect. The correct answer was:{" "}
                  {currentQuestion.correctAnswer}
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="card-actions flex-col sm:flex-row justify-between mt-4 sm:mt-6 gap-2">
            <button
              className="btn btn-outline btn-error w-full sm:w-auto order-2 sm:order-1"
              onClick={handleQuit}
            >
              Quit
            </button>

            {!hasAnswered ? (
              <button
                className="btn btn-primary w-full sm:w-auto order-1 sm:order-2"
                onClick={handleSubmitAnswer}
                disabled={isTypingQuiz ? !typingAnswer : !selectedAnswer}
              >
                Submit Answer
              </button>
            ) : (
              <button
                className="btn btn-primary w-full sm:w-auto order-1 sm:order-2"
                onClick={handleNext}
              >
                {isLastQuestion ? "See Results" : "Next Question"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Current score */}
      <div className="text-center mt-4">
        <span className="badge badge-lg badge-outline">
          Score: {attempt.score} / {progress.current}
        </span>
      </div>
    </div>
  );
}
