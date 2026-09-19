import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowDown, ArrowUp, Check, LogIn, LogOut, Shuffle } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Markdown } from '@/components/markdown';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar } from '../game/avatar';
import {
  joinSession,
  clearPlayerSession,
  loadAvatarSeed,
  loadNickname,
  loadPlayerSession,
  saveAvatarSeed,
} from '../game/game-client';
import {
  AnswerExplanation,
  AnswerRules,
  OptionGrid,
  SlideView,
  TYPE_BASE,
} from '../game/live-components';
import { cn } from '@/lib/utils';
import { Surface } from '../game/surface';
import { RatingPanel } from '../game/rating-panel';
import { useCountdown, useGameRemaining } from '../game/use-countdown';
import { useGameSession } from '../game/use-game-session';

/**
 * Client participant (mobile, §5). Machine à états pilotée par `useGameSession` :
 * une session locale relance la partie (`player:reconnect`), sinon l'écran de join
 * (pseudo) s'affiche (§6.1). Après le join, on suit l'état serveur (attente →
 * réponse → feedback → podium), grille verrouillée à 1 réponse (RG-06).
 */
export function PlayerPage() {
  const { t } = useTranslation('live');
  const { pin } = useParams({ from: '/join/$pin' });
  const { view, socket, markJoined } = useGameSession(pin, 'player');
  const [nickname, setNickname] = useState(() => loadPlayerSession()?.nickname ?? loadNickname());
  const [joining, setJoining] = useState(false);
  // Leaving on purpose: the seat and the score are gone, so it is confirmed first.
  const [confirmLeave, setConfirmLeave] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [freeValue, setFreeValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  // Graine d'avatar persistée localement (réinjectée d'une partie à l'autre).
  const [avatarSeed, setAvatarSeed] = useState(() => loadAvatarSeed() ?? '');

  const question = view.question;
  const isMulti = question?.type === 'multiple_choice';
  const remaining = useGameRemaining(view);
  // Délai de lecture (§6/§8) : la fenêtre de réponse n'ouvre qu'à `startedAt`. Avant,
  // une réponse serait rejetée par le serveur (« trop tôt ») sans être comptée — on
  // bloque donc la saisie pendant la lecture pour ne jamais perdre de réponse.
  const readingLeft = useCountdown(question ? question.startedAt : null);
  const reading = readingLeft !== null && readingLeft > 0;
  // Avatar affiché : graine choisie, sinon dérivée du pseudo.
  const avatarName = avatarSeed || nickname || '?';

  // Graine déjà synchronisée vers le serveur (pour n'émettre que sur changement réel).
  const [syncedSeed, setSyncedSeed] = useState(avatarSeed);

  /**
   * Randomise l'avatar **localement** uniquement (aperçu + mémorisation) : pas
   * d'émission réseau ici, pour éviter d'inonder le serveur/animateur à chaque clic.
   * La synchronisation se fait explicitement via « Enregistrer l'avatar ».
   */
  const randomizeAvatar = () => {
    const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    setAvatarSeed(seed);
    saveAvatarSeed(seed);
  };

  /** Synchronise l'avatar choisi vers la room (refusé côté serveur après le démarrage). */
  const commitAvatar = () => {
    socket?.emit('player:avatar', { pin, avatar: avatarName });
    setSyncedSeed(avatarSeed);
  };

  // Nouvelle question → réinitialise la saisie locale.
  useEffect(() => {
    setSelected([]);
    setFreeValue('');
    setSubmitted(false);
  }, [view.questionIndex]);
  // L'ordre de départ suit l'arrivée de la question (remise en ordre).
  useEffect(() => {
    setOrder(question?.options?.map((o) => o.id) ?? []);
  }, [question]);

  const onJoin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setJoining(true);
    try {
      await joinSession(pin, nickname.trim(), avatarSeed || undefined);
      markJoined();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('player.joinFailed'));
    } finally {
      setJoining(false);
    }
  };

  const submit = (answer: string | string[] | number) => {
    setSubmitted(true);
    socket?.emit('player:submit', { pin, questionIndex: view.questionIndex, answer });
  };

  // QCM unique / V-F / sondage : le tap soumet ; multi-réponses : le tap (dé)sélectionne,
  // la soumission attend le bouton « Valider » (sinon on perdrait au 1ᵉʳ clic — RG-06).
  const onPick = (optionId: string) => {
    if (isMulti) {
      setSelected((prev) =>
        prev.includes(optionId) ? prev.filter((x) => x !== optionId) : [...prev, optionId],
      );
    } else {
      setSelected([optionId]);
      submit(optionId);
    }
  };

  const moveOrder = (i: number, dir: -1 | 1) =>
    setOrder((prev) => {
      const next = [...prev];
      const target = i + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });

  /** Widget de réponse selon le type de question (§4/§5.3). */
  const renderAnswerInput = () => {
    if (!question) return <p className="text-muted-foreground">{t('player.waitingQuestion')}</p>;
    const opts = question.options ?? [];

    // Saisie libre : numérique (nombre) ou texte.
    if (question.type === 'numeric' || question.type === 'text_input') {
      const numeric = question.type === 'numeric';
      const valid = numeric
        ? freeValue.trim() !== '' && Number.isFinite(Number(freeValue))
        : freeValue.trim() !== '';
      return (
        <form
          className="flex w-full flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            submit(numeric ? Number(freeValue) : freeValue.trim());
          }}
        >
          <Input
            value={freeValue}
            onChange={(e) => setFreeValue(e.target.value)}
            type={numeric ? 'number' : 'text'}
            inputMode={numeric ? 'decimal' : 'text'}
            placeholder={
              numeric ? t('player.answerNumberPlaceholder') : t('player.answerPlaceholder')
            }
            className="text-center text-lg"
          />
          <Button type="submit" disabled={!valid}>
            {t('player.submitAnswer')}
          </Button>
        </form>
      );
    }

    // Remise en ordre : liste réordonnable (monter/descendre) puis valider.
    if (question.type === 'ordering' && opts.length) {
      const ordered = order.length ? order : opts.map((o) => o.id);
      return (
        <div className="flex w-full flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {ordered.map((id, i) => {
              const o = opts.find((x) => x.id === id);
              if (!o) return null;
              return (
                <li key={id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                  <span className="text-muted-foreground tabular-nums">{i + 1}.</span>
                  <span className="flex-1 text-left">{o.text ?? o.color}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={t('player.moveUp')}
                    disabled={i === 0}
                    onClick={() => moveOrder(i, -1)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={t('player.moveDown')}
                    disabled={i === ordered.length - 1}
                    onClick={() => moveOrder(i, 1)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
          <Button type="button" onClick={() => submit(ordered)}>
            {t('player.submitAnswer')}
          </Button>
        </div>
      );
    }

    // À options (QCM unique/multi, V-F, sondage).
    if (opts.length) {
      return (
        <>
          <OptionGrid options={opts} onPick={onPick} selectedIds={selected} />
          {isMulti ? (
            <Button type="button" disabled={selected.length === 0} onClick={() => submit(selected)}>
              {t('player.submitAnswer')}
            </Button>
          ) : null}
        </>
      );
    }

    return <p className="text-muted-foreground">{t('player.unsupportedType')}</p>;
  };

  // `wide` lets a screen use a laptop's width (the reveal lays out side by side);
  // `center` places the content in the middle of the remaining height.
  const wrap = (children: React.ReactNode, opts: { wide?: boolean; center?: boolean } = {}) => (
    <Surface
      background={view.question?.background}
      textTone={view.question?.textTone}
      textOutline={view.question?.textOutline}
      className={cn(
        '-mx-4 -my-4 min-h-[calc(100dvh-4rem)] px-4 py-4',
        TYPE_BASE.phone,
        !view.question?.background && 'bg-transparent',
      )}
    >
      <section
        className={cn(
          'mx-auto flex w-full flex-1 flex-col items-center gap-[1.5em] py-[1.5em] text-center',
          opts.wide ? 'max-w-[24em] md:max-w-[36em]' : 'max-w-[24em]',
          opts.center && 'min-h-[calc(100dvh-6rem)]',
        )}
      >
        {view.status === 'ready' && view.state !== 'ENDED' && !view.kicked ? (
          <div className="flex w-full items-center gap-[0.5em] text-[0.875em]">
            <Avatar name={avatarName} size="2em" />
            <span className="min-w-0 flex-1 truncate text-left font-medium">{nickname}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setConfirmLeave(true)}
            >
              <LogOut className="size-3.5" />
              {t('player.leave')}
            </Button>
          </div>
        ) : null}
        {opts.center ? (
          <div className="my-auto flex w-full flex-col items-center gap-[1.5em]">{children}</div>
        ) : (
          children
        )}
        <ConfirmDialog
          open={confirmLeave}
          destructive
          title={t('player.leaveConfirmTitle')}
          description={t('player.leaveConfirmDescription')}
          confirmLabel={t('player.leave')}
          onCancel={() => setConfirmLeave(false)}
          onConfirm={() => {
            setConfirmLeave(false);
            clearPlayerSession();
            socket?.disconnect();
            void navigate({ to: '/join' });
          }}
        />
      </section>
    </Surface>
  );

  // ── Écran « Rejoindre » (pas de session locale valide) ─────────────────────
  if (view.status === 'no-session') {
    return wrap(
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('player.yourNickname')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4 text-left" onSubmit={(e) => void onJoin(e)}>
            <div className="flex flex-col items-center gap-2">
              <Avatar name={avatarName} size={88} />
              <Button type="button" variant="outline" size="sm" onClick={randomizeAvatar}>
                <Shuffle className="size-4" />
                {t('player.randomAvatar')}
              </Button>
            </div>
            <Label>
              {t('player.nickname')}
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t('player.nicknamePlaceholder')}
                required
              />
            </Label>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <Button type="submit" disabled={joining || !nickname.trim()}>
              <LogIn className="size-4" />
              {joining ? t('player.connecting') : t('player.letsGo')}
            </Button>
          </form>
        </CardContent>
      </Card>,
    );
  }

  if (view.status === 'connecting') {
    return wrap(<p className="text-muted-foreground">{t('player.connectingToSession')}</p>);
  }

  // Exclu par l'hôte : écran terminal (la session locale a été purgée, pas de reprise).
  if (view.kicked) {
    return wrap(
      <>
        <span className="text-[4.5em] leading-none" aria-hidden>
          🚫
        </span>
        <p className="text-xl font-semibold">{t('player.kickedTitle')}</p>
        <p className="text-muted-foreground">
          {t('player.kickedDescription', { count: view.kicked.minutes })}
        </p>
      </>,
    );
  }

  // ── États de jeu ───────────────────────────────────────────────────────────
  // A slide is projected, not read: it breaks out of the phone column to the whole
  // viewport (width and height under the header), content centred.
  if (view.state === 'SLIDE_SHOW' && view.slide) {
    return (
      <div
        className={cn('-my-4 mx-[calc(50%-50vw)] flex min-h-[calc(100dvh-4rem)]', TYPE_BASE.phone)}
      >
        <SlideView slide={view.slide} />
      </div>
    );
  }
  if (view.state === 'HOST_DISCONNECTED') {
    return wrap(<p className="text-xl font-semibold">{t('player.hostDisconnected')}</p>);
  }
  // Fin de partie (podium ou terminée) : on propose de noter le quiz. Les deux états
  // partagent la même structure pour que le panneau d'avis (et le commentaire en
  // cours de saisie) survive à la transition PODIUM → ENDED déclenchée par l'hôte.
  if (view.state === 'PODIUM' || view.state === 'ENDED') {
    return wrap(
      <>
        {view.state === 'PODIUM' ? (
          <>
            <span className="text-[4.5em] leading-none" aria-hidden>
              🏆
            </span>
            <Avatar name={avatarName} size={72} />
            <h2 className="text-[1.5em] font-bold">{t('player.podium')}</h2>
            {view.podium?.you ? (
              <p className="text-lg">
                {t('player.yourRank')}{' '}
                <span className="font-semibold">
                  {t('player.rankValue', { rank: view.podium.you.rank })}
                </span>{' '}
                {t('player.podiumScore', { score: view.podium.you.score })}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <span className="text-[4.5em] leading-none" aria-hidden>
              🎉
            </span>
            <p className="text-xl font-semibold">{t('player.thanks')}</p>
          </>
        )}
        {view.feedbackEnabled ? <RatingPanel pin={pin} socket={socket} /> : null}
        <Link to="/join" className="text-muted-foreground text-sm underline underline-offset-2">
          {t('player.joinAnother')}
        </Link>
      </>,
    );
  }

  if (view.state === 'REVEAL' || view.state === 'LEADERBOARD') {
    const r = view.result;
    // Classement perso : `you` (du leaderboard) est toujours présent au reveal, même
    // si le joueur n'a pas répondu (pas de `result`). On l'affiche systématiquement.
    const you = view.leaderboard?.you;
    // One column, in reading order: verdict, explanation, then the ranking — with
    // even spacing, centred in the remaining height so nothing floats in a blank.
    return wrap(
      <div className="flex w-full flex-col items-center gap-[1.5em]">
        {r ? (
          <div className="flex flex-col items-center gap-[0.5em]">
            <span
              className={`text-[4.5em] leading-none ${r.correct ? 'text-success' : 'text-destructive'}`}
              aria-hidden
            >
              {r.correct ? '✓' : '✗'}
            </span>
            <p
              className={`text-[2em] font-bold ${r.correct ? 'text-success' : 'text-destructive'}`}
            >
              {r.correct ? t('player.correct') : t('player.wrong')}
            </p>
            <p className="text-[1.25em]">{t('player.points', { points: r.points })}</p>
          </div>
        ) : (
          <p className="text-muted-foreground">{t('player.answersRevealed')}</p>
        )}
        {view.reveal?.answerExplanation ? <AnswerExplanation reveal={view.reveal} /> : null}
        {you ? (
          <p className="w-full border-t pt-[1em] text-[1.5em]">
            {t('player.yourRankShort')}{' '}
            <span className="font-bold">{t('player.rankValue', { rank: you.rank })}</span>
            <span className="text-muted-foreground">
              {t('player.scoreValue', { score: you.score })}
            </span>
          </p>
        ) : r ? (
          <p className="text-muted-foreground">{t('player.rank', { rank: r.rank })}</p>
        ) : null}
      </div>,
      { wide: true, center: true },
    );
  }

  if ((view.state === 'ANSWERING' || view.state === 'QUESTION_SHOW') && question) {
    const done = submitted || view.answerAccepted === true;
    // Layout en 3 zones, identique d'une question à l'autre (UX first) : le chrono
    // reste en haut, l'énoncé occupe le centre et **défile** s'il est long, la zone
    // de réponse est ancrée en bas (position constante, jamais repoussée hors écran).
    return (
      <section
        className={cn(
          'mx-auto flex h-full w-full max-w-[24em] flex-col gap-[0.75em] text-center',
          TYPE_BASE.phone,
        )}
      >
        {remaining !== null ? (
          <span
            className="shrink-0 pt-[0.5em] text-[2.5em] font-bold tabular-nums"
            aria-label={t('player.timeRemaining')}
          >
            ⏱ {remaining}
          </span>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Markdown
            role="heading"
            aria-level={1}
            className="text-[1.25em] font-semibold text-balance"
          >
            {question.prompt}
          </Markdown>
        </div>
        <div className="flex w-full shrink-0 flex-col items-center gap-[0.75em] pb-[0.5em]">
          <AnswerRules question={question} />
          {reading ? (
            <p className="text-muted-foreground text-[1.1em] font-medium">
              {t('player.readQuestion')} <span className="tabular-nums">{readingLeft}</span>
            </p>
          ) : done ? (
            <p className="text-[1.25em] font-semibold">{t('player.answerSaved')}</p>
          ) : (
            renderAnswerInput()
          )}
        </div>
      </section>
    );
  }

  if (view.state === 'ANSWERING' || view.state === 'QUESTION_SHOW') {
    return wrap(<p className="text-muted-foreground">{t('player.waitingQuestion')}</p>);
  }

  // ── LOBBY / attente ──────────────────────────────────────────────────────────
  return wrap(
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('player.inSession')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2">
        <Avatar name={avatarName} size={72} />
        {nickname ? <p className="text-lg font-semibold">« {nickname} »</p> : null}
        {/* Avatar modifiable tant que la partie n'a pas démarré : on randomise en local
            puis on synchronise explicitement (évite d'inonder le serveur à chaque clic). */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={randomizeAvatar}>
            <Shuffle className="size-4" />
            {t('player.randomAvatar')}
          </Button>
          <Button
            type="button"
            size="icon"
            onClick={commitAvatar}
            disabled={avatarSeed === syncedSeed}
            aria-label={t('player.saveAvatar')}
            title={t('player.saveAvatar')}
          >
            <Check className="size-4" />
          </Button>
        </div>
        <p className="text-muted-foreground">{t('player.waitingHost')}</p>
        {view.fullCapture ? (
          <p className="text-muted-foreground border-t pt-2 text-sm">{t('player.captureNotice')}</p>
        ) : null}
      </CardContent>
    </Card>,
  );
}
