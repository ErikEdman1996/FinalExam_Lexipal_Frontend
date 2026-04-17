import keycloak from '../features/auth/keycloak';

const API_ROOT_URL = 'http://localhost:8585';
const API_BASE_URL = 'http://localhost:8585/lexipal/api/v1';

export type ApiBookStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface ApiSession {
    id: number;
    bookId: number;
    sessionDate: string;
    completedAt: string | null;
    durationSeconds: number;
    startPage: number;
    endPage: number;
    pagesRead: number;
    reflection: string;
    status: 'IN_PROGRESS' | 'COMPLETED';
    capturedWordCount: number;
    xpUpdate?: XpUpdateResponseDTO | null;
}

type ApiSessionResponse = unknown;

type ApiSessionCollectionResponse = unknown;

type ApiBookResponse = unknown;

export interface ApiBook {
    id: number;
    title: string;
    author: string;
    readPages: number;
    totalPages: number;
    createdAt: string;
    status: ApiBookStatus;
    sessions: ApiSession[];
    sessionCount?: number;
    progressPercentage?: number;
}

type ApiBookCollectionResponse =
    | unknown[]
    | { books?: unknown[]; content?: unknown[]; data?: unknown[]; items?: unknown[] }
    | null
    | undefined;

export interface CreateBookRequest {
    title: string;
    author: string;
    totalPages: number;
}

export interface UpdateBookRequest {
    title?: string;
    author?: string;
    readPages?: number;
    totalPages?: number;
    status?: ApiBookStatus;
}

export interface CreateSessionPayload {
    bookId: number;
    startPage: number;
    durationSeconds?: number;
    endPage?: number;
    reflection?: string;
}

export interface UpdateSessionPayload {
    durationSeconds?: number;
    endPage?: number;
    reflection?: string;
}

export interface CompleteSessionPayload {
    durationSeconds: number;
    endPage: number;
    reflection: string;
}

export type ApiJsonValue =
    | string
    | number
    | boolean
    | null
    | ApiJsonValue[]
    | { [key: string]: ApiJsonValue };

export interface ApiWord {
    id: number;
    lemma: string;
    rarityScore: number | null;
    source: string | null;
    definitions: ApiJsonValue | null;
    phonetics: ApiJsonValue | null;
}

export interface Pronunciation {
    type: string;
    text: string;
    tags: string[];
}

export interface DictionaryQuote {
    text: string;
    reference: string;
}

export interface DictionaryTranslation {
    language: {
        code: string;
        name: string;
    };
    word: string;
}

export interface Sense {
    definition: string;
    tags: string[];
    examples: string[];
    quotes: DictionaryQuote[];
    synonyms: string[];
    antonyms: string[];
    translations?: DictionaryTranslation[];
    subsenses: Sense[];
}

export interface DictionaryEntry {
    language: {
        code: string;
        name: string;
    };
    partOfSpeech: string;
    pronunciations: Pronunciation[];
    forms: {
        word: string;
        tags: string[];
    }[];
    senses: Sense[];
    synonyms: string[];
    antonyms: string[];
}

export type RarityTier = 'COMMON' | 'UNCOMMON' | 'RARE' | 'MYTHIC';

export const rarityOrder: RarityTier[] = ['COMMON', 'UNCOMMON', 'RARE', 'MYTHIC'];

export interface CodexEntryCreateRequestDTO {
    lemma: string;
}

export interface CodexEntryReadResponseDTO {
    id: number;
    wordId: number;
    sourceSessionId: number | null;
    lemma: string;
    specificDefinition: string | null;
    xpValue: number | null;
    createdAt: string;
    rarityScore: number | null;
    rarityTier: RarityTier | string;
    source: string | null;
    definitions: DictionaryEntry[] | null;
    phonetics: Pronunciation[] | null;
}

export interface CodexBoardSlotDTO {
    slotNumber: number;
    isCaptured: boolean;
    lemma?: string;
    rarityTier?: RarityTier | string;
    capturedAt?: string;
}

export interface CodexBoardPageDTO {
    pageNumber: number;
    capturedCount: number;
    totalCount: number;
    completionPercentage: number;
    slots: CodexBoardSlotDTO[];
}

export interface CodexBoardResponseDTO {
    volume: string;
    totalWords: number;
    capturedWords: number;
    completionPercentage: number;
    pages: CodexBoardPageDTO[];
}

export interface CodexPageProgressDTO {
    capturedCount: number;
    totalCount: number;
    completionPercentage: number;
}

export interface CodexOverallProgressDTO {
    capturedWords: number;
    totalWords: number;
    completionPercentage: number;
}

export interface ProfileStatsResponseDTO {
    totalPagesRead: number;
    totalBooksRead: number;
    totalSessionsCompleted: number;
    totalCapturedWords: number;
    totalXpEarned: number;
    totalMinutesRead: number;
}

export interface StreakMetaDataReadResponseDTO {
    id: number;
    userId: number;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string;
}

export interface DailyActivityReadResponseDTO {
    id: number;
    userId: number;
    sessionId: number | null;
    activityDate: string;
    activityType: string;
    xpEarned: number;
}

export interface ProfileReadResponseDTO {
    status: string;
    createdAt: string;
    stats: ProfileStatsResponseDTO;
    streak: StreakMetaDataReadResponseDTO | null;
    recentDailyActivities: DailyActivityReadResponseDTO[];
}

export interface XpUpdateResponseDTO {
    xpAwarded: number;
    previousTotalXp: number;
    newTotalXp: number;
    level: number;
    xpIntoLevel: number;
    xpPerLevel: number;
    leveledUp: boolean;
}

export interface DictionarySense {
    definition: string;
    examples: string[];
}

export interface CodexEntryCreateResponseDTO {
    lookupSucceeded: boolean;
    isCollectible: boolean;
    isNewCapture: boolean;
    alreadyCaptured: boolean;
    codexEntry: CodexEntryReadResponseDTO;
    rarityTier: RarityTier | string;
    xpUpdate: XpUpdateResponseDTO | null;
    pageNumber: number | null;
    slotNumber: number | null;
    pageProgress: CodexPageProgressDTO | null;
    overallProgress: CodexOverallProgressDTO | null;
}

export type ChallengeType = 'FLASHCARD' | string;

export type ChallengeDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | string;

export type ChallengeAttemptResult = 'PASS' | 'FAIL';

export interface Challenge {
    id: number;
    type: ChallengeType;
    description: string;
    difficulty: ChallengeDifficulty;
}

export interface ChallengeAttemptCreateRequest {
    userAnswer?: string;
    result: ChallengeAttemptResult;
    codexEntryId?: number;
    wordId?: number;
}

export interface ChallengeAttempt {
    id: number;
    userAnswer: string | null;
    result: ChallengeAttemptResult;
    xpAwarded: number;
    attemptedAt: string;
    challengeId: number;
    challengeType: ChallengeType;
    codexEntryId: number | null;
    wordId: number | null;
    lemma: string | null;
    definitionPreview: string | null;
    xpUpdate?: XpUpdateResponseDTO | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object';
};

const isApiJsonValue = (value: unknown): value is ApiJsonValue => {
    if (value === null) {
        return true;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return true;
    }

    if (Array.isArray(value)) {
        return value.every(isApiJsonValue);
    }

    if (!isRecord(value)) {
        return false;
    }

    return Object.values(value).every(isApiJsonValue);
};

const isApiSession = (value: unknown): value is ApiSession => {
    return isRecord(value) && toFiniteNumber(value.id) !== null;
};

const toFiniteNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
};

const isBookLikeRecord = (value: unknown): value is Record<string, unknown> => {
    if (!isRecord(value)) {
        return false;
    }

    return (
        typeof value.title === 'string'
        && typeof value.author === 'string'
        && toFiniteNumber(value.totalPages) !== null
    );
};

const isCodexEntryLikeRecord = (value: unknown): value is Record<string, unknown> => {
    if (!isRecord(value)) {
        return false;
    }

    return typeof value.lemma === 'string' && toFiniteNumber(value.id) !== null;
};

const isChallengeLikeRecord = (value: unknown): value is Record<string, unknown> => {
    if (!isRecord(value)) {
        return false;
    }

    return typeof value.type === 'string' && toFiniteNumber(value.id) !== null;
};

const isChallengeAttemptLikeRecord = (value: unknown): value is Record<string, unknown> => {
    if (!isRecord(value)) {
        return false;
    }

    return (
        toFiniteNumber(value.id) !== null
        && typeof value.result === 'string'
        && toFiniteNumber(value.challengeId) !== null
    );
};

const toApiBook = (value: Record<string, unknown>): ApiBook => {
    const id = toFiniteNumber(value.id) ?? 0;
    const readPages = toFiniteNumber(value.readPages) ?? 0;
    const totalPages = toFiniteNumber(value.totalPages) ?? 0;
    const sessionCount = toFiniteNumber(value.sessionCount) ?? 0;
    const progressPercentage = toFiniteNumber(value.progressPercentage) ?? undefined;
    const createdAt = typeof value.createdAt === 'string' ? value.createdAt : '';
    const status = typeof value.status === 'string' ? value.status : 'ACTIVE';
    const sessions = Array.isArray(value.sessions)
        ? value.sessions.filter(isApiSession)
        : [];

    return {
        id,
        title: String(value.title ?? ''),
        author: String(value.author ?? ''),
        readPages,
        totalPages,
        createdAt,
        status: status as ApiBookStatus,
        sessions,
        sessionCount,
        progressPercentage,
    };
};

const toCodexEntry = (value: Record<string, unknown>): CodexEntryReadResponseDTO => {
    return {
        id: toFiniteNumber(value.id) ?? 0,
        wordId: toFiniteNumber(value.wordId) ?? 0,
        sourceSessionId: value.sourceSessionId == null ? null : (toFiniteNumber(value.sourceSessionId) ?? null),
        lemma: typeof value.lemma === 'string' ? value.lemma : '',
        specificDefinition: typeof value.specificDefinition === 'string' ? value.specificDefinition : null,
        xpValue: toFiniteNumber(value.xpValue),
        createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
        rarityScore: toFiniteNumber(value.rarityScore),
        rarityTier: typeof value.rarityTier === 'string' ? value.rarityTier : 'COMMON',
        source: typeof value.source === 'string' ? value.source : null,
        definitions: toDictionaryEntries(value.definitions),
        phonetics: toPronunciations(value.phonetics),
    };
};

const toCodexBoardSlot = (value: unknown, fallbackSlotNumber = 0): CodexBoardSlotDTO | null => {
    if (!isRecord(value)) {
        return null;
    }

    const slotNumber = toFiniteNumber(value.slotNumber) ?? fallbackSlotNumber;

    if (slotNumber <= 0) {
        return null;
    }

    return {
        slotNumber,
        isCaptured: value.isCaptured === true,
        lemma: typeof value.lemma === 'string' ? value.lemma : undefined,
        rarityTier: typeof value.rarityTier === 'string' ? value.rarityTier : undefined,
        capturedAt: typeof value.capturedAt === 'string' ? value.capturedAt : undefined,
    };
};

const toCodexBoardPage = (value: unknown, fallbackPageNumber = 0): CodexBoardPageDTO | null => {
    if (!isRecord(value)) {
        return null;
    }

    const pageNumber = toFiniteNumber(value.pageNumber) ?? fallbackPageNumber;
    const slots = Array.isArray(value.slots)
        ? value.slots
            .map((slot, index) => toCodexBoardSlot(slot, index + 1))
            .filter((slot): slot is CodexBoardSlotDTO => slot !== null)
        : [];

    if (pageNumber <= 0) {
        return null;
    }

    return {
        pageNumber,
        capturedCount: toFiniteNumber(value.capturedCount) ?? slots.filter((slot) => slot.isCaptured).length,
        totalCount: toFiniteNumber(value.totalCount) ?? Math.max(25, slots.length),
        completionPercentage: toFiniteNumber(value.completionPercentage) ?? 0,
        slots,
    };
};

export const normalizeRarityTier = (rarityTier: unknown): RarityTier => {
    if (rarityTier === 'MYTHIC' || rarityTier === 'RARE' || rarityTier === 'UNCOMMON') {
        return rarityTier;
    }

    return 'COMMON';
};

const toChallenge = (value: Record<string, unknown>): Challenge => {
    return {
        id: toFiniteNumber(value.id) ?? 0,
        type: typeof value.type === 'string' ? value.type : 'FLASHCARD',
        description: typeof value.description === 'string' ? value.description : '',
        difficulty: typeof value.difficulty === 'string' ? value.difficulty : 'EASY',
    };
};

const toChallengeAttempt = (value: Record<string, unknown>): ChallengeAttempt => {
    const normalizedResult = value.result === 'FAIL' ? 'FAIL' : 'PASS';

    return {
        id: toFiniteNumber(value.id) ?? 0,
        userAnswer: typeof value.userAnswer === 'string' ? value.userAnswer : null,
        result: normalizedResult,
        xpAwarded: toFiniteNumber(value.xpAwarded) ?? 0,
        attemptedAt: typeof value.attemptedAt === 'string' ? value.attemptedAt : '',
        challengeId: toFiniteNumber(value.challengeId) ?? 0,
        challengeType: typeof value.challengeType === 'string' ? value.challengeType : 'FLASHCARD',
        codexEntryId: value.codexEntryId == null ? null : (toFiniteNumber(value.codexEntryId) ?? null),
        wordId: value.wordId == null ? null : (toFiniteNumber(value.wordId) ?? null),
        lemma: typeof value.lemma === 'string' ? value.lemma : null,
        definitionPreview: typeof value.definitionPreview === 'string' ? value.definitionPreview : null,
        xpUpdate: toXpUpdate(value.xpUpdate),
    };
};

const toXpUpdate = (value: unknown): XpUpdateResponseDTO | null => {
    if (!isRecord(value)) {
        return null;
    }

    const previousTotalXp = toFiniteNumber(value.previousTotalXp) ?? 0;
    const newTotalXp = toFiniteNumber(value.newTotalXp) ?? previousTotalXp;
    const xpPerLevel = Math.max(1, toFiniteNumber(value.xpPerLevel) ?? 100);
    const xpIntoLevel = toFiniteNumber(value.xpIntoLevel) ?? Math.max(0, newTotalXp % xpPerLevel);
    const derivedLevel = Math.floor(Math.max(0, newTotalXp) / xpPerLevel) + 1;

    return {
        xpAwarded: toFiniteNumber(value.xpAwarded) ?? Math.max(0, newTotalXp - previousTotalXp),
        previousTotalXp,
        newTotalXp,
        level: toFiniteNumber(value.level) ?? derivedLevel,
        xpIntoLevel: Math.max(0, xpIntoLevel),
        xpPerLevel,
        leveledUp: value.leveledUp === true,
    };
};

const toCodexPageProgress = (value: unknown): CodexPageProgressDTO | null => {
    if (!isRecord(value)) {
        return null;
    }

    const totalCount = toFiniteNumber(value.totalCount) ?? toFiniteNumber(value.totalWords) ?? 25;
    const capturedCount = toFiniteNumber(value.capturedCount) ?? toFiniteNumber(value.capturedWords) ?? 0;

    return {
        capturedCount,
        totalCount,
        completionPercentage: toFiniteNumber(value.completionPercentage) ?? (totalCount > 0 ? (capturedCount / totalCount) * 100 : 0),
    };
};

const toCodexOverallProgress = (value: unknown): CodexOverallProgressDTO | null => {
    if (!isRecord(value)) {
        return null;
    }

    const totalWords = toFiniteNumber(value.totalWords) ?? toFiniteNumber(value.totalCount) ?? 300;
    const capturedWords = toFiniteNumber(value.capturedWords) ?? toFiniteNumber(value.capturedCount) ?? 0;

    return {
        capturedWords,
        totalWords,
        completionPercentage: toFiniteNumber(value.completionPercentage) ?? (totalWords > 0 ? (capturedWords / totalWords) * 100 : 0),
    };
};

const toProfileStats = (value: unknown): ProfileStatsResponseDTO => {
    const record = isRecord(value) ? value : {};

    return {
        totalPagesRead: toFiniteNumber(record.totalPagesRead) ?? 0,
        totalBooksRead: toFiniteNumber(record.totalBooksRead) ?? 0,
        totalSessionsCompleted: toFiniteNumber(record.totalSessionsCompleted) ?? 0,
        totalCapturedWords: toFiniteNumber(record.totalCapturedWords) ?? 0,
        totalXpEarned: toFiniteNumber(record.totalXpEarned) ?? 0,
        totalMinutesRead: toFiniteNumber(record.totalMinutesRead) ?? 0,
    };
};

const toStreakMetadata = (value: unknown): StreakMetaDataReadResponseDTO | null => {
    if (!isRecord(value)) {
        return null;
    }

    return {
        id: toFiniteNumber(value.id) ?? 0,
        userId: toFiniteNumber(value.userId) ?? 0,
        currentStreak: toFiniteNumber(value.currentStreak) ?? 0,
        longestStreak: toFiniteNumber(value.longestStreak) ?? 0,
        lastActivityDate: typeof value.lastActivityDate === 'string' ? value.lastActivityDate : '',
    };
};

const toDailyActivity = (value: unknown): DailyActivityReadResponseDTO | null => {
    if (!isRecord(value)) {
        return null;
    }

    return {
        id: toFiniteNumber(value.id) ?? 0,
        userId: toFiniteNumber(value.userId) ?? 0,
        sessionId: value.sessionId == null ? null : (toFiniteNumber(value.sessionId) ?? null),
        activityDate: typeof value.activityDate === 'string' ? value.activityDate : '',
        activityType: typeof value.activityType === 'string' ? value.activityType : '',
        xpEarned: toFiniteNumber(value.xpEarned) ?? 0,
    };
};

const normalizeBooksResponse = (value: ApiBookCollectionResponse): ApiBook[] => {
    if (Array.isArray(value)) {
        const list = value as unknown[];
        return list
            .filter(isBookLikeRecord)
            .map(toApiBook);
    }

    if (!isRecord(value)) {
        return [];
    }

    const record = value as Record<string, unknown>;
    const collections = [record.books, record.content, record.data, record.items];

    for (const collection of collections) {
        if (Array.isArray(collection)) {
            return collection
                .filter(isBookLikeRecord)
                .map(toApiBook);
        }
    }

    return [];
};

const findBookLikeRecord = (value: unknown, depth = 0): Record<string, unknown> | null => {
    if (depth > 6 || value == null) {
        return null;
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value) as unknown;
            return findBookLikeRecord(parsed, depth + 1);
        } catch {
            return null;
        }
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            const found = findBookLikeRecord(item, depth + 1);
            if (found) {
                return found;
            }
        }
        return null;
    }

    if (!isRecord(value)) {
        return null;
    }

    if (isBookLikeRecord(value)) {
        return value;
    }

    for (const nested of Object.values(value)) {
        const found = findBookLikeRecord(nested, depth + 1);
        if (found) {
            return found;
        }
    }

    return null;
};

const isSessionLikeRecord = (value: unknown): value is Record<string, unknown> => {
    if (!isRecord(value)) {
        return false;
    }

    const directBookId = toFiniteNumber(value.bookId);
    const nestedBookId = isRecord(value.book) ? toFiniteNumber(value.book.id) : null;
    const startPage = toFiniteNumber(value.startPage);
    const endPage = toFiniteNumber(value.endPage);

    return (
        toFiniteNumber(value.id) !== null
        && (directBookId !== null || nestedBookId !== null)
        && (startPage !== null || endPage !== null)
    );
};

const toApiSession = (value: Record<string, unknown>): ApiSession => {
    const id = toFiniteNumber(value.id) ?? 0;
    const bookId = toFiniteNumber(value.bookId)
        ?? (isRecord(value.book) ? (toFiniteNumber(value.book.id) ?? 0) : 0);
    const durationSeconds = toFiniteNumber(value.durationSeconds) ?? 0;
    const rawStartPage = toFiniteNumber(value.startPage);
    const rawEndPage = toFiniteNumber(value.endPage);
    const startPage = rawStartPage ?? rawEndPage ?? 0;
    const endPage = rawEndPage ?? startPage;
    const pagesRead = toFiniteNumber(value.pagesRead) ?? Math.max(0, endPage - startPage);
    const sessionDate = typeof value.sessionDate === 'string' ? value.sessionDate : '';
    const completedAt = typeof value.completedAt === 'string' && value.completedAt.trim()
        ? value.completedAt
        : null;
    const reflection = typeof value.reflection === 'string' ? value.reflection : '';
    const status = value.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS';
    const capturedWordCount = toFiniteNumber(value.capturedWordCount) ?? 0;

    return {
        id,
        bookId,
        completedAt,
        durationSeconds,
        startPage,
        endPage,
        pagesRead,
        reflection,
        status,
        sessionDate,
        capturedWordCount,
        xpUpdate: toXpUpdate(value.xpUpdate),
    };
};

const findSessionLikeRecord = (value: unknown, depth = 0): Record<string, unknown> | null => {
    if (depth > 6 || value == null) {
        return null;
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value) as unknown;
            return findSessionLikeRecord(parsed, depth + 1);
        } catch {
            return null;
        }
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            const found = findSessionLikeRecord(item, depth + 1);
            if (found) {
                return found;
            }
        }
        return null;
    }

    if (!isRecord(value)) {
        return null;
    }

    if (isSessionLikeRecord(value)) {
        return value;
    }

    for (const nested of Object.values(value)) {
        const found = findSessionLikeRecord(nested, depth + 1);
        if (found) {
            return found;
        }
    }

    return null;
};

const normalizeSessionsResponse = (value: ApiSessionCollectionResponse): ApiSession[] => {
    if (Array.isArray(value)) {
        return value
            .filter(isSessionLikeRecord)
            .map(toApiSession);
    }

    if (!isRecord(value)) {
        return [];
    }

    const record = value as Record<string, unknown>;
    const bookCandidate = isRecord(record.book) ? (record.book as Record<string, unknown>) : null;
    const collections = [record.sessions, record.content, record.data, record.items, bookCandidate?.sessions];

    for (const collection of collections) {
        if (Array.isArray(collection)) {
            return collection
                .filter(isSessionLikeRecord)
                .map(toApiSession);
        }
    }

    return [];
};

const normalizeBookResponse = (value: ApiBookResponse): ApiBook => {
    const candidate = findBookLikeRecord(value);

    if (candidate) {
        return toApiBook(candidate);
    }

    console.error('Unexpected book response shape. Raw payload:', value);
    throw new Error('Unexpected book response shape.');
};

const normalizeCodexEntriesResponse = (value: unknown): CodexEntryReadResponseDTO[] => {
    if (Array.isArray(value)) {
        return value
            .filter(isCodexEntryLikeRecord)
            .map(toCodexEntry);
    }

    if (!isRecord(value)) {
        return [];
    }

    const collections = [value.codexEntries, value.words, value.content, value.data, value.items];

    for (const collection of collections) {
        if (Array.isArray(collection)) {
            return collection
                .filter(isCodexEntryLikeRecord)
                .map(toCodexEntry);
        }
    }

    return [];
};

const normalizeCodexBoardResponse = (value: unknown): CodexBoardResponseDTO => {
    const record = isRecord(value) ? value : {};
    const pages = Array.isArray(record.pages)
        ? record.pages
            .map((page, index) => toCodexBoardPage(page, index + 1))
            .filter((page): page is CodexBoardPageDTO => page !== null)
        : [];

    return {
        volume: typeof record.volume === 'string' ? record.volume : 'Volume 1',
        totalWords: toFiniteNumber(record.totalWords) ?? 300,
        capturedWords: toFiniteNumber(record.capturedWords) ?? pages.reduce((sum, page) => sum + page.capturedCount, 0),
        completionPercentage: toFiniteNumber(record.completionPercentage) ?? 0,
        pages,
    };
};

const normalizeProfileResponse = (value: unknown): ProfileReadResponseDTO => {
    if (!isRecord(value)) {
        throw new Error('Unexpected profile response shape.');
    }

    const recentDailyActivities = Array.isArray(value.recentDailyActivities)
        ? value.recentDailyActivities
            .map(toDailyActivity)
            .filter((activity): activity is DailyActivityReadResponseDTO => activity !== null)
        : [];

    return {
        status: typeof value.status === 'string' ? value.status : '',
        createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
        stats: toProfileStats(value.stats),
        streak: toStreakMetadata(value.streak),
        recentDailyActivities,
    };
};

const normalizeChallengesResponse = (value: unknown): Challenge[] => {
    if (Array.isArray(value)) {
        return value
            .filter(isChallengeLikeRecord)
            .map(toChallenge);
    }

    if (!isRecord(value)) {
        return [];
    }

    const collections = [value.challenges, value.content, value.data, value.items];

    for (const collection of collections) {
        if (Array.isArray(collection)) {
            return collection
                .filter(isChallengeLikeRecord)
                .map(toChallenge);
        }
    }

    return isChallengeLikeRecord(value) ? [toChallenge(value)] : [];
};

const normalizeChallengeResponse = (value: unknown): Challenge => {
    if (isChallengeLikeRecord(value)) {
        return toChallenge(value);
    }

    if (isRecord(value)) {
        const nestedChallenge = [value.challenge, value.data, value.item].find(isChallengeLikeRecord);

        if (nestedChallenge) {
            return toChallenge(nestedChallenge);
        }
    }

    console.error('Unexpected challenge response shape. Raw payload:', value);
    throw new Error('Unexpected challenge response shape.');
};

const normalizeChallengeAttemptsResponse = (value: unknown): ChallengeAttempt[] => {
    if (Array.isArray(value)) {
        return value
            .filter(isChallengeAttemptLikeRecord)
            .map(toChallengeAttempt);
    }

    if (!isRecord(value)) {
        return [];
    }

    const collections = [value.challengeAttempts, value.attempts, value.content, value.data, value.items];

    for (const collection of collections) {
        if (Array.isArray(collection)) {
            return collection
                .filter(isChallengeAttemptLikeRecord)
                .map(toChallengeAttempt);
        }
    }

    return isChallengeAttemptLikeRecord(value) ? [toChallengeAttempt(value)] : [];
};

const normalizeChallengeAttemptResponse = (value: unknown): ChallengeAttempt => {
    if (isChallengeAttemptLikeRecord(value)) {
        return toChallengeAttempt(value);
    }

    if (isRecord(value)) {
        const nestedAttempt = [value.challengeAttempt, value.attempt, value.data, value.item].find(isChallengeAttemptLikeRecord);

        if (nestedAttempt) {
            return toChallengeAttempt(nestedAttempt);
        }
    }

    console.error('Unexpected challenge attempt response shape. Raw payload:', value);
    throw new Error('Unexpected challenge attempt response shape.');
};

const normalizeSessionResponse = (value: ApiSessionResponse): ApiSession => {
    const candidate = findSessionLikeRecord(value);

    if (candidate) {
        return toApiSession(candidate);
    }

    console.error('Unexpected session response shape. Raw payload:', value);
    throw new Error('Unexpected session response shape.');
};

const normalizeErrorMessage = (payload: unknown, fallbackMessage: string) => {
    if (!isRecord(payload)) {
        return fallbackMessage;
    }

    if (typeof payload.message === 'string' && payload.message.trim()) {
        return payload.message;
    }

    if (isRecord(payload.errors)) {
        const firstError = Object.values(payload.errors).find((value) => typeof value === 'string' && value.trim());

        if (typeof firstError === 'string') {
            return firstError;
        }
    }

    return fallbackMessage;
};

const getErrorMessage = async (res: Response, fallbackMessage: string) => {
    try {
        const payload = await res.json();
        return normalizeErrorMessage(payload, fallbackMessage);
    } catch {
        return fallbackMessage;
    }
};


export const getBooks = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/books/all`, {
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to fetch books');
        const data = await res.json();
        return normalizeBooksResponse(data);
    } catch (error) {
        console.error('Error fetching books:', error);
        throw error;
    }
};


export const getBook = async (bookId: string | number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/books/${bookId}`, {
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to fetch book');
        const data = await res.json();
        return normalizeBookResponse(data);
    } catch (error) {
        console.error('Error fetching book:', error);
        throw error;
    }
};


export const getSessionsByBook = async (bookId: string | number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/sessions/book/${bookId}`, {
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to fetch sessions'));
        }
        const data = await res.json();
        return normalizeSessionsResponse(data);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        throw error;
    }
};


export const getActiveSessionByBook = async (bookId: string | number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/sessions/book/${bookId}/active`, {
            headers: await buildAuthHeaders(),
        });

        if (res.status === 204) {
            return null;
        }

        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to fetch active session'));
        }

        const data = await res.json();
        return normalizeSessionResponse(data);
    } catch (error) {
        console.error('Error fetching active session:', error);
        throw error;
    }
};


export const createBook = async (request: CreateBookRequest) => {
    try {
        const res = await fetch(`${API_BASE_URL}/books`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify(request),
        });
        if (!res.ok) throw new Error('Failed to create book');
        const data = await res.json();
        return normalizeBookResponse(data);
    } catch (error) {
        console.error('Error creating book:', error);
        throw error;
    }
};


export const getSession = async (sessionId: string | number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to fetch session'));
        }
        const data = await res.json();
        return normalizeSessionResponse(data);
    } catch (error) {
        console.error('Error fetching session:', error);
        throw error;
    }
};

export const getCodexEntries = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/codexEntries`, {
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to fetch codex entries');
        const data = await res.json();
        return normalizeCodexEntriesResponse(data);
    } catch (error) {
        console.error('Error fetching codex entries:', error);
        throw error;
    }
};

export const getCodexBoard = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/codexBoard`, {
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to fetch codex board'));
        }
        const data = await res.json();
        return normalizeCodexBoardResponse(data);
    } catch (error) {
        console.error('Error fetching codex board:', error);
        throw error;
    }
};

export const getProfile = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/profile/me`, {
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        return normalizeProfileResponse(data);
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }
};

export const getChallenges = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/challenges`, {
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to fetch challenges'));
        }
        const data = await res.json();
        return normalizeChallengesResponse(data);
    } catch (error) {
        console.error('Error fetching challenges:', error);
        throw error;
    }
};

export const getChallenge = async (challengeId: string | number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/challenges/${challengeId}`, {
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to fetch challenge'));
        }
        const data = await res.json();
        return normalizeChallengeResponse(data);
    } catch (error) {
        console.error('Error fetching challenge:', error);
        throw error;
    }
};

export const getChallengeAttempts = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/challengeAttempts`, {
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to fetch challenge attempts'));
        }
        const data = await res.json();
        return normalizeChallengeAttemptsResponse(data);
    } catch (error) {
        console.error('Error fetching challenge attempts:', error);
        throw error;
    }
};

export const getChallengeAttemptsByChallenge = async (challengeId: string | number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/challenges/${challengeId}/attempts`, {
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to fetch challenge attempts'));
        }
        const data = await res.json();
        return normalizeChallengeAttemptsResponse(data);
    } catch (error) {
        console.error('Error fetching challenge attempts by challenge:', error);
        throw error;
    }
};

export const createChallengeAttempt = async (
    challengeId: string | number,
    payload: ChallengeAttemptCreateRequest,
) => {
    try {
        const res = await fetch(`${API_BASE_URL}/challenges/${challengeId}/attempts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to create challenge attempt'));
        }
        const data = await res.json();
        return normalizeChallengeAttemptResponse(data);
    } catch (error) {
        console.error('Error creating challenge attempt:', error);
        throw error;
    }
};


export const updateBook = async (bookId: string | number, request: UpdateBookRequest) => {
    try {
        const res = await fetch(`${API_BASE_URL}/books/${bookId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify(request),
        });
        if (!res.ok) throw new Error('Failed to update book');
        const data = await res.json();
        return normalizeBookResponse(data);
    } catch (error) {
        console.error('Error updating book:', error);
        throw error;
    }
};

export const deleteBook = async (bookId: string | number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/books/${bookId}`, {
            method: 'DELETE',
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to delete book');
    } catch (error) {
        console.error('Error deleting book:', error);
        throw error;
    }
};


export const createSession = async (payload: CreateSessionPayload) => {
    try {
        const res = await fetch(`${API_BASE_URL}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to create session'));
        }
        const data = await res.json();
        return normalizeSessionResponse(data);
    } catch (error) {
        console.error('Error creating session:', error);
        throw error;
    }
};


export const updateSession = async (sessionId: number, payload: UpdateSessionPayload) => {
    try {
        const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to update session'));
        }
        const data = await res.json();
        return normalizeSessionResponse(data);
    } catch (error) {
        console.error('Error updating session:', error);
        throw error;
    }
};


export const completeSession = async (sessionId: number, payload: CompleteSessionPayload) => {
    try {
        const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to complete session'));
        }
        const data = await res.json();
        return normalizeSessionResponse(data);
    } catch (error) {
        console.error('Error completing session:', error);
        throw error;
    }
};


export const getDictionaryWord = async (lemma: string) => {
    try {
        const res = await fetch(`${API_ROOT_URL}/test/dictionary/${encodeURIComponent(lemma)}`, {
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to fetch dictionary word');
        return await res.json();
    } catch (error) {
        console.error('Error fetching dictionary word:', error);
        throw error;
    }
};

const collectValuesByKey = (value: ApiJsonValue, targetKey: string, collected: string[]) => {
    if (Array.isArray(value)) {
        value.forEach((item) => collectValuesByKey(item, targetKey, collected));
        return;
    }

    if (value !== null && typeof value === 'object') {
        Object.entries(value).forEach(([key, nestedValue]) => {
            if (key.toLowerCase() === targetKey.toLowerCase()) {
                if (Array.isArray(nestedValue)) {
                    nestedValue.forEach((entry) => {
                        if (typeof entry === 'string' && entry.trim()) {
                            collected.push(entry.trim());
                        }
                    });
                } else if (typeof nestedValue === 'string' && nestedValue.trim()) {
                    collected.push(nestedValue.trim());
                }
            }

            collectValuesByKey(nestedValue, targetKey, collected);
        });
    }
};

const collectAllStrings = (value: ApiJsonValue, collected: string[]) => {
    if (typeof value === 'string') {
        if (value.trim()) {
            collected.push(value.trim());
        }
        return;
    }

    if (Array.isArray(value)) {
        value.forEach((entry) => collectAllStrings(entry, collected));
        return;
    }

    if (value !== null && typeof value === 'object') {
        Object.values(value).forEach((entry) => collectAllStrings(entry, collected));
    }
};

const toStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter(Boolean);
};

const toPronunciation = (value: unknown): Pronunciation | null => {
    if (!isRecord(value)) {
        return null;
    }

    const text = typeof value.text === 'string' ? value.text.trim() : '';

    if (!text) {
        return null;
    }

    return {
        type: typeof value.type === 'string' ? value.type : '',
        text,
        tags: toStringArray(value.tags),
    };
};

const toPronunciations = (value: unknown): Pronunciation[] | null => {
    if (!Array.isArray(value)) {
        return null;
    }

    const pronunciations = value
        .map(toPronunciation)
        .filter((entry): entry is Pronunciation => entry !== null);

    return pronunciations.length > 0 ? pronunciations : [];
};

const toDictionaryTranslation = (value: unknown): DictionaryTranslation | null => {
    if (!isRecord(value) || !isRecord(value.language)) {
        return null;
    }

    const word = typeof value.word === 'string' ? value.word.trim() : '';

    if (!word) {
        return null;
    }

    return {
        language: {
            code: typeof value.language.code === 'string' ? value.language.code : '',
            name: typeof value.language.name === 'string' ? value.language.name : '',
        },
        word,
    };
};

const toDictionaryQuote = (value: unknown): DictionaryQuote | null => {
    if (!isRecord(value)) {
        return null;
    }

    const text = typeof value.text === 'string' ? value.text.trim() : '';

    if (!text) {
        return null;
    }

    return {
        text,
        reference: typeof value.reference === 'string' ? value.reference : '',
    };
};

const toSense = (value: unknown): Sense | null => {
    if (!isRecord(value)) {
        return null;
    }

    const definition = typeof value.definition === 'string' ? value.definition.trim() : '';

    if (!definition) {
        return null;
    }

    const subsenses = Array.isArray(value.subsenses)
        ? value.subsenses.map(toSense).filter((entry): entry is Sense => entry !== null)
        : [];

    const translations = Array.isArray(value.translations)
        ? value.translations.map(toDictionaryTranslation).filter((entry): entry is DictionaryTranslation => entry !== null)
        : [];

    return {
        definition,
        tags: toStringArray(value.tags),
        examples: toStringArray(value.examples),
        quotes: Array.isArray(value.quotes)
            ? value.quotes.map(toDictionaryQuote).filter((entry): entry is DictionaryQuote => entry !== null)
            : [],
        synonyms: toStringArray(value.synonyms),
        antonyms: toStringArray(value.antonyms),
        translations: translations.length > 0 ? translations : undefined,
        subsenses,
    };
};

const toDictionaryEntry = (value: unknown): DictionaryEntry | null => {
    if (!isRecord(value)) {
        return null;
    }

    const senses = Array.isArray(value.senses)
        ? value.senses.map(toSense).filter((entry): entry is Sense => entry !== null)
        : [];

    return {
        language: isRecord(value.language)
            ? {
                code: typeof value.language.code === 'string' ? value.language.code : '',
                name: typeof value.language.name === 'string' ? value.language.name : '',
            }
            : { code: '', name: '' },
        partOfSpeech: typeof value.partOfSpeech === 'string' ? value.partOfSpeech : '',
        pronunciations: Array.isArray(value.pronunciations)
            ? value.pronunciations.map(toPronunciation).filter((entry): entry is Pronunciation => entry !== null)
            : [],
        forms: Array.isArray(value.forms)
            ? value.forms
                .filter(isRecord)
                .map((form) => ({
                    word: typeof form.word === 'string' ? form.word : '',
                    tags: toStringArray(form.tags),
                }))
                .filter((form) => form.word)
            : [],
        senses,
        synonyms: toStringArray(value.synonyms),
        antonyms: toStringArray(value.antonyms),
    };
};

export const toDictionaryEntries = (value: unknown): DictionaryEntry[] | null => {
    if (!Array.isArray(value)) {
        return null;
    }

    const entries = value
        .map(toDictionaryEntry)
        .filter((entry): entry is DictionaryEntry => entry !== null);

    return entries.length > 0 ? entries : [];
};

export const extractDefinitionFromDefinitions = (definitions: unknown) => {
    const entries = toDictionaryEntries(definitions);

    if (entries) {
        for (const entry of entries) {
            const firstSense = entry.senses[0];

            if (firstSense?.definition) {
                return firstSense.definition;
            }
        }
    }

    if (!isApiJsonValue(definitions)) {
        return '';
    }

    const definitionCandidates: string[] = [];
    collectValuesByKey(definitions, 'definition', definitionCandidates);

    if (definitionCandidates.length > 0) {
        return definitionCandidates[0];
    }

    const allStrings: string[] = [];
    collectAllStrings(definitions, allStrings);
    return allStrings[0] ?? '';
};

export const extractSynonymsFromDefinitions = (definitions: unknown) => {
    const entries = toDictionaryEntries(definitions);

    if (entries) {
        const synonyms = new Set<string>();

        const collectSenseSynonyms = (sense: Sense) => {
            sense.synonyms.forEach((synonym) => synonyms.add(synonym));
            sense.subsenses.forEach(collectSenseSynonyms);
        };

        entries.forEach((entry) => {
            entry.synonyms.forEach((synonym) => synonyms.add(synonym));
            entry.senses.forEach(collectSenseSynonyms);
        });

        return Array.from(synonyms);
    }

    if (!isApiJsonValue(definitions)) {
        return [];
    }

    const synonymCandidates: string[] = [];
    collectValuesByKey(definitions, 'synonyms', synonymCandidates);
    collectValuesByKey(definitions, 'synonym', synonymCandidates);

    return Array.from(new Set(synonymCandidates));
};

export const extractPartsOfSpeechFromDefinitions = (definitions: unknown) => {
    const entries = toDictionaryEntries(definitions);

    if (entries) {
        return Array.from(
            new Set(
                entries
                    .map((entry) => entry.partOfSpeech.trim())
                    .filter(Boolean),
            ),
        ).map((value) => value.charAt(0).toUpperCase() + value.slice(1));
    }

    if (!isApiJsonValue(definitions)) {
        return [];
    }

    const partOfSpeechCandidates: string[] = [];
    collectValuesByKey(definitions, 'partOfSpeech', partOfSpeechCandidates);
    collectValuesByKey(definitions, 'part_of_speech', partOfSpeechCandidates);
    collectValuesByKey(definitions, 'pos', partOfSpeechCandidates);

    return Array.from(
        new Set(
            partOfSpeechCandidates
                .map((value) => value.trim().toLowerCase())
                .filter(Boolean),
        ),
    ).map((value) => value.charAt(0).toUpperCase() + value.slice(1));
};

export const extractPhoneticText = (phonetics: unknown) => {
    const pronunciations = toPronunciations(phonetics);

    if (pronunciations && pronunciations.length > 0) {
        return pronunciations[0].text;
    }

    if (!isApiJsonValue(phonetics)) {
        return '';
    }

    const phoneticCandidates: string[] = [];
    collectValuesByKey(phonetics, 'text', phoneticCandidates);

    if (phoneticCandidates.length > 0) {
        return phoneticCandidates[0];
    }

    const allStrings: string[] = [];
    collectAllStrings(phonetics, allStrings);
    return allStrings[0] ?? '';
};

export const extractDictionarySenses = (definitions: unknown): DictionarySense[] => {
    const entries = toDictionaryEntries(definitions);

    if (entries) {
        const senses: DictionarySense[] = [];

        const collectSense = (sense: Sense) => {
            senses.push({
                definition: sense.definition,
                examples: sense.examples,
            });
            sense.subsenses.forEach(collectSense);
        };

        entries.forEach((entry) => {
            entry.senses.forEach(collectSense);
        });

        if (senses.length > 0) {
            return senses.filter((sense, index, list) => {
                return list.findIndex((candidate) => candidate.definition === sense.definition) === index;
            });
        }
    }

    if (!isApiJsonValue(definitions)) {
        return [];
    }

    const senses: DictionarySense[] = [];

    const visit = (value: ApiJsonValue) => {
        if (Array.isArray(value)) {
            value.forEach(visit);
            return;
        }

        if (value === null || typeof value !== 'object') {
            return;
        }

        const record = value as Record<string, ApiJsonValue>;
        const rawDefinition = record.definition;
        const rawExample = record.example ?? record.examples;

        if (typeof rawDefinition === 'string' && rawDefinition.trim()) {
            const examples: string[] = [];

            if (typeof rawExample === 'string' && rawExample.trim()) {
                examples.push(rawExample.trim());
            } else if (Array.isArray(rawExample)) {
                rawExample.forEach((entry) => {
                    if (typeof entry === 'string' && entry.trim()) {
                        examples.push(entry.trim());
                    } else if (entry && typeof entry === 'object') {
                        const nestedText = (entry as Record<string, ApiJsonValue>).text;

                        if (typeof nestedText === 'string' && nestedText.trim()) {
                            examples.push(nestedText.trim());
                        }
                    }
                });
            }

            senses.push({
                definition: rawDefinition.trim(),
                examples: Array.from(new Set(examples)),
            });
        }

        Object.values(record).forEach((nestedValue) => visit(nestedValue));
    };

    visit(definitions);

    if (senses.length > 0) {
        return senses.filter((sense, index, list) => {
            return list.findIndex((candidate) => candidate.definition === sense.definition) === index;
        });
    }

    const fallbackDefinition = extractDefinitionFromDefinitions(definitions);

    return fallbackDefinition
        ? [{ definition: fallbackDefinition, examples: [] }]
        : [];
};


export const createCodexEntry = async (sessionId: number, payload: CodexEntryCreateRequestDTO) => {
    try {
        const res = await fetch(`${API_BASE_URL}/codexEntries/${sessionId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create codex entry');
        const data = await res.json() as Record<string, unknown>;

        return {
            lookupSucceeded: data.lookupSucceeded !== false,
            isCollectible: data.isCollectible === true,
            isNewCapture: data.isNewCapture === true || data.newCapture === true,
            alreadyCaptured: data.alreadyCaptured === true,
            codexEntry: toCodexEntry(isRecord(data.codexEntry) ? data.codexEntry : {}),
            rarityTier: typeof data.rarityTier === 'string' ? data.rarityTier : 'COMMON',
            xpUpdate: toXpUpdate(data.xpUpdate),
            pageNumber: toFiniteNumber(data.pageNumber),
            slotNumber: toFiniteNumber(data.slotNumber),
            pageProgress: toCodexPageProgress(data.pageProgress),
            overallProgress: toCodexOverallProgress(data.overallProgress),
        } satisfies CodexEntryCreateResponseDTO;
    } catch (error) {
        console.error('Error creating codex entry:', error);
        throw error;
    }
};


// Helper to build Authorization headers, refreshing token if needed
async function buildAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};
    try {
        if (keycloak.authenticated && keycloak.updateToken) {
            await keycloak.updateToken(30);
        }
        if (keycloak.token) {
            headers['Authorization'] = `Bearer ${keycloak.token}`;
        }
    } catch (err) {
        console.error('Failed to refresh auth token before API request:', err);
    }
    return headers;
}
