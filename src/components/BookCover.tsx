import { useState } from 'react';

export type BookCoverSize = 'xs' | 'sm' | 'md' | 'lg';

interface BookCoverProps {
  title: string;
  author: string;
  coverImageUrl?: string | null;
  size?: BookCoverSize;
  className?: string;
  decorative?: boolean;
}

const SIZE_TO_WIDTH: Record<BookCoverSize, string> = {
  xs: 'w-12',
  sm: 'w-16',
  md: 'w-24',
  lg: 'w-32',
};

const SIZE_TO_TITLE_CLASS: Record<BookCoverSize, string> = {
  xs: 'text-[8px] leading-[1.05]',
  sm: 'text-[10px] leading-[1.1]',
  md: 'text-xs leading-tight',
  lg: 'text-sm leading-tight',
};

const SIZE_TO_AUTHOR_CLASS: Record<BookCoverSize, string> = {
  xs: 'text-[6px]',
  sm: 'text-[8px]',
  md: 'text-[9px]',
  lg: 'text-[10px]',
};

const SIZE_TO_PADDING: Record<BookCoverSize, string> = {
  xs: 'p-1.5',
  sm: 'p-2',
  md: 'p-2.5',
  lg: 'p-3',
};

const containerClassName = 'relative aspect-[2/3] overflow-hidden rounded-[10px] border border-border bg-surface-muted shadow-[0_8px_18px_rgba(31,41,55,0.12)]';

const OPEN_LIBRARY_SIZE_RE = /^(https?:\/\/covers\.openlibrary\.org\/b\/(?:id|olid|isbn|oclc|lccn)\/[^/]+?)-(S|M|L)(\.jpg)(\?.*)?$/i;

function pickOpenLibrarySize(url: string, size: BookCoverSize): string {
  const match = OPEN_LIBRARY_SIZE_RE.exec(url);
  if (!match) {
    return url;
  }
  const [, prefix, , extension, query = ''] = match;
  const targetSize = size === 'lg' ? 'L' : 'M';
  return `${prefix}-${targetSize}${extension}${query}`;
}

function FallbackCover({ title, author, size }: { title: string; author: string; size: BookCoverSize }) {
  const titleClassName = SIZE_TO_TITLE_CLASS[size];
  const authorClassName = SIZE_TO_AUTHOR_CLASS[size];
  const paddingClassName = SIZE_TO_PADDING[size];

  return (
    <div
      className={`flex h-full w-full flex-col justify-between bg-gradient-to-br from-brand-soft via-surface to-accent-soft ${paddingClassName}`}
    >
      <div className="flex justify-between">
        <span className="h-1 w-1 rounded-full bg-brand-strong/50" aria-hidden />
        <span className="h-1 w-1 rounded-full bg-brand-strong/50" aria-hidden />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className={`line-clamp-3 font-semibold tracking-[-0.01em] text-brand-strong ${titleClassName}`}>
          {title || 'Untitled'}
        </p>
        {author ? (
          <p className={`line-clamp-2 uppercase tracking-[0.18em] text-text-muted ${authorClassName}`}>
            {author}
          </p>
        ) : null}
      </div>
      <div className="flex justify-center">
        <span className="h-[2px] w-6 rounded-full bg-brand-strong/40" aria-hidden />
      </div>
    </div>
  );
}

export function BookCover({
  title,
  author,
  coverImageUrl,
  size = 'md',
  className,
  decorative = false,
}: BookCoverProps) {
  const trimmedUrl = typeof coverImageUrl === 'string' ? coverImageUrl.trim() : '';
  const hasUrl = trimmedUrl.length > 0;

  const [erroredUrl, setErroredUrl] = useState<string | null>(null);

  const showFallback = !hasUrl || erroredUrl === trimmedUrl;
  const altText = decorative ? '' : `Cover for ${title || 'this book'}${author ? ` by ${author}` : ''}`;
  const widthClassName = SIZE_TO_WIDTH[size];
  const resolvedSrc = hasUrl ? pickOpenLibrarySize(trimmedUrl, size) : '';

  return (
    <div
      className={`${containerClassName} ${widthClassName} ${className ?? ''}`}
      aria-hidden={decorative ? true : undefined}
    >
      {showFallback ? (
        <FallbackCover title={title} author={author} size={size} />
      ) : (
        <img
          src={resolvedSrc}
          alt={altText}
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setErroredUrl(trimmedUrl)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
