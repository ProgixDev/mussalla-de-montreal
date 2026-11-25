"use client";

import { useRef, useState } from "react";
import { usePortal } from "@/lib/portal/store";
import { toThumbnail } from "@/lib/portal/image";
import { totalPoints, validatePointEntry } from "@/core/portal/derive";
import type {
  AttendanceStatus,
  Child,
  CongratulationScope,
  PointCategory,
  StickerKind,
} from "@/core/portal/types";
import { formatDateTime, formatDay, formatDayLong } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/portal/dialog";
import {
  EmptyNote,
  Field,
  Panel,
  Pill,
  STICKER_LABELS,
  Segmented,
  StarAvatar,
  Sticker,
  btn,
  describedBy,
  inputCls,
} from "@/components/portal/kit";
import {
  DemoNote,
  MushafPage,
  POINT_CATEGORY_LABELS,
  PointsBadge,
  SpaceHeading,
  SpaceTabs,
  todayIso,
  usePersonName,
  type SpaceProps,
} from "../shared";

type Tab = "classe" | "presences" | "devoirs" | "messages" | "felicitations" | "delegation";

export function TeacherSpace({ me }: SpaceProps) {
  const [tab, setTab] = useState<Tab>("classe");
  const classes = usePortal((s) => s.classes);
  const delegations = usePortal((s) => s.delegations);
  // Own classes + classes delegated to me right now (§4.7: access limited to the delegation).
  const nowIso = new Date().toISOString();
  const delegatedIds = delegations
    .filter(
      (d) =>
        d.toTeacherId === me.id && d.status === "active" && d.from <= nowIso && nowIso <= d.until,
    )
    .map((d) => d.classId);
  const myClasses = classes.filter((c) => c.teacherId === me.id || delegatedIds.includes(c.id));
  const [classId, setClassId] = useState(myClasses[0]?.id ?? "");
  const cls = myClasses.find((c) => c.id === classId) ?? myClasses[0];
  const pendingCongrats = usePortal((s) => s.congratulations).filter(
    (c) => c.proposedBy === me.id && c.status === "submitted",
  ).length;

  if (!cls) {
    return (
      <>
        <SpaceHeading eyebrow="Espace enseignant" title={`Salam, ${me.firstName}`} />
        <EmptyNote>Aucune classe ne vous est attribuée pour le moment.</EmptyNote>
      </>
    );
  }

  return (
    <>
      <SpaceHeading eyebrow="Espace enseignant" title={cls.title}>
        {cls.schedule} · {cls.room}. Vous ne voyez que vos classes ; les finances et les autres
        classes ne sont pas accessibles depuis cet espace.
      </SpaceHeading>
      {myClasses.length > 1 && (
        <Segmented
          name="classe"
          label="Classe"
          className="mb-5"
          value={cls.id}
          onChange={setClassId}
          options={myClasses.map((c) => ({ value: c.id, label: c.title }))}
        />
      )}
      <SpaceTabs
        label="Outils de la classe"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "classe", label: "Ma classe" },
          { id: "presences", label: "Présences" },
          { id: "devoirs", label: "Devoirs" },
          { id: "messages", label: "Messages" },
          { id: "felicitations", label: "Félicitations", badge: pendingCongrats },
          { id: "delegation", label: "Délégation" },
        ]}
      />
      {tab === "classe" && <Roster classId={cls.id} me={me.id} />}
      {tab === "presences" && <Attendance classId={cls.id} me={me.id} />}
      {tab === "devoirs" && <HomeworkTab classId={cls.id} />}
      {tab === "messages" && <MessagesTab classId={cls.id} me={me.id} />}
      {tab === "felicitations" && <CongratsTab classId={cls.id} me={me.id} />}
      {tab === "delegation" && <DelegationTab classId={cls.id} me={me.id} />}
    </>
  );
}

// ── Ma classe: points & stickers ──────────────────────────────────────────
function Roster({ classId, me }: { classId: string; me: string }) {
  const children = usePortal((s) => s.children).filter((c) => c.classId === classId);
  const points = usePortal((s) => s.points);
  const awards = usePortal((s) => s.awards);
  const [active, setActive] = useState<Child | null>(null);

  return (
    <>
      <p className="text-on-dark-muted mb-4 text-[14px]">
        Touchez un enfant pour donner des points ou un sticker.
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {children.map((c) => {
          const total = totalPoints(points, c.id);
          const badges = awards.filter((a) => a.childId === c.id);
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setActive(c)}
                className="border-gold/15 hover:border-gold/55 focus-visible:outline-gold-light flex h-full w-full flex-col items-center rounded-[18px] border bg-white/[0.035] p-4 text-center transition hover:-translate-y-0.5 focus-visible:outline-2"
              >
                <StarAvatar name={c.firstName} seed={c.avatar} size={56} />
                <span className="text-on-dark mt-3 text-[15px] font-medium">{c.firstName}</span>
                <span className="nums font-display text-gold-light mt-1 text-[24px] leading-none">
                  {total}
                </span>
                <span className="text-on-dark-faint text-[12px]">points</span>
                {badges.length > 0 && (
                  <span className="mt-2 flex -space-x-2" aria-label={`${badges.length} badge(s)`}>
                    {badges.slice(0, 3).map((b) => (
                      <Sticker key={b.id} kind={b.kind} size={26} />
                    ))}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {active && (
        <PointsDialog child={active} classId={classId} me={me} onClose={() => setActive(null)} />
      )}
    </>
  );
}

const QUICK = [1, 2, 5, 10, -1, -2];

function PointsDialog({
  child,
  classId,
  me,
  onClose,
}: {
  child: Child;
  classId: string;
  me: string;
  onClose: () => void;
}) {
  const addPoint = usePortal((s) => s.addPoint);
  const addAward = usePortal((s) => s.addAward);
  const recent = usePortal((s) => s.points)
    .filter((p) => p.childId === child.id)
    .slice(0, 4);
  const [category, setCategory] = useState<PointCategory | "">("");
  const [value, setValue] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState("");
  const [sticker, setSticker] = useState<StickerKind>("etoile");
  const [stickerLabel, setStickerLabel] = useState("");

  const submit = () => {
    const errs = validatePointEntry({ category, points: value, reason });
    setErrors(errs);
    if (errs.length || !category) return;
    addPoint({
      childId: child.id,
      classId,
      category,
      points: value,
      reason: reason.trim(),
      teacherId: me,
    });
    setDone(
      `${value > 0 ? "+" : "−"}${Math.abs(value)} en ${POINT_CATEGORY_LABELS[category].toLowerCase()} pour ${child.firstName}.`,
    );
    setValue(0);
    setReason("");
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Points de ${child.firstName}`}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn("ghost")}>
            Fermer
          </button>
          <button type="button" onClick={submit} className={btn("gold")}>
            Enregistrer les points
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <Segmented
          name="categorie"
          label="Catégorie"
          value={category}
          onChange={(v) => setCategory(v)}
          options={(Object.keys(POINT_CATEGORY_LABELS) as PointCategory[]).map((k) => ({
            value: k,
            label: POINT_CATEGORY_LABELS[k],
          }))}
        />
        <fieldset>
          <legend className="text-on-dark mb-1.5 text-[13.5px] font-medium">Points</legend>
          <div className="flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                aria-pressed={value === q}
                onClick={() => setValue(q)}
                className={cn(
                  "nums min-h-11 min-w-14 rounded-full border px-3 text-[15px] font-semibold transition",
                  value === q
                    ? q > 0
                      ? "border-gold bg-gold text-ink"
                      : "text-night border-[#e07a5f] bg-[#e07a5f]"
                    : q > 0
                      ? "border-gold/30 text-gold-light hover:border-gold/70"
                      : "border-[#e07a5f]/40 text-[#ffb9a6] hover:border-[#e07a5f]",
                )}
              >
                {q > 0 ? `+${q}` : `−${Math.abs(q)}`}
              </button>
            ))}
          </div>
        </fieldset>
        <Field
          id="pt-reason"
          label="Justification"
          required
          hint="Visible par le parent. Exemple : « Sourate Al-Mulk récitée sans faute »"
        >
          <textarea
            {...describedBy("pt-reason", undefined, true)}
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={inputCls}
          />
        </Field>
        {errors.length > 0 && (
          <ul
            role="alert"
            className="space-y-1 rounded-[12px] bg-[#c2553a]/15 px-4 py-3 text-[13.5px] text-[#ffb9a6]"
          >
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        {done && (
          <p
            role="status"
            className="bg-gold/12 text-gold-light rounded-[12px] px-4 py-3 text-[13.5px]"
          >
            Enregistré : {done}
          </p>
        )}

        <div className="border-gold/10 border-t pt-5">
          <p className="text-on-dark mb-2 text-[13.5px] font-medium">Donner un sticker</p>
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(STICKER_LABELS) as StickerKind[]).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={sticker === k}
                aria-label={STICKER_LABELS[k]}
                onClick={() => setSticker(k)}
                className={cn(
                  "rounded-full p-1 transition",
                  sticker === k ? "ring-gold ring-2" : "opacity-70 hover:opacity-100",
                )}
              >
                <Sticker kind={k} size={42} />
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <Field id="st-label" label="Libellé" className="min-w-0 flex-1">
              <input
                id="st-label"
                value={stickerLabel}
                onChange={(e) => setStickerLabel(e.target.value)}
                placeholder={`${STICKER_LABELS[sticker]} de la semaine`}
                className={inputCls}
              />
            </Field>
            <button
              type="button"
              className={btn("subtle")}
              onClick={() => {
                addAward({
                  childId: child.id,
                  kind: sticker,
                  label: stickerLabel.trim() || `${STICKER_LABELS[sticker]} de la semaine`,
                  teacherId: me,
                });
                setDone(
                  `sticker « ${stickerLabel.trim() || STICKER_LABELS[sticker]} » pour ${child.firstName}.`,
                );
                setStickerLabel("");
              }}
            >
              Donner
            </button>
          </div>
        </div>

        {recent.length > 0 && (
          <div className="border-gold/10 border-t pt-4">
            <p className="text-on-dark-faint mb-2 text-[12.5px]">
              Dernières entrées (jamais modifiées — une correction ajoute une ligne)
            </p>
            <ul className="space-y-2">
              {recent.map((p) => (
                <li key={p.id} className="text-on-dark-muted flex items-center gap-3 text-[13.5px]">
                  <PointsBadge points={p.points} className="min-w-10 text-[12.5px]" />
                  <span className="truncate">{p.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Dialog>
  );
}

// ── Présences ─────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Présent",
  late: "En retard",
  absent: "Absent",
  excused: "Excusé",
  left_early: "Parti tôt",
};

function Attendance({ classId, me }: { classId: string; me: string }) {
  const children = usePortal((s) => s.children).filter((c) => c.classId === classId);
  const records = usePortal((s) => s.attendance);
  const setAttendance = usePortal((s) => s.setAttendance);
  const addPoint = usePortal((s) => s.addPoint);
  const points = usePortal((s) => s.points);
  const day = todayIso();
  const today = records.filter((r) => r.classId === classId && r.date === day);
  const counts = (Object.keys(STATUS_LABELS) as AttendanceStatus[]).map(
    (s) => [s, today.filter((r) => r.status === s).length] as const,
  );

  return (
    <Panel eyebrow={formatDayLong(day)} title="Présences de la séance">
      <p className="text-on-dark-muted mb-4 text-[13.5px]">
        {counts
          .filter(([, n]) => n > 0)
          .map(([s, n]) => `${n} ${STATUS_LABELS[s].toLowerCase()}`)
          .join(" · ") || "Aucune présence saisie pour l’instant."}
      </p>
      <ul className="divide-y divide-white/[0.06]">
        {children.map((c) => {
          const rec = today.find((r) => r.childId === c.id);
          const bonusGiven = points.some(
            (p) =>
              p.childId === c.id &&
              p.category === "ponctualite" &&
              p.at.slice(0, 10) === new Date().toISOString().slice(0, 10),
          );
          return (
            <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
              <StarAvatar name={c.firstName} seed={c.avatar} size={36} />
              <span className="text-on-dark w-24 text-[15px]">{c.firstName}</span>
              <div
                className="flex flex-wrap gap-1.5"
                role="radiogroup"
                aria-label={`Présence de ${c.firstName}`}
              >
                {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={rec?.status === s}
                    onClick={() => setAttendance(classId, c.id, day, s, rec?.early)}
                    className={cn(
                      "min-h-9 rounded-full border px-3 text-[13px] transition",
                      rec?.status === s
                        ? "border-gold/70 bg-gold/15 text-gold-light"
                        : "border-on-dark/15 text-on-dark-muted hover:border-on-dark/35",
                    )}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              {rec?.status === "present" && (
                <label className="text-on-dark-muted ml-auto flex items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    checked={Boolean(rec.early)}
                    onChange={(e) => setAttendance(classId, c.id, day, "present", e.target.checked)}
                    className="size-4 accent-[#d9bd77]"
                  />
                  Arrivé en avance
                </label>
              )}
              {rec?.status === "present" && rec.early && !bonusGiven && (
                <button
                  type="button"
                  className={btn("subtle", "sm")}
                  onClick={() =>
                    addPoint({
                      childId: c.id,
                      classId,
                      category: "ponctualite",
                      points: 2,
                      reason: "Arrivée en avance",
                      teacherId: me,
                    })
                  }
                >
                  +2 ponctualité
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <DemoNote>
        Une arrivée à l’heure ou en avance peut rapporter un point de ponctualité. Un retard n’est
        jamais transformé en sanction automatiquement : c’est l’enseignant qui décide (cahier des
        charges §4.3).
      </DemoNote>
    </Panel>
  );
}

// ── Devoirs ───────────────────────────────────────────────────────────────
function HomeworkTab({ classId }: { classId: string }) {
  const homework = usePortal((s) => s.homework).filter((h) => h.classId === classId);
  const addHomework = usePortal((s) => s.addHomework);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [pages, setPages] = useState("");
  const [due, setDue] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ok, setOk] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const next = await Promise.all([...files].slice(0, 4).map((f) => toThumbnail(f)));
      setPhotos((p) => [...p, ...next].slice(0, 4));
    } catch {
      setErrors((e) => ({
        ...e,
        photos: "Cette image n’a pas pu être lue. Essayez une photo JPEG ou PNG.",
      }));
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    const e: Record<string, string> = {};
    if (title.trim().length < 3) e.title = "Donnez un titre au devoir.";
    if (!due) e.due = "Choisissez la date de remise.";
    const pageList = pages
      .split(/[\s,;]+/)
      .filter(Boolean)
      .map(Number);
    if (pageList.some((n) => !Number.isInteger(n) || n <= 0))
      e.pages = "Écrivez des numéros de page séparés par des virgules, par exemple 6, 7, 8.";
    setErrors(e);
    if (Object.keys(e).length) return;
    addHomework({
      classId,
      title: title.trim(),
      instructions: instructions.trim(),
      pages: pageList,
      due,
      photos,
    });
    setOk(`« ${title.trim()} » est publié aux parents.`);
    setTitle("");
    setInstructions("");
    setPages("");
    setDue("");
    setPhotos([]);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
      <Panel eyebrow="Nouveau devoir" title="Publier aux parents">
        <div className="space-y-4">
          <Field id="hw-title" label="Titre" required error={errors.title}>
            <input
              {...describedBy("hw-title", errors.title)}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field
            id="hw-ins"
            label="Consigne"
            hint="Exemple : réviser 10 minutes par jour, on récite samedi."
          >
            <textarea
              {...describedBy("hw-ins", undefined, true)}
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className={inputCls}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="hw-pages" label="Pages à réviser" hint="6, 7, 8" error={errors.pages}>
              <input
                {...describedBy("hw-pages", errors.pages, true)}
                inputMode="numeric"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field id="hw-due" label="À remettre le" required error={errors.due}>
              <input
                {...describedBy("hw-due", errors.due)}
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field
            id="hw-photos"
            label="Photos des pages"
            hint="Prenez les pages en photo : les parents les verront dans le devoir (4 au maximum)."
            error={errors.photos}
          >
            <input
              ref={fileRef}
              {...describedBy("hw-photos", errors.photos, true)}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={(e) => void onFiles(e.target.files)}
              className="text-on-dark-muted file:text-on-dark text-[14px] file:mr-3 file:rounded-full file:border-0 file:bg-white/[0.08] file:px-4 file:py-2"
            />
          </Field>
          {(photos.length > 0 || busy) && (
            <div className="flex flex-wrap gap-2">
              {photos.map((src, i) => (
                <span key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a just-taken photo */}
                  <img
                    src={src}
                    alt={`Photo ${i + 1}`}
                    className="border-gold/20 h-20 w-auto rounded-[8px] border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                    aria-label={`Retirer la photo ${i + 1}`}
                    className="bg-night text-on-dark ring-gold/40 absolute -top-2 -right-2 size-6 rounded-full text-[13px] ring-1"
                  >
                    ×
                  </button>
                </span>
              ))}
              {busy && (
                <span className="text-on-dark-faint text-[13px]">Préparation des photos…</span>
              )}
            </div>
          )}
          <button type="button" onClick={submit} className={btn("gold")}>
            Publier le devoir
          </button>
          {ok && (
            <p role="status" className="text-gold-light text-[13.5px]">
              {ok}
            </p>
          )}
        </div>
      </Panel>
      <div className="space-y-4">
        {homework.length === 0 ? (
          <EmptyNote>Aucun devoir publié.</EmptyNote>
        ) : (
          homework.map((h) => (
            <Panel key={h.id} eyebrow={`Pour le ${formatDay(h.due)}`} title={h.title}>
              <p className="text-on-dark-muted text-[14px]">{h.instructions}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {h.photos?.length
                  ? h.photos.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element -- local data-URL thumbnails (demo)
                      <img
                        key={i}
                        src={src}
                        alt={`Photo ${i + 1}`}
                        className="border-gold/20 h-20 w-auto rounded-[8px] border object-cover"
                      />
                    ))
                  : h.pages.map((p) => <MushafPage key={p} page={p} className="h-20 w-auto" />)}
              </div>
            </Panel>
          ))
        )}
      </div>
    </div>
  );
}

// ── Messages ──────────────────────────────────────────────────────────────
function MessagesTab({ classId, me }: { classId: string; me: string }) {
  const children = usePortal((s) => s.children).filter((c) => c.classId === classId);
  const messages = usePortal((s) => s.messages).filter((m) => m.authorId === me);
  const addMessage = usePortal((s) => s.addMessage);
  const name = usePersonName();
  const [scope, setScope] = useState<"enfant" | "classe">("classe");
  const [target, setTarget] = useState(children[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const send = () => {
    if (title.trim().length < 2 || body.trim().length < 5) {
      setErr("Écrivez un titre et un message d’au moins quelques mots.");
      return;
    }
    setErr("");
    addMessage({
      scope,
      targetId: scope === "classe" ? classId : target,
      authorId: me,
      title: title.trim(),
      body: body.trim(),
    });
    setOk(
      scope === "classe"
        ? "Message envoyé à toute la classe."
        : `Message envoyé au parent de ${name(target)}.`,
    );
    setTitle("");
    setBody("");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
      <Panel eyebrow="Écrire" title="Nouveau message">
        <div className="space-y-4">
          <Segmented
            name="scope"
            label="Destinataires"
            value={scope}
            onChange={setScope}
            options={[
              { value: "classe", label: "Toute la classe" },
              { value: "enfant", label: "Un enfant (son parent)" },
            ]}
          />
          {scope === "enfant" && (
            <Field id="msg-child" label="Enfant">
              <select
                id="msg-child"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className={inputCls}
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field id="msg-title" label="Titre" required>
            <input
              id="msg-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field id="msg-body" label="Message" required error={err}>
            <textarea
              {...describedBy("msg-body", err)}
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={inputCls}
            />
          </Field>
          <button type="button" onClick={send} className={btn("gold")}>
            Envoyer
          </button>
          {ok && (
            <p role="status" className="text-gold-light text-[13.5px]">
              {ok}
            </p>
          )}
          <DemoNote>
            Les messages à toute l’école et les alertes urgentes sont réservés à l’administration.
          </DemoNote>
        </div>
      </Panel>
      <Panel eyebrow="Envoyés" title="Vos messages">
        {messages.length === 0 ? (
          <EmptyNote>Aucun message envoyé.</EmptyNote>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => (
              <li key={m.id} className="rounded-[14px] bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={m.scope === "classe" ? "emerald" : "neutral"}>
                    {m.scope === "classe" ? "Classe" : name(m.targetId ?? "")}
                  </Pill>
                  <span className="text-on-dark-faint text-[12px]">{formatDateTime(m.at)}</span>
                </div>
                <p className="text-on-dark mt-2 text-[14.5px] font-medium">{m.title}</p>
                <p className="text-on-dark-muted text-[14px]">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

// ── Félicitations ─────────────────────────────────────────────────────────
const SCOPE_LABELS: Record<CongratulationScope, string> = {
  enfant_du_jour: "Enfant du jour",
  enfant_de_la_semaine: "Enfant de la semaine",
  groupe_de_la_semaine: "Groupe de la semaine",
};
const STATUS_TONE = { submitted: "warn", approved: "emerald", rejected: "danger" } as const;
const STATUS_TEXT = {
  submitted: "En attente d’approbation",
  approved: "Approuvée — sur les écrans",
  rejected: "Refusée",
} as const;

function CongratsTab({ classId, me }: { classId: string; me: string }) {
  const children = usePortal((s) => s.children).filter((c) => c.classId === classId);
  const classes = usePortal((s) => s.classes);
  const mine = usePortal((s) => s.congratulations).filter((c) => c.proposedBy === me);
  const propose = usePortal((s) => s.proposeCongratulation);
  const name = usePersonName();
  const [scope, setScope] = useState<CongratulationScope>("enfant_de_la_semaine");
  const [childId, setChildId] = useState("");
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const cls = classes.find((c) => c.id === classId);
  const canShow = (c: Child) =>
    c.consents.find((x) => x.type === "screen_display")?.granted ?? false;

  const submit = () => {
    if (scope !== "groupe_de_la_semaine" && !childId)
      return setErr("Choisissez l’enfant à féliciter.");
    if (message.trim().length < 5)
      return setErr("Écrivez pourquoi, en une phrase : c’est ce qui sera affiché.");
    setErr("");
    const child = children.find((c) => c.id === childId);
    const from = new Date();
    const until = new Date(from.getTime() + (scope === "enfant_du_jour" ? 1 : 7) * 86_400_000);
    propose({
      scope,
      childId: scope === "groupe_de_la_semaine" ? undefined : childId,
      classId: scope === "groupe_de_la_semaine" ? classId : undefined,
      title:
        scope === "groupe_de_la_semaine"
          ? (cls?.title ?? "Le groupe")
          : `Bravo ${child?.firstName ?? ""} !`,
      message: message.trim(),
      proposedBy: me,
      displayFrom: from.toISOString(),
      displayUntil: until.toISOString(),
    });
    setOk(
      "Proposition envoyée à l’administration. Elle passera sur les écrans une fois approuvée.",
    );
    setMessage("");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
      <Panel eyebrow="Proposer" title="Un bravo sur les écrans">
        <div className="space-y-4">
          <Segmented
            name="scope"
            label="Type"
            value={scope}
            onChange={setScope}
            options={(Object.keys(SCOPE_LABELS) as CongratulationScope[]).map((k) => ({
              value: k,
              label: SCOPE_LABELS[k],
            }))}
          />
          {scope !== "groupe_de_la_semaine" && (
            <fieldset>
              <legend className="text-on-dark mb-1.5 text-[13.5px] font-medium">Enfant</legend>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {children.map((c) => {
                  const allowed = canShow(c);
                  return (
                    <li key={c.id}>
                      <label
                        className={cn(
                          "flex min-h-12 items-center gap-2 rounded-[12px] border px-2.5 py-1.5 text-[14px]",
                          !allowed && "cursor-not-allowed opacity-55",
                          childId === c.id
                            ? "border-gold/70 bg-gold/12 text-gold-light"
                            : "border-on-dark/15 text-on-dark",
                        )}
                      >
                        <input
                          type="radio"
                          name="congrats-child"
                          value={c.id}
                          disabled={!allowed}
                          checked={childId === c.id}
                          onChange={() => setChildId(c.id)}
                          className="sr-only"
                        />
                        <StarAvatar name={c.firstName} seed={c.avatar} size={28} />
                        <span className="leading-tight">
                          {c.firstName}
                          {!allowed && (
                            <span className="text-on-dark-faint block text-[11px]">
                              pas d’autorisation écran
                            </span>
                          )}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          )}
          <Field
            id="cg-msg"
            label="Pourquoi ?"
            required
            hint="Affiché sur la télévision. Exemple : « Pour sa belle récitation de la sourate Al-Mulk »."
            error={err}
          >
            <textarea
              {...describedBy("cg-msg", err, true)}
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={inputCls}
            />
          </Field>
          <button type="button" onClick={submit} className={btn("gold")}>
            Envoyer pour approbation
          </button>
          {ok && (
            <p role="status" className="text-gold-light text-[13.5px]">
              {ok}
            </p>
          )}
        </div>
      </Panel>
      <Panel eyebrow="Vos propositions" title="Suivi">
        {mine.length === 0 ? (
          <EmptyNote>Aucune proposition.</EmptyNote>
        ) : (
          <ul className="space-y-3">
            {mine.map((c) => (
              <li key={c.id} className="rounded-[14px] bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-on-dark-faint text-[12.5px]">{SCOPE_LABELS[c.scope]}</span>
                  <Pill tone={STATUS_TONE[c.status]}>{STATUS_TEXT[c.status]}</Pill>
                </div>
                <p className="font-display text-gold-light mt-2 text-[19px]">{c.title}</p>
                <p className="text-on-dark-muted text-[14px]">{c.message}</p>
                {c.approvedBy && (
                  <p className="text-on-dark-faint mt-1 text-[12px]">
                    Décision : {name(c.approvedBy)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

// ── Délégation temporaire (§4.7) ──────────────────────────────────────────
function DelegationTab({ classId, me }: { classId: string; me: string }) {
  const persons = usePortal((s) => s.persons);
  const delegations = usePortal((s) => s.delegations).filter((d) => d.classId === classId);
  const addDelegation = usePortal((s) => s.addDelegation);
  const revoke = usePortal((s) => s.revokeDelegation);
  const name = usePersonName();
  const teachers = persons.filter(
    (p) => p.role === "teacher" && p.id !== me && !p.profiles.includes("imam"),
  );
  const [to, setTo] = useState(teachers[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const now = new Date().toISOString();

  const submit = () => {
    if (!to || reason.trim().length < 3 || !from || !until)
      return setErr("Remplissez le remplaçant, le motif, le début et la fin.");
    if (until <= from) return setErr("La fin doit être après le début.");
    setErr("");
    addDelegation({
      classId,
      fromTeacherId: me,
      toTeacherId: to,
      reason: reason.trim(),
      from: new Date(from).toISOString(),
      until: new Date(until).toISOString(),
    });
    setOk(
      `${name(to)} aura accès à cette classe — et seulement à elle — pendant la période choisie.`,
    );
    setReason("");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
      <Panel eyebrow="Absence prévue" title="Déléguer ma classe">
        <div className="space-y-4">
          <Field id="dg-to" label="Enseignant remplaçant" required>
            <select
              id="dg-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={inputCls}
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </select>
          </Field>
          <Field id="dg-reason" label="Motif" required>
            <input
              id="dg-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={inputCls}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="dg-from" label="Début" required>
              <input
                id="dg-from"
                type="datetime-local"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field id="dg-until" label="Fin" required error={err}>
              <input
                {...describedBy("dg-until", err)}
                type="datetime-local"
                value={until}
                onChange={(e) => setUntil(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <button type="button" onClick={submit} className={btn("gold")}>
            Déléguer
          </button>
          {ok && (
            <p role="status" className="text-gold-light text-[13.5px]">
              {ok}
            </p>
          )}
          <DemoNote>
            La délégation expire seule à la date de fin ; tout ce que fait le remplaçant est tracé à
            son nom.
          </DemoNote>
        </div>
      </Panel>
      <Panel eyebrow="Historique" title="Délégations de la classe">
        {delegations.length === 0 ? (
          <EmptyNote>Aucune délégation.</EmptyNote>
        ) : (
          <ul className="space-y-3">
            {delegations.map((d) => {
              const live = d.status === "active" && now <= d.until;
              return (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-white/[0.03] p-4"
                >
                  <div>
                    <p className="text-on-dark text-[14.5px]">
                      {name(d.fromTeacherId)} → {name(d.toTeacherId)}
                    </p>
                    <p className="text-on-dark-muted text-[13px]">{d.reason}</p>
                    <p className="text-on-dark-faint text-[12px]">
                      {formatDateTime(d.from)} → {formatDateTime(d.until)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone={live ? "emerald" : d.status === "revoked" ? "danger" : "neutral"}>
                      {live ? "Active" : d.status === "revoked" ? "Révoquée" : "Expirée"}
                    </Pill>
                    {live && (
                      <button
                        type="button"
                        onClick={() => revoke(d.id)}
                        className={btn("ghost", "sm")}
                      >
                        Révoquer
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
