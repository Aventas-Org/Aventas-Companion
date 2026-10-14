import type { ThemePalette, ThemeStyle } from '../services/themePresets';

interface ThemePreviewProps {
  palette: ThemePalette;
  style: ThemeStyle;
}

/**
 * Miniature dashboard drawn from a palette rather than from the live CSS
 * variables, so a preset can be previewed before it is applied.
 *
 * Colours come in as inline styles on purpose: Tailwind classes are resolved
 * against the *active* theme, which is exactly what this must avoid.
 */
export function ThemePreview({ palette, style }: ThemePreviewProps) {
  const shellShadow =
    style === '3d'
      ? '0 10px 20px -12px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
      : '0 6px 14px -12px rgba(0, 0, 0, 0.6)';
  const gloss =
    style === 'shine'
      ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0) 55%)'
      : undefined;

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: palette.app, backgroundImage: palette.background }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-[7%] flex gap-[3%] overflow-hidden rounded-[4px]"
        style={{
          backgroundColor: palette.panel,
          backgroundImage: gloss,
          boxShadow: shellShadow,
        }}
      >
        {/* Navigation rail. */}
        <div
          className="flex h-full w-[18%] flex-col gap-[7%] p-[6%]"
          style={{ borderRight: `1px solid ${palette.line}` }}
        >
          <div
            className="h-[5px] w-full rounded-full"
            style={{ backgroundColor: palette.accent }}
          />
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="h-[4px] rounded-full"
              style={{
                width: index % 2 === 0 ? '100%' : '70%',
                backgroundColor: palette.line,
              }}
            />
          ))}
        </div>

        {/* Content column with three stacked tiles. */}
        <div className="flex h-full flex-1 flex-col gap-[6%] p-[6%]">
          <div
            className="h-[6px] w-[42%] rounded-full"
            style={{ backgroundColor: palette.ink, opacity: 0.7 }}
          />
          <div className="flex flex-1 flex-col gap-[6%]">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="flex flex-1 items-center gap-[6%] rounded-[3px] px-[6%]"
                style={{ backgroundColor: palette.app, border: `1px solid ${palette.line}` }}
              >
                <div
                  className="h-[4px] rounded-full"
                  style={{
                    width: index === 1 ? '48%' : '62%',
                    backgroundColor: palette.inkMuted,
                    opacity: 0.55,
                  }}
                />
                <div
                  className="ml-auto h-[6px] w-[6px] shrink-0 rounded-full"
                  style={{
                    backgroundColor: index === 1 ? palette.accent : palette.line,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shine is a highlight *over* the surface, same as the real style variant. */}
      {style === 'shine' && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(150deg, rgb(255 255 255 / 0.16), transparent 55%)`,
          }}
        />
      )}
    </div>
  );
}
