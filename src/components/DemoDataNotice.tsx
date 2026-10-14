import { NotificationCard } from './NotificationCard';

/** Inline notice that the analysis views are showing placeholder match data. */
export function DemoDataNotice() {
  return (
    <NotificationCard
      tone="warning"
      title="Demo data — sample matches only"
      description="The match history shown here is placeholder data used to demonstrate the interface. It is not your real match history. Connect your Riot account to populate actual match data."
      icon={
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      }
    />
  );
}
