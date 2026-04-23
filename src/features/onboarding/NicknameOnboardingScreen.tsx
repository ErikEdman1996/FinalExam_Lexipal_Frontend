import { useState, type FormEvent } from 'react';
import { ApiValidationError, updateNickname } from '../../api/api';
import { Button } from '../../components/Button';
import {
  fieldErrorClassName,
  fieldHintClassName,
  fieldLabelClassName,
  inputClassName,
} from '../../components/form/inputStyles';
import { useAuth } from '../auth/useAuth';

const NICKNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export function NicknameOnboardingScreen() {
  const { setProfile } = useAuth();
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = nickname.trim();
  const isValid = NICKNAME_PATTERN.test(trimmed);
  const showFormatHint = nickname.length > 0 && !isValid && !error;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValid || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const updated = await updateNickname(trimmed);
      setProfile(updated);
    } catch (err) {
      if (err instanceof ApiValidationError) {
        setError(err.fieldErrors.nickname ?? err.message);
      } else {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-bg-radial min-h-screen px-5 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <div className="w-full rounded-[28px] border border-border bg-surface p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          <h1 className="text-xl font-semibold text-text">Pick a nickname</h1>
          <p className="mt-2 text-sm text-text-muted">
            Other users will see this in book circles. 3-20 characters, letters/digits/underscore. You can change it later.
          </p>

          <form
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
            className="mt-6 space-y-4"
            noValidate
          >
            <div>
              <label htmlFor="onboarding-nickname" className={fieldLabelClassName}>
                Nickname
              </label>
              <input
                id="onboarding-nickname"
                name="nickname"
                type="text"
                value={nickname}
                onChange={(event) => {
                  setNickname(event.target.value);
                  setError(null);
                }}
                className={inputClassName}
                placeholder="e.g. moth_reader"
                maxLength={20}
                autoComplete="nickname"
                spellCheck={false}
                inputMode="text"
                required
              />
              {error ? (
                <p className={fieldErrorClassName}>{error}</p>
              ) : showFormatHint ? (
                <p className={fieldHintClassName}>
                  3-20 characters, letters, digits or underscore.
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Continue'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
