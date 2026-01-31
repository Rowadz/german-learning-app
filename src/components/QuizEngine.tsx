import { useState, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
import {
  selectCurrentQuestion,
  selectQuizProgress,
  selectCurrentAttempt,
  selectIsQuizActive,
  answerQuestion,
  nextQuestion,
  finishQuiz,
  endQuiz,
} from '../store/quizzesSlice';
import { recordReview } from '../store/progressSlice';

export function QuizEngine() {
  const dispatch = useAppDispatch();
  const isActive = useAppSelector(selectIsQuizActive);
  const currentQuestion = useAppSelector(selectCurrentQuestion);
  const progress = useAppSelector(selectQuizProgress);
  const attempt = useAppSelector(selectCurrentAttempt);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [typingAnswer, setTypingAnswer] = useState('');

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(currentQuestion?.userAnswer || null);
    setHasAnswered(currentQuestion?.userAnswer !== undefined);
    setTypingAnswer(currentQuestion?.userAnswer || '');
  }, [currentQuestion]);

  const handleSelectAnswer = useCallback((answer: string) => {
    if (hasAnswered) return;
    setSelectedAnswer(answer);
  }, [hasAnswered]);

  const handleSubmitAnswer = useCallback(() => {
    if (!currentQuestion) return;

    const answer = attempt?.settings.quizType === 'typing' ? typingAnswer : selectedAnswer;
    if (!answer) return;

    dispatch(answerQuestion(answer));
    setHasAnswered(true);

    // Record the review for progress tracking
    const isCorrect =
      attempt?.settings.quizType === 'typing'
        ? typingAnswer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim()
        : answer === currentQuestion.correctAnswer;

    dispatch(recordReview({ entryId: currentQuestion.entryId, correct: isCorrect }));
  }, [dispatch, currentQuestion, selectedAnswer, typingAnswer, attempt]);

  const handleNext = useCallback(() => {
    if (!attempt) return;

    if (progress.current < progress.total) {
      dispatch(nextQuestion());
      setSelectedAnswer(null);
      setHasAnswered(false);
      setTypingAnswer('');
    } else {
      dispatch(finishQuiz());
    }
  }, [dispatch, progress, attempt]);

  const handleQuit = useCallback(() => {
    if (confirm('Are you sure you want to quit? Your progress will not be saved.')) {
      dispatch(endQuiz());
    }
  }, [dispatch]);

  if (!isActive || !currentQuestion || !attempt) {
    return null;
  }

  const isLastQuestion = progress.current === progress.total;
  const isTypingQuiz = attempt.settings.quizType === 'typing';

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Question {progress.current} of {progress.total}</span>
          <span>{progress.percentage}% complete</span>
        </div>
        <progress
          className="progress progress-primary w-full"
          value={progress.percentage}
          max="100"
        ></progress>
      </div>

      {/* Question card */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <div className="badge badge-outline mb-2">
            {attempt.settings.quizType === 'noun-to-phrase'
              ? 'Choose the phrase'
              : attempt.settings.quizType === 'phrase-to-translation'
              ? 'Choose the translation'
              : 'Type the phrase'}
          </div>

          <h2 className="card-title text-2xl mb-6">{currentQuestion.question}</h2>

          {/* Multiple choice options */}
          {!isTypingQuiz && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.correctAnswer;
                const showResult = hasAnswered;

                let btnClass = 'btn btn-block justify-start text-left h-auto py-4';
                if (showResult) {
                  if (isCorrect) {
                    btnClass += ' btn-success';
                  } else if (isSelected && !isCorrect) {
                    btnClass += ' btn-error';
                  } else {
                    btnClass += ' btn-outline';
                  }
                } else {
                  btnClass += isSelected ? ' btn-primary' : ' btn-outline';
                }

                return (
                  <button
                    key={index}
                    className={btnClass}
                    onClick={() => handleSelectAnswer(option)}
                    disabled={hasAnswered}
                  >
                    <span className="badge badge-outline mr-3">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {showResult && isCorrect && <span className="ml-2">✓</span>}
                    {showResult && isSelected && !isCorrect && <span className="ml-2">✗</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Typing input */}
          {isTypingQuiz && (
            <div className="space-y-4">
              <input
                type="text"
                className={`input input-bordered w-full text-lg ${
                  hasAnswered
                    ? currentQuestion.isCorrect
                      ? 'input-success'
                      : 'input-error'
                    : ''
                }`}
                placeholder="Type your answer..."
                value={typingAnswer}
                onChange={(e) => setTypingAnswer(e.target.value)}
                disabled={hasAnswered}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !hasAnswered && typingAnswer) {
                    handleSubmitAnswer();
                  }
                }}
              />
              {hasAnswered && !currentQuestion.isCorrect && (
                <div className="alert alert-info">
                  <span>Correct answer: {currentQuestion.correctAnswer}</span>
                </div>
              )}
            </div>
          )}

          {/* Result feedback */}
          {hasAnswered && (
            <div
              className={`alert ${
                currentQuestion.isCorrect ? 'alert-success' : 'alert-error'
              } mt-4`}
            >
              {currentQuestion.isCorrect ? (
                <span>Correct! Well done!</span>
              ) : (
                <span>
                  Incorrect. The correct answer was: {currentQuestion.correctAnswer}
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="card-actions justify-between mt-6">
            <button className="btn btn-outline btn-error" onClick={handleQuit}>
              Quit Quiz
            </button>

            {!hasAnswered ? (
              <button
                className="btn btn-primary"
                onClick={handleSubmitAnswer}
                disabled={isTypingQuiz ? !typingAnswer : !selectedAnswer}
              >
                Submit Answer
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleNext}>
                {isLastQuestion ? 'See Results' : 'Next Question'}
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
