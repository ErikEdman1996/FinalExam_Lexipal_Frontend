import keycloak from '../features/auth/keycloak';

const API_ROOT_URL = (import.meta.env.VITE_API_ROOT_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const API_BASE_URL = `${API_ROOT_URL}/lexipal/api/v1`;
const BOOK_CIRCLE_CHAT_WEBSOCKET_PATH = '/lexipal/ws';

export type ApiBookStatus = 'ACTIVE' | 'COMPLETE' | 'ARCHIVED' | 'DELETED';

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
    xpUpdate?: XpUpdateResponseDTO | null;
    newlyUnlockedAchievements: AchievementResponseDTO[];
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
    coverImageUrl: string | null;
    coverSource: string | null;
    externalBookId: string | null;
}

export type LibraryItemType = 'BOOK';

export type LibraryProgressUnit = 'PAGE';

export interface LibraryItemResponseDTO {
    itemType: LibraryItemType;
    itemId: number;
    title: string;
    creatorName: string | null;
    completedUnits: number;
    totalUnits: number;
    progressPercentage: number;
    progressUnit: LibraryProgressUnit;
    status: string;
    coverImageUrl: string | null;
    addedAt: string;
}

export interface CoverCandidateDTO {
    coverImageUrl: string;
    coverSource: string | null;
    externalBookId: string | null;
    matchedTitle: string | null;
    matchedAuthor: string | null;
    confidence: number;
}

type ApiBookCollectionResponse =
    | unknown[]
    | { books?: unknown[]; content?: unknown[]; data?: unknown[]; items?: unknown[] }
    | null
    | undefined;

type LibraryItemCollectionResponse =
    | unknown[]
    | { libraryItems?: unknown[]; content?: unknown[]; data?: unknown[]; items?: unknown[] }
    | null
    | undefined;

export interface CreateBookRequest {
    title: string;
    author: string;
    totalPages: number;
    startPage?: number;
}

export interface UpdateBookRequest {
    title?: string;
    author?: string;
    readPages?: number;
    totalPages?: number;
    status?: ApiBookStatus;
}

export type BookCircleVisibility = 'ALL_MEMBERS' | 'OWNER_ONLY';

export type BookCircleStatus = 'ACTIVE' | 'CLOSED';

export type BookCircleMemberRole = 'OWNER' | 'MEMBER';

export type CircleMemberBookStatus = 'ACTIVE' | 'COMPLETE' | 'ARCHIVED' | 'DELETED';

export interface BookCircleCreateRequestDTO {
    existingBookId: number | null;
    bookTitle: string | null;
    bookAuthor: string | null;
    totalPages: number | null;
    memberCap: number;
    visibility: BookCircleVisibility;
}

export interface BookCircleCreateResponseDTO {
    id: number;
    inviteCode: string;
    bookTitle: string;
    bookAuthor: string;
    totalPages: number;
    memberCap: number;
    visibility: BookCircleVisibility;
    status: BookCircleStatus;
    createdAt: string;
    newlyUnlockedAchievements: AchievementResponseDTO[];
}

export interface BookCircleMemberSummaryDTO {
    userId: number;
    userNickname: string | null;
    selectedPortrait: PortraitResponseDTO | null;
    role: BookCircleMemberRole;
    readPages: number | null;
    totalPages: number | null;
    progressPercentage: number | null;
    joinedAt: string;
}

export interface BookCircleReadResponseDTO extends BookCircleCreateResponseDTO {
    currentMemberCount: number;
    ownerNickname: string | null;
    callerIsOwner: boolean;
    nextMeetingDate: string | null;
    meetingChapterLabel: string | null;
    meetingPageStart: number | null;
    meetingPageEnd: number | null;
    members: BookCircleMemberSummaryDTO[];
}

export interface BookCircleNextMeetingRequestDTO {
    meetingDate: string;
    chapterLabel: string | null;
    pageStart: number | null;
    pageEnd: number | null;
}

export interface CircleChatMessageDTO {
    id: number;
    circleId: number;
    senderUserId: number;
    senderNickname: string | null;
    content: string | null;
    deleted: boolean;
    createdAt: string;
    deletedAt: string | null;
}

export interface CircleChatHistoryResponseDTO {
    messages: CircleChatMessageDTO[];
    hasMore: boolean;
    nextBeforeMessageId: number | null;
}

export interface CircleChatPresenceMemberDTO {
    userId: number;
    userNickname: string | null;
    selectedPortrait?: PortraitResponseDTO | null;
}

export type CircleChatEventType =
    | 'MESSAGE_CREATED'
    | 'MESSAGE_DELETED'
    | 'PRESENCE_UPDATED'
    | 'CHAT_CLOSED'
    | 'CHAT_ACCESS_REVOKED';

export interface CircleChatEventDTO {
    circleId: number;
    type: CircleChatEventType;
    message: CircleChatMessageDTO | null;
    onlineMembers: CircleChatPresenceMemberDTO[] | null;
    reason: string | null;
}

export interface CircleChatSocketErrorDTO {
    message: string;
    status: number;
}

export interface GetBookCircleChatMessagesOptions {
    beforeMessageId?: number | null;
    limit?: number;
}

export interface JoinBookCircleRequestDTO {
    inviteCode: string;
}

export interface CircleMemberSessionDTO {
    sessionId: number;
    sessionDate: string;
    completedAt: string | null;
    durationSeconds: number;
    startPage: number;
    endPage: number | null;
    pagesRead: number;
    status: 'IN_PROGRESS' | 'COMPLETED';
    reflection: string | null;
}

export interface CircleMemberNoteDTO {
    noteId: number;
    quotedText: string;
    pageNumber: number;
    chapterLabel: string | null;
    createdAt: string;
    sourceSessionId: number | null;
    tags: ApiNoteTag[];
}

export interface CircleMemberDetailResponseDTO {
    circleId: number;
    userId: number;
    userNickname: string | null;
    selectedPortrait: PortraitResponseDTO | null;
    role: BookCircleMemberRole;
    joinedAt: string;
    readPages: number;
    totalPages: number;
    progressPercentage: number;
    bookId: number;
    bookTitle: string;
    bookAuthor: string;
    bookStatus: CircleMemberBookStatus;
    sessions: CircleMemberSessionDTO[];
    notes: CircleMemberNoteDTO[];
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

export type NoteFieldName = 'quotedText' | 'pageNumber' | 'chapterLabel' | 'tagIds';

export type NoteFieldErrors = Partial<Record<NoteFieldName, string>>;

export type NoteTagFieldName = 'name' | 'colorHex';

export type NoteTagFieldErrors = Partial<Record<NoteTagFieldName, string>>;

export type NoteTagMatch = 'ANY' | 'ALL';

export interface ApiNoteTag {
    id: number;
    name: string;
    colorHex: string;
}

export interface ApiNoteTagSummary extends ApiNoteTag {
    usageCount: number;
}

export interface ApiNote {
    id: number;
    bookId: number;
    sourceSessionId: number | null;
    pageNumber: number;
    chapterLabel: string | null;
    quotedText: string;
    createdAt: string;
    tags: ApiNoteTag[];
}

type ApiNoteResponse = unknown;

type ApiNoteCollectionResponse = unknown;

export interface CreateNotePayload {
    bookId: number;
    sessionId?: number;
    quotedText: string;
    pageNumber: number;
    chapterLabel?: string;
    tagIds?: number[];
}

export interface UpdateNotePayload {
    quotedText?: string;
    pageNumber?: number;
    chapterLabel?: string | null;
    tagIds?: number[];
}

export interface GetNotesOptions {
    tagIds?: number[];
    tagMatch?: NoteTagMatch;
}

export interface CreateNoteTagPayload {
    name: string;
    colorHex: string;
}

export interface UpdateNoteTagPayload {
    name?: string;
    colorHex?: string;
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

export interface WordLookupCreateRequestDTO {
    lemma: string;
}

export interface WordLookupReadResponseDTO {
    id: number;
    wordId: number;
    lemma: string;
    source: string;
    definitions: unknown;
    phonetics: unknown;
    firstLookedUpAt: string;
    lastLookedUpAt: string;
    lookupCount: number;
}

export interface ProfileStatsResponseDTO {
    totalPagesRead: number;
    totalBooksRead: number;
    totalSessionsCompleted: number;
    totalXpEarned: number;
    totalMinutesRead: number;
    level: number;
    xpIntoLevel: number;
    xpPerLevel: number;
    maxLevel: number;
    currentLevelMinXp: number;
    nextLevelMinXp: number | null;
    xpToNextLevel: number;
}

export type LeaderboardLimit = 10 | 50 | 100;

export interface WalletResponseDTO {
    coinBalance: number;
    availableStreakFreezes: number;
}

export type StoreItemType = 'STREAK_FREEZE' | 'THEME';

export interface StoreItemResponseDTO {
    code: string;
    name: string;
    description: string;
    itemType: StoreItemType;
    priceCoins: number;
    owned: boolean;
    selected: boolean;
    ownedQuantity: number | null;
    themeCode: string | null;
}

export interface StoreResponseDTO {
    wallet: WalletResponseDTO;
    items: StoreItemResponseDTO[];
}

export interface StorePurchaseResponseDTO {
    wallet: WalletResponseDTO;
    item: StoreItemResponseDTO;
}

export type ThemeTone = 'LIGHT' | 'DARK';

export interface ThemeResponseDTO {
    code: string;
    name: string;
    description: string;
    tone: ThemeTone;
    sortOrder: number;
    unlocked: boolean;
    selected: boolean;
    priceCoins: number;
    unlockedAt: string | null;
}

export interface StreakMetaDataReadResponseDTO {
    id: number;
    userId: number;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
    availableStreakFreezes: number;
    freezeProtectedThroughDate: string | null;
}

export interface StreakLeaderboardEntryDTO {
    rank: number;
    userId: number;
    nickname: string;
    currentStreak: number;
    lastActivityDate: string | null;
}

export interface StreakLeaderboardResponseDTO {
    limit: LeaderboardLimit;
    asOfDate: string;
    timezone: string;
    entries: StreakLeaderboardEntryDTO[];
}

export interface DailyActivityReadResponseDTO {
    id: number;
    userId: number;
    sessionId: number | null;
    activityDate: string;
    activityType: string;
    xpEarned: number;
}

export interface AchievementResponseDTO {
    code: string;
    category: string;
    title: string;
    description: string;
    threshold: number;
    progress: number;
    unlocked: boolean;
    unlockedAt: string | null;
    sortOrder: number;
}

export interface PortraitResponseDTO {
    code: string;
    name: string;
    description: string;
    assetKey: string;
    requiredLevel: number;
    sortOrder: number;
    unlocked: boolean;
    selected: boolean;
    unlockedAt: string | null;
}

export interface ProfileReadResponseDTO {
    id: number | null;
    status: string;
    createdAt: string;
    nickname: string | null;
    needsOnboarding: boolean;
    stats: ProfileStatsResponseDTO;
    streak: StreakMetaDataReadResponseDTO | null;
    recentDailyActivities: DailyActivityReadResponseDTO[];
    selectedPortrait: PortraitResponseDTO | null;
    selectedTheme: ThemeResponseDTO | null;
    wallet: WalletResponseDTO;
}

export interface XpUpdateResponseDTO {
    xpAwarded: number;
    previousTotalXp: number;
    newTotalXp: number;
    level: number;
    xpIntoLevel: number;
    xpPerLevel: number;
    maxLevel: number;
    currentLevelMinXp: number;
    nextLevelMinXp: number | null;
    xpToNextLevel: number;
    leveledUp: boolean;
}

export interface DictionarySense {
    definition: string;
    examples: string[];
}

export interface WordLookupCreateResponseDTO {
    wordLookup: WordLookupReadResponseDTO;
    lookupSucceeded: boolean;
    isNewLookup: boolean;
}

export type ChallengeType = 'FLASHCARD' | 'CROSSWORD' | string;

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
    wordLookupId: number;
}

export interface ChallengeAttempt {
    id: number;
    userAnswer: string | null;
    result: ChallengeAttemptResult;
    xpAwarded: number;
    attemptedAt: string;
    challengeId: number;
    challengeType: ChallengeType;
    wordLookupId: number | null;
    lemma: string | null;
    definitionPreview: string | null;
    xpUpdate?: XpUpdateResponseDTO | null;
}

export type CrosswordDirection = 'ACROSS' | 'DOWN';

export type CrosswordPuzzleStatus = 'ACTIVE' | 'SUBMITTED' | string;

export interface CrosswordCellDTO {
    row: number;
    column: number;
    number: number | null;
    entryIds: string[];
}

export interface CrosswordEntryDTO {
    id: string;
    number: number;
    direction: CrosswordDirection;
    row: number;
    column: number;
    length: number;
    clue: string;
}

export interface CrosswordGridDTO {
    rows: number;
    columns: number;
    cells: CrosswordCellDTO[];
}

export interface CrosswordPuzzleDTO {
    wordCount: number;
    grid: CrosswordGridDTO;
    entries: CrosswordEntryDTO[];
}

export interface CrosswordPuzzleResponse {
    id: number;
    challengeId: number;
    status: CrosswordPuzzleStatus;
    createdAt: string;
    submittedAt: string | null;
    puzzle: CrosswordPuzzleDTO;
}

export interface CrosswordAnswerResult {
    entryId: string;
    correct: boolean;
}

export interface CrosswordSubmitResponse {
    puzzle: CrosswordPuzzleDTO;
    attempt: ChallengeAttempt;
    result: ChallengeAttemptResult;
    correctCount: number;
    totalEntries: number;
    answerResults: CrosswordAnswerResult[];
}

export class ApiValidationError<FieldName extends string = string> extends Error {
    status: number;
    fieldErrors: Partial<Record<FieldName, string>>;

    constructor(
        message: string,
        options?: {
            status?: number;
            fieldErrors?: Partial<Record<FieldName, string>>;
        },
    ) {
        super(message);
        this.name = 'ApiValidationError';
        this.status = options?.status ?? 400;
        this.fieldErrors = options?.fieldErrors ?? {};
    }
}

export class ApiResponseError extends Error {
    status: number;
    payload: unknown;

    constructor(
        message: string,
        options?: {
            status?: number;
            payload?: unknown;
        },
    ) {
        super(message);
        this.name = 'ApiResponseError';
        this.status = options?.status ?? 500;
        this.payload = options?.payload ?? null;
    }
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

const isLeaderboardLimit = (value: number): value is LeaderboardLimit => {
    return value === 10 || value === 50 || value === 100;
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

const isLibraryItemType = (value: unknown): value is LibraryItemType => {
    return value === 'BOOK';
};

const isLibraryProgressUnit = (value: unknown): value is LibraryProgressUnit => {
    return value === 'PAGE';
};

const isLibraryItemLikeRecord = (value: unknown): value is Record<string, unknown> => {
    if (!isRecord(value)) {
        return false;
    }

    return isLibraryItemType(value.itemType) && toFiniteNumber(value.itemId) !== null;
};

const isWordLookupLikeRecord = (value: unknown): value is Record<string, unknown> => {
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

const isNoteLikeRecord = (value: unknown): value is Record<string, unknown> => {
    if (!isRecord(value)) {
        return false;
    }

    return (
        toFiniteNumber(value.id) !== null
        && toFiniteNumber(value.bookId) !== null
        && toFiniteNumber(value.pageNumber) !== null
        && typeof value.quotedText === 'string'
    );
};

const isNoteTagLikeRecord = (value: unknown): value is Record<string, unknown> => {
    if (!isRecord(value)) {
        return false;
    }

    return (
        toFiniteNumber(value.id) !== null
        && typeof value.name === 'string'
        && typeof value.colorHex === 'string'
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

    const rawCoverImageUrl = typeof value.coverImageUrl === 'string' ? value.coverImageUrl.trim() : '';
    const coverImageUrl = rawCoverImageUrl.length > 0 ? rawCoverImageUrl : null;
    const rawCoverSource = typeof value.coverSource === 'string' ? value.coverSource.trim() : '';
    const coverSource = rawCoverSource.length > 0 ? rawCoverSource : null;
    const rawExternalBookId = typeof value.externalBookId === 'string' ? value.externalBookId.trim() : '';
    const externalBookId = rawExternalBookId.length > 0 ? rawExternalBookId : null;

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
        coverImageUrl,
        coverSource,
        externalBookId,
    };
};

const toLibraryItem = (value: Record<string, unknown>): LibraryItemResponseDTO => {
    const itemType: LibraryItemType = 'BOOK';
    const rawCoverImageUrl = typeof value.coverImageUrl === 'string' ? value.coverImageUrl.trim() : '';
    const totalUnits = Math.max(0, toFiniteNumber(value.totalUnits) ?? 0);
    const completedUnits = Math.max(0, Math.min(toFiniteNumber(value.completedUnits) ?? 0, totalUnits));
    const derivedProgressPercentage = totalUnits > 0 ? (completedUnits / totalUnits) * 100 : 0;

    return {
        itemType,
        itemId: toFiniteNumber(value.itemId) ?? 0,
        title: typeof value.title === 'string' ? value.title : '',
        creatorName: typeof value.creatorName === 'string' ? value.creatorName : null,
        completedUnits,
        totalUnits,
        progressPercentage: Math.max(0, Math.min(100, toFiniteNumber(value.progressPercentage) ?? derivedProgressPercentage)),
        progressUnit: isLibraryProgressUnit(value.progressUnit) ? value.progressUnit : 'PAGE',
        status: typeof value.status === 'string' ? value.status : '',
        coverImageUrl: rawCoverImageUrl.length > 0 ? rawCoverImageUrl : null,
        addedAt: typeof value.addedAt === 'string' ? value.addedAt : '',
    };
};

const toBookLibraryItem = (book: ApiBook): LibraryItemResponseDTO => {
    const totalUnits = Math.max(0, book.totalPages);
    const completedUnits = Math.max(0, Math.min(book.readPages, totalUnits));
    const progressPercentage = typeof book.progressPercentage === 'number'
        ? book.progressPercentage
        : totalUnits > 0
            ? (completedUnits / totalUnits) * 100
            : 0;

    return {
        itemType: 'BOOK',
        itemId: book.id,
        title: book.title,
        creatorName: book.author,
        completedUnits,
        totalUnits,
        progressPercentage: Math.max(0, Math.min(100, progressPercentage)),
        progressUnit: 'PAGE',
        status: book.status,
        coverImageUrl: book.coverImageUrl,
        addedAt: book.createdAt,
    };
};

const toApiNoteTag = (value: Record<string, unknown>): ApiNoteTag => {
    const name = typeof value.name === 'string' ? value.name.trim() : '';
    const colorHex = typeof value.colorHex === 'string' ? value.colorHex.trim() : '';

    return {
        id: toFiniteNumber(value.id) ?? 0,
        name,
        colorHex,
    };
};

const toApiNoteTagSummary = (value: Record<string, unknown>): ApiNoteTagSummary => {
    return {
        ...toApiNoteTag(value),
        usageCount: Math.max(0, toFiniteNumber(value.usageCount) ?? 0),
    };
};

const toApiNote = (value: Record<string, unknown>): ApiNote => {
    const rawChapterLabel = typeof value.chapterLabel === 'string' ? value.chapterLabel.trim() : '';
    const tags = Array.isArray(value.tags)
        ? value.tags
            .filter(isNoteTagLikeRecord)
            .map(toApiNoteTag)
        : [];

    return {
        id: toFiniteNumber(value.id) ?? 0,
        bookId: toFiniteNumber(value.bookId) ?? 0,
        sourceSessionId: value.sourceSessionId == null ? null : (toFiniteNumber(value.sourceSessionId) ?? null),
        pageNumber: Math.max(1, toFiniteNumber(value.pageNumber) ?? 1),
        chapterLabel: rawChapterLabel ? rawChapterLabel : null,
        quotedText: typeof value.quotedText === 'string' ? value.quotedText : '',
        createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
        tags,
    };
};

const toWordLookup = (value: Record<string, unknown>): WordLookupReadResponseDTO => {
    return {
        id: toFiniteNumber(value.id) ?? 0,
        wordId: toFiniteNumber(value.wordId) ?? 0,
        lemma: typeof value.lemma === 'string' ? value.lemma : '',
        source: typeof value.source === 'string' ? value.source : '',
        definitions: value.definitions ?? null,
        phonetics: value.phonetics ?? null,
        firstLookedUpAt: typeof value.firstLookedUpAt === 'string' ? value.firstLookedUpAt : '',
        lastLookedUpAt: typeof value.lastLookedUpAt === 'string' ? value.lastLookedUpAt : '',
        lookupCount: Math.max(0, toFiniteNumber(value.lookupCount) ?? 0),
    };
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
        wordLookupId: value.wordLookupId == null ? null : (toFiniteNumber(value.wordLookupId) ?? null),
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
    const level = Math.max(1, toFiniteNumber(value.level) ?? 1);
    const xpPerLevel = Math.max(1, toFiniteNumber(value.xpPerLevel) ?? 1);
    const xpIntoLevel = Math.max(0, toFiniteNumber(value.xpIntoLevel) ?? 0);
    const maxLevel = Math.max(1, toFiniteNumber(value.maxLevel) ?? level);
    const currentLevelMinXp = Math.max(0, toFiniteNumber(value.currentLevelMinXp) ?? 0);
    const rawNextLevelMinXp = toFiniteNumber(value.nextLevelMinXp);
    const nextLevelMinXp = value.nextLevelMinXp == null || rawNextLevelMinXp == null
        ? null
        : Math.max(0, rawNextLevelMinXp);
    const xpToNextLevel = Math.max(0, toFiniteNumber(value.xpToNextLevel) ?? 0);

    return {
        xpAwarded: toFiniteNumber(value.xpAwarded) ?? Math.max(0, newTotalXp - previousTotalXp),
        previousTotalXp,
        newTotalXp,
        level,
        xpIntoLevel,
        xpPerLevel,
        maxLevel,
        currentLevelMinXp,
        nextLevelMinXp,
        xpToNextLevel,
        leveledUp: value.leveledUp === true,
    };
};

const toProfileStats = (value: unknown): ProfileStatsResponseDTO => {
    const record = isRecord(value) ? value : {};
    const level = Math.max(1, toFiniteNumber(record.level) ?? 1);
    const xpPerLevel = Math.max(1, toFiniteNumber(record.xpPerLevel) ?? 1);
    const xpIntoLevel = Math.max(0, toFiniteNumber(record.xpIntoLevel) ?? 0);
    const maxLevel = Math.max(1, toFiniteNumber(record.maxLevel) ?? level);
    const currentLevelMinXp = Math.max(0, toFiniteNumber(record.currentLevelMinXp) ?? 0);
    const rawNextLevelMinXp = toFiniteNumber(record.nextLevelMinXp);
    const nextLevelMinXp = record.nextLevelMinXp == null || rawNextLevelMinXp == null
        ? null
        : Math.max(0, rawNextLevelMinXp);
    const xpToNextLevel = Math.max(0, toFiniteNumber(record.xpToNextLevel) ?? 0);

    return {
        totalPagesRead: toFiniteNumber(record.totalPagesRead) ?? 0,
        totalBooksRead: toFiniteNumber(record.totalBooksRead) ?? 0,
        totalSessionsCompleted: toFiniteNumber(record.totalSessionsCompleted) ?? 0,
        totalXpEarned: toFiniteNumber(record.totalXpEarned) ?? 0,
        totalMinutesRead: toFiniteNumber(record.totalMinutesRead) ?? 0,
        level,
        xpIntoLevel,
        xpPerLevel,
        maxLevel,
        currentLevelMinXp,
        nextLevelMinXp,
        xpToNextLevel,
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
        lastActivityDate: typeof value.lastActivityDate === 'string' && value.lastActivityDate.trim()
            ? value.lastActivityDate
            : null,
        availableStreakFreezes: Math.max(0, toFiniteNumber(value.availableStreakFreezes) ?? 0),
        freezeProtectedThroughDate:
            typeof value.freezeProtectedThroughDate === 'string' && value.freezeProtectedThroughDate.trim()
                ? value.freezeProtectedThroughDate
                : null,
    };
};

const toWallet = (value: unknown): WalletResponseDTO => {
    const record = isRecord(value) ? value : {};

    return {
        coinBalance: Math.max(0, toFiniteNumber(record.coinBalance) ?? 0),
        availableStreakFreezes: Math.max(0, toFiniteNumber(record.availableStreakFreezes) ?? 0),
    };
};

const isStoreItemType = (value: unknown): value is StoreItemType => {
    return value === 'STREAK_FREEZE' || value === 'THEME';
};

const normalizeLegacyThemeCode = (value: unknown): string | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();

    if (!trimmed) {
        return null;
    }

    return trimmed === 'forest_codex' ? 'forest_canopy' : trimmed;
};

const normalizeLegacyThemeName = (code: string, name: string) => {
    const legacyForestName = ['Forest', 'Co' + 'dex'].join(' ');
    return code === 'forest_canopy' && name === legacyForestName ? 'Forest Canopy' : name;
};

const toStoreItem = (value: unknown): StoreItemResponseDTO | null => {
    if (!isRecord(value) || typeof value.code !== 'string' || !isStoreItemType(value.itemType)) {
        return null;
    }

    const code = normalizeLegacyThemeCode(value.code) ?? value.code;
    const name = typeof value.name === 'string' ? value.name : code;

    return {
        code,
        name: normalizeLegacyThemeName(code, name),
        description: typeof value.description === 'string' ? value.description : '',
        itemType: value.itemType,
        priceCoins: Math.max(0, toFiniteNumber(value.priceCoins) ?? 0),
        owned: value.owned === true,
        selected: value.selected === true,
        ownedQuantity: value.ownedQuantity == null
            ? null
            : Math.max(0, toFiniteNumber(value.ownedQuantity) ?? 0),
        themeCode: normalizeLegacyThemeCode(value.themeCode),
    };
};

const normalizeStoreResponse = (value: unknown): StoreResponseDTO => {
    if (!isRecord(value)) {
        throw new Error('Unexpected store response shape.');
    }

    const items = Array.isArray(value.items)
        ? value.items
            .map(toStoreItem)
            .filter((item): item is StoreItemResponseDTO => item !== null)
        : [];

    return {
        wallet: toWallet(value.wallet),
        items,
    };
};

const normalizeStorePurchaseResponse = (value: unknown): StorePurchaseResponseDTO => {
    if (!isRecord(value)) {
        throw new Error('Unexpected store purchase response shape.');
    }

    const item = toStoreItem(value.item);

    if (!item) {
        throw new Error('Unexpected purchased store item response shape.');
    }

    return {
        wallet: toWallet(value.wallet),
        item,
    };
};

const toStreakLeaderboardEntry = (value: unknown, index: number): StreakLeaderboardEntryDTO | null => {
    if (!isRecord(value)) {
        return null;
    }

    const nickname = typeof value.nickname === 'string' && value.nickname.trim()
        ? value.nickname.trim()
        : 'Reader';

    return {
        rank: Math.max(1, toFiniteNumber(value.rank) ?? index + 1),
        userId: Math.max(0, toFiniteNumber(value.userId) ?? 0),
        nickname,
        currentStreak: Math.max(0, toFiniteNumber(value.currentStreak) ?? 0),
        lastActivityDate: typeof value.lastActivityDate === 'string' && value.lastActivityDate.trim()
            ? value.lastActivityDate
            : null,
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

const toAchievement = (value: unknown): AchievementResponseDTO | null => {
    if (!isRecord(value) || typeof value.code !== 'string') {
        return null;
    }

    return {
        code: value.code,
        category: typeof value.category === 'string' ? value.category : 'general',
        title: typeof value.title === 'string' ? value.title : value.code,
        description: typeof value.description === 'string' ? value.description : '',
        threshold: Math.max(0, toFiniteNumber(value.threshold) ?? 0),
        progress: Math.max(0, toFiniteNumber(value.progress) ?? 0),
        unlocked: value.unlocked === true,
        unlockedAt: typeof value.unlockedAt === 'string' && value.unlockedAt.trim() ? value.unlockedAt : null,
        sortOrder: toFiniteNumber(value.sortOrder) ?? 0,
    };
};

const toAchievementArray = (value: unknown): AchievementResponseDTO[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map(toAchievement)
        .filter((achievement): achievement is AchievementResponseDTO => achievement !== null);
};

const replaceLegacyBrandCopy = (value: string) => (
    value
        .replace(/\bLexipal\b/g, 'Bookmark')
        .replace(/\blexipal\b/g, 'Bookmark')
        .replace(/\bLEXIPAL\b/g, 'BOOKMARK')
);

const toPortrait = (value: unknown): PortraitResponseDTO | null => {
    if (!isRecord(value) || typeof value.code !== 'string') {
        return null;
    }

    return {
        code: value.code,
        name: replaceLegacyBrandCopy(typeof value.name === 'string' ? value.name : value.code),
        description: replaceLegacyBrandCopy(typeof value.description === 'string' ? value.description : ''),
        assetKey: typeof value.assetKey === 'string' ? value.assetKey : '',
        requiredLevel: Math.max(1, toFiniteNumber(value.requiredLevel) ?? 1),
        sortOrder: toFiniteNumber(value.sortOrder) ?? 0,
        unlocked: value.unlocked === true,
        selected: value.selected === true,
        unlockedAt: typeof value.unlockedAt === 'string' && value.unlockedAt.trim() ? value.unlockedAt : null,
    };
};

const toThemeTone = (value: unknown): ThemeTone => {
    return value === 'DARK' ? 'DARK' : 'LIGHT';
};

const toTheme = (value: unknown): ThemeResponseDTO | null => {
    if (!isRecord(value) || typeof value.code !== 'string') {
        return null;
    }

    const code = normalizeLegacyThemeCode(value.code);

    if (!code) {
        return null;
    }

    const name = typeof value.name === 'string' ? value.name : code;

    return {
        code,
        name: normalizeLegacyThemeName(code, name),
        description: typeof value.description === 'string' ? value.description : '',
        tone: toThemeTone(value.tone),
        sortOrder: toFiniteNumber(value.sortOrder) ?? 0,
        unlocked: value.unlocked === true,
        selected: value.selected === true,
        priceCoins: Math.max(0, toFiniteNumber(value.priceCoins) ?? 0),
        unlockedAt: typeof value.unlockedAt === 'string' && value.unlockedAt.trim() ? value.unlockedAt : null,
    };
};

const normalizeThemesResponse = (value: unknown): ThemeResponseDTO[] => {
    const themes = Array.isArray(value)
        ? value
        : (isRecord(value)
            ? [value.themes, value.content, value.data, value.items]
                .find((candidate) => Array.isArray(candidate))
            : undefined);

    if (!Array.isArray(themes)) {
        return [];
    }

    return themes
        .map(toTheme)
        .filter((theme): theme is ThemeResponseDTO => theme !== null)
        .sort((left, right) => left.sortOrder - right.sortOrder);
};

const findNoteLikeRecord = (value: unknown, depth = 0): Record<string, unknown> | null => {
    if (depth > 6 || value == null) {
        return null;
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value) as unknown;
            return findNoteLikeRecord(parsed, depth + 1);
        } catch {
            return null;
        }
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            const found = findNoteLikeRecord(item, depth + 1);

            if (found) {
                return found;
            }
        }

        return null;
    }

    if (!isRecord(value)) {
        return null;
    }

    if (isNoteLikeRecord(value)) {
        return value;
    }

    for (const nested of Object.values(value)) {
        const found = findNoteLikeRecord(nested, depth + 1);

        if (found) {
            return found;
        }
    }

    return null;
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

const normalizeLibraryItemsResponse = (value: LibraryItemCollectionResponse): LibraryItemResponseDTO[] => {
    if (Array.isArray(value)) {
        return value
            .filter(isLibraryItemLikeRecord)
            .map(toLibraryItem);
    }

    if (!isRecord(value)) {
        return [];
    }

    const collections = [value.libraryItems, value.content, value.data, value.items];

    for (const collection of collections) {
        if (Array.isArray(collection)) {
            return collection
                .filter(isLibraryItemLikeRecord)
                .map(toLibraryItem);
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
        xpUpdate: toXpUpdate(value.xpUpdate),
        newlyUnlockedAchievements: toAchievementArray(value.newlyUnlockedAchievements),
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

const normalizeWordLookupsResponse = (value: unknown): WordLookupReadResponseDTO[] => {
    if (Array.isArray(value)) {
        return value
            .filter(isWordLookupLikeRecord)
            .map(toWordLookup);
    }

    if (!isRecord(value)) {
        return [];
    }

    const collections = [value.wordLookups, value.lookups, value.content, value.data, value.items];

    for (const collection of collections) {
        if (Array.isArray(collection)) {
            return collection
                .filter(isWordLookupLikeRecord)
                .map(toWordLookup);
        }
    }

    return isWordLookupLikeRecord(value) ? [toWordLookup(value)] : [];
};

const normalizeWordLookupCreateResponse = (value: unknown): WordLookupCreateResponseDTO => {
    const outerRecord = isRecord(value) ? value : {};
    const record = isRecord(outerRecord.data) && isRecord(outerRecord.data.wordLookup)
        ? outerRecord.data
        : outerRecord;
    const wordLookupRecord = [record.wordLookup, record.lookup, record.item]
        .find(isWordLookupLikeRecord);

    return {
        wordLookup: toWordLookup(wordLookupRecord ?? {}),
        lookupSucceeded: record.lookupSucceeded !== false,
        isNewLookup: record.isNewLookup === true,
    };
};

const normalizeAchievementsResponse = (value: unknown): AchievementResponseDTO[] => {
    const array = Array.isArray(value)
        ? value
        : (isRecord(value)
            ? [value.achievements, value.content, value.data, value.items]
                .find((candidate) => Array.isArray(candidate)) as unknown[] | undefined
            : undefined);

    if (!Array.isArray(array)) {
        return [];
    }

    return toAchievementArray(array)
        .sort((a, b) => a.sortOrder - b.sortOrder);
};

const normalizePortraitsResponse = (value: unknown): PortraitResponseDTO[] => {
    const array = Array.isArray(value)
        ? value
        : (isRecord(value)
            ? [value.portraits, value.content, value.data, value.items]
                .find((candidate) => Array.isArray(candidate)) as unknown[] | undefined
            : undefined);

    if (!Array.isArray(array)) {
        return [];
    }

    return array
        .map(toPortrait)
        .filter((portrait): portrait is PortraitResponseDTO => portrait !== null)
        .sort((a, b) => a.sortOrder - b.sortOrder);
};

const normalizeStreakLeaderboardResponse = (
    value: unknown,
    requestedLimit: LeaderboardLimit,
): StreakLeaderboardResponseDTO => {
    const record = isRecord(value) ? value : {};
    const rawLimit = toFiniteNumber(record.limit);
    const limit = rawLimit != null && isLeaderboardLimit(rawLimit) ? rawLimit : requestedLimit;
    const rawEntries = Array.isArray(record.entries) ? record.entries : [];

    return {
        limit,
        asOfDate: typeof record.asOfDate === 'string' ? record.asOfDate : '',
        timezone: typeof record.timezone === 'string' ? record.timezone : '',
        entries: rawEntries
            .map(toStreakLeaderboardEntry)
            .filter((entry): entry is StreakLeaderboardEntryDTO => entry !== null),
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
    const nickname = typeof value.nickname === 'string' ? value.nickname : null;
    const backendNeedsOnboarding = typeof value.needsOnboarding === 'boolean'
        ? value.needsOnboarding
        : null;

    return {
        id: toFiniteNumber(value.id) ?? toFiniteNumber(value.userId) ?? null,
        status: typeof value.status === 'string' ? value.status : '',
        createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
        nickname,
        needsOnboarding: backendNeedsOnboarding ?? (nickname == null || nickname.trim() === ''),
        stats: toProfileStats(value.stats),
        streak: toStreakMetadata(value.streak),
        recentDailyActivities,
        selectedPortrait: toPortrait(value.selectedPortrait),
        selectedTheme: toTheme(value.selectedTheme),
        wallet: toWallet(value.wallet),
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

const toCrosswordDirection = (value: unknown): CrosswordDirection => {
    return value === 'DOWN' ? 'DOWN' : 'ACROSS';
};

const toCrosswordCell = (value: Record<string, unknown>): CrosswordCellDTO => {
    const entryIdsRaw = Array.isArray(value.entryIds) ? value.entryIds : [];
    const entryIds = entryIdsRaw.filter((id): id is string => typeof id === 'string');
    const numberValue = typeof value.number === 'number' ? value.number : null;

    return {
        row: typeof value.row === 'number' ? value.row : 0,
        column: typeof value.column === 'number' ? value.column : 0,
        number: numberValue,
        entryIds,
    };
};

const toCrosswordEntry = (value: Record<string, unknown>): CrosswordEntryDTO => {
    return {
        id: typeof value.id === 'string' ? value.id : '',
        number: typeof value.number === 'number' ? value.number : 0,
        direction: toCrosswordDirection(value.direction),
        row: typeof value.row === 'number' ? value.row : 0,
        column: typeof value.column === 'number' ? value.column : 0,
        length: typeof value.length === 'number' ? value.length : 0,
        clue: typeof value.clue === 'string' ? value.clue : '',
    };
};

const toCrosswordPuzzle = (value: Record<string, unknown>): CrosswordPuzzleDTO => {
    const grid = isRecord(value.grid) ? value.grid : {};
    const cellsRaw = Array.isArray(grid.cells) ? grid.cells : [];
    const entriesRaw = Array.isArray(value.entries) ? value.entries : [];

    return {
        wordCount: typeof value.wordCount === 'number' ? value.wordCount : entriesRaw.length,
        grid: {
            rows: typeof grid.rows === 'number' ? grid.rows : 0,
            columns: typeof grid.columns === 'number' ? grid.columns : 0,
            cells: cellsRaw.filter(isRecord).map(toCrosswordCell),
        },
        entries: entriesRaw.filter(isRecord).map(toCrosswordEntry),
    };
};

const toCrosswordPuzzleResponse = (value: Record<string, unknown>): CrosswordPuzzleResponse => {
    const puzzleRaw = isRecord(value.puzzle) ? value.puzzle : {};

    return {
        id: typeof value.id === 'number' ? value.id : 0,
        challengeId: typeof value.challengeId === 'number' ? value.challengeId : 0,
        status: typeof value.status === 'string' ? value.status : 'ACTIVE',
        createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
        submittedAt: typeof value.submittedAt === 'string' ? value.submittedAt : null,
        puzzle: toCrosswordPuzzle(puzzleRaw),
    };
};

const normalizeCrosswordPuzzleResponse = (value: unknown): CrosswordPuzzleResponse => {
    if (isRecord(value) && isRecord(value.puzzle)) {
        return toCrosswordPuzzleResponse(value);
    }

    if (isRecord(value)) {
        const nested = [value.data, value.item].find((candidate) => isRecord(candidate) && isRecord((candidate as Record<string, unknown>).puzzle));

        if (isRecord(nested)) {
            return toCrosswordPuzzleResponse(nested);
        }
    }

    console.error('Unexpected crossword puzzle response shape. Raw payload:', value);
    throw new Error('Unexpected crossword puzzle response shape.');
};

const toCrosswordAnswerResult = (value: Record<string, unknown>): CrosswordAnswerResult => {
    return {
        entryId: typeof value.entryId === 'string' ? value.entryId : '',
        correct: value.correct === true,
    };
};

const normalizeCrosswordSubmitResponse = (value: unknown): CrosswordSubmitResponse => {
    if (!isRecord(value)) {
        console.error('Unexpected crossword submit response shape. Raw payload:', value);
        throw new Error('Unexpected crossword submit response shape.');
    }

    const puzzleRaw = isRecord(value.puzzle) ? value.puzzle : {};
    const attemptRaw = isRecord(value.attempt) ? value.attempt : {};
    const answerResultsRaw = Array.isArray(value.answerResults) ? value.answerResults : [];
    const result: ChallengeAttemptResult = value.result === 'PASS' ? 'PASS' : 'FAIL';

    return {
        puzzle: toCrosswordPuzzle(puzzleRaw),
        attempt: isChallengeAttemptLikeRecord(attemptRaw)
            ? toChallengeAttempt(attemptRaw)
            : normalizeChallengeAttemptResponse(attemptRaw),
        result,
        correctCount: typeof value.correctCount === 'number' ? value.correctCount : 0,
        totalEntries: typeof value.totalEntries === 'number' ? value.totalEntries : 0,
        answerResults: answerResultsRaw.filter(isRecord).map(toCrosswordAnswerResult),
    };
};

const normalizeSessionResponse = (value: ApiSessionResponse): ApiSession => {
    const candidate = findSessionLikeRecord(value);

    if (candidate) {
        return toApiSession(candidate);
    }

    console.error('Unexpected session response shape. Raw payload:', value);
    throw new Error('Unexpected session response shape.');
};

const normalizeNotesResponse = (value: ApiNoteCollectionResponse): ApiNote[] => {
    if (Array.isArray(value)) {
        return value
            .filter(isNoteLikeRecord)
            .map(toApiNote);
    }

    if (!isRecord(value)) {
        return [];
    }

    const collections = [value.notes, value.content, value.data, value.items];

    for (const collection of collections) {
        if (Array.isArray(collection)) {
            return collection
                .filter(isNoteLikeRecord)
                .map(toApiNote);
        }
    }

    return isNoteLikeRecord(value) ? [toApiNote(value)] : [];
};

const normalizeNoteResponse = (value: ApiNoteResponse): ApiNote => {
    const candidate = findNoteLikeRecord(value);

    if (candidate) {
        return toApiNote(candidate);
    }

    console.error('Unexpected note response shape. Raw payload:', value);
    throw new Error('Unexpected note response shape.');
};

const normalizeNoteTagsResponse = (value: unknown): ApiNoteTagSummary[] => {
    const array = Array.isArray(value)
        ? value
        : (isRecord(value)
            ? [value.tags, value.noteTags, value.content, value.data, value.items]
                .find((candidate) => Array.isArray(candidate)) as unknown[] | undefined
            : undefined);

    if (!Array.isArray(array)) {
        return [];
    }

    return array
        .filter(isNoteTagLikeRecord)
        .map(toApiNoteTagSummary);
};

const normalizeNoteTagResponse = (value: unknown): ApiNoteTag => {
    if (isNoteTagLikeRecord(value)) {
        return toApiNoteTag(value);
    }

    if (isRecord(value)) {
        const candidates = [value.tag, value.noteTag, value.data, value.item];

        for (const candidate of candidates) {
            if (isNoteTagLikeRecord(candidate)) {
                return toApiNoteTag(candidate);
            }
        }
    }

    console.error('Unexpected note tag response shape. Raw payload:', value);
    throw new Error('Unexpected note tag response shape.');
};

const toBookCircleVisibility = (value: unknown): BookCircleVisibility => {
    return value === 'OWNER_ONLY' ? 'OWNER_ONLY' : 'ALL_MEMBERS';
};

const toBookCircleStatus = (value: unknown): BookCircleStatus => {
    return value === 'CLOSED' ? 'CLOSED' : 'ACTIVE';
};

const toBookCircleMemberRole = (value: unknown): BookCircleMemberRole => {
    return value === 'OWNER' ? 'OWNER' : 'MEMBER';
};

const toCircleMemberBookStatus = (value: unknown): CircleMemberBookStatus => {
    if (value === 'COMPLETE' || value === 'ARCHIVED' || value === 'DELETED') {
        return value;
    }

    return 'ACTIVE';
};

const toBookCircleBase = (value: Record<string, unknown>): BookCircleCreateResponseDTO => {
    return {
        id: toFiniteNumber(value.id) ?? 0,
        inviteCode: typeof value.inviteCode === 'string' ? value.inviteCode.toUpperCase() : '',
        bookTitle: typeof value.bookTitle === 'string' ? value.bookTitle : '',
        bookAuthor: typeof value.bookAuthor === 'string' ? value.bookAuthor : '',
        totalPages: Math.max(0, toFiniteNumber(value.totalPages) ?? 0),
        memberCap: Math.max(0, toFiniteNumber(value.memberCap) ?? 0),
        visibility: toBookCircleVisibility(value.visibility),
        status: toBookCircleStatus(value.status),
        createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
        newlyUnlockedAchievements: toAchievementArray(value.newlyUnlockedAchievements),
    };
};

const toBookCircleMemberSummary = (value: unknown): BookCircleMemberSummaryDTO | null => {
    if (!isRecord(value)) {
        return null;
    }

    const userId = toFiniteNumber(value.userId);

    if (userId == null) {
        return null;
    }

    return {
        userId,
        userNickname: typeof value.userNickname === 'string' ? value.userNickname : null,
        selectedPortrait: toPortrait(value.selectedPortrait),
        role: toBookCircleMemberRole(value.role),
        readPages: value.readPages == null ? null : (toFiniteNumber(value.readPages) ?? null),
        totalPages: value.totalPages == null ? null : (toFiniteNumber(value.totalPages) ?? null),
        progressPercentage: value.progressPercentage == null ? null : (toFiniteNumber(value.progressPercentage) ?? null),
        joinedAt: typeof value.joinedAt === 'string' ? value.joinedAt : '',
    };
};

const toCircleMemberSession = (value: unknown): CircleMemberSessionDTO | null => {
    if (!isRecord(value)) {
        return null;
    }

    const sessionId = toFiniteNumber(value.sessionId);

    if (sessionId == null) {
        return null;
    }

    return {
        sessionId,
        sessionDate: typeof value.sessionDate === 'string' ? value.sessionDate : '',
        completedAt: typeof value.completedAt === 'string' && value.completedAt.trim()
            ? value.completedAt
            : null,
        durationSeconds: Math.max(0, toFiniteNumber(value.durationSeconds) ?? 0),
        startPage: Math.max(0, toFiniteNumber(value.startPage) ?? 0),
        endPage: value.endPage == null ? null : (toFiniteNumber(value.endPage) ?? null),
        pagesRead: Math.max(0, toFiniteNumber(value.pagesRead) ?? 0),
        status: value.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
        reflection: typeof value.reflection === 'string' && value.reflection.trim()
            ? value.reflection
            : null,
    };
};

const toCircleMemberNote = (value: unknown): CircleMemberNoteDTO | null => {
    if (!isRecord(value)) {
        return null;
    }

    const noteId = toFiniteNumber(value.noteId);

    if (noteId == null) {
        return null;
    }

    const tags = Array.isArray(value.tags)
        ? value.tags
            .filter(isNoteTagLikeRecord)
            .map(toApiNoteTag)
        : [];

    return {
        noteId,
        quotedText: typeof value.quotedText === 'string' ? value.quotedText : '',
        pageNumber: Math.max(1, toFiniteNumber(value.pageNumber) ?? 1),
        chapterLabel: typeof value.chapterLabel === 'string' && value.chapterLabel.trim()
            ? value.chapterLabel
            : null,
        createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
        sourceSessionId: value.sourceSessionId == null ? null : (toFiniteNumber(value.sourceSessionId) ?? null),
        tags,
    };
};

const normalizeBookCircleCreateResponse = (value: unknown): BookCircleCreateResponseDTO => {
    if (!isRecord(value)) {
        console.error('Unexpected book circle create response shape. Raw payload:', value);
        throw new Error('Unexpected book circle create response shape.');
    }

    return toBookCircleBase(value);
};

const normalizeBookCircleReadResponse = (value: unknown): BookCircleReadResponseDTO => {
    if (!isRecord(value)) {
        console.error('Unexpected book circle response shape. Raw payload:', value);
        throw new Error('Unexpected book circle response shape.');
    }

    const members = Array.isArray(value.members)
        ? value.members
            .map(toBookCircleMemberSummary)
            .filter((member): member is BookCircleMemberSummaryDTO => member !== null)
        : [];

    return {
        ...toBookCircleBase(value),
        currentMemberCount: Math.max(0, toFiniteNumber(value.currentMemberCount) ?? members.length),
        ownerNickname: typeof value.ownerNickname === 'string' ? value.ownerNickname : null,
        callerIsOwner: value.callerIsOwner === true,
        nextMeetingDate: typeof value.nextMeetingDate === 'string' && value.nextMeetingDate.trim()
            ? value.nextMeetingDate
            : null,
        meetingChapterLabel: typeof value.meetingChapterLabel === 'string' && value.meetingChapterLabel.trim()
            ? value.meetingChapterLabel
            : null,
        meetingPageStart: value.meetingPageStart == null ? null : (toFiniteNumber(value.meetingPageStart) ?? null),
        meetingPageEnd: value.meetingPageEnd == null ? null : (toFiniteNumber(value.meetingPageEnd) ?? null),
        members,
    };
};

const toCircleChatMessage = (value: unknown): CircleChatMessageDTO | null => {
    if (!isRecord(value)) {
        return null;
    }

    const id = toFiniteNumber(value.id);

    if (id == null) {
        return null;
    }

    return {
        id,
        circleId: toFiniteNumber(value.circleId) ?? 0,
        senderUserId: toFiniteNumber(value.senderUserId) ?? 0,
        senderNickname: typeof value.senderNickname === 'string' ? value.senderNickname : null,
        content: typeof value.content === 'string' ? value.content : null,
        deleted: value.deleted === true,
        createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
        deletedAt: typeof value.deletedAt === 'string' && value.deletedAt.trim()
            ? value.deletedAt
            : null,
    };
};

const toCircleChatPresenceMember = (value: unknown): CircleChatPresenceMemberDTO | null => {
    if (!isRecord(value)) {
        return null;
    }

    const userId = toFiniteNumber(value.userId);

    if (userId == null) {
        return null;
    }

    return {
        userId,
        userNickname: typeof value.userNickname === 'string' ? value.userNickname : null,
        selectedPortrait: toPortrait(value.selectedPortrait),
    };
};

const toCircleChatEventType = (value: unknown): CircleChatEventType => {
    switch (value) {
        case 'MESSAGE_CREATED':
        case 'MESSAGE_DELETED':
        case 'PRESENCE_UPDATED':
        case 'CHAT_CLOSED':
        case 'CHAT_ACCESS_REVOKED':
            return value;
        default:
            return 'MESSAGE_CREATED';
    }
};

const compareCircleChatMessages = (left: CircleChatMessageDTO, right: CircleChatMessageDTO) => {
    const createdAtComparison = left.createdAt.localeCompare(right.createdAt);

    if (createdAtComparison !== 0) {
        return createdAtComparison;
    }

    return left.id - right.id;
};

const normalizeBookCirclesResponse = (value: unknown): BookCircleReadResponseDTO[] => {
    if (Array.isArray(value)) {
        return value
            .filter(isRecord)
            .map(normalizeBookCircleReadResponse);
    }

    if (!isRecord(value)) {
        return [];
    }

    const collections = [value.bookCircles, value.circles, value.content, value.data, value.items];

    for (const collection of collections) {
        if (Array.isArray(collection)) {
            return collection
                .filter(isRecord)
                .map(normalizeBookCircleReadResponse);
        }
    }

    return [];
};

const normalizeCircleMemberDetailResponse = (value: unknown): CircleMemberDetailResponseDTO => {
    if (!isRecord(value)) {
        console.error('Unexpected circle member detail response shape. Raw payload:', value);
        throw new Error('Unexpected circle member detail response shape.');
    }

    const sessions = Array.isArray(value.sessions)
        ? value.sessions
            .map(toCircleMemberSession)
            .filter((session): session is CircleMemberSessionDTO => session !== null)
        : [];
    const notes = Array.isArray(value.notes)
        ? value.notes
            .map(toCircleMemberNote)
            .filter((note): note is CircleMemberNoteDTO => note !== null)
        : [];

    return {
        circleId: toFiniteNumber(value.circleId) ?? 0,
        userId: toFiniteNumber(value.userId) ?? 0,
        userNickname: typeof value.userNickname === 'string' ? value.userNickname : null,
        selectedPortrait: toPortrait(value.selectedPortrait),
        role: toBookCircleMemberRole(value.role),
        joinedAt: typeof value.joinedAt === 'string' ? value.joinedAt : '',
        readPages: Math.max(0, toFiniteNumber(value.readPages) ?? 0),
        totalPages: Math.max(0, toFiniteNumber(value.totalPages) ?? 0),
        progressPercentage: Math.max(0, toFiniteNumber(value.progressPercentage) ?? 0),
        bookId: toFiniteNumber(value.bookId) ?? 0,
        bookTitle: typeof value.bookTitle === 'string' ? value.bookTitle : '',
        bookAuthor: typeof value.bookAuthor === 'string' ? value.bookAuthor : '',
        bookStatus: toCircleMemberBookStatus(value.bookStatus),
        sessions,
        notes,
    };
};

const normalizeCircleChatHistoryResponse = (value: unknown): CircleChatHistoryResponseDTO => {
    if (!isRecord(value)) {
        console.error('Unexpected circle chat history response shape. Raw payload:', value);
        throw new Error('Unexpected circle chat history response shape.');
    }

    const messages = Array.isArray(value.messages)
        ? value.messages
            .map(toCircleChatMessage)
            .filter((message): message is CircleChatMessageDTO => message !== null)
            .sort(compareCircleChatMessages)
        : [];

    return {
        messages,
        hasMore: value.hasMore === true,
        nextBeforeMessageId: value.nextBeforeMessageId == null
            ? null
            : (toFiniteNumber(value.nextBeforeMessageId) ?? null),
    };
};

const normalizeCircleChatEvent = (value: unknown): CircleChatEventDTO => {
    if (!isRecord(value)) {
        console.error('Unexpected circle chat event payload. Raw payload:', value);
        throw new Error('Unexpected circle chat event payload.');
    }

    const onlineMembers = Array.isArray(value.onlineMembers)
        ? value.onlineMembers
            .map(toCircleChatPresenceMember)
            .filter((member): member is CircleChatPresenceMemberDTO => member !== null)
        : null;

    return {
        circleId: toFiniteNumber(value.circleId) ?? 0,
        type: toCircleChatEventType(value.type),
        message: toCircleChatMessage(value.message),
        onlineMembers,
        reason: typeof value.reason === 'string' && value.reason.trim()
            ? value.reason
            : null,
    };
};

const normalizeCircleChatSocketError = (value: unknown): CircleChatSocketErrorDTO => {
    if (!isRecord(value)) {
        console.error('Unexpected circle chat socket error payload. Raw payload:', value);
        throw new Error('Unexpected circle chat socket error payload.');
    }

    return {
        message: normalizeErrorMessage(value, 'Something went wrong in circle chat.'),
        status: toFiniteNumber(value.status) ?? 500,
    };
};

const getFirstErrorString = (value: unknown): string | null => {
    if (typeof value === 'string') {
        const trimmedValue = value.trim();
        return trimmedValue ? trimmedValue : null;
    }

    if (Array.isArray(value)) {
        for (const entry of value) {
            const nextError = getFirstErrorString(entry);

            if (nextError) {
                return nextError;
            }
        }

        return null;
    }

    if (!isRecord(value)) {
        return null;
    }

    const preferredKeys = ['message', 'defaultMessage', 'error', 'reason', 'detail'];

    for (const key of preferredKeys) {
        const nextError = getFirstErrorString(value[key]);

        if (nextError) {
            return nextError;
        }
    }

    for (const nestedValue of Object.values(value)) {
        const nextError = getFirstErrorString(nestedValue);

        if (nextError) {
            return nextError;
        }
    }

    return null;
};

const NOTE_FIELD_NAMES = ['quotedText', 'pageNumber', 'chapterLabel', 'tagIds'] as const satisfies readonly NoteFieldName[];
const NOTE_TAG_FIELD_NAMES = ['name', 'colorHex'] as const satisfies readonly NoteTagFieldName[];
const NOTE_TAG_LIMIT_MESSAGE = 'You can add up to 4 tags per note.';
const NOTE_TAG_LIMIT_BACKEND_MESSAGE = 'a note can have at most 4 tags';

const extractFieldErrors = <FieldName extends string>(
    payload: unknown,
    allowedFields: readonly FieldName[],
): Partial<Record<FieldName, string>> => {
    const fieldErrors: Partial<Record<FieldName, string>> = {};
    const allowedFieldSet = new Set<string>(allowedFields);

    const setFieldError = (fieldName: FieldName, message: string | null) => {
        if (!message || fieldErrors[fieldName]) {
            return;
        }

        fieldErrors[fieldName] = message;
    };

    const visitRecord = (value: Record<string, unknown>) => {
        for (const [key, nestedValue] of Object.entries(value)) {
            if (allowedFieldSet.has(key)) {
                setFieldError(key as FieldName, getFirstErrorString(nestedValue));
            }
        }
    };

    const visitArray = (value: unknown[]) => {
        value.forEach((entry) => {
            if (!isRecord(entry)) {
                return;
            }

            const rawFieldName = typeof entry.field === 'string'
                ? entry.field
                : typeof entry.property === 'string'
                    ? entry.property
                    : typeof entry.path === 'string'
                        ? entry.path
                        : null;

            if (!rawFieldName) {
                return;
            }

            const normalizedFieldName = rawFieldName.split('.').at(-1) ?? rawFieldName;

            if (!allowedFieldSet.has(normalizedFieldName)) {
                return;
            }

            setFieldError(normalizedFieldName as FieldName, getFirstErrorString(entry));
        });
    };

    if (!isRecord(payload)) {
        return fieldErrors;
    }

    const errorContainers = [payload.errors, payload.fieldErrors, payload.violations];

    errorContainers.forEach((container) => {
        if (Array.isArray(container)) {
            visitArray(container);
            return;
        }

        if (isRecord(container)) {
            visitRecord(container);
        }
    });

    return fieldErrors;
};

const normalizeErrorMessage = (payload: unknown, fallbackMessage: string) => {
    if (!isRecord(payload)) {
        return fallbackMessage;
    }

    const message = getFirstErrorString(payload.message);

    if (message) {
        return message;
    }

    const error = getFirstErrorString(payload.error);

    if (error) {
        return error;
    }

    const structuredErrors = getFirstErrorString(payload.errors);

    if (structuredErrors) {
        return structuredErrors;
    }

    return fallbackMessage;
};

const inferNoteFieldFromMessage = (message: string): NoteFieldName | null => {
    const normalizedMessage = message.toLowerCase();

    if (normalizedMessage.includes(NOTE_TAG_LIMIT_BACKEND_MESSAGE) || normalizedMessage.includes('tag')) {
        return 'tagIds';
    }

    if (normalizedMessage.includes('page')) {
        return 'pageNumber';
    }

    if (normalizedMessage.includes('quote')) {
        return 'quotedText';
    }

    if (normalizedMessage.includes('chapter')) {
        return 'chapterLabel';
    }

    return null;
};

const normalizeNoteValidationMessage = (message: string) => {
    return message.toLowerCase().includes(NOTE_TAG_LIMIT_BACKEND_MESSAGE)
        ? NOTE_TAG_LIMIT_MESSAGE
        : message;
};

const toNoteValidationError = (
    payload: unknown,
    fallbackMessage: string,
    status: number,
) => {
    const message = normalizeNoteValidationMessage(normalizeErrorMessage(payload, fallbackMessage));
    const fieldErrors = extractFieldErrors(payload, NOTE_FIELD_NAMES);

    (Object.keys(fieldErrors) as NoteFieldName[]).forEach((fieldName) => {
        const fieldMessage = fieldErrors[fieldName];

        if (fieldMessage) {
            fieldErrors[fieldName] = normalizeNoteValidationMessage(fieldMessage);
        }
    });

    if (Object.keys(fieldErrors).length === 0) {
        const inferredField = inferNoteFieldFromMessage(message);

        if (inferredField) {
            fieldErrors[inferredField] = message;
        }
    }

    return new ApiValidationError<NoteFieldName>(message, {
        status,
        fieldErrors,
    });
};

const toNoteTagValidationError = (
    payload: unknown,
    fallbackMessage: string,
    status: number,
) => {
    const message = normalizeErrorMessage(payload, fallbackMessage);
    const fieldErrors = extractFieldErrors(payload, NOTE_TAG_FIELD_NAMES);
    const normalizedMessage = message.toLowerCase();

    if (Object.keys(fieldErrors).length === 0) {
        if (normalizedMessage.includes('color')) {
            fieldErrors.colorHex = message;
        } else if (
            normalizedMessage.includes('name')
            || normalizedMessage.includes('duplicate')
            || normalizedMessage.includes('already exists')
        ) {
            fieldErrors.name = message;
        }
    }

    return new ApiValidationError<NoteTagFieldName>(message, {
        status,
        fieldErrors,
    });
};

const toApiResponseError = (
    payload: unknown,
    fallbackMessage: string,
    status: number,
) => {
    return new ApiResponseError(normalizeErrorMessage(payload, fallbackMessage), {
        status,
        payload,
    });
};

type BookCircleCreateFieldName =
    | 'existingBookId'
    | 'bookTitle'
    | 'bookAuthor'
    | 'totalPages'
    | 'memberCap'
    | 'visibility';

const BOOK_CIRCLE_CREATE_FIELD_NAMES = [
    'existingBookId',
    'bookTitle',
    'bookAuthor',
    'totalPages',
    'memberCap',
    'visibility',
] as const satisfies readonly BookCircleCreateFieldName[];

type BookCircleNextMeetingFieldName =
    | 'meetingDate'
    | 'chapterLabel'
    | 'pageStart'
    | 'pageEnd';

const BOOK_CIRCLE_NEXT_MEETING_FIELD_NAMES = [
    'meetingDate',
    'chapterLabel',
    'pageStart',
    'pageEnd',
] as const satisfies readonly BookCircleNextMeetingFieldName[];

const inferBookCircleNextMeetingFieldFromMessage = (
    message: string,
): BookCircleNextMeetingFieldName | null => {
    const normalizedMessage = message.toLowerCase();

    if (
        normalizedMessage.includes('meeting date')
        || normalizedMessage.includes('date/time')
        || normalizedMessage.includes('future')
    ) {
        return 'meetingDate';
    }

    if (normalizedMessage.includes('chapter')) {
        return 'chapterLabel';
    }

    if (
        normalizedMessage.includes('page start')
        || normalizedMessage.includes('start page')
        || normalizedMessage.includes('pagestart')
    ) {
        return 'pageStart';
    }

    if (
        normalizedMessage.includes('page end')
        || normalizedMessage.includes('end page')
        || normalizedMessage.includes('page range')
        || normalizedMessage.includes('pageend')
        || normalizedMessage.includes('totalpages')
    ) {
        return 'pageEnd';
    }

    return null;
};

const toBookCircleNextMeetingValidationError = (
    payload: unknown,
    fallbackMessage: string,
    status: number,
) => {
    const message = normalizeErrorMessage(payload, fallbackMessage);
    const fieldErrors = extractFieldErrors(payload, BOOK_CIRCLE_NEXT_MEETING_FIELD_NAMES);

    if (Object.keys(fieldErrors).length === 0) {
        const inferredField = inferBookCircleNextMeetingFieldFromMessage(message);

        if (inferredField) {
            fieldErrors[inferredField] = message;
        }
    }

    return new ApiValidationError<BookCircleNextMeetingFieldName>(message, {
        status,
        fieldErrors,
    });
};

const readErrorPayload = async (res: Response) => {
    try {
        return await res.json();
    } catch {
        return null;
    }
};

const getErrorMessage = async (res: Response, fallbackMessage: string) => {
    const payload = await readErrorPayload(res);
    return normalizeErrorMessage(payload, fallbackMessage);
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

export const getLibraryItems = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/library/items`, {
            headers: await buildAuthHeaders(),
        });
        if (res.status === 204) {
            return [];
        }
        if (res.status === 404) {
            const fallbackBooks = await getBooks();
            return fallbackBooks.map(toBookLibraryItem);
        }
        if (!res.ok) {
            throw toApiResponseError(await readErrorPayload(res), 'Could not load library items.', res.status);
        }
        const data = await res.json();
        return normalizeLibraryItemsResponse(data);
    } catch (error) {
        console.error('Error fetching library items:', error);
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

export const getWordLookups = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/word-lookups`, {
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to fetch looked-up words'));
        }
        const data = await res.json();
        return normalizeWordLookupsResponse(data);
    } catch (error) {
        console.error('Error fetching word lookups:', error);
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

export const getMyWallet = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/wallet/me`, {
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            throw toApiResponseError(await readErrorPayload(res), 'Could not load your wallet.', res.status);
        }

        const data = await res.json();
        return toWallet(data);
    } catch (error) {
        console.error('Error fetching wallet:', error);
        throw error;
    }
};

export const purchaseMyStreakFreeze = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/streak-freezes/me/purchase`, {
            method: 'POST',
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            throw toApiResponseError(
                await readErrorPayload(res),
                'Could not buy a streak freeze.',
                res.status,
            );
        }

        const data = await res.json();
        return toWallet(data);
    } catch (error) {
        console.error('Error purchasing streak freeze:', error);
        throw error;
    }
};

export const getMyStore = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/store/me`, {
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            throw toApiResponseError(await readErrorPayload(res), 'Could not load the store.', res.status);
        }

        const data = await res.json();
        return normalizeStoreResponse(data);
    } catch (error) {
        console.error('Error fetching store:', error);
        throw error;
    }
};

export const purchaseStoreItem = async (itemCode: string) => {
    try {
        const normalizedItemCode = normalizeLegacyThemeCode(itemCode) ?? itemCode;
        const res = await fetch(`${API_BASE_URL}/store/items/${encodeURIComponent(normalizedItemCode)}/purchase`, {
            method: 'POST',
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            throw toApiResponseError(await readErrorPayload(res), 'Could not buy this store item.', res.status);
        }

        const data = await res.json();
        return normalizeStorePurchaseResponse(data);
    } catch (error) {
        console.error('Error purchasing store item:', error);
        throw error;
    }
};

export const getMyThemes = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/themes/me`, {
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            throw toApiResponseError(await readErrorPayload(res), 'Could not load your themes.', res.status);
        }

        const data = await res.json();
        return normalizeThemesResponse(data);
    } catch (error) {
        console.error('Error fetching themes:', error);
        throw error;
    }
};

export const selectMyTheme = async (themeCode: string) => {
    try {
        const normalizedThemeCode = normalizeLegacyThemeCode(themeCode) ?? themeCode;
        const res = await fetch(`${API_BASE_URL}/themes/me/selected`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify({ themeCode: normalizedThemeCode }),
        });

        if (!res.ok) {
            throw toApiResponseError(await readErrorPayload(res), 'Could not select this theme.', res.status);
        }

        const data = await res.json();
        const theme = toTheme(data);

        if (!theme) {
            throw new Error('Unexpected selected theme response shape.');
        }

        return theme;
    } catch (error) {
        console.error('Error selecting theme:', error);
        throw error;
    }
};

export const getStreakLeaderboard = async (limit: LeaderboardLimit = 10) => {
    try {
        const res = await fetch(`${API_BASE_URL}/leaderboards/streaks?limit=${limit}`, {
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            throw toApiResponseError(
                await readErrorPayload(res),
                'Could not load the streak leaderboard.',
                res.status,
            );
        }

        const data = await res.json();
        return normalizeStreakLeaderboardResponse(data, limit);
    } catch (error) {
        console.error('Error fetching streak leaderboard:', error);
        throw error;
    }
};

export const getMyAchievements = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/achievements/me`, {
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            throw toApiResponseError(await readErrorPayload(res), 'Could not load your achievements.', res.status);
        }

        const data = await res.json();
        return normalizeAchievementsResponse(data);
    } catch (error) {
        console.error('Error fetching achievements:', error);
        throw error;
    }
};

export const getMyPortraits = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/portraits/me`, {
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            throw toApiResponseError(await readErrorPayload(res), 'Could not load your portraits.', res.status);
        }

        const data = await res.json();
        return normalizePortraitsResponse(data);
    } catch (error) {
        console.error('Error fetching portraits:', error);
        throw error;
    }
};

export const selectPortrait = async (portraitCode: string) => {
    try {
        const res = await fetch(`${API_BASE_URL}/portraits/me/selected`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify({ portraitCode }),
        });

        if (!res.ok) {
            const errorPayload = await readErrorPayload(res);

            if (res.status === 400) {
                throw new ApiResponseError('That portrait is still locked.', {
                    status: 400,
                    payload: errorPayload,
                });
            }

            throw toApiResponseError(errorPayload, 'Could not update your portrait.', res.status);
        }

        const data = await res.json();
        const portrait = toPortrait(data);

        if (!portrait) {
            throw new Error('Unexpected portrait response shape.');
        }

        return portrait;
    } catch (error) {
        console.error('Error selecting portrait:', error);
        throw error;
    }
};

type NicknameFieldName = 'nickname';
const NICKNAME_FIELD_NAMES = ['nickname'] as const satisfies readonly NicknameFieldName[];

export const updateNickname = async (nickname: string) => {
    try {
        const res = await fetch(`${API_BASE_URL}/profile/nickname`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify({ nickname }),
        });

        if (!res.ok) {
            const errorPayload = await readErrorPayload(res);

            if (res.status === 409) {
                const message = 'That nickname is taken — pick another.';
                throw new ApiValidationError<NicknameFieldName>(message, {
                    status: 409,
                    fieldErrors: { nickname: message },
                });
            }

            if (res.status === 400) {
                const fieldErrors = extractFieldErrors(errorPayload, NICKNAME_FIELD_NAMES);
                const message = normalizeErrorMessage(errorPayload, 'Invalid nickname.');
                if (!fieldErrors.nickname) {
                    fieldErrors.nickname = message;
                }
                throw new ApiValidationError<NicknameFieldName>(message, {
                    status: 400,
                    fieldErrors,
                });
            }

            throw new Error(normalizeErrorMessage(errorPayload, 'Could not update nickname.'));
        }

        const data = await res.json();
        return normalizeProfileResponse(data);
    } catch (error) {
        console.error('Error updating nickname:', error);
        throw error;
    }
};

export const createBookCircle = async (payload: BookCircleCreateRequestDTO) => {
    try {
        const res = await fetch(`${API_BASE_URL}/book-circles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorPayload = await readErrorPayload(res);

            if (res.status === 400) {
                const fieldErrors = extractFieldErrors(errorPayload, BOOK_CIRCLE_CREATE_FIELD_NAMES);
                const message = normalizeErrorMessage(errorPayload, 'Could not create the circle.');

                if (Object.keys(fieldErrors).length > 0) {
                    throw new ApiValidationError<BookCircleCreateFieldName>(message, {
                        status: 400,
                        fieldErrors,
                    });
                }
            }

            throw toApiResponseError(errorPayload, 'Could not create the circle.', res.status);
        }

        const data = await res.json();
        return normalizeBookCircleCreateResponse(data);
    } catch (error) {
        console.error('Error creating book circle:', error);
        throw error;
    }
};

export const joinBookCircle = async (payload: JoinBookCircleRequestDTO) => {
    try {
        const res = await fetch(`${API_BASE_URL}/book-circles/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorPayload = await readErrorPayload(res);
            throw toApiResponseError(errorPayload, 'Could not join the circle.', res.status);
        }

        const data = await res.json();
        return normalizeBookCircleReadResponse(data);
    } catch (error) {
        console.error('Error joining book circle:', error);
        throw error;
    }
};

export const getMyBookCircles = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/book-circles/mine`, {
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            const errorPayload = await readErrorPayload(res);
            throw toApiResponseError(errorPayload, 'Could not fetch your circles.', res.status);
        }

        const data = await res.json();
        return normalizeBookCirclesResponse(data);
    } catch (error) {
        console.error('Error fetching my book circles:', error);
        throw error;
    }
};

export const getBookCircle = async (circleId: string | number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/book-circles/${circleId}`, {
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            const errorPayload = await readErrorPayload(res);
            throw toApiResponseError(errorPayload, 'Could not fetch the circle.', res.status);
        }

        const data = await res.json();
        return normalizeBookCircleReadResponse(data);
    } catch (error) {
        console.error('Error fetching book circle:', error);
        throw error;
    }
};

export const setBookCircleNextMeeting = async (
    circleId: string | number,
    payload: BookCircleNextMeetingRequestDTO,
) => {
    try {
        const res = await fetch(`${API_BASE_URL}/book-circles/${circleId}/next-meeting`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorPayload = await readErrorPayload(res);

            if (res.status === 400) {
                throw toBookCircleNextMeetingValidationError(
                    errorPayload,
                    'Could not save the next meeting.',
                    res.status,
                );
            }

            throw toApiResponseError(errorPayload, 'Could not save the next meeting.', res.status);
        }

        const data = await res.json();
        return normalizeBookCircleReadResponse(data);
    } catch (error) {
        console.error('Error saving next meeting:', error);
        throw error;
    }
};

export const clearBookCircleNextMeeting = async (circleId: string | number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/book-circles/${circleId}/next-meeting`, {
            method: 'DELETE',
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            const errorPayload = await readErrorPayload(res);
            throw toApiResponseError(errorPayload, 'Could not clear the next meeting.', res.status);
        }

        const data = await res.json();
        return normalizeBookCircleReadResponse(data);
    } catch (error) {
        console.error('Error clearing next meeting:', error);
        throw error;
    }
};

export const getCircleMemberDetails = async (
    circleId: string | number,
    userId: string | number,
) => {
    try {
        const res = await fetch(`${API_BASE_URL}/book-circles/${circleId}/members/${userId}/details`, {
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            const errorPayload = await readErrorPayload(res);
            throw toApiResponseError(errorPayload, 'Could not fetch member details.', res.status);
        }

        const data = await res.json();
        return normalizeCircleMemberDetailResponse(data);
    } catch (error) {
        console.error('Error fetching circle member details:', error);
        throw error;
    }
};

export const leaveBookCircle = async (circleId: string | number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/book-circles/${circleId}/members/me`, {
            method: 'DELETE',
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            const errorPayload = await readErrorPayload(res);
            throw toApiResponseError(errorPayload, 'Could not leave the circle.', res.status);
        }
    } catch (error) {
        console.error('Error leaving book circle:', error);
        throw error;
    }
};

export const removeBookCircleMember = async (
    circleId: string | number,
    userId: string | number,
) => {
    try {
        const res = await fetch(`${API_BASE_URL}/book-circles/${circleId}/members/${userId}`, {
            method: 'DELETE',
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            const errorPayload = await readErrorPayload(res);
            throw toApiResponseError(errorPayload, 'Could not remove that member.', res.status);
        }
    } catch (error) {
        console.error('Error removing circle member:', error);
        throw error;
    }
};

export const closeBookCircle = async (circleId: string | number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/book-circles/${circleId}`, {
            method: 'DELETE',
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            const errorPayload = await readErrorPayload(res);
            throw toApiResponseError(errorPayload, 'Could not close the circle.', res.status);
        }
    } catch (error) {
        console.error('Error closing book circle:', error);
        throw error;
    }
};

export const getBookCircleChatMessages = async (
    circleId: string | number,
    options: GetBookCircleChatMessagesOptions = {},
) => {
    try {
        const params = new URLSearchParams();

        if (options.beforeMessageId != null) {
            params.set('beforeMessageId', String(options.beforeMessageId));
        }

        if (typeof options.limit === 'number' && Number.isFinite(options.limit)) {
            params.set('limit', String(Math.max(1, Math.min(100, Math.floor(options.limit)))));
        }

        const query = params.toString();
        const res = await fetch(
            `${API_BASE_URL}/book-circles/${circleId}/chat/messages${query ? `?${query}` : ''}`,
            {
                headers: await buildAuthHeaders(),
            },
        );

        if (!res.ok) {
            const errorPayload = await readErrorPayload(res);
            throw toApiResponseError(errorPayload, 'Could not load circle chat.', res.status);
        }

        const data = await res.json();
        return normalizeCircleChatHistoryResponse(data);
    } catch (error) {
        console.error('Error loading circle chat messages:', error);
        throw error;
    }
};

export const deleteBookCircleChatMessage = async (
    circleId: string | number,
    messageId: string | number,
) => {
    try {
        const res = await fetch(`${API_BASE_URL}/book-circles/${circleId}/chat/messages/${messageId}`, {
            method: 'DELETE',
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            const errorPayload = await readErrorPayload(res);
            throw toApiResponseError(errorPayload, 'Could not delete the chat message.', res.status);
        }
    } catch (error) {
        console.error('Error deleting circle chat message:', error);
        throw error;
    }
};

export const parseCircleChatEventPayload = (payload: unknown): CircleChatEventDTO => {
    return normalizeCircleChatEvent(payload);
};

export const parseCircleChatSocketErrorPayload = (payload: unknown): CircleChatSocketErrorDTO => {
    return normalizeCircleChatSocketError(payload);
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

export const createCrosswordPuzzle = async (): Promise<CrosswordPuzzleResponse> => {
    try {
        const res = await fetch(`${API_BASE_URL}/challenges/crossword/puzzles`, {
            method: 'POST',
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) {
            throw toApiResponseError(
                await readErrorPayload(res),
                'Failed to create crossword puzzle',
                res.status,
            );
        }
        const data = await res.json();
        return normalizeCrosswordPuzzleResponse(data);
    } catch (error) {
        console.error('Error creating crossword puzzle:', error);
        throw error;
    }
};

export const getCrosswordPuzzle = async (
    puzzleId: string | number,
): Promise<CrosswordPuzzleResponse> => {
    try {
        const res = await fetch(`${API_BASE_URL}/challenges/crossword/puzzles/${puzzleId}`, {
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) {
            throw toApiResponseError(
                await readErrorPayload(res),
                'Failed to fetch crossword puzzle',
                res.status,
            );
        }
        const data = await res.json();
        return normalizeCrosswordPuzzleResponse(data);
    } catch (error) {
        console.error('Error fetching crossword puzzle:', error);
        throw error;
    }
};

export const submitCrosswordPuzzle = async (
    puzzleId: string | number,
    answers: Record<string, string>,
): Promise<CrosswordSubmitResponse> => {
    try {
        const res = await fetch(`${API_BASE_URL}/challenges/crossword/puzzles/${puzzleId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify({ answers }),
        });
        if (!res.ok) {
            throw toApiResponseError(
                await readErrorPayload(res),
                'Failed to submit crossword puzzle',
                res.status,
            );
        }
        const data = await res.json();
        return normalizeCrosswordSubmitResponse(data);
    } catch (error) {
        console.error('Error submitting crossword puzzle:', error);
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

export const fetchCoverCandidates = async (
    request: { title: string; author: string },
): Promise<CoverCandidateDTO[]> => {
    try {
        const res = await fetch(`${API_BASE_URL}/books/cover-candidates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify(request),
        });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to fetch cover candidates'));
        }
        const data = await res.json();

        if (!Array.isArray(data)) {
            return [];
        }

        return data
            .filter(isRecord)
            .map((entry): CoverCandidateDTO | null => {
                const url = typeof entry.coverImageUrl === 'string' ? entry.coverImageUrl.trim() : '';
                if (!url) {
                    return null;
                }
                return {
                    coverImageUrl: url,
                    coverSource: typeof entry.coverSource === 'string' ? entry.coverSource : null,
                    externalBookId: typeof entry.externalBookId === 'string' ? entry.externalBookId : null,
                    matchedTitle: typeof entry.matchedTitle === 'string' ? entry.matchedTitle : null,
                    matchedAuthor: typeof entry.matchedAuthor === 'string' ? entry.matchedAuthor : null,
                    confidence: toFiniteNumber(entry.confidence) ?? 0,
                };
            })
            .filter((candidate): candidate is CoverCandidateDTO => candidate !== null);
    } catch (error) {
        console.error('Error fetching cover candidates:', error);
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

const buildNotesQuery = (options: GetNotesOptions = {}) => {
    const tagIds = (options.tagIds ?? [])
        .filter((tagId) => Number.isFinite(tagId) && tagId > 0)
        .map((tagId) => Math.floor(tagId));

    if (tagIds.length === 0) {
        return '';
    }

    const params = new URLSearchParams();
    params.set('tagIds', tagIds.join(','));
    params.set('tagMatch', options.tagMatch === 'ALL' ? 'ALL' : 'ANY');
    return `?${params.toString()}`;
};

export const getNoteTags = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/note-tags`, {
            headers: await buildAuthHeaders(),
        });

        if (res.status === 204) {
            return [];
        }

        if (!res.ok) {
            throw toApiResponseError(await readErrorPayload(res), 'Could not load note tags.', res.status);
        }

        const data = await res.json();
        return normalizeNoteTagsResponse(data);
    } catch (error) {
        console.error('Error fetching note tags:', error);
        throw error;
    }
};

export const createNoteTag = async (payload: CreateNoteTagPayload) => {
    try {
        const res = await fetch(`${API_BASE_URL}/note-tags`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorPayload = await readErrorPayload(res);

            if (res.status === 400 || res.status === 409) {
                throw toNoteTagValidationError(errorPayload, 'Could not create tag.', res.status);
            }

            throw toApiResponseError(errorPayload, 'Could not create tag.', res.status);
        }

        const data = await res.json();
        return normalizeNoteTagResponse(data);
    } catch (error) {
        console.error('Error creating note tag:', error);
        throw error;
    }
};

export const updateNoteTag = async (
    tagId: number,
    payload: UpdateNoteTagPayload,
) => {
    try {
        const res = await fetch(`${API_BASE_URL}/note-tags/${tagId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorPayload = await readErrorPayload(res);

            if (res.status === 400 || res.status === 409) {
                throw toNoteTagValidationError(errorPayload, 'Could not update tag.', res.status);
            }

            throw toApiResponseError(errorPayload, 'Could not update tag.', res.status);
        }

        if (res.status === 204) {
            return null;
        }

        const data = await res.json();
        return normalizeNoteTagResponse(data);
    } catch (error) {
        console.error('Error updating note tag:', error);
        throw error;
    }
};

export const deleteNoteTag = async (tagId: number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/note-tags/${tagId}`, {
            method: 'DELETE',
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            throw toApiResponseError(await readErrorPayload(res), 'Could not delete tag.', res.status);
        }
    } catch (error) {
        console.error('Error deleting note tag:', error);
        throw error;
    }
};

export const getNotes = async (options: GetNotesOptions = {}) => {
    try {
        const res = await fetch(`${API_BASE_URL}/notes${buildNotesQuery(options)}`, {
            headers: await buildAuthHeaders(),
        });

        if (res.status === 204) {
            return [];
        }

        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to fetch notes'));
        }

        const data = await res.json();
        return normalizeNotesResponse(data);
    } catch (error) {
        console.error('Error fetching notes:', error);
        throw error;
    }
};

export const getNotesByBook = async (
    bookId: string | number,
    options: GetNotesOptions = {},
) => {
    try {
        const res = await fetch(`${API_BASE_URL}/notes/book/${bookId}${buildNotesQuery(options)}`, {
            headers: await buildAuthHeaders(),
        });

        if (res.status === 204) {
            return [];
        }

        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to fetch notes'));
        }

        const data = await res.json();
        return normalizeNotesResponse(data);
    } catch (error) {
        console.error('Error fetching notes by book:', error);
        throw error;
    }
};

export const createNote = async (payload: CreateNotePayload) => {
    try {
        const res = await fetch(`${API_BASE_URL}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorPayload = await readErrorPayload(res);

            if (res.status === 400) {
                throw toNoteValidationError(errorPayload, 'Failed to create note', res.status);
            }

            throw new Error(normalizeErrorMessage(errorPayload, 'Failed to create note'));
        }

        const data = await res.json();
        return normalizeNoteResponse(data);
    } catch (error) {
        console.error('Error creating note:', error);
        throw error;
    }
};

export const updateNote = async (noteId: number, payload: UpdateNotePayload) => {
    try {
        const res = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorPayload = await readErrorPayload(res);

            if (res.status === 400) {
                throw toNoteValidationError(errorPayload, 'Failed to update note', res.status);
            }

            if (res.status === 403) {
                throw new Error(normalizeErrorMessage(
                    errorPayload,
                    'You do not have permission to update this note.',
                ));
            }

            if (res.status === 404) {
                throw new Error(normalizeErrorMessage(
                    errorPayload,
                    'This note could not be found.',
                ));
            }

            throw new Error(normalizeErrorMessage(errorPayload, 'Failed to update note'));
        }

        const data = await res.json();
        return normalizeNoteResponse(data);
    } catch (error) {
        console.error('Error updating note:', error);
        throw error;
    }
};

export const deleteNote = async (noteId: number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
            method: 'DELETE',
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            if (res.status === 403) {
                throw new Error(await getErrorMessage(res, 'You do not have permission to delete this note.'));
            }

            if (res.status === 404) {
                throw new Error(await getErrorMessage(res, 'This note could not be found.'));
            }

            throw new Error(await getErrorMessage(res, 'Failed to delete note'));
        }
    } catch (error) {
        console.error('Error deleting note:', error);
        throw error;
    }
};


export const getDictionaryWord = async (lemma: string) => {
    try {
        const res = await fetch(`${API_ROOT_URL}/test/dictionary/${encodeURIComponent(lemma)}`, {
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to fetch dictionary word');
        const data: unknown = await res.json();

        if (!isRecord(data)) {
            throw new Error('Dictionary response was malformed.');
        }

        return {
            id: toFiniteNumber(data.id) ?? 0,
            lemma: typeof data.lemma === 'string' ? data.lemma : lemma,
            source: typeof data.source === 'string' ? data.source : null,
            definitions: isApiJsonValue(data.definitions) ? data.definitions : null,
            phonetics: isApiJsonValue(data.phonetics) ? data.phonetics : null,
        } satisfies ApiWord;
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


export const createWordLookup = async (
    sessionId: number,
    payload: WordLookupCreateRequestDTO,
) => {
    try {
        const res = await fetch(`${API_BASE_URL}/word-lookups/${sessionId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to look up word'));
        }
        const data: unknown = await res.json();
        return normalizeWordLookupCreateResponse(data);
    } catch (error) {
        console.error('Error creating word lookup:', error);
        throw error;
    }
};


export type ReadingListStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ReadingListBookSlotRequestDTO {
    title: string;
    author: string;
    note?: string | null;
    position: number;
}

export interface ReadingListCreateRequestDTO {
    title: string;
    description?: string | null;
    status?: ReadingListStatus;
    genres?: string[];
    books: ReadingListBookSlotRequestDTO[];
}

export interface ReadingListUpdateRequestDTO {
    title?: string;
    description?: string | null;
    status?: ReadingListStatus;
    genres?: string[] | null;
}

export interface ReadingListSummaryResponseDTO {
    id: number;
    title: string;
    description: string | null;
    ownerNickname: string | null;
    ownerUserId: number;
    status: ReadingListStatus;
    genres: string[];
    starCount: number;
    bookCount: number;
    callerIsOwner: boolean;
    hasStarred: boolean;
    isSubscribed: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ReadingListSlotResponseDTO {
    catalogBookId: number;
    position: number;
    title: string;
    author: string;
    note: string | null;
    inMyLibrary: boolean | null;
    completedByMe: boolean | null;
}

export interface ReadingListDetailResponseDTO {
    id: number;
    title: string;
    description: string | null;
    ownerNickname: string | null;
    ownerUserId: number;
    status: ReadingListStatus;
    genres: string[];
    starCount: number;
    callerIsOwner: boolean;
    hasStarred: boolean;
    isSubscribed: boolean;
    createdAt: string;
    updatedAt: string;
    slots: ReadingListSlotResponseDTO[];
}

export interface ReadingListSubscriptionResponseDTO {
    listId: number;
    listTitle: string;
    ownerNickname: string | null;
    subscribedAt: string;
    completedAt: string | null;
    slotsTotal: number;
    slotsCompleted: number;
}

export type ReadingListSort = 'POPULAR' | 'RECENT' | 'OLDEST' | 'TITLE_ASC';

export interface BrowseReadingListsOptions {
    q?: string;
    minStars?: number;
    page?: number;
    size?: number;
    sort?: ReadingListSort;
}

export type AdminAnalyticsRange = 'TODAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'LAST_30_DAYS' | 'ALL_TIME';

export interface AdminDashboardRangeDTO {
    key: AdminAnalyticsRange;
    startDate: string | null;
    endDate: string;
    timezone: string;
}

export interface AdminDashboardSummaryDTO {
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    totalPagesRead: number;
    completedBooks: number;
    completedSessions: number;
    totalMinutesRead: number;
    xpAwarded: number;
    readingListsCreated: number;
    readingListSubscriptions: number;
    readingListCompletions: number;
}

export interface AdminDashboardLifetimeDTO {
    totalUsers: number;
    totalBooks: number;
    completedBooks: number;
    totalPagesRead: number;
    completedSessions: number;
    totalXpAwarded: number;
}

export interface AdminDashboardDailyPointDTO {
    date: string;
    pagesRead: number;
    completedSessions: number;
    completedBooks: number;
    newUsers: number;
    activeUsers: number;
    xpAwarded: number;
}

export interface AdminDashboardTopUserDTO {
    userId: number;
    nickname: string | null;
    totalPagesRead: number;
    completedBooks: number;
    completedSessions: number;
    totalXpEarned: number;
}

export interface AdminDashboardTopBookDTO {
    title: string;
    author: string;
    completedCount: number;
    pagesRead: number;
}

export interface AdminDashboardResponseDTO {
    range: AdminDashboardRangeDTO;
    summary: AdminDashboardSummaryDTO;
    lifetime: AdminDashboardLifetimeDTO;
    dailySeries: AdminDashboardDailyPointDTO[];
    topUsers: AdminDashboardTopUserDTO[];
    topBooks: AdminDashboardTopBookDTO[];
}

const toReadingListStatus = (value: unknown): ReadingListStatus => {
    if (value === 'DRAFT' || value === 'ARCHIVED') {
        return value;
    }
    return 'PUBLISHED';
};

const toReadingListSummary = (value: unknown): ReadingListSummaryResponseDTO | null => {
    if (!isRecord(value)) {
        return null;
    }

    const id = toFiniteNumber(value.id);

    if (id == null) {
        return null;
    }

    return {
        id,
        title: typeof value.title === 'string' ? value.title : '',
        description: typeof value.description === 'string' ? value.description : null,
        ownerNickname: typeof value.ownerNickname === 'string' ? value.ownerNickname : null,
        ownerUserId: toFiniteNumber(value.ownerUserId) ?? 0,
        status: toReadingListStatus(value.status),
        genres: toStringArray(value.genres),
        starCount: Math.max(0, toFiniteNumber(value.starCount) ?? 0),
        bookCount: Math.max(0, toFiniteNumber(value.bookCount) ?? 0),
        callerIsOwner: value.callerIsOwner === true,
        hasStarred: value.hasStarred === true,
        isSubscribed: value.isSubscribed === true,
        createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
        updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : '',
    };
};

const toReadingListSlot = (value: unknown): ReadingListSlotResponseDTO | null => {
    if (!isRecord(value)) {
        return null;
    }

    const catalogBookId = toFiniteNumber(value.catalogBookId);
    const position = toFiniteNumber(value.position);

    if (catalogBookId == null || position == null) {
        return null;
    }

    const inMyLibrary = typeof value.inMyLibrary === 'boolean' ? value.inMyLibrary : null;
    const completedByMe = typeof value.completedByMe === 'boolean' ? value.completedByMe : null;

    return {
        catalogBookId,
        position,
        title: typeof value.title === 'string' ? value.title : '',
        author: typeof value.author === 'string' ? value.author : '',
        note: typeof value.note === 'string' && value.note.trim() ? value.note : null,
        inMyLibrary,
        completedByMe,
    };
};

const toReadingListDetail = (value: unknown): ReadingListDetailResponseDTO => {
    if (!isRecord(value)) {
        throw new Error('Unexpected reading list detail response shape.');
    }

    const slots = Array.isArray(value.slots)
        ? value.slots
            .map(toReadingListSlot)
            .filter((slot): slot is ReadingListSlotResponseDTO => slot !== null)
            .sort((a, b) => a.position - b.position)
        : [];

    return {
        id: toFiniteNumber(value.id) ?? 0,
        title: typeof value.title === 'string' ? value.title : '',
        description: typeof value.description === 'string' ? value.description : null,
        ownerNickname: typeof value.ownerNickname === 'string' ? value.ownerNickname : null,
        ownerUserId: toFiniteNumber(value.ownerUserId) ?? 0,
        status: toReadingListStatus(value.status),
        genres: toStringArray(value.genres),
        starCount: Math.max(0, toFiniteNumber(value.starCount) ?? 0),
        callerIsOwner: value.callerIsOwner === true,
        hasStarred: value.hasStarred === true,
        isSubscribed: value.isSubscribed === true,
        createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
        updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : '',
        slots,
    };
};

const toReadingListSubscription = (value: unknown): ReadingListSubscriptionResponseDTO | null => {
    if (!isRecord(value)) {
        return null;
    }

    const listId = toFiniteNumber(value.listId);

    if (listId == null) {
        return null;
    }

    return {
        listId,
        listTitle: typeof value.listTitle === 'string' ? value.listTitle : '',
        ownerNickname: typeof value.ownerNickname === 'string' ? value.ownerNickname : null,
        subscribedAt: typeof value.subscribedAt === 'string' ? value.subscribedAt : '',
        completedAt: typeof value.completedAt === 'string' && value.completedAt.trim()
            ? value.completedAt
            : null,
        slotsTotal: Math.max(0, toFiniteNumber(value.slotsTotal) ?? 0),
        slotsCompleted: Math.max(0, toFiniteNumber(value.slotsCompleted) ?? 0),
    };
};

const normalizeReadingListSummaries = (value: unknown): ReadingListSummaryResponseDTO[] => {
    const array = Array.isArray(value)
        ? value
        : (isRecord(value)
            ? [value.content, value.data, value.items, value.readingLists]
                .find((candidate) => Array.isArray(candidate)) as unknown[] | undefined
            : undefined);

    if (!Array.isArray(array)) {
        return [];
    }

    return array
        .map(toReadingListSummary)
        .filter((summary): summary is ReadingListSummaryResponseDTO => summary !== null);
};

const normalizeReadingListSubscriptions = (value: unknown): ReadingListSubscriptionResponseDTO[] => {
    const array = Array.isArray(value)
        ? value
        : (isRecord(value)
            ? [value.content, value.data, value.items, value.subscriptions]
                .find((candidate) => Array.isArray(candidate)) as unknown[] | undefined
            : undefined);

    if (!Array.isArray(array)) {
        return [];
    }

    return array
        .map(toReadingListSubscription)
        .filter((sub): sub is ReadingListSubscriptionResponseDTO => sub !== null);
};

const toAdminAnalyticsRange = (value: unknown): AdminAnalyticsRange => {
    if (
        value === 'TODAY'
        || value === 'LAST_7_DAYS'
        || value === 'THIS_MONTH'
        || value === 'LAST_30_DAYS'
        || value === 'ALL_TIME'
    ) {
        return value;
    }

    return 'THIS_MONTH';
};

const toAdminRange = (value: unknown): AdminDashboardRangeDTO => {
    const record = isRecord(value) ? value : {};

    return {
        key: toAdminAnalyticsRange(record.key),
        startDate: typeof record.startDate === 'string' ? record.startDate : null,
        endDate: typeof record.endDate === 'string' ? record.endDate : '',
        timezone: typeof record.timezone === 'string' ? record.timezone : 'Europe/Stockholm',
    };
};

const toAdminSummary = (value: unknown): AdminDashboardSummaryDTO => {
    const record = isRecord(value) ? value : {};

    return {
        totalUsers: Math.max(0, toFiniteNumber(record.totalUsers) ?? 0),
        newUsers: Math.max(0, toFiniteNumber(record.newUsers) ?? 0),
        activeUsers: Math.max(0, toFiniteNumber(record.activeUsers) ?? 0),
        totalPagesRead: Math.max(0, toFiniteNumber(record.totalPagesRead) ?? 0),
        completedBooks: Math.max(0, toFiniteNumber(record.completedBooks) ?? 0),
        completedSessions: Math.max(0, toFiniteNumber(record.completedSessions) ?? 0),
        totalMinutesRead: Math.max(0, toFiniteNumber(record.totalMinutesRead) ?? 0),
        xpAwarded: Math.max(0, toFiniteNumber(record.xpAwarded) ?? 0),
        readingListsCreated: Math.max(0, toFiniteNumber(record.readingListsCreated) ?? 0),
        readingListSubscriptions: Math.max(0, toFiniteNumber(record.readingListSubscriptions) ?? 0),
        readingListCompletions: Math.max(0, toFiniteNumber(record.readingListCompletions) ?? 0),
    };
};

const toAdminLifetime = (value: unknown): AdminDashboardLifetimeDTO => {
    const record = isRecord(value) ? value : {};

    return {
        totalUsers: Math.max(0, toFiniteNumber(record.totalUsers) ?? 0),
        totalBooks: Math.max(0, toFiniteNumber(record.totalBooks) ?? 0),
        completedBooks: Math.max(0, toFiniteNumber(record.completedBooks) ?? 0),
        totalPagesRead: Math.max(0, toFiniteNumber(record.totalPagesRead) ?? 0),
        completedSessions: Math.max(0, toFiniteNumber(record.completedSessions) ?? 0),
        totalXpAwarded: Math.max(0, toFiniteNumber(record.totalXpAwarded) ?? 0),
    };
};

const toAdminDailyPoint = (value: unknown): AdminDashboardDailyPointDTO | null => {
    if (!isRecord(value) || typeof value.date !== 'string') {
        return null;
    }

    return {
        date: value.date,
        pagesRead: Math.max(0, toFiniteNumber(value.pagesRead) ?? 0),
        completedSessions: Math.max(0, toFiniteNumber(value.completedSessions) ?? 0),
        completedBooks: Math.max(0, toFiniteNumber(value.completedBooks) ?? 0),
        newUsers: Math.max(0, toFiniteNumber(value.newUsers) ?? 0),
        activeUsers: Math.max(0, toFiniteNumber(value.activeUsers) ?? 0),
        xpAwarded: Math.max(0, toFiniteNumber(value.xpAwarded) ?? 0),
    };
};

const toAdminTopUser = (value: unknown): AdminDashboardTopUserDTO | null => {
    if (!isRecord(value)) {
        return null;
    }

    const userId = toFiniteNumber(value.userId);

    if (userId == null) {
        return null;
    }

    return {
        userId,
        nickname: typeof value.nickname === 'string' ? value.nickname : null,
        totalPagesRead: Math.max(0, toFiniteNumber(value.totalPagesRead) ?? 0),
        completedBooks: Math.max(0, toFiniteNumber(value.completedBooks) ?? 0),
        completedSessions: Math.max(0, toFiniteNumber(value.completedSessions) ?? 0),
        totalXpEarned: Math.max(0, toFiniteNumber(value.totalXpEarned) ?? 0),
    };
};

const toAdminTopBook = (value: unknown): AdminDashboardTopBookDTO | null => {
    if (!isRecord(value)) {
        return null;
    }

    return {
        title: typeof value.title === 'string' ? value.title : 'Untitled',
        author: typeof value.author === 'string' ? value.author : 'Unknown author',
        completedCount: Math.max(0, toFiniteNumber(value.completedCount) ?? 0),
        pagesRead: Math.max(0, toFiniteNumber(value.pagesRead) ?? 0),
    };
};

const toAdminDashboard = (value: unknown): AdminDashboardResponseDTO => {
    if (!isRecord(value)) {
        throw new Error('Unexpected admin dashboard response shape.');
    }

    return {
        range: toAdminRange(value.range),
        summary: toAdminSummary(value.summary),
        lifetime: toAdminLifetime(value.lifetime),
        dailySeries: Array.isArray(value.dailySeries)
            ? value.dailySeries
                .map(toAdminDailyPoint)
                .filter((point): point is AdminDashboardDailyPointDTO => point !== null)
            : [],
        topUsers: Array.isArray(value.topUsers)
            ? value.topUsers
                .map(toAdminTopUser)
                .filter((user): user is AdminDashboardTopUserDTO => user !== null)
            : [],
        topBooks: Array.isArray(value.topBooks)
            ? value.topBooks
                .map(toAdminTopBook)
                .filter((book): book is AdminDashboardTopBookDTO => book !== null)
            : [],
    };
};

type ReadingListCreateFieldName = 'title' | 'description' | 'status' | 'genres' | 'books';
const READING_LIST_CREATE_FIELD_NAMES = [
    'title',
    'description',
    'status',
    'genres',
    'books',
] as const satisfies readonly ReadingListCreateFieldName[];

type ReadingListUpdateFieldName = 'title' | 'description' | 'status' | 'genres';
const READING_LIST_UPDATE_FIELD_NAMES = [
    'title',
    'description',
    'status',
    'genres',
] as const satisfies readonly ReadingListUpdateFieldName[];

export const createReadingList = async (payload: ReadingListCreateRequestDTO) => {
    try {
        const res = await fetch(`${API_BASE_URL}/reading-lists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorPayload = await readErrorPayload(res);

            if (res.status === 400) {
                const fieldErrors = extractFieldErrors(errorPayload, READING_LIST_CREATE_FIELD_NAMES);
                const message = normalizeErrorMessage(errorPayload, 'Could not create the reading list.');

                throw new ApiValidationError<ReadingListCreateFieldName>(message, {
                    status: 400,
                    fieldErrors,
                });
            }

            throw toApiResponseError(errorPayload, 'Could not create the reading list.', res.status);
        }

        const data = await res.json();
        return toReadingListDetail(data);
    } catch (error) {
        console.error('Error creating reading list:', error);
        throw error;
    }
};

export const browseReadingLists = async (options: BrowseReadingListsOptions = {}) => {
    try {
        const params = new URLSearchParams();

        if (options.q && options.q.trim()) {
            params.set('q', options.q.trim());
        }

        if (typeof options.minStars === 'number' && options.minStars > 0) {
            params.set('minStars', String(Math.floor(options.minStars)));
        }

        if (typeof options.page === 'number' && options.page > 0) {
            params.set('page', String(Math.floor(options.page)));
        }

        if (typeof options.size === 'number' && options.size > 0) {
            params.set('size', String(Math.min(100, Math.floor(options.size))));
        }

        if (options.sort) {
            params.set('sort', options.sort);
        }

        const query = params.toString();
        const res = await fetch(`${API_BASE_URL}/reading-lists${query ? `?${query}` : ''}`, {
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            throw toApiResponseError(await readErrorPayload(res), 'Could not load reading lists.', res.status);
        }

        const data = await res.json();
        return normalizeReadingListSummaries(data);
    } catch (error) {
        console.error('Error browsing reading lists:', error);
        throw error;
    }
};

export const getMyReadingLists = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/reading-lists/mine`, {
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            throw toApiResponseError(await readErrorPayload(res), 'Could not load your reading lists.', res.status);
        }

        const data = await res.json();
        return normalizeReadingListSummaries(data);
    } catch (error) {
        console.error('Error fetching my reading lists:', error);
        throw error;
    }
};

export const getMyReadingListSubscriptions = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/reading-lists/subscriptions`, {
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            throw toApiResponseError(await readErrorPayload(res), 'Could not load your subscriptions.', res.status);
        }

        const data = await res.json();
        return normalizeReadingListSubscriptions(data);
    } catch (error) {
        console.error('Error fetching reading list subscriptions:', error);
        throw error;
    }
};

export const getReadingList = async (listId: string | number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/reading-lists/${listId}`, {
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            throw toApiResponseError(await readErrorPayload(res), 'Could not load the reading list.', res.status);
        }

        const data = await res.json();
        return toReadingListDetail(data);
    } catch (error) {
        console.error('Error fetching reading list:', error);
        throw error;
    }
};

export const updateReadingList = async (
    listId: string | number,
    payload: ReadingListUpdateRequestDTO,
) => {
    try {
        const res = await fetch(`${API_BASE_URL}/reading-lists/${listId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorPayload = await readErrorPayload(res);

            if (res.status === 400) {
                const fieldErrors = extractFieldErrors(errorPayload, READING_LIST_UPDATE_FIELD_NAMES);
                const message = normalizeErrorMessage(errorPayload, 'Could not update the reading list.');

                throw new ApiValidationError<ReadingListUpdateFieldName>(message, {
                    status: 400,
                    fieldErrors,
                });
            }

            throw toApiResponseError(errorPayload, 'Could not update the reading list.', res.status);
        }

        const data = await res.json();
        return toReadingListDetail(data);
    } catch (error) {
        console.error('Error updating reading list:', error);
        throw error;
    }
};

export const deleteReadingList = async (listId: string | number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/reading-lists/${listId}`, {
            method: 'DELETE',
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            throw toApiResponseError(await readErrorPayload(res), 'Could not delete the reading list.', res.status);
        }
    } catch (error) {
        console.error('Error deleting reading list:', error);
        throw error;
    }
};

export const subscribeToReadingList = async (listId: string | number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/reading-lists/${listId}/subscribe`, {
            method: 'POST',
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            throw toApiResponseError(await readErrorPayload(res), 'Could not subscribe to the list.', res.status);
        }
    } catch (error) {
        console.error('Error subscribing to reading list:', error);
        throw error;
    }
};

export const unsubscribeFromReadingList = async (listId: string | number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/reading-lists/${listId}/subscribe`, {
            method: 'DELETE',
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            throw toApiResponseError(await readErrorPayload(res), 'Could not unsubscribe.', res.status);
        }
    } catch (error) {
        console.error('Error unsubscribing from reading list:', error);
        throw error;
    }
};

export const starReadingList = async (listId: string | number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/reading-lists/${listId}/star`, {
            method: 'POST',
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            throw toApiResponseError(await readErrorPayload(res), 'Could not star the list.', res.status);
        }
    } catch (error) {
        console.error('Error starring reading list:', error);
        throw error;
    }
};

export const unstarReadingList = async (listId: string | number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/reading-lists/${listId}/star`, {
            method: 'DELETE',
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            throw toApiResponseError(await readErrorPayload(res), 'Could not remove the star.', res.status);
        }
    } catch (error) {
        console.error('Error unstarring reading list:', error);
        throw error;
    }
};

export const getAdminDashboard = async (range: AdminAnalyticsRange = 'THIS_MONTH') => {
    try {
        const params = new URLSearchParams({ range });
        const res = await fetch(`${API_BASE_URL}/admin/dashboard?${params.toString()}`, {
            headers: await buildAuthHeaders(),
        });

        if (!res.ok) {
            throw toApiResponseError(await readErrorPayload(res), 'Could not load admin dashboard.', res.status);
        }

        const data = await res.json();
        return toAdminDashboard(data);
    } catch (error) {
        console.error('Error fetching admin dashboard:', error);
        throw error;
    }
};


export const getBookCircleChatWebSocketUrl = () => {
    const browserOrigin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
    const url = new URL(BOOK_CIRCLE_CHAT_WEBSOCKET_PATH, API_ROOT_URL || browserOrigin);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return url.toString();
};

export async function getAuthToken(): Promise<string | null> {
    try {
        if (keycloak.authenticated && keycloak.updateToken) {
            await keycloak.updateToken(30);
        }
    } catch (err) {
        console.error('Failed to refresh auth token before API request:', err);
    }

    return keycloak.token ?? null;
}

// Helper to build Authorization headers, refreshing token if needed
async function buildAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};
    const token = await getAuthToken();

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}
