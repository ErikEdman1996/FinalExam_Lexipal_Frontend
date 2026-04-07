import keycloak from '../features/auth/keycloak';

const API_ROOT_URL = 'http://localhost:8585';
const API_BASE_URL = 'http://localhost:8585/lexipal/api/v1';

export type ApiBookStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface ApiSession {
    id: number;
    bookId: number;
    sessionDate: string;
    durationSeconds: number;
    startPage: number;
    endPage: number;
    pagesRead: number;
    reflection: string;
    status: 'IN_PROGRESS' | 'COMPLETED';
    capturedWordCount: number;
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
    durationSeconds: number;
    startPage: number;
    endPage: number;
    reflection: string;
}

export interface UpdateSessionPayload {
    durationSeconds?: number;
    endPage?: number;
    reflection?: string;
    status?: 'IN_PROGRESS' | 'COMPLETED';
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

export interface SearchAndCapturePayload {
    lemma: string;
}

export interface ApiCapturedWordEntry {
    id: number;
    wordId: number;
    sessionId: number;
    lemma: string;
    specificDefinition: string;
    xpValue: number;
    capturedAt: string;
    rarityScore: number | null;
    rarityTier: 'COMMON' | 'RARE' | 'MYTHIC' | string;
    source: string;
    definitions: ApiJsonValue | null;
    phonetics: ApiJsonValue | null;
}

export interface ProfileStatsResponseDTO {
    totalPagesRead: number;
    totalBooksRead: number;
    totalSessionsCompleted: number;
    totalCapturedWords: number;
    totalXpEarned: number;
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

export interface ApiCapturedWord {
    id: number;
    xpValue: number | null;
    word: ApiWord;
}

export interface SearchAndCaptureResponse {
    capturedWord: ApiCapturedWord;
    newCapture: boolean;
    rarityTier: 'COMMON' | 'RARE' | 'MYTHIC' | string;
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

const isCapturedWordLikeRecord = (value: unknown): value is Record<string, unknown> => {
    if (!isRecord(value)) {
        return false;
    }

    return typeof value.lemma === 'string' && toFiniteNumber(value.id) !== null;
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

const toApiCapturedWordEntry = (value: Record<string, unknown>): ApiCapturedWordEntry => {
    const rarityScore = toFiniteNumber(value.rarityScore);
    const definitions = isApiJsonValue(value.definitions) ? value.definitions : null;
    const phonetics = isApiJsonValue(value.phonetics) ? value.phonetics : null;

    return {
        id: toFiniteNumber(value.id) ?? 0,
        wordId: toFiniteNumber(value.wordId) ?? 0,
        sessionId: toFiniteNumber(value.sessionId) ?? 0,
        lemma: typeof value.lemma === 'string' ? value.lemma : '',
        specificDefinition: typeof value.specificDefinition === 'string' ? value.specificDefinition : '',
        xpValue: toFiniteNumber(value.xpValue) ?? 0,
        capturedAt: typeof value.capturedAt === 'string' ? value.capturedAt : '',
        rarityScore,
        rarityTier: typeof value.rarityTier === 'string' ? value.rarityTier : 'COMMON',
        source: typeof value.source === 'string' ? value.source : '',
        definitions,
        phonetics,
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

    return (
        toFiniteNumber(value.id) !== null
        && toFiniteNumber(value.bookId) !== null
        && toFiniteNumber(value.startPage) !== null
        && toFiniteNumber(value.endPage) !== null
    );
};

const toApiSession = (value: Record<string, unknown>): ApiSession => {
    const id = toFiniteNumber(value.id) ?? 0;
    const bookId = toFiniteNumber(value.bookId) ?? 0;
    const durationSeconds = toFiniteNumber(value.durationSeconds) ?? 0;
    const startPage = toFiniteNumber(value.startPage) ?? 0;
    const endPage = toFiniteNumber(value.endPage) ?? 0;
    const pagesRead = toFiniteNumber(value.pagesRead) ?? Math.max(0, endPage - startPage);
    const sessionDate = typeof value.sessionDate === 'string' ? value.sessionDate : '';
    const reflection = typeof value.reflection === 'string' ? value.reflection : '';
    const status = value.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS';
    const capturedWordCount = toFiniteNumber(value.capturedWordCount) ?? 0;

    return {
        id,
        bookId,
        durationSeconds,
        startPage,
        endPage,
        pagesRead,
        reflection,
        status,
        sessionDate,
        capturedWordCount,
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

const normalizeCapturedWordsResponse = (value: unknown): ApiCapturedWordEntry[] => {
    if (Array.isArray(value)) {
        return value
            .filter(isCapturedWordLikeRecord)
            .map(toApiCapturedWordEntry);
    }

    if (!isRecord(value)) {
        return [];
    }

    const collections = [value.words, value.content, value.data, value.items];

    for (const collection of collections) {
        if (Array.isArray(collection)) {
            return collection
                .filter(isCapturedWordLikeRecord)
                .map(toApiCapturedWordEntry);
        }
    }

    return [];
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

const normalizeSessionResponse = (value: ApiSessionResponse): ApiSession => {
    const candidate = findSessionLikeRecord(value);

    if (candidate) {
        return toApiSession(candidate);
    }

    console.error('Unexpected session response shape. Raw payload:', value);
    throw new Error('Unexpected session response shape.');
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
        if (!res.ok) throw new Error('Failed to fetch sessions');
        const data = await res.json();
        return normalizeSessionsResponse(data);
    } catch (error) {
        console.error('Error fetching sessions:', error);
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
        if (!res.ok) throw new Error('Failed to fetch session');
        const data = await res.json();
        return normalizeSessionResponse(data);
    } catch (error) {
        console.error('Error fetching session:', error);
        throw error;
    }
};

export const getCapturedWords = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/capturedWords/all`, {
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to fetch captured words');
        const data = await res.json();
        return normalizeCapturedWordsResponse(data);
    } catch (error) {
        console.error('Error fetching captured words:', error);
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
        if (!res.ok) throw new Error('Failed to create session');
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
        if (!res.ok) throw new Error('Failed to update session');
        const data = await res.json();
        return normalizeSessionResponse(data);
    } catch (error) {
        console.error('Error updating session:', error);
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

export const extractDefinitionFromDefinitions = (definitions: ApiJsonValue | null) => {
    if (!definitions) {
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

export const extractSynonymsFromDefinitions = (definitions: ApiJsonValue | null) => {
    if (!definitions) {
        return [];
    }

    const synonymCandidates: string[] = [];
    collectValuesByKey(definitions, 'synonyms', synonymCandidates);
    collectValuesByKey(definitions, 'synonym', synonymCandidates);

    return Array.from(new Set(synonymCandidates));
};

export const extractPhoneticText = (phonetics: ApiJsonValue | null) => {
    if (!phonetics) {
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


export const searchAndCaptureWord = async (sessionId: number, payload: SearchAndCapturePayload) => {
    try {
        const res = await fetch(`${API_BASE_URL}/capturedWords/${sessionId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(await buildAuthHeaders()),
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to search and capture word');
        return await res.json() as SearchAndCaptureResponse;
    } catch (error) {
        console.error('Error searching and capturing word:', error);
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
