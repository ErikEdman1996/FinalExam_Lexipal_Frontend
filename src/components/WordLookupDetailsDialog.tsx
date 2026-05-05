import { X } from 'lucide-react';
import { Button } from './Button';
import { AppDialog, AppDialogClose, AppDialogTitle } from './dialog/AppDialog';
import {
  extractDefinitionFromDefinitions,
  extractDictionarySenses,
  extractPartsOfSpeechFromDefinitions,
  extractPhoneticText,
  type DictionarySense,
  type WordLookupReadResponseDTO,
} from '../api/api';

const getSenses = (lookup: WordLookupReadResponseDTO): DictionarySense[] => {
  const senses = extractDictionarySenses(lookup.definitions);

  if (senses.length > 0) {
    return senses;
  }

  const fallbackDefinition = extractDefinitionFromDefinitions(lookup.definitions);
  return fallbackDefinition ? [{ definition: fallbackDefinition, examples: [] }] : [];
};

export function WordLookupDetailsDialog({
  lookup,
  onClose,
}: {
  lookup: WordLookupReadResponseDTO | null;
  onClose: () => void;
}) {
  const senses = lookup ? getSenses(lookup) : [];
  const partsOfSpeech = lookup ? extractPartsOfSpeechFromDefinitions(lookup.definitions) : [];

  if (!lookup) {
    return null;
  }

  return (
    <AppDialog
      isOpen={lookup != null}
      onClose={onClose}
      contentClassName="w-full max-w-2xl overflow-hidden rounded-t-[32px] border border-border bg-surface shadow-[0_26px_60px_rgba(15,23,42,0.22)] sm:rounded-[32px]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-text-subtle">
            Looked-up word
          </p>
          <AppDialogTitle className="mt-2 truncate text-3xl font-semibold tracking-normal text-text">
            {lookup.lemma}
          </AppDialogTitle>
        </div>
        <AppDialogClose asChild>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors duration-200 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Close word details"
          >
            <X size={18} />
          </button>
        </AppDialogClose>
      </div>

      <div className="max-h-[78vh] overflow-y-auto px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
          {extractPhoneticText(lookup.phonetics) ? (
            <span className="rounded-full bg-surface-muted px-3 py-1 font-medium italic text-text">
              /{extractPhoneticText(lookup.phonetics)}/
            </span>
          ) : null}
          {partsOfSpeech.map((partOfSpeech) => (
            <span
              key={partOfSpeech}
              className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted"
            >
              {partOfSpeech}
            </span>
          ))}
        </div>

        <section className="mt-5 rounded-[24px] border border-border bg-surface-alt p-4 sm:p-5">
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.24em] text-text-subtle">Definitions</p>
          {senses.length > 0 ? (
            <div className="mt-4 space-y-4">
              {senses.slice(0, 3).map((sense, index) => (
                <div key={`${sense.definition}-${index}`} className="flex gap-3">
                  <span className="pt-0.5 text-sm font-semibold text-accent-strong">{index + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm leading-relaxed text-text">{sense.definition}</p>
                    {sense.examples.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-sm italic text-text-muted">
                        {sense.examples.slice(0, 3).map((example) => (
                          <li key={example} className="break-words leading-relaxed">
                            {example}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-text-muted">No definitions available right now.</p>
          )}
        </section>

        <div className="mt-5">
          <Button variant="outline" className="w-full rounded-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </AppDialog>
  );
}
