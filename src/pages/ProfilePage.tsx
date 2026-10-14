import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { UserIcon } from '../components/icons';

interface ProfileData {
  riotIdName: string;
  riotIdTagline: string;
  region: string;
}

interface ProfileErrors {
  riotIdName?: string;
  riotIdTagline?: string;
  region?: string;
}

const REGIONS = [
  { value: 'na', label: 'North America (NA)' },
  { value: 'ap', label: 'Asia Pacific (AP)' },
  { value: 'br', label: 'Brazil (BR)' },
  { value: 'eu', label: 'Europe (EU)' },
  { value: 'kr', label: 'Korea (KR)' },
  { value: 'latam', label: 'Latin America (LATAM)' },
  { value: 'mena', label: 'Middle East & North Africa (MENA)' },
  { value: 'tr', label: 'Turkey (TR)' },
] as const;

function validateProfile(data: ProfileData): ProfileErrors {
  const errors: ProfileErrors = {};

  const name = data.riotIdName.trim();
  if (!name) {
    errors.riotIdName = 'Riot ID name is required.';
  } else if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) {
    errors.riotIdName =
      'Riot ID name must be 3–16 characters and can only contain letters, numbers, and underscores.';
  }

  const tagline = data.riotIdTagline.trim();
  if (!tagline) {
    errors.riotIdTagline = 'Tagline is required.';
  } else if (!/^[A-Za-z0-9]{1,5}$/.test(tagline)) {
    errors.riotIdTagline =
      'Tagline must be 1–5 characters and can only contain letters and numbers.';
  }

  if (!data.region) {
    errors.region = 'Select your region.';
  }

  return errors;
}

function getRegionLabel(value: string): string {
  return REGIONS.find((r) => r.value === value)?.label ?? value;
}
export function ProfilePage() {
  const [form, setForm] = useState<ProfileData>({
    riotIdName: '',
    riotIdTagline: '',
    region: '',
  });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saved, setSaved] = useState<ProfileData | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const taglineRef = useRef<HTMLInputElement>(null);
  const regionRef = useRef<HTMLSelectElement>(null);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (hasAttempted) {
      const u = { ...form, [field]: value };
      setErrors((e) => ({ ...e, [field]: validateProfile(u)[field] }));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validateProfile(form);
    setErrors(errs);
    setHasAttempted(true);
    if (Object.keys(errs).length === 0) setSaved(form);
  };

  const inputClass = (hasError: boolean) =>
    [
      'w-full rounded-lg border bg-app px-3 py-2 text-sm text-ink placeholder:text-ink-muted',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
      hasError ? 'border-red-500/50' : 'border-line',
    ].join(' ');

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Player Profile</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Set up your VALORANT player profile. Enter your Riot ID and region so Aventas Companion
          can identify you.
        </p>
      </div>
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
        <UserIcon />
        <p className="text-xs leading-relaxed text-amber-200/80">
          Local prototype: this form only stores your details in memory for this session. It does
          not connect to, verify, or store any Riot account credentials.
        </p>
      </div>
      {saved && (
        <div className="rounded-lg border border-accent/30 bg-accent/[0.06] p-5">
          <div className="flex items-center gap-3">
            <UserIcon className="text-accent" />
            <h3 className="text-sm font-semibold text-accent">Profile saved</h3>
          </div>
          <dl className="mt-3 flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[11px] uppercase tracking-[0.05em] text-ink-muted">Riot ID</dt>
              <dd className="text-sm text-ink">
                {saved.riotIdName}#{saved.riotIdTagline}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[11px] uppercase tracking-[0.05em] text-ink-muted">Region</dt>
              <dd className="text-sm text-ink">{getRegionLabel(saved.region)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[11px] uppercase tracking-[0.05em] text-ink-muted">Status</dt>
              <dd className="text-sm text-ink">Local only — not verified</dd>
            </div>
          </dl>
          <p className="mt-3 text-[11px] text-ink-muted">
            Saved in memory only. Will be cleared on restart.
          </p>
        </div>
      )}
      <form
        noValidate
        onSubmit={handleSubmit}
        className="max-w-xl rounded-lg border border-line bg-panel p-5"
      >
        <div className="flex flex-col gap-5">
          <div>
            <label htmlFor="riot-id-name" className="block text-sm font-medium text-ink">
              Riot ID name
            </label>
            <p className="mt-1 text-[11px] text-ink-muted">
              3–16 characters. Letters, numbers, underscores.
            </p>
            <input
              ref={nameRef}
              id="riot-id-name"
              type="text"
              value={form.riotIdName}
              onChange={(e) => handleChange('riotIdName', e.target.value)}
              onBlur={() => setHasAttempted(true)}
              className={inputClass(!!errors.riotIdName)}
              placeholder="e.g., PhoenixMain"
              aria-invalid={errors.riotIdName ? 'true' : 'false'}
              aria-describedby={errors.riotIdName ? 'riot-id-name-error' : undefined}
            />
            {errors.riotIdName && (
              <p id="riot-id-name-error" role="alert" className="mt-1.5 text-xs text-red-400">
                {errors.riotIdName}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="riot-id-tagline" className="block text-sm font-medium text-ink">
              Riot ID tagline
            </label>
            <p className="mt-1 text-[11px] text-ink-muted">
              1–5 characters. Letters and numbers only.
            </p>
            <input
              ref={taglineRef}
              id="riot-id-tagline"
              type="text"
              value={form.riotIdTagline}
              onChange={(e) => handleChange('riotIdTagline', e.target.value)}
              onBlur={() => setHasAttempted(true)}
              className={inputClass(!!errors.riotIdTagline)}
              placeholder="e.g., NA1"
              maxLength={5}
              aria-invalid={errors.riotIdTagline ? 'true' : 'false'}
              aria-describedby={errors.riotIdTagline ? 'riot-id-tagline-error' : undefined}
            />
            {errors.riotIdTagline && (
              <p id="riot-id-tagline-error" role="alert" className="mt-1.5 text-xs text-red-400">
                {errors.riotIdTagline}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="region" className="block text-sm font-medium text-ink">
              Region
            </label>
            <select
              ref={regionRef}
              id="region"
              value={form.region}
              onChange={(e) => handleChange('region', e.target.value)}
              onBlur={() => setHasAttempted(true)}
              className={inputClass(!!errors.region)}
              aria-invalid={errors.region ? 'true' : 'false'}
              aria-describedby={errors.region ? 'region-error' : undefined}
            >
              <option value="">Select a region…</option>
              {REGIONS.map((region) => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
            {errors.region && (
              <p id="region-error" role="alert" className="mt-1.5 text-xs text-red-400">
                {errors.region}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="mt-2 self-start rounded-lg bg-accent/15 px-4 py-2 text-sm font-medium text-ink hover:bg-accent/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}
