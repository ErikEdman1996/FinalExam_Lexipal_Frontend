import { useMemo, useState, type FormEvent } from 'react';
import { BookOpenText, CalendarDays, FileText, X } from 'lucide-react';
import {
  ApiResponseError,
  ApiValidationError,
  setBookCircleNextMeeting,
  type BookCircleReadResponseDTO,
} from '../../api/api';
import { Button } from '../../components/Button';
import { AppDialog, AppDialogClose, AppDialogTitle } from '../../components/dialog/AppDialog';
import {
  fieldErrorClassName,
  fieldHintClassName,
  fieldLabelClassName,
} from '../../components/form/inputStyles';
import {
  circleInputClassName,
  formatCircleDateTimeLocalInputValue,
  formatCircleMeetingDateForApi,
  parseCircleLocalDateTime,
} from './utils';

type MeetingMode = 'chapter' | 'pages';

type NextMeetingFieldName =
  | 'meetingDate'
  | 'chapterLabel'
  | 'pageStart'
  | 'pageEnd';

interface NextMeetingModalProps {
  circle: BookCircleReadResponseDTO;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedCircle: BookCircleReadResponseDTO) => void;
}

const getInitialMeetingMode = (circle: BookCircleReadResponseDTO): MeetingMode => {
  return circle.meetingPageStart != null && circle.meetingPageEnd != null ? 'pages' : 'chapter';
};

const validateNextMeetingForm = ({
  chapterLabel,
  meetingDate,
  mode,
  pageEnd,
  pageStart,
  totalPages,
}: {
  chapterLabel: string;
  meetingDate: string;
  mode: MeetingMode;
  pageEnd: string;
  pageStart: string;
  totalPages: number;
}) => {
  const errors: Partial<Record<NextMeetingFieldName, string>> = {};
  const trimmedChapterLabel = chapterLabel.trim();
  const parsedMeetingDate = meetingDate ? parseCircleLocalDateTime(meetingDate) : null;

  if (!meetingDate.trim()) {
    errors.meetingDate = 'Choose a meeting date and time.';
  } else if (!parsedMeetingDate || Number.isNaN(parsedMeetingDate.getTime())) {
    errors.meetingDate = 'Choose a valid meeting date and time.';
  } else if (parsedMeetingDate.getTime() <= Date.now()) {
    errors.meetingDate = 'Meeting date must be in the future.';
  }

  if (mode === 'chapter') {
    if (!trimmedChapterLabel) {
      errors.chapterLabel = 'Enter the chapter members should read.';
    } else if (trimmedChapterLabel.length > 100) {
      errors.chapterLabel = 'Chapter label must be 100 characters or fewer.';
    }

    return errors;
  }

  const parsedPageStart = Number(pageStart);
  const parsedPageEnd = Number(pageEnd);

  if (!Number.isInteger(parsedPageStart) || parsedPageStart < 1) {
    errors.pageStart = 'Start page must be at least 1.';
  }

  if (!Number.isInteger(parsedPageEnd) || parsedPageEnd < 1) {
    errors.pageEnd = 'End page must be at least 1.';
  }

  if (totalPages < 1) {
    errors.pageEnd = 'This circle does not have a valid total page count yet.';
    return errors;
  }

  if (Number.isInteger(parsedPageStart) && parsedPageStart > totalPages) {
    errors.pageStart = `Start page cannot be greater than ${totalPages}.`;
  }

  if (Number.isInteger(parsedPageEnd) && parsedPageEnd > totalPages) {
    errors.pageEnd = `End page cannot be greater than ${totalPages}.`;
  }

  if (
    Number.isInteger(parsedPageStart)
    && Number.isInteger(parsedPageEnd)
    && parsedPageStart >= 1
    && parsedPageEnd >= 1
    && parsedPageStart > parsedPageEnd
  ) {
    errors.pageEnd = 'End page must be greater than or equal to the start page.';
  }

  return errors;
};

export function NextMeetingModal({
  circle,
  isOpen,
  onClose,
  onSaved,
}: NextMeetingModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <NextMeetingModalContent
      key={`${circle.id}:${circle.nextMeetingDate ?? ''}:${circle.meetingChapterLabel ?? ''}:${circle.meetingPageStart ?? ''}:${circle.meetingPageEnd ?? ''}`}
      circle={circle}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function NextMeetingModalContent({
  circle,
  onClose,
  onSaved,
}: Omit<NextMeetingModalProps, 'isOpen'>) {
  const [meetingDate, setMeetingDate] = useState(() => formatCircleDateTimeLocalInputValue(circle.nextMeetingDate));
  const [mode, setMode] = useState<MeetingMode>(() => getInitialMeetingMode(circle));
  const [chapterLabel, setChapterLabel] = useState(circle.meetingChapterLabel ?? '');
  const [pageStart, setPageStart] = useState(circle.meetingPageStart?.toString() ?? '');
  const [pageEnd, setPageEnd] = useState(circle.meetingPageEnd?.toString() ?? '');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<NextMeetingFieldName, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationErrors = useMemo(() => {
    return validateNextMeetingForm({
      chapterLabel,
      meetingDate,
      mode,
      pageEnd,
      pageStart,
      totalPages: circle.totalPages,
    });
  }, [chapterLabel, circle.totalPages, meetingDate, mode, pageEnd, pageStart]);

  const isEditing = circle.nextMeetingDate != null;
  const isFormValid = Object.keys(validationErrors).length === 0;

  const clearFieldError = (fieldName: NextMeetingFieldName) => {
    setFieldErrors((current) => ({ ...current, [fieldName]: undefined }));
  };

  const handleModeChange = (nextMode: MeetingMode) => {
    setMode(nextMode);
    setSubmitError(null);
    setFieldErrors((current) => ({
      ...current,
      chapterLabel: undefined,
      pageStart: undefined,
      pageEnd: undefined,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors = validateNextMeetingForm({
      chapterLabel,
      meetingDate,
      mode,
      pageEnd,
      pageStart,
      totalPages: circle.totalPages,
    });

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setSubmitError(null);
      return;
    }

    const formattedMeetingDate = formatCircleMeetingDateForApi(meetingDate);

    if (!formattedMeetingDate) {
      setFieldErrors({ meetingDate: 'Choose a valid meeting date and time.' });
      setSubmitError(null);
      return;
    }

    try {
      setIsSubmitting(true);
      setFieldErrors({});
      setSubmitError(null);

      const updatedCircle = await setBookCircleNextMeeting(circle.id, {
        meetingDate: formattedMeetingDate,
        chapterLabel: mode === 'chapter' ? chapterLabel.trim() : null,
        pageStart: mode === 'pages' ? Number(pageStart) : null,
        pageEnd: mode === 'pages' ? Number(pageEnd) : null,
      });

      onSaved(updatedCircle);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        const hasFieldErrors = Object.keys(error.fieldErrors).length > 0;
        setFieldErrors(error.fieldErrors);
        setSubmitError(hasFieldErrors && error.message === 'Validation failed' ? null : error.message);
      } else if (error instanceof ApiResponseError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Could not save the next meeting right now.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppDialog
      isOpen
      onClose={onClose}
      canClose={!isSubmitting}
      contentClassName="w-full max-w-2xl rounded-t-[32px] border border-border bg-surface shadow-[0_20px_56px_rgba(15,23,42,0.18)] animate-in slide-in-from-bottom duration-300 sm:rounded-[32px] sm:slide-in-from-bottom-0"
    >
      <div className="max-h-[92vh] overflow-y-auto p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-text-subtle">Next meeting</p>
            <AppDialogTitle className="mt-2 text-2xl font-semibold text-text sm:text-3xl">
              {isEditing ? 'Edit next meeting' : 'Schedule next meeting'}
            </AppDialogTitle>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
              Pick when the circle meets next and what everyone should finish before then.
            </p>
          </div>
          <AppDialogClose asChild>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Close next meeting modal"
            >
              <X size={18} className="text-text-muted" />
            </button>
          </AppDialogClose>
        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          noValidate
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <label htmlFor="circle-next-meeting-date" className={fieldLabelClassName}>
                Date and time
              </label>
              <div className="relative">
                <input
                  id="circle-next-meeting-date"
                  name="meetingDate"
                  type="datetime-local"
                  value={meetingDate}
                  min={formatCircleDateTimeLocalInputValue(new Date())}
                  step="60"
                  onChange={(event) => {
                    setMeetingDate(event.target.value);
                    clearFieldError('meetingDate');
                    setSubmitError(null);
                  }}
                  className={`${circleInputClassName} pr-12`}
                />
                <CalendarDays
                  size={18}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-subtle"
                />
              </div>
              <p className={fieldHintClassName}>
                Choose a future date and time for the next discussion.
              </p>
              {fieldErrors.meetingDate ? (
                <p className={fieldErrorClassName}>{fieldErrors.meetingDate}</p>
              ) : null}
            </div>

            <div className="rounded-[24px] border border-border bg-surface-alt p-4">
              <p className="text-sm font-medium text-text">Reading target</p>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Set either a chapter label or a page range up to page {circle.totalPages}.
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-text">What should members read?</p>
            <div className="mt-3 flex w-full gap-1 rounded-full border border-border bg-surface-muted p-1 sm:w-fit">
              {([
                { value: 'chapter', label: 'Chapter' },
                { value: 'pages', label: 'Page range' },
              ] as const).map((option) => {
                const isActive = option.value === mode;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleModeChange(option.value)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand text-text-on-brand shadow-[0_8px_18px_rgba(154,74,66,0.24)]'
                        : 'text-text-muted hover:text-text'
                    }`}
                    aria-pressed={isActive}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {mode === 'chapter' ? (
            <div>
              <label htmlFor="circle-next-meeting-chapter" className={fieldLabelClassName}>
                Chapter label
              </label>
              <div className="relative">
                <input
                  id="circle-next-meeting-chapter"
                  name="chapterLabel"
                  type="text"
                  value={chapterLabel}
                  maxLength={100}
                  onChange={(event) => {
                    setChapterLabel(event.target.value);
                    clearFieldError('chapterLabel');
                    setSubmitError(null);
                  }}
                  className={`${circleInputClassName} pr-12`}
                  placeholder="Chapter 5"
                  autoComplete="off"
                  inputMode="text"
                  spellCheck={false}
                />
                <BookOpenText
                  size={18}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-subtle"
                />
              </div>
              <p className={fieldHintClassName}>
                Keep it short and clear so everyone knows what to finish before the meeting.
              </p>
              {fieldErrors.chapterLabel ? (
                <p className={fieldErrorClassName}>{fieldErrors.chapterLabel}</p>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="circle-next-meeting-page-start" className={fieldLabelClassName}>
                  Start page
                </label>
                <input
                  id="circle-next-meeting-page-start"
                  name="pageStart"
                  type="number"
                  min="1"
                  max={circle.totalPages}
                  value={pageStart}
                  onChange={(event) => {
                    setPageStart(event.target.value);
                    clearFieldError('pageStart');
                    setSubmitError(null);
                  }}
                  className={circleInputClassName}
                  inputMode="numeric"
                  placeholder="40"
                />
                {fieldErrors.pageStart ? (
                  <p className={fieldErrorClassName}>{fieldErrors.pageStart}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="circle-next-meeting-page-end" className={fieldLabelClassName}>
                  End page
                </label>
                <div className="relative">
                  <input
                    id="circle-next-meeting-page-end"
                    name="pageEnd"
                    type="number"
                    min="1"
                    max={circle.totalPages}
                    value={pageEnd}
                    onChange={(event) => {
                      setPageEnd(event.target.value);
                      clearFieldError('pageEnd');
                      setSubmitError(null);
                    }}
                    className={`${circleInputClassName} pr-12`}
                    inputMode="numeric"
                    placeholder="80"
                  />
                  <FileText
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-subtle"
                  />
                </div>
                <p className={fieldHintClassName}>
                  Choose a range between page 1 and page {circle.totalPages}.
                </p>
                {fieldErrors.pageEnd ? (
                  <p className={fieldErrorClassName}>{fieldErrors.pageEnd}</p>
                ) : null}
              </div>
            </div>
          )}

          {submitError ? (
            <div className="rounded-[20px] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
              {submitError}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-full px-5"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-full px-5"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save changes' : 'Schedule meeting'}
            </Button>
          </div>
        </form>
      </div>
    </AppDialog>
  );
}
