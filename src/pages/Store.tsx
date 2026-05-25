import { useEffect, useMemo, useState } from 'react';
import { Check, Coins, LockKeyhole, Paintbrush, ShoppingBag, Snowflake } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import {
  getMyStore,
  getMyThemes,
  purchaseStoreItem,
  selectMyTheme,
  type StoreItemResponseDTO,
  type StoreResponseDTO,
  type ThemeResponseDTO,
} from '../api/api';
import { useAuth } from '../features/auth/useAuth';
import { getThemePalette } from '../features/theme/themePalettes';
import { useTheme } from '../features/theme/useTheme';

const getStoreErrorMessage = (error: unknown, fallbackMessage: string) => {
  return error instanceof Error && error.message.trim() ? error.message : fallbackMessage;
};

interface WalletMetricProps {
  label: string;
  value: number;
  icon: typeof Coins;
}

function WalletMetric({ label, value, icon: Icon }: WalletMetricProps) {
  return (
    <div className="min-w-0 rounded-[20px] bg-surface-muted px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Icon size={16} className="shrink-0 text-brand-strong" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-text">{value}</p>
    </div>
  );
}

function ThemeSwatches({ themeCode }: { themeCode: string }) {
  const palette = getThemePalette(themeCode);

  if (!palette) {
    return <div className="h-20 rounded-[18px] border border-border bg-surface-muted" />;
  }

  const { tokens } = palette;

  return (
    <div
      className="relative h-20 overflow-hidden rounded-[18px] border border-border"
      style={{
        background: `linear-gradient(135deg, ${tokens.background} 0%, ${tokens.surface} 58%, ${tokens.surfaceMuted} 100%)`,
      }}
    >
      <div className="absolute left-3 top-3 h-10 w-[58%] rounded-[14px] border border-white/15" style={{ backgroundColor: tokens.surface }} />
      <div className="absolute bottom-3 right-3 flex gap-1.5 rounded-full px-2 py-1" style={{ backgroundColor: tokens.surfaceAlt }}>
        {[tokens.brand, tokens.accent, tokens.gold].map((color) => (
          <span
            key={color}
            className="h-3.5 w-3.5 rounded-full border border-black/10"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}

function replacePurchasedItem(store: StoreResponseDTO, purchasedItem: StoreItemResponseDTO, wallet: StoreResponseDTO['wallet']) {
  const purchasedItemExists = store.items.some((item) => item.code === purchasedItem.code);

  return {
    wallet,
    items: purchasedItemExists
      ? store.items.map((item) => (item.code === purchasedItem.code ? purchasedItem : item))
      : [...store.items, purchasedItem],
  };
}

export default function Store() {
  const location = useLocation();
  const { profile, refreshProfile, setProfile: setAuthProfile } = useAuth();
  const { themeCode } = useTheme();
  const [store, setStore] = useState<StoreResponseDTO | null>(null);
  const [themes, setThemes] = useState<ThemeResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingPurchaseCode, setPendingPurchaseCode] = useState<string | null>(null);
  const [pendingSelectionCode, setPendingSelectionCode] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadStore = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const [nextStore, nextThemes] = await Promise.all([getMyStore(), getMyThemes()]);

        if (isMounted) {
          setStore(nextStore);
          setThemes(nextThemes);
        }
      } catch (error) {
        console.error('Error loading store themes:', error);

        if (isMounted) {
          setLoadError(getStoreErrorMessage(error, 'Could not load the store right now.'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadStore();

    return () => {
      isMounted = false;
    };
  }, [reloadToken]);

  useEffect(() => {
    if (isLoading || location.hash !== '#themes') {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      document.getElementById('themes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [isLoading, location.hash]);

  useEffect(() => {
    if (!profile?.wallet) {
      return;
    }

    setStore((currentStore) => currentStore
      ? {
        ...currentStore,
        wallet: profile.wallet,
      }
      : currentStore);
  }, [profile?.wallet]);

  const themeStoreItems = useMemo(() => {
    if (!store) {
      return new Map<string, StoreItemResponseDTO>();
    }

    return new Map(
      store.items
        .filter((item) => item.itemType === 'THEME' && item.themeCode != null)
        .map((item) => [item.themeCode as string, item]),
    );
  }, [store]);

  const streakFreezeItem = store?.items.find((item) => item.itemType === 'STREAK_FREEZE') ?? null;

  const refreshThemeCatalog = async () => {
    try {
      setThemes(await getMyThemes());
    } catch (error) {
      console.error('Error refreshing themes after store change:', error);
    }
  };

  const refreshProfileQuietly = () => {
    void refreshProfile().catch((error) => {
      console.error('Error refreshing profile after store change:', error);
    });
  };

  const handlePurchase = async (item: StoreItemResponseDTO) => {
    if (!store || pendingPurchaseCode || store.wallet.coinBalance < item.priceCoins) {
      return;
    }

    if (item.itemType === 'THEME' && item.owned) {
      return;
    }

    try {
      setPendingPurchaseCode(item.code);
      const purchase = await purchaseStoreItem(item.code);
      setStore((current) => current
        ? replacePurchasedItem(current, purchase.item, purchase.wallet)
        : current);
      toast.success(purchase.item.itemType === 'THEME'
        ? `${purchase.item.name} unlocked.`
        : 'Streak freeze added.');
      refreshProfileQuietly();

      if (purchase.item.itemType === 'THEME') {
        await refreshThemeCatalog();
      }
    } catch (error) {
      console.error('Error buying store item:', error);
      toast.error(getStoreErrorMessage(error, 'Could not buy that store item right now.'));
    } finally {
      setPendingPurchaseCode(null);
    }
  };

  const handleThemeSelection = async (theme: ThemeResponseDTO) => {
    if (!theme.unlocked || pendingSelectionCode || !getThemePalette(theme.code)) {
      return;
    }

    try {
      setPendingSelectionCode(theme.code);
      const selectedTheme = await selectMyTheme(theme.code);
      setThemes((current) => current.map((item) => item.code === selectedTheme.code
        ? { ...selectedTheme, selected: true }
        : { ...item, selected: false }));
      setStore((current) => current
        ? {
          ...current,
          items: current.items.map((item) => item.itemType === 'THEME'
            ? { ...item, selected: item.themeCode === selectedTheme.code }
            : item),
        }
        : current);

      if (profile) {
        setAuthProfile({ ...profile, selectedTheme });
      }

      toast.success(`${selectedTheme.name} selected.`);
      refreshProfileQuietly();
    } catch (error) {
      console.error('Error selecting theme:', error);
      toast.error(getStoreErrorMessage(error, 'Could not select that theme right now.'));
    } finally {
      setPendingSelectionCode(null);
    }
  };

  return (
    <div className="page-bg min-h-screen pb-24 lg:pl-60 lg:pb-0">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.32em] text-text-subtle">
              Store
            </p>
            <h1 className="mt-2 text-[2.3rem] font-semibold leading-tight tracking-normal text-text sm:text-[3rem]">
              Spend your coins
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted sm:text-base">
              Keep your streak protected and choose the reading room that fits the page.
            </p>
          </div>

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-accent-soft shadow-[0_10px_24px_rgba(212,146,79,0.16)]">
            <ShoppingBag size={25} className="text-accent-strong" aria-hidden="true" />
          </div>
        </header>

        {isLoading ? (
          <div className="mt-6 rounded-[28px] border border-border bg-surface px-5 py-12 text-center text-text-muted">
            Loading the store...
          </div>
        ) : loadError || !store ? (
          <div className="mt-6 rounded-[28px] border border-border bg-surface px-5 py-12 text-center shadow-[0_14px_30px_rgba(31,41,55,0.06)]">
            <p className="text-lg font-medium text-danger">{loadError ?? 'Store not found.'}</p>
            <Button className="mt-5 rounded-full px-6" onClick={() => setReloadToken((current) => current + 1)}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <section className="mt-6 rounded-[28px] border border-border bg-surface p-5 shadow-[0_14px_30px_rgba(31,41,55,0.06)]">
              <p className="text-xs uppercase tracking-[0.22em] text-text-subtle">Wallet</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <WalletMetric label="Coin balance" value={store.wallet.coinBalance} icon={Coins} />
                <WalletMetric label="Streak freezes owned" value={store.wallet.availableStreakFreezes} icon={Snowflake} />
              </div>
            </section>

            <main className="mt-6 space-y-8">
              {streakFreezeItem ? (
                <section className="rounded-[28px] border border-border bg-surface p-5 shadow-[0_14px_30px_rgba(31,41,55,0.06)] sm:p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-brand-soft">
                          <Snowflake size={21} className="text-brand-strong" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-text-subtle">Inventory item</p>
                          <h2 className="mt-1 text-2xl font-semibold text-text">{streakFreezeItem.name}</h2>
                        </div>
                      </div>
                      <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-muted">
                        Freeze your reading streak for 1 day!
                      </p>
                    </div>

                    <div className="shrink-0 rounded-[20px] bg-surface-muted px-4 py-3 text-left sm:min-w-36">
                      <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">Price</p>
                      <p className="mt-2 inline-flex items-center gap-2 text-2xl font-semibold tabular-nums text-text">
                        <Coins size={20} className="text-accent-strong" aria-hidden="true" />
                        {streakFreezeItem.priceCoins}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end border-t border-border pt-5">
                    <Button
                      type="button"
                      className="rounded-full px-6 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={pendingPurchaseCode != null || store.wallet.coinBalance < streakFreezeItem.priceCoins}
                      onClick={() => void handlePurchase(streakFreezeItem)}
                    >
                      {pendingPurchaseCode === streakFreezeItem.code
                        ? 'Buying...'
                        : store.wallet.coinBalance < streakFreezeItem.priceCoins
                          ? 'Not enough coins'
                          : 'Buy one freeze'}
                    </Button>
                  </div>
                </section>
              ) : null}

              <section id="themes" className="scroll-mt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-text-subtle">Themes</p>
                    <h2 className="mt-2 text-2xl font-semibold text-text">Reading rooms</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
                      Select the free defaults now, or unlock another palette with coins before using it.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 self-start rounded-full bg-surface-muted px-3 py-1.5 text-sm font-medium text-text-muted sm:self-auto">
                    <Paintbrush size={15} className="text-brand-strong" aria-hidden="true" />
                    {themes.length} available
                  </span>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {themes.map((theme) => {
                    const storeItem = themeStoreItems.get(theme.code);
                    const palette = getThemePalette(theme.code);
                    const isActivePalette = themeCode === theme.code;
                    const isPurchasing = storeItem != null && pendingPurchaseCode === storeItem.code;
                    const isSelecting = pendingSelectionCode === theme.code;
                    const canSelect = theme.unlocked && palette != null && !theme.selected && !isSelecting;
                    const canBuy = storeItem != null
                      && !storeItem.owned
                      && store.wallet.coinBalance >= storeItem.priceCoins
                      && pendingPurchaseCode == null;

                    return (
                      <article
                        key={theme.code}
                        className="flex min-w-0 flex-col rounded-[24px] border border-border bg-surface p-4 shadow-[0_12px_28px_rgba(31,41,55,0.05)]"
                      >
                        <ThemeSwatches themeCode={theme.code} />

                        <div className="mt-4 flex min-w-0 flex-1 flex-col">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">
                                {theme.priceCoins === 0 ? 'Free theme' : `${theme.tone.toLowerCase()} theme`}
                              </p>
                              <h3 className="mt-1 text-xl font-semibold text-text">{theme.name}</h3>
                            </div>

                            <div className="flex flex-wrap justify-end gap-1.5">
                              {isActivePalette ? (
                                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-strong">
                                  Active
                                </span>
                              ) : null}
                              {theme.selected ? (
                                <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-strong">
                                  Selected
                                </span>
                              ) : null}
                              {!theme.unlocked ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-muted">
                                  <LockKeyhole size={12} aria-hidden="true" />
                                  Locked
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <p className="mt-3 flex-1 text-sm leading-relaxed text-text-muted">
                            {theme.description}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                            <div className="text-sm font-medium text-text-muted">
                              {storeItem && !storeItem.owned ? (
                                <span className="inline-flex items-center gap-1.5 tabular-nums">
                                  <Coins size={15} className="text-accent-strong" aria-hidden="true" />
                                  {storeItem.priceCoins}
                                </span>
                              ) : theme.unlocked ? (
                                <span className="inline-flex items-center gap-1.5 text-brand-strong">
                                  <Check size={15} aria-hidden="true" />
                                  Unlocked
                                </span>
                              ) : (
                                'Store item unavailable'
                              )}
                            </div>

                            {!theme.unlocked && storeItem ? (
                              <Button
                                type="button"
                                className="rounded-full px-5 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={!canBuy}
                                onClick={() => void handlePurchase(storeItem)}
                              >
                                {isPurchasing
                                  ? 'Unlocking...'
                                  : store.wallet.coinBalance < storeItem.priceCoins
                                    ? 'Not enough coins'
                                    : 'Unlock'}
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant={theme.selected ? 'outline' : 'primary'}
                                className="rounded-full px-5 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={!canSelect}
                                onClick={() => void handleThemeSelection(theme)}
                              >
                                {theme.selected
                                  ? 'Selected'
                                  : isSelecting
                                    ? 'Selecting...'
                                    : palette
                                      ? 'Use theme'
                                      : 'Unsupported'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            </main>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
