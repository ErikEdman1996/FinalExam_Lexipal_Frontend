import { Client, type StompSubscription } from '@stomp/stompjs';
import { startTransition, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { SendHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  ApiResponseError,
  deleteBookCircleChatMessage,
  getAuthToken,
  getBookCircleChatMessages,
  getBookCircleChatWebSocketUrl,
  parseCircleChatEventPayload,
  parseCircleChatSocketErrorPayload,
  type BookCircleReadResponseDTO,
  type CircleChatMessageDTO,
  type CircleChatPresenceMemberDTO,
} from '../../api/api';
import { Button } from '../../components/Button';
import { formatCircleDateTime, parseCircleLocalDateTime } from './utils';

const DEFAULT_PAGE_SIZE = 50;
const MAX_MESSAGE_LENGTH = 2000;
const CLOSED_CHAT_REASON = 'Chat is unavailable because this circle is closed.';
const REVOKED_CHAT_REASON = 'You are no longer a member of this circle.';

type ChatTerminalState =
  | { kind: 'closed'; reason: string }
  | { kind: 'revoked'; reason: string }
  | null;

type ChatConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting';

interface CircleChatPanelProps {
  circle: Pick<BookCircleReadResponseDTO, 'id' | 'status' | 'callerIsOwner'>;
  currentUserId: number | null;
  onChatClosed?: (reason: string) => void;
  onAccessRevoked?: (reason: string) => void;
}

interface MessageStore {
  byId: Record<number, CircleChatMessageDTO>;
  orderedIds: number[];
}

const createEmptyMessageStore = (): MessageStore => ({
  byId: {},
  orderedIds: [],
});

const compareMessages = (left: CircleChatMessageDTO, right: CircleChatMessageDTO) => {
  const createdAtComparison = left.createdAt.localeCompare(right.createdAt);

  if (createdAtComparison !== 0) {
    return createdAtComparison;
  }

  return left.id - right.id;
};

const mergeMessages = (
  currentStore: MessageStore,
  incomingMessages: CircleChatMessageDTO[],
) => {
  if (incomingMessages.length === 0) {
    return currentStore;
  }

  const byId = { ...currentStore.byId };
  const orderedIds = [...currentStore.orderedIds];
  const knownIds = new Set(orderedIds);

  incomingMessages.forEach((message) => {
    byId[message.id] = message;

    if (!knownIds.has(message.id)) {
      orderedIds.push(message.id);
      knownIds.add(message.id);
    }
  });

  orderedIds.sort((leftId, rightId) => {
    return compareMessages(byId[leftId], byId[rightId]);
  });

  return {
    byId,
    orderedIds,
  };
};

const isClosedChatMessage = (message: string | null | undefined) => {
  return typeof message === 'string' && message.toLowerCase().includes('circle is closed');
};

const isRevokedChatMessage = (message: string | null | undefined) => {
  return typeof message === 'string' && (
    message.toLowerCase().includes('not a member of this circle')
    || message.toLowerCase().includes('left this circle')
  );
};

const getDisplayNickname = (
  member: Pick<CircleChatPresenceMemberDTO, 'userId' | 'userNickname'>,
  currentUserId: number | null,
) => {
  if (currentUserId != null && member.userId === currentUserId) {
    return 'You';
  }

  return member.userNickname?.trim() || 'Anonymous';
};

const formatChatTimestamp = (value: string) => {
  const parsed = parseCircleLocalDateTime(value);

  if (!parsed || Number.isNaN(parsed.getTime())) {
    return formatCircleDateTime(value);
  }

  const now = new Date();
  const isSameDay = parsed.toDateString() === now.toDateString();

  return new Intl.DateTimeFormat(undefined, isSameDay
    ? {
      hour: 'numeric',
      minute: '2-digit',
    }
    : {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(parsed);
};

export function CircleChatPanel({
  circle,
  currentUserId,
  onChatClosed,
  onAccessRevoked,
}: CircleChatPanelProps) {
  const [messageStore, setMessageStore] = useState<MessageStore>(() => createEmptyMessageStore());
  const [onlineMembers, setOnlineMembers] = useState<CircleChatPresenceMemberDTO[]>([]);
  const [composerValue, setComposerValue] = useState('');
  const [composerError, setComposerError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextBeforeMessageId, setNextBeforeMessageId] = useState<number | null>(null);
  const [isInitialHistoryLoading, setIsInitialHistoryLoading] = useState(circle.status === 'ACTIVE');
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [deletePendingIds, setDeletePendingIds] = useState<number[]>([]);
  const [terminalState, setTerminalState] = useState<ChatTerminalState>(
    circle.status === 'CLOSED'
      ? { kind: 'closed', reason: CLOSED_CHAT_REASON }
      : null,
  );
  const [connectionState, setConnectionState] = useState<ChatConnectionState>('idle');
  const [retryNonce, setRetryNonce] = useState(0);
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<StompSubscription[]>([]);
  const hasJoinedPresenceRef = useRef(false);
  const hasConnectedOnceRef = useRef(false);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const pendingPrependRestoreRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const lastNotifiedTerminalStateRef = useRef<string | null>(null);

  const messages = useMemo(() => {
    return messageStore.orderedIds
      .map((messageId) => messageStore.byId[messageId])
      .filter((message): message is CircleChatMessageDTO => message != null);
  }, [messageStore]);

  const activeTerminalState = useMemo(() => {
    if (circle.status === 'CLOSED') {
      return {
        kind: 'closed' as const,
        reason: terminalState?.kind === 'closed' ? terminalState.reason : CLOSED_CHAT_REASON,
      };
    }

    return terminalState;
  }, [circle.status, terminalState]);

  const isLiveChatEligible = circle.status === 'ACTIVE'
    && currentUserId != null
    && activeTerminalState == null;

  const isComposerDisabled = !isLiveChatEligible || connectionState !== 'connected';
  const trimmedComposerValue = composerValue.trim();
  const remainingCharacters = MAX_MESSAGE_LENGTH - composerValue.length;

  const transitionToTerminalState = useCallback((nextState: Exclude<ChatTerminalState, null>) => {
    if (nextState.kind === 'revoked') {
      startTransition(() => {
        setMessageStore(createEmptyMessageStore());
        setOnlineMembers([]);
      });
    }

    setComposerValue('');
    setComposerError(null);
    setTerminalState(nextState);
  }, []);

  const applyHistoryPage = useCallback((
    incomingMessages: CircleChatMessageDTO[],
    hasMoreMessages: boolean,
    nextCursor: number | null,
  ) => {
    startTransition(() => {
      setMessageStore((currentStore) => mergeMessages(currentStore, incomingMessages));
      setHasMore(hasMoreMessages);
      setNextBeforeMessageId(nextCursor);
    });
  }, []);

  useEffect(() => {
    setMessageStore(createEmptyMessageStore());
    setOnlineMembers([]);
    setComposerValue('');
    setComposerError(null);
    setHasMore(false);
    setNextBeforeMessageId(null);
    setIsInitialHistoryLoading(false);
    setIsLoadingOlder(false);
    setDeletePendingIds([]);
    setTerminalState(null);
    setConnectionState('idle');
    setRetryNonce(0);
    hasConnectedOnceRef.current = false;
    hasJoinedPresenceRef.current = false;
    clientRef.current = null;
    lastNotifiedTerminalStateRef.current = null;
    pendingPrependRestoreRef.current = null;
    shouldStickToBottomRef.current = true;
  }, [circle.id]);

  useEffect(() => {
    if (circle.status === 'CLOSED') {
      setTerminalState((currentState) => {
        if (currentState?.kind === 'closed') {
          return currentState;
        }

        return { kind: 'closed', reason: CLOSED_CHAT_REASON };
      });
    }
  }, [circle.status]);

  useEffect(() => {
    if (!activeTerminalState) {
      return;
    }

    const notificationKey = `${activeTerminalState.kind}:${activeTerminalState.reason}`;

    if (lastNotifiedTerminalStateRef.current === notificationKey) {
      return;
    }

    lastNotifiedTerminalStateRef.current = notificationKey;

    if (activeTerminalState.kind === 'closed') {
      onChatClosed?.(activeTerminalState.reason);
      return;
    }

    onAccessRevoked?.(activeTerminalState.reason);
  }, [activeTerminalState, onAccessRevoked, onChatClosed]);

  useLayoutEffect(() => {
    const listElement = messageListRef.current;

    if (!listElement) {
      return;
    }

    if (pendingPrependRestoreRef.current) {
      const { scrollHeight, scrollTop } = pendingPrependRestoreRef.current;
      const heightDelta = listElement.scrollHeight - scrollHeight;
      listElement.scrollTop = scrollTop + heightDelta;
      pendingPrependRestoreRef.current = null;
      return;
    }

    if (shouldStickToBottomRef.current) {
      listElement.scrollTop = listElement.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!isLiveChatEligible) {
      const activeClient = clientRef.current;

      if (activeClient?.active) {
        if (activeClient.connected && hasJoinedPresenceRef.current) {
          try {
            activeClient.publish({
              destination: `/app/book-circles/${circle.id}/presence.leave`,
              body: '',
            });
          } catch (error) {
            console.error('Error leaving circle chat presence:', error);
          }
        }

        void activeClient.deactivate();
      }

      subscriptionsRef.current.forEach((subscription) => subscription.unsubscribe());
      subscriptionsRef.current = [];
      hasJoinedPresenceRef.current = false;
      clientRef.current = null;
      setConnectionState('idle');
      setIsInitialHistoryLoading(false);
      return;
    }

    let isDisposed = false;
    let didFetchInitialHistory = false;

    const disconnectClient = async () => {
      const activeClient = clientRef.current;

      subscriptionsRef.current.forEach((subscription) => subscription.unsubscribe());
      subscriptionsRef.current = [];

      if (!activeClient) {
        hasJoinedPresenceRef.current = false;
        return;
      }

      if (activeClient.connected && hasJoinedPresenceRef.current) {
        try {
          activeClient.publish({
            destination: `/app/book-circles/${circle.id}/presence.leave`,
            body: '',
          });
        } catch (error) {
          console.error('Error leaving circle chat presence:', error);
        }
      }

      hasJoinedPresenceRef.current = false;

      if (activeClient.active) {
        await activeClient.deactivate();
      }
    };

    const client = new Client({
      brokerURL: getBookCircleChatWebSocketUrl(),
      reconnectDelay: 5000,
      beforeConnect: async () => {
        const token = await getAuthToken();

        if (!token) {
          throw new Error('Could not authenticate live chat.');
        }

        client.connectHeaders = {
          Authorization: `Bearer ${token}`,
        };
      },
      onConnect: () => {
        if (isDisposed) {
          return;
        }

        hasConnectedOnceRef.current = true;
        setConnectionState('connected');

        subscriptionsRef.current.forEach((subscription) => subscription.unsubscribe());
        subscriptionsRef.current = [];

        const eventSubscription = client.subscribe(
          `/user/queue/book-circles/${circle.id}/events`,
          (frame) => {
            if (isDisposed) {
              return;
            }

            try {
              const event = parseCircleChatEventPayload(JSON.parse(frame.body) as unknown);

              if (event.circleId !== circle.id) {
                return;
              }

              if (event.type === 'MESSAGE_CREATED' || event.type === 'MESSAGE_DELETED') {
                if (event.message) {
                  const message = event.message;

                  startTransition(() => {
                    setMessageStore((currentStore) => mergeMessages(currentStore, [message]));
                  });
                }
                return;
              }

              if (event.type === 'PRESENCE_UPDATED') {
                startTransition(() => {
                  setOnlineMembers(event.onlineMembers ?? []);
                });
                return;
              }

              if (event.type === 'CHAT_CLOSED') {
                transitionToTerminalState({
                  kind: 'closed',
                  reason: event.reason ?? CLOSED_CHAT_REASON,
                });
                return;
              }

              transitionToTerminalState({
                kind: 'revoked',
                reason: event.reason ?? REVOKED_CHAT_REASON,
              });
            } catch (error) {
              console.error('Error handling circle chat event:', error);
            }
          },
        );

        const errorSubscription = client.subscribe('/user/queue/errors', (frame) => {
          if (isDisposed) {
            return;
          }

          try {
            const payload = parseCircleChatSocketErrorPayload(JSON.parse(frame.body) as unknown);

            if (isClosedChatMessage(payload.message)) {
              transitionToTerminalState({
                kind: 'closed',
                reason: payload.message || CLOSED_CHAT_REASON,
              });
              return;
            }

            if (isRevokedChatMessage(payload.message)) {
              transitionToTerminalState({
                kind: 'revoked',
                reason: payload.message || REVOKED_CHAT_REASON,
              });
              return;
            }

            if (payload.status === 400) {
              setComposerError(payload.message);
              return;
            }

            toast.error(payload.message);
          } catch (error) {
            console.error('Error handling circle chat socket error:', error);
          }
        });

        subscriptionsRef.current = [eventSubscription, errorSubscription];

        void (async () => {
          try {
            setIsInitialHistoryLoading(true);
            const history = await getBookCircleChatMessages(circle.id, { limit: DEFAULT_PAGE_SIZE });

            if (isDisposed) {
              return;
            }

            didFetchInitialHistory = true;
            applyHistoryPage(history.messages, history.hasMore, history.nextBeforeMessageId);
            client.publish({
              destination: `/app/book-circles/${circle.id}/presence.join`,
              body: '',
            });
            hasJoinedPresenceRef.current = true;
          } catch (error) {
            if (isDisposed) {
              return;
            }

            if (error instanceof ApiResponseError) {
              if (isClosedChatMessage(error.message)) {
                transitionToTerminalState({
                  kind: 'closed',
                  reason: error.message,
                });
                return;
              }

              if (isRevokedChatMessage(error.message)) {
                transitionToTerminalState({
                  kind: 'revoked',
                  reason: error.message,
                });
                return;
              }

              toast.error(error.message);
            } else {
              toast.error('Could not load the circle chat right now.');
            }
          } finally {
            if (!isDisposed) {
              setIsInitialHistoryLoading(false);
            }
          }
        })();
      },
      onWebSocketClose: () => {
        if (isDisposed || activeTerminalState != null) {
          return;
        }

        setConnectionState(hasConnectedOnceRef.current ? 'reconnecting' : 'connecting');
      },
      onWebSocketError: () => {
        if (isDisposed) {
          return;
        }

        if (didFetchInitialHistory) {
          toast.error('Circle chat connection dropped. Reconnecting...');
        }
      },
      onStompError: (frame) => {
        if (isDisposed) {
          return;
        }

        const message = frame.headers.message?.trim() || 'Circle chat ran into a server error.';
        toast.error(message);
      },
    });

    clientRef.current = client;
    setConnectionState(hasConnectedOnceRef.current ? 'reconnecting' : 'connecting');
    setIsInitialHistoryLoading(true);
    client.activate();

    return () => {
      isDisposed = true;
      void disconnectClient();
    };
  }, [activeTerminalState, applyHistoryPage, circle.id, isLiveChatEligible, retryNonce, transitionToTerminalState]);

  const handleMessageListScroll = useCallback(() => {
    const listElement = messageListRef.current;

    if (!listElement) {
      return;
    }

    const distanceFromBottom = listElement.scrollHeight - listElement.scrollTop - listElement.clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom < 64;
  }, []);

  const handleLoadOlderMessages = useCallback(async () => {
    if (isLoadingOlder || nextBeforeMessageId == null) {
      return;
    }

    const listElement = messageListRef.current;

    if (listElement) {
      pendingPrependRestoreRef.current = {
        scrollHeight: listElement.scrollHeight,
        scrollTop: listElement.scrollTop,
      };
    }

    try {
      setIsLoadingOlder(true);
      const history = await getBookCircleChatMessages(circle.id, {
        beforeMessageId: nextBeforeMessageId,
        limit: DEFAULT_PAGE_SIZE,
      });

      applyHistoryPage(history.messages, history.hasMore, history.nextBeforeMessageId);
    } catch (error) {
      pendingPrependRestoreRef.current = null;

      if (error instanceof ApiResponseError) {
        if (isClosedChatMessage(error.message)) {
          transitionToTerminalState({
            kind: 'closed',
            reason: error.message,
          });
          return;
        }

        if (isRevokedChatMessage(error.message)) {
          transitionToTerminalState({
            kind: 'revoked',
            reason: error.message,
          });
          return;
        }

        toast.error(error.message);
        return;
      }

      toast.error('Could not load older messages.');
    } finally {
      setIsLoadingOlder(false);
    }
  }, [applyHistoryPage, circle.id, isLoadingOlder, nextBeforeMessageId, transitionToTerminalState]);

  const handleSendMessage = useCallback(() => {
    const trimmedContent = composerValue.trim();

    if (!trimmedContent) {
      setComposerError('Message content is required.');
      return;
    }

    if (trimmedContent.length > MAX_MESSAGE_LENGTH) {
      setComposerError('Message content must be 2000 characters or fewer.');
      return;
    }

    if (isComposerDisabled || !clientRef.current?.connected) {
      setComposerError('Live chat is reconnecting. Try again in a moment.');
      return;
    }

    setComposerError(null);
    clientRef.current.publish({
      destination: `/app/book-circles/${circle.id}/messages`,
      body: JSON.stringify({ content: trimmedContent }),
    });
    setComposerValue('');
  }, [circle.id, composerValue, isComposerDisabled]);

  const handleDeleteMessage = useCallback(async (messageId: number) => {
    if (deletePendingIds.includes(messageId)) {
      return;
    }

    try {
      setDeletePendingIds((currentIds) => [...currentIds, messageId]);
      await deleteBookCircleChatMessage(circle.id, messageId);
    } catch (error) {
      if (error instanceof ApiResponseError) {
        toast.error(error.message);
      } else {
        toast.error('Could not delete that message right now.');
      }
    } finally {
      setDeletePendingIds((currentIds) => currentIds.filter((currentId) => currentId !== messageId));
    }
  }, [circle.id, deletePendingIds]);

  const connectionLabel = connectionState === 'connected'
    ? 'Live now'
    : connectionState === 'reconnecting'
      ? 'Reconnecting...'
      : connectionState === 'connecting'
        ? 'Connecting...'
        : 'Offline';

  const emptyStateLabel = activeTerminalState?.kind === 'closed'
    ? activeTerminalState.reason
    : activeTerminalState?.kind === 'revoked'
      ? activeTerminalState.reason
      : currentUserId == null
        ? 'Verifying your circle membership for chat...'
        : 'No messages yet. Break the ice and start the conversation.';

  return (
    <section className="rounded-[28px] border border-border bg-surface p-4 shadow-[0_16px_34px_rgba(31,41,55,0.06)] sm:p-6">
      <div className="flex flex-col gap-4 border-b border-border pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-text-subtle">Live discussion</p>
            <h2 className="mt-1 text-xl font-semibold text-text sm:text-2xl">Circle chat</h2>
            <p className="mt-1 text-sm text-text-muted">
              {onlineMembers.length} online
              {' | '}
              {connectionLabel}
            </p>
          </div>

          {currentUserId != null && activeTerminalState == null && connectionState !== 'connected' ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setRetryNonce((currentValue) => currentValue + 1)}
            >
              Retry live chat
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {onlineMembers.length > 0 ? onlineMembers.map((member) => (
            <span
              key={member.userId}
              className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand-strong"
            >
              <span className="h-2 w-2 rounded-full bg-brand-strong" aria-hidden="true" />
              {getDisplayNickname(member, currentUserId)}
            </span>
          )) : (
            <span className="inline-flex rounded-full bg-surface-muted px-3 py-1.5 text-xs font-medium text-text-muted">
              No one is online in chat yet.
            </span>
          )}
        </div>

        {activeTerminalState ? (
          <div className="rounded-[20px] border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
            {activeTerminalState.reason}
          </div>
        ) : null}
      </div>

      <div className="mt-4 rounded-[24px] border border-border bg-surface-alt p-3 sm:p-4">
        {hasMore ? (
          <div className="pb-3 text-center">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => void handleLoadOlderMessages()}
              disabled={isLoadingOlder}
            >
              {isLoadingOlder ? 'Loading older messages...' : 'Load older messages'}
            </Button>
          </div>
        ) : null}

        <div
          ref={messageListRef}
          onScroll={handleMessageListScroll}
          className="flex max-h-[32rem] min-h-[18rem] flex-col gap-3 overflow-y-auto pr-1"
        >
          {isInitialHistoryLoading && messages.length === 0 ? (
            <div className="flex min-h-[16rem] items-center justify-center rounded-[20px] bg-surface px-4 text-sm text-text-muted">
              Loading conversation...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex min-h-[16rem] items-center justify-center rounded-[20px] bg-surface px-4 text-center text-sm text-text-muted">
              {emptyStateLabel}
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = currentUserId != null && message.senderUserId === currentUserId;
              const canDeleteMessage = !message.deleted && (
                isOwnMessage
                || circle.callerIsOwner
              );
              const isDeletePending = deletePendingIds.includes(message.id);

              return (
                <article
                  key={message.id}
                  className={`max-w-[92%] rounded-[22px] border px-4 py-3 shadow-[0_8px_18px_rgba(31,41,55,0.04)] ${
                    isOwnMessage
                      ? 'ml-auto border-brand/10 bg-brand-soft'
                      : 'border-border bg-surface'
                  } ${
                    message.deleted
                      ? 'opacity-75'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text">
                        {isOwnMessage ? 'You' : message.senderNickname?.trim() || 'Anonymous'}
                      </p>
                      <p
                        className="mt-0.5 text-[0.72rem] text-text-subtle"
                        title={formatCircleDateTime(message.createdAt)}
                      >
                        {formatChatTimestamp(message.createdAt)}
                      </p>
                    </div>

                    {canDeleteMessage ? (
                      <button
                        type="button"
                        onClick={() => void handleDeleteMessage(message.id)}
                        disabled={isDeletePending}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Delete message"
                        title="Delete message"
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : null}
                  </div>

                  <p className={`mt-3 whitespace-pre-wrap text-sm leading-relaxed ${
                    message.deleted
                      ? 'italic text-text-muted'
                      : 'text-text'
                  }`}
                  >
                    {message.deleted ? 'Message deleted' : message.content}
                  </p>
                </article>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <label className="text-xs uppercase tracking-[0.22em] text-text-subtle" htmlFor={`circle-chat-${circle.id}`}>
          Message
        </label>
        <div className="mt-2 rounded-[22px] border border-border bg-surface-alt p-3">
          <textarea
            id={`circle-chat-${circle.id}`}
            value={composerValue}
            onChange={(event) => {
              setComposerValue(event.target.value);

              if (composerError) {
                setComposerError(null);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSendMessage();
              }
            }}
            rows={3}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder={activeTerminalState
              ? activeTerminalState.reason
              : 'Share a thought about the book...'}
            disabled={isComposerDisabled}
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-text outline-none placeholder:text-text-subtle disabled:cursor-not-allowed disabled:text-text-muted"
          />

          <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-text-muted">
              Press Enter to send. Use Shift+Enter for a new line.
              {composerError ? (
                <span className="ml-2 text-danger">{composerError}</span>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className={`text-xs ${
                remainingCharacters < 0 ? 'text-danger' : 'text-text-subtle'
              }`}
              >
                {remainingCharacters} characters left
              </span>
              <Button
                type="button"
                className="rounded-full px-5"
                onClick={handleSendMessage}
                disabled={isComposerDisabled || trimmedComposerValue.length === 0 || trimmedComposerValue.length > MAX_MESSAGE_LENGTH}
              >
                <span className="inline-flex items-center gap-2">
                  <SendHorizontal size={15} />
                  Send
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
